export default function XpressBankLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      {children}
    </div>
  );
}
