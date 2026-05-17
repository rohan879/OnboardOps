'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Activity,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Flame,
  GitPullRequest,
  Globe,
  ShieldCheck,
  TimerReset,
  WifiOff,
} from 'lucide-react';
import { Stopwatch } from '@/components/Stopwatch';
import { EventStream } from '@/components/EventStream';
import { CartographyCard, type CardState } from '@/components/CartographyCard';
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
import { StarterIssue, StarterIssuePanel } from '@/components/StarterIssuePanel';
import { useEvents } from '@/hooks/useEvents';
import { useEventHandlers } from '@/hooks/useEventHandlers';
import { useEventsStore, Event } from '@/store/events';

const MCP_HTTP_URL =
  process.env.NEXT_PUBLIC_MCP_HTTP_URL || 'http://127.0.0.1:8765';

const sampleGraphData: GraphData = {
  nodes: [
    { id: 'app', name: 'app.py', group: 1, val: 15, fanIn: 2, fanOut: 5 },
    { id: 'api', name: 'api.py', group: 1, val: 12, fanIn: 3, fanOut: 4 },
    { id: 'models', name: 'models.py', group: 2, val: 12, fanIn: 4, fanOut: 1 },
    { id: 'auth', name: 'auth.py', group: 3, val: 10, fanIn: 2, fanOut: 2 },
    { id: 'db', name: 'database.py', group: 3, val: 10, fanIn: 5, fanOut: 0 },
    { id: 'config', name: 'config.py', group: 2, val: 8, fanIn: 2, fanOut: 0 },
    { id: 'utils', name: 'utils.py', group: 2, val: 8, fanIn: 0, fanOut: 1 },
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
  cycles: [],
};

type AnalysisTabId = 'entry' | 'hotspot' | 'convention';

interface StarterIssuesState {
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  repository: string | null;
  issues: StarterIssue[];
}

interface AnalysisTabConfig {
  id: AnalysisTabId;
  label: string;
  caption: string;
  icon: typeof Globe;
  type: 'entry' | 'hotspot' | 'convention';
  state: CardState;
  title: string;
  bodyMarkdown: string | null;
  content: ReactNode;
  isAvailable: boolean;
}

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
          fan_out?: number;
          is_hub?: boolean;
        }>;
        edges?: Array<{ source?: string; target?: string }>;
        circular_dependencies?: Array<{
          cycle?: string[] | string;
        }>;
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
      fanIn: node.fan_in || 0,
      fanOut: node.fan_out || 0,
    })),
    edges: (data.edges || [])
      .filter((edge) => edge.source && edge.target)
      .map((edge) => ({
        source: edge.source as string,
        target: edge.target as string,
      })),
    cycles: Array.isArray(data.circular_dependencies)
      ? data.circular_dependencies
          .map((item) => {
            if (Array.isArray(item.cycle)) return item.cycle.join(' -> ');
            if (typeof item.cycle === 'string') return item.cycle;
            return '';
          })
          .filter((cycle) => cycle.trim().length > 0)
      : [],
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

function toTrimmedString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toFiniteNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function normalizeHotspotAuthor(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return toTrimmedString(record.author) || toTrimmedString(record.name);
  }

  return null;
}

function normalizeHotspotRecord(value: unknown): Hotspot | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const authors = Array.isArray(record.authors)
    ? record.authors
        .map(normalizeHotspotAuthor)
        .filter((author): author is string => Boolean(author))
    : [];
  const lastPrReference = toTrimmedString(record.last_pr);
  const lastPrUrl =
    toTrimmedString(record.last_pr_url) ||
    toTrimmedString(record.pr_url) ||
    toTrimmedString(record.pull_request_url);

  return {
    path:
      toTrimmedString(record.path) ||
      toTrimmedString(record.file_path) ||
      toTrimmedString(record.file) ||
      'unknown',
    commit_count: toFiniteNumber(
      record.commit_count ?? record.changes ?? record.commit_total,
      0
    ),
    distinct_authors: toFiniteNumber(
      record.distinct_authors ?? (authors.length > 0 ? authors.length : 0),
      0
    ),
    top_author:
      toTrimmedString(record.top_author) ||
      toTrimmedString(record.owner) ||
      authors[0] ||
      undefined,
    last_pr_title:
      toTrimmedString(record.last_pr_title) ||
      (lastPrReference && lastPrReference.toLowerCase() !== 'unknown'
        ? lastPrReference
        : undefined),
    last_pr_url: lastPrUrl || undefined,
    rationale:
      toTrimmedString(record.rationale) ||
      'High change activity suggests this file is a frequent integration point.',
    commit_frequency: Array.isArray(record.commit_frequency)
      ? (record.commit_frequency as number[])
      : undefined,
  };
}

