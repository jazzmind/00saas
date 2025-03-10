import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function getServerSession() {
  const session = await auth()
  if (!session) {
    return new NextResponse(
      JSON.stringify({
        error: "Unauthorized"
      }),
      {
        status: 401,
        headers: { "content-type": "application/json" }
      }
    )
  }
  return session
} 