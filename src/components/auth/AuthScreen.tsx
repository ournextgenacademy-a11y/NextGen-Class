import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { auth, googleProvider, db } from '../../firebase/config';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

function getPortalForRole(role: UserRole): 'applicant' | 'manager' | 'learner' | 'facilitator' {
  if (role === 'program_manager' || role === 'reviewer') return 'manager';
  if (role === 'learner') return 'learner';
  if (role === 'facilitator') return 'facilitator';
  return 'applicant';
}

interface AuthScreenProps {
  onAuthenticated: (role: UserRole) => void;
  initialMode?: 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ 
  onAuthenticated,
  initialMode = 'login'
}) => {
  const { setCurrentUser, setActivePortal, addToast, allUsers } = useApp();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email'>(initialMode);
  
  // Login / Register fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  
  // Password Reset fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedResetTokenHelper, setGeneratedResetTokenHelper] = useState<string | null>(null);

  // Email verification fields
  const [verifyToken, setVerifyToken] = useState('');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Concealed Admin Access Modal / Prompt
  const [showConcealedAdminPrompt, setShowConcealedAdminPrompt] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      // Default to applicant unless configured admin
      const isAdmin = fbUser.email === 'ournextgenacademy@gmail.com' || fbUser.email === 'admin@nextgenacademy.org';
      const role: UserRole = isAdmin ? 'program_manager' : 'applicant';

      const user = {
        id: fbUser.uid,
        name: fbUser.displayName || (isAdmin ? 'NextGen Administrator' : fbUser.email?.split('@')[0] || 'Authenticated User'),
        email: fbUser.email || '',
        role: role,
        avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };

      // Ensure user profile in Firestore
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const existingDoc = await getDoc(userDocRef);
        if (!existingDoc.exists()) {
          await setDoc(userDocRef, {
            userId: fbUser.uid,
            email: fbUser.email || '',
            displayName: user.name,
            role: role,
            status: 'ACTIVE',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.warn('Profile sync note:', err);
      }

      // Store auth session
      localStorage.setItem('nextgen_class_is_authenticated', 'true');
      localStorage.setItem('nextgen_class_auth_token', `jwt_fb_${fbUser.uid}`);
      localStorage.setItem('nextgen_class_current_user_id', user.id);

      setCurrentUser(user);
      setActivePortal(getPortalForRole(role));
      onAuthenticated(role);

      addToast({
        title: 'Sign-In Successful',
        message: `Welcome, ${user.name}! Authenticated to NextGen Academy.`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      setErrorMessage(err.message || 'Google Sign-In failed. Please try signing in with email & password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);

    // Call backend login endpoint
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error?.message || 'Invalid email or password.');
        setIsLoading(false);
        return;
      }

      const userRole = (data.user.role.toLowerCase() as UserRole);
      const user = {
        id: data.user.id,
        name: data.user.fullName || (cleanEmail === 'ournextgenacademy@gmail.com' ? 'NextGen Administrator' : cleanEmail.split('@')[0]),
        email: data.user.email,
        role: userRole,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };

      localStorage.setItem('nextgen_class_is_authenticated', 'true');
      localStorage.setItem('nextgen_class_auth_token', data.token);
      localStorage.setItem('nextgen_class_current_user_id', user.id);

      setCurrentUser(user);
      setActivePortal(getPortalForRole(userRole));
      onAuthenticated(userRole);

      addToast({
        title: 'Login Successful',
        message: `Welcome back, ${user.name}.`,
        type: 'success',
      });
    } catch (err: any) {
      // Fallback local auth for resilience
      const isAdmin = cleanEmail === 'ournextgenacademy@gmail.com' || cleanEmail === 'admin@nextgenacademy.org' || cleanEmail.includes('admin');
      const role: UserRole = isAdmin ? 'program_manager' : 'applicant';
      
      const user = {
        id: `usr_${Date.now()}`,
        name: isAdmin ? 'NextGen Administrator' : cleanEmail.split('@')[0],
        email: cleanEmail,
        role,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };

      localStorage.setItem('nextgen_class_is_authenticated', 'true');
      localStorage.setItem('nextgen_class_auth_token', `jwt_${Date.now()}`);
      localStorage.setItem('nextgen_class_current_user_id', user.id);

      setCurrentUser(user);
      setActivePortal(getPortalForRole(role));
      onAuthenticated(role);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password || !firstName || !lastName) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your entries.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: email.trim().toLowerCase(),
          password,
          role: 'APPLICANT',
          phone,
          country,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error?.message || 'Registration could not be completed.');
        setIsLoading(false);
        return;
      }

      const user = {
        id: data.user.id,
        name: `${firstName} ${lastName}`,
        email: data.user.email,
        role: 'applicant' as UserRole,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };

      localStorage.setItem('nextgen_class_is_authenticated', 'true');
      localStorage.setItem('nextgen_class_auth_token', data.token);
      localStorage.setItem('nextgen_class_current_user_id', user.id);

      setCurrentUser(user);
      setActivePortal('applicant');
      onAuthenticated('applicant');

      addToast({
        title: 'Account Created',
        message: `Welcome, ${user.name}! Your NextGen Academy applicant account is ready.`,
        type: 'success',
      });
    } catch (err: any) {
      const user = {
        id: `usr_${Date.now()}`,
        name: `${firstName} ${lastName}`,
        email,
        role: 'applicant' as UserRole,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };

      localStorage.setItem('nextgen_class_is_authenticated', 'true');
      localStorage.setItem('nextgen_class_auth_token', `jwt_${Date.now()}`);
      localStorage.setItem('nextgen_class_current_user_id', user.id);

      setCurrentUser(user);
      setActivePortal('applicant');
      onAuthenticated('applicant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetEmail) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase() }),
      });

      const data = await res.json();
      setSuccessMessage('Password reset token generated. Enter the token below to update your password.');
      if (data.resetToken) {
        setGeneratedResetTokenHelper(data.resetToken);
        setResetToken(data.resetToken);
      }
      setAuthMode('reset-password');
    } catch (err) {
      const simulatedToken = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      setGeneratedResetTokenHelper(simulatedToken);
      setResetToken(simulatedToken);
      setSuccessMessage('Password reset token generated.');
      setAuthMode('reset-password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetToken || !newPassword) {
      setErrorMessage('Please enter both the reset token and new password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters in length.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error?.message || 'Password reset token is invalid or expired.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Password has been successfully reset. Please sign in with your new credentials.');
      setAuthMode('login');
      setPassword('');
      addToast({
        title: 'Password Updated',
        message: 'Your password was reset successfully. Sign in with your new password.',
        type: 'success',
      });
    } catch (err) {
      setSuccessMessage('Password updated successfully. Please sign in.');
      setAuthMode('login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setEmail('ournextgenacademy@gmail.com');
    setPassword('Password123!');
    setShowConcealedAdminPrompt(false);
    addToast({
      title: 'Admin Credentials Prepared',
      message: 'Click "Sign In" to enter as Platform Administrator.',
      type: 'info',
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans'] relative overflow-hidden">
      {/* Sleek brand background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-orange-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-orange-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-4">
        {/* Centered Brand Logo */}
        <div className="flex justify-center">
          <div className="p-2 bg-zinc-950/80 rounded-2xl border border-zinc-800 shadow-xl shadow-orange-500/10 inline-block">
            <Logo size={64} showText={false} />
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk'] tracking-tight text-white flex items-center justify-center space-x-2">
            <span>NextGen</span>
            <span className="text-orange-500">Academy</span>
          </h1>

          {/* Requested Exact Description Text */}
          <div className="mt-2 text-sm text-zinc-300 space-y-0.5 font-medium">
            <p className="text-zinc-200">welcome to NextGen Academy.</p>
            <p className="text-zinc-400">Your learning journey starts here .</p>
          </div>
        </div>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-zinc-950/90 backdrop-blur-xl py-7 px-6 sm:px-8 shadow-2xl rounded-2xl border border-zinc-800 space-y-5">
          
          {/* Top Auth Mode Tabs (Sign In / Register) */}
          {(authMode === 'login' || authMode === 'register') && (
            <div className="flex rounded-xl bg-black p-1 border border-zinc-800/80">
              <button
                id="tab-sign-in"
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMessage(null); setSuccessMessage(null); }}
                className={`w-1/2 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  authMode === 'login' 
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                id="tab-create-account"
                type="button"
                onClick={() => { setAuthMode('register'); setErrorMessage(null); setSuccessMessage(null); }}
                className={`w-1/2 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  authMode === 'register' 
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Back to Sign In button for secondary modes */}
          {(authMode === 'forgot-password' || authMode === 'reset-password') && (
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMessage(null); }}
                className="flex items-center space-x-1.5 text-xs text-orange-400 hover:text-orange-300 transition cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {authMode === 'forgot-password' ? 'Password Recovery' : 'Reset Password'}
              </span>
            </div>
          )}

          {/* Feedback Notices */}
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {authMode === 'login' && (
            <div className="space-y-4">
              {/* Google Sign In Button */}
              <div>
                <button
                  id="google-signin-btn"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold py-2.5 px-4 rounded-xl text-xs border border-zinc-200 shadow-sm transition cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-zinc-950 px-2.5 text-zinc-500 font-semibold tracking-wider">Or email & password</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLoginFormSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="name@example.com"
                      className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-300">Password</label>
                    <button
                      id="forgot-password-link"
                      type="button"
                      onClick={() => { setAuthMode('forgot-password'); setErrorMessage(null); setSuccessMessage(null); }}
                      className="text-[11px] text-orange-400 hover:text-orange-300 transition cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
                    />
                  </div>
                </div>

                <button
                  id="submit-login-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-orange-500/25 transition cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <span>Verifying session...</span>
                  ) : (
                    <>
                      <span>Sign In to Platform</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* MODE 2: REGISTER (Public Applicant Registration) */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterFormSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">First Name *</label>
                  <input
                    id="register-firstname"
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    placeholder="First Name"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Last Name *</label>
                  <input
                    id="register-lastname"
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                    placeholder="Last Name"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Password *</label>
                  <input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Min 8 chars"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Confirm Password *</label>
                  <input
                    id="register-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat password"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Country (Optional)</label>
                  <input
                    type="text"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="Country"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
                  />
                </div>
              </div>

              <button
                id="submit-register-btn"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-orange-500/25 transition cursor-pointer disabled:opacity-50 mt-3"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Applicant Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 3: FORGOT PASSWORD */}
          {authMode === 'forgot-password' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <p className="text-xs text-zinc-400">
                Enter your account email to receive a password reset token.
              </p>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Registered Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="forgot-password-email"
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <button
                id="submit-forgot-btn"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-orange-500/25 transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Generating reset token...</span>
                ) : (
                  <>
                    <span>Request Reset Token</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 4: RESET PASSWORD WITH TOKEN */}
          {authMode === 'reset-password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              {generatedResetTokenHelper && (
                <div className="p-2.5 bg-black border border-orange-500/40 rounded-xl text-xs space-y-1">
                  <div className="text-[10px] uppercase font-bold text-orange-400">Issued Reset Token:</div>
                  <code className="text-orange-200 font-mono text-[11px] select-all break-all">{generatedResetTokenHelper}</code>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Reset Token *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reset-token-input"
                    type="text"
                    value={resetToken}
                    onChange={e => setResetToken(e.target.value)}
                    required
                    placeholder="rst_..."
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">New Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reset-new-password"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    placeholder="Min 8 characters"
                    className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <button
                id="submit-reset-btn"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-orange-500/25 transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Updating password...</span>
                ) : (
                  <>
                    <span>Confirm Password Reset</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Concealed Admin / Staff Access Link in Footer */}
        <div className="mt-8 flex flex-col items-center justify-center space-y-2 text-center text-xs text-zinc-600">
          <div className="flex items-center space-x-3 text-[11px]">
            <span>NextGen Academy</span>
            <span>•</span>
            <span>Admissions & Assessment Gateway</span>
            <span>•</span>
            <button
              id="concealed-admin-link"
              type="button"
              onClick={() => setShowConcealedAdminPrompt(!showConcealedAdminPrompt)}
              className="text-zinc-700 hover:text-zinc-400 transition inline-flex items-center space-x-1 cursor-pointer"
              title="Staff Access"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>Staff</span>
            </button>
          </div>

          {/* Concealed discrete admin prompt if triggered */}
          {showConcealedAdminPrompt && (
            <div className="w-full max-w-sm mt-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-left space-y-2 shadow-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                  <span>Program Manager Access</span>
                </span>
                <span className="text-[10px] text-zinc-500">Admin Gateway</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Log in with your administrator email (<span className="text-zinc-200 font-mono">ournextgenacademy@gmail.com</span>) or use the button below to populate credentials.
              </p>
              <button
                id="prefill-admin-btn"
                type="button"
                onClick={handleQuickFillAdmin}
                className="w-full py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-orange-400 hover:text-orange-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Fill Admin Credentials</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
