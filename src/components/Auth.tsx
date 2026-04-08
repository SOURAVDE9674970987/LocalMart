import React, { useState, useRef } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Mail, Lock, User, Image as ImageIcon, ShoppingBag, ArrowLeft, Store, Truck, UserCircle, CheckCircle2, Wrench, Zap, Ambulance, Phone, CreditCard } from 'lucide-react';

export type UserRole = 'customer' | 'vendor' | 'delivery' | 'plumber' | 'electrician' | 'ambulance';

export function Auth() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'payment'>('login');
  const [role, setRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const isServiceRole = ['plumber', 'electrician', 'ambulance'].includes(role);
    const authEmail = email.includes('@') ? email : `${email.replace(/[^0-9+]/g, '')}@service.localmart.com`;

    try {
      if (view === 'login') {
        await signInWithEmailAndPassword(auth, authEmail, password);
      } else if (view === 'signup') {
        if (password !== repeatPassword) {
          setError('Passwords do not match');
          return;
        }
        if (role !== 'customer' && role !== 'delivery') {
          setView('payment');
          return;
        }
        
        localStorage.setItem('localmart_role', role);
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
        
        // Save user to Firestore
        const userData: any = {
          name,
          role,
          profileImage: profileImage || '',
          createdAt: new Date().toISOString()
        };
        
        if (isServiceRole) {
          userData.phone = email;
        } else {
          userData.email = email;
        }

        await setDoc(doc(db, 'users', userCredential.user.uid), userData);

        await signOut(auth); // Log out immediately after creation
        setView('login');
        setMessage('Account created successfully. Please sign in.');
        setPassword('');
        setRepeatPassword('');
      } else if (view === 'payment') {
        if (!cardNumber || !expiry || !cvc) {
          setError('Please fill in all payment details');
          return;
        }
        
        localStorage.setItem('localmart_role', role);
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
        
        const nextDueDate = new Date();
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        
        // Save user to Firestore
        const userData: any = {
          name,
          role,
          profileImage: profileImage || '',
          createdAt: new Date().toISOString(),
          platformFeePaid: true,
          platformFeeNextDueDate: nextDueDate.toISOString(),
          platformFeeAmount: role === 'vendor' ? 10 : 5
        };
        
        if (isServiceRole) {
          userData.phone = email;
        } else {
          userData.email = email;
        }

        await setDoc(doc(db, 'users', userCredential.user.uid), userData);

        await signOut(auth); // Log out immediately after creation
        setView('login');
        setMessage('Account created and payment successful. Please sign in.');
        setPassword('');
        setRepeatPassword('');
        setCardNumber('');
        setExpiry('');
        setCvc('');
      } else if (view === 'forgot') {
        await sendPasswordResetEmail(auth, authEmail);
        setMessage('Password reset email sent. Please check your inbox.');
        setView('login');
      }
    } catch (err: any) {
      if (view === 'login') {
        setError('Password or email incorrect');
      } else if (view === 'signup') {
        if (err.code === 'auth/email-already-in-use') {
          setError('User already exists. Sign in?');
        } else {
          setError(err.message);
        }
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900">
      {/* Left Pane - Branding/Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-900 items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop" 
          alt="Fresh local produce" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/60 to-transparent"></div>
        
        <div className="relative z-10 p-12 max-w-xl text-white w-full">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl">
            <ShoppingBag className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight tracking-tight">
            Your neighborhood,<br/>delivered.
          </h1>
          <p className="text-emerald-100/90 text-lg mb-12 max-w-md leading-relaxed">
            Join LocalMart to shop from your favorite local stores, sell your products, or deliver to your community.
          </p>

          <div className="space-y-4">
            {[
              'Support local businesses directly',
              'Lightning fast community delivery',
              'Fresh groceries and everyday essentials'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-emerald-50/80">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Pane - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50 dark:bg-gray-900 relative">
        {/* Mobile background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none lg:hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-100/50 dark:bg-emerald-900/20 blur-3xl"></div>
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 dark:bg-blue-900/20 blur-3xl"></div>
        </div>

        <div className="max-w-md w-full space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden mx-auto w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <ShoppingBag className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
              {view === 'forgot' ? 'Reset Password' : view === 'login' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {view === 'login' && 'Enter your details to access your account.'}
              {view === 'signup' && 'Join us to start your journey.'}
              {view === 'forgot' && 'Enter your email to receive a reset link.'}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {view === 'signup' && (
              <div className="grid grid-cols-3 p-1.5 bg-gray-200/50 dark:bg-gray-800/50 rounded-2xl gap-1.5 mb-8">
                {[
                  { id: 'customer', icon: UserCircle, label: 'Customer' },
                  { id: 'vendor', icon: Store, label: 'Vendor' },
                  { id: 'delivery', icon: Truck, label: 'Driver' },
                  { id: 'plumber', icon: Wrench, label: 'Plumber' },
                  { id: 'electrician', icon: Zap, label: 'Electrician' },
                  { id: 'ambulance', icon: Ambulance, label: 'Ambulance' }
                ].map((r) => {
                  const Icon = r.icon;
                  const isActive = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as UserRole)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-600/50' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {view === 'payment' ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 mb-6">
                  <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-400 mb-1">Platform Fee Required</h3>
                  <p className="text-sm text-emerald-600 dark:text-emerald-500">
                    To create a {role} account, a monthly platform fee of ${role === 'vendor' ? '10' : '5'} is required.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Card Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all shadow-sm"
                      placeholder="0000 0000 0000 0000"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Expiry Date</label>
                    <input
                      type="text"
                      required
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="block w-full px-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all shadow-sm"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">CVC</label>
                    <input
                      type="text"
                      required
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      className="block w-full px-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all shadow-sm"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {view === 'signup' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-center mb-6">
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                        />
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer group-hover:border-emerald-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-all duration-300 overflow-hidden"
                        >
                          {profileImage ? (
                            <img src={profileImage} alt="Profile preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="mx-auto h-8 w-8 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                              <span className="mt-1 block text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Upload Photo</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-800 sm:text-sm transition-all shadow-sm"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                    {view === 'signup' && ['plumber', 'electrician', 'ambulance'].includes(role) ? 'Phone Number' : (view === 'login' ? 'Email or Phone Number' : 'Email address')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      {view === 'signup' && ['plumber', 'electrician', 'ambulance'].includes(role) ? (
                        <Phone className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Mail className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <input
                      type={view === 'signup' && ['plumber', 'electrician', 'ambulance'].includes(role) ? 'tel' : 'text'}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-800 sm:text-sm transition-all shadow-sm"
                      placeholder={view === 'signup' && ['plumber', 'electrician', 'ambulance'].includes(role) ? '+1234567890' : 'you@example.com'}
                    />
                  </div>
                </div>

                {view !== 'forgot' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                    <div className="flex items-center justify-between mb-1.5 ml-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                      {view === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setView('forgot');
                            setError('');
                            setMessage('');
                          }}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-800 sm:text-sm transition-all shadow-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                {view === 'signup' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Repeat Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        required
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-800 sm:text-sm transition-all shadow-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="animate-in fade-in zoom-in duration-300 text-rose-500 text-sm text-center font-medium bg-rose-50 dark:bg-rose-900/30 py-3 px-4 rounded-xl border border-rose-100 dark:border-rose-800/50">
                {error}
              </div>
            )}

            {message && (
              <div className="animate-in fade-in zoom-in duration-300 text-emerald-600 dark:text-emerald-400 text-sm text-center font-medium bg-emerald-50 dark:bg-emerald-900/30 py-3 px-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                {message}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 active:scale-[0.98]"
              >
                {view === 'login' && 'Sign in'}
                {view === 'signup' && (role === 'customer' || role === 'delivery' ? 'Create account' : 'Continue to Payment')}
                {view === 'payment' && `Pay $${role === 'vendor' ? '10' : '5'} & Create Account`}
                {view === 'forgot' && 'Send Reset Link'}
              </button>
            </div>
            
            <div className="text-center mt-6">
              {view === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError('');
                    setMessage('');
                  }}
                  className="inline-flex items-center gap-2 font-medium text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </button>
              ) : view === 'payment' ? (
                <button
                  type="button"
                  onClick={() => {
                    setView('signup');
                    setError('');
                  }}
                  className="inline-flex items-center gap-2 font-medium text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to details
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setView(view === 'login' ? 'signup' : 'login');
                    setError('');
                    setMessage('');
                  }}
                  className="font-medium text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 text-sm transition-colors"
                >
                  {view === 'login' ? (
                    <span>Don't have an account? <span className="text-emerald-600 dark:text-emerald-400 font-bold">Sign up</span></span>
                  ) : (
                    <span>Already have an account? <span className="text-emerald-600 dark:text-emerald-400 font-bold">Sign in</span></span>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
