/**
 * Simple API client wrapper for React Query
 * Passes signal for cancellation, handles JSON parsing and errors
 */
export async function fetchJson<T = any>(
  path: string,
  options?: {
    method?: string
    body?: any
    signal?: AbortSignal
    headers?: Record<string, string>
  }
): Promise<T> {
  const { method = 'GET', body, signal, headers = {} } = options || {}

  // Handle FormData separately (for file uploads)
  const isFormData = body instanceof FormData
  const requestHeaders: HeadersInit = isFormData
    ? { ...headers } // Don't set Content-Type for FormData, browser sets it with boundary
    : {
        'Content-Type': 'application/json',
        ...headers,
      }

  const response = await fetch(path, {
    method,
    headers: requestHeaders,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    signal,
  })

  if (!response.ok) {
    let errorData: any = { message: 'An unknown error occurred' }
    try {
      errorData = await response.json()
    } catch (e) {
      // If response is not JSON, use status text
      errorData.message = response.statusText
    }
    throw new Error(errorData.error || errorData.message || response.statusText)
  }

  // Handle empty responses
  const text = await response.text()
  if (!text) {
    return {} as T
  }

  try {
    return JSON.parse(text) as T
  } catch (e) {
    throw new Error('Invalid JSON response')
  }
}
