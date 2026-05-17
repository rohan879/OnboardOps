'use client';

import { motion } from 'framer-motion';
import { Flame, ExternalLink, User, GitPullRequest, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';

const REPOSITORY_URL =
  process.env.NEXT_PUBLIC_REPOSITORY_URL || '';
const REPOSITORY_BRANCH = process.env.NEXT_PUBLIC_REPOSITORY_BRANCH || 'main';

export interface Hotspot {
  path: string;
  commit_count: number;
  distinct_authors?: number;
  top_author?: string;
  last_pr_title?: string;
  last_pr_url?: string;
  rationale: string;
  commit_frequency?: number[] | string; // Prefer 12-bucket array; tolerate labels from Bob.
}

export interface HotspotsData {
  files: Hotspot[];
}

interface HotspotsCardProps {
  data: HotspotsData;
}

function getRepositoryFileUrl(path: string) {
  if (!path || path === 'unknown') return undefined;

  const normalizedBase = REPOSITORY_URL.replace(/\.git$/, '').replace(/\/$/, '');
  if (!/^https?:\/\//i.test(normalizedBase)) return undefined;

  const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');

  return `${normalizedBase}/blob/${REPOSITORY_BRANCH}/${encodeURI(normalizedPath)}`;
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

function toFiniteNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function normalizeHotspot(value: Hotspot | Record<string, unknown>): Hotspot {
  const record = value as Record<string, unknown>;
  const commitCount = toFiniteNumber(
    record.commit_count ?? record.commits ?? record.changes,
    0
  );

  return {
    path: String(record.path ?? record.file_path ?? record.file ?? 'unknown'),
    commit_count: commitCount,
    distinct_authors: toFiniteNumber(record.distinct_authors, 0),
    top_author:
      typeof record.top_author === 'string' &&
      record.top_author.trim() &&
      record.top_author.toLowerCase() !== 'unknown'
        ? record.top_author
        : undefined,
    last_pr_title:
      typeof record.last_pr_title === 'string' && record.last_pr_title.trim()
        ? record.last_pr_title
        : undefined,
    last_pr_url:
      typeof record.last_pr_url === 'string' &&
      record.last_pr_url.trim() &&
      !record.last_pr_url.includes('github.com/example/repo')
        ? record.last_pr_url
        : undefined,
    rationale:
      typeof record.rationale === 'string' && record.rationale.trim()
        ? record.rationale
        : 'High commit activity indicates this file changes often.',
    commit_frequency: record.commit_frequency as Hotspot['commit_frequency'],
  };
}

function Sparkline({ data, max }: { data: number[]; max: number }) {
  const width = 60;
  const height = 20;
  if (data.length < 2 || max <= 0) {
    return (
      <svg width={width} height={height} className="inline-block">
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-ibm-gray-30"
        />
      </svg>
    );
  }

  const points = data.length;
  const stepX = width / (points - 1);
  
  const pathData = data
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / max) * height;
      return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <path
        d={pathData}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-ibm-blue-60"
      />
    </svg>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function AuthorCell({ name }: { name?: string }) {
  if (!name) {
    return <span className="text-sm text-ibm-gray-50">Unknown</span>;
  }

  const initials = getInitials(name);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ibm-blue-60 text-xs font-semibold text-white">
        {initials}
      </div>
      <span className="truncate text-sm font-medium text-ibm-gray-100" title={name}>
        {name}
      </span>
    </div>
  );
}

function HotspotRow({ hotspot, rank, maxCommits }: {
  hotspot: Hotspot; 
  rank: number; 
  maxCommits: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const commitCount = toFiniteNumber(hotspot.commit_count, 0);
  const barWidth = maxCommits > 0 ? (commitCount / maxCommits) * 100 : 0;
  const fileUrl = getRepositoryFileUrl(hotspot.path);
  const sparklineData = normalizeSparklineData(hotspot.commit_frequency);
  const sparklineMax = sparklineData ? Math.max(...sparklineData, 1) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="border-b border-ibm-gray-10 last:border-0"
    >
      <div
        className="grid grid-cols-[2rem_minmax(18rem,1fr)_12rem_14rem_5rem_2rem] items-center gap-4 p-3 hover:bg-ibm-gray-10/50 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Rank */}
        <div className="text-center">
          <span className={`text-sm font-bold ${
            rank === 1 ? 'text-ibm-red-50' :
            rank === 2 ? 'text-ibm-orange-40' :
            rank === 3 ? 'text-ibm-orange-40' :
            'text-ibm-gray-70'
          }`}>
            {rank}
          </span>
        </div>

        {/* File path */}
        <div className="min-w-0">
          <code className="text-sm font-mono text-ibm-gray-100 truncate block font-semibold">
            {hotspot.path}
          </code>
        </div>

        {/* Commit count with bar */}
        <div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-4 bg-ibm-gray-10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ duration: 0.5, delay: rank * 0.05 }}
                className="h-full bg-ibm-orange-40"
              />
            </div>
            <span className="text-sm font-semibold text-ibm-gray-100 w-8 text-right">
              {commitCount}
            </span>
          </div>
        </div>

        {/* Author */}
        <div className="min-w-0">
          <AuthorCell name={hotspot.top_author} />
        </div>

        {/* Sparkline */}
        <div>
          {sparklineData ? (
            <Sparkline data={sparklineData} max={sparklineMax} />
          ) : (
            <span className="text-xs text-ibm-gray-50">No buckets</span>
          )}
        </div>

        {/* External link */}
        <div>
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Open ${hotspot.path} on GitHub`}
              className="text-ibm-gray-50 hover:text-ibm-blue-60 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Expanded rationale */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-3 pb-3 pl-12"
        >
          <div className="bg-ibm-gray-10/50 rounded-lg p-3 space-y-2">
            <p className="text-sm text-ibm-gray-100">
              <strong>Why it changes:</strong> {hotspot.rationale}
            </p>
            {hotspot.last_pr_title && hotspot.last_pr_title !== 'unknown' && (
              <div className="flex items-start gap-2 text-xs text-ibm-gray-70">
                <GitPullRequest className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Last PR:</span>{' '}
                  {hotspot.last_pr_url ? (
                    <a
                      href={hotspot.last_pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ibm-blue-60 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {hotspot.last_pr_title}
                    </a>
                  ) : (
                    hotspot.last_pr_title
                  )}
                </div>
              </div>
            )}
            {hotspot.distinct_authors && (
              <div className="flex items-center gap-2 text-xs text-ibm-gray-70">
                <User className="w-3 h-3" />
                <span>
                  <strong>{hotspot.distinct_authors}</strong> {hotspot.distinct_authors === 1 ? 'contributor' : 'contributors'}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function HotspotsCard({ data }: HotspotsCardProps) {
  const files = useMemo(
    () => (Array.isArray(data.files) ? data.files.map(normalizeHotspot) : []),
    [data.files]
  );
  const maxCommits = useMemo(() => Math.max(...files.map(f => f.commit_count), 1), [files]);

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-ibm-gray-70 text-sm">
        No hotspots discovered
      </div>
    );
  }

  const totalCommits = files.reduce((sum, f) => sum + f.commit_count, 0);
  const topHotspot = files[0];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-ibm-gray-70">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-ibm-orange-40" />
          <span>
            <strong>{files.length}</strong> {files.length === 1 ? 'hotspot' : 'hotspots'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-ibm-blue-60" />
          <span>
            <strong>{totalCommits}</strong> total commits (180 days)
          </span>
        </div>
        {topHotspot && (
          <div className="text-xs">
            Top: <code className="font-mono font-semibold">{topHotspot.path.split('/').pop()}</code>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          {/* Table header */}
          <div className="grid grid-cols-[2rem_minmax(18rem,1fr)_12rem_14rem_5rem_2rem] items-center gap-4 rounded-t-lg bg-ibm-gray-10/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ibm-gray-70">
            <div>#</div>
            <div>File Path</div>
            <div>Commits</div>
            <div>Author</div>
            <div>Trend</div>
            <div></div>
          </div>

          {/* Hotspot rows */}
          <div className="overflow-hidden rounded-b-lg border border-ibm-gray-10">
            {files.map((hotspot, index) => (
              <HotspotRow
                key={hotspot.path}
                hotspot={hotspot}
                rank={index + 1}
                maxCommits={maxCommits}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
