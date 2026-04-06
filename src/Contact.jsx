import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Mail, Phone, MapPin, Send, Menu, X, Loader2 } from 'lucide-react';
import { apiUrl } from './config/api';

const Contact = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.target);
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    try {
      const response = await fetch(apiUrl('/contact'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        alert("Message sent successfully! We'll get back to you shortly.");
        e.target.reset();
      } else {
        alert(result.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error('Contact form error:', error);
      alert("Failed to send message. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-blue-500 selection:text-white">
      
      {/* ================= NAVBAR ================= */}
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-2 cursor-pointer">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                <Truck className="h-6 w-6 text-blue-400" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">RoadRescue</span>
            </Link>

            <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-300">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/services" className="hover:text-white transition-colors">Services</Link>
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/contact" className="text-blue-400">Contact</Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign In</Link>
              <Link to="/signup" className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20">
                Get Started
              </Link>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-300 hover:text-white p-2">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#0f172a] border-b border-white/5 px-4 pt-2 pb-6 space-y-4">
            <Link to="/" className="block text-slate-300 hover:text-white py-2">Home</Link>
            <Link to="/services" className="block text-slate-300 hover:text-white py-2">Services</Link>
            <Link to="/about" className="block text-slate-300 hover:text-white py-2">About</Link>
            <Link to="/contact" className="block text-white font-bold py-2">Contact</Link>
          </div>
        )}
      </nav>

      {/* ================= HEADER ================= */}
      <div className="pt-32 pb-12 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
        <p className="text-slate-400 max-w-xl mx-auto text-lg">
          Have a question about our services? Need business partnership info? We're here to help.
        </p>
      </div>

      {/* ================= CONTACT FORM SECTION ================= */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20">
        <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Contact Info Card */}
            <div className="space-y-8">
                <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700">
                    <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-500/10 p-3 rounded-lg text-blue-400">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h5 className="font-semibold text-white">Email Us</h5>
                                <p className="text-slate-400 text-sm mt-1">samadkhan@roadrescue.com</p>
                                <p className="text-slate-400 text-sm">Ayaankhan@roadrescue.com</p>
                                <p className="text-slate-400 text-sm">jiyasachdev@roadrescue.com</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-400">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h5 className="font-semibold text-white">Call Us</h5>
                                <p className="text-slate-400 text-sm mt-1">9819976792</p>
                                <p className="text-slate-400 text-sm">8108559831</p>
                                <p className="text-slate-400 text-sm">7972551681</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Information Section */}
                <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-6 mt-6">
                    <h3 className="text-2xl font-bold text-white mb-6">Business Hours</h3>
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-500/10 p-3 rounded-lg text-blue-400">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h5 className="font-semibold text-white">Business Hours</h5>
                                <div className="space-y-2 mt-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Monday - Friday:</span>
                                        <span className="font-semibold text-white">9:00 AM - 8:00 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Saturday:</span>
                                        <span className="font-semibold text-white">10:00 AM - 6:00 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Sunday:</span>
                                        <span className="font-semibold text-white">Emergency Services Only</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-400">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h5 className="font-semibold text-white">24/7 Emergency Support</h5>
                                <p className="text-slate-400 text-sm mt-1">For immediate roadside assistance, call our emergency hotline anytime. We're here to help you 24 hours a day, 7 days a week.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white text-slate-900 p-8 md:p-10 rounded-3xl shadow-2xl">
                <h3 className="text-2xl font-bold mb-6">Send us a Message</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                            <input type="text" name="firstName" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" placeholder="John" required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                            <input type="text" name="lastName" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" placeholder="Doe" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                        <input type="email" name="email" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" placeholder="you@company.com" required />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                        <select name="subject" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition">
                            <option>General Inquiry</option>
                            <option>Business Partnership</option>
                            <option>Provider Support</option>
                            <option>Billing Issue</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                        <textarea name="message" rows="4" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none" placeholder="How can we help you?" required></textarea>
                    </div>

                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl shadow-blue-500/20 transition flex items-center justify-center gap-2">
                        {submitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Send Message</>}
                    </button>
                </form>
            </div>
        </div>
      </section>

    </div>
  );
};

export default Contact;