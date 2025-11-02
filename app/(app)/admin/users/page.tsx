import { prisma } from '@/lib/prisma/server'
import { redirect } from 'next/navigation'
import UsersManagement from '@/components/admin/UsersManagement'
import { cache, CacheTags } from '@/lib/cache'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>
}) {

  const params = await searchParams
  const search = params.search || ''
  const role = params.role || '__all__'
  const page = parseInt(params.page || '1')
  const perPage = 20

  // Cache user list queries with search/role filters in key (2 minutes revalidate)
  const getCachedUsers = cache(
    async () => {
      const where: any = {}
      if (search) {
        where.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
        ]
      }
      if (role && role !== '__all__') {
        where.role = role
      }

      let users: any[] = []
      let total = 0

      try {
        [users, total] = await Promise.all([
          prisma.profile.findMany({
            where,
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
              bio: true,
              isPublic: true,
              role: true,
              createdAt: true,
              updatedAt: true,
              // Explicitly exclude emailNotificationsEnabled to avoid P2022
              residency: {
                select: {
                  currentResidency: true,
                },
              },
              simulations: {
                select: {
                  id: true,
                  status: true,
                },
              },
              applications: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            skip: (page - 1) * perPage,
            take: perPage,
          }),
          prisma.profile.count({ where }),
        ])
      } catch (error: any) {
        // Handle missing columns (P2022) or missing tables (P2021)
        if (error?.code === 'P2022' || error?.code === 'P2021' || error?.message?.includes('does not exist')) {
          try {
            // Fallback: try without relations that might reference missing tables
            // Remove applications (user_applications table might not exist)
            // Keep simulations as it's a core table
            [users, total] = await Promise.all([
              prisma.profile.findMany({
                where,
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatarUrl: true,
                  bio: true,
                  isPublic: true,
                  role: true,
                  createdAt: true,
                  updatedAt: true,
                  simulations: {
                    select: {
                      id: true,
                      status: true,
                    },
                  },
                  // Exclude applications and residency relations as tables might not exist
                },
                orderBy: {
                  createdAt: 'desc',
                },
                skip: (page - 1) * perPage,
                take: perPage,
              }),
              prisma.profile.count({ where }),
            ])
          } catch (fallbackError: any) {
            // Final fallback: minimal select without any relations
            if (fallbackError?.code === 'P2022' || fallbackError?.code === 'P2021' || fallbackError?.message?.includes('does not exist')) {
              try {
                [users, total] = await Promise.all([
                  prisma.profile.findMany({
                    where,
                    select: {
                      id: true,
                      username: true,
                      fullName: true,
                      avatarUrl: true,
                      bio: true,
                      isPublic: true,
                      role: true,
                      createdAt: true,
                      updatedAt: true,
                      // No relations - only Profile fields
                    },
                    orderBy: {
                      createdAt: 'desc',
                    },
                    skip: (page - 1) * perPage,
                    take: perPage,
                  }),
                  prisma.profile.count({ where }),
                ])
              } catch (finalError) {
                console.error('Error fetching users (final fallback):', finalError)
                // Return empty results on error
                users = []
                total = 0
              }
            } else {
              console.error('Error fetching users (fallback):', fallbackError)
              // Return empty results on error
              users = []
              total = 0
            }
          }
        } else {
          console.error('Error fetching users:', error)
          throw error
        }
      }

      return { users, total }
    },
    ['admin', 'users', search, role, page.toString()],
    {
      tags: [CacheTags.ADMIN, CacheTags.USERS],
      revalidate: 120, // 2 minutes
    }
  )
  
  const { users, total } = await getCachedUsers()

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <UsersManagement
        initialUsers={users}
        totalUsers={total}
        currentPage={page}
        perPage={perPage}
        initialSearch={search}
        initialRole={role}
      />
    </div>
  )
}

