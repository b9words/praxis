'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import MarkdownRenderer from '@/components/ui/markdown-renderer'
import { useCaseFile } from '@/hooks/useCaseFile'
import { AlertCircle, Building2, FileText, Loader2, TrendingUp } from 'lucide-react'
import Papa from 'papaparse'
import { useState } from 'react'

interface DocumentViewerBlockProps {
  blockId: string
  title?: string
  fileIds: string[]
  defaultFileId?: string
  showTabs?: boolean
}

export default function DocumentViewerBlock({
  blockId,
  title = 'Case Documents',
  fileIds,
  defaultFileId,
  showTabs = true
}: DocumentViewerBlockProps) {
  const fileData = fileIds.map(fileId => useCaseFile(fileId))
  const [selectedFileId, setSelectedFileId] = useState<string>(defaultFileId || fileIds[0] || '')
  const selectedFile = fileData.find(f => f.fileId === selectedFileId) || fileData[0]

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'FINANCIAL_DATA':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'MEMO':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'REPORT':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'PRESENTATION_DECK':
        return <Building2 className="h-4 w-4 text-purple-600" />
      default:
        return <FileText className="h-4 w-4 text-neutral-600" />
    }
  }

  const renderFileContent = (file: any) => {
    if (file.isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-neutral-600">Loading document...</span>
        </div>
      )
    }

    if (file.error) {
      return (
        <div className="text-red-600 p-4 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Error Loading Document</span>
          </div>
          <p className="text-sm">{file.error}</p>
        </div>
      )
    }

    // Handle CSV data (financial data)
    if (file.fileType === 'FINANCIAL_DATA') {
      let data: any[] = []
      
      // If content is already parsed array, use it
      if (Array.isArray(file.content)) {
        data = file.content
      }
      // If content is CSV string, parse it
      else if (typeof file.content === 'string') {
        try {
          const parsed = Papa.parse(file.content, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim()
          })
          data = parsed.data as any[]
        } catch (parseError) {
          return (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error Parsing CSV</span>
              </div>
              <p className="text-sm">{String(parseError)}</p>
            </div>
          )
        }
      }
      
      if (data.length === 0) {
        return <div className="text-neutral-500 p-4">No data available</div>
      }

      const headers = Object.keys(data[0] || {})
      
      if (headers.length === 0) {
        return <div className="text-neutral-500 p-4">No columns found in data</div>
      }
      
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-neutral-300 text-sm">
            <thead>
              <tr className="bg-neutral-100">
                {headers.map((header) => (
                  <th key={header} className="border border-neutral-300 px-3 py-2 text-left font-medium text-neutral-900 whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                  {headers.map((header) => (
                    <td key={header} className="border border-neutral-300 px-3 py-2 text-neutral-800">
                      {row[header] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    // Handle text content (memos, reports, presentations)
    if (typeof file.content === 'string') {
      return (
        <div className="prose prose-neutral max-w-none">
          <MarkdownRenderer content={file.content} />
        </div>
      )
    }

    return <div className="text-neutral-500 p-4">Unsupported content type</div>
  }

  if (fileData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
          <p className="text-neutral-500">No documents available</p>
        </CardContent>
      </Card>
    )
  }

  // Single file view
  if (fileData.length === 1 || !showTabs) {
    const file = fileData[0]
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getFileIcon(file.fileType)}
            {title}
          </CardTitle>
          <CardDescription>
            {file.fileName} • {file.fileType.replace('_', ' ').toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderFileContent(file)}
        </CardContent>
      </Card>
    )
  }

  // Multi-file sidebar view
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Review all case materials before making your decision
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex border-t h-96">
          {/* Sidebar: File List */}
          <div className="w-64 border-r bg-neutral-50 flex-shrink-0 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <div className="p-2 space-y-1">
                {fileData.map((file) => {
                  const isSelected = file.fileId === selectedFileId
                  return (
                    <button
                      key={file.fileId}
                      onClick={() => setSelectedFileId(file.fileId)}
                      className={`w-full flex items-start gap-2 p-2 rounded text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border border-blue-200 text-blue-900'
                          : 'hover:bg-neutral-100 text-neutral-700 border border-transparent'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getFileIcon(file.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium break-words ${
                          isSelected ? 'text-blue-900' : 'text-neutral-900'
                        }`}>
                          {file.fileName.split('.')[0]}
                        </div>
                        <div className={`text-xs mt-0.5 ${
                          isSelected ? 'text-blue-600' : 'text-neutral-500'
                        }`}>
                          {file.fileType.replace('_', ' ').toLowerCase()}
                        </div>
                        {file.isLoading && (
                          <div className="flex items-center gap-1 mt-1">
                            <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />
                            <span className="text-xs text-neutral-400">Loading...</span>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {selectedFile && (
              <>
                <div className="border-b bg-white px-6 py-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {getFileIcon(selectedFile.fileType)}
                    <div>
                      <h3 className="font-medium text-neutral-900">{selectedFile.fileName}</h3>
                      <p className="text-xs text-neutral-500">
                        {selectedFile.fileType.replace('_', ' ').toLowerCase()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  <div className="p-6">
                    {renderFileContent(selectedFile)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
