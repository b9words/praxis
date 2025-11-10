/**
 * AI-powered quality enhancement for case studies, lessons, and case study assets
 * Evaluates content against quality standards and rewrites to meet them
 * 
 * SERVER-ONLY: This module uses Node.js fs module and should only be used server-side
 */

/**
 * Dynamically import generateWithAI to avoid bundling scripts/generate-shared for client
 * Uses string manipulation to prevent webpack static analysis
 */
async function getGenerateWithAI() {
  // Runtime check to ensure we're on the server
  if (typeof window !== 'undefined') {
    throw new Error('getGenerateWithAI can only be called server-side')
  }
  
  // Use string concatenation to prevent webpack from statically analyzing the import path
  const scriptsPath = '../' + 'scripts/' + 'generate-shared'
  const module = await import(scriptsPath)
  return module.generateWithAI
}

/**
 * Read quality standards from markdown file
 * SERVER-ONLY: This function will throw if called on the client
 */
async function readQualityStandards(fileName: string): Promise<string> {
  // Runtime check to ensure we're on the server
  if (typeof window !== 'undefined') {
    throw new Error('readQualityStandards can only be called server-side')
  }
  
  try {
    // Use dynamic import to avoid bundling issues
    const fs = await import('fs/promises')
    const path = await import('path')
    
    // Use process.cwd() instead of __dirname for Next.js compatibility
    const qualityPath = path.join(process.cwd(), 'core-docs', fileName)
    
    try {
      return await fs.readFile(qualityPath, 'utf-8')
    } catch (readError) {
      throw new Error(`Quality standards file not found: ${qualityPath}`)
    }
  } catch (importError) {
    // If fs module is not available (e.g., in edge runtime), return empty string
    // This allows the enhancement to continue without quality standards
    console.warn(`[readQualityStandards] Cannot access fs module, skipping quality standards: ${importError}`)
    return ''
  }
}

/**
 * Enhance case study with AI quality assurance
 * Evaluates against quality_casestudy.md standards and rewrites to meet them
 */
export async function enhanceCaseStudyWithAI(caseData: any): Promise<any> {
  // Runtime check
  if (typeof window !== 'undefined') {
    throw new Error('enhanceCaseStudyWithAI can only be called server-side')
  }
  
  const qualityStandards = await readQualityStandards('quality_casestudy.md')
  const generateWithAI = await getGenerateWithAI()
  
  // Build prompt with or without quality standards
  const qualityStandardsSection = qualityStandards 
    ? `\nQUALITY STANDARDS:\n${qualityStandards}\n`
    : '\nNote: Quality standards file not available. Focus on making the case study a genuine dilemma with messy, realistic details.\n'
  
  const prompt = `You are an expert instructional designer specializing in executive case study design. Your task is to evaluate and rewrite a case study to meet the highest quality standards.${qualityStandardsSection}

CURRENT CASE STUDY (JSON):
${JSON.stringify(caseData, null, 2)}

YOUR TASK:
1. Evaluate the case study against the 3 criteria:
   - Is it a Genuine Dilemma? (Central Tension)
   - Is it Messy? (High-Fidelity Realism)
   - Does it Demand a Specific Artifact? (Decision Forcing)

2. Rewrite the case study to meet ALL three criteria. Specifically:
   - Ensure the central decision is a true dilemma with competing valid options
   - Add incomplete information, conflicting data, and political context to make it messy
   - Ensure the final challenge requires producing a specific, high-value executive artifact (not just multiple choice)
   - Enhance caseFiles to include conflicting perspectives from different stakeholders
   - Strengthen stages to force difficult trade-offs
   - Improve rubric to evaluate executive judgment, not just knowledge

3. For caseFiles: Add at least one file that conflicts with the primary recommendation (e.g., a panicked email from Sales arguing against what Finance recommends, or a skeptical memo from Legal)

4. For stages: Ensure each stage's challengeData.prompt forces the user to create a specific artifact (memo, model, deck, analysis) - not just choose an option

5. Maintain the JSON structure exactly - only improve the content within each field

OUTPUT FORMAT:
Return ONLY the improved JSON object. Do NOT include any explanations, advice, or commentary. Output valid JSON that can be parsed directly.

CRITICAL: The output must be parseable JSON only. No markdown formatting, no code blocks, no explanations.`

  const systemPrompt = 'You are an expert instructional designer specializing in executive case study design. You evaluate and rewrite case studies to meet the highest quality standards.'

  console.log('  🔍 Evaluating case study against quality standards...')
  const result = await generateWithAI(prompt, systemPrompt, { trackUsage: true })
  
  let enhancedJsonStr = result.content.trim()
  
  // Clean JSON string (remove markdown code blocks if present)
  if (enhancedJsonStr.startsWith('```json')) {
    enhancedJsonStr = enhancedJsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '')
  } else if (enhancedJsonStr.startsWith('```')) {
    enhancedJsonStr = enhancedJsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '')
  }
  
  // Parse the enhanced JSON
  let enhancedCaseData: any
  try {
    enhancedCaseData = JSON.parse(enhancedJsonStr)
  } catch (error) {
    console.warn(`  ⚠️  Failed to parse enhanced case study JSON, using original: ${error}`)
    return caseData // Return original if parsing fails
  }
  
  // Preserve critical metadata that shouldn't change
  enhancedCaseData.caseId = caseData.caseId || enhancedCaseData.caseId
  enhancedCaseData.version = caseData.version || enhancedCaseData.version
  enhancedCaseData.status = caseData.status || enhancedCaseData.status
  
  console.log(`  ✅ Case study enhanced (${result.model})`)
  return enhancedCaseData
}

