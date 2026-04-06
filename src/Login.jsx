import React, { useState } from 'react';
import { Mail, Lock, Eye, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from './config/api';
import { useAuth } from './context/AuthContext';

const Login = () => {
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Load saved email if remember me was checked
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Input validation
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Store token
        localStorage.setItem('authToken', data.token);
        
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        // Set user in context
        setUser(data.user);
        
        console.log('Login successful:', data.user);
        
        setLoading(false);
        
        // Routing Logic based on user role
        if (data.user.role === 'provider' || data.user.role === 'garage') {
          navigate('/profile/provider');
        } else {
          navigate('/profile/user');
        }
      } else {
        setLoading(false);
        setError(data.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      setError('Server error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans flex items-center justify-center p-4">
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative">
        
        {/* Back Button */}
        <Link to="/" className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>

        {/* Header */}
        <div className="text-center mb-8 mt-4">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500">Enter your credentials to access your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={20} strokeWidth={1.5} />
                <input 
                    type="email"
                    name="email"
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      error && !validateEmail(formData.email) ? 'border-red-300' : 'border-slate-200'
                    }`}
                    placeholder="you@example.com" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                />
              </div>
              {error && !validateEmail(formData.email) && (
                <p className="mt-1 text-xs text-red-500">Please enter a valid email address</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={20} strokeWidth={1.5} />
                <input 
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      error && formData.password.length < 6 ? 'border-red-300' : 'border-slate-200'
                    }`}
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={handleChange}
                    required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                    <Eye size={20} strokeWidth={1.5} />
                </button>
              </div>
              {error && formData.password.length > 0 && formData.password.length < 6 && (
                <p className="mt-1 text-xs text-red-500">Password must be at least 6 characters long</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-slate-600">
                Remember me
              </label>
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
            </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-slate-600 text-sm">
                Don't have an account? <Link to="/signup" className="text-blue-600 font-semibold hover:underline">Sign up now</Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;