'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import OrgChartRenderer from './OrgChartRenderer'
import StakeholderRenderer from './StakeholderRenderer'
import DataChartRenderer from './DataChartRenderer'
import DataSheetRenderer from './DataSheetRenderer'
import MarkdownRenderer from '@/components/ui/Markdown'
import SQLRenderer from './SQLRenderer'
import CSVRenderer from './CSVRenderer'
import SlidesRenderer from './SlidesRenderer'
import MarpRenderer from './MarpRenderer'
import { AlertCircle } from 'lucide-react'

interface AssetRendererProps {
  content: string
  fileType: string
  fileName: string
  mimeType?: string | null
}

interface AssetRendererState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class AssetRendererErrorBoundary extends Component<
  { children: ReactNode; fileName: string; fileType: string },
  AssetRendererState
> {
  constructor(props: { children: ReactNode; fileName: string; fileType: string }) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<AssetRendererState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AssetRenderer] Error rendering asset:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-900 mb-1">Error Rendering Asset</p>
              <p className="text-sm text-red-700 mb-2">
                Failed to render {this.props.fileName} ({this.props.fileType})
              </p>
              {this.state.error && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack && (
                      <div className="mt-2 pt-2 border-t border-red-300">
                        {this.state.errorInfo.componentStack}
                      </div>
                    )}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function AssetRenderer({ content, fileType, fileName, mimeType }: AssetRendererProps) {
  // Handle empty or invalid content
  if (content === null || content === undefined) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-900 mb-1">Invalid Content</p>
            <p className="text-sm text-red-700">
              {fileName} has null or undefined content. This is a data error.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (typeof content !== 'string') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-900 mb-1">Invalid Content Type</p>
            <p className="text-sm text-red-700">
              {fileName} content is not a string (type: {typeof content}). Expected string content.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (content.trim().length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-yellow-900 mb-1">Empty Content</p>
            <p className="text-sm text-yellow-700">
              {fileName} has no content to display. The asset may need to be generated.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Simple router: pass raw content string to specialized renderers
  // Renderers are responsible for parsing and handling their own data structures
  const renderContent = () => {
    switch (fileType) {
      case 'ORG_CHART':
        return <OrgChartRenderer content={content} />

      case 'STAKEHOLDER_PROFILES':
        return <StakeholderRenderer content={content} />

      case 'MARKET_DATASET':
        return <DataChartRenderer content={content} />

      case 'FINANCIAL_DATA':
        return <CSVRenderer content={content} />

      case 'PRESS_RELEASE':
      case 'INTERNAL_MEMO':
      case 'REPORT':
      case 'MEMO':
      case 'LEGAL_DOCUMENT':
        return <MarkdownRenderer content={content} />

    case 'PRESENTATION_DECK': {
      // Check for fallback flag - if enabled, use SlidesRenderer instead of MarpRenderer
      const fallbackToMarkdown = process.env.NEXT_PUBLIC_ASSET_RENDER_FALLBACK === 'markdown'
      if (fallbackToMarkdown) {
        // Try to detect if it's valid Marp format
        const hasFrontmatter = /^---\s*\n[\s\S]*?\n---\s*\n/.test(content.trim())
        const hasSeparators = content.includes('\n---\n')
        
        // If missing both, render as markdown instead
        if (!hasFrontmatter && !hasSeparators) {
          return <MarkdownRenderer content={content} />
        }
        // Otherwise use SlidesRenderer as fallback
        return <SlidesRenderer content={content} />
      }
      // Default: use MarpRenderer for full Marp support
      return <MarpRenderer content={content} />
    }

      default: {
        // Fallback: Try to detect based on file extension or content
        const isCSV = fileName.toLowerCase().endsWith('.csv') || mimeType?.includes('csv')
        const isSQL = fileName.toLowerCase().endsWith('.sql') || 
          mimeType?.includes('sql') ||
          (content.trim().toUpperCase().startsWith('SELECT') || 
           content.trim().toUpperCase().startsWith('INSERT') ||
           content.trim().toUpperCase().startsWith('CREATE'))
        const isMarkdown = fileName.toLowerCase().endsWith('.md') ||
          fileName.toLowerCase().endsWith('.markdown') ||
          mimeType?.includes('markdown')
        const isText = fileName.toLowerCase().endsWith('.txt') ||
          mimeType?.includes('text/plain')
        const isJSON = content.trim().startsWith('{') || content.trim().startsWith('[')

        if (isCSV) {
          return <CSVRenderer content={content} />
        }

        if (isSQL) {
          return <SQLRenderer content={content} />
        }

        if (isMarkdown || isText) {
          return <MarkdownRenderer content={content} />
        }

        // For JSON files without explicit fileType, use DataSheetRenderer
        if (isJSON) {
          return <DataSheetRenderer data={content} />
        }

        // Final fallback: Formatted text
        return (
          <div className="bg-gray-50 border rounded-lg p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto max-h-[60vh] overflow-y-auto">
              {content}
            </pre>
          </div>
        )
      }
    }
  }

  return (
    <AssetRendererErrorBoundary fileName={fileName} fileType={fileType}>
      {renderContent()}
    </AssetRendererErrorBoundary>
  )
}
