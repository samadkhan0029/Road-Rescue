import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ShieldCheck, Battery, Fuel, Wrench, Truck, Key, AlertTriangle } from 'lucide-react';

const Home = () => {
  return (
    <div className="pt-20 font-sans text-primary">
      <section className="bg-primary text-white py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block bg-white/10 px-4 py-1 rounded-full text-sm">Available 24/7 • Avg response: 15 mins</div>
            <h1 className="text-5xl font-extrabold leading-tight">Roadside Emergency?<br /><span className="text-blue-400">Help is Minutes Away</span></h1>
            <p className="text-lg text-gray-300">Get instant access to verified service providers for any vehicle emergency.</p>
            <div className="flex gap-4">
              <Link to="/emergency" className="bg-accent px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition">Request Emergency Help</Link>
              <Link to="/register" className="border-2 border-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-primary transition">Create Account</Link>
            </div>
          </div>
          <div className="hidden md:block relative h-64">
             <div className="absolute top-0 right-10 bg-white/10 p-6 rounded-2xl w-64 border border-white/20">
                <Clock className="w-8 h-8 text-green-400 mb-2" />
                <h3 className="font-bold">Fast Response</h3>
                <p className="text-sm text-gray-300">15-minute avg response time.</p>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};
export default Home;