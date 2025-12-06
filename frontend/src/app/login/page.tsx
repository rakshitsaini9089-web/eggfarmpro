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
        <link href="https://fonts.googleapis.com/css?family=Lato:300,400,700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" />
        <link rel="stylesheet" href="https://unpkg.com/ionicons@4.5.10-0/dist/css/ionicons.min.css" />
      </Head>
      
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat js-fullheight"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1597848212624-a19eb35e2651?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80')",
          fontFamily: "'Lato', Arial, sans-serif",
          filter: "blur(5px)",
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
                <h2 className="heading-section text-white font-weight-bold" style={{ fontSize: '2rem' }}>Welcome to Egg Farm Pro</h2>
                <p className="text-white mt-2" style={{ fontSize: '1.1rem', fontWeight: 300 }}>Egg Farm Operation And Management System</p>
              </div>
            </div>
            <div className="row justify-content-center">
              <div className="col-md-6 col-lg-4">
                <div className="login-wrap p-0">
                  <h3 className="mb-4 text-center text-white">Have an account?</h3>
                  <form action="#" className="signin-form" onSubmit={handleSubmit}>
                    {error && (
                      <div className="rounded-lg bg-danger text-white px-4 py-3 text-sm text-white mb-4" style={{ backgroundColor: 'rgba(220, 53, 69, 0.8)' }}>
                        {error}
                      </div>
                    )}
                    
                    <div className="form-group">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Username" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <input 
                        id="password-field" 
                        type={showPassword ? "text" : "password"} 
                        className="form-control" 
                        placeholder="Password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <span 
                        className={`fa fa-fw ${showPassword ? 'fa-eye-slash' : 'fa-eye'} field-icon toggle-password`}
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ 
                          position: 'absolute',
                          right: '15px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          cursor: 'pointer',
                          color: '#777'
                        }}
                      ></span>
                    </div>
                    
                    <div className="form-group">
                      <button 
                        type="submit" 
                        className="form-control btn btn-primary submit px-3"
                        disabled={loading}
                      >
                        {loading ? 'Signing in…' : 'Sign In'}
                      </button>
                    </div>
                    
                    <div className="form-group d-md-flex">
                      <div className="w-50">
                        <label className="checkbox-wrap checkbox-primary text-white">
                          Remember Me
                          <input type="checkbox" defaultChecked />
                          <span className="checkmark"></span>
                        </label>
                      </div>
                      <div className="w-50 text-md-right">
                        <a href="#" style={{ color: '#fff' }}>Forgot Password</a>
                      </div>
                    </div>
                  </form>
                  
                  <p className="w-100 text-center text-white mt-4 mb-4">— Or Sign In With —</p>
                  <div className="social d-flex text-center">
                    <a href="#" className="px-2 py-2 mr-md-1 rounded" style={{ backgroundColor: '#3b5998', color: '#fff', marginRight: '5px' }}>
                      <span className="ion-logo-facebook mr-2"></span> Facebook
                    </a>
                    <a href="#" className="px-2 py-2 ml-md-1 rounded" style={{ backgroundColor: '#1DA1F2', color: '#fff', marginLeft: '5px' }}>
                      <span className="ion-logo-twitter mr-2"></span> Twitter
                    </a>
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
          border-radius: 3px;
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
          border-radius: 5px;
          padding: 12px 15px;
          font-size: 16px;
          font-weight: 300;
          width: 100%;
          box-sizing: border-box;
        }
        
        .btn-primary {
          background-color: #4CAF50;
          border: 1px solid transparent;
          border-radius: 5px;
          padding: 12px;
          font-size: 16px;
          font-weight: 400;
          transition: all 0.3s;
          width: 100%;
          box-sizing: border-box;
        }
        
        @media (max-width: 767.98px) {
          .login-wrap {
            padding: 20px !important;
          }
        }
      `}</style>
    </>
  );
}