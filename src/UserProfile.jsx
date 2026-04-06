import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  User, Car, History, CreditCard, LogOut, 
  Shield, Plus, ChevronRight, Phone, Trash2, 
  MapPin, Calendar, Download, CheckCircle, XCircle, 
  Edit2, Save, Camera, Truck, AlertTriangle, Star, Wrench, Search, X, Navigation, Globe, Filter, Loader2, Crosshair, MessageCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import ChatHistorySection from './components/ChatHistorySection';
import { apiUrl } from './config/api';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const [activeTab, setActiveTab] = useState('overview'); 
  
  // --- SEARCH & FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchMode, setSearchMode] = useState('text'); 
  const [dbProviders, setDbProviders] = useState([]);
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const [userCoords, setUserCoords] = useState(null);

  // CENTRAL PROFILE STATE
  const [userProfile, setUserProfile] = useState({
    fullName: '',
    email: '',
    phone: '+91 98765 43210',
    location: 'Mumbai, India',
    photo: null 
  });

  // --- EXTENSIVE INDIA-WIDE DATABASE ---
  const staticProviders = useMemo(() => [
    // MAHARASHTRA
    { id: 1, name: "HIRA TOWINGS", address: "Chembur, Mumbai", city: "Mumbai", state: "Maharashtra", phone: "+91 98206 69607", services: ["Towing"], distance: "0.6 km", rating: 4.4, type: "local" },
    { id: 2, name: "GoMechanic Smart Workshop", address: "Kurla, Mumbai", city: "Mumbai", state: "Maharashtra", phone: "+91 83989 70970", services: ["Engine"], distance: "0.5 km", rating: 3.5, type: "local" },
    { id: 3, name: "Landmark RSA", address: "Santacruz, Mumbai", city: "Mumbai", state: "Maharashtra", phone: "+91 72062 90629", services: ["Battery"], distance: "6.2 km", rating: 4.9, type: "local" },
    { id: 11, name: "Pune Express Help", address: "Hinjewadi, Pune", city: "Pune", state: "Maharashtra", phone: "+91 98220 11223", services: ["Highway Help"], distance: "150 km", rating: 4.7, type: "web" },
    
    // DELHI NCR
    { id: 4, name: "Delhi Highway Rescue", address: "Mahipalpur, New Delhi", city: "New Delhi", state: "Delhi", phone: "+91 98111 22233", services: ["Towing"], distance: "1,400 km", rating: 4.7, type: "web" },
    { id: 5, name: "Gurgaon Rapid Fix", address: "Cyber City, Gurgaon", city: "Gurgaon", state: "Haryana", phone: "+91 98111 44455", services: ["Lockout"], distance: "1,420 km", rating: 4.5, type: "web" },
    
    // SOUTH INDIA
    { id: 7, name: "Bangalore Tech Auto", address: "Whitefield, Bangalore", city: "Bangalore", state: "Karnataka", phone: "+91 98440 11223", services: ["EV Charging"], distance: "980 km", rating: 4.8, type: "web" },
    { id: 10, name: "Chennai Coastal Rescue", address: "Marina Beach, Chennai", city: "Chennai", state: "Tamil Nadu", phone: "+91 98400 88990", services: ["Fuel"], distance: "1,300 km", rating: 4.5, type: "web" },

    // OTHERS
    { id: 12, name: "Goa Tourist Assistance", address: "Calangute, Goa", city: "Goa", state: "Goa", phone: "+91 98230 44556", services: ["Bike Repair"], distance: "580 km", rating: 4.9, type: "web" },
    { id: 13, name: "Howrah Bridge Towing", address: "Howrah, Kolkata", city: "Kolkata", state: "West Bengal", phone: "+91 98300 77889", services: ["Heavy Towing"], distance: "1,900 km", rating: 4.4, type: "web" },
  ], []);

  const allProviders = useMemo(() => {
    const seen = new Set();
    const merged = [...dbProviders, ...staticProviders];
    return merged.filter((provider) => {
      const key = `${(provider.name || '').toLowerCase()}-${(provider.city || '').toLowerCase()}-${(provider.phone || '')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dbProviders, staticProviders]);

  // Filter Options
  const states = useMemo(() => [...new Set(allProviders.map(p => p.state))].sort(), [allProviders]);
  const cities = useMemo(() => {
      if (!selectedState) return [];
      return [...new Set(allProviders.filter(p => p.state === selectedState).map(p => p.city))].sort();
  }, [selectedState, allProviders]);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const savedProfile = JSON.parse(localStorage.getItem('userProfileData'));
    if (savedProfile) {
      setUserProfile(savedProfile);
    } else {
      setUserProfile((prev) => ({
        ...prev,
        fullName: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || prev.phone,
      }));
    }
  }, [navigate]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('query', searchQuery.trim());
        if (selectedState) params.set('state', selectedState);
        if (selectedCity) params.set('city', selectedCity);
        params.set('limit', '80');
        // Send GPS coords when in "near me" mode so backend can use $near
        if (searchMode === 'near_me' && userCoords) {
          params.set('lat', userCoords.lat);
          params.set('lng', userCoords.lng);
        }
        const response = await fetch(apiUrl(`/api/providers/search?${params.toString()}`));
        const data = await response.json();
        if (data?.success && Array.isArray(data.providers)) {
          setDbProviders(data.providers);
        }
      } catch {
        // Keep static providers as fallback
      }
    };

    fetchProviders();
  }, [searchQuery, selectedState, selectedCity, searchMode, userCoords]);

  const updateProfile = (newProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('userProfileData', JSON.stringify(newProfile));
    localStorage.setItem('currentUserName', newProfile.fullName);
  };

  const handleLogout = () => {
    // Clear rescue history cache when logging out
    localStorage.removeItem('rescueHistory');
    localStorage.removeItem('rescueHistoryTime');
    navigate('/');
  };

  // --- SEARCH LOGIC ---
  useEffect(() => {
    if (searchMode === 'near_me') {
        setIsSearching(true);
        // When GPS mode is active, use data from the backend (already fetched with $near)
        const nearby = allProviders.filter(p => {
            const dist = p._distanceNum ?? (p.distance ? parseFloat(p.distance) : Infinity);
            return dist < 10.0 || p.type === 'local';
        }).sort((a, b) => {
            const da = a._distanceNum ?? (a.distance ? parseFloat(a.distance) : Infinity);
            const db = b._distanceNum ?? (b.distance ? parseFloat(b.distance) : Infinity);
            return da - db;
        });
        setSearchResults(nearby.length > 0 ? nearby : []);
        setIsLoading(false);
        return;
    }

    if (selectedCity || selectedState) {
        setIsSearching(true);
        let results = allProviders;
        if (selectedState) results = results.filter(p => p.state === selectedState);
        if (selectedCity) results = results.filter(p => p.city === selectedCity);
        if (searchQuery) {
            results = results.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.address.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setSearchResults(results);
        return;
    }

    if (searchQuery.length > 1) {
        setIsSearching(true);
        const filtered = allProviders.filter(p => 
            p.address.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.city.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered.sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, [searchQuery, selectedState, selectedCity, allProviders, searchMode]);

  // --- GEOLOCATION LOGIC ---
  const handleLocateNearMe = () => {
      if (!navigator.geolocation) {
          alert("Geolocation is not supported by your browser");
          return;
      }
      setSelectedState('');
      setSelectedCity('');
      setSearchQuery("Detecting Location...");
      setIsSearching(true);
      setIsLoading(true);
      setSearchMode('near_me');
      // Reset DB providers so old data doesn't show
      setDbProviders([]);

      navigator.geolocation.getCurrentPosition(
          async (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              setUserCoords({ lat, lng });
              setSearchQuery("Current Location (GPS)");

              // Fetch from backend with GPS coords — use $near query
              try {
                  const params = new URLSearchParams();
                  params.set('lat', String(lat));
                  params.set('lng', String(lng));
                  params.set('limit', '80');
                  const response = await fetch(apiUrl(`/api/providers/search?${params.toString()}`));
                  const data = await response.json();
                  if (data?.success && Array.isArray(data.providers)) {
                      setDbProviders(data.providers);
                  }
              } catch {
                  // Backend unreachable — fall back to static providers
              }
              // Loading is cleared by the searchMode=near_me useEffect
          },
          (error) => {
              setSearchQuery("Location Access Denied");
              setIsLoading(false);
              setIsSearching(false);
              setSearchResults([]);
          }
      );
  };

  const clearSearch = () => {
      setSearchQuery('');
      setSelectedState('');
      setSelectedCity('');
      setIsSearching(false);
      setShowFilters(false);
      setSearchMode('text');
  };

  return (
    <div className="min-h-screen bg-[#eff6ff] font-sans flex text-slate-900 selection:bg-blue-500 selection:text-white">
      
      {/* ================= SIDEBAR ================= */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-72 bg-[#0B1121] border-r border-slate-800 hidden md:flex flex-col p-6 sticky top-0 h-screen z-20 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/')}>
             <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                <Truck className="text-white w-6 h-6" />
             </div>
             <span className="font-bold text-2xl text-white tracking-tight">RoadRescue</span>
        </div>
        
        <nav className="space-y-2 flex-1">
            <SidebarItem icon={User} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <SidebarItem icon={Edit2} label="My Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            <SidebarItem icon={History} label="Rescue History" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
            <SidebarItem icon={MessageCircle} label="Chat Inbox" active={activeTab === 'chat-inbox'} onClick={() => setActiveTab('chat-inbox')} />
            <SidebarItem icon={Car} label="My Vehicles" active={activeTab === 'garage'} onClick={() => setActiveTab('garage')} />
            <SidebarItem icon={CreditCard} label="Payments" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl font-bold transition-all duration-200 group">
                <LogOut size={20} className="group-hover:text-red-400 transition-colors" /> Sign Out
            </button>
        </div>
      </motion.div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto bg-[#eff6ff] relative">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-4">
            <span className="font-bold text-xl text-[#0B1121] flex items-center gap-2">
                <Truck className="text-blue-600" size={20}/> RoadRescue
            </span>
            <button onClick={handleLogout}><LogOut className="text-slate-500" /></button>
        </div>

        <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
            {[
              { id: 'overview', label: 'Home' },
              { id: 'chat-inbox', label: 'Inbox' },
              { id: 'history', label: 'History' },
              { id: 'profile', label: 'Profile' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  activeTab === t.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
        </div>

        {/* --- HEADER --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
            <div>
                <h1 className="text-3xl font-extrabold text-[#0B1121] tracking-tight">
                    {activeTab === 'overview' && `Hello, ${userProfile.fullName.split(' ')[0]} 👋`}
                    {activeTab === 'profile' && 'Edit Profile'}
                    {activeTab === 'history' && 'Rescue History'}
                    {activeTab === 'chat-inbox' && 'Chat Inbox'}
                    {activeTab === 'garage' && 'My Garage'}
                    {activeTab === 'payments' && 'Payment Methods'}
                </h1>
                <p className="text-slate-500 mt-1 font-medium hidden md:block">
                    {activeTab === 'overview' && "Here's what's happening with your account."}
                    {activeTab === 'profile' && "Update your personal details."}
                    {activeTab === 'history' && "Track your past assistance requests."}
                    {activeTab === 'chat-inbox' && 'Past conversations with providers, grouped by each rescue request.'}
                    {activeTab === 'garage' && "Manage your registered vehicles."}
                    {activeTab === 'payments' && "Manage your saved cards."}
                </p>
            </div>

            {/* HEADER RIGHT SIDE: SEARCH & ICONS */}
            <div className="flex items-center gap-3 w-full lg:w-auto relative z-40">
                
                {/* --- SEARCH BAR & LOCATE BUTTON (ONLY ON OVERVIEW) --- */}
                {activeTab === 'overview' && (
                    <>
                        <div className="relative flex-1 lg:w-96">
                            <div className="relative flex items-center">
                                <Search className="absolute left-4 text-slate-400" size={20} />
                                <input 
                                    type="text" 
                                    placeholder={selectedCity ? `Searching ${selectedCity}...` : "Search city, state or provider..."} 
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setSearchMode('text');
                                    }}
                                    onFocus={() => { if(searchQuery || selectedState) setIsSearching(true) }}
                                    className="w-full pl-12 pr-24 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                />
                                
                                <div className="absolute right-2 flex items-center gap-1">
                                    {(searchQuery || selectedState) && (
                                        <button onClick={clearSearch} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400">
                                            <X size={16} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`p-2 rounded-xl transition-all ${showFilters || selectedState ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}
                                        title="Filter by State/City"
                                    >
                                        <Filter size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* FILTER DROPDOWN */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-5 z-50"
                                    >
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">State</label>
                                                <select 
                                                    value={selectedState}
                                                    onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); }}
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                                                >
                                                    <option value="">All India</option>
                                                    {states.map(state => <option key={state} value={state}>{state}</option>)}
                                                </select>
                                            </div>
                                            {selectedState && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">City</label>
                                                    <select 
                                                        value={selectedCity}
                                                        onChange={(e) => setSelectedCity(e.target.value)}
                                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                                                    >
                                                        <option value="">All Cities</option>
                                                        {cities.map(city => <option key={city} value={city}>{city}</option>)}
                                                    </select>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* SEARCH RESULTS */}
                            <AnimatePresence>
                                {isSearching && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full mt-3 right-0 w-full lg:w-[28rem] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-40"
                                    >
                                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                {searchMode === 'near_me' ? <Crosshair size={14} className="text-red-500" /> : <Globe size={14}/>}
                                                {searchMode === 'near_me' ? 'GPS Live Results' : selectedCity ? `Results in ${selectedCity}` : 'Network Results'}
                                            </span>
                                            
                                            <button 
                                                onClick={() => setIsSearching(false)} 
                                                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
                                                title="Close List"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                        
                                        {isLoading ? (
                                            <div className="p-10 flex flex-col items-center justify-center text-slate-400 gap-3">
                                                <Loader2 className="animate-spin text-blue-600" size={24} />
                                                <span className="text-sm font-medium">Acquiring satellites & data...</span>
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            <div className="max-h-96 overflow-y-auto">
                                                {searchResults.map((provider) => (
                                                    <div key={provider.id} className="p-5 hover:bg-blue-50/50 border-b border-slate-50 transition cursor-pointer group">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition">{provider.name}</h4>
                                                            <span className={`text-xs font-bold px-2 py-1 rounded ${provider.type === 'web' ? 'bg-purple-100 text-purple-700' : provider.type === 'garage' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {provider.type === 'garage' ? 'Garage' : provider.distance}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 font-medium">
                                                            <MapPin size={14} className="text-slate-400"/> {provider.address}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex gap-2">
                                                                {provider.services.slice(0,2).map(s => (
                                                                    <span key={s} className="text-[10px] font-bold bg-white text-slate-600 px-2 py-1 rounded border border-slate-200 shadow-sm">{s}</span>
                                                                ))}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <div className="flex items-center gap-1 text-xs font-bold text-yellow-600 px-2">
                                                                    <Star size={12} fill="currentColor" /> {provider.rating}
                                                                </div>
                                                                <button className="py-2 px-4 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 flex items-center gap-2 shadow-lg shadow-slate-900/10">
                                                                    <Phone size={14} /> Call
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <Search size={20} className="text-slate-400" />
                                                </div>
                                                <p className="text-slate-500 text-sm font-medium">No providers found.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* LOCATE BUTTON */}
                        <button 
                            onClick={handleLocateNearMe}
                            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 group"
                            title="Take My Live Location"
                        >
                            <Crosshair size={20} className="group-hover:animate-spin-slow" />
                        </button>
                    </>
                )}

                {/* PROFILE ICON (VISIBLE ON ALL TABS) */}
                <div className="w-12 h-12 bg-white rounded-full p-1 border border-blue-100 shadow-sm cursor-pointer hover:border-blue-300 transition" onClick={() => setActiveTab('profile')}>
                    <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                        <img 
                            src={userProfile.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.fullName}`} 
                            alt="User" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* --- CONTENT SWITCHER --- */}
        <div className="max-w-5xl mx-auto">
            {activeTab === 'overview' && <OverviewTab changeTab={setActiveTab} />}
            {activeTab === 'profile' && <ProfileTab profile={userProfile} onUpdate={updateProfile} />}
            {activeTab === 'history' && <HistoryTab />}
            {activeTab === 'chat-inbox'
              ? authUser?._id && authToken ? (
                  <ChatHistorySection
                    userId={authUser._id}
                    authToken={authToken}
                    emptyHint="After a provider accepts your rescue request, your messages appear here."
                  />
                ) : (
                  <p className="text-slate-600">Sign in again to load your chat history.</p>
                )
              : null}
            {activeTab === 'garage' && <GarageTab />}
            {activeTab === 'payments' && <PaymentsTab />}
        </div>

      </div>
    </div>
  );
};

// ================= SUB-COMPONENTS =================

// 1. OVERVIEW TAB
const OverviewTab = ({ changeTab }) => {
    const recentMechanics = [
        { id: 1, name: "HIRA TOWINGS", garage: "Chembur Crossing", rating: 4.4, date: "2 days ago", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hira" },
        { id: 2, name: "GoMechanic", garage: "Postal Colony Workshop", rating: 3.5, date: "1 month ago", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=GoMech" },
        { id: 3, name: "Landmark RSA", garage: "Santacruz East", rating: 4.9, date: "3 months ago", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Landmark" },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            
            {/* STATUS CARD */}
            <div className="bg-white rounded-3xl p-1.5 border border-blue-100 shadow-xl shadow-blue-500/10">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[1.3rem] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-3 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> SYSTEM ACTIVE
                            </div>
                            <h2 className="text-3xl font-bold mb-2">No Active Emergencies</h2>
                            <p className="text-blue-50 font-medium">You are currently safe. We are ready to help if needed.</p>
                        </div>
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                            <Shield size={32} className="text-white" />
                        </div>
                    </div>
                    <div className="mt-8 flex gap-3">
                        <Link to="/emergency" className="flex-1 bg-white text-red-600 py-3.5 rounded-xl font-bold text-center hover:bg-red-50 transition shadow-lg flex items-center justify-center gap-2">
                            <AlertTriangle size={18} /> Request Emergency Help
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => changeTab('garage')} className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Car size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">My Vehicles</h3>
                            <p className="text-slate-500 text-sm">Manage your garage</p>
                        </div>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-blue-500 rounded-full"></div></div>
                </div>

                <div onClick={() => changeTab('history')} className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/10 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <History size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">History</h3>
                            <p className="text-slate-500 text-sm">View past rescues</p>
                        </div>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden"><div className="w-1/3 h-full bg-purple-500 rounded-full"></div></div>
                </div>
            </div>

            {/* --- RECENT PROVIDERS LIST --- */}
            <div>
                <h3 className="text-xl font-bold text-[#0B1121] mb-5 px-1">Past Mechanics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {recentMechanics.map((mechanic) => (
                        <div key={mechanic.id} className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full bg-slate-100 p-0.5">
                                    <img src={mechanic.image} alt={mechanic.name} className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border border-slate-100 shadow-sm">
                                    <Wrench size={12} className="text-blue-600" fill="currentColor" />
                                </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 text-base truncate">{mechanic.name}</h4>
                                <p className="text-slate-500 text-xs truncate font-medium">
                                    {mechanic.garage ? mechanic.garage : "Independent Mechanic"}
                                </p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-xs font-bold text-yellow-700 border border-yellow-100">
                                        <Star size={10} fill="currentColor" /> {mechanic.rating}
                                    </div>
                                    <span className="text-xs text-slate-400">{mechanic.date}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </motion.div>
    );
};

// ... (Rest of tabs: ProfileTab, GarageTab, HistoryTab, PaymentsTab, SidebarItem - NO CHANGES NEEDED)
const ProfileTab = ({ profile, onUpdate }) => { const [isEditing, setIsEditing] = useState(false); const [localProfile, setLocalProfile] = useState(profile); useEffect(() => { setLocalProfile(profile); }, [profile]); const handleSave = () => { setIsEditing(false); onUpdate(localProfile); }; const handlePhotoUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { const newProfile = { ...localProfile, photo: reader.result }; setLocalProfile(newProfile); onUpdate(newProfile); }; reader.readAsDataURL(file); } }; return ( <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6"> <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm"> <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-10 gap-6"> <div className="flex flex-col md:flex-row gap-6 items-center"> <div className="relative group"> <div className="w-32 h-32 rounded-full p-1 border-2 border-slate-100 shadow-lg bg-white"> <img src={localProfile.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${localProfile.fullName}`} className="w-full h-full rounded-full object-cover bg-slate-50" alt="Profile" /> </div> {isEditing && ( <label className="absolute bottom-1 right-1 p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-lg cursor-pointer border-4 border-white"> <Camera size={18} /> <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} /> </label> )} </div> <div className="text-center md:text-left"> <h2 className="text-3xl font-bold text-slate-900">{localProfile.fullName}</h2> <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 mt-1"> <Shield size={16} className="text-blue-500"/> Verified Member </p> </div> </div> {!isEditing ? ( <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"> <Edit2 size={18} /> Edit Profile </button> ) : ( <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"> <Save size={18} /> Save Changes </button> )} </div> <div className="grid md:grid-cols-2 gap-x-8 gap-y-6"> {['fullName', 'email', 'phone', 'location'].map((field) => ( <div key={field} className="space-y-2"> <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1"> {field.replace(/([A-Z])/g, ' $1').trim()} </label> <input disabled={!isEditing} value={localProfile[field]} onChange={(e) => setLocalProfile({...localProfile, [field]: e.target.value})} className={`w-full p-4 rounded-xl border ${isEditing ? 'bg-white border-blue-500 ring-4 ring-blue-500/10' : 'bg-slate-50 border-slate-200 text-slate-600'} transition-all font-semibold focus:outline-none`} /> </div> ))} </div> </div> </motion.div> ); };
const GarageTab = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  // Fetch vehicles from the API on mount
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!authToken) {
        // Fallback to localStorage only
        const storedVehicles = JSON.parse(localStorage.getItem('myVehicles') || '[]');
        setVehicles(storedVehicles);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(apiUrl('/api/vehicles'), {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data?.success && Array.isArray(data.vehicles)) {
          setVehicles(data.vehicles.map((v) => ({
            _id: v._id,
            id: v._id,
            make: v.make,
            model: v.model,
            year: v.year,
            color: v.color,
            plate: v.licensePlate,
            fuelType: v.fuelType,
            type: v.vehicleType || 'car',
            image: v.image,
            status: v.status || 'Active',
          })));
          // Sync to localStorage for offline
          localStorage.setItem('myVehicles', JSON.stringify(data.vehicles));
        } else {
          // API returned empty or failed — fall back to localStorage
          const storedVehicles = JSON.parse(localStorage.getItem('myVehicles') || '[]');
          setVehicles(storedVehicles);
        }
      } catch {
        // Network error — fall back to localStorage
        const storedVehicles = JSON.parse(localStorage.getItem('myVehicles') || '[]');
        setVehicles(storedVehicles);
      }
      setLoading(false);
    };
    fetchVehicles();
  }, [authToken]);

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm("Remove this vehicle from your garage?")) return;

    setVehicles((prev) => prev.filter((v) => (v._id || v.id) !== id));

    if (authToken) {
      try {
        await fetch(apiUrl(`/api/vehicles/${id}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch {
        console.error('Failed to delete vehicle from server');
      }
    }

    // Also remove from localStorage
    const storedVehicles = JSON.parse(localStorage.getItem('myVehicles') || '[]');
    const filtered = storedVehicles.filter((v) => (v._id || v.id) !== id);
    localStorage.setItem('myVehicles', JSON.stringify(filtered));
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="ml-3 text-slate-500 font-medium">Loading your garage...</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      {vehicles.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Car size={36} className="text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Your Garage is Empty</h3>
          <p className="text-slate-500 mb-6">Add your first vehicle to get started with RoadRescue.</p>
          <Link to="/add-vehicle">
            <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg flex items-center gap-2 mx-auto">
              <Plus size={20} /> Add Your First Vehicle
            </button>
          </Link>
        </div>
      ) : (
        <AnimatePresence>
          {vehicles.map((car) => (
            <motion.div
              key={car._id || car.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="group bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-bl-full -mr-10 -mt-10 transition-colors group-hover:bg-blue-50/50"></div>
              <button
                onClick={() => handleDeleteVehicle(car._id || car.id)}
                className="absolute top-6 right-6 z-20 p-2.5 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={18} />
              </button>
              <div className="flex gap-6 relative z-10 items-center">
                <div className="w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 group-hover:border-blue-200 transition-colors">
                  {car.image ? (
                    <img src={car.image} className="w-full h-full object-cover" alt={`${car.make} ${car.model}`} />
                  ) : (
                    <span className="text-4xl">{car.type === 'bike' ? '🏍️' : car.type === 'truck' ? '🚛' : '🚗'}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-1">{car.make} {car.model}</h4>
                  <p className="text-slate-500 font-medium mb-3">{car.color} • {car.year}{car.fuelType ? ` • ${car.fuelType}` : ''}</p>
                  <div className="flex gap-2">
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
                      {car.status || 'Active'}
                    </span>
                    {car.plate && (
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 uppercase tracking-wide">
                        {car.plate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
      <Link to="/add-vehicle" className="block mt-8">
        <button className="w-full py-5 border-2 border-dashed border-slate-300 rounded-3xl text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all font-bold flex items-center justify-center gap-2">
          <Plus size={24} />
          <span className="text-lg">Add New Vehicle</span>
        </button>
      </Link>
    </motion.div>
  );
};
const HistoryTab = () => { 
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(0);
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  const fetchHistory = useCallback(async (forceRefresh = false) => {
      if (!authToken) {
        setError('Please log in to view your history');
        setLoading(false);
        // Clear cache when no token
        localStorage.removeItem('rescueHistory');
        localStorage.removeItem('rescueHistoryTime');
        return;
      }

      // Try to load from localStorage first (unless force refresh)
      if (!forceRefresh) {
        const cachedHistory = localStorage.getItem('rescueHistory');
        const cachedTime = localStorage.getItem('rescueHistoryTime');
        const now = Date.now();
        
        // Use cache if it's less than 5 minutes old
        if (cachedHistory && cachedTime && (now - parseInt(cachedTime)) < 300000) {
          try {
            const parsedHistory = JSON.parse(cachedHistory);
            setHistory(parsedHistory);
            setLoading(false);
            console.log('[RescueHistory] Loaded from cache:', parsedHistory.length, 'items');
            return;
          } catch {
            // Invalid cache, continue with API fetch
          }
        }
      }

      try {
        const url = apiUrl('/api/users/rescue-history');
        console.log('[RescueHistory] Fetching from:', url);
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('[RescueHistory] Response status:', response.status);
        const data = await response.json();
        console.log('[RescueHistory] Response data:', data);

        if (data.success && Array.isArray(data.requests)) {
          setHistory(data.requests);
          console.log('[RescueHistory] Loaded history:', data.requests);
          // Cache the data in localStorage with timestamp
          localStorage.setItem('rescueHistory', JSON.stringify(data.requests));
          localStorage.setItem('rescueHistoryTime', Date.now().toString());
          setLastFetch(Date.now());
        } else {
          console.log('[RescueHistory] API Response:', data);
          setError(data.error || 'Failed to load history');
        }
      } catch (err) {
        console.error('[RescueHistory] Fetch error:', err);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    }, [authToken, lastFetch]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Add a refresh button function
  const handleRefresh = () => {
    console.log('[RescueHistory] Manual refresh triggered');
    setLoading(true);
    fetchHistory(true); // Force refresh
  };

  const getStatusIcon = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
        return <CheckCircle size={24} className="text-emerald-600" />;
      case 'cancelled':
        return <XCircle size={24} className="text-red-600" />;
      default:
        return <AlertTriangle size={24} className="text-slate-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-600';
      case 'cancelled':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const formatDate = (item) => {
    const d = item.completedAt || item.cancelledAt || item.updatedAt || item.createdAt;
    if (!d) return 'Unknown date';
    return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCost = (item) => {
    if (item.fare?.totalFare != null) return `₹${item.fare.totalFare}`;
    return '—';
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
          <p className="text-slate-500 font-medium">Loading your rescue history...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto">
          <XCircle className="text-red-600 mx-auto mb-3" size={32} />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-900">Rescue History</h3>
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Calendar size={16} />
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <History size={32} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Rescue History</h3>
          <p className="text-slate-500">You haven't made any rescue requests yet. Stay safe!</p>
        </div>
      ) : (
        history.map((item) => (
          <div key={item._id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-5 items-center flex-1 min-w-0">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${getStatusColor(item.status)}`}>
                {getStatusIcon(item.status)}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-lg truncate">{item.serviceType || 'Rescue'}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={16} className="text-blue-400"/>
                    {formatDate(item)}
                  </span>
                  {item.assignedProvider?.providerName && (
                    <span className="flex items-center gap-1.5">
                      <User size={16} className="text-blue-400"/>
                      {item.assignedProvider.providerName}
                    </span>
                  )}
                  {item.location?.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-blue-400"/>
                      {item.location.address}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="block text-xl font-extrabold text-slate-900">{formatCost(item)}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded mt-2 inline-block ${getStatusColor(item.status)}`}>
                {(item.status || 'UNKNOWN').toUpperCase()}
              </span>
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
};
const PaymentsTab = () => { const [cards, setCards] = useState([]); useEffect(() => { const storedCards = JSON.parse(localStorage.getItem('myCards') || '[]'); setCards(storedCards); }, []); const handleDeleteCard = (id) => { if (window.confirm("Remove this card?")) { const newCards = cards.filter(c => c.id !== id); setCards(newCards); localStorage.setItem('myCards', JSON.stringify(newCards)); } }; return ( <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8"> <div className="grid md:grid-cols-2 gap-8"> {cards.map((card) => ( <div key={card.id} className="group bg-[#0B1121] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden h-64 flex flex-col justify-between border border-slate-800"> <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div> <button onClick={() => handleDeleteCard(card.id)} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm"> <Trash2 size={18} /> </button> <div className="flex justify-between items-start relative z-10"> <CreditCard size={36} className="text-blue-400" /> <span className="font-mono text-lg tracking-wider italic opacity-50">{card.type}</span> </div> <div className="relative z-10"> <p className="font-mono text-2xl tracking-widest mb-6">•••• •••• •••• {card.last4}</p> <div className="flex justify-between items-end"> <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Card Holder</p><p className="font-medium tracking-wide">{card.holder}</p></div> <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Expires</p><p className="font-medium">{card.expiry}</p></div> </div> </div> </div> ))} <Link to="/add-payment" className="border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 hover:bg-blue-50/50 hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer h-64 group"> <div className="w-16 h-16 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:border-blue-200"> <Plus size={32} /> </div> <span className="font-bold text-lg">Add Payment Method</span> </Link> </div> </motion.div> ); };
const SidebarItem = ({ icon: Icon, label, active, onClick }) => ( <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${ active ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white' }`} > <Icon size={20} /> {label} </button> );

export default UserProfile;