/**
 * Shared utilities for asset handling
 */

/**
 * Get MIME type for asset based on file type
 */
export function getMimeTypeForAsset(fileType: string): string {
  const isCSV = fileType === 'FINANCIAL_DATA'
  const isJSON = fileType === 'ORG_CHART' || fileType === 'STAKEHOLDER_PROFILES' || fileType === 'MARKET_DATASET'
  return isCSV 
    ? 'text/csv' 
    : isJSON 
    ? 'application/json' 
    : 'text/markdown'
}

/**
 * Get file extension for asset based on file type
 */
export function getExtensionForAsset(fileType: string): string {
  const isCSV = fileType === 'FINANCIAL_DATA'
  const isJSON = fileType === 'ORG_CHART' || fileType === 'STAKEHOLDER_PROFILES' || fileType === 'MARKET_DATASET'
  return isCSV ? 'csv' : isJSON ? 'json' : 'md'
}


