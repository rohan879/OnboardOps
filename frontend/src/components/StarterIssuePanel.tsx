'use client';

import { motion } from 'framer-motion';
import { ExternalLink, GitPullRequest, RefreshCw, Tag } from 'lucide-react';

export interface StarterIssue {
  issueNumber: number;
  title: string;
  url: string;
  labels: string[];
  state: string;
  updatedAt: string;
  bodyExcerpt?: string | null;
}

interface StarterIssuePanelProps {
  repository?: string | null;
  issues: StarterIssue[];
  isLoading?: boolean;
  error?: string | null;
  isUnlocked?: boolean;
  prUrl?: string;
  onRetry?: () => void;
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Updated recently';

  return `Updated ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`;
}

function EmptyState({
  isUnlocked,
  error,
  onRetry,
}: {
  isUnlocked: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (error) {
    return (
      <div className="rounded-2xl border border-ibm-red-50/20 bg-ibm-red-50/5 p-4">
        <div className="text-sm font-semibold text-ibm-red-50">
          Could not load starter issues
        </div>
        <p className="mt-1 text-sm text-ibm-gray-70">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-ibm-gray-30 px-3 py-1.5 text-sm font-semibold text-ibm-gray-100 transition hover:border-ibm-blue-60 hover:text-ibm-blue-60"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-ibm-gray-30 bg-ibm-gray-10/40 p-5 text-sm text-ibm-gray-70">
      {isUnlocked
        ? 'No open starter issues were found right now. Bob can still fall back to a small starter task.'
        : 'Starter issue suggestions will appear here so the onboarder can see likely first-PR options while finishing certification.'}
    </div>
  );
}

export function StarterIssuePanel({
  repository,
  issues,
  isLoading = false,
  error = null,
  isUnlocked = false,
  prUrl,
  onRetry,
}: StarterIssuePanelProps) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-ibm-gray-20 bg-white shadow-[0_18px_48px_rgba(22,22,22,0.06)]">
      <div className="border-b border-ibm-gray-10 bg-[linear-gradient(135deg,rgba(15,98,254,0.08),rgba(36,161,72,0.05))] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-ibm-gray-100">
              <GitPullRequest className="h-4 w-4 text-ibm-blue-60" />
              Starter PR Candidates
            </div>
            <p className="mt-1 text-sm text-ibm-gray-70">
              {repository
                ? `Relevant open issues from ${repository}`
                : 'Relevant open issues Bob can use for the first pull request'}
            </p>
          </div>
          <div
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isUnlocked
                ? 'bg-ibm-green-50/10 text-ibm-green-50'
                : 'bg-ibm-gray-10 text-ibm-gray-70'
            }`}
          >
            {isUnlocked ? 'Ready after certification' : 'Preview mode'}
          </div>
        </div>

        {prUrl && (
          <a
            href={prUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ibm-blue-60 hover:underline"
          >
            Active starter PR
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className="space-y-4 px-5 py-5">
        {isLoading ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="rounded-2xl border border-ibm-gray-10 bg-ibm-gray-10/40 p-4"
              >
                <div className="h-4 w-20 rounded bg-ibm-gray-20" />
                <div className="mt-3 h-5 w-5/6 rounded bg-ibm-gray-20" />
                <div className="mt-2 h-4 w-full rounded bg-ibm-gray-10" />
                <div className="mt-1 h-4 w-4/5 rounded bg-ibm-gray-10" />
              </div>
            ))}
          </div>
        ) : issues.length === 0 || error ? (
          <EmptyState isUnlocked={isUnlocked} error={error} onRetry={onRetry} />
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {issues.map((issue, index) => (
              <motion.a
                key={issue.issueNumber}
                href={issue.url}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="group rounded-2xl border border-ibm-gray-20 bg-[linear-gradient(180deg,#ffffff,rgba(244,244,244,0.65))] p-4 transition hover:-translate-y-0.5 hover:border-ibm-blue-60/40 hover:shadow-[0_16px_32px_rgba(15,98,254,0.10)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-full bg-ibm-blue-60/10 px-2.5 py-1 text-xs font-semibold text-ibm-blue-60">
                    Issue #{issue.issueNumber}
                  </div>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 text-ibm-gray-50 transition group-hover:text-ibm-blue-60" />
                </div>

                <h4 className="mt-3 text-base font-semibold leading-snug text-ibm-gray-100">
                  {issue.title}
                </h4>

                {issue.bodyExcerpt && (
                  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-ibm-gray-70">
                    {issue.bodyExcerpt}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {issue.labels.slice(0, 4).map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 rounded-full bg-ibm-gray-10 px-2.5 py-1 text-xs font-medium text-ibm-gray-70"
                    >
                      <Tag className="h-3 w-3" />
                      {label}
                    </span>
                  ))}
                </div>

                <div className="mt-4 text-xs font-medium uppercase tracking-wide text-ibm-gray-50">
                  {formatUpdatedAt(issue.updatedAt)}
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
