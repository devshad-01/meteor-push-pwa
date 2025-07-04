import React, { useEffect } from 'react';
import { useNotificationStore, ToastNotification } from '../stores/notificationStore';

interface ToastProps {
  toast: ToastNotification;
  onRemove: (toastId: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const getToastStyles = (type: ToastNotification['type']) => {
    const baseStyles: React.CSSProperties = {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '14px',
      fontWeight: '500',
      animation: 'slideInRight 0.3s ease-out',
      minWidth: '300px',
      maxWidth: '500px',
      position: 'relative',
      overflow: 'hidden'
    };

    const typeStyles = {
      success: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        border: '1px solid #065f46'
      },
      error: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
        border: '1px solid #991b1b'
      },
      warning: {
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        border: '1px solid #92400e'
      },
      info: {
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: 'white',
        border: '1px solid #1d4ed8'
      }
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  const getIcon = (type: ToastNotification['type']) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  };

  return (
    <div style={getToastStyles(toast.type)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{getIcon(toast.type)}</span>
        <span>{toast.message}</span>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'currentColor',
          cursor: 'pointer',
          fontSize: '18px',
          opacity: 0.7,
          padding: '0 4px',
          marginLeft: '12px'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
      >
        ×
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useNotificationStore(state => state.toasts);
  const removeToast = useNotificationStore(state => state.removeToast);

  useEffect(() => {
    // Add CSS animations to document head
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .toast-exit {
        animation: slideOutRight 0.3s ease-in forwards;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto'
      }}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </div>
  );
};
