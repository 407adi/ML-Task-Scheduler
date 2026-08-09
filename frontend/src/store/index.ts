import { create } from 'zustand';
import { Task, Resource, Metrics, User, Notification, ChatRoom, ChatMessage, MailMessage } from '../types';
import { taskApi, resourceApi, metricsApi, scheduleApi, userApi, notificationApi, mlApi, chaosApi } from '../lib/api';

const LOCAL_TASKS_KEY = 'ml-scheduler-local-tasks';

const loadLocalTasks = (): Task[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Task[];
  } catch {
    return [];
  }
};

const saveLocalTasks = (tasks: Task[]) => {
  if (typeof window === 'undefined') return;
  try {
    const localOnly = tasks.filter((t) => t.id.startsWith('local-'));
    localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(localOnly));
  } catch {
    // ignore storage errors
  }
};

const normalizeMail = (mail: any): MailMessage => ({
  id: mail?.id ?? `mail-${Date.now()}`,
  threadId: mail?.threadId ?? '',
  senderId: mail?.senderId ?? '',
  subject: mail?.subject ?? '',
  content: mail?.content ?? '',
  isRead: Boolean(mail?.isRead),
  isStarred: Boolean(mail?.isStarred),
  label: mail?.label ?? 'INBOX',
  createdAt: mail?.createdAt ?? new Date().toISOString(),
  sender: {
    id: mail?.sender?.id ?? mail?.senderId ?? 'unknown',
    name: mail?.sender?.name ?? 'System',
    email: mail?.sender?.email ?? 'unknown@example.com'
  },
  attachments: Array.isArray(mail?.attachments) ? mail.attachments : []
});


interface AppState {
  // Tasks
  tasks: Task[];
  tasksLoading: boolean;
  fetchTasks: (status?: string) => Promise<void>;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (id: string) => void;

  // Resources
  resources: Resource[];
  resourcesLoading: boolean;
  fetchResources: (status?: string) => Promise<void>;
  addResource: (resource: Resource) => void;
  updateResource: (resource: Resource) => void;
  removeResource: (id: string) => void;

  // Users
  users: User[];
  usersLoading: boolean;
  fetchUsers: () => Promise<void>;

  // Notifications
  notifications: Notification[];
  notificationsLoading: boolean;
  fetchNotifications: () => Promise<void>;

  // Metrics
  metrics: Metrics | null;
  metricsLoading: boolean;
  fetchMetrics: () => Promise<void>;

  // ML Management
  mlAvailable: boolean;
  mlModels: any[];
  trainingJobs: any[];
  mlConfig: any | null;
  mlDataLoading: boolean;
  checkMlStatus: () => Promise<void>;
  fetchMlData: () => Promise<void>;
  updateMlConfig: (data: any) => Promise<void>;
  runRetrain: (reason?: string) => Promise<void>;

  // Chaos Engineering
  chaosExperiments: any[];
  chaosLoading: boolean;
  fetchChaosData: () => Promise<void>;
  startChaosExperiment: (params: { service: string; type: string; value: number }) => Promise<void>;
  stopChaosExperiment: (params: { service: string; type: string }) => Promise<void>;

  // Chat Module
  chatRooms: ChatRoom[];
  activeRoomId: string | null;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  fetchChatRooms: () => Promise<void>;
  fetchChatMessages: (roomId: string) => Promise<void>;
  setActiveRoom: (roomId: string | null) => void;
  sendChatMessage: (roomId: string, content: string) => Promise<void>;
  receiveChatMessage: (message: ChatMessage) => void;

  // Mail Module
  mails: MailMessage[];
  mailLoading: boolean;
  fetchMails: (folder?: string) => Promise<void>;
  sendMail: (data: any) => Promise<void>;
  toggleMailStar: (id: string, isStarred: boolean) => Promise<void>;
  markMailRead: (id: string, isRead: boolean) => Promise<void>;
  updateMailLabel: (id: string, label: string) => Promise<void>;
  deleteMail: (id: string) => Promise<void>;

  // Scheduling
  scheduling: boolean;
  runScheduler: (taskIds?: string[]) => Promise<void>;

  // Error state
  error: string | null;
  clearError: () => void;
}

