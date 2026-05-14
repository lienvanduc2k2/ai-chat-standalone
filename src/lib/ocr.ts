import { config, requireInvoiceHubUrl, withBasePath } from './config'

export interface IdCardData {
  fullName?: string
  dob?: string
  gender?: string
  cccd?: string
  address?: string
}

export interface OcrResult {
  isValid: boolean
  data?: IdCardData
  error?: string
}

interface SdkResponse {
  data?: Record<string, unknown>
  message?: string
  status?: string
}

let ocrModelInitPromise: Promise<unknown> | null = null
let ocrSdkScriptPromise: Promise<void> | null = null

function getOcrEnv() {
  return config.invoiceHubUrl.includes('invoice-hub.atomsolution.vn') && !config.invoiceHubUrl.includes('stag-')
    ? 'prod'
    : 'stag'
}

function ensureOcrModel() {
  if (!ocrModelInitPromise) {
    ocrModelInitPromise = loadOcrSdk().then(() => {
      const sdk = window.IdExtractionQR
      if (!sdk) throw new Error('OCR SDK chưa sẵn sàng.')
      return sdk.initModel(getOcrEnv(), requireInvoiceHubUrl())
    })
  }
  return ocrModelInitPromise
}

function loadOcrSdk() {
  if (window.IdExtractionQR) return Promise.resolve()
  if (ocrSdkScriptPromise) return ocrSdkScriptPromise

  ocrSdkScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = withBasePath('/scripts/ocr-sdk.js')
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      ocrSdkScriptPromise = null
      reject(new Error(`Không tải được OCR SDK từ ${script.src}.`))
    }
    document.head.appendChild(script)
  })

  return ocrSdkScriptPromise
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Không đọc được ảnh CCCD.'))
    }
    image.src = objectUrl
  })
}

function parseSdkResponse(value: string): SdkResponse {
  try {
    return JSON.parse(value) as SdkResponse
  } catch {
    return { status: 'error', message: 'OCR trả về dữ liệu không hợp lệ.' }
  }
}

function getStringCandidate(sources: unknown[], fallback = '') {
  for (const source of sources) {
    if (typeof source === 'string' && source.trim()) return source.trim()
  }
  return fallback
}

function toDisplayDob(value: string) {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function normalizeGender(value: string) {
  const normalized = value.toLowerCase()
  if (['male', 'nam', 'm'].includes(normalized)) return 'Nam'
  if (['female', 'nu', 'nữ', 'f'].includes(normalized)) return 'Nữ'
  return ''
}

function toIdCardData(payload: Record<string, unknown>): IdCardData {
  return {
    address: getStringCandidate([
      payload.address,
      payload.permanentAddress,
      payload.addressDetail,
      payload.home,
      payload.queQuan,
    ]),
    dob: toDisplayDob(getStringCandidate([
      payload.dob,
      payload.birthDate,
      payload.dateOfBirth,
      payload.date_of_birth,
    ])),
    gender: normalizeGender(getStringCandidate([payload.gender, payload.sex])),
    cccd: getStringCandidate([
      payload.id,
      payload.idNumber,
      payload.identityNumber,
      payload.cccd,
      payload.id_number,
    ]),
    fullName: getStringCandidate([payload.name, payload.fullName, payload.full_name]),
  }
}

export async function extractIdCardInfo(file: File): Promise<OcrResult> {
  try {
    await ensureOcrModel()
    const sdk = window.IdExtractionQR
    if (!sdk) throw new Error('OCR SDK chưa sẵn sàng.')

    const image = await loadImageFromFile(file)
    const sideResponse = parseSdkResponse(await sdk.checkImageSide(image))
    if (!sideResponse.data?.isFront) {
      return { isValid: false, error: 'Ảnh tải lên không phải mặt trước CCCD.' }
    }

    const qrResponse = parseSdkResponse(await sdk.detectQR(image))
    if (qrResponse.status !== 'success' || !qrResponse.data) {
      return { isValid: false, error: qrResponse.message || 'Không đọc được QR trên CCCD.' }
    }

    return { isValid: true, data: toIdCardData(qrResponse.data) }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'OCR CCCD thất bại.',
    }
  }
}
