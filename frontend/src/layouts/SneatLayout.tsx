import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard, Users, Package, FileText, BookOpen,
  BarChart2, Settings, LogOut, Bell, ChevronDown,
  Menu, X, ShieldCheck, Building2, KeyRound,
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: { label: string; href: string; icon?: React.ReactNode }[];
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={16} />, href: '/' },
  {
    label: 'Clientes',
    icon: <Users size={16} />,
    children: [
      { label: 'Lista de Clientes', href: '/clientes' },
      { label: 'Conta Corrente',    href: '/conta-corrente' },
    ],
  },
  {
    label: 'Artigos',
    icon: <Package size={16} />,
    children: [
      { label: 'Lista de Artigos', href: '/artigos' },
      { label: 'Alertas de Stock', href: '/artigos?alerta=stock' },
    ],
  },
  {
    label: 'Faturação',
    icon: <FileText size={16} />,
    children: [
      { label: 'Faturas',         href: '/faturas' },
      { label: 'Nova Fatura',     href: '/faturas/nova' },
      { label: 'Pendentes',       href: '/faturas?status=pendentes' },
      { label: 'Orçamentos',      href: '/faturas?tipo=OR' },
    ],
  },
  {
    label: 'Conta Corrente',
    icon: <BookOpen size={16} />,
    children: [
      { label: 'Saldos',    href: '/conta-corrente' },
      { label: 'Devedores', href: '/conta-corrente?tab=devedores' },
    ],
  },
  {
    label: 'Mapas',
    icon: <BarChart2 size={16} />,
    children: [
      { label: 'Vendas',         href: '/mapas' },
      { label: 'Rel. Clientes',  href: '/mapas?tipo=clientes' },
    ],
  },
  {
    label: 'Configurações',
    icon: <Settings size={16} />,
    children: [
      { label: 'Utilizadores', href: '/admin/users',    icon: <Users size={14} /> },
      { label: 'Perfis / Roles', href: '/admin/roles',  icon: <ShieldCheck size={14} /> },
      { label: 'Tenants',       href: '/admin/tenants', icon: <Building2 size={14} /> },
      { label: 'Licença',       href: '/admin/license', icon: <KeyRound size={14} /> },
    ],
  },
];

export default function SneatLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [userDrop, setUserDrop] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setUserDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (href: string) => location.pathname === href;

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f9]">
      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="sneat-navbar flex items-center justify-between px-6 z-50" ref={menuRef}>
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-white mr-1"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">E</span>
            </div>
            <span className="text-white font-bold text-lg hidden sm:block tracking-wide">
              ERPGest
            </span>
          </Link>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-2">
          {/* Notificações */}
          <button className="relative w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
          </button>

          {/* User dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition"
              onClick={() => setUserDrop((v) => !v)}
            >
              <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                {user?.name ?? 'Utilizador'}
              </span>
              <ChevronDown size={14} className={`transition-transform ${userDrop ? 'rotate-180' : ''}`} />
            </button>

            {userDrop && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/perfil"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                  onClick={() => setUserDrop(false)}
                >
                  <Settings size={14} /> Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={14} /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── HORIZONTAL MENU ────────────────────────────────── */}
      <div className={`sneat-menu ${mobileOpen ? 'block' : 'hidden md:block'}`}>
        <div className="flex items-center h-[52px] px-4 overflow-x-auto gap-1 menu-inner">
          {MENU_ITEMS.map((item) => {
            if (item.href) {
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`menu-item flex items-center gap-1.5 px-4 h-full text-sm font-medium transition whitespace-nowrap
                    ${isActive(item.href)
                      ? 'text-white bg-white/15 border-b-2 border-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            }

            const isOpen = openMenu === item.label;
            const anyChildActive = item.children?.some((c) => location.pathname.startsWith(c.href.split('?')[0]));

            return (
              <div key={item.label} className="relative menu-item h-full">
                <button
                  className={`flex items-center gap-1.5 px-4 h-full text-sm font-medium transition whitespace-nowrap
                    ${anyChildActive || isOpen
                      ? 'text-white bg-white/15 border-b-2 border-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                  onClick={() => setOpenMenu(isOpen ? null : item.label)}
                  onMouseEnter={() => { if (window.innerWidth >= 768) setOpenMenu(item.label); }}
                  onMouseLeave={() => { if (window.innerWidth >= 768) setOpenMenu(null); }}
                >
                  {item.icon}
                  {item.label}
                  <ChevronDown size={12} className={`transition-transform ml-0.5 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div
                    className="menu-sub"
                    onMouseEnter={() => setOpenMenu(item.label)}
                    onMouseLeave={() => setOpenMenu(null)}
                  >
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm transition
                          ${location.pathname === child.href.split('?')[0]
                            ? 'text-indigo-600 font-semibold bg-indigo-50'
                            : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'}`}
                        onClick={() => { setOpenMenu(null); setMobileOpen(false); }}
                      >
                        {child.icon && <span className="text-gray-400">{child.icon}</span>}
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
        {children}
      </main>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 py-3 px-6 text-center text-xs text-gray-400">
        ERPGest © {new Date().getFullYear()} — Multi-tenant ERP
      </footer>
    </div>
  );
}
