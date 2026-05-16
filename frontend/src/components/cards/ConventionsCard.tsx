'use client';

import { motion } from 'framer-motion';
import { BookOpen, Code, FileCode, CheckCircle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface Convention {
  name: string;
  pattern: string;
  evidence: {
    file: string;
    example?: string;
    line_number?: number;
  };
  consistency?: 'consistent' | 'mixed';
}

export interface ConventionsData {
  conventions: Convention[];
}

interface ConventionsCardProps {
  data: ConventionsData;
  onHighlight?: (file: string) => void;
}

function ConventionItem({ convention, index, onHighlight }: { 
  convention: Convention; 
  index: number;
  onHighlight?: (file: string) => void;
}) {
  const isConsistent = convention.consistency === 'consistent';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-ibm-gray-10 rounded-lg overflow-hidden hover:border-ibm-blue-60/30 transition-colors"
    >
      {/* Convention header */}
      <div className="bg-ibm-gray-10/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-ibm-green-50 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-ibm-gray-100">
              {convention.name}
            </h4>
            <p className="text-xs text-ibm-gray-70 mt-0.5">
              {convention.pattern}
            </p>
          </div>
        </div>
        {isConsistent && (
          <div className="flex items-center gap-1.5 text-xs text-ibm-green-50 bg-ibm-green-50/10 px-2 py-1 rounded">
            <CheckCircle className="w-3 h-3" />
            <span className="font-medium">Consistent</span>
          </div>
        )}
      </div>

      {/* Evidence section */}
      <div className="p-4 space-y-3">
        {/* File reference */}
        <div className="flex items-center gap-2 text-xs text-ibm-gray-70">
          <FileCode className="w-3 h-3" />
          <button
            onClick={() => onHighlight?.(convention.evidence.file)}
            className="font-mono hover:text-ibm-blue-60 transition-colors truncate"
          >
            {convention.evidence.file}
          </button>
          {convention.evidence.line_number && (
            <span className="text-ibm-gray-50">
              :{convention.evidence.line_number}
            </span>
          )}
        </div>

        {/* Code example */}
        {convention.evidence.example && (
          <div className="rounded-lg overflow-hidden border border-ibm-gray-10">
            <SyntaxHighlighter
              language="python"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '12px',
                fontSize: '12px',
                lineHeight: '1.5',
                background: '#1e1e1e',
              }}
              showLineNumbers={false}
            >
              {convention.evidence.example.trim()}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ConventionsCard({ data, onHighlight }: ConventionsCardProps) {
  const conventions = data.conventions || [];

  if (conventions.length === 0) {
    return (
      <div className="text-center py-8 text-ibm-gray-70 text-sm">
        No conventions discovered
      </div>
    );
  }

  const consistentCount = conventions.filter(c => c.consistency === 'consistent').length;
  const mixedCount = conventions.length - consistentCount;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-ibm-gray-70">
        <div className="flex items-center gap-1.5">
          <Code className="w-4 h-4 text-ibm-green-50" />
          <span>
            <strong>{conventions.length}</strong> {conventions.length === 1 ? 'convention' : 'conventions'} identified
          </span>
        </div>
        {consistentCount > 0 && (
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-ibm-green-50" />
            <span>
              <strong>{consistentCount}</strong> consistent
            </span>
          </div>
        )}
        {mixedCount > 0 && (
          <div className="text-xs text-ibm-orange-40">
            {mixedCount} mixed
          </div>
        )}
      </div>

      {/* Convention cards */}
      <div className="space-y-3">
        {conventions.map((convention, index) => (
          <ConventionItem
            key={`${convention.name}-${index}`}
            convention={convention}
            index={index}
            onHighlight={onHighlight}
          />
        ))}
      </div>

      {/* Footer note */}
      <div className="text-xs text-ibm-gray-70 italic text-center pt-2 border-t border-ibm-gray-10">
        Conventions inferred from representative files in the codebase
      </div>
    </div>
  );
}

// Made with Bob