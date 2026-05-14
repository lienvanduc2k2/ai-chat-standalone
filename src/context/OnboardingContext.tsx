'use client'

import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react'

export interface Step1FormData {
  fullName: string
  gender: string
  dob: string
  phone: string
  cccd: string
  passport: string
  address: string
  nationality: string
  contactName: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  companyTaxCode: string
  companyName: string
  companyAddress: string
  companyTaxAuthority: string
  companyRepresentativeName?: string
  companyRepresentativePhone?: string
  companyEnrichmentSource?: string
}

export interface Step1Files {
  frontCccd: File | null
  backCccd: File | null
  businessLicense: File | null
  logo: File | null
}

export interface Step2Cart {
  invoiceType: 'mtt' | 'e-invoice'
  invoicePkg: { id: string | null; qty: number; name?: string; price?: number }
  signaturePkg: { id: string | null; qty: number; name?: string; price?: number }
}

export interface OrderInfo {
  orderId: string
  amount: number
}

interface OnboardingContextType {
  formData: Step1FormData
  setFormData: React.Dispatch<React.SetStateAction<Step1FormData>>
  files: Step1Files
  setFiles: React.Dispatch<React.SetStateAction<Step1Files>>
  serialNumber: string
  cart: Step2Cart
  setCart: React.Dispatch<React.SetStateAction<Step2Cart>>
  appliedPromos: string[]
  setAppliedPromos: React.Dispatch<React.SetStateAction<string[]>>
  orderInfo: OrderInfo | null
  setOrderInfo: React.Dispatch<React.SetStateAction<OrderInfo | null>>
}

const defaultFormData: Step1FormData = {
  fullName: '',
  gender: '',
  dob: '',
  phone: '',
  cccd: '',
  passport: '',
  address: '',
  nationality: 'VN',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  companyTaxCode: '',
  companyName: '',
  companyAddress: '',
  companyTaxAuthority: '',
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<Step1FormData>(defaultFormData)
  const [files, setFiles] = useState<Step1Files>({
    frontCccd: null,
    backCccd: null,
    businessLicense: null,
    logo: null,
  })
  const [cart, setCart] = useState<Step2Cart>({
    invoiceType: 'e-invoice',
    invoicePkg: { id: null, qty: 0 },
    signaturePkg: { id: null, qty: 0 },
  })
  const [appliedPromos, setAppliedPromos] = useState<string[]>([])
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null)

  const serialNumber = useMemo(() => {
    return cart.invoiceType === 'mtt' ? '1C26MYY' : '1C25TYY'
  }, [cart.invoiceType])

  return (
    <OnboardingContext.Provider
      value={{
        formData,
        setFormData,
        files,
        setFiles,
        serialNumber,
        cart,
        setCart,
        appliedPromos,
        setAppliedPromos,
        orderInfo,
        setOrderInfo,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider')
  return context
}
