import React, { useState, useEffect, useMemo } from 'react';
import { Wrench, Zap, Ambulance, MapPin, Phone, User, Clock, CheckCircle2 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

const services = [
  {
    id: 'plumber',
    name: 'Plumber',
    icon: Wrench,
    description: 'Expert plumbing services for repairs and installations.',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/10'
  },
  {
    id: 'electrician',
    name: 'Electrician',
    icon: Zap,
    description: 'Professional electrical repairs, wiring, and maintenance.',
    color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/10'
  },
  {
    id: 'ambulance',
    name: 'Emergency Ambulance',
    icon: Ambulance,
    description: '24/7 emergency medical transport services.',
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/10'
  }
];

interface ServiceProvider {
  id: string;
  name: string;
  phone: string;
  role: string;
  address?: string;
  location?: { lat: number; lng: number };
}

interface ServiceRequest {
  id: string;
  providerId: string;
  customerId: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
}

interface ServiceListProps {
  customerLocation?: [number, number] | null;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

export function ServiceList({ customerLocation }: ServiceListProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [requests, setRequests] = useState<Record<string, ServiceRequest>>({});
  
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'serviceRequests'),
      where('customerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newRequests: Record<string, ServiceRequest> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as ServiceRequest;
        // Keep the most recent request per provider or just store all
        // For simplicity, we map providerId to their latest request
        newRequests[data.providerId] = { id: doc.id, ...data };
      });
      setRequests(newRequests);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const q = query(collection(db, 'users'), where('role', 'in', ['plumber', 'electrician', 'ambulance']));
        const snapshot = await getDocs(q);
        const fetchedProviders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ServiceProvider[];
        setProviders(fetchedProviders);
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, []);

  const filteredProviders = useMemo(() => {
    if (!selectedService) return [];
    
    let filtered = providers.filter(p => p.role === selectedService);
    
    if (customerLocation) {
      filtered = filtered.filter(p => {
        if (!p.location) return false;
        const distance = getDistance(
          customerLocation[0], customerLocation[1],
          p.location.lat, p.location.lng
        );
        return distance <= 10;
      });
    }
    
    return filtered;
  }, [providers, selectedService, customerLocation]);

  const handleRequestService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert('Please sign in to request a service.');
      return;
    }
    if (!selectedService || !address || !description || !selectedProvider) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'serviceRequests'), {
        serviceType: selectedService,
        providerId: selectedProvider.id,
        customerId: auth.currentUser.uid,
        customerName: auth.currentUser.displayName || 'Customer',
        customerPhone: '', // Could be added to user profile
        address,
        description,
        status: 'pending',
        createdAt: new Date(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedProvider(null);
        setAddress('');
        setDescription('');
      }, 3000);
    } catch (error) {
      console.error('Error requesting service:', error);
      alert('Failed to request service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-12 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Essential Services
        </h2>
      </div>

      {!selectedService ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div 
                key={service.id}
                className={`${service.bg} rounded-3xl p-6 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 cursor-pointer group`}
                onClick={() => setSelectedService(service.id)}
              >
                <div className={`w-14 h-14 rounded-2xl ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{service.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  {service.description}
                </p>
                <button 
                  className="w-full py-3 px-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 group-hover:bg-gray-50 dark:group-hover:bg-gray-700"
                >
                  View Providers
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <button 
            onClick={() => setSelectedService(null)}
            className="mb-6 text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2"
          >
            &larr; Back to Services
          </button>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Available {services.find(s => s.id === selectedService)?.name}s {customerLocation ? 'Within 10km' : ''}
          </h3>

          {loadingProviders ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : filteredProviders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map(provider => {
                const request = requests[provider.id];
                const isAccepted = request?.status === 'accepted';
                const isPending = request?.status === 'pending';

                return (
                <div key={provider.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{provider.name}</h4>
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <Phone className="w-3 h-3" />
                          <span>{isAccepted ? provider.phone : 'Hidden until accepted'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {provider.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                      <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <p className="line-clamp-2">{provider.address}</p>
                    </div>
                  )}

                  {isAccepted ? (
                    <div className="w-full py-2.5 px-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl font-medium text-center flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Request Accepted
                    </div>
                  ) : isPending ? (
                    <div className="w-full py-2.5 px-4 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-xl font-medium text-center flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      Request Pending
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedProvider(provider)}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Request Service
                    </button>
                  )}
                </div>
              )})}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No providers found</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {customerLocation 
                  ? "We couldn't find any providers within 10km of your location." 
                  : "Please set your location to see nearby providers."}
              </p>
            </div>
          )}
        </div>
      )}

      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Request {services.find(s => s.id === selectedService)?.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Requesting service from <span className="font-semibold text-gray-900 dark:text-white">{selectedProvider.name}</span>
              </p>
            </div>

            {success ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Request Sent!</h4>
                <p className="text-gray-500 dark:text-gray-400">
                  The service provider will contact you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestService} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Service Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-shadow"
                      placeholder="Enter your full address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Issue Description
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-shadow resize-none"
                    placeholder="Briefly describe the issue..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider(null)}
                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-70 flex items-center justify-center"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
