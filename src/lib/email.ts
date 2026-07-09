// ============================================================
//  إرسال البريد — OTP / رابط الدخول
//  يستخدم Resend عند توفّر RESEND_API_KEY، وإلا يسجّل في السجلّ (تطوير)
// ============================================================

const FROM = process.env.EMAIL_FROM || "دندونة <no-reply@dandouna.sa>";
const RESEND_KEY = process.env.RESEND_API_KEY;

export type SendResult = { delivered: boolean; devCode?: string };

/** يرسل رمز تحقق (OTP) إلى البريد. في التطوير بلا مزوّد، يُعيد الرمز للاختبار. */
export async function sendOtpEmail(email: string, code: string): Promise<SendResult> {
  const subject = "رمز الدخول إلى دندونة";
  const html = otpTemplate(code);

  if (!RESEND_KEY) {
    // وضع التطوير: لا مزوّد بريد — نسجّل الرمز ونعيده للاختبار المحلي فقط
    console.log(`[DEV OTP] ${email} → ${code}`);
    return { delivered: false, devCode: process.env.NODE_ENV !== "production" ? code : undefined };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: email, subject, html }),
  });
  if (!res.ok) {
    console.error("Resend error:", await res.text().catch(() => ""));
    return { delivered: false };
  }
  return { delivered: true };
}

function otpTemplate(code: string): string {
  return `
  <div dir="rtl" style="font-family:'Readex Pro',Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1E3A8A">
    <h2 style="color:#F74A80">دندونة</h2>
    <p>رمز الدخول الخاص بك:</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#FFF5F8;border-radius:14px;padding:16px;text-align:center;color:#F74A80">${code}</div>
    <p style="color:#64748B;font-size:13px">صالح لمدة ١٠ دقائق. إن لم تطلب هذا الرمز فتجاهل الرسالة.</p>
  </div>`;
}
