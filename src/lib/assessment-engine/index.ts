// ============================================================
//  محرّك التقييم — دندونة
//  يحوّل استجابات جلسة إلى: أسئلة عكسية → درجة خام → تطبيع ٠–١٠٠
//  → نطاق تفسيري → أعلام تنبيهية.
//  كل الحساب يتم في الخادم. دوال نقية قابلة للاختبار.
// ============================================================

export type ScoringMethod = "SUM" | "AVERAGE" | "WEIGHTED" | "SUBSCALE";

export interface EngineQuestion {
  id: string;
  weight: number;
  subscale: string | null;
  isReverse: boolean;
  /** قيمة الإجابة المختارة (أو null إن لم يُجَب / نصي) */
  value: number | null;
  /** حد رفع العَلَم التنبيهي (على القيمة الفعّالة) — اختياري */
  flagThreshold?: number | null;
  flagLabel?: string | null;
}

export interface EngineBand {
  subscale: string | null;
  minScore: number;
  maxScore: number;
  label: string;
  interpretation: string;
}

export interface SubscaleResult {
  subscale: string | null;
  rawScore: number;
  normalizedScore: number; // ٠–١٠٠
  band: string;
  interpretation: string;
  flags: string[];
}

export interface EngineConfig {
  method: ScoringMethod;
  /** أدنى وأعلى قيمة ممكنة للخيار الواحد (للعكس والتطبيع) */
  optionMin: number;
  optionMax: number;
}

/** يطبّق العكس على قيمة سؤال عكسي: max + min - value */
export function effectiveValue(q: EngineQuestion, cfg: EngineConfig): number | null {
  if (q.value == null) return null;
  return q.isReverse ? cfg.optionMax + cfg.optionMin - q.value : q.value;
}

/** الدرجة الخام لمجموعة أسئلة وفق الطريقة (القيم بعد العكس). */
export function computeRaw(questions: EngineQuestion[], cfg: EngineConfig): number {
  const scored = questions
    .map((q) => ({ q, v: effectiveValue(q, cfg) }))
    .filter((x) => x.v !== null) as { q: EngineQuestion; v: number }[];
  if (scored.length === 0) return 0;

  switch (cfg.method) {
    case "AVERAGE":
      return scored.reduce((a, x) => a + x.v, 0) / scored.length;
    case "WEIGHTED":
      return scored.reduce((a, x) => a + x.v * x.q.weight, 0);
    case "SUM":
    case "SUBSCALE":
    default:
      return scored.reduce((a, x) => a + x.v, 0);
  }
}

/** يطبّع الدرجة الخام إلى ٠–١٠٠ بناءً على المدى الممكن للأسئلة المُجابة. */
export function normalize(questions: EngineQuestion[], raw: number, cfg: EngineConfig): number {
  const answered = questions.filter((q) => q.value !== null);
  if (answered.length === 0) return 0;

  const weightFactor = (q: EngineQuestion) => (cfg.method === "WEIGHTED" ? q.weight : 1);
  let min = 0;
  let max = 0;
  for (const q of answered) {
    min += cfg.optionMin * weightFactor(q);
    max += cfg.optionMax * weightFactor(q);
  }
  if (cfg.method === "AVERAGE") {
    min = cfg.optionMin;
    max = cfg.optionMax;
  }
  if (max - min <= 0) return 0;
  const pct = ((raw - min) / (max - min)) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)));
}

/** يطابق الدرجة الخام مع النطاق المناسب. */
export function matchBand(raw: number, bands: EngineBand[]): EngineBand | null {
  return bands.find((b) => raw >= b.minScore && raw <= b.maxScore) ?? null;
}

/** يجمع الأعلام التنبيهية من الأسئلة التي بلغت قيمتها الفعّالة حدّ العَلَم. */
export function collectFlags(questions: EngineQuestion[], cfg: EngineConfig): string[] {
  const flags: string[] = [];
  for (const q of questions) {
    if (q.flagThreshold == null || !q.flagLabel) continue;
    const v = effectiveValue(q, cfg);
    if (v !== null && v >= q.flagThreshold) flags.push(q.flagLabel);
  }
  return flags;
}

/**
 * يحتسب النتيجة الكاملة لجلسة. عند SUBSCALE تُحسب كل مجموعة فرعية على حدة.
 */
export function scoreAssessment(
  questions: EngineQuestion[],
  bands: EngineBand[],
  cfg: EngineConfig,
): SubscaleResult[] {
  const flags = collectFlags(questions, cfg);

  if (cfg.method === "SUBSCALE") {
    const groups = new Map<string | null, EngineQuestion[]>();
    for (const q of questions) {
      const key = q.subscale ?? null;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(q);
    }
    const results: SubscaleResult[] = [];
    for (const [sub, qs] of groups) {
      const subCfg: EngineConfig = { ...cfg, method: "SUM" };
      const raw = computeRaw(qs, subCfg);
      const subBands = bands.filter((b) => b.subscale === sub);
      const band = matchBand(raw, subBands.length ? subBands : bands);
      results.push({
        subscale: sub,
        rawScore: raw,
        normalizedScore: normalize(qs, raw, subCfg),
        band: band?.label ?? "غير محدد",
        interpretation: band?.interpretation ?? "",
        flags: collectFlags(qs, subCfg),
      });
    }
    return results;
  }

  const raw = computeRaw(questions, cfg);
  const band = matchBand(raw, bands.filter((b) => b.subscale === null));
  return [
    {
      subscale: null,
      rawScore: raw,
      normalizedScore: normalize(questions, raw, cfg),
      band: band?.label ?? "غير محدد",
      interpretation: band?.interpretation ?? "",
      flags,
    },
  ];
}
