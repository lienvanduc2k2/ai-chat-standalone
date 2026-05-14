import QRCode from 'qrcode'
import { axiosClient, getApiErrorMessage, getApiErrorStatus } from './axiosClient'
import { config, requireInvoiceHubUrl } from './config'

export interface HubPackage {
  id: string
  name: string
  price: number
  qtyLabel: string
}

export interface RawPackage {
  code: string
  name: string
  price: number
  limit?: number
  duration?: { value: number; unit: string }
  isBonusPackage?: boolean
}

export interface CompanyLookup {
  companyName: string
  companyAddress: string
  companyTaxAuthority: string
  representativeName?: string
  representativePhone?: string
}

export interface PackageData {
  invoicePackages: HubPackage[]
  signaturePackages: HubPackage[]
  baseFeeItem: RawPackage | null
  promotions: Array<{ code: string; desc: string; conditionPackageCodes: string[] }>
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export async function lookupCompanyByTaxCode(taxCode: string): Promise<CompanyLookup> {
  requireInvoiceHubUrl()
  let data
  try {
    const response = await axiosClient.get('/tax-code', { params: { tax: taxCode } })
    data = response.data
  } catch (error) {
    throw new Error(`Tra cứu MST thất bại (${getApiErrorStatus(error) || 'network'}): ${getApiErrorMessage(error)}`)
  }
  if (data?.success && data?.ten_cty) {
    return {
      companyName: data.ten_cty,
      companyAddress: data.dia_chi || '',
      companyTaxAuthority: data.cqthue_ql || '',
    }
  }
  throw new Error('Không tìm thấy thông tin doanh nghiệp từ MST này')
}

export async function fetchCompanyEnrichment(taxCode: string, companyName: string) {
  requireInvoiceHubUrl()
  let data
  try {
    const response = await axiosClient.get('/core-api/onboarding-assistant/company-enrichment', {
      params: { taxCode, companyName },
    })
    data = response.data
  } catch (error) {
    throw new Error(`Không tải được dữ liệu bổ sung doanh nghiệp (${getApiErrorStatus(error) || 'network'}): ${getApiErrorMessage(error)}`)
  }
  return data?.data || data
}

export async function fetchAssistantChat(message: string, step: string, history: ChatHistoryItem[]) {
  requireInvoiceHubUrl()
  let data
  try {
    const response = await axiosClient.post('/core-api/onboarding-assistant/ai-chat', { message, step, history })
    data = response.data
  } catch (error) {
    throw new Error(`AI chat thất bại (${getApiErrorStatus(error) || 'network'}): ${getApiErrorMessage(error)}`)
  }
  return data?.response || data?.data?.response || data?.message || ''
}

export async function fetchPackageData(isCashRegister: boolean = false): Promise<PackageData> {
  requireInvoiceHubUrl()
  let initialData
  let serviceData
  let sigData
  try {
    const [initialRes, serviceRes, sigRes] = await Promise.all([
      axiosClient.get('/core-api/packages', {
        params: {
          isActive: true,
          type: 'initial_fee',
          bank: config.bankCode,
          provider: config.providerCode,
        },
      }),
      axiosClient.get('/core-api/packages', {
        params: {
          isActive: true,
          type: 'service',
          bank: config.bankCode,
          limit: 99,
          provider: config.providerCode,
          isCashRegister,
        },
      }),
      axiosClient.get('/core-api/packages', {
        params: {
          isActive: true,
          type: 'signature',
          bank: config.bankCode,
          limit: 99,
          provider: config.providerCode,
        },
      }),
    ])
    initialData = initialRes.data
    serviceData = serviceRes.data
    sigData = sigRes.data
  } catch {
    throw new Error('Không tải được danh sách gói dịch vụ')
  }

  const invoicePackages = ((serviceData.data || []) as RawPackage[]).map((pkg) => ({
    id: pkg.code,
    name: pkg.name,
    price: pkg.price * (pkg.limit || 1),
    qtyLabel: `${new Intl.NumberFormat('vi-VN').format(pkg.limit || 1)} hóa đơn`,
  }))
  const signaturePackages = ((sigData.data || []) as RawPackage[])
    .filter((pkg) => !pkg.isBonusPackage)
    .map((pkg) => ({
      id: pkg.code,
      name: pkg.name,
      price: pkg.price * (pkg.limit || 1),
      qtyLabel: pkg.duration
        ? `${pkg.duration.value} ${pkg.duration.unit === 'year' ? 'năm' : 'tháng'}`
        : 'Chữ ký số',
    }))

  return {
    invoicePackages,
    signaturePackages,
    baseFeeItem: initialData.data?.[0] || null,
    promotions: [],
  }
}

export async function createDraftOrder(payload: FormData) {
  requireInvoiceHubUrl()
  try {
    const response = await axiosClient.post('/core-api/orders/quick-draft', payload)
    return response.data
  } catch (error) {
    throw new Error(`Tạo đơn thất bại (${getApiErrorStatus(error) || 'network'}): ${getApiErrorMessage(error)}`)
  }
}

export async function generatePaymentQr(orderId: string, amount: number) {
  void amount
  requireInvoiceHubUrl()
  const response = await axiosClient.post(`/core-api/orders/${orderId}/gen-qr`)
  const data = response.data
  if (!data?.qrString) throw new Error('Không thể tạo mã QR')
  return QRCode.toDataURL(data.qrString, { width: 245, margin: 1 })
}

export async function checkPaymentStatus(orderId: string) {
  requireInvoiceHubUrl()
  let data
  try {
    const response = await axiosClient.get(`/core-api/orders/${orderId}/status`)
    data = response.data
  } catch {
    throw new Error('Không kiểm tra được trạng thái thanh toán')
  }
  return data?.paymentStatus || data?.status || data?.data?.paymentStatus || data?.data?.status
}

export async function submitRegistration(orderId: string, payload: FormData) {
  requireInvoiceHubUrl()
  try {
    const response = await axiosClient.post(`/core-api/orders/${orderId}/registration`, payload, {
      headers: { accept: '*/*' },
    })
    return response.data
  } catch (error) {
    throw new Error(`Gửi hồ sơ thất bại (${getApiErrorStatus(error) || 'network'}): ${getApiErrorMessage(error)}`)
  }
}
