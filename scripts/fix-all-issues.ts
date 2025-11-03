#!/usr/bin/env tsx

/**
 * Comprehensive issue detection and fixing script
 * Runs tests, analyzes failures, and creates fix plan
 */

import { exec } from 'child_process'
import fs from 'fs/promises'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface TestFailure {
  test: string
  error: string
  file?: string
  line?: number
  category: 'route' | 'api' | 'component' | 'auth' | 'data' | 'ui'
}

async function runTests(): Promise<string> {
  console.log('Running Playwright tests...')
  try {
    const { stdout, stderr } = await execAsync('npx playwright test --reporter=json', {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB
    })
    return stdout + stderr
  } catch (error: any) {
    // Test failures return non-zero exit code, but we want the output
    return error.stdout + error.stderr
  }
}

function parseTestResults(jsonOutput: string): TestFailure[] {
  const failures: TestFailure[] = []
  
  try {
    const results = JSON.parse(jsonOutput)
    
    for (const suite of results.suites || []) {
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          if (test.results?.some((r: any) => r.status === 'failed')) {
            const failure = test.results.find((r: any) => r.status === 'failed')
            const error = failure?.error?.message || 'Unknown error'
            const testName = `${spec.title} > ${test.title}`
            
            // Categorize failure
            let category: TestFailure['category'] = 'ui' // Default to 'ui'
            if (error.includes('404') || error.includes('not found')) category = 'route'
            else if (error.includes('API') || error.includes('route')) category = 'api'
            else if (error.includes('component') || error.includes('render')) category = 'component'
            else if (error.includes('auth') || error.includes('login') || error.includes('unauthorized')) category = 'auth'
            else if (error.includes('database') || error.includes('query') || error.includes('prisma')) category = 'data'
            
            failures.push({
              test: testName,
              error,
              category,
            })
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to parse test results:', error)
  }
  
  return failures
}

function generateFixPlan(failures: TestFailure[]): string {
  const byCategory = failures.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = []
    acc[f.category].push(f)
    return acc
  }, {} as Record<string, TestFailure[]>)

  let plan = '# Fix Plan Generated from Test Failures\n\n'
  plan += `Total Failures: ${failures.length}\n\n`

  for (const [category, categoryFailures] of Object.entries(byCategory)) {
    plan += `## ${category.toUpperCase()} Issues (${categoryFailures.length})\n\n`
    
    for (const failure of categoryFailures) {
      plan += `### ${failure.test}\n`
      plan += `**Error**: ${failure.error}\n\n`
      plan += `**Fix**: [TO BE DETERMINED]\n\n`
    }
    
    plan += '\n'
  }

  return plan
}

async function main() {
  console.log('🔍 Starting comprehensive issue detection...\n')
  
  // Run tests
  const testOutput = await runTests()
  
  // Save raw output
  await fs.writeFile('test-results-raw.json', testOutput)
  
  // Parse failures
  const failures = parseTestResults(testOutput)
  
  console.log(`\n📊 Found ${failures.length} test failures\n`)
  
  // Generate fix plan
  const fixPlan = generateFixPlan(failures)
  await fs.writeFile('FIX_PLAN.md', fixPlan)
  
  console.log('✅ Fix plan saved to FIX_PLAN.md')
  console.log(`\n📝 Summary:`)
  
  const byCategory = failures.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  for (const [category, count] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${count}`)
  }
}

main().catch(console.error)

