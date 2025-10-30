import { completeCurriculumData } from '../lib/curriculum-data'
import { prisma } from '../lib/prisma/server'

/**
 * Seed competencies table with the full 10-domain CEO curriculum structure
 * This creates domain, competency, and micro-skill level entries based on the curriculum data
 */

interface CompetencyToInsert {
  name: string
  description: string | null
  parentId: string | null
  level: 'domain' | 'competency' | 'micro_skill'
  residencyYear: number | null
  displayOrder: number
}

async function seedCompetencies() {
  console.log('🌱 Seeding competencies from curriculum structure...\n')

  try {
    // Clear existing competencies (optional - comment out if you want to preserve existing data)
    // await prisma.competency.deleteMany({})

    const competenciesToInsert: CompetencyToInsert[] = []
    const domainIdMap = new Map<string, string>() // Maps domain.id -> database competency ID

    // First pass: Create domains
    let domainOrder = 0
    for (const domain of completeCurriculumData) {
      domainOrder++
      
      // Check if domain already exists
      let domainCompetency = await prisma.competency.findFirst({
        where: {
          name: domain.title,
          level: 'domain',
        },
      })

      if (!domainCompetency) {
        domainCompetency = await prisma.competency.create({
          data: {
            name: domain.title,
            description: domain.philosophy || null,
            parentId: null,
            level: 'domain',
            residencyYear: null, // Domains span multiple years
            displayOrder: domainOrder,
          },
        })
        console.log(`✅ Created domain: ${domain.title}`)
      } else {
        console.log(`⏭️  Domain already exists: ${domain.title}`)
      }

      domainIdMap.set(domain.id, domainCompetency.id)

      // Second pass: Create competencies (modules) under each domain
      let moduleOrder = 0
      for (const module of domain.modules) {
        moduleOrder++

        // Check if module (competency) already exists
        let moduleCompetency = await prisma.competency.findFirst({
          where: {
            name: module.title,
            parentId: domainCompetency.id,
            level: 'competency',
          },
        })

        if (!moduleCompetency) {
          moduleCompetency = await prisma.competency.create({
            data: {
              name: module.title,
              description: module.description || null,
              parentId: domainCompetency.id,
              level: 'competency',
              residencyYear: null, // Modules can span multiple years
              displayOrder: moduleOrder,
            },
          })
          console.log(`  ✅ Created competency: ${module.title}`)
        } else {
          console.log(`  ⏭️  Competency already exists: ${module.title}`)
        }

        // Third pass: Create micro-skills (lessons) under each module
        let lessonOrder = 0
        for (const lesson of module.lessons) {
          lessonOrder++

          // Check if lesson (micro-skill) already exists
          const existingLesson = await prisma.competency.findFirst({
            where: {
              name: lesson.title,
              parentId: moduleCompetency.id,
              level: 'micro_skill',
            },
          })

          if (!existingLesson) {
            await prisma.competency.create({
              data: {
                name: lesson.title,
                description: lesson.description || null,
                parentId: moduleCompetency.id,
                level: 'micro_skill',
                residencyYear: null, // Lessons can span multiple years
                displayOrder: lessonOrder,
              },
            })
            console.log(`    ✅ Created micro-skill: ${lesson.title}`)
          } else {
            console.log(`    ⏭️  Micro-skill already exists: ${lesson.title}`)
          }
        }
      }
    }

    // Get statistics
    const stats = await prisma.competency.groupBy({
      by: ['level'],
      _count: {
        id: true,
      },
    })

    const domainCount = stats.find((s) => s.level === 'domain')?._count.id || 0
    const competencyCount = stats.find((s) => s.level === 'competency')?._count.id || 0
    const microSkillCount = stats.find((s) => s.level === 'micro_skill')?._count.id || 0

    console.log('\n📊 Competency Seeding Summary:')
    console.log(`   Domains: ${domainCount}`)
    console.log(`   Competencies: ${competencyCount}`)
    console.log(`   Micro-skills: ${microSkillCount}`)
    console.log(`   Total: ${domainCount + competencyCount + microSkillCount}`)
    console.log('\n✅ Competency seeding complete!\n')
  } catch (error) {
    console.error('❌ Error seeding competencies:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  seedCompetencies()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedCompetencies }

