import type { Metadata, Viewport } from 'next'
import { Readex_Pro, Inter } from 'next/font/google'
import './globals.css'

// الخطوط تُحمَّل وتُستضاف محليًا عبر next/font (لا اعتماد على Google Fonts خارجيًا)
const readex = Readex_Pro({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-readex',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dandouna.sa'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'منصة دندونة · للوعي والتوازن',
    template: '%s · دندونة',
  },
  description:
    'منصة سعودية متكاملة لاختبارات المؤشرات وتنمية الوعي الذاتي — بلغة ودودة ومطمئنة، بأساس علمي وخصوصية كاملة. النتائج إرشادية تثقيفية وليست تشخيصًا.',
  keywords: ['دندونة', 'الوعي الذاتي', 'اختبارات', 'الصحة النفسية', 'السعودية', 'المراهقون', 'الأطفال'],
  authors: [{ name: 'دندونة' }],
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    siteName: 'منصة دندونة',
    title: 'منصة دندونة · للوعي والتوازن',
    description: 'منصة سعودية لاختبارات المؤشرات وتنمية الوعي الذاتي — بأساس علمي وخصوصية كاملة.',
    images: ['/dana_child.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'منصة دندونة · للوعي والتوازن',
    description: 'منصة سعودية لاختبارات المؤشرات وتنمية الوعي الذاتي.',
    images: ['/dana_child.jpg'],
  },
  icons: {
    icon: '/favicon.svg',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#F74A80',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${readex.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