/**
 * Enhance lesson content with AI quality assurance
 * Evaluates against quality_lesson.md standards and rewrites to meet them
 */
export async function enhanceLessonWithAI(content: string, lessonTitle: string): Promise<string> {
  // Runtime check
  if (typeof window !== 'undefined') {
    throw new Error('enhanceLessonWithAI can only be called server-side')
  }
  
  const qualityStandards = await readQualityStandards('quality_lesson.md')
  const generateWithAI = await getGenerateWithAI()
  
  // Build prompt with or without quality standards
  const qualityStandardsSection = qualityStandards 
    ? `\nQUALITY STANDARDS:\n${qualityStandards}\n`
    : '\nNote: Quality standards file not available. Focus on making the lesson actionable, specific, and opinionated.\n'
  
  const prompt = `You are an expert business educator specializing in executive education. Your task is to evaluate and rewrite a lesson to meet the highest quality standards.${qualityStandardsSection}

CURRENT LESSON CONTENT:
${content}

LESSON TITLE: ${lessonTitle}

YOUR TASK:
1. Evaluate the lesson against the 3 criteria:
   - Is it a Weapon? (Actionability - can it be summarized as "How to...")
   - Is it Grounded? (Specificity & Evidence - every principle has concrete examples)
   - Does it have a Sharp Edge? (Opinionated POV - tells you when NOT to use it, common failures)

2. Rewrite the lesson to meet ALL three criteria. Specifically:
   - Make every section actionable - frame as "How to..." not just "What is..."
   - Add specific, quantitative examples for every major principle (real companies, real numbers, real outcomes)
   - Add strong, opinionated perspectives on when NOT to use the framework, common failure modes, and contrarian views
   - Replace generic platitudes with concrete, evidence-based guidance
   - Ensure the lesson reads like it's written by an experienced operator, not a neutral Wikipedia article

3. Maintain the markdown structure and all sections - only improve the content within each section

4. Preserve any tables, calculations, or diagrams that are already present

OUTPUT FORMAT:
Return ONLY the improved lesson content in markdown format. Do NOT include any explanations, advice, or commentary about what you changed. Output the complete rewritten lesson content.

CRITICAL: Output the complete lesson content only. No markdown code blocks, no explanations, no meta-commentary.`

  const systemPrompt = 'You are an expert business educator specializing in executive education. You evaluate and rewrite lessons to meet the highest quality standards.'

  console.log('  🔍 Evaluating lesson against quality standards...')
  const result = await generateWithAI(prompt, systemPrompt, { trackUsage: true })
  
  let enhancedContent = result.content.trim()
  
  // Remove markdown code blocks if present
  if (enhancedContent.startsWith('```markdown')) {
    enhancedContent = enhancedContent.replace(/^```markdown\n?/, '').replace(/\n?```$/, '')
  } else if (enhancedContent.startsWith('```')) {
    enhancedContent = enhancedContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
  }
  
  console.log(`  ✅ Lesson enhanced (${result.model})`)
  return enhancedContent
}

