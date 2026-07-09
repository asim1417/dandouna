import { test } from "node:test";
import assert from "node:assert/strict";
import {
  effectiveValue,
  computeRaw,
  normalize,
  matchBand,
  collectFlags,
  scoreAssessment,
  type EngineQuestion,
  type EngineBand,
  type EngineConfig,
} from "./index.ts";

const cfg: EngineConfig = { method: "SUM", optionMin: 0, optionMax: 4 };

function q(partial: Partial<EngineQuestion>): EngineQuestion {
  return { id: "q", weight: 1, subscale: null, isReverse: false, value: 0, ...partial };
}

test("السؤال العكسي يقلب القيمة (max+min-value)", () => {
  assert.equal(effectiveValue(q({ isReverse: true, value: 0 }), cfg), 4);
  assert.equal(effectiveValue(q({ isReverse: true, value: 4 }), cfg), 0);
  assert.equal(effectiveValue(q({ isReverse: false, value: 3 }), cfg), 3);
  assert.equal(effectiveValue(q({ value: null }), cfg), null);
});

test("الدرجة الخام: SUM تجمع القيم بعد العكس", () => {
  const qs = [q({ value: 4 }), q({ value: 4 }), q({ isReverse: true, value: 0 })];
  // 4 + 4 + (4-0)=4 => 12
  assert.equal(computeRaw(qs, cfg), 12);
});

test("WEIGHTED يضرب في الوزن", () => {
  const qs = [q({ value: 2, weight: 2 }), q({ value: 3, weight: 1 })];
  assert.equal(computeRaw(qs, { ...cfg, method: "WEIGHTED" }), 2 * 2 + 3 * 1);
});

test("AVERAGE يقسم على العدد", () => {
  const qs = [q({ value: 2 }), q({ value: 4 })];
  assert.equal(computeRaw(qs, { ...cfg, method: "AVERAGE" }), 3);
});

test("التطبيع إلى ٠–١٠٠", () => {
  // ٣ أسئلة، القيم القصوى => 12/12 => 100
  const full = [q({ value: 4 }), q({ value: 4 }), q({ value: 4 })];
  assert.equal(normalize(full, computeRaw(full, cfg), cfg), 100);
  // الأدنى => 0
  const low = [q({ value: 0 }), q({ value: 0 })];
  assert.equal(normalize(low, computeRaw(low, cfg), cfg), 0);
  // منتصف => 50
  const mid = [q({ value: 2 }), q({ value: 2 })];
  assert.equal(normalize(mid, computeRaw(mid, cfg), cfg), 50);
});

test("الأسئلة غير المُجابة تُستثنى من المقام", () => {
  const qs = [q({ value: 4 }), q({ value: 4 }), q({ value: null })];
  assert.equal(normalize(qs, computeRaw(qs, cfg), cfg), 100);
});

test("مطابقة النطاق", () => {
  const bands: EngineBand[] = [
    { subscale: null, minScore: 0, maxScore: 6, label: "منخفض", interpretation: "أ" },
    { subscale: null, minScore: 7, maxScore: 13, label: "متوسط", interpretation: "ب" },
    { subscale: null, minScore: 14, maxScore: 20, label: "مرتفع", interpretation: "ج" },
  ];
  assert.equal(matchBand(3, bands)?.label, "منخفض");
  assert.equal(matchBand(10, bands)?.label, "متوسط");
  assert.equal(matchBand(20, bands)?.label, "مرتفع");
  assert.equal(matchBand(99, bands), null);
});

test("الأعلام التنبيهية ترتفع عند بلوغ الحد (بعد العكس)", () => {
  const qs = [
    q({ value: 4, flagThreshold: 4, flagLabel: "استخدام مفرط" }),
    q({ value: 1, flagThreshold: 4, flagLabel: "لا يظهر" }),
    q({ isReverse: true, value: 0, flagThreshold: 4, flagLabel: "عكسي بلغ الحد" }),
  ];
  const flags = collectFlags(qs, cfg);
  assert.deepEqual(flags, ["استخدام مفرط", "عكسي بلغ الحد"]);
});

test("scoreAssessment يعيد نتيجة كاملة مع نطاق وأعلام وتطبيع", () => {
  const bands: EngineBand[] = [
    { subscale: null, minScore: 0, maxScore: 6, label: "منخفض", interpretation: "أ" },
    { subscale: null, minScore: 7, maxScore: 13, label: "متوسط", interpretation: "ب" },
    { subscale: null, minScore: 14, maxScore: 20, label: "مرتفع", interpretation: "ج" },
  ];
  const qs = [
    q({ value: 4, flagThreshold: 4, flagLabel: "تنبيه" }),
    q({ value: 4 }),
    q({ value: 4 }),
    q({ value: 4 }),
    q({ value: 4 }),
  ];
  const [res] = scoreAssessment(qs, bands, cfg);
  assert.equal(res.rawScore, 20);
  assert.equal(res.normalizedScore, 100);
  assert.equal(res.band, "مرتفع");
  assert.deepEqual(res.flags, ["تنبيه"]);
});

test("SUBSCALE يحسب كل محور على حدة", () => {
  const bands: EngineBand[] = [
    { subscale: "أ", minScore: 0, maxScore: 4, label: "منخفض-أ", interpretation: "" },
    { subscale: "أ", minScore: 5, maxScore: 8, label: "مرتفع-أ", interpretation: "" },
    { subscale: "ب", minScore: 0, maxScore: 8, label: "ب-كامل", interpretation: "" },
  ];
  const qs = [
    q({ subscale: "أ", value: 4 }),
    q({ subscale: "أ", value: 4 }),
    q({ subscale: "ب", value: 1 }),
  ];
  const results = scoreAssessment(qs, bands, { ...cfg, method: "SUBSCALE" });
  const a = results.find((r) => r.subscale === "أ")!;
  const b = results.find((r) => r.subscale === "ب")!;
  assert.equal(a.rawScore, 8);
  assert.equal(a.band, "مرتفع-أ");
  assert.equal(b.rawScore, 1);
  assert.equal(b.band, "ب-كامل");
});
