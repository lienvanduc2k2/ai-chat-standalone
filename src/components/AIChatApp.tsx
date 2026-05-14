'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Bot, Building2, CheckCircle2, CreditCard, FileCheck, FileSignature, Package, Paperclip, Send, ShieldCheck } from 'lucide-react'
import ContactFormBubble from './ContactFormBubble'
import PackageCard from './PackageCard'
import ProgressSidebar from './ProgressSidebar'
import QRPaymentBubble from './QRPaymentBubble'
import QuickReplies from './QuickReplies'
import usePackageData from '@/hooks/usePackageData'
import { FullChatMessage, FullChatStep, useFullChatFlow } from '@/hooks/useFullChatFlow'
import { useOnboarding } from '@/context/OnboardingContext'
import EContractModal from './EContractModal'

const rich = (text: string) =>
  text.split('\n').map((line, index, arr) => (
    <React.Fragment key={index}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
      {index < arr.length - 1 && <br />}
    </React.Fragment>
  ))

function CompanyCard() {
  const { formData } = useOnboarding()
  return (
    <div className="polished-panel w-full rounded-xl p-4 sm:max-w-md sm:p-5">
      <p className="mb-3 text-[10px] font-extrabold tracking-[0.14em] text-slate-400 uppercase">Thông tin doanh nghiệp</p>
      <p className="text-[15px] leading-snug font-extrabold text-slate-900">{formData.companyName || '-'}</p>
      <div className="mt-3 space-y-2 text-xs font-medium text-slate-500">
        {[
          ['MST', formData.companyTaxCode],
          ['Địa chỉ', formData.companyAddress],
          ['CQT', formData.companyTaxAuthority],
        ].map(([label, value]) =>
          value ? (
            <div key={label} className="flex gap-2 text-[13px]">
              <span className="w-16 shrink-0 text-slate-400">{label}</span>
              <span className="min-w-0 break-words leading-snug font-semibold text-slate-700">{value}</span>
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}

function CartCard({ flow }: { flow: ReturnType<typeof useFullChatFlow> }) {
  const { cart } = useOnboarding()
  const baseFeeAmount = flow.baseFeeItem ? flow.baseFeeItem.price * (flow.baseFeeItem.limit || 1) : 0
  const invoiceAmount = flow.selectedInvoicePackage ? flow.selectedInvoicePackage.price * Math.max(cart.invoicePkg.qty || 1, 1) : 0
  const signatureAmount = flow.selectedSignaturePackage ? flow.selectedSignaturePackage.price * Math.max(cart.signaturePkg.qty || 1, 1) : 0
  return (
    <div className="polished-panel w-full rounded-xl p-4 sm:max-w-sm sm:p-5">
      <p className="mb-4 text-[10px] font-extrabold tracking-[0.14em] text-slate-400 uppercase">Tóm tắt đơn hàng</p>
      <div className="space-y-2 text-[13px] text-slate-700">
        {baseFeeAmount > 0 && <Row label="Phí khởi tạo" value={`${flow.formatCurrency(baseFeeAmount)}đ`} />}
        <Row label="Gói hóa đơn" value={invoiceAmount > 0 ? `${flow.formatCurrency(invoiceAmount)}đ` : '-'} />
        {flow.selectedSignaturePackage && <Row label="Chữ ký số" value={`${flow.formatCurrency(signatureAmount)}đ`} />}
        <div className="mt-2 flex justify-between border-t border-slate-100 pt-3 text-sm">
          <span className="font-bold text-slate-500 uppercase tracking-wide text-[11px]">Tổng tiền</span>
          <span className="text-base font-extrabold text-slate-900">{flow.formatCurrency(flow.totalAmount)}đ</span>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 font-medium">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-800">{value}</span>
    </div>
  )
}

function ConfirmCard() {
  const { formData, orderInfo } = useOnboarding()
  return (
    <div className="polished-panel w-full rounded-xl p-4 sm:max-w-sm sm:p-5">
      <p className="mb-4 text-[10px] font-extrabold tracking-[0.14em] text-slate-400 uppercase">Xác nhận hồ sơ</p>
      {[
        ['Doanh nghiệp', formData.companyName],
        ['MST', formData.companyTaxCode],
        ['Người đại diện', formData.fullName],
        ['CCCD', formData.cccd],
        ['Mã đơn', orderInfo?.orderId],
      ].map(([label, value]) => (
        <div key={label} className="mb-2 flex gap-3 text-[13px]">
          <span className="w-24 shrink-0 text-slate-400 font-medium sm:w-28">{label}</span>
          <span className="min-w-0 break-words font-semibold text-slate-700">{value || '-'}</span>
        </div>
      ))}
    </div>
  )
}

function PackageList({ flow }: { flow: ReturnType<typeof useFullChatFlow> }) {
  const { cart, setCart } = useOnboarding()
  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          className={`rounded-lg px-2 py-2 text-xs font-bold transition-all sm:px-3 sm:text-sm ${
            cart.invoiceType === 'e-invoice' ? 'brand-action shadow-sm' : 'text-slate-500 hover:bg-teal-50 hover:text-teal-700'
          }`}
          onClick={() => {
            if (cart.invoiceType !== 'e-invoice') {
              setCart(prev => ({ ...prev, invoiceType: 'e-invoice', invoicePkg: { id: null, qty: 0 } }))
            }
          }}
        >
          Hóa đơn điện tử
        </button>
        <button
          type="button"
          className={`rounded-lg px-2 py-2 text-xs font-bold transition-all sm:px-3 sm:text-sm ${
            cart.invoiceType === 'mtt' ? 'brand-action shadow-sm' : 'text-slate-500 hover:bg-teal-50 hover:text-teal-700'
          }`}
          onClick={() => {
            if (cart.invoiceType !== 'mtt') {
              setCart(prev => ({ ...prev, invoiceType: 'mtt', invoicePkg: { id: null, qty: 0 } }))
            }
          }}
        >
          Máy tính tiền
        </button>
      </div>
      <p className="mb-2 text-[10px] font-extrabold tracking-[0.14em] text-slate-400 uppercase">Gói hóa đơn</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {flow.invoicePackages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} selected={flow.selectedInvoicePackage?.id === pkg.id} onSelect={flow.handleInvoicePackageSelect} formatCurrency={flow.formatCurrency} />
        ))}
      </div>
    </div>
  )
}

