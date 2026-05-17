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
} from 'lucide-react';
import { Stopwatch } from '@/components/Stopwatch';
import { EventStream } from '@/components/EventStream';
import { CartographyCard } from '@/components/CartographyCard';
import { DependencyGraph, GraphData } from '@/components/DependencyGraph';
import { CartographyStepper } from '@/components/CartographyStepper';
import { TranscriptPanel } from '@/components/TranscriptPanel';
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
  CertificationSubmissionState,
} from '@/components/CertificationPanel';
import { IdleState } from '@/components/IdleState';
import { useEvents } from '@/hooks/useEvents';
import { useEventHandlers } from '@/hooks/useEventHandlers';
import { useEventsStore, Event } from '@/store/events';

const MCP_HTTP_URL =
  process.env.NEXT_PUBLIC_MCP_HTTP_URL || 'http://127.0.0.1:8765';

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

interface DependencyNodeInsight {
  id: string;
  label: string;
  fanIn: number;
  fanOut: number;
}

function dependencyNodesFromCard(card: Event | undefined): DependencyNodeInsight[] {
  const data = card?.data.data as
    | {
        nodes?: Array<{
          id?: string;
          label?: string;
          fan_in?: number;
          fan_out?: number;
        }>;
      }
    | undefined;

  if (!data?.nodes?.length) return [];

  return data.nodes.map((node, index) => ({
    id: node.id || `node-${index}`,
    label: node.label || node.id || `node-${index}`,
    fanIn: typeof node.fan_in === 'number' ? node.fan_in : 0,
    fanOut: typeof node.fan_out === 'number' ? node.fan_out : 0,
  }));
}

function dependencyCyclesFromCard(card: Event | undefined): string[] {
  const data = card?.data.data as
    | {
        circular_dependencies?: Array<{
          cycle?: string[] | string;
        }>;
      }
    | undefined;

  if (!Array.isArray(data?.circular_dependencies)) return [];

  return data.circular_dependencies
    .map((item) => {
      if (Array.isArray(item.cycle)) return item.cycle.join(' -> ');
      if (typeof item.cycle === 'string') return item.cycle;
      return '';
    })
    .filter((cycle) => cycle.trim().length > 0);
}

function uniqueOptions(options: string[]) {
  return [...new Set(options.map((option) => option.trim()).filter(Boolean))];
}

function buildChoiceSet(correct: string, distractors: string[], seedKey: string) {
  const combined = uniqueOptions([correct, ...distractors]).slice(0, 4);
  return combined.length >= 4 ? shuffleQuestionOptions(combined, seedKey) : undefined;
}

function routeChoice(route: EntryPoint) {
  return `${route.file}, function ${route.handler || route.entry_point || route.name}`;
}

function conventionExampleText(convention: Convention) {
  const example = convention.evidence.example
    ?.trim()
    .split('\n')[0]
    .replace(/\s+/g, ' ');

  return example
    ? `${convention.pattern} (example: ${example})`
    : convention.pattern;
}

