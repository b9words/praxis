import { cache, CacheTags } from '@/lib/cache'
import { getAuditLogs } from '@/lib/admin/audit-log'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminAuditLogPage() {
  // Cache audit log (5 minutes revalidate)
  const getCachedAuditLogs = cache(
    async () => {
      const auditLogs = await getAuditLogs({ limit: 100 })
      return auditLogs
    },
    ['admin', 'system', 'audit-log'],
    {
      tags: [CacheTags.ADMIN, CacheTags.SYSTEM],
      revalidate: 300, // 5 minutes
    }
  )
  
  const auditLogs = await getCachedAuditLogs()

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Audit Log</h1>
        <p className="text-sm text-gray-600">View all admin actions and changes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
          <CardDescription>
            {auditLogs.length > 0
              ? `${auditLogs.length} actions logged`
              : 'Audit logging will appear here once the audit_log table is created in the database'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {auditLogs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-500 mb-4">
                Audit logging is ready but requires an audit_log table in the database.
              </p>
              <p className="text-xs text-gray-400">
                Admin actions are currently logged to the console. Create the audit_log table to enable full audit trail.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Changes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user?.username || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">{log.action}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.resourceType}: {log.resourceId?.slice(0, 8) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <pre className="text-xs">
                          {JSON.stringify(log.changes || {}, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

