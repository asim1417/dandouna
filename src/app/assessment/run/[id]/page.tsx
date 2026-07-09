import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/session'
import { SiteHeader } from '@/components/SiteHeader'
import { AssessmentRunner, type RunnerQuestion } from '@/components/AssessmentRunner'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'الاختبار' }

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser()
  if (!user) redirect('/auth')

  const { id } = await params
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      responses: true,
      version: {
        include: {
          scale: { select: { title: true } },
          questions: {
            orderBy: { order: 'asc' },
            include: { options: { orderBy: { order: 'asc' } } },
          },
        },
      },
    },
  })

  if (!assessment || assessment.userId !== user.id) notFound()
  if (assessment.status === 'COMPLETED') redirect(`/assessment/result/${assessment.id}`)

  const questions: RunnerQuestion[] = assessment.version.questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options.map((o) => ({ label: o.label, value: o.value })),
  }))

  const initialAnswers: Record<string, number> = {}
  for (const r of assessment.responses) {
    if (r.value != null) initialAnswers[r.questionId] = r.value
  }

  return (
    <>
      <SiteHeader />
      <main className="page">
        <AssessmentRunner
          assessmentId={assessment.id}
          scaleTitle={assessment.version.scale.title}
          questions={questions}
          initialAnswers={initialAnswers}
        />
      </main>
    </>
  )
}
