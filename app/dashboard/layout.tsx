import React from "react"
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardNav } from '@/components/dashboard/nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} />
      <main className="container mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  )
}
