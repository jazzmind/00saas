import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { Adapter } from "next-auth/adapters"

export type DatabaseType = 'prisma' | 'firebase'

// This code only runs on the server
export function getAuthAdapter(): Adapter {
  'use server' // Mark as server-only
 
  return PrismaAdapter(prisma)
} 