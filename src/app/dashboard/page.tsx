import { redirect } from 'next/navigation'

// توحيد لوحة ولي الأمر تحت /parent-dashboard
export default function DashboardRedirect() {
  redirect('/parent-dashboard')
}
