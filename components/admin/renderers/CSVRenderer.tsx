'use client'

import { useMemo } from 'react'

interface CSVRendererProps {
  content: string
}

export default function CSVRenderer({ content }: CSVRendererProps) {
  const parsedData = useMemo(() => {
    try {
      const lines = content.trim().split('\n').filter(line => line.trim())
      if (lines.length === 0) {
        return null
      }

      // Improved CSV parsing that handles quoted fields and escaped quotes
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          const nextChar = line[i + 1]
          
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Escaped quote
              current += '"'
              i++ // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes
            }
          } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        // Push last field
        result.push(current.trim())
        return result
      }

      const headers = parseCSVLine(lines[0])
      const rows = lines.slice(1).map(line => parseCSVLine(line))

      return { headers, rows }
    } catch (e) {
      return null
    }
  }, [content])

  if (!parsedData) {
    const lines = content.trim().split('\n').slice(0, 5)
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm space-y-3">
        <div>
          <p className="font-semibold mb-1">Could not parse CSV data</p>
          <p className="text-xs text-red-600">The content may not be valid CSV format.</p>
        </div>
        {lines.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs cursor-pointer hover:text-red-800">Show first 5 lines</summary>
            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
              {lines.join('\n')}
            </pre>
          </details>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Financial Data</h3>
        <span className="text-sm text-gray-500">{parsedData.rows.length} rows</span>
      </div>
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto border rounded-lg">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              {parsedData.headers.map((header, idx) => (
                <th key={idx} className="border border-gray-300 px-4 py-2 text-left font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsedData.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {parsedData.headers.map((_, colIdx) => (
                  <td key={colIdx} className="border border-gray-300 px-4 py-2">
                    {row[colIdx] || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

