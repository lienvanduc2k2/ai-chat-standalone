'use client'

import { useState } from 'react'
import { Send, User, Mail, Phone } from 'lucide-react'

export interface ContactInfo {
  contactName: string
  contactEmail: string
  contactPhone: string
}

interface ContactFormBubbleProps {
  onSubmit: (info: ContactInfo) => void
  disabled?: boolean
  defaultValues?: Partial<ContactInfo>
}

export default function ContactFormBubble({
  onSubmit,
  disabled,
  defaultValues,
}: ContactFormBubbleProps) {
  const [form, setForm] = useState<ContactInfo>({
    contactName: defaultValues?.contactName || '',
    contactEmail: defaultValues?.contactEmail || '',
    contactPhone: defaultValues?.contactPhone || '',
  })
  const [errors, setErrors] = useState<Partial<ContactInfo>>({})
  const [submitted, setSubmitted] = useState(false)

  const validate = () => {
    const e: Partial<ContactInfo> = {}
    if (!form.contactName.trim() || form.contactName.trim().length < 2)
      e.contactName = 'Vui lòng nhập họ tên đầy đủ'
    if (
      !form.contactEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)
    )
      e.contactEmail = 'Email không hợp lệ'
    const normalizedPhone = form.contactPhone.replace(/[\s.-]/g, '')
    if (!normalizedPhone || !/^(0|\+84)\d{9,10}$/.test(normalizedPhone))
      e.contactPhone = 'SĐT không hợp lệ (10-11 số)'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setSubmitted(true)
    onSubmit(form)
  }

  if (submitted) {
    return (
      <div className='w-full rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-4 shadow-sm backdrop-blur-md sm:max-w-sm sm:px-5'>
        <div className='flex items-center justify-between'>
          <p className='text-[11px] font-bold tracking-wider text-emerald-700 uppercase'>
            Thông tin liên hệ đã lưu
          </p>
          <button
            type='button'
            onClick={() => setSubmitted(false)}
            className='text-[10px] font-bold text-emerald-600 underline hover:text-emerald-800 transition-colors'
          >
            Sửa lại
          </button>
        </div>
        <p className='mt-2 text-sm font-medium text-emerald-800'>
          {form.contactName} · {form.contactEmail} · {form.contactPhone}
        </p>
      </div>
    )
  }

  return (
    <div className='polished-panel w-full rounded-xl p-4 sm:max-w-sm sm:p-5'>
      <p className='mb-4 text-[10px] font-extrabold tracking-[0.14em] text-slate-400 uppercase'>
        Thông tin người liên hệ
      </p>
      <div className='space-y-4'>
        {/* Name */}
        <div>
          <label className='mb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase'>
            <User className='h-3.5 w-3.5' /> Họ và tên
          </label>
          <input
            disabled={disabled}
            value={form.contactName}
            onChange={(e) =>
              setForm((p) => ({ ...p, contactName: e.target.value }))
            }
            placeholder='Nguyễn Văn A'
            className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] font-medium transition-all outline-none disabled:opacity-50 ${errors.contactName ? 'border-red-300 bg-red-50 text-red-900 placeholder:text-red-300' : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10'}`}
          />
          {errors.contactName && (
            <p className='mt-1.5 text-[11px] font-medium text-red-500'>
              {errors.contactName}
            </p>
          )}
        </div>
        {/* Email */}
        <div>
          <label className='mb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase'>
            <Mail className='h-3.5 w-3.5' /> Email nhận tài khoản
          </label>
          <input
            disabled={disabled}
            type='email'
            value={form.contactEmail}
            onChange={(e) =>
              setForm((p) => ({ ...p, contactEmail: e.target.value }))
            }
            placeholder='email@company.com'
            className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] font-medium transition-all outline-none disabled:opacity-50 ${errors.contactEmail ? 'border-red-300 bg-red-50 text-red-900 placeholder:text-red-300' : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10'}`}
          />
          {errors.contactEmail && (
            <p className='mt-1.5 text-[11px] font-medium text-red-500'>
              {errors.contactEmail}
            </p>
          )}
        </div>
        {/* Phone */}
        <div>
          <label className='mb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase'>
            <Phone className='h-3.5 w-3.5' /> Số điện thoại liên hệ
          </label>
          <input
            disabled={disabled}
            type='tel'
            value={form.contactPhone}
            onChange={(e) =>
              setForm((p) => ({ ...p, contactPhone: e.target.value }))
            }
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder='0901 234 567'
            className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] font-medium transition-all outline-none disabled:opacity-50 ${errors.contactPhone ? 'border-red-300 bg-red-50 text-red-900 placeholder:text-red-300' : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10'}`}
          />
          {errors.contactPhone && (
            <p className='mt-1.5 text-[11px] font-medium text-red-500'>
              {errors.contactPhone}
            </p>
          )}
        </div>

        <p className='rounded-lg border border-slate-100 bg-slate-50 p-3 text-[11px] font-medium leading-relaxed text-slate-500'>
          Email dùng để gửi thông tin tài khoản hóa đơn điện tử sau khi đăng ký thành công.
        </p>

        <button
          type='button'
          disabled={disabled}
          onClick={handleSubmit}
          className='brand-action flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[13px] font-extrabold transition-all active:scale-[0.98] disabled:opacity-50'
        >
          <Send className='h-4 w-4' />
          Xác nhận thông tin
        </button>
      </div>
    </div>
  )
}
