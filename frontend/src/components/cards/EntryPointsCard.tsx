'use client';

import { motion } from 'framer-motion';
import { Clock, ExternalLink, Globe, Terminal, Zap } from 'lucide-react';

const REPOSITORY_URL =
  process.env.NEXT_PUBLIC_REPOSITORY_URL || '';
const REPOSITORY_BRANCH = process.env.NEXT_PUBLIC_REPOSITORY_BRANCH || 'main';

export interface EntryPoint {
  type: 'http' | 'cli' | 'job' | 'consumer' | 'websocket';
  name: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS' | 'WEBSOCKET';
  path?: string;
  handler?: string;
  file: string;
  schedule?: string;
  topic?: string;
  entry_point?: string;
  line_number?: number;
  url?: string;
  file_url?: string;
  github_url?: string;
}

export interface EntryPointsData {
  routes?: EntryPoint[];
  cli?: EntryPoint[];
  jobs?: EntryPoint[];
  consumers?: EntryPoint[];
}

interface EntryPointsCardProps {
  data: EntryPointsData;
  onHighlight?: (file: string) => void;
}

const methodColors: Record<string, string> = {
  GET: 'text-green-600 bg-green-50 border-green-200',
  POST: 'text-blue-600 bg-blue-50 border-blue-200',
  PUT: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  DELETE: 'text-red-600 bg-red-50 border-red-200',
  PATCH: 'text-purple-600 bg-purple-50 border-purple-200',
  WS: 'text-ibm-gray-100 bg-white border-ibm-gray-100',
  WEBSOCKET: 'text-ibm-gray-100 bg-white border-ibm-gray-100',
};

function getRepositoryFileUrl(entry: EntryPoint) {
  const explicitUrl = entry.github_url || entry.file_url || entry.url;
  if (explicitUrl) return explicitUrl;
  if (!entry.file) return undefined;

  const normalizedBase = REPOSITORY_URL.replace(/\.git$/, '').replace(/\/$/, '');
  if (!/^https?:\/\//i.test(normalizedBase)) return undefined;

  const normalizedPath = entry.file.replace(/\\/g, '/').replace(/^\/+/, '');
  const lineSuffix = entry.line_number ? `#L${entry.line_number}` : '';

  return `${normalizedBase}/blob/${REPOSITORY_BRANCH}/${encodeURI(normalizedPath)}${lineSuffix}`;
}

function FileLink({
  entry,
  colorClass = 'hover:text-ibm-blue-60',
}: {
  entry: EntryPoint;
  colorClass?: string;
}) {
  const href = getRepositoryFileUrl(entry);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      aria-label={`Open ${entry.file} on GitHub`}
      className={`text-ibm-gray-50 transition-colors ${colorClass}`}
    >
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function FilePath({
  entry,
  className = '',
}: {
  entry: EntryPoint;
  className?: string;
}) {
  const href = getRepositoryFileUrl(entry);
  if (!href) return <span className={className}>{entry.file}</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      className={`hover:text-ibm-blue-60 hover:underline ${className}`}
    >
      {entry.file}
    </a>
  );
}

function HTTPRouteItem({
  route,
  onHighlight,
}: {
  route: EntryPoint;
  onHighlight?: (file: string) => void;
}) {
  const method = route.method || 'GET';
  const colorClass = methodColors[method] || methodColors.GET;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-ibm-gray-10/50"
      onClick={() => onHighlight?.(route.file)}
    >
      <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-ibm-blue-60" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${colorClass}`}>
            {method === 'WEBSOCKET' ? 'WS' : method}
          </span>
          <code className="truncate font-mono text-sm text-ibm-gray-100">
            {route.path}
          </code>
        </div>
        <div className="text-xs text-ibm-gray-70">
          <span className="font-medium">{route.handler}</span>
          <span className="mx-1">-</span>
          <FilePath entry={route} className="opacity-75" />
        </div>
      </div>
      <FileLink entry={route} />
    </motion.div>
  );
}

