import { Link } from 'react-router-dom'


export default function Home() {
return (
<section className="bg-gradient-to-br from-primary to-slate-800 text-white">
<div className="max-w-7xl mx-auto px-6 py-28 grid md:grid-cols-2 gap-12 items-center">
<div>
<h1 className="text-4xl md:text-5xl font-bold leading-tight">
Fast & Reliable <span className="text-accent">Roadside Assistance</span>
</h1>
<p className="mt-6 text-lg text-slate-200">
roadrescue provides 24/7 emergency support for breakdowns, towing,
fuel delivery, and on-road emergencies.
</p>
<div className="mt-8 flex gap-4">
<Link
to="/services"
className="bg-accent text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90"
>
Our Services
</Link>
<Link
to="/contact"
className="border border-white px-6 py-3 rounded-xl hover:bg-white hover:text-primary transition"
>
Contact Us
</Link>
</div>
</div>
<div className="hidden md:block">
<img
src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c1"
alt="Road assistance"
className="rounded-2xl shadow-xl"
/>
</div>
</div>
</section>
)
}