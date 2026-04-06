import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  MapPin, Navigation, Loader2, CheckCircle2, Star, AlertTriangle, Shield, IndianRupee, Phone, X
} from 'lucide-react';
import io from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiUrl, socketUrl } from './config/api';
import { calculateRouteData, getProviderLocation, getServicePricing } from './utils/auth';
import { useAuth } from './context/AuthContext';
import ChatPanelToggle from './components/ChatPanelToggle';
import FeedbackModal from './components/FeedbackModal';
import ProviderList from './components/ProviderList';
import UPIQRCode from './components/UPIQRCode';
import CardPaymentModal from './components/CardPaymentModal';
import CODPaymentModal from './components/CODPaymentModal';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const carIcon = L.divIcon({
  className: 'customer-car-tracking',
  html: '<span style="font-size:26px;line-height:1" aria-hidden="true">🚗</span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

// Initialize socket with better error handling
let socket;
try {
  socket = io(socketUrl, {
    timeout: 10000,
    forceNew: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
  });
} catch (error) {
  console.error('Socket initialization error:', error);
  socket = null;
}

const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14);
  }, [lat, lng, map]);
  return null;
};

const Emergency = () => {
  const { fullName, user } = useAuth();
  const currentUserId = user?._id;
  const [status, setStatus] = useState('input');
  const [hasShownPopup, setHasShownPopup] = useState(false);
  const hasShownPopupRef = useRef(false); // Use ref to track popup state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showCardPaymentModal, setShowCardPaymentModal] = useState(false);
  const [showCODPaymentModal, setShowCODPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showProviderList, setShowProviderList] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isProcessingCardPayment, setIsProcessingCardPayment] = useState(false);
  const [isProcessingCODPayment, setIsProcessingCODPayment] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialService = searchParams.get('service') || 'Towing';
  const [serviceType, setServiceType] = useState(initialService);

  const [locationName, setLocationName] = useState('');
  const [coords, setCoords] = useState({ lat: 19.076, lng: 72.8777 });
  const [driverCoords, setDriverCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const [currentRequest, setCurrentRequest] = useState(null);
  const [assignedProvider, setAssignedProvider] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Pricing state for customer popup
  const [routeData, setRouteData] = useState({ 
    distance: "Calculating...", 
    fare: "Calculating...",
    breakdown: null 
  });
  const [isCalculatingFare, setIsCalculatingFare] = useState(false);

  // Live distance between customer and driver (Haversine, km)
  const [liveDistance, setLiveDistance] = useState(null);

  // --- Haversine Formula ---------------------------------------------------
  const haversineKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  // -------------------------------------------------------------------------

  const authToken = localStorage.getItem('authToken');

  const resolvedRequestId = useMemo(() => {
    const r = currentRequest;
    if (!r) return '';
    const raw = r._id ?? r.id;
    return raw != null ? String(raw).trim() : '';
  }, [currentRequest]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported');
      return;
    }

    setIsLocating(true);
    setLocationName('Detecting GPS...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });

        try {
          const response = await fetch(apiUrl('/api/geolocation/reverse'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng }),
          });

          const data = await response.json();

          if (data.success && data.address) {
            const address = data.address.split(',').slice(0, 3).join(',');
            setLocationName(`📍 ${address}`);
          } else {
            const fallbackResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const fallbackData = await fallbackResponse.json();
            if (fallbackData?.display_name) {
              const address = fallbackData.display_name.split(',').slice(0, 3).join(',');
              setLocationName(`📍 ${address}`);
            } else {
              setLocationName(`📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          }
        } catch {
          setLocationName(`📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        alert('Unable to retrieve location.');
        setIsLocating(false);
      }
    );
  };

  useEffect(() => {
    if (!socket) {
      console.warn('Socket not initialized, skipping event listeners');
      return;
    }

    const onUpdate = (data) => {
      if (data.status === 'SEARCHING') {
        setStatus('searching');
      } else if (data.status === 'ACCEPTED') {
        setStatus('found');
        setCurrentRequest((prev) => ({
          ...(prev || {}),
          _id: data.requestId || prev?._id,
          status: 'accepted',
        }));
        setAssignedProvider({
          ...data.provider,
          providerId: data.provider?.providerId,
        });
        setSuccessMessage(data.message || `Help is on the way! ${data.provider?.providerName || ''} has accepted your request.`);
        const coordsFromSocket = data.providerCoords;
        if (coordsFromSocket?.lat != null && coordsFromSocket?.lng != null) {
          setDriverCoords(coordsFromSocket);
          
          // Use fare data from request if available
          if (data.request && data.request.distance !== undefined) {
            setCustomerFareFromDatabase(data.request);
          } else {
            // Fallback to local calculation
            calculateCustomerFare(coordsFromSocket, coords, serviceType);
          }
        }
      } else if (data.status === 'COMPLETED') {
        setStatus('completed');
        setShowCompletionModal(true);
      } else if (data.status === 'CANCELLED') {
        setShowCancelModal(true);
        setAssignedProvider(null);
        setDriverCoords(null);
        setStatus('searching');
        setSuccessMessage(null); // Clear success message when request is cancelled
      } else if (data.status === 'SEARCHING_AGAIN') {
        setShowDeclineModal(true);
        setAssignedProvider(null);
        setDriverCoords(null);
        setStatus('searching');
        setSuccessMessage(null); // Clear success message when provider declines
      } else if (data.status === 'NO_PROVIDER') {
        setError(data.message || 'No providers available nearby.');
        setStatus('input');
        setCurrentRequest(null);
      }
    };

    // Listen for provider cancellation event
    const onProviderCancelled = (data) => {
      console.log('Provider cancelled job:', data);
      alert('Provider has cancelled the request. Redirecting you back to the main dashboard...');
      
      // Reset all states
      setStatus('input');
      setCurrentRequest(null);
      setAssignedProvider(null);
      setDriverCoords(null);
      setSuccessMessage(null);
      setError(null);
      
      // Redirect to home after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    };

    socket.on('request-update', onUpdate);
    socket.on('provider_cancelled_job', onProviderCancelled);

    // Real-time provider location — move the driver marker immediately
    // instead of waiting for the 5-second DB poll.
    socket.on('provider-location-update', ({ lat, lng }) => {
      if (lat != null && lng != null) {
        setDriverCoords({ lat, lng });
      }
    });
    
    return () => {
      if (socket) {
        socket.off('request-update', onUpdate);
        socket.off('provider_cancelled_job', onProviderCancelled);
        socket.off('provider-location-update');
      }
    };
  }, [socket]);

  // Recalculate live distance every time driver coords update
  useEffect(() => {
    if (driverCoords && coords) {
      const d = haversineKm(coords.lat, coords.lng, driverCoords.lat, driverCoords.lng);
      setLiveDistance(d < 0.05 ? 0 : parseFloat(d.toFixed(1)));
    } else {
      setLiveDistance(null);
    }
  }, [driverCoords, coords]);

  // Clear success message when there's no active request
  useEffect(() => {
    if (!currentRequest || status !== 'found') {
      setSuccessMessage(null);
    }
  }, [currentRequest, status]);

  // Set fare data from database instead of calculating locally
  const setCustomerFareFromDatabase = (requestData) => {
    if (requestData.distance !== undefined && requestData.totalFare !== undefined) {
      // Use fare data from database
      setRouteData({
        distance: `${requestData.distance} km`,
        fare: `₹${requestData.totalFare}`,
        breakdown: {
          baseFee: `₹${requestData.baseFee}`,
          distanceCharge: `₹${requestData.distanceCharge}`,
          totalFare: `₹${requestData.totalFare}`,
          distanceKm: requestData.distance.toString(),
          ratePerKm: requestData.ratePerKm,
          serviceType: requestData.serviceType,
          color: 'emerald', // Customer view uses emerald theme
          icon: 'help-circle'
        }
      });
    } else {
      // Fallback to local calculation for backward compatibility
      calculateCustomerFare(coords, coordsFromSocket, serviceType);
    }
  };

  // Calculate fare when provider accepts the request
  const calculateCustomerFare = async (providerCoords, customerCoords, serviceType) => {
    setIsCalculatingFare(true);
    try {
      console.log('Calculating customer fare:', { providerCoords, customerCoords, serviceType });
      
      // Calculate route data with service-specific pricing
      const routeResult = await calculateRouteData(providerCoords, customerCoords, serviceType);
      setRouteData(routeResult);
      
    } catch (error) {
      console.error('Error calculating customer fare:', error);
      // Get default pricing for fallback
      const defaultPricing = getServicePricing(serviceType);
      setRouteData({
        distance: "Calculation Pending",
        fare: `₹${defaultPricing.minFare} (Base)`,
        breakdown: null
      });
    } finally {
      setIsCalculatingFare(false);
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!locationName) return alert('Please set your location first.');
    
    setError(null);
    setHasShownPopup(false); // Reset popup state for new request
    hasShownPopupRef.current = false; // Reset ref as well
    setStatus('searching');

    try {
      const requestData = {
        customerName: fullName || undefined,
        customerPhone: user?.phone || undefined,
        serviceType,
        location: coords,
        address: locationName,
      };

      console.log('Sending request:', requestData);
      const response = await fetch(apiUrl('/api/requests'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setCurrentRequest(data.request);
        if (socket) {
          socket.emit('join-request', data.request._id);
        }
        if (data.request.status === 'ignored') {
          setError('No providers available in your area right now.');
          setStatus('input');
          setCurrentRequest(null);
        }
      } else {
        setError(data.error || 'Failed to submit request');
        setStatus('input');
      }
    } catch (error) {
      console.error('Request submission error:', error);
      setError('Failed to submit request. Please check your internet connection and try again.');
      setStatus('input');
    }
  };

  const handleCancelRequest = () => {
    if (!currentRequest?._id || isCancelling) return;
    setShowCancelConfirm(true);
  };

  const confirmCancelRequest = async () => {
    setShowCancelModal(false);
    if (isCancelling) return;

    setIsCancelling(true);
    try {
      const requestId = currentRequest._id;
      console.log('[Cancel] Sending PATCH to customer-cancel for requestId:', requestId);

      const response = await fetch(
        apiUrl(`/api/requests/customer-cancel/${requestId}`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        }
      );

      const data = await response.json();
      console.log('[Cancel] HTTP status:', response.status, 'Body:', data);

      if (data.success) {
        setCurrentRequest(null);
        setAssignedProvider(null);
        setDriverCoords(null);
        setStatus('input');
        setSuccessMessage(null);
        navigate(`/cancel-feedback/${requestId}`);
      } else {
        const msg = data.error || data.message || `Server returned ${response.status}`;
        alert(`Cancel failed: ${msg}`);
        setError(msg);
      }
    } catch (err) {
      console.error('[Cancel] Network error:', err);
      alert('Cancel failed: Network error. Please try again.');
      setError('Failed to cancel request. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleProviderSelect = (provider) => {
    // Set the selected provider and proceed with request
    setAssignedProvider({
      providerId: provider._id || provider.name,
      providerName: provider.name,
      phone: provider.phone,
      rating: provider.rating,
      serviceType: provider.services[0] || serviceType,
    });
    setShowProviderList(false);
    // Optionally auto-fill the request with selected provider
    handleRequest(new Event('submit'));
  };

  const handleBackFromProviders = () => {
    setShowProviderList(false);
  };

  const handlePayment = async (paymentMethod) => {
    try {
      const amount = currentRequest?.totalFare || routeData?.fare?.replace('₹', '') || '1000';
      const requestId = currentRequest?._id;
      
      if (!requestId) {
        alert('Request ID not found. Please try again.');
        return;
      }

      // Show processing state
      if (paymentMethod === 'upi') {
        // Show QR code modal and auto-open Google Pay
        setShowPaymentModal(false);
        setShowQRCodeModal(true);
        
        // Auto-open Google Pay after a short delay with provider-specific details
        setTimeout(async () => {
          try {
            // Fetch provider info to get UPI ID
            const authToken = localStorage.getItem('authToken');
            const providerId = currentRequest?.assignedProvider;
            
            if (providerId) {
              const response = await fetch(apiUrl(`/api/providers/${providerId}`), {
                headers: {
                  'Authorization': `Bearer ${authToken}`
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.provider) {
                  const providerUpiId = data.provider.upiId || 'roadrescue@okaxis';
                  const amount = currentRequest?.totalFare || routeData?.fare?.replace('₹', '') || '1000';
                  const merchantName = 'RoadRescue';
                  const jobId = currentRequest?._id;
                  
                  // Create Google Pay deep link with provider details
                  const gpayUrl = `tez://upi/pay?pa=${providerUpiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=RoadRescue_Job_${jobId}`;
                  
                  const gpayLink = document.createElement('a');
                  gpayLink.href = gpayUrl;
                  gpayLink.target = '_blank';
                  document.body.appendChild(gpayLink);
                  gpayLink.click();
                  document.body.removeChild(gpayLink);
                }
              }
            }
          } catch (error) {
            console.error('Error auto-opening Google Pay:', error);
            // Fallback to default Google Pay
            window.open('https://pay.google.com/', '_blank');
          }
        }, 500);
      } else if (paymentMethod === 'card') {
        // Show card payment modal
        setShowPaymentModal(false);
        setShowCardPaymentModal(true);
      } else if (paymentMethod === 'cod') {
        // Show COD payment modal
        setShowPaymentModal(false);
        setShowCODPaymentModal(true);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    };
  };

  const handleCODPayment = async () => {
    try {
      setIsProcessingCODPayment(true);
      
      const requestId = currentRequest?._id;
      
      if (!requestId) {
        alert('Request ID not found. Please try again.');
        return;
      }

      const authToken = localStorage.getItem('authToken');
      const response = await fetch(apiUrl('/api/payments/cod'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          requestId
        })
      });

      const data = await response.json();
      console.log('COD payment response:', data);
      
      if (data.success) {
        // Show success message
        alert('Request Finalized! Cash on Delivery confirmed. The provider has been notified.');
        setShowCODPaymentModal(false);
        
        // Redirect to user dashboard
        navigate('/profile/user');
      } else {
        console.error('COD payment failed:', data.error);
        alert('COD confirmation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('COD payment processing error:', error);
      alert('COD confirmation failed. Please try again.');
    } finally {
      setIsProcessingCODPayment(false);
    }
  };

  const handleCardPayment = async (cardData) => {
    try {
      setIsProcessingCardPayment(true);
      
      const requestId = currentRequest?._id;
      const amount = currentRequest?.totalFare || routeData?.fare?.replace('₹', '') || '1000';
      
      if (!requestId) {
        alert('Request ID not found. Please try again.');
        return;
      }

      const authToken = localStorage.getItem('authToken');
      const response = await fetch(apiUrl('/api/payments/card'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          requestId,
          ...cardData,
          amount: parseInt(amount)
        })
      });

      const data = await response.json();
      console.log('Card payment response:', data);
      
      if (data.success) {
        // Show success message
        alert('Card payment successful! Thank you for using RoadRescue.');
        setShowCardPaymentModal(false);
        
        // Redirect to user dashboard
        navigate('/profile/user');
      } else {
        console.error('Card payment failed:', data.error);
        alert('Card payment failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Card payment processing error:', error);
      alert('Card payment processing failed. Please try again.');
    } finally {
      setIsProcessingCardPayment(false);
    }
  };

  const processPayment = async (requestId, paymentMethod, amount) => {
    try {
      console.log('Processing payment:', { requestId, paymentMethod, amount });
      
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        console.error('No auth token found');
        alert('Please log in to make payment.');
        return;
      }
      
      if (!requestId) {
        console.error('No request ID found');
        alert('Request ID not found. Please try again.');
        return;
      }
      
      const response = await fetch(apiUrl('/api/payments/verify'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          requestId,
          paymentMethod,
          amount: parseInt(amount),
          transactionId: `TXN_${Date.now()}`
        })
      });

      console.log('Payment response status:', response.status);
      const data = await response.json();
      console.log('Payment response data:', data);
      
      if (data.success) {
        // Show success message
        alert('Payment successful! Thank you for using RoadRescue.');
        setShowQRCodeModal(false); // Close QR modal, not payment modal
        
        // Redirect to user dashboard
        navigate('/profile/user');
      } else {
        console.error('Payment verification failed:', data.error);
        alert('Payment verification failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Payment processing failed. Please try again.');
    }
  };

  useEffect(() => {
    if (!currentRequest?._id) {
      return undefined;
    }

    const pollRequest = async () => {
      try {
        const response = await fetch(apiUrl(`/api/requests/status/${currentRequest._id}`), {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });
        const data = await response.json();
        if (!data.success || !data.request) return;

        const req = data.request;
        setCurrentRequest((prev) => ({ ...prev, ...req }));

        // Handle completed status
        if (req.status === 'completed' && !showCompletionModal) {
          setStatus('completed');
          setShowCompletionModal(true);
          return;
        }

        if (req.provider && !hasShownPopupRef.current) {
          const prov = req.provider;
          const providerCoordinates = prov.location?.coordinates;
          setAssignedProvider({
            providerId: prov._id,
            providerName: prov.name,
            phone: prov.phone,
            rating: prov.providerInfo?.rating,
            serviceType: req.serviceType,
          });
          if (providerCoordinates?.length === 2) {
            setDriverCoords({ lat: providerCoordinates[1], lng: providerCoordinates[0] });
          }
          setStatus('found');
          // Only show popup once when provider accepts
          setSuccessMessage(`Help is on the way! ${prov.name} has accepted your request.`);
          setHasShownPopup(true);
          hasShownPopupRef.current = true; // Update ref
        }
      } catch {
        /* keep polling */
      }
    };

    pollRequest();
    const timer = setInterval(pollRequest, 5000);
    return () => clearInterval(timer);
  }, [currentRequest, authToken]);

  const providerInitials = (assignedProvider?.providerName || 'P')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const mapCenterLat = coords.lat;
  const mapCenterLng = coords.lng;

  // Handle feedback submission
  const handleFeedbackSubmit = async (reviewData) => {
    console.log('Submitting review with data:', reviewData);
    console.log('Auth token available:', !!authToken);
    console.log('User ID:', currentUserId);
    
    try {
      const response = await fetch(apiUrl('/api/reviews'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(reviewData),
      });

      console.log('Review submission response status:', response.status);
      
      const data = await response.json();
      console.log('Review submission response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || data.details || 'Failed to submit review');
      }

      console.log('Review submitted successfully:', data);
      setShowFeedbackModal(false);
      
      // Optional: Show success message
      alert('Thank you for your feedback! Your review has been submitted.');
      
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(`Failed to submit review: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />

      {successMessage && status === 'found' ? (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSuccessMessage(null)} />
          
          {/* Modal Content */}
          <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 border-2 border-emerald-400 rounded-3xl p-8 max-w-md w-full mx-auto shadow-2xl transform transition-all duration-300 scale-100">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-emerald-400/20 rounded-3xl blur-xl -z-10" />
            
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-300" />
              </div>
            </div>
            
            {/* Success Message */}
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              Help is on the way!
            </h2>
            <p className="text-emerald-100 text-center mb-6 leading-relaxed">
              {successMessage}
            </p>
            
            {/* Provider Info */}
            {assignedProvider && (
              <div className="bg-emerald-800/50 rounded-2xl p-4 mb-6 border border-emerald-600/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center border-2 border-emerald-400 text-lg font-bold text-white">
                    {providerInitials}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{assignedProvider?.providerName || 'Provider'}</h3>
                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                      <Star size={12} fill="currentColor" />
                      <span>{assignedProvider?.rating ?? '—'} • {assignedProvider?.serviceType || serviceType}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Information */}
            <div className="bg-emerald-800/50 rounded-2xl p-4 mb-6 border border-emerald-600/30">
              <h5 className="text-sm font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                <IndianRupee size={16} className="text-emerald-400" />
                Estimated Fare
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-emerald-200">Distance:</span>
                  <span className="text-sm font-medium text-white">
                    {isCalculatingFare ? 'Calculating...' : routeData.distance}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-emerald-200">Service Type:</span>
                  <span className="text-sm font-medium text-white">{serviceType}</span>
                </div>
                {routeData.breakdown && !isCalculatingFare ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-emerald-200">Base Fee:</span>
                      <span className="text-sm font-medium text-white">{routeData.breakdown.baseFee}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-emerald-200">Distance Charge:</span>
                      <span className="text-sm font-medium text-white">{routeData.breakdown.distanceCharge}</span>
                    </div>
                    <div className="border-t border-emerald-600/30 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-emerald-200">Total Fare:</span>
                        <span className="text-lg font-bold text-yellow-400">{routeData.breakdown.totalFare}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-emerald-200">Estimated Cost:</span>
                    <span className="text-sm font-bold text-yellow-400">
                      {isCalculatingFare ? 'Calculating...' : routeData.fare}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg"
              >
                View Map
              </button>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg"
              >
                Call Provider
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCompletionModal ? (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCompletionModal(false)} />
          
          {/* Modal Content */}
          <div className="relative bg-gradient-to-br from-green-900 via-green-800 to-green-900 border-2 border-green-400 rounded-3xl p-8 max-w-md w-full mx-auto shadow-2xl transform transition-all duration-300 scale-100">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-green-400/20 rounded-3xl blur-xl -z-10" />
            
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-400">
                <CheckCircle2 className="w-12 h-12 text-green-300" />
              </div>
            </div>
            
            {/* Success Message */}
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              Job Completed!
            </h2>
            <p className="text-green-100 text-center mb-6 leading-relaxed">
              Your service has been completed successfully. Thank you for using Road Rescue!
            </p>
            
            {/* Provider Info */}
            {assignedProvider && (
              <div className="bg-green-800/50 rounded-2xl p-4 mb-6 border border-green-600/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center border-2 border-green-400 text-lg font-bold text-white">
                    {providerInitials}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{assignedProvider?.providerName || 'Provider'}</h3>
                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                      <Star size={12} fill="currentColor" />
                      <span>{assignedProvider?.rating ?? '—'} • {assignedProvider?.serviceType || serviceType}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCompletionModal(false);
                  setShowFeedbackModal(true);
                }}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg flex items-center justify-center gap-2"
              >
                <Star size={18} />
                Rate Service
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCompletionModal(false);
                  setShowPaymentModal(true);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg flex items-center justify-center gap-2"
              >
                <IndianRupee size={18} />
                Make Payment
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Payment Modal */}
      {showPaymentModal ? (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          
          {/* Modal Content */}
          <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 border-2 border-blue-400 rounded-3xl p-8 max-w-md w-full mx-auto shadow-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-blue-400/20 rounded-3xl blur-xl -z-10" />
            
            {/* Close Button */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-blue-300 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            {/* Payment Header */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center border-2 border-blue-400">
                <IndianRupee className="w-12 h-12 text-blue-300" />
              </div>
            </div>
            
            {/* Payment Message */}
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              Complete Payment
            </h2>
            <p className="text-blue-100 text-center mb-6 leading-relaxed">
              Please complete the payment to finish your service
            </p>
            
            {/* Total Fare Display */}
            <div className="bg-blue-800/50 rounded-2xl p-4 mb-6 border border-blue-600/30">
              <div className="text-center">
                <p className="text-blue-300 text-sm mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-white">
                  ₹{currentRequest?.totalFare || routeData?.fare?.replace('₹', '') || '1000'}
                </p>
                <p className="text-blue-300 text-xs mt-1">Service: {serviceType}</p>
              </div>
            </div>
            
            {/* Payment Options */}
            <div className="space-y-3">
              {/* UPI Option */}
              <button
                onClick={() => handlePayment('upi')}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200 border border-blue-400/50 flex items-center justify-center gap-3"
              >
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">UPI</span>
                </div>
                <span>Pay via UPI / QR Code</span>
              </button>
              
              {/* Card Option */}
              <button
                onClick={() => handlePayment('card')}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200 border border-blue-400/50 flex items-center justify-center gap-3"
              >
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <IndianRupee size={16} className="text-white" />
                </div>
                <span>Pay via Debit/Credit Card</span>
              </button>
              
              {/* COD Option */}
              <button
                onClick={() => handlePayment('cod')}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200 border border-blue-400/50 flex items-center justify-center gap-3"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">₹</span>
                </div>
                <span>Cash on Delivery (COD)</span>
              </button>
            </div>
            
            {/* Cancel Option */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full mt-4 text-blue-300 hover:text-white transition-colors duration-200 text-sm"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      ) : null}

      {/* QR Code Modal */}
      {showQRCodeModal ? (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowQRCodeModal(false)} />
          
          {/* Modal Content */}
          <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 max-w-md w-full mx-auto shadow-2xl transform transition-all duration-300 scale-100 border border-gray-100 max-h-[90vh] flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setShowQRCodeModal(false)}
              className="absolute top-6 right-6 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 group z-10"
            >
              <X size={20} className="text-gray-600 group-hover:text-gray-900" />
            </button>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 -mx-8 px-8">
              {/* QR Code Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                  UPI Payment
                </h2>
                <p className="text-gray-600 text-sm">
                  Scan the QR code or choose your payment app
                </p>
              </div>
              
              {/* QR Code Display */}
              <UPIQRCode 
                amount={currentRequest?.totalFare || routeData?.fare?.replace('₹', '') || '1000'} 
                providerId={currentRequest?.assignedProvider}
                jobId={currentRequest?._id}
              />
            </div>
            
            {/* Fixed Action Buttons */}
            <div className="mt-8 space-y-3 -mx-8 px-8 border-t border-gray-100 pt-6">
              <button
                onClick={async () => {
                  const amount = currentRequest?.totalFare || routeData?.fare?.replace('₹', '') || '1000';
                  const requestId = currentRequest?._id;
                  await processPayment(requestId, 'upi', amount);
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                I've Paid
              </button>
              
              <button
                onClick={() => setShowQRCodeModal(false)}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] shadow-md"
              >
                Cancel
              </button>
              
              <button
                onClick={() => navigate('/profile/user')}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Card Payment Modal */}
      <CardPaymentModal
        isOpen={showCardPaymentModal}
        onClose={() => setShowCardPaymentModal(false)}
        amount={currentRequest?.totalFare || routeData?.fare?.replace('₹', '') || '1000'}
        onRequestPayment={handleCardPayment}
        isLoading={isProcessingCardPayment}
      />

      {/* COD Payment Modal */}
      <CODPaymentModal
        isOpen={showCODPaymentModal}
        onClose={() => setShowCODPaymentModal(false)}
        amount={currentRequest?.totalFare || routeData?.fare?.replace('₹', '') || '1000'}
        onConfirm={handleCODPayment}
        isLoading={isProcessingCODPayment}
      />

      {showCancelModal ? (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
          
          {/* Modal Content */}
          <div className="relative bg-gradient-to-br from-orange-900 via-orange-800 to-orange-900 border-2 border-orange-400 rounded-3xl p-8 max-w-md w-full mx-auto shadow-2xl transform transition-all duration-300 scale-100">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-orange-400/20 rounded-3xl blur-xl -z-10" />
            
            {/* Warning Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center border-2 border-orange-400">
                <AlertTriangle className="w-12 h-12 text-orange-300" />
              </div>
            </div>
            
            {/* Warning Message */}
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              Provider Cancelled
            </h2>
            <p className="text-orange-100 text-center mb-6 leading-relaxed">
              Provider has cancelled the job. Looking for new providers in range...
            </p>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg"
              >
                Keep Searching
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  navigate('/profile/user');
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg"
              >
                Cancel Request
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cancel Confirmation Modal — customer confirms they want to cancel */}
      {showCancelConfirm ? (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-gradient-to-br from-red-900 via-red-800 to-red-900 border-2 border-red-400 rounded-3xl p-8 max-w-md w-full mx-auto shadow-2xl">
            <div className="absolute inset-0 bg-red-400/20 rounded-3xl blur-xl -z-10" />

            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-400">
                <AlertTriangle className="w-12 h-12 text-red-300" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-3">Cancel Your Request?</h2>
            <p className="text-red-100 text-center mb-6 leading-relaxed">
              {assignedProvider
                ? `You are about to cancel your request with ${assignedProvider?.providerName || 'your provider'}. This action cannot be undone.`
                : 'You are about to cancel your emergency request. This action cannot be undone.'}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={confirmCancelRequest}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeclineModal ? (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeclineModal(false)} />
          
          {/* Modal Content */}
          <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 border-2 border-blue-400 rounded-3xl p-8 max-w-md w-full mx-auto shadow-2xl transform transition-all duration-300 scale-100">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-blue-400/20 rounded-3xl blur-xl -z-10" />
            
            {/* Info Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center border-2 border-blue-400">
                <Navigation className="w-12 h-12 text-blue-300" />
              </div>
            </div>
            
            {/* Info Message */}
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              Provider Declined
            </h2>
            <p className="text-blue-100 text-center mb-6 leading-relaxed">
              Provider has declined the request. Looking for new providers in your range...
            </p>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg"
              >
                Keep Searching
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeclineModal(false);
                  navigate('/profile/user');
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg"
              >
                Cancel Request
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {status === 'input' && (
        <div className="w-full max-w-md bg-[#1e293b] border border-slate-700 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="flex items-center gap-3 mb-6 text-red-500">
            <div className="p-3 bg-red-500/20 rounded-xl animate-pulse">
              <AlertTriangle size={28} />
            </div>
            <h1 className="text-2xl font-bold text-white">Emergency Request</h1>
          </div>

          <form onSubmit={handleRequest} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Your Location
              </label>
              <div className="relative">
                <MapPin
                  className={`absolute left-4 top-3.5 ${isLocating ? 'text-blue-400 animate-bounce' : 'text-slate-500'}`}
                  size={20}
                />
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Click Locate Me"
                  className="w-full bg-[#0f172a] border border-slate-600 rounded-xl py-3 pl-12 pr-28 text-white focus:outline-none focus:border-blue-500 truncate"
                  required
                />
                <button
                  type="button"
                  onClick={handleLocate}
                  disabled={isLocating}
                  className="absolute right-2 top-2 px-3 py-1.5 bg-blue-600 rounded-lg text-xs font-bold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1 z-20"
                >
                  {isLocating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                  {isLocating ? 'Locating...' : 'Locate Me'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Service Needed
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Towing">🚛 Towing Service</option>
                <option value="Battery Jump">🔋 Battery Jump Start</option>
                <option value="Flat Tire">🔧 Flat Tire Change</option>
                <option value="Fuel Delivery">⛽ Fuel Delivery</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex justify-center items-center gap-2"
            >
              <AlertTriangle size={20} /> Request Help Now
            </button>
          </form>
        </div>
      )}

      {error && status === 'input' && (
        <div className="w-full max-w-md bg-red-500/10 border border-red-500/30 rounded-3xl p-6 shadow-2xl relative z-10 mt-4">
          <div className="flex items-center gap-3 mb-4 text-red-500">
            <AlertTriangle size={24} />
            <h2 className="text-xl font-bold">Connection Error</h2>
          </div>
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl"
          >
            Try Again
          </button>
        </div>
      )}

      {status === 'searching' && (
        <div className="w-full max-w-md text-center relative z-10">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-slate-700 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield size={40} className="text-blue-500 animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Contacting Providers...</h2>
          <p className="text-slate-400">Finding the nearest {serviceType.toLowerCase()} service...</p>
        </div>
      )}

      {status === 'found' && (
        <div className="w-full max-w-md bg-[#1e293b] border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl relative z-10">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-2 mb-4 text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              <CheckCircle2 size={24} />
              <span className="font-bold">
                {liveDistance !== null
                  ? `Driver is ${liveDistance === 0 ? 'arriving' : `${liveDistance} km`} away`
                  : 'Driver is en route!'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-700 rounded-full flex items-center justify-center border-2 border-emerald-500 text-lg font-bold text-white">
                {providerInitials}
              </div>
              <div>
                <h3 className="text-lg font-bold">{assignedProvider?.providerName || 'Provider'}</h3>
                <div className="flex items-center gap-1 text-yellow-400 text-xs">
                  <Star size={12} fill="currentColor" />{' '}
                  {assignedProvider?.rating ?? '—'} • {assignedProvider?.serviceType || serviceType}
                </div>
              </div>
            </div>
          </div>

          <div className="h-64 w-full relative border-t border-b border-slate-700 z-0">
            {coords && driverCoords && (
              <MapContainer center={[mapCenterLat, mapCenterLng]} zoom={14} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <RecenterMap lat={mapCenterLat} lng={mapCenterLng} />
                <Marker position={[coords.lat, coords.lng]}>
                  <Popup>You are here</Popup>
                </Marker>
                <Marker position={[driverCoords.lat, driverCoords.lng]} icon={carIcon}>
                  <Popup>Provider (live)</Popup>
                </Marker>
                <Polyline
                  positions={[
                    [coords.lat, coords.lng],
                    [driverCoords.lat, driverCoords.lng],
                  ]}
                  color="#3b82f6"
                  dashArray="5 10"
                />
              </MapContainer>
            )}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full z-[400] font-bold">
              Live tracking • updates every 5s
            </div>
          </div>

          {authToken && currentUserId && resolvedRequestId && currentRequest?.status === 'accepted' ? (
            <div className="px-6 pt-2">
              <ChatPanelToggle
                requestId={resolvedRequestId}
                currentUserId={currentUserId}
                peerName={assignedProvider?.providerName || 'Provider'}
                authToken={authToken}
                buttonLabel="Message Provider"
                theme="dark"
              />
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4 p-6">
            <a
              href={assignedProvider?.phone ? `tel:${assignedProvider.phone}` : '#'}
              className={`py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold flex items-center justify-center gap-2 text-sm ${
                !assignedProvider?.phone ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              <Phone size={16} /> Call Driver
            </a>
            <button
              type="button"
              onClick={handleCancelRequest}
              disabled={isCancelling}
              className={`py-3 rounded-xl font-bold text-sm transition-all ${
                isCancelling
                  ? 'bg-red-800 text-red-300 cursor-not-allowed opacity-70'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Request'}
            </button>
          </div>
        </div>
      )}

      {/* Provider List */}
      {showProviderList && (
        <ProviderList
          serviceType={serviceType}
          userLocation={coords}
          onProviderSelect={handleProviderSelect}
          onBack={handleBackFromProviders}
        />
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        jobId={currentRequest?._id}
        providerId={assignedProvider?.providerId}
        providerName={assignedProvider?.providerName}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
};

export default Emergency;
