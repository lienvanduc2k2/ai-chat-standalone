'use client'

import {
  Building2,
  CheckCircle2,
  Circle,
  CreditCard,
  FileCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { FullChatStep } from '@/hooks/useFullChatFlow'
import { useOnboarding } from '@/context/OnboardingContext'

interface ProgressSidebarProps {
  step: FullChatStep
  totalAmount: number
  selectedPackageName?: string
  selectedSignaturePackageName?: string
  formatCurrency: (v: number) => string
}

const STEP_ORDER = Object.values(FullChatStep)

const BLOCKS = [
  {
    key: 'company',
    label: 'Thông tin DN',
    icon: Building2,
    steps: [
      FullChatStep.ASK_TAX_CODE,
      FullChatStep.LOOKUP_COMPANY,
      FullChatStep.CONFIRM_COMPANY,
      FullChatStep.ASK_CONTACT_NAME,
    ],
  },
  {
    key: 'package',
    label: 'Chọn gói',
    icon: Sparkles,
    steps: [FullChatStep.SHOW_PACKAGES, FullChatStep.CONFIRM_CART],
  },
  {
    key: 'payment',
    label: 'Thanh toán',
    icon: CreditCard,
    steps: [
      FullChatStep.CREATING_ORDER,
      FullChatStep.SHOW_QR,
      FullChatStep.PAYMENT_SUCCESS,
      FullChatStep.ERROR_ORDER,
    ],
  },
  {
    key: 'docs',
    label: 'Hồ sơ pháp lý',
    icon: FileCheck,
    steps: [
      FullChatStep.ASK_CCCD_FRONT,
      FullChatStep.ASK_CCCD_BACK,
      FullChatStep.ASK_BUSINESS_LICENSE,
    ],
  },
  {
    key: 'submit',
    label: 'Hoàn tất',
    icon: ShieldCheck,
    steps: [
      FullChatStep.CONFIRM,
      FullChatStep.SUBMITTING,
      FullChatStep.SUCCESS,
      FullChatStep.ERROR,
    ],
  },
]

const STEP_STAGE: Record<string, number> = {}
BLOCKS.forEach((block, index) => {
  block.steps.forEach((step) => {
    STEP_STAGE[step as string] = index
  })
})

export default function ProgressSidebar({
  step,
  totalAmount,
  selectedPackageName,
  selectedSignaturePackageName,
  formatCurrency,
}: ProgressSidebarProps) {
  const { formData, orderInfo, files } = useOnboarding()
  const currentIdx = STEP_ORDER.indexOf(step)
  const activeBlock = STEP_STAGE[step] ?? 0
  const showPackageInfo =
    currentIdx >= STEP_ORDER.indexOf(FullChatStep.SHOW_PACKAGES)
  const showDocumentInfo =
    currentIdx >= STEP_ORDER.indexOf(FullChatStep.ASK_CCCD_FRONT)
  const infoRows = [
    { label: 'MST', value: formData.companyTaxCode },
    { label: 'Doanh nghiệp', value: formData.companyName },
    { label: 'Đại diện', value: formData.companyRepresentativeName },
    { label: 'Liên hệ', value: formData.contactName },
    { label: 'Email', value: formData.contactEmail },
    showPackageInfo ? { label: 'Gói HĐ', value: selectedPackageName } : null,
    showPackageInfo
      ? {
          label: 'Chữ ký số',
          value: selectedSignaturePackageName
            ? selectedSignaturePackageName
            : selectedPackageName
              ? 'Chưa chọn'
              : undefined,
        }
      : null,
    showPackageInfo
      ? {
          label: 'Tổng tiền',
          value:
            totalAmount > 0 ? `${formatCurrency(totalAmount)}đ` : undefined,
          highlight: true,
        }
      : null,
    { label: 'Mã đơn', value: orderInfo?.orderId },
  ].filter(
    (row): row is { label: string; value: string; highlight?: boolean } =>
      Boolean(row?.value)
  )

  return (
    <aside className='hidden w-[340px] shrink-0 overflow-y-auto border-l border-slate-200/80 bg-white/70 p-5 shadow-[-6px_0_24px_rgb(15,23,42,0.035)] backdrop-blur-xl lg:block'>
      <div className='polished-panel mb-4 rounded-xl p-4'>
        <p className='mb-3 text-[10px] font-extrabold tracking-[0.14em] text-slate-400 uppercase'>
          Tiến độ đăng ký
        </p>
        <div className='space-y-1.5'>
          {BLOCKS.map((block) => {
            const blockIndex = STEP_STAGE[block.steps[0] as string] ?? 0
            const done = blockIndex < activeBlock
            const active = blockIndex === activeBlock
            const Icon = block.icon
            return (
              <div
                key={block.key}
                className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-all duration-300 ${
                  active
                    ? 'bg-slate-50 ring-1 ring-slate-200'
                    : done
                      ? 'bg-emerald-50/50'
                      : 'bg-transparent'
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                    done
                      ? 'bg-teal-500 shadow-sm shadow-teal-500/20'
                      : active
                        ? 'brand-action'
                        : 'bg-stone-100'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className='h-3.5 w-3.5 text-white' />
                  ) : (
                    <Icon
                      className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-slate-400'}`}
                    />
                  )}
                </div>
                <span
                  className={`text-xs font-semibold transition-colors duration-300 ${
                    done ? 'text-teal-600' : active ? 'text-teal-700' : 'text-slate-500'
                  }`}
                >
                  {block.label}
                </span>
                {active && (
                  <span className='ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500' />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {infoRows.length > 0 && (
        <div className='polished-panel mb-4 rounded-xl p-4'>
          <p className='mb-3 text-[10px] font-extrabold tracking-[0.14em] text-slate-400 uppercase'>
            Thông tin đã có
          </p>
          <dl className='space-y-2.5 text-xs'>
            {infoRows.map(({ label, value, highlight }) => (
              <div key={label} className='flex gap-3'>
                <dt className='w-24 shrink-0 text-slate-400 font-medium'>{label}</dt>
                <dd
                  className={`min-w-0 flex-1 break-words font-semibold leading-snug ${
                    highlight ? 'text-teal-700' : 'text-slate-700'
                  }`}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {showDocumentInfo && (
        <div className='polished-panel rounded-xl p-4'>
          <p className='mb-3 text-[10px] font-extrabold tracking-[0.14em] text-slate-400 uppercase'>
            Hồ sơ tải lên
          </p>
          <div className='space-y-2.5'>
            {[
              { label: 'CCCD mặt trước', done: !!files.frontCccd },
              { label: 'CCCD mặt sau', done: !!files.backCccd },
              { label: 'Giấy phép KD', done: !!files.businessLicense },
            ].map(({ label, done }) => (
              <div key={label} className='flex items-center gap-2.5 text-xs'>
                {done ? (
                  <CheckCircle2 className='h-4 w-4 shrink-0 text-emerald-500' />
                ) : (
                  <Circle className='h-4 w-4 shrink-0 text-slate-200' />
                )}
                <span
                  className={`font-semibold ${
                    done ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
