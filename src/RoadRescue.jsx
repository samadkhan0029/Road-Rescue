import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu, X, MapPin, Clock, Shield, Battery, Fuel, 
  Disc, Truck, Lock, AlertTriangle, ChevronRight, 
  Navigation, CheckCircle, Phone, Mail
} from 'lucide-react';
import { motion } from 'framer-motion';

// ================= ANIMATION VARIANTS =================
const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: 'easeOut' } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: 'easeOut' } 
  }
};

const RoadRescue = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B1121] text-white font-sans overflow-x-hidden selection:bg-blue-500 selection:text-white">
      
      {/* ================= NAVBAR ================= */}
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/5 bg-[#0B1121]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 cursor-pointer group">
              <div className="bg-slate-800 p-2 rounded-lg border border-white/10 group-hover:bg-slate-700 transition-colors">
                <Truck className="h-6 w-6 text-blue-400" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">RoadRescue</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-300">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/services" className="hover:text-white transition-colors">Services</Link>
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20">
                Get Started
              </Link>
              <Link to="/emergency" className="px-5 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20 flex items-center gap-2">
                <AlertTriangle size={16} />
                Emergency
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button className="md:hidden text-slate-300 hover:text-white" onClick={() => setIsMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-[#0B1121] border-b border-white/5 absolute w-full top-0 z-50 p-6 space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-xl">RoadRescue</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-300">
                <X size={24} />
              </button>
            </div>
            <nav className="flex flex-col space-y-4 text-center">
              <Link to="/" className="text-lg text-slate-300 hover:text-white">Home</Link>
              <Link to="/services" className="text-lg text-slate-300 hover:text-white">Services</Link>
              <Link to="/about" className="text-lg text-slate-300 hover:text-white">About</Link>
              <Link to="/contact" className="text-lg text-slate-300 hover:text-white">Contact</Link>
            </nav>
            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
              <Link to="/login" className="py-3 text-center text-slate-300">Sign In</Link>
              <Link to="/signup" className="py-3 bg-blue-600 text-center rounded-xl font-semibold">Get Started</Link>
              <Link to="/emergency" className="py-3 bg-red-600 text-center rounded-xl font-semibold flex items-center justify-center gap-2">
                <AlertTriangle size={18} /> Emergency Help
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="pt-36 pb-20 px-4 md:px-8 bg-[#0B1121] relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
          
          {/* Left - Content */}
          <div className="space-y-8 relative z-10">
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-slate-700 rounded-full text-xs font-semibold text-blue-300 uppercase tracking-wide"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              Available 24/7 • Avg. response 15 mins
            </motion.div>

            {/* Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold leading-[1.1] tracking-tight"
            >
              Roadside <br />
              Emergency? <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-200">
                Help is Minutes Away
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-xl"
            >
              Get instant access to verified service providers for any vehicle emergency. 
              GPS tracking, real-time updates, and transparent pricing.
            </motion.p>

            {/* Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                to="/emergency"
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold bg-[#EF4444] hover:bg-red-600 text-white rounded-xl shadow-xl shadow-red-900/30 transition-all duration-300 hover:scale-[1.02]"
              >
                <AlertTriangle className="mr-2 h-5 w-5" />
                Request Emergency Help
              </Link>

              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-[#1E293B] border border-slate-700 text-white hover:bg-slate-800 hover:border-slate-600 rounded-xl transition-all duration-300"
              >
                Create Account
                <ChevronRight className="ml-2 h-5 w-5 text-slate-400 group-hover:text-white" />
              </Link>
            </motion.div>
          </div>

          {/* Right - Floating Cards (No Image) */}
          <div className="relative hidden lg:block h-[500px] w-full">
            
            {/* Floating Card: GPS Tracking */}
            <motion.div 
              initial={{ opacity: 0, x: 20, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="absolute top-0 right-0 w-64 bg-[#0f172a]/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-xl z-20"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Navigation className="h-5 w-5 text-blue-400" />
                </div>
                <span className="px-2 py-1 bg-blue-500/10 text-blue-300 text-xs font-bold rounded">LIVE</span>
              </div>
              <h4 className="font-bold text-white">GPS Tracking</h4>
              <p className="text-xs text-slate-400">Real-time location tracking.</p>
            </motion.div>

            {/* Floating Card: Fast Response */}
            <motion.div 
              initial={{ opacity: 0, x: -20, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.7, type: "spring" }}
              className="absolute top-1/2 left-0 -translate-y-1/2 w-72 bg-[#0f172a]/90 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 shadow-xl z-20"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <Clock className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Fast Response</h4>
                  <p className="text-sm text-slate-400 mt-1">Guaranteed 15-minute response time.</p>
                </div>
              </div>
            </motion.div>

            {/* Floating Card: Verified Pros */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="absolute bottom-0 right-12 w-72 bg-[#0f172a]/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 shadow-xl z-20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                  <Shield className="h-5 w-5 text-slate-300" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Verified Pros</h4>
                  <p className="text-xs text-slate-400">All providers are background checked.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= SERVICES SECTION ================= */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-24 px-4 md:px-8 bg-[#0B1121]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Our Core Services</h2>
            <p className="text-slate-400 text-lg">Professional help for every roadside emergency, delivered fast and safely.</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {services.map((service, index) => (
              <motion.div 
                key={index}
                variants={cardVariants}
                className="bg-[#1E293B]/50 p-8 rounded-2xl border border-slate-800 hover:border-blue-500/50 hover:bg-[#1E293B] transition-all duration-300 group cursor-pointer"
              >
                <div className={`w-14 h-14 ${service.colorBg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <service.icon size={28} className={service.colorText} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{service.title}</h3>
                <p className="text-slate-400 mb-6 leading-relaxed">{service.desc}</p>
                <div className="flex items-center text-blue-400 font-medium group-hover:translate-x-2 transition-transform">
                  Learn More <ChevronRight size={16} className="ml-1" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ================= HOW IT WORKS SECTION ================= */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-24 px-4 md:px-8 bg-[#0f172a]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How RoadRescue Works</h2>
            <p className="text-slate-400 text-lg">Simple steps to get you back on the road safely.</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-4 gap-8 relative"
          >
             {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-900 via-blue-500 to-blue-900 opacity-20" />

            {[
              { step: 1, title: "Request Help", desc: "Share your location via app.", icon: MapPin },
              { step: 2, title: "Match Provider", desc: "Instant connection to nearby pros.", icon: Navigation },
              { step: 3, title: "Track in Real-Time", desc: "See your rescuer's ETA.", icon: Clock },
              { step: 4, title: "Get Rescued", desc: "Back on the road safely.", icon: CheckCircle }
            ].map((item, index) => (
              <motion.div 
                key={index} 
                variants={cardVariants}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 bg-[#0B1121] border-4 border-[#1E293B] rounded-full flex items-center justify-center mb-6 shadow-xl">
                  <item.icon size={32} className="text-blue-400" />
                </div>
                <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700 w-full hover:-translate-y-2 transition-transform duration-300">
                    <div className="text-blue-500 font-bold mb-2">Step 0{item.step}</div>
                    <h3 className="font-bold text-xl mb-2 text-white">{item.title}</h3>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ================= CTA BOTTOM ================= */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-20 px-4 md:px-8"
      >
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-900 to-blue-800 rounded-3xl p-10 md:p-16 text-center shadow-2xl shadow-blue-900/40 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            
            <div className="relative z-10 space-y-8">
                <h2 className="text-3xl md:text-5xl font-bold text-white">Ready to Drive with Peace of Mind?</h2>
                <p className="text-blue-100 text-lg max-w-2xl mx-auto">Join thousands of drivers who trust RoadRescue for fast, reliable, and transparent roadside assistance.</p>
                <motion.div 
                  variants={cardVariants}
                  className="flex flex-col sm:flex-row justify-center gap-4"
                >
                    <Link to="/signup" className="px-8 py-4 bg-white text-blue-900 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg">
                    Create Free Account
                    </Link>
                    <Link to="/emergency" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-colors">
                    Emergency Help
                    </Link>
                </motion.div>
            </div>
        </div>
      </motion.section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#0f172a] border-t border-white/5 pt-16 pb-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600/20 p-2 rounded-lg">
                        <Truck className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="font-bold text-xl text-white">RoadRescue</span>
                </div>
                <p className="text-slate-400 leading-relaxed">Your trusted partner for roadside assistance, providing safety and reliability anywhere, anytime.</p>
            </div>
            <div>
                <h4 className="text-white font-bold mb-6">Quick Links</h4>
                <ul className="space-y-3 text-slate-400">
                    <li><Link to="/services" className="hover:text-blue-400 transition-colors">Services</Link></li>
                    <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                    <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact</Link></li>
                    <li><Link to="/emergency" className="hover:text-red-400 transition-colors">Emergency</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="text-white font-bold mb-6">Legal</h4>
                <ul className="space-y-3 text-slate-400">
                    <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                    <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                    <li><Link to="/cookie" className="hover:text-blue-400 transition-colors">Cookie Policy</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="text-white font-bold mb-6">Contact</h4>
                <ul className="space-y-4 text-slate-400">
                    <li className="flex items-center gap-3">
                        <Phone size={18} className="text-blue-500" />
                        <span>1-800-RESCUE-24</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <Mail size={18} className="text-blue-500" />
                        <span>help@roadrescue.com</span>
                    </li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} RoadRescue Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

// Data Arrays
const services = [
  { title: "Battery Jump Start", desc: "Dead battery? We'll get you running in minutes.", icon: Battery, colorBg: "bg-purple-500/10", colorText: "text-purple-400" },
  { title: "Fuel Delivery", desc: "Run out of gas? We'll deliver fuel directly to you.", icon: Fuel, colorBg: "bg-orange-500/10", colorText: "text-orange-400" },
  { title: "Flat Tire Change", desc: "Got a puncture? We swap your tire safely.", icon: Disc, colorBg: "bg-blue-500/10", colorText: "text-blue-400" },
  { title: "Towing Service", desc: "Transport to the nearest garage safely.", icon: Truck, colorBg: "bg-indigo-500/10", colorText: "text-indigo-400" },
  { title: "Lockout Service", desc: "Locked out? We get you back in damage-free.", icon: Lock, colorBg: "bg-teal-500/10", colorText: "text-teal-400" },
  { title: "Accident Help", desc: "Emergency response and coordination.", icon: AlertTriangle, colorBg: "bg-red-500/10", colorText: "text-red-400" }
];

export default RoadRescue;