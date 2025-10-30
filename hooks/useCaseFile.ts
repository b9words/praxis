import { useCaseStudyStore } from '@/lib/case-study-store'
import { useQuery } from '@tanstack/react-query'
import Papa from 'papaparse'

export interface CaseFileData {
  fileId: string
  fileName: string
  fileType: string
  content: any
  isLoading: boolean
  error: string | null
}

export function useCaseFile(fileId: string): CaseFileData {
  const caseStudyData = useCaseStudyStore(state => state.caseStudyData)
  
  const caseFile = caseStudyData?.caseFiles.find(f => f.fileId === fileId)

  const { data, isLoading, error } = useQuery({
    queryKey: ['case-file', fileId, caseFile?.source],
    queryFn: async () => {
      if (!caseFile) {
        throw new Error(`File with ID ${fileId} not found`)
      }

      switch (caseFile.source.type) {
        case 'STATIC':
          return caseFile.source.content || ''

        case 'REMOTE_CSV':
          if (!caseFile.source.url) {
            throw new Error('No URL provided for remote CSV')
          }
          
          const csvResponse = await fetch(caseFile.source.url)
          if (!csvResponse.ok) {
            throw new Error(`Failed to fetch CSV: ${csvResponse.statusText}`)
          }
          
          const csvText = await csvResponse.text()
          
          return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                if (results.errors.length > 0) {
                  reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
                } else {
                  resolve(results.data)
                }
              },
              error: (error: any) => {
                reject(new Error(`CSV parsing error: ${error.message}`))
              }
            })
          })

        case 'REMOTE_PDF':
          if (!caseFile.source.url) {
            throw new Error('No URL provided for remote PDF')
          }
          
          const pdfResponse = await fetch(caseFile.source.url)
          if (!pdfResponse.ok) {
            throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`)
          }
          
          // Return the blob URL for PDF viewing
          const blob = await pdfResponse.blob()
          return URL.createObjectURL(blob)

        case 'REMOTE_API':
          if (!caseFile.source.url) {
            throw new Error('No URL provided for remote API')
          }
          
          const apiResponse = await fetch(caseFile.source.url, {
            headers: {
              'Content-Type': 'application/json',
            }
          })
          
          if (!apiResponse.ok) {
            throw new Error(`API request failed: ${apiResponse.statusText}`)
          }
          
          return await apiResponse.json()

        default:
          throw new Error(`Unsupported file source type: ${caseFile.source.type}`)
      }
    },
    enabled: !!caseFile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  return {
    fileId,
    fileName: caseFile?.fileName || '',
    fileType: caseFile?.fileType || '',
    content: data,
    isLoading,
    error: error?.message || null
  }
}

// Utility hook for multiple files
export function useCaseFiles(fileIds: string[]): Record<string, CaseFileData> {
  const results: Record<string, CaseFileData> = {}
  
  fileIds.forEach(fileId => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[fileId] = useCaseFile(fileId)
  })
  
  return results
}
