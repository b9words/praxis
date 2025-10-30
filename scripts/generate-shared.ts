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

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize clients
let geminiClient: GoogleGenerativeAI | null = null
let openaiClient: OpenAI | null = null

if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
}

if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const STORAGE_BUCKET = 'assets'

/**
 * Retry with exponential backoff
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

/**
 * Generate content with Gemini 2.5 Pro, falling back to other models
 */
export async function generateWithAI(
  prompt: string,
  systemPrompt: string | null = null
): Promise<string> {
  const models = [
    // Primary: Gemini 2.5 Pro (per plan) - will fail gracefully if not available
    { provider: 'gemini', model: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { provider: 'gemini', model: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { provider: 'gemini', model: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp' },
    { provider: 'gemini', model: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    // Fallback to OpenAI
    { provider: 'openai', model: 'gpt-4o', name: 'GPT-4o' },
    { provider: 'openai', model: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  ]

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
          return response.response
        })
        
        const text = result.text()
        console.log(`  ✅ Generated with ${name} (${text.length} chars)`)
        return text
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
        console.log(`  ✅ Generated with ${name} (${text.length} chars)`)
        return text
      }
    } catch (error) {
      console.log(`  ❌ ${name} failed: ${error instanceof Error ? error.message : String(error)}`)
      continue
    }
  }
  
  throw new Error('All AI providers failed')
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadToStorage(
  storagePath: string,
  content: string,
  contentType: string = 'text/plain'
): Promise<string> {
  // Convert string to Buffer for Node.js
  const buffer = Buffer.from(content, 'utf-8')
  
  const { data, error } = await supabase.storage
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
 * Sync file metadata to database via Edge Function
 */
export async function syncFileMetadata(storagePath: string) {
  const { data, error } = await supabase.functions.invoke('sync-file-metadata', {
    body: { bucket: STORAGE_BUCKET, path: storagePath },
  })
  
  if (error) {
    throw new Error(`Sync failed: ${error.message}`)
  }
  
  return data
}

/**
 * Check if article exists in DB or Storage
 */
export async function articleExists(storagePath: string): Promise<boolean> {
  // Check DB
  const { data: dbArticle } = await supabase
    .from('articles')
    .select('id')
    .eq('storage_path', storagePath)
    .maybeSingle()
  
  if (dbArticle) return true
  
  // Check Storage
  const { data: storageFiles } = await supabase.storage
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
  // Check DB
  const { data: dbCase } = await supabase
    .from('cases')
    .select('id')
    .eq('storage_path', storagePath)
    .maybeSingle()
  
  if (dbCase) return true
  
  // Check Storage
  const { data: storageFiles } = await supabase.storage
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

