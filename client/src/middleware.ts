import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth-token")
  const userData = request.cookies.get("user-data")
  
  const isAuthPage = request.nextUrl.pathname.startsWith("/login")
  const isProtectedPage = request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname === "/"

  const isAuthenticated = authToken && userData


  // Redirect to login if accessing protected page without session
  if (isProtectedPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect to dashboard if accessing auth pages with valid session
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}