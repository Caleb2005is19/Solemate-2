import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Activity, AlertTriangle, CheckCircle, Clock, Database, Play, Square, Zap, Server, ShieldAlert 
} from 'lucide-react';
import api from '../services/api';
import { db } from '../firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

interface Metric {
  time: string;
  latency: number;
  requests: number;
  errors: number;
}

export function StressTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);
  const [concurrency, setConcurrency] = useState(5);
  const [testType, setTestType] = useState<'browsing' | 'ordering' | 'api'>('browsing');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const metricsRef = useRef<Metric[]>([]);

  const runTestBatch = async () => {
    const startTime = Date.now();
    let errors = 0;
    let requests = 0;

    const tasks = Array.from({ length: concurrency }).map(async () => {
      try {
        requests++;
        if (testType === 'browsing') {
          // Simulate browsing products
          const q = query(collection(db, 'products'), limit(10));
          await getDocs(q);
        } else if (testType === 'ordering') {
          // Simulate bulk order creation via API
          await api.post('/api/load-test/bulk-orders', { count: 1, userId: 'stress-test-user' });
        } else if (testType === 'api') {
          // Simulate health check API calls
          await api.get('/api/health');
        }
      } catch (err) {
        errors++;
        console.error('Stress test error:', err);
      }
    });

    await Promise.all(tasks);
    const endTime = Date.now();
    const latency = endTime - startTime;

    const newMetric: Metric = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      latency,
      requests,
      errors
    };

    metricsRef.current = [...metricsRef.current.slice(-29), newMetric];
    setMetrics([...metricsRef.current]);
    setTotalRequests(prev => prev + requests);
    setTotalErrors(prev => prev + errors);
    setAvgLatency(prev => {
      if (prev === 0) return latency;
      return Math.round((prev + latency) / 2);
    });
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(runTestBatch, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, concurrency, testType]);

  const resetMetrics = () => {
    setMetrics([]);
    metricsRef.current = [];
    setTotalRequests(0);
    setTotalErrors(0);
    setAvgLatency(0);
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-2">
              <Zap className="text-orange-500" /> System Stress Test Dashboard
            </h1>
            <p className="text-zinc-500 mt-1">Simulate massive traffic and monitor system resilience.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => isRunning ? setIsRunning(false) : setIsRunning(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                isRunning 
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20' 
                  : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
              }`}
            >
              {isRunning ? <><Square size={18} fill="currentColor" /> Stop Test</> : <><Play size={18} fill="currentColor" /> Start Test</>}
            </button>
            <button
              onClick={resetMetrics}
              className="px-6 py-3 rounded-full font-semibold bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-all"
            >
              Reset Metrics
            </button>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <label className="block text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
              <Activity size={16} className="text-blue-500" /> Concurrency (Requests/sec)
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={concurrency}
              onChange={(e) => setConcurrency(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-2">
              <span>1 req/s</span>
              <span className="font-bold text-zinc-900">{concurrency} req/s</span>
              <span>50 req/s</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <label className="block text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
              <Server size={16} className="text-purple-500" /> Test Scenario
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['browsing', 'ordering', 'api'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTestType(type)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                    testType === type 
                      ? 'bg-orange-100 text-orange-600 border border-orange-200' 
                      : 'bg-zinc-50 text-zinc-500 border border-zinc-100 hover:bg-zinc-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500">System Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-zinc-300'}`} />
                <span className="font-bold text-zinc-900">{isRunning ? 'Active Testing' : 'Idle'}</span>
              </div>
            </div>
            <ShieldAlert className={totalErrors > 0 ? 'text-red-500' : 'text-zinc-300'} size={32} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-blue-500" size={20} />
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Total</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{totalRequests.toLocaleString()}</p>
            <p className="text-sm text-zinc-500">Requests Sent</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="text-red-500" size={20} />
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Failures</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{totalErrors.toLocaleString()}</p>
            <p className="text-sm text-zinc-500">Error Count</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-orange-500" size={20} />
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Avg</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{avgLatency}ms</p>
            <p className="text-sm text-zinc-500">Response Time</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Success</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900">
              {totalRequests > 0 ? Math.round(((totalRequests - totalErrors) / totalRequests) * 100) : 100}%
            </p>
            <p className="text-sm text-zinc-500">Success Rate</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <Clock size={18} className="text-orange-500" /> Latency Over Time (ms)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="time" hide />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorLatency)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <Activity size={18} className="text-blue-500" /> Requests vs Errors
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="time" hide />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="errors" 
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Resilience Tips */}
        <div className="mt-12 bg-orange-50 border border-orange-100 p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
            <Database size={24} /> Resilience & Scaling Strategy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/50 p-4 rounded-xl">
              <h4 className="font-bold text-orange-800 mb-2">Firestore Scaling</h4>
              <p className="text-sm text-orange-700">Firestore handles massive traffic automatically, but watch out for hot keys (writing to the same document repeatedly). Use distributed counters if needed.</p>
            </div>
            <div className="bg-white/50 p-4 rounded-xl">
              <h4 className="font-bold text-orange-800 mb-2">API Rate Limiting</h4>
              <p className="text-sm text-orange-700">We've implemented `express-rate-limit` on sensitive endpoints like STK Push to prevent abuse and brute-force attacks.</p>
            </div>
            <div className="bg-white/50 p-4 rounded-xl">
              <h4 className="font-bold text-orange-800 mb-2">Error Boundaries</h4>
              <p className="text-sm text-orange-700">The app uses React Error Boundaries to isolate component failures, ensuring the entire UI doesn't crash during heavy load.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
