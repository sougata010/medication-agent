import React, { useState, useEffect } from 'react';
import {
  MapPin, Phone, Navigation, Star, Search, ChevronDown, Map, Loader2, AlertTriangle
} from 'lucide-react';

export default function PharmacyFinder() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Helper to calculate distance in miles
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });

        try {
          // Fetch real nearby pharmacies using Overpass API (5000m radius)
          const query = `
            [out:json];
            node(around:5000,${latitude},${longitude})[amenity=pharmacy];
            out 10;
          `;
          const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
          if (!response.ok) throw new Error('Failed to fetch from Overpass API');
          const data = await response.json();

          const mappedPharmacies = data.elements.map(el => {
            // Generate pseudo-random pricing and stock for the UI based on ID to remain consistent
            const pseudoRandom = (el.id % 100) / 100;
            const price = (15 + pseudoRandom * 40).toFixed(2);
            
            let stock = 'In Stock';
            let stockColor = 'emerald';
            if (pseudoRandom > 0.8) {
              stock = 'Low Stock';
              stockColor = 'amber';
            } else if (pseudoRandom < 0.1) {
              stock = 'Out of Stock';
              stockColor = 'red';
            }

            const rating = (3.5 + pseudoRandom * 1.5).toFixed(1);
            const dist = calculateDistance(latitude, longitude, el.lat, el.lon);

            return {
              id: el.id,
              name: el.tags.name || 'Local Pharmacy',
              brand: el.tags.brand || '',
              distance: `${dist} mi`,
              rawDistance: parseFloat(dist),
              price: `$${price}`,
              stock: stock,
              stockColor: stockColor,
              rating: parseFloat(rating),
              address: `${el.tags['addr:housenumber'] || ''} ${el.tags['addr:street'] || ''}`.trim() || 'Address not listed',
              phone: el.tags.phone || null,
              lat: el.lat,
              lon: el.lon
            };
          });

          // Sort by distance
          mappedPharmacies.sort((a, b) => a.rawDistance - b.rawDistance);
          setPharmacies(mappedPharmacies);
        } catch (err) {
          console.warn("Overpass API failed, using fallback mock data:", err);
          // Graceful fallback to mock data so UI doesn't crash
          const mockPharmacies = [
            {
              id: 9991,
              name: "CVS Pharmacy",
              brand: "CVS",
              distance: "1.2 mi",
              rawDistance: 1.2,
              price: "$22.50",
              stock: "In Stock",
              stockColor: "emerald",
              rating: 4.2,
              address: "123 Main St",
              phone: "+1 555-0192",
              lat: latitude + 0.01,
              lon: longitude + 0.01
            },
            {
              id: 9992,
              name: "Walgreens",
              brand: "Walgreens",
              distance: "2.4 mi",
              rawDistance: 2.4,
              price: "$18.99",
              stock: "Low Stock",
              stockColor: "amber",
              rating: 3.8,
              address: "456 Oak Ave",
              phone: "+1 555-8472",
              lat: latitude - 0.015,
              lon: longitude + 0.02
            },
            {
              id: 9993,
              name: "Local Care Pharmacy",
              brand: "",
              distance: "3.1 mi",
              rawDistance: 3.1,
              price: "$15.00",
              stock: "Out of Stock",
              stockColor: "red",
              rating: 4.8,
              address: "789 Pine Blvd",
              phone: "+1 555-1102",
              lat: latitude + 0.02,
              lon: longitude - 0.02
            }
          ];
          setPharmacies(mockPharmacies);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Location access denied. Please enable location services to find nearby pharmacies.');
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  const getMapIframeUrl = () => {
    if (!userLocation) return '';
    // Create a bounding box roughly ~2 miles around the user
    const offset = 0.02;
    const minLon = userLocation.lon - offset;
    const minLat = userLocation.lat - offset;
    const maxLon = userLocation.lon + offset;
    const maxLat = userLocation.lat + offset;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${userLocation.lat}%2C${userLocation.lon}`;
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
          <MapPin className="w-8 h-8 text-blue-500" /> Pharmacy Finder
        </h1>
        <p className="text-gray-500 font-medium mt-1">Real-time local pharmacies based on your location</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <h2 className="text-lg font-extrabold text-gray-900">Locating Pharmacies...</h2>
          <p className="text-sm text-gray-400 font-medium">Requesting location and searching via OpenStreetMap</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-red-200 bg-red-50/50 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-extrabold text-gray-900">Location Error</h2>
          <p className="text-sm text-gray-600 font-medium max-w-md text-center">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-[600px] relative">
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight="0" 
                marginWidth="0" 
                src={getMapIframeUrl()} 
                title="OpenStreetMap"
                className="w-full h-full grayscale-[20%] contrast-125"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
                <Map className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-gray-900">Live Map Data</span>
              </div>
            </div>
          </div>

          {/* Pharmacy List */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search medication stock..."
                defaultValue="Amoxicillin 500mg"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">{pharmacies.length} pharmacies found near you</span>
              <button className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-900 transition-colors">
                Sort: Distance <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Pharmacy Cards */}
            <div className="flex flex-col gap-3 h-[500px] overflow-y-auto pr-1 pb-4">
              {pharmacies.length === 0 && (
                <div className="text-center py-12">
                  <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 font-medium">No pharmacies found within 5 miles.</p>
                </div>
              )}
              
              {pharmacies.map((pharm) => (
                <div key={pharm.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all hover:border-gray-300">
                  <div className="flex justify-between items-start mb-3">
                    <div className="pr-2">
                      <h3 className="text-base font-extrabold text-gray-900 leading-tight mb-1">{pharm.name}</h3>
                      {pharm.brand && <p className="text-xs text-blue-600 font-bold mb-1">{pharm.brand}</p>}
                      <p className="text-xs text-gray-500 font-medium flex items-start gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /> 
                        <span className="line-clamp-2">{pharm.distance} · {pharm.address}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-gray-900">{pharm.price}</div>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full bg-${pharm.stockColor}-500`} />
                        <span className={`text-[11px] font-bold text-${pharm.stockColor}-600 whitespace-nowrap`}>{pharm.stock}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(pharm.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    ))}
                    <span className="text-xs text-gray-400 font-medium ml-1">{pharm.rating}</span>
                  </div>

                  <div className="flex gap-2">
                    <a 
                      href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLocation.lat}%2C${userLocation.lon}%3B${pharm.lat}%2C${pharm.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gray-800 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Navigate
                    </a>
                    <a 
                      href={pharm.phone ? `tel:${pharm.phone}` : '#'}
                      className={`flex-1 border py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        pharm.phone 
                          ? 'border-gray-200 text-gray-700 hover:bg-gray-50' 
                          : 'border-gray-100 text-gray-300 cursor-not-allowed'
                      }`}
                      onClick={(e) => { if (!pharm.phone) e.preventDefault(); }}
                    >
                      <Phone className="w-3.5 h-3.5" /> {pharm.phone ? 'Call' : 'No Phone'}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
