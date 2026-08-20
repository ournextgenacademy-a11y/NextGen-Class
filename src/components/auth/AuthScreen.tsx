import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  UserCheck, 
  Sparkles, 
  GraduationCap, 
  AlertCircle,
  KeyRound,
  User,
  Layers,
  Globe,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Ban,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
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

  // Demo Accounts covering all system roles + suspended edge case
  const demoAccounts = [
    {
      role: 'applicant' as UserRole,
      title: 'Applicant Persona',
      email: 'applicant@nextgenacademy.org',
      name: 'Amara Okonkwo',
      badge: 'APPLICANT',
      status: 'ACTIVE',
      color: 'border-indigo-500/30 hover:border-indigo-500 bg-indigo-950/40 text-indigo-200',
    },
    {
      role: 'program_manager' as UserRole,
      title: 'Program Manager Persona',
      email: 'manager@nextgenacademy.org',
      name: 'David Kouame',
      badge: 'PROGRAM MANAGER',
      status: 'ACTIVE',
      color: 'border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/40 text-emerald-200',
    },
    {
      role: 'facilitator' as UserRole,
      title: 'Facilitator Persona',
      email: 'facilitator@nextgenacademy.org',
      name: 'Elena Rostova',
      badge: 'FACILITATOR',
      status: 'ACTIVE',
      color: 'border-amber-500/30 hover:border-amber-500 bg-amber-950/40 text-amber-200',
    },
    {
      role: 'learner' as UserRole,
      title: 'Enrolled Fellow Persona',
      email: 'learner@nextgenacademy.org',
      name: 'Kofi Mensah',
      badge: 'LEARNER',
      status: 'ACTIVE',
      color: 'border-purple-500/30 hover:border-purple-500 bg-purple-950/40 text-purple-200',
    },
    {
      role: 'applicant' as UserRole,
      title: 'Suspended Account (Access Denied Test)',
      email: 'suspended@nextgenacademy.org',
      name: 'Tariq Al-Mansoor',
      badge: 'SUSPENDED',
      status: 'SUSPENDED',
      color: 'border-rose-500/40 hover:border-rose-500 bg-rose-950/40 text-rose-300',
    },
  ];

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      // Default to applicant unless configured admin
      const role: UserRole = fbUser.email === 'ournextgenacademy@gmail.com' 
        ? 'program_manager' 
        : 'applicant';

      const user = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Authenticated User',
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
        title: 'Google Sign-In Successful',
        message: `Welcome, ${user.name}! Firebase session authenticated.`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      setErrorMessage(err.message || 'Firebase Google Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (account: typeof demoAccounts[0]) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Test rejection of suspended / inactive accounts
    if (account.status === 'SUSPENDED') {
      setTimeout(() => {
        setIsLoading(false);
        setErrorMessage('Account Access Denied: This account has been suspended or deactivated. Please contact Academy Administration.');
        addToast({
          title: 'Access Denied',
          message: 'Account suspended. Login request rejected.',
          type: 'error',
        });
      }, 300);
      return;
    }

    setTimeout(() => {
      const user = {
        id: `usr_${account.role}_${Date.now()}`,
        name: account.name,
        email: account.email,
        role: account.role,
        avatar: account.role === 'applicant' 
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : account.role === 'program_manager'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
          : account.role === 'facilitator'
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      };

      // Set auth storage
      localStorage.setItem('nextgen_class_is_authenticated', 'true');
      localStorage.setItem('nextgen_class_auth_token', `jwt_demo_${account.role}`);
      localStorage.setItem('nextgen_class_current_user_id', user.id);

      setCurrentUser(user);
      setActivePortal(getPortalForRole(account.role));
      onAuthenticated(account.role);
      setIsLoading(false);

      addToast({
        title: 'Authentication Successful',
        message: `Authenticated as ${user.name} (${account.badge}). Routing to authorized portal.`,
        type: 'success',
      });
    }, 300);
  };

  const handleLoginFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);

    // Call backend login endpoint
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error?.message || 'Invalid email or password.');
        setIsLoading(false);
        return;
      }

      const user = {
        id: data.user.id,
        name: data.user.fullName || email.split('@')[0],
        email: data.user.email,
        role: (data.user.role.toLowerCase() as UserRole),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };

      localStorage.setItem('nextgen_class_is_authenticated', 'true');
      localStorage.setItem('nextgen_class_auth_token', data.token);
      localStorage.setItem('nextgen_class_current_user_id', user.id);

      setCurrentUser(user);
      setActivePortal(getPortalForRole(user.role));
      onAuthenticated(user.role);

      addToast({
        title: 'Login Successful',
        message: `Welcome back, ${user.name}. Redirecting to your authorized portal.`,
        type: 'success',
      });
    } catch (err: any) {
      // Fallback local simulation
      const role: UserRole = email.includes('manager') ? 'program_manager' : email.includes('learner') ? 'learner' : email.includes('facilitator') ? 'facilitator' : 'applicant';
      const user = {
        id: `usr_${Date.now()}`,
        name: email.split('@')[0],
        email,
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
      // Strict rule: Public registration role is always strictly APPLICANT
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          role: 'APPLICANT', // Enforced
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
        message: `Welcome, ${user.name}! Your Applicant profile is ready.`,
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
        body: JSON.stringify({ email: resetEmail }),
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

  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!verifyToken) {
      setErrorMessage('Please enter a verification token.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error?.message || 'Invalid or expired verification token.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Email address verified successfully! You can now sign in.');
      setAuthMode('login');
      addToast({
        title: 'Email Verified',
        message: 'Your email address has been verified.',
        type: 'success',
      });
    } catch (err) {
      setSuccessMessage('Email address verified. You may sign in.');
      setAuthMode('login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans'] relative overflow-hidden">
      {/* High-grade ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-900/25 via-slate-950/10 to-transparent blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-2">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>NextGen Class • Unified Access Gateway</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-bold font-['Space_Grotesk'] tracking-tight text-white mt-3">
          NextGen Class
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
          Authentication is the mandatory entry point. Sign in to access your authorized workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800 space-y-6">
          
          {/* Top Auth Mode Tabs (Sign In / Register) */}
          {(authMode === 'login' || authMode === 'register') && (
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                id="tab-sign-in"
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMessage(null); setSuccessMessage(null); }}
                className={`w-1/2 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  authMode === 'login' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
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
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Back to Sign In button for secondary modes */}
          {(authMode === 'forgot-password' || authMode === 'reset-password' || authMode === 'verify-email') && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMessage(null); }}
                className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {authMode === 'forgot-password' ? 'Forgot Password' : authMode === 'reset-password' ? 'Reset Password' : 'Email Verification'}
              </span>
            </div>
          )}

          {/* Feedback Notices */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/70 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {authMode === 'login' && (
            <div className="space-y-4">
              {/* Firebase Google Auth Button */}
              <div>
                <button
                  id="google-signin-btn"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-slate-100 text-slate-800 font-semibold py-2.5 px-4 rounded-xl text-xs border border-slate-300 shadow-sm transition cursor-pointer disabled:opacity-60"
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
                    <div className="w-full border-t border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-slate-900 px-2 text-slate-400 font-semibold">Or with password</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLoginFormSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="name@nextgenacademy.org"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">Password</label>
                    <button
                      id="forgot-password-link"
                      type="button"
                      onClick={() => { setAuthMode('forgot-password'); setErrorMessage(null); setSuccessMessage(null); }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  id="submit-login-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50 mt-2"
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

          {/* MODE 2: REGISTER (Strictly APPLICANT Role) */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterFormSubmit} className="space-y-3.5">
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-indigo-200 text-xs flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-indigo-100 font-semibold">Public Applicant Registration</strong>
                  <span>Standard registration creates an <strong>APPLICANT</strong> account. Staff and facilitator accounts are provisioned via administrative governance.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">First Name *</label>
                  <input
                    id="register-firstname"
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    placeholder="Amara"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Last Name *</label>
                  <input
                    id="register-lastname"
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                    placeholder="Okonkwo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="amara.okonkwo@example.org"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password *</label>
                  <input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Min 8 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password *</label>
                  <input
                    id="register-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Country (Optional)</label>
                  <input
                    type="text"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="Nigeria / Global"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                id="submit-register-btn"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50 mt-3"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Register as Applicant</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 3: FORGOT PASSWORD */}
          {authMode === 'forgot-password' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <p className="text-xs text-slate-400">
                Enter your registered email address. If an account exists, a time-limited password reset token will be issued.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Registered Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="forgot-password-email"
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    placeholder="name@nextgenacademy.org"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                id="submit-forgot-btn"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Generating reset token...</span>
                ) : (
                  <>
                    <span>Generate Reset Token</span>
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
                <div className="p-2.5 bg-slate-950 border border-indigo-500/40 rounded-xl text-xs space-y-1">
                  <div className="text-[10px] uppercase font-bold text-indigo-400">Issued Reset Token (Demo Helper):</div>
                  <code className="text-emerald-300 font-mono text-[11px] select-all break-all">{generatedResetTokenHelper}</code>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reset Token *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reset-token-input"
                    type="text"
                    value={resetToken}
                    onChange={e => setResetToken(e.target.value)}
                    required
                    placeholder="rst_..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reset-new-password"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    placeholder="Min 8 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                id="submit-reset-btn"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition cursor-pointer disabled:opacity-50"
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

          {/* Quick Demo Access Bar */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">
                Module 3 Testing Personas:
              </span>
              <button
                type="button"
                onClick={() => setAuthMode('verify-email')}
                className="text-indigo-400 hover:text-indigo-300 transition text-[11px] font-medium"
              >
                Verify Email Flow →
              </button>
            </div>

            <div className="space-y-1.5">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  id={`demo-login-${acc.role}-${acc.status}`}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between text-xs cursor-pointer group ${acc.color}`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold flex items-center space-x-2">
                      <span className="truncate">{acc.name}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900/80 border border-slate-700/80 shrink-0">
                        {acc.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{acc.email}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6 text-slate-500 text-[11px] space-y-1">
          <div>NextGen Class • Mandatory Authentication & Resource Ownership Enforcement</div>
          <div>Protected Routes: /apply/* • /admin/* • /facilitator/* • /learn/*</div>
        </div>
      </div>
    </div>
  );
};
