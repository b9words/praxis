/**
 * Comprehensive Prisma error handler
 * Handles ALL Prisma error codes to prevent any Prisma-related errors from breaking the app
 */

export interface PrismaErrorInfo {
  code: string
  message: string
  statusCode: number
  recoverable: boolean
}

/**
 * Comprehensive Prisma error code mapping
 * Based on: https://www.prisma.io/docs/reference/api-reference/error-reference
 */
export function getPrismaErrorInfo(error: any): PrismaErrorInfo | null {
  if (!error || typeof error !== 'object') {
    return null
  }

  const code = error.code || error.meta?.code || error.cause?.code
  const message = error.message || error.meta?.message || 'Unknown error'

  // P1014 - Unable to connect to database
  if (code === 'P1014') {
    return {
      code: 'P1014',
      message: 'Unable to connect to database',
      statusCode: 503,
      recoverable: true,
    }
  }

  // P1015 - Connection closed
  if (code === 'P1015') {
    return {
      code: 'P1015',
      message: 'Database connection closed',
      statusCode: 503,
      recoverable: true,
    }
  }

  // P1016 - Connection failure
  if (code === 'P1016') {
    return {
      code: 'P1016',
      message: 'Database connection failure',
      statusCode: 503,
      recoverable: true,
    }
  }

  // P1017 - Server has closed the connection
  if (code === 'P1017') {
    return {
      code: 'P1017',
      message: 'Server has closed the connection',
      statusCode: 503,
      recoverable: true,
    }
  }

  // P1018 - Connection pool timeout
  if (code === 'P1018') {
    return {
      code: 'P1018',
      message: 'Connection pool timeout',
      statusCode: 503,
      recoverable: true,
    }
  }

  // P1019 - Connection pool exhausted
  if (code === 'P1019') {
    return {
      code: 'P1019',
      message: 'Connection pool exhausted',
      statusCode: 503,
      recoverable: true,
    }
  }

  // P1020 - Connection timed out
  if (code === 'P1020') {
    return {
      code: 'P1020',
      message: 'Connection timed out',
      statusCode: 503,
      recoverable: true,
    }
  }

  // P1021 - Connection string missing
  if (code === 'P1021') {
    return {
      code: 'P1021',
      message: 'Database connection string missing',
      statusCode: 500,
      recoverable: false,
    }
  }

  // P1022 - Connection string invalid
  if (code === 'P1022') {
    return {
      code: 'P1022',
      message: 'Database connection string invalid',
      statusCode: 500,
      recoverable: false,
    }
  }

  // P1029 - Connection timeout
  if (code === 'P1029') {
    return {
      code: 'P1029',
      message: 'Connection timeout',
      statusCode: 503,
      recoverable: true,
    }
  }

  // Fallback: Check for connection-related error messages
  if (message && typeof message === 'string') {
    const lowerMessage = message.toLowerCase()
    if (
      lowerMessage.includes('server has closed the connection') ||
      lowerMessage.includes('connection closed') ||
      lowerMessage.includes('connection terminated') ||
      lowerMessage.includes('connection refused') ||
      lowerMessage.includes('connection timed out') ||
      lowerMessage.includes('connection pool') ||
      lowerMessage.includes('connection limit')
    ) {
      return {
        code: code || 'CONNECTION_ERROR',
        message: 'Database connection error',
        statusCode: 503,
        recoverable: true,
      }
    }
  }

  // P2000 - Value out of range
  if (code === 'P2000') {
    return {
      code: 'P2000',
      message: 'Value out of range',
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2001 - Record does not exist
  if (code === 'P2001') {
    return {
      code: 'P2001',
      message: 'Record does not exist',
      statusCode: 404,
      recoverable: true,
    }
  }

  // P2002 - Unique constraint violation
  if (code === 'P2002') {
    const target = error.meta?.target || 'field'
    return {
      code: 'P2002',
      message: `Unique constraint violation on ${Array.isArray(target) ? target.join(', ') : target}`,
      statusCode: 409,
      recoverable: true,
    }
  }

  // P2003 - Foreign key constraint violation
  if (code === 'P2003') {
    return {
      code: 'P2003',
      message: 'Foreign key constraint violation',
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2004 - Constraint violation (database constraint)
  if (code === 'P2004') {
    return {
      code: 'P2004',
      message: 'Constraint violation',
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2005 - Invalid field value
  if (code === 'P2006') {
    return {
      code: 'P2006',
      message: 'Invalid field value',
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2007 - Data validation error
  if (code === 'P2007') {
    return {
      code: 'P2007',
      message: 'Data validation error',
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2008 - Query parsing error
  if (code === 'P2008') {
    return {
      code: 'P2008',
      message: 'Query parsing error',
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2009 - Query validation error
  if (code === 'P2009') {
    return {
      code: 'P2009',
      message: 'Query validation error',
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2010 - Raw query error
  if (code === 'P2010') {
    return {
      code: 'P2010',
      message: 'Raw query error',
      statusCode: 500,
      recoverable: false,
    }
  }

  // P2011 - Null constraint violation
  if (code === 'P2011') {
    const field = error.meta?.target || 'field'
    return {
      code: 'P2011',
      message: `Null constraint violation on ${Array.isArray(field) ? field.join(', ') : field}`,
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2012 - Missing required value
  if (code === 'P2012') {
    const path = error.meta?.path || 'field'
    return {
      code: 'P2012',
      message: `Missing required value at ${path}`,
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2013 - Missing required argument
  if (code === 'P2013') {
    return {
      code: 'P2013',
      message: 'Missing required argument',
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2014 - Relation violation
  if (code === 'P2014') {
    return {
      code: 'P2014',
      message: 'Relation violation',
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2015 - Record not found (different from P2001)
  if (code === 'P2015') {
    return {
      code: 'P2015',
      message: 'Record not found',
      statusCode: 404,
      recoverable: true,
    }
  }

  // P2016 - Query interpretation error
  if (code === 'P2016') {
    return {
      code: 'P2016',
      message: 'Query interpretation error',
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2017 - Records for relation not connected
  if (code === 'P2017') {
    return {
      code: 'P2017',
      message: 'Records for relation not connected',
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2018 - Required connected records not found
  if (code === 'P2018') {
    return {
      code: 'P2018',
      message: 'Required connected records not found',
      statusCode: 404,
      recoverable: false,
    }
  }

  // P2019 - Input error
  if (code === 'P2019') {
    return {
      code: 'P2019',
      message: 'Input error',
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2020 - Value out of range
  if (code === 'P2020') {
    return {
      code: 'P2020',
      message: 'Value out of range',
      statusCode: 400,
      recoverable: false,
    }
  }

  // P2021 - Table does not exist
  if (code === 'P2021') {
    return {
      code: 'P2021',
      message: 'Table does not exist',
      statusCode: 500,
      recoverable: false,
    }
  }

  // P2022 - Column does not exist
  if (code === 'P2022') {
    return {
      code: 'P2022',
      message: 'Column does not exist',
      statusCode: 500,
      recoverable: false,
    }
  }

  // P2023 - Inconsistent column data
  if (code === 'P2023') {
    return {
      code: 'P2023',
      message: 'Inconsistent column data',
      statusCode: 500,
      recoverable: false,
    }
  }

  // P2024 - Connection timeout
  if (code === 'P2024') {
    return {
      code: 'P2024',
      message: 'Connection timeout',
      statusCode: 503,
      recoverable: true,
    }
  }

  // P2025 - Record not found (update/delete operations)
  if (code === 'P2025') {
    return {
      code: 'P2025',
      message: 'Record not found for update/delete operation',
      statusCode: 404,
      recoverable: true,
    }
  }

  // P2026 - Unsupported feature
  if (code === 'P2026') {
    return {
      code: 'P2026',
      message: 'Unsupported database feature',
      statusCode: 500,
      recoverable: false,
    }
  }

  // P2027 - Multiple errors
  if (code === 'P2027') {
    return {
      code: 'P2027',
      message: 'Multiple errors occurred',
      statusCode: 500,
      recoverable: false,
    }
  }

  // P2028 - Transaction API error
  if (code === 'P2028') {
    return {
      code: 'P2028',
      message: 'Transaction API error',
      statusCode: 500,
      recoverable: true,
    }
  }

  // P2030 - Fulltext index not found
  if (code === 'P2030') {
    return {
      code: 'P2030',
      message: 'Fulltext index not found',
      statusCode: 500,
      recoverable: false,
    }
  }

  // P2031 - Migration failed
  if (code === 'P2031') {
    return {
      code: 'P2031',
      message: 'Migration failed',
      statusCode: 500,
      recoverable: false,
    }
  }

  // P2032 - Connection string invalid
  if (code === 'P2033') {
    return {
      code: 'P2033',
      message: 'Connection string invalid',
      statusCode: 500,
      recoverable: false,
    }
  }

  // P2034 - Type does not exist (enum errors - should never happen now)
  if (code === 'P2034') {
    return {
      code: 'P2034',
      message: 'Database type does not exist',
      statusCode: 500,
      recoverable: false,
    }
  }

  // P2035 - Connection limit reached
  if (code === 'P2035') {
    return {
      code: 'P2035',
      message: 'Connection limit reached',
      statusCode: 503,
      recoverable: true,
    }
  }

  // P2036 - Socket error
  if (code === 'P2036') {
    return {
      code: 'P2036',
      message: 'Socket error',
      statusCode: 503,
      recoverable: true,
    }
  }

  // P2037 - Too many database files opened
  if (code === 'P2037') {
    return {
      code: 'P2037',
      message: 'Too many database files opened',
      statusCode: 503,
      recoverable: true,
    }
  }

  // PostgreSQL error codes (42xxx)
  if (typeof code === 'string' && code.startsWith('42')) {
    // 42704 - Type does not exist (enum errors)
    if (code === '42704') {
      return {
        code: '42704',
        message: 'Database type does not exist',
        statusCode: 500,
        recoverable: false,
      }
    }
    
    // 23503 - Foreign key violation
    if (code === '23503') {
      return {
        code: '23503',
        message: 'Foreign key constraint violation',
        statusCode: 400,
        recoverable: false,
      }
    }

    // 23505 - Unique constraint violation
    if (code === '23505') {
      return {
        code: '23505',
        message: 'Unique constraint violation',
        statusCode: 409,
        recoverable: true,
      }
    }

    // 23514 - Check constraint violation
    if (code === '23514') {
      return {
        code: '23514',
        message: 'Check constraint violation',
        statusCode: 400,
        recoverable: false,
      }
    }
  }

  return null
}

/**
 * Check if error is a Prisma error
 */
export function isPrismaError(error: any): boolean {
  return !!getPrismaErrorInfo(error)
}

/**
 * Check if error is recoverable (can retry or handle gracefully)
 */
export function isRecoverablePrismaError(error: any): boolean {
  const info = getPrismaErrorInfo(error)
  return info?.recoverable ?? false
}

/**
 * Get user-friendly error message
 */
export function getPrismaErrorMessage(error: any): string {
  const info = getPrismaErrorInfo(error)
  if (info) {
    return info.message
  }
  
  // Fallback for non-Prisma errors
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

/**
 * Get appropriate HTTP status code for Prisma error
 */
export function getPrismaErrorStatusCode(error: any): number {
  const info = getPrismaErrorInfo(error)
  return info?.statusCode ?? 500
}

/**
 * Normalize any error to a consistent format
 */
export function normalizePrismaError(error: any): { code: string; message: string; statusCode: number; recoverable: boolean } {
  const info = getPrismaErrorInfo(error)
  
  if (info) {
    return info
  }
  
  // Fallback for non-Prisma errors
  return {
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    statusCode: 500,
    recoverable: false,
  }
}

