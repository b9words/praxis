/**
 * Shared utilities for content generation scripts
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import OpenAI from 'openai'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env and .env.local (Next.js convention)
dotenv.config()
dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize clients
let geminiClient: GoogleGenerativeAI | null = null
let openaiClient: OpenAI | null = null

// Debug: Check API key availability (only in non-production)
if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
} else if (process.env.DEBUG_API_KEYS) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment')
}

if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
} else if (process.env.DEBUG_API_KEYS) {
  console.warn('⚠️  OPENAI_API_KEY not found in environment')
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create supabase client only if credentials are available (for dry-run tests)
export const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Helper to check if supabase is available
export function isSupabaseAvailable(): boolean {
  return supabase !== null && supabaseUrl !== null && supabaseServiceKey !== null
}

const STORAGE_BUCKET = 'assets'

/**
 * Retry with exponential backoff
 * Skips retries for permanent errors (API key issues, invalid model, etc.)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Check for permanent errors that shouldn't be retried
      const errorMsg = lastError.message.toLowerCase()
      const permanentErrors = [
        'api key expired',
        'api key not valid',
        'api_key_invalid',
        'invalid api key',
        'model not found',
        'model does not exist',
      ]
      
      if (permanentErrors.some(err => errorMsg.includes(err))) {
        // Don't retry - this is a permanent error
        throw lastError
      }
      
      if (attempt === maxRetries) {
        throw lastError
      }
      const delay = Math.min(initialDelay * Math.pow(2, attempt), 8000)
      const jitter = Math.random() * 0.1 * delay
      await new Promise(resolve => setTimeout(resolve, delay + jitter))
      console.log(`  Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay + jitter)}ms`)
    }
  }
  throw lastError
}

// Model availability cache
const availableModels = new Map<string, boolean>()

/**
 * Validate model availability at startup (quick test)
 */
export async function validateModelAvailability(model: { provider: string; model: string; name: string }): Promise<boolean> {
  const cacheKey = `${model.provider}:${model.model}`
  if (availableModels.has(cacheKey)) {
    return availableModels.get(cacheKey)!
  }
  
  try {
    if (model.provider === 'gemini' && geminiClient) {
      const genModel = geminiClient.getGenerativeModel({ model: model.model })
      const result = await genModel.generateContent('test')
      await result.response // Verify we got a response
      availableModels.set(cacheKey, true)
      return true
    }
    if (model.provider === 'openai' && openaiClient) {
      const response = await openaiClient.chat.completions.create({
        model: model.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      })
      if (response.choices && response.choices.length > 0) {
        availableModels.set(cacheKey, true)
        return true
      }
    }
  } catch (error) {
    // Model not available or invalid
    availableModels.set(cacheKey, false)
    return false
  }
  
  availableModels.set(cacheKey, false)
  return false
}

/**
 * Get available models in priority order
 * Skips validation check if models list is empty (fails fast to actual generation)
 */
