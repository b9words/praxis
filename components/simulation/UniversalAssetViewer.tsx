'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Table, File, Briefcase, Scale, Presentation } from 'lucide-react'
import AssetRenderer from '@/components/admin/renderers/AssetRenderer'
import CSVRenderer from '@/components/admin/renderers/CSVRenderer'
import DataSheetRenderer from '@/components/admin/renderers/DataSheetRenderer'
import MarkdownRenderer from '@/components/ui/Markdown'
import { useMemo } from 'react'

interface UniversalAssetViewerProps {
  briefingDoc: string | null | undefined
  datasets?: Record<string, any> | Array<any> | null
  caseFiles?: Array<{
    fileId: string
    fileName: string
    fileType: string
    content: string | null
  }> | null
}

export default function UniversalAssetViewer({ briefingDoc, datasets, caseFiles }: UniversalAssetViewerProps) {
  // Process all case files (not just datasets) to display all assets
  const processedCaseFiles = useMemo(() => {
    if (!caseFiles || caseFiles.length === 0) {
      return []
    }

    // Process all case files that have content
    return caseFiles
      .filter(file => file.content && file.content.trim().length > 0)
      .map((file, index) => {
        const content = file.content!
        let fileType = 'UNKNOWN'
        let fileName = file.fileName || `file_${index}`
        
        // Determine file type from fileType field or file extension
        if (file.fileType === 'FINANCIAL_DATA' || file.fileType === 'MARKET_DATASET' || fileName.toLowerCase().endsWith('.csv')) {
          fileType = 'CSV'
        } else if (file.fileType === 'MEMO' || file.fileType === 'INTERNAL_MEMO') {
          fileType = 'MEMO'
        } else if (file.fileType === 'REPORT') {
          fileType = 'REPORT'
        } else if (file.fileType === 'LEGAL_DOCUMENT') {
          fileType = 'LEGAL_DOCUMENT'
        } else if (file.fileType === 'PRESENTATION_DECK') {
          fileType = 'PRESENTATION_DECK'
        } else if (fileName.toLowerCase().endsWith('.json') || content.trim().startsWith('{') || content.trim().startsWith('[')) {
          fileType = 'JSON'
        } else if (fileName.toLowerCase().endsWith('.md') || fileName.toLowerCase().endsWith('.markdown')) {
          fileType = 'MARKDOWN'
        } else {
          // Default to markdown for text content
          fileType = 'MARKDOWN'
        }

        return {
          key: file.fileId || `file_${index}`,
          fileName,
          fileType,
          content,
          originalFileType: file.fileType,
        }
      })
  }, [caseFiles])

  // Process datasets to determine their types and prepare for rendering
  const processedDatasets = useMemo(() => {
    // If datasets is an array (metadata), match with caseFiles
    if (Array.isArray(datasets)) {
      if (!caseFiles || caseFiles.length === 0) {
        return []
      }
      
      // Get all FINANCIAL_DATA files (these are the actual dataset files)
      const financialDataFiles = caseFiles.filter(f => f.fileType === 'FINANCIAL_DATA' || f.fileType === 'MARKET_DATASET')
      
      // Match dataset metadata with caseFiles
      // Strategy: match by order (first dataset with first FINANCIAL_DATA file, etc.)
      // or try to match by name similarity
      return datasets.map((datasetMeta: any, index: number) => {
        const datasetId = datasetMeta.id || datasetMeta.fileId || `dataset_${index}`
        
        // Try to find matching file by name similarity or use index-based matching
        let matchingFile = financialDataFiles.find(f => {
          const fileName = (f.fileName || '').toLowerCase()
          const datasetName = (datasetMeta.name || '').toLowerCase()
          // Check if dataset name keywords appear in filename
          const nameWords = datasetName.split(/\s+/).filter((w: string) => w.length > 3)
          return nameWords.some((word: string) => fileName.includes(word.toLowerCase()))
        })
        
        // If no match by name, use index-based matching
        if (!matchingFile && financialDataFiles[index]) {
          matchingFile = financialDataFiles[index]
        }
        
        // If still no match, try to find any FINANCIAL_DATA file
        if (!matchingFile && financialDataFiles.length > 0) {
          matchingFile = financialDataFiles[0]
        }
        
        if (!matchingFile || !matchingFile.content) {
          return null
        }
        
        const content = matchingFile.content
        let fileType = 'UNKNOWN'
        let fileName = matchingFile.fileName || `${datasetId}.csv`
        
        // Determine type from fileType or content
        if (matchingFile.fileType === 'FINANCIAL_DATA' || matchingFile.fileType === 'MARKET_DATASET' || fileName.toLowerCase().endsWith('.csv')) {
          fileType = 'CSV'
        } else if (fileName.toLowerCase().endsWith('.json') || content.trim().startsWith('{') || content.trim().startsWith('[')) {
          fileType = 'JSON'
        } else {
          fileType = 'MARKDOWN'
        }
        
        return {
          key: datasetId,
          fileName,
          fileType,
          content,
          originalValue: content,
          isObject: fileType === 'JSON',
          metadata: datasetMeta, // Include metadata for DataSheetRenderer
        }
      }).filter(Boolean) as Array<{
        key: string
        fileName: string
        fileType: string
        content: string
        originalValue: string
        isObject: boolean
        metadata?: any
      }>
    }
    
    // Legacy: datasets as object with keys
    if (!datasets || typeof datasets !== 'object') {
      return []
    }

    return Object.entries(datasets).map(([key, value]) => {
      // Determine file type based on content
      let fileType = 'UNKNOWN'
      let content = ''
      let fileName = key

      // Handle different data types
      if (typeof value === 'string') {
        content = value
        // Detect type from content
        if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
          fileType = 'JSON'
          fileName = `${key}.json`
        } else if (value.includes(',') && value.split('\n').length > 1) {
          fileType = 'CSV'
          fileName = `${key}.csv`
        } else {
          fileType = 'MARKDOWN'
          fileName = `${key}.md`
        }
      } else if (typeof value === 'object' && value !== null) {
        // Convert object to JSON string for rendering
        try {
          content = JSON.stringify(value, null, 2)
          fileType = 'JSON'
          fileName = `${key}.json`
        } catch {
          content = String(value)
          fileType = 'TEXT'
          fileName = `${key}.txt`
        }
      } else {
        content = String(value)
        fileType = 'TEXT'
        fileName = `${key}.txt`
      }

      return {
        key,
        fileName,
        fileType,
        content,
        originalValue: value,
        isObject: typeof value === 'object' && value !== null && fileType === 'JSON',
        metadata: undefined,
      }
    })
  }, [datasets, caseFiles])

  // Get icon for file type
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'FINANCIAL_DATA':
      case 'MARKET_DATASET':
      case 'CSV':
        return <Table className="h-4 w-4" />
      case 'MEMO':
      case 'INTERNAL_MEMO':
        return <FileText className="h-4 w-4" />
      case 'REPORT':
        return <Briefcase className="h-4 w-4" />
      case 'LEGAL_DOCUMENT':
        return <Scale className="h-4 w-4" />
      case 'PRESENTATION_DECK':
        return <Presentation className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  // Render a case file
  const renderCaseFile = (file: typeof processedCaseFiles[0]) => {
    const { content, fileType, fileName, originalFileType } = file

    // For CSV files
    if (fileType === 'CSV' || fileName.toLowerCase().endsWith('.csv')) {
      return <CSVRenderer content={content} />
    }

    // For JSON files
    if (fileType === 'JSON' || fileName.toLowerCase().endsWith('.json') || 
        (content.trim().startsWith('{') || content.trim().startsWith('['))) {
      try {
        const parsed = JSON.parse(content)
        return <DataSheetRenderer data={parsed} />
      } catch {
        return <AssetRenderer content={content} fileType={fileType} fileName={fileName} mimeType={null} />
      }
    }

    // For markdown files
    if (fileType === 'MARKDOWN' || fileName.toLowerCase().endsWith('.md') || 
        fileName.toLowerCase().endsWith('.markdown')) {
      return <MarkdownRenderer content={content} />
    }

    // For memos, reports, legal documents, etc. - use markdown renderer if it looks like markdown
    if (fileType === 'MEMO' || fileType === 'REPORT' || fileType === 'LEGAL_DOCUMENT' || fileType === 'PRESENTATION_DECK') {
      // Check if content looks like markdown
      if (content.includes('#') || content.includes('*') || content.includes('[')) {
        return <MarkdownRenderer content={content} />
      }
      // Otherwise use AssetRenderer
      return <AssetRenderer content={content} fileType={fileType} fileName={fileName} mimeType={null} />
    }

    // Default: use AssetRenderer which has smart detection
    return (
      <AssetRenderer
        content={content}
        fileType={fileType}
        fileName={fileName}
        mimeType={null}
      />
    )
  }

  // Determine which renderer to use for each dataset
  const renderDataset = (dataset: typeof processedDatasets[0]) => {
    const { content, fileType, fileName, originalValue, isObject, metadata } = dataset

    // For CSV files, combine metadata with CSV content and use DataSheetRenderer
    // DataSheetRenderer can now parse CSV and combine with metadata
    if (fileType === 'CSV' || fileName.toLowerCase().endsWith('.csv')) {
      // Combine metadata with CSV content
      if (metadata) {
        return <DataSheetRenderer data={{ ...metadata, data: content }} />
      }
      // Fallback to CSVRenderer if no metadata
      return <CSVRenderer content={content} />
    }

    if (fileType === 'JSON' || fileName.toLowerCase().endsWith('.json') || 
        (content.trim().startsWith('{') || content.trim().startsWith('['))) {
      // For JSON, try to parse and combine with metadata if available
      let dataToRender: any = isObject ? originalValue : content
      
      // If we have metadata and the content is a string, try to parse it
      if (typeof content === 'string' && metadata) {
        try {
          const parsed = JSON.parse(content)
          // Combine metadata with parsed data
          dataToRender = {
            ...metadata,
            data: parsed.data || parsed.rows || parsed,
          }
        } catch {
          // If parsing fails, use content as-is
          dataToRender = {
            ...metadata,
            data: content,
          }
        }
      } else if (metadata && typeof originalValue === 'object') {
        // If we have both metadata and object value, combine them
        dataToRender = {
          ...metadata,
          data: originalValue.data || originalValue.rows || originalValue,
        }
      }
      
      return <DataSheetRenderer data={dataToRender} />
    }

    if (fileType === 'MARKDOWN' || fileName.toLowerCase().endsWith('.md') || 
        fileName.toLowerCase().endsWith('.markdown')) {
      return <MarkdownRenderer content={content} />
    }

    // Default: use AssetRenderer which has smart detection
    return (
      <AssetRenderer
        content={content}
        fileType={fileType}
        fileName={fileName}
        mimeType={null}
      />
    )
  }

  const hasBriefing = briefingDoc && briefingDoc.trim().length > 0
  const hasDatasets = processedDatasets.length > 0
  const hasCaseFiles = processedCaseFiles.length > 0

  // If no content at all, show empty state
  if (!hasBriefing && !hasDatasets && !hasCaseFiles) {
    return (
      <div className="h-full flex items-center justify-center bg-white border-r border-gray-200">
        <div className="text-center p-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No briefing documents available</p>
          <p className="text-sm text-gray-500 mt-2">Case materials will appear here when available</p>
        </div>
      </div>
    )
  }

  // Show all assets (briefing + case files + datasets) in tabs
  const totalAssets = (hasBriefing ? 1 : 0) + processedCaseFiles.length + processedDatasets.length

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900">Case Materials</h3>
        <p className="text-sm text-gray-600">Reference materials and data for this scenario</p>
      </div>

      {totalAssets === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No materials available</p>
            <p className="text-sm text-gray-500 mt-2">Case materials will appear here when available</p>
          </div>
        </div>
      ) : totalAssets === 1 ? (
        // Single asset - show directly without tabs
        <div className="flex-1 overflow-y-auto p-6">
          {hasBriefing ? (
            <AssetRenderer
              content={briefingDoc}
              fileType="MARKDOWN"
              fileName="briefing.md"
              mimeType="text/markdown"
            />
          ) : processedCaseFiles.length > 0 ? (
            renderCaseFile(processedCaseFiles[0])
          ) : processedDatasets.length > 0 ? (
            renderDataset(processedDatasets[0])
          ) : null}
        </div>
      ) : (
        // Multiple assets - show in tabs
        <Tabs defaultValue={hasBriefing ? "briefing" : processedCaseFiles.length > 0 ? `file-${processedCaseFiles[0].key}` : `data-0`} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4 !flex !flex-col !inline-flex h-auto w-auto overflow-y-auto">
            {hasBriefing && (
              <TabsTrigger value="briefing" className="gap-2 w-full justify-start">
                <FileText className="h-4 w-4" />
                Briefing Document
              </TabsTrigger>
            )}
            {processedCaseFiles.map((file) => (
              <TabsTrigger key={file.key} value={`file-${file.key}`} className="gap-2 w-full justify-start">
                {getFileIcon(file.originalFileType || file.fileType)}
                {file.fileName}
              </TabsTrigger>
            ))}
            {processedDatasets.map((dataset, index) => {
              const title = dataset.metadata?.name || dataset.metadata?.title || dataset.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              return (
                <TabsTrigger key={dataset.key} value={`data-${index}`} className="gap-2 w-full justify-start">
                  <Table className="h-4 w-4" />
                  {title}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {hasBriefing && (
            <TabsContent value="briefing" className="flex-1 overflow-y-auto p-6 mt-0">
              <AssetRenderer
                content={briefingDoc}
                fileType="MARKDOWN"
                fileName="briefing.md"
                mimeType="text/markdown"
              />
            </TabsContent>
          )}

          {processedCaseFiles.map((file) => (
            <TabsContent key={file.key} value={`file-${file.key}`} className="flex-1 overflow-y-auto p-6 mt-0">
              {renderCaseFile(file)}
            </TabsContent>
          ))}

          {processedDatasets.map((dataset, index) => (
            <TabsContent key={dataset.key} value={`data-${index}`} className="flex-1 overflow-y-auto p-6 mt-0">
              {renderDataset(dataset)}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

