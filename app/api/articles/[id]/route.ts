
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { getCachedArticle } from '@/lib/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Use cached article helper (1 hour revalidate)
    const article = await getCachedArticle(id)

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json({ article })
  } catch (error) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error fetching article:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()

    // Check if article exists before updating
    const existing = await prisma.article.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...body,
        updatedBy: user.id,
      },
      include: {
        competency: true,
      },
    })

    return NextResponse.json({ article })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    // Handle P2025 (record not found) gracefully
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error updating article:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()

    // Check if article exists before updating
    const existing = await prisma.article.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...body,
        updatedBy: user.id,
      },
      include: {
        competency: true,
      },
    })

    return NextResponse.json({ article })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    // Handle P2025 (record not found) gracefully
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error updating article:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params

    // Check if article exists before deleting
    const existing = await prisma.article.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    await prisma.article.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    // Handle P2025 (record not found) gracefully
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error deleting article:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

