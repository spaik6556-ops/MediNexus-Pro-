import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, ArrowLeft, Plus, Search, Filter,
  ChevronUp, ChevronDown, Minus, Calendar, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { labsApi } from '../services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const COMMON_TESTS = [
  { name: 'Гемоглобин', unit: 'г/л', reference: '120-160' },
  { name: 'Глюкоза', unit: 'ммоль/л', reference: '3.9-6.1' },
  { name: 'Холестерин', unit: 'ммоль/л', reference: '3.6-5.2' },
  { name: 'Креатинин', unit: 'мкмоль/л', reference: '62-115' },
  { name: 'АЛТ', unit: 'Ед/л', reference: '7-56' },
  { name: 'АСТ', unit: 'Ед/л', reference: '10-40' },
  { name: 'Билирубин', unit: 'мкмоль/л', reference: '3.4-17.1' },
  { name: 'Лейкоциты', unit: '×10⁹/л', reference: '4-9' }
];

const LabResultsPage = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [newLab, setNewLab] = useState({
    test_name: '',
    value: '',
    unit: '',
    reference_range: '',
    lab_name: '',
    notes: ''
  });

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await labsApi.getAll({ limit: 100 });
      setLabs(response.data);
    } catch (error) {
      console.error('Fetch labs error:', error);
      toast.error('Ошибка загрузки анализов');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async (testName) => {
    try {
      const response = await labsApi.getTrends(testName);
      setTrendData(response.data.data_points);
      setSelectedTest(testName);
    } catch (error) {
      console.error('Fetch trends error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newLab.test_name || !newLab.value || !newLab.unit) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      await labsApi.create({
        ...newLab,
        value: parseFloat(newLab.value)
      });
      toast.success('Анализ добавлен');
      setIsDialogOpen(false);
      setNewLab({
        test_name: '',
        value: '',
        unit: '',
        reference_range: '',
        lab_name: '',
        notes: ''
      });
      fetchLabs();
    } catch (error) {
      console.error('Create lab error:', error);
      toast.error('Ошибка добавления анализа');
    }
  };

  const selectCommonTest = (test) => {
    setNewLab({
      ...newLab,
      test_name: test.name,
      unit: test.unit,
      reference_range: test.reference
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'high':
        return <ChevronUp className="w-4 h-4 text-amber-600" />;
      case 'low':
        return <ChevronDown className="w-4 h-4 text-blue-600" />;
      case 'critical':
        return <Activity className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-green-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'high':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'high': return 'Выше нормы';
      case 'low': return 'Ниже нормы';
      case 'critical': return 'Критично';
      default: return 'Норма';
    }
  };

  const groupedLabs = labs.reduce((groups, lab) => {
    const name = lab.test_name;
    if (!groups[name]) groups[name] = [];
    groups[name].push(lab);
    return groups;
  }, {});

  const filteredGroups = Object.entries(groupedLabs).filter(([name]) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50" data-testid="labs-page">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Результаты анализов</h1>
              <p className="text-sm text-stone-500">Lab Flow — отслеживание показателей</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white" data-testid="add-lab-btn">
                <Plus className="w-5 h-5 mr-2" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Новый анализ</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Quick select common tests */}
                <div>
                  <Label>Быстрый выбор:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {COMMON_TESTS.slice(0, 6).map((test) => (
                      <button
                        key={test.name}
                        type="button"
                        onClick={() => selectCommonTest(test)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          newLab.test_name === test.name 
                            ? 'bg-teal-100 text-teal-700' 
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {test.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Название анализа *</Label>
                    <Input
                      value={newLab.test_name}
                      onChange={(e) => setNewLab({ ...newLab, test_name: e.target.value })}
                      placeholder="Например: Гемоглобин"
                      className="mt-1.5"
                      data-testid="lab-name-input"
                    />
                  </div>
                  <div>
                    <Label>Значение *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newLab.value}
                      onChange={(e) => setNewLab({ ...newLab, value: e.target.value })}
                      placeholder="145"
                      className="mt-1.5"
                      data-testid="lab-value-input"
                    />
                  </div>
                  <div>
                    <Label>Единицы *</Label>
                    <Input
                      value={newLab.unit}
                      onChange={(e) => setNewLab({ ...newLab, unit: e.target.value })}
                      placeholder="г/л"
                      className="mt-1.5"
                      data-testid="lab-unit-input"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Референсный диапазон</Label>
                    <Input
                      value={newLab.reference_range}
                      onChange={(e) => setNewLab({ ...newLab, reference_range: e.target.value })}
                      placeholder="120-160"
                      className="mt-1.5"
                      data-testid="lab-ref-input"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Лаборатория</Label>
                    <Input
                      value={newLab.lab_name}
                      onChange={(e) => setNewLab({ ...newLab, lab_name: e.target.value })}
                      placeholder="Инвитро"
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary text-white" data-testid="save-lab-btn">
                    Сохранить
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <Input
            placeholder="Поиск по названию анализа..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-labs"
          />
        </div>

        {/* Trends Chart */}
        {selectedTest && trendData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-stone-900">Динамика: {selectedTest}</h3>
                <p className="text-sm text-stone-500">{trendData.length} измерений</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTest(null)}>
                Скрыть
              </Button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData.map(d => ({
                  date: format(new Date(d.date), 'd MMM', { locale: ru }),
                  value: d.value,
                  status: d.status
                }))}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E7E5E4',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0F766E"
                    strokeWidth={3}
                    dot={{ fill: '#0F766E', strokeWidth: 2, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Labs List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <TrendingUp className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-500">Загрузка анализов...</p>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="space-y-4">
            {filteredGroups.map(([testName, results], index) => {
              const latest = results[0];
              return (
                <motion.div
                  key={testName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100"
                  data-testid={`lab-group-${testName}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-stone-900">{testName}</h3>
                        <Badge className={getStatusColor(latest.status)}>
                          {getStatusIcon(latest.status)}
                          <span className="ml-1">{getStatusLabel(latest.status)}</span>
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-stone-900">{latest.value}</span>
                        <span className="text-stone-500">{latest.unit}</span>
                      </div>
                      {latest.reference_range && (
                        <p className="text-sm text-stone-500 mt-1">
                          Норма: {latest.reference_range} {latest.unit}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-stone-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(latest.test_date), 'd MMM yyyy', { locale: ru })}
                        </span>
                        {latest.lab_name && <span>{latest.lab_name}</span>}
                        {results.length > 1 && (
                          <span className="text-teal-600">{results.length} измерений</span>
                        )}
                      </div>
                    </div>
                    {results.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchTrends(testName)}
                        data-testid={`view-trend-${testName}`}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Динамика
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-100">
            <div className="w-20 h-20 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-stone-400" />
            </div>
            <h3 className="text-xl font-semibold text-stone-900 mb-2">Анализов пока нет</h3>
            <p className="text-stone-500 mb-6">Добавьте первый результат для отслеживания динамики</p>
            <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary text-white">
              <Plus className="w-5 h-5 mr-2" />
              Добавить анализ
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default LabResultsPage;
