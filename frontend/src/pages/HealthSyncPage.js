import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Watch, Smartphone, Activity, Heart, Footprints, Moon,
  ArrowLeft, Plus, RefreshCw, Zap, TrendingUp, CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEVICE_TYPES = [
  { id: 'apple_health', name: 'Apple Health', icon: Watch, color: 'rose' },
  { id: 'google_fit', name: 'Google Fit', icon: Activity, color: 'green' },
  { id: 'fitbit', name: 'Fitbit', icon: Watch, color: 'teal' },
  { id: 'garmin', name: 'Garmin', icon: Watch, color: 'blue' },
  { id: 'samsung_health', name: 'Samsung Health', icon: Smartphone, color: 'purple' },
  { id: 'xiaomi', name: 'Mi Fit', icon: Watch, color: 'amber' }
];

const HealthSyncPage = () => {
  const [devices, setDevices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [devicesRes, summaryRes] = await Promise.all([
        axios.get(`${API_URL}/v1/health-sync/devices`),
        axios.get(`${API_URL}/v1/health-sync/summary`, { params: { days: 7 } })
      ]);
      setDevices(devicesRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectDevice = async () => {
    if (!selectedDevice) {
      toast.error('Выберите устройство');
      return;
    }

    try {
      await axios.post(`${API_URL}/v1/health-sync/connect`, {
        device_type: selectedDevice,
        device_id: `${selectedDevice}_${Date.now()}`
      });
      toast.success('Устройство подключено');
      setIsDialogOpen(false);
      setSelectedDevice('');
      fetchData();
    } catch (error) {
      toast.error('Ошибка подключения');
    }
  };

  const syncData = async () => {
    setSyncing(true);
    try {
      // Simulate sync with mock data
      const mockData = {
        device_type: devices[0]?.device_type || 'apple_health',
        records: [
          { data_type: 'steps', value: Math.floor(Math.random() * 5000) + 5000, unit: 'steps', recorded_at: new Date().toISOString() },
          { data_type: 'heart_rate', value: Math.floor(Math.random() * 30) + 60, unit: 'bpm', recorded_at: new Date().toISOString() },
          { data_type: 'sleep_hours', value: Math.random() * 3 + 5, unit: 'hours', recorded_at: new Date().toISOString() }
        ]
      };

      await axios.post(`${API_URL}/v1/health-sync/data`, mockData);
      toast.success('Данные синхронизированы');
      fetchData();
    } catch (error) {
      toast.error('Ошибка синхронизации');
    } finally {
      setSyncing(false);
    }
  };

  const getDeviceInfo = (type) => DEVICE_TYPES.find(d => d.id === type) || DEVICE_TYPES[0];

  // Mock chart data
  const stepsData = [
    { day: 'Пн', value: 8234 },
    { day: 'Вт', value: 10521 },
    { day: 'Ср', value: 7845 },
    { day: 'Чт', value: 9123 },
    { day: 'Пт', value: 11234 },
    { day: 'Сб', value: 6543 },
    { day: 'Вс', value: 5432 }
  ];

  const heartRateData = [
    { time: '00:00', value: 62 },
    { time: '04:00', value: 58 },
    { time: '08:00', value: 75 },
    { time: '12:00', value: 82 },
    { time: '16:00', value: 78 },
    { time: '20:00', value: 70 },
    { time: '24:00', value: 65 }
  ];

  return (
    <div className="min-h-screen bg-stone-50" data-testid="health-sync-page">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Health Sync</h1>
              <p className="text-sm text-stone-500">Синхронизация с носимыми устройствами</p>
            </div>
          </div>
          <div className="flex gap-3">
            {devices.length > 0 && (
              <Button 
                variant="outline" 
                onClick={syncData}
                disabled={syncing}
                data-testid="sync-btn"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Синхронизация...' : 'Синхронизировать'}
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-white" data-testid="connect-device-btn">
                  <Plus className="w-5 h-5 mr-2" />
                  Подключить
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Подключить устройство</DialogTitle>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {DEVICE_TYPES.map((device) => (
                      <button
                        key={device.id}
                        onClick={() => setSelectedDevice(device.id)}
                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${
                          selectedDevice === device.id
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg bg-${device.color}-100 flex items-center justify-center`}>
                          <device.icon className={`w-5 h-5 text-${device.color}-600`} />
                        </div>
                        <span className="font-medium text-stone-900">{device.name}</span>
                      </button>
                    ))}
                  </div>
                  <Button 
                    onClick={connectDevice}
                    className="w-full gradient-primary text-white"
                    disabled={!selectedDevice}
                  >
                    Подключить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Connected Devices */}
        {devices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Подключенные устройства</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {devices.map((device) => {
                const info = getDeviceInfo(device.device_type);
                return (
                  <div 
                    key={device.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-${info.color}-100 flex items-center justify-center`}>
                        <info.icon className={`w-6 h-6 text-${info.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-stone-900">{info.name}</h3>
                        <p className="text-sm text-stone-500">
                          {device.last_sync 
                            ? `Синхр.: ${format(new Date(device.last_sync), 'd MMM, HH:mm', { locale: ru })}`
                            : 'Не синхронизировано'
                          }
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Активно
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Footprints className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-stone-500">Шаги (7 дней)</span>
              </div>
              <p className="text-2xl font-bold text-stone-900">{summary.total_steps.toLocaleString()}</p>
              <p className="text-sm text-stone-500">~{summary.avg_daily_steps.toLocaleString()}/день</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-rose-600" />
                </div>
                <span className="text-sm text-stone-500">Ср. пульс</span>
              </div>
              <p className="text-2xl font-bold text-stone-900">{summary.avg_heart_rate}</p>
              <p className="text-sm text-stone-500">уд/мин</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-stone-500">Ср. сон</span>
              </div>
              <p className="text-2xl font-bold text-stone-900">{summary.avg_sleep_hours}</p>
              <p className="text-sm text-stone-500">часов/ночь</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm text-stone-500">Данных</span>
              </div>
              <p className="text-2xl font-bold text-stone-900">{summary.data_points}</p>
              <p className="text-sm text-stone-500">записей</p>
            </motion.div>
          </div>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Steps Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-stone-900">Шаги</h3>
                <p className="text-sm text-stone-500">За последнюю неделю</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12%
              </Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stepsData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E7E5E4',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="value" fill="#0F766E" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heart Rate Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-stone-900">Пульс</h3>
                <p className="text-sm text-stone-500">Сегодня</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-sm text-stone-600">уд/мин</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={heartRateData}>
                  <defs>
                    <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 12 }} />
                  <YAxis domain={[50, 100]} axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E7E5E4',
                      borderRadius: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#F43F5E" strokeWidth={2} fill="url(#colorHR)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {devices.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-100">
            <div className="w-20 h-20 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-6">
              <Watch className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold text-stone-900 mb-2">Устройства не подключены</h3>
            <p className="text-stone-500 mb-6 max-w-md mx-auto">
              Подключите носимое устройство для автоматической синхронизации данных о здоровье
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary text-white">
              <Plus className="w-5 h-5 mr-2" />
              Подключить устройство
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default HealthSyncPage;
