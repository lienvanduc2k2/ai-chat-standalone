const AUTHORITIES = [
  'Chi cục Thuế khu vực Quận 1',
  'Chi cục Thuế khu vực Quận 7',
  'Chi cục Thuế thành phố Thủ Đức',
  'Cục Thuế Thành phố Hồ Chí Minh',
  'Cục Thuế Thành phố Hà Nội',
]

export function findTaxAuthority(address = '', fallback = '') {
  if (fallback) return fallback
  const lower = address.toLowerCase()
  if (lower.includes('hồ chí minh') || lower.includes('hcm')) {
    if (lower.includes('quận 7')) return 'Chi cục Thuế khu vực Quận 7'
    if (lower.includes('quận 1')) return 'Chi cục Thuế khu vực Quận 1'
    return 'Cục Thuế Thành phố Hồ Chí Minh'
  }
  if (lower.includes('hà nội')) return 'Cục Thuế Thành phố Hà Nội'
  return AUTHORITIES[0]
}

export function searchTaxAuthority(value = '') {
  return value || AUTHORITIES[0]
}
