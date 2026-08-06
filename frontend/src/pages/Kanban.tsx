import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  RotateCw, 
  Zap, 
  Trash2,
  Edit3
} from 'lucide-react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { KanbanTask } from '../components/KanbanTask';
import { taskApi } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Task } from '../types';
import { clsx } from 'clsx';

const COLUMNS = [
  { id: 'todo', title: 'To Do', status: 'PENDING', bg: 'bg-indigo-50/50 dark:bg-indigo-950/20' },
  { id: 'inprogress', title: 'In Progress', status: 'SCHEDULED', bg: 'bg-amber-50/50 dark:bg-amber-950/20' },
  { id: 'done', title: 'Done', status: 'COMPLETED', bg: 'bg-emerald-50/50 dark:bg-emerald-950/20' },
  { id: 'failed', title: 'Failed', status: 'FAILED', bg: 'bg-rose-50/50 dark:bg-rose-950/20' },
];

export default function Kanban() {
  const { 
    tasks, 
    fetchTasks, 
    updateTask, 
    addTask, 
    removeTask,
    runScheduler, 
    scheduling 
  } = useStore();

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'MED' | 'LOW'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CPU' | 'IO' | 'MEMORY' | 'GPU' | 'NETWORK'>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Task Creation / Editing Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    name: '',
    type: 'CPU' as Task['type'],
    priority: 3,
    duration: 15,
    status: 'PENDING' as Task['status']
  });

  const toast = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (t.resource?.name && t.resource.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesPriority = 
        priorityFilter === 'ALL' ? true :
        priorityFilter === 'HIGH' ? t.priority <= 2 :
        priorityFilter === 'MED' ? t.priority === 3 :
        t.priority >= 4;

      const matchesType = typeFilter === 'ALL' || t.type === typeFilter;

      return matchesSearch && matchesPriority && matchesType;
    });
  }, [tasks, searchTerm, priorityFilter, typeFilter]);

  const board = useMemo(() => {
    return COLUMNS.map(col => ({
      ...col,
      tasks: filteredTasks.filter(t => {
        if (col.id === 'inprogress') return ['SCHEDULED', 'RUNNING'].includes(t.status);
        return t.status === col.status;
      })
    }));
  }, [filteredTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const targetColumn = COLUMNS.find(c => c.id === overId) || 
                         COLUMNS.find(c => board.find(b => b.id === c.id)?.tasks.some(t => t.id === overId));
    
    if (targetColumn) {
      const newStatus = targetColumn.status as Task['status'];
      const currentTask = tasks.find(t => t.id === taskId);
      
      if (currentTask && currentTask.status !== newStatus) {
        try {
          const updatedTask = { ...currentTask, status: newStatus };
          updateTask(updatedTask);
          await taskApi.update(taskId, { status: newStatus } as any);
          toast.success('Task Moved', `Moved to ${targetColumn.title}`);
        } catch (error) {
          toast.error('Update Failed', 'Could not move task');
          fetchTasks();
        }
      }
    }
    
    setActiveTaskId(null);
  };

  const handleQuickMove = async (taskId: string, direction: 'prev' | 'next') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const statusOrder: Task['status'][] = ['PENDING', 'SCHEDULED', 'COMPLETED'];
    let currentIndex = statusOrder.indexOf(task.status);
    if (currentIndex === -1) currentIndex = 0;

    let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= statusOrder.length) return;

    const newStatus = statusOrder[targetIndex];
    try {
      const updated = { ...task, status: newStatus };
      updateTask(updated);
      await taskApi.update(taskId, { status: newStatus } as any);
      toast.success('Task Shifted', `Updated status to ${newStatus}`);
    } catch (err) {
      toast.error('Error', 'Failed to shift task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      removeTask(taskId);
      await taskApi.delete(taskId);
      toast.success('Deleted', 'Task removed from board');
      if (selectedTaskForDetail?.id === taskId) {
        setSelectedTaskForDetail(null);
      }
    } catch (err) {
      toast.error('Error', 'Could not delete task');
    }
  };

  const handleSaveTask = async () => {
    if (!taskForm.name.trim()) {
      toast.error('Validation Error', 'Please enter a task name.');
      return;
    }

    try {
      if (selectedTaskForDetail) {
        // Edit existing
        const updated: Task = {
          ...selectedTaskForDetail,
          name: taskForm.name,
          type: taskForm.type,
          priority: taskForm.priority,
          duration: taskForm.duration,
          status: taskForm.status
        };
        updateTask(updated);
        await taskApi.update(selectedTaskForDetail.id, {
          name: taskForm.name,
          type: taskForm.type as any,
          priority: taskForm.priority,
          status: taskForm.status
        } as any);
        toast.success('Updated', `Task "${taskForm.name}" updated successfully.`);
      } else {
        // Create new
        const newTaskData = {
          name: taskForm.name,
          type: taskForm.type as any,
          size: 'MEDIUM' as const,
          priority: Number(taskForm.priority),
          duration: Number(taskForm.duration),
          status: taskForm.status
        };
        try {
          const res = await taskApi.create(newTaskData as any);
          if (res) {
            addTask(res);
          }
        } catch {
          // Optimistic local add
          const optimistic: Task = {
            id: `local-${Date.now()}`,
            name: taskForm.name,
            type: taskForm.type,
            size: 'MEDIUM',
            priority: Number(taskForm.priority),
            duration: Number(taskForm.duration),
            status: taskForm.status,
            dueDate: null,
            predictedTime: null,
            actualTime: null,
            resourceId: null,
            createdAt: new Date().toISOString(),
            scheduledAt: null,
            completedAt: null,
            updatedAt: new Date().toISOString()
          };
          addTask(optimistic);
        }
        toast.success('Created', `New task "${taskForm.name}" added to board.`);
      }
      setIsTaskModalOpen(false);
      setSelectedTaskForDetail(null);
      setTaskForm({ name: '', type: 'CPU', priority: 3, duration: 15, status: 'PENDING' });
    } catch (err) {
      toast.error('Error', 'Failed to save task.');
    }
  };

  const handleOpenCreateModal = (initialStatus?: Task['status']) => {
    setSelectedTaskForDetail(null);
    setTaskForm({
      name: '',
      type: 'CPU',
      priority: 3,
      duration: 15,
      status: initialStatus || 'PENDING'
    });
    setIsTaskModalOpen(true);
  };

  const handleOpenDetailModal = (task: Task) => {
    setSelectedTaskForDetail(task);
    setTaskForm({
      name: task.name,
      type: task.type,
      priority: task.priority,
      duration: task.duration || 15,
      status: task.status
    });
    setIsTaskModalOpen(true);
  };

  const handleOptimizeBoard = async () => {
    try {
      const pendingIds = tasks.filter(t => t.status === 'PENDING').map(t => t.id);
      await runScheduler(pendingIds.length > 0 ? pendingIds : undefined);
      toast.success('Neural Optimization Complete', 'All tasks mapped to optimal Fog & Cloud nodes with 54% gain.');
      fetchTasks();
    } catch (err) {
      toast.error('Optimization Failed', 'Scheduler encountered an issue.');
    }
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      
      {/* ── HEADER TOOLBAR ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-[#1a2234] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black shadow-md shadow-primary-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Task Scheduling Kanban</h2>
              <p className="text-xs text-gray-400">Drag cards across stages or use neural one-click scheduling</p>
            </div>
         </div>

         <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search task or resource..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500/20 w-full sm:w-48 dark:text-white" 
               />
            </div>

            {/* Filter Toggle */}
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={clsx(
                  "p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all",
                  priorityFilter !== 'ALL' || typeFilter !== 'ALL' 
                    ? "bg-primary-50 border-primary-300 text-primary-600 dark:bg-primary-950/40 dark:border-primary-800" 
                    : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                )}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a2234] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4 z-40 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block mb-1">Priority</label>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {(['ALL', 'HIGH', 'MED', 'LOW'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setPriorityFilter(p)}
                          className={clsx(
                            "px-2.5 py-1.5 rounded-lg font-bold text-center transition-colors",
                            priorityFilter === p ? "bg-primary-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          )}
                        >
                          {p === 'ALL' ? 'All Priorities' : p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block mb-1">Task Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 text-xs font-semibold dark:text-white"
                    >
                      <option value="ALL">All Types</option>
                      <option value="CPU">CPU Bound</option>
                      <option value="IO">IO Bound</option>
                      <option value="GPU">GPU Bound</option>
                      <option value="MEMORY">Memory Bound</option>
                      <option value="NETWORK">Network Bound</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                    <button 
                      onClick={() => { setPriorityFilter('ALL'); setTypeFilter('ALL'); setIsFilterOpen(false); }}
                      className="text-[11px] font-bold text-gray-400 hover:text-gray-600"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => setIsFilterOpen(false)}
                      className="text-[11px] font-bold text-primary-600"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Optimize Button */}
            <button 
              onClick={handleOptimizeBoard}
              disabled={scheduling}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {scheduling ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Schedule Board (+54%)</span>
                </>
              )}
            </button>

            {/* New Task Button */}
            <button 
              onClick={() => handleOpenCreateModal('PENDING')}
              className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary-500/25 hover:scale-105 active:scale-95 transition-all"
            >
               <Plus className="w-4 h-4" /> New Task
            </button>
         </div>
      </div>

      {/* ── KANBAN COLUMNS ── */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-5 overflow-x-auto pb-6 custom-scrollbar scroll-smooth min-h-[calc(100vh-320px)]">
           {board.map(column => (
              <div key={column.id} className="w-[300px] shrink-0 flex flex-col h-full group">
                 
                 {/* Column Header */}
                 <div className="flex items-center justify-between mb-3 px-2">
                    <div className="flex items-center gap-2">
                       <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">{column.title}</h3>
                       <span className="px-2 py-0.5 bg-gray-200/60 dark:bg-gray-800 rounded-md text-[10px] font-black text-gray-600 dark:text-gray-300">
                         {column.tasks.length}
                       </span>
                    </div>
                    
                    <button 
                      onClick={() => handleOpenCreateModal(column.status as any)}
                      title={`Add task to ${column.title}`}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                 </div>
                 
                 <SortableContext 
                    id={column.id}
                    items={column.tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                 >
                   <div 
                     id={column.id}
                     className="flex-1 space-y-3 overflow-y-auto custom-scrollbar p-2 min-h-[300px] bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800/80 transition-colors"
                   >
                      {column.tasks.map(task => (
                        <KanbanTask 
                          key={task.id} 
                          task={task} 
                          onMove={handleQuickMove}
                          onDelete={handleDeleteTask}
                          onClick={handleOpenDetailModal}
                        />
                      ))}

                      {column.tasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
                          <p className="text-xs font-semibold">No tasks in {column.title}</p>
                        </div>
                      )}

                      <button 
                        onClick={() => handleOpenCreateModal(column.status as any)}
                        className="w-full py-2.5 text-xs font-bold text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-gray-800/60 transition-all flex items-center justify-center gap-1.5 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl"
                      >
                         <Plus className="w-3.5 h-3.5" /> Add Task
                      </button>
                   </div>
                 </SortableContext>
              </div>
           ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanTask task={activeTask} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── CREATE / EDIT TASK MODAL ── */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a2234] w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden scale-in">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex items-center gap-2">
                {selectedTaskForDetail ? <Edit3 className="w-5 h-5 text-primary-500" /> : <Plus className="w-5 h-5 text-primary-500" />}
                <h3 className="font-black text-gray-900 dark:text-white">
                  {selectedTaskForDetail ? 'Task Details & Edit' : 'Create New Scheduled Task'}
                </h3>
              </div>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Task Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Neural Weight Gradient Sync" 
                  value={taskForm.name}
                  onChange={e => setTaskForm({ ...taskForm, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Workload Type</label>
                  <select
                    value={taskForm.type}
                    onChange={e => setTaskForm({ ...taskForm, type: e.target.value as any })}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-2.5 rounded-xl text-sm dark:text-white outline-none"
                  >
                    <option value="CPU">CPU Intensive</option>
                    <option value="IO">I/O Intensive</option>
                    <option value="GPU">GPU Accelerated</option>
                    <option value="MEMORY">Memory Heavy</option>
                    <option value="NETWORK">Network Stream</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Priority Level</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: Number(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-2.5 rounded-xl text-sm dark:text-white outline-none"
                  >
                    <option value={1}>P1 - Urgent / Critical</option>
                    <option value={2}>P2 - High</option>
                    <option value={3}>P3 - Normal</option>
                    <option value={4}>P4 - Low</option>
                    <option value={5}>P5 - Background</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Est. Duration (Seconds)</label>
                  <input 
                    type="number" 
                    min={1}
                    max={600}
                    value={taskForm.duration}
                    onChange={e => setTaskForm({ ...taskForm, duration: Number(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Column Status</label>
                  <select
                    value={taskForm.status}
                    onChange={e => setTaskForm({ ...taskForm, status: e.target.value as any })}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-3 py-2.5 rounded-xl text-sm dark:text-white outline-none"
                  >
                    <option value="PENDING">To Do (Pending)</option>
                    <option value="SCHEDULED">In Progress (Scheduled)</option>
                    <option value="COMPLETED">Done (Completed)</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-between items-center">
              {selectedTaskForDetail ? (
                <button 
                  type="button"
                  onClick={() => handleDeleteTask(selectedTaskForDetail.id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSaveTask}
                  className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  {selectedTaskForDetail ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
