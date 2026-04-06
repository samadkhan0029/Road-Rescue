import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Shield, Users, Target, Menu, X, CheckCircle, Globe, Heart } from 'lucide-react';

const About = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              <Link to="/about" className="text-blue-400">About</Link>
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
            <Link to="/about" className="block text-white font-bold py-2">About</Link>
            <Link to="/contact" className="block text-slate-300 hover:text-white py-2">Contact</Link>
          </div>
        )}
      </nav>

      {/* ================= HERO HEADER ================= */}
      <div className="pt-32 pb-12 text-center px-4 bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Driving Safety Forward</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
          We are on a mission to modernize roadside assistance. No more long waits, hidden fees, or uncertainty.
        </p>
      </div>

      {/* ================= MISSION SECTION ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                    <Target size={16} /> Our Mission
                </div>
                <h2 className="text-3xl font-bold mb-6">Redefining How Help Arrives</h2>
                <p className="text-slate-400 mb-6 leading-relaxed">
                    Started in 2023, RoadRescue was born from a simple frustration: getting stuck on the side of the road with no idea when help would arrive.
                </p>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    Today, we connect thousands of drivers with a vetted network of tow truck operators and mechanics instantly. We believe safety shouldn't be a luxury—it should be a guarantee.
                </p>
            </div>
            
            <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
                <div className="relative bg-[#1e293b] border border-slate-700 rounded-2xl p-8 shadow-2xl">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Shield className="text-emerald-500" /> Why Trust Us?
                    </h3>
                    <ul className="space-y-4">
                        {[
                            "100% Verified Service Providers",
                            "Real-time GPS Tracking of Tow Trucks",
                            "Transparent Pricing (No Haggling)",
                            "24/7 Support Center",
                            "Insured and Bonded Service"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-slate-300">
                                <CheckCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* ================= VALUES GRID ================= */}
      <section className="py-20 bg-[#1e293b] border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold">Core Values</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-[#0f172a] p-8 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition duration-300">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-6">
                        <Users size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Community First</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">We aren't just an app; we are a community of drivers helping drivers. We prioritize people over profits.</p>
                </div>
                <div className="bg-[#0f172a] p-8 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition duration-300">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6">
                        <Globe size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Accessibility</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">Quality roadside assistance should be available to everyone, everywhere, at a fair price.</p>
                </div>
                <div className="bg-[#0f172a] p-8 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition duration-300">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-6">
                        <Heart size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Trust & Safety</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">Your safety is paramount. We rigorously vet every single provider on our platform.</p>
                </div>
            </div>
          </div>
      </section>

    </div>
  );
};

export default About;