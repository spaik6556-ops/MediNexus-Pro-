import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const AuthPage = ({ mode = 'login', onBack }) => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'patient'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Добро пожаловать!');
      } else {
        await register(formData);
        toast.success('Аккаунт успешно создан!');
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Auth error:', error);
      const message = error.response?.data?.detail || 'Произошла ошибка. Попробуйте снова.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">MediNexus Pro+</span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Ваш персональный<br />Digital Twin<br />для здоровья
          </h1>
          <p className="text-teal-100 text-lg max-w-md">
            Объединяем все данные о вашем здоровье в единый интеллектуальный профиль с AI-анализом
          </p>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Пользователей', value: '100K+' },
              { label: 'Точность AI', value: '95%+' },
              { label: 'Врачей', value: '5K+' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-teal-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-stone-600 hover:text-teal-700 mb-8 transition-colors"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
              На главную
            </button>
          )}

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-stone-900 mb-2">
              {isLogin ? 'Вход в аккаунт' : 'Создание аккаунта'}
            </h2>
            <p className="text-stone-600">
              {isLogin 
                ? 'Войдите, чтобы получить доступ к вашему Digital Twin' 
                : 'Создайте аккаунт и начните управлять своим здоровьем'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <Label htmlFor="full_name" className="text-stone-700">Полное имя</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required={!isLogin}
                    placeholder="Иван Иванов"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="pl-10"
                    data-testid="fullname-input"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-stone-700">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="example@mail.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  data-testid="email-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-stone-700">Пароль</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="phone" className="text-stone-700">Телефон (опционально)</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+7 (999) 999-99-99"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10"
                      data-testid="phone-input"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-stone-700">Тип аккаунта</Label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'patient' })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.role === 'patient' 
                          ? 'border-teal-600 bg-teal-50' 
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                      data-testid="role-patient-btn"
                    >
                      <p className="font-semibold text-stone-900">Пациент</p>
                      <p className="text-sm text-stone-500">Управление здоровьем</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'doctor' })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.role === 'doctor' 
                          ? 'border-teal-600 bg-teal-50' 
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                      data-testid="role-doctor-btn"
                    >
                      <p className="font-semibold text-stone-900">Врач</p>
                      <p className="text-sm text-stone-500">Ведение пациентов</p>
                    </button>
                  </div>
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full gradient-primary text-white py-6 text-lg"
              disabled={loading}
              data-testid="submit-btn"
            >
              {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-stone-600">
              {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-teal-700 font-semibold hover:text-teal-800"
                data-testid="toggle-auth-mode"
              >
                {isLogin ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
          </div>

          <p className="mt-8 text-xs text-center text-stone-500">
            Нажимая кнопку, вы соглашаетесь с{' '}
            <a href="#" className="text-teal-700">Условиями использования</a>
            {' '}и{' '}
            <a href="#" className="text-teal-700">Политикой конфиденциальности</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
