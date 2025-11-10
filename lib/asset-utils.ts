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

/**
 * Get priority score for asset type (higher = more important)
 * Priority: PRESENTATION_DECK > REPORT/INTERNAL_MEMO/MEMO > FINANCIAL_DATA/MARKET_DATASET > everything else
 */
function getAssetPriority(fileType: string, originalFileType?: string): number {
  const type = originalFileType || fileType
  
  if (type === 'PRESENTATION_DECK') return 100
  if (type === 'REPORT' || type === 'INTERNAL_MEMO' || type === 'MEMO') return 80
  if (type === 'FINANCIAL_DATA' || type === 'MARKET_DATASET') return 60
  if (type === 'LEGAL_DOCUMENT') return 40
  if (type === 'ORG_CHART' || type === 'STAKEHOLDER_PROFILES') return 30
  return 10
}

/**
 * Prioritize assets for display (limit to top 3)
 */
export function prioritizeAssets<T extends { fileType: string; originalFileType?: string }>(
  assets: T[]
): T[] {
  return [...assets].sort((a, b) => {
    const priorityA = getAssetPriority(a.fileType, a.originalFileType)
    const priorityB = getAssetPriority(b.fileType, b.originalFileType)
    return priorityB - priorityA // Higher priority first
  })
}

/**
 * Prioritize case files for display
 */
export function prioritizeFiles<T extends { fileType: string }>(
  files: T[]
): T[] {
  return prioritizeAssets(files)
}

/**
 * Prioritize datasets for display
 */
export function prioritizeDatasets<T extends { fileType: string }>(
  datasets: T[]
): T[] {
  return prioritizeAssets(datasets)
}


