'use client'

import StructuredCaseDisplay from '@/components/simulation/StructuredCaseDisplay'
import MarkdownRenderer from '@/components/ui/markdown-renderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { parseCaseBriefing } from '@/lib/parse-case-template'
import { FileText, Table, Users } from 'lucide-react'

interface CaseFileViewerProps {
  briefingDoc: string
  datasets?: Record<string, any>
}

export default function CaseFileViewer({ briefingDoc, datasets }: CaseFileViewerProps) {
  const datasetEntries = datasets ? Object.entries(datasets) : []
  const caseStructure = parseCaseBriefing(briefingDoc)

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900">Briefing Documents</h3>
        <p className="text-sm text-gray-600">Reference materials for this scenario</p>
      </div>

      <Tabs defaultValue="structured" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="structured" className="gap-2">
            <Users className="h-4 w-4" />
            Case Overview
          </TabsTrigger>
          <TabsTrigger value="briefing" className="gap-2">
            <FileText className="h-4 w-4" />
            Raw Document
          </TabsTrigger>
          {datasetEntries.length > 0 && (
            <TabsTrigger value="data" className="gap-2">
              <Table className="h-4 w-4" />
              Financial Data
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="structured" className="flex-1 overflow-y-auto p-6 mt-0">
          {caseStructure ? (
            <StructuredCaseDisplay caseStructure={caseStructure} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">Case structure not recognized</p>
              <p className="text-sm mt-2">This case doesn't follow the standard template</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="briefing" className="flex-1 overflow-y-auto p-6 mt-0">
          <MarkdownRenderer content={briefingDoc} />
        </TabsContent>

        {datasetEntries.length > 0 && (
          <TabsContent value="data" className="flex-1 overflow-y-auto p-6 mt-0">
            <JSONDataViewer data={datasets!} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function JSONDataViewer({ data }: { data: Record<string, any> }) {
  return (
    <div className="space-y-6">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900 capitalize">
              {key.replace(/_/g, ' ')}
            </h4>
          </div>
          <div className="p-4">
            {typeof value === 'object' ? (
              <pre className="bg-gray-50 p-4 text-xs overflow-x-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-gray-700">{String(value)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

