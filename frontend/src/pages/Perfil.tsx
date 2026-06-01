import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User as UserIcon, Lock, Save, Loader2,
  Eye, EyeOff, Camera, CheckCircle,
} from 'lucide-react';
import { profileApi } from '@/api/profile';
import { useAuthStore } from '@/stores/authStore';
import { fmt } from '@/utils/format';
import type { User } from '@/types';
import toast from 'react-hot-toast';

// ── Schemas ──────────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  photoUrl: z.string().url('URL inválido').or(z.literal('')).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Password actual é obrigatória'),
  newPassword: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter maiúscula')
    .regex(/[0-9]/, 'Deve conter número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter símbolo'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords não coincidem',
  path: ['confirmPassword'],
});

type ProfileForm   = z.infer<typeof profileSchema>;
type PasswordForm  = z.infer<typeof passwordSchema>;

export default function Perfil() {
  const qc = useQueryClient();
  const { user: storeUser, setTokens } = useAuthStore() as any;
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // ── load current user ────────────────────────────────────────
  const { data: user, isLoading } = useQuery({
    queryKey: ['profile-me'],
    queryFn: () => profileApi.me(),
    initialData: storeUser as User | undefined,
  });

  // ── Profile form ─────────────────────────────────────────────
  const {
    register: regP,
    handleSubmit: handleP,
    formState: { errors: errP, isDirty: isDirtyP },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: (user as User)?.name ?? '',
      photoUrl: (user as User)?.photoUrl ?? '',
    },
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => profileApi.update(data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['profile-me'] });
      // sync zustand store
      if (setTokens) {
        const store = useAuthStore.getState() as any;
        if (store.user) store.user = { ...store.user, ...updated };
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      toast.success('Perfil actualizado!');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao actualizar perfil'),
  });

  // ── Password form ────────────────────────────────────────────
  const {
    register: regPw,
    handleSubmit: handlePw,
    reset: resetPw,
    formState: { errors: errPw },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const changePassword = useMutation({
    mutationFn: (data: PasswordForm) =>
      profileApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
      }),
    onSuccess: () => {
      resetPw();
      toast.success('Password alterada com sucesso!');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao alterar password'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
      </div>
    );
  }

  const u = user as User;
  const initials = fmt.initials(u?.name ?? 'U');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <UserIcon size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
          <p className="text-sm text-gray-500">Gerir informações pessoais e segurança</p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            {u?.photoUrl ? (
              <img
                src={u.photoUrl}
                alt={u.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow border border-gray-100 cursor-pointer hover:bg-gray-50 transition">
              <Camera size={14} className="text-gray-500" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800">{u?.name}</h2>
            <p className="text-gray-500 text-sm">{u?.email}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {u?.roles?.map((r) => (
                <span key={r.id} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                  {r.name.replace('ROLE_', '')}
                </span>
              ))}
            </div>
          </div>

          <div className="ml-auto text-right hidden sm:block">
            <p className="text-xs text-gray-400">Conta criada em</p>
            <p className="text-sm text-gray-600 font-medium">
              {u?.createdAt ? fmt.date(u.createdAt) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <UserIcon size={16} className="text-indigo-500" />
          <h3 className="font-semibold text-gray-700">Informações Pessoais</h3>
        </div>

        <form onSubmit={handleP(d => updateProfile.mutate(d))} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nome Completo</label>
              <input {...regP('name')} className="form-input" />
              {errP.name && <p className="text-xs text-red-500 mt-1">{errP.name.message}</p>}
            </div>

            <div>
              <label className="form-label">Email</label>
              <input
                className="form-input bg-gray-50 cursor-not-allowed"
                defaultValue={u?.email}
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">Email não pode ser alterado</p>
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">URL da Foto de Perfil</label>
              <input
                {...regP('photoUrl')}
                className="form-input"
                placeholder="https://exemplo.com/foto.jpg"
              />
              {errP.photoUrl && <p className="text-xs text-red-500 mt-1">{errP.photoUrl.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {profileSaved && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle size={15} /> Guardado!
              </span>
            )}
            <button
              type="submit"
              disabled={updateProfile.isPending || !isDirtyP}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {updateProfile.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Guardar Alterações
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Lock size={16} className="text-indigo-500" />
          <h3 className="font-semibold text-gray-700">Alterar Password</h3>
        </div>

        <form onSubmit={handlePw(d => changePassword.mutate(d))} className="p-5 space-y-4">
          {/* Current password */}
          <div>
            <label className="form-label">Password Actual <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                {...regPw('currentPassword')}
                type={showCurrent ? 'text' : 'password'}
                className="form-input pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowCurrent(v => !v)}
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errPw.currentPassword && (
              <p className="text-xs text-red-500 mt-1">{errPw.currentPassword.message}</p>
            )}
          </div>

          {/* New password */}
          <div>
            <label className="form-label">Nova Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                {...regPw('newPassword')}
                type={showNew ? 'text' : 'password'}
                className="form-input pr-10"
                placeholder="Min. 8 chars, 1 maiúscula, 1 número, 1 símbolo"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowNew(v => !v)}
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errPw.newPassword && (
              <p className="text-xs text-red-500 mt-1">{errPw.newPassword.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="form-label">Confirmar Nova Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                {...regPw('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                className="form-input pr-10"
                placeholder="Repetir nova password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowConfirm(v => !v)}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errPw.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{errPw.confirmPassword.message}</p>
            )}
          </div>

          {/* Password strength hint */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">Requisitos da password:</p>
            <ul className="text-xs text-amber-600 space-y-0.5 list-disc list-inside">
              <li>Mínimo 8 caracteres</li>
              <li>Pelo menos uma letra maiúscula (A-Z)</li>
              <li>Pelo menos um número (0-9)</li>
              <li>Pelo menos um símbolo (!@#$%...)</li>
            </ul>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {changePassword.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Lock size={14} />
              )}
              Alterar Password
            </button>
          </div>
        </form>
      </div>

      {/* Account Security Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Lock size={16} className="text-gray-400" />
          Informações de Segurança
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Email Verificado',   value: u?.emailVerified ? 'Sim' : 'Não',  ok: u?.emailVerified },
            { label: 'Conta Activa',        value: u?.active ? 'Sim' : 'Não',         ok: u?.active },
            { label: 'Conta Expirada',      value: u?.accountNonExpired ? 'Não' : 'Sim', ok: u?.accountNonExpired },
            { label: 'Conta Bloqueada',     value: u?.accountNonLocked ? 'Não' : 'Sim',  ok: u?.accountNonLocked },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${item.ok ? 'bg-green-100' : 'bg-red-100'}`}>
                {item.ok
                  ? <CheckCircle size={18} className="text-green-600" />
                  : <CheckCircle size={18} className="text-red-400" />
                }
              </div>
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`text-xs font-semibold mt-0.5 ${item.ok ? 'text-green-600' : 'text-red-500'}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
