import React, { useRef, useEffect, useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import {
  MessageSquare, Send, Bot, User, Plus, AlertTriangle,
  Link as LinkIcon, Clock, ChevronLeft, Sparkles
} from 'lucide-react';

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

  // Fetch all sessions
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const token = localStorage.getItem('medgraph_token');
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

  // Load a specific session's messages
  const loadSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('medgraph_token');
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
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[850px] animate-fade-in">
      <div className="flex h-full gap-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Sessions Sidebar */}
        <div className={`${showSessions ? 'flex' : 'hidden'} lg:flex flex-col w-72 border-r border-gray-100 shrink-0 bg-gray-50/50`}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-900">Conversations</h3>
            <button
              onClick={startNewSession}
              className="p-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              title="New Conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loadingSessions ? (
              <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No conversations yet</p>
              </div>
            ) : (
              sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={`w-full text-left p-3 rounded-xl mb-1 transition-colors ${
                    chatSessionId === s.id
                      ? 'bg-white border border-gray-200 shadow-sm'
                      : 'hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {s.summary || 'Conversation'}
                      </p>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
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
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSessions}
                className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                {showSessions ? <ChevronLeft className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
              </button>
              <div>
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  MedGraph AI
                </h2>
                <p className="text-[11px] text-gray-400 font-medium">Powered by LangGraph · Always consult your doctor</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
            {chatMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 border border-gray-200">
                  <Bot className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">Ask MedGraph AI</h3>
                <p className="text-sm text-gray-400 font-medium max-w-sm">
                  Ask about drug interactions, side effects, dosage schedules, or any medication-related question.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {['What are the side effects?', 'Can I take this with food?', 'Missed a dose, what now?'].map(q => (
                    <button
                      key={q}
                      onClick={() => setChatInput(q)}
                      className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
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
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isSafety ? 'bg-red-100 border border-red-200' : 'bg-gray-100 border border-gray-200'}`}>
                      {isSafety ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Bot className="w-4 h-4 text-gray-500" />}
                    </div>
                  )}

                  <div className={`max-w-[80%] ${
                    isUser
                      ? 'bg-gray-900 text-white px-4 py-3 rounded-2xl rounded-br-md shadow-sm'
                      : isSafety
                        ? 'bg-red-50 border border-red-200 px-4 py-3 rounded-2xl rounded-bl-md'
                        : ''
                  }`}>
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser ? 'text-white' : isSafety ? 'text-red-800' : 'text-gray-700'
                    }`}>
                      {msg.content}
                    </div>

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                        {msg.citations.map((cit, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[11px] font-medium border border-blue-100">
                            <LinkIcon className="w-3 h-3" />
                            {cit}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center border border-gray-300">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              );
            })}

            {chatLoading && (
              <div className="flex gap-3 justify-start">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                  <Bot className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex items-center gap-1.5 pt-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <form onSubmit={onSubmit} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-full pl-5 pr-2 py-1.5 focus-within:border-gray-300 focus-within:bg-white transition-all">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask MedGraph AI about your medications..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all ${
                  chatInput.trim() && !chatLoading
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-center text-[11px] text-gray-400 mt-2">
              AI-generated advice does not replace professional medical consultation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
