// Notification Composer Component using Meteor Accounts
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

interface NotificationComposerProps {
  currentUserId: string;
}

export const NotificationComposer: React.FC<NotificationComposerProps> = ({ currentUserId }) => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Get users from Meteor
  const { users } = useTracker(() => {
    const handle = Meteor.subscribe('allUsers');
    
    return {
      users: Meteor.users.find({ _id: { $ne: currentUserId } }).fetch(),
      isReady: handle.ready()
    };
  }, [currentUserId]);

  const isLoggingIn = useTracker(() => Meteor.loggingIn(), []);
  const userId = useTracker(() => Meteor.userId(), []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn || !userId) {
      setError('You must be logged in to send notifications.');
      return;
    }
    
    if (!title.trim() || !message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (selectedUser === 'all') {
        await Meteor.callAsync('userNotifications.sendToAll', title, message);
        setSuccess(`Notification sent to all users!`);
      } else if (selectedUser) {
        await Meteor.callAsync('userNotifications.send', selectedUser, title, message);
        const user = users.find(u => u._id === selectedUser);
        const userName = user?.emails?.[0]?.address || 'Unknown User';
        setSuccess(`Notification sent to ${userName}!`);
      }
      // Reset form
      setTitle('');
      setMessage('');
      setSelectedUser('');
    } catch (err: any) {
      setError(err.reason || 'Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="notification-composer" style={{
      height: '100%',
      overflow: 'auto',
      paddingRight: '8px'
    }}>
      <h3>Send Notification</h3>
      
      <form onSubmit={handleSubmit} className="composer-form" style={{
        maxHeight: 'calc(100vh - 300px)',
        overflow: 'auto'
      }}>
        <div className="form-group">
          <label>Send to:</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            required
            className="recipient-select"
          >
            <option value="">Select recipient...</option>
            <option value="all" className="broadcast-option">
              🌍 Broadcast to All Users
            </option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.emails?.[0]?.address || 'Unknown User'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title..."
            required
            maxLength={100}
            className="title-input"
          />
          <small className="char-count">{title.length}/100</small>
        </div>

        <div className="form-group">
          <label>Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message..."
            required
            maxLength={500}
            rows={4}
            className="message-textarea"
          />
          <small className="char-count">{message.length}/500</small>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !selectedUser || !title.trim() || !message.trim() || isLoggingIn || !userId}
          className="send-button"
        >
          {isLoading ? (
            <>
              <div className="spinner"></div>
              Sending...
            </>
          ) : (
            <>
              🚀 Send Notification
            </>
          )}
        </button>
      </form>

      {selectedUser === 'all' && (
        <div className="broadcast-warning">
          ⚠️ This will send a notification to all registered users
        </div>
      )}

      <style>{`
        .notification-composer h3 {
          margin: 0 0 24px 0;
          color: #1a1a1a;
          font-size: 20px;
          font-weight: 600;
        }

        .composer-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .composer-form::-webkit-scrollbar {
          width: 6px;
        }

        .composer-form::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .composer-form::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .composer-form::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .recipient-select,
        .title-input,
        .message-textarea {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          background: white;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .recipient-select:focus,
        .title-input:focus,
        .message-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .broadcast-option {
          background: #fef3c7;
          font-weight: 600;
        }

        .char-count {
          align-self: flex-end;
          color: #9ca3af;
          font-size: 12px;
        }

        .message-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #fecaca;
          font-size: 14px;
        }

        .success-message {
          background: #f0fdf4;
          color: #16a34a;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #bbf7d0;
          font-size: 14px;
        }

        .send-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 56px;
        }

        .send-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .broadcast-warning {
          background: #fffbeb;
          color: #d97706;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #fed7aa;
          font-size: 14px;
          margin-top: 16px;
          text-align: center;
        }

        @media (max-width: 480px) {
          .composer-form {
            gap: 16px;
          }
          
          .send-button {
            padding: 14px 20px;
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
};
