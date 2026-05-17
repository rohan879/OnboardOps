'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Award, Sparkles } from 'lucide-react';
import { gradeAnimations, celebrationVariants } from '@/components/animations';

export interface CertificationQuestion {
  id: string;
  topic: string;
  questionText: string;
  responseMode?: 'free_text' | 'multiple_choice';
  options?: string[];
  answer?: string;
  grade?: 'pass' | 'partial' | 'fail';
  rationale?: string;
}

export interface CertificationSubmissionState {
  pending?: boolean;
  submitted?: boolean;
  error?: string;
}

interface CertificationPanelProps {
  questions: CertificationQuestion[];
  onAnswerChange?: (questionId: string, answer: string) => void;
  onAnswerSubmit?: (questionId: string) => Promise<void> | void;
  submissionState?: Record<string, CertificationSubmissionState>;
  canSubmitAnswers?: boolean;
  isCertified?: boolean;
}

export default function CertificationPanel({
  questions,
  onAnswerChange,
  onAnswerSubmit,
  submissionState = {},
  canSubmitAnswers = false,
  isCertified = false,
}: CertificationPanelProps) {
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationShownRef = useRef(false);

  // Check if certification is achieved (2 of 3 pass)
  const passCount = questions.filter((q) => q.grade === 'pass').length;
  const isNowCertified = isCertified || passCount >= 2;

  useEffect(() => {
    if (!isNowCertified || celebrationShownRef.current) return;

    celebrationShownRef.current = true;
    const showTimer = setTimeout(() => setShowCelebration(true), 0);
    const hideTimer = setTimeout(() => setShowCelebration(false), 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isNowCertified]);

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

    const anim = gradeAnimations[grade];

    return (
      <motion.div
        initial={anim.initial}
        animate={anim.animate}
        transition={anim.transition}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${styles[grade]}`}
      >
        {getGradeIcon(grade)}
        {labels[grade]}
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Story-beat screen-edge highlight when certified */}
      <AnimatePresence>
        {isNowCertified && showCelebration && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            style={{
              background: 'radial-gradient(circle at center, rgba(36, 161, 72, 0.2), transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>
      
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
            {(() => {
              const draftAnswer = question.answer || localAnswers[question.id] || '';
              const submitState = submissionState[question.id] || {};
              const isLocked =
                !!question.grade || submitState.pending || submitState.submitted;
              const isMultipleChoice =
                question.responseMode === 'multiple_choice' &&
                Boolean(question.options?.length);

              return (
                <>
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
            {isMultipleChoice ? (
              <div className="space-y-3">
                {question.options?.map((option, optionIndex) => {
                  const isSelected = draftAnswer === option;

                  return (
                    <button
                      key={`${question.id}-${option}`}
                      type="button"
                      onClick={() => handleAnswerChange(question.id, option)}
                      disabled={isLocked}
                      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                        isLocked
                          ? isSelected
                            ? 'border-[#0F62FE]/40 bg-[#0F62FE]/8 text-[#161616]'
                            : 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
                          : isSelected
                            ? 'border-[#0F62FE] bg-[#0F62FE]/8 text-[#161616] shadow-sm'
                            : 'border-gray-300 bg-white text-[#161616] hover:border-[#0F62FE]/60 hover:bg-[#0F62FE]/3'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                          isSelected
                            ? 'border-[#0F62FE] bg-[#0F62FE] text-white'
                            : 'border-gray-300 text-[#6F6F6F]'
                        }`}
                      >
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="text-sm leading-relaxed">{option}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={draftAnswer}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Type your answer here..."
                disabled={isLocked}
                className={`w-full px-4 py-3 border rounded-lg text-sm font-mono resize-none transition-colors ${
                  isLocked
                    ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                    : 'bg-white border-gray-300 text-[#161616] focus:border-[#0F62FE] focus:ring-2 focus:ring-[#0F62FE]/20 focus:outline-none'
                }`}
                rows={4}
              />
            )}

            {!question.grade && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#6F6F6F]">
                  {submitState.pending
                    ? 'Answer submitted from the website. Bob is grading it now.'
                    : submitState.submitted
                      ? 'Waiting for Bob to grade this dashboard answer.'
                    : canSubmitAnswers
                        ? isMultipleChoice
                          ? 'Pick one option here and keep the graph visible while Bob grades in the background.'
                          : 'Submit here and keep the graph visible while Bob grades in the background.'
                        : 'Live answer submission is only available during an active onboarding session.'}
                </div>

                <button
                  type="button"
                  onClick={() => onAnswerSubmit?.(question.id)}
                  disabled={
                    !canSubmitAnswers ||
                    !draftAnswer.trim() ||
                    submitState.pending ||
                    submitState.submitted
                  }
                  className="inline-flex items-center justify-center rounded-full bg-[#0F62FE] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0043CE] disabled:cursor-not-allowed disabled:bg-[#C6C6C6]"
                >
                  {submitState.pending ? 'Submitting...' : 'Submit on website'}
                </button>
              </div>
            )}

            {submitState.error && !question.grade && (
              <p className="text-xs text-[#DA1E28]">{submitState.error}</p>
            )}

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
                    Bob&apos;s Feedback:
                  </p>
                  <p className="text-sm text-[#161616] leading-relaxed">
                    {question.rationale}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
                </>
              );
            })()}
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
              Complete the cartography stages first, then answer them right here.
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
              variants={celebrationVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
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
                    You&apos;ve earned your repository certification
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
