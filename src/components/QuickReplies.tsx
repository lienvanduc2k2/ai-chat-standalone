'use client'

import { ArrowRight, X } from 'lucide-react'

interface QuickRepliesProps {
  replies: string[]
  onSelect: (reply: string) => void
}

const REMOVE_KEYWORDS = ['Bỏ', 'Không cần', 'Nhập lại']

export default function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  if (!replies.length) return null
  return (
    <div className='flex gap-2 overflow-x-auto px-3 pt-3 pb-1.5 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:px-4'>
      {replies.map((reply, i) => {
        const isRemove = REMOVE_KEYWORDS.some((kw) => reply.startsWith(kw))
        const isPrimary = i === 0
        return (
          <button
            key={reply}
            type='button'
            onClick={() => onSelect(reply)}
            className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-bold transition-all duration-200 active:scale-95 sm:px-4 sm:text-[13px] ${
              isRemove
                ? 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700'
              : isPrimary
                  ? 'brand-action border-teal-400'
                  : 'border-teal-100 bg-white text-slate-600 shadow-sm hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700'
            }`}
          >
            {isRemove ? (
              <X className='h-3.5 w-3.5 text-slate-400' />
            ) : (
              <ArrowRight
                className={`h-3.5 w-3.5 ${isPrimary ? 'text-white/80' : 'text-slate-400'}`}
              />
            )}
            {reply}
          </button>
        )
      })}
    </div>
  )
}