function SignatureList({ flow }: { flow: ReturnType<typeof useFullChatFlow> }) {
  if (!flow.signaturePackages.length) return null
  return (
    <div className="polished-panel w-full max-w-2xl rounded-xl p-4 sm:p-5">
      <p className="mb-2 text-[10px] font-extrabold tracking-[0.14em] text-slate-400 uppercase">Chữ ký số tùy chọn</p>
      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        {flow.signaturePackages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} selected={flow.selectedSignaturePackage?.id === pkg.id} onSelect={flow.handleSignaturePackageSelect} formatCurrency={flow.formatCurrency} type="signature" />
        ))}
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  flow,
  contactFormDone,
  onContactFormDone,
}: {
  message: FullChatMessage
  flow: ReturnType<typeof useFullChatFlow>
  contactFormDone: boolean
  onContactFormDone: () => void
}) {
  const { formData, orderInfo } = useOnboarding()
  const isAI = message.role === 'ai'
  const content = (() => {
    if (message.type === 'company') return <CompanyCard />
    if (message.type === 'contact_form') {
      return (
        <ContactFormBubble
          disabled={contactFormDone}
          defaultValues={{
            contactName: formData.contactName,
            contactEmail: formData.contactEmail,
            contactPhone: formData.contactPhone,
          }}
          onSubmit={async (info) => {
            const ok = await flow.handleContactSubmit({
              name: info.contactName,
              email: info.contactEmail,
              phone: info.contactPhone,
            })
            if (ok) onContactFormDone()
            return ok
          }}
        />
      )
    }
    if (message.type === 'packages') return <PackageList flow={flow} />
    if (message.type === 'sig_packages') return <SignatureList flow={flow} />
    if (message.type === 'cart') return <CartCard flow={flow} />
    if (message.type === 'qr') {
      return (
        <QRPaymentBubble
          amount={orderInfo?.amount || flow.totalAmount}
          orderId={orderInfo?.orderId}
          qrDataUrl={flow.qrDataUrl}
          status={flow.paymentStatus}
          message={flow.paymentMessage}
          timeLeft={flow.timeLeft}
          formatCurrency={flow.formatCurrency}
        />
      )
    }
    if (message.type === 'confirm') return <ConfirmCard />
    if (message.type === 'image' && message.imageUrl) {
      return (
        <div className="overflow-hidden rounded-xl rounded-br-sm border border-slate-200 bg-slate-700 shadow-md shadow-slate-900/10" style={{ maxWidth: 220 }}>
          <img src={message.imageUrl} alt={message.content} className="block w-full object-contain bg-white" />
          <div className="px-3.5 py-2">
            <p className="truncate text-[11px] font-medium text-white tracking-wide">{message.content}</p>
          </div>
        </div>
      )
    }
    return rich(message.content)
  })()

  if (!isAI) {
    return (
    <div className="ai-message-in flex justify-end">
      <div className="user-bubble max-w-[88%] rounded-xl rounded-br-sm px-4 py-3 text-[13px] leading-relaxed font-semibold text-white sm:max-w-[76%]">{content}</div>
    </div>
    )
  }
  const isCard = ['company', 'contact_form', 'packages', 'sig_packages', 'cart', 'qr', 'confirm', 'image'].includes(message.type)
  return (
    <div className="ai-message-in flex min-w-0 items-start gap-2.5 sm:gap-3">
      <div className="logo-mark mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-md shadow-red-500/20 ring-2 ring-white sm:h-8 sm:w-8">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className={isCard ? 'min-w-0 flex-1 sm:max-w-[90%]' : 'ai-text-reveal min-w-0 max-w-[88%] rounded-xl rounded-bl-sm border border-slate-200/80 bg-white px-4 py-3 text-[13px] font-medium leading-relaxed text-slate-700 shadow-[0_8px_22px_rgb(15,23,42,0.045)] sm:max-w-[82%]'}>
        {message.type === 'processing' ? (
          <span className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
            <span className="flex gap-1.5">
              <span className="ai-dot h-1.5 w-1.5 rounded-full bg-slate-300" />
              <span className="ai-dot h-1.5 w-1.5 rounded-full bg-slate-400 [animation-delay:150ms]" />
              <span className="ai-dot h-1.5 w-1.5 rounded-full bg-slate-300 [animation-delay:300ms]" />
            </span>
            {message.content}
          </span>
        ) : (
          content
        )}
      </div>
    </div>
  )
}

