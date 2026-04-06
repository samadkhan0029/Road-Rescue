import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, MapPin, Phone, Mail, Lock, Building, Wrench, Clock, Star } from 'lucide-react';
import { apiUrl } from './config/api';

const GarageRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    garageName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    services: [],
    operatingHours: {
      monday: '9:00 AM - 6:00 PM',
      tuesday: '9:00 AM - 6:00 PM',
      wednesday: '9:00 AM - 6:00 PM',
      thursday: '9:00 AM - 6:00 PM',
      friday: '9:00 AM - 6:00 PM',
      saturday: '9:00 AM - 4:00 PM',
      sunday: 'Closed'
    },
    emergencyService: false,
    towingService: false
  });

  const availableServices = [
    'Engine Repair',
    'Brake Service',
    'Oil Change',
    'Tire Service',
    'Battery Service',
    'Transmission',
    'AC Service',
    'Electrical',
    'Diagnostics',
    'Body Work',
    'Painting',
    'Wheel Alignment'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'emergencyService' || name === 'towingService') {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      } else {
        // Handle service checkboxes
        setFormData(prev => ({
          ...prev,
          services: checked 
            ? [...prev.services, value]
            : prev.services.filter(service => service !== value)
        }));
      }
    } else if (name.includes('.')) {
      // Handle nested objects like operatingHours
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (formData.services.length === 0) {
      alert('Please select at least one service!');
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/auth/register-garage'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        alert('Garage registration successful! Welcome to Road Rescue.');
        navigate('/profile/provider');
      } else {
        alert(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative w-full max-w-4xl bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Register Your Garage</h1>
          <p className="text-slate-600">Join our network of trusted service providers</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Building className="inline w-4 h-4 mr-1" />
                Garage Name
              </label>
              <input
                type="text"
                name="garageName"
                value={formData.garageName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="Enter garage name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Shield className="inline w-4 h-4 mr-1" />
                Owner Name
              </label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="Enter owner name"
                required
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="garage@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Phone className="inline w-4 h-4 mr-1" />
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Lock className="inline w-4 h-4 mr-1" />
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Lock className="inline w-4 h-4 mr-1" />
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="Confirm password"
                required
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Street address"
              required
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="City"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="State"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">ZIP Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="12345"
                required
              />
            </div>
          </div>

          {/* Services */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              <Wrench className="inline w-4 h-4 mr-1" />
              Services Offered
            </label>
            <div className="grid md:grid-cols-3 gap-3">
              {availableServices.map((service) => (
                <label key={service} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="services"
                    value={service}
                    checked={formData.services.includes(service)}
                    onChange={handleChange}
                    className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                  />
                  <span className="text-sm text-slate-700">{service}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Special Services */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Special Services</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="emergencyService"
                  checked={formData.emergencyService}
                  onChange={handleChange}
                  className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                />
                <span className="text-sm text-slate-700">24/7 Emergency Service</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="towingService"
                  checked={formData.towingService}
                  onChange={handleChange}
                  className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                />
                <span className="text-sm text-slate-700">Towing Service</span>
              </label>
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              <Clock className="inline w-4 h-4 mr-1" />
              Operating Hours
            </label>
            <div className="grid md:grid-cols-2 gap-3">
              {Object.entries(formData.operatingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-slate-700 w-20 capitalize">
                    {day}:
                  </label>
                  <input
                    type="text"
                    name={`operatingHours.${day}`}
                    value={hours}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="9:00 AM - 6:00 PM"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200 shadow-lg"
            >
              <Shield className="inline w-5 h-5 mr-2" />
              Register Garage
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-6 py-4 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GarageRegister;
