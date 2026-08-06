import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { Task } from '../types';
import { ArrowLeft, ArrowRight, Clock, Cpu, HardDrive, Trash2, Zap } from 'lucide-react';

interface KanbanTaskProps {
  task: Task;
  onMove?: (taskId: string, direction: 'prev' | 'next') => void;
  onDelete?: (taskId: string) => void;
  onClick?: (task: Task) => void;
}

export const KanbanTask: React.FC<KanbanTaskProps> = ({ 
  task, 
  onMove, 
  onDelete, 
  onClick 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityBadge = (priority: number) => {
    if (priority <= 2) {
      return "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50";
    }
    if (priority === 3) {
      return "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50";
    }
    return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50";
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={clsx(
        "bg-white dark:bg-[#1a2234] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-primary-500/40 transition-all group relative cursor-pointer",
        isDragging && "ring-2 ring-primary-500 shadow-xl"
      )}
      onClick={() => onClick && onClick(task)}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className={clsx(
            "px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1",
            task.type === 'CPU' ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400" :
            task.type === 'IO' ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" :
            task.type === 'GPU' ? "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400" :
            "bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400"
          )}>
            {task.type === 'CPU' && <Cpu className="w-2.5 h-2.5" />}
            {task.type === 'IO' && <HardDrive className="w-2.5 h-2.5" />}
            {task.type === 'GPU' && <Zap className="w-2.5 h-2.5" />}
            {task.type}
          </span>

          <span className={clsx("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase", getPriorityBadge(task.priority))}>
            P{task.priority}
          </span>
        </div>

        {/* Quick actions on card */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {onMove && (
            <button 
              onClick={() => onMove(task.id, 'prev')}
              title="Move left"
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600 rounded-md transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
          )}
          {onMove && (
            <button 
              onClick={() => onMove(task.id, 'next')}
              title="Move right"
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600 rounded-md transition-colors"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={() => onDelete(task.id)}
              title="Delete task"
              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-gray-400 hover:text-rose-500 rounded-md transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Drag handle area */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <h4 className="text-xs font-black text-gray-900 dark:text-white mb-1 leading-snug">{task.name}</h4>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {task.resource ? `Assigned to ${task.resource.name}` : 'Awaiting ML scheduler placement'}
        </p>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800/60 text-[10px] text-gray-400 font-medium">
         <div className="flex items-center gap-2">
            {task.predictedTime ? (
              <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-bold">
                <Clock className="w-2.5 h-2.5" /> {task.predictedTime.toFixed(1)}s
              </span>
            ) : (
              <span className="text-gray-400 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {(task.duration || 15).toFixed(0)}s
              </span>
            )}
         </div>

         <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-[9px] font-black text-white shadow-sm">
           {task.name.charAt(0)}
         </div>
      </div>
    </div>
  );
};
