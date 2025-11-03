#!/usr/bin/env tsx

import { exec } from 'child_process'
import fs from 'fs/promises'
import { promisify } from 'util'
import { GeminiTestAnalyzer } from './analyze-test-results'

const execAsync = promisify(exec)

/**
 * Test-Fix Cycle Implementation
 * Runs E2E tests, stops at first error, fixes issues, and repeats
 */

interface TestCycleConfig {
  maxIterations: number
  stopOnFirstError: boolean
  autoFix: boolean
  generateReport: boolean
  verbose: boolean
}

class TestFixCycle {
  private config: TestCycleConfig
  private iteration = 0
  private totalErrors = 0
  private fixedErrors = 0
  private startTime = Date.now()

  constructor(config: Partial<TestCycleConfig> = {}) {
    this.config = {
      maxIterations: 10,
      stopOnFirstError: true,
      autoFix: false,
      generateReport: true,
      verbose: true,
      ...config
    }
  }

  /**
   * Run the complete test-fix cycle
   */
  async run(): Promise<void> {
    console.log('🚀 Starting Test-Fix Cycle')
    console.log(`📋 Configuration:`, this.config)
    console.log('='.repeat(60))

    try {
      // Initial setup
      await this.setupTestEnvironment()

      // Run test-fix iterations
      while (this.iteration < this.config.maxIterations) {
        this.iteration++
        console.log(`\n🔄 Iteration ${this.iteration}/${this.config.maxIterations}`)
        console.log('-'.repeat(40))

        const success = await this.runIteration()
        
        if (success) {
          console.log('✅ All tests passed!')
          break
        }

        if (this.config.stopOnFirstError) {
          console.log('🛑 Stopping at first error as configured')
          break
        }
      }

      // Generate final report
      if (this.config.generateReport) {
        await this.generateFinalReport()
      }

      // Summary
      this.printSummary()

    } catch (error) {
      console.error('💥 Test-Fix Cycle failed:', error)
      process.exit(1)
    }
  }

  /**
   * Setup test environment
   */
  private async setupTestEnvironment(): Promise<void> {
    console.log('🔧 Setting up test environment...')
    
    try {
      // Reset database
      console.log('📊 Resetting database...')
      await execAsync('npm run db:reset')
      
      // Seed test data
      console.log('🌱 Seeding test data...')
      await execAsync('npm run db:seed:test')
      
      console.log('✅ Test environment ready')
    } catch (error) {
      throw new Error(`Failed to setup test environment: ${error}`)
    }
  }

  /**
   * Run a single test iteration
   */
  private async runIteration(): Promise<boolean> {
    try {
      // Run E2E tests
      console.log('🧪 Running E2E tests...')
      const { stdout, stderr } = await execAsync('npm run test:e2e', {
        cwd: process.cwd(),
        timeout: 300000 // 5 minutes
      })

      if (stderr && !stderr.includes('warning')) {
        console.error('❌ Test execution errors:', stderr)
      }

      // Check if tests passed
      const testResults = await this.parseTestResults()
      const hasFailures = testResults.summary.failed > 0

      if (hasFailures) {
        console.log(`❌ ${testResults.summary.failed} test(s) failed`)
        this.totalErrors += testResults.summary.failed
        
        if (this.config.autoFix) {
          await this.attemptAutoFix(testResults)
        } else {
          console.log('🔧 Manual fixes required - stopping cycle')
          return false
        }
      } else {
        console.log('✅ All tests passed!')
        return true
      }

      return false

    } catch (error) {
      console.error('💥 Test execution failed:', error)
      this.totalErrors++
      return false
    }
  }

  /**
   * Parse test results from Playwright output
   */
  private async parseTestResults(): Promise<any> {
    try {
      const resultsPath = 'test-results/results.json'
      const data = await fs.readFile(resultsPath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.warn('⚠️ Could not parse test results:', error)
      return { summary: { failed: 1, passed: 0, total: 1 } }
    }
  }

  /**
   * Attempt to automatically fix common issues
   */
  private async attemptAutoFix(testResults: any): Promise<void> {
    console.log('🔧 Attempting automatic fixes...')
    
    // This is a placeholder for automatic fixes
    // In a real implementation, you would analyze the specific errors
    // and apply appropriate fixes
    
    console.log('⚠️ Auto-fix not implemented - manual intervention required')
    this.fixedErrors = 0
  }

  /**
   * Generate final report using Gemini analysis
   */
  private async generateFinalReport(): Promise<void> {
    console.log('📊 Generating final report...')
    
    try {
      const analyzer = new GeminiTestAnalyzer()
      const report = await analyzer.analyzeTestResults('test-results/results.json')
      
      const reportPath = `test-results/cycle-report-${Date.now()}.md`
      await analyzer.saveReport(report, reportPath)
      
      console.log(`📄 Final report saved to: ${reportPath}`)
    } catch (error) {
      console.warn('⚠️ Failed to generate Gemini report:', error)
    }
  }

  /**
   * Print cycle summary
   */
  private printSummary(): void {
    const duration = Date.now() - this.startTime
    const durationMinutes = Math.round(duration / 60000)
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST-FIX CYCLE SUMMARY')
    console.log('='.repeat(60))
    console.log(`🔄 Iterations completed: ${this.iteration}`)
    console.log(`❌ Total errors found: ${this.totalErrors}`)
    console.log(`🔧 Errors fixed: ${this.fixedErrors}`)
    console.log(`⏱️ Total duration: ${durationMinutes} minutes`)
    console.log(`📈 Success rate: ${this.fixedErrors}/${this.totalErrors} (${Math.round((this.fixedErrors/this.totalErrors)*100)}%)`)
    
    if (this.totalErrors === 0) {
      console.log('🎉 All tests passed! Platform is ready for production.')
    } else if (this.fixedErrors === this.totalErrors) {
      console.log('✅ All errors were fixed! Platform is ready for production.')
    } else {
      console.log('⚠️ Some errors remain unfixed. Manual intervention required.')
    }
    
    console.log('='.repeat(60))
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2)
  const config: Partial<TestCycleConfig> = {}

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--max-iterations':
        config.maxIterations = parseInt(args[++i])
        break
      case '--continue-on-error':
        config.stopOnFirstError = false
        break
      case '--auto-fix':
        config.autoFix = true
        break
      case '--no-report':
        config.generateReport = false
        break
      case '--verbose':
        config.verbose = true
        break
      case '--help':
        printHelp()
        process.exit(0)
        break
    }
  }

  const cycle = new TestFixCycle(config)
  await cycle.run()
}

/**
 * Print help information
 */
function printHelp(): void {
  console.log(`
Test-Fix Cycle Runner

Usage: tsx scripts/test-fix-cycle.ts [options]

Options:
  --max-iterations <number>  Maximum number of iterations (default: 10)
  --continue-on-error        Continue running tests even after errors
  --auto-fix                 Attempt to automatically fix common issues
  --no-report                Skip generating Gemini analysis report
  --verbose                  Enable verbose output
  --help                     Show this help message

Examples:
  tsx scripts/test-fix-cycle.ts
  tsx scripts/test-fix-cycle.ts --max-iterations 5 --continue-on-error
  tsx scripts/test-fix-cycle.ts --auto-fix --verbose
`)
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { TestFixCycle }
