'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  CircleDot,
  GitPullRequest,
  ShieldCheck,
  TimerReset,
  WifiOff,
  Zap,
} from 'lucide-react';
import { Stopwatch } from '@/components/Stopwatch';
import { EventStream } from '@/components/EventStream';
import { CartographyCard } from '@/components/CartographyCard';
import { DependencyGraph, GraphData } from '@/components/DependencyGraph';
import { CartographyStepper } from '@/components/CartographyStepper';
import { TranscriptPanel } from '@/components/TranscriptPanel';
import { BobcoinMeter } from '@/components/BobcoinMeter';
import {
  AutoRecoveryBanner,
  RecoveryPattern,
  RecoveryStatus,
  useAutoRecovery,
} from '@/components/AutoRecoveryBanner';
import {
  EntryPoint,
  EntryPointsCard,
  EntryPointsData,
} from '@/components/cards/EntryPointsCard';
import {
  Hotspot,
  HotspotsCard,
  HotspotsData,
} from '@/components/cards/HotspotsCard';
import {
  Convention,
  ConventionsCard,
  ConventionsData,
} from '@/components/cards/ConventionsCard';
import CertificationPanel, {
  CertificationQuestion,
} from '@/components/CertificationPanel';
import { IdleState } from '@/components/IdleState';
import { useEvents } from '@/hooks/useEvents';
import { useEventHandlers } from '@/hooks/useEventHandlers';
import { useEventsStore, Event } from '@/store/events';

const sampleGraphData: GraphData = {
  nodes: [
    { id: 'app', name: 'app.py', group: 1, val: 15 },
    { id: 'api', name: 'api.py', group: 1, val: 12 },
    { id: 'models', name: 'models.py', group: 2, val: 12 },
    { id: 'auth', name: 'auth.py', group: 3, val: 10 },
    { id: 'db', name: 'database.py', group: 3, val: 10 },
    { id: 'config', name: 'config.py', group: 2, val: 8 },
    { id: 'utils', name: 'utils.py', group: 2, val: 8 },
  ],
  edges: [
    { source: 'app', target: 'api' },
    { source: 'api', target: 'models' },
    { source: 'api', target: 'auth' },
    { source: 'auth', target: 'db' },
    { source: 'models', target: 'db' },
    { source: 'app', target: 'config' },
    { source: 'utils', target: 'config' },
  ],
};

function findCard(events: Event[], cardType: string) {
  return events.find(
    (event) => event.type === 'card_emit' && event.data.card_type === cardType
  );
}

function graphDataFromCard(card: Event | undefined): GraphData {
  const data = card?.data.data as
    | {
        nodes?: Array<{
          id?: string;
          label?: string;
          fan_in?: number;
          is_hub?: boolean;
        }>;
        edges?: Array<{ source?: string; target?: string }>;
      }
    | undefined;

  if (!data?.nodes?.length) {
    return sampleGraphData;
  }

  return {
    nodes: data.nodes.map((node, index) => ({
      id: node.id || `node-${index}`,
      name: node.label || node.id || `node-${index}`,
      group: node.is_hub ? 1 : 2,
      val: Math.max(8, (node.fan_in || 0) * 4 + 8),
    })),
    edges: (data.edges || [])
      .filter((edge) => edge.source && edge.target)
      .map((edge) => ({
        source: edge.source as string,
        target: edge.target as string,
      })),
  };
}

function entryPointsDataFromCard(card: Event | undefined): EntryPointsData | null {
  if (!card?.data.data) return null;

  const data = card.data.data as Record<string, unknown>;
  return {
    routes: Array.isArray(data.routes) ? (data.routes as EntryPoint[]) : [],
    cli: Array.isArray(data.cli) ? (data.cli as EntryPoint[]) : [],
    jobs: Array.isArray(data.jobs) ? (data.jobs as EntryPoint[]) : [],
    consumers: Array.isArray(data.consumers)
      ? (data.consumers as EntryPoint[])
      : [],
  };
}

function hotspotsDataFromCard(card: Event | undefined): HotspotsData | null {
  if (!card?.data.data) return null;

  const data = card.data.data as Record<string, unknown>;
  return {
    files: Array.isArray(data.files) ? (data.files as Hotspot[]) : [],
  };
}

function conventionsDataFromCard(card: Event | undefined): ConventionsData | null {
  if (!card?.data.data) return null;

  const data = card.data.data as Record<string, unknown>;
  return {
    conventions: Array.isArray(data.conventions)
      ? (data.conventions as Convention[])
      : [],
  };
}

