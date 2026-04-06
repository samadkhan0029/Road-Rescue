import React, { useState, useEffect } from 'react';
import { Star, Phone, ArrowLeft, Loader2, MapPin } from 'lucide-react';
import { apiUrl } from '../config/api';

const ProviderList = ({ serviceType, userLocation, onProviderSelect, onBack }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch(apiUrl('/providers/search'));
        const data = await response.json();

        if (data.success && data.providers) {
          let filtered = data.providers.filter(
            (p) =>
              p.services &&
              p.services.some((s) => s.toLowerCase().includes(serviceType.toLowerCase()))
          );

          // Sort by proximity if user location is available
          if (userLocation?.lat != null && userLocation?.lng != null) {
            const haversineKm = (lat1, lng1, lat2, lng2) => {
              const R = 6371;
              const toRad = (v) => (v * Math.PI) / 180;
              const dLat = toRad(lat2 - lat1);
              const dLng = toRad(lng2 - lng1);
              const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) *
                  Math.cos(toRad(lat2)) *
                  Math.sin(dLng / 2) ** 2;
              return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            };

            filtered = filtered
              .map((p) => {
                const loc = p.location?.coordinates;
                const distance =
                  loc && loc.length === 2
                    ? haversineKm(
                        userLocation.lat,
                        userLocation.lng,
                        loc[1],
                        loc[0]
                      )
                    : null;
                return { ...p, distance };
              })
              .sort((a, b) => {
                if (a.distance != null && b.distance != null) return a.distance - b.distance;
                if (a.distance != null) return -1;
                if (b.distance != null) return 1;
                return 0;
              });
          }

          setProviders(filtered);
        } else {
          setError(data.error || 'Failed to load providers');
        }
      } catch {
        setError('Unable to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [serviceType, userLocation]);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onBack} />
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-slate-600 rounded-3xl p-6 max-w-lg w-full mx-auto shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-slate-700/10 rounded-3xl blur-xl -z-10" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-white">Available Providers</h2>
          <span className="ml-auto bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full">
            {serviceType}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 size={32} className="animate-spin mb-3" />
            <span>Loading providers...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-300 text-center">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && providers.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <MapPin size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-semibold">No providers available</p>
            <p className="text-sm mt-1">Try again or select a different service</p>
          </div>
        )}

        {/* Provider list */}
        {!loading && providers.length > 0 && (
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {providers.map((provider) => (
              <button
                key={provider._id}
                onClick={() => onProviderSelect(provider)}
                className="w-full bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600/40 rounded-2xl p-4 text-left transition-colors duration-200 flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-12 h-12 bg-emerald-600/30 rounded-full flex items-center justify-center border-2 border-emerald-500/50 text-lg font-bold text-emerald-300 flex-shrink-0">
                  {(provider.name || 'P')
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{provider.name || 'Provider'}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Star size={12} fill="currentColor" />
                      {provider.providerInfo?.rating ?? provider.rating ?? '—'}
                    </span>
                    {provider.distance != null && (
                      <span className="text-slate-400">{provider.distance.toFixed(1)} km</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(provider.services || []).slice(0, 3).map((s, i) => (
                      <span
                        key={i}
                        className="text-xs bg-slate-600/60 text-slate-300 px-2 py-0.5 rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Phone */}
                {provider.phone && (
                  <div className="p-2 bg-slate-600/40 rounded-lg text-slate-400 flex-shrink-0">
                    <Phone size={16} />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderList;
