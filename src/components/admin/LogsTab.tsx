import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, RefreshCw, Search, AlertTriangle, AlertCircle, CheckCircle2, Server, Laptop, Play, ChevronDown, ChevronUp, Clock, Info } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  source: 'server' | 'client';
  message: string;
  metadata?: any;
}

export function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'server' | 'client'>('all');
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testLevel, setTestLevel] = useState<'info' | 'warn' | 'error'>('info');
  const [sendingTest, setSendingTest] = useState(false);

  // Poll intervals
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching logs view:', err);
    } finally {
      if (!isBackground) setRefreshing(false);
    }
  };

  // Initial load and auto-refresh Setup
  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchLogs(true);
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear the logs console on the server? This will wipe the current memory buffer.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/logs/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error clearing logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageToSend = testMessage.trim() || `Diagnostic test signal triggered manually`;
    setSendingTest(true);
    try {
      // Create server-side print statement to trigger capturing
      const res = await fetch('/api/logs/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: testLevel,
          message: messageToSend
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestMessage('');
        // Quick short wait and refresh
        setTimeout(() => fetchLogs(true), 200);
      }
    } catch (err) {
      console.error('Error emitting diagnostic log:', err);
    } finally {
      setSendingTest(false);
    }
  };

  // Log level configurations
  const levelStyles = {
    info: {
      bg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      badge: 'bg-zinc-100 text-zinc-800 border-zinc-300',
      icon: Info,
      color: 'text-zinc-500'
    },
    warn: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: AlertTriangle,
      color: 'text-amber-500'
    },
    error: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      badge: 'bg-rose-100 text-rose-900 border-rose-300',
      icon: AlertCircle,
      color: 'text-rose-500'
    }
  };

  // Filter the final log array
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLevel = levelFilter === 'all' ? true : log.level === levelFilter;
    const matchesSource = sourceFilter === 'all' ? true : log.source === sourceFilter;

    return matchesSearch && matchesLevel && matchesSource;
  });

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in slide-in-from-bottom-4 pb-12">
      
      {/* Primary diagnostic title card */}
      <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-black text-zinc-900">Diagnostics Console</h1>
          </div>
          <p className="text-sm text-zinc-500">
            Monitor real-time system telemetries, background checkout triggers, payment webhooks, database requests, and browser-side client exceptions.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100 cursor-pointer select-none hover:bg-zinc-100 transition-colors">
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4" 
            />
            <span>Auto-Stream (3s)</span>
          </label>

          <button
            onClick={() => fetchLogs()}
            disabled={refreshing}
            className="flex items-center gap-2 bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 active:bg-zinc-200 text-zinc-700 px-4 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleClearLogs}
            disabled={loading || logs.length === 0}
            className="flex items-center gap-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 active:bg-rose-200 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear Memory
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column tools of control logs / mock simulation */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
            <h3 className="font-bold text-zinc-900 text-base border-b border-zinc-100 pb-2">Generate Manual Telemetry</h3>
            <p className="text-xs text-zinc-400">
              Emit diagnostic traces directly to test the capturing hooks, filtering widgets, and responsive streaming pipeline.
            </p>

            <form onSubmit={handleSendTestLog} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">Severity / Urgency</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['info', 'warn', 'error'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setTestLevel(level)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-extrabold capitalize border transition-all ${
                        testLevel === level 
                          ? level === 'info' ? 'bg-zinc-900 text-white border-zinc-900' : level === 'warn' ? 'bg-amber-500 text-white border-amber-500' : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border-zinc-100'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="test-message-input" className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">Diagnostic Message</label>
                <input
                  id="test-message-input"
                  type="text"
                  placeholder="e.g. M-Pesa STK verification timeout"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={sendingTest}
                className="w-full bg-zinc-900 hover:bg-zinc-800 transition-colors py-2 px-4 text-xs font-extrabold tracking-wider uppercase text-white rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {sendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Emit Test Trace
              </button>
            </form>
          </div>

          <div className="bg-gradient-to-tr from-zinc-900 to-zinc-800 p-6 rounded-3xl border border-zinc-800 shadow-xl text-white space-y-4">
            <h4 className="font-extrabold text-sm tracking-wider uppercase text-orange-400">Logger System Details</h4>
            <div className="space-y-3.5 text-xs">
              <p className="text-zinc-300 leading-relaxed">
                The diagnostics platform intercepts both backend standard runtime outputs and client errors. Any <code className="bg-zinc-800 px-1 py-0.5 rounded text-orange-300">console.error</code> or database authorization block gets logged instantly here.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-zinc-700 text-zinc-400">
                <div className="flex justify-between">
                  <span>Current Cap:</span>
                  <span className="font-mono text-zinc-200">300 items</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory State:</span>
                  <span className="font-mono text-zinc-200">{logs.length} Logged</span>
                </div>
                <div className="flex justify-between">
                  <span>Listener scope:</span>
                  <span className="font-mono text-orange-300 font-extrabold">Full-Stack Intercept</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right columns: Real-time dynamic terminal */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          
          {/* Filtering Header Panel */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex flex-col md:flex-row gap-2.5 items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search telemetry..."
                className="w-full text-xs font-semibold pl-9 pr-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Selector Filters */}
            <div className="flex items-center gap-2 self-stretch md:self-auto w-full md:w-auto overflow-x-auto shrink-0 pb-1 md:pb-0">
              <span className="text-zinc-400 text-[10px] font-black uppercase tracking-wider hidden sm:inline">Severity:</span>
              <div className="flex bg-zinc-50 p-0.5 rounded-xl border border-zinc-200">
                {(['all', 'info', 'warn', 'error'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLevelFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-colors ${
                      levelFilter === filter 
                        ? 'bg-zinc-900 text-white' 
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <span className="text-zinc-400 text-[10px] font-black uppercase tracking-wider hidden sm:inline">Origin:</span>
              <div className="flex bg-zinc-50 p-0.5 rounded-xl border border-zinc-200">
                {(['all', 'server', 'client'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSourceFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-colors ${
                      sourceFilter === filter 
                        ? 'bg-zinc-900 text-white' 
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Core Telemetry Logs Stream Terminal representation */}
          <div className="bg-zinc-950 rounded-3xl border border-zinc-800 flex-1 min-h-[500px] flex flex-col text-zinc-200 font-mono text-xs overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between px-5 py-3 bg-zinc-900 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold text-zinc-400 ml-2 tracking-wider">TELEMETRY_SHELL_PIPE v1.0.4</span>
              </div>
              <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Showing {filteredLogs.length} matching entries</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[600px] p-4 divide-y divide-zinc-900 scrollbar-thin scrollbar-thumb-zinc-800">
              {filteredLogs.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center text-zinc-500 space-y-3.5">
                  <Terminal className="w-10 h-10 text-zinc-700" />
                  <div className="space-y-1 max-w-sm">
                    <p className="font-extrabold text-zinc-400 text-sm">Terminal Quiet & Operational</p>
                    <p className="text-[11px] text-zinc-600">
                      No matching log items found in memory buffer. Submit an order checkout, toggle administrative keys, or click Emit Diagnostic Trace to check pipeline flow.
                    </p>
                  </div>
                </div>
              ) : (
                filteredLogs.map((log, index) => {
                  const cfg = levelStyles[log.level] || levelStyles.info;
                  const IconComponent = cfg.icon;
                  const isExpanded = expandedLogId === index;

                  return (
                    <div 
                      key={index} 
                      className={`py-3 px-2 group hover:bg-zinc-900/50 transition-colors flex flex-col gap-2 ${
                        log.level === 'error' ? 'hover:bg-rose-950/10' : log.level === 'warn' ? 'hover:bg-amber-950/10' : ''
                      }`}
                    >
                      <div 
                        className="flex items-start md:items-center justify-between gap-3 cursor-pointer"
                        onClick={() => setExpandedLogId(isExpanded ? null : index)}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Severity Indicator badge */}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 tracking-wider ${
                            log.level === 'error' ? 'bg-rose-900/30 text-rose-300 border border-rose-800/40' : 
                            log.level === 'warn' ? 'bg-amber-900/30 text-amber-300 border border-amber-800/40' : 
                            'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                          }`}>
                            {log.level}
                          </span>

                          {/* Origin icon */}
                          <span className="shrink-0 mt-0.5" title={log.source === 'server' ? 'Server-side log' : 'Client browser log'}>
                            {log.source === 'server' ? (
                              <Server className="w-3.5 h-3.5 text-zinc-400" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-orange-400" />
                            )}
                          </span>

                          {/* Log Message */}
                          <p className={`text-xs select-all text-zinc-300 break-all leading-5 ${
                            log.level === 'error' ? 'font-semibold text-rose-200' : log.level === 'warn' ? 'font-semibold text-amber-200' : ''
                          }`}>
                            {log.message}
                          </p>
                        </div>

                        {/* Timestamp & Expand trigger */}
                        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto text-zinc-500 text-[10px] font-medium">
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 group-hover:text-zinc-300" />}
                        </div>
                      </div>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-300 space-y-3 mt-1 select-text">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-0.5">Raw Timestamp</p>
                              <p className="font-mono font-medium text-zinc-300 select-all">{log.timestamp}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-0.5">Sub-system Source</p>
                              <p className="font-mono font-medium capitalize text-zinc-300">{log.source} Environment</p>
                            </div>
                          </div>

                          {log.metadata && (
                            <div>
                              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-1">Additional Payload</p>
                              <pre className="p-3 bg-zinc-950 rounded-lg max-h-48 overflow-auto border border-zinc-850 text-zinc-400 font-mono whitespace-pre-wrap">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}

                          <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 flex justify-between items-center">
                            <span>Double-click or press Ctrl+C to copy values</span>
                            <span className="text-zinc-400 font-bold capitalize">Severity: {log.level}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="bg-zinc-900/70 border-t border-zinc-800 px-5 py-2 flex justify-between items-center text-[10px] text-zinc-500">
              <span className="flex items-center gap-1.5 status-badge">
                <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`}></span>
                {autoRefresh ? 'STREAMS_ACTIVE_WEBSHELL_LISTENING_STILL' : 'STREAMS_PAUSED'}
              </span>
              <span>BUFFER_LIMIT_300</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
