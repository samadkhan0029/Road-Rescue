import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, Clock, Star, 
  Battery, Fuel, Disc, Truck, Lock, AlertTriangle, Menu, X 
} from 'lucide-react';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const service = servicesDetailData[id];

  useEffect(() => {
    if (!service) navigate('/services');
  }, [id, service, navigate]);

  if (!service) return null;

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
              <Link to="/services" className="text-blue-400">Services</Link>
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link to="/emergency" className="px-5 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all shadow-lg flex items-center gap-2">
                <AlertTriangle size={18} />
                Emergency
              </Link>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-300 hover:text-white p-2">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden bg-[#0f172a] border-b border-white/5 px-4 pt-2 pb-6 space-y-4">
            <Link to="/" className="block text-slate-300 hover:text-white py-2">Home</Link>
            <Link to="/services" className="block text-white font-bold py-2">Services</Link>
            <Link to="/about" className="block text-slate-300 hover:text-white py-2">About</Link>
            <Link to="/contact" className="block text-slate-300 hover:text-white py-2">Contact</Link>
          </div>
        )}
      </nav>

      {/* ================= HERO SECTION ================= */}
      <div className={`relative pt-32 pb-20 overflow-hidden`}>
        {/* Background Glow */}
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] ${service.glowColor} rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/3 pointer-events-none`}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/services" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft size={18} className="mr-2" /> Back to Services
          </Link>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
                <div className={`w-16 h-16 rounded-2xl ${service.iconBg} flex items-center justify-center mb-6`}>
                    <service.icon className={`w-8 h-8 ${service.iconColor}`} />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6">{service.title}</h1>
                <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
                    {service.longDesc}
                </p>
                <div className="flex items-center gap-6 text-sm font-medium text-slate-300">
                    <div className="flex items-center gap-2">
                        <Clock className="text-blue-400" size={18} /> Avg. {service.time}
                    </div>
                    <div className="flex items-center gap-2">
                        <Star className="text-yellow-400" size={18} /> {service.rating} Rating
                    </div>
                </div>
            </div>

            {/* CTA Card */}
            <div className="bg-[#1e293b] border border-slate-700 p-8 rounded-3xl shadow-2xl">
                <h3 className="text-2xl font-bold mb-2">Need {service.title}?</h3>
                <p className="text-slate-400 mb-8 text-sm">Our providers are nearby and ready to help immediately.</p>
                
                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-3 border-b border-slate-700">
                        <span className="text-slate-300">Arrival Estimate</span>
                        <span className="font-bold text-white">{service.time}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-700">
                        <span className="text-slate-300">Starting Price</span>
                        <span className="font-bold text-white">{service.price}</span>
                    </div>
                </div>

                <Link to="/emergency" className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2">
                    <AlertTriangle size={18} /> Request Help Now
                </Link>
                <p className="text-center text-xs text-slate-500 mt-4">No subscription required. Pay per service.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= DETAILS SECTION ================= */}
      <section className="py-20 bg-[#1e293b] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16">
                <div>
                    <h3 className="text-2xl font-bold mb-6">What's Included</h3>
                    <ul className="space-y-4">
                        {service.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <CheckCircle2 className="text-emerald-500 mt-1 shrink-0" size={20} />
                                <span className="text-slate-300">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="text-2xl font-bold mb-6">How It Works</h3>
                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-sm font-bold text-blue-400">1</div>
                                <div className="w-0.5 h-full bg-slate-700 mt-2"></div>
                            </div>
                            <div className="pb-8">
                                <h4 className="font-bold text-white mb-2">Request Service</h4>
                                <p className="text-slate-400 text-sm">Tap the request button and share your location. We'll match you with the nearest pro.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-sm font-bold text-blue-400">2</div>
                                <div className="w-0.5 h-full bg-slate-700 mt-2"></div>
                            </div>
                            <div className="pb-8">
                                <h4 className="font-bold text-white mb-2">Track Arrival</h4>
                                <p className="text-slate-400 text-sm">Watch your technician arrive in real-time on our GPS map.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-sm font-bold text-emerald-400">3</div>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-2">Back on the Road</h4>
                                <p className="text-slate-400 text-sm">Your provider fixes the issue. Pay securely through the app.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

    </div>
  );
};

// --- UPDATED DATA DICTIONARY WITH RUPEES ---
const servicesDetailData = {
  "battery-jump-start": {
    title: "Battery Jump Start",
    icon: Battery,
    longDesc: "Car won't start? The clicking sound of a dead battery is stressful. Our technicians arrive with professional-grade jumper packs to get your engine running safely in minutes, without risking damage to your vehicle's electronics.",
    time: "15-20 mins",
    rating: "4.9",
    price: "₹500 - ₹800",
    glowColor: "bg-purple-600",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    features: [
        "Battery health diagnostic check",
        "Safe jump start for all vehicle types",
        "Alternator charging verification",
        "No-contact payment available"
    ]
  },
  "fuel-delivery": {
    title: "Fuel Delivery",
    icon: Fuel,
    longDesc: "Running on empty happens to the best of us. Don't walk down a dangerous highway. We deliver up to 5 liters of petrol or diesel directly to your location to get you to the nearest pump.",
    time: "20-30 mins",
    rating: "4.8",
    price: "₹400 + Fuel Cost",
    glowColor: "bg-orange-600",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
    features: [
        "Delivery of Petrol or Diesel",
        "System priming for diesel engines",
        "Safe roadside refueling protocols",
        "Fast arrival to highway locations"
    ]
  },
  "flat-tire": {
    title: "Flat Tire Change",
    icon: Disc,
    longDesc: "A flat tire shouldn't ruin your day. Whether you have a spare that needs installing or need a tow to a tire shop, our providers handle the heavy lifting and dangerous roadside work so you stay safe.",
    time: "25-35 mins",
    rating: "4.9",
    price: "₹600 - ₹900",
    glowColor: "bg-blue-600",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    features: [
        "Spare tire installation",
        "Lug nut torque verification",
        "Air pressure check on all tires",
        "Tow to shop if spare is missing/damaged"
    ]
  },
  "towing": {
    title: "Towing Service",
    icon: Truck,
    longDesc: "From mechanical failures to accidents, sometimes you just need a lift. Our fleet includes flatbed and wheel-lift trucks to safely transport your vehicle to your home, a mechanic, or a storage facility.",
    time: "30-45 mins",
    rating: "4.7",
    price: "₹1,200 + ₹40/km",
    glowColor: "bg-indigo-600",
    iconBg: "bg-indigo-500/20",
    iconColor: "text-indigo-400",
    features: [
        "Flatbed towing for AWD/4WD vehicles",
        "Accident recovery",
        "Long-distance transport available",
        "Motorcycle towing capability"
    ]
  },
  "lockout": {
    title: "Lockout Service",
    icon: Lock,
    longDesc: "Keys locked inside? It's frustrating, but we can help. Our providers use specialized automotive tools to unlock your door quickly without scratching your paint or damaging your weather stripping.",
    time: "15-25 mins",
    rating: "4.9",
    price: "₹800 - ₹1,200",
    glowColor: "bg-teal-600",
    iconBg: "bg-teal-500/20",
    iconColor: "text-teal-400",
    features: [
        "Damage-free door unlocking",
        "Trunk opening",
        "Key retrieval",
        "Proof of ownership verification for security"
    ]
  },
  "accident": {
    title: "Accident Assistance",
    icon: AlertTriangle,
    longDesc: "Accidents are scary. We handle the logistics so you can focus on safety. We coordinate with police, secure the scene, and tow your vehicle to a body shop or impound lot as required.",
    time: "Priority Dispatch",
    rating: "5.0",
    price: "Insurance / Quote",
    glowColor: "bg-red-600",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    features: [
        "Priority emergency dispatch",
        "Scene safety management",
        "Insurance paperwork assistance",
        "Secure vehicle storage"
    ]
  }
};

export default ServiceDetail;