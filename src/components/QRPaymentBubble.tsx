'use client'

import { CheckCircle2, Clock, Loader2, RefreshCw, XCircle } from 'lucide-react'

interface QRPaymentBubbleProps {
  amount: number
  orderId?: string
  qrDataUrl: string
  status: string
  message: string
  timeLeft: number
  formatCurrency: (v: number) => string
}

const formatTime = (s: number) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

export default function QRPaymentBubble({
  amount,
  orderId,
  qrDataUrl,
  status,
  message,
  timeLeft,
  formatCurrency,
}: QRPaymentBubbleProps) {
  if (status === 'free') {
    return (
      <div className='w-full max-w-xs rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 text-center shadow-sm backdrop-blur-md sm:p-6'>
        <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-md shadow-emerald-500/20'>
          <CheckCircle2 className='h-7 w-7 text-white' />
        </div>
        <p className='text-base font-extrabold text-emerald-800'>Đơn hàng miễn phí</p>
        <p className='mt-1.5 text-sm text-emerald-600 font-medium'>
          Không cần thanh toán cho đơn hàng này.
        </p>
      </div>
    )
  }

  const isPaid = status === 'paid'
  const isFailed = ['wrong_amount', 'failed', 'expired'].includes(status)
  const isPending = status === 'pending' || status === 'loading'

  return (
    <div className='w-full max-w-sm overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_12px_32px_rgb(15,23,42,0.07)] sm:max-w-md'>
      <div className='payment-header px-4 py-4 sm:px-6'>
        <p className='text-[10px] font-extrabold tracking-[0.14em] text-white/65 uppercase'>
          Số tiền cần thanh toán
        </p>
        <p className='mt-1 text-2xl font-extrabold text-white sm:text-3xl'>
          {formatCurrency(amount)}
          <span className='ml-1.5 text-base font-bold text-white/55'>đ</span>
        </p>
        {orderId && (
          <p className='mt-1.5 text-[11px] font-semibold text-white/70'>Mã đơn: {orderId}</p>
        )}
      </div>

      <div className='flex items-center justify-center px-4 pt-5 pb-6 sm:px-6'>
        <div className='flex aspect-square w-full max-w-[224px] items-center justify-center rounded-xl border-2 border-slate-100 bg-slate-50 shadow-inner'>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt='QR Code'
              className='h-full w-full rounded-xl object-contain p-2 mix-blend-multiply'
            />
          ) : (
            <Loader2 className='h-8 w-8 animate-spin text-slate-300' />
          )}
        </div>
      </div>

      <div className='border-t border-slate-100 bg-slate-50/50 px-4 py-3.5 text-center text-[11px] text-slate-500 sm:px-6'>
        <p className='font-bold tracking-[0.08em] text-slate-800 uppercase'>ATOM SOLUTION — BVBank</p>
        <p className='mt-0.5 text-sm'>
          STK: <span className='font-extrabold text-slate-900'>31052207</span>
        </p>
      </div>

      <div
        className={`flex flex-col gap-2 border-t px-4 py-3.5 text-xs transition-colors duration-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
          isPaid
            ? 'border-emerald-200/50 bg-emerald-50'
            : isFailed
              ? 'border-red-200/50 bg-red-50'
              : 'border-slate-100 bg-slate-50'
        }`}
      >
        <span
          className={`flex items-start gap-2 font-bold ${
            isPaid ? 'text-emerald-700' : isFailed ? 'text-red-600' : 'text-slate-700'
          }`}
        >
          {isPaid ? (
            <CheckCircle2 className='mt-px h-4 w-4 shrink-0' />
          ) : isFailed ? (
            <XCircle className='mt-px h-4 w-4 shrink-0' />
          ) : (
            <RefreshCw className='mt-px h-4 w-4 shrink-0 animate-spin text-slate-400' />
          )}
          {message || 'Đang chờ thanh toán...'}
        </span>
        {isPending && (
          <span className='ml-6 flex w-max items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 font-mono font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 sm:ml-0'>
            <Clock className='h-3.5 w-3.5 text-slate-400' />
            {formatTime(timeLeft)}
          </span>
        )}
      </div>
    </div>
  )
}
