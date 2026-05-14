'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  checkPaymentStatus,
  createDraftOrder,
  fetchAssistantChat,
  fetchCompanyEnrichment,
  generatePaymentQr,
  HubPackage,
  lookupCompanyByTaxCode,
  RawPackage,
  submitRegistration,
} from '@/lib/api'
import { extractIdCardInfo } from '@/lib/ocr'
import { findTaxAuthority, searchTaxAuthority } from '@/lib/taxAuthority'
import { formatCurrency, isFromCashRegister } from '@/lib/utils'
import {
  validateEmail,
  validatePhone,
  validateVietnamTaxCode,
  validateVNName,
} from '@/lib/validation'
import { config } from '@/lib/config'
import { useOnboarding } from '@/context/OnboardingContext'

export enum FullChatStep {
  GREETING = 'GREETING',
  ASK_TAX_CODE = 'ASK_TAX_CODE',
  LOOKUP_COMPANY = 'LOOKUP_COMPANY',
  CONFIRM_COMPANY = 'CONFIRM_COMPANY',
  ASK_CONTACT_NAME = 'ASK_CONTACT_NAME',
  SHOW_PACKAGES = 'SHOW_PACKAGES',
  CONFIRM_CART = 'CONFIRM_CART',
  CREATING_ORDER = 'CREATING_ORDER',
  SHOW_QR = 'SHOW_QR',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  ASK_CCCD_FRONT = 'ASK_CCCD_FRONT',
  ASK_CCCD_BACK = 'ASK_CCCD_BACK',
  ASK_BUSINESS_LICENSE = 'ASK_BUSINESS_LICENSE',
  CONFIRM = 'CONFIRM',
  SUBMITTING = 'SUBMITTING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  ERROR_ORDER = 'ERROR_ORDER',
}

export type FullChatMessageRole = 'ai' | 'user'
export type FullChatMessageType =
  | 'text'
  | 'image'
  | 'processing'
  | 'company'
  | 'contact_form'
  | 'packages'
  | 'sig_packages'
  | 'cart'
  | 'qr'
  | 'confirm'

export type ChatPackage = HubPackage

export interface ContactInfoInput {
  name: string
  email: string
  phone: string
}

export interface FullChatMessage {
  id: string
  role: FullChatMessageRole
  content: string
  type: FullChatMessageType
  imageUrl?: string
  timestamp: Date
}

type PaymentStatus = 'idle' | 'loading' | 'pending' | 'paid' | 'wrong_amount' | 'failed' | 'expired' | 'free'

const uid = () => Math.random().toString(36).slice(2)
const ai = (content: string, type: FullChatMessageType = 'text'): FullChatMessage => ({
  id: uid(),
  role: 'ai',
  content,
  type,
  timestamp: new Date(),
})
const user = (
  content: string,
  type: FullChatMessageType = 'text',
  imageUrl?: string
): FullChatMessage => ({
  id: uid(),
  role: 'user',
  content,
  type,
  imageUrl,
  timestamp: new Date(),
})

const isJpegOrPng = (file: File) => {
  const name = file.name.toLowerCase()
  return file.type === 'image/jpeg' || file.type === 'image/png' || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
}

const normalizePaymentStatus = (status: unknown) =>
  String(status || 'pending')
    .toLowerCase()
    .replace(/[\s-]/g, '_')

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const LEGAL_DOCUMENT_GUIDE =
  'Thanh toán đã thành công. Bây giờ mình sẽ hỗ trợ hoàn tất hồ sơ pháp lý để gửi đăng ký.\n\nBạn cần chuẩn bị 3 tài liệu:\n**1. CCCD mặt trước** của người đại diện pháp luật: ảnh rõ QR, không lóa, không mất góc.\n**2. CCCD mặt sau** của cùng người đại diện để đối chiếu.\n**3. Giấy phép kinh doanh/Giấy chứng nhận đăng ký doanh nghiệp**: có thể tải ảnh hoặc PDF.\n\nTrước tiên, vui lòng tải lên **mặt trước CCCD**.'

