import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@/components/Icon'
import { SiteHeader } from '@/components/SiteHeader'

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <section className="hero">
          <div>
            <span className="pill pill-pink">
              <Icon name="sparkles" /> منصة سعودية للوعي والتوازن
            </span>
            <h1>
              منصة متكاملة لاختبارات <span>المؤشرات</span> وتنمية الوعي الذاتي
            </h1>
            <p className="lead">
              افهم نمطك التحفيزي وعاداتك اليومية، واخرج بخطوة عملية واحدة على الأقل — بلغة ودودة ومطمئنة.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-pink" href="/register">
                ابدأ رحلتك الآن
              </Link>
              <a className="btn btn-ghost" href="#why">
                تعرّف على دندونة
              </a>
            </div>
            <div className="hero-chips">
              <span className="hc">
                <Icon name="shield-check" /> خصوصية كاملة
              </span>
              <span className="hc">
                <Icon name="flask-conical" /> أساس علمي
              </span>
            </div>
          </div>
          <div className="hero-photo">
            <Image
              src="/dana_child.jpg"
              alt="طفلة مبهجة بابتسامة طبيعية وإكليل زهور — صورة دندونة الرئيسية"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 45vw"
              style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
            />
            <span className="float-chip a">
              <Icon name="smile" /> مزاج جيد
            </span>
            <span className="float-chip b">
              <span className="n">78</span> مرتفع
            </span>
          </div>
        </section>

        <section className="trust">
          <div className="t">
            <div className="ic-tile">
              <Icon name="flask-conical" />
            </div>
            <b>علمية موثوقة</b>
            <small>مصمّمة بإشراف مختصين</small>
          </div>
          <div className="t">
            <div className="ic-tile">
              <Icon name="lock" />
            </div>
            <b>تراعي خصوصيتك</b>
            <small>بياناتك آمنة بالكامل</small>
          </div>
          <div className="t">
            <div className="ic-tile">
              <Icon name="sparkles" />
            </div>
            <b>خطط مخصّصة</b>
            <small>حسب احتياجاتك</small>
          </div>
          <div className="t">
            <div className="ic-tile">
              <Icon name="trending-up" />
            </div>
            <b>تتبّع تقدّمك</b>
            <small>وحقّق أهدافك</small>
          </div>
        </section>

        <section className="why" id="why">
          <h3>لماذا دندونة؟</h3>
          <div className="why-grid">
            <div className="why-c">
              <div className="ic-tile">
                <Icon name="brain" />
              </div>
              <b>اختبارات علمية موثوقة</b>
              <p>مقاييس تقيس مؤشرات التوازن التحفيزي والسلوكي بدقة.</p>
            </div>
            <div className="why-c">
              <div className="ic-tile">
                <Icon name="target" />
              </div>
              <b>برامج مخصّصة</b>
              <p>خطط شخصية بناءً على نتائجك واحتياجاتك.</p>
            </div>
            <div className="why-c">
              <div className="ic-tile">
                <Icon name="book-open" />
              </div>
              <b>محتوى معرفي موثوق</b>
              <p>مقالات وأدوات مراجَعة علميًا ولغويًا.</p>
            </div>
            <div className="why-c">
              <div className="ic-tile">
                <Icon name="heart-handshake" />
              </div>
              <b>متوافقة مع قيمنا</b>
              <p>ركن طمأنينة اختياري يدعم بناء العادة.</p>
            </div>
          </div>
        </section>

        <section className="reassure" style={{ marginTop: 22 }}>
          <span className="gi">
            <Icon name="moon-star" />
          </span>
          <div className="tx">
            <div className="lbl">ركن الطمأنينة</div>
            <div className="v">
              «وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ وَلَا تَعَاوَنُوا عَلَى الْإِثْمِ وَالْعُدْوَانِ» — المائدة ٢
            </div>
          </div>
        </section>

        <section className="foot-trust">
          <span className="fc">
            <Icon name="flask-conical" /> مستند إلى العلم
          </span>
          <span className="fc">
            <Icon name="shield" /> آمن وموثوق
          </span>
          <span className="fc">
            <Icon name="users" /> شامل للجميع
          </span>
          <span className="fc">
            <Icon name="heart-handshake" /> متوافق مع قيمنا
          </span>
          <span className="fc">
            <Icon name="trending-up" /> مستمر التطور
          </span>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p>© {new Date().getFullYear()} منصة دندونة · جميع الحقوق محفوظة</p>
        <p className="disclaimer">النتائج إرشادية تثقيفية وليست تشخيصًا طبيًا.</p>
        <nav className="footer-links">
          <Link href="/privacy">الخصوصية</Link>
          <Link href="/login">تسجيل الدخول</Link>
        </nav>
      </div>
    </footer>
  )
}
