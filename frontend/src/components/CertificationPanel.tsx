'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
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
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
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

  const targetQuestionCount = Math.max(3, questions.length);
  const firstOpenQuestion =
    questions.find((question) => !question.grade) || questions[questions.length - 1];
  const requestedQuestion = questions.find(
    (question) => question.id === activeQuestionId
  );
  const activeQuestion =
    requestedQuestion && (!requestedQuestion.grade || !firstOpenQuestion)
      ? requestedQuestion
      : firstOpenQuestion || questions[0];
  const activeQuestionIndex = activeQuestion
    ? questions.findIndex((question) => question.id === activeQuestion.id)
    : -1;
  const previousQuestion =
    activeQuestionIndex > 0 ? questions[activeQuestionIndex - 1] : null;
  const nextQuestion =
    activeQuestionIndex >= 0 && activeQuestionIndex < questions.length - 1
      ? questions[activeQuestionIndex + 1]
      : null;
  const activeDraftAnswer = activeQuestion
    ? activeQuestion.answer || localAnswers[activeQuestion.id] || ''
    : '';
  const activeSubmitState = activeQuestion
    ? submissionState[activeQuestion.id] || {}
    : {};
  const isLocked =
    !!activeQuestion?.grade ||
    activeSubmitState.pending ||
    activeSubmitState.submitted;
  const isMultipleChoice =
    activeQuestion?.responseMode === 'multiple_choice' &&
    Boolean(activeQuestion.options?.length);

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
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {questions.length === 0 || !activeQuestion ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <Award className="mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm text-[#6F6F6F]">
              Certification questions will appear here
            </p>
            <p className="mt-1 text-xs text-[#8A8A8A]">
              Complete the cartography stages first, then answer them right here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <div className="rounded-[24px] border border-[#0F62FE]/15 bg-[linear-gradient(135deg,rgba(15,98,254,0.08),rgba(138,63,252,0.05))] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6F6F6F]">
                  Quiz Progress
                </div>
                <div className="mt-3 text-3xl font-semibold text-[#161616]">
                  {activeQuestionIndex + 1}
                  <span className="text-lg font-medium text-[#6F6F6F]">
                    /{targetQuestionCount}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#525252]">
                  Focus on one question at a time. Your previous answers stay
                  available for review without pushing the current task downward.
                </p>
              </div>

              <div className="space-y-2">
                {questions.map((question, index) => {
                  const questionSubmitState = submissionState[question.id] || {};
                  const isActive = question.id === activeQuestion.id;
                  const isAnswered =
                    Boolean(question.answer || localAnswers[question.id]) ||
                    questionSubmitState.submitted ||
                    questionSubmitState.pending;

                  const statusLabel = question.grade
                    ? question.grade === 'pass'
                      ? 'Passed'
                      : question.grade === 'partial'
                        ? 'Partial'
                        : 'Needs work'
                    : questionSubmitState.pending
                      ? 'Submitting'
                      : questionSubmitState.submitted
                        ? 'Waiting'
                        : isAnswered
                          ? 'Drafted'
                          : 'Open';

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setActiveQuestionId(question.id)}
                      className={`w-full rounded-[20px] border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-[#0F62FE] bg-[#0F62FE]/8 shadow-[0_12px_24px_rgba(15,98,254,0.10)]'
                          : 'border-gray-200 bg-white hover:border-[#0F62FE]/30 hover:bg-[#0F62FE]/3'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-[#6F6F6F]">
                            Question {index + 1}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-[#161616]">
                            {question.topic}
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            question.grade === 'pass'
                              ? 'bg-[#24A148]/10 text-[#24A148]'
                              : question.grade === 'partial'
                                ? 'bg-[#FF832B]/10 text-[#FF832B]'
                                : question.grade === 'fail'
                                  ? 'bg-[#DA1E28]/10 text-[#DA1E28]'
                                  : isActive
                                    ? 'bg-[#0F62FE]/10 text-[#0F62FE]'
                                    : 'bg-gray-100 text-[#6F6F6F]'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="space-y-4">
              <motion.div
                key={activeQuestion.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24 }}
                className="rounded-[28px] border border-gray-200 bg-[linear-gradient(180deg,#ffffff,rgba(244,244,244,0.55))] p-6 shadow-[0_18px_36px_rgba(22,22,22,0.04)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-[#6F6F6F]">
                        Question {activeQuestionIndex + 1} of {targetQuestionCount}
                      </span>
                      <span className="text-xs font-medium text-[#8A3FFC]">
                        {activeQuestion.topic}
                      </span>
                    </div>
                    <p className="max-w-4xl text-[1.1rem] font-serif leading-relaxed text-[#161616]">
                      {activeQuestion.questionText}
                    </p>
                  </div>
                  {getGradeBadge(activeQuestion.grade)}
                </div>

                {isMultipleChoice ? (
                  <div className="mt-6 grid gap-3">
                    {activeQuestion.options?.map((option, optionIndex) => {
                      const isSelected = activeDraftAnswer === option;

                      return (
                        <button
                          key={`${activeQuestion.id}-${option}`}
                          type="button"
                          onClick={() => handleAnswerChange(activeQuestion.id, option)}
                          disabled={isLocked}
                          className={`flex w-full items-start gap-4 rounded-2xl border px-5 py-4 text-left transition ${
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
                            className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                              isSelected
                                ? 'border-[#0F62FE] bg-[#0F62FE] text-white'
                                : 'border-gray-300 text-[#6F6F6F]'
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span className="text-base leading-relaxed">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    value={activeDraftAnswer}
                    onChange={(e) => handleAnswerChange(activeQuestion.id, e.target.value)}
                    placeholder="Type your answer here..."
                    disabled={isLocked}
                    className={`mt-6 w-full resize-none rounded-2xl border px-5 py-4 text-base font-mono transition-colors ${
                      isLocked
                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-600'
                        : 'border-gray-300 bg-white text-[#161616] focus:border-[#0F62FE] focus:ring-2 focus:ring-[#0F62FE]/20 focus:outline-none'
                    }`}
                    rows={5}
                  />
                )}

                {!activeQuestion.grade && (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#0F62FE]/10 bg-[#0F62FE]/4 px-4 py-3">
                    <div className="text-sm text-[#525252]">
                      {activeSubmitState.pending
                        ? 'Answer submitted from the website. Bob is grading it now.'
                        : activeSubmitState.submitted
                          ? 'Waiting for Bob to grade this dashboard answer.'
                          : canSubmitAnswers
                            ? isMultipleChoice
                              ? 'Pick one answer here and keep the architecture view open while Bob grades in the background.'
                              : 'Submit here and keep the architecture view open while Bob grades in the background.'
                            : 'Live answer submission is only available during an active onboarding session.'}
                    </div>

                    <button
                      type="button"
                      onClick={() => onAnswerSubmit?.(activeQuestion.id)}
                      disabled={
                        !canSubmitAnswers ||
                        !activeDraftAnswer.trim() ||
                        activeSubmitState.pending ||
                        activeSubmitState.submitted
                      }
                      className="inline-flex items-center justify-center rounded-full bg-[#0F62FE] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0043CE] disabled:cursor-not-allowed disabled:bg-[#C6C6C6]"
                    >
                      {activeSubmitState.pending ? 'Submitting...' : 'Submit on website'}
                    </button>
                  </div>
                )}

                {activeSubmitState.error && !activeQuestion.grade && (
                  <p className="mt-3 text-sm text-[#DA1E28]">
                    {activeSubmitState.error}
                  </p>
                )}

                <AnimatePresence>
                  {activeQuestion.rationale && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`mt-6 rounded-2xl border-l-4 px-5 py-4 ${
                        activeQuestion.grade === 'pass'
                          ? 'border-[#24A148] bg-[#24A148]/5'
                          : activeQuestion.grade === 'partial'
                            ? 'border-[#FF832B] bg-[#FF832B]/5'
                            : 'border-[#DA1E28] bg-[#DA1E28]/5'
                      }`}
                    >
                      <p className="mb-1 text-xs font-medium text-[#6F6F6F]">
                        Bob&apos;s Feedback:
                      </p>
                      <p className="text-sm leading-relaxed text-[#161616]">
                        {activeQuestion.rationale}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => previousQuestion && setActiveQuestionId(previousQuestion.id)}
                  disabled={!previousQuestion}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-[#161616] transition hover:border-[#0F62FE] hover:text-[#0F62FE] disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="text-xs uppercase tracking-[0.18em] text-[#8A8A8A]">
                  Review previous answers anytime
                </div>

                <button
                  type="button"
                  onClick={() => nextQuestion && setActiveQuestionId(nextQuestion.id)}
                  disabled={!nextQuestion}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-[#161616] transition hover:border-[#0F62FE] hover:text-[#0F62FE] disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </section>
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
