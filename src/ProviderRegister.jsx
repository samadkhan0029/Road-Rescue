import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck, ArrowLeft, Loader2, Navigation } from 'lucide-react';
import { apiUrl } from './config/api';
import { useAuth } from './context/AuthContext';

const ProviderRegister = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    phone: '',
    serviceType: 'Towing',
    experience: '',
    companyDetails: '',
    address: '',
    city: '',
    state: '',
    email: '',
    password: ''
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentLocation) {
      alert('Please set your current GPS location to register as a provider.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.businessName,
          email: formData.email,
          phone: formData.phone.startsWith('+') ? formData.phone : '+91' + formData.phone,
          password: formData.password,
          role: 'provider',
          serviceType: formData.serviceType,
          currentLocation,
          providerInfo: {
            businessName: formData.businessName,
            providerType: 'provider',
            services: [formData.serviceType],
            experience: parseInt(formData.experience) || 0,
            companyDetails: formData.companyDetails,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            licenseNumber: 'PENDING', // Will be verified later
            rating: 0,
            totalJobs: 0
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        
        setLoading(false);
        alert("Provider Registration Successful!");
        navigate('/profile/provider'); 
      } else {
        setLoading(false);
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Provider registration error:', error);
      setLoading(false);
      alert('Server error during registration. Please try again.');
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported on this browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        alert('Unable to fetch current location.');
        setLocating(false);
      }
    );
  };
  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100 relative">
        
        {/* Back Button */}
        <Link to="/signup" className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Become a Partner</h2>
          <p className="text-gray-500 mt-2">Join our network and earn by helping others.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business / Provider Name</label>
            <input 
              type="text" 
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Joe's Towing Co." 
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="+1 (555) 000-0000" 
              required
            />
          </div>

          {/* Service Type & Experience */}
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select 
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Towing">Towing Service</option>
                  <option value="Battery Jump">Battery Jump Start</option>
                  <option value="Flat Tire">Flat Tire Change</option>
                  <option value="Fuel Delivery">Fuel Delivery</option>
                  <option value="Lockout Service">Lockout Service</option>
                  <option value="Accident Assistance">Accident Assistance</option>
                  <option value="Mechanic / Repair">Mechanic / Repair</option>
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Yrs)</label>
                <input 
                  type="number" 
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="5" 
                  required
                />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
            <button
              type="button"
              onClick={detectLocation}
              className="w-full p-3 border rounded-xl flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 transition"
            >
              {locating ? <Loader2 className="animate-spin w-4 h-4" /> : <Navigation className="w-4 h-4" />}
              {currentLocation
                ? `Location set (${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)})`
                : 'Use Current GPS Location'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workshop Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Street, area"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Mumbai"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Maharashtra"
                required
              />
            </div>
          </div>

          {/* Company Details (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Details <span className="text-gray-400 font-normal">(Optional)</span></label>
            <textarea 
              name="companyDetails"
              value={formData.companyDetails}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
              rows="2"
              placeholder="Tell us a bit about your fleet or services..."
            ></textarea>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="partner@example.com" 
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="••••••••" 
              required
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition shadow-lg mt-2 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : null}
            {loading ? 'Registering...' : 'Register as Provider'}
          </button>
        </form>

        {/* Trust Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span>Your license details will be verified.</span>
        </div>

        {/* Link back to User Register */}
        <div className="text-center mt-6">
          <p className="text-gray-500">Looking for help instead?</p>
          
        </div>
      </div>
    </div>
  );
};

export default ProviderRegister;