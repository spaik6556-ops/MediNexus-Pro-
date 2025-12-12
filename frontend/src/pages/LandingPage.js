import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Activity, Brain, FileText, Calendar, Heart, Shield, 
  ArrowRight, CheckCircle, Sparkles, Users, Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';

const LandingPage = ({ onGetStarted }) => {
  const features = [
    {
      icon: Brain,
      title: 'AI Симптом-чекер',
      description: 'Интеллектуальный анализ симптомов с рекомендациями по дальнейшим действиям'
    },
    {
      icon: Activity,
      title: 'Digital Twin',
      description: 'Ваш цифровой двойник — единый профиль здоровья с полной историей'
    },
    {
      icon: FileText,
      title: 'Умные документы',
      description: 'AI-анализ медицинских документов и автоматическое извлечение данных'
    },
    {
      icon: Calendar,
      title: 'Телемедицина',
      description: 'Видеоконсультации с врачами в удобное для вас время'
    },
    {
      icon: Heart,
      title: 'Мониторинг здоровья',
      description: 'Отслеживание жизненных показателей и графики динамики'
    },
    {
      icon: Shield,
      title: 'Безопасность данных',
      description: 'Шифрование данных и соответствие 152-ФЗ'
    }
  ];

  const stats = [
    { value: '95%+', label: 'Точность AI-диагностики' },
    { value: '<3 сек', label: 'Время ответа AI' },
    { value: '24/7', label: 'Доступность платформы' },
    { value: '100K+', label: 'Активных пользователей' }
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-900">MediNexus Pro+</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-stone-600 hover:text-teal-700 transition-colors">Возможности</a>
            <a href="#how-it-works" className="text-stone-600 hover:text-teal-700 transition-colors">Как это работает</a>
            <a href="#pricing" className="text-stone-600 hover:text-teal-700 transition-colors">Тарифы</a>
          </nav>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => onGetStarted('login')}
              data-testid="header-login-btn"
            >
              Войти
            </Button>
            <Button 
              onClick={() => onGetStarted('register')}
              className="gradient-primary text-white"
              data-testid="header-register-btn"
            >
              Начать бесплатно
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Медицинская платформа нового поколения
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight mb-6">
                Ваш Digital Twin для{' '}
                <span className="text-teal-700">проактивного</span>{' '}
                здоровья
              </h1>
              <p className="text-lg text-stone-600 mb-8 leading-relaxed">
                MediNexus Pro+ объединяет все данные о вашем здоровье в единый интеллектуальный профиль. 
                AI-анализ симптомов, умная временная шкала, персональные рекомендации — всё в одном месте.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => onGetStarted('register')}
                  className="gradient-primary text-white px-8 py-6 text-lg"
                  data-testid="hero-cta-btn"
                >
                  Создать Digital Twin
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-6 text-lg border-stone-300"
                  data-testid="hero-demo-btn"
                >
                  Смотреть демо
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-stone-200">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 border-2 border-white" />
                  ))}
                </div>
                <p className="text-sm text-stone-600">
                  <span className="font-semibold text-stone-900">100,000+</span> пользователей доверяют нам
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=500&fit=crop" 
                  alt="Digital Health Platform"
                  className="rounded-3xl shadow-2xl"
                />
                {/* Floating cards */}
                <motion.div 
                  className="absolute -left-8 top-1/4 bg-white rounded-2xl p-4 shadow-xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Пульс</p>
                      <p className="text-lg font-bold text-stone-900">72 уд/мин</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div 
                  className="absolute -right-4 bottom-1/4 bg-white rounded-2xl p-4 shadow-xl"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">AI Анализ</p>
                      <p className="text-lg font-bold text-green-600">Норма</p>
                    </div>
                  </div>
                </motion.div>
              </div>
              {/* Background decoration */}
              <div className="absolute -z-10 top-10 right-10 w-72 h-72 bg-teal-200 rounded-full opacity-30 blur-3xl" />
              <div className="absolute -z-10 bottom-10 left-10 w-48 h-48 bg-rose-200 rounded-full opacity-30 blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold text-teal-700 mb-2">{stat.value}</p>
                <p className="text-stone-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Всё для вашего здоровья в одном месте
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              MediNexus Pro+ — это не просто приложение, это ваш персональный медицинский ассистент
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 card-hover"
              >
                <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-teal-700" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-3">{feature.title}</h3>
                <p className="text-stone-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 bg-gradient-to-br from-teal-50 to-stone-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Как это работает
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Три простых шага к управлению вашим здоровьем
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Создайте профиль', desc: 'Зарегистрируйтесь и создайте свой Digital Twin за минуту' },
              { step: '02', title: 'Загрузите данные', desc: 'Добавьте анализы, документы или опишите симптомы AI-ассистенту' },
              { step: '03', title: 'Получите инсайты', desc: 'AI проанализирует данные и даст персональные рекомендации' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <span className="text-6xl font-bold text-teal-100">{item.step}</span>
                  <h3 className="text-xl font-bold text-stone-900 mt-4 mb-3">{item.title}</h3>
                  <p className="text-stone-600">{item.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-teal-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-primary rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Начните управлять своим здоровьем уже сегодня
            </h2>
            <p className="text-lg text-teal-100 mb-8 max-w-2xl mx-auto">
              Создайте свой Digital Twin бесплатно и получите доступ ко всем возможностям платформы
            </p>
            <Button 
              size="lg" 
              onClick={() => onGetStarted('register')}
              className="bg-white text-teal-700 hover:bg-stone-100 px-8 py-6 text-lg"
              data-testid="cta-register-btn"
            >
              Создать бесплатный аккаунт
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">MediNexus Pro+</span>
              </div>
              <p className="text-sm">Медицинская платформа нового поколения на базе Digital Twin технологий.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Продукт</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Возможности</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Тарифы</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Компания</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">О нас</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Контакты</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Карьера</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Правовая информация</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Условия использования</a></li>
                <li><a href="#" className="hover:text-white transition-colors">152-ФЗ</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-stone-800 text-center text-sm">
            <p>© 2024 MediNexus Pro+. Все права защищены.</p>
            <p className="mt-2 text-xs text-stone-500">
              Информация на платформе не является медицинской консультацией. Всегда обращайтесь к врачу.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
