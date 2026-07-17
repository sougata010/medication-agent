import React, { useRef, useEffect, useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MessageSquare, Send, User, Plus, AlertTriangle,
  Link as LinkIcon, Clock, ChevronLeft, Sparkles, ChevronDown, ChevronUp,
  Stethoscope, HeartPulse, Brain, 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_AFFIRMATIONS = [
  "Analyzing your health profile with care...",
  "Your well-being is our priority...",
  "Cross-referencing FDA safety guidelines...",
  "Checking for potential drug interactions...",
  "Synthesizing your personalized response..."
];

function EmpatheticLoader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % LOADING_AFFIRMATIONS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden h-5 relative w-64 ml-2">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xs font-medium text-gray-500 absolute w-full"
        >
          {LOADING_AFFIRMATIONS[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

const AI_COMMAND_REGEX = /\[ACTION:\s*([A-Z0-9_]+)(?::([^\]]+))?\]/gi;

function MessageRenderer({ content, isUser }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const [navigationAction, setNavigationAction] = useState(null);
  
  // Parse commands and extract them so they don't render as raw text
  useEffect(() => {
    if (isUser) return;
    
    let match;
    const regex = /\[ACTION:\s*([A-Z0-9_]+)(?::([^\]]+))?\]/gi;
    let foundNav = null;

    while ((match = regex.exec(content)) !== null) {
      const command = match[1];
      const payload = match[2]?.trim();
      
      console.log('AI Command Intercepted:', command, payload);
      
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
  const isLong = visibleText.length > 500;

  if (isUser) {
    return <div className="text-sm leading-relaxed whitespace-pre-wrap text-white">{visibleText}</div>;
  }

  // Helper to get nice name for path
  const getNavName = (path) => {
      if(path.includes('medication')) return 'Medications';
      if(path.includes('report')) return 'Lab Reports';
      if(path.includes('reminder')) return 'Reminders';
      if(path.includes('pharmacies')) return 'Pharmacies';
      return 'Dashboard';
  }

  return (
    <div className="relative">
      <div className={`text-sm leading-relaxed ${!isExpanded && isLong ? 'max-h-64 overflow-hidden mask-fade-bottom' : ''}`}>
        <div className="prose pslate-sm pslate-slate max-w-none 
            pslate-p:leading-relaxed pslate-p:mb-2 
            pslate-headings:font-bold pslate-headings:mb-2 
            pslate-a:text-gray-900 pslate-a:no-underline hover:pslate-a:underline
            pslate-strong:font-bold pslate-strong:text-slate-800
            pslate-ul:list-disc pslate-ul:pl-4 pslate-ul:mb-2
            pslate-ol:list-decimal pslate-ol:pl-4 pslate-ol:mb-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {visibleText}
          </ReactMarkdown>
        </div>
      </div>
      
      {isLong && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs font-semibold text-gray-900 flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          {isExpanded ? (
            <><ChevronUp className="w-3 h-3" /> Show Less</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> Read More</>
          )}
        </button>
      )}

      {navigationAction && (
          <div className="mt-3 pt-3 border-t border-gray-100">
              <button 
                  onClick={() => navigate(navigationAction)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors border border-blue-200"
              >
                  <LinkIcon className="w-3 h-3" />
                  Open {getNavName(navigationAction)} Page
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
  const [sessions, setSessions] = useState([]);
  const [showSessions, setShowSessions] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const GQL_ENDPOINT = 'http://localhost:4000/graphql';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (userId) {
      fetchSessions();
    }
  }, [userId]);

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
    <div className="flex flex-col h-[calc(100dvh-140px)] lg:h-[calc(100vh-140px)] max-h-[850px] animate-fade-in relative">
      <div className="flex h-full gap-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Sessions Sidebar — Medical themed */}
        <div className={`${showSessions ? 'flex absolute inset-0 z-20' : 'hidden'} lg:static lg:flex flex-col w-full lg:w-72 border-r border-gray-100 shrink-0 bg-black`}>
          <div className="p-4 border-b border-blue-800/50 flex items-center justify-between">
            <h3 className="text-sm font-heading font-extrabold text-white">Consultations</h3>
            <button
              onClick={startNewSession}
              className="p-1.5 rounded-lg bg-black text-white hover:bg-blue-600 transition-colors"
              title="New Consultation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loadingSessions ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center">
                <Stethoscope className="w-8 h-8 text-gray-900 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No consultations yet</p>
              </div>
            ) : (
              sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={`w-full text-left p-3 rounded-xl mb-1 transition-colors ${
                    chatSessionId === s.id
                      ? 'bg-white/20 border border-white/10 shadow-sm'
                      : 'hover:bg-blue-800/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Stethoscope className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {s.summary || 'Consultation'}
                      </p>
                      <span className="text-[11px] text-gray-500/60 flex items-center gap-1 mt-0.5 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSessions}
                className="lg:hidden p-1.5 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
              >
                {showSessions ? <ChevronLeft className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
              </button>
              <div>
                <h2 className="text-base font-heading font-extrabold text-gray-900 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-gray-500" />
                  Medical Consultation
                </h2>
                <p className="text-[11px] text-gray-500/70 font-medium">Powered by LangGraph · Always consult your doctor</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-rx-pulse" />
              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
            {chatMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 rx-watermark overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 border border-gray-200 relative z-10">
                  <Stethoscope className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-heading font-extrabold text-gray-900 mb-2 relative z-10">Medical AI Consultation</h3>
                <p className="text-sm text-gray-900/60 font-medium max-w-sm relative z-10">
                  Ask about drug interactions, side effects, dosage schedules, or any medication-related question.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-6 relative z-10">
                  {['What are the side effects?', 'Can I take this with food?', 'Missed a dose, what now?'].map(q => (
                    <button
                      key={q}
                      onClick={() => setChatInput(q)}
                      className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-900 hover:border-blue-400 hover:bg-gray-50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const isSafety = !isUser && msg.content.includes('CRITICAL') || !isUser && msg.content.includes('EMERGENCY');

              return (
                <div key={i} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isSafety ? 'bg-slate-100 border border-slate-200' : 'bg-gray-100 border border-gray-200'}`}>
                      {isSafety ? <AlertTriangle className="w-4 h-4 text-slate-500" /> : <Stethoscope className="w-4 h-4 text-gray-900" />}
                    </div>
                  )}

                  <div className={`max-w-[80%] ${
                    isUser
                      ? 'bg-black text-white px-4 py-3 rounded-2xl rounded-br-md shadow-sm'
                      : isSafety
                        ? 'bg-slate-50 border border-slate-200 border-l-4 border-l-slate-500 px-4 py-3 rounded-2xl rounded-bl-md'
                        : 'bg-white border border-gray-100 border-l-4 border-l-blue-500 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm'
                  }`}>
                    <MessageRenderer content={msg.content} isUser={isUser} />

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                        {msg.citations.map((cit, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-900 rounded text-[11px] font-medium border border-gray-100">
                            <LinkIcon className="w-3 h-3" />
                            {cit}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.isUser && (
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-200 flex items-center justify-center border border-blue-300">
                      <User className="w-4 h-4 text-gray-900" />
                    </div>
                  )}
                </div>
              );
            })}
            
            {chatLoading && (
              <div className="flex gap-4 flex-row items-center">
                <div className="w-8 h-8 rounded-xl bg-white border-2 border-gray-100 text-gray-900 flex items-center justify-center shrink-0 shadow-sm">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="bg-white border border-gray-100 rounded-full px-5 py-3 shadow-sm flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <EmpatheticLoader />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <form onSubmit={onSubmit} className="flex items-center gap-3 bg-gray-50/50 border border-gray-200 rounded-xl pl-5 pr-2 py-1.5 focus-within:border-blue-400 focus-within:bg-white transition-all">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Describe your symptoms or ask a question..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-500/60"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg transition-all ${
                  chatInput.trim() && !chatLoading
                    ? 'bg-black text-white hover:bg-blue-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-center text-[11px] text-gray-500/60 mt-2">
              AI-generated advice does not replace professional medical consultation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