/**
 * Enhance a case study asset file with AI quality assurance
 * Evaluates asset content against case study quality standards and rewrites to meet them
 */
export async function enhanceCaseStudyAssetWithAI(
  assetContent: string,
  fileName: string,
  fileType: string,
  caseContext: { title: string; description: string; competencies: string[] }
): Promise<string> {
  // Runtime check
  if (typeof window !== 'undefined') {
    throw new Error('enhanceCaseStudyAssetWithAI can only be called server-side')
  }
  
  const qualityStandards = await readQualityStandards('quality_casestudy.md')
  const generateWithAI = await getGenerateWithAI()
  
  // Determine asset type context for enhancement
  const assetTypeContext = getAssetTypeContext(fileType)
  
  // Build prompt with or without quality standards
  const qualityStandardsSection = qualityStandards 
    ? `\nQUALITY STANDARDS (from quality_casestudy.md):\n${qualityStandards}\n`
    : '\nNote: Quality standards file not available. Focus on making the asset messy and realistic with conflicting perspectives.\n'
  
  const prompt = `You are an expert instructional designer specializing in executive case study design. Your task is to evaluate and rewrite a case study asset file to meet the highest quality standards.${qualityStandardsSection}

CASE STUDY CONTEXT:
- Title: ${caseContext.title}
- Description: ${caseContext.description}
- Competencies: ${caseContext.competencies.join(', ')}

ASSET FILE:
- File Name: ${fileName}
- File Type: ${fileType}
- Type Context: ${assetTypeContext}

CURRENT ASSET CONTENT:
${assetContent}

YOUR TASK:
1. Evaluate the asset against the case study quality criteria, especially:
   - Is it Messy? (High-Fidelity Realism) - Does it include incomplete information, conflicting data, or political context?
   - Does it contribute to a Genuine Dilemma? - Does it present competing perspectives or conflicting advice?

2. Rewrite the asset to meet quality standards. Specifically:
   - Add realistic "noise" and incomplete information that reflects messy business reality
   - Include conflicting perspectives or data that create tension (e.g., Sales says one thing, Finance says another)
   - Make it feel like a real business document with real stakes and political context
   - Ensure it contributes to the case study's central dilemma, not just provides clean data

3. For ${fileType} files specifically:
${assetTypeContext}

4. Maintain the original format (markdown, CSV, etc.) - only improve the content
${fileType === 'FINANCIAL_DATA' && fileName.endsWith('.csv') ? '\nCRITICAL FOR CSV: Output valid CSV format with comma-separated values. Preserve headers and ensure all rows have the same number of columns. Do NOT use markdown tables or pipe separators.' : ''}

OUTPUT FORMAT:
Return ONLY the improved asset content in the same format as the original. Do NOT include any explanations, advice, or commentary. Output the complete rewritten asset content.

CRITICAL: Output the complete asset content only. No markdown code blocks (unless the asset itself is markdown), no explanations, no meta-commentary.`

  const systemPrompt = 'You are an expert instructional designer specializing in executive case study design. You evaluate and rewrite case study assets to meet the highest quality standards.'

  console.log(`  🔍 Evaluating asset "${fileName}" against quality standards...`)
  const result = await generateWithAI(prompt, systemPrompt, { trackUsage: true })
  
  let enhancedContent = result.content.trim()
  
  // Remove markdown code blocks if present (but preserve if asset is markdown)
  // For CSV files, ensure we preserve the CSV format
  if (fileType === 'FINANCIAL_DATA' && fileName.endsWith('.csv')) {
    // For CSV, remove code blocks but ensure it's valid CSV
    if (enhancedContent.startsWith('```csv')) {
      enhancedContent = enhancedContent.replace(/^```csv\n?/, '').replace(/\n?```$/, '')
    } else if (enhancedContent.startsWith('```')) {
      enhancedContent = enhancedContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }
    // Ensure CSV format is preserved (comma-separated values)
    if (!enhancedContent.includes(',') && enhancedContent.includes('|')) {
      // If AI returned a markdown table, convert to CSV
      const lines = enhancedContent.split('\n').filter((line: string) => line.trim())
      const csvLines = lines.map((line: string) => {
        const cells = line.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell)
        return cells.join(',')
      })
      enhancedContent = csvLines.join('\n')
    }
  } else if (fileType !== 'MEMO' && fileType !== 'REPORT' && fileType !== 'LEGAL_DOCUMENT') {
    if (enhancedContent.startsWith('```markdown')) {
      enhancedContent = enhancedContent.replace(/^```markdown\n?/, '').replace(/\n?```$/, '')
    } else if (enhancedContent.startsWith('```')) {
      enhancedContent = enhancedContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }
  }
  
  console.log(`  ✅ Asset "${fileName}" enhanced (${result.model})`)
  return enhancedContent
}