export async function getAvailableModels(skipValidation: boolean = false) {
  const allModels = [
    { provider: 'gemini', model: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { provider: 'gemini', model: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { provider: 'gemini', model: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp' },
    { provider: 'gemini', model: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { provider: 'openai', model: 'gpt-4o', name: 'GPT-4o' },
    { provider: 'openai', model: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  ]
  
  // Filter by available clients (API keys configured)
  const modelsWithClients = allModels.filter(m => 
    (m.provider === 'gemini' && geminiClient) || 
    (m.provider === 'openai' && openaiClient)
  )
  
  if (skipValidation || modelsWithClients.length === 0) {
    // Return models with clients - validation will happen during actual generation (fail fast)
    return modelsWithClients
  }
  
  const available: typeof allModels = []
  console.log('🔍 Checking available AI models...')
  for (const model of modelsWithClients) {
    const isAvailable = await validateModelAvailability(model)
    if (isAvailable) {
      console.log(`  ✅ ${model.name} available`)
      available.push(model)
    } else {
      console.log(`  ⚠️  ${model.name} not available`)
    }
  }
  console.log(`\n📊 Found ${available.length} available model(s)\n`)
  
  return available.length > 0 ? available : modelsWithClients
}

/**
 * Generate content with resilient model fallback
 */
export async function generateWithAI(
  prompt: string,
  systemPrompt: string | null = null,
  options: { trackUsage?: boolean; skipModelCheck?: boolean } = {}
): Promise<{ content: string; model: string; tokens?: { prompt: number; completion: number; total: number } }> {
  // Skip model validation - go straight to generation (fails fast if keys invalid)
  const models = await getAvailableModels(true) // skipValidation = true
  
  if (models.length === 0) {
    throw new Error('No AI models available - check API keys')
  }
  
  for (const { provider, model, name } of models) {
    try {
      console.log(`  Attempting with ${name}...`)
      
      if (provider === 'gemini' && geminiClient) {
        const genModel = geminiClient.getGenerativeModel({ model })
        const fullPrompt = systemPrompt 
          ? `${systemPrompt}\n\n---\n\n${prompt}`
          : prompt
        
        const result = await retryWithBackoff(async () => {
          const response = await genModel.generateContent(fullPrompt)
          return response
        })
        
        const text = result.response.text()
        const usageMetadata = result.response.usageMetadata
        
        // Track token usage if requested
        if (options.trackUsage && usageMetadata) {
          const tokens = {
            prompt: usageMetadata.promptTokenCount || usageMetadata.prompt_tokens || 0,
            completion: usageMetadata.candidatesTokenCount || usageMetadata.completion_tokens || 0,
            total: usageMetadata.totalTokenCount || usageMetadata.total_tokens || 0,
          }
          await trackTokenUsage(model, tokens)
        }
        
        console.log(`  ✅ Generated with ${name} (${text.length} chars)`)
        return {
          content: text,
          model: name,
          tokens: usageMetadata ? {
            prompt: usageMetadata.promptTokenCount || usageMetadata.prompt_tokens || 0,
            completion: usageMetadata.candidatesTokenCount || usageMetadata.completion_tokens || 0,
            total: usageMetadata.totalTokenCount || usageMetadata.total_tokens || 0,
          } : undefined,
        }
      }
      
      if (provider === 'openai' && openaiClient) {
        const messages: Array<{ role: 'system' | 'user'; content: string }> = []
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt })
        }
        messages.push({ role: 'user', content: prompt })
        
        const response = await retryWithBackoff(async () => {
          return await openaiClient!.chat.completions.create({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 4000,
          })
        })
        
        const text = response.choices[0]?.message?.content || ''
        const usage = response.usage
        
        // Track token usage if requested
        if (options.trackUsage && usage) {
          await trackTokenUsage(model, {
            prompt: usage.prompt_tokens,
            completion: usage.completion_tokens,
            total: usage.total_tokens,
          })
        }
        
        console.log(`  ✅ Generated with ${name} (${text.length} chars)`)
        return {
          content: text,
          model: name,
          tokens: usage ? {
            prompt: usage.prompt_tokens,
            completion: usage.completion_tokens,
            total: usage.total_tokens,
          } : undefined,
        }
      }
    } catch (error) {
      console.log(`  ❌ ${name} failed: ${error instanceof Error ? error.message : String(error)}`)
      continue
    }
  }
  
  throw new Error('All AI providers failed')
}

/**
 * Track token usage in database
 */
async function trackTokenUsage(model: string, tokens: { prompt: number; completion: number; total: number }) {
  if (!isSupabaseAvailable()) {
    // Skip tracking if Supabase not available (dry-run mode)
    return
  }
  
  try {
    const today = new Date().toISOString().split('T')[0]
    // Check if record exists
    const { data: existing } = await supabase!
      .from('token_usage')
      .select('id')
      .eq('date', today)
      .eq('model', model)
      .maybeSingle()
    
    if (existing) {
      // Update existing
      await supabase!
        .from('token_usage')
        .update({
          prompt_tokens: tokens.prompt,
          completion_tokens: tokens.completion,
          total_tokens: tokens.total,
        })
        .eq('id', existing.id)
    } else {
      // Insert new
      await supabase!.from('token_usage').insert({
        date: today,
        model,
        prompt_tokens: tokens.prompt,
        completion_tokens: tokens.completion,
        total_tokens: tokens.total,
      })
    }
  } catch (error) {
    // Silently fail - token tracking is optional
    console.warn('Failed to track token usage:', error)
  }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadToStorage(
  storagePath: string,
  content: string,
  contentType: string = 'text/plain'
): Promise<string> {
  if (!isSupabaseAvailable()) {
    throw new Error('Supabase not configured - cannot upload to storage')
  }
  
  // Convert string to Buffer for Node.js
  const buffer = Buffer.from(content, 'utf-8')
  
  const { data, error } = await supabase!.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      upsert: true,
      contentType,
    })
  
  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }
  
  return data.path
}

