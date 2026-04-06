import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Menu, X, Lock, Eye, Cookie, Settings, Clock, CheckCircle } from 'lucide-react';

const CookiePolicy = () => {
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
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/cookie" className="text-blue-400">Cookie Policy</Link>
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
            <Link to="/terms" className="block text-slate-300 hover:text-white py-2">Terms of Service</Link>
            <Link to="/cookie" className="block text-white font-bold py-2">Cookie Policy</Link>
            <Link to="/contact" className="block text-slate-300 hover:text-white py-2">Contact</Link>
          </div>
        )}
      </nav>

      {/* ================= HEADER ================= */}
      <div className="pt-32 pb-12 text-center px-4 bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Cookie Policy</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
          This Cookie Policy explains how RoadRescue uses cookies and similar technologies to recognize you when you visit our service.
        </p>
      </div>

      {/* ================= COOKIE CONTENT ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="space-y-12">
          
          {/* What Are Cookies */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-blue-500/10 p-3 rounded-lg text-blue-400">
                <Cookie size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">What Are Cookies?</h3>
                <p className="text-slate-400 mb-4">
                  Cookies are small text files that are stored on your device when you visit websites. They help us remember your preferences and improve your experience.
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
                    <h4 className="font-semibold text-white mb-2">Session Cookies</h4>
                    <p className="text-slate-400 text-sm">Maintain login state</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Settings size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Preference Cookies</h4>
                    <p className="text-slate-400 text-sm">Remember your choices</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Analytics Cookies</h4>
                    <p className="text-slate-400 text-sm">Track usage patterns</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Security Cookies</h4>
                    <p className="text-slate-400 text-sm">Protect your account</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How We Use Cookies */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-400">
                <Eye size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">How We Use Cookies</h3>
                <p className="text-slate-400 mb-4">
                  We use cookies to enhance your experience, analyze usage, and provide personalized content.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Essential Cookies</h4>
                    <p className="text-slate-400 text-sm">Required for basic functionality</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <Settings size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Performance Cookies</h4>
                    <p className="text-slate-400 text-sm">Optimize app performance</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <Eye size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Functional Cookies</h4>
                    <p className="text-slate-400 text-sm">Enable features and preferences</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Analytics Cookies</h4>
                    <p className="text-slate-400 text-sm">Understand user behavior</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cookie Management */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-purple-500/10 p-3 rounded-lg text-purple-400">
                <Settings size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Managing Your Cookies</h3>
                <p className="text-slate-400 mb-4">
                  You can control how cookies are used on your device through your browser settings.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <Eye size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">View Cookies</h4>
                    <p className="text-slate-400 text-sm">See stored cookies</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Delete Cookies</h4>
                    <p className="text-slate-400 text-sm">Remove stored data</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <Settings size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Browser Settings</h4>
                    <p className="text-slate-400 text-sm">Configure cookie preferences</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Cookie Consent</h4>
                    <p className="text-slate-400 text-sm">Choose what to accept</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Third-Party Cookies */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-blue-500/10 p-3 rounded-lg text-blue-400">
                <Cookie size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Third-Party Cookies</h3>
                <p className="text-slate-400 mb-4">
                  We may use third-party services that set their own cookies for analytics and advertising.
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
                    <h4 className="font-semibold text-white mb-2">Google Analytics</h4>
                    <p className="text-slate-400 text-sm">Website usage analytics</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Settings size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Social Media</h4>
                    <p className="text-slate-400 text-sm">Social platform integration</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Advertising Partners</h4>
                    <p className="text-slate-400 text-sm">Targeted ad delivery</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Data Sharing</h4>
                    <p className="text-slate-400 text-sm">Limited, anonymized sharing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cookie Updates */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-400">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Cookie Policy Updates</h3>
                <p className="text-slate-400 mb-4">
                  We may update this Cookie Policy from time to time to reflect changes in our practices.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Regular Reviews</h4>
                    <p className="text-slate-400 text-sm">Policy assessment and updates</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <Eye size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">User Notifications</h4>
                    <p className="text-slate-400 text-sm">Inform about policy changes</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <Settings size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Compliance Updates</h4>
                    <p className="text-slate-400 text-sm">Regulatory requirement changes</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Effective Date</h4>
                    <p className="text-slate-400 text-sm">Changes apply immediately</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact for Cookie Questions */}
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Questions About Cookies?</h3>
              <p className="text-slate-400 mb-6">
                If you have any questions about our use of cookies or this Cookie Policy, please don't hesitate to contact us.
              </p>
              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Cookie size={18} />
                Contact Privacy Team
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default CookiePolicy;
