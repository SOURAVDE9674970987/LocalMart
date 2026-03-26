import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Wrench, Zap, Ambulance, CheckCircle, Clock, MapPin, Edit2 } from 'lucide-react';
import { AddressModal } from './AddressModal';

interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  location: { lat: number; lng: number } | null;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  createdAt: any;
  serviceType: string;
  description: string;
}

interface ProviderProfile {
  address?: string;
  location?: { lat: number; lng: number } | null;
  phone?: string;
  name?: string;
}

export function ServiceDashboard({ serviceType }: { serviceType: 'plumber' | 'electrician' | 'ambulance' }) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch provider profile
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as ProviderProfile);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();

    const q = query(
      collection(db, 'serviceRequests'),
      where('providerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceRequest[];
      
      // Sort by newest first
      newRequests.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.getTime ? a.createdAt.getTime() : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.getTime ? b.createdAt.getTime() : 0);
        return timeB - timeA;
      });
      setRequests(newRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [serviceType]);

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'serviceRequests', requestId), {
        status: newStatus,
        providerId: auth.currentUser?.uid,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Failed to update status');
    }
  };

  const handleSaveLocation = async (address: string, coordinates: [number, number] | null) => {
    if (!auth.currentUser) return;
    try {
      const newLocation = coordinates ? { lat: coordinates[0], lng: coordinates[1] } : null;
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        address,
        location: newLocation
      });
      setProfile(prev => ({ ...prev, address, location: newLocation }));
      setIsEditingLocation(false);
    } catch (err) {
      console.error("Error saving location:", err);
      setError("Failed to save location.");
    }
  };

  const getIcon = () => {
    switch (serviceType) {
      case 'plumber': return <Wrench className="w-8 h-8 text-blue-500" />;
      case 'electrician': return <Zap className="w-8 h-8 text-yellow-500" />;
      case 'ambulance': return <Ambulance className="w-8 h-8 text-red-500" />;
      default: return null;
    }
  };

  const getTitle = () => {
    switch (serviceType) {
      case 'plumber': return 'Plumbing Requests';
      case 'electrician': return 'Electrical Requests';
      case 'ambulance': return 'Emergency Ambulance Requests';
      default: return 'Service Requests';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            {getIcon()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getTitle()}</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your incoming service requests</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-start w-full md:w-auto">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span className="font-medium text-gray-900 dark:text-white">Your Location</span>
          </div>
          {profile?.address ? (
            <div className="flex items-center justify-between w-full gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{profile.address}</p>
              <button 
                onClick={() => setIsEditingLocation(true)}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditingLocation(true)}
              className="w-full py-2 px-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl text-sm font-medium transition-colors"
            >
              Set Location
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      {!profile?.location && (
        <div className="mb-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl">
          <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-500 mb-2">Location Required</h3>
          <p className="text-yellow-700 dark:text-yellow-400 mb-4">
            You must set your location so customers can find you and see how far away you are.
          </p>
          <button 
            onClick={() => setIsEditingLocation(true)}
            className="py-2 px-6 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition-colors"
          >
            Set Location Now
          </button>
        </div>
      )}

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No requests yet</h3>
            <p className="text-gray-500 dark:text-gray-400">New requests will appear here</p>
          </div>
        ) : (
          requests.map(request => (
            <div key={request.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      request.status === 'accepted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      request.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleString() : (request.createdAt?.toLocaleString ? request.createdAt.toLocaleString() : '')}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{request.customerName}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">{request.description}</p>
                  </div>

                  <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{request.address}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[140px]">
                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'accepted')}
                      className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Accept
                    </button>
                  )}
                  {request.status === 'accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'completed')}
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete
                    </button>
                  )}
                  {(request.status === 'pending' || request.status === 'accepted') && (
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'cancelled')}
                      className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AddressModal
        isOpen={isEditingLocation}
        onClose={() => setIsEditingLocation(false)}
        currentAddress={profile?.address || ''}
        initialCoordinates={profile?.location ? [profile.location.lat, profile.location.lng] : null}
        onSave={handleSaveLocation}
      />
    </div>
  );
}
