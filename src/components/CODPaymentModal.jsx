import React from 'react';
import { Wallet, X, IndianRupee, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CODPaymentModal = ({ 
  isOpen, 
  onClose, 
  amount = 1000, 
  onConfirm,
  isLoading 
}) => {
  const navigate = useNavigate();
  
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 border-2 border-green-400 rounded-3xl p-8 max-w-md w-full mx-auto shadow-2xl transform transition-all duration-300 scale-100">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-green-400/20 rounded-3xl blur-xl -z-10" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-green-300 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-400">
            <Wallet className="w-12 h-12 text-green-300" />
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-4">
          Cash on Delivery
        </h2>
        
        {/* Amount Display */}
        <div className="bg-green-800/50 rounded-2xl p-4 mb-6 border border-green-600/30">
          <div className="text-center">
            <p className="text-green-300 text-sm mb-1">Amount to Pay</p>
            <div className="flex items-center justify-center gap-2">
              <IndianRupee className="w-6 h-6 text-green-300" />
              <p className="text-3xl font-bold text-white">
                {amount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Confirmation Message */}
        <div className="bg-white/10 rounded-2xl p-4 mb-6 border border-green-400/30">
          <p className="text-green-100 text-center leading-relaxed">
            Confirm Cash Payment? You will pay ₹{amount.toLocaleString()} directly to the provider. 
            The provider will receive a notification to confirm receipt.
          </p>
        </div>
        
        {/* Process Steps */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-green-300">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center border border-green-400">
              <span className="text-xs font-bold">1</span>
            </div>
            <p className="text-sm">You confirm cash payment</p>
          </div>
          <div className="flex items-center gap-3 text-green-300">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center border border-green-400">
              <span className="text-xs font-bold">2</span>
            </div>
            <p className="text-sm">Provider receives notification</p>
          </div>
          <div className="flex items-center gap-3 text-green-300">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center border border-green-400">
              <span className="text-xs font-bold">3</span>
            </div>
            <p className="text-sm">Provider confirms cash receipt</p>
          </div>
          <div className="flex items-center gap-3 text-green-300">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center border border-green-400">
              <span className="text-xs font-bold">4</span>
            </div>
            <p className="text-sm">Payment added to provider earnings</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-800/50 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Confirm & Finish
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full text-green-300 hover:text-white transition-colors duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={() => navigate('/profile/user')}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </button>
        </div>
        
        {/* Security Note */}
        <div className="flex items-center justify-center mt-6 text-xs text-green-300/70">
          <CheckCircle className="w-4 h-4 mr-2" />
          Secure payment confirmation
        </div>
      </div>
    </div>
  );
};

export default CODPaymentModal;
