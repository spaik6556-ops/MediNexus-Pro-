import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Upload, ArrowLeft, Search, Filter, Trash2,
  Plus, File, Image, Activity, Calendar, Brain, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { documentsApi } from '../services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const DOCUMENT_TYPES = [
  { value: 'lab_report', label: 'Результаты анализов', icon: Activity, color: 'blue' },
  { value: 'imaging', label: 'Снимки (КТ, МРТ, УЗИ)', icon: Image, color: 'purple' },
  { value: 'prescription', label: 'Рецепт', icon: FileText, color: 'green' },
  { value: 'discharge_summary', label: 'Выписка', icon: File, color: 'amber' },
  { value: 'consultation', label: 'Заключение врача', icon: Brain, color: 'teal' },
  { value: 'other', label: 'Другое', icon: File, color: 'stone' }
];

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    document_type: '',
    description: ''
  });

  useEffect(() => {
    fetchDocuments();
  }, [filterType]);

  const fetchDocuments = async () => {
    try {
      const params = filterType !== 'all' ? { document_type: filterType } : {};
      const response = await documentsApi.getAll(params);
      setDocuments(response.data);
    } catch (error) {
      console.error('Fetch documents error:', error);
      toast.error('Ошибка загрузки документов');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDoc.title || !newDoc.document_type) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      await documentsApi.create(newDoc);
      toast.success('Документ добавлен');
      setIsDialogOpen(false);
      setNewDoc({ title: '', document_type: '', description: '' });
      fetchDocuments();
    } catch (error) {
      console.error('Create document error:', error);
      toast.error('Ошибка создания документа');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить этот документ?')) return;
    
    try {
      await documentsApi.delete(id);
      toast.success('Документ удален');
      fetchDocuments();
    } catch (error) {
      console.error('Delete document error:', error);
      toast.error('Ошибка удаления');
    }
  };

  const getDocTypeInfo = (type) => {
    return DOCUMENT_TYPES.find(t => t.value === type) || DOCUMENT_TYPES[5];
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50" data-testid="documents-page">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Документы и исследования</h1>
              <p className="text-sm text-stone-500">Doc Hub — умное хранилище</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white" data-testid="add-document-btn">
                <Plus className="w-5 h-5 mr-2" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Новый документ</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label>Название *</Label>
                  <Input
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    placeholder="Например: Общий анализ крови"
                    className="mt-1.5"
                    data-testid="doc-title-input"
                  />
                </div>
                <div>
                  <Label>Тип документа *</Label>
                  <Select
                    value={newDoc.document_type}
                    onValueChange={(value) => setNewDoc({ ...newDoc, document_type: value })}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="doc-type-select">
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Описание / Содержание</Label>
                  <textarea
                    value={newDoc.description}
                    onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                    placeholder="Введите содержание документа для AI-анализа..."
                    className="w-full mt-1.5 p-3 rounded-lg border border-stone-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
                    rows={4}
                    data-testid="doc-description-input"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary text-white" data-testid="save-doc-btn">
                    Сохранить
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input
              placeholder="Поиск документов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48" data-testid="filter-select">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Все типы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document Types Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {DOCUMENT_TYPES.map((type) => {
            const count = documents.filter(d => d.document_type === type.value).length;
            return (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                className={`p-4 rounded-xl border transition-colors text-center ${
                  filterType === type.value 
                    ? 'border-teal-500 bg-teal-50' 
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-${type.color}-100 flex items-center justify-center mx-auto mb-2`}>
                  <type.icon className={`w-5 h-5 text-${type.color}-600`} />
                </div>
                <p className="text-xs text-stone-500 mb-1">{type.label}</p>
                <p className="text-xl font-bold text-stone-900">{count}</p>
              </button>
            );
          })}
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <FileText className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-500">Загрузка документов...</p>
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc, index) => {
              const typeInfo = getDocTypeInfo(doc.document_type);
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
                  data-testid={`document-${doc.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-${typeInfo.color}-100 flex items-center justify-center`}>
                      <typeInfo.icon className={`w-6 h-6 text-${typeInfo.color}-600`} />
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-red-500 transition-colors"
                      data-testid={`delete-doc-${doc.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-stone-900 mb-1 line-clamp-1">{doc.title}</h3>
                  <Badge variant="secondary" className="mb-3">{typeInfo.label}</Badge>
                  
                  {doc.description && (
                    <p className="text-sm text-stone-500 line-clamp-2 mb-3">{doc.description}</p>
                  )}
                  
                  {doc.ai_summary && (
                    <div className="p-3 rounded-lg bg-teal-50 border border-teal-100 mb-3">
                      <p className="text-xs font-medium text-teal-700 mb-1">AI-сводка</p>
                      <p className="text-sm text-teal-800 line-clamp-2">{doc.ai_summary}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(doc.created_at), 'd MMM yyyy', { locale: ru })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-100">
            <div className="w-20 h-20 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-stone-400" />
            </div>
            <h3 className="text-xl font-semibold text-stone-900 mb-2">Документов пока нет</h3>
            <p className="text-stone-500 mb-6">Добавьте первый медицинский документ для AI-анализа</p>
            <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary text-white">
              <Plus className="w-5 h-5 mr-2" />
              Добавить документ
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentsPage;
