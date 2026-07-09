export default function Loading() {
  return (
    <>
      <div className="site-header">
        <div className="site-header-inner">
          <div className="skeleton" style={{ width: 120, height: 32 }} />
          <div className="skeleton" style={{ width: 90, height: 32 }} />
        </div>
      </div>
      <main className="page">
        <div className="skeleton sk-line" style={{ width: 200, height: 26 }} />
        <div className="why-grid" style={{ marginTop: 18 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton sk-card" />
          ))}
        </div>
      </main>
    </>
  )
}
