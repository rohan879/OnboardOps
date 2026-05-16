'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { useEventsStore } from '@/store/events';

export interface TranscriptMessage {
  id: string;
  role: 'bob' | 'user' | 'system';
  content: string;
  timestamp: string;
}

interface TranscriptPanelProps {
  className?: string;
  maxHeight?: number;
}

export function TranscriptPanel({ className = '', maxHeight = 400 }: TranscriptPanelProps) {
  const events = useEventsStore((state) => state.events);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Convert events to transcript messages
  const messages: TranscriptMessage[] = events
    .filter((event) =>
      event.type === 'turn_end' ||
      event.type === 'card_emit' ||
      event.type === 'certification_grade'
    )
    .map((event) => {
      let content = 'Processing...';
      
      if (event.type === 'turn_end') {
        const tokensUsed = event.data.tokens_used as number || 0;
        const duration = event.data.duration_ms as number || 0;
        content = `Turn ${event.data.turn_number} completed (${tokensUsed} tokens, ${duration}ms)`;
      } else if (event.type === 'card_emit') {
        const title = event.data.title as string || 'Card';
        content = `Generated: ${title}`;
      } else if (event.type === 'certification_grade') {
        const grade = event.data.grade as string || 'unknown';
        content = `Certification: ${grade}`;
      }
      
      return {
        id: event.id,
        role: 'bob' as const,
        content,
        timestamp: event.timestamp,
      };
    });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className={`flex flex-col bg-white rounded-lg border border-ibm-gray-20 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-ibm-gray-10 bg-ibm-gray-10/30">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-ibm-blue-60" />
          <h3 className="text-sm font-semibold text-ibm-gray-100">
            Bob Narration
          </h3>
          <span className="ml-auto text-xs text-ibm-gray-50">
            {messages.length} messages
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ maxHeight }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-ibm-gray-50">
            Waiting for Bob to start narrating...
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex gap-3"
              >
                {/* Avatar */}
                <div
                  className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                    ${
                      message.role === 'bob'
                        ? 'bg-ibm-blue-60'
                        : message.role === 'user'
                        ? 'bg-ibm-gray-70'
                        : 'bg-ibm-gray-30'
                    }
                  `}
                >
                  {message.role === 'bob' ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-xs text-white font-bold">S</span>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold text-ibm-gray-100">
                      {message.role === 'bob' ? 'Bob' : message.role === 'user' ? 'You' : 'System'}
                    </span>
                    <span className="text-xs text-ibm-gray-50">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-ibm-gray-90 leading-relaxed">
                    <TypewriterText text={message.content} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-ibm-gray-10 bg-ibm-gray-10/30">
        <div className="text-xs text-ibm-gray-50 text-center">
          Live transcript from Bob onboarding session
        </div>
      </div>
    </div>
  );
}

// Typewriter effect component (optional, can be disabled for performance)
function TypewriterText({ text }: { text: string }) {
  // For now, just display the text immediately
  // Typewriter effect can be added later if needed
  return <span>{text}</span>;
}

// Made with Bob