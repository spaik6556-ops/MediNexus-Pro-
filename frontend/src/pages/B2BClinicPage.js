import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, ArrowLeft, Users, Calendar, TrendingUp, Activity,
  Plus, UserPlus, Clock, CheckCircle, BarChart3, Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const B2BClinicPage = () => {
  const [clinic, setClinic] = useState(null);
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [newClinic, setNewClinic] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    specialties: []
  });
  const [newDoctor, setNewDoctor] = useState({ doctor_email: '', specialty: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const clinicRes = await axios.get(`${API_URL}/v1/b2b/clinic`);
      setClinic(clinicRes.data);
      
      const [statsRes, patientsRes] = await Promise.all([
        axios.get(`${API_URL}/v1/b2b/clinic/stats`),
        axios.get(`${API_URL}/v1/b2b/clinic/patients`)
      ]);
      setStats(statsRes.data);
      setPatients(patientsRes.data);
    } catch (error) {
      if (error.response?.status === 404) {
        // Clinic not found, show create form
        setClinic(null);
      } else {
        console.error('Fetch error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const createClinic = async () => {
    if (!newClinic.name || !newClinic.email) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      const specialties = newClinic.specialties.length > 0 
        ? newClinic.specialties 
        : ['Общая практика'];
        
      await axios.post(`${API_URL}/v1/b2b/clinic`, {
        ...newClinic,
        specialties
      });
      toast.success('Клиника создана');
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Ошибка создания клиники');
    }
  };

  const addDoctor = async () => {
    if (!newDoctor.doctor_email) {
      toast.error('Укажите email врача');
      return;
    }

    try {
      await axios.post(`${API_URL}/v1/b2b/clinic/doctors`, newDoctor);
      toast.success('Врач добавлен');
      setIsAddDoctorOpen(false);
      setNewDoctor({ doctor_email: '', specialty: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка добавления врача');
    }
  };

  // Mock chart data
  const appointmentsData = [
    { month: 'Янв', value: 45 },
    { month: 'Фев', value: 52 },
    { month: 'Мар', value: 48 },
    { month: 'Апр', value: 70 },
    { month: 'Май', value: 65 },
    { month: 'Июн', value: 85 }
  ];

  const specialtyData = [
    { name: 'Терапия', value: 35, color: '#0F766E' },
    { name: 'Кардиология', value: 25, color: '#F43F5E' },
    { name: 'Неврология', value: 20, color: '#8B5CF6' },
    { name: 'Другое', value: 20, color: '#F59E0B' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Building2 className="w-8 h-8 text-teal-600" />
          </div>
          <p className="text-stone-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // No clinic - show create form
  if (!clinic) {
    return (
      <div className="min-h-screen bg-stone-50" data-testid="b2b-create-page">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-stone-900">B2B Панель</h1>
              <p className="text-sm text-stone-500">Управление клиникой</p>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-teal-700" />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 mb-4">Подключите вашу клинику</h2>
            <p className="text-stone-600 max-w-md mx-auto">
              Зарегистрируйте клинику для доступа к расширенным возможностям платформы
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 max-w-xl mx-auto">
            <h3 className="text-lg font-semibold text-stone-900 mb-6">Регистрация клиники</h3>
            <div className="space-y-4">
              <div>
                <Label>Название клиники *</Label>
                <Input
                  value={newClinic.name}
                  onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
                  placeholder="Медицинский центр «Здоровье»"
                  className="mt-1.5"
                  data-testid="clinic-name-input"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newClinic.email}
                  onChange={(e) => setNewClinic({ ...newClinic, email: e.target.value })}
                  placeholder="clinic@example.com"
                  className="mt-1.5"
                  data-testid="clinic-email-input"
                />
              </div>
              <div>
                <Label>Телефон</Label>
                <Input
                  value={newClinic.phone}
                  onChange={(e) => setNewClinic({ ...newClinic, phone: e.target.value })}
                  placeholder="+7 (999) 999-99-99"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Адрес</Label>
                <Input
                  value={newClinic.address}
                  onChange={(e) => setNewClinic({ ...newClinic, address: e.target.value })}
                  placeholder="г. Москва, ул. Примерная, д. 1"
                  className="mt-1.5"
                />
              </div>
              <Button 
                onClick={createClinic}
                className="w-full gradient-primary text-white mt-6"
                data-testid="create-clinic-btn"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Зарегистрировать клинику
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" data-testid="b2b-dashboard">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-stone-900">{clinic.name}</h1>
              <p className="text-sm text-stone-500">B2B Панель управления</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Dialog open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="add-doctor-btn">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Добавить врача
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить врача в клинику</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Email врача *</Label>
                    <Input
                      type="email"
                      value={newDoctor.doctor_email}
                      onChange={(e) => setNewDoctor({ ...newDoctor, doctor_email: e.target.value })}
                      placeholder="doctor@example.com"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-stone-500 mt-1">Врач должен быть зарегистрирован на платформе</p>
                  </div>
                  <div>
                    <Label>Специализация</Label>
                    <Input
                      value={newDoctor.specialty}
                      onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                      placeholder="Терапевт"
                      className="mt-1.5"
                    />
                  </div>
                  <Button onClick={addDoctor} className="w-full gradient-primary text-white">
                    Добавить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button className="gradient-primary text-white">
              <Settings className="w-4 h-4 mr-2" />
              Настройки
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-stone-500">Пациентов</span>
              </div>
              <p className="text-3xl font-bold text-stone-900">{stats.total_patients}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-teal-600" />
                </div>
                <span className="text-sm text-stone-500">Всего приёмов</span>
              </div>
              <p className="text-3xl font-bold text-stone-900">{stats.total_appointments}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-stone-500">Завершённых</span>
              </div>
              <p className="text-3xl font-bold text-stone-900">{stats.completed_consultations}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm text-stone-500">Ср. длительность</span>
              </div>
              <p className="text-3xl font-bold text-stone-900">{stats.avg_consultation_duration}</p>
              <p className="text-sm text-stone-500">минут</p>
            </motion.div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-stone-900">Динамика приёмов</h3>
                <p className="text-sm text-stone-500">За последние 6 месяцев</p>
              </div>
              <Badge className="bg-green-100 text-green-700">
                <TrendingUp className="w-3 h-3 mr-1" />
                +23%
              </Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={appointmentsData}>
                  <defs>
                    <linearGradient id="colorAppt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#0F766E" strokeWidth={2} fill="url(#colorAppt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Doctors */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Врачи клиники</h3>
            {clinic.doctors && clinic.doctors.length > 0 ? (
              <div className="space-y-3">
                {clinic.doctors.map((doctor, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                      <span className="text-teal-700 font-semibold">{doctor.name?.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 truncate">{doctor.name}</p>
                      <p className="text-sm text-stone-500">{doctor.specialty}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-stone-500 mb-4">Врачи не добавлены</p>
                <Button variant="outline" size="sm" onClick={() => setIsAddDoctorOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Добавить
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Patients List */}
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <h3 className="text-lg font-semibold text-stone-900 mb-4">Последние пациенты</h3>
          {patients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Пациент</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Последний визит</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.slice(0, 10).map((patient, index) => (
                    <tr key={index} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                            <span className="text-teal-700 text-sm font-medium">
                              {patient.full_name?.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium text-stone-900">{patient.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600">{patient.email}</td>
                      <td className="py-3 px-4 text-stone-500">
                        {patient.last_visit && format(new Date(patient.last_visit), 'd MMM yyyy', { locale: ru })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-stone-500 py-8">Пациентов пока нет</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default B2BClinicPage;
