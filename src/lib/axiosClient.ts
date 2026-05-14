import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios'
import { config } from './config'

const REQUEST_TIMEOUT = 30000

type ErrorPayload = {
  message?: string
  error?: string
  errors?: unknown
  data?: {
    message?: string
    error?: string
  }
}

export class ApiError extends Error {
  status?: number
  code?: string
  details?: unknown

  constructor(message: string, options: { status?: number; code?: string; details?: unknown } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.details = options.details
  }
}

const getPayloadMessage = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return ''

  const data = payload as ErrorPayload
  return data.message || data.error || data.data?.message || data.data?.error || ''
}

export const axiosClient = axios.create({
  baseURL: config.invoiceHubUrl || undefined,
  timeout: REQUEST_TIMEOUT,
  headers: {
    Accept: 'application/json',
  },
})

axiosClient.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  request.baseURL = request.baseURL || config.invoiceHubUrl || undefined

  const headers = AxiosHeaders.from(request.headers)
  headers.set('Accept', headers.get('Accept') || 'application/json')

  if (request.data instanceof FormData) {
    headers.delete('Content-Type')
  }

  request.headers = headers
  return request
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorPayload>) => {
    const status = error.response?.status
    const payload = error.response?.data
    const message =
      getPayloadMessage(payload) ||
      (status ? `Request failed with status ${status}` : error.message || 'Network error')

    return Promise.reject(
      new ApiError(message, {
        status,
        code: error.code,
        details: payload,
      })
    )
  }
)

export const getApiErrorStatus = (error: unknown) =>
  error instanceof ApiError ? error.status : axios.isAxiosError(error) ? error.response?.status : undefined

export const getApiErrorMessage = (error: unknown, fallback = 'Có lỗi xảy ra') =>
  error instanceof Error ? error.message : fallback
