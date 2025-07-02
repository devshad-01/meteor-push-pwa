// Users List Component using Meteor Accounts
import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

interface UsersListProps {
  currentUserId: string;
}

interface UsersListProps {
  currentUserId: string;
}

export const UsersList: React.FC<UsersListProps> = ({ currentUserId }) => {
  // Use reactive data from Meteor
  const handle = useTracker(() => Meteor.subscribe('allUsers'), [currentUserId]);
  const users = useTracker(() =>
    Meteor.users.find({ _id: { $ne: currentUserId } }).fetch(),
    [currentUserId]
  );
  const isReady = handle.ready();

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!isReady) {
    return (
      <div className="users-list">
        <h3>Users</h3>
        <div className="loading-users">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="user-skeleton">
              <div className="avatar-skeleton"></div>
              <div className="info-skeleton">
                <div className="name-skeleton"></div>
                <div className="status-skeleton"></div>
              </div>
            </div>
          ))}
        </div>
        <style>{`
          .users-list h3 {
            margin: 0 0 20px 0;
            color: #1a1a1a;
            font-size: 20px;
            font-weight: 600;
          }
          
          .loading-users {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          
          .user-skeleton {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            border-radius: 12px;
          }
          
          .avatar-skeleton {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
          
          .info-skeleton {
            flex: 1;
          }
          
          .name-skeleton {
            height: 16px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
            margin-bottom: 8px;
            width: 120px;
          }
          
          .status-skeleton {
            height: 12px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
            width: 80px;
          }
          
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="users-list">
      <h3>Users ({users.length})</h3>
      <div className="users-grid">
        {users.map((user) => (
          <div key={user._id} className="user-card">
            <div className="user-avatar-container">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent((user.profile as any)?.name || user.emails?.[0]?.address || 'User')}&background=667eea&color=fff`} alt={(user.profile as any)?.name || user.emails?.[0]?.address || 'User'} className="user-avatar" />
              <div className={`status-indicator ${(user.profile as any)?.isOnline ? 'online' : 'offline'}`}></div>
            </div>
            <div className="user-info">
              <h4>{(user.profile as any)?.name || user.emails?.[0]?.address || 'User'}</h4>
              <p className="user-email">{user.emails?.[0]?.address}</p>
              <p className="user-status">
                {(user.profile as any)?.isOnline ? 'Online' : `Last seen ${formatLastSeen((user.profile as any)?.lastSeen || new Date(0))}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .users-list h3 {
          margin: 0 0 20px 0;
          color: #1a1a1a;
          font-size: 20px;
          font-weight: 600;
        }

        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .user-card {
          background: #f8f9fa;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 16px;
          align-items: center;
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
        }

        .user-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          background: white;
        }

        .user-avatar-container {
          position: relative;
        }

        .user-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
        }

        .status-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
        }

        .status-indicator.online {
          background: #10b981;
        }

        .status-indicator.offline {
          background: #6b7280;
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-info h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-status {
          margin: 0;
          font-size: 12px;
          color: #9ca3af;
        }

        @media (max-width: 640px) {
          .users-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
