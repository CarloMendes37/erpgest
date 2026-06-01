import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import SneatLayout from '@/layouts/SneatLayout';

// ── Lazy imports ────────────────────────────────────────────────
const Login           = lazy(() => import('@/pages/Login'));
const Register        = lazy(() => import('@/pages/Register'));
const Dashboard       = lazy(() => import('@/pages/Dashboard'));
const Clientes        = lazy(() => import('@/pages/Clientes'));
const Artigos         = lazy(() => import('@/pages/Artigos'));
const Faturas         = lazy(() => import('@/pages/Faturas'));
const FaturaDetalhe   = lazy(() => import('@/pages/FaturaDetalhe'));
const ContaCorrente   = lazy(() => import('@/pages/ContaCorrente'));
const Mapas           = lazy(() => import('@/pages/Mapas'));
const Perfil          = lazy(() => import('@/pages/Perfil'));
// Admin
const UsersAdmin      = lazy(() => import('@/pages/admin/Users'));
const RolesAdmin      = lazy(() => import('@/pages/admin/Roles'));
const TenantsAdmin    = lazy(() => import('@/pages/admin/Tenants'));
const LicenseAdmin    = lazy(() => import('@/pages/admin/License'));

// ── Spinner ──────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="animate-spin text-indigo-500" size={36} />
  </div>
);

// ── Guard: redireciona para /login se não autenticado ────────────
function RequireAuth() {
  const { accessToken, loadMe } = useAuthStore();

  useEffect(() => {
    if (accessToken) loadMe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!accessToken) return <Navigate to="/login" replace />;

  return (
    <SneatLayout>
      <Suspense fallback={<Spinner />}>
        <Outlet />
      </Suspense>
    </SneatLayout>
  );
}

// ── Guard: redireciona para / se já autenticado ──────────────────
function PublicOnly() {
  const { accessToken } = useAuthStore();
  if (accessToken) return <Navigate to="/" replace />;
  return (
    <Suspense fallback={<Spinner />}>
      <Outlet />
    </Suspense>
  );
}

// ── App ──────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route element={<PublicOnly />}>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Rotas protegidas */}
      <Route element={<RequireAuth />}>
        {/* Dashboard principal */}
        <Route path="/"                   element={<Dashboard />} />

        {/* Módulo Comercial */}
        <Route path="/clientes"           element={<Clientes />} />
        <Route path="/artigos"            element={<Artigos />} />
        <Route path="/faturas"            element={<Faturas />} />
        <Route path="/faturas/nova"       element={<Faturas />} />
        <Route path="/faturas/:id"        element={<FaturaDetalhe />} />
        <Route path="/conta-corrente"     element={<ContaCorrente />} />

        {/* Mapas / Relatórios */}
        <Route path="/mapas"              element={<Mapas />} />

        {/* Perfil do utilizador */}
        <Route path="/perfil"             element={<Perfil />} />

        {/* Área de Administração */}
        <Route path="/admin/users"        element={<UsersAdmin />} />
        <Route path="/admin/roles"        element={<RolesAdmin />} />
        <Route path="/admin/tenants"      element={<TenantsAdmin />} />
        <Route path="/admin/license"      element={<LicenseAdmin />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