function parseConventionEvidence(
  value: unknown,
  fallbackFile = 'Representative file'
): Convention['evidence'] {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return {
      file:
        toTrimmedString(record.file) ||
        toTrimmedString(record.path) ||
        toTrimmedString(record.location) ||
        fallbackFile,
      example:
        toTrimmedString(record.example) ||
        toTrimmedString(record.snippet) ||
        toTrimmedString(record.code) ||
        undefined,
      line_number: toFiniteNumber(
        record.line_number ?? record.line ?? record.lineNumber,
        0
      ) || undefined,
    };
  }

  const text = toTrimmedString(value);
  if (!text) return { file: fallbackFile };

  const lineMatch = text.match(/^(.*?):(\d+)\s*[:-]?\s*(.*)$/);
  if (lineMatch) {
    return {
      file: lineMatch[1].trim() || fallbackFile,
      line_number: Number.parseInt(lineMatch[2], 10) || undefined,
      example: lineMatch[3].trim() || undefined,
    };
  }

  const colonIndex = text.indexOf(':');
  if (colonIndex > 0) {
    const possibleFile = text.slice(0, colonIndex).trim();
    const possibleExample = text.slice(colonIndex + 1).trim();
    const looksLikeFile =
      possibleFile.includes('/') ||
      possibleFile.includes('\\') ||
      possibleFile.includes('.');

    if (looksLikeFile) {
      return {
        file: possibleFile || fallbackFile,
        example: possibleExample || undefined,
      };
    }
  }

  return {
    file: fallbackFile,
    example: text,
  };
}

function normalizeConventionRecord(value: unknown, index: number): Convention | null {
  if (typeof value === 'string' && value.trim()) {
    return {
      name: `Convention ${index + 1}`,
      pattern: value.trim(),
      evidence: parseConventionEvidence(value),
    };
  }

  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const pattern =
    toTrimmedString(record.pattern) ||
    toTrimmedString(record.rule) ||
    toTrimmedString(record.description) ||
    toTrimmedString(record.evidence) ||
    'Follow the prevailing project style';
  const consistency = toTrimmedString(record.consistency);

  return {
    name:
      toTrimmedString(record.name) ||
      toTrimmedString(record.category) ||
      toTrimmedString(record.title) ||
      `Convention ${index + 1}`,
    pattern,
    evidence: parseConventionEvidence(
      record.evidence ?? {
        file: record.file,
        example: record.example ?? record.snippet,
        line_number: record.line_number ?? record.line,
      }
    ),
    consistency:
      consistency === 'consistent' || consistency === 'mixed'
        ? consistency
        : undefined,
  };
}

function hotspotsDataFromCard(card: Event | undefined): HotspotsData | null {
  if (!card?.data.data) return null;

  const data = card.data.data as Record<string, unknown>;
  return {
    files: (
      Array.isArray(data.files)
        ? data.files
        : Array.isArray(data.hotspots)
          ? data.hotspots
          : Array.isArray(data.items)
            ? data.items
            : []
    )
      .map(normalizeHotspotRecord)
      .filter((hotspot): hotspot is Hotspot => Boolean(hotspot)),
  };
}

