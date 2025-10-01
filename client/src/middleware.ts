import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth-token")
  const userDataCookie = request.cookies.get("user-data")

  const isAuthPage = request.nextUrl.pathname.startsWith("/login")
  const isProtectedPage =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname === "/"

  const isAuthenticated = authToken && userDataCookie

  // Redirect to login if accessing protected page without session
  if (isProtectedPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect to dashboard if accessing auth pages with valid session
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (isAuthenticated && userDataCookie) {
    try {
      const userData = JSON.parse(userDataCookie.value)
      const userRole = userData.role

      const adminOnlyRoutes = [
        "/dashboard/voters/register",
        "/dashboard/elections/create",
      ]

      const isAdminOnlyRoute = adminOnlyRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
      )

      if (isAdminOnlyRoute && userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    } catch (error) {
      console.error("Error parsing user data:", error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}