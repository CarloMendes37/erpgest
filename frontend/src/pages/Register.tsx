import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import AuthLayout from '@/layouts/AuthLayout';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth';

const schema = z.object({
  name:       z.string().min(2, 'Nome obrigatório'),
  email:      z.string().email('Email inválido'),
  password:   z.string().min(8, 'Mínimo 8 caracteres'),
  tenantName: z.string().min(2, 'Nome da empresa obrigatório'),
  tenantSlug: z.string().min(3, 'Slug obrigatório (ex: minha-empresa)')
    .regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { setTokens, loadMe } = useAuthStore();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const tokens = await authApi.register(data);
      setTokens(tokens);
      await loadMe();
      toast.success('Empresa registada com sucesso!');
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Erro ao registar';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-gray-800 mb-1">Criar conta</h2>
      <p className="text-sm text-gray-500 mb-5">Registe a sua empresa no ERPGest</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="form-label">Nome completo</label>
          <input {...register('name')} className="form-input" placeholder="João Silva" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="form-label">Email</label>
          <input {...register('email')} type="email" className="form-input" placeholder="nome@empresa.pt" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="form-label">Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPw ? 'text' : 'password'}
              className="form-input pr-10"
              placeholder="Mínimo 8 caracteres"
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dados da empresa</p>
        </div>

        <div>
          <label className="form-label">Nome da empresa</label>
          <input {...register('tenantName')} className="form-input" placeholder="Minha Empresa Lda" />
          {errors.tenantName && <p className="text-xs text-red-500 mt-1">{errors.tenantName.message}</p>}
        </div>

        <div>
          <label className="form-label">Identificador único (slug)</label>
          <input {...register('tenantSlug')} className="form-input" placeholder="minha-empresa" />
          <p className="text-xs text-gray-400 mt-1">Apenas letras minúsculas, números e hífens</p>
          {errors.tenantSlug && <p className="text-xs text-red-500">{errors.tenantSlug.message}</p>}
        </div>

        <button type="submit" disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 h-11 mt-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'A registar…' : 'Criar conta'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        Já tem conta?{' '}
        <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Entrar</Link>
      </p>
    </AuthLayout>
  );
}
