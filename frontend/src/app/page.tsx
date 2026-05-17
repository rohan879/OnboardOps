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
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Code2,
  Download,
  ExternalLink,
  FileCode2,
  Filter,
  Flame,
  GitBranch,
  GitPullRequest,
  Globe2,
  Layers3,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  TimerReset,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  AutoRecoveryBanner,
  type RecoveryPattern,
  type RecoveryStatus,
  useAutoRecovery,
} from '@/components/AutoRecoveryBanner';
import type {
  EntryPoint,
  EntryPointsData,
} from '@/components/cards/EntryPointsCard';
import type { Hotspot, HotspotsData } from '@/components/cards/HotspotsCard';
import type {
  Convention,
  ConventionsData,
} from '@/components/cards/ConventionsCard';
import type {
  CertificationQuestion,
  CertificationSubmissionState,
} from '@/components/CertificationPanel';
import type { StarterIssue } from '@/components/StarterIssuePanel';
import { useEvents } from '@/hooks/useEvents';
import { useEventHandlers } from '@/hooks/useEventHandlers';
import { type Event, useEventsStore } from '@/store/events';

const MCP_HTTP_URL =
  process.env.NEXT_PUBLIC_MCP_HTTP_URL || 'http://127.0.0.1:8765';
const REPOSITORY_URL = process.env.NEXT_PUBLIC_REPOSITORY_URL || '';
const REPOSITORY_BRANCH = process.env.NEXT_PUBLIC_REPOSITORY_BRANCH || 'main';
const TARGET_SECONDS = 10 * 60;
const EMPTY_HOTSPOTS: Hotspot[] = [];

type AnalysisTabId = 'entry' | 'hotspot' | 'convention';
type GraphRole = 'orchestrator' | 'bridge' | 'shared' | 'leaf';
type GraphNode = {
  id: string;
  name: string;
  group?: number;
  val?: number;
  fanIn?: number;
  fanOut?: number;
  role?: GraphRole;
};
type GraphEdge = {
  source: string;
  target: string;
  value?: number;
};
type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  cycles?: string[];
};
type CarbonGraphNode = Required<Pick<GraphNode, 'id' | 'name'>> & {
  fanIn: number;
  fanOut: number;
  role: GraphRole;
  importance: number;
  x: number;
  y: number;
};

interface StarterIssuesState {
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  repository: string | null;
  issues: StarterIssue[];
}

interface StarterSuggestion {
  title: string;
  description: string;
  filePath?: string;
  url?: string;
  commitMessage?: string;
}

interface AnalysisTabConfig {
  id: AnalysisTabId;
  label: string;
  caption: string;
  icon: LucideIcon;
  isAvailable: boolean;
}

interface JournalEntry {
  id: string;
  time: string;
  kind: 'survey' | 'quiz' | 'pass' | 'ship' | 'event';
  label: string;
  body: string;
  meta: string;
}

interface SessionMeta {
  repositoryReference: string | null;
  repositoryDisplay: string;
  repositoryUrl: string | null;
  repositoryOwner: string | null;
  repositoryName: string;
  branch: string;
  commit: string | null;
  onboardeeName: string | null;
}

type RepositoryToolContext = Pick<
  SessionMeta,
  'repositoryReference' | 'repositoryUrl' | 'repositoryDisplay'
