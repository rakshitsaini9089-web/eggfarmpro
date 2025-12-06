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
      </Head>
      
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat js-fullheight"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1597848212624-a19eb35e2651?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80')",
          fontFamily: "'Lato', Arial, sans-serif"
        }}
      >
        <section className="ftco-section w-full">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-6 text-center mb-5">
                <h2 className="heading-section text-white font-weight-bold" style={{ fontSize: '2rem' }}>Login #10</h2>
              </div>
            </div>
            <div className="row justify-content-center">
              <div className="col-md-6 col-lg-4">
                <div className="login-wrap p-4 p-md-5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderRadius: '10px' }}>
                  <div className="icon d-flex align-items-center justify-content-center" style={{ backgroundColor: '#4CAF50', width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px' }}>
                    <span className="fa fa-user-o text-white" style={{ fontSize: '2rem' }}></span>
                  </div>
                  <h3 className="text-center mb-4 text-white">Have an account?</h3>
                  
                  <form action="#" className="signin-form" onSubmit={handleSubmit}>
                    {error && (
                      <div className="rounded-lg bg-danger text-white px-3 py-2 mb-3 text-center" style={{ backgroundColor: 'rgba(220, 53, 69, 0.9)' }}>
                        {error}
                      </div>
                    )}
                    
                    <div className="form-group mb-3">
                      <input 
                        type="text" 
                        className="form-control rounded-left" 
                        placeholder="Username" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          borderColor: 'transparent',
                          borderRadius: '5px',
                          padding: '12px 15px',
                          fontSize: '16px',
                          fontWeight: 300
                        }}
                      />
                    </div>
                    
                    <div className="form-group mb-3 position-relative">
                      <input 
                        id="password-field" 
                        type={showPassword ? "text" : "password"} 
                        className="form-control rounded-left" 
                        placeholder="Password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          borderColor: 'transparent',
                          borderRadius: '5px',
                          padding: '12px 45px 12px 15px',
                          fontSize: '16px',
                          fontWeight: 300
                        }}
                      />
                      <span 
                        className={`fa fa-fw ${showPassword ? 'fa-eye-slash' : 'fa-eye'} field-icon toggle-password position-absolute`}
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ 
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
                        className="form-control btn btn-primary rounded submit px-3"
                        disabled={loading}
                        style={{ 
                          backgroundColor: '#4CAF50',
                          borderColor: 'transparent',
                          borderRadius: '5px',
                          padding: '12px',
                          fontSize: '16px',
                          fontWeight: 400,
                          transition: 'all 0.3s'
                        }}
                      >
                        {loading ? 'Signing in…' : 'Sign In'}
                      </button>
                    </div>
                    
                    <div className="form-group d-md-flex">
                      <div className="w-50 text-left">
                        <label className="checkbox-wrap checkbox-primary text-white" style={{ fontWeight: 300 }}>
                          Remember Me
                          <input type="checkbox" defaultChecked className="ml-2" style={{ transform: 'scale(1.2)' }} />
                          <span className="checkmark"></span>
                        </label>
                      </div>
                      <div className="w-50 text-md-right">
                        <a href="#" style={{ color: '#fff', fontWeight: 300 }}>Forgot Password</a>
                      </div>
                    </div>
                  </form>
                  
                  <p className="w-100 text-center text-white my-3">&mdash; Or Sign In With &mdash;</p>
                  <div className="social d-flex text-center">
                    <a href="#" className="px-2 py-2 mr-md-1 rounded" style={{ backgroundColor: '#3b5998', color: '#fff', flex: 1, marginRight: '5px' }}>
                      <span className="ion-logo-facebook mr-2"></span> Facebook
                    </a>
                    <a href="#" className="px-2 py-2 ml-md-1 rounded" style={{ backgroundColor: '#1DA1F2', color: '#fff', flex: 1, marginLeft: '5px' }}>
                      <span className="ion-logo-twitter mr-2"></span> Twitter
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
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
          
          @media (max-width: 767.98px) {
            .login-wrap {
              padding: 20px !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}