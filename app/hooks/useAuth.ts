import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuth({ required = true } = {}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (required && status === "unauthenticated") {
      router.push(`/login?callbackUrl=${window.location.href}`)
    }
  }, [required, status, router])

  return { session, status }
} 