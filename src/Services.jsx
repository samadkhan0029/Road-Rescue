import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Truck, Battery, Fuel, Disc, Lock, AlertTriangle, 
  CheckCircle2, ArrowRight, Phone, Menu, X, IndianRupee 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getServicePricing } from './utils/auth';

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
      staggerChildren: 0.15 // Stagger delay between cards
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: 'easeOut' } 
  }
};

const Services = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-blue-500 selection:text-white">
      
      {/* ================= NAVBAR ================= */}
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 cursor-pointer">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                <Truck className="h-6 w-6 text-blue-400" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">RoadRescue</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-300">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/services" className="text-blue-400">Services</Link>
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign In</Link>
              <Link to="/emergency" className="px-5 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all shadow-lg flex items-center gap-2">
                <AlertTriangle size={18} />
                Emergency
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-300 hover:text-white p-2">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-[#0f172a] border-b border-white/5 px-4 pt-2 pb-6 space-y-4 shadow-xl"
          >
            <Link to="/" className="block text-slate-300 hover:text-white py-2">Home</Link>
            <Link to="/services" className="block text-white font-bold py-2">Services</Link>
            <Link to="/about" className="block text-slate-300 hover:text-white py-2">About</Link>
            <Link to="/contact" className="block text-slate-300 hover:text-white py-2">Contact</Link>
          </motion.div>
        )}
      </nav>

      {/* ================= HEADER ================= */}
      <motion.div 
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="pt-36 pb-12 text-center px-4"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Professional roadside assistance available 24/7. Click on a service to learn more.
        </p>
      </motion.div>

      {/* ================= SERVICES GRID ================= */}
      <section className="py-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {servicesData.map((service, index) => {
            const priceInfo = getServicePriceInfo(service.title);
            return (
            <motion.div 
              key={index}
              variants={cardVariants}
              className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-500/10 group flex flex-col h-full"
            >
              
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${service.bg} group-hover:scale-110 transition-transform duration-300`}>
                <service.icon className={`w-7 h-7 ${service.color}`} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-3 text-white">{service.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-grow">
                {service.description}
              </p>

              {/* Pricing Information */}
              <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Base Fee:</span>
                  <span className="text-sm font-semibold text-white">{priceInfo.baseFee}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Rate:</span>
                  <span className="text-sm font-semibold text-white">{priceInfo.ratePerKm}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Minimum Fare:</span>
                  <span className="text-sm font-bold text-green-400">{priceInfo.minFare}</span>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Button - Now links to Detail Page */}
              <Link to={`/services/${service.id}`} className="w-full py-3 rounded-xl border border-slate-600 hover:bg-blue-600 hover:border-blue-600 hover:text-white text-slate-300 font-medium transition-all flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white">
                Learn More <ArrowRight size={16} />
              </Link>
            </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ================= CTA BAR ================= */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="bg-blue-600 py-16"
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Not sure what you need?</h2>
          <p className="text-blue-100 mb-8 text-lg">Call our support team directly. We'll help diagnose the issue.</p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl inline-flex items-center gap-2">
            <Phone size={20} /> Call 1-800-RESCUE
          </button>
        </div>
      </motion.section>

    </div>
  );
};

// Data Configuration (Added IDs for routing)
const servicesData = [
  {
    id: "battery-jump-start",
    title: "Battery Jump Start",
    description: "Car won't start? Our technicians verify battery health and provide a safe jump start.",
    icon: Battery,
    bg: "bg-purple-500/10",
    color: "text-purple-400",
    features: ["Battery Health Check", "Instant Jump Start", "Battery Replacement Available"]
  },
  {
    id: "fuel-delivery",
    title: "Fuel Delivery",
    description: "Ran out of gas? We deliver up to 2 gallons of fuel (gas or diesel) to get you to the station.",
    icon: Fuel,
    bg: "bg-orange-500/10",
    color: "text-orange-400",
    features: ["Gasoline & Diesel", "Fast Delivery", "System Priming"]
  },
  {
    id: "flat-tire",
    title: "Flat Tire Change",
    description: "We remove your flat tire and install your spare. No spare? We can tow you to a tire shop.",
    icon: Disc,
    bg: "bg-blue-500/10",
    color: "text-blue-400",
    features: ["Spare Tire Installation", "Air Pressure Check", "Lug Nut Torque"]
  },
  {
    id: "towing",
    title: "Towing Service",
    description: "Reliable flatbed towing for breakdowns, accidents, or moving unregistered vehicles.",
    icon: Truck,
    bg: "bg-indigo-500/10",
    color: "text-indigo-400",
    features: ["Flatbed Towing", "Long Distance", "Motorcycle Towing"]
  },
  {
    id: "lockout",
    title: "Lockout Service",
    description: "Locked keys inside? We use specialized tools to unlock your vehicle without causing damage.",
    icon: Lock,
    bg: "bg-teal-500/10",
    color: "text-teal-400",
    features: ["Damage-Free Unlocking", "Key Retrieval", "Trunk Opening"]
  },
  {
    id: "accident",
    title: "Accident Assistance",
    description: "Complete scene management including towing, police coordination, and documentation.",
    icon: AlertTriangle,
    bg: "bg-red-500/10",
    color: "text-red-400",
    features: ["Scene Safety", "Police Report Help", "Secure Storage"]
  }
];

// Helper function to get pricing for a service
const getServicePriceInfo = (title) => {
  const pricing = getServicePricing(title);
  return {
    baseFee: `₹${pricing.baseFee}`,
    ratePerKm: `₹${pricing.ratePerKm}/km`,
    minFare: `₹${pricing.minFare}`
  };
};

export default Services;