function CLIItem({
  cli,
  onHighlight,
}: {
  cli: EntryPoint;
  onHighlight?: (file: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-ibm-gray-10/50"
      onClick={() => onHighlight?.(cli.file)}
    >
      <Terminal className="mt-0.5 h-4 w-4 flex-shrink-0 text-ibm-purple-50" />
      <div className="min-w-0 flex-1">
        <code className="mb-1 block font-mono text-sm font-semibold text-ibm-gray-100">
          {cli.name}
        </code>
        <div className="text-xs text-ibm-gray-70">
          <span className="font-medium">{cli.entry_point}</span>
          <span className="mx-1">-</span>
          <FilePath entry={cli} className="opacity-75" />
        </div>
      </div>
      <FileLink entry={cli} colorClass="hover:text-ibm-purple-50" />
    </motion.div>
  );
}

function JobItem({
  job,
  onHighlight,
}: {
  job: EntryPoint;
  onHighlight?: (file: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-ibm-gray-10/50"
      onClick={() => onHighlight?.(job.file)}
    >
      <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-ibm-orange-40" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-ibm-gray-100">{job.name}</span>
          {job.schedule && (
            <span className="rounded bg-ibm-gray-10 px-2 py-0.5 font-mono text-xs text-ibm-gray-70">
              {job.schedule}
            </span>
          )}
        </div>
        <div className="text-xs text-ibm-gray-70">
          <FilePath entry={job} className="opacity-75" />
        </div>
      </div>
      <FileLink entry={job} colorClass="hover:text-ibm-orange-40" />
    </motion.div>
  );
}

function ConsumerItem({
  consumer,
  onHighlight,
}: {
  consumer: EntryPoint;
  onHighlight?: (file: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-ibm-gray-10/50"
      onClick={() => onHighlight?.(consumer.file)}
    >
      <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-ibm-teal-50" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-ibm-gray-100">
            {consumer.name}
          </span>
          {consumer.topic && (
            <span className="rounded bg-ibm-gray-10 px-2 py-0.5 font-mono text-xs text-ibm-gray-70">
              {consumer.topic}
            </span>
          )}
        </div>
        <div className="text-xs text-ibm-gray-70">
          <span className="font-medium">{consumer.handler}</span>
          <span className="mx-1">-</span>
          <FilePath entry={consumer} className="opacity-75" />
        </div>
      </div>
      <FileLink entry={consumer} colorClass="hover:text-ibm-teal-50" />
    </motion.div>
  );
}

export function EntryPointsCard({ data, onHighlight }: EntryPointsCardProps) {
  const routes = data.routes || [];
  const cli = data.cli || [];
  const jobs = data.jobs || [];
  const consumers = data.consumers || [];
  const totalCount = routes.length + cli.length + jobs.length + consumers.length;

  if (totalCount === 0) {
    return (
      <div className="py-8 text-center text-sm text-ibm-gray-70">
        No entry points discovered
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 text-sm text-ibm-gray-70">
        {routes.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-ibm-blue-60" />
            <span>
              <strong>{routes.length}</strong> HTTP{' '}
              {routes.length === 1 ? 'route' : 'routes'}
            </span>
          </div>
        )}
        {cli.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Terminal className="h-4 w-4 text-ibm-purple-50" />
            <span>
              <strong>{cli.length}</strong> CLI{' '}
              {cli.length === 1 ? 'command' : 'commands'}
            </span>
          </div>
        )}
        {jobs.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-ibm-orange-40" />
            <span>
              <strong>{jobs.length}</strong> {jobs.length === 1 ? 'job' : 'jobs'}
            </span>
          </div>
        )}
        {consumers.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-ibm-teal-50" />
            <span>
              <strong>{consumers.length}</strong>{' '}
              {consumers.length === 1 ? 'consumer' : 'consumers'}
            </span>
          </div>
        )}
      </div>

      {routes.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ibm-gray-100">
            <Globe className="h-4 w-4 text-ibm-blue-60" />
            HTTP Routes
          </h4>
          <div className="space-y-1">
            {routes.map((route, index) => (
              <HTTPRouteItem key={index} route={route} onHighlight={onHighlight} />
            ))}
          </div>
        </div>
      )}

      {cli.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ibm-gray-100">
            <Terminal className="h-4 w-4 text-ibm-purple-50" />
            CLI Commands
          </h4>
          <div className="space-y-1">
            {cli.map((command, index) => (
              <CLIItem key={index} cli={command} onHighlight={onHighlight} />
            ))}
          </div>
        </div>
      )}

      {jobs.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ibm-gray-100">
            <Clock className="h-4 w-4 text-ibm-orange-40" />
            Scheduled Jobs
          </h4>
          <div className="space-y-1">
            {jobs.map((job, index) => (
              <JobItem key={index} job={job} onHighlight={onHighlight} />
            ))}
          </div>
        </div>
      )}

      {consumers.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ibm-gray-100">
            <Zap className="h-4 w-4 text-ibm-teal-50" />
            Message Consumers
          </h4>
          <div className="space-y-1">
            {consumers.map((consumer, index) => (
              <ConsumerItem
                key={index}
                consumer={consumer}
                onHighlight={onHighlight}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
