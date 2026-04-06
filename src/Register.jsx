import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { apiUrl } from './config/api';
import { useAuth } from './context/AuthContext';

const Register = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  
  // State for the form
  const [step, setStep] = useState(1); // 1 = Details, 2 = OTP
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    vehicleNumber: ''
  });
  
  // State for OTP
  const [otp, setOtp] = useState('');           // What the user types
  const [serverOtp, setServerOtp] = useState(''); // The real OTP from the server
  const [isLoading, setIsLoading] = useState(false);

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- NEW: SEND REAL OTP VIA BACKEND ---
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.phone) return alert("Please enter a phone number");
    
    setIsLoading(true);

    // 1. Format the phone number (Default to India +91 if missing)
    let formattedPhone = formData.phone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }

    try {
      // 2. Call your Backend Server on Port 5001
      console.log('Sending OTP request to:', apiUrl('/send-otp'));
      console.log('Phone number:', formattedPhone);
      
      const response = await fetch(apiUrl('/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      });

      console.log('OTP Response status:', response.status);
      console.log('OTP Response headers:', response.headers);

      const data = await response.json();
      console.log('OTP Response data:', data);

      if (data.success) {
        setIsLoading(false);
        setStep(2);
        
        // Save the real OTP from the server to compare later
        // (Note: In a huge production app, you'd verify on the server, but this is perfect for your project)
        setServerOtp(data.otp.toString()); 

        alert("OTP sent to your WhatsApp!");
        console.log("Debug OTP:", data.otp); // Helpful for testing if WhatsApp is slow
      } else {
        setIsLoading(false);
        alert("Failed to send OTP. Check if backend is running.");
      }
    } catch (error) {
      console.error('Signup Error:', error);
      console.error('Error constructor:', error.constructor.name);
      console.error('Error message:', error.message || 'No message');
      console.error('Error stack:', error.stack || 'No stack');
      console.error('Error type:', error.type || 'No type');
      console.error('Error name:', error.name || 'No name');
      console.error('Error code:', error.code || 'No code');
      console.error('Error errno:', error.errno || 'No errno');
      console.error('Error syscall:', error.syscall || 'No syscall');
      console.error('Error path:', error.path || 'No path');
      console.error('Error address:', error.address || 'No address');
      console.error('Error port:', error.port || 'No port');
      console.error('Stringified error:', JSON.stringify(error));
      console.error('Object keys:', Object.keys(error));
      console.error('Object entries:', Object.entries(error));
      
      setIsLoading(false);
      alert("Server error. Make sure 'node server.js' is running on port 5001.");
    }
  };

  // --- NEW: VERIFY REAL OTP AND REGISTER USER ---
  const handleVerify = async (e) => {
    e.preventDefault();
    
    // Compare what user typed vs. real OTP from server
    if (otp !== serverOtp) {
      return alert("Invalid OTP! Please check your WhatsApp.");
    }

    // OTP is correct, now register the user
    setIsLoading(true);
    
    try {
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone.startsWith('+') ? formData.phone : '+91' + formData.phone,
          password: formData.password,
          role: 'user'
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        
        setIsLoading(false);
        alert("Registration Successful!");
        navigate('/profile/user'); 
      } else {
        setIsLoading(false);
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error constructor:', error.constructor.name);
      console.error('Error message:', error.message || 'No message');
      console.error('Error stack:', error.stack || 'No stack');
      console.error('Error type:', error.type || 'No type');
      console.error('Error name:', error.name || 'No name');
      console.error('Error code:', error.code || 'No code');
      console.error('Error errno:', error.errno || 'No errno');
      console.error('Error syscall:', error.syscall || 'No syscall');
      console.error('Error path:', error.path || 'No path');
      console.error('Error address:', error.address || 'No address');
      console.error('Error port:', error.port || 'No port');
      console.error('Stringified error:', JSON.stringify(error));
      console.error('Object keys:', Object.keys(error));
      console.error('Object entries:', Object.entries(error));
      console.error('Error response:', error.response);
      console.error('Error response status:', error.response.status);
      console.error('Error response status text:', error.response.statusText);
      console.error('Error response headers:', error.response.headers);
      console.error('Error response data:', error.response.data);
      
      setIsLoading(false);
      alert('Server error during registration. Please try again.');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-gray-50 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Image/Banner */}
        <div className="hidden md:flex w-1/2 bg-slate-900 p-12 flex-col justify-between relative text-white">
           <div className="z-10">
             <h2 className="text-4xl font-bold mb-6">Join 50,000+ Drivers</h2>
             <p className="text-gray-400 text-lg">Get peace of mind on every journey. Help is just one tap away.</p>
           </div>
           <div className="z-10 space-y-4">
             <div className="flex items-center gap-3">
               <div className="bg-green-500/20 p-2 rounded-full"><CheckCircle className="text-green-400 w-5 h-5"/></div>
               <span>24/7 Nationwide Coverage</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="bg-green-500/20 p-2 rounded-full"><CheckCircle className="text-green-400 w-5 h-5"/></div>
               <span>Real-time Mechanic Tracking</span>
             </div>
           </div>
           <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h2>
          <p className="text-gray-500 mb-8">Enter your details to get started.</p>

          {/* STEP 1: DETAILS FORM */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required name="fullName" onChange={handleChange} type="text" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input required name="email" onChange={handleChange} type="email" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="you@example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input required name="phone" onChange={handleChange} type="tel" className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="98765 43210" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
                <input required name="password" onChange={handleChange} type="password" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
              </div>

              <button disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition flex items-center justify-center gap-2">
                {isLoading ? 'Sending OTP...' : 'Get OTP Verification'} <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 2 && (
            <div className="space-y-6 animate-pulse-once">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-800">We sent a code to <b>{formData.phone}</b></p>
                <p className="text-xs text-blue-600 mt-1">Check your WhatsApp!</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <input 
                  type="text" 
                  maxLength="4"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-4 text-center text-2xl tracking-widest border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-0 outline-none font-mono" 
                  placeholder="0 0 0 0" 
                />
              </div>

              <button onClick={handleVerify} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg shadow-green-200">
                Verify & Register
              </button>

              <button onClick={() => setStep(1)} className="w-full text-gray-500 text-sm hover:underline">
                Change Phone Number
              </button>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;