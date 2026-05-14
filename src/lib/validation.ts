export function validateVietnamTaxCode(value: string) {
  const normalized = value.replace(/[^\d]/g, '')
  const valid = [10, 12, 13].includes(normalized.length)
  return { valid, normalized }
}

export function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function validatePhone(value: string) {
  const normalized = value.replace(/[\s.-]/g, '')
  return /^(0|\+84)\d{9,10}$/.test(normalized)
}

export function validateVNName(value: string) {
  const trimmed = value.trim()
  return trimmed.length >= 2 && /^[\p{L}\s'.-]+$/u.test(trimmed)
}
