import React, { useState, useCallback } from 'react';
import { ArrowLeft, Camera, Car, Check, Loader2, Truck, Bike } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from './config/api';

const AddVehicle = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [vehicleType, setVehicleType] = useState('car');
  const [fuelType, setFuelType] = useState('Petrol');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    plate: '',
    color: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const authToken = localStorage.getItem('authToken');

    try {
      const response = await fetch(apiUrl('/api/vehicles'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          make: formData.make,
          model: formData.model,
          year: formData.year,
          licensePlate: formData.plate,
          color: formData.color,
          fuelType,
          vehicleType,
          image: imagePreview || ''
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to add vehicle');
        setLoading(false);
        return;
      }

      // Also save to localStorage for offline / fallback
      const existingVehicles = JSON.parse(localStorage.getItem('myVehicles') || '[]');
      const stored = {
        _id: data.vehicle?._id || 'vehicle_' + Date.now(),
        make: formData.make,
        model: formData.model,
        year: formData.year,
        color: formData.color,
        plate: formData.plate,
        fuelType,
        type: vehicleType,
        image: imagePreview,
        status: 'Active'
      };
      localStorage.setItem('myVehicles', JSON.stringify([stored, ...existingVehicles]));

      setSuccess(true);
      setTimeout(() => {
        setLoading(false);
        navigate('/profile/user');
      }, 800);
    } catch (err) {
      console.error('Add vehicle error:', err);
      setError('Server error. Please try again.');
      setLoading(false);
    }
  }, [formData, fuelType, vehicleType, imagePreview, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <Link to="/profile/user" className="p-2 hover:bg-slate-100 rounded-full transition">
            <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Add New Vehicle</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-emerald-700 text-sm font-medium">Vehicle added successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">Vehicle Photo</label>
                <div className="relative group">
                    <div className={`w-full h-64 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-white overflow-hidden transition-all ${imagePreview ? 'border-blue-500' : 'hover:border-blue-400 hover:bg-blue-50/50'}`}>
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-6">
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Camera size={32} />
                                </div>
                                <p className="text-slate-600 font-medium">Tap to upload photo</p>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Vehicle Type</label>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { id: 'car', icon: Car, label: 'Car' },
                        { id: 'bike', icon: Bike, label: 'Bike' },
                        { id: 'truck', icon: Truck, label: 'Truck' }
                    ].map((type) => (
                        <button key={type.id} type="button" onClick={() => setVehicleType(type.id)} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${vehicleType === type.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                            <type.icon size={24} />
                            <span className="text-sm font-bold">{type.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Make</label>
                        <input 
                            name="make" 
                            value={formData.make} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-500" 
                            placeholder="Enter Make" 
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Model</label>
                        <input 
                            name="model" 
                            value={formData.model} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-500" 
                            placeholder="Enter Model" 
                            required 
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Year</label>
                        <input 
                            name="year" 
                            type="text" 
                            inputMode="numeric" 
                            maxLength="4" 
                            value={formData.year} 
                            onChange={(e) => {
                                // Only allow numbers
                                const val = e.target.value;
                                if (/^\d*$/.test(val)) handleChange(e);
                            }} 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-500" 
                            placeholder="YYYY" 
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Color</label>
                        <input 
                            name="color" 
                            value={formData.color} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-500" 
                            placeholder="Enter Color" 
                            required 
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">License Plate</label>
                    <input
                        name="plate"
                        value={formData.plate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-500 uppercase tracking-widest"
                        placeholder="MH 02 AB 1234"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Fuel Type</label>
                    <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-500"
                    >
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="LPG">LPG</option>
                    </select>
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                {loading ? <Loader2 className="animate-spin" /> : <><Check size={20} /> Save Vehicle</>}
            </button>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;