export const useStore = create<AppState>()((set, get) => ({
  // Tasks
  tasks: loadLocalTasks(),
  tasksLoading: false,
  fetchTasks: async (status?: string) => {
    set({ tasksLoading: true, error: null });
    try {
      const serverTasks = await taskApi.getAll(status);
      const localTasks = loadLocalTasks();
      set({ tasks: [...localTasks, ...serverTasks], tasksLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
      console.error('Failed to fetch tasks:', error);
      // Keep local tasks visible when backend fetch fails
      const localTasks = loadLocalTasks();
      set({ tasks: localTasks, tasksLoading: false, error: message });
      return;
    }
  },
  addTask: (task: Task) =>
    set((state: AppState) => {
      const nextTasks = [task, ...state.tasks];
      saveLocalTasks(nextTasks);
      return { tasks: nextTasks };
    }),
  updateTask: (task: Task) =>
    set((state: AppState) => {
      const nextTasks = state.tasks.map((t: Task) => (t.id === task.id ? task : t));
      saveLocalTasks(nextTasks);
      return { tasks: nextTasks };
    }),
  removeTask: (id: string) =>
    set((state: AppState) => {
      const nextTasks = state.tasks.filter((t: Task) => t.id !== id);
      saveLocalTasks(nextTasks);
      return { tasks: nextTasks };
    }),

  // Resources
  resources: [],
  resourcesLoading: false,
  fetchResources: async (status?: string) => {
    set({ resourcesLoading: true, error: null });
    try {
      const serverResources = await resourceApi.getAll(status);
      const resources = serverResources || [];
      set({ resources, resourcesLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch resources';
      console.error('Failed to fetch resources:', error);
      set({ resources: [], resourcesLoading: false, error: message });
    }
  },
  addResource: (resource: Resource) =>
    set((state: AppState) => ({ resources: [resource, ...state.resources] })),
  updateResource: (resource: Resource) =>
    set((state: AppState) => ({
      resources: state.resources.map((r: Resource) => (r.id === resource.id ? resource : r)),
    })),
  removeResource: (id: string) =>
    set((state: AppState) => ({
      resources: state.resources.filter((r: Resource) => r.id !== id),
    })),

  // Users
  users: [],
  usersLoading: false,
  fetchUsers: async () => {
    set({ usersLoading: true, error: null });
    try {
      const users = await userApi.getAll();
      set({ users, usersLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch users';
      set({ usersLoading: false, error: message });
    }
  },

  // Notifications
  notifications: [],
  notificationsLoading: false,
  fetchNotifications: async () => {
    set({ notificationsLoading: true, error: null });
    try {
      const notifications = await notificationApi.getAll();
      set({ notifications, notificationsLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
      set({ notificationsLoading: false, error: message });
    }
  },

  // Metrics
  metrics: null,
  metricsLoading: false,
  fetchMetrics: async () => {
    set({ metricsLoading: true, error: null });
    try {
      const metrics = await metricsApi.get();
      set({ metrics, metricsLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch metrics';
      console.error('Failed to fetch metrics:', error);
      set({ metricsLoading: false, error: message });
    }
  },

  // ML Management
  mlAvailable: false,
  mlModels: [],
  trainingJobs: [],
  mlConfig: null,
  mlDataLoading: false,
  checkMlStatus: async () => {
    try {
      const status = await scheduleApi.getMlStatus();
      set({ mlAvailable: status.mlServiceAvailable });
    } catch (error) {
      set({ mlAvailable: false });
    }
  },
  fetchMlData: async () => {
    set({ mlDataLoading: true, error: null });
    try {
      const statusPromise = scheduleApi.getMlStatus().catch(() => ({ mlServiceAvailable: false }));
      const [models, jobs, config, status] = await Promise.all([
        mlApi.getModels(),
        mlApi.getTrainingJobs(),
        mlApi.getConfig(),
        statusPromise,
      ]);
      set({
        mlModels: models,
        trainingJobs: jobs,
        mlConfig: config,
        mlAvailable: status.mlServiceAvailable,
        mlDataLoading: false
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch ML data';
      set({ mlDataLoading: false, error: message });
    }
  },
  updateMlConfig: async (data: any) => {
    try {
      const updated = await mlApi.updateConfig(data);
      set({ mlConfig: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update ML config';
      set({ error: message });
    }
  },
  runRetrain: async (reason?: string) => {
    try {
      await mlApi.runRetrain(reason);
      // Data will be refreshed via socket events
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run retraining';
      set({ error: message });
    }
  },

  // Chaos Engineering
  chaosExperiments: [],
  chaosLoading: false,
  fetchChaosData: async () => {
    set({ chaosLoading: true, error: null });
    try {
      const experiments = await chaosApi.getExperiments();
      set({ chaosExperiments: experiments, chaosLoading: false });
    } catch (error) {
      set({ chaosLoading: false });
    }
  },
  startChaosExperiment: async (params: { service: string; type: string; value: number }) => {
    try {
      await chaosApi.startExperiment(params);
      await get().fetchChaosData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start experiment';
      set({ error: message });
      throw error;
    }
  },
  stopChaosExperiment: async (params: { service: string; type: string }) => {
    try {
      await chaosApi.stopExperiment(params);
      await get().fetchChaosData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stop experiment';
      set({ error: message });
      throw error;
    }
  },

  // Chat Module
  chatRooms: [],
  activeRoomId: null,
  chatMessages: [],
  chatLoading: false,
  fetchChatRooms: async () => {
    const { chatApi } = await import('../lib/api');
    set({ chatLoading: true });
    try {
      const rooms = await chatApi.getRooms();
      set({ chatRooms: rooms, chatLoading: false });
    } catch (error) {
      set({ chatLoading: false });
    }
  },
  fetchChatMessages: async (roomId: string) => {
    const { chatApi } = await import('../lib/api');
    set({ chatLoading: true });
    try {
      const messages = await chatApi.getMessages(roomId);
      set({ chatMessages: messages, chatLoading: false });
    } catch (error) {
      set({ chatLoading: false });
    }
  },
  setActiveRoom: (roomId: string | null) => set({ activeRoomId: roomId }),
  sendChatMessage: async (roomId: string, content: string) => {
    const { chatApi } = await import('../lib/api');
    try {
      await chatApi.sendMessage(roomId, content);
      // Room will be updated via socket
    } catch (error) {
      set({ error: 'Failed to send message' });
    }
  },
  receiveChatMessage: (message: ChatMessage) => {
    set((state) => {
      // If message is for active room, append it
      if (state.activeRoomId === message.roomId) {
        return { chatMessages: [message, ...state.chatMessages] };
      }
      return state;
    });
  },

  // Mail Module
  mails: [],
  mailLoading: false,
  fetchMails: async (folder = 'inbox') => {
    const { mailApi } = await import('../lib/api');
    set({ mailLoading: true });
    
    const STARTER_MAILS = [
      {
        id: 'mail-welcome-1',
        subject: '🚀 ML Scheduler Optimization Report (+54% Gain)',
        content: 'Hello Team,\n\nThe Deep Reinforcement Learning optimizer has achieved a 54% efficiency gain over baseline heuristic methods this month.\n\nKey Highlights:\n- Makespan reduced from 124ms to 57ms\n- Fog Node Alpha & Beta load variance stabilized at ±4.2%\n- Zero task deadlines missed across 10,000 synthetic batches.\n\nRecommended Action: Allocate additional compute quotas to GPU-accelerated cuOpt tasks.\n\nBest regards,\nNova Multi-Agent Core',
        senderId: 'nova-system',
        sender: { name: 'Nova Core Orchestrator', email: 'nova@scheduler.cloud' },
        isRead: false,
        isStarred: true,
        label: 'INBOX',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'mail-welcome-2',
        subject: '⚡ Fog Node Cluster Alpha: Auto-scaling Alert',
        content: 'Notice:\n\nFog Node Cluster Alpha has dynamically provisioned 2 additional virtual worker instances to absorb incoming CPU-intensive workloads.\n\nTelemetry: Load: 42% | Latency: 3.1ms | RTT: 1.8ms.\n\nNo manual intervention required.',
        senderId: 'fog-monitor',
        sender: { name: 'Cluster Telemetry Bot', email: 'telemetry@fog.internal' },
        isRead: true,
        isStarred: false,
        label: 'INBOX',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'mail-welcome-3',
        subject: '🔒 Security Advisory: Certificate Rotation Completed',
        content: 'All internal TLS/SSL certificates for microservice inter-communication (Backend, ML-Service, Redis) have been successfully rotated.\n\nStatus: Verified and Healthy.',
        senderId: 'sec-team',
        sender: { name: 'DevOps Security Team', email: 'security@scheduler.cloud' },
        isRead: true,
        isStarred: false,
        label: 'INBOX',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    try {
      let fetched: any[] = [];
      if (folder === 'sent') fetched = await mailApi.getSent();
      else if (folder === 'drafts') fetched = await mailApi.getDrafts();
      else if (folder === 'starred') fetched = await mailApi.getStarred();
      else if (folder === 'trash') fetched = await mailApi.getTrash();
      else fetched = await mailApi.getInbox();

      const normalizedFetched = (Array.isArray(fetched) ? fetched : []).filter(Boolean).map(normalizeMail);

      set((state) => {
        // Merge fetched mails with existing state mails to avoid wiping out local user sent mails or starter mails
        const existingMap = new Map(state.mails.map(m => [m.id, m]));
        normalizedFetched.forEach(m => existingMap.set(m.id, m));
        
        let merged = Array.from(existingMap.values());
        if (merged.length === 0) {
          merged = STARTER_MAILS.map(normalizeMail);
        }

        return { mails: merged, mailLoading: false };
      });
    } catch (error) {
      console.warn('Mail fetch failed, preserving local state:', error);
      set((state) => ({
        mails: state.mails.length > 0 ? state.mails : STARTER_MAILS.map(normalizeMail),
        mailLoading: false
      }));
    }
  },
  sendMail: async (data: any) => {
    const { mailApi } = await import('../lib/api');
    const newMail: MailMessage = normalizeMail({
      id: `sent-${Date.now()}`,
      subject: data.subject,
      content: data.content,
      senderId: 'current-user',
      sender: { name: 'You (DevOps Lead)', email: 'me@scheduler.cloud' },
      isRead: true,
      isStarred: false,
      label: 'SENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    try {
      const sentMail = await mailApi.send(data);
      const finalMail = sentMail ? normalizeMail(sentMail) : newMail;
      set((state) => ({
        mails: [finalMail, ...state.mails.filter(m => m.id !== finalMail.id)]
      }));
    } catch (error) {
      // Store optimistically in local state if API call fails
      set((state) => ({
        mails: [newMail, ...state.mails.filter(m => m.id !== newMail.id)]
      }));
    }
  },
  toggleMailStar: async (id: string, isStarred: boolean) => {
    const { mailApi } = await import('../lib/api');
    set((state) => ({
      mails: state.mails.map((m) => (m.id === id ? { ...m, isStarred } : m))
    }));
    try {
      await mailApi.toggleStar(id, isStarred);
    } catch (err) {
      // local state already updated
    }
  },
  markMailRead: async (id: string, isRead: boolean) => {
    const { mailApi } = await import('../lib/api');
    set((state) => ({
      mails: state.mails.map((m) => (m.id === id ? { ...m, isRead } : m))
    }));
    try {
      await mailApi.markRead(id, isRead);
    } catch (err) {
      // local state already updated
    }
  },
  updateMailLabel: async (id: string, label: string) => {
    const { mailApi } = await import('../lib/api');
    set((state) => ({
      mails: state.mails.filter((m) => m.id !== id)
    }));
    try {
      await mailApi.updateLabel(id, label);
    } catch (err) {
      // local state already updated
    }
  },
  deleteMail: async (id: string) => {
    const { mailApi } = await import('../lib/api');
    set((state) => ({
      mails: state.mails.filter((m) => m.id !== id)
    }));
    try {
      await mailApi.delete(id);
    } catch (err) {
      // local state already updated
    }
  },

  // Scheduling
  scheduling: false,
  runScheduler: async (taskIds?: string[]) => {
    set({ scheduling: true, error: null });
    try {
      // Handle local-only tasks if present
      const localIds = taskIds?.filter((id) => id.startsWith('local-')) || [];
      const serverIds = taskIds?.filter((id) => !id.startsWith('local-'));

      if (localIds.length > 0) {
        const state = get();
        const availableResource = state.resources.find((r) => r.status === 'AVAILABLE') || ({ id: 'local-res-1', name: 'Local Resource', capacity: 100, currentLoad: 0, status: 'AVAILABLE', layer: 'FOG', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { tasks: 0 } } as unknown as Resource);
        const updatedTasks = state.tasks.map((t) => {
          if (localIds.includes(t.id)) {
            return {
              ...t,
              status: 'SCHEDULED' as const,
              resourceId: availableResource.id,
              resource: availableResource,
              scheduledAt: new Date().toISOString(),
              predictedTime: t.predictedTime || 45.0,
            };
          }
          return t;
        });
        saveLocalTasks(updatedTasks);
        set({ tasks: updatedTasks });
      }

      // Run backend scheduler for server tasks (or all tasks if taskIds is undefined)
      if (!taskIds || (serverIds && serverIds.length > 0)) {
        await scheduleApi.run(serverIds && serverIds.length > 0 ? serverIds : undefined);
      }

      // Refresh tasks and resources after scheduling
      await get().fetchTasks();
      await get().fetchResources();
      await get().fetchMetrics();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run scheduler';
      console.error('Failed to run scheduler:', error);
      set({ error: message });
    } finally {
      set({ scheduling: false });
    }
  },

  // Error state
  error: null,
  clearError: () => set({ error: null }),
}));
