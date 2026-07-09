import { OrgPortal } from '@/components/OrgPortal'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'بوابة المؤسسات' }

export default function InstitutionPage() {
  return <OrgPortal orgType="INSTITUTION" title="بوابة المؤسسات" subtitle="مؤشرات عامة مجمّعة لمنسوبي مؤسستك — بخصوصية كاملة." />
}
