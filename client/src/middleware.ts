import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth-token")
  const userDataCookie = request.cookies.get("user-data")

  const isAuthPage = request.nextUrl.pathname.startsWith("/login")
  const isChangePasswordPage = request.nextUrl.pathname.startsWith("/change-temporal-password")
  const isProtectedPage =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname === "/"

  const isAuthenticated = authToken && userDataCookie

  if (!isAuthenticated && (isProtectedPage || isChangePasswordPage)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuthenticated && userDataCookie) {
    try {
      const userData = JSON.parse(userDataCookie.value)
      const isFirstTime = userData.isFirstTime === true
      const userRole = userData.role

      if (isFirstTime) {
        if (isProtectedPage || isAuthPage) {
          return NextResponse.redirect(new URL("/change-temporal-password", request.url))
        }
      } else {
        if (isChangePasswordPage) {
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
        
        if (isAuthPage) {
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }

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
      }
    } catch (error) {
      console.error("Error parsing user data:", error)
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("auth-token")
      response.cookies.delete("user-data")
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}