import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { ArrowRight, Mail, Lock, User, Key, ShieldCheck, CheckCircle2, HeartPulse, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { startAuthentication } from '@simplewebauthn/browser';

const GQL_ENDPOINT = 'http://localhost:4000/graphql';

function LoginContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setErrorMsg('Google login failed')
  });

  const handlePasskey = async () => {
    if (!formData.email) return setErrorMsg('Please enter your email for Passkey login.');
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
      setErrorMsg('Passkey authentication failed. Have you registered one yet?');
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
          setErrorMsg('Password reset successfully. Please login.');
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
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      
      {/* LEFT SIDE: Form (Takes up 5/12 on large screens, full on mobile) */}
      <div className="w-full lg:w-5/12 flex flex-col justify-center px-8 sm:px-16 xl:px-24 py-12 relative z-10 bg-white">
        
        {/* Brand Logo & Name */}
        <div className="absolute top-8 left-8 sm:left-16 xl:left-24">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden">
               <img src="/logo.png" alt="VitaLeaf Logo" className="w-full h-full object-cover mix-blend-multiply" />
            </div>
            <span className="font-heading font-extrabold text-2xl tracking-tight text-blue-900">VitaLeaf</span>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] mx-auto mt-16"
        >
          <div className="mb-10">
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-gray-900 tracking-tight mb-3">
              {showForgot ? 'Reset Password' : (isLogin ? 'Welcome back' : 'Create an account')}
            </h2>
            <p className="text-base text-gray-500 font-medium">
              {showForgot ? 'We will send you an OTP to reset your password.' : 'Enter your details below to access your clinical dashboard.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-4 bg-slate-50 border-l-4 border-slate-500 text-slate-700 text-sm font-bold rounded-r-xl shadow-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                {errorMsg}
              </div>
            )}

            {!showOtp ? (
              <>
                <AnimatePresence mode="popLayout">
                  {!isLogin && !showForgot && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" /></div>
                        <input name="name" type="text" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Sarah Connor" value={formData.name} onChange={handleInputChange} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" /></div>
                    <input name="email" type="email" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="name@example.com" value={formData.email} onChange={handleInputChange} />
                  </div>
                </div>

                {!showForgot || showOtp ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-gray-700">{showForgot ? 'New Password' : 'Password'}</label>
                      {isLogin && !showForgot && (
                        <button type="button" onClick={() => setShowForgot(true)} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">Forgot password?</button>
                      )}
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" /></div>
                      <input name="password" type="password" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label className="block text-sm font-bold text-gray-700 mb-2">Enter 6-digit OTP</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><ShieldCheck className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" /></div>
                  <input type="text" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-center tracking-[0.75em] font-mono text-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="------" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
                </div>
              </motion.div>
            )}

            <button type="submit" className="w-full py-4 px-6 rounded-xl text-white font-bold text-base bg-blue-700 hover:bg-blue-800 hover:shadow-lg hover:shadow-blue-900/20 transition-all flex justify-center items-center group relative overflow-hidden" disabled={isLoading}>
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (showOtp ? 'Verify & Proceed' : (showForgot ? 'Send Reset Link' : (isLogin ? 'Sign In to Dashboard' : 'Create Account')))}
                {!isLoading && !showOtp && !showForgot && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>
          </form>

          {!showOtp && !showForgot && (
            <div className="mt-8">
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or continue with</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button onClick={() => googleLogin()} className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all flex justify-center items-center gap-2 shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Google
                </button>
                <button onClick={handlePasskey} className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all flex justify-center items-center gap-2 shadow-sm">
                  <Key className="w-5 h-5 text-gray-600" /> 
                  Passkey
                </button>
              </div>
            </div>
          )}

          <div className="mt-10 text-center">
            {showForgot || showOtp ? (
              <button onClick={() => { setShowForgot(false); setShowOtp(false); }} className="text-blue-600 font-bold hover:text-blue-800 transition-colors">← Back to Login</button>
            ) : (
              <p className="text-sm text-gray-500 font-medium">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-bold hover:text-blue-800 transition-colors hover:underline underline-offset-4">
                  {isLogin ? 'Sign up now' : 'Sign in'}
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE: Beautiful Image Background */}
      <div className="hidden lg:block lg:w-7/12 relative overflow-hidden bg-blue-900">
        <img 
          src="/login-bg.png" 
          alt="Medical Abstract" 
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen"
        />
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 to-sky-900/80 mix-blend-multiply" />
        
        {/* Large Rx Watermark */}
        <div className="absolute -bottom-20 -right-10 text-[35rem] font-black text-white/5 leading-none font-heading select-none pointer-events-none">
          ℞
        </div>

        {/* Floating Glass Card */}
        <div className="absolute bottom-20 left-20 right-20 max-w-xl">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 border border-white/30 backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-3xl font-heading font-extrabold text-white leading-tight mb-4">
              Next-generation medication intelligence.
            </h3>
            <p className="text-blue-50 text-lg font-medium leading-relaxed opacity-90">
              VitaLeaf combines advanced AI with clinical safety to ensure your health regimen is perfectly optimized and deeply understood.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-3">
                 {[1,2,3].map(i => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-blue-800/50 flex items-center justify-center text-xs font-bold text-blue-800 ${i===1?'bg-blue-200':i===2?'bg-blue-100':'bg-blue-50'} shadow-sm`}>
                       {i === 1 ? 'DK' : i === 2 ? 'SJ' : 'AL'}
                    </div>
                 ))}
              </div>
              <div className="text-sm font-medium text-blue-100">
                Trusted by <strong className="text-white">thousands</strong> of patients.
              </div>
            </div>
          </div>
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
