import React, { useState, useRef, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { useAuthStore } from '../stores/authStore';
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from '../stores/notificationStore';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { isLoading, setLoading, incrementLoginAttempts, resetLoginAttempts, loginAttempts } = useAuthStore();

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to set loading state with minimum duration
  const setLoadingState = (loading: boolean, minDuration = 500) => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    setLoading(loading);
    
    if (loading && minDuration > 0) {
      loadingTimeoutRef.current = setTimeout(() => {
        // This ensures loading state visibility
      }, minDuration);
    }
  };

  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    if (loginAttempts >= 5) {
      showErrorToast('Too many login attempts. Please wait before trying again.', 8000);
      return;
    }
    
    setLoadingState(true);

    if (isLogin) {
      showInfoToast('🔐 Signing in...', 2000);
      
      try {
        await new Promise<void>((resolve, reject) => {
          Meteor.loginWithPassword(email, password, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        
        resetLoginAttempts();
        setEmail('');
        setPassword('');
        showSuccessToast('🎉 Welcome back! Successfully logged in.', 3000);
        onLoginSuccess?.();
      } catch (err: any) {
        console.error('Login error:', err);
        incrementLoginAttempts();
        showErrorToast(`Login failed: ${err.message || 'Unknown error'}`, 6000);
      } finally {
        setTimeout(() => setLoadingState(false), 100);
      }
    } else {
      // Sign up validation
      if (password !== confirmPassword) {
        setLoadingState(false);
        showWarningToast('⚠️ Passwords do not match', 4000);
        return;
      }

      if (password.length < 6) {
        setLoadingState(false);
        showWarningToast('⚠️ Password must be at least 6 characters', 4000);
        return;
      }

      showInfoToast('📝 Creating your account...', 2000);

      const options: any = {
        email: email.trim(),
        password,
      };

      if (username.trim()) {
        options.username = username.trim();
      }

      try {
        await new Promise<void>((resolve, reject) => {
          Accounts.createUser(options, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        
        resetForm();
        showSuccessToast('🎉 Account created successfully! Welcome!', 4000);
        onLoginSuccess?.();
      } catch (err: any) {
        console.error('Account creation error:', err);
        let errorMessage = 'Account creation failed';
        
        if (err && typeof err === 'object') {
          if ('reason' in err && err.reason) {
            errorMessage = err.reason;
          } else if ('message' in err && err.message) {
            errorMessage = err.message;
          }
        }
        
        showErrorToast(`Account creation failed: ${errorMessage}`, 6000);
      } finally {
        setTimeout(() => setLoadingState(false), 100);
      }
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setLoading(false);
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      {/* Add CSS animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .error-shake {
            animation: shake 0.5s ease-in-out;
          }
        `
      }} />
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '30px', 
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
          {isLogin ? '🔐 Login' : '📝 Sign Up'}
        </h2>

        {/* Loading indicator */}
        {isLoading && (
          <div style={{
            background: '#d1ecf1',
            color: '#0c5460',
            padding: '12px 15px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '1px solid #bee5eb',
            fontSize: '14px',
            textAlign: 'center',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            <span>🔄 </span>
            {isLogin ? 'Signing in...' : 'Creating account...'}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Username (optional):
              </label>
              <input
                type="text"
                value={username}
                onChange={handleInputChange(setUsername)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                placeholder="Enter username"
              />
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={handleInputChange(setEmail)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={handleInputChange(setPassword)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              placeholder="Enter your password"
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Confirm Password:
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={handleInputChange(setConfirmPassword)}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                placeholder="Confirm your password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              background: isLoading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginBottom: '15px',
              transition: 'background-color 0.2s ease',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 
              (isLogin ? '🔐 Signing in...' : '📝 Creating account...') : 
              (isLogin ? '🔐 Login' : '📝 Sign Up')
            }
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={toggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Login"
            }
          </button>
        </div>

        {loginAttempts > 0 && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            background: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            Login attempts: {loginAttempts}/5
          </div>
        )}
      </div>
    </div>
  );
};
