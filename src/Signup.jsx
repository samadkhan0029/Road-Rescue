import React, { useState } from 'react';
import { User, Mail, Lock, Eye, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from './config/api';
import { useAuth } from './context/AuthContext';

const Signup = () => {
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // 1. Initialize Form Data State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer' // Default role
  });

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // Password must be at least 8 characters, contain at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  };

  // 2. Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError(''); // Clear error on input change
    if (success) setSuccess(''); // Clear success on input change
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Input validation
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Password must be at least 8 characters long and contain at least one letter and one number');
      setLoading(false);
      return;
    }

    // Password Confirmation Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      // SEND DATA TO BACKEND
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: `${countryCode} ${formData.phone}`,
          password: formData.password,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Account created successfully! Redirecting to login...');
        // Auto-login after successful registration
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        
        setTimeout(() => {
          // Redirect based on role
          if (data.user.role === 'provider') {
            navigate('/profile/provider');
          } else {
            navigate('/profile/user');
          }
        }, 1500);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error("Signup Error:", error);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans flex items-center justify-center p-4">
      
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 relative">
        
        {/* Back Button */}
        <Link to="/" className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>

        {/* Header */}
        <div className="text-center mb-8 mt-4">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h2>
            <p className="text-slate-500">Join thousands of drivers trusting RoadRescue</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-600 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'customer' })}
                  className={`py-2 px-4 rounded-xl font-medium transition-all ${
                    formData.role === 'customer'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  } border`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'provider' })}
                  className={`py-2 px-4 rounded-xl font-medium transition-all ${
                    formData.role === 'provider'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  } border`}
                >
                  Service Provider
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 text-slate-400" size={20} strokeWidth={1.5} />
                <input 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${
                      error && !formData.fullName.trim() ? 'border-red-300' : 'border-slate-200'
                    }`}
                    placeholder="John Doe" 
                    required 
                />
              </div>
              {error && !formData.fullName.trim() && (
                <p className="mt-1 text-xs text-red-500">Full name is required</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={20} strokeWidth={1.5} />
                <input 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${
                      error && !validateEmail(formData.email) ? 'border-red-300' : 'border-slate-200'
                    }`}
                    placeholder="you@example.com" 
                    required 
                />
              </div>
              {error && !validateEmail(formData.email) && formData.email && (
                <p className="mt-1 text-xs text-red-500">Please enter a valid email address</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
              <div className="relative flex">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="absolute left-0 top-0 bottom-0 w-[5.5rem] pl-3 pr-1 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer z-10"
                >
                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.dial_code}>
                      {country.flag} {country.dial_code}
                    </option>
                  ))}
                </select>

                <input 
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-[6rem] pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${
                      error && !formData.phone.trim() ? 'border-red-300' : 'border-slate-200'
                    }`}
                    placeholder="000 000 0000" 
                    required 
                />
              </div>
              {error && !formData.phone.trim() && (
                <p className="mt-1 text-xs text-red-500">Phone number is required</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={20} strokeWidth={1.5} />
                <input 
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${
                      error && formData.password && !validatePassword(formData.password) ? 'border-red-300' : 'border-slate-200'
                    }`}
                    placeholder="Min 8 characters, 1 letter & 1 number" 
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
              {error && formData.password && !validatePassword(formData.password) && (
                <p className="mt-1 text-xs text-red-500">Password must be at least 8 characters with 1 letter & 1 number</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={20} strokeWidth={1.5} />
                <input 
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${
                      error && formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-300' : 'border-slate-200'
                    }`}
                    placeholder="••••••••" 
                    required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                    <Eye size={20} strokeWidth={1.5} />
                </button>
              </div>
              {error && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
                By creating an account, you agree to our <a href="#" className="text-teal-600 hover:underline">Terms of Service</a> and <a href="#" className="text-teal-600 hover:underline">Privacy Policy</a>.
            </p>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
            </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-slate-600 text-sm mb-8">
                Already have an account? <Link to="/login" className="text-teal-600 font-semibold hover:underline">Sign in</Link>
            </p>
            
            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Quick register as</span></div>
            </div>

            <Link to="/provider-register" className="block w-full mb-3">
              <button className="w-full py-3.5 border-2 border-slate-900 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors">
               Register as Provider
               </button>
            </Link>
            <Link to="/garage-register" className="block w-full">
              <button className="w-full py-3.5 border-2 border-indigo-600 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors">
               Register a Garage
              </button>
            </Link>
        </div>
      </div>
    </div>
  );
};

// Full list of country codes
const countryCodes = [
  { name: "United States", dial_code: "+1", code: "US", flag: "🇺🇸" },
  { name: "United Kingdom", dial_code: "+44", code: "GB", flag: "🇬🇧" },
  { name: "India", dial_code: "+91", code: "IN", flag: "🇮🇳" },
  { name: "Canada", dial_code: "+1", code: "CA", flag: "🇨🇦" },
  { name: "Australia", dial_code: "+61", code: "AU", flag: "🇦🇺" },
  { name: "Germany", dial_code: "+49", code: "DE", flag: "🇩🇪" },
  { name: "France", dial_code: "+33", code: "FR", flag: "🇫🇷" },
  { name: "Japan", dial_code: "+81", code: "JP", flag: "🇯🇵" },
  { name: "China", dial_code: "+86", code: "CN", flag: "🇨🇳" },
  { name: "Brazil", dial_code: "+55", code: "BR", flag: "🇧🇷" },
  { name: "Mexico", dial_code: "+52", code: "MX", flag: "🇲🇽" },
  { name: "Russia", dial_code: "+7", code: "RU", flag: "🇷🇺" },
  { name: "South Africa", dial_code: "+27", code: "ZA", flag: "🇿🇦" },
  { name: "South Korea", dial_code: "+82", code: "KR", flag: "🇰🇷" },
  { name: "Italy", dial_code: "+39", code: "IT", flag: "🇮🇹" },
  { name: "Spain", dial_code: "+34", code: "ES", flag: "🇪🇸" },
  { name: "Indonesia", dial_code: "+62", code: "ID", flag: "🇮🇩" },
  { name: "Turkey", dial_code: "+90", code: "TR", flag: "🇹🇷" },
  { name: "Netherlands", dial_code: "+31", code: "NL", flag: "🇳🇱" },
  { name: "Saudi Arabia", dial_code: "+966", code: "SA", flag: "🇸🇦" },
  { name: "Switzerland", dial_code: "+41", code: "CH", flag: "🇨🇭" },
  { name: "Sweden", dial_code: "+46", code: "SE", flag: "🇸🇪" },
  { name: "United Arab Emirates", dial_code: "+971", code: "AE", flag: "🇦🇪" },
  { name: "Argentina", dial_code: "+54", code: "AR", flag: "🇦🇷" },
  { name: "Poland", dial_code: "+48", code: "PL", flag: "🇵🇱" },
  { name: "Belgium", dial_code: "+32", code: "BE", flag: "🇧🇪" },
  { name: "Thailand", dial_code: "+66", code: "TH", flag: "🇹🇭" },
  { name: "Austria", dial_code: "+43", code: "AT", flag: "🇦🇹" },
  { name: "Norway", dial_code: "+47", code: "NO", flag: "🇳🇴" },
  { name: "Singapore", dial_code: "+65", code: "SG", flag: "🇸🇬" },
  { name: "Denmark", dial_code: "+45", code: "DK", flag: "🇩🇰" },
  { name: "Malaysia", dial_code: "+60", code: "MY", flag: "🇲🇾" },
  { name: "Ireland", dial_code: "+353", code: "IE", flag: "🇮🇪" },
  { name: "New Zealand", dial_code: "+64", code: "NZ", flag: "🇳🇿" },
  { name: "Portugal", dial_code: "+351", code: "PT", flag: "🇵🇹" },
  { name: "Greece", dial_code: "+30", code: "GR", flag: "🇬🇷" },
  { name: "Pakistan", dial_code: "+92", code: "PK", flag: "🇵🇰" },
  { name: "Egypt", dial_code: "+20", code: "EG", flag: "🇪🇬" },
  { name: "Vietnam", dial_code: "+84", code: "VN", flag: "🇻🇳" },
  { name: "Philippines", dial_code: "+63", code: "PH", flag: "🇵🇭" },
  { name: "Bangladesh", dial_code: "+880", code: "BD", flag: "🇧🇩" },
  { name: "Nigeria", dial_code: "+234", code: "NG", flag: "🇳🇬" },
  { name: "Kenya", dial_code: "+254", code: "KE", flag: "🇰🇪" },
  { name: "Israel", dial_code: "+972", code: "IL", flag: "🇮🇱" },
  { name: "Finland", dial_code: "+358", code: "FI", flag: "🇫🇮" },
  { name: "Ukraine", dial_code: "+380", code: "UA", flag: "🇺🇦" },
  { name: "Czech Republic", dial_code: "+420", code: "CZ", flag: "🇨🇿" },
  { name: "Hungary", dial_code: "+36", code: "HU", flag: "🇭🇺" },
  { name: "Romania", dial_code: "+40", code: "RO", flag: "🇷🇴" },
  { name: "Chile", dial_code: "+56", code: "CL", flag: "🇨🇱" },
  { name: "Colombia", dial_code: "+57", code: "CO", flag: "🇨🇴" },
];

export default Signup;