export function useFullChatFlow(params: {
  invoicePackages: ChatPackage[]
  baseFeeItem: RawPackage | null
  signaturePackages: ChatPackage[]
  packagesReady: boolean
  onRegistrationSuccess?: () => void
}) {
  const {
    invoicePackages,
    baseFeeItem,
    signaturePackages,
    packagesReady,
    onRegistrationSuccess,
  } = params
  const {
    formData,
    setFormData,
    cart,
    setCart,
    appliedPromos,
    setOrderInfo,
    orderInfo,
    files,
    setFiles,
    serialNumber,
  } = useOnboarding()

  const [step, setStep] = useState<FullChatStep>(FullChatStep.GREETING)
  const [messages, setMessages] = useState<FullChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle')
  const [paymentMessage, setPaymentMessage] = useState('')
  const [timeLeft, setTimeLeft] = useState(3600)
  const initialized = useRef(false)
  const processingIdRef = useRef<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedInvoicePackage = useMemo(() => {
    const found = invoicePackages.find((pkg) => pkg.id === cart.invoicePkg.id)
    if (found) return found
    if (cart.invoicePkg.id && cart.invoicePkg.name) {
      return { id: cart.invoicePkg.id, name: cart.invoicePkg.name, price: cart.invoicePkg.price || 0 } as ChatPackage
    }
    return null
  }, [cart.invoicePkg, invoicePackages])
  
  const selectedSignaturePackage = useMemo(() => {
    const found = signaturePackages.find((pkg) => pkg.id === cart.signaturePkg.id)
    if (found) return found
    if (cart.signaturePkg.id && cart.signaturePkg.name) {
      return { id: cart.signaturePkg.id, name: cart.signaturePkg.name, price: cart.signaturePkg.price || 0 } as ChatPackage
    }
    return null
  }, [cart.signaturePkg, signaturePackages])
  const totalAmount = useMemo(() => {
    const invoice = selectedInvoicePackage ? selectedInvoicePackage.price * Math.max(cart.invoicePkg.qty || 1, 1) : 0
    const signature = selectedSignaturePackage ? selectedSignaturePackage.price * Math.max(cart.signaturePkg.qty || 1, 1) : 0
    const base = baseFeeItem ? baseFeeItem.price * (baseFeeItem.limit || 1) : 0
    return invoice + signature + base
  }, [baseFeeItem, cart.invoicePkg.qty, cart.signaturePkg.qty, selectedInvoicePackage, selectedSignaturePackage])

  const push = useCallback((message: FullChatMessage) => setMessages((prev) => [...prev, message]), [])

  const pushProcessing = useCallback((content: string) => {
    const message = ai(content, 'processing')
    processingIdRef.current = message.id
    setMessages((prev) => [...prev, message])
  }, [])

  const resolveProcessing = useCallback((content: string, type: FullChatMessageType = 'text') => {
    const replacement = ai(content, type)
    setMessages((prev) => {
      const index = prev.findIndex((message) => message.id === processingIdRef.current)
      processingIdRef.current = null
      if (index === -1) return [...prev.filter((message) => message.type !== 'processing'), replacement]
      const next = [...prev]
      next[index] = replacement
      return next.filter((message) => message.type !== 'processing')
    })
  }, [])

  const typeAI = useCallback(
    (content: string, delay = 450): Promise<void> =>
      new Promise((resolve) => {
        setIsTyping(true)
        setTimeout(() => {
          setIsTyping(false)
          setMessages((prev) => [...prev, ai(content)])
          resolve()
        }, delay)
      }),
    []
  )

  const fetchAIResponse = useCallback(
    async (message: string) => {
      try {
        const history = messages.slice(-8).map((item) => ({
          role: item.role === 'ai' ? 'assistant' as const : 'user' as const,
          content: item.content,
        }))
        return (
          await fetchAssistantChat(message, step, history)
        ) || 'Tôi hiểu ý bạn. Bạn vui lòng hoàn tất thông tin theo yêu cầu để tôi có thể hỗ trợ tiếp nhé!'
      } catch {
        return 'Tôi hiểu ý bạn. Bạn vui lòng hoàn tất thông tin theo yêu cầu để tôi có thể hỗ trợ tiếp nhé!'
      }
    },
    [messages, step]
  )

  const quickReplies = useMemo(() => {
    if (step === FullChatStep.CONFIRM_COMPANY) return ['Đúng, tiếp tục', 'Nhập lại MST']
    if (step === FullChatStep.SHOW_PACKAGES && cart.invoicePkg.id) {
      const base = ['Tiếp tục với gói đã chọn']
      return cart.signaturePkg.id ? [...base, 'Bỏ chữ ký số'] : [...base, 'Không cần chữ ký số']
    }
    if (step === FullChatStep.CONFIRM_CART) return ['Tạo đơn hàng']
    if (step === FullChatStep.SHOW_QR && paymentStatus === 'free') return ['Tiếp tục cập nhật hồ sơ']
    if (step === FullChatStep.CONFIRM) return ['Xác nhận gửi hồ sơ']
    if (step === FullChatStep.ERROR) return ['Thử lại']
    if (step === FullChatStep.ERROR_ORDER) return ['Thử tạo lại đơn hàng', 'Quay lại chọn gói']
    if (step === FullChatStep.ASK_CCCD_FRONT) return ['Tôi chưa có CCCD']
    if (step === FullChatStep.ASK_BUSINESS_LICENSE) return ['Tôi là hộ kinh doanh cá thể', 'Tôi chưa có giấy phép']
    return []
  }, [paymentStatus, cart.invoicePkg.id, cart.signaturePkg.id, step])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    typeAI(
      'Xin chào! Tôi là trợ lý AI. Tôi sẽ dẫn bạn hoàn thành đăng ký hóa đơn điện tử ngay trong màn hình này: thông tin DN, chọn gói, thanh toán QR và hồ sơ pháp lý.',
      600
    )
      .then(() => typeAI('Để bắt đầu, vui lòng nhập mã số thuế của doanh nghiệp bạn.', 500))
      .then(() => setStep(FullChatStep.ASK_TAX_CODE))
  }, [typeAI])

  useEffect(
    () => () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    },
    []
  )

  const lookupCompany = useCallback(
    async (taxCode: string) => {
      push(user(taxCode))
      setStep(FullChatStep.LOOKUP_COMPANY)
      pushProcessing('Đang tra cứu thông tin doanh nghiệp...')
      try {
        const data = await lookupCompanyByTaxCode(taxCode)
        const enrichment = await fetchCompanyEnrichment(taxCode, data.companyName).catch(() => null)
        const representativeName = enrichment?.representativeName || data.representativeName || ''
        const representativePhone = enrichment?.phone || data.representativePhone || ''
        setFormData((prev) => ({
          ...prev,
          companyTaxCode: taxCode,
          companyName: data.companyName,
          companyAddress: data.companyAddress,
          companyTaxAuthority: findTaxAuthority(data.companyAddress, data.companyTaxAuthority),
          contactName: prev.contactName || representativeName,
          contactPhone: prev.contactPhone || representativePhone,
          phone: prev.phone || representativePhone,
          fullName: prev.fullName || representativeName,
          companyRepresentativeName: representativeName,
          companyRepresentativePhone: representativePhone,
        }))
        resolveProcessing(
          representativeName
            ? 'Tôi đã tìm thấy thông tin doanh nghiệp và gợi ý người đại diện từ nguồn công khai. Bạn vẫn có thể sửa lại ở bước thông tin liên hệ.'
            : 'Tôi đã tìm thấy thông tin doanh nghiệp. Phần liên hệ sẽ cần bạn xác nhận thêm.',
          'company'
        )
        setStep(FullChatStep.CONFIRM_COMPANY)
      } catch {
        resolveProcessing('Tôi chưa tra cứu được mã số thuế này. Vui lòng kiểm tra lại MST hoặc thử nhập lại.')
        setStep(FullChatStep.ASK_TAX_CODE)
      }
    },
    [push, pushProcessing, resolveProcessing, setFormData]
  )

  const startPaymentPolling = useCallback(
    (orderId: string) => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
      const stop = () => {
        if (pollingRef.current) clearInterval(pollingRef.current)
        if (timerRef.current) clearInterval(timerRef.current)
        pollingRef.current = null
        timerRef.current = null
      }
      const checkStatus = async () => {
        try {
          const status = normalizePaymentStatus(await checkPaymentStatus(orderId))
          if (['pending', 'processing', 'waiting', 'unpaid'].includes(status)) return
          stop()
          if (['paid', 'success', 'completed', 'complete', 'done'].includes(status)) {
            setPaymentStatus('paid')
            setPaymentMessage('Thanh toán thành công.')
            push(ai(LEGAL_DOCUMENT_GUIDE))
            setStep(FullChatStep.ASK_CCCD_FRONT)
            return
          }
          setPaymentStatus(['wrong_amount', 'invalid_amount', 'amount_mismatch'].includes(status) ? 'wrong_amount' : 'failed')
          setPaymentMessage('Thanh toán chưa thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.')
        } catch {
          setPaymentMessage('Đang thử kiểm tra lại trạng thái thanh toán...')
        }
      }
      checkStatus()
      pollingRef.current = setInterval(checkStatus, 5000)
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stop()
            setPaymentStatus('expired')
            setPaymentMessage('Mã QR đã hết hạn. Vui lòng tạo lại đơn hàng.')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    },
    [push]
  )

  const createOrder = useCallback(async () => {
    setStep(FullChatStep.CREATING_ORDER)
    pushProcessing('Đang tạo đơn hàng tạm và chuẩn bị thanh toán...')
    try {
      const packagePayload = []
      if (cart.invoicePkg.id) packagePayload.push({ code: cart.invoicePkg.id, quantity: 1, isCashRegister: isFromCashRegister(serialNumber) })
      if (cart.signaturePkg.id) packagePayload.push({ code: cart.signaturePkg.id, quantity: 1, isCashRegister: isFromCashRegister(serialNumber) })
      if (baseFeeItem) packagePayload.push({ code: baseFeeItem.code || 'INITIAL_FEE', quantity: 1, isCashRegister: isFromCashRegister(serialNumber) })

      const form = new FormData()
      form.append('provider', config.providerCode)
      form.append('bank', config.bankCode)
      form.append('packages', JSON.stringify(packagePayload))
      form.append('promotionCodes', JSON.stringify(appliedPromos))
      form.append('isRenew', 'false')
      form.append(
        'eInvoiceRegistration',
        JSON.stringify({
          taxAuthorityCode: '',
          invoiceSymbol: serialNumber,
          previousEInvoiceProvider: '',
          organization: {
            name: formData.companyName,
            address: formData.companyAddress,
            taxCode: formData.companyTaxCode,
            taxAuthority: searchTaxAuthority(formData.companyTaxAuthority),
          },
          contactPerson: {
            name: formData.contactName,
            address: formData.contactAddress || formData.companyAddress,
            email: formData.contactEmail,
            phone: formData.contactPhone,
          },
        })
      )

      const data = await createDraftOrder(form)
      const nextOrderInfo = { orderId: data.orderId || '', amount: data.amount ?? totalAmount }
      if (!nextOrderInfo.orderId) throw new Error('Không nhận được mã đơn hàng')
      setOrderInfo(nextOrderInfo)

      if (nextOrderInfo.amount === 0) {
        setPaymentStatus('free')
        resolveProcessing('Đơn hàng của bạn có giá trị 0đ, không cần thanh toán. Bạn có thể tiếp tục cập nhật hồ sơ pháp lý.', 'qr')
        setStep(FullChatStep.SHOW_QR)
        return
      }

      setPaymentStatus('loading')
      const qrUrl = await generatePaymentQr(nextOrderInfo.orderId, nextOrderInfo.amount)
      setQrDataUrl(qrUrl)
      setPaymentStatus('pending')
      setPaymentMessage('Đang chờ thanh toán. Hệ thống kiểm tra tự động mỗi 5 giây.')
      setTimeLeft(3600)
      resolveProcessing('Mã QR thanh toán đã sẵn sàng. Sau khi thanh toán thành công, luồng sẽ chuyển sang bước cập nhật hồ sơ.', 'qr')
      setStep(FullChatStep.SHOW_QR)
      startPaymentPolling(nextOrderInfo.orderId)
    } catch (error) {
      resolveProcessing(`Không thể tạo đơn hàng: ${error instanceof Error ? error.message : 'lỗi không xác định'}. Vui lòng thử lại.`)
      setStep(FullChatStep.ERROR_ORDER)
    }
  }, [appliedPromos, baseFeeItem, cart, formData, pushProcessing, resolveProcessing, serialNumber, setOrderInfo, startPaymentPolling, totalAmount])

  const handleTextSubmit = useCallback(
    async (text: string) => {
      const value = text.trim()
      if (!value) return
      if (step === FullChatStep.ASK_TAX_CODE) {
        const taxCode = validateVietnamTaxCode(value)
        if (!taxCode.valid) {
          if (value.length > 15 || !/^\d+$/.test(value)) {
            push(user(value))
            await typeAI(await fetchAIResponse(value))
            return
          }
          push(user(value))
          await typeAI('Mã số thuế chưa hợp lệ. Vui lòng nhập MST 10, 12 hoặc 13 chữ số.')
          return
        }
        await lookupCompany(taxCode.normalized)
      }
    },
    [fetchAIResponse, lookupCompany, push, step, typeAI]
  )

  const handleContactSubmit = useCallback(
    async (input: ContactInfoInput): Promise<boolean> => {
      const name = input.name.trim()
      const email = input.email.trim()
      const phone = input.phone.trim()
      if (!validateVNName(name)) {
        await typeAI('Tên người liên hệ chưa đủ rõ. Vui lòng nhập họ tên đầy đủ.')
        return false
      }
      if (!validateEmail(email)) {
        await typeAI('Email chưa đúng định dạng. Vui lòng kiểm tra lại.')
        return false
      }
      if (!validatePhone(phone)) {
        await typeAI('Số điện thoại chưa hợp lệ. Vui lòng sửa lại trong biểu mẫu.')
        return false
      }
      push(user(`Thông tin liên hệ: ${name} · ${email} · ${phone}`))
      setFormData((prev) => ({
        ...prev,
        contactName: name,
        contactEmail: email,
        contactPhone: phone,
        phone: prev.phone || phone,
        contactAddress: prev.contactAddress || prev.companyAddress,
      }))
      if (!packagesReady) {
        await typeAI('Tôi đã lưu thông tin liên hệ. Danh sách gói đang được tải, vui lòng chờ vài giây.')
        return true
      }
      await typeAI('Tôi đã lưu thông tin liên hệ. Tiếp theo bạn chọn gói hóa đơn theo nhu cầu phát hành.')
      push(ai('PACKAGE_LIST', 'packages'))
      setStep(FullChatStep.SHOW_PACKAGES)
      return true
    },
    [packagesReady, push, setFormData, typeAI]
  )

  const handleQuickReply = useCallback(
    async (reply: string) => {
      const shouldShowUserReply = step !== FullChatStep.CONFIRM
      if (shouldShowUserReply) push(user(reply))
      if (step === FullChatStep.CONFIRM_COMPANY) {
        if (reply === 'Nhập lại MST') {
          await typeAI('Vui lòng nhập lại mã số thuế doanh nghiệp.')
          setStep(FullChatStep.ASK_TAX_CODE)
          return
        }
        await typeAI('Thông tin doanh nghiệp đã được xác nhận. Vui lòng bổ sung thông tin liên hệ.')
        push(ai('CONTACT_FORM', 'contact_form'))
        setStep(FullChatStep.ASK_CONTACT_NAME)
        return
      }
      if (step === FullChatStep.SHOW_PACKAGES) {
        if (reply === 'Không cần chữ ký số' || reply === 'Bỏ chữ ký số') {
          setCart((prev) => ({ ...prev, signaturePkg: { id: null, qty: 0 } }))
          await typeAI('Đã bỏ chữ ký số khỏi giỏ hàng.')
        } else {
          await typeAI('Tôi sẽ tóm tắt giỏ hàng để bạn kiểm tra trước khi tạo đơn.')
        }
        push(ai('CART_SUMMARY', 'cart'))
        setStep(FullChatStep.CONFIRM_CART)
        return
      }
      if (step === FullChatStep.CONFIRM_CART) {
        await createOrder()
        return
      }
      if (step === FullChatStep.SHOW_QR) {
        await typeAI(LEGAL_DOCUMENT_GUIDE)
        setStep(FullChatStep.ASK_CCCD_FRONT)
        return
      }
      if (step === FullChatStep.CONFIRM) {
        await submitFinalRegistration()
        return
      }
      if (step === FullChatStep.ERROR) {
        await submitFinalRegistration()
        return
      }
      if (step === FullChatStep.ERROR_ORDER) {
        if (reply === 'Thử tạo lại đơn hàng') await createOrder()
        else setStep(FullChatStep.CONFIRM_CART)
        return
      }
      if (reply === 'Tôi chưa có CCCD') await typeAI('CCCD là giấy tờ bắt buộc để đăng ký. Vui lòng cung cấp CCCD của người đại diện pháp luật để tiếp tục.')
      if (reply === 'Tôi là hộ kinh doanh cá thể') await typeAI('Bạn có thể tải lên giấy chứng nhận đăng ký hộ kinh doanh thay cho giấy phép kinh doanh.')
      if (reply === 'Tôi chưa có giấy phép') await typeAI('Giấy phép kinh doanh là tài liệu bắt buộc. Vui lòng liên hệ bộ phận hỗ trợ nếu bạn gặp khó khăn.')
    },
    [createOrder, push, setCart, step, typeAI]
  )

  const handleInvoicePackageSelect = useCallback(
    async (pkg: ChatPackage) => {
      push(user(`Chọn ${pkg.qtyLabel}`))
      setCart((prev) => ({ ...prev, invoicePkg: { id: pkg.id, qty: 1, name: pkg.name, price: pkg.price } }))
      await typeAI(`Bạn đã chọn ${pkg.name} (${pkg.qtyLabel}).`)
      if (signaturePackages.length > 0) {
        push(ai('SIG_PACKAGES', 'sig_packages'))
        await typeAI('Nếu doanh nghiệp chưa có chữ ký số, hãy chọn thêm gói bên dưới. Nếu đã có, bấm "Tiếp tục với gói đã chọn".', 300)
      }
      setStep(FullChatStep.SHOW_PACKAGES)
    },
    [push, setCart, signaturePackages.length, typeAI]
  )

  const handleSignaturePackageSelect = useCallback(
    async (pkg: ChatPackage) => {
      const isSame = cart.signaturePkg.id === pkg.id
      if (isSame) {
        setCart((prev) => ({ ...prev, signaturePkg: { id: null, qty: 0 } }))
        await typeAI('Đã bỏ chọn chữ ký số.')
        setStep(FullChatStep.SHOW_PACKAGES)
        return
      }
      push(user(`Chọn chữ ký số: ${pkg.name}`))
      setCart((prev) => ({ ...prev, signaturePkg: { id: pkg.id, qty: 1, name: pkg.name, price: pkg.price } }))
      
      if (!cart.invoicePkg.id) {
        await typeAI(`Đã thêm ${pkg.name}. Vui lòng chọn thêm gói hóa đơn ở phía trên để tiếp tục.`)
      } else {
        await typeAI(`Đã thêm ${pkg.name} vào giỏ hàng. Bấm "Tiếp tục với gói đã chọn" để xem tổng tiền.`)
      }
      setStep(FullChatStep.SHOW_PACKAGES)
    },
    [cart.invoicePkg.id, cart.signaturePkg.id, push, setCart, typeAI]
  )

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (step === FullChatStep.ASK_CCCD_FRONT) {
        if (!isJpegOrPng(file)) {
          push(user(file.name))
          await typeAI('CCCD chỉ hỗ trợ ảnh JPG/PNG. Vui lòng tải ảnh mặt trước CCCD đúng định dạng.')
          return
        }
        push(user('Mặt trước CCCD', 'image', URL.createObjectURL(file)))
        pushProcessing('Đang quét QR trên mặt trước CCCD...')
        const result = await extractIdCardInfo(file)
        if (!result.isValid) {
          resolveProcessing(result.error || 'Không đọc được mặt trước CCCD. Vui lòng tải ảnh rõ nét, đúng mặt trước CCCD.')
          return
        }
        setFiles((prev) => ({ ...prev, frontCccd: file }))
        if (result.data) {
          const { fullName, dob, gender, cccd, address } = result.data
          setFormData((prev) => ({
            ...prev,
            fullName: fullName || prev.fullName,
            dob: dob || prev.dob,
            gender: gender || prev.gender,
            cccd: cccd || prev.cccd,
            address: address || prev.address,
          }))
        }
        resolveProcessing(
          `Đã đọc mặt trước CCCD thành công.\n\nHọ tên: ${result.data?.fullName || ''}\nSố CCCD: ${result.data?.cccd || ''}\n\nVui lòng kiểm tra thông tin và tải lên mặt sau CCCD để đối chiếu.`
        )
        setStep(FullChatStep.ASK_CCCD_BACK)
        return
      }
      if (step === FullChatStep.ASK_CCCD_BACK) {
        if (!isJpegOrPng(file)) {
          push(user(file.name))
          await typeAI('CCCD chỉ hỗ trợ ảnh JPG/PNG. Vui lòng tải ảnh mặt sau CCCD đúng định dạng.')
          return
        }
        push(user('Mặt sau CCCD', 'image', URL.createObjectURL(file)))
        setFiles((prev) => ({ ...prev, backCccd: file }))
        await typeAI('Tôi đã nhận mặt sau CCCD. Tiếp theo, vui lòng tải lên giấy phép kinh doanh.')
        setStep(FullChatStep.ASK_BUSINESS_LICENSE)
        return
      }
      if (step === FullChatStep.ASK_BUSINESS_LICENSE) {
        const isImage = file.type.startsWith('image/')
        push(user(file.name, isImage ? 'image' : 'text', isImage ? URL.createObjectURL(file) : undefined))
        setFiles((prev) => ({ ...prev, businessLicense: file }))
        await typeAI('Tôi đã nhận đủ hồ sơ. Vui lòng kiểm tra tóm tắt cuối cùng trước khi gửi.')
        push(ai('CONFIRM', 'confirm'))
        setStep(FullChatStep.CONFIRM)
      }
    },
    [push, pushProcessing, resolveProcessing, setFiles, setFormData, step, typeAI]
  )

  async function submitFinalRegistration() {
    setStep(FullChatStep.SUBMITTING)
    try {
      const fd = new FormData()
      fd.append(
        'eInvoiceRegistration',
        JSON.stringify({
          legalRepresentative: {
            name: formData.fullName,
            dob: formData.dob,
            gender: formData.gender === 'Nam' ? 'male' : formData.gender === 'Nữ' ? 'female' : '',
            phone: formData.phone,
            idCard: formData.cccd,
            passportNumber: '',
            nationality: formData.nationality || 'VN',
            permanentAddress: formData.address,
          },
          hasUsedEInvoice: false,
          previousEInvoiceProvider: '',
          taxAuthorityCode: '',
          invoiceSymbol: serialNumber,
        })
      )
      if (files.businessLicense) fd.append('organizationRegistrationCert', files.businessLicense)
      if (files.frontCccd) fd.append('legalRepresentativeIdCard', files.frontCccd)
      if (files.backCccd) fd.append('legalRepresentativeIdCard', files.backCccd)
      if (!orderInfo?.orderId) throw new Error('Không có mã đơn hàng để gửi hồ sơ')
      await Promise.all([submitRegistration(orderInfo.orderId, fd), wait(7000)])
      push(ai('Hồ sơ đã gửi thành công. Bạn có thể tiếp tục bước ký hợp đồng điện tử trong hệ thống chính.'))
      setStep(FullChatStep.SUCCESS)
      setTimeout(() => onRegistrationSuccess?.(), 500)
    } catch (error) {
      push(ai(`Gửi hồ sơ thất bại: ${error instanceof Error ? error.message : 'lỗi không xác định'}. Bạn có thể thử lại.`))
      setStep(FullChatStep.ERROR)
    }
  }

  const canUpload = [FullChatStep.ASK_CCCD_FRONT, FullChatStep.ASK_CCCD_BACK, FullChatStep.ASK_BUSINESS_LICENSE].includes(step)
  const textInputDisabled = step !== FullChatStep.ASK_TAX_CODE
  const uploadAccept = step === FullChatStep.ASK_BUSINESS_LICENSE ? '.pdf,image/*' : '.jpg,.jpeg,.png'
  const inputPlaceholder = step === FullChatStep.ASK_TAX_CODE ? 'Nhập mã số thuế...' : 'Nhập nội dung...'

  return {
    step,
    messages,
    isTyping,
    quickReplies,
    canUpload,
    textInputDisabled,
    inputPlaceholder,
    uploadAccept,
    qrDataUrl,
    paymentStatus,
    paymentMessage,
    timeLeft,
    invoicePackages,
    signaturePackages,
    selectedInvoicePackage,
    selectedSignaturePackage,
    baseFeeItem,
    totalAmount,
    handleTextSubmit,
    handleContactSubmit,
    handleQuickReply,
    handleInvoicePackageSelect,
    handleSignaturePackageSelect,
    handleFileUpload,
    formatCurrency,
  }
}
