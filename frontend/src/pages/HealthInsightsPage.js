import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, ArrowLeft, TrendingUp, Heart, AlertTriangle, 
  CheckCircle, Target, Zap, Moon, Activity, Loader2,
  ChevronRight, Calendar, Lightbulb
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import axios from 'axios';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HealthInsightsPage = () => {
  const [dailyScore, setDailyScore] = useState(null);
  const [risks, setRisks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const [dailyRes, risksRes, recsRes, weeklyRes] = await Promise.all([
        axios.get(`${API_URL}/v1/insights/daily`),
        axios.get(`${API_URL}/v1/insights/risks`),
        axios.get(`${API_URL}/v1/insights/recommendations`),
        axios.get(`${API_URL}/v1/insights/weekly`)
      ]);
      setDailyScore(dailyRes.data);
      setRisks(risksRes.data);
      setRecommendations(recsRes.data);
      setWeeklyReport(weeklyRes.data);
    } catch (error) {
      console.error('Fetch insights error:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Отлично';
    if (score >= 60) return 'Хорошо';
    if (score >= 40) return 'Требует внимания';
    return 'Низкий';
  };

  const getRiskColor = (level) => {
    const colors = {
      low: 'bg-green-100 text-green-700 border-green-200',
      moderate: 'bg-amber-100 text-amber-700 border-amber-200',
      high: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[level] || colors.low;
  };

  const getRiskLabel = (level) => {
    const labels = { low: 'Низкий', moderate: 'Умеренный', high: 'Высокий' };
    return labels[level] || level;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-rose-100 text-rose-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-blue-100 text-blue-700'
    };
    return colors[priority] || colors.medium;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      lifestyle: Moon,
      monitoring: Activity,
      prevention: Calendar
    };
    return icons[category] || Lightbulb;
  };

  // Radial chart data for score
  const scoreChartData = dailyScore ? [
    { name: 'Score', value: dailyScore.score, fill: dailyScore.score >= 70 ? '#0F766E' : '#F59E0B' }
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-stone-600">Анализируем ваши данные...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" data-testid="health-insights-page">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-stone-900">AI Health Insights</h1>
              <p className="text-sm text-stone-500">Персонализированная аналитика здоровья</p>
            </div>
          </div>
          <Badge className="bg-teal-100 text-teal-700">
            <Brain className="w-3 h-3 mr-1" />
            Powered by AI
          </Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Обзор', icon: Zap },
            { id: 'risks', label: 'Риски', icon: AlertTriangle },
            { id: 'recommendations', label: 'Рекомендации', icon: Target }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Daily Score Card */}
            <div className="grid lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-stone-100"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-4">Индекс здоровья</h3>
                <div className="relative h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="60%" 
                      outerRadius="90%" 
                      data={scoreChartData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        background={{ fill: '#E7E5E4' }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold ${getScoreColor(dailyScore?.score || 0)}`}>
                      {dailyScore?.score || 0}
                    </span>
                    <span className="text-sm text-stone-500">из 100</span>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <Badge className={`${dailyScore?.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {getScoreLabel(dailyScore?.score || 0)}
                  </Badge>
                  <p className="text-sm text-stone-500 mt-2">
                    Тренд: {dailyScore?.trend === 'improving' ? '📈 Улучшается' : dailyScore?.trend === 'declining' ? '📉 Снижается' : '➡️ Стабильно'}
                  </p>
                </div>
              </motion.div>

              {/* AI Insight */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2 bg-gradient-to-br from-teal-50 to-stone-50 rounded-2xl p-6 border border-teal-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-6 h-6 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900 mb-2">AI-инсайт дня</h3>
                    <p className="text-stone-700 leading-relaxed">
                      {dailyScore?.highlight || 'Поддерживайте активный образ жизни для оптимального здоровья.'}
                    </p>
                  </div>
                </div>

                {/* Factors */}
                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-medium text-stone-500">Факторы оценки</h4>
                  {dailyScore?.factors?.map((factor, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl">
                      <div className="flex items-center gap-3">
                        {factor.status === 'good' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : factor.status === 'warning' ? (
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Activity className="w-5 h-5 text-stone-400" />
                        )}
                        <span className="text-stone-700">{factor.name}</span>
                      </div>
                      <span className={`font-medium ${
                        factor.contribution > 0 ? 'text-green-600' : factor.contribution < 0 ? 'text-red-600' : 'text-stone-400'
                      }`}>
                        {factor.contribution > 0 ? '+' : ''}{factor.contribution}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Weekly Trend */}
            {weeklyReport && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">Динамика за неделю</h3>
                    <p className="text-sm text-stone-500">Средний балл: {weeklyReport.avg_score}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{Math.round(weeklyReport.avg_score - 70)}% vs прошлая
                  </Badge>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyReport.score_trend}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F766E" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 12 }} />
                      <YAxis domain={[50, 100]} axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="score" stroke="#0F766E" strokeWidth={2} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Key Insights */}
                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  {weeklyReport.key_insights?.map((insight, i) => (
                    <div key={i} className="p-3 bg-stone-50 rounded-xl">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-stone-700">{insight}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Risks Tab */}
        {activeTab === 'risks' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Оценка рисков основана на AI-анализе ваших данных и носит информационный характер. 
                  Для точной диагностики обратитесь к врачу.
                </p>
              </div>
            </div>

            {risks.map((risk, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">{risk.name}</h3>
                    <Badge className={`mt-2 ${getRiskColor(risk.level)}`}>
                      Риск: {getRiskLabel(risk.level)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-stone-900">{risk.score}%</span>
                    <p className="text-sm text-stone-500">вероятность</p>
                  </div>
                </div>

                <div className="mb-4">
                  <Progress value={risk.score} className="h-2" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-stone-500 mb-2">Факторы</h4>
                    <ul className="space-y-1">
                      {risk.factors.map((factor, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-stone-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-xl">
                    <h4 className="text-sm font-medium text-teal-800 mb-2">Рекомендация</h4>
                    <p className="text-sm text-teal-700">{risk.recommendation}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {recommendations.map((rec, index) => {
              const Icon = getCategoryIcon(rec.category);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-teal-700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-stone-900">{rec.title}</h3>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority === 'high' ? 'Важно' : rec.priority === 'medium' ? 'Рекомендуется' : 'Опционально'}
                        </Badge>
                      </div>
                      <p className="text-stone-600 mb-4">{rec.description}</p>
                      
                      {rec.action_type === 'appointment' && (
                        <Link to="/appointments">
                          <Button size="sm" className="gradient-primary text-white">
                            Записаться к врачу
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      )}
                      {rec.action_type === 'tracking' && (
                        <Link to="/health-sync">
                          <Button size="sm" variant="outline">
                            Настроить отслеживание
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default HealthInsightsPage;
