import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

async function proxyHandler(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Публічні маршрути (логін)
  if (pathname === '/login') {
    // Якщо користувач авторизований, редирект на головну
    const token = request.cookies.get('auth-token')
    if (token) {
      try {
        await jwtVerify(token.value, SECRET_KEY)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } catch {
        // Токен невалідний, дозволяємо доступ до login
      }
    }
    return NextResponse.next()
  }

  // Захищені маршрути (все крім /login)
  const token = request.cookies.get('auth-token')

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Перевіряємо токен
    await jwtVerify(token.value, SECRET_KEY)
    return NextResponse.next()
  } catch {
    // Токен невалідний, редирект на логін
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    return response
  }
}

// Export both named and default
export { proxyHandler as proxy }
export default proxyHandler

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg (favicon files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon).*)',
  ],
}