function toRecoveryPattern(value: unknown): RecoveryPattern {
  const pattern = typeof value === 'string' ? value : '';
  const allowed: RecoveryPattern[] = [
    'port-in-use',
    'node-version',
    'missing-venv',
    'missing-seed',
    'db-not-running',
  ];

  return allowed.includes(pattern as RecoveryPattern)
    ? (pattern as RecoveryPattern)
    : 'missing-venv';
}

function toRecoveryStatus(value: unknown): RecoveryStatus {
  if (value === 'success' || value === 'failed' || value === 'in-progress') {
    return value;
  }

  if (value === 'error') return 'failed';
  if (value === 'complete') return 'success';
  return 'in-progress';
}

function isCertificationQuestionEvent(event: Event) {
  if (event.type !== 'question_ask') return false;

  const data = event.data as { question_id?: string; stage?: string };
  const questionId = data.question_id || event.id;

  return data.stage === 'certification' || questionId.startsWith('cert_');
}

function normalizeQuestionText(value: unknown) {
  return typeof value === 'string'
    ? value.toLowerCase().replace(/\s+/g, ' ').trim()
    : '';
}

function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof TimerReset;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border border-ibm-gray-20 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-ibm-gray-70">
        <Icon className="h-4 w-4 text-ibm-blue-60" />
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-ibm-gray-100">{value}</div>
      <div className="mt-1 text-xs text-ibm-gray-70">{detail}</div>
    </div>
  );
}

function ConnectionBanner({
  connectionState,
}: {
  connectionState: 'connecting' | 'connected' | 'disconnected';
}) {
  if (connectionState === 'connected') return null;

  const copy =
    connectionState === 'connecting'
      ? 'Reconnecting to the local MCP event bridge.'
      : 'Dashboard is offline. Events will resume when ws://127.0.0.1:8765/events is reachable.';

  return (
    <div className="border-b border-ibm-orange-40/30 bg-ibm-orange-40/10 px-6 py-3 text-sm text-ibm-gray-100">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3">
        <WifiOff className="h-4 w-4 text-ibm-orange-40" />
        <span>{copy}</span>
      </div>
    </div>
  );
}

