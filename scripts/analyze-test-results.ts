import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs/promises'

/**
 * Gemini 2.5 Pro Test Analysis Tool
 * Analyzes Playwright test results and provides comprehensive gap analysis
 */

interface TestResult {
  title: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: string
  steps?: Array<{
    title: string
    status: 'passed' | 'failed' | 'skipped'
    duration: number
    error?: string
  }>
}

interface TestResults {
  suites: Array<{
    title: string
    specs: TestResult[]
  }>
  summary: {
    total: number
    passed: number
    failed: number
    skipped: number
    duration: number
  }
}

class GeminiTestAnalyzer {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is required')
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
  }

  /**
   * Analyze test results and generate comprehensive report
   */
  async analyzeTestResults(testResultsPath: string): Promise<string> {
    console.log('🔍 Reading test results...')
    const testResults = await this.loadTestResults(testResultsPath)
    
    console.log('🤖 Analyzing with Gemini 2.5 Pro...')
    const analysis = await this.generateAnalysis(testResults)
    
    console.log('📝 Generating report...')
    const report = await this.generateReport(testResults, analysis)
    
    return report
  }

  /**
   * Load test results from JSON file
   */
  private async loadTestResults(filePath: string): Promise<TestResults> {
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      throw new Error(`Failed to load test results: ${error}`)
    }
  }

  /**
   * Generate analysis using Gemini 2.5 Pro
   */
  private async generateAnalysis(testResults: TestResults): Promise<any> {
    const prompt = this.buildAnalysisPrompt(testResults)
    
    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return JSON.parse(response.text())
    } catch (error) {
      console.error('Gemini analysis failed:', error)
      return { error: 'Analysis failed', details: error.message }
    }
  }

  /**
   * Build comprehensive analysis prompt for Gemini
   */
  private buildAnalysisPrompt(testResults: TestResults): string {
    return `
You are an expert QA engineer and product analyst. Analyze the following Playwright E2E test results for a business education platform called "Execemy Platform" and provide a comprehensive analysis.

## Application Context
Execemy Platform is a business education platform with these key features:
- User authentication and onboarding
- Curriculum library with articles and lessons
- Case study simulations with AI interactions
- Debrief system with performance analysis
- Community forum for discussions
- User profiles with competency radar charts
- Admin panel for content management

## Test Results
${JSON.stringify(testResults, null, 2)}

## Analysis Requirements
Please provide a JSON response with the following structure:

{
  "overallAssessment": {
    "testCoverage": "percentage and description",
    "criticalIssues": ["list of blocking issues"],
    "performanceIssues": ["list of performance problems"],
    "userExperienceIssues": ["list of UX problems"]
  },
  "gapAnalysis": {
    "missingTestScenarios": ["scenarios not covered"],
    "incompleteUserFlows": ["flows that need completion"],
    "edgeCasesNotCovered": ["edge cases missing"],
    "accessibilityGaps": ["a11y issues found"]
  },
  "technicalIssues": {
    "apiErrors": ["API-related problems"],
    "databaseIssues": ["DB-related problems"],
    "componentErrors": ["React component issues"],
    "integrationIssues": ["integration problems"]
  },
  "recommendations": {
    "immediateFixes": ["high priority fixes needed"],
    "testEnhancements": ["ways to improve tests"],
    "featureCompletions": ["features to complete"],
    "performanceOptimizations": ["performance improvements"]
  },
  "productionReadiness": {
    "readyForProduction": "boolean",
    "blockingIssues": ["issues preventing production"],
    "riskAssessment": "low/medium/high",
    "confidenceLevel": "percentage"
  }
}

Focus on:
1. Identifying gaps between current implementation and production requirements
2. Finding missing test scenarios that real users would encounter
3. Detecting performance issues that could impact user experience
4. Identifying accessibility and usability problems
5. Recommending specific fixes and improvements

Be thorough and specific in your analysis.
`
  }

  /**
   * Generate comprehensive report
   */
  private async generateReport(testResults: TestResults, analysis: any): Promise<string> {
    const timestamp = new Date().toISOString()
    
    const criticalIssues = analysis.overallAssessment?.criticalIssues?.length || 0
    const performanceIssues = analysis.overallAssessment?.performanceIssues?.length || 0
    const uxIssues = analysis.overallAssessment?.userExperienceIssues?.length || 0
    
    const criticalIssuesList = analysis.overallAssessment?.criticalIssues?.map((issue: string) => `- ${issue}`).join('\n') || 'None found'
    const performanceIssuesList = analysis.overallAssessment?.performanceIssues?.map((issue: string) => `- ${issue}`).join('\n') || 'None found'
    const uxIssuesList = analysis.overallAssessment?.userExperienceIssues?.map((issue: string) => `- ${issue}`).join('\n') || 'None found'
    
    const missingScenarios = analysis.gapAnalysis?.missingTestScenarios?.map((scenario: string) => `- ${scenario}`).join('\n') || 'None identified'
    const incompleteFlows = analysis.gapAnalysis?.incompleteUserFlows?.map((flow: string) => `- ${flow}`).join('\n') || 'None identified'
    const edgeCases = analysis.gapAnalysis?.edgeCasesNotCovered?.map((edgeCase: string) => `- ${edgeCase}`).join('\n') || 'None identified'
    const a11yGaps = analysis.gapAnalysis?.accessibilityGaps?.map((gap: string) => `- ${gap}`).join('\n') || 'None identified'
    
    const apiErrors = analysis.technicalIssues?.apiErrors?.map((error: string) => `- ${error}`).join('\n') || 'None found'
    const dbIssues = analysis.technicalIssues?.databaseIssues?.map((issue: string) => `- ${issue}`).join('\n') || 'None found'
    const componentErrors = analysis.technicalIssues?.componentErrors?.map((error: string) => `- ${error}`).join('\n') || 'None found'
    const integrationIssues = analysis.technicalIssues?.integrationIssues?.map((issue: string) => `- ${issue}`).join('\n') || 'None found'
    
    const immediateFixes = analysis.recommendations?.immediateFixes?.map((fix: string) => `- ${fix}`).join('\n') || 'None identified'
    const testEnhancements = analysis.recommendations?.testEnhancements?.map((enhancement: string) => `- ${enhancement}`).join('\n') || 'None identified'
    const featureCompletions = analysis.recommendations?.featureCompletions?.map((feature: string) => `- ${feature}`).join('\n') || 'None identified'
    const performanceOpts = analysis.recommendations?.performanceOptimizations?.map((optimization: string) => `- ${optimization}`).join('\n') || 'None identified'
    
    const blockingIssues = analysis.productionReadiness?.blockingIssues?.map((issue: string) => `- ${issue}`).join('\n') || 'None'
    const isReady = analysis.productionReadiness?.readyForProduction ? '✅ Yes' : '❌ No'
    const riskAssessment = analysis.productionReadiness?.riskAssessment || 'Unknown'
    const confidenceLevel = analysis.productionReadiness?.confidenceLevel || 'Unknown'
    
    return `# Execemy Platform E2E Test Analysis Report
Generated: ${timestamp}

## Executive Summary
- **Test Coverage**: ${analysis.overallAssessment?.testCoverage || 'Unknown'}
- **Critical Issues**: ${criticalIssues} found
- **Performance Issues**: ${performanceIssues} found
- **UX Issues**: ${uxIssues} found

## Test Results Summary
- **Total Tests**: ${testResults.summary.total}
- **Passed**: ${testResults.summary.passed}
- **Failed**: ${testResults.summary.failed}
- **Skipped**: ${testResults.summary.skipped}
- **Duration**: ${testResults.summary.duration}ms

## Detailed Analysis

### Overall Assessment
**Test Coverage**: ${analysis.overallAssessment?.testCoverage || 'Unknown'}

**Critical Issues**:
${criticalIssuesList}

**Performance Issues**:
${performanceIssuesList}

**User Experience Issues**:
${uxIssuesList}

### Gap Analysis
**Missing Test Scenarios**:
${missingScenarios}

**Incomplete User Flows**:
${incompleteFlows}

**Edge Cases Not Covered**:
${edgeCases}

**Accessibility Gaps**:
${a11yGaps}

### Technical Issues
**API Errors**:
${apiErrors}

**Database Issues**:
${dbIssues}

**Component Errors**:
${componentErrors}

**Integration Issues**:
${integrationIssues}

### Recommendations
**Immediate Fixes**:
${immediateFixes}

**Test Enhancements**:
${testEnhancements}

**Feature Completions**:
${featureCompletions}

**Performance Optimizations**:
${performanceOpts}

### Production Readiness Assessment
**Ready for Production**: ${isReady}

**Blocking Issues**:
${blockingIssues}

**Risk Assessment**: ${riskAssessment}

**Confidence Level**: ${confidenceLevel}%

## Next Steps
1. Address all critical and blocking issues immediately
2. Implement recommended test enhancements
3. Complete missing features identified in gap analysis
4. Optimize performance based on recommendations
5. Re-run tests to verify fixes

## Raw Analysis Data
\`\`\`json
${JSON.stringify(analysis, null, 2)}
\`\`\`
`
  }

  /**
   * Save report to file
   */
  async saveReport(report: string, outputPath: string): Promise<void> {
    await fs.writeFile(outputPath, report, 'utf-8')
    console.log(`📄 Report saved to: ${outputPath}`)
  }
}

/**
 * Main execution function
 */
async function main() {
  const testResultsPath = process.argv[2] || 'test-results/results.json'
  const outputPath = process.argv[3] || 'test-results/gemini-analysis-report.md'

  try {
    console.log('🚀 Starting Gemini test analysis...')
    
    const analyzer = new GeminiTestAnalyzer()
    const report = await analyzer.analyzeTestResults(testResultsPath)
    await analyzer.saveReport(report, outputPath)
    
    console.log('✅ Analysis completed successfully!')
    console.log(`📊 Report available at: ${outputPath}`)
  } catch (error) {
    console.error('💥 Analysis failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { GeminiTestAnalyzer }
