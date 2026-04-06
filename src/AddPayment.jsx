import React, { useState, useCallback } from 'react';
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  Lock,
  Check,
  Loader2,
  Wallet,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from './config/api';
import { getAuthHeader } from './utils/auth';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const AddPayment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rzpLoading, setRzpLoading] = useState(false);
  const [rzpError, setRzpError] = useState('');
  const [rzpSuccess, setRzpSuccess] = useState('');
  const [amountRupees, setAmountRupees] = useState('100');

  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: '',
  });

  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === 'cardNumber') {
      value = value.replace(/\D/g, '').slice(0, 16);
    }
    if (name === 'expiry') {
      value = value.replace(/\D/g, '').slice(0, 4);
      if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (name === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 3);
    }

    setFormData({ ...formData, [name]: value });
  };

  const payWithRazorpay = useCallback(async () => {
    setRzpError('');
    setRzpSuccess('');

    if (!razorpayKey) {
      setRzpError('Add VITE_RAZORPAY_KEY_ID to your .env and restart Vite.');
      return;
    }

    const rupees = Number(amountRupees);
    if (!Number.isFinite(rupees) || rupees < 1) {
      setRzpError('Enter an amount of at least ₹1.');
      return;
    }

    setRzpLoading(true);
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk || !window.Razorpay) {
        setRzpError('Could not load Razorpay Checkout. Check your network.');
        setRzpLoading(false);
        return;
      }

      const auth = getAuthHeader();
      const orderRes = await fetch(apiUrl('/api/payments/create-order'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(auth ? { Authorization: auth } : {}),
        },
        body: JSON.stringify({
          amountRupees: rupees,
          currency: 'INR',
          receipt: `rr_pay_${Date.now()}`,
          notes: { app: 'RoadRescue' },
        }),
      });

      const orderJson = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) {
        setRzpError(orderJson.message || `Could not create order (${orderRes.status}).`);
        setRzpLoading(false);
        return;
      }

      const { order } = orderJson;
      const userRaw = localStorage.getItem('currentUser');
      const user = userRaw ? JSON.parse(userRaw) : null;

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Road Rescue',
        description: 'Payment',
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(apiUrl('/api/payments/verify'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(auth ? { Authorization: auth } : {}),
              },
              body: JSON.stringify(response),
            });
            const verifyJson = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok) {
              setRzpError(verifyJson.message || 'Verification failed.');
              return;
            }
            setRzpSuccess(`Payment successful. ID: ${verifyJson.paymentId}`);
            const history = JSON.parse(localStorage.getItem('razorpayPayments') || '[]');
            history.unshift({
              paymentId: verifyJson.paymentId,
              orderId: verifyJson.orderId,
              amountPaise: order.amount,
              at: new Date().toISOString(),
            });
            localStorage.setItem('razorpayPayments', JSON.stringify(history.slice(0, 50)));
          } catch {
            setRzpError('Verification request failed.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#0f172a' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (e) => {
        const d = e?.error;
        setRzpError(d?.description || d?.code || 'Payment failed.');
      });
      rzp.open();
    } catch {
      setRzpError('Something went wrong. Try again.');
    } finally {
      setRzpLoading(false);
    }
  }, [amountRupees, razorpayKey]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const newCard = {
      id: Date.now(),
      last4: formData.cardNumber.slice(-4) || '0000',
      holder: formData.cardHolder.toUpperCase(),
      expiry: formData.expiry,
      type: 'Visa',
    };

    const existingCards = JSON.parse(localStorage.getItem('myCards') || '[]');
    localStorage.setItem('myCards', JSON.stringify([newCard, ...existingCards]));

    setTimeout(() => {
      setLoading(false);
      navigate('/profile/user');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <Link to="/profile/user" className="p-2 hover:bg-slate-100 rounded-full transition">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Payments</h1>
      </div>

      <div className="max-w-xl mx-auto p-6 mt-8 space-y-10">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 rounded-2xl text-white">
              <Wallet size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pay with Razorpay</h2>
              <p className="text-sm text-slate-500">Secure checkout (UPI, cards, netbanking).</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Amount (INR)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {rzpError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{rzpError}</p>
          )}
          {rzpSuccess && (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              {rzpSuccess}
            </p>
          )}

          <button
            type="button"
            onClick={payWithRazorpay}
            disabled={rzpLoading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60"
          >
            {rzpLoading ? <Loader2 className="animate-spin" size={22} /> : <><CreditCard size={20} /> Pay now</>}
          </button>

          <p className="text-xs text-slate-400 leading-relaxed">
            Server needs <code className="text-slate-600">RAZORPAY_KEY_ID</code> and{' '}
            <code className="text-slate-600">RAZORPAY_KEY_SECRET</code> in <code className="text-slate-600">.env</code>.
            Client needs <code className="text-slate-600">VITE_RAZORPAY_KEY_ID</code> (same key id as dashboard).
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 px-1">
            Demo: save card locally
          </h3>
          <div className="bg-gradient-to-br from-slate-800 to-black rounded-3xl p-8 text-white shadow-2xl mb-8 relative overflow-hidden h-56 flex flex-col justify-between transform transition-all hover:scale-[1.02] duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />

            <div className="flex justify-between items-start z-10">
              <CreditCard size={32} className="text-slate-400" />
              <span className="font-bold tracking-widest text-lg italic">VISA</span>
            </div>

            <div className="z-10">
              <p className="font-mono text-2xl tracking-widest mb-6">
                {formData.cardNumber
                  ? formData.cardNumber.replace(/(.{4})/g, '$1 ').trim()
                  : '•••• •••• •••• ••••'}
              </p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Card Holder</p>
                  <p className="font-medium tracking-wide text-sm">{formData.cardHolder || 'YOUR NAME'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Expires</p>
                  <p className="font-medium tracking-wide text-sm">{formData.expiry || 'MM/YY'}</p>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6"
          >
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Card Number</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  placeholder="0000 0000 0000 0000"
                  maxLength="19"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Card Holder Name</label>
              <input
                name="cardHolder"
                value={formData.cardHolder}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition uppercase"
                placeholder="JOHN DOE"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Expiry Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input
                    name="expiry"
                    value={formData.expiry}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CVV</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input
                    name="cvv"
                    type="password"
                    value={formData.cvv}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    placeholder="123"
                    maxLength="3"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Check size={20} /> Save card (this device)</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPayment;