/**
 * Sync file metadata to database via API route
 */
export async function syncFileMetadata(storagePath: string) {
  if (!isSupabaseAvailable()) {
    throw new Error('Supabase not configured - cannot sync metadata')
  }
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const apiUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3400'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!apiUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SITE_URL or SUPABASE_SERVICE_ROLE_KEY for API sync')
  }
  
  try {
    // Call API route with service role auth
    const response = await fetch(`${apiUrl}/api/storage/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        bucket: STORAGE_BUCKET,
        path: storagePath,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }
      throw new Error(`Sync failed: ${response.status} ${response.statusText} - ${errorData.error || errorText}`)
    }
    
    const data = await response.json()
    
    // Check if response indicates an error
    if (data.error) {
      throw new Error(`Sync failed: ${data.error}`)
    }
    
    return data
  } catch (error: any) {
    // Catch network errors, parsing errors, etc.
    if (error?.message) {
      throw new Error(`Sync failed: ${error.message}`)
    }
    throw new Error(`Sync failed: ${String(error)}`)
  }
}

/**
 * Check if article exists in DB or Storage
 */
export async function articleExists(storagePath: string): Promise<boolean> {
  if (!isSupabaseAvailable()) {
    // In dry-run mode without Supabase, assume it doesn't exist
    return false
  }
  
  // Check DB
  const { data: dbArticle } = await supabase!
    .from('articles')
    .select('id')
    .eq('storage_path', storagePath)
    .maybeSingle()
  
  if (dbArticle) return true
  
  // Check Storage
  const { data: storageFiles } = await supabase!.storage
    .from(STORAGE_BUCKET)
    .list(path.dirname(storagePath), {
      search: path.basename(storagePath),
    })
  
  return storageFiles !== null && storageFiles.length > 0
}

/**
 * Check if case exists in DB or Storage
 */
export async function caseExists(storagePath: string): Promise<boolean> {
  if (!isSupabaseAvailable()) {
    // In dry-run mode without Supabase, assume it doesn't exist
    return false
  }
  
  // Check DB
  const { data: dbCase } = await supabase!
    .from('cases')
    .select('id')
    .eq('storage_path', storagePath)
    .maybeSingle()
  
  if (dbCase) return true
  
  // Check Storage
  const { data: storageFiles } = await supabase!.storage
    .from(STORAGE_BUCKET)
    .list(path.dirname(storagePath), {
      search: path.basename(storagePath),
    })
  
  return storageFiles !== null && storageFiles.length > 0
}

/**
 * Get core values prompt from target.md
 */
export function getCoreValuesPrompt(): string {
  const targetPath = path.join(__dirname, '..', 'core-docs', 'target.md')
  if (fs.existsSync(targetPath)) {
    const content = fs.readFileSync(targetPath, 'utf-8')
    return `
CORE VALUES & PRINCIPLES (from target.md):
${content}

These values must be reflected in all content:
- Focus on practical application over abstract theory
- Emphasize demonstrable skills and decision-making
- Connect learning to real-world business scenarios
- Ensure content is auditable and scalable
- Support the meritocracy of skill through provable competence
`
  }
  return ''
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Extract tables from markdown
 * Counts the number of distinct markdown tables (groups of table rows)
 */
export function extractTables(markdown: string): number {
  // Count tables by finding table row patterns
  // A table is a group of lines starting with | and containing |
  const lines = markdown.split('\n')
  let tableCount = 0
  let inTable = false
  
  for (const line of lines) {
    const isTableRow = /^\s*\|.+\|\s*$/.test(line.trim())
    if (isTableRow && !inTable) {
      // Start of a new table
      tableCount++
      inTable = true
    } else if (!isTableRow && inTable) {
      // End of current table
      inTable = false
    }
  }
  
  return tableCount
}

/**
 * Extract calculations from markdown (looks for numeric patterns with operators)
 */
export function extractCalculations(markdown: string): number {
  // Look for calculation patterns: numbers, operators, = signs
  const calcPattern = /[\d,]+\.?\d*\s*[+\-*/]\s*[\d,]+\.?\d*\s*=|ROI|LTV|CAC|ROIC|EBITDA|DCF|NPV|IRR/gi
  const matches = markdown.match(calcPattern) || []
  return matches.length
}

/**
 * Check if content has required H2 sections
 */
export function checkRequiredSections(content: string, requiredSections: string[]): { found: string[]; missing: string[] } {
  const contentLower = content.toLowerCase()
  const found: string[] = []
  const missing: string[] = []
  
  for (const section of requiredSections) {
    if (contentLower.includes(section)) {
      found.push(section)
    } else {
      missing.push(section)
    }
  }
  
  return { found, missing }
}

/**
 * Generate and upload thumbnail for content
 */
export async function generateAndUploadThumbnail(
  contentId: string,
  contentType: 'lesson' | 'case',
  title: string,
  domainName: string,
  competencyName?: string
): Promise<string | null> {
  if (!isSupabaseAvailable()) {
    console.warn('  ⚠️  Supabase not available - skipping thumbnail generation')
    return null
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3400'
    
    // Call thumbnail generation API
    console.log('  🎨 Generating thumbnail...')
    const response = await fetch(`${apiUrl}/api/generate-thumbnail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentId,
        contentType,
        title,
        domainName,
        competencyName,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(`Thumbnail API error: ${errorData.error || response.statusText}`)
    }

    const { svg } = await response.json()

    // Upload SVG to storage
    const thumbnailPath = `${contentType === 'lesson' ? 'thumbnails/articles' : 'thumbnails/cases'}/${contentId}.svg`
    await uploadToStorage(thumbnailPath, svg, 'image/svg+xml')

    // Get public URL for the thumbnail
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const thumbnailUrl = `${supabaseUrl}/storage/v1/object/public/assets/${thumbnailPath}`

    // Update database record with thumbnail_url
    const tableName = contentType === 'lesson' ? 'articles' : 'cases'
    const { error: updateError } = await supabase!
      .from(tableName)
      .update({ thumbnail_url: thumbnailUrl })
      .eq('id', contentId)

    if (updateError) {
      throw new Error(`Failed to update thumbnail_url: ${updateError.message}`)
    }

    console.log(`  ✅ Thumbnail generated and uploaded: ${thumbnailUrl}`)
    return thumbnailUrl
  } catch (error) {
    console.warn(`  ⚠️  Thumbnail generation failed: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

/**
 * Auto-repair content based on validation errors
 */
export async function repairContent(
  content: string,
  errors: string[],
  originalPrompt: string,
  systemPrompt: string | null = null
): Promise<string> {
  // Build focused repair instructions based on errors
  const needsTables = errors.some(e => e.includes('table'))
  const needsWordCount = errors.some(e => e.includes('Word count') || e.includes('minimum'))
  const needsSections = errors.some(e => e.includes('section'))
  
  const repairInstructions: string[] = []
  if (needsTables) {
    repairInstructions.push(`- ADD 2-3 markdown tables with real data (use proper markdown table syntax with | separators)`)
  }
  if (needsWordCount) {
    repairInstructions.push(`- EXPAND content to meet minimum word count (target: 1800-2400 words) - do NOT shorten`)
  }
  if (needsSections) {
    repairInstructions.push(`- ENSURE all required sections are present with proper H2 headings`)
  }
  
  const repairPrompt = `You are fixing content that failed validation. Here are the specific errors:
${errors.map(e => `- ${e}`).join('\n')}

CURRENT CONTENT (${content.length} chars, ${countWords(content)} words):
${content}

CRITICAL REPAIR INSTRUCTIONS:
${repairInstructions.join('\n')}

REQUIREMENTS:
1. Fix ALL validation errors listed above
2. MAINTAIN and PRESERVE all existing content - do NOT remove sections
3. EXPAND content where needed - never shorten below current length
4. ADD tables as markdown tables (| column1 | column2 | column3 |)
5. Keep the same professional tone and style
6. Ensure word count is AT LEAST 1800 words (expand if needed)

Please provide the COMPLETE, FIXED content with all original content preserved and errors fixed:`

  const result = await generateWithAI(repairPrompt, systemPrompt, { trackUsage: true })
  return result.content
}

