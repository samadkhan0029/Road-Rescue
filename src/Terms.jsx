import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Menu, X, FileText, CheckCircle, AlertTriangle, Users, Clock, DollarSign } from 'lucide-react';

const Terms = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-blue-500 selection:text-white">
      
      {/* ================= NAVBAR ================= */}
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-2 cursor-pointer">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">RoadRescue</span>
            </Link>

            <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-300">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/services" className="hover:text-white transition-colors">Services</Link>
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-blue-400">Terms of Service</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
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
            <Link to="/privacy" className="block text-slate-300 hover:text-white py-2">Privacy Policy</Link>
            <Link to="/terms" className="block text-white font-bold py-2">Terms of Service</Link>
            <Link to="/contact" className="block text-slate-300 hover:text-white py-2">Contact</Link>
          </div>
        )}
      </nav>

      {/* ================= HEADER ================= */}
      <div className="pt-32 pb-12 text-center px-4 bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Terms of Service</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
          By using RoadRescue, you agree to these terms and conditions. Please read them carefully.
        </p>
      </div>

      {/* ================= TERMS CONTENT ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="space-y-12">
          
          {/* Acceptance of Terms */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-blue-500/10 p-3 rounded-lg text-blue-400">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Acceptance of Terms</h3>
                <p className="text-slate-400 mb-4">
                  By accessing or using RoadRescue, you accept and agree to be bound by these Terms of Service.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">User Agreement</h4>
                    <p className="text-slate-400 text-sm">Binding agreement for all users</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Effective Date</h4>
                    <p className="text-slate-400 text-sm">Terms apply upon service use</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Modifications</h4>
                    <p className="text-slate-400 text-sm">Terms may change with notice</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Continued Use</h4>
                    <p className="text-slate-400 text-sm">Acceptance binds to updated terms</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services Description */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-400">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Our Services</h3>
                <p className="text-slate-400 mb-4">
                  RoadRescue connects drivers with roadside assistance providers through our digital platform.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Connection Platform</h4>
                    <p className="text-slate-400 text-sm">Connect users with providers</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Real-time Matching</h4>
                    <p className="text-slate-400 text-sm">Instant provider notifications</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Payment Processing</h4>
                    <p className="text-slate-400 text-sm">Secure transaction handling</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Quality Assurance</h4>
                    <p className="text-slate-400 text-sm">Vetted service providers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Responsibilities */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-purple-500/10 p-3 rounded-lg text-purple-400">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">User Responsibilities</h3>
                <p className="text-slate-400 mb-4">
                  As a user of RoadRescue, you agree to use our services responsibly and in accordance with these terms.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Accurate Information</h4>
                    <p className="text-slate-400 text-sm">Provide truthful details</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Payment Obligations</h4>
                    <p className="text-slate-400 text-sm">Pay for services rendered</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Communication</h4>
                    <p className="text-slate-400 text-sm">Respond to provider requests</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Service Etiquette</h4>
                    <p className="text-slate-400 text-sm">Treat providers with respect</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Provider Responsibilities */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-blue-500/10 p-3 rounded-lg text-blue-400">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Provider Responsibilities</h3>
                <p className="text-slate-400 mb-4">
                  Service providers on our platform agree to maintain professional standards and deliver quality service.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Professional Service</h4>
                    <p className="text-slate-400 text-sm">Maintain quality standards</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Timely Response</h4>
                    <p className="text-slate-400 text-sm">Accept and respond promptly</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Fair Pricing</h4>
                    <p className="text-slate-400 text-sm">Transparent pricing structure</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Safety Compliance</h4>
                    <p className="text-slate-400 text-sm">Follow safety protocols</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Limitations and Liability */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-red-500/10 p-3 rounded-lg text-red-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Limitations and Liability</h3>
                <p className="text-slate-400 mb-4">
                  RoadRescue acts as a platform and is not liable for the services provided by independent providers.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Platform Limitation</h4>
                    <p className="text-slate-400 text-sm">Third-party service provider</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">No Warranty</h4>
                    <p className="text-slate-400 text-sm">Service quality not guaranteed</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">User Disputes</h4>
                    <p className="text-slate-400 text-sm">Direct resolution with providers</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Payment Terms</h4>
                    <p className="text-slate-400 text-sm">Between users and providers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact for Terms Questions */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Questions About Terms?</h3>
              <p className="text-slate-400 mb-6">
                If you have any questions about these Terms of Service, please don't hesitate to contact us.
              </p>
              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                <FileText size={18} />
                Contact Legal Team
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Terms;