function conventionsDataFromCard(card: Event | undefined): ConventionsData | null {
  if (!card?.data.data) return null;

  const data = card.data.data as Record<string, unknown>;
  return {
    conventions: (
      Array.isArray(data.conventions)
        ? data.conventions
        : Array.isArray(data.patterns)
          ? data.patterns
          : Array.isArray(data.items)
            ? data.items
            : []
    )
      .map(normalizeConventionRecord)
      .filter((convention): convention is Convention => Boolean(convention)),
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

function countEntryPoints(data: EntryPointsData | null) {
  if (!data) return 0;

  return (
    (data.routes?.length || 0) +
    (data.cli?.length || 0) +
    (data.jobs?.length || 0) +
    (data.consumers?.length || 0)
  );
}

async function fetchStarterIssueCandidates(baseUrl: string) {
  const response = await fetch(`${baseUrl}/mcp/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tool_name: 'starter_issue_candidates',
      arguments: {
        limit: 3,
      },
    }),
  });

  const payload = (await response.json()) as {
    result?: {
      repository?: string;
      issues?: Array<{
        issue_number?: number;
        title?: string;
        url?: string;
        labels?: string[];
        state?: string;
        updated_at?: string;
        body_excerpt?: string | null;
      }>;
    };
    error?: string | null;
  };

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error ||
        'Could not load starter issues from the local onboarding backend.'
    );
  }

  return {
    repository: payload.result?.repository || null,
    issues: (payload.result?.issues || [])
      .filter(
        (issue): issue is NonNullable<
          NonNullable<typeof payload.result>['issues']
        >[number] =>
          typeof issue.issue_number === 'number' &&
          typeof issue.title === 'string' &&
          typeof issue.url === 'string'
      )
      .map((issue) => ({
        issueNumber: issue.issue_number as number,
        title: issue.title as string,
        url: issue.url as string,
        labels: Array.isArray(issue.labels) ? issue.labels : [],
        state: typeof issue.state === 'string' ? issue.state : 'open',
        updatedAt:
          typeof issue.updated_at === 'string'
            ? issue.updated_at
            : new Date().toISOString(),
        bodyExcerpt:
          typeof issue.body_excerpt === 'string' ? issue.body_excerpt : null,
      })),
  };
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
      <div className="mx-auto flex max-w-[1680px] items-center gap-3">
        <WifiOff className="h-4 w-4 text-ibm-orange-40" />
        <span>{copy}</span>
      </div>
    </div>
  );
}

function Dashboard() {
  const [showEventStream, setShowEventStream] = useState(true);
  const [activeAnalysisTab, setActiveAnalysisTab] =
    useState<AnalysisTabId>('entry');
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);
  const [certificationAnswers, setCertificationAnswers] = useState<{
    sessionId: string | null;
    answers: Record<string, string>;
  }>({ sessionId: null, answers: {} });
  const [answerSubmissionState, setAnswerSubmissionState] = useState<{
    sessionId: string | null;
    questions: Record<string, CertificationSubmissionState>;
  }>({ sessionId: null, questions: {} });
  const [starterIssuesState, setStarterIssuesState] = useState<StarterIssuesState>({
    isLoading: false,
    hasLoaded: false,
    error: null,
    repository: null,
    issues: [],
  });
  const lastRecoveryEventId = useRef<string | null>(null);
  const { isConnected } = useEvents();
  useEventHandlers();

  const connectionState = useEventsStore((state) => state.connectionState);
  const events = useEventsStore((state) => state.events);
  const cartographySteps = useEventsStore((state) => state.cartographySteps);
  const session = useEventsStore((state) => state.session);
  const { currentEvent, showRecovery, dismissRecovery } = useAutoRecovery();

  const isIdle = !session.isActive && events.length === 0;
  const currentSessionId = useMemo(() => {
    const sessionStartEvent = events.find((event) => event.type === 'session_start');
    const sessionStartId = sessionStartEvent?.data.session_id;

    if (typeof sessionStartId === 'string' && sessionStartId.trim()) {
      return sessionStartId;
    }

    const eventWithSessionId = events.find((event) => {
      const eventSessionId = event.data.session_id;
      return typeof eventSessionId === 'string' && eventSessionId.trim().length > 0;
    });

    const fallbackSessionId = eventWithSessionId?.data.session_id;
    return typeof fallbackSessionId === 'string' && fallbackSessionId.trim()
      ? fallbackSessionId
      : null;
  }, [events]);
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
  const entryPointCount = countEntryPoints(entryPointsData);
  const hotspotCount = hotspotsData?.files.length || 0;
  const conventionCount = conventionsData?.conventions.length || 0;
  const passCount = certificationQuestions.filter(
    (question) => question.grade === 'pass'
  ).length;
  const latestPrUrl = events.find((event) => event.type === 'session_end')?.data
    .pr_url as string | undefined;
  const analysisTabs = useMemo<AnalysisTabConfig[]>(
    () => [
      {
        id: 'entry',
        label: 'Entry Points',
        caption: `${entryPointCount} surfaces`,
        icon: Globe,
        type: 'entry',
        state: entryCard ? 'complete' : 'pending',
        title: String(entryCard?.data.title || 'Entry Points'),
        bodyMarkdown:
          typeof entryCard?.data.body_markdown === 'string'
            ? entryCard.data.body_markdown
            : null,
        content: entryPointsData ? (
          <EntryPointsCard data={entryPointsData} />
        ) : (
          <div className="py-4 text-center text-sm text-ibm-gray-70">
            Waiting to analyze entry points...
          </div>
        ),
        isAvailable: Boolean(entryCard || entryPointsData),
      },
      {
        id: 'hotspot',
        label: 'Change Hotspots',
        caption: `${hotspotCount} files`,
        icon: Flame,
        type: 'hotspot',
        state: hotspotCard ? 'complete' : 'pending',
        title: String(hotspotCard?.data.title || 'Change Hotspots'),
        bodyMarkdown:
          typeof hotspotCard?.data.body_markdown === 'string'
            ? hotspotCard.data.body_markdown
            : null,
        content: hotspotsData ? (
          <HotspotsCard data={hotspotsData} />
        ) : (
          <div className="py-4 text-center text-sm text-ibm-gray-70">
            Waiting to analyze hotspots...
          </div>
        ),
        isAvailable: Boolean(hotspotCard || hotspotsData),
      },
      {
        id: 'convention',
        label: 'Project Conventions',
        caption: `${conventionCount} patterns`,
        icon: BookOpen,
        type: 'convention',
        state: conventionCard ? 'complete' : 'pending',
        title: String(conventionCard?.data.title || 'Project Conventions'),
        bodyMarkdown:
          typeof conventionCard?.data.body_markdown === 'string'
            ? conventionCard.data.body_markdown
            : null,
        content: conventionsData ? (
          <ConventionsCard data={conventionsData} />
        ) : (
          <div className="py-4 text-center text-sm text-ibm-gray-70">
            Waiting to analyze conventions...
          </div>
        ),
        isAvailable: Boolean(conventionCard || conventionsData),
      },
    ],
    [
      conventionCard,
      conventionCount,
      conventionsData,
      entryCard,
      entryPointCount,
      entryPointsData,
      hotspotCard,
      hotspotCount,
      hotspotsData,
    ]
  );
  const activeAnalysisConfig =
    analysisTabs.find((tab) => tab.id === activeAnalysisTab) || analysisTabs[0];
  const availableAnalysisCount = analysisTabs.filter((tab) => tab.isAvailable).length;

  useEffect(() => {
    if (activeAnalysisConfig?.isAvailable) return;

    const nextAvailableTab = analysisTabs.find((tab) => tab.isAvailable);
    if (nextAvailableTab && nextAvailableTab.id !== activeAnalysisTab) {
      setActiveAnalysisTab(nextAvailableTab.id);
    }
  }, [activeAnalysisConfig, activeAnalysisTab, analysisTabs]);

  const loadStarterIssues = useCallback(async (force = false) => {
    if (!force && starterIssuesState.isLoading) return;

    setStarterIssuesState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const result = await fetchStarterIssueCandidates(MCP_HTTP_URL);
      setStarterIssuesState({
        isLoading: false,
        hasLoaded: true,
        error: null,
        repository: result.repository,
        issues: result.issues,
      });
    } catch (error) {
      setStarterIssuesState((prev) => ({
        ...prev,
        isLoading: false,
        hasLoaded: true,
        error:
          error instanceof Error && error.message.trim()
            ? error.message
            : 'Could not load starter issues from the local onboarding backend.',
      }));
    }
  }, [starterIssuesState.isLoading]);

  useEffect(() => {
    if (connectionState !== 'connected' || starterIssuesState.hasLoaded) return;
    void loadStarterIssues();
  }, [connectionState, starterIssuesState.hasLoaded, loadStarterIssues]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AutoRecoveryBanner event={currentEvent} onDismiss={dismissRecovery} />

      <header className="border-b border-ibm-gray-20 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-6">
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

      <main className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col gap-5 px-6 py-5">
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

        {isIdle ? (
          <div className="border border-ibm-gray-20 bg-white">
            <IdleState />
          </div>
        ) : (
          <>
            <section className="min-w-0">
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
                  <DependencyGraph data={graphData} height={560} />
                </div>
              </CartographyCard>
            </section>

            <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.18fr)_420px]">
              <div className="min-w-0">
                <div className="overflow-hidden rounded-[24px] border border-ibm-gray-20 bg-white shadow-[0_18px_40px_rgba(22,22,22,0.04)]">
                  <button
                    type="button"
                    onClick={() => setIsAnalysisExpanded((value) => !value)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-ibm-gray-10/30"
                  >
                    <div>
                      <div className="text-sm font-semibold text-ibm-gray-100">
                        Repository Reading Lenses
                      </div>
                      <p className="mt-1 text-sm text-ibm-gray-70">
                        Entry points, change hotspots, and conventions grouped into one review section.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-ibm-gray-10 px-3 py-1 text-xs font-semibold text-ibm-gray-70">
                        {availableAnalysisCount} of {analysisTabs.length} ready
                      </div>
                      {isAnalysisExpanded ? (
                        <ChevronUp className="h-4 w-4 text-ibm-gray-70" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-ibm-gray-70" />
                      )}
                    </div>
                  </button>

                  {isAnalysisExpanded ? (
                    <div className="space-y-4 border-t border-ibm-gray-10 px-4 py-4">
                      <div className="rounded-[24px] border border-ibm-gray-20 bg-[linear-gradient(135deg,rgba(15,98,254,0.06),rgba(255,131,43,0.04),rgba(36,161,72,0.04))] p-2 shadow-[0_12px_28px_rgba(22,22,22,0.04)]">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          {analysisTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = tab.id === activeAnalysisTab;

                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveAnalysisTab(tab.id)}
                                className={`rounded-[18px] border px-4 py-4 text-left transition ${
                                  isActive
                                    ? 'border-ibm-blue-60 bg-white shadow-[0_12px_24px_rgba(15,98,254,0.12)]'
                                    : 'border-transparent bg-white/55 hover:border-ibm-gray-20 hover:bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`rounded-2xl p-2 ${
                                      isActive ? 'bg-ibm-blue-60/10' : 'bg-white'
                                    }`}
                                  >
                                    <Icon className="h-4 w-4 text-ibm-blue-60" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-ibm-gray-100">
                                      {tab.label}
                                    </div>
                                    <div className="text-xs text-ibm-gray-70">
                                      {tab.caption}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <CartographyCard
                        type={activeAnalysisConfig.type}
                        title={activeAnalysisConfig.title}
                        state={activeAnalysisConfig.state}
                      >
                        {activeAnalysisConfig.bodyMarkdown && (
                          <p className="mb-4 text-sm text-ibm-gray-70">
                            {activeAnalysisConfig.bodyMarkdown}
                          </p>
                        )}
                        {activeAnalysisConfig.content}
                      </CartographyCard>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 border-t border-ibm-gray-10 px-4 py-4">
                      {analysisTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setActiveAnalysisTab(tab.id);
                            setIsAnalysisExpanded(true);
                          }}
                          className={`rounded-full border px-3 py-2 text-left text-xs font-semibold transition ${
                            tab.isAvailable
                              ? 'border-ibm-gray-20 bg-white text-ibm-gray-100 hover:border-ibm-blue-60 hover:text-ibm-blue-60'
                              : 'border-ibm-gray-10 bg-ibm-gray-10/60 text-ibm-gray-50'
                          }`}
                        >
                          {tab.label} · {tab.caption}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <aside className="min-w-0 space-y-4">
                <StarterIssuePanel
                  repository={starterIssuesState.repository}
                  issues={starterIssuesState.issues}
                  isLoading={starterIssuesState.isLoading}
                  error={starterIssuesState.error}
                  isUnlocked={passCount >= 2}
                  prUrl={latestPrUrl}
                  onRetry={() => {
                    void loadStarterIssues(true);
                  }}
                />

                <TranscriptPanel maxHeight={360} />
              </aside>
            </section>

            <section className="overflow-hidden rounded-[24px] border border-ibm-gray-20 bg-white shadow-[0_18px_40px_rgba(22,22,22,0.04)]">
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
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-ibm-gray-20 bg-white px-6 py-3">
        <div className="mx-auto max-w-[1680px]">
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
