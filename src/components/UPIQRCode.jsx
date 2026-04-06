import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { apiUrl } from '../config/api';

const UPIQRCode = ({ amount, providerId, jobId, merchantName = 'RoadRescue' }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [providerInfo, setProviderInfo] = useState(null);
  const [upiId, setUpiId] = useState('roadrescue@okaxis'); // fallback

  useEffect(() => {
    const fetchProviderInfo = async () => {
      try {
        if (providerId) {
          const authToken = localStorage.getItem('authToken');
          const response = await fetch(apiUrl(`/api/providers/${providerId}`), {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.provider) {
              setProviderInfo(data.provider);
              // Use provider's UPI ID or fallback to default
              const providerUpiId = data.provider.upiId || data.provider.vpa || `${data.provider.name?.toLowerCase().replace(/\s+/g, '')}@okaxis`;
              setUpiId(providerUpiId);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching provider info:', error);
        // Keep fallback UPI ID
      } finally {
        setLoading(false);
      }
    };

    fetchProviderInfo();
  }, [providerId]);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Create UPI payment string with provider details
        const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=RoadRescue_Job_${jobId}&mc=0000&tid=TXN${Date.now()}`;
        
        // Generate QR code
        const qrDataUrl = await QRCode.toDataURL(upiString, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCodeUrl(qrDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    if (!loading) {
      generateQRCode();
    }
  }, [amount, upiId, jobId, loading, merchantName]);

  const handleUPIPayment = (app) => {
    // Open official websites instead of deep links
    switch(app) {
      case 'gpay':
        window.open('https://pay.google.com/', '_blank');
        break;
        
      case 'phonepe':
        window.open('https://www.phonepe.com/', '_blank');
        break;
        
      case 'paytm':
        window.open('https://paytm.com/', '_blank');
        break;
        
      case 'default':
        window.open('https://www.bhimupi.org.in/', '_blank');
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-gray-700 font-medium">Loading payment details...</p>
          <p className="text-xs text-gray-500">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* QR Code Container */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl blur-xl opacity-20"></div>
        <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
          <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <img src={qrCodeUrl} alt="UPI QR Code" className="w-56 h-56 rounded-lg" />
        </div>
      </div>
      
      {/* Payment Details */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full border border-blue-100">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <p className="text-sm font-semibold text-gray-800">
            Scan to pay <span className="text-lg font-bold text-blue-600">₹{amount}</span> to {providerInfo?.name || 'Provider'}
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-600 font-mono">
            {upiId}
          </p>
        </div>
      </div>
      
      {/* Payment App Selection */}
      <div className="w-full space-y-4">
        <p className="text-center text-sm font-medium text-gray-700">Choose your payment app:</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleUPIPayment('gpay')}
            className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
              <span className="text-xs font-bold">G</span>
            </div>
            Google Pay
            <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
          
          <button
            onClick={() => handleUPIPayment('phonepe')}
            className="group relative bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
              <span className="text-xs font-bold">P</span>
            </div>
            PhonePe
            <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
          
          <button
            onClick={() => handleUPIPayment('paytm')}
            className="group relative bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
              <span className="text-xs font-bold">P</span>
            </div>
            PayTM
            <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
          
          <button
            onClick={() => handleUPIPayment('default')}
            className="group relative bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
              <span className="text-xs font-bold">+</span>
            </div>
            Other Apps
            <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
        </div>
      </div>
      
      {/* Help Note */}
      <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-gray-700 mb-1">Quick Tip</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              QR code works with all UPI apps. Buttons will open your selected payment app automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UPIQRCode;
