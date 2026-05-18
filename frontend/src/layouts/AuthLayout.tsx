export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-grad-brand flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 mb-3">
            <span className="text-white text-2xl font-black">E</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-wide">ERPGest</h1>
          <p className="text-white/70 text-sm mt-1">Sistema de Gestão Empresarial</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
