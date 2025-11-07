/**
 * Migration script to set default type values for existing automated emails
 * Run with: npx tsx scripts/migrate-existing-emails.ts
 */

import { prisma } from '@/lib/prisma/server'

async function migrateExistingEmails() {
  console.log('Starting migration of existing automated emails...')

  try {
    // Use raw SQL to update records where type is NULL or empty
    // This handles the case where the field might not have been set during migration
    const result = await prisma.$executeRaw`
      UPDATE automated_emails 
      SET type = 'DRIP' 
      WHERE type IS NULL OR type = ''
    `

    console.log(`Updated ${result} existing automated email records with type='DRIP'`)

    // Verify the update
    const allEmails = await prisma.automatedEmail.findMany()
    console.log(`Total automated emails: ${allEmails.length}`)
    
    const emailsWithoutType = allEmails.filter(e => !e.type || e.type === '')
    if (emailsWithoutType.length > 0) {
      console.warn(`Warning: ${emailsWithoutType.length} emails still don't have a type set`)
    } else {
      console.log('All emails now have a type set!')
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Error during migration:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

migrateExistingEmails()

