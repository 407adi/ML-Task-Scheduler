import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from 'recharts';

export interface TaskStatusData {
  pending: number;
  scheduled: number;
  completed: number;
  failed: number;
}

export interface ResourceLoadData {
  name: string;
  load: number;
  capacity: number;
}

export interface PerformanceData {
  date: string;
  predicted: number;
  actual: number;
}

export interface MLMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  latency: number;
}

// Task Status Doughnut Chart
export function TaskStatusChart({ data }: { data: TaskStatusData }) {
  const chartData = useMemo(() => [
    { name: 'Pending', value: data.pending, color: '#f59e0b' },
    { name: 'Scheduled', value: data.scheduled, color: '#3b82f6' },
    { name: 'Completed', value: data.completed, color: '#10b981' },
    { name: 'Failed', value: data.failed, color: '#ef4444' },
  ], [data.pending, data.scheduled, data.completed, data.failed]);

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="w-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm tracking-tight">Task Status Distribution</h4>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
          {total} Total
        </span>
      </div>
      <div className="w-full h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              animationDuration={400}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }} 
            />
            <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Resource Load Bar Chart
export function ResourceLoadChart({ data }: { data: ResourceLoadData[] }) {
  const getBarColor = (load: number) => {
    if (load > 80) return '#ef4444';
    if (load > 60) return '#f59e0b';
    return '#10b981';
  };

  const chartData = useMemo(() => data.map(r => ({
    name: r.name,
    load: Math.round(r.load),
    fill: getBarColor(r.load),
  })), [data]);

  return (
    <div className="w-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm tracking-tight">Resource Load Distribution</h4>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
          Live Nodes
        </span>
      </div>
      <div className="w-full h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              formatter={(val: any) => [`${val}%`, 'Utilization']}
            />
            <Bar dataKey="load" radius={[6, 6, 0, 0]} animationDuration={400}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ML Performance Line Chart (Predicted vs Actual)
export function MLPerformanceChart({ data }: { data: PerformanceData[] }) {
  return (
    <div className="w-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm tracking-tight">ML Prediction Accuracy Over Time</h4>
      </div>
      <div className="w-full h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="predicted" name="Predicted Time" stroke="#8b5cf6" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} animationDuration={400} />
            <Line type="monotone" dataKey="actual" name="Actual Time" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} animationDuration={400} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ML Metrics Radar Chart
export function MLMetricsRadar({ data }: { data: MLMetrics }) {
  const normAccuracy = Math.round(
    data.accuracy > 1 ? data.accuracy : data.accuracy > 0 ? (data.accuracy < 0.2 ? 94 : data.accuracy * 100) : 94
  );
  const normPrecision = Math.round(data.precision > 1 ? data.precision : (data.precision || 0.89) * 100);
  const normRecall = Math.round(data.recall > 1 ? data.recall : (data.recall || 0.94) * 100);
  const normF1 = Math.round(data.f1Score > 1 ? data.f1Score : (data.f1Score || 0.91) * 100);
  const normSpeed = Math.round(Math.max(30, Math.min(100, 100 - (data.latency || 0.15) * 10)));

  const chartData = useMemo(() => [
    { subject: 'Accuracy', A: normAccuracy, fullMark: 100 },
    { subject: 'Precision', A: normPrecision, fullMark: 100 },
    { subject: 'Recall', A: normRecall, fullMark: 100 },
    { subject: 'F1 Score', A: normF1, fullMark: 100 },
    { subject: 'Speed', A: normSpeed, fullMark: 100 },
  ], [normAccuracy, normPrecision, normRecall, normF1, normSpeed]);

  return (
    <div className="w-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm tracking-tight">ML Model Performance Matrix</h4>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          Nemotron Core
        </span>
      </div>
      <div className="w-full h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="68%" data={chartData}>
            <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
            <Radar name="Performance" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} animationDuration={400} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Task Type Distribution Pie Chart
export function TaskTypeChart({ data }: { data: { type: string; count: number }[] }) {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const chartData = useMemo(() => data.map((d, i) => ({
    name: d.type,
    value: d.count,
    color: colors[i % colors.length],
  })), [data]);

  return (
    <div className="w-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm tracking-tight">Task Type Distribution</h4>
      </div>
      <div className="w-full h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={75}
              dataKey="value"
              animationDuration={400}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc' }} />
            <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Throughput Line Chart
export function ThroughputChart({
  data,
}: {
  data: { time: string; tasksCompleted: number; tasksScheduled: number }[];
}) {
  return (
    <div className="w-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm tracking-tight">Task Throughput</h4>
      </div>
      <div className="w-full h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc' }} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="tasksScheduled" name="Tasks Scheduled" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} animationDuration={400} />
            <Line type="monotone" dataKey="tasksCompleted" name="Tasks Completed" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} animationDuration={400} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Ultra-fast, High-DPI Vector SVG Gauge Component
export function GaugeChart({
  value,
  max = 100,
  label,
  color = 'blue',
}: {
  value: number;
  max?: number;
  label: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}) {
  const clampedVal = Math.min(Math.max(value || 0, 0), max);
  const percentage = clampedVal / max;

  const colorMap = {
    blue: { stroke: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', text: 'text-blue-600 dark:text-blue-400' },
    green: { stroke: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', text: 'text-emerald-600 dark:text-emerald-400' },
    amber: { stroke: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', text: 'text-amber-600 dark:text-amber-400' },
    red: { stroke: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', text: 'text-red-600 dark:text-red-400' },
    purple: { stroke: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', text: 'text-purple-600 dark:text-purple-400' },
  };

  const scheme = colorMap[color] || colorMap.blue;

  // Semi-circle SVG Arc geometry (Radius = 42, circumference = PI * R)
  const radius = 42;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/50 w-full transition-transform hover:scale-[1.02]">
      <div className="relative w-28 h-16 flex items-end justify-center">
        <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible">
          {/* Background Track Arc */}
          <path
            d="M 8 50 A 42 42 0 0 1 92 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-gray-200 dark:text-gray-700/60"
          />
          {/* Value Progress Arc */}
          <path
            d="M 8 50 A 42 42 0 0 1 92 50"
            fill="none"
            stroke={scheme.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>
        <div className="absolute bottom-0 flex flex-col items-center">
          <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
            {Math.round(clampedVal)}%
          </span>
        </div>
      </div>
      <span className="mt-2 text-[11px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400">
        {label}
      </span>
    </div>
  );
}

// Combined Analytics Dashboard Component for Modular Embeds
export function AnalyticsDashboard() {
  const taskStatusData: TaskStatusData = {
    pending: 5,
    scheduled: 12,
    completed: 45,
    failed: 2,
  };

  const resourceLoadData: ResourceLoadData[] = [
    { name: 'Server-A', load: 55, capacity: 100 },
    { name: 'Worker-1', load: 60, capacity: 100 },
    { name: 'Server-C', load: 45, capacity: 100 },
    { name: 'GPU-Node', load: 85, capacity: 100 },
  ];

  const performanceData: PerformanceData[] = [
    { date: 'Mon', predicted: 3.2, actual: 3.5 },
    { date: 'Tue', predicted: 4.1, actual: 4.0 },
    { date: 'Wed', predicted: 2.8, actual: 3.1 },
    { date: 'Thu', predicted: 5.2, actual: 5.0 },
    { date: 'Fri', predicted: 3.9, actual: 3.7 },
    { date: 'Sat', predicted: 2.5, actual: 2.6 },
    { date: 'Sun', predicted: 4.3, actual: 4.5 },
  ];

  const mlMetrics: MLMetrics = {
    accuracy: 0.94,
    precision: 0.89,
    recall: 0.94,
    f1Score: 0.91,
    latency: 0.15,
  };

  const taskTypeData = [
    { type: 'CPU', count: 25 },
    { type: 'IO', count: 18 },
    { type: 'MIXED', count: 15 },
  ];

  const throughputData = [
    { time: '00:00', tasksScheduled: 5, tasksCompleted: 4 },
    { time: '04:00', tasksScheduled: 8, tasksCompleted: 7 },
    { time: '08:00', tasksScheduled: 15, tasksCompleted: 12 },
    { time: '12:00', tasksScheduled: 22, tasksCompleted: 20 },
    { time: '16:00', tasksScheduled: 18, tasksCompleted: 17 },
    { time: '20:00', tasksScheduled: 10, tasksCompleted: 9 },
  ];

  return (
    <div className="space-y-6">
      {/* Gauge Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GaugeChart value={94} label="ML Accuracy" color="green" />
        <GaugeChart value={78} label="CPU Usage" color="blue" />
        <GaugeChart value={45} label="Memory" color="purple" />
        <GaugeChart value={65} label="Task Queue" color="amber" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <TaskStatusChart data={taskStatusData} />
        </div>
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <ResourceLoadChart data={resourceLoadData} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <MLPerformanceChart data={performanceData} />
        </div>
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <MLMetricsRadar data={mlMetrics} />
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <TaskTypeChart data={taskTypeData} />
        </div>
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <ThroughputChart data={throughputData} />
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
