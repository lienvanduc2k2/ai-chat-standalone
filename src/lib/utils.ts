export function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.max(0, value || 0))
}

export function isFromCashRegister(serialNumber: string) {
  return serialNumber.toUpperCase().includes('MYY')
}

export function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}
