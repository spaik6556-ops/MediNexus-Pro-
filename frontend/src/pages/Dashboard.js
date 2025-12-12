import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Heart, Thermometer, Scale, Droplets, Brain,
  Calendar, FileText, TrendingUp, Clock, Plus, ChevronRight,
  Bell, Settings, LogOut, User, Menu, X, Watch, Scan, Building2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { twinApi, vitalsApi } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import NotificationsPanel, { useNotifications } from '../components/NotificationsPanel';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [aggregate, setAggregate] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [vitals, setVitals] = useState({});
  const [loading, setLoading] = useState(true);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [aggRes, timelineRes, vitalsRes] = await Promise.all([
        twinApi.getAggregate(),
        twinApi.getTimeline({ limit: 10 }),
        vitalsApi.getLatest()
      ]);
      setAggregate(aggRes.data);
      setTimeline(timelineRes.data);
      setVitals(vitalsRes.data);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { icon: Activity, label: 'Digital Twin', path: '/dashboard', active: true },
    { icon: Brain, label: 'Симптом-чекер', path: '/symptoms' },
    { icon: FileText, label: 'Документы', path: '/documents' },
    { icon: TrendingUp, label: 'Анализы', path: '/labs' },
    { icon: Calendar, label: 'Записи', path: '/appointments' },
    { icon: Heart, label: 'План лечения', path: '/care-plan' },
  ];

  // Extended nav for Phase 1
  const extendedNavItems = [
    { icon: Activity, label: 'Health Sync', path: '/health-sync' },
    { icon: Brain, label: 'Radiology AI', path: '/radiology' },
  ];

  const vitalCards = [
    { 
      key: 'heart_rate',
      icon: Heart, 
      label: 'Пульс', 
      color: 'rose',
      unit: 'уд/мин',
      normal: '60-100'
    },
    { 
      key: 'blood_pressure',
      icon: Activity, 
      label: 'Давление', 
      color: 'blue',
      unit: 'мм рт.ст.',
      normal: '120/80'
    },
    { 
      key: 'temperature',
      icon: Thermometer, 
      label: 'Температура', 
      color: 'amber',
      unit: '°C',
      normal: '36.6'
    },
    { 
      key: 'oxygen_saturation',
      icon: Droplets, 
      label: 'SpO2', 
      color: 'teal',
      unit: '%',
      normal: '95-100'
    },
  ];

  const getEventIcon = (type) => {
    const icons = {
      symptom: Brain,
      lab_result: TrendingUp,
      document: FileText,
      vital: Heart,
      consultation: Calendar,
      treatment: Activity
    };
    return icons[type] || Activity;
  };

  const getEventColor = (type) => {
    const colors = {
      symptom: 'bg-purple-100 text-purple-600',
      lab_result: 'bg-blue-100 text-blue-600',
      document: 'bg-amber-100 text-amber-600',
      vital: 'bg-rose-100 text-rose-600',
      consultation: 'bg-green-100 text-green-600',
      treatment: 'bg-teal-100 text-teal-600'
    };
    return colors[type] || 'bg-stone-100 text-stone-600';
  };

  // Mock chart data
  const chartData = [
    { date: '01', value: 72 },
    { date: '02', value: 75 },
    { date: '03', value: 70 },
    { date: '04', value: 73 },
    { date: '05', value: 71 },
    { date: '06', value: 74 },
    { date: '07', value: 72 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <p className="text-stone-600">Загрузка вашего Digital Twin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" data-testid="patient-dashboard">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-stone-200 z-50 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold text-stone-900">MediNexus Pro+</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  item.active 
                    ? 'bg-teal-50 text-teal-700' 
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
                data-testid={`nav-${item.path.replace('/', '')}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <User className="w-5 h-5 text-teal-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-900 truncate">{user?.full_name || 'Пользователь'}</p>
              <p className="text-sm text-stone-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 rounded-lg hover:bg-stone-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6 text-stone-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Digital Twin</h1>
                <p className="text-sm text-stone-500">Добро пожаловать, {user?.full_name?.split(' ')[0] || 'Пользователь'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-stone-100 relative">
                <Bell className="w-5 h-5 text-stone-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
              </button>
              <button className="p-2 rounded-lg hover:bg-stone-100">
                <Settings className="w-5 h-5 text-stone-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard content */}
        <div className="p-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-stone-500 text-sm">Активных планов</span>
                <Heart className="w-5 h-5 text-teal-600" />
              </div>
              <p className="text-3xl font-bold text-stone-900">{aggregate?.active_care_plans || 0}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-stone-500 text-sm">Предстоящих записей</span>
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-stone-900">{aggregate?.upcoming_appointments || 0}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-stone-500 text-sm">Анализов за месяц</span>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-stone-900">{aggregate?.recent_lab_results || 0}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-stone-500 text-sm">Всего документов</span>
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-3xl font-bold text-stone-900">{aggregate?.total_documents || 0}</p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left column - Vitals & Chart */}
            <div className="lg:col-span-2 space-y-6">
              {/* Vitals Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-stone-900">Жизненные показатели</h2>
                  <Link to="/vitals" className="text-teal-700 text-sm font-medium hover:text-teal-800 flex items-center gap-1">
                    Все показатели <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {vitalCards.map((vital, index) => {
                    const data = vitals[vital.key];
                    return (
                      <motion.div
                        key={vital.key}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="vital-card"
                        data-testid={`vital-${vital.key}`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-${vital.color}-100 flex items-center justify-center mb-3`}>
                          <vital.icon className={`w-5 h-5 text-${vital.color}-600`} />
                        </div>
                        <p className="text-sm text-stone-500 mb-1">{vital.label}</p>
                        <p className="text-2xl font-bold text-stone-900">
                          {data?.value || '--'}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">{vital.unit}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Heart Rate Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">Динамика пульса</h3>
                    <p className="text-sm text-stone-500">За последние 7 дней</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-teal-500" />
                    <span className="text-sm text-stone-600">уд/мин</span>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F766E" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 12 }} />
                      <YAxis domain={[60, 90]} axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #E7E5E4',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#0F766E" 
                        strokeWidth={3}
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Brain, label: 'Проверить симптомы', path: '/symptoms', color: 'teal' },
                  { icon: Plus, label: 'Добавить анализ', path: '/labs', color: 'blue' },
                  { icon: FileText, label: 'Загрузить документ', path: '/documents', color: 'amber' },
                  { icon: Calendar, label: 'Записаться к врачу', path: '/appointments', color: 'green' },
                ].map((action, index) => (
                  <Link
                    key={action.path}
                    to={action.path}
                    className={`bg-${action.color}-50 hover:bg-${action.color}-100 rounded-2xl p-4 text-center transition-colors group`}
                    data-testid={`quick-action-${action.path.replace('/', '')}`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-${action.color}-100 group-hover:bg-${action.color}-200 flex items-center justify-center mx-auto mb-3 transition-colors`}>
                      <action.icon className={`w-6 h-6 text-${action.color}-700`} />
                    </div>
                    <p className={`text-sm font-medium text-${action.color}-700`}>{action.label}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right column - Timeline */}
            <div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-stone-900">Временная шкала</h2>
                  <Link to="/timeline" className="text-teal-700 text-sm font-medium hover:text-teal-800">
                    Вся история
                  </Link>
                </div>

                {timeline.length > 0 ? (
                  <div className="space-y-4">
                    {timeline.slice(0, 5).map((event, index) => {
                      const Icon = getEventIcon(event.event_type);
                      return (
                        <motion.div
                          key={event.event_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex gap-4"
                          data-testid={`timeline-event-${index}`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getEventColor(event.event_type)}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-stone-900 truncate">
                              {event.data_payload?.title || event.event_type}
                            </p>
                            <p className="text-sm text-stone-500">
                              {format(new Date(event.timestamp), 'd MMM, HH:mm', { locale: ru })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-stone-400" />
                    </div>
                    <p className="text-stone-500 mb-4">Пока нет событий</p>
                    <p className="text-sm text-stone-400">
                      Начните с проверки симптомов или добавления анализов
                    </p>
                  </div>
                )}

                {/* AI Insight Card */}
                <div className="mt-6 p-4 bg-gradient-to-br from-teal-50 to-stone-50 rounded-xl border border-teal-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-teal-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900 mb-1">AI Инсайт</p>
                      <p className="text-sm text-stone-600">
                        Добавьте больше данных для персонализированных рекомендаций от AI
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
