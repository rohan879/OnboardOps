'use client';

import { motion } from 'framer-motion';
import { Flame, ExternalLink, User, GitPullRequest, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface Hotspot {
  path: string;
  commit_count: number;
  distinct_authors?: number;
  top_author?: string;
  last_pr_title?: string;
  last_pr_url?: string;
  rationale: string;
  commit_frequency?: number[]; // 12-bucket array for sparkline
}

export interface HotspotsData {
  files: Hotspot[];
}

interface HotspotsCardProps {
  data: HotspotsData;
  onHighlight?: (file: string) => void;
}

function Sparkline({ data, max }: { data: number[]; max: number }) {
  const width = 60;
  const height = 20;
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

function AuthorAvatar({ name }: { name: string }) {
  const initials = getInitials(name);

  return (
    <div className="w-6 h-6 rounded-full bg-ibm-blue-60 text-white text-xs font-semibold flex items-center justify-center">
      {initials}
    </div>
  );
}

function HotspotRow({ hotspot, rank, maxCommits, onHighlight }: { 
  hotspot: Hotspot; 
  rank: number; 
  maxCommits: number;
  onHighlight?: (file: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const barWidth = (hotspot.commit_count / maxCommits) * 100;
  
  // Default sparkline if not provided
  const sparklineData = hotspot.commit_frequency || Array(12).fill(hotspot.commit_count / 12);
  const sparklineMax = Math.max(...sparklineData);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="border-b border-ibm-gray-10 last:border-0"
    >
      <div
        className="flex items-center gap-3 p-3 hover:bg-ibm-gray-10/50 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Rank */}
        <div className="flex-shrink-0 w-6 text-center">
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
        <div className="flex-1 min-w-0">
          <code className="text-sm font-mono text-ibm-gray-100 truncate block font-semibold">
            {hotspot.path}
          </code>
        </div>

        {/* Commit count with bar */}
        <div className="flex-shrink-0 w-32">
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
              {hotspot.commit_count}
            </span>
          </div>
        </div>

        {/* Author avatar */}
        <div className="flex-shrink-0">
          {hotspot.top_author && (
            <AuthorAvatar name={hotspot.top_author} />
          )}
        </div>

        {/* Sparkline */}
        <div className="flex-shrink-0 w-16">
          <Sparkline data={sparklineData} max={sparklineMax} />
        </div>

        {/* External link */}
        <div className="flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHighlight?.(hotspot.path);
            }}
            className="text-ibm-gray-50 hover:text-ibm-blue-60 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
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
            {hotspot.last_pr_title && (
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

export function HotspotsCard({ data, onHighlight }: HotspotsCardProps) {
  const files = useMemo(() => data.files || [], [data.files]);
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

      {/* Table header */}
      <div className="flex items-center gap-3 px-3 py-2 bg-ibm-gray-10/30 rounded-t-lg text-xs font-semibold text-ibm-gray-70 uppercase tracking-wide">
        <div className="w-6">#</div>
        <div className="flex-1">File Path</div>
        <div className="w-32">Commits</div>
        <div className="w-6">Author</div>
        <div className="w-16">Trend</div>
        <div className="w-4"></div>
      </div>

      {/* Hotspot rows */}
      <div className="border border-ibm-gray-10 rounded-b-lg overflow-hidden">
        {files.map((hotspot, index) => (
          <HotspotRow
            key={hotspot.path}
            hotspot={hotspot}
            rank={index + 1}
            maxCommits={maxCommits}
            onHighlight={onHighlight}
          />
        ))}
      </div>
    </div>
  );
}

// Made with Bob
