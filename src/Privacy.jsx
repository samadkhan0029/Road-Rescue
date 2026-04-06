import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Menu, X, FileText, Lock, Eye, Database, UserCheck } from 'lucide-react';

const Privacy = () => {
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
              <Link to="/privacy" className="text-blue-400">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
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
            <Link to="/privacy" className="block text-white font-bold py-2">Privacy Policy</Link>
            <Link to="/terms" className="block text-slate-300 hover:text-white py-2">Terms of Service</Link>
            <Link to="/contact" className="block text-slate-300 hover:text-white py-2">Contact</Link>
          </div>
        )}
      </nav>

      {/* ================= HEADER ================= */}
      <div className="pt-32 pb-12 text-center px-4 bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Privacy Policy</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
          Your privacy is important to us. This policy outlines how we collect, use, and protect your information.
        </p>
      </div>

      {/* ================= PRIVACY CONTENT ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="space-y-12">
          
          {/* Information We Collect */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-blue-500/10 p-3 rounded-lg text-blue-400">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Information We Collect</h3>
                <p className="text-slate-400 mb-4">
                  We collect information you provide directly to us, such as when you create an account, request services, or contact us.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Personal Information</h4>
                    <p className="text-slate-400 text-sm">Name, email, phone number, address</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Service Information</h4>
                    <p className="text-slate-400 text-sm">Service requests, location data, vehicle details</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Eye size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Usage Data</h4>
                    <p className="text-slate-400 text-sm">App usage, interaction patterns, preferences</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Technical Data</h4>
                    <p className="text-slate-400 text-sm">IP address, device info, browser type</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How We Use Information */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-400">
                <Eye size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h3>
                <p className="text-slate-400 mb-4">
                  We use your information to provide, maintain, and improve our services, and to communicate with you.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Service Delivery</h4>
                    <p className="text-slate-400 text-sm">Connect you with service providers</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Communication</h4>
                    <p className="text-slate-400 text-sm">Send updates and support messages</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <Database size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Analytics</h4>
                    <p className="text-slate-400 text-sm">Improve our services and user experience</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Legal Compliance</h4>
                    <p className="text-slate-400 text-sm">Meet legal and regulatory requirements</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Protection */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-purple-500/10 p-3 rounded-lg text-purple-400">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Data Protection</h3>
                <p className="text-slate-400 mb-4">
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Encryption</h4>
                    <p className="text-slate-400 text-sm">SSL/TLS encryption for data transmission</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <Database size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Access Control</h4>
                    <p className="text-slate-400 text-sm">Restricted access to personal data</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <Eye size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Regular Audits</h4>
                    <p className="text-slate-400 text-sm">Security assessments and updates</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Data Minimization</h4>
                    <p className="text-slate-400 text-sm">Collect only necessary information</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Your Rights */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-blue-500/10 p-3 rounded-lg text-blue-400">
                <UserCheck size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Your Rights</h3>
                <p className="text-slate-400 mb-4">
                  You have the right to access, update, and delete your personal information, as well as control how it's used.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Eye size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Access & Review</h4>
                    <p className="text-slate-400 text-sm">View and correct your data anytime</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Data Portability</h4>
                    <p className="text-slate-400 text-sm">Transfer data to other services</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Database size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Opt-out Options</h4>
                    <p className="text-slate-400 text-sm">Control marketing communications</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Account Deletion</h4>
                    <p className="text-slate-400 text-sm">Request permanent data removal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact for Privacy Questions */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Questions About Privacy?</h3>
              <p className="text-slate-400 mb-6">
                If you have any questions about this Privacy Policy or how we handle your data, please don't hesitate to contact us.
              </p>
              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                <FileText size={18} />
                Contact Privacy Team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;