function Dashboard() {
  const [showEventStream, setShowEventStream] = useState(true);
  const [certificationAnswers, setCertificationAnswers] = useState<{
    sessionId: string | null;
    answers: Record<string, string>;
  }>({ sessionId: null, answers: {} });
  const lastRecoveryEventId = useRef<string | null>(null);
  const { isConnected } = useEvents();
  useEventHandlers();

  const connectionState = useEventsStore((state) => state.connectionState);
  const events = useEventsStore((state) => state.events);
  const cartographySteps = useEventsStore((state) => state.cartographySteps);
  const bobcoinBudget = useEventsStore((state) => state.bobcoinBudget);
  const session = useEventsStore((state) => state.session);
  const { currentEvent, showRecovery, dismissRecovery } = useAutoRecovery();

  const isIdle = !session.isActive && events.length === 0;
  const currentSessionId =
    events.find((event) => event.type === 'session_start')?.id || null;

  const certificationQuestions = useMemo<CertificationQuestion[]>(() => {
    const questions = new Map<string, CertificationQuestion>();
    const questionTextToId = new Map<string, string>();

    [...events].reverse().forEach((event) => {
      if (event.type === 'question_ask') {
        if (!isCertificationQuestionEvent(event)) return;

        const data = event.data as {
          id?: string;
          question_id?: string;
          topic?: string;
          stage?: string;
          question?: string;
        };
        const id = data.question_id || data.id || event.id;
        const questionText = data.question;

        if (questionText) {
          const existing = questions.get(id);
          questionTextToId.set(normalizeQuestionText(questionText), id);

          questions.set(id, {
            id,
            topic: existing?.topic || data.topic || data.stage || 'Architecture',
            questionText: existing?.questionText || questionText,
            answer: existing?.answer,
            grade: existing?.grade,
            rationale: existing?.rationale,
          });
        }
      } else if (event.type === 'certification_grade') {
        const data = event.data as {
          id?: string;
          question_id?: string;
          grade?: 'pass' | 'partial' | 'fail';
          rationale?: string;
          answer?: string;
          user_answer?: string;
          question?: string;
          question_text?: string;
          topic?: string;
        };
        const eventQuestionText = data.question_text || data.question;
        const matchedQuestionId = questionTextToId.get(
          normalizeQuestionText(eventQuestionText)
        );
        const id = matchedQuestionId || data.question_id || data.id || event.id;

        if (id) {
          const existing = questions.get(id);

          questions.set(id, {
            id,
            topic: existing?.topic || data.topic || 'Certification',
            questionText:
              existing?.questionText ||
              eventQuestionText ||
              'Certification question',
            answer: data.user_answer || data.answer || existing?.answer,
            grade: data.grade,
            rationale: data.rationale,
          });
        }
      }
    });

    return Array.from(questions.values()).map((question) => ({
      ...question,
      answer:
        question.answer ??
        (certificationAnswers.sessionId === currentSessionId
          ? certificationAnswers.answers[question.id]
          : undefined),
    }));
  }, [certificationAnswers, currentSessionId, events]);

  useEffect(() => {
    const latestEvent = events[0];
    if (
      !latestEvent ||
      latestEvent.id === lastRecoveryEventId.current ||
      latestEvent.type !== 'bootstrap_recovery'
    ) {
      return;
    }

    const data = latestEvent.data as {
      pattern?: string;
      action?: string;
      details?: string;
      status?: string;
      message?: string;
    };

    lastRecoveryEventId.current = latestEvent.id;
    showRecovery({
      pattern: toRecoveryPattern(data.pattern),
      action: data.action || data.message || 'Bootstrap recovery in progress',
      details: data.details || '',
      status: toRecoveryStatus(data.status),
      timestamp: latestEvent.timestamp,
    });
  }, [events, showRecovery]);

  const dependencyCard = findCard(events, 'dependency_graph');
  const entryCard = findCard(events, 'entry_points');
  const hotspotCard = findCard(events, 'hotspots');
  const conventionCard = findCard(events, 'conventions');
  const graphData = graphDataFromCard(dependencyCard);
  const entryPointsData = entryPointsDataFromCard(entryCard);
  const hotspotsData = hotspotsDataFromCard(hotspotCard);
  const conventionsData = conventionsDataFromCard(conventionCard);

  const displayCartographySteps = useMemo(() => {
    const completedByCard: Record<string, boolean> = {
      graph: Boolean(dependencyCard),
      entry: Boolean(entryCard),
      hotspot: Boolean(hotspotCard),
      convention: Boolean(conventionCard),
    };

    return cartographySteps.map((step) =>
      completedByCard[step.id] ? { ...step, status: 'complete' as const } : step
    );
  }, [cartographySteps, conventionCard, dependencyCard, entryCard, hotspotCard]);

  const completedSteps = useMemo(
    () =>
      displayCartographySteps.filter((step) => step.status === 'complete').length,
    [displayCartographySteps]
  );
  const passCount = certificationQuestions.filter(
    (question) => question.grade === 'pass'
  ).length;
  const latestPrUrl = events.find((event) => event.type === 'session_end')?.data
    .pr_url as string | undefined;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AutoRecoveryBanner event={currentEvent} onDismiss={dismissRecovery} />

      <header className="border-b border-ibm-gray-20 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="text-2xl font-semibold text-ibm-blue-60">
              OnboardOps
            </div>
            <div className="text-sm text-ibm-gray-70">
              The 10-Minute Repo Whisperer
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs font-semibold uppercase text-ibm-gray-70">
                Stopwatch
              </div>
              <Stopwatch
                startedAt={session.startTime}
                endedAt={session.endTime}
                isRunning={session.isActive}
                className="text-ibm-gray-100"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-ibm-gray-70">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isConnected ? 'bg-ibm-green-50' : 'bg-ibm-orange-40'
                }`}
              />
              {isConnected ? 'Bridge online' : 'Bridge reconnecting'}
            </div>
          </div>
        </div>
      </header>

      <ConnectionBanner connectionState={connectionState} />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-6 py-5">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <MetricTile
            icon={TimerReset}
            label="Time Target"
            value={session.isActive ? 'Running' : 'Ready'}
            detail="Goal: first PR in under 10 minutes"
          />
          <MetricTile
            icon={Activity}
            label="Cartography"
            value={`${completedSteps}/4`}
            detail="Graph, entry points, hotspots, conventions"
          />
          <MetricTile
            icon={ShieldCheck}
            label="Certification"
            value={`${passCount}/3`}
            detail="Two passes required to unlock starter PR"
          />
          <MetricTile
            icon={Zap}
            label="Bobcoins"
            value={`${bobcoinBudget.projected || bobcoinBudget.spent}/15`}
            detail="Target budget per onboarding session"
          />
        </section>

        <section className="border border-ibm-gray-20 bg-ibm-gray-10/30 px-5 py-4">
          <CartographyStepper steps={displayCartographySteps} />
        </section>

        <div className="grid flex-1 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 space-y-5">
            {isIdle ? (
              <div className="border border-ibm-gray-20 bg-white">
                <IdleState />
              </div>
            ) : (
              <>
                <CartographyCard
                  type="graph"
                  title={String(dependencyCard?.data.title || 'Dependency Graph')}
                  state={
                    dependencyCard
                      ? 'complete'
                      : session.isActive
                        ? 'in-progress'
                        : 'pending'
                  }
                >
                  <div className="space-y-4">
                    {typeof dependencyCard?.data.body_markdown === 'string' && (
                      <p className="text-sm text-ibm-gray-70">
                        {dependencyCard.data.body_markdown}
                      </p>
                    )}
                    <DependencyGraph data={graphData} height={380} />
                  </div>
                </CartographyCard>

                <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3">
                  <CartographyCard
                    type="entry"
                    title={String(entryCard?.data.title || 'Entry Points')}
                    state={entryCard ? 'complete' : 'pending'}
                  >
                    {typeof entryCard?.data.body_markdown === 'string' && (
                      <p className="mb-4 text-sm text-ibm-gray-70">
                        {entryCard.data.body_markdown}
                      </p>
                    )}
                    {entryPointsData ? (
                      <EntryPointsCard data={entryPointsData} />
                    ) : (
                      <div className="py-4 text-center text-sm text-ibm-gray-70">
                        Waiting to analyze entry points...
                      </div>
                    )}
                  </CartographyCard>

                  <CartographyCard
                    type="hotspot"
                    title={String(hotspotCard?.data.title || 'Change Hotspots')}
                    state={hotspotCard ? 'complete' : 'pending'}
                  >
                    {typeof hotspotCard?.data.body_markdown === 'string' && (
                      <p className="mb-4 text-sm text-ibm-gray-70">
                        {hotspotCard.data.body_markdown}
                      </p>
                    )}
                    {hotspotsData ? (
                      <HotspotsCard data={hotspotsData} />
                    ) : (
                      <div className="py-4 text-center text-sm text-ibm-gray-70">
                        Waiting to analyze hotspots...
                      </div>
                    )}
                  </CartographyCard>

                  <CartographyCard
                    type="convention"
                    title={String(
                      conventionCard?.data.title || 'Project Conventions'
                    )}
                    state={conventionCard ? 'complete' : 'pending'}
                  >
                    {typeof conventionCard?.data.body_markdown === 'string' && (
                      <p className="mb-4 text-sm text-ibm-gray-70">
                        {conventionCard.data.body_markdown}
                      </p>
                    )}
                    {conventionsData ? (
                      <ConventionsCard data={conventionsData} />
                    ) : (
                      <div className="py-4 text-center text-sm text-ibm-gray-70">
                        Waiting to analyze conventions...
                      </div>
                    )}
                  </CartographyCard>
                </div>
              </>
            )}
          </section>

          <aside className="min-w-0 space-y-4">
            <BobcoinMeter
              totalBudget={bobcoinBudget.total}
              spent={bobcoinBudget.spent}
              projected={bobcoinBudget.projected}
            />

            <TranscriptPanel maxHeight={260} />

            <div className="overflow-hidden border border-ibm-gray-20 bg-white">
              <CertificationPanel
                key={currentSessionId || 'no-session'}
                questions={certificationQuestions}
                onAnswerChange={(questionId, answer) => {
                  setCertificationAnswers((prev) => ({
                    sessionId: currentSessionId,
                    answers: {
                      ...(prev.sessionId === currentSessionId ? prev.answers : {}),
                      [questionId]: answer,
                    },
                  }));
                }}
              />
            </div>

            <div className="border border-ibm-gray-20 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ibm-gray-100">
                <GitPullRequest className="h-4 w-4 text-ibm-blue-60" />
                Starter PR
              </div>
              {latestPrUrl ? (
                <a
                  href={latestPrUrl}
                  className="mt-2 block truncate text-sm text-ibm-blue-60 underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {latestPrUrl}
                </a>
              ) : passCount >= 2 ? (
                <div className="mt-2 text-sm text-ibm-green-50">
                  Certification passed. Starter PR is ready in Bob.
                </div>
              ) : (
                <div className="mt-2 text-sm text-ibm-gray-70">
                  Unlocks after certification passes.
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-ibm-gray-20 bg-white px-6 py-3">
        <div className="mx-auto max-w-[1440px]">
          <button
            onClick={() => setShowEventStream((value) => !value)}
            className="flex w-full items-center justify-between text-left text-sm font-semibold text-ibm-gray-100"
          >
            <span className="flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-ibm-blue-60" />
              Event Stream
            </span>
            {showEventStream ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>

          {showEventStream && (
            <div className="mt-3 border-t border-ibm-gray-10 pt-3">
              <EventStream />
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-ibm-gray-70">
          Loading OnboardOps dashboard...
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  );
}
