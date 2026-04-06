import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { 
  MapPin, 
  CheckCircle, 
  Shield, 
  MessageCircle, 
  Map as MapIcon, 
  AlertTriangle, 
  Wallet, 
  IndianRupee,
  User,
  LayoutDashboard,
  BriefcaseBusiness,
  History,
  UserCircle2,
  WalletCards,
  LogOut,
  Search,
  CircleDollarSign,
  CheckCheck,
  Star,
  Camera
} from 'lucide-react';
import { io } from 'socket.io-client';
import { apiUrl, socketUrl } from './config/api';
import { getAuthToken, getCurrentUser, calculateRouteData, getProviderLocation, getCustomerLocation, getServicePricing } from './utils/auth';
import ChatHistorySection from './components/ChatHistorySection';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Create red icon for customer location
const CustomerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const haversineDistanceMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // meters
  const toRad = (v) => (v * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lng2 - lng1);
  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const ProviderProfile = () => {
  const user = useMemo(() => getCurrentUser(), []);
  const authToken = useMemo(() => getAuthToken(), []);

  const [isOnline, setIsOnline] = useState(true);
  const [requests, setRequests] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [error, setError] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [providerCoords, setProviderCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fare calculation state
  const [routeData, setRouteData] = useState({ distance: "Calculation Pending", fare: "₹600 (Base)" });
  const [isCalculatingFare, setIsCalculatingFare] = useState(false);

  // Live tracking state
  const [currentLocation, setCurrentLocation] = useState(null);
  const [liveDistance, setLiveDistance] = useState(null);
  const [isAtDestination, setIsAtDestination] = useState(false);
  const [lastDistanceUpdate, setLastDistanceUpdate] = useState(0);

  const [activeTab, setActiveTab] = useState('overview'); // overview | requests | history | messages | profile | earnings
  const [searchTerm, setSearchTerm] = useState('');
  const [popupRequest, setPopupRequest] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  // Seed recentHistory from localStorage so it survives refresh
  const seedRecentHistory = useMemo(() => {
    try {
      const raw = localStorage.getItem('providerRecentHistory');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);
  const [recentHistory, setRecentHistory] = useState(seedRecentHistory);
  // ── Loading state for dashboard stats ─────────────────────────────────
  const [statsLoading, setStatsLoading] = useState(true);
  // ── Single source of truth for provider rating ─────────────────────────────
  // Seeded from localStorage for instant first-paint, then overwritten
  // by a fresh API call so both tabs always show the same number.
  const [providerStats, setProviderStats] = useState(() => ({
    averageRating: user?.providerInfo?.averageRating ?? null,
    totalReviews:  user?.providerInfo?.totalReviews  ?? 0,
  }));
  // ───────────────────────────────────────────────────────────────────
  const [profileImage, setProfileImage] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [editableFields, setEditableFields] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: '',
    vehicleType: '',
    vehicleNumber: '',
    experience: ''
  });

  const socketRef = useRef(null);
  const pollingRef = useRef(null);
  const gpsIntervalRef = useRef(null);
  const providerCoordsRef = useRef(null);
  const pendingCancelIdRef = useRef(null);
  const activeJobRef = useRef(null);
  const popupRequestRef = useRef(null);

  const providerId = user?._id;
  const providerName = user?.name || 'Provider';
  const providerInitials = (providerName || 'P')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Haversine formula to calculate distance between two coordinates
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // If distance is less than 50 meters, return 0.0 km
    return distance < 0.05 ? 0.0 : parseFloat(distance.toFixed(1));
  }, []);

  // Calculate live distance between provider and customer
  const calculateLiveDistance = useCallback(() => {
    if (!currentLocation || !activeJob) return;
    
    try {
      const customerLocation = getCustomerLocation(activeJob);
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        customerLocation.lat,
        customerLocation.lng
      );
      
      setLiveDistance(distance);
      setIsAtDestination(distance === 0.0);
      
      // Update routeData distance display with live distance
      setRouteData(prev => ({
        ...prev,
        distance: `${distance} km`
      }));
      
    } catch (error) {
      console.error('Error calculating live distance:', error);
    }
  }, [currentLocation, activeJob, calculateDistance]);

  // Start live location tracking — also broadcasts location to the active job's socket room
  // so the customer's map marker updates in real-time without waiting for a DB poll.
  const startLiveTracking = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setCurrentLocation(newLocation);
        setProviderCoords(newLocation);
        providerCoordsRef.current = newLocation;

        // ── Real-time broadcast ──────────────────────────────────────────
        // Emit provider coords into the active job's socket room so the
        // customer's map marker moves live (no 5s poll lag).
        const job = activeJobRef.current;
        if (job?._id && socketRef.current?.connected) {
          socketRef.current.emit('provider-location-update', {
            requestId: job._id,
            lat: newLocation.lat,
            lng: newLocation.lng,
          });
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setGpsError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return watchId;
  }, []);

  // Stop live location tracking
  const stopLiveTracking = useCallback((watchId) => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const authHeaders = useMemo(() => {
    if (!authToken) return { 'Content-Type': 'application/json' };
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };
  }, [authToken]);

  const fetchAvailable = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const coords = providerCoordsRef.current;
      if (!Number.isFinite(coords?.lat) || !Number.isFinite(coords?.lng)) {
        // Don't mark as hard error while GPS is being collected.
        setRequests([]);
        return;
      }

      const { lat, lng } = coords;
      const res = await fetch(
        apiUrl(`/api/requests/provider/available-nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`),
        { headers: authHeaders }
      );
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'Failed to load requests');
      const nextRequests = Array.isArray(data.requests) ? data.requests : [];
      setRequests(nextRequests);

      // Only show popup when a real socket event is received
      // Remove auto-popup logic to prevent modal from appearing on load
    } catch (e) {
      setError(e?.message || 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveJob = async () => {
    try {
      const res = await fetch(apiUrl('/api/requests/provider/active'), { headers: authHeaders });
      const data = await res.json();
      if (data?.success) {
        setActiveJob(data.request || null);
      }
    } catch {
      /* ignore */
    }
  };

  const updateGpsOnce = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGpsError('Geolocation not supported in this browser.');
        return resolve(false);
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            setGpsError(null);
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            // Persist coordinates for any server-side logic that depends on stored provider location,
            // but the polling UI primarily relies on the location-aware endpoint.
            try {
              await fetch(apiUrl('/api/auth/provider/location'), {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify({ lat, lng }),
              });
            } catch {
              /* ignore persistence failure; polling still uses lat/lng query params */
            }

            const nextCoords = { lat, lng };
            providerCoordsRef.current = nextCoords;
            setProviderCoords(nextCoords);
            resolve(true);
          } catch {
            resolve(false);
          }
        },
        () => {
          setGpsError('Please allow location access to receive nearby requests.');
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    });

  const accept = async (requestId) => {
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/requests/accept/${requestId}`), {
        method: 'PATCH',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'Failed to accept request');
      await fetchActiveJob();
      await fetchAvailable();
      setPopupRequest(null);
      
      // Calculate fare and distance after accepting job
      if (data?.request) {
        setJobFareFromDatabase(data.request);
      }
    } catch (e) {
      setError(e?.message || 'Failed to accept request');
    }
  };

  // Set fare data from database instead of calculating locally
  const setJobFareFromDatabase = (jobData) => {
    if (jobData.distance !== undefined && jobData.totalFare !== undefined) {
      // Use fare data from database
      setRouteData({
        distance: `${jobData.distance} km`,
        fare: `₹${jobData.totalFare}`,
        breakdown: {
          baseFee: `₹${jobData.baseFee}`,
          distanceCharge: `₹${jobData.distanceCharge}`,
          totalFare: `₹${jobData.totalFare}`,
          distanceKm: jobData.distance.toString(),
          ratePerKm: jobData.ratePerKm,
          serviceType: jobData.serviceType,
          color: getServicePricing(jobData.serviceType)?.color || 'blue',
          icon: getServicePricing(jobData.serviceType)?.icon || 'help-circle'
        }
      });
    } else {
      // Fallback to local calculation for backward compatibility
      calculateJobFare(jobData);
    }
  };

  const calculateJobFare = async (jobData) => {
    setIsCalculatingFare(true);
    try {
      // Get provider's current location
      const providerLocation = providerCoords || getProviderLocation();
      
      // Get customer location from job data
      const customerLocation = getCustomerLocation(jobData);
      
      // Get service type from job data
      const serviceType = jobData.serviceType || 'Towing Service';
      
      console.log('Calculating fare:', { providerLocation, customerLocation, serviceType });
      
      // Calculate route data with service-specific pricing
      const routeResult = await calculateRouteData(providerLocation, customerLocation, serviceType);
      setRouteData(routeResult);
      
    } catch (error) {
      console.error('Error calculating job fare:', error);
      setRouteData({ distance: "Calculation Pending", fare: "₹600 (Base)" });
    } finally {
      setIsCalculatingFare(false);
    }
  };

  const decline = async (requestId) => {
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/requests/ignore/${requestId}`), {
        method: 'PATCH',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'Failed to decline request');
      await fetchAvailable();
      setPopupRequest(null);
    } catch (e) {
      setError(e?.message || 'Failed to decline request');
    }
  };

  const cancelJob = async (requestId) => {
    if (!requestId) {
      console.error('[CancelJob] No requestId provided');
      return;
    }
    console.log('[CancelJob] Triggered for requestId:', requestId);

    // Show our own styled confirmation modal instead of window.confirm()
    // (native confirm's "Cancel" button was causing UX confusion)
    setShowCancelConfirm(true);
    // Store the pending requestId in a ref so the modal can use it
    pendingCancelIdRef.current = requestId;
  };

  const handleCODConfirmation = async () => {
    try {
      if (!activeJob?._id) return;
      
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(apiUrl('/api/payments/cod/confirm'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          requestId: activeJob._id,
          providerId: providerId
        })
      });

      const data = await response.json();
      console.log('COD confirmation response:', data);
      
      if (data.success) {
        // Show success message
        alert('Cash payment confirmed! ₹' + (activeJob.codAmount || 1000) + ' has been added to your earnings.');
        
        // Clear active job
        setActiveJob(null);
        activeJobRef.current = null;
        
        // Refresh data
        await fetchActiveJob();
        await fetchAvailable();
      } else {
        alert('Failed to confirm cash payment: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('COD confirmation error:', error);
      alert('Failed to confirm cash payment. Please try again.');
    }
  };

  const confirmCancelJob = async () => {
    const requestId = pendingCancelIdRef.current;
    setShowCancelConfirm(false);
    if (!requestId) return;

    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/requests/cancel/${requestId}`), {
        method: 'PATCH',
        headers: authHeaders,
      });
      const data = await res.json();
      console.log('[CancelJob] API response:', data);

      if (!data?.success) throw new Error(data?.error || data?.message || 'Failed to cancel job');

      setActiveJob(null);
      activeJobRef.current = null;
      await fetchAvailable();
      console.log('[CancelJob] Cancelled successfully');
    } catch (e) {
      console.error('[CancelJob] Error:', e);
      alert(`Cancel failed: ${e?.message || 'Unknown error'}`);
      setError(e?.message || 'Failed to cancel job');
    }
  };

  const completeJob = async (requestId) => {
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/requests/complete/${requestId}`), {
        method: 'PATCH',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'Failed to complete job');
      if (activeJob) {
        setRecentHistory((prev) => {
          const completedEntry = {
            id: activeJob._id || String(Date.now()),
            customerName: activeJob.customerName || 'Customer',
            serviceType: activeJob.serviceType || 'Emergency Service',
            locationName: activeJob.locationName || activeJob.location?.address || 'Unknown location',
            fareLabel: activeJob.fare?.totalFare ? `₹${activeJob.fare.totalFare}` : routeData?.fare || '₹—',
            rating: activeJob.providerRating || 4.8,
            completedAt: new Date().toISOString(),
          };
          const next = [completedEntry, ...prev].slice(0, 20);
          localStorage.setItem('providerRecentHistory', JSON.stringify(next));
          return next;
        });
      }
      await fetchActiveJob();
      await fetchAvailable();
    } catch (e) {
      setError(e?.message || 'Failed to complete job');
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'requests', label: 'Active Jobs', icon: BriefcaseBusiness },
    { id: 'history', label: 'Job History', icon: History },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'profile', label: 'My Profile', icon: UserCircle2 },
    { id: 'earnings', label: 'Earnings & Payments', icon: WalletCards },
  ];

  const filteredHistory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return recentHistory;
    return recentHistory.filter((item) =>
      [item.customerName, item.serviceType, item.locationName, item.fareLabel]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [recentHistory, searchTerm]);

  const totalEarnings = useMemo(() => {
    const sum = recentHistory.reduce((acc, job) => {
      const parsed = Number(String(job.fareLabel || '').replace(/[^\d.]/g, ''));
      return acc + (Number.isFinite(parsed) ? parsed : 0);
    }, 0);
    return sum ? `₹${sum.toFixed(0)}` : '₹0';
  }, [recentHistory]);

  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  // Handle profile image upload
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        // Here you can also upload to server if needed
        console.log('Profile image updated:', file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('profile-image-input').click();
  };

  // Handle Edit Profile button
  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setShowPasswordModal(true);
    setIsPasswordVerified(false);
    setPasswordInput('');
    // Initialize editable fields with current user values
    setEditableFields({
      name: user?.name || providerName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      serviceType: user?.serviceType || 'Towing & Recovery',
      vehicleType: user?.vehicleType || 'Heavy Duty Tow Truck',
      vehicleNumber: user?.vehicleNumber || 'MH-12-AB-1234',
      experience: user?.experience || '5+ Years'
    });
  };

  // Handle password verification
  const handlePasswordVerification = () => {
    // Simulate password verification (in real app, this would be an API call)
    if (passwordInput.length >= 6) {
      setIsPasswordVerified(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      console.log('Password verified, editing enabled');
    } else {
      alert('Invalid password. Please enter your account password (min 6 characters for demo).');
    }
  };

  // Handle field updates
  const handleFieldChange = (field, value) => {
    setEditableFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      // Update local user state immediately for real-time feedback
      const updatedUser = {
        ...user,
        name: editableFields.name,
        email: editableFields.email,
        phone: editableFields.phone,
        serviceType: editableFields.serviceType,
        vehicleType: editableFields.vehicleType,
        vehicleNumber: editableFields.vehicleNumber,
        experience: editableFields.experience
      };

      // Update localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      // Simulate API call (in production, this would be a real API call)
      console.log('Saving profile changes:', editableFields);
      
      // Show success message
      alert('Profile updated successfully! Changes are now saved.');
      
      // Close modals and reset state
      setIsEditingProfile(false);
      setIsPasswordVerified(false);
      
      // Force a re-render by updating the user reference
      window.location.reload(); // Simple way to refresh the display with new data
      
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setIsPasswordVerified(false);
    setShowPasswordModal(false);
    setPasswordInput('');
  };

  // Handle View Documents button
  const handleViewDocuments = () => {
    setShowDocuments(true);
    // Here you can show documents modal or navigate to documents page
    console.log('View Documents clicked');
    // For now, we'll show an alert with sample documents
    alert('Documents section will show: \n• Driver License\n• Vehicle Registration\n• Insurance Certificate\n• Service Certifications');
  };

  useEffect(() => {
    if (!providerId || !authToken) return undefined;

    const socket = io(socketUrl, { transports: ['websocket', 'polling'], auth: { token: authToken } });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register-provider', providerId);
      // Re-join the active job room on reconnect so location broadcasts keep working
      const job = activeJobRef.current;
      if (job?._id) {
        socket.emit('join-request', job._id);
      }
    });

    // When a new request popup arrives, refresh the available list
    socket.on('provider-request', (payload) => {
      if (payload && payload.requestId) {
        console.log('Real emergency request received:', payload);
        setPopupRequest(payload);
        fetchAvailable();
      }
    });

    // Customer cancelled the request while the popup was open
    socket.on('request-cancelled', (payload) => {
      if (payload.type === 'REQUEST_CANCELLED' && popupRequestRef.current?.requestId === payload.requestId) {
        setPopupRequest(null);
        fetchAvailable();
      }
    });

    // Customer cancelled the ongoing accepted job — clear provider's active job
    socket.on('request-update', (data) => {
      if (data.status === 'CUSTOMER_CANCELLED' && activeJobRef.current?._id === data.requestId) {
        setActiveJob(null);
        activeJobRef.current = null;
        fetchAvailable();
      }
    });

    // Handle new rating notification — update providerStats so both
    // Overview and My Profile immediately reflect the new score.
    socket.on('new_rating', (data) => {
      console.log('New rating received:', data);
      setProviderStats({
        averageRating: data.newAverage,
        totalReviews:  data.totalReviews,
      });
      const ratingStars = '⭐'.repeat(data.rating);
      const message = `You received a ${data.rating}-star rating from ${data.customerName}! ${ratingStars}`;
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-[200] animate-pulse';
      toast.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-2xl">${ratingStars}</span>
          <div>
            <div class="font-semibold">New Rating Received!</div>
            <div class="text-sm opacity-90">${message}</div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) document.body.removeChild(toast);
      }, 5000);
    });

    // Handle payment received notification — update earnings and history in real-time
    socket.on('payment_received', (data) => {
      console.log('Payment received:', data);
      
      // Add to recent history (this will automatically update totalEarnings)
      setRecentHistory(prev => {
        const newJob = {
          id: data.requestId,
          customerName: data.customerName || 'Customer',
          serviceType: data.serviceType || 'Emergency Service',
          locationName: 'Service Location',
          fareLabel: `₹${data.amount}`,
          rating: 0, // Will be updated when customer rates
          completedAt: new Date().toISOString()
        };
        const updated = [newJob, ...prev].slice(0, 20);
        localStorage.setItem('providerRecentHistory', JSON.stringify(updated));
        return updated;
      });
      
      // Show payment notification toast
      const message = `Payment of ₹${data.amount} received from ${data.customerName || 'customer'}!`;
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-6 py-4 rounded-lg shadow-lg z-[200] animate-pulse';
      toast.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-2xl">💰</span>
          <div>
            <div class="font-semibold">Payment Received!</div>
            <div class="text-sm opacity-90">${message}</div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) document.body.removeChild(toast);
      }, 5000);
    });

    // Handle COD confirmation request notification
    socket.on('cod_confirmation_requested', (data) => {
      console.log('COD confirmation requested:', data);
      
      // Show COD notification toast
      const message = `Customer has chosen Cash on Delivery for ₹${data.amount}. Please confirm once you receive the payment.`;
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-orange-600 text-white px-6 py-4 rounded-lg shadow-lg z-[200] animate-pulse';
      toast.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-2xl">💵</span>
          <div>
            <div class="font-semibold">Cash Payment Pending!</div>
            <div class="text-sm opacity-90">${message}</div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) document.body.removeChild(toast);
      }, 8000);
      
      // Update active job to show COD confirmation button
      setActiveJob(prev => {
        if (prev && prev._id === data.requestId) {
          return {
            ...prev,
            codConfirmationRequested: true,
            codAmount: data.amount,
            customerName: data.customerName
          };
        }
        return prev;
      });
    });

    return () => {
      socket.off('provider-request');
      socket.off('request-cancelled');
      socket.off('request-update');
      socket.off('new_rating');
      socket.off('payment_received');
      socket.off('cod_confirmation_requested');
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, authToken]);

  useEffect(() => {
    if (!authToken) return undefined;
    fetchActiveJob();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  useEffect(() => {
    activeJobRef.current = activeJob;
    // When we get an active job, join its socket room so the provider
    // can broadcast live location updates into that room.
    if (activeJob?._id && socketRef.current?.connected) {
      socketRef.current.emit('join-request', activeJob._id);
    }
  }, [activeJob]);

  useEffect(() => {
    popupRequestRef.current = popupRequest;
  }, [popupRequest]);

  // Calculate fare when active job changes
  useEffect(() => {
    if (activeJob) {
      setJobFareFromDatabase(activeJob);
    } else {
      // Reset fare data when no active job
      setRouteData({ distance: "Calculation Pending", fare: "₹600 (Base)" });
      // Reset live tracking state
      setCurrentLocation(null);
      setLiveDistance(null);
      setIsAtDestination(false);
    }
  }, [activeJob]);

  // Live distance tracking when active job and current location change
  useEffect(() => {
    if (!activeJob || !currentLocation) return;

    // Throttle distance calculation to every 5 seconds
    const now = Date.now();
    if (now - lastDistanceUpdate < 5000) return;

    calculateLiveDistance();
    setLastDistanceUpdate(now);
  }, [currentLocation, activeJob, calculateLiveDistance, lastDistanceUpdate]);

  // Start/stop live tracking based on active job
  useEffect(() => {
    let watchId = null;

    if (activeJob) {
      // Start live tracking when there's an active job
      watchId = startLiveTracking();
    } else {
      // Stop tracking and reset when no active job
      if (watchId) {
        stopLiveTracking(watchId);
      }
      setCurrentLocation(null);
      setLiveDistance(null);
      setIsAtDestination(false);
    }

    // Cleanup on unmount or when activeJob changes
    return () => {
      if (watchId) {
        stopLiveTracking(watchId);
      }
    };
  }, [activeJob, startLiveTracking, stopLiveTracking]);

  // Recalculate fare when provider location changes significantly
  useEffect(() => {
    if (activeJob && providerCoords) {
      // Only recalculate if we don't have fare data from database
      if (!activeJob.distance || !activeJob.totalFare) {
        calculateJobFare(activeJob);
      }
    }
  }, [providerCoords]);

  useEffect(() => {
    if (!authToken) return undefined;

    const start = async () => {
      if (!isOnline) return;
      await updateGpsOnce();
      await fetchAvailable();

      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(fetchAvailable, 6000);

      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
      gpsIntervalRef.current = setInterval(updateGpsOnce, 12000);
    };

    start();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
      pollingRef.current = null;
      gpsIntervalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, authToken]);

  // ── Fetch authoritative provider stats from backend on mount ──────────────
  useEffect(() => {
    if (!providerId || !authToken) {
      setStatsLoading(false);
      return;
    }
    const fetchProviderStats = async () => {
      try {
        const res = await fetch(
          apiUrl(`/api/providers/stats/${providerId}`),
          { headers: authHeaders }
        );
        const data = await res.json();
        if (data?.success && data.data) {
          setProviderStats({
            averageRating: data.data.averageRating ?? null,
            totalReviews:  data.data.totalReviews  ?? 0,
          });
          // Seed recentHistory from DB when we have fresh data
          setRecentHistory((prev) => {
            // Only overwrite if DB has data and in-memory state is still empty
            if (prev.length === 0 && Array.isArray(data.data.recentJobs) && data.data.recentJobs.length > 0) {
              localStorage.setItem('providerRecentHistory', JSON.stringify(data.data.recentJobs));
              return data.data.recentJobs;
            }
            return prev;
          });
        }
      } catch {
        /* keep showing localStorage seed */
      }
      setStatsLoading(false);
    };
    fetchProviderStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, authToken]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col">
          <div className="px-6 py-7 border-b border-slate-800">
            <h1 className="text-2xl font-bold">RoadRescue</h1>
            <p className="text-sm text-slate-400 mt-1">Provider dashboard</p>
          </div>

          <nav className="flex-1 px-4 py-5 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold transition"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-72">
          <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-8 py-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-3 hover:bg-slate-50 rounded-xl p-2 transition cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold group-hover:bg-blue-600 transition">
                    {providerInitials}
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">{providerName || 'Zahid Auto'}</h2>
                    <p className="text-xs text-slate-500">Provider ID: {providerId ? `#${String(providerId).slice(-6)}` : '—'}</p>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setIsOnline(!isOnline)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    aria-label={isOnline ? 'Go Offline' : 'Go Online'}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        isOnline ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-bold ${isOnline ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
                  </span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search past job history..."
                    className="w-72 max-w-[55vw] rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'overview' ? (
              <div className="space-y-6">
                <section className="rounded-xl shadow-sm bg-gradient-to-r from-blue-700 to-cyan-500 p-6 text-white">
                  <p className="text-xs uppercase tracking-wider text-blue-100 font-semibold">System Status</p>
                  <h3 className={`text-3xl font-bold mt-2 ${isOnline ? 'animate-pulse' : ''}`}>
                    {isOnline ? 'Waiting for requests...' : 'You are currently offline'}
                  </h3>
                  <p className="mt-2 text-sm text-blue-50">
                    {isOnline
                      ? 'You are visible to nearby customers.'
                      : 'Go online to receive requests.'}
                  </p>
                </section>

                <section className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <p className="text-sm text-slate-500">Total Earnings</p>
                    <div className="mt-2 flex items-center gap-2 text-slate-900">
                      <CircleDollarSign className="text-blue-600" size={18} />
                      <span className="text-2xl font-bold">
                        {statsLoading ? (
                          <span className="inline-block w-16 h-7 bg-slate-200 rounded animate-pulse" />
                        ) : (
                          totalEarnings
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <p className="text-sm text-slate-500">Jobs Completed</p>
                    <div className="mt-2 flex items-center gap-2 text-slate-900">
                      <CheckCheck className="text-blue-600" size={18} />
                      <span className="text-2xl font-bold">
                        {statsLoading ? (
                          <span className="inline-block w-8 h-7 bg-slate-200 rounded animate-pulse" />
                        ) : (
                          recentHistory.length
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <p className="text-sm text-slate-500">Average Rating</p>
                    <div className="mt-2 flex items-center gap-2 text-slate-900">
                      <Star className="text-yellow-500" size={18} fill="currentColor" />
                      <span className="text-2xl font-bold">
                        {statsLoading ? (
                          <span className="inline-block w-12 h-7 bg-slate-200 rounded animate-pulse" />
                        ) : providerStats.averageRating != null
                          ? providerStats.averageRating.toFixed(1)
                          : providerStats.totalReviews === 0
                            ? 'New'
                            : '—'}
                      </span>
                    </div>
                    {providerStats.totalReviews > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        {providerStats.totalReviews} review{providerStats.totalReviews > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </section>

                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">Recent History</h4>
                  <div className="space-y-3">
                    {filteredHistory.slice(0, 3).length ? (
                      filteredHistory.slice(0, 3).map((job) => (
                        <div key={job.id} className="rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{job.serviceType}</p>
                            <p className="text-sm text-slate-500">{job.locationName}</p>
                          </div>
                          <p className="font-bold text-slate-900">{job.fareLabel}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm">No completed jobs yet.</p>
                    )}
                  </div>
                </section>
              </div>
            ) : null}

            {activeTab === 'requests' ? (
              isOnline ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Incoming Requests</h3>
                    <p className="text-sm text-slate-500">Accept from the popup to start a job.</p>
                  </div>

                  {!authToken ? (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-slate-700">
                      Please log in as a provider to see nearby requests.
                    </div>
                  ) : (
                    <>
                      {gpsError ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm">{gpsError}</div>
                      ) : null}
                      {error ? (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-900 text-sm">{error}</div>
                      ) : null}
                      {!activeJob ? (
                        !providerCoords ? (
                          <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600 shadow-sm">Getting your location…</div>
                        ) : isLoading ? (
                          <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600 shadow-sm">Waiting for nearby emergencies…</div>
                        ) : (
                          <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600 shadow-sm">Waiting for an emergency request popup.</div>
                        )
                      ) : (
                        <div className="bg-white p-6 rounded-xl border-2 border-blue-500 shadow-sm">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex gap-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <Shield size={22} />
                              </div>
                              <div>
                                <h4 className="font-bold text-lg text-slate-900">Active Job</h4>
                                <p className="text-slate-500 text-sm">{activeJob.serviceType} • {activeJob.locationName}</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">ACCEPTED</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                              <MapPin className="text-blue-600" size={20} />
                              <div>
                                <p className="text-xs text-slate-500">Distance</p>
                                <p className="text-sm font-semibold text-slate-900">{isCalculatingFare ? 'Calculating...' : routeData.distance}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                              <Wallet className="text-green-600" size={20} />
                              <div>
                                <p className="text-xs text-slate-500">Estimated Earnings</p>
                                <p className="text-sm font-semibold text-slate-900">{isCalculatingFare ? 'Calculating...' : routeData.fare}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            {activeJob.codConfirmationRequested ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => cancelJob(activeJob._id)}
                                  className="flex-1 py-3 border border-red-300 text-red-700 font-bold rounded-xl hover:bg-red-50 transition"
                                >
                                  Cancel Job
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCODConfirmation}
                                  className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-500 transition flex items-center justify-center gap-2"
                                >
                                  <Wallet size={18} />
                                  Confirm Cash Received (₹{activeJob.codAmount || 1000})
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => cancelJob(activeJob._id)}
                                  className="flex-1 py-3 border border-red-300 text-red-700 font-bold rounded-xl hover:bg-red-50 transition"
                                >
                                  Cancel Job
                                </button>
                                <button
                                  type="button"
                                  onClick={() => completeJob(activeJob._id)}
                                  className={`flex-1 py-3 font-bold rounded-xl transition ${
                                    isAtDestination ? 'bg-green-500 text-white animate-pulse shadow-lg shadow-green-500/50' : 'bg-green-600 text-white hover:bg-green-500'
                                  }`}
                                >
                                  {isAtDestination ? 'Arrived! Complete Job' : 'Complete Job'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-64 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">You are Offline</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">Go online to start receiving job requests from nearby customers.</p>
                </div>
              )
            ) : null}

            {activeTab === 'history' ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Job History</h3>
                <div className="space-y-3">
                  
                  {filteredHistory.length ? (
                    filteredHistory.map((job) => (
                      <div key={job.id} className="rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{job.customerName}</p>
                          <p className="text-sm text-slate-500">{job.serviceType} • {job.locationName}</p>
                        </div>
                        <p className="font-bold text-slate-900">{job.fareLabel}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No job history available yet.</p>
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === 'messages' ? (
              <div className="space-y-4">
                {!authToken || !providerId ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-700">Please log in to load your chat inbox.</div>
                ) : (
                  <ChatHistorySection
                    userId={providerId}
                    authToken={authToken}
                    readOnly={false}
                    emptyHint="When you accept an emergency request, the chat thread appears here."
                  />
                )}
              </div>
            ) : null}

            {activeTab === 'profile' ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6">My Profile</h3>
                
                {/* Profile Image Section */}
                <div className="flex justify-center mb-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-700 overflow-hidden border-4 border-white shadow-lg">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        providerInitials
                      )}
                    </div>
                    <button
                      onClick={triggerFileInput}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all group-hover:scale-110"
                      title="Change profile photo"
                    >
                      <Camera size={18} />
                    </button>
                    <input
                      id="profile-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Personal Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm font-medium text-slate-500">Full Name</span>
                        <span className="text-sm font-semibold text-slate-900">{user?.name || providerName || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm font-medium text-slate-500">Provider ID</span>
                        <span className="text-sm font-semibold text-slate-900">{providerId ? `#${String(providerId).slice(-6)}` : '—'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm font-medium text-slate-500">Email</span>
                        <span className="text-sm font-semibold text-slate-900">{user?.email || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm font-medium text-slate-500">Phone Number</span>
                        <span className="text-sm font-semibold text-slate-900">{user?.phone || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Professional Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm font-medium text-slate-500">Service Type</span>
                        <span className="text-sm font-semibold text-slate-900">{user?.serviceType || 'Towing & Recovery'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm font-medium text-slate-500">Vehicle Type</span>
                        <span className="text-sm font-semibold text-slate-900">{user?.vehicleType || 'Heavy Duty Tow Truck'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm font-medium text-slate-500">Vehicle Number</span>
                        <span className="text-sm font-semibold text-slate-900">{user?.vehicleNumber || 'MH-12-AB-1234'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm font-medium text-slate-500">Experience</span>
                        <span className="text-sm font-semibold text-slate-900">{user?.experience || '5+ Years'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Performance */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Status & Performance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-slate-900">{recentHistory.length}</div>
                      <div className="text-xs text-slate-500">Jobs Completed</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="text-yellow-500" size={14} fill="currentColor" />
                        <div className="text-2xl font-bold text-slate-900">
                          {providerStats.averageRating != null
                            ? providerStats.averageRating.toFixed(1)
                            : providerStats.totalReviews === 0
                              ? 'New'
                              : '—'}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">Average Rating</div>
                      {providerStats.totalReviews > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {providerStats.totalReviews} review{providerStats.totalReviews > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-slate-900">{totalEarnings}</div>
                      <div className="text-xs text-slate-500">Total Earnings</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-slate-900">{isOnline ? 'Online' : 'Offline'}</div>
                      <div className="text-xs text-slate-500">Current Status</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={handleEditProfile}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    Edit Profile
                  </button>
                  <button 
                    onClick={handleViewDocuments}
                    className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                  >
                    View Documents
                  </button>
                </div>
              </div>
            ) : null}

            {activeTab === 'earnings' ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Earnings & Payments</h3>
                <p className="text-slate-600">Current tracked earnings: {totalEarnings}</p>
              </div>
            ) : null}

            {activeTab === 'requests' && activeJob ? (
              <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  {!activeJob ? (
                    <div className="p-8 text-slate-600">
                      No active job right now. Accept a nearby request to see its route on the map.
                    </div>
                  ) : (() => {
                    const coords = activeJob?.location?.coordinates;
                    const reqLng = coords?.[0];
                    const reqLat = coords?.[1];
                    const providerLat = providerCoords?.lat;
                    const providerLng = providerCoords?.lng;

                    const hasReq = Number.isFinite(reqLat) && Number.isFinite(reqLng);
                    const hasProv = Number.isFinite(providerLat) && Number.isFinite(providerLng);
                    const centerLat = hasProv ? providerLat : hasReq ? reqLat : 0;
                    const centerLng = hasProv ? providerLng : hasReq ? reqLng : 0;

                    const distanceMeters =
                      hasReq && hasProv
                        ? haversineDistanceMeters(reqLat, reqLng, providerLat, providerLng)
                        : null;
                    const distanceLabel =
                      distanceMeters == null
                        ? null
                        : distanceMeters >= 1000
                          ? `${(distanceMeters / 1000).toFixed(2)} km away`
                          : `${Math.round(distanceMeters)} m away`;

                    return hasReq ? (
                      <div style={{ height: 520, width: '100%' }} className="relative">
                        {distanceLabel ? (
                          <div className="absolute top-3 left-3 z-[10] bg-red-600 text-white px-3 py-2 rounded-2xl shadow-lg text-sm font-bold">
                            {distanceLabel}
                          </div>
                        ) : (
                          <div className="absolute top-3 left-3 z-[10] bg-slate-900 text-white px-3 py-2 rounded-2xl shadow-lg text-sm font-bold">
                            Waiting for provider GPS…
                          </div>
                        )}

                        <MapContainer
                          center={[centerLat, centerLng]}
                          zoom={14}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={[reqLat, reqLng]} icon={CustomerIcon}>
                            <Popup>
                              <div className="font-bold">{activeJob.locationName}</div>
                              <div className="text-xs opacity-80">Customer requested help</div>
                            </Popup>
                          </Marker>
                          {hasProv ? (
                            <Marker position={[providerLat, providerLng]}>
                              <Popup>
                                <div className="font-bold">Your accepted job</div>
                                <div className="text-xs opacity-80">Provider position</div>
                              </Popup>
                            </Marker>
                          ) : null}
                          {hasProv ? (
                            <Polyline
                              positions={[
                                [reqLat, reqLng],
                                [providerLat, providerLng],
                              ]}
                            />
                          ) : null}
                        </MapContainer>
                      </div>
                    ) : (
                      <div className="p-8 text-slate-600">
                        Map coordinates are missing for this active job.
                      </div>
                    );
                  })()}
                </div>
            ) : null}
          </div>
        </main>
      </div>

      {popupRequest ? (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setPopupRequest(null)}
            aria-label="Close"
          />

          {/* Card */}
          <div className="relative w-full max-w-sm mx-auto animate-[fadeInUp_0.25s_ease-out]">
            {/* Outer glow ring */}
            <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 opacity-80 blur-sm" />

            <div className="relative bg-[#0f1629] rounded-3xl overflow-hidden shadow-2xl">

              {/* Top accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-red-500 to-rose-500" />

              {/* Header */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-start justify-between">
                  {/* Icon + title */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-xl bg-red-500/30 animate-ping" />
                      <div className="relative w-11 h-11 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest">New Request</p>
                      <h4 className="text-lg font-bold text-white leading-tight">Emergency Help</h4>
                    </div>
                  </div>

                  {/* Close */}
                  <button
                    type="button"
                    onClick={() => setPopupRequest(null)}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="mx-6 h-px bg-slate-800" />

              {/* Info rows */}
              <div className="px-6 py-4 space-y-3">
                {/* Customer */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">👤</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Customer</p>
                    <p className="text-sm font-bold text-white">{popupRequest.customerName || 'Customer'}</p>
                  </div>
                </div>

                {/* Service type */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">🔧</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Service</p>
                    <p className="text-sm font-bold text-white">{popupRequest.serviceType || 'Emergency'}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Location</p>
                    <p className="text-sm font-semibold text-slate-200 truncate">{popupRequest.locationName || 'Nearby'}</p>
                  </div>
                </div>
              </div>

              {/* Earnings estimate strip */}
              <div className="mx-6 mb-5 bg-gradient-to-r from-emerald-900/60 to-emerald-800/40 border border-emerald-700/40 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-300">Estimated Earnings</span>
                </div>
                <span className="text-base font-bold text-emerald-300">
                  {popupRequest.totalFare ? `₹${popupRequest.totalFare}` : 'Calculating...'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="px-6 pb-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => decline(popupRequest.requestId)}
                  className="py-3.5 rounded-2xl border border-slate-700 text-slate-400 font-bold text-sm hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all duration-200"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => accept(popupRequest.requestId)}
                  className="py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/25 transition-all duration-200 active:scale-95"
                >
                  ⚡ Accept Job
                </button>
              </div>

            </div>
          </div>
        </div>
      ) : null}


      {/* Password Verification Modal */}
      {showPasswordModal ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4" style={{ zIndex: 999999 }}>
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-auto shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Identity</h3>
              <p className="text-slate-600">Enter your account password to edit profile details</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Account Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1">Demo: Enter any 6+ character password</p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordVerification}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Verify & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Profile Modal */}
      {isEditingProfile && isPasswordVerified ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4" style={{ zIndex: 999999 }}>
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleCancelEdit}
          />
          <div className="relative bg-white rounded-2xl p-8 max-w-2xl w-full mx-auto shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Edit Profile Details</h3>
              <p className="text-slate-600">Update your professional information</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Personal Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editableFields.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editableFields.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={editableFields.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Professional Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
                    <select
                      value={editableFields.serviceType}
                      onChange={(e) => handleFieldChange('serviceType', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    >
                      <option value="Towing & Recovery">Towing & Recovery</option>
                      <option value="Emergency Repair">Emergency Repair</option>
                      <option value="Battery Service">Battery Service</option>
                      <option value="Tire Service">Tire Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                    <select
                      value={editableFields.vehicleType}
                      onChange={(e) => handleFieldChange('vehicleType', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    >
                      <option value="Heavy Duty Tow Truck">Heavy Duty Tow Truck</option>
                      <option value="Medium Duty Tow Truck">Medium Duty Tow Truck</option>
                      <option value="Light Duty Tow Truck">Light Duty Tow Truck</option>
                      <option value="Flatbed Truck">Flatbed Truck</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Number</label>
                    <input
                      type="text"
                      value={editableFields.vehicleNumber}
                      onChange={(e) => handleFieldChange('vehicleNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Experience</label>
                    <select
                      value={editableFields.experience}
                      onChange={(e) => handleFieldChange('experience', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    >
                      <option value="1-2 Years">1-2 Years</option>
                      <option value="3-5 Years">3-5 Years</option>
                      <option value="5+ Years">5+ Years</option>
                      <option value="10+ Years">10+ Years</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
                <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
              <button
                onClick={handleCancelEdit}
                className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cancel Job Confirmation Modal */}
      {showCancelConfirm ? (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCancelConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-auto shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Cancel Active Job?</h3>
              <p className="text-slate-600">
                This will notify the customer and release you from this job. This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
              >
                No, Keep Working
              </button>
              <button
                type="button"
                onClick={confirmCancelJob}
                className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
              >
                Yes, Cancel Job
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProviderProfile;