import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

// Хешування паролю
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Перевірка паролю
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Створення JWT токену
export async function createToken(payload: { userId: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Токен дійсний 7 днів
    .sign(SECRET_KEY)
}

// Перевірка JWT токену
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload as { userId: string; email: string }
  } catch (error) {
    return null
  }
}

// Отримання поточного користувача з cookie
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')

  if (!token) {
    return null
  }

  return verifyToken(token.value)
}

// Встановлення auth cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 днів
    path: '/',
  })
}

// Видалення auth cookie
export async function deleteAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}
