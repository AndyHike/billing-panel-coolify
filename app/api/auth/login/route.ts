import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email та пароль обов\'язкові' },
        { status: 400 }
      )
    }

    // Шукаємо користувача в БД
    const result = await query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Невірний email або пароль' },
        { status: 401 }
      )
    }

    const user = result.rows[0]

    // Перевіряємо пароль
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Невірний email або пароль' },
        { status: 401 }
      )
    }

    // Створюємо токен
    const token = await createToken({
      userId: user.id,
      email: user.email,
    })

    // Встановлюємо cookie
    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    )
  }
}
