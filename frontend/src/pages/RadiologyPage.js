import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Scan, ArrowLeft, Upload, Brain, AlertTriangle, CheckCircle,
  Image, FileText, Activity, Loader2, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const IMAGE_TYPES = [
  { value: 'ct', label: 'КТ (Компьютерная томография)' },
  { value: 'mri', label: 'МРТ (Магнитно-резонансная томография)' },
  { value: 'xray', label: 'Рентген' },
  { value: 'ultrasound', label: 'УЗИ' }
];

const BODY_REGIONS = [
  { value: 'head', label: 'Голова' },
  { value: 'chest', label: 'Грудная клетка' },
  { value: 'abdomen', label: 'Брюшная полость' },
  { value: 'spine', label: 'Позвоночник' },
  { value: 'pelvis', label: 'Таз' },
  { value: 'extremities', label: 'Конечности' },
  { value: 'heart', label: 'Сердце' },
  { value: 'lungs', label: 'Лёгкие' }
];

const RadiologyPage = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [formData, setFormData] = useState({
    image_type: '',
    body_region: '',
    clinical_context: ''
  });

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const response = await axios.get(`${API_URL}/v1/radiology/analyses`);
      setAnalyses(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeImage = async () => {
    if (!formData.image_type || !formData.body_region) {
      toast.error('Выберите тип исследования и область');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await axios.post(`${API_URL}/v1/radiology/analyze`, formData);
      toast.success('Анализ завершён');
      setShowForm(false);
      setSelectedAnalysis(response.data);
      setFormData({ image_type: '', body_region: '', clinical_context: '' });
      fetchAnalyses();
    } catch (error) {
      toast.error('Ошибка анализа');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      normal: 'bg-green-100 text-green-700',
      mild: 'bg-yellow-100 text-yellow-700',
      moderate: 'bg-orange-100 text-orange-700',
      severe: 'bg-red-100 text-red-700',
      unknown: 'bg-stone-100 text-stone-700'
    };
    return colors[severity] || colors.unknown;
  };

  const getSeverityLabel = (severity) => {
    const labels = {
      normal: 'Норма',
      mild: 'Лёгкая',
      moderate: 'Умеренная',
      severe: 'Выраженная',
      unknown: 'Неизвестно'
    };
    return labels[severity] || severity;
  };

  return (
    <div className="min-h-screen bg-stone-50" data-testid="radiology-page">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Radiology AI</h1>
              <p className="text-sm text-stone-500">AI-анализ медицинских снимков</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="gradient-primary text-white"
            data-testid="new-analysis-btn"
          >
            <Scan className="w-5 h-5 mr-2" />
            Новый анализ
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Analysis Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-8"
          >
            <h2 className="text-lg font-semibold text-stone-900 mb-6">Запрос AI-анализа</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Тип исследования *</Label>
                <Select
                  value={formData.image_type}
                  onValueChange={(value) => setFormData({ ...formData, image_type: value })}
                >
                  <SelectTrigger className="mt-1.5" data-testid="image-type-select">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Область исследования *</Label>
                <Select
                  value={formData.body_region}
                  onValueChange={(value) => setFormData({ ...formData, body_region: value })}
                >
                  <SelectTrigger className="mt-1.5" data-testid="body-region-select">
                    <SelectValue placeholder="Выберите область" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>{region.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Клинический контекст</Label>
                <textarea
                  value={formData.clinical_context}
                  onChange={(e) => setFormData({ ...formData, clinical_context: e.target.value })}
                  placeholder="Опишите жалобы пациента, анамнез, предварительный диагноз..."
                  className="w-full mt-1.5 p-3 rounded-lg border border-stone-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
                  rows={3}
                  data-testid="clinical-context-input"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                Отмена
              </Button>
              <Button 
                onClick={analyzeImage}
                disabled={analyzing}
                className="flex-1 gradient-primary text-white"
                data-testid="analyze-btn"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Анализ...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    Запустить AI-анализ
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Selected Analysis Result */}
        {selectedAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-stone-100 mb-8 overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 bg-gradient-to-r from-teal-50 to-stone-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Brain className="w-7 h-7 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">
                      {IMAGE_TYPES.find(t => t.value === selectedAnalysis.image_type)?.label || selectedAnalysis.image_type}
                    </h3>
                    <p className="text-sm text-stone-500">
                      {BODY_REGIONS.find(r => r.value === selectedAnalysis.body_region)?.label || selectedAnalysis.body_region}
                    </p>
                  </div>
                </div>
                <Badge className="bg-teal-100 text-teal-700">
                  AI уверенность: {Math.round(selectedAnalysis.ai_confidence * 100)}%
                </Badge>
              </div>
            </div>

            <div className="p-6">
              {/* Impression */}
              <div className="mb-6">
                <h4 className="font-semibold text-stone-900 mb-2">Заключение</h4>
                <p className="text-stone-700 bg-stone-50 p-4 rounded-xl">{selectedAnalysis.impression}</p>
              </div>

              {/* Findings */}
              <div className="mb-6">
                <h4 className="font-semibold text-stone-900 mb-3">Находки</h4>
                <div className="space-y-3">
                  {selectedAnalysis.findings.map((finding, index) => (
                    <div key={index} className="p-4 rounded-xl border border-stone-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-stone-900">{finding.finding}</span>
                        <Badge className={getSeverityColor(finding.severity)}>
                          {getSeverityLabel(finding.severity)}
                        </Badge>
                      </div>
                      <p className="text-sm text-stone-500 mb-1">Локализация: {finding.location}</p>
                      <p className="text-sm text-stone-600">{finding.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-stone-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-teal-500 rounded-full" 
                            style={{ width: `${finding.confidence * 100}%` }} 
                          />
                        </div>
                        <span className="text-xs text-stone-500">{Math.round(finding.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="mb-6">
                <h4 className="font-semibold text-stone-900 mb-3">Рекомендации</h4>
                <ul className="space-y-2">
                  {selectedAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-stone-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">{selectedAnalysis.disclaimer}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Analyses History */}
        <h2 className="text-lg font-semibold text-stone-900 mb-4">История анализов</h2>
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-4" />
            <p className="text-stone-500">Загрузка...</p>
          </div>
        ) : analyses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.map((analysis, index) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedAnalysis(analysis)}
                data-testid={`analysis-${analysis.id}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Image className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-900">
                      {IMAGE_TYPES.find(t => t.value === analysis.image_type)?.label.split(' ')[0] || analysis.image_type}
                    </h3>
                    <p className="text-sm text-stone-500">
                      {BODY_REGIONS.find(r => r.value === analysis.body_region)?.label || analysis.body_region}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-stone-600 line-clamp-2 mb-3">{analysis.impression}</p>
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>{format(new Date(analysis.created_at), 'd MMM yyyy', { locale: ru })}</span>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Eye className="w-3 h-3 mr-1" />
                    Подробнее
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-100">
            <div className="w-20 h-20 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-6">
              <Scan className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold text-stone-900 mb-2">Анализов пока нет</h3>
            <p className="text-stone-500 mb-6">Загрузите снимок для AI-анализа</p>
            <Button onClick={() => setShowForm(true)} className="gradient-primary text-white">
              <Scan className="w-5 h-5 mr-2" />
              Новый анализ
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default RadiologyPage;
