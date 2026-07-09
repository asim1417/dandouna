import { OrgPortal } from '@/components/OrgPortal'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'بوابة الشركات' }

export default function CompanyPage() {
  return <OrgPortal orgType="COMPANY" title="بوابة الشركات" subtitle="مؤشرات رفاه رقمي عامة لموظفيك — دون أسماء أو استخدام تمييزي." />
}
