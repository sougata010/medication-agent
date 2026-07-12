import React from 'react';
import {
  MapPin, Phone, Navigation, Clock, Star, Search, ChevronDown
} from 'lucide-react';

export default function PharmacyFinder() {
  const pharmacies = [
    { name: 'Walgreens Pharmacy', distance: '0.8 mi', price: '$45.00', stock: 'In Stock', stockColor: 'emerald', rating: 4.5, address: '123 Main St, Suite 100' },
    { name: 'CVS Pharmacy', distance: '1.2 mi', price: '$48.00', stock: 'In Stock', stockColor: 'emerald', rating: 4.2, address: '456 Oak Ave' },
    { name: 'Rite Aid', distance: '2.5 mi', price: '$52.00', stock: 'Low Stock', stockColor: 'amber', rating: 3.8, address: '789 Elm Blvd' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Pharmacy Finder</h1>
        <p className="text-gray-500 font-medium mt-1">Compare prices and availability nearby</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-[500px] relative">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCGpr0wYc1Lxgg-2Th1CbEC3R7r-oxTwpdvWbSs_GB76hO0iODgZs0nH_dk40am-yVy5LUKh8PuI8OUpPRynP6-B7r-Nl6wDWi6Q46RMivo5roJYkjRAftIE0mvjj6oJikvlKaLfb2IYi23JT6ibCC50V-NaBX1varANbFsryaZufo_rrlx2O7lgN5Frhh7vI6H-ZagUIo4VgXgAyA_JABt42h9TkYto5K0BzOWV31fCV_KJBzDNpYGf6XMcO_p9UMbzyonDhNDhkw')" }}
            />
            {/* Map Pins */}
            {[
              { top: '30%', left: '40%', price: '$45', active: true },
              { top: '50%', left: '20%', price: '$52', active: false },
              { top: '60%', left: '70%', price: '$48', active: false },
            ].map((pin, i) => (
              <div key={i} className={`absolute flex flex-col items-center cursor-pointer transition-transform hover:scale-110`} style={{ top: pin.top, left: pin.left }}>
                <div className={`px-2 py-1 rounded-md text-xs font-bold mb-1 shadow-sm ${pin.active ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
                  {pin.price}
                </div>
                <MapPin className={`w-6 h-6 ${pin.active ? 'text-gray-900' : 'text-gray-400'}`} fill={pin.active ? '#111827' : 'none'} />
              </div>
            ))}
          </div>
        </div>

        {/* Pharmacy List */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search medications..."
              defaultValue="Amoxicillin 500mg"
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">{pharmacies.length} pharmacies found</span>
            <button className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-900 transition-colors">
              Sort: Price <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Pharmacy Cards */}
          <div className="flex flex-col gap-3">
            {pharmacies.map((pharm, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">{pharm.name}</h3>
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {pharm.distance} · {pharm.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-gray-900">{pharm.price}</div>
                    <div className={`flex items-center gap-1 justify-end mt-0.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full bg-${pharm.stockColor}-500`} />
                      <span className={`text-[11px] font-bold text-${pharm.stockColor}-600`}>{pharm.stock}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(pharm.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                  ))}
                  <span className="text-xs text-gray-400 font-medium ml-1">{pharm.rating}</span>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gray-800 transition-colors">
                    <Navigation className="w-3.5 h-3.5" /> Navigate
                  </button>
                  <button className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