>;

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
          name?: string;
          fan_in?: number;
          fan_out?: number;
          is_hub?: boolean;
        }>;
        edges?: Array<{ source?: string; target?: string; value?: number }>;
        circular_dependencies?: Array<{
          cycle?: string[] | string;
        }>;
      }
    | undefined;

  if (!data?.nodes?.length) {
    return { nodes: [], edges: [], cycles: [] };
  }

  return {
    nodes: data.nodes.map((node, index) => ({
      id: node.id || `node-${index}`,
      name: node.label || node.name || node.id || `node-${index}`,
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
        value: edge.value || 1,
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
  const commitFrequency =
    record.commit_frequency ??
    record.frequency ??
    record.trend ??
    record.sparkline;

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
    commit_frequency: Array.isArray(commitFrequency)
      ? commitFrequency
          .map((item) => toFiniteNumber(item, Number.NaN))
          .filter((item) => Number.isFinite(item))
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
      line_number:
        toFiniteNumber(record.line_number ?? record.line ?? record.lineNumber, 0) ||
        undefined,
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

function normalizeConventionRecord(
  value: unknown,
  index: number
): Convention | null {
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

function buildChoiceSet(correct: string, distractors: string[], seedKey: string) {
  const combined = uniqueOptions([correct, ...distractors]).slice(0, 4);
  return combined.length >= 4
    ? shuffleQuestionOptions(combined, seedKey)
    : undefined;
}

function routeChoice(route: EntryPoint) {
  return `${route.file}, function ${
    route.handler || route.entry_point || route.name
  }`;
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
    const ranked = [...dependencyNodes].sort(
      (left, right) => right.fanOut - left.fanOut
    );
    if (ranked.length >= 4 && ranked[0].fanOut > 0) {
      const correct = `${ranked[0].label} (highest fan-out of ${ranked[0].fanOut})`;
      const distractors = ranked
        .slice(1, 4)
        .map((node) => `${node.label} (fan-out of ${node.fanOut})`);
      return buildChoiceSet(correct, distractors, questionId);
    }
  }

  if (text.includes('circular dependenc')) {
    const cycles = dependencyCyclesFromCard(dependencyCard);
    const ranked = [...dependencyNodes].sort(
      (left, right) => right.fanOut - left.fanOut
    );

    if (cycles.length > 0) {
      const correct = `Yes: ${cycles[0]}`;
      const distractors = [
        'No circular dependencies were identified',
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
      hotspots
        .map((hotspot) => hotspot.top_author)
        .filter((value): value is string => Boolean(value))
    );
    if (authors.length > 0) {
      const correct = `${authors[0]} because they have the strongest recent ownership signal on the hotspot file.`;
      const distractors = authors.slice(1, 4).map(
        (author) =>
          `${author} because they might be available, even without hotspot ownership evidence.`
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
    const moduleMatch = question.questionText.match(
      /for the ([A-Za-z0-9_./-]+) module/i
    );
    const rawModuleName = moduleMatch?.[1] || 'app';
    const moduleBase =
      rawModuleName.replace(/\.py$/i, '').split('/').pop() || rawModuleName;
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
      const correct = `${route.file} -> ${
        route.handler || route.name
      } -> ${centralModule.label}`;
      const distractors = [
        `frontend/src/app/page.tsx -> CertificationPanel -> ${centralModule.label}`,
        `${centralModule.label} -> ${route.file} -> ${
          route.handler || route.name
        }`,
        `${route.file} -> README.md -> ${centralModule.label}`,
      ];
      return buildChoiceSet(correct, distractors, questionId);
    }
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

function isLocalRepositoryReference(value: string | null | undefined) {
  if (!value) return false;

  return (
    /^[A-Za-z]:[\\/]/.test(value) ||
    value.startsWith('/') ||
    value.startsWith('~/')
  );
}

async function fetchStarterIssueCandidates(
  baseUrl: string,
  repository?: string | null
) {
  const response = await fetch(`${baseUrl}/mcp/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tool_name: 'starter_issue_candidates',
      arguments: {
        limit: 3,
        ...(repository ? { repository } : {}),
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

function normalizeRepositoryReference(repository: string | null | undefined) {
  const value = repository?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.hostname.includes('github.com')) {
      const [owner, repo] = url.pathname
        .replace(/^\/+/, '')
        .replace(/\.git$/, '')
        .split('/');
      if (owner && repo) return `${owner}/${repo}`;
    }

    return url.pathname.replace(/^\/+/, '').replace(/\.git$/, '') || value;
  } catch {
    const normalized = value.replace(/\\/g, '/').replace(/\.git$/, '');
    if (normalized.includes('/')) {
      const parts = normalized.split('/').filter(Boolean);
      const repo = parts.at(-1);
      const owner = parts.at(-2);
      const looksLikeLocalPath =
        normalized.match(/^[A-Za-z]:\//) ||
        normalized.startsWith('/') ||
        normalized.startsWith('~/');
      if (owner && repo && !looksLikeLocalPath) {
        return `${owner}/${repo}`;
      }
      return repo || normalized;
    }

    return normalized;
  }
}

function getRepositoryName(repository: string | null) {
  const normalized = normalizeRepositoryReference(repository);
  if (normalized) return normalized;

  try {
    const url = new URL(REPOSITORY_URL);
    return url.pathname.replace(/^\/|\.git$/g, '') || 'OnboardOps';
  } catch {
    return 'OnboardOps';
  }
}

function getStringField(
  record: Record<string, unknown> | undefined,
  keys: string[]
) {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return null;
}

function getEntryExplicitUrl(entry: EntryPoint) {
  return entry.github_url || entry.file_url || entry.url || undefined;
}

function inferRepositoryFromEntryPoints(data: EntryPointsData | null) {
  const entries = [
    ...(data?.routes || []),
    ...(data?.cli || []),
    ...(data?.jobs || []),
    ...(data?.consumers || []),
  ];

  for (const entry of entries) {
    const explicitUrl = getEntryExplicitUrl(entry);
    if (!explicitUrl) continue;

    try {
      const url = new URL(explicitUrl);
      if (!url.hostname.includes('github.com')) continue;
      const blobIndex = url.pathname.split('/').findIndex((part) => part === 'blob');
      const parts = url.pathname.replace(/^\/+/, '').split('/');
      if (blobIndex >= 2 && parts[0] && parts[1]) {
        return `https://github.com/${parts[0]}/${parts[1]}`;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function deriveSessionMeta({
  events,
  starterRepository,
  entryPointsData,
}: {
  events: Event[];
  starterRepository: string | null;
  entryPointsData: EntryPointsData | null;
}): SessionMeta {
  const sessionStart = events.find((event) => event.type === 'session_start');
  const sources = [
    sessionStart?.data,
    ...events.map((event) => event.data),
  ] as Array<Record<string, unknown> | undefined>;
  const repositoryUrl =
    sources
      .map((source) =>
        getStringField(source, [
          'repository_url',
          'repo_url',
          'repository',
          'repo',
          'repository_name',
          'repo_name',
          'repo_path',
          'workspace_path',
        ])
      )
      .find(Boolean) ||
    inferRepositoryFromEntryPoints(entryPointsData) ||
    starterRepository ||
    REPOSITORY_URL;
  const repositoryDisplay = getRepositoryName(repositoryUrl);
  const [repositoryOwner, repositoryNameFromDisplay] = repositoryDisplay.includes('/')
    ? repositoryDisplay.split('/').slice(-2)
    : [null, repositoryDisplay];
  const repositoryLink = /^https?:\/\//i.test(repositoryUrl)
    ? repositoryUrl
    : repositoryOwner && repositoryNameFromDisplay
      ? `https://github.com/${repositoryOwner}/${repositoryNameFromDisplay}`
      : null;
  const branch =
    sources
      .map((source) =>
        getStringField(source, ['branch', 'git_branch', 'repository_branch'])
      )
      .find(Boolean) || REPOSITORY_BRANCH;
  const commit =
    sources
      .map((source) =>
        getStringField(source, [
          'commit',
          'commit_sha',
          'sha',
          'revision',
          'repository_commit',
        ])
      )
      .find(Boolean) || null;
  const onboardeeName =
    sources
      .map((source) =>
        getStringField(source, [
          'onboardee_name',
          'onboardee',
          'user_name',
          'name',
        ])
      )
      .find(Boolean) || null;

  return {
    repositoryReference: repositoryUrl,
    repositoryDisplay,
    repositoryUrl: repositoryLink,
    repositoryOwner,
    repositoryName: repositoryNameFromDisplay || repositoryDisplay,
    branch,
    commit,
    onboardeeName,
  };
}

function getRepositoryFileUrl(
  path: string,
  lineNumber?: number,
  repositoryUrl = REPOSITORY_URL,
  branch = REPOSITORY_BRANCH
) {
  if (!path || path === 'unknown') return undefined;

  const normalizedBase = repositoryUrl.replace(/\.git$/, '').replace(/\/$/, '');
  if (!/^https?:\/\//i.test(normalizedBase)) return undefined;

  const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  const lineSuffix = lineNumber ? `#L${lineNumber}` : '';

  return `${normalizedBase}/blob/${branch}/${encodeURI(
    normalizedPath
  )}${lineSuffix}`;
}

function getRepositoryIssueSearchUrl(repository: string | null) {
  const repositoryName = getRepositoryName(repository);
  if (!repositoryName.includes('/')) return undefined;

  const [owner, repo] = repositoryName.split('/').slice(-2);
  if (!owner || !repo) return undefined;

  const query = encodeURIComponent('is:issue is:open label:"good first issue"');
  return `https://github.com/${owner}/${repo}/issues?q=${query}`;
}

function extractStarterTaskFilePath(value: string) {
  const match = value.match(
    /\b([A-Za-z0-9_.-]+(?:[/\\][A-Za-z0-9_.-]+)+\.[A-Za-z0-9_]+)\b/
  );

  return match?.[1]?.replace(/\\/g, '/') || null;
}

function getFirstString(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string' && item.trim());
    return typeof first === 'string' ? first.trim() : null;
  }

  return null;
}

function starterSuggestionFromRecord(
  record: Record<string, unknown>
): StarterSuggestion | null {
  const nestedCandidate = Array.isArray(record.starter_task_candidates)
    ? record.starter_task_candidates.find(
        (candidate) => candidate && typeof candidate === 'object'
      )
    : null;
  const data =
    nestedCandidate && typeof nestedCandidate === 'object'
      ? ({ ...record, ...(nestedCandidate as Record<string, unknown>) } as Record<
          string,
          unknown
        >)
      : record;
  const title = getStringField(data, [
    'starter_task_proposed',
    'suggested_starter_task',
    'starter_task_title',
    'task_title',
    'title',
  ]);

  if (!title) return null;

  const filePath =
    getStringField(data, [
      'starter_task_file',
      'starter_file',
      'target_file',
      'file_path',
      'file',
    ]) ||
    getFirstString(data.starter_task_files) ||
    getFirstString(data.files) ||
    extractStarterTaskFilePath(title) ||
    undefined;
  const description =
    getStringField(data, [
      'starter_task_description',
      'starter_task_rationale',
      'starter_task_body',
      'description',
      'rationale',
    ]) ||
    'Suggested by Bob after certification because no small labeled GitHub issue was available.';

  return {
    title,
    description,
    filePath,
    url:
      getStringField(data, [
        'starter_task_url',
        'starter_issue_url',
        'issue_url',
        'url',
      ]) || undefined,
    commitMessage:
      getStringField(data, [
        'starter_task_commit_message',
        'commit_message',
      ]) || undefined,
  };
}

function buildStarterSuggestion(events: Event[]) {
  for (const event of events) {
    if (event.type !== 'session_end') continue;
    const suggestion = starterSuggestionFromRecord(event.data);
    if (suggestion) return suggestion;
  }

  return null;
}

function getStarterSuggestionUrl(
  suggestion: StarterSuggestion | null,
  repositoryUrl: string | null,
  branch: string
) {
  if (!suggestion) return undefined;
  if (suggestion.url && /^https?:\/\//i.test(suggestion.url)) {
    return suggestion.url;
  }

  if (!suggestion.filePath) return undefined;

  return getRepositoryFileUrl(
    suggestion.filePath,
    undefined,
    repositoryUrl || undefined,
    branch
  );
}

function formatClockTime(value: Date | string | null | undefined) {
  if (!value) return 'not started';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function stringifyPayload(value: unknown, maxLength = 160) {
  try {
    const text = JSON.stringify(value);
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  } catch {
    return '[unserializable payload]';
  }
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function useElapsedSeconds(
  startedAt: Date | null,
  endedAt: Date | null,
  isRunning: boolean
) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!isRunning) return undefined;

    const id = window.setInterval(() => setNow(new Date()), 500);
    return () => window.clearInterval(id);
  }, [isRunning]);

  return useMemo(() => {
    if (!startedAt) return 0;

    const comparison = isRunning ? now : endedAt || now;
    return Math.max(
      0,
      Math.floor((comparison.getTime() - startedAt.getTime()) / 1000)
    );
  }, [endedAt, isRunning, now, startedAt]);
}

function buildJournalEntries(events: Event[]): JournalEntry[] {
  return [...events]
    .reverse()
    .filter((event) =>
      [
        'card_emit',
        'question_ask',
        'certification_grade',
        'session_start',
        'session_end',
        'tool_call',
        'turn_end',
      ].includes(event.type)
    )
    .slice(-16)
    .map((event) => {
      if (event.type === 'card_emit') {
        const title =
          toTrimmedString(event.data.title) ||
          String(event.data.card_type || 'Cartography card');
        return {
          id: event.id,
          time: formatClockTime(event.timestamp),
          kind: 'survey',
          label: 'Survey',
          body: `Generated ${title}.`,
          meta: `card.emit / ${event.data.card_type || 'unknown'}`,
        };
      }

      if (event.type === 'question_ask') {
        return {
          id: event.id,
          time: formatClockTime(event.timestamp),
          kind: 'quiz',
          label: 'Quiz',
          body:
            toTrimmedString(event.data.question) ||
            'Bob asked a certification question.',
          meta: `question.ask / ${event.data.question_id || event.id}`,
        };
      }

      if (event.type === 'certification_grade') {
        const grade = toTrimmedString(event.data.grade) || 'graded';
        return {
          id: event.id,
          time: formatClockTime(event.timestamp),
          kind: grade === 'pass' ? 'pass' : 'event',
          label: grade === 'pass' ? 'Pass' : 'Grade',
          body:
            toTrimmedString(event.data.rationale) ||
            `Certification answer graded: ${grade}.`,
          meta: `certification.grade / ${event.data.question_id || event.id}`,
        };
      }

      if (event.type === 'session_end') {
        const starterSuggestion = starterSuggestionFromRecord(event.data);

        return {
          id: event.id,
          time: formatClockTime(event.timestamp),
          kind: event.data.pr_url ? 'ship' : 'event',
          label: event.data.pr_url ? 'Ship' : 'End',
          body: event.data.pr_url
            ? 'Starter PR URL received from the onboarding session.'
            : starterSuggestion
              ? `Starter task suggested: ${starterSuggestion.title}.`
            : 'Onboarding session ended.',
          meta: `session.end / ${event.data.status || 'complete'}`,
        };
      }

      if (event.type === 'session_start') {
        return {
          id: event.id,
          time: formatClockTime(event.timestamp),
          kind: 'event',
          label: 'Start',
          body: 'Onboarding session started.',
          meta: `session.start / ${event.data.session_id || event.id}`,
        };
      }

      return {
        id: event.id,
        time: formatClockTime(event.timestamp),
        kind: 'event',
        label: event.type.replace(/_/g, ' '),
        body: stringifyPayload(event.data, 120),
        meta: event.type,
      };
    });
}

function CarbonTag({
  tone = 'neutral',
  children,
}: {
  tone?: 'blue' | 'green' | 'cyan' | 'magenta' | 'purple' | 'yellow' | 'red' | 'neutral';
  children: ReactNode;
}) {
  return <span className={`carbon-tag carbon-tag-${tone}`}>{children}</span>;
}

function ShellHeader({
  sessionId,
  onExport,
}: {
  sessionId: string | null;
  onExport: () => void;
}) {
  return (
    <header className="carbon-shell">
      <div className="shell-trail">
        <span className="shell-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className="t-h-01">OnboardOps</span>
        <span className="shell-separator">/</span>
        <span className="t-body-01">Sessions</span>
        <span className="shell-separator">/</span>
        <span className="t-code-01">{sessionId || 'waiting'}</span>
      </div>
      <div className="shell-right">
        <button className="shell-primary" type="button" onClick={onExport}>
          <Download size={16} />
          Export
        </button>
      </div>
    </header>
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
    <div className="carbon-offline-banner">
      <WifiOff size={16} />
      <span>{copy}</span>
    </div>
  );
}

function StopwatchHero({
  elapsedSeconds,
  startedAt,
  isRunning,
}: {
  elapsedSeconds: number;
  startedAt: Date | null;
  isRunning: boolean;
}) {
  const remaining = Math.max(0, TARGET_SECONDS - elapsedSeconds);
  const overTarget = elapsedSeconds > TARGET_SECONDS;

  return (
    <div className="stopwatch-hero">
      <div>
        <div className="t-label-01">STOPWATCH / SESSION IN FLIGHT</div>
        <div className="stopwatch-display">
          {formatElapsed(elapsedSeconds).slice(0, 2)}
          <span>:</span>
          {formatElapsed(elapsedSeconds).slice(3)}
        </div>
      </div>
      <div className="stopwatch-meta">
        <div className="t-label-01">Target</div>
        <div className="t-h-04 mono">10:00</div>
        <div className={`target-status ${overTarget ? 'danger' : 'success'}`}>
          <span className="dot" />
          {startedAt
            ? overTarget
              ? `${formatElapsed(elapsedSeconds - TARGET_SECONDS)} over target`
              : `${formatElapsed(remaining)} left in target`
            : 'waiting for session start'}
        </div>
        <div className="t-code-01 muted">
          {isRunning ? 'running' : startedAt ? 'stopped' : 'idle'} / started{' '}
          {formatClockTime(startedAt)}
        </div>
      </div>
    </div>
  );
}

function ProgressLine({ elapsedSeconds }: { elapsedSeconds: number }) {
  const pct = Math.min(1, elapsedSeconds / TARGET_SECONDS);
  const segments = 10;

  return (
    <div className="progress-block">
      <div className="row between">
        <span className="t-label-01">PROGRESS</span>
        <span className="t-code-01 muted">
          {Math.round(pct * 100)}% of budget /{' '}
          {formatElapsed(Math.max(0, TARGET_SECONDS - elapsedSeconds))} left
        </span>
      </div>
      <div className="carbon-progress-segments">
        {Array.from({ length: segments }).map((_, index) => {
          const start = index / segments;
          const end = (index + 1) / segments;
          const filled = pct >= end ? 100 : pct > start ? (pct - start) * segments * 100 : 0;

          return (
            <span key={index}>
              <i style={{ width: `${filled}%` }} />
            </span>
          );
        })}
      </div>
      <div className="progress-axis">
        {['0:00', '2:00', '4:00', '6:00', '8:00', '10:00'].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function CarbonMetricTile({
  icon: Icon,
  label,
  value,
  detail,
  status,
  tone = 'blue',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  status?: string;
  tone?: 'blue' | 'green' | 'cyan' | 'magenta';
}) {
  return (
    <div className="metric-tile">
      <div className="row between center">
        <div className={`metric-label metric-${tone}`}>
          <Icon size={16} />
          <span>{label}</span>
        </div>
        {status && (
          <div className="metric-status">
            <span className="dot" />
            {status}
          </div>
        )}
      </div>
      <div className="metric-value mono">{value}</div>
      <p>{detail}</p>
    </div>
  );
}

function StageRail({
  stages,
}: {
  stages: Array<{ id: string; label: string; status: string; kind: string }>;
}) {
  return (
    <div className="stage-rail">
      <div className="stage-line" />
      {stages.map((stage, index) => {
        const isDone = stage.status === 'complete';
        const isActive = stage.status === 'in-progress';

        return (
          <div key={stage.id} className="stage-item">
            <div
              className={`stage-dot ${
                isDone ? 'done' : isActive ? 'active' : 'pending'
              }`}
            >
              {isDone ? <CheckCircle2 size={20} /> : <CircleDot size={20} />}
            </div>
            <div className="t-label-01">
              STAGE {String(index + 1).padStart(2, '0')} / {stage.status}
            </div>
            <div className="t-h-02">{stage.label}</div>
            <div className="t-helper">{stage.kind}</div>
          </div>
        );
      })}
    </div>
  );
}

function Section({
  eyebrow,
  title,
  sub,
  right,
  children,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="carbon-section">
      <div className="section-head">
        <div>
          <div className="t-label-01">{eyebrow}</div>
          <h2 className="t-h-05">{title}</h2>
          <p className="t-body-02">{sub}</p>
        </div>
        {right && <div className="section-actions">{right}</div>}
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  icon: Icon = AlertTriangle,
  title,
  body,
}: {
  icon?: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="carbon-empty">
      <Icon size={22} />
      <div>
        <div className="t-h-02">{title}</div>
        <p>{body}</p>
      </div>
    </div>
  );
}

function deriveGraphRole(fanIn: number, fanOut: number): GraphRole {
  if (fanOut >= fanIn + 2 || fanOut >= 4) return 'orchestrator';
  if (fanIn > 0 && fanOut > 0) return 'bridge';
  if (fanIn >= 3) return 'shared';
  return 'leaf';
}

function roleLabel(role: GraphRole) {
  const labels: Record<GraphRole, string> = {
    orchestrator: 'Orchestrator',
    bridge: 'Bridge',
    shared: 'Shared',
    leaf: 'Leaf',
  };
  return labels[role];
}

function roleColor(role: GraphRole) {
  const colors: Record<GraphRole, string> = {
    orchestrator: 'var(--cyan)',
    bridge: 'var(--magenta)',
    shared: 'var(--teal)',
    leaf: 'var(--text-3)',
  };
  return colors[role];
}

function prepareCarbonGraph(data: GraphData) {
  const inbound = new Map<string, number>();
  const outbound = new Map<string, number>();
  const nodesById = new Map<string, GraphNode>();

  data.nodes.forEach((node) => {
    nodesById.set(node.id, node);
    inbound.set(node.id, node.fanIn || 0);
    outbound.set(node.id, node.fanOut || 0);
  });

  data.edges.forEach((edge) => {
    if (!nodesById.has(edge.source)) {
      nodesById.set(edge.source, { id: edge.source, name: edge.source });
    }
    if (!nodesById.has(edge.target)) {
      nodesById.set(edge.target, { id: edge.target, name: edge.target });
    }
    outbound.set(edge.source, (outbound.get(edge.source) || 0) + 1);
    inbound.set(edge.target, (inbound.get(edge.target) || 0) + 1);
  });

  const nodes = Array.from(nodesById.values()).map((node) => {
    const fanIn = Math.max(node.fanIn || 0, inbound.get(node.id) || 0);
    const fanOut = Math.max(node.fanOut || 0, outbound.get(node.id) || 0);
    const role = node.role || deriveGraphRole(fanIn, fanOut);
    return {
      id: node.id,
      name: node.name || node.id,
      fanIn,
      fanOut,
      role,
      importance: fanOut * 2 + fanIn,
      x: 0,
      y: 0,
    };
  });

  const visible = [...nodes]
    .sort((left, right) => right.importance - left.importance)
    .slice(0, 12);
  const visibleIds = new Set(visible.map((node) => node.id));
  const roles: GraphRole[] = ['orchestrator', 'bridge', 'shared', 'leaf'];
  const columnX: Record<GraphRole, number> = {
    orchestrator: 120,
    bridge: 360,
    shared: 590,
    leaf: 810,
  };
  const positioned: CarbonGraphNode[] = [];

  roles.forEach((role) => {
    const bucket = visible
      .filter((node) => node.role === role)
      .sort((left, right) => right.importance - left.importance);
    const step = bucket.length <= 1 ? 0 : 300 / (bucket.length - 1);
    bucket.forEach((node, index) => {
      positioned.push({
        ...node,
        x: columnX[role],
        y: bucket.length <= 1 ? 250 : 100 + step * index,
      });
    });
  });

  const edges = data.edges.filter(
    (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)
  );

  return {
    nodes: positioned,
    edges,
    hiddenCount: Math.max(0, nodes.length - visible.length),
  };
}

function edgePath(source: CarbonGraphNode, target: CarbonGraphNode) {
  const nodeWidth = 180;
  const ax = source.x + nodeWidth / 2;
  const ay = source.y;
  const bx = target.x - nodeWidth / 2;
  const by = target.y;
  const dx = bx - ax;
  const c1x = ax + dx * 0.5;
  const c2x = bx - dx * 0.5;
  return `M ${ax} ${ay} C ${c1x} ${ay}, ${c2x} ${by}, ${bx} ${by}`;
}

function ArchitectureCartograph({
  data,
}: {
  data: GraphData;
}) {
  const graph = useMemo(() => prepareCarbonGraph(data), [data]);
  const [focusId, setFocusId] = useState<string | null>(null);
  const nodeMap = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node])),
    [graph.nodes]
  );
  const focused =
    (focusId ? nodeMap.get(focusId) : null) || graph.nodes[0] || null;
  const outgoing = focused
    ? graph.edges.filter((edge) => edge.source === focused.id)
    : [];
  const incoming = focused
    ? graph.edges.filter((edge) => edge.target === focused.id)
    : [];

  if (data.nodes.length === 0) {
    return (
      <div className="carbon-panel">
        <EmptyState
          icon={Layers3}
          title="Waiting for the dependency graph"
          body="Start Bob's cartography run and this plate will render live modules and edges from the backend card_emit event."
        />
      </div>
    );
  }

  return (
    <div className="carbon-graph carbon-panel">
      <div className="panel-toolbar">
        <div>
          <div className="t-label-01">PLATE I / ARCHITECTURE CARTOGRAPH</div>
          <div className="t-h-04">
            Dependency graph{' '}
            <span className="t-code-01 muted">{graph.nodes.length} modules shown</span>
          </div>
        </div>
        <div className="toolbar-cluster">
          <span className="mini-chip">noise / hidden {graph.hiddenCount}</span>
          <span className="mini-chip">fan &gt;= live</span>
        </div>
      </div>

      <div className="graph-body">
        <div className="graph-canvas">
          <div className="graph-columns">
            {[
              ['orchestrator', 'Orchestrators'],
              ['bridge', 'Bridges'],
              ['shared', 'Shared services'],
              ['leaf', 'Leaves'],
            ].map(([role, label]) => (
              <div key={role}>
                <span style={{ background: roleColor(role as GraphRole) }} />
                <div>
                  <div className="t-label-01">{label}</div>
                  <div className="t-helper">
                    {graph.nodes.filter((node) => node.role === role).length} modules
                  </div>
                </div>
              </div>
            ))}
          </div>
          <svg viewBox="0 0 920 520" className="graph-svg" role="img">
            <defs>
              <pattern id="carbon-grid-dot" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="0.7" fill="var(--text-4)" opacity="0.48" />
              </pattern>
            </defs>
            <rect width="920" height="520" fill="url(#carbon-grid-dot)" />
            {graph.edges.map((edge) => {
              const source = nodeMap.get(edge.source);
              const target = nodeMap.get(edge.target);
              if (!source || !target) return null;
              const active = focused
                ? edge.source === focused.id || edge.target === focused.id
                : false;
              return (
                <path
                  key={`${edge.source}-${edge.target}`}
                  d={edgePath(source, target)}
                  fill="none"
                  stroke={active ? 'var(--primary)' : 'var(--border-2)'}
                  strokeWidth={active ? 1.8 : 1}
                  opacity={active ? 1 : 0.42}
                />
              );
            })}
            {graph.nodes.map((node) => {
              const isFocused = focused?.id === node.id;
              const x = node.x - 90;
              const y = node.y - 28;
              return (
                <g
                  key={node.id}
                  onClick={() => setFocusId(node.id)}
                  className="graph-node"
                  role="button"
                  tabIndex={0}
                >
                  <rect
                    x={x}
                    y={y}
                    width="180"
                    height="56"
                    fill="var(--bg-1)"
                    stroke={isFocused ? 'var(--primary)' : 'var(--border)'}
                    strokeWidth={isFocused ? 2 : 1}
                  />
                  <rect x={x} y={y} width="3" height="56" fill={roleColor(node.role)} />
                  <text x={x + 14} y={y + 22} className="graph-node-title">
                    {node.name}
                  </text>
                  <text x={x + 14} y={y + 41} className="graph-node-meta">
                    {roleLabel(node.role).toUpperCase()} / fan {node.fanOut} up /{' '}
                    {node.fanIn} down
                  </text>
                  {isFocused && <rect x={x + 158} y={y + 10} width="12" height="12" fill="var(--primary)" />}
                </g>
              );
            })}
          </svg>
          <div className="graph-hint">
            <span>Click a module to focus relationships.</span>
            <span className="t-code-01">plate_01_dependency_graph.svg</span>
          </div>
        </div>

        <aside className="graph-inspector">
          {focused ? (
            <>
              <div>
                <div className="t-label-01">FOCUSED MODULE</div>
                <div className="inspector-title mono">{focused.name}</div>
                <div className="tag-row">
                  <CarbonTag tone="cyan">{roleLabel(focused.role)}</CarbonTag>
                  <CarbonTag>{focused.id}</CarbonTag>
                </div>
              </div>
              <div className="inspector-note">
                {focused.role === 'orchestrator' &&
                  'Commissions work downstream. Start here when modelling request flow.'}
                {focused.role === 'bridge' &&
                  'Routes traffic between active areas. Useful for understanding boundaries.'}
                {focused.role === 'shared' &&
                  'Many modules call this. Treat it as a cross-cutting dependency.'}
                {focused.role === 'leaf' &&
                  'Terminal logic. Read after the orchestrator path is clear.'}
              </div>
              <div className="inspector-stats">
                <div>
                  <div className="t-label-01">FAN-OUT</div>
                  <div className="mono">{focused.fanOut}</div>
                  <span>downstream</span>
                </div>
                <div>
                  <div className="t-label-01">FAN-IN</div>
                  <div className="mono">{focused.fanIn}</div>
                  <span>upstream</span>
                </div>
              </div>
              <GraphEdgeList
                title={`OUTGOING (${outgoing.length})`}
                edges={outgoing}
                side="target"
                nodeMap={nodeMap}
                onFocus={setFocusId}
              />
              <GraphEdgeList
                title={`INCOMING (${incoming.length})`}
                edges={incoming}
                side="source"
                nodeMap={nodeMap}
                onFocus={setFocusId}
              />
            </>
          ) : (
            <EmptyState
              title="No module selected"
              body="Choose a node in the graph to inspect its live relationships."
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function GraphEdgeList({
  title,
  edges,
  side,
  nodeMap,
  onFocus,
}: {
  title: string;
  edges: GraphEdge[];
  side: 'source' | 'target';
  nodeMap: Map<string, CarbonGraphNode>;
  onFocus: (id: string) => void;
}) {
  return (
    <div className="edge-list">
      <div className="t-label-01">{title}</div>
      {edges.length === 0 ? (
        <div className="t-helper">No edges in this direction.</div>
      ) : (
        edges.slice(0, 5).map((edge) => {
          const targetId = edge[side];
          const node = nodeMap.get(targetId);
          return (
            <button
              key={`${edge.source}-${edge.target}-${side}`}
              type="button"
              onClick={() => onFocus(targetId)}
              style={{ borderLeftColor: node ? roleColor(node.role) : 'var(--text-3)' }}
            >
              <span>{side === 'target' ? '->' : '<-'}</span> {node?.name || targetId}
            </button>
          );
        })
      )}
    </div>
  );
}

function BobJournal({
  entries,
  isConnected,
}: {
  entries: JournalEntry[];
  isConnected: boolean;
}) {
  const meta: Record<JournalEntry['kind'], { icon: LucideIcon; color: string }> = {
    survey: { icon: Globe2, color: 'var(--cyan)' },
    quiz: { icon: Code2, color: 'var(--magenta)' },
    pass: { icon: Check, color: 'var(--success)' },
    ship: { icon: GitBranch, color: 'var(--primary)' },
    event: { icon: CircleDot, color: 'var(--text-3)' },
  };

  return (
    <div className="carbon-journal carbon-panel">
      <div className="panel-toolbar">
        <div>
          <div className="t-label-01">LIVE TRANSCRIPT</div>
          <div className="t-h-04">Bob, narrating.</div>
        </div>
        <div className={`bridge-pill ${isConnected ? 'online' : 'offline'}`}>
          <span className="dot" />
          {isConnected ? 'BRIDGE ONLINE' : 'BRIDGE OFFLINE'}
        </div>
      </div>
      <div className="journal-list">
        {entries.length === 0 ? (
          <EmptyState
            icon={CircleDot}
            title="Waiting for live events"
            body="Card emissions, questions, grades, tool calls, and session checkpoints will populate this timeline."
          />
        ) : (
          entries.map((entry) => {
            const EntryIcon = meta[entry.kind].icon;
            return (
              <div
                key={entry.id}
                className="journal-row"
                style={{ borderLeftColor: meta[entry.kind].color }}
              >
                <EntryIcon size={16} style={{ color: meta[entry.kind].color }} />
                <div>
                  <div className="journal-row-head">
                    <span style={{ color: meta[entry.kind].color }}>{entry.label}</span>
                    <span className="t-code-01">{entry.time}</span>
                  </div>
                  <p>{entry.body}</p>
                  <div className="t-code-01 muted">{entry.meta}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ReadingLenses({
  tabs,
  activeTab,
  onTabChange,
  entryPointsData,
  hotspotsData,
  conventionsData,
  sessionMeta,
}: {
  tabs: AnalysisTabConfig[];
  activeTab: AnalysisTabId;
  onTabChange: (tab: AnalysisTabId) => void;
  entryPointsData: EntryPointsData | null;
  hotspotsData: HotspotsData | null;
  conventionsData: ConventionsData | null;
  sessionMeta: SessionMeta;
}) {
  return (
    <div className="carbon-panel reading-lenses">
      <div className="carbon-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={isActive ? 'active' : ''}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <i>{tab.caption}</i>
            </button>
          );
        })}
      </div>
      <div className="lens-body">
        {activeTab === 'entry' && (
          <EntryPointsLens data={entryPointsData} sessionMeta={sessionMeta} />
        )}
        {activeTab === 'hotspot' && (
          <HotspotsLens data={hotspotsData} sessionMeta={sessionMeta} />
        )}
        {activeTab === 'convention' && (
          <ConventionsLens data={conventionsData} sessionMeta={sessionMeta} />
        )}
      </div>
    </div>
  );
}

function EntryPointsLens({
  data,
  sessionMeta,
}: {
  data: EntryPointsData | null;
  sessionMeta: SessionMeta;
}) {
  const rows = useMemo(() => {
    const routes = data?.routes || [];
    const cli = data?.cli || [];
    const jobs = data?.jobs || [];
    const consumers = data?.consumers || [];
    return [
      ...routes.map((item) => ({ ...item, surface: 'HTTP' })),
      ...cli.map((item) => ({ ...item, surface: 'CLI' })),
      ...jobs.map((item) => ({ ...item, surface: 'JOB' })),
      ...consumers.map((item) => ({ ...item, surface: 'CONSUMER' })),
    ];
  }, [data]);

  if (!data || rows.length === 0) {
    return (
      <EmptyState
        icon={Globe2}
        title="Waiting for entry points"
        body="The entry point table will render routes, CLIs, jobs, and consumers from the cartography card."
      />
    );
  }

  return (
    <div>
      <div className="lens-summary">
        <div>
          <div className="t-h-04">
            {(data.routes || []).length} HTTP routes{' '}
            <span className="t-body-02 muted">
              / {(data.cli || []).length} CLI scripts / {(data.jobs || []).length}{' '}
              jobs / {(data.consumers || []).length} consumers
            </span>
          </div>
          <p>
            Entry points are the doors of the codebase. Every listed row is sourced
            from the live cartography payload for{' '}
            <span className="mono">{sessionMeta.repositoryDisplay}</span>.
          </p>
        </div>
      </div>
      <div className="carbon-table entry-table">
        <div className="table-head">
          <span>Verb</span>
          <span>Path</span>
          <span>Handler</span>
          <span>File</span>
          <span />
        </div>
        {rows.map((row, index) => {
          const method = row.method || (row.surface === 'CLI' ? 'CLI' : row.surface);
          const href =
            getEntryExplicitUrl(row) ||
            getRepositoryFileUrl(
              row.file,
              row.line_number,
              sessionMeta.repositoryUrl || REPOSITORY_URL,
              sessionMeta.branch
            );
          return (
            <div key={`${row.file}-${row.name}-${index}`} className="table-row">
              <span>
                <CarbonTag tone={method === 'POST' ? 'blue' : method === 'CLI' ? 'purple' : 'green'}>
                  {method === 'WEBSOCKET' ? 'WS' : method}
                </CarbonTag>
              </span>
              <code>{row.path || row.name || row.topic || row.schedule || row.surface}</code>
              <code>{row.handler || row.entry_point || row.name || 'n/a'}</code>
              <code>{row.file}</code>
              <span className="row-action">
                {href && (
                  <a href={href} target="_blank" rel="noreferrer" aria-label={`Open ${row.file}`}>
                    <ExternalLink size={15} />
                  </a>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function normalizeSparklineData(value: unknown) {
  if (Array.isArray(value)) {
    const numericValues = value
      .map((item) => toFiniteNumber(item, Number.NaN))
      .filter((item) => Number.isFinite(item));

    if (
      numericValues.length >= 2 &&
      Math.max(...numericValues) !== Math.min(...numericValues)
    ) {
      return numericValues;
    }
  }

  return null;
}

function hasUsableTrend(value: unknown): value is number[] {
  return Boolean(normalizeSparklineData(value));
}

function buildRepositoryToolArguments(repositoryContext: RepositoryToolContext) {
  const repository =
    repositoryContext.repositoryReference ||
    repositoryContext.repositoryUrl ||
    repositoryContext.repositoryDisplay;

  return {
    repository,
    ...(isLocalRepositoryReference(repositoryContext.repositoryReference)
      ? { repo_path: repositoryContext.repositoryReference }
      : {}),
  };
}

async function fetchCommitFrequencyBuckets(
  filePath: string,
  repositoryContext: RepositoryToolContext
) {
  try {
    const response = await fetch(`${MCP_HTTP_URL}/mcp/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool_name: 'commit_frequency',
        arguments: {
          ...buildRepositoryToolArguments(repositoryContext),
          file_path: filePath,
          days: 180,
        },
      }),
    });

    const payload = (await response.json()) as {
      result?: {
        files?: Array<{
          commit_frequency?: unknown;
        }>;
      };
      error?: string | null;
    };

    if (!response.ok || payload.error) return null;

    const trend = payload.result?.files?.[0]?.commit_frequency;
    return normalizeSparklineData(trend);
  } catch {
    return null;
  }
}

async function fetchRepositoryHotspots(repositoryContext: RepositoryToolContext) {
  const response = await fetch(`${MCP_HTTP_URL}/mcp/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tool_name: 'commit_frequency',
      arguments: {
        ...buildRepositoryToolArguments(repositoryContext),
        days: 180,
      },
    }),
  });

  const payload = (await response.json()) as {
    result?: {
      files?: unknown[];
    };
    error?: string | null;
  };

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error ||
        'The backend could not read git history for this repository.'
    );
  }

  return {
    files: (payload.result?.files || [])
      .map(normalizeHotspotRecord)
      .filter((hotspot): hotspot is Hotspot => Boolean(hotspot)),
  };
}

function Sparkline({ values, color = 'var(--primary)' }: { values: number[]; color?: string }) {
  const width = 120;
  const height = 28;
  const max = Math.max(...values, 1);
  const step = width / Math.max(1, values.length - 1);
  const points = values
    .map((value, index) => `${index * step},${height - (value / max) * height}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      {values.map((value, index) => (
        <circle
          key={`${value}-${index}`}
          cx={index * step}
          cy={height - (value / max) * height}
          r="1.5"
          fill={color}
        />
      ))}
    </svg>
  );
}

function HotspotsLens({
  data,
  sessionMeta,
}: {
  data: HotspotsData | null;
  sessionMeta: SessionMeta;
}) {
  const [fallbackData, setFallbackData] = useState<HotspotsData | null>(null);
  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);
  const repositoryContext = useMemo<RepositoryToolContext>(
    () => ({
      repositoryReference: sessionMeta.repositoryReference,
      repositoryUrl: sessionMeta.repositoryUrl,
      repositoryDisplay: sessionMeta.repositoryDisplay,
    }),
    [
      sessionMeta.repositoryDisplay,
      sessionMeta.repositoryReference,
      sessionMeta.repositoryUrl,
    ]
  );
  const files = data?.files?.length
    ? data.files
    : fallbackData?.files ?? EMPTY_HOTSPOTS;
  const maxCommits = Math.max(...files.map((file) => file.commit_count), 1);
  const [trendOverrides, setTrendOverrides] = useState<Record<string, number[]>>({});
  const missingTrendKey = useMemo(
    () =>
      files
        .filter(
          (file) =>
            !hasUsableTrend(file.commit_frequency) && !trendOverrides[file.path]
        )
        .slice(0, 8)
        .map((file) => file.path)
        .join('\u0000'),
    [files, trendOverrides]
  );

  useEffect(() => {
    if (data?.files?.length) return undefined;

    let cancelled = false;

    void Promise.resolve()
      .then(() => {
        if (cancelled) return null;
        setFallbackData(null);
        setIsLoadingFallback(true);
        setFallbackError(null);
        return fetchRepositoryHotspots(repositoryContext);
      })
      .then((hotspots) => {
        if (!cancelled && hotspots) setFallbackData(hotspots);
      })
      .catch((error) => {
        if (!cancelled) {
          setFallbackData(null);
          setFallbackError(
            error instanceof Error && error.message.trim()
              ? error.message
              : 'The backend could not read git history for this repository.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingFallback(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    data?.files?.length,
    repositoryContext,
  ]);

  useEffect(() => {
    if (!missingTrendKey) return undefined;

    const paths = missingTrendKey.split('\u0000');
    let cancelled = false;

    void Promise.all(
      paths.map(
        async (path) =>
          [path, await fetchCommitFrequencyBuckets(path, repositoryContext)] as const
      )
    ).then((results) => {
      if (cancelled) return;

      const updates: Record<string, number[]> = {};
      results.forEach(([path, trend]) => {
        if (trend) updates[path] = trend;
      });

      if (Object.keys(updates).length > 0) {
        setTrendOverrides((previous) => ({ ...previous, ...updates }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [missingTrendKey, repositoryContext]);

  if (files.length === 0) {
    return (
      <EmptyState
        icon={Flame}
        title={
          isLoadingFallback
            ? 'Loading hotspots'
            : fallbackError
              ? 'Hotspots unavailable'
              : 'Waiting for hotspots'
        }
        body={
          isLoadingFallback
            ? 'Reading git history through the MCP backend for this onboarding repository.'
            : fallbackError ||
              'Change frequency rows will appear after the hotspots cartography card is emitted.'
        }
      />
    );
  }

  return (
    <div>
      <div className="lens-summary">
        <div>
          <div className="t-h-04">
            {files.length} hotspots{' '}
            <span className="t-body-02 muted">
              / {files.reduce((sum, file) => sum + file.commit_count, 0)} commits
            </span>
          </div>
          <p>Hotspots show where recent changes concentrate and who has ownership context.</p>
        </div>
      </div>
      <div className="carbon-table hotspot-table">
        <div className="table-head">
          <span>Rank</span>
          <span>File</span>
          <span>Commits</span>
          <span>Author</span>
          <span>Trend</span>
          <span />
        </div>
        {files.map((file, index) => {
          const href = getRepositoryFileUrl(
            file.path,
            undefined,
            sessionMeta.repositoryUrl || REPOSITORY_URL,
            sessionMeta.branch
          );
          const sparkline = normalizeSparklineData(
            trendOverrides[file.path] ?? file.commit_frequency
          );
          return (
            <div key={file.path} className="table-row">
              <span className="rank mono">{String(index + 1).padStart(2, '0')}</span>
              <code>{file.path}</code>
              <span className="commit-bar">
                <i style={{ width: `${(file.commit_count / maxCommits) * 100}%` }} />
                <b>{file.commit_count}</b>
              </span>
              <span>{file.top_author || 'Unknown'}</span>
              <span>
                {sparkline ? (
                  <Sparkline
                    values={sparkline}
                    color={index === 0 ? 'var(--magenta)' : 'var(--cyan)'}
                  />
                ) : (
                  <span className="t-helper">No buckets</span>
                )}
              </span>
              <span className="row-action">
                {href && (
                  <a href={href} target="_blank" rel="noreferrer" aria-label={`Open ${file.path}`}>
                    <ExternalLink size={15} />
                  </a>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConventionsLens({
  data,
  sessionMeta,
}: {
  data: ConventionsData | null;
  sessionMeta: SessionMeta;
}) {
  const conventions = data?.conventions || [];

  if (!data || conventions.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Waiting for conventions"
        body="Naming, formatting, test layout, and evidence snippets will appear from the conventions card."
      />
    );
  }

  return (
    <div>
      <div className="lens-summary">
        <div>
          <div className="t-h-04">
            {conventions.length} conventions{' '}
            <span className="t-body-02 muted">/ inferred from representative files</span>
          </div>
          <p>Each convention is backed by a file or code example from Bob&apos;s survey.</p>
        </div>
      </div>
      <div className="convention-grid">
        {conventions.map((convention, index) => {
          const href = getRepositoryFileUrl(
            convention.evidence.file,
            convention.evidence.line_number,
            sessionMeta.repositoryUrl || REPOSITORY_URL,
            sessionMeta.branch
          );
          return (
            <article key={`${convention.name}-${index}`} className="convention-tile">
              <div className="row between baseline">
                <div>
                  <div className="t-label-01">NO. {String(index + 1).padStart(2, '0')}</div>
                  <div className="t-h-03">{convention.name}</div>
                </div>
                <CarbonTag tone={convention.consistency === 'mixed' ? 'yellow' : 'green'}>
                  {convention.consistency || 'observed'}
                </CarbonTag>
              </div>
              <p>{convention.pattern}</p>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="file-link mono"
              >
                <FileCode2 size={14} />
                {convention.evidence.file}
              </a>
              {convention.evidence.example && (
                <pre>{convention.evidence.example.trim()}</pre>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function CertificationCarbon({
  questions,
  currentSessionId,
  onAnswerChange,
  onAnswerSubmit,
  submissionState,
}: {
  questions: CertificationQuestion[];
  currentSessionId: string | null;
  onAnswerChange: (questionId: string, answer: string) => void;
  onAnswerSubmit: (questionId: string) => Promise<void> | void;
  submissionState: Record<string, CertificationSubmissionState>;
}) {
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const passCount = questions.filter((question) => question.grade === 'pass').length;
  const activeQuestion =
    questions.find((question) => question.id === activeQuestionId) ||
    questions.find((question) => !question.grade) ||
    questions[questions.length - 1];
  const activeIndex = activeQuestion
    ? questions.findIndex((question) => question.id === activeQuestion.id)
    : -1;
  const activeSubmitState = activeQuestion
    ? submissionState[activeQuestion.id] || {}
    : {};
  const activeAnswer = activeQuestion
    ? activeQuestion.answer || localAnswers[activeQuestion.id] || ''
    : '';
  const isLocked =
    Boolean(activeQuestion?.grade) ||
    Boolean(activeSubmitState.pending) ||
    Boolean(activeSubmitState.submitted);
  const isMultipleChoice =
    activeQuestion?.responseMode === 'multiple_choice' &&
    Boolean(activeQuestion.options?.length);

  const setAnswer = (questionId: string, answer: string) => {
    setLocalAnswers((prev) => ({ ...prev, [questionId]: answer }));
    onAnswerChange(questionId, answer);
  };

  if (questions.length === 0 || !activeQuestion) {
    return (
      <div className="carbon-panel">
        <EmptyState
          icon={ShieldCheck}
          title="Waiting for certification questions"
          body="After cartography, Bob emits question_ask events. This panel submits answers back to the dashboard grading endpoint."
        />
      </div>
    );
  }

  return (
    <div className="carbon-panel certification-panel">
      <div className="cert-head">
        <div>
          <div className="t-label-01">CERTIFICATION QUIZ / GRADED BY BOB</div>
          <div className="t-h-04">
            Three architecture questions, scored against the cartograph.
          </div>
          <div className="cert-steps">
            {questions.map((question, index) => {
              const active = question.id === activeQuestion.id;
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setActiveQuestionId(question.id)}
                  className={active ? 'active' : ''}
                >
                  <div className="row between center">
                    <span className="t-label-01">Q.{index + 1} OF 3</span>
                    {question.grade === 'pass' && <CheckCircle2 size={18} />}
                    {question.grade === 'fail' && <XCircle size={18} />}
                  </div>
                  <div className="t-h-02">{question.topic || 'Architecture'}</div>
                  <div className="t-helper">
                    {question.grade ? `graded / ${question.grade}` : 'open'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <aside>
          <div className="t-label-01">Result</div>
          <div className="cert-score mono">
            {passCount}
            <span>/3</span>
          </div>
          <CarbonTag tone={passCount >= 2 ? 'green' : 'yellow'}>
            {passCount >= 2 ? 'Certified / ready to ship' : 'Two passes required'}
          </CarbonTag>
          <p>
            {passCount >= 2
              ? 'Starter issue review is unlocked for this session.'
              : 'Answer questions here while Bob waits for dashboard submissions.'}
          </p>
        </aside>
      </div>

      <div className="cert-question">
        <div className="cert-number mono">{String(activeIndex + 1).padStart(2, '0')}</div>
        <div>
          <div className="t-label-01">
            QUESTION {activeIndex + 1} OF 3 / {activeQuestion.topic || 'Architecture'}
          </div>
          <h3>{activeQuestion.questionText}</h3>

          {isMultipleChoice ? (
            <div className="answer-grid">
              {activeQuestion.options?.map((option, index) => {
                const selected = activeAnswer === option;
                return (
                  <button
                    key={`${activeQuestion.id}-${option}`}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setAnswer(activeQuestion.id, option)}
                    className={selected ? 'selected' : ''}
                  >
                    <span className="mono">{String.fromCharCode(65 + index)}</span>
                    <p>{option}</p>
                    {selected && <CheckCircle2 size={18} />}
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea
              value={activeAnswer}
              disabled={isLocked}
              rows={5}
              placeholder="Type your architecture answer..."
              onChange={(event) => setAnswer(activeQuestion.id, event.target.value)}
            />
          )}

          {!activeQuestion.grade && (
            <div className="answer-submit">
              <p>
                {activeSubmitState.pending
                  ? 'Answer submitted. Bob is grading it now.'
                  : activeSubmitState.submitted
                    ? 'Waiting for Bob to return a grade.'
                    : currentSessionId
                      ? 'Submit this answer to the local grading bridge.'
                      : 'Start a live onboarding session before submitting answers.'}
              </p>
              <button
                type="button"
                onClick={() => onAnswerSubmit(activeQuestion.id)}
                disabled={
                  !currentSessionId ||
                  !activeAnswer.trim() ||
                  activeSubmitState.pending ||
                  activeSubmitState.submitted
                }
                className="carbon-btn"
              >
                <Send size={16} />
                {activeSubmitState.pending ? 'Submitting' : 'Submit answer'}
              </button>
            </div>
          )}

          {activeSubmitState.error && !activeQuestion.grade && (
            <div className="answer-error">{activeSubmitState.error}</div>
          )}

          {activeQuestion.rationale && (
            <div className={`verdict ${activeQuestion.grade || 'partial'}`}>
              <div className="row between">
                <div className="t-label-01">BOB&apos;S VERDICT / {activeQuestion.grade}</div>
              </div>
              <p>{activeQuestion.rationale}</p>
            </div>
          )}

          <div className="cert-nav">
            <button
              type="button"
              onClick={() =>
                activeIndex > 0 && setActiveQuestionId(questions[activeIndex - 1].id)
              }
              disabled={activeIndex <= 0}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="t-label-01">Review previous answers anytime</span>
            <button
              type="button"
              onClick={() =>
                activeIndex < questions.length - 1 &&
                setActiveQuestionId(questions[activeIndex + 1].id)
              }
              disabled={activeIndex >= questions.length - 1}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StarterPRCarbon({
  repository,
  repositoryUrl,
  branch,
  issues,
  starterSuggestion,
  isLoading,
  error,
  isUnlocked,
  prUrl,
  onRetry,
}: {
  repository: string | null;
  repositoryUrl: string | null;
  branch: string;
  issues: StarterIssue[];
  starterSuggestion: StarterSuggestion | null;
  isLoading: boolean;
  error: string | null;
  isUnlocked: boolean;
  prUrl?: string;
  onRetry: () => void;
}) {
  const repositoryDisplay = getRepositoryName(repository);
  const issueSearchUrl = getRepositoryIssueSearchUrl(repository);
  const starterTargetUrl = getStarterSuggestionUrl(
    starterSuggestion,
    repositoryUrl,
    branch
  );
  const issueStatus = error
    ? error.toLowerCase().includes('rate_limit') ||
      error.toLowerCase().includes('rate limit')
      ? 'API rate-limited'
      : 'lookup failed'
    : isLoading
      ? 'loading'
      : starterSuggestion
        ? '1 suggested task'
        : issues.length;

  return (
    <div className="carbon-panel starter-panel">
      <div className="starter-cta">
        <div>
          <CarbonTag tone={isUnlocked ? 'green' : 'yellow'}>
            <GitPullRequest size={14} />
            {isUnlocked ? 'Certification holds' : 'Certification pending'}
          </CarbonTag>
          <div className="t-h-06">Ship your first pull request.</div>
          <p>
            This dashboard surfaces real starter issue candidates or Bob&apos;s
            selected fallback task from the MCP backend, then links to the PR URL
            emitted at session end.
          </p>
          <div className="starter-actions">
            {prUrl ? (
              <a href={prUrl} target="_blank" rel="noreferrer" className="carbon-btn">
                Open starter PR
                <ExternalLink size={16} />
              </a>
            ) : starterTargetUrl ? (
              <a
                href={starterTargetUrl}
                target="_blank"
                rel="noreferrer"
                className="carbon-btn"
              >
                Open suggested task
                <ExternalLink size={16} />
              </a>
            ) : issues[0] ? (
              <a
                href={issues[0].url}
                target="_blank"
                rel="noreferrer"
                className="carbon-btn"
              >
                Open top issue
                <ExternalLink size={16} />
              </a>
            ) : issueSearchUrl ? (
              <a
                href={issueSearchUrl}
                target="_blank"
                rel="noreferrer"
                className="carbon-btn"
              >
                Browse issues
                <ExternalLink size={16} />
              </a>
            ) : (
              <button type="button" onClick={onRetry} className="carbon-btn">
                Load issues
                <RefreshCw size={16} />
              </button>
            )}
            <button type="button" onClick={onRetry} className="carbon-btn secondary">
              Refresh candidates
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      <aside className="starter-meta">
        <div>
          <div className="t-label-01">Repository</div>
          <div className="mono">{repositoryDisplay}</div>
        </div>
        <div>
          <div className="t-label-01">Starter candidates</div>
          <div className="mono">{issueStatus}</div>
        </div>
        <div>
          <div className="t-label-01">Pull request</div>
          <div className="mono">
            {prUrl
              ? 'opened'
              : starterSuggestion
                ? 'suggested task ready'
                : isUnlocked
                  ? 'manual path ready'
                  : 'waiting for certification'}
          </div>
        </div>
        {error && (
          <div className="starter-error">
            <AlertTriangle size={16} />
            <span>
              {error}
              {issueSearchUrl
                ? ' You can still browse the live GitHub issue search.'
                : ''}
            </span>
          </div>
        )}
        {!error && !isLoading && issues.length === 0 && !starterSuggestion && (
          <div className="starter-error neutral">
            No starter issues returned yet. Use the GitHub issue search or
            refresh when API budget is available.
          </div>
        )}
        {starterSuggestion && (
          <section className="starter-suggestion">
            <div className="t-label-01">Suggested starter task</div>
            <strong>{starterSuggestion.title}</strong>
            <p>{starterSuggestion.description}</p>
            {starterSuggestion.filePath && (
              <code>{starterSuggestion.filePath}</code>
            )}
            {starterSuggestion.commitMessage && (
              <small>
                Commit <span>{starterSuggestion.commitMessage}</span>
              </small>
            )}
            {starterTargetUrl && (
              <a href={starterTargetUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={15} />
                Open target
              </a>
            )}
          </section>
        )}
        {issueSearchUrl && (
          <a
            href={issueSearchUrl}
            target="_blank"
            rel="noreferrer"
            className="starter-meta-link"
          >
            <ExternalLink size={15} />
            Browse good first issues
          </a>
        )}
        <div className="issue-list">
          {issues.map((issue) => (
            <a key={issue.issueNumber} href={issue.url} target="_blank" rel="noreferrer">
              <span className="mono">#{issue.issueNumber}</span>
              <strong>{issue.title}</strong>
              <small>{issue.labels.slice(0, 3).join(' / ') || issue.state}</small>
            </a>
          ))}
        </div>
      </aside>
    </div>
  );
}

function EventLog({ events }: { events: Event[] }) {
  const [query, setQuery] = useState('');
  const [eventType, setEventType] = useState('all');
  const eventTypes = useMemo(
    () => ['all', ...Array.from(new Set(events.map((event) => event.type))).sort()],
    [events]
  );
  const visibleEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      const matchesType = eventType === 'all' || event.type === eventType;
      const payload = stringifyPayload(event.data, 2000).toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        event.type.toLowerCase().includes(normalizedQuery) ||
        payload.includes(normalizedQuery);
      return matchesType && matchesQuery;
    });
  }, [eventType, events, query]);

  return (
    <div className="carbon-panel event-log">
      <div className="event-toolbar">
        <div className="row center gap-3">
          <Zap size={17} />
          <span className="t-h-02">Event log</span>
          <CarbonTag>{events.length} events</CarbonTag>
        </div>
        <div className="event-controls">
          <label>
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events..."
              type="search"
            />
          </label>
          <label>
            <Filter size={15} />
            <select
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
              aria-label="Filter event type"
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All types' : type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="event-table">
        <div className="table-head">
          <span>Time</span>
          <span>Sev</span>
          <span>Event</span>
          <span>Payload</span>
          <span>Event ID</span>
        </div>
        {visibleEvents.length === 0 ? (
          <EmptyState
            icon={CircleDot}
            title={events.length === 0 ? 'No events yet' : 'No matching events'}
            body={
              events.length === 0
                ? 'The WebSocket bridge is connected to live events when the backend is running.'
                : 'Adjust the event search or filter to widen the table.'
            }
          />
        ) : (
          visibleEvents.map((event) => (
            <div key={event.id} className="table-row">
              <code>{formatClockTime(event.timestamp)}</code>
              <span className={`event-sev ${event.type}`} />
              <code>{event.type.toUpperCase()}</code>
              <code>{stringifyPayload(event.data)}</code>
              <code>{event.id}</code>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Footer({
  sessionId,
  bobcoinBudget,
  startedAt,
}: {
  sessionId: string | null;
  bobcoinBudget: { total: number; spent: number; projected: number };
  startedAt: Date | null;
}) {
  return (
    <footer className="carbon-footer">
      <div>
        <div className="t-label-01">PRODUCT</div>
        <div className="t-h-04">OnboardOps</div>
        <p>The 10-minute repo whisperer.</p>
      </div>
      <div>
        <div className="t-label-01">RUNTIME</div>
        <code>IBM Bob IDE</code>
        <code>MCP / 127.0.0.1:8765</code>
        <code>Dashboard / localhost:3000</code>
      </div>
      <div>
        <div className="t-label-01">SESSION</div>
        <code>id / {sessionId || 'waiting'}</code>
        <code>started / {formatClockTime(startedAt)}</code>
        <code>
          bobcoins / {bobcoinBudget.spent} spent / {bobcoinBudget.total} total
        </code>
      </div>
      <div>
        <div className="t-label-01">FOR THE RECORD</div>
        <div className="t-h-04">IBM Bob Hackathon</div>
        <p>Live dashboard wired to session events, grading, and starter issues.</p>
      </div>
    </footer>
  );
}

function Dashboard() {
  const [activeAnalysisTab, setActiveAnalysisTab] =
    useState<AnalysisTabId>('entry');
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
  const bobcoinBudget = useEventsStore((state) => state.bobcoinBudget);
  const { currentEvent, showRecovery, dismissRecovery } = useAutoRecovery();

  const sessionStartEvent = events.find((event) => event.type === 'session_start');
  const sessionEndEvent = events.find((event) => event.type === 'session_end');
  const currentSessionId = useMemo(() => {
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
  }, [events, sessionStartEvent?.data.session_id]);
  const dependencyCard = findCard(events, 'dependency_graph');
  const entryCard = findCard(events, 'entry_points');
  const hotspotCard = findCard(events, 'hotspots');
  const conventionCard = findCard(events, 'conventions');
  const graphData = graphDataFromCard(dependencyCard);
  const entryPointsData = entryPointsDataFromCard(entryCard);
  const hotspotsData = hotspotsDataFromCard(hotspotCard);
  const conventionsData = conventionsDataFromCard(conventionCard);
  const sessionMeta = useMemo(
    () =>
      deriveSessionMeta({
        events,
        starterRepository: starterIssuesState.repository,
        entryPointsData,
      }),
    [entryPointsData, events, starterIssuesState.repository]
  );
  const starterSuggestion = useMemo(
    () => buildStarterSuggestion(events),
    [events]
  );
  const starterSuggestionUrl = getStarterSuggestionUrl(
    starterSuggestion,
    sessionMeta.repositoryUrl,
    sessionMeta.branch
  );
  const heroPrefix = sessionMeta.onboardeeName || sessionMeta.repositoryOwner;

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

  const loadStarterIssues = useCallback(
    async (force = false) => {
      if (!force && starterIssuesState.isLoading) return;
      const requestedRepository =
        sessionMeta.repositoryReference ||
        sessionMeta.repositoryUrl ||
        sessionMeta.repositoryDisplay;

      setStarterIssuesState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const result = await fetchStarterIssueCandidates(
          MCP_HTTP_URL,
          requestedRepository
        );
        setStarterIssuesState({
          isLoading: false,
          hasLoaded: true,
          error: null,
          repository: result.repository || requestedRepository,
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
    },
    [
      sessionMeta.repositoryDisplay,
      sessionMeta.repositoryReference,
      sessionMeta.repositoryUrl,
      starterIssuesState.isLoading,
    ]
  );

  const loadedStarterRepository = starterIssuesState.repository
    ? getRepositoryName(starterIssuesState.repository)
    : null;

  useEffect(() => {
    if (connectionState !== 'connected' || starterIssuesState.isLoading) return;
    if (
      starterIssuesState.hasLoaded &&
      loadedStarterRepository === sessionMeta.repositoryDisplay
    ) {
      return;
    }

    void loadStarterIssues();
  }, [
    connectionState,
    loadedStarterRepository,
    loadStarterIssues,
    sessionMeta.repositoryDisplay,
    starterIssuesState.hasLoaded,
    starterIssuesState.isLoading,
  ]);

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
  const completedSteps = displayCartographySteps.filter(
    (step) => step.status === 'complete'
  ).length;
  const entryPointCount = countEntryPoints(entryPointsData);
  const hotspotCount = hotspotsData?.files.length || 0;
  const conventionCount = conventionsData?.conventions.length || 0;
  const passCount = certificationQuestions.filter(
    (question) => question.grade === 'pass'
  ).length;
  const latestPrUrl =
    typeof sessionEndEvent?.data.pr_url === 'string'
      ? (sessionEndEvent.data.pr_url as string)
      : undefined;
  const starterProgressCopy = latestPrUrl
    ? 'a starter PR is open'
    : starterSuggestion
      ? '1 Bob-suggested starter task is ready'
      : starterIssuesState.issues.length > 0
        ? `${starterIssuesState.issues.length} starter issue candidates are loaded`
        : '0 starter issue candidates are loaded';
  const startedAt =
    session.startTime ||
    (sessionStartEvent ? new Date(sessionStartEvent.timestamp) : null);
  const endedAt = sessionEndEvent ? new Date(sessionEndEvent.timestamp) : session.endTime;
  const sessionRunning =
    session.isActive || Boolean(currentSessionId && !sessionEndEvent);
  const elapsedSeconds = useElapsedSeconds(startedAt, endedAt, sessionRunning);
  const journalEntries = useMemo(() => buildJournalEntries(events), [events]);
  const isIdle = !sessionRunning && events.length === 0;
  const availableAnalysisCount = [
    entryPointsData,
    hotspotsData,
    conventionsData,
  ].filter(Boolean).length;
  const analysisTabs = useMemo<AnalysisTabConfig[]>(
    () => [
      {
        id: 'entry',
        label: 'Entry points',
        caption: `${entryPointCount} surfaces`,
        icon: Globe2,
        isAvailable: Boolean(entryCard || entryPointsData),
      },
      {
        id: 'hotspot',
        label: 'Change hotspots',
        caption: `${hotspotCount} files`,
        icon: Flame,
        isAvailable: Boolean(hotspotCard || hotspotsData),
      },
      {
        id: 'convention',
        label: 'Project conventions',
        caption: `${conventionCount} patterns`,
        icon: BookOpen,
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

  useEffect(() => {
    const activeTab = analysisTabs.find((tab) => tab.id === activeAnalysisTab);
    if (activeTab?.isAvailable || availableAnalysisCount === 0) return;

    const nextAvailable = analysisTabs.find((tab) => tab.isAvailable);
    if (nextAvailable) setActiveAnalysisTab(nextAvailable.id);
  }, [activeAnalysisTab, analysisTabs, availableAnalysisCount]);

  const handleExportSession = useCallback(() => {
    downloadJson(`onboardops-session-${currentSessionId || 'latest'}.json`, {
      exported_at: new Date().toISOString(),
      session_id: currentSessionId,
      onboardee_name: sessionMeta.onboardeeName,
      repository: sessionMeta.repositoryDisplay,
      repository_reference: sessionMeta.repositoryReference,
      repository_url: sessionMeta.repositoryUrl,
      repository_branch: sessionMeta.branch,
      repository_commit: sessionMeta.commit,
      bobcoin_budget: bobcoinBudget,
      cartography_steps: displayCartographySteps,
      certification_questions: certificationQuestions,
      starter_issues: starterIssuesState.issues,
      starter_suggestion: starterSuggestion,
      events: [...events].reverse(),
    });
  }, [
    bobcoinBudget,
    certificationQuestions,
    currentSessionId,
    displayCartographySteps,
    events,
    sessionMeta,
    starterIssuesState.issues,
    starterSuggestion,
  ]);

  return (
    <div className="carbon-root theme-g100">
      <AutoRecoveryBanner event={currentEvent} onDismiss={dismissRecovery} />
      <ShellHeader sessionId={currentSessionId} onExport={handleExportSession} />
      <ConnectionBanner connectionState={connectionState} />

      <main className="carbon-page">
        <section className="hero-section">
          <div className="hero-top">
            <div>
              <div className="t-label-01">ONBOARDING SESSION / LIVE</div>
              <h1 className="t-h-07">
                {heroPrefix ? <span>{heroPrefix} /</span> : null}{' '}
                {sessionMeta.repositoryName}
              </h1>
              <p className="t-body-02">
                The 10-minute repo whisperer.{' '}
                <span className="mono">
                  {sessionMeta.branch} / {events.length} live events /{' '}
                  {sessionMeta.commit?.slice(0, 12) ||
                    currentSessionId ||
                    'waiting for session'}
                </span>
              </p>
            </div>
            <div className="hero-status">
              <div className={`bridge-pill ${isConnected ? 'online' : 'offline'}`}>
                {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                {isConnected ? 'BRIDGE ONLINE' : 'BRIDGE OFFLINE'}
              </div>
              <div className="t-label-01">
                Onboardee / <span>{sessionMeta.onboardeeName || 'waiting'}</span>
              </div>
              <div className="t-label-01">
                Repository / <span>{sessionMeta.repositoryDisplay}</span>
              </div>
              <div className="t-label-01">
                Session / <span>{isIdle ? 'idle' : sessionRunning ? 'running' : 'complete'}</span>
              </div>
              <div className="t-code-01 muted">
                started {formatClockTime(startedAt)} / ws://127.0.0.1:8765
              </div>
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-clock">
              <StopwatchHero
                elapsedSeconds={elapsedSeconds}
                startedAt={startedAt}
                isRunning={sessionRunning}
              />
              <ProgressLine elapsedSeconds={elapsedSeconds} />
            </div>
            <div className="hero-brief">
              <div>
                <div className="t-label-01">EXPEDITION STATUS</div>
                <div className="tag-row">
                  <CarbonTag tone={passCount >= 2 ? 'green' : 'yellow'}>
                    <ShieldCheck size={14} />
                    {passCount >= 2 ? 'Certified' : `${passCount}/3 passed`}
                  </CarbonTag>
                  <CarbonTag tone="cyan">
                    <Zap size={14} />
                    {completedSteps} of 4 plates
                  </CarbonTag>
                  <CarbonTag tone={latestPrUrl ? 'blue' : 'neutral'}>
                    <GitBranch size={14} />
                    {latestPrUrl ? 'PR opened' : 'PR pending'}
                  </CarbonTag>
                </div>
                <p>
                  {isIdle
                    ? 'Start a Bob onboarding session to populate cartography, questions, starter issues, and telemetry.'
                    : `${completedSteps} cartography plates are complete, ${passCount} certification answers have passed, and ${starterProgressCopy}.`}
                </p>
              </div>
              <div className="hero-actions">
                {latestPrUrl ? (
                  <a href={latestPrUrl} target="_blank" rel="noreferrer" className="carbon-btn">
                    Open starter PR
                    <ExternalLink size={16} />
                  </a>
                ) : starterSuggestionUrl ? (
                  <a
                    href={starterSuggestionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="carbon-btn"
                  >
                    Open suggested task
                    <ExternalLink size={16} />
                  </a>
                ) : starterIssuesState.issues[0] ? (
                  <a
                    href={starterIssuesState.issues[0].url}
                    target="_blank"
                    rel="noreferrer"
                    className="carbon-btn"
                  >
                    Open top issue
                    <ExternalLink size={16} />
                  </a>
                ) : (
                  <button
                    type="button"
                    className="carbon-btn"
                    onClick={() => void loadStarterIssues(true)}
                  >
                    Load issues
                    <RefreshCw size={16} />
                  </button>
                )}
                <button type="button" onClick={handleExportSession} className="carbon-btn secondary">
                  Export session
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="metric-grid">
            <CarbonMetricTile
              icon={TimerReset}
              label="Time target"
              value={formatElapsed(elapsedSeconds)}
              detail="Goal: first PR in under ten minutes."
              status={elapsedSeconds <= TARGET_SECONDS ? 'On pace' : 'Over'}
              tone="blue"
            />
            <CarbonMetricTile
              icon={Activity}
              label="Cartography"
              value={`${completedSteps} / 4`}
              detail="Dependency graph, entry points, hotspots, conventions."
              status={completedSteps === 4 ? 'Complete' : 'Live'}
              tone="cyan"
            />
            <CarbonMetricTile
              icon={ShieldCheck}
              label="Certification"
              value={`${passCount} / 3`}
              detail="Two passes unlock the starter PR workflow."
              status={passCount >= 2 ? 'Passed' : 'Open'}
              tone="green"
            />
            <CarbonMetricTile
              icon={GitPullRequest}
              label="Starter PR"
              value={
                latestPrUrl
                  ? 'Opened'
                  : starterSuggestion
                    ? 'Suggested'
                    : starterIssuesState.issues.length
                      ? `${starterIssuesState.issues.length} issues`
                      : 'Pending'
              }
              detail="Uses issue candidates, Bob's suggested task, and session_end PR URLs."
              status={latestPrUrl || starterSuggestion ? 'Ready' : 'Waiting'}
              tone="magenta"
            />
          </div>

          <div className="route-panel">
            <div className="row between baseline">
              <div className="t-label-01">
                EXPEDITION ROUTE / STAGE {String(completedSteps).padStart(2, '0')} OF 04
              </div>
              <div className="t-code-01 muted">
                elapsed {formatElapsed(elapsedSeconds)} / 10:00
              </div>
            </div>
            <StageRail
              stages={displayCartographySteps.map((step) => ({
                id: step.id,
                label: step.label,
                status: step.status,
                kind:
                  step.id === 'graph'
                    ? `${graphData.nodes.length} modules`
                    : step.id === 'entry'
                      ? `${entryPointCount} surfaces`
                      : step.id === 'hotspot'
                        ? `${hotspotCount} files`
                        : `${conventionCount} patterns`,
              }))}
            />
          </div>
        </section>

        <Section
          eyebrow="II / ARCHITECTURE"
          title="The codebase, surveyed."
          sub="A directed graph of the highest-signal modules emitted by Bob's dependency graph card."
          right={
            <button type="button" className="carbon-btn secondary" onClick={handleExportSession}>
              <Code2 size={16} />
              Export raw data
            </button>
          }
        >
          <div className="main-grid">
            <ArchitectureCartograph data={graphData} />
            <BobJournal entries={journalEntries} isConnected={isConnected} />
          </div>
        </Section>

        <Section
          eyebrow="III / READING LENSES"
          title="Three views of the repository, in one place."
          sub="Entry points, change hotspots, and conventions are grouped into active tabs backed by live card data."
        >
          <ReadingLenses
            tabs={analysisTabs}
            activeTab={activeAnalysisTab}
            onTabChange={setActiveAnalysisTab}
            entryPointsData={entryPointsData}
            hotspotsData={hotspotsData}
            conventionsData={conventionsData}
            sessionMeta={sessionMeta}
          />
        </Section>

        <Section
          eyebrow="IV / CERTIFICATION"
          title="Three architecture questions, graded against the cartograph."
          sub="Answer directly from the dashboard; submissions go to the local grading endpoint for the active session."
        >
          <CertificationCarbon
            questions={certificationQuestions}
            currentSessionId={currentSessionId}
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
        </Section>

        <Section
          eyebrow="V / DEPARTURE"
          title="Ship your first contribution."
          sub="Starter issue candidates and Bob's suggested fallback task come from the MCP backend. The PR link appears when Bob emits session_end.pr_url."
        >
          <StarterPRCarbon
            repository={starterIssuesState.repository || sessionMeta.repositoryDisplay}
            repositoryUrl={sessionMeta.repositoryUrl}
            branch={sessionMeta.branch}
            issues={starterIssuesState.issues}
            starterSuggestion={starterSuggestion}
            isLoading={starterIssuesState.isLoading}
            error={starterIssuesState.error}
            isUnlocked={passCount >= 2}
            prUrl={latestPrUrl}
            onRetry={() => {
              void loadStarterIssues(true);
            }}
          />
        </Section>

        <Section
          eyebrow="VI / TELEMETRY"
          title="Event log."
          sub="The full live timeline from the WebSocket bridge, with active search and type filtering."
        >
          <EventLog events={events} />
        </Section>

        <Footer
          sessionId={currentSessionId}
          bobcoinBudget={bobcoinBudget}
          startedAt={startedAt}
        />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#161616] text-[#c6c6c6]">
          Loading OnboardOps dashboard...
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  );
}
