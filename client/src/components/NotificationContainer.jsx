import { useEffect } from 'react';

const Notification = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification.autoClose) {
      const timer = setTimeout(() => {
        onClose(notification.id);
      }, notification.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
        return 'ℹ';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      className={`notification notification--${notification.type}`}
      onClick={() => onClose(notification.id)}
      role="alert"
    >
      <div className="notification__icon">{getIcon()}</div>
      <div className="notification__content">
        <div className="notification__message">{notification.message}</div>
      </div>
      <button
        className="notification__close"
        onClick={(e) => {
          e.stopPropagation();
          onClose(notification.id);
        }}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

const NotificationContainer = ({ notifications, removeNotification }) => {
  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification key={notification.id} notification={notification} onClose={removeNotification} />
      ))}
    </div>
  );
};

export default NotificationContainer;


