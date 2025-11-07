'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LoadingSkeleton from '@/components/ui/loading-skeleton'
import MarkdownRenderer from '@/components/ui/markdown-renderer'
import SlidesRenderer from '@/components/admin/renderers/SlidesRenderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCaseFile } from '@/hooks/useCaseFile'
import { AlertCircle, Building2, FileText, TrendingUp } from 'lucide-react'
import Papa from 'papaparse'

interface CaseDataViewerProps {
  fileIds: string[]
  className?: string
}

export default function CaseDataViewer({ fileIds, className = '' }: CaseDataViewerProps) {
  const fileData = fileIds.map(fileId => useCaseFile(fileId))

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
          <LoadingSkeleton className="h-32 w-full" />
        </div>
      )
    }

    if (file.error) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-none">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-900">Error Loading File</span>
          </div>
          <p className="text-xs text-red-700">{file.error}</p>
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

    // Handle PRESENTATION_DECK (Marp slides)
    if (file.fileType === 'PRESENTATION_DECK' && typeof file.content === 'string') {
      return <SlidesRenderer content={file.content} />
    }

    // Handle text content (memos, reports)
    if (typeof file.content === 'string') {
      return (
        <div className="prose prose-neutral max-w-none">
          <MarkdownRenderer content={file.content} />
        </div>
      )
    }

    return <div>Unsupported content type</div>
  }

  if (fileData.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
          <p className="text-neutral-500">No case files available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Case Materials
        </CardTitle>
        <CardDescription>
          Review all available data before making your decision
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={fileData[0]?.fileId} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {fileData.map((file) => (
              <TabsTrigger
                key={file.fileId}
                value={file.fileId}
                className="flex items-center gap-1 text-xs"
              >
                {getFileIcon(file.fileType)}
                <span className="truncate">{file.fileName.split('.')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {fileData.map((file) => (
            <TabsContent key={file.fileId} value={file.fileId} className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getFileIcon(file.fileType)}
                    {file.fileName}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {file.fileType.replace('_', ' ').toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderFileContent(file)}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
