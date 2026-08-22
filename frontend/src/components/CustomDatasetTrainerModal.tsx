import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Database, 
  Zap, 
  Play, 
  CheckCircle, 
  Loader2, 
  FileText, 
  Download, 
  X, 
  Sparkles,
  Server
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts';
import { mlApi } from '../lib/api';
import { useToast } from '../contexts/ToastContext';

interface CustomDatasetTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelTrained?: () => void;
}

export default function CustomDatasetTrainerModal({
  isOpen,
  onClose,
  onModelTrained
}: CustomDatasetTrainerModalProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [datasets, setDatasets] = useState<any[]>([]);
  const [hardwareProfiles, setHardwareProfiles] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('google_borg_trace');
  const [selectedHwId, setSelectedHwId] = useState<string>('cloud_gpu_cluster');
  const [selectedDatasetDetails, setSelectedDatasetDetails] = useState<any>(null);

  const [epochs, setEpochs] = useState<number>(50);
  const [learningRate, setLearningRate] = useState<number>(0.001);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingResult, setTrainingResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'sample'>('presets');
  
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Load datasets on open
  useEffect(() => {
    if (isOpen) {
      loadDatasets();
    }
  }, [isOpen]);

  // Load dataset sample when selection changes
  useEffect(() => {
    if (selectedDatasetId) {
      mlApi.getDataset(selectedDatasetId)
        .then((res) => {
          if (res?.data) {
            setSelectedDatasetDetails(res.data);
            if (res.data.hardwareProfile) {
              setSelectedHwId(res.data.hardwareProfile);
            }
          }
        })
        .catch(() => {});
    }
  }, [selectedDatasetId]);

  const loadDatasets = async () => {
    try {
      const res = await mlApi.getDatasets();
      if (res && res.data) {
        setDatasets(res.data);
        if (res.hardwareProfiles) {
          setHardwareProfiles(res.hardwareProfiles);
        }
      }
    } catch {
      // Fallback
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'json') {
      toast.error('Invalid File Type', 'Please upload a .csv or .json workload trace file.');
      return;
    }

    setIsUploading(true);
    try {
      const text = await file.text();
      const payload: any = { filename: file.name };

      if (ext === 'json') {
        const parsed = JSON.parse(text);
        payload.records = Array.isArray(parsed) ? parsed : (parsed.records || [parsed]);
      } else {
        // Simple CSV parser
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) throw new Error('CSV must have a header row and at least 1 data row.');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        
        const records = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
          const row: any = {};
          headers.forEach((h, i) => {
            row[h] = isNaN(Number(vals[i])) ? vals[i] : Number(vals[i]);
          });
          return row;
        });
        payload.records = records;
      }

      const res = await mlApi.uploadDataset(payload);
      if (res.success) {
        toast.success('Trace Uploaded', `Successfully imported ${res.data?.totalRecords || 0} trace records!`);
        await loadDatasets();
        setSelectedDatasetId(res.data.id);
        setActiveTab('sample');
      } else {
        toast.error('Upload Error', res.error || 'Failed to parse workload trace.');
      }
    } catch (err: any) {
      toast.error('Parsing Failed', err.message || 'Could not parse dataset file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartTraining = async () => {
    setIsTraining(true);
    setTrainingProgress(10);
    setTrainingResult(null);

    progressIntervalRef.current = setInterval(() => {
      setTrainingProgress(prev => (prev < 90 ? prev + 15 : prev));
    }, 400);

    try {
      const res = await mlApi.trainCustomTrace({
        datasetId: selectedDatasetId,
        hardwareProfile: selectedHwId,
        epochs,
        learningRate
      });

      setTrainingProgress(100);

      if (res.success) {
        setTrainingResult(res);
        toast.success('Training Complete!', `RL model updated: R² = ${res.metrics?.r2_score} | Boost = ${res.metrics?.scheduling_efficiency_boost}`);
        if (onModelTrained) onModelTrained();
      } else {
        toast.error('Training Failed', res.error || 'Unknown training error.');
      }
    } catch (err: any) {
      toast.error('Training Error', err.message || 'An error occurred during training.');
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setIsTraining(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = `taskName,taskSize,taskType,priority,resourceLoad,actualTime\n` +
      `"Borg Worker 1",1,1,4,45.2,1.35\n` +
      `"GPU Training Step",3,3,5,88.4,14.80\n` +
      `"Database Indexing",2,2,3,62.0,4.20\n` +
      `"API Gateway Auth",1,1,2,30.5,0.75\n` +
      `"Matrix Multiply HPC",3,1,5,95.0,22.10\n`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_workload_trace.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info('Template Downloaded', 'Sample CSV template downloaded for formatting your custom traces.');
  };

  if (!isOpen) return null;

  const currentHw = hardwareProfiles.find(h => h.id === selectedHwId) || {
    name: 'Hardware Profile',
    cpu_speedup: 1.0,
    gpu_speedup: 1.0,
    io_latency_ms: 5.0,
    memory_bandwidth_gbps: 250.0
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between bg-gradient-to-r from-primary-900/10 via-transparent to-purple-900/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/10 text-primary-500 rounded-xl border border-primary-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Custom Datasets & Hardware Profile Training
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium">
                  RL Optimizer
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Train deep reinforcement learning schedulers using real-world cluster traces (Google Borg, Alibaba PAI, Azure, NASA) or your custom CSV/JSON workloads.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Tabs */}
          <div className="flex border-b border-gray-200 dark:border-dark-border">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'presets'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Database className="w-4 h-4" />
              Real-World Datasets ({datasets.length})
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Custom Trace (.csv / .json)
            </button>
            <button
              onClick={() => setActiveTab('sample')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'sample'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              Dataset Records Preview
            </button>
          </div>

          {/* Tab 1: Presets & Datasets Catalog */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datasets.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDatasetId(d.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedDatasetId === d.id
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 shadow-md ring-2 ring-primary-500/20'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-dark-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">
                          {d.name}
                        </span>
                        {d.isCustom ? (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                            Custom
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {d.description || d.source}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-semibold text-primary-600 dark:text-primary-400">
                        {d.totalRecords} tasks
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-dark-border/60 pt-2">
                    <span>Source: <b>{d.source}</b></span>
                    <span>Format: <b>.{d.fileType || 'json'}</b></span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Upload Custom Trace */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-primary-500/40 hover:border-primary-500 rounded-2xl p-8 text-center cursor-pointer bg-primary-50/20 dark:bg-primary-950/10 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-primary-500/10 text-primary-500 rounded-full">
                    {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                      {isUploading ? 'Parsing and Normalizing Trace...' : 'Click to Upload Workload Trace (.CSV or .JSON)'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                      Upload cloud task execution logs containing Task Size, Type, Priority, Resource Load, and Duration to train customized neural scheduling policies.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-border/30 rounded-xl border border-gray-200 dark:border-dark-border">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  <span>Auto-detects column names: <code>taskSize</code>, <code>taskType</code>, <code>priority</code>, <code>resourceLoad</code>, <code>actualTime</code>.</span>
                </div>
                <button
                  onClick={downloadSampleTemplate}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample CSV Template
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Dataset Records Preview */}
          {activeTab === 'sample' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Displaying sample rows from <b>{selectedDatasetDetails?.name || selectedDatasetId}</b></span>
                <span>Total Trace Records: <b>{selectedDatasetDetails?.totalRecords || 0}</b></span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-dark-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-dark-border/40 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-dark-border">
                    <tr>
                      <th className="p-2.5">Task Name / ID</th>
                      <th className="p-2.5">Size</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Priority</th>
                      <th className="p-2.5">Resource Load</th>
                      <th className="p-2.5">Execution Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-dark-border/60">
                    {(selectedDatasetDetails?.sample || []).map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-dark-border/20">
                        <td className="p-2.5 font-medium text-gray-900 dark:text-white">
                          {r.taskName || r.taskId || `Task-${idx+1}`}
                        </td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            {r.taskSize === 1 ? 'SMALL' : r.taskSize === 3 ? 'LARGE' : 'MEDIUM'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                            {r.taskType === 1 ? 'CPU' : r.taskType === 2 ? 'IO' : 'MIXED/GPU'}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono">P{r.priority || 3}</td>
                        <td className="p-2.5 font-mono">{r.resourceLoad}%</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {r.actualTime}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Hardware Profile & Hyperparameters Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-dark-border">
            
            {/* Hardware Profile Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-primary-500" />
                Target Hardware Profile
              </label>
              
              <div className="space-y-2">
                {hardwareProfiles.map((hw) => (
                  <div
                    key={hw.id}
                    onClick={() => setSelectedHwId(hw.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedHwId === hw.id
                        ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/20 shadow-sm'
                        : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-gray-900 dark:text-white">
                        {hw.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                        {hw.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-primary-600 dark:text-primary-400 bg-white dark:bg-dark-card px-2 py-1 rounded border border-gray-200 dark:border-dark-border">
                      <span>CPU: {hw.cpu_speedup}x</span>
                      <span>GPU: {hw.gpu_speedup}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hyperparameters & Training Options */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Reinforcement Learning Hyperparameters
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-dark-border/20 rounded-xl border border-gray-200 dark:border-dark-border">
                  <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Training Epochs
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={epochs}
                    onChange={(e) => setEpochs(Number(e.target.value))}
                    className="mt-1 w-full text-sm font-mono font-bold bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-2"
                  />
                </div>

                <div className="p-3 bg-gray-50 dark:bg-dark-border/20 rounded-xl border border-gray-200 dark:border-dark-border">
                  <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Learning Rate (α)
                  </label>
                  <select
                    value={learningRate}
                    onChange={(e) => setLearningRate(Number(e.target.value))}
                    className="mt-1 w-full text-sm font-mono font-bold bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-2"
                  >
                    <option value={0.0005}>0.0005 (Fine-tuned)</option>
                    <option value={0.001}>0.001 (Recommended)</option>
                    <option value={0.005}>0.005 (Fast Convergence)</option>
                  </select>
                </div>
              </div>

              {/* Hardware Specs Summary Card */}
              <div className="p-3.5 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl shadow-inner space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-primary-300">
                  <span>Simulated Hardware Environment</span>
                  <span className="font-mono">{currentHw.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-300">
                  <div>
                    <span className="text-gray-400 block">I/O Latency</span>
                    <span className="font-bold font-mono">{currentHw.io_latency_ms} ms</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Mem Bandwidth</span>
                    <span className="font-bold font-mono">{currentHw.memory_bandwidth_gbps} GB/s</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Efficiency</span>
                    <span className="font-bold font-mono text-emerald-400">+{Math.round((currentHw.cpu_speedup || 1) * 30)}%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Training Results & Graph (if available) */}
          {trainingResult && (
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>Model Successfully Trained & Deployed to Scheduler!</span>
                </div>
                <span className="text-xs font-mono font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 rounded-full">
                  {trainingResult.modelVersion}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-2.5 bg-white dark:bg-dark-card rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-gray-500">R² Accuracy Score</span>
                  <p className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {trainingResult.metrics?.r2_score}
                  </p>
                </div>
                <div className="p-2.5 bg-white dark:bg-dark-card rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-gray-500">Mean Absolute Error (MAE)</span>
                  <p className="text-lg font-mono font-black text-primary-600 dark:text-primary-400">
                    {trainingResult.metrics?.mae}s
                  </p>
                </div>
                <div className="p-2.5 bg-white dark:bg-dark-card rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-gray-500">RL Final Reward</span>
                  <p className="text-lg font-mono font-black text-purple-600 dark:text-purple-400">
                    +{trainingResult.metrics?.rl_reward_final}
                  </p>
                </div>
                <div className="p-2.5 bg-white dark:bg-dark-card rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-gray-500">Efficiency Boost</span>
                  <p className="text-lg font-mono font-black text-amber-600 dark:text-amber-400">
                    {trainingResult.metrics?.scheduling_efficiency_boost}
                  </p>
                </div>
              </div>

              {/* Reward Progression Chart */}
              {trainingResult.rewardHistory && (
                <div className="h-44 w-full bg-white dark:bg-dark-card rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/40">
                  <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                    <span>RL Reward Convergence vs Epoch</span>
                    <span className="text-emerald-600 dark:text-emerald-400">Converged Policy</span>
                  </div>
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={trainingResult.rewardHistory}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="epoch" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="reward" 
                        stroke="#10b981" 
                        strokeWidth={2.5} 
                        dot={false}
                        name="RL Reward"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-border flex items-center justify-between bg-gray-50 dark:bg-dark-border/20">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Selected Dataset:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {selectedDatasetDetails?.name || selectedDatasetId}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleStartTraining}
              disabled={isTraining || isUploading}
              className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-primary-500/25 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isTraining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Training Policy ({trainingProgress}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Train RL Model on Custom Profile</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