/**
 * Get context-specific guidance for different asset types
 */
function getAssetTypeContext(fileType: string): string {
  const contexts: Record<string, string> = {
    'FINANCIAL_DATA': `- Ensure the data includes realistic inconsistencies or missing values
- Add notes or annotations that suggest different interpretations
- Include multiple data sources that might conflict slightly
- Make it feel like real financial data with real-world messiness`,
    
    'MEMO': `- Write from a specific stakeholder's perspective with clear biases
- Include incomplete information or assumptions
- Add political context and hidden agendas
- Make it feel urgent and high-stakes
- Include conflicting recommendations or concerns`,
    
    'REPORT': `- Include sections that contradict each other subtly
- Add data that supports multiple interpretations
- Include caveats and uncertainties
- Make it feel like a real analyst report with real limitations`,
    
    'PRESENTATION_DECK': `- Include slides that present competing viewpoints
- Add notes or annotations showing internal debate
- Make it feel like a real executive presentation with political considerations`,
    
    'LEGAL_DOCUMENT': `- Include ambiguous language that creates uncertainty
- Add clauses that could be interpreted multiple ways
- Make it feel like real legal documents with real risks`,
  }
  
  return contexts[fileType] || `- Ensure the content contributes to the case study's central dilemma
- Add realistic business complexity and conflicting perspectives
- Make it feel authentic and high-stakes`
}

/**
 * Enhance all case study assets
 * Processes all STATIC assets in a case study and enhances their content
 */
export async function enhanceAllCaseStudyAssets(caseData: any): Promise<any> {
  if (!caseData.caseFiles || !Array.isArray(caseData.caseFiles)) {
    return caseData
  }
  
  console.log(`\n✨ Enhancing ${caseData.caseFiles.length} case study asset(s)...`)
  
  const caseContext = {
    title: caseData.title || 'Case Study',
    description: caseData.description || '',
    competencies: caseData.competencies || [],
  }
  
  let enhancedCount = 0
  let skippedCount = 0
  
  for (const asset of caseData.caseFiles) {
    // Only enhance STATIC assets (not REFERENCE assets)
    if (asset.source?.type !== 'STATIC' || !asset.source?.content) {
      skippedCount++
      continue
    }
    
    // Skip image files
    if (/\.(png|jpg|jpeg|gif)$/i.test(asset.fileName)) {
      skippedCount++
      continue
    }
    
    try {
      const originalContent = asset.source.content
      const enhancedContent = await enhanceCaseStudyAssetWithAI(
        originalContent,
        asset.fileName,
        asset.fileType,
        caseContext
      )
      
      asset.source.content = enhancedContent
      enhancedCount++
      
      // Small delay between assets to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.warn(`  ⚠️  Failed to enhance asset "${asset.fileName}": ${error}`)
      // Continue with other assets
    }
  }
  
  console.log(`✅ Enhanced ${enhancedCount} asset(s), skipped ${skippedCount} asset(s)\n`)
  
  return caseData
}

