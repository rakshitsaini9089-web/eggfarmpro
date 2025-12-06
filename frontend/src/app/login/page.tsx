'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/'); // Redirect to dashboard after successful login
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message) {
        setError(err.message);
      } else {
        setError('Invalid username/email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" />
        <link rel="stylesheet" href="https://unpkg.com/ionicons@4.5.10-0/dist/css/ionicons.min.css" />
      </Head>
      
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat js-fullheight"
        style={{ 
          backgroundImage: "url('/loginbg.jpg')",
          fontFamily: "'Poppins', sans-serif",
          filter: "blur(5px) brightness(0.7)",
          transform: "scale(1.05)"
        }}
      >
        {/* Blurred background overlay */}
      </div>
      
      {/* Content wrapper to show on top of blurred background */}
      <div className="min-h-screen flex items-center justify-center" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <section className="ftco-section">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-6 text-center mb-5">
                <h2 className="heading-section text-white font-weight-bold" style={{ fontSize: '2.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.3)', letterSpacing: '1px' }}>Welcome to Egg Farm Pro</h2>
                <p className="text-white mt-2" style={{ fontSize: '1.2rem', fontWeight: 300, textShadow: '0 1px 5px rgba(0,0,0,0.2)' }}>Egg Farm Operation And Management System</p>
              </div>
            </div>
            <div className="row justify-content-center">
              <div className="col-md-6 col-lg-4">
                <div className="login-wrap p-0" style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                  backdropFilter: 'blur(10px)', 
                  borderRadius: '15px', 
                  padding: '2.5rem !important',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  transform: 'translateY(0)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                }}
                >
                  <h3 className="mb-4 text-center text-white" style={{ fontWeight: 500, fontSize: '1.5rem' }}>Login</h3>
                  <form action="#" className="signin-form" onSubmit={handleSubmit}>
                    {error && (
                      <div className="rounded-lg px-4 py-3 text-sm text-white mb-4 animate__animated animate__shakeX" style={{ backgroundColor: 'rgba(220, 53, 69, 0.9)', borderRadius: '8px' }}>
                        {error}
                      </div>
                    )}
                    
                    <div className="form-group mb-4">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Username" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid transparent',
                          borderRadius: '8px',
                          padding: '14px 20px',
                          fontSize: '16px',
                          fontWeight: 400,
                          width: '100%',
                          boxSizing: 'border-box',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                        onFocus={(e) => {
                          e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                          e.target.style.borderColor = 'rgba(76, 175, 80, 0.5)';
                        }}
                        onBlur={(e) => {
                          e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                          e.target.style.borderColor = 'transparent';
                        }}
                      />
                    </div>
                    
                    <div className="form-group mb-4 position-relative">
                      <input 
                        id="password-field" 
                        type={showPassword ? "text" : "password"} 
                        className="form-control" 
                        placeholder="Password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid transparent',
                          borderRadius: '8px',
                          padding: '14px 50px 14px 20px',
                          fontSize: '16px',
                          fontWeight: 400,
                          width: '100%',
                          boxSizing: 'border-box',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                        onFocus={(e) => {
                          e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                          e.target.style.borderColor = 'rgba(76, 175, 80, 0.5)';
                        }}
                        onBlur={(e) => {
                          e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                          e.target.style.borderColor = 'transparent';
                        }}
                      />
                      <span 
                        className={`fa fa-fw ${showPassword ? 'fa-eye-slash' : 'fa-eye'} field-icon toggle-password`}
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ 
                          position: 'absolute',
                          right: '20px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          cursor: 'pointer',
                          color: '#777',
                          fontSize: '18px',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#4CAF50'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#777'}
                      ></span>
                    </div>
                    
                    <div className="form-group mb-4">
                      <button 
                        type="submit" 
                        className="form-control btn btn-primary submit px-3 d-flex align-items-center justify-content-center"
                        disabled={loading}
                        style={{ 
                          backgroundColor: '#4CAF50',
                          border: '1px solid transparent',
                          borderRadius: '8px',
                          padding: '14px',
                          fontSize: '16px',
                          fontWeight: 500,
                          transition: 'all 0.3s ease',
                          width: '100%',
                          boxSizing: 'border-box',
                          boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#45a049';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.6)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#4CAF50';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.4)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {loading ? (
                          <>
                            <i className="fa fa-spinner fa-spin mr-2"></i>
                            <span>Signing in…</span>
                          </>
                        ) : (
                          <>
                            <i className="fa fa-arrow-right mr-2"></i>
                            <span>Sign In</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="form-group d-flex justify-content-between align-items-center">
                      <label className="checkbox-wrap checkbox-primary text-white mb-0" style={{ fontWeight: 400, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <input type="checkbox" defaultChecked style={{ cursor: 'pointer', marginRight: '8px' }} />
                        <span className="checkmark"></span>
                        Remember Me
                      </label>
                      <a href="#" style={{ color: '#fff', fontWeight: 400, textDecoration: 'none', transition: 'color 0.2s ease' }} 
                         onMouseEnter={(e) => e.currentTarget.style.color = '#a5d6a7'}
                         onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}>
                        Forgot Password?
                      </a>
                    </div>
                    
                    {/* Demo Credentials */}
                    <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                      <p className="text-white mb-2" style={{ fontWeight: 500, fontSize: '0.9rem' }}>Demo Credentials:</p>
                      <div className="d-flex justify-content-between">
                        <div>
                          <p className="text-white mb-1" style={{ fontSize: '0.8rem' }}><strong>Admin:</strong> admin@example.com</p>
                          <p className="text-white mb-0" style={{ fontSize: '0.8rem' }}><strong>Password:</strong> admin123</p>
                        </div>
                      </div>
                    </div>
                  </form>
                  
                  {/* Copyright Notice */}
                  <div className="mt-4 text-center">
                    <p className="text-white mb-0" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                      © {new Date().getFullYear()} Egg Farm Pro. All rights reserved. Crafted with ❤️
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
        
      <style jsx global>{`
        .js-fullheight {
          height: 100vh;
        }
        
        .checkbox-primary {
          position: relative;
          padding-left: 30px;
          cursor: pointer;
          user-select: none;
          font-weight: 400;
        }
        
        .checkbox-primary input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }
        
        .checkmark {
          position: absolute;
          top: 0;
          left: 0;
          height: 20px;
          width: 20px;
          background-color: rgba(255, 255, 255, 0.8);
          border-radius: 4px;
          transition: all 0.3s;
        }
        
        .checkbox-primary:hover input ~ .checkmark {
          background-color: rgba(255, 255, 255, 1);
        }
        
        .checkbox-primary input:checked ~ .checkmark {
          background-color: #4CAF50;
        }
        
        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }
        
        .checkbox-primary input:checked ~ .checkmark:after {
          display: block;
        }
        
        .checkbox-primary .checkmark:after {
          left: 7px;
          top: 3px;
          width: 6px;
          height: 12px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        
        .field-icon {
          cursor: pointer;
        }
        
        .form-control {
          background-color: rgba(255, 255, 255, 0.9);
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 14px 20px;
          font-size: 16px;
          font-weight: 400;
          width: 100%;
          box-sizing: border-box;
          transition: all 0.3s ease;
        }
        
        .btn-primary {
          background-color: #4CAF50;
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 14px;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s ease;
          width: 100%;
          box-sizing: border-box;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate__shakeX {
          animation: shake 0.5s ease;
        }
        
        @media (max-width: 767.98px) {
          .login-wrap {
            padding: 20px !important;
            margin: 0 15px;
          }
          
          .social a {
            margin: 5px !important;
          }
        }
      `}</style>
    </>
  );
}