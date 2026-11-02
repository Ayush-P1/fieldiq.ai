import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Scenario, Fielder, EvaluationResult } from '../types/field';
import { sendChatMessage } from '../services/api';
import { MessageSquare, Send, Cpu, Sparkles } from 'lucide-react';

interface CaptainChatProps {
  scenario: Scenario;
  fielders: Fielder[];
  evaluation: EvaluationResult | null;
}

const SUGGESTED_QUESTIONS = [
  'Why is my score low?',
  'What is the biggest risk?',
  'Why recommend long-on?',
  'How to set field vs left-hander?',
  'What are exposed zones?',
];

export default function CaptainChat({ scenario, fielders, evaluation }: CaptainChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'captain',
      content: `Welcome, Captain! I'm your AI field-setting advisor for the "${scenario.name}" scenario. Ask me anything about your field placement, exposed zones, or tactical decisions.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLLM, setIsLLM] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset welcome message when scenario changes
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'captain',
      content: `Scenario switched to "${scenario.name}". ${scenario.description} Ask me anything about your field!`,
      timestamp: new Date(),
    }]);
  }, [scenario.id]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await sendChatMessage(scenario, text.trim(), fielders, evaluation, messages);
      const captainMsg: ChatMessage = {
        id: `c-${Date.now()}`,
        role: 'captain',
        content: reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, captainMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'captain',
        content: 'Sorry, I\'m having trouble responding right now. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl flex flex-col panel-fade" style={{ height: 420 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-500/20 rounded-lg flex items-center justify-center">
            <MessageSquare size={14} className="text-green-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200">Ask the Captain</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            isLLM
              ? 'bg-purple-900/40 text-purple-300 border-purple-700/50'
              : 'bg-slate-700/60 text-slate-400 border-slate-600/50'
          }`}>
            {isLLM ? <><Sparkles size={9} className="inline mr-1" />Gemini</> : <><Cpu size={9} className="inline mr-1" />Local AI</>}
          </span>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`chat-bubble flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-green-600/30 text-slate-200 border border-green-700/40 ml-6'
                  : 'bg-slate-700/60 text-slate-300 border border-slate-600/40 mr-6'
              }`}
            >
              {msg.role === 'captain' && (
                <p className="text-green-400 font-semibold text-xs mb-0.5">⚡ Captain</p>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start chat-bubble">
            <div className="bg-slate-700/60 border border-slate-600/40 rounded-xl px-3 py-2 text-xs">
              <p className="text-green-400 font-semibold mb-0.5">⚡ Captain</p>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-slate-400 ai-thinking"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto">
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => sendMessage(q)}
            disabled={isLoading}
            className="flex-shrink-0 text-xs px-2.5 py-1 bg-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-600/60 rounded-full border border-slate-600/40 transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your field…"
          disabled={isLoading}
          className="flex-1 bg-slate-700/60 border border-slate-600/40 text-slate-200 placeholder-slate-500 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-green-500/60 disabled:opacity-60"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          className="w-8 h-8 flex items-center justify-center bg-green-600 hover:bg-green-500 disabled:bg-slate-600 rounded-lg transition-colors btn-primary"
        >
          <Send size={13} className="text-white" />
        </button>
      </div>
    </div>
  );
}
