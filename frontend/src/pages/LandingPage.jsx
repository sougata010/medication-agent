import React, { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck, Hexagon, Brain, LineChart, Network, Check
} from 'lucide-react';
import ArchitectureCanvas from '../components/ArchitectureCanvas';
import MedicineModel from '../components/MedicineModel';

export default function LandingPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  // Scroll tracking for Hero
  const { scrollYProgress: heroYProgress } = useScroll({
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(heroYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(heroYProgress, [0, 0.5], [1, 0]);

  // Scroll tracking for Medicine 3D Section
  const medicineSectionRef = useRef(null);
  const { scrollYProgress: medicineScrollProgress } = useScroll({
    target: medicineSectionRef,
    offset: ["start center", "end center"]
  });

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 font-sans">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <img src="/logo.png" alt="MedGraph Logo" className="w-8 h-8 object-contain" />
            <span className="font-extrabold text-xl tracking-tight text-gray-900">MedGraph</span>
          </div>
          
          <div className="hidden md:flex gap-8">
            <a href="#how-it-works" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">How it Works</a>
            <a href="#components" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Components</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')} 
              className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-bold bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* Section 1: Pure Typography Hero */}
        <section className="relative pt-40 pb-20 px-4 flex flex-col items-center justify-center min-h-[70vh] overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none"></div>
          
          <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            className="w-full max-w-4xl mx-auto flex flex-col items-center z-10 text-center"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-7xl lg:text-8xl font-extrabold font-heading tracking-tighter mb-6 text-gray-900 leading-[1.05]"
            >
              The intelligent <br/>
              medication <br/>
              engine.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg md:text-xl text-gray-500 font-medium text-center max-w-2xl leading-relaxed mb-10"
            >
              A premium intelligence platform orchestrating your health data. Powered by advanced OCR and predictive adherence models.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button 
                onClick={() => navigate('/login')}
                className="bg-black text-white hover:bg-gray-800 font-bold px-8 py-4 rounded-full transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 group"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="bg-white text-gray-900 hover:bg-gray-50 font-bold px-8 py-4 rounded-full transition-all border border-gray-200 shadow-sm"
              >
                Login to OS
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* Section 2: Architecture Interactive Canvas */}
        <section id="how-it-works" className="py-20 relative bg-white z-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-gray-900 mb-4">Inside the Engine</h2>
            <p className="text-gray-500 font-medium max-w-xl mx-auto">Hover over the subsystems to inspect the live telemetry and data orchestration pathways.</p>
          </div>
          <ArchitectureCanvas />
        </section>

        {/* Section 3: Medicine Breakdown */}
        <section ref={medicineSectionRef} id="components" className="py-32 px-4 bg-white relative overflow-hidden border-t border-gray-100 min-h-screen">
          
          {/* Ambient Lighting for 3D section */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-heading font-extrabold tracking-tight text-gray-900 mb-4">Visualizing Posology</h2>
              <p className="text-gray-500 font-medium max-w-xl mx-auto">Scroll to split the capsule and inspect the internal AI verification subsystems.</p>
            </motion.div>
            
            {/* Exploding WebGL 3D Medicine Visual */}
            <div className="relative w-full max-w-4xl h-[600px] flex items-center justify-center">
              
              <MedicineModel scrollProgress={medicineScrollProgress} />

              {/* Emerging Tech Components (2D Parallax Overlays) */}
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                
                {/* Central Brain/Intelligence */}
                <motion.div
                  style={{ opacity: useTransform(medicineScrollProgress, [0.2, 0.6], [0, 1]), scale: useTransform(medicineScrollProgress, [0.2, 0.6], [0.5, 1]) }}
                  className="absolute w-24 h-24 rounded-full bg-white shadow-2xl border border-gray-100 flex items-center justify-center z-30"
                >
                  <Brain className="w-10 h-10 text-blue-600" />
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping"></div>
                </motion.div>

                {/* Floating Component 1: Data Graph */}
                <motion.div
                  style={{ 
                    x: useTransform(medicineScrollProgress, [0.1, 0.9], [-40, -320]), 
                    y: -120, 
                    opacity: useTransform(medicineScrollProgress, [0.1, 0.4], [0, 1]) 
                  }}
                  className="absolute p-3 rounded-xl bg-white shadow-xl border border-gray-100 flex items-center gap-3 relative overflow-hidden"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <LineChart className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-left pr-6">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Adherence
                    </div>
                    <div className="text-sm font-extrabold text-gray-900">98.4%</div>
                  </div>
                  {/* Live Bars */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-end gap-[2px] h-3 opacity-50">
                    <motion.div animate={{ height: ['40%', '100%', '40%'] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-1 rounded-sm bg-emerald-400" />
                    <motion.div animate={{ height: ['70%', '30%', '70%'] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1 rounded-sm bg-emerald-400" />
                    <motion.div animate={{ height: ['50%', '90%', '50%'] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0.1 }} className="w-1 rounded-sm bg-emerald-400" />
                  </div>
                </motion.div>

                {/* Floating Component 2: Molecular Structure */}
                <motion.div
                  style={{ 
                    x: useTransform(medicineScrollProgress, [0.1, 0.9], [40, 320]), 
                    y: -80, 
                    opacity: useTransform(medicineScrollProgress, [0.1, 0.4], [0, 1]) 
                  }}
                  className="absolute p-3 rounded-xl bg-white shadow-xl border border-gray-100 flex items-center gap-3 relative overflow-hidden"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 relative">
                    <Hexagon className="w-4 h-4 text-blue-600" />
                    <div className="absolute inset-0 rounded-lg border border-blue-400 animate-ping opacity-20" style={{ animationDuration: '2s' }}></div>
                  </div>
                  <div className="text-left pr-2">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      Compounds
                    </div>
                    <div className="text-sm font-extrabold text-blue-600">Processing...</div>
                  </div>
                </motion.div>

                {/* Floating Component 3: Safety Alert */}
                <motion.div
                  style={{ 
                    x: useTransform(medicineScrollProgress, [0.1, 0.9], [-40, -280]), 
                    y: 150, 
                    opacity: useTransform(medicineScrollProgress, [0.1, 0.4], [0, 1]) 
                  }}
                  className="absolute p-3 rounded-xl bg-white shadow-xl border border-purple-100/50 flex items-center gap-3 relative overflow-hidden"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
                    <Network className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-left pr-6">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                      LangGraph
                    </div>
                    <div className="text-sm font-extrabold text-gray-900">Semantic DB</div>
                  </div>
                  {/* Live Bars */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-end gap-[2px] h-3 opacity-50">
                    <motion.div animate={{ height: ['40%', '100%', '40%'] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} className="w-1 rounded-sm bg-purple-400" />
                    <motion.div animate={{ height: ['70%', '30%', '70%'] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }} className="w-1 rounded-sm bg-purple-400" />
                    <motion.div animate={{ height: ['50%', '90%', '50%'] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0.3 }} className="w-1 rounded-sm bg-purple-400" />
                  </div>
                </motion.div>

                {/* Floating Component 4: Shield */}
                <motion.div
                  style={{ 
                    x: useTransform(medicineScrollProgress, [0.1, 0.9], [40, 280]), 
                    y: 130, 
                    opacity: useTransform(medicineScrollProgress, [0.1, 0.4], [0, 1]) 
                  }}
                  className="absolute p-3 rounded-xl bg-emerald-50 shadow-xl border border-emerald-100 flex items-center gap-2 pr-4 relative overflow-hidden"
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">Safe Payload</span>
                  <motion.div 
                    className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </motion.div>

              </div>
            </div>
            
          </div>
        </section>

        {/* Section 3.5: Enterprise Security & Compliance */}
        <section className="py-32 px-4 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left side: Writing and Logo */}
            <div>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
                <span className="font-extrabold tracking-tight text-2xl text-gray-900">MedGraph <span className="text-blue-600">Secure</span></span>
              </div>
              <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
                Enterprise-grade security built for healthcare compliance.
              </h2>
              <p className="text-lg text-gray-500 font-medium mb-10 leading-relaxed">
                Your data is encrypted at rest and in transit. We maintain strict adherence to HIPAA, GDPR, and SOC2 standards, ensuring that patient telemetry is always protected by state-of-the-art cryptographic protocols.
              </p>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">End-to-End Encryption</h4>
                    <p className="text-gray-500 font-medium">Military-grade AES-256 encryption across all nodes.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">Zero-Trust Architecture</h4>
                    <p className="text-gray-500 font-medium">Every microservice is authenticated and verified.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">Automated Audit Trails</h4>
                    <p className="text-gray-500 font-medium">Immutable ledger of all system interactions.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Right side: AI Generated Medicine Image with Floating Mockup */}
            <div className="relative h-[500px] rounded-[2rem] bg-gray-50 border border-gray-200 overflow-hidden shadow-2xl group flex items-center justify-center">
              
              {/* AI Generated Medicine Image */}
              <img 
                src="/medicine_security.png" 
                alt="Secure Medical Data Capsule" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent"></div>
              
              {/* Decorative Floating Status Card (overlayed on bottom corner) */}
              <div className="absolute bottom-6 right-6 w-72 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/50 p-6 transform transition-transform group-hover:-translate-y-2 duration-500">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Live</div>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-3xl font-extrabold text-emerald-600 mb-1">100%</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Compliance</div>
                  </div>
                  <div className="flex items-end gap-1 h-8 opacity-70">
                    <motion.div animate={{ height: ['40%', '100%', '40%'] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} className="w-1.5 rounded-sm bg-emerald-400" />
                    <motion.div animate={{ height: ['70%', '30%', '70%'] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }} className="w-1.5 rounded-sm bg-emerald-400" />
                    <motion.div animate={{ height: ['50%', '90%', '50%'] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0.3 }} className="w-1.5 rounded-sm bg-emerald-400" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Section 4: Final CTA (Join Now) */}
        <section className="py-24 px-4 relative bg-[#FDFDFD]">
          <div className="max-w-4xl mx-auto bg-gray-50 rounded-[2rem] p-12 md:p-16 text-center border border-gray-200 shadow-sm relative overflow-hidden">
            {/* Subtle corner gradients */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-[80px]"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-heading font-extrabold mb-4 tracking-tight text-gray-900">Join MedGraph Today</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg font-medium">
                Create your account and deploy your personalized medical intelligence dashboard in seconds.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-black text-white hover:bg-gray-800 font-bold px-10 py-4 rounded-full transition-colors shadow-lg"
                >
                  Sign Up Now
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Professional Footer & Resources */}
        <footer id="resources" className="bg-white border-t border-gray-100 pt-20 pb-10 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                <img src="/logo.png" alt="MedGraph Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
                <span className="font-extrabold text-lg tracking-tight text-gray-900">MedGraph</span>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                The most advanced AI intelligence layer for healthcare data orchestration. Built for precision and scale.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Product</h4>
              <ul className="space-y-4">
                <li><a href="#how-it-works" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">How it Works</a></li>
                <li><a href="#components" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">Core Components</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Resources</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">API Documentation</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">Developer Guides</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">Research Papers</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Company</h4>
              <ul className="space-y-4">
                <li><Link to="/about" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">About Us</Link></li>
                <li><Link to="/careers" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">Careers</Link></li>
                <li><Link to="/privacy" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400 font-medium">© 2026 MedGraph OS. All rights reserved.</p>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-gray-400 text-xs font-bold">X</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-gray-400 text-xs font-bold">in</span>
              </div>
            </div>
          </div>
        </footer>
        
      </main>
    </div>
  );
}
