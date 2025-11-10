'use server'

import { prisma } from '@/lib/prisma/server'
import { requireRole } from '@/lib/auth/authorize'
import { getDomainById, getModuleById } from '@/lib/curriculum-data'
import { revalidatePath } from 'next/cache'

export interface BriefingScheduleInput {
  weekOf: string // ISO date string (YYYY-MM-DD)
  domainId: string
  moduleId: string
  caseId: string
}

export async function createBriefingSchedule(data: BriefingScheduleInput) {
  await requireRole('admin')

  // Validate domain and module exist
  const domain = getDomainById(data.domainId)
  if (!domain) {
    throw new Error(`Domain ${data.domainId} not found`)
  }

  const module = getModuleById(data.domainId, data.moduleId)
  if (!module) {
    throw new Error(`Module ${data.moduleId} not found in domain ${data.domainId}`)
  }

  // Validate case exists
  const caseExists = await prisma.case.findUnique({
    where: { id: data.caseId },
    select: { id: true },
  })
  if (!caseExists) {
    throw new Error(`Case ${data.caseId} not found`)
  }

  // Check for duplicate weekOf
  const existing = await prisma.briefingSchedule.findUnique({
    where: { weekOf: new Date(data.weekOf) },
  })
  if (existing) {
    throw new Error(`Schedule already exists for week of ${data.weekOf}`)
  }

  const result = await prisma.briefingSchedule.create({
    data: {
      weekOf: new Date(data.weekOf),
      domainId: data.domainId,
      moduleId: data.moduleId,
      caseId: data.caseId,
    },
  })

  revalidatePath('/admin/briefing')
  revalidatePath('/briefing')
  return { success: true, id: result.id }
}

export async function updateBriefingSchedule(id: string, data: BriefingScheduleInput) {
  await requireRole('admin')

  // Validate domain and module exist
  const domain = getDomainById(data.domainId)
  if (!domain) {
    throw new Error(`Domain ${data.domainId} not found`)
  }

  const module = getModuleById(data.domainId, data.moduleId)
  if (!module) {
    throw new Error(`Module ${data.moduleId} not found in domain ${data.domainId}`)
  }

  // Validate case exists
  const caseExists = await prisma.case.findUnique({
    where: { id: data.caseId },
    select: { id: true },
  })
  if (!caseExists) {
    throw new Error(`Case ${data.caseId} not found`)
  }

  // Check for duplicate weekOf (excluding current record)
  const existing = await prisma.briefingSchedule.findUnique({
    where: { weekOf: new Date(data.weekOf) },
  })
  if (existing && existing.id !== id) {
    throw new Error(`Schedule already exists for week of ${data.weekOf}`)
  }

  const result = await prisma.briefingSchedule.update({
    where: { id },
    data: {
      weekOf: new Date(data.weekOf),
      domainId: data.domainId,
      moduleId: data.moduleId,
      caseId: data.caseId,
    },
  })

  revalidatePath('/admin/briefing')
  revalidatePath('/briefing')
  return { success: true, id: result.id }
}

export async function deleteBriefingSchedule(id: string) {
  await requireRole('admin')

  await prisma.briefingSchedule.delete({
    where: { id },
  })

  revalidatePath('/admin/briefing')
  revalidatePath('/briefing')
  return { success: true }
}






