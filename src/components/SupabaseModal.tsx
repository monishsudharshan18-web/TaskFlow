import React, { useEffect, useState } from 'react';
import { Check, Copy, Database, ExternalLink, RefreshCw, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api, SupabaseStatusResponse } from '../services/api';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [status, setStatus] = useState<SupabaseStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await api.getSupabaseStatus();
      setStatus(res);
    } catch (err: any) {
      setStatus({
        configured: false,
        success: false,
        message: err.message || 'Could not connect to backend server.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setSeedResult(null);
    }
  }, [isOpen]);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await api.seedData();
      setSeedResult(res.message);
      if (onDataChanged) onDataChanged();
      checkStatus();
    } catch (err: any) {
      setSeedResult(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleCopySchemaNotice = () => {
    setCopiedSchema(true);
    navigator.clipboard?.writeText(
      `-- See supabase/schema.sql in the project root for the complete schema.`
    );
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-xl overflow-hidden animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supabase-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 flex items-center justify-center text-[#10B981]">
              <Database className="w-5 h-5 text-[#059669]" />
            </div>
            <div>
              <h2 id="supabase-modal-title" className="text-base font-semibold text-[#0F172A]">
                Supabase & Backend Connection
              </h2>
              <p className="text-xs text-[#64748B]">PostgreSQL database & CRUD REST API</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status Box */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              status?.success
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                : status?.configured
                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]'
            }`}
          >
            {status?.success ? (
              <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
            ) : status?.configured ? (
              <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
            ) : (
              <Database className="w-5 h-5 text-[#64748B] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">
                  {status?.success
                    ? 'Connected to Supabase PostgreSQL'
                    : status?.configured
                    ? 'Connecting to Supabase...'
                    : 'Operating in Local In-Memory Mode'}
                </span>
                <button
                  type="button"
                  onClick={checkStatus}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#7C3AED] hover:underline"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {status?.message || 'Checking database connection status...'}
              </p>
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
              How to Connect Your Supabase Project
            </h3>
            <ol className="text-xs text-[#334155] space-y-2 list-decimal list-inside bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
              <li>
                Create a database project at{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#7C3AED] inline-flex items-center gap-0.5 hover:underline font-medium"
                >
                  supabase.com <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>
                In the Supabase SQL Editor, run{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1] text-[#0F172A] font-mono text-[11px]">
                  supabase/schema.sql
                </code>{' '}
                (tables, indexes & sample tasks)
              </li>
              <li>
                Add your <span className="font-semibold">SUPABASE_URL</span> &{' '}
                <span className="font-semibold">SUPABASE_ANON_KEY</span> to your{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1] text-[#0F172A] font-mono text-[11px]">
                  .env
                </code>{' '}
                file or deployment environment variables.
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="w-full sm:w-auto flex-1 h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] active:scale-[0.98] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Seeding Data...' : 'Seed Sample Data to Database'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopySchemaNotice}
              className="w-full sm:w-auto h-10 px-4 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#334155] text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedSchema ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Schema in supabase/schema.sql</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>View SQL Schema</span>
                </>
              )}
            </button>
          </div>

          {seedResult && (
            <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] rounded-lg text-xs">
              {seedResult}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#334155] text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
