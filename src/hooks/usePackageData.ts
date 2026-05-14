'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchPackageData, HubPackage, RawPackage } from '@/lib/api'

export default function usePackageData(isCashRegister: boolean = false) {
  const { data, isLoading } = useQuery({
    queryKey: ['packages', isCashRegister],
    queryFn: () => fetchPackageData(isCashRegister),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    invoicePackages: data?.invoicePackages || [],
    signaturePackages: data?.signaturePackages || [],
    baseFeeItem: data?.baseFeeItem || null,
    promotions: data?.promotions || [],
    loading: isLoading,
  }
}
