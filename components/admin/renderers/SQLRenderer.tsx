'use client'

import { useMemo } from 'react'

interface SQLRendererProps {
  content: string
}

interface TableRow {
  [key: string]: any
}

export default function SQLRenderer({ content }: SQLRendererProps) {
  const extractedData = useMemo(() => {
    try {
      // Try to extract data from INSERT statements
      const insertRegex = /INSERT\s+INTO\s+\w+\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi
      const matches = [...content.matchAll(insertRegex)]
      
      if (matches.length > 0) {
        const columns = matches[0][1].split(',').map(c => c.trim().replace(/`/g, '').replace(/"/g, ''))
        const rows: TableRow[] = matches.map(match => {
          const values = match[2].split(',').map(v => {
            const trimmed = v.trim()
            // Remove quotes and handle null
            if (trimmed === 'NULL' || trimmed === 'null') return null
            return trimmed.replace(/^['"]|['"]$/g, '')
          })
          
          const row: TableRow = {}
          columns.forEach((col, idx) => {
            row[col] = values[idx]
          })
          return row
        })
        
        return { columns, rows }
      }

      // Try to extract from SELECT-like data structures
      const selectMatch = content.match(/SELECT\s+(.+?)\s+FROM/i)
      if (selectMatch) {
        // For now, return null and show as table if we can parse it differently
        return null
      }

      return null
    } catch {
      return null
    }
  }, [content])

  if (extractedData && extractedData.columns && extractedData.rows) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Data Table</h3>
          <span className="text-sm text-gray-500">{extractedData.rows.length} rows</span>
        </div>
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto border rounded-lg">
          <table className="min-w-full border-collapse border border-gray-300 text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {extractedData.columns.map((col, idx) => (
                  <th key={idx} className="border border-gray-300 px-4 py-2 text-left font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {extractedData.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {extractedData.columns.map((col, colIdx) => (
                    <td key={colIdx} className="border border-gray-300 px-4 py-2">
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-gray-400">NULL</span>}
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

  // Fallback: Show SQL as formatted code
  return (
    <div className="bg-gray-50 border rounded-lg p-4">
      <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
        {content}
      </pre>
    </div>
  )
}


