export const config = {
  invoiceHubUrl: process.env.NEXT_PUBLIC_INVOICE_HUB_URL || '',
  providerCode: process.env.NEXT_PUBLIC_INVOICE_HUB_PROVIDER_CODE || 'one-invoice',
  bankCode: process.env.NEXT_PUBLIC_INVOICE_HUB_BANK_CODE || '',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
}

export function requireInvoiceHubUrl() {
  if (!config.invoiceHubUrl) throw new Error('Chưa cấu hình NEXT_PUBLIC_INVOICE_HUB_URL')
  return config.invoiceHubUrl
}

export function withBasePath(path: string) {
  return `${config.basePath}${path.startsWith('/') ? path : `/${path}`}`
}
