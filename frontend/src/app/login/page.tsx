'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80')" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div className="w-full sm:w-96">
            <div className="login-wrap p-0">
              <h3 className="mb-6 text-center text-white text-2xl font-medium">Have an account?</h3>
              <form action="#" className="signin-form" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-lg bg-red-500 bg-opacity-80 border border-red-600 px-4 py-3 text-sm text-white mb-4">
                    {error}
                  </div>
                )}
                
                <div className="form-group mb-4">
                  <input 
                    type="text" 
                    className="form-control w-full px-4 py-3 text-gray-700 bg-white bg-opacity-90 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    placeholder="Username" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="form-group mb-4 relative">
                  <input 
                    id="password-field" 
                    type={showPassword ? "text" : "password"} 
                    className="form-control w-full px-4 py-3 text-gray-700 bg-white bg-opacity-90 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12" 
                    placeholder="Password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span 
                    className={`fa fa-fw ${showPassword ? 'fa-eye-slash' : 'fa-eye'} field-icon toggle-password absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500`}
                    onClick={() => setShowPassword(!showPassword)}
                  ></span>
                </div>
                
                <div className="form-group mb-4">
                  <button 
                    type="submit" 
                    className="form-control btn btn-primary submit px-4 py-3 w-full bg-green-600 hover:bg-green-700 text-white rounded font-medium transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? 'Signing in…' : 'Sign In'}
                  </button>
                </div>
                
                <div className="form-group d-md-flex mb-4">
                  <div className="w-1/2 text-left">
                    <label className="checkbox-wrap checkbox-primary text-white">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="checkmark"></span>
                      Remember Me
                    </label>
                  </div>
                  <div className="w-1/2 text-md-right">
                    <a href="#" className="text-white hover:text-gray-200">Forgot Password</a>
                  </div>
                </div>
              </form>
              
              <p className="w-100 text-center text-white mb-4">— Or Sign In With —</p>
              <div className="social d-flex text-center">
                <a href="#" className="flex-1 px-3 py-2 mr-1 rounded text-white bg-blue-600 hover:bg-blue-700 transition duration-300">
                  <i className="ion-logo-facebook mr-2"></i> Facebook
                </a>
                <a href="#" className="flex-1 px-3 py-2 ml-1 rounded text-white bg-blue-400 hover:bg-blue-500 transition duration-300">
                  <i className="ion-logo-twitter mr-2"></i> Twitter
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Font Awesome and Ionicons CSS */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" 
        integrity="sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==" 
        crossOrigin="anonymous" 
        referrerPolicy="no-referrer" 
      />
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/ionicons@4.5.10-0/dist/css/ionicons.min.css" 
      />
    </div>
  );
}