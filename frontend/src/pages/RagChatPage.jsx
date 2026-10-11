import React, { useState, useRef, useEffect } from 'react';
import { knowledgeApi } from '../api/knowledgeApi';
import {
  MessageSquareCode,
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export function RagChatPage() {
  const [messages, setMessages] = useState([]);

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const userQuestion = inputText.trim();
    setInputText('');

    const newTimestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userQuestion,
      timestamp: newTimestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    setSending(true);

    try {
      // Build conversation history from previous turns
      const history = messages.map((m) => `${m.sender}: ${m.text}`).slice(-6);
      const res = await knowledgeApi.askQuestion(userQuestion, history);

      const aiMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: res.answer || 'Answer generated based on knowledge base documents.',
        sources: (res.sources || []).map((s) => ({
          title: s.title || 'Knowledge Base Document',
          heading: s.headingPath || 'Section 1.0',
        })),
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: err.userMessage || 'The knowledge service could not answer this question right now.',
        sources: [],
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-300">
      {/* Header (Screen 6) */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Ask DevPilot AI
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Get answers from your knowledge base with source references.
        </p>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
        {messages.length === 0 && (
          <div className="h-full min-h-[260px] flex items-center justify-center text-center">
            <div className="max-w-md space-y-2">
              <BookOpen className="w-9 h-9 text-indigo-600 mx-auto" />
              <h2 className="text-sm font-bold text-slate-900">Ask the backend knowledge base</h2>
              <p className="text-xs text-slate-500">
                Answers and source references will appear after the knowledge service responds.
              </p>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id}>
            {m.sender === 'user' ? (
              /* User Bubble (Right) */
              <div className="flex justify-end items-end gap-2.5">
                <span className="text-[10px] text-slate-400 mb-1">{m.timestamp}</span>
                <div className="max-w-xl bg-indigo-600 text-white px-5 py-3.5 rounded-2xl rounded-br-sm shadow-md shadow-indigo-600/10 text-xs sm:text-sm font-medium leading-relaxed">
                  {m.text}
                </div>
              </div>
            ) : (
              /* AI Bubble (Left) */
              <div className="flex items-start gap-3 max-w-2xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-5 shadow-sm space-y-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
                  <div className="whitespace-pre-line text-slate-700">
                    {m.text}
                  </div>

                  {/* Sources section */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-1.5">
                      <span className="text-xs font-bold text-slate-900 block">
                        Sources:
                      </span>
                      <div className="space-y-1">
                        {m.sources.map((src, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                            onClick={() => alert(`Source citation: ${src.title} (${src.heading})`)}
                          >
                            <span>{i + 1}.</span>
                            <span className="underline">{src.title}</span>
                            <span className="text-slate-500">({src.heading})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                    <span>Grounding: PostgreSQL pgvector</span>
                    <span>{m.timestamp}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Querying embeddings and generating grounded answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box (Screen 6 bottom) */}
      <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-200">
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 p-2 shadow-sm focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a follow-up question..."
            disabled={sending}
            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            aria-label="Send question"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
