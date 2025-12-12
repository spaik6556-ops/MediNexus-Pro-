import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, ArrowLeft, Plus, Target, Pill, CheckCircle,
  Calendar, Activity, Brain, Clock, Edit, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { carePlansApi } from '../services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const CarePlanPage = () => {
  const [carePlans, setCarePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    goals: [''],
    lifestyle_recommendations: [''],
    medications: [{ name: '', dosage: '', frequency: '' }]
  });

  useEffect(() => {
    fetchCarePlans();
  }, [filter]);

  const fetchCarePlans = async () => {
    try {
      const response = await carePlansApi.getAll(filter !== 'all' ? filter : undefined);
      setCarePlans(response.data);
    } catch (error) {
      console.error('Fetch care plans error:', error);
      toast.error('Ошибка загрузки планов');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPlan.title || !newPlan.description) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      const planData = {
        ...newPlan,
        goals: newPlan.goals.filter(g => g.trim()),
        lifestyle_recommendations: newPlan.lifestyle_recommendations.filter(r => r.trim()),
        medications: newPlan.medications.filter(m => m.name.trim()).map(m => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency
        }))
      };

      await carePlansApi.create(planData);
      toast.success('План лечения создан');
      setIsDialogOpen(false);
      setNewPlan({
        title: '',
        description: '',
        goals: [''],
        lifestyle_recommendations: [''],
        medications: [{ name: '', dosage: '', frequency: '' }]
      });
      fetchCarePlans();
    } catch (error) {
      console.error('Create care plan error:', error);
      toast.error('Ошибка создания плана');
    }
  };

  const updatePlanStatus = async (id, status) => {
    try {
      await carePlansApi.updateStatus(id, status);
      toast.success('Статус обновлен');
      fetchCarePlans();
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Ошибка обновления');
    }
  };

  const addGoal = () => {
    setNewPlan({ ...newPlan, goals: [...newPlan.goals, ''] });
  };

  const updateGoal = (index, value) => {
    const goals = [...newPlan.goals];
    goals[index] = value;
    setNewPlan({ ...newPlan, goals });
  };

  const removeGoal = (index) => {
    const goals = newPlan.goals.filter((_, i) => i !== index);
    setNewPlan({ ...newPlan, goals: goals.length ? goals : [''] });
  };

  const addRecommendation = () => {
    setNewPlan({ ...newPlan, lifestyle_recommendations: [...newPlan.lifestyle_recommendations, ''] });
  };

  const updateRecommendation = (index, value) => {
    const recs = [...newPlan.lifestyle_recommendations];
    recs[index] = value;
    setNewPlan({ ...newPlan, lifestyle_recommendations: recs });
  };

  const addMedication = () => {
    setNewPlan({ ...newPlan, medications: [...newPlan.medications, { name: '', dosage: '', frequency: '' }] });
  };

  const updateMedication = (index, field, value) => {
    const meds = [...newPlan.medications];
    meds[index][field] = value;
    setNewPlan({ ...newPlan, medications: meds });
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-stone-100 text-stone-700'
    };
    const labels = {
      active: 'Активен',
      completed: 'Завершен',
      cancelled: 'Отменен'
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="min-h-screen bg-stone-50" data-testid="care-plan-page">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Планы лечения</h1>
              <p className="text-sm text-stone-500">Care Plan — персональные рекомендации</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white" data-testid="new-plan-btn">
                <Plus className="w-5 h-5 mr-2" />
                Новый план
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Создать план лечения</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label>Название плана *</Label>
                    <Input
                      value={newPlan.title}
                      onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                      placeholder="Например: Профилактика сердечно-сосудистых заболеваний"
                      className="mt-1.5"
                      data-testid="plan-title-input"
                    />
                  </div>
                  <div>
                    <Label>Описание *</Label>
                    <textarea
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                      placeholder="Опишите цель и контекст плана..."
                      className="w-full mt-1.5 p-3 rounded-lg border border-stone-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
                      rows={3}
                      data-testid="plan-description-input"
                    />
                  </div>
                </div>

                {/* Goals */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Цели</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={addGoal}>
                      <Plus className="w-4 h-4 mr-1" />
                      Добавить
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newPlan.goals.map((goal, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={goal}
                          onChange={(e) => updateGoal(index, e.target.value)}
                          placeholder="Цель..."
                          data-testid={`goal-input-${index}`}
                        />
                        {newPlan.goals.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeGoal(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Препараты</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={addMedication}>
                      <Plus className="w-4 h-4 mr-1" />
                      Добавить
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {newPlan.medications.map((med, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2">
                        <Input
                          value={med.name}
                          onChange={(e) => updateMedication(index, 'name', e.target.value)}
                          placeholder="Название"
                        />
                        <Input
                          value={med.dosage}
                          onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                          placeholder="Дозировка"
                        />
                        <Input
                          value={med.frequency}
                          onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                          placeholder="Частота приема"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lifestyle */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Рекомендации по образу жизни</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={addRecommendation}>
                      <Plus className="w-4 h-4 mr-1" />
                      Добавить
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newPlan.lifestyle_recommendations.map((rec, index) => (
                      <Input
                        key={index}
                        value={rec}
                        onChange={(e) => updateRecommendation(index, e.target.value)}
                        placeholder="Рекомендация..."
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary text-white" data-testid="save-plan-btn">
                    Создать план
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
            { value: 'active', label: 'Активные' },
            { value: 'completed', label: 'Завершенные' },
            { value: 'all', label: 'Все планы' }
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

        {/* Care Plans List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Heart className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-500">Загрузка планов...</p>
          </div>
        ) : carePlans.length > 0 ? (
          <div className="space-y-6">
            {carePlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden"
                data-testid={`care-plan-${plan.id}`}
              >
                {/* Header */}
                <div className="p-6 border-b border-stone-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-stone-900">{plan.title}</h3>
                        {getStatusBadge(plan.status)}
                      </div>
                      <p className="text-stone-600">{plan.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-stone-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Создан: {format(new Date(plan.created_at), 'd MMM yyyy', { locale: ru })}
                        </span>
                        {plan.follow_up_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Контроль: {format(new Date(plan.follow_up_date), 'd MMM yyyy', { locale: ru })}
                          </span>
                        )}
                      </div>
                    </div>
                    {plan.status === 'active' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updatePlanStatus(plan.id, 'completed')}
                          className="text-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Завершить
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 grid md:grid-cols-3 gap-6">
                  {/* Goals */}
                  {plan.goals && plan.goals.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-teal-600" />
                        <h4 className="font-medium text-stone-900">Цели</h4>
                      </div>
                      <ul className="space-y-2">
                        {plan.goals.map((goal, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                            <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs text-teal-700">{i + 1}</span>
                            </div>
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Medications */}
                  {plan.medications && plan.medications.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Pill className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-stone-900">Препараты</h4>
                      </div>
                      <ul className="space-y-3">
                        {plan.medications.map((med, i) => (
                          <li key={i} className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                            <p className="font-medium text-blue-900">{med.name}</p>
                            <p className="text-sm text-blue-700">{med.dosage} • {med.frequency}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lifestyle */}
                  {plan.lifestyle_recommendations && plan.lifestyle_recommendations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-5 h-5 text-amber-600" />
                        <h4 className="font-medium text-stone-900">Образ жизни</h4>
                      </div>
                      <ul className="space-y-2">
                        {plan.lifestyle_recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                            <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-100">
            <div className="w-20 h-20 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-stone-400" />
            </div>
            <h3 className="text-xl font-semibold text-stone-900 mb-2">Планов пока нет</h3>
            <p className="text-stone-500 mb-6">Создайте персональный план для отслеживания лечения</p>
            <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary text-white">
              <Plus className="w-5 h-5 mr-2" />
              Создать план
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CarePlanPage;
