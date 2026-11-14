import React, { useRef, useEffect, useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MessageSquare, Send, User, Plus, AlertTriangle,
  Link as LinkIcon, Clock, ChevronLeft, ChevronDown, ChevronUp,
  Stethoscope, HeartPulse, ShieldCheck, CheckCircle2, ArrowRight,
  ExternalLink, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_AFFIRMATIONS = [
  "Cross-referencing verified OpenFDA safety registries...",
  "Evaluating multi-drug interactions & contraindications...",
  "Synthesizing pharmacological guidelines & evidence...",
  "Preparing structured clinical summary..."
];

function EmpatheticLoader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % LOADING_AFFIRMATIONS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden h-5 relative w-72">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -15, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="text-xs font-medium text-slate-600 absolute w-full"
        >
          {LOADING_AFFIRMATIONS[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function MessageRenderer({ content, isUser }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const [navigationAction, setNavigationAction] = useState(null);

  // Parse commands and extract them cleanly
  useEffect(() => {
    if (isUser) return;
    const regex = /\[ACTION:\s*([A-Z0-9_]+)(?::([^\]]+))?\]/gi;
    let match;
    let foundNav = null;

    while ((match = regex.exec(content)) !== null) {
      const command = match[1];
      const payload = match[2]?.trim();
      if (command === 'NAVIGATE' && payload) {
        foundNav = payload;
      }
    }

    if (foundNav) {
      setNavigationAction(foundNav);
    }
  }, [content, isUser]);

  // Strip commands from visible text
  const visibleText = content.replace(/\[ACTION:\s*([A-Z0-9_]+)(?::([^\]]+))?\]/gi, '').trim();
  const isLong = visibleText.length > 600;

  if (isUser) {
    return <div className="text-sm leading-relaxed whitespace-pre-wrap font-normal">{visibleText}</div>;
  }

  const getNavLabel = (path) => {
    if (path.includes('pharmacies')) return 'Open Pharmacy & Live Ordering Hub';
    if (path.includes('medication')) return 'Review Active Medications';
    if (path.includes('report')) return 'View Laboratory Diagnostics';
    if (path.includes('reminder')) return 'Open Adherence Schedule';
    return 'Go to Clinical Overview';
  };

  return (
    <div className="relative">
      <div className={`text-sm leading-relaxed text-slate-800 ${!isExpanded && isLong ? 'max-h-72 overflow-hidden mask-fade-bottom' : ''}`}>
        <div className="prose prose-sm prose-slate max-w-none 
            prose-p:leading-relaxed prose-p:mb-2.5 
            prose-headings:font-bold prose-headings:text-slate-900 prose-headings:mt-3 prose-headings:mb-1.5
            prose-a:text-blue-600 prose-a:font-semibold hover:prose-a:underline
            prose-strong:font-bold prose-strong:text-slate-900
            prose-ul:list-disc prose-ul:pl-4 prose-ul:mb-2 prose-ul:space-y-1
            prose-ol:list-decimal prose-ol:pl-4 prose-ol:mb-2 prose-ol:space-y-1">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {visibleText}
          </ReactMarkdown>
        </div>
      </div>

      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors"
        >
          {isExpanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show Compact View</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Read Full Consultation Summary</>
          )}
        </button>
      )}

      {navigationAction && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center">
          <button
            onClick={() => navigate(navigationAction)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all group"
          >
            <span>{getNavLabel(navigationAction)}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChatCompanion() {
  const {
    chatMessages, chatLoading, chatInput, setChatInput, handleSendMessage,
    chatSessionId, setChatSessionId, setChatMessages, userId
  } = useGlobalContext();
  const messagesEndRef = useRef(null);
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState([]);
  const [showSessions, setShowSessions] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const GQL_ENDPOINT = 'http://localhost:4000/graphql';

  // Handle incoming referral inquiry from Diagnostic Assessment
  useEffect(() => {
    const inquiryParam = searchParams.get('inquiry');
    if (inquiryParam) {
      setChatInput(inquiryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (userId) {
      fetchSessions();
    }
  }, [userId]);

  const cleanSessionTitle = (raw) => {
    if (!raw || 
        raw.toLowerCase().includes('failed') || 
        raw.toLowerCase().includes('synthesi') || 
        raw.toLowerCase().includes('starting up') || 
        raw.toLowerCase().includes('medgraph ai') ||
        raw.toLowerCase().includes('error')) {
      return 'Medication & Health Inquiry';
    }
    return raw.replace(/\[ACTION:[^\]]+\]/gi, '').trim();
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const token = localStorage.getItem('VitaLeaf_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(GQL_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `query GetSessions($userId: ID!) {
            getChatSessions(userId: $userId) {
              id
              startedAt
              summary
            }
          }`,
          variables: { userId }
        })
      });
      const data = await res.json();
      if (data.data?.getChatSessions) {
        setSessions(data.data.getChatSessions);
      }
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
    }
    setLoadingSessions(false);
  };

  const loadSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('VitaLeaf_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(GQL_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `query GetMessages($sessionId: ID!) {
            getChatMessages(sessionId: $sessionId) {
              role
              content
              createdAt
            }
          }`,
          variables: { sessionId }
        })
      });
      const data = await res.json();
      if (data.data?.getChatMessages) {
        setChatSessionId(sessionId);
        setChatMessages(data.data.getChatMessages);
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }
    setShowSessions(false);
  };

  const startNewSession = () => {
    setChatSessionId(null);
    setChatMessages([]);
    setShowSessions(false);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim() && !chatLoading) {
      handleSendMessage(e, chatInput);
    }
  };

  const toggleSessions = () => {
    if (!showSessions) fetchSessions();
    setShowSessions(!showSessions);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-130px)] lg:h-[calc(100vh-130px)] max-h-[880px] animate-fade-in relative">
      <div className="flex h-full gap-0 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">

        {/* Sessions Sidebar — Enterprise Clinical Slate */}
        <div className={`${showSessions ? 'flex absolute inset-0 z-20' : 'hidden'} lg:static lg:flex flex-col w-full lg:w-72 border-r border-slate-200/80 shrink-0 bg-slate-50/80 backdrop-blur-sm`}>
          <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white/70">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Consultation History</h3>
              <p className="text-[11px] text-slate-500">Documented Clinical Records</p>
            </div>
            <button
              onClick={startNewSession}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              title="Start New Consultation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {loadingSessions ? (
              <div className="py-12 text-center text-xs text-slate-400">Retrieving records...</div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center px-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-600 mb-0.5">No Prior Sessions</p>
                <p className="text-[11px] text-slate-400">New clinical consultations will automatically save here.</p>
              </div>
            ) : (
              sessions.map(s => {
                const isActive = chatSessionId === s.id;
                const title = cleanSessionTitle(s.summary);
                return (
                  <button
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-150 ${
                      isActive
                        ? 'bg-white text-blue-700 shadow-xs border border-blue-200/70 font-semibold ring-1 ring-blue-500/10'
                        : 'hover:bg-slate-200/50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Stethoscope className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate leading-snug">
                          {title}
                        </p>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Consultation Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Header Bar */}
          <div className="px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white/90 backdrop-blur-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSessions}
                className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                title="Toggle Consultations"
              >
                {showSessions ? <ChevronLeft className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
              </button>
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-blue-600" />
                  Clinical Consultation Desk
                </h2>
                <p className="text-[11px] text-slate-500 font-normal">
                  Evidence-Based Pharmacological Intelligence · Verifiable OpenFDA & Clinical Protocols
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Clinical Desk Active</span>
            </div>
          </div>

          {/* Messages Flow */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
            {chatMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-4 shadow-xs">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  How may we assist with your health regimen today?
                </h3>
                <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
                  Query verified medication interactions, dosage guidelines, contraindication warnings, or review pricing across certified pharmacy networks.
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {[
                    'Price of my medicines',
                    'Check drug-drug interactions for my profile',
                    'Common side effects & precautions for Lipitor',
                    'What should I do if I missed a dose?'
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => setChatInput(q)}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition-all shadow-2xs"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const isEmergency = !isUser && (msg.content.includes('CRITICAL MEDICAL ALERT') || msg.content.includes('EMERGENCY'));

              return (
                <div key={i} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-xs mt-0.5 ${
                      isEmergency
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-white text-blue-600 border border-slate-200'
                    }`}>
                      {isEmergency ? <AlertTriangle className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                    </div>
                  )}

                  <div className={`max-w-[82%] ${
                    isUser
                      ? 'bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-xs shadow-xs'
                      : isEmergency
                        ? 'bg-rose-50/80 border border-rose-200 text-rose-950 px-5 py-4 rounded-2xl rounded-tl-xs shadow-xs'
                        : 'bg-white border border-slate-200/90 px-5 py-4 rounded-2xl rounded-tl-xs shadow-xs'
                  }`}>
                    <MessageRenderer content={msg.content} isUser={isUser} />

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Sources:</span>
                        {msg.citations.map((cit, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[11px] font-medium border border-slate-200/70"
                          >
                            <LinkIcon className="w-3 h-3 text-slate-400" />
                            {cit}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-xs mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {chatLoading && (
              <div className="flex gap-3 items-center pt-2">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-xs flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <EmpatheticLoader />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Console */}
          <div className="p-4 border-t border-slate-200/80 bg-white">
            <form onSubmit={onSubmit} className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-1.5 py-1.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask regarding medications, dosages, potential interactions, or order routing..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg transition-all ${
                  chatInput.trim() && !chatLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title="Send Inquiry"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Confidential Clinical Ingestion Protocol. Sourced directly from verifiable pharmaceutical records.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
