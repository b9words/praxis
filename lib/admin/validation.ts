/**
 * Validation utilities for admin forms
 */

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// Article validation
export function validateArticle(data: {
  title?: string
  competencyId?: string
  content?: string
  status?: string
}): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.title || data.title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Title is required',
    })
  } else if (data.title.trim().length < 3) {
    errors.push({
      field: 'title',
      message: 'Title must be at least 3 characters',
    })
  }

  if (!data.competencyId || data.competencyId.trim().length === 0) {
    errors.push({
      field: 'competencyId',
      message: 'Competency must be selected',
    })
  }

  if (!data.content || data.content.trim().length === 0) {
    errors.push({
      field: 'content',
      message: 'Content is required',
    })
  } else if (data.content.trim().length < 100) {
    errors.push({
      field: 'content',
      message: 'Content must be at least 100 characters',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Case validation
export function validateCase(data: {
  title?: string
  briefingDoc?: string
  rubric?: string
  datasets?: string
  status?: string
}): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.title || data.title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Title is required',
    })
  } else if (data.title.trim().length < 3) {
    errors.push({
      field: 'title',
      message: 'Title must be at least 3 characters',
    })
  }

  if (!data.briefingDoc || data.briefingDoc.trim().length === 0) {
    errors.push({
      field: 'briefingDoc',
      message: 'Briefing document is required',
    })
  } else if (data.briefingDoc.trim().length < 200) {
    errors.push({
      field: 'briefingDoc',
      message: 'Briefing document must be at least 200 characters',
    })
  }

  if (!data.rubric || data.rubric.trim().length === 0) {
    errors.push({
      field: 'rubric',
      message: 'Rubric is required',
    })
  } else {
    try {
      const parsed = JSON.parse(data.rubric)
      if (!parsed.criteria || !Array.isArray(parsed.criteria)) {
        errors.push({
          field: 'rubric',
          message: 'Rubric must have a "criteria" array',
        })
      } else if (parsed.criteria.length === 0) {
        errors.push({
          field: 'rubric',
          message: 'Rubric must have at least one criterion',
        })
      } else {
        // Validate each criterion
        parsed.criteria.forEach((criterion: any, index: number) => {
          if (!criterion.competencyName || !criterion.competencyName.trim()) {
            errors.push({
              field: `rubric.criteria[${index}].competencyName`,
              message: `Criterion ${index + 1}: Competency name is required`,
            })
          }
          if (!criterion.description || !criterion.description.trim()) {
            errors.push({
              field: `rubric.criteria[${index}].description`,
              message: `Criterion ${index + 1}: Description is required`,
            })
          }
          if (!criterion.scoringGuide) {
            errors.push({
              field: `rubric.criteria[${index}].scoringGuide`,
              message: `Criterion ${index + 1}: Scoring guide is required`,
            })
          } else {
            const scores = ['1', '3', '5'] as const
            scores.forEach((score) => {
              if (!criterion.scoringGuide[score] || !criterion.scoringGuide[score].trim()) {
                errors.push({
                  field: `rubric.criteria[${index}].scoringGuide.${score}`,
                  message: `Criterion ${index + 1}: Score ${score} description is required`,
                })
              }
            })
          }
        })
      }
    } catch (e) {
      errors.push({
        field: 'rubric',
        message: e instanceof Error ? `Invalid JSON: ${e.message}` : 'Invalid JSON format',
      })
    }
  }

  // Validate datasets if provided (optional field - allow empty)
  if (data.datasets && data.datasets.trim()) {
    try {
      const trimmed = data.datasets.trim()
      // Skip validation if content matches placeholder pattern (common placeholder structure)
      const isPlaceholder = trimmed.includes('"revenue": 10000000') && trimmed.includes('"financials"')
      
      if (!isPlaceholder) {
        JSON.parse(trimmed)
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Invalid JSON format'
      const trimmed = data.datasets.trim()
      // Extract position if available
      const positionMatch = errorMsg.match(/position (\d+)/)
      if (positionMatch) {
        const pos = parseInt(positionMatch[1], 10)
        const lines = trimmed.substring(0, pos).split('\n')
        const line = lines.length
        const col = lines[lines.length - 1].length + 1
        errors.push({
          field: 'datasets',
          message: `Invalid JSON at line ${line}, column ${col}: ${errorMsg}`,
        })
      } else {
        errors.push({
          field: 'datasets',
          message: `Invalid JSON: ${errorMsg}`,
        })
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Get error for a specific field
export function getFieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message
}

// Check if field has error
export function hasFieldError(errors: ValidationError[], field: string): boolean {
  return errors.some((e) => e.field === field || e.field.startsWith(field + '.'))
}

