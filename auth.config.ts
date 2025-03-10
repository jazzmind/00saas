import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import LinkedIn from "next-auth/providers/linkedin"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import type { Provider } from "next-auth/providers"

const providers = [
    LinkedIn({
        clientId: process.env.LINKEDIN_ID!,
        clientSecret: process.env.LINKEDIN_SECRET!,
    }),
    Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Apple({
        clientId: process.env.APPLE_ID!,
        clientSecret: process.env.APPLE_SECRET!,
    }),
    MicrosoftEntraID({
        clientId: process.env.AZURE_AD_CLIENT_ID!,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    }),
] as Provider[]

export const authConfig = {
    pages: {
        signIn: "/signin",
    },
    trustHost: true,
    cookies: {
        sessionToken: {
            name: `__Secure-next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: true,
                domain: process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : 'localhost'
            }
        }
    },
    providers,
} satisfies NextAuthConfig


export const providerMap = authConfig.providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider()
      return { id: providerData.id, name: providerData.name }
    } else {
      return { id: provider.id, name: provider.name }
    }
  });

export default authConfig