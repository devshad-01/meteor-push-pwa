// Main Dashboard Component
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UsersList } from '/imports/ui/components/UsersList';
import { NotificationCenter } from '/imports/ui/components/NotificationCenter';
import { NotificationComposer } from '/imports/ui/components/NotificationComposer';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'notifications' | 'users' | 'compose'>('notifications');
  const [unreadCount, setUnreadCount] = useState(0);

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: '🔔', badge: unreadCount },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'compose', label: 'Send', icon: '📤' }
  ];

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        color: 'white',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent((user?.profile?.name || user?.emails?.[0]?.address || 'User'))}&background=667eea&color=fff`}
              alt={user?.profile?.name || 'User'} 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}
            />
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Welcome back</h2>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>{user?.profile?.name || user?.emails?.[0]?.address}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              style={{
                width: '40px',
                height: '40px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ⚙️
            </button>
            <button 
              onClick={logout}
              style={{
                width: '40px',
                height: '40px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(220, 38, 127, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '20px 20px 100px 20px',
        overflow: 'hidden',
        display: 'flex'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '24px',
          maxWidth: '800px',
          margin: '0 auto',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            flex: 1,
            overflow: 'auto',
            paddingRight: '4px'
          }}>
            {activeTab === 'notifications' && (
              <NotificationCenter userId={user!._id} onUnreadCountChange={setUnreadCount} />
            )}
            {activeTab === 'users' && <UsersList currentUserId={user!._id} />}
            {activeTab === 'compose' && <NotificationComposer currentUserId={user!._id} />}
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Fixed */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '12px 20px 24px',
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        zIndex: 1000
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={{
              background: activeTab === tab.id ? 'rgba(102, 126, 234, 0.1)' : 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: '8px 16px',
              borderRadius: '12px',
              minWidth: '60px',
              color: activeTab === tab.id ? '#667eea' : '#666'
            }}
            onClick={() => setActiveTab(tab.id as any)}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ position: 'relative', fontSize: '20px' }}>
              {tab.icon}
              {tab.badge && tab.badge > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#ff4757',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '16px',
                  textAlign: 'center'
                }}>
                  {tab.badge}
                </span>
              )}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
