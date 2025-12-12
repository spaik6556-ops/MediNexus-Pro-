import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, X, Calendar, Pill, FileText, MessageSquare,
  ChevronRight, Clock, Trash2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NotificationsPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        axios.get(`${API_URL}/v1/notifications`, { params: { limit: 20 } }),
        axios.get(`${API_URL}/v1/notifications/unread-count`)
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.unread_count);
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/v1/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/v1/notifications/read-all`);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Все уведомления прочитаны');
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      appointment_reminder: Calendar,
      medication_reminder: Pill,
      lab_result: FileText,
      doctor_message: MessageSquare,
      system: Bell
    };
    return icons[type] || Bell;
  };

  const getNotificationColor = (type) => {
    const colors = {
      appointment_reminder: 'bg-blue-100 text-blue-600',
      medication_reminder: 'bg-purple-100 text-purple-600',
      lab_result: 'bg-green-100 text-green-600',
      doctor_message: 'bg-teal-100 text-teal-600',
      system: 'bg-stone-100 text-stone-600'
    };
    return colors[type] || 'bg-stone-100 text-stone-600';
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50"
            data-testid="notifications-panel"
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-stone-900">Уведомления</h2>
                    {unreadCount > 0 && (
                      <p className="text-sm text-stone-500">{unreadCount} непрочитанных</p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              {unreadCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="w-full"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Отметить все прочитанными
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto h-[calc(100%-120px)]">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-pulse text-stone-400">Загрузка...</div>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-stone-100">
                  {notifications.map((notification, index) => {
                    const Icon = getNotificationIcon(notification.notification_type);
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 cursor-pointer hover:bg-stone-50 transition-colors ${
                          !notification.is_read ? 'bg-teal-50/50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.notification_type)}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`font-medium ${!notification.is_read ? 'text-stone-900' : 'text-stone-700'}`}>
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-2" />
                              )}
                            </div>
                            <p className="text-sm text-stone-600 line-clamp-2 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-stone-400">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ru })}
                            </div>
                          </div>
                          {notification.action_url && (
                            <ChevronRight className="w-5 h-5 text-stone-400 flex-shrink-0" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-stone-400" />
                  </div>
                  <h3 className="font-medium text-stone-900 mb-2">Нет уведомлений</h3>
                  <p className="text-sm text-stone-500">
                    Здесь будут появляться важные уведомления о вашем здоровье
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Badge component for notification count
export const NotificationBadge = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  );
};

// Hook for notification count
export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/v1/notifications/unread-count`);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return { unreadCount, refresh: fetchUnreadCount };
};

export default NotificationsPanel;
