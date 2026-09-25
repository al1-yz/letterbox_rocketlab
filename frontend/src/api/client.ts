// Único ponto de acesso HTTP do front. Em desenvolvimento, /api é repassado
// ao FastAPI pelo proxy do Vite (vite.config.ts).
const BASE_URL = '/api/v1'

interface ValidationIssue {
  loc: (string | number)[]
  msg: string
}

function isValidationIssue(value: unknown): value is ValidationIssue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'loc' in value &&
    Array.isArray(value.loc) &&
    'msg' in value &&
    typeof value.msg === 'string'
  )
}

export class ApiError extends Error {
  readonly status: number
  readonly detail: unknown

  constructor(status: number, detail: unknown) {
    super(typeof detail === 'string' ? detail : `A API respondeu com erro ${status}.`)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }

  /** Erros 422 do corpo agrupados por campo, para exibir ao lado de cada input. */
  fieldErrors(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!Array.isArray(this.detail)) return errors
    for (const issue of this.detail) {
      if (isValidationIssue(issue) && issue.loc[0] === 'body') {
        const field = String(issue.loc[1])
        errors[field] ??= issue.msg
      }
    }
    return errors
  }
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}

async function readDetail(response: Response): Promise<unknown> {
  try {
    const body: unknown = await response.json()
    return typeof body === 'object' && body !== null && 'detail' in body ? body.detail : null
  } catch {
    return null
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar à API. O backend está rodando?')
  }
  if (!response.ok) {
    throw new ApiError(response.status, await readDetail(response))
  }
  // 204 (remoção) não tem corpo.
  return (response.status === 204 ? undefined : await response.json()) as T
}