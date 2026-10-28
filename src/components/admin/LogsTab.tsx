import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Terminal, 
  Trash2, 
  RefreshCw, 
  Search, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Server, 
  Laptop, 
  Play, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Info, 
  Calendar, 
  Download, 
  Cloud, 
  Database, 
  CreditCard, 
  Lock, 
  Layers,
  Filter
} from 'lucide-react';
import { fetchSystemLogs, deleteSystemLog, logSystemError, LogCategory } from '../../services/loggingService';
import { SystemLog } from '../../services/types';

export function LogsTab() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | LogCategory>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'server' | 'client'>('all');
  
  // Timeframe selection
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d' | 'all' | 'custom'>('24h');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // UI state
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testCategory, setTestCategory] = useState<LogCategory>('cloudinary');
  const [testLevel, setTestLevel] = useState<'info' | 'warn' | 'error'>('error');
  const [sendingTest, setSendingTest] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadLogs = async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      let timeframeHours: number | undefined;
      let start: Date | undefined;
      let end: Date | undefined;

      if (timeframe === '1h') timeframeHours = 1;
      else if (timeframe === '24h') timeframeHours = 24;
      else if (timeframe === '7d') timeframeHours = 168;
      else if (timeframe === '30d') timeframeHours = 720;
      else if (timeframe === 'all') timeframeHours = 0;
      else if (timeframe === 'custom' && customStartDate) {
        start = new Date(customStartDate);
        end = customEndDate ? new Date(customEndDate) : new Date();
      }

      // 1. Fetch persistent logs from Firestore
      const firestoreLogs = await fetchSystemLogs({
        timeframeHours,
        startDate: start,
        endDate: end,
        category: categoryFilter,
        level: levelFilter,
        maxItems: 400
      });

      // 2. Fetch server memory buffer logs
      let serverLogs: any[] = [];
      try {
        const res = await fetch('/api/logs');
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          serverLogs = data.logs.map((l: any, idx: number) => ({
            id: `server-mem-${idx}-${new Date(l.timestamp).getTime()}`,
            timestamp: l.timestamp,
            epochMs: new Date(l.timestamp).getTime(),
            level: l.level || 'info',
            category: (l.metadata && l.metadata.category) ? l.metadata.category : (l.source === 'server' ? 'server' : 'ui'),
            source: l.source || 'server',
            message: l.message,
            metadata: l.metadata
          }));
        }
      } catch {
        // ignore server log endpoint error
      }

      // Merge and deduplicate by message + timestamp (within 2s)
      const mergedMap = new Map<string, SystemLog>();
      
      firestoreLogs.forEach(log => {
        const key = `${log.timestamp.slice(0, 19)}_${log.message.slice(0, 40)}`;
        mergedMap.set(key, log);
      });

      serverLogs.forEach(log => {
        const key = `${log.timestamp.slice(0, 19)}_${log.message.slice(0, 40)}`;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, log);
        }
      });

      const mergedList = Array.from(mergedMap.values()).sort((a, b) => b.epochMs - a.epochMs);
      setLogs(mergedList);
    } catch (err) {
      console.error('Error fetching logs view:', err);
    } finally {
      if (!isBackground) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [timeframe, customStartDate, customEndDate, categoryFilter, levelFilter]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        loadLogs(true);
      }, 5000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, timeframe, customStartDate, customEndDate, categoryFilter, levelFilter]);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to purge recent logs from memory and local session?')) return;
    setLoading(true);
    try {
      await fetch('/api/logs/clear', { method: 'POST' });
      setLogs([]);
    } catch (err) {
      console.error('Error clearing logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageToSend = testMessage.trim() || `Diagnostic test signal triggered for category ${testCategory}`;
    setSendingTest(true);
    try {
      await logSystemError(testCategory, messageToSend, {
        simulated: true,
        triggeredAt: new Date().toISOString(),
        testCategory
      }, testLevel);

      setTestMessage('');
      setTimeout(() => loadLogs(true), 500);
    } catch (err) {
      console.error('Error emitting diagnostic log:', err);
    } finally {
      setSendingTest(false);
    }
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `solemate-error-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Level', 'Category', 'Source', 'Message'];
    const rows = logs.map(l => [
      `"${l.timestamp}"`,
      `"${l.level}"`,
      `"${l.category}"`,
      `"${l.source}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `solemate-error-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const categoryIcons: Record<string, any> = {
    cloudinary: Cloud,
    firebase: Database,
    intasend: CreditCard,
    server: Server,
    auth: Lock,
    ui: Laptop,
    system: Terminal
  };

  // Filter logs client-side
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
        log.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesLevel = levelFilter === 'all' ? true : log.level === levelFilter;
      const matchesCategory = categoryFilter === 'all' ? true : log.category === categoryFilter;
      const matchesSource = sourceFilter === 'all' ? true : log.source === sourceFilter;

      return matchesSearch && matchesLevel && matchesCategory && matchesSource;
    });
  }, [logs, searchQuery, levelFilter, categoryFilter, sourceFilter]);

  // Counts by severity
  const counts = useMemo(() => {
    let errors = 0;
    let warns = 0;
    let infos = 0;
    logs.forEach(l => {
      if (l.level === 'error') errors++;
      else if (l.level === 'warn') warns++;
      else infos++;
    });
    return { errors, warns, infos };
  }, [logs]);

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 pb-12">
      
      {/* Header card with action buttons */}
      <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-black text-zinc-900">System & Error Logs</h1>
            <span className="bg-orange-50 text-orange-600 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border border-orange-100">
              Persistent Storage
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Retained Firestore error logs and server telemetries across Cloudinary uploads, Firebase security rules, IntaSend M-Pesa webhooks, and client apps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100 cursor-pointer select-none hover:bg-zinc-100 transition-colors">
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4" 
            />
            <span>Auto-Stream (5s)</span>
          </label>

          <button
            onClick={() => loadLogs()}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 active:bg-zinc-200 text-zinc-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 active:bg-zinc-200 text-zinc-700 px-3 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95 disabled:opacity-50"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>

          <button
            onClick={handleExportJSON}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 active:bg-zinc-200 text-zinc-700 px-3 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95 disabled:opacity-50"
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </button>

          <button
            onClick={handleClearLogs}
            disabled={loading || logs.length === 0}
            className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 active:bg-rose-200 text-rose-600 px-3 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-400">Total Errors</p>
            <p className="text-xl font-black text-rose-600">{counts.errors}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-400">Warnings</p>
            <p className="text-xl font-black text-amber-600">{counts.warns}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-400">Information</p>
            <p className="text-xl font-black text-sky-600">{counts.infos}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-400">Active Window</p>
            <p className="text-sm font-black text-zinc-900 capitalize">
              {timeframe === '1h' ? 'Last 1 Hour' : timeframe === '24h' ? 'Past 24 Hours' : timeframe === '7d' ? 'Past 7 Days' : timeframe === '30d' ? 'Past 30 Days' : timeframe === 'all' ? 'All Time' : 'Custom Range'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls & Real-Time Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (4 cols): Filters, Timeframe & Test Trigger */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Timeframe Selector Card */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-zinc-900 text-sm">Timeframe Filter</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: '1h', label: '1 Hour' },
                { id: '24h', label: 'Today (24h)' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'all', label: 'All Retained' },
                { id: 'custom', label: 'Custom' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeframe(t.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    timeframe === t.id
                      ? 'bg-zinc-900 text-white shadow-md'
                      : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {timeframe === 'custom' && (
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2 mt-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full text-xs font-semibold p-2 rounded-lg bg-white border border-zinc-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full text-xs font-semibold p-2 rounded-lg bg-white border border-zinc-200 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Subsystem Category Filter Card */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
              <Layers className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-zinc-900 text-sm">Subsystem Category</h3>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'cloudinary', label: 'Cloudinary CDN' },
                { id: 'firebase', label: 'Firebase DB' },
                { id: 'intasend', label: 'M-Pesa / IntaSend' },
                { id: 'server', label: 'Node Server' },
                { id: 'auth', label: 'Auth & Roles' },
                { id: 'ui', label: 'Client / UI' },
                { id: 'system', label: 'WhatsApp / Alerts' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id as any)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    categoryFilter === cat.id
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Telemetry & Diagnostic Signal Generator */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
            <h3 className="font-bold text-zinc-900 text-sm border-b border-zinc-100 pb-2">Emit Diagnostic Test Log</h3>
            <p className="text-xs text-zinc-400">
              Verify that error persistence across Cloudinary, Firebase, and payments is operating smoothly.
            </p>

            <form onSubmit={handleSendTestLog} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">Target Category</label>
                <select
                  value={testCategory}
                  onChange={(e) => setTestCategory(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 outline-none"
                >
                  <option value="cloudinary">Cloudinary Media</option>
                  <option value="firebase">Firebase Database</option>
                  <option value="intasend">IntaSend / M-Pesa</option>
                  <option value="server">Node Server</option>
                  <option value="auth">Auth & Security</option>
                  <option value="system">WhatsApp & System</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">Severity</label>
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
                <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">Diagnostic Message</label>
                <input
                  type="text"
                  placeholder="e.g. Cloudinary unsigned preset verification test"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={sendingTest}
                className="w-full bg-zinc-900 hover:bg-zinc-800 py-2.5 px-4 text-xs font-extrabold uppercase text-white rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-zinc-200"
              >
                {sendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Persist & Log Trace
              </button>
            </form>
          </div>

        </div>

        {/* Right Column (8 cols): Real-Time Diagnostic Terminal */}
        <div className="lg:col-span-8 space-y-4 flex flex-col">
          
          {/* Search & Filter Header Panel */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search error messages or payloads..."
                className="w-full text-xs font-semibold pl-9 pr-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Severity Pill Filter */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto overflow-x-auto shrink-0">
              <span className="text-zinc-400 text-[10px] font-black uppercase tracking-wider">Severity:</span>
              <div className="flex bg-zinc-50 p-0.5 rounded-xl border border-zinc-200">
                {(['all', 'error', 'warn', 'info'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLevelFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-colors ${
                      levelFilter === filter 
                        ? filter === 'error' ? 'bg-rose-600 text-white' : filter === 'warn' ? 'bg-amber-500 text-white' : 'bg-zinc-900 text-white'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <span className="text-zinc-400 text-[10px] font-black uppercase tracking-wider ml-1">Origin:</span>
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

          {/* Core Shell Console */}
          <div className="bg-zinc-950 rounded-3xl border border-zinc-800 flex-1 min-h-[550px] flex flex-col text-zinc-200 font-mono text-xs overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between px-5 py-3 bg-zinc-900 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold text-zinc-400 ml-2 tracking-wider">
                  PERSISTENT_LOG_SHELL v2.1.0 · [{timeframe.toUpperCase()}]
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Showing {filteredLogs.length} matching entries</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[620px] p-4 divide-y divide-zinc-900 scrollbar-thin scrollbar-thumb-zinc-800">
              {filteredLogs.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-center text-zinc-500 space-y-3.5">
                  <Terminal className="w-12 h-12 text-zinc-700" />
                  <div className="space-y-1 max-w-sm">
                    <p className="font-extrabold text-zinc-300 text-sm">No Error Entries In Selected Timeframe</p>
                    <p className="text-[11px] text-zinc-500">
                      There are no errors or traces matching your timeframe and category filter. Try selecting "All Retained" or emit a test trace above.
                    </p>
                  </div>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const CategoryIcon = categoryIcons[log.category] || Terminal;

                  return (
                    <div 
                      key={log.id} 
                      className={`py-3 px-2 group hover:bg-zinc-900/50 transition-colors flex flex-col gap-2 ${
                        log.level === 'error' ? 'hover:bg-rose-950/10' : log.level === 'warn' ? 'hover:bg-amber-950/10' : ''
                      }`}
                    >
                      <div 
                        className="flex items-start md:items-center justify-between gap-3 cursor-pointer select-none"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          {/* Severity badge */}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 tracking-wider ${
                            log.level === 'error' ? 'bg-rose-900/40 text-rose-300 border border-rose-800/60' : 
                            log.level === 'warn' ? 'bg-amber-900/40 text-amber-300 border border-amber-800/60' : 
                            'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                          }`}>
                            {log.level}
                          </span>

                          {/* Category badge */}
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 bg-zinc-900 border border-zinc-800 text-orange-400">
                            <CategoryIcon className="w-3 h-3 text-orange-400" />
                            <span>{log.category}</span>
                          </span>

                          {/* Origin icon */}
                          <span className="shrink-0 mt-0.5" title={log.source === 'server' ? 'Server-side log' : 'Client browser log'}>
                            {log.source === 'server' ? (
                              <Server className="w-3.5 h-3.5 text-zinc-400" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-sky-400" />
                            )}
                          </span>

                          {/* Log Message */}
                          <p className={`text-xs select-all break-all leading-5 ${
                            log.level === 'error' ? 'font-semibold text-rose-200' : log.level === 'warn' ? 'font-semibold text-amber-200' : 'text-zinc-300'
                          }`}>
                            {log.message}
                          </p>
                        </div>

                        {/* Timestamp & Expand trigger */}
                        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto text-zinc-500 text-[10px] font-medium">
                          <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 group-hover:text-zinc-300" />}
                        </div>
                      </div>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800/80 text-[11px] text-zinc-300 space-y-3 mt-1 select-text">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-0.5">Exact Timestamp</p>
                              <p className="font-mono text-zinc-300 select-all">{new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-0.5">Category Subsystem</p>
                              <p className="font-mono text-orange-400 uppercase font-bold">{log.category}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-0.5">Environment</p>
                              <p className="font-mono capitalize text-zinc-300">{log.source} Side</p>
                            </div>
                          </div>

                          {log.metadata && (
                            <div>
                              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-1">Extended Payload & Stack Trace</p>
                              <pre className="p-3 bg-zinc-950 rounded-xl max-h-56 overflow-auto border border-zinc-850 text-zinc-400 font-mono text-[11px] whitespace-pre-wrap select-all">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}

                          <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 flex justify-between items-center">
                            <span>Double-click to copy payload text</span>
                            <span className="text-zinc-400 font-bold capitalize">Severity: {log.level}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="bg-zinc-900/70 border-t border-zinc-800 px-5 py-2.5 flex justify-between items-center text-[10px] text-zinc-500">
              <span className="flex items-center gap-1.5 status-badge">
                <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`}></span>
                {autoRefresh ? 'FIRESTORE_STREAM_ACTIVE' : 'STREAM_PAUSED'}
              </span>
              <span>RETAINED_ERROR_LOG_ENGINE</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
