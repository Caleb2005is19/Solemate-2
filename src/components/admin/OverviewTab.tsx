import React from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatPrice } from '../../utils';

export function OverviewTab({ role }: { role: 'admin' | 'seller' }) {
  const { products, orders, sellers } = useStore();

  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((acc, o) => acc + o.total, 0);

  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  
  // Mock data for chart - in a real app this would be derived from orders grouped by day
  const chartData = [
    { name: 'Mon', revenue: 4000, orders: 24 },
    { name: 'Tue', revenue: 3000, orders: 18 },
    { name: 'Wed', revenue: 2000, orders: 12 },
    { name: 'Thu', revenue: 2780, orders: 19 },
    { name: 'Fri', revenue: 1890, orders: 15 },
    { name: 'Sat', revenue: 2390, orders: 20 },
    { name: 'Sun', revenue: 3490, orders: 22 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-4xl font-black text-zinc-900 tracking-tight">
             Dashboard <span className="text-orange-500">Overview</span>
           </h1>
           <p className="text-zinc-500 font-medium">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="px-4 py-2 bg-zinc-100 rounded-2xl flex items-center gap-2 text-zinc-600 font-bold text-sm">
           <Clock className="w-4 h-4" />
           {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={formatPrice(totalRevenue)} 
          change="+12.5%" 
          trend="up"
          icon={<DollarSign className="w-6 h-6" />}
          color="bg-emerald-500"
        />
        <StatCard 
          title="Total Orders" 
          value={orders.length.toString()} 
          change="+24" 
          trend="up"
          icon={<ShoppingCart className="w-6 h-6" />}
          color="bg-orange-500"
        />
        <StatCard 
          title="Avg. Order Value" 
          value={formatPrice(orders.length ? totalRevenue / orders.length : 0)} 
          change="-2.1%" 
          trend="down"
          icon={<TrendingUp className="w-6 h-6" />}
          color="bg-indigo-500"
        />
        <StatCard 
          title="Active Sellers" 
          value={sellers.length.toString()} 
          change="Keep it up!" 
          trend="up"
          icon={<Users className="w-6 h-6" />}
          color="bg-zinc-900"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
               <Activity className="w-5 h-5 text-orange-500" />
               Revenue Analysis
             </h3>
             <select className="bg-zinc-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-zinc-500 outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
             </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#a1a1aa', fontSize: 12, fontWeight: 700}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#a1a1aa', fontSize: 12, fontWeight: 700}}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-zinc-900 mb-6">Recent Activity</h3>
          <div className="space-y-6 flex-1">
            {orders.slice(0, 5).map((order, i) => (
              <div key={order.id} className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-500' : 
                  order.status === 'Pending' ? 'bg-orange-50 text-orange-500' :
                  'bg-zinc-50 text-zinc-500'
                }`}>
                   {order.status === 'Delivered' ? <CheckCircle2 className="w-5 h-5"/> : <Clock className="w-5 h-5"/>}
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">{(order?.customerInfo?.firstName ?? 'Customer')} placed an order</p>
                  <p className="text-xs text-zinc-500">{formatPrice(order?.total ?? 0)} • {order?.date ? new Date(order.date).toLocaleTimeString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-4 mt-8 bg-zinc-50 rounded-2xl text-zinc-500 font-bold text-sm hover:bg-zinc-100 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-black ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-4 h-4"/> : <ArrowDownRight className="w-4 h-4"/>}
          {change}
        </div>
      </div>
      <div>
        <h3 className="text-zinc-400 font-black text-xs uppercase tracking-widest">{title}</h3>
        <p className="text-3xl font-black text-zinc-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
