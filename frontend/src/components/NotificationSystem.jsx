import { useState, useEffect } from 'react';

export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { notifications, addNotification, removeNotification };
};

const NotificationContainer = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-40 space-y-2 max-w-md">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

const NotificationItem = ({ notification, onClose }) => {
  const typeConfig = {
    success: {
      bg: 'bg-green-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
      icon: '✓'
    },
    error: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: '✕'
    },
    warning: {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: '⚠'
    },
    info: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: 'ℹ'
    }
  };

  const config = typeConfig[notification.type] || typeConfig.info;

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`glass rounded-lg p-4 border ${config.border} ${config.bg} flex items-start gap-3 animate-slide-in`}>
      <span className={`text-lg ${config.text} flex-shrink-0`}>{config.icon}</span>
      <p className={`flex-1 text-sm ${config.text}`}>{notification.message}</p>
      <button
        onClick={onClose}
        className={`flex-shrink-0 text-lg ${config.text} hover:opacity-70`}
      >
        ✕
      </button>
    </div>
  );
};

export default NotificationContainer;