const blocks = [
  { label: 'Doanh nghiệp', icon: Building2, steps: [FullChatStep.ASK_TAX_CODE, FullChatStep.LOOKUP_COMPANY, FullChatStep.CONFIRM_COMPANY, FullChatStep.ASK_CONTACT_NAME] },
  { label: 'Chọn gói', icon: Package, steps: [FullChatStep.SHOW_PACKAGES, FullChatStep.CONFIRM_CART] },
  { label: 'Thanh toán', icon: CreditCard, steps: [FullChatStep.CREATING_ORDER, FullChatStep.SHOW_QR, FullChatStep.PAYMENT_SUCCESS, FullChatStep.ERROR_ORDER] },
  { label: 'Hồ sơ', icon: FileCheck, steps: [FullChatStep.ASK_CCCD_FRONT, FullChatStep.ASK_CCCD_BACK, FullChatStep.ASK_BUSINESS_LICENSE] },
  { label: 'Hoàn tất', icon: ShieldCheck, steps: [FullChatStep.CONFIRM, FullChatStep.SUBMITTING, FullChatStep.SUCCESS, FullChatStep.ERROR] },
]
const stage: Partial<Record<FullChatStep, number>> = {}
blocks.forEach((block, index) => block.steps.forEach((step) => (stage[step] = index)))

