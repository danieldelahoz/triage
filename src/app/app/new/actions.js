'use server'

import { db } from '@/db'
import { tickets } from '@/db/schema'
import { redirect } from 'next/navigation'

export async function createTicket(formData) {
  const title = formData.get('title')?.toString().trim()
  const description = formData.get('description')?.toString().trim()
  const customerName = formData.get('customerName')?.toString().trim() || null
  const productArea = formData.get('productArea')?.toString().trim() || null
  const priority = formData.get('priority')?.toString() || null

  if (!title || !description) {
    throw new Error('Title and description are required')
  }

  if (title.length > 500) {
    throw new Error('Title is too long (max 500 characters)')
  }

  if (description.length > 50000) {
    throw new Error('Description is too long (max 50,000 characters)')
  }

  const [inserted] = await db
    .insert(tickets)
    .values({
      title,
      description,
      customerName,
      productArea,
      priority: priority === 'none' ? null : priority,
      status: 'pending',
    })
    .returning({ id: tickets.id })

  redirect(`/app/tickets/${inserted.id}`)
}