import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, Check, ArrowLeft, Building2, Sparkles, 
  Shield, Users, Video, Brain, Loader2, CheckCircle, X
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BillingPage = () => {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, [sessionId]);

  const fetchData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        axios.get(`${API_URL}/v1/billing/plans`),
        axios.get(`${API_URL}/v1/billing/subscription`)
      ]);
      setPlans(plansRes.data);
      setSubscription(subRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (sid, attempts = 0) => {
    const maxAttempts = 10;
    
    if (attempts >= maxAttempts) {
      toast.error('Таймаут проверки платежа');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/v1/billing/status/${sid}`);
      
      if (response.data.payment_status === 'paid') {
        toast.success('Оплата прошла успешно! Подписка активирована.');
        fetchData();
        navigate('/b2b/billing', { replace: true });
        return;
      } else if (response.data.status === 'expired') {
        toast.error('Сессия оплаты истекла');
        navigate('/b2b/billing', { replace: true });
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sid, attempts + 1), 2000);
    } catch (error) {
      console.error('Poll error:', error);
    }
  };

  const handleSubscribe = async (planId) => {
    setProcessingPlan(planId);
    try {
      const response = await axios.post(`${API_URL}/v1/billing/checkout`, {
        plan_id: planId,
        origin_url: window.location.origin
      });
      
      // Redirect to Stripe
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error('Ошибка создания платежа');
      setProcessingPlan(null);
    }
  };

  const getPlanIcon = (planId) => {
    const icons = {
      starter: Users,
      professional: Brain,
      enterprise: Building2
    };
    return icons[planId] || Users;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" data-testid="billing-page">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/b2b" className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-stone-900">Тарифы и биллинг</h1>
            <p className="text-sm text-stone-500">Управление подпиской клиники</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Current Subscription */}
        {subscription?.status === 'active' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-8 text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-teal-100">Текущий тариф</p>
                  <h3 className="text-2xl font-bold">{subscription.plan_name}</h3>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-0">
                Активен
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {subscription.features?.map((feature, i) => (
                <span key={i} className="px-3 py-1 bg-white/10 rounded-lg text-sm">
                  {feature}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Payment Processing */}
        {sessionId && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
              <div>
                <h3 className="font-semibold text-amber-900">Проверка платежа...</h3>
                <p className="text-sm text-amber-700">Пожалуйста, подождите</p>
              </div>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Выберите тариф</h2>
          <p className="text-stone-600">Все тарифы включают 14-дневный пробный период</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const Icon = getPlanIcon(plan.id);
            const isCurrentPlan = subscription?.plan_id === plan.id;
            const isPopular = plan.popular;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl p-6 shadow-sm border-2 transition-all ${
                  isPopular ? 'border-teal-500 scale-105' : 'border-stone-200'
                } ${isCurrentPlan ? 'ring-2 ring-teal-500 ring-offset-2' : ''}`}
                data-testid={`plan-${plan.id}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-teal-600 text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Популярный
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                    isPopular ? 'bg-teal-100' : 'bg-stone-100'
                  }`}>
                    <Icon className={`w-7 h-7 ${isPopular ? 'text-teal-600' : 'text-stone-600'}`} />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-stone-900">${plan.price}</span>
                    <span className="text-stone-500">/месяц</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-stone-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrentPlan || processingPlan === plan.id}
                  className={`w-full ${
                    isPopular 
                      ? 'gradient-primary text-white' 
                      : 'bg-stone-100 text-stone-900 hover:bg-stone-200'
                  }`}
                  data-testid={`subscribe-${plan.id}`}
                >
                  {processingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Обработка...
                    </>
                  ) : isCurrentPlan ? (
                    'Текущий тариф'
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Подключить
                    </>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Security Note */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-stone-500">
            <Shield className="w-4 h-4" />
            Безопасная оплата через Stripe. Данные карты не хранятся на наших серверах.
          </div>
        </div>
      </main>
    </div>
  );
};

export default BillingPage;
