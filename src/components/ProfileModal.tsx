import React from 'react';
import { X, LogOut, User, Mail } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  if (!isOpen) return null;

  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl transform transition-all flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            My Profile
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-white dark:bg-gray-900 z-10 relative">
          <div className="flex flex-col items-center mb-6">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-emerald-50 dark:border-emerald-900/30" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-4 border-4 border-emerald-50 dark:border-emerald-900/30">
                <User className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
              {user?.displayName || 'Customer'}
            </h3>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-xl font-medium hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
