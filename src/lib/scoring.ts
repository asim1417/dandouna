// ============================================================
//  محرّك احتساب الدرجات
//  يحوّل استجابات جلسة تقييم إلى درجة خام ← نطاق ← تفسير
// ============================================================

export type ScoringMethod = "SUM" | "AVERAGE" | "WEIGHTED" | "SUBSCALE";

export interface ScoredQuestion {
  questionId: string;
  weight: number;
  subscale: string | null;
  value: number | null; // القيمة المختارة أو المدخلة
}

export interface Band {
  subscale: string | null;
  minScore: number;
  maxScore: number;
  label: string;
  interpretation: string;
}

export interface SubscaleResult {
  subscale: string | null;
  rawScore: number;
  band: string;
  interpretation: string;
}

/**
 * يحسب الدرجة الخام لمجموعة من الأسئلة وفق طريقة التقييم.
 * الأسئلة النصية (value = null) تُستثنى من الاحتساب.
 */
export function computeRaw(
  questions: ScoredQuestion[],
  method: ScoringMethod
): number {
  const scored = questions.filter((q) => q.value !== null);
  if (scored.length === 0) return 0;

  switch (method) {
    case "SUM":
      return scored.reduce((acc, q) => acc + (q.value ?? 0), 0);
    case "AVERAGE":
      return (
        scored.reduce((acc, q) => acc + (q.value ?? 0), 0) / scored.length
      );
    case "WEIGHTED":
      return scored.reduce((acc, q) => acc + (q.value ?? 0) * q.weight, 0);
    default:
      return scored.reduce((acc, q) => acc + (q.value ?? 0), 0);
  }
}

/** يطابق الدرجة الخام مع النطاق المناسب. */
export function matchBand(raw: number, bands: Band[]): Band | null {
  return (
    bands.find((b) => raw >= b.minScore && raw <= b.maxScore) ?? null
  );
}

/**
 * يحتسب النتيجة الكاملة لجلسة تقييم.
 * عند طريقة SUBSCALE تُحسب كل مجموعة فرعية على حدة.
 */
export function scoreAssessment(
  questions: ScoredQuestion[],
  bands: Band[],
  method: ScoringMethod
): SubscaleResult[] {
  if (method === "SUBSCALE") {
    const groups = new Map<string | null, ScoredQuestion[]>();
    for (const q of questions) {
      const key = q.subscale ?? null;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(q);
    }
    const results: SubscaleResult[] = [];
    for (const [sub, qs] of groups) {
      const raw = computeRaw(qs, "SUM");
      const subBands = bands.filter((b) => b.subscale === sub);
      const band = matchBand(raw, subBands.length ? subBands : bands);
      results.push({
        subscale: sub,
        rawScore: raw,
        band: band?.label ?? "غير محدد",
        interpretation: band?.interpretation ?? "",
      });
    }
    return results;
  }

  const raw = computeRaw(questions, method);
  const band = matchBand(
    raw,
    bands.filter((b) => b.subscale === null)
  );
  return [
    {
      subscale: null,
      rawScore: raw,
      band: band?.label ?? "غير محدد",
      interpretation: band?.interpretation ?? "",
    },
  ];
}
