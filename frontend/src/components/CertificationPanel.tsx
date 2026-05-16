'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Award, Sparkles } from 'lucide-react';

export interface CertificationQuestion {
  id: string;
  topic: string;
  questionText: string;
  answer?: string;
  grade?: 'pass' | 'partial' | 'fail';
  rationale?: string;
}

interface CertificationPanelProps {
  questions: CertificationQuestion[];
  onAnswerChange?: (questionId: string, answer: string) => void;
  isCertified?: boolean;
}

export default function CertificationPanel({
  questions,
  onAnswerChange,
  isCertified = false,
}: CertificationPanelProps) {
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [showCelebration, setShowCelebration] = useState(false);

  // Check if certification is achieved (2 of 3 pass)
  const passCount = questions.filter((q) => q.grade === 'pass').length;
  const isNowCertified = passCount >= 2;

  useEffect(() => {
    if (isNowCertified && !showCelebration) {
      setShowCelebration(true);
      // Auto-hide celebration after 5 seconds
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isNowCertified, showCelebration]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setLocalAnswers((prev) => ({ ...prev, [questionId]: value }));
    onAnswerChange?.(questionId, value);
  };

  const getGradeIcon = (grade?: 'pass' | 'partial' | 'fail') => {
    switch (grade) {
      case 'pass':
        return <CheckCircle2 className="w-5 h-5 text-[#24A148]" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-[#FF832B]" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-[#DA1E28]" />;
      default:
        return null;
    }
  };

  const getGradeBadge = (grade?: 'pass' | 'partial' | 'fail') => {
    if (!grade) return null;

    const styles = {
      pass: 'bg-[#24A148]/10 text-[#24A148] border-[#24A148]/30',
      partial: 'bg-[#FF832B]/10 text-[#FF832B] border-[#FF832B]/30',
      fail: 'bg-[#DA1E28]/10 text-[#DA1E28] border-[#DA1E28]/30',
    };

    const labels = {
      pass: 'Pass',
      partial: 'Partial',
      fail: 'Fail',
    };

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${styles[grade]}`}
      >
        {getGradeIcon(grade)}
        {labels[grade]}
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0F62FE]" />
            <h2 className="text-lg font-semibold text-[#161616]">
              Certification Quiz
            </h2>
          </div>
          {isNowCertified && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#24A148]/10 text-[#24A148] rounded-full border border-[#24A148]/30"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">Certified!</span>
            </motion.div>
          )}
        </div>
        <p className="mt-1 text-sm text-[#6F6F6F]">
          Answer 2 of 3 questions correctly to earn certification
        </p>
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-3"
          >
            {/* Question Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[#6F6F6F] uppercase tracking-wide">
                    Question {index + 1}
                  </span>
                  <span className="text-xs text-[#8A3FFC] font-medium">
                    {question.topic}
                  </span>
                </div>
                <p className="text-base font-serif text-[#161616] leading-relaxed">
                  {question.questionText}
                </p>
              </div>
              {getGradeBadge(question.grade)}
            </div>

            {/* Answer Input */}
            <textarea
              value={localAnswers[question.id] || question.answer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Type your answer here..."
              disabled={!!question.grade}
              className={`w-full px-4 py-3 border rounded-lg text-sm font-mono resize-none transition-colors ${
                question.grade
                  ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                  : 'bg-white border-gray-300 text-[#161616] focus:border-[#0F62FE] focus:ring-2 focus:ring-[#0F62FE]/20 focus:outline-none'
              }`}
              rows={4}
            />

            {/* Rationale (shown after grading) */}
            <AnimatePresence>
              {question.rationale && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`px-4 py-3 rounded-lg border-l-4 ${
                    question.grade === 'pass'
                      ? 'bg-[#24A148]/5 border-[#24A148]'
                      : question.grade === 'partial'
                      ? 'bg-[#FF832B]/5 border-[#FF832B]'
                      : 'bg-[#DA1E28]/5 border-[#DA1E28]'
                  }`}
                >
                  <p className="text-xs font-medium text-[#6F6F6F] mb-1">
                    Bob's Feedback:
                  </p>
                  <p className="text-sm text-[#161616] leading-relaxed">
                    {question.rationale}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Empty State */}
        {questions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Award className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-[#6F6F6F]">
              Certification questions will appear here
            </p>
            <p className="text-xs text-[#8A8A8A] mt-1">
              Complete the cartography stages first
            </p>
          </div>
        )}
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#24A148]/5 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="bg-white rounded-2xl shadow-2xl px-8 py-6 border-2 border-[#24A148]"
            >
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                >
                  <Award className="w-16 h-16 text-[#24A148]" />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[#161616] mb-1">
                    Congratulations!
                  </h3>
                  <p className="text-sm text-[#6F6F6F]">
                    You've earned your repository certification
                  </p>
                </div>
                <div className="flex gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Sparkles className="w-4 h-4 text-[#8A3FFC]" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Made with Bob
