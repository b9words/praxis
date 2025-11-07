/**
 * Seed script for automated email campaigns
 * 
 * Run with:
 *   npm run db:seed-emails
 *   or
 *   npx tsx scripts/seed-automated-emails.ts
 * 
 * This creates the default welcome sequence emails as specified in core-docs/1006-1.md
 * 
 * Note: This is the single source of truth for email campaign seeds.
 * The SQL seed file (supabase/seed.sql) does NOT include automated emails.
 */

import { prisma } from '@/lib/prisma/server'

const welcomeSequenceEmails = [
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    eventName: 'user_signed_up',
    subject: 'Welcome to Execemy',
    template: 'welcome',
    delayDays: 0,
    isActive: true,
    type: 'DRIP',
    name: 'Welcome Email (Day 0)',
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    eventName: 'user_signed_up',
    subject: 'Your First Clear Step',
    template: 'general',
    delayDays: 1,
    isActive: true,
    type: 'DRIP',
    name: 'First Clear Step (Day 1)',
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3',
    eventName: 'user_signed_up',
    subject: 'Discover Simulations',
    template: 'general',
    delayDays: 3,
    isActive: true,
    type: 'DRIP',
    name: 'Discover Simulations (Day 3)',
  },
]

async function seedAutomatedEmails() {
  console.log('Starting seed of automated email campaigns...')

  try {
    let created = 0
    let skipped = 0

    for (const email of welcomeSequenceEmails) {
      try {
        await prisma.automatedEmail.upsert({
          where: { id: email.id },
          update: {
            eventName: email.eventName,
            subject: email.subject,
            template: email.template,
            delayDays: email.delayDays,
            isActive: email.isActive,
            type: email.type,
            name: email.name,
          },
          create: email,
        })
        created++
        console.log(`✓ Created/Updated: ${email.name}`)
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Unique constraint violation - already exists
          skipped++
          console.log(`⊘ Skipped (already exists): ${email.name}`)
        } else {
          throw error
        }
      }
    }

    console.log(`\n✅ Seed completed!`)
    console.log(`   Created/Updated: ${created}`)
    console.log(`   Skipped: ${skipped}`)
    console.log(`   Total campaigns: ${welcomeSequenceEmails.length}`)
  } catch (error) {
    console.error('❌ Error during seed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedAutomatedEmails()

