'use client';

import { motion } from 'framer-motion';
import { Globe, Terminal, Clock, Zap, ExternalLink } from 'lucide-react';

export interface EntryPoint {
  type: 'http' | 'cli' | 'job' | 'consumer';
  name: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path?: string;
  handler?: string;
  file: string;
  schedule?: string;
  topic?: string;
  entry_point?: string;
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
};

function HTTPRouteItem({ route, onHighlight }: { route: EntryPoint; onHighlight?: (file: string) => void }) {
  const colorClass = methodColors[route.method || 'GET'];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-ibm-gray-10/50 transition-colors cursor-pointer group"
      onClick={() => onHighlight?.(route.file)}
    >
      <Globe className="w-4 h-4 text-ibm-blue-60 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${colorClass}`}>
            {route.method}
          </span>
          <code className="text-sm font-mono text-ibm-gray-100 truncate">
            {route.path}
          </code>
        </div>
        <div className="text-xs text-ibm-gray-70">
          <span className="font-medium">{route.handler}</span>
          <span className="mx-1">·</span>
          <span className="opacity-75">{route.file}</span>
        </div>
      </div>
      <ExternalLink className="w-3 h-3 text-ibm-gray-50 group-hover:text-ibm-blue-60 transition-colors flex-shrink-0 mt-1" />
    </motion.div>
  );
}

function CLIItem({ cli, onHighlight }: { cli: EntryPoint; onHighlight?: (file: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-ibm-gray-10/50 transition-colors cursor-pointer group"
      onClick={() => onHighlight?.(cli.file)}
    >
      <Terminal className="w-4 h-4 text-ibm-purple-50 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <code className="text-sm font-mono text-ibm-gray-100 font-semibold block mb-1">
          {cli.name}
        </code>
        <div className="text-xs text-ibm-gray-70">
          <span className="font-medium">{cli.entry_point}</span>
          <span className="mx-1">·</span>
          <span className="opacity-75">{cli.file}</span>
        </div>
      </div>
      <ExternalLink className="w-3 h-3 text-ibm-gray-50 group-hover:text-ibm-purple-50 transition-colors flex-shrink-0 mt-1" />
    </motion.div>
  );
}

function JobItem({ job, onHighlight }: { job: EntryPoint; onHighlight?: (file: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-ibm-gray-10/50 transition-colors cursor-pointer group"
      onClick={() => onHighlight?.(job.file)}
    >
      <Clock className="w-4 h-4 text-ibm-orange-40 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-ibm-gray-100">{job.name}</span>
          {job.schedule && (
            <span className="text-xs text-ibm-gray-70 bg-ibm-gray-10 px-2 py-0.5 rounded font-mono">
              {job.schedule}
            </span>
          )}
        </div>
        <div className="text-xs text-ibm-gray-70 opacity-75">
          {job.file}
        </div>
      </div>
      <ExternalLink className="w-3 h-3 text-ibm-gray-50 group-hover:text-ibm-orange-40 transition-colors flex-shrink-0 mt-1" />
    </motion.div>
  );
}

function ConsumerItem({ consumer, onHighlight }: { consumer: EntryPoint; onHighlight?: (file: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-ibm-gray-10/50 transition-colors cursor-pointer group"
      onClick={() => onHighlight?.(consumer.file)}
    >
      <Zap className="w-4 h-4 text-ibm-teal-50 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-ibm-gray-100">{consumer.name}</span>
          {consumer.topic && (
            <span className="text-xs text-ibm-gray-70 bg-ibm-gray-10 px-2 py-0.5 rounded font-mono">
              {consumer.topic}
            </span>
          )}
        </div>
        <div className="text-xs text-ibm-gray-70">
          <span className="font-medium">{consumer.handler}</span>
          <span className="mx-1">·</span>
          <span className="opacity-75">{consumer.file}</span>
        </div>
      </div>
      <ExternalLink className="w-3 h-3 text-ibm-gray-50 group-hover:text-ibm-teal-50 transition-colors flex-shrink-0 mt-1" />
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
      <div className="text-center py-8 text-ibm-gray-70 text-sm">
        No entry points discovered
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-ibm-gray-70">
        {routes.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-ibm-blue-60" />
            <span><strong>{routes.length}</strong> HTTP {routes.length === 1 ? 'route' : 'routes'}</span>
          </div>
        )}
        {cli.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-ibm-purple-50" />
            <span><strong>{cli.length}</strong> CLI {cli.length === 1 ? 'command' : 'commands'}</span>
          </div>
        )}
        {jobs.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-ibm-orange-40" />
            <span><strong>{jobs.length}</strong> {jobs.length === 1 ? 'job' : 'jobs'}</span>
          </div>
        )}
        {consumers.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-ibm-teal-50" />
            <span><strong>{consumers.length}</strong> {consumers.length === 1 ? 'consumer' : 'consumers'}</span>
          </div>
        )}
      </div>

      {/* HTTP Routes */}
      {routes.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-ibm-gray-100 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-ibm-blue-60" />
            HTTP Routes
          </h4>
          <div className="space-y-1">
            {routes.map((route, index) => (
              <HTTPRouteItem key={index} route={route} onHighlight={onHighlight} />
            ))}
          </div>
        </div>
      )}

      {/* CLI Entry Points */}
      {cli.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-ibm-gray-100 mb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-ibm-purple-50" />
            CLI Commands
          </h4>
          <div className="space-y-1">
            {cli.map((command, index) => (
              <CLIItem key={index} cli={command} onHighlight={onHighlight} />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Jobs */}
      {jobs.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-ibm-gray-100 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-ibm-orange-40" />
            Scheduled Jobs
          </h4>
          <div className="space-y-1">
            {jobs.map((job, index) => (
              <JobItem key={index} job={job} onHighlight={onHighlight} />
            ))}
          </div>
        </div>
      )}

      {/* Message Consumers */}
      {consumers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-ibm-gray-100 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-ibm-teal-50" />
            Message Consumers
          </h4>
          <div className="space-y-1">
            {consumers.map((consumer, index) => (
              <ConsumerItem key={index} consumer={consumer} onHighlight={onHighlight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Made with Bob