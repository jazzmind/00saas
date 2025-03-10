import NextAuth from "next-auth"
import authConfig from "./auth.config"
import Nodemailer from "next-auth/providers/nodemailer"
import Passkey from "next-auth/providers/passkey"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { getUser } from "@/lib/database/userDatabase"
import type { Provider } from "next-auth/providers"

// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string
//       email?: string | null
//       name?: string | null
//       image?: string | null
//     }
//   }
// }

const neon = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(neon);
const prisma = new PrismaClient({ adapter });
const providers = [
  ...authConfig.providers,
  Passkey,
  Nodemailer({
      name: "Email",
      server: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 465,
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          }
      },
      from: process.env.EMAIL_FROM,
  })
] as Provider[];

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    experimental: { enableWebAuthn: true },
    session: { strategy: "jwt" },
    pages: {
      signIn: "/login",
    },
    providers,
    callbacks: {
        async jwt({ token, user }) {
            if (user && user.id) {
                token.id = user.id;
                token.email = user.email || null;
                token.name = user.name || null;
                token.image = user.image || null;
                const userProfile = await getUser(user.id);
                console.log('userProfile', userProfile);
                token.userProfile = userProfile || null;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string | null;
                session.user.image = token.image as string | null;
            }
            return session;
        },
        async signIn({ user, account }) {
            console.log('signIn callback', user, account);
            // For passkey authentication
            if (account?.provider === "passkey") {
                return true;
            }

            if (!user.email || !user.id) {
                return false;
            }

            // For all other providers, check if user exists and has proper role
            const userData = await getUser(user.id);
            console.log('userData', userData);
            if (!userData) {
                return false;
            }
            return true;
        }
    }
})