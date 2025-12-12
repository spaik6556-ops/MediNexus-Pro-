import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Send, ArrowLeft, AlertTriangle, CheckCircle, 
  Clock, Activity, Loader2, X, Plus, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { symptomsApi } from '../services/api';
import { toast } from 'sonner';

const COMMON_SYMPTOMS = [
  'Головная боль', 'Температура', 'Кашель', 'Боль в горле',
  'Тошнота', 'Усталость', 'Боль в спине', 'Головокружение',
  'Одышка', 'Боль в животе', 'Бессонница', 'Сыпь'
];

const SymptomChecker = () => {
  const [symptoms, setSymptoms] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [analysis]);

  const addSymptom = (symptom) => {
    if (symptom && !symptoms.includes(symptom)) {
      setSymptoms([...symptoms, symptom]);
      setInputValue('');
    }
  };

  const removeSymptom = (symptom) => {
    setSymptoms(symptoms.filter(s => s !== symptom));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addSymptom(inputValue.trim());
    }
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) {
      toast.error('Добавьте хотя бы один симптом');
      return;
    }

    setLoading(true);
    try {
      const response = await symptomsApi.analyze({
        symptoms,
        duration,
        severity,
        additional_info: additionalInfo
      });
      setAnalysis(response.data);
      setStep(3);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Ошибка анализа. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const getTriageColor = (level) => {
    const colors = {
      emergency: 'bg-red-100 text-red-700 border-red-200',
      urgent: 'bg-orange-100 text-orange-700 border-orange-200',
      standard: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      routine: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[level] || colors.routine;
  };

  const getTriageLabel = (level) => {
    const labels = {
      emergency: 'Экстренная помощь',
      urgent: 'Срочный прием',
      standard: 'Стандартный прием',
      routine: 'Плановый осмотр'
    };
    return labels[level] || 'Рекомендуется консультация';
  };

  const resetChecker = () => {
    setSymptoms([]);
    setDuration('');
    setSeverity('');
    setAdditionalInfo('');
    setAnalysis(null);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-stone-50" data-testid="symptom-checker-page">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <Brain className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900">AI Симптом-чекер</h1>
              <p className="text-sm text-stone-500">Интеллектуальный анализ симптомов</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                step >= s ? 'bg-teal-600 text-white' : 'bg-stone-200 text-stone-500'
              }`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`w-20 h-1 mx-2 rounded transition-colors ${
                  step > s ? 'bg-teal-600' : 'bg-stone-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Symptoms */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100"
            >
              <h2 className="text-2xl font-bold text-stone-900 mb-2">Опишите ваши симптомы</h2>
              <p className="text-stone-600 mb-6">Выберите из списка или введите свои симптомы</p>

              {/* Selected symptoms */}
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {symptoms.map((symptom) => (
                    <Badge
                      key={symptom}
                      variant="secondary"
                      className="px-3 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 cursor-pointer"
                      onClick={() => removeSymptom(symptom)}
                      data-testid={`selected-symptom-${symptom}`}
                    >
                      {symptom}
                      <X className="w-4 h-4 ml-2" />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="relative mb-6">
                <Input
                  placeholder="Введите симптом..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pr-12"
                  data-testid="symptom-input"
                />
                <button
                  onClick={() => addSymptom(inputValue.trim())}
                  disabled={!inputValue.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-teal-600 text-white disabled:bg-stone-200 disabled:text-stone-400"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Common symptoms */}
              <p className="text-sm text-stone-500 mb-3">Частые симптомы:</p>
              <div className="flex flex-wrap gap-2 mb-8">
                {COMMON_SYMPTOMS.filter(s => !symptoms.includes(s)).map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => addSymptom(symptom)}
                    className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors text-sm"
                    data-testid={`common-symptom-${symptom}`}
                  >
                    + {symptom}
                  </button>
                ))}
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={symptoms.length === 0}
                className="w-full gradient-primary text-white py-6"
                data-testid="step1-next-btn"
              >
                Продолжить
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Additional Info */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100"
            >
              <h2 className="text-2xl font-bold text-stone-900 mb-2">Дополнительная информация</h2>
              <p className="text-stone-600 mb-6">Это поможет AI дать более точную оценку</p>

              {/* Duration */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Как давно появились симптомы?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Сегодня', '2-3 дня', 'Неделя', 'Больше недели'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`p-3 rounded-xl border-2 transition-colors ${
                        duration === d 
                          ? 'border-teal-600 bg-teal-50 text-teal-700' 
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                      data-testid={`duration-${d}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Насколько сильно выражены симптомы?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'mild', label: 'Слабо', color: 'green' },
                    { value: 'moderate', label: 'Умеренно', color: 'yellow' },
                    { value: 'severe', label: 'Сильно', color: 'red' }
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSeverity(s.value)}
                      className={`p-4 rounded-xl border-2 transition-colors ${
                        severity === s.value 
                          ? `border-${s.color}-500 bg-${s.color}-50 text-${s.color}-700` 
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                      data-testid={`severity-${s.value}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional info */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Дополнительная информация (опционально)
                </label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Например: хронические заболевания, принимаемые лекарства, аллергии..."
                  className="w-full p-4 rounded-xl border border-stone-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
                  rows={4}
                  data-testid="additional-info-input"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 py-6"
                >
                  Назад
                </Button>
                <Button
                  onClick={analyzeSymptoms}
                  disabled={loading}
                  className="flex-1 gradient-primary text-white py-6"
                  data-testid="analyze-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Анализ...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-2" />
                      Анализировать
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Results */}
          {step === 3 && analysis && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Triage Level */}
              <div className={`rounded-2xl p-6 border-2 ${getTriageColor(analysis.triage_level)}`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/50 flex items-center justify-center">
                    {analysis.triage_level === 'emergency' || analysis.triage_level === 'urgent' ? (
                      <AlertTriangle className="w-7 h-7" />
                    ) : (
                      <CheckCircle className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium opacity-80">Уровень срочности</p>
                    <p className="text-2xl font-bold">{getTriageLabel(analysis.triage_level)}</p>
                  </div>
                </div>
              </div>

              {/* Possible Conditions */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                <h3 className="text-lg font-bold text-stone-900 mb-4">Возможные состояния</h3>
                <div className="space-y-4">
                  {analysis.possible_conditions.map((condition, index) => (
                    <div key={index} className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-stone-900">{condition.name}</p>
                        <Badge variant={condition.probability === 'high' ? 'default' : 'secondary'}>
                          {condition.probability === 'high' ? 'Высокая' : condition.probability === 'medium' ? 'Средняя' : 'Низкая'} вероятность
                        </Badge>
                      </div>
                      <p className="text-sm text-stone-600">{condition.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                <h3 className="text-lg font-bold text-stone-900 mb-4">Рекомендации</h3>
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-teal-700" />
                      </div>
                      <p className="text-stone-700">{rec}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800 mb-1">Важно</p>
                    <p className="text-sm text-amber-700">{analysis.disclaimer}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={resetChecker}
                  className="flex-1 py-6"
                  data-testid="new-check-btn"
                >
                  Новая проверка
                </Button>
                <Link to="/appointments" className="flex-1">
                  <Button className="w-full gradient-primary text-white py-6" data-testid="book-appointment-btn">
                    Записаться к врачу
                  </Button>
                </Link>
              </div>

              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default SymptomChecker;