function HeaderProgress({ step }: { step: FullChatStep }) {
  const active = stage[step] ?? 0
  return (
    <div className="flex items-center gap-0 px-0 sm:px-4 md:px-6">
      {blocks.map((block, index) => {
        const done = index < active
        const current = index === active
        const Icon = block.icon
        return (
          <React.Fragment key={block.label}>
            <div className="flex flex-col items-center">
              <div className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-500 sm:h-7 sm:w-7 sm:rounded-lg ${done ? 'bg-teal-500 shadow-sm shadow-teal-500/20' : current ? 'brand-action scale-110 ring-2 ring-teal-100' : 'bg-stone-100 scale-90'}`}>
                {done ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : <Icon className={`h-3.5 w-3.5 ${current ? 'text-white' : 'text-slate-400'}`} />}
              </div>
              <span className={`mt-1 hidden text-[9px] font-bold tracking-[0.08em] transition-colors duration-500 sm:block uppercase ${done ? 'text-teal-600' : current ? 'text-teal-700' : 'text-slate-400'}`}>{block.label}</span>
            </div>
            {index < blocks.length - 1 && <div className={`mx-1 h-0.5 flex-1 rounded-full transition-all duration-500 sm:mx-1.5 ${index < active ? 'bg-teal-400' : current ? 'bg-gradient-to-r from-teal-300 to-amber-200' : 'bg-stone-200'}`} />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function StageRibbon({ step }: { step: FullChatStep }) {
  const active = stage[step] ?? 0
  const current = blocks[active] || blocks[0]
  const Icon = current.icon
  return (
    <div className="stage-ribbon mx-auto mb-3 flex max-w-3xl items-center gap-3 rounded-xl px-3 py-2.5 sm:mb-4 sm:px-4 sm:py-3">
      <div className="brand-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-md shadow-teal-500/15 sm:h-10 sm:w-10">
        <Icon className="h-4.5 w-4.5 text-white sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold tracking-[0.14em] text-teal-600 uppercase">Đang xử lý</p>
        <p className="truncate text-sm font-extrabold text-slate-900">{current.label}</p>
      </div>
      <div className="hidden items-center gap-1.5 rounded-lg border border-teal-100 bg-teal-50 px-3 py-1.5 text-[11px] font-bold text-teal-700 sm:flex">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
        Bước {active + 1}/{blocks.length}
      </div>
    </div>
  )
}

export default function AIChatApp() {
  const { orderInfo, cart, setCart } = useOnboarding()
  const [showContract, setShowContract] = useState(false)
  const [text, setText] = useState('')
  const [isTextSubmitting, setIsTextSubmitting] = useState(false)
  const [contactFormDone, setContactFormDone] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isTextSubmittingRef = useRef(false)
  const isComposingRef = useRef(false)
  
  // Đã sửa lại logic: Máy tính tiền (MTT) tương ứng với isCashRegister = true, Hóa đơn điện tử = false
  const isCashRegister = cart.invoiceType === 'mtt' 
  const packageData = usePackageData(isCashRegister)
  
  const flow = useFullChatFlow({
    invoicePackages: packageData.invoicePackages,
    baseFeeItem: packageData.baseFeeItem,
    signaturePackages: packageData.signaturePackages,
    packagesReady: packageData.invoicePackages.length > 0,
  })

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })
    return () => cancelAnimationFrame(frame)
  }, [flow.messages, flow.isTyping])
  useEffect(() => {
    if (flow.textInputDisabled || flow.isTyping || isTextSubmitting) return
    const timeout = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true })
    }, 90)
    return () => window.clearTimeout(timeout)
  }, [flow.textInputDisabled, flow.isTyping, flow.step, isTextSubmitting])
  useEffect(() => {
    if (flow.step === FullChatStep.ASK_TAX_CODE) setContactFormDone(false)
  }, [flow.step])

  const sendText = async () => {
    if (isTextSubmittingRef.current) return
    const trimmed = (inputRef.current?.value ?? text).trim()
    if (!trimmed || flow.textInputDisabled) return
    isTextSubmittingRef.current = true
    setIsTextSubmitting(true)
    setText('')
    try {
      await flow.handleTextSubmit(trimmed)
    } finally {
      isTextSubmittingRef.current = false
      setIsTextSubmitting(false)
    }
  }
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    flow.handleFileUpload(file)
    event.target.value = ''
  }
  const shouldIgnoreEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const nativeEvent = event.nativeEvent as KeyboardEvent
    return (
      isComposingRef.current ||
      nativeEvent.isComposing ||
      nativeEvent.keyCode === 229
    )
  }
  const isSuccess = flow.step === FullChatStep.SUCCESS

  return (
    <div className="chat-shell-bg flex h-dvh min-h-dvh flex-col font-sans antialiased">
      <header className="shrink-0 border-b border-stone-200/80 bg-white/90 shadow-[0_1px_0_rgb(255,255,255)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2.5 px-3 py-2.5 sm:flex-nowrap sm:gap-3 sm:px-4 sm:py-3 md:px-5">
          <div className="logo-mark relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md shadow-red-500/20 sm:h-10 sm:w-10">
            <Bot className="h-4.5 w-4.5 text-white sm:h-5 sm:w-5" />
            <span className='absolute -top-1 -right-1 flex h-3 w-3'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
              <span className='relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500' />
            </span>
          </div>
          <div className="min-w-0 shrink">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] leading-none font-extrabold text-slate-950 sm:text-sm">Trợ lý AI 1Invoice</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">Đang hoạt động</span>
            </div>
          </div>
          <div className="order-2 min-w-0 flex-1 basis-full sm:order-none sm:basis-auto">
            <HeaderProgress step={flow.step} />
          </div>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 overflow-hidden">
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-2.5 py-3 sm:px-4 sm:py-4 md:px-6">
            <StageRibbon step={flow.step} />
            <div className="mx-auto max-w-3xl space-y-3 pb-3 sm:space-y-4">
              {flow.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} flow={flow} contactFormDone={contactFormDone} onContactFormDone={() => setContactFormDone(true)} />
              ))}
              {flow.isTyping && (
                <div className="ai-typing-in flex items-start gap-2.5 sm:gap-3">
                  <div className="logo-mark flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-md shadow-red-500/20 ring-2 ring-white sm:h-8 sm:w-8">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-xl rounded-bl-sm border border-slate-200/80 bg-white px-5 py-3.5 shadow-[0_8px_22px_rgb(15,23,42,0.045)]">
                    <span className="flex gap-1.5">
                      <span className="ai-dot h-2 w-2 rounded-full bg-slate-300" />
                      <span className="ai-dot h-2 w-2 rounded-full bg-slate-400 [animation-delay:150ms]" />
                      <span className="ai-dot h-2 w-2 rounded-full bg-slate-300 [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
              {flow.step === FullChatStep.SUBMITTING && (
                <div className='animate-in fade-in flex justify-center py-6 duration-300'>
                  <div className='polished-panel flex w-full max-w-sm flex-col items-center gap-4 rounded-xl px-5 py-6 sm:px-8 sm:py-7'>
                    <div className='relative flex h-16 w-16 items-center justify-center'>
                      <div className='absolute inset-0 rounded-full bg-teal-50' />
                      <div className='absolute inset-1 animate-ping rounded-full bg-teal-100' />
                      <div className='brand-avatar relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-teal-500/20'>
                        <Bot className='h-6 w-6 text-white' />
                      </div>
                    </div>
                    <div className='text-center'>
                      <p className='text-sm font-bold text-slate-800'>AI đang kiểm tra hồ sơ...</p>
                      <p className='mt-1 text-xs font-medium text-slate-500'>Trợ lý đang gửi và chuẩn bị hợp đồng. Vui lòng chờ khoảng 5-10 giây.</p>
                    </div>
                    <span className="flex gap-1.5">
                      <span className="ai-dot h-2 w-2 rounded-full bg-teal-300" />
                      <span className="ai-dot h-2 w-2 rounded-full bg-teal-500 [animation-delay:150ms]" />
                      <span className="ai-dot h-2 w-2 rounded-full bg-teal-300 [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
              {isSuccess && (
                <div className='animate-in fade-in zoom-in flex justify-center py-4 duration-500'>
                  <div className='polished-panel rounded-xl px-5 py-7 text-center sm:px-8 sm:py-8'>
                    <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20'>
                      <CheckCircle2 className="h-8 w-8 text-white" />
                    </div>
                    <p className='text-lg font-extrabold text-slate-900'>Hồ sơ đã gửi thành công!</p>
                    <p className='mt-1.5 text-sm text-slate-500 font-medium'>Trợ lý đã hoàn tất luồng đăng ký. Bấm nút bên dưới để mở hợp đồng điện tử khi bạn sẵn sàng.</p>
                    <button
                      type='button'
                      onClick={() => setShowContract(true)}
                      className='brand-action mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-extrabold transition-all hover:-translate-y-0.5'
                    >
                      <FileSignature className='h-4 w-4' />
                      Ký hợp đồng điện tử
                    </button>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          {!isSuccess && (
            <div className="shrink-0 border-t border-slate-200/80 bg-white/90 shadow-[0_-10px_28px_rgb(15,23,42,0.045)] backdrop-blur-xl">
              <div className="mx-auto max-w-3xl">
                <QuickReplies replies={flow.quickReplies} onSelect={(reply) => flow.handleQuickReply(reply)} />
                <div className="flex items-center gap-2 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:gap-2.5 sm:px-4 sm:py-3.5 sm:pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
                  {flow.canUpload && (
                    <>
                      <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Tải tài liệu lên" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-teal-700 transition-colors hover:border-teal-300 hover:bg-teal-100">
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <input ref={fileInputRef} type="file" className="hidden" accept={flow.uploadAccept} onChange={handleFileChange} />
                    </>
                  )}
                  <input
                    ref={inputRef}
                    value={text}
                    disabled={flow.textInputDisabled || isTextSubmitting}
                    autoFocus
                    onChange={(e) => setText(e.target.value)}
                    onCompositionStart={() => {
                      isComposingRef.current = true
                    }}
                    onCompositionEnd={() => {
                      isComposingRef.current = false
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (shouldIgnoreEnter(e)) return
                        e.preventDefault()
                        sendText()
                      }
                    }}
                    placeholder={flow.textInputDisabled ? 'Hãy chọn gợi ý hoặc tải tài liệu bên trên...' : flow.inputPlaceholder}
                    className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <button type="button" onClick={sendText} disabled={!text.trim() || flow.textInputDisabled || isTextSubmitting} aria-label="Gửi tin nhắn" className="brand-action flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-all active:scale-95 disabled:opacity-40 disabled:shadow-none">
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
        <ProgressSidebar step={flow.step} totalAmount={flow.totalAmount} selectedPackageName={flow.selectedInvoicePackage?.name} selectedSignaturePackageName={flow.selectedSignaturePackage?.name} formatCurrency={flow.formatCurrency} />
      </main>
      {orderInfo?.orderId && (
        <EContractModal
          currentOrderId={orderInfo.orderId}
          showContractModal={showContract}
          setShowContractModal={setShowContract}
        />
      )}
    </div>
  )
}
