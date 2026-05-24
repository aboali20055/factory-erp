import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '../api';
import { useAuthStore } from '../store/auth.store';
import { getErrorMessage } from '../utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setAuth(res.data.data.user, res.data.data.token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1c33] via-[#1a2d4e] to-[#0f1c33] flex items-center justify-center p-4" dir="rtl">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
              <Factory size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">نظام إدارة المصنع</h1>
            <p className="text-white/50 text-sm mt-1">سجّل دخولك للمتابعة</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@factory.com"
                required
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-4 pl-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed
                         text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> جاري التحقق...</>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xs text-white/40 text-center mb-2">بيانات تجريبية</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
              <div>
                <p className="font-medium text-white/60">مدير</p>
                <p>admin@factory.com</p>
                <p>admin123</p>
              </div>
              <div>
                <p className="font-medium text-white/60">مشرف</p>
                <p>manager@factory.com</p>
                <p>manager123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
