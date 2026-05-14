import React, { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, X } from 'lucide-react'

type EContractModalProps = {
  currentOrderId: string
  showContractModal: boolean
  setShowContractModal: React.Dispatch<React.SetStateAction<boolean>>
}

export default function EContractModal({
  currentOrderId,
  showContractModal,
  setShowContractModal,
}: EContractModalProps) {
  const contractRef = useRef<HTMLDivElement>(null)
  const isInitializedRef = useRef(false)
  const [contractWidgetLoaded, setContractWidgetLoaded] = useState(false)

  useEffect(() => {
    if (!showContractModal) {
      setContractWidgetLoaded(false)
      isInitializedRef.current = false
      return
    }

    if (isInitializedRef.current) return

    const timer = setTimeout(() => {
      if (contractRef.current && (window as any).InvoiceRegisterWidget?.initEContract) {
        isInitializedRef.current = true
        ;(window as any).InvoiceRegisterWidget.initEContract({
          selector: contractRef.current,
          data: {
            orderId: currentOrderId,
            callbackUrl: `${window.location.origin}`,
          },
          onClose() {
            setShowContractModal(false)
            setContractWidgetLoaded(false)
            isInitializedRef.current = false
            sessionStorage.removeItem('onboarding_data')
          },
        })
        setContractWidgetLoaded(true)
      }
    }, 650)

    return () => clearTimeout(timer)
  }, [showContractModal, currentOrderId, setShowContractModal])

  if (!showContractModal) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-2 sm:p-6 lg:p-8 backdrop-blur-sm">
      <div className="relative flex h-[96dvh] w-full max-w-[1100px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:h-[92vh]">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-gray-900 sm:text-lg">Ký hợp đồng điện tử</h2>
            <p className="mt-0.5 text-xs text-gray-500">Mã đơn: {currentOrderId}</p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => {
              const confirmed = window.confirm('Bạn đã hoàn tất phần ký? Nhấn OK để tiếp tục.')
              if (confirmed) {
                setShowContractModal(false)
                setContractWidgetLoaded(false)
                sessionStorage.removeItem('onboarding_data')
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex flex-1 bg-gray-50">
          {!contractWidgetLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white">
              <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Đang chuẩn bị hợp đồng điện tử</p>
              <p className="mt-1 max-w-xs text-center text-xs text-gray-500">
                Hệ thống đang tải phiên ký bảo mật. Vui lòng chờ trong giây lát.
              </p>
              <div className="mt-5 flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Kết nối đơn hàng thành công
              </div>
            </div>
          )}
          <div
            id="contract"
            ref={contractRef}
            className={`h-full w-full transition-opacity duration-500 ease-out ${
              contractWidgetLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </div>
    </div>
  )
}
