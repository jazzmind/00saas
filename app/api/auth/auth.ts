import NextAuth from "next-auth"
import Email from "next-auth/providers/email"
import { getAuthAdapter } from "@/lib/auth/adapter"
import type { Role } from "@/lib/types"

// Define session and JWT types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      organizationId?: string
        role: Role
    }
  }
  
  interface JWT {
    userId: string
    organizationId?: string
    role: Role
  }
}

export const config = {
  adapter: getAuthAdapter(),
  session: { strategy: "jwt" as const },
  pages: {
    signIn: '/login',
    verifyRequest: '/verify',
    newUser: '/passkey'
  },
  providers: [
    Email({
      from: process.env.EMAIL_FROM,
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.userId = user.id
        token.role = user.role
        token.organizationId = user.organizationId
      }

      if (trigger === "update" && session?.organizationId) {
        token.organizationId = session.organizationId
      }

      return token
    },
    async session({ session, token }: any) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.userId,
          organizationId: token.organizationId,
          role: token.role,
        },
      }
    }
  }
}

export const { auth, handlers } = NextAuth(config) 