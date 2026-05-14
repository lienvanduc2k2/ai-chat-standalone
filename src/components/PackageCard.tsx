'use client'

import { Check, FileText, PenTool } from 'lucide-react'
import { ChatPackage } from '@/hooks/useFullChatFlow'

interface PackageCardProps {
  pkg: ChatPackage
  selected: boolean
  onSelect: (pkg: ChatPackage) => void
  formatCurrency: (v: number) => string
  type?: 'invoice' | 'signature'
}

export default function PackageCard({
  pkg,
  selected,
  onSelect,
  formatCurrency,
  type = 'invoice',
}: PackageCardProps) {
  const Icon = type === 'signature' ? PenTool : FileText

  return (
    <button
      type='button'
      onClick={() => onSelect(pkg)}
      aria-pressed={selected}
      className={`group relative w-full rounded-xl border text-left transition-all duration-300 hover:-translate-y-0.5 ${
        selected
          ? 'border-teal-500 bg-white shadow-[0_12px_30px_rgb(13,148,136,0.12)] ring-1 ring-teal-500'
          : 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-[0_12px_28px_rgb(15,23,42,0.07)]'
      }`}
    >
      {selected && (
        <div className='absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 shadow-sm shadow-teal-500/30'>
          <Check className='h-3.5 w-3.5 text-white' />
        </div>
      )}

      <div className='p-3.5 sm:p-4'>
        <div className='flex items-start gap-3'>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 sm:h-10 sm:w-10 ${
              selected ? 'bg-teal-50 ring-1 ring-teal-100' : 'bg-slate-50 ring-1 ring-slate-100 group-hover:bg-slate-100'
            }`}
          >
            <Icon
              className={`h-5 w-5 transition-colors ${
                selected ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
              }`}
            />
          </div>
          <div className='min-w-0 flex-1 pr-6 sm:pr-7'>
            <p className='text-sm leading-snug font-extrabold text-slate-900'>
              {pkg.name}
            </p>
            <p className='mt-0.5 text-xs font-medium text-slate-500'>{pkg.qtyLabel}</p>
          </div>
        </div>

        <div className='mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:gap-3'>
          <p className='text-lg font-extrabold text-slate-950 sm:text-xl'>
            {formatCurrency(pkg.price)}
            <span className='ml-0.5 text-sm font-semibold text-slate-400'>đ</span>
          </p>
          <div
            className={`rounded-md px-2.5 py-1.5 text-[10px] font-extrabold tracking-[0.08em] uppercase transition-all duration-300 sm:px-3 sm:text-[11px] ${
              selected
                ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200'
                : 'bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-700 group-hover:ring-1 group-hover:ring-teal-100'
            }`}
          >
            {selected ? '✓ Đã chọn' : 'Chọn'}
          </div>
        </div>
      </div>
    </button>
  )
}
