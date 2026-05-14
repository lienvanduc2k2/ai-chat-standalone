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

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://invoice-hub.atomsolution.vn'

function withBasePath(path: string) {
  return `${basePath}${path}`
}

function absoluteUrl(path: string) {
  return new URL(withBasePath(path), siteUrl).toString()
}

const appIcon = withBasePath('/icon.png')
const appleIcon = withBasePath('/apple-icon.png')
const favicon = withBasePath('/favicon.ico')
const canonicalUrl = new URL(siteUrl).toString()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    canonical: canonicalUrl,
  },
  icons: {
    icon: [
      { url: favicon, sizes: 'any' },
      { url: appIcon, type: 'image/png' },
    ],
    shortcut: favicon,
    apple: appleIcon,
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: '1Invoice',
    title: 'Trợ lý AI 1Invoice',
    description: 'Đăng ký hóa đơn điện tử 1Invoice nhanh hơn với trợ lý AI.',
    url: canonicalUrl,
    images: [
      {
        url: absoluteUrl('/icon.png'),
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
    images: [absoluteUrl('/icon.png')],
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