function deriveFallbackCertificationOptions({
  question,
  questionId,
  dependencyCard,
  entryPointsData,
  hotspotsData,
  conventionsData,
}: {
  question: CertificationQuestion;
  questionId: string;
  dependencyCard?: Event;
  entryPointsData: EntryPointsData | null;
  hotspotsData: HotspotsData | null;
  conventionsData: ConventionsData | null;
}) {
  const text = question.questionText.toLowerCase();
  const dependencyNodes = dependencyNodesFromCard(dependencyCard);
  const routes = entryPointsData?.routes || [];
  const cli = entryPointsData?.cli || [];
  const hotspots = hotspotsData?.files || [];
  const conventions = conventionsData?.conventions || [];

  if (text.includes('highest fan-out') || text.includes('main orchestrator')) {
    const ranked = [...dependencyNodes].sort((left, right) => right.fanOut - left.fanOut);
    if (ranked.length >= 4 && ranked[0].fanOut > 0) {
      const correct = `${ranked[0].label} (highest fan-out of ${ranked[0].fanOut})`;
      const distractors = ranked.slice(1, 4).map(
        (node) => `${node.label} (fan-out of ${node.fanOut})`
      );
      return buildChoiceSet(correct, distractors, questionId);
    }
  }

  if (text.includes('circular dependenc')) {
    const cycles = dependencyCyclesFromCard(dependencyCard);
    const ranked = [...dependencyNodes].sort((left, right) => right.fanOut - left.fanOut);

    if (cycles.length > 0) {
      const correct = `Yes: ${cycles[0]}`;
      const distractors = [
        `No circular dependencies were identified`,
        ...ranked.slice(0, 2).map((node, index) => {
          const nextNode = ranked[(index + 1) % ranked.length];
          return `Yes: ${node.label} -> ${nextNode.label}`;
        }),
      ];
      return buildChoiceSet(correct, distractors, questionId);
    }

    const correct = 'No circular dependencies were identified';
    const distractors = ranked.slice(0, 3).map((node, index) => {
      const nextNode = ranked[(index + 1) % ranked.length];
      return `Yes: ${node.label} -> ${nextNode.label}`;
    });
    return buildChoiceSet(correct, distractors, questionId);
  }

  if (text.includes('which file and function would you investigate first')) {
    const routePathMatch = question.questionText.match(/(\/[A-Za-z0-9_/-]+)/);
    const routePath = routePathMatch?.[1];
    const matchingRoute =
      routes.find((route) => routePath && route.path === routePath) ||
      routes.find((route) => routePath && route.path?.includes(routePath)) ||
      routes[0];

    if (matchingRoute) {
      const correct = routeChoice(matchingRoute);
      const distractors = routes
        .filter((route) => route !== matchingRoute)
        .slice(0, 3)
        .map(routeChoice);
      return buildChoiceSet(correct, distractors, questionId);
    }
  }

  if (text.includes('which file would you modify') && text.includes('imports')) {
    const moduleMatch = question.questionText.match(/uses the ([A-Za-z0-9_./-]+) module/i);
    const referencedModule = moduleMatch?.[1] || dependencyNodes[0]?.label || 'target module';
    const preferredRouteFile = routes[0]?.file || 'backend/app.py';
    const correct = `Modify ${preferredRouteFile} and import ${referencedModule} in the route handler module.`;
    const distractors = uniqueOptions([
      routes[1]
        ? `Modify ${routes[1].file} and avoid any new imports.`
        : 'Modify frontend/src/app/page.tsx and add the endpoint there.',
      'Modify backend/tests/test_app.py and import pytest fixtures only.',
      cli[0]
        ? `Modify ${cli[0].file} and import the CLI entry point instead of the HTTP module.`
        : 'Modify README.md and add no imports because routes are generated automatically.',
    ]);
    return buildChoiceSet(correct, distractors, questionId);
  }

  if (text.includes('cli and http entry points')) {
    const routeExample = routes[0]?.path || '/health';
    const cliExample = cli[0]?.name || 'scripts/bootstrap.sh';
    const correct = `Use CLI for scripts like ${cliExample}, and HTTP for request/response routes like ${routeExample}.`;
    const distractors = [
      'Use HTTP for background jobs only, and CLI for all user-facing traffic.',
      'Use CLI and HTTP interchangeably because both run through the same route table.',
      'Use HTTP for local scripts and CLI for browser requests.',
    ];
    return buildChoiceSet(correct, distractors, questionId);
  }

  if (text.includes('which team member would you ask for a code review')) {
    const authors = uniqueOptions(
      hotspots.map((hotspot) => hotspot.top_author).filter((value): value is string => Boolean(value))
    );
    if (authors.length > 0) {
      const correct = `${authors[0]} because they have the strongest recent ownership signal on the hotspot file.`;
      const distractors = authors.slice(1, 4).map(
        (author) => `${author} because they might be available, even without hotspot ownership evidence.`
      );
      return buildChoiceSet(correct, distractors, questionId);
    }
  }

  if (text.includes('changes so frequently')) {
    const hotspot = hotspots[0];
    if (hotspot) {
      const correct = hotspot.rationale;
      const distractors = [
        'Because the file is generated automatically on every test run.',
        'Because it is a static archive that rarely changes but is force-committed often.',
        'Because the file is unrelated to active features and only changes for formatting.',
      ];
      return buildChoiceSet(correct, distractors, questionId);
    }
  }

  if (text.includes('naming convention')) {
    if (conventions.length > 0) {
      const correct = conventionExampleText(conventions[0]);
      const distractors = [
        'camelCase everywhere (example: handleRequestNow)',
        'PascalCase for file names (example: HealthCheck.py)',
        'kebab-case for Python functions (example: submit-dashboard-answer)',
      ];
      return buildChoiceSet(correct, distractors, questionId);
    }
  }

  if (text.includes('handle errors')) {
    const errorConvention = conventions.find(
      (convention) =>
        convention.name.toLowerCase().includes('error') ||
        convention.pattern.toLowerCase().includes('exception') ||
        convention.pattern.toLowerCase().includes('http')
    );

    if (errorConvention) {
      const correct = errorConvention.pattern;
      const distractors = [
        'Return numeric error codes only, never raise exceptions.',
        'Use a Result/Either type for every function in the codebase.',
        'Print errors to stdout and continue without structured handling.',
      ];
      return buildChoiceSet(correct, distractors, questionId);
    }
  }

  if (text.includes('where would you add a test')) {
    const moduleMatch = question.questionText.match(/for the ([A-Za-z0-9_./-]+) module/i);
    const rawModuleName = moduleMatch?.[1] || 'app';
    const moduleBase = rawModuleName.replace(/\.py$/i, '').split('/').pop() || rawModuleName;
    const correct = `backend/tests/test_${moduleBase}.py`;
    const distractors = [
      `backend/${moduleBase}.test.py`,
      `frontend/src/${moduleBase}.spec.ts`,
      `tests/${moduleBase}/index.py`,
    ];
    return buildChoiceSet(correct, distractors, questionId);
  }

  if (text.includes('trace the flow of a request')) {
    const route = routes[0];
    const centralModule = dependencyNodes[0];
    if (route && centralModule) {
      const correct = `${route.file} -> ${route.handler || route.name} -> ${centralModule.label}`;
      const distractors = [
        `frontend/src/app/page.tsx -> CertificationPanel -> ${centralModule.label}`,
        `${centralModule.label} -> ${route.file} -> ${route.handler || route.name}`,
        `${route.file} -> README.md -> ${centralModule.label}`,
      ];
      return buildChoiceSet(correct, distractors, questionId);
    }
  }

  if (text.includes('reduce its change frequency') && text.includes('splitting it into smaller modules')) {
    const convention = conventions[0];
    const correct = convention
      ? `Split it following the existing ${convention.pattern} convention and keep modules aligned to one clear responsibility.`
      : 'Split it into smaller modules that each keep one clear responsibility and follow the repo naming conventions.';
    const distractors = [
      'Keep adding unrelated helpers into the same file so future changes stay centralized.',
      'Split it into randomly named files without following any established naming pattern.',
      'Move the whole file into the frontend so fewer backend commits touch it.',
    ];
    return buildChoiceSet(correct, distractors, questionId);
  }

  return undefined;
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

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function shuffleQuestionOptions(options: string[], seedKey: string) {
  if (options.length <= 1) return options;

  const shuffled = [...options];
  let seed = hashString(seedKey);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  if (shuffled[0] === options[0]) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }

  return shuffled;
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
  const [answerSubmissionState, setAnswerSubmissionState] = useState<{
    sessionId: string | null;
    questions: Record<string, CertificationSubmissionState>;
  }>({ sessionId: null, questions: {} });
  const lastRecoveryEventId = useRef<string | null>(null);
  const { isConnected } = useEvents();
  useEventHandlers();

  const connectionState = useEventsStore((state) => state.connectionState);
  const events = useEventsStore((state) => state.events);
  const cartographySteps = useEventsStore((state) => state.cartographySteps);
  const session = useEventsStore((state) => state.session);
  const { currentEvent, showRecovery, dismissRecovery } = useAutoRecovery();

  const isIdle = !session.isActive && events.length === 0;
  const currentSessionId =
    (events.find((event) => event.type === 'session_start')?.data.session_id as
      | string
      | undefined) ||
    events.find((event) => event.type === 'session_start')?.id ||
    null;
  const dependencyCard = findCard(events, 'dependency_graph');
  const entryCard = findCard(events, 'entry_points');
  const hotspotCard = findCard(events, 'hotspots');
  const conventionCard = findCard(events, 'conventions');
  const graphData = graphDataFromCard(dependencyCard);
  const entryPointsData = entryPointsDataFromCard(entryCard);
  const hotspotsData = hotspotsDataFromCard(hotspotCard);
  const conventionsData = conventionsDataFromCard(conventionCard);

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
          response_mode?: 'free_text' | 'multiple_choice';
          options?: string[];
        };
        const id = data.question_id || data.id || event.id;
        const questionText = data.question;
        const options = Array.isArray(data.options)
          ? data.options.filter(
              (option): option is string =>
                typeof option === 'string' && option.trim().length > 0
            )
          : [];

        if (questionText) {
          const existing = questions.get(id);
          questionTextToId.set(normalizeQuestionText(questionText), id);
          const fallbackOptions =
            options.length > 0
              ? undefined
              : deriveFallbackCertificationOptions({
                  question: {
                    id,
                    topic: existing?.topic || data.topic || data.stage || 'Architecture',
                    questionText,
                  },
                  questionId: id,
                  dependencyCard,
                  entryPointsData,
                  hotspotsData,
                  conventionsData,
                });
          const resolvedOptions =
            existing?.options ||
            (options.length > 0
              ? shuffleQuestionOptions(
                  options,
                  `${currentSessionId || 'session'}:${id}`
                )
              : fallbackOptions);
          const resolvedResponseMode =
            existing?.responseMode === 'multiple_choice' ||
            data.response_mode === 'multiple_choice' ||
            Boolean(resolvedOptions?.length)
              ? 'multiple_choice'
              : 'free_text';

          questions.set(id, {
            id,
            topic: existing?.topic || data.topic || data.stage || 'Architecture',
            questionText: existing?.questionText || questionText,
            responseMode: resolvedResponseMode,
            options: resolvedOptions,
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
            responseMode: existing?.responseMode || 'free_text',
            options: existing?.options,
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
  }, [
    certificationAnswers,
    conventionsData,
    currentSessionId,
    dependencyCard,
    entryPointsData,
    events,
    hotspotsData,
  ]);

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

  async function submitCertificationAnswer(questionId: string) {
    if (!currentSessionId) {
      setAnswerSubmissionState((prev) => ({
        sessionId: prev.sessionId,
        questions: {
          ...prev.questions,
          [questionId]: {
            pending: false,
            submitted: false,
            error: 'Start a live onboarding session before submitting answers.',
          },
        },
      }));
      return;
    }

    const answer =
      certificationAnswers.sessionId === currentSessionId
        ? certificationAnswers.answers[questionId]
        : undefined;
    const question = certificationQuestions.find((item) => item.id === questionId);

    if (!answer?.trim()) {
      setAnswerSubmissionState((prev) => ({
        sessionId: currentSessionId,
        questions: {
          ...(prev.sessionId === currentSessionId ? prev.questions : {}),
          [questionId]: {
            pending: false,
            submitted: false,
            error: 'Write an answer before submitting it.',
          },
        },
      }));
      return;
    }

    setAnswerSubmissionState((prev) => ({
      sessionId: currentSessionId,
      questions: {
        ...(prev.sessionId === currentSessionId ? prev.questions : {}),
        [questionId]: {
          pending: true,
          submitted: false,
        },
      },
    }));

    try {
      const response = await fetch(`${MCP_HTTP_URL}/dashboard/certification/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: currentSessionId,
          question_id: questionId,
          question_text: question?.questionText,
          answer,
        }),
      });

      if (!response.ok) {
        let errorMessage =
          'Could not submit the answer to the local grading bridge.';

        if (response.status === 404 || response.status === 405) {
          errorMessage =
            'The running backend is missing the website grading endpoint. Restart the backend, then start a fresh Bob onboarding session.';
        } else if (response.status === 400) {
          try {
            const data = (await response.json()) as { detail?: string };
            if (typeof data.detail === 'string' && data.detail.trim()) {
              errorMessage = data.detail;
            }
          } catch {
            errorMessage = 'The backend rejected this answer submission.';
          }
        }

        throw new Error(errorMessage);
      }

      setAnswerSubmissionState((prev) => ({
        sessionId: currentSessionId,
        questions: {
          ...(prev.sessionId === currentSessionId ? prev.questions : {}),
          [questionId]: {
            pending: false,
            submitted: true,
          },
        },
      }));
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Could not reach the local grading bridge. Check that the backend is running.';

      setAnswerSubmissionState((prev) => ({
        sessionId: currentSessionId,
        questions: {
          ...(prev.sessionId === currentSessionId ? prev.questions : {}),
          [questionId]: {
            pending: false,
            submitted: false,
            error: message,
          },
        },
      }));
    }
  }

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
            icon={GitPullRequest}
            label="Starter PR"
            value={latestPrUrl ? 'Opened' : passCount >= 2 ? 'Issue-backed' : 'Pending'}
            detail="Prefers open GitHub issues before fallback tasks"
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
            <TranscriptPanel maxHeight={260} />

            <div className="overflow-hidden border border-ibm-gray-20 bg-white">
              <CertificationPanel
                key={currentSessionId || 'no-session'}
                questions={certificationQuestions}
                canSubmitAnswers={Boolean(currentSessionId)}
                onAnswerChange={(questionId, answer) => {
                  setCertificationAnswers((prev) => ({
                    sessionId: currentSessionId,
                    answers: {
                      ...(prev.sessionId === currentSessionId ? prev.answers : {}),
                      [questionId]: answer,
                    },
                  }));
                }}
                onAnswerSubmit={submitCertificationAnswer}
                submissionState={
                  answerSubmissionState.sessionId === currentSessionId
                    ? answerSubmissionState.questions
                    : {}
                }
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
                  Certification passed. Bob can now prefer open GitHub issues for the first PR.
                </div>
              ) : (
                <div className="mt-2 text-sm text-ibm-gray-70">
                  Unlocks after certification passes. The workflow now prefers{' '}
                  <code className="rounded bg-ibm-gray-10 px-1 py-0.5 text-xs">
                    good first issue
                  </code>{' '}
                  ,{' '}
                  <code className="rounded bg-ibm-gray-10 px-1 py-0.5 text-xs">
                    help wanted
                  </code>{' '}
                  , and documentation issues before falling back to starter
                  templates.
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
