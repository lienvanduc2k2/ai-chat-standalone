import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import Script from 'next/script'
import { Providers } from './providers'
import './globals.css'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

const appIcon = '/icon.png'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://invoice-hub.atomsolution.vn'),
  applicationName: 'Trợ lý AI 1Invoice',
  title: {
    default: 'Trợ lý AI 1Invoice',
    template: '%s | 1Invoice',
  },
  description: 'Trợ lý AI hỗ trợ doanh nghiệp đăng ký hóa đơn điện tử 1Invoice, chọn gói dịch vụ, thanh toán và hoàn tất hồ sơ pháp lý.',
  keywords: [
    '1Invoice',
    'hóa đơn điện tử',
    'đăng ký hóa đơn điện tử',
    'máy tính tiền',
    'chữ ký số',
    'trợ lý AI',
  ],
  authors: [{ name: 'ATOM Solution' }],
  creator: 'ATOM Solution',
  publisher: 'ATOM Solution',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: appIcon, type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: '1Invoice',
    title: 'Trợ lý AI 1Invoice',
    description: 'Đăng ký hóa đơn điện tử 1Invoice nhanh hơn với trợ lý AI.',
    url: '/',
    images: [
      {
        url: appIcon,
        width: 512,
        height: 512,
        alt: '1Invoice',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Trợ lý AI 1Invoice',
    description: 'Trợ lý AI hỗ trợ đăng ký hóa đơn điện tử 1Invoice.',
    images: [appIcon],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'business',
  appleWebApp: {
    capable: true,
    title: '1Invoice AI',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://stag-invoice-hub.atomsolution.vn/onboarding/widget.css" />
        <Script src="https://stag-invoice-hub.atomsolution.vn/onboarding/widget.js" crossOrigin="anonymous" strategy="beforeInteractive" />
      </head>
      <body className={beVietnamPro.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
