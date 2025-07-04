import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTrackingStore } from '../stores/trackingStore';
import { showInfoToast } from '../stores/notificationStore';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { trackPageView, trackUserAction } = useTrackingStore();

  useEffect(() => {
    trackPageView('/profile');
  }, [trackPageView]);

  const handleLogout = () => {
    trackUserAction('logout_from_profile');
    showInfoToast('👋 Logging out...', 2000);
    logout();
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: '#28a745',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>👤 User Profile</h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
            Manage your account settings
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🏠 Dashboard
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Profile Content */}
      <div style={{
        background: '#f8f9fa',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>📋 Profile Information</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '6px',
            border: '1px solid #dee2e6',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>👤 User Details</h3>
            <p><strong>User ID:</strong> {user?._id || 'N/A'}</p>
            <p><strong>Email:</strong> {user?.emails?.[0]?.address || 'N/A'}</p>
            <p><strong>Username:</strong> {user?.username || 'Not set'}</p>
            <p><strong>Account Created:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            
            {user?.emails?.[0] && (
              <div style={{ marginTop: '10px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  backgroundColor: user.emails[0].verified ? '#d4edda' : '#fff3cd',
                  color: user.emails[0].verified ? '#155724' : '#856404',
                  border: `1px solid ${user.emails[0].verified ? '#c3e6cb' : '#ffeaa7'}`
                }}>
                  {user.emails[0].verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            )}
          </div>
          
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '6px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>⚙️ Account Settings</h3>
            <p style={{ color: '#6c757d', marginBottom: '15px' }}>
              Profile management features coming soon...
            </p>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => trackUserAction('change_email_clicked')}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📧 Change Email
              </button>
              <button 
                onClick={() => trackUserAction('change_password_clicked')}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔒 Change Password
              </button>
              <button 
                onClick={() => trackUserAction('update_profile_clicked')}
                style={{
                  background: '#fd7e14',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                👤 Update Profile
              </button>
            </div>
          </div>
        </div>

        {/* Security Information */}
        <div style={{
          background: '#e8f5e8',
          border: '1px solid #c3e6c3',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#155724', marginBottom: '15px' }}>🛡️ Security Features</h3>
          <ul style={{ color: '#155724', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
            <li>Secure password authentication with bcrypt</li>
            <li>Real-time session tracking and management</li>
            <li>Rate limiting on login attempts</li>
            <li>Email verification system</li>
            <li>Secure HTTP headers and CSRF protection</li>
            <li>Input validation and sanitization</li>
          </ul>
        </div>

        {/* Real-time Features */}
        <div style={{
          background: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#0c5460', marginBottom: '15px' }}>⚡ Real-time Features</h3>
          <ul style={{ color: '#0c5460', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
            <li>Live user activity tracking</li>
            <li>Real-time notification delivery</li>
            <li>Online presence detection</li>
            <li>Instant push notifications</li>
            <li>Live data synchronization</li>
            <li>Background activity monitoring</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
