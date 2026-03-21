import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, MapPin, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: string;
  initialCoordinates?: [number, number] | null;
  onSave: (address: string, coordinates?: [number, number]) => void;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

function LocationMarker({ position, setPosition, onLocationSelect }: { position: [number, number], setPosition: (pos: [number, number]) => void, onLocationSelect: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
          map.flyTo(pos, map.getZoom());
          onLocationSelect(pos.lat, pos.lng);
        }
      },
    }),
    [setPosition, onLocationSelect, map],
  );

  return (
    <Marker 
      draggable={true}
      eventHandlers={eventHandlers}
      position={position} 
      ref={markerRef}
    />
  );
}

export function AddressModal({ isOpen, onClose, currentAddress, initialCoordinates, onSave }: AddressModalProps) {
  const [addressInput, setAddressInput] = useState(currentAddress);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<[number, number]>(initialCoordinates || [40.7128, -74.0060]); // Default to NYC
  const [isLocating, setIsLocating] = useState(false);

  const skipGeocodeRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setAddressInput(currentAddress);
      if (initialCoordinates) {
        setPosition(initialCoordinates);
      }
      setError(null);
    }
  }, [isOpen, currentAddress, initialCoordinates]);

  useEffect(() => {
    if (!addressInput.trim() || isLocating) return;
    if (skipGeocodeRef.current) {
      skipGeocodeRef.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput)}`);
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          setPosition([parseFloat(lat), parseFloat(lon)]);
        }
      } catch (error) {
        console.error("Error geocoding address:", error);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [addressInput, isLocating]);

  const validateAddress = (addr: string) => {
    const trimmed = addr.trim();
    if (!trimmed) return "Address cannot be empty.";
    if (trimmed.length < 10) return "Address is too short. Please enter a complete address.";
    
    // Check for building/house number
    if (!/\d/.test(trimmed)) return "Address must include a building or house number.";
    
    // Check for street name (letters)
    if (!/[a-zA-Z]/.test(trimmed)) return "Address must include a street name.";
    
    // Check for multiple words to ensure a complete address
    const words = trimmed.split(/\s+/);
    if (words.length < 3) return "Address seems incomplete. Please include building number, street name, and city/area.";

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateAddress(addressInput);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    onSave(addressInput.trim(), position);
    onClose();
  };

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        skipGeocodeRef.current = true;
        setAddressInput(data.display_name);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching address:', err);
    }
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPosition([lat, lng]);
          setIsLocating(false);
          fetchAddress(lat, lng);
        },
        (err) => {
          console.error(err);
          setError("Could not get your location. Please enter it manually.");
          setIsLocating(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            Delivery Address
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pin your location
              </label>
              <button 
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-medium hover:text-emerald-700 dark:hover:text-emerald-400 disabled:opacity-50"
              >
                <Navigation className="w-3 h-3" />
                {isLocating ? 'Locating...' : 'Locate Me'}
              </button>
            </div>
            <div className="h-[200px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0 bg-gray-100 dark:bg-gray-900">
              <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={position} />
                <LocationMarker position={position} setPosition={setPosition} onLocationSelect={fetchAddress} />
              </MapContainer>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Click on the map or drag the marker to adjust your exact location.</p>
          </div>

          <form id="address-form" onSubmit={handleSubmit}>
            <div className="mb-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter your full address
              </label>
              <input
                type="text"
                id="address"
                value={addressInput}
                onChange={(e) => {
                  setAddressInput(e.target.value);
                  if (error) setError(null);
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors dark:bg-gray-700 dark:text-white ${
                  error 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-200 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500'
                }`}
                placeholder="e.g. 123 Main St, Apt 4B, New York, NY 10001"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400 inline-block"></span>
                  {error}
                </p>
              )}
            </div>
          </form>
        </div>
        
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0 flex gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="address-form"
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Save Address
          </button>
        </div>
      </div>
    </div>
  );
}
