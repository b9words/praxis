/**
 * AutomatedEmail repository
 * All automated email database operations go through here
 */

import { dbCall, assertFound } from './utils'

export interface CreateAutomatedEmailData {
  eventName: string
  subject: string
  template: string
  delayDays?: number
  isActive?: boolean
  name?: string
  type?: string
  summary?: string
  publishedAt?: Date
}

export interface UpdateAutomatedEmailData {
  eventName?: string
  subject?: string
  template?: string
  delayDays?: number
  isActive?: boolean
  name?: string
  type?: string
  summary?: string
  publishedAt?: Date
}

/**
 * List all automated emails
 */
export async function listAutomatedEmails() {
  return dbCall(async (prisma) => {
    return prisma.automatedEmail.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
  })
}

/**
 * Get automated email by ID
 */
export async function getAutomatedEmailById(id: string) {
  return dbCall(async (prisma) => {
    return prisma.automatedEmail.findUnique({
      where: { id },
    })
  })
}

/**
 * Get automated email by event name
 */
export async function getAutomatedEmailByEventName(eventName: string) {
  return dbCall(async (prisma) => {
    return prisma.automatedEmail.findUnique({
      where: { eventName },
    })
  })
}

/**
 * Get active automated emails for an event
 */
export async function getActiveAutomatedEmailsForEvent(eventName: string) {
  return dbCall(async (prisma) => {
    return prisma.automatedEmail.findMany({
      where: {
        eventName,
        isActive: true,
      },
      orderBy: {
        delayDays: 'asc',
      },
    })
  })
}

/**
 * Create a new automated email
 */
export async function createAutomatedEmail(data: CreateAutomatedEmailData) {
  return dbCall(async (prisma) => {
    return prisma.automatedEmail.create({
      data: {
        eventName: data.eventName,
        subject: data.subject,
        template: data.template,
        delayDays: data.delayDays ?? 0,
        isActive: data.isActive ?? true,
        name: data.name,
        type: data.type ?? 'DRIP',
        summary: data.summary,
        publishedAt: data.publishedAt,
      },
    })
  })
}

/**
 * Update an automated email
 */
export async function updateAutomatedEmail(id: string, data: UpdateAutomatedEmailData) {
  const existing = await getAutomatedEmailById(id)
  assertFound(existing, 'AutomatedEmail')

  return dbCall(async (prisma) => {
    return prisma.automatedEmail.update({
      where: { id },
      data: {
        ...(data.eventName !== undefined && { eventName: data.eventName }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.template !== undefined && { template: data.template }),
        ...(data.delayDays !== undefined && { delayDays: data.delayDays }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.publishedAt !== undefined && { publishedAt: data.publishedAt }),
      },
    })
  })
}

/**
 * Delete an automated email
 */
export async function deleteAutomatedEmail(id: string) {
  const existing = await getAutomatedEmailById(id)
  assertFound(existing, 'AutomatedEmail')

  return dbCall(async (prisma) => {
    return prisma.automatedEmail.delete({
      where: { id },
    })
  })
}

/**
 * Get published newsletters (for public archive)
 */
export async function getPublishedNewsletters() {
  return dbCall(async (prisma) => {
    return prisma.automatedEmail.findMany({
      where: {
        type: 'NEWSLETTER',
        publishedAt: { not: null },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    })
  })
}

