import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, ArrowLeft, Plus, Video, MapPin, Clock,
  User, Phone, X, Check, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { appointmentsApi, doctorsApi } from '../services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const [newAppointment, setNewAppointment] = useState({
    doctor_id: '',
    appointment_date: null,
    appointment_time: '',
    appointment_type: 'video',
    reason: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      const params = filter === 'upcoming' ? { upcoming_only: true } : {};
      const response = await appointmentsApi.getAll(params);
      setAppointments(response.data);
    } catch (error) {
      console.error('Fetch appointments error:', error);
      toast.error('Ошибка загрузки записей');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await doctorsApi.getAll();
      setDoctors(response.data);
    } catch (error) {
      console.error('Fetch doctors error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAppointment.doctor_id || !newAppointment.appointment_date || !newAppointment.appointment_time) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      const dateTime = new Date(newAppointment.appointment_date);
      const [hours, minutes] = newAppointment.appointment_time.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes));

      await appointmentsApi.create({
        doctor_id: newAppointment.doctor_id,
        appointment_date: dateTime.toISOString(),
        appointment_type: newAppointment.appointment_type,
        reason: newAppointment.reason
      });
      toast.success('Запись создана');
      setIsDialogOpen(false);
      setNewAppointment({
        doctor_id: '',
        appointment_date: null,
        appointment_time: '',
        appointment_type: 'video',
        reason: ''
      });
      fetchAppointments();
    } catch (error) {
      console.error('Create appointment error:', error);
      toast.error('Ошибка создания записи');
    }
  };

  const cancelAppointment = async (id) => {
    if (!window.confirm('Отменить эту запись?')) return;
    
    try {
      await appointmentsApi.updateStatus(id, 'cancelled');
      toast.success('Запись отменена');
      fetchAppointments();
    } catch (error) {
      console.error('Cancel appointment error:', error);
      toast.error('Ошибка отмены записи');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-green-100 text-green-700',
      completed: 'bg-stone-100 text-stone-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    const labels = {
      scheduled: 'Запланировано',
      confirmed: 'Подтверждено',
      completed: 'Завершено',
      cancelled: 'Отменено'
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '14:00', '14:30', '15:00', '15:30', '16:00',
    '16:30', '17:00', '17:30', '18:00'
  ];

  return (
    <div className="min-h-screen bg-stone-50" data-testid="appointments-page">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Записи к врачам</h1>
              <p className="text-sm text-stone-500">Telemed — видеоконсультации</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white" data-testid="new-appointment-btn">
                <Plus className="w-5 h-5 mr-2" />
                Новая запись
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Записаться к врачу</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label>Врач *</Label>
                  <Select
                    value={newAppointment.doctor_id}
                    onValueChange={(value) => setNewAppointment({ ...newAppointment, doctor_id: value })}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="doctor-select">
                      <SelectValue placeholder="Выберите врача" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.length > 0 ? (
                        doctors.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.full_name} {doc.specialty && `(${doc.specialty})`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="demo-doctor" disabled>
                          Врачи не найдены
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {doctors.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Для записи необходимо, чтобы врачи были зарегистрированы в системе
                    </p>
                  )}
                </div>

                <div>
                  <Label>Дата *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full mt-1.5 justify-start text-left font-normal"
                        data-testid="date-picker-btn"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {newAppointment.appointment_date ? (
                          format(newAppointment.appointment_date, 'd MMMM yyyy', { locale: ru })
                        ) : (
                          'Выберите дату'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={newAppointment.appointment_date}
                        onSelect={(date) => setNewAppointment({ ...newAppointment, appointment_date: date })}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Время *</Label>
                  <div className="grid grid-cols-4 gap-2 mt-1.5">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setNewAppointment({ ...newAppointment, appointment_time: time })}
                        className={`p-2 rounded-lg text-sm transition-colors ${
                          newAppointment.appointment_time === time
                            ? 'bg-teal-100 text-teal-700 border-2 border-teal-500'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                        data-testid={`time-${time}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Тип консультации *</Label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setNewAppointment({ ...newAppointment, appointment_type: 'video' })}
                      className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${
                        newAppointment.appointment_type === 'video'
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                      data-testid="type-video"
                    >
                      <Video className="w-5 h-5 text-teal-600" />
                      <div className="text-left">
                        <p className="font-medium">Видеозвонок</p>
                        <p className="text-xs text-stone-500">Онлайн</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAppointment({ ...newAppointment, appointment_type: 'in_person' })}
                      className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${
                        newAppointment.appointment_type === 'in_person'
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                      data-testid="type-in-person"
                    >
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium">Личный прием</p>
                        <p className="text-xs text-stone-500">В клинике</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <Label>Причина обращения</Label>
                  <textarea
                    value={newAppointment.reason}
                    onChange={(e) => setNewAppointment({ ...newAppointment, reason: e.target.value })}
                    placeholder="Опишите кратко причину визита..."
                    className="w-full mt-1.5 p-3 rounded-lg border border-stone-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
                    rows={3}
                    data-testid="reason-input"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary text-white" data-testid="book-btn">
                    Записаться
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { value: 'upcoming', label: 'Предстоящие' },
            { value: 'all', label: 'Все записи' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-white text-stone-600 hover:bg-stone-100'
              }`}
              data-testid={`filter-${tab.value}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Calendar className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-500">Загрузка записей...</p>
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appt, index) => (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100"
                data-testid={`appointment-${appt.id}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      appt.appointment_type === 'video' ? 'bg-teal-100' : 'bg-blue-100'
                    }`}>
                      {appt.appointment_type === 'video' ? (
                        <Video className="w-7 h-7 text-teal-600" />
                      ) : (
                        <MapPin className="w-7 h-7 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-stone-900">{appt.doctor_name || 'Врач'}</h3>
                        {getStatusBadge(appt.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(appt.appointment_date), 'd MMMM yyyy', { locale: ru })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(appt.appointment_date), 'HH:mm')}
                        </span>
                        <span className="capitalize">
                          {appt.appointment_type === 'video' ? 'Видеозвонок' : 'Личный прием'}
                        </span>
                      </div>
                      {appt.reason && (
                        <p className="text-sm text-stone-600 mt-2">{appt.reason}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {appt.status === 'scheduled' && appt.meeting_link && (
                      <a
                        href={appt.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center gap-2"
                      >
                        <Video className="w-4 h-4" />
                        Начать
                      </a>
                    )}
                    {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelAppointment(appt.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`cancel-${appt.id}`}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Отменить
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-100">
            <div className="w-20 h-20 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-stone-400" />
            </div>
            <h3 className="text-xl font-semibold text-stone-900 mb-2">Записей пока нет</h3>
            <p className="text-stone-500 mb-6">Запишитесь на прием к врачу для консультации</p>
            <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary text-white">
              <Plus className="w-5 h-5 mr-2" />
              Записаться к врачу
            </Button>
          </div>
        )}

        {/* Video Call Notice */}
        {appointments.some(a => a.appointment_type === 'video' && a.status === 'scheduled') && (
          <div className="mt-8 p-4 bg-teal-50 border border-teal-100 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-teal-800">Подготовка к видеоконсультации</p>
                <p className="text-sm text-teal-700 mt-1">
                  Убедитесь, что у вас стабильное интернет-соединение и работают камера с микрофоном. 
                  Ссылка на видеозвонок станет активной за 5 минут до начала.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AppointmentsPage;
