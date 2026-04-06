import React, { useState } from 'react';
import { CreditCard, X, Shield, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CardPaymentModal = ({ 
  isOpen, 
  onClose, 
  amount = 1000, 
  onRequestPayment,
  isLoading 
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const [errors, setErrors] = useState({});

  const validateCardNumber = (number) => {
    // Remove spaces and check if it's 16 digits
    const cleanNumber = number.replace(/\s/g, '');
    return /^\d{16}$/.test(cleanNumber);
  };

  const validateExpiryDate = (expiry) => {
    // Check MM/YY format and valid date
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regex.test(expiry)) return false;
    
    const [month, year] = expiry.split('/');
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    const expYear = parseInt(year);
    const expMonth = parseInt(month);
    
    // Check if expiry is in the future
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return false;
    }
    
    return true;
  };

  const validateCVV = (cvv) => {
    return /^\d{3,4}$/.test(cvv);
  };

  const formatCardNumber = (value) => {
    // Format as XXXX XXXX XXXX XXXX
    const cleanValue = value.replace(/\s/g, '');
    const formattedValue = cleanValue.replace(/(.{4})/g, '$1 ').trim();
    return formattedValue.slice(0, 19); // Max 19 characters (16 digits + 3 spaces)
  };

  const formatExpiryDate = (value) => {
    // Format as MM/YY
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length >= 3) {
      return cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4);
    }
    return cleanValue;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    if (!validateCardNumber(formData.cardNumber)) {
      newErrors.cardNumber = 'Valid 16-digit card number required';
    }

    if (!validateExpiryDate(formData.expiryDate)) {
      newErrors.expiryDate = 'Valid expiry date (MM/YY) required';
    }

    if (!validateCVV(formData.cvv)) {
      newErrors.cvv = 'Valid 3-4 digit CVV required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Clean card number for API call
      const cleanCardNumber = formData.cardNumber.replace(/\s/g, '');
      onRequestPayment({
        ...formData,
        cardNumber: cleanCardNumber
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-2 border-blue-400 rounded-3xl p-8 max-w-md w-full mx-auto shadow-2xl transform transition-all duration-300 scale-100">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-blue-400/20 rounded-3xl blur-xl -z-10" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-blue-300 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center border-2 border-blue-400">
            <CreditCard className="w-8 h-8 text-blue-300" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Debit / Credit Card Payment
        </h2>
        
        {/* Amount Display */}
        <div className="bg-blue-800/50 rounded-2xl p-4 mb-6 border border-blue-600/30">
          <div className="text-center">
            <p className="text-blue-300 text-sm mb-1">Amount to Pay</p>
            <p className="text-3xl font-bold text-white">
              ₹{amount.toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cardholder Name */}
          <div>
            <label className="block text-blue-300 text-sm font-medium mb-2">
              Cardholder Name
            </label>
            <input
              type="text"
              name="cardholderName"
              value={formData.cardholderName}
              onChange={handleChange}
              placeholder="John Doe"
              className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${errors.cardholderName ? 'border-red-400' : 'border-blue-400/50'} text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200`}
              disabled={isLoading}
            />
            {errors.cardholderName && (
              <p className="text-red-400 text-xs mt-1">{errors.cardholderName}</p>
            )}
          </div>
          
          {/* Card Number */}
          <div>
            <label className="block text-blue-300 text-sm font-medium mb-2">
              Card Number
            </label>
            <input
              type="text"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleChange}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${errors.cardNumber ? 'border-red-400' : 'border-blue-400/50'} text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200`}
              disabled={isLoading}
            />
            {errors.cardNumber && (
              <p className="text-red-400 text-xs mt-1">{errors.cardNumber}</p>
            )}
          </div>
          
          {/* Expiry Date and CVV - 2 Column Layout */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-300 text-sm font-medium mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                placeholder="MM/YY"
                maxLength="5"
                className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${errors.expiryDate ? 'border-red-400' : 'border-blue-400/50'} text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200`}
                disabled={isLoading}
              />
              {errors.expiryDate && (
                <p className="text-red-400 text-xs mt-1">{errors.expiryDate}</p>
              )}
            </div>
            
            <div>
              <label className="block text-blue-300 text-sm font-medium mb-2">
                CVV
              </label>
              <input
                type="text"
                name="cvv"
                value={formData.cvv}
                onChange={handleChange}
                placeholder="123"
                maxLength="4"
                className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${errors.cvv ? 'border-red-400' : 'border-blue-400/50'} text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200`}
                disabled={isLoading}
              />
              {errors.cvv && (
                <p className="text-red-400 text-xs mt-1">{errors.cvv}</p>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                'Process Payment'
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full text-blue-300 hover:text-white transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              type="button"
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
        </form>
        
        {/* Security Badge */}
        <div className="flex items-center justify-center mt-6 text-xs text-blue-300/70">
          <Shield className="w-4 h-4 mr-2" />
          Secure SSL Encryption
        </div>
      </div>
    </div>
  );
};

export default CardPaymentModal;
