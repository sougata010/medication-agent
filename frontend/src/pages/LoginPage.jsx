import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { 
  ArrowRight, Mail, Lock, User, Key, ShieldCheck, CheckCircle2, 
  HeartPulse, Sparkles, AlertTriangle, Eye, EyeOff, Stethoscope, 
  Activity, Check, Pill, Zap, ChevronRight, LockKeyhole
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { startAuthentication } from '@simplewebauthn/browser';
import BrandIcon from '../components/BrandIcon';

const GQL_ENDPOINT = 'http://localhost:4000/graphql';

function LoginContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { login } = useGlobalContext();
  const navigate = useNavigate();

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const executeGql = async (query, variables) => {
    const res = await fetch(GQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data;
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setIsLoading(true);
      const data = await executeGql(`
        mutation GoogleLogin($token: String!) {
          googleLogin(token: $token) {
            token
            user { id email name }
          }
        }
      `, { token: tokenResponse.access_token || tokenResponse.credential });
      
      login(data.googleLogin.token, data.googleLogin.user);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Google authentication encountered an issue.');
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setErrorMsg('Google login was cancelled or failed.')
  });

  const handlePasskey = async () => {
    if (!formData.email) return setErrorMsg('Please enter your email above to authenticate with Passkey.');
    try {
      setIsLoading(true);
      const optData = await executeGql(`
        mutation GenerateOpts($email: String!) {
          generatePasskeyAuthenticationOptions(email: $email) { optionsJson }
        }
      `, { email: formData.email });
      
      const authResp = await startAuthentication(JSON.parse(optData.generatePasskeyAuthenticationOptions.optionsJson));
      
      const verifyData = await executeGql(`
        mutation VerifyAuth($email: String!, $resp: String!) {
          verifyPasskeyAuthentication(email: $email, responseJson: $resp) {
            token
            user { id name email }
          }
        }
      `, { email: formData.email, resp: JSON.stringify(authResp) });

      login(verifyData.verifyPasskeyAuthentication.token, verifyData.verifyPasskeyAuthentication.user);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg('Biometric passkey not yet registered. You may also use 1-Click Demo or Password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    
    try {
      if (showForgot) {
        if (showOtp) {
          await executeGql(`
            mutation Reset($email: String!, $otp: String!, $newPass: String!) {
              resetPassword(email: $email, otp: $otp, newPassword: $newPass) { message }
            }
          `, { email: formData.email, otp, newPass: formData.password });
          setShowForgot(false);
          setShowOtp(false);
          setIsLogin(true);
          setErrorMsg('Password reset successfully. Please sign in with your new credentials.');
        } else {
          await executeGql(`mutation ReqReset($email: String!) { requestPasswordReset(email: $email) { message } }`, { email: formData.email });
          setShowOtp(true);
        }
      } else if (isLogin) {
        const data = await executeGql(`
          mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) { token user { id name email } }
          }
        `, { email: formData.email, password: formData.password });
        
        login(data.login.token, data.login.user);
        navigate('/dashboard');
      } else {
        if (showOtp) {
          const data = await executeGql(`
            mutation Verify($email: String!, $otp: String!) {
              verifyOTP(email: $email, otp: $otp) { token user { id name email } }
            }
          `, { email: formData.email, otp });
          
          login(data.verifyOTP.token, data.verifyOTP.user);
          navigate('/dashboard');
        } else {
          await executeGql(`
            mutation Reg($email: String!, $password: String!, $name: String!) {
              register(email: $email, password: $password, name: $name) { message }
            }
          `, { email: formData.email, password: formData.password, name: formData.name });
          setShowOtp(true);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error. Please check your inputs or try 1-Click Demo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans selection:bg-blue-100">
      
      {/* LEFT SIDE: Clean Clinical Authentication Portal (5/12 on Desktop) */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between px-6 sm:px-12 xl:px-16 py-10 bg-white border-r border-slate-200/80 relative z-10 shadow-sm">
        
        {/* Top Header / Brand */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <BrandIcon size={34} className="w-8 h-8 shrink-0" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading font-extrabold text-xl tracking-tight text-slate-900">VitaLeaf</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Clinical OS</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            ← Back to Home
          </button>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          
          {/* Segmented Auth Selector Pill */}
          {!showForgot && !showOtp && (
            <div className="flex p-1 bg-slate-100 rounded-xl mb-8 border border-slate-200/70">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  isLogin 
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  !isLogin 
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight">
              {showForgot ? 'Reset Password' : (showOtp ? 'Verify One-Time Code' : (isLogin ? 'Access Clinical Portal' : 'Register Clinical Profile'))}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              {showForgot 
                ? 'Enter your clinical email to receive secure recovery credentials.' 
                : showOtp 
                  ? 'Enter the 6-digit confirmation PIN dispatched to your email.'
                  : (isLogin ? 'Enter your credentials to access your secure clinical workspace.' : 'Establish your encrypted patient telemetry record in seconds.')}
            </p>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 shadow-2xs animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!showOtp ? (
              <>
                {/* Full Name for Registration */}
                <AnimatePresence mode="popLayout">
                  {!isLogin && !showForgot && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Patient / Clinician Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g. Sougata Roy"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Clinical Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="patient@vitaleaf.clinical"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                {!showForgot || showOtp ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        {showForgot ? 'New Password' : 'Password'}
                      </label>
                      {isLogin && !showForgot && (
                        <button
                          type="button"
                          onClick={() => { setShowForgot(true); setErrorMsg(''); }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              /* OTP Verification Mode */
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Enter 6-Digit Verification PIN</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center tracking-[0.5em] font-mono text-lg font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {showOtp ? 'Verify & Continue' : (showForgot ? 'Dispatch Recovery PIN' : (isLogin ? 'Sign In to Clinical Desk' : 'Complete Registration'))}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social / Hardware Passkey Auth */}
          {!showOtp && !showForgot && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="relative flex items-center justify-center mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2">
                  Or authenticate with hardware/OAuth
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => googleLogin()}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={handlePasskey}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>Passkey (FIDO2)</span>
                </button>
              </div>
            </div>
          )}

          {/* Reset password return */}
          {(showForgot || showOtp) && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { setShowForgot(false); setShowOtp(false); setErrorMsg(''); }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Return to Sign In
              </button>
            </div>
          )}
        </div>

        {/* Security & HIPAA Compliance Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <LockKeyhole className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit SSL · HIPAA Compliant Telemetry</span>
          </div>
          <span>v2.4.0 Clinical</span>
        </div>
      </div>

      {/* RIGHT SIDE: Interactive Product Telemetry & Medical Authority (7/12 on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 xl:p-16 text-white">
        
        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Clinical Engine Online</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>HL7 FHIR R4 Ready</span>
          </div>
        </div>

        {/* Center Live Interactive Telemetry Showcase */}
        <div className="relative z-10 my-auto py-8 max-w-xl mx-auto w-full space-y-4">
          
          <div className="space-y-2 mb-6">
            <h2 className="text-3xl xl:text-4xl font-heading font-black tracking-tight text-white leading-tight">
              Evidence-based posology & continuous medication surveillance.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-normal">
              VitaLeaf orchestrates patient health records, Bayesian differential symptom evaluations, and multi-drug interaction algorithms across certified pharmaceutical databases.
            </p>
          </div>

          {/* Floating Clinical Telemetry Mock Card */}
          <div className="p-6 rounded-3xl bg-slate-800/70 border border-slate-700/80 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Patient Active Regimen</h4>
                  <p className="text-[10px] text-slate-400">Lisinopril 10mg + Metformin 500mg</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Optimal Concordance
              </span>
            </div>

            {/* Mini Telemetry Indicators */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/50 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">7-Day Adherence</span>
                <span className="text-xl font-heading font-black text-white">98.4%</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/50 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Interaction Risk</span>
                <span className="text-xl font-heading font-black text-emerald-400">Zero Flags</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/50 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">FDA Status</span>
                <span className="text-xl font-heading font-black text-blue-400">Verified</span>
              </div>
            </div>

            {/* Real-Time Security Trust Strip */}
            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-700/40">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Zero-Trust Microservice Architecture
              </span>
              <span className="font-mono text-slate-500">AES-256 GCM</span>
            </div>
          </div>
        </div>

        {/* Bottom Clinical Quotation */}
        <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Trusted by hospital clinics, pharmacologists, and patients nationwide.</span>
          <span className="font-semibold text-slate-300">OpenFDA Validated</span>
        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env?.VITE_GOOGLE_OAUTH_CLIENT_ID || "12345-mock-id.apps.googleusercontent.com"}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
}
