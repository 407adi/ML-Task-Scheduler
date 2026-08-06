import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { aiApi } from '../lib/api';
import { 
  Search, 
  Paperclip, 
  Send, 
  Phone, 
  Video, 
  Bot, 
  UserPlus, 
  Sparkles, 
  Loader2, 
  Hash, 
  Users, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Trash2, 
  Volume2
} from 'lucide-react';
import { clsx } from 'clsx';
import { useToast } from '../contexts/ToastContext';

interface DemoChannel {
  id: string;
  name: string;
  type: 'AI' | 'CHANNEL' | 'DIRECT';
  description: string;
  role?: string;
  online: boolean;
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: string;
  }>;
}

const DEFAULT_CHANNELS: DemoChannel[] = [
  {
    id: 'nova',
    name: 'Nova AI Assistant',
    type: 'AI',
    description: 'Multi-Agent Neural Orchestrator (54% Gain)',
    online: true,
    messages: [
      {
        id: 'nova-init-1',
        senderId: 'nova-ai',
        senderName: 'Nova AI',
        content: "Hello! I am Nova, your Multi-Agent Orchestrator. The ML scheduler is currently operating with a **+54% efficiency gain** over heuristic baselines. How can I assist you with cluster allocation, DRL models, or node telemetry today?",
        createdAt: new Date(Date.now() - 1800000).toISOString()
      }
    ]
  },
  {
    id: 'chan-telemetry',
    name: 'cluster-telemetry',
    type: 'CHANNEL',
    description: 'Real-time Fog & Cloud node scheduler logs',
    online: true,
    messages: [
      {
        id: 'tel-1',
        senderId: 'sys-bot',
        senderName: 'Cluster Monitor',
        content: "📊 [AUTOSCALER] Fog-Node-A CPU load reached 82%. Re-balancing 4 queued tasks to Fog-Node-B.",
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'tel-2',
        senderId: 'sys-bot',
        senderName: 'Cluster Monitor',
        content: "⚡ [cuOpt Engine] Accelerated schedule completed in 1.4ms (99.8% resource convergence).",
        createdAt: new Date(Date.now() - 1200000).toISOString()
      }
    ]
  },
  {
    id: 'chan-devops',
    name: 'devops-team',
    type: 'CHANNEL',
    description: 'Infrastructure and deployment sync',
    online: true,
    messages: [
      {
        id: 'dev-1',
        senderId: 'sarah-c',
        senderName: 'Sarah Connor',
        content: "Hey team! TLS certificates rotation for microservices is complete. Let's run a test batch on the ML scheduler.",
        createdAt: new Date(Date.now() - 5400000).toISOString()
      },
      {
        id: 'dev-2',
        senderId: 'alex-v',
        senderName: 'Dr. Alex Vance',
        content: "Looking great! The DRL neural weights were updated for high-density I/O offloading.",
        createdAt: new Date(Date.now() - 2700000).toISOString()
      }
    ]
  },
  {
    id: 'user-sarah',
    name: 'Sarah Connor',
    type: 'DIRECT',
    role: 'Lead DevOps Engineer',
    description: 'Direct Message',
    online: true,
    messages: [
      {
        id: 'dm-s-1',
        senderId: 'sarah-c',
        senderName: 'Sarah Connor',
        content: "Hi! Can you check if the Redis cache latency stays below 2ms under the new 54% throughput load?",
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  },
  {
    id: 'user-alex',
    name: 'Dr. Alex Vance',
    type: 'DIRECT',
    role: 'ML Research Lead',
    description: 'Direct Message',
    online: true,
    messages: [
      {
        id: 'dm-a-1',
        senderId: 'alex-v',
        senderName: 'Dr. Alex Vance',
        content: "The latest IPSO-IACO benchmark results are in. We are seeing a 38% reduction in task makespan!",
        createdAt: new Date(Date.now() - 9000000).toISOString()
      }
    ]
  }
];

export default function Chat() {
  const { 
    fetchChatRooms, 
    fetchUsers
  } = useStore();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [channels, setChannels] = useState<DemoChannel[]>(() => {
    const saved = localStorage.getItem('ml_chat_channels');
    return saved ? JSON.parse(saved) : DEFAULT_CHANNELS;
  });

  const [selectedChannelId, setSelectedChannelId] = useState<string>('nova');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  // Modals
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync channels to localStorage
  useEffect(() => {
    localStorage.setItem('ml_chat_channels', JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    fetchChatRooms();
    fetchUsers();
  }, [fetchChatRooms, fetchUsers]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [channels, selectedChannelId, isAiThinking]);

  // Call timer
  useEffect(() => {
    let timer: any;
    if (isCallActive) {
      timer = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  const activeChannel = channels.find(c => c.id === selectedChannelId) || channels[0];

  const quickPrompts = [
    'Explain the 54% ML efficiency gain',
    'How should I allocate CPU-intensive tasks?',
    'What is the current cluster load status?',
    'Explain the IPSO + IACO algorithm pipeline'
  ];

  const handleSendQuery = async (customText?: string) => {
    const textToSend = (customText || message).trim();
    if (!textToSend) return;
    setMessage('');

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: currentUser?.id || 'demo-user-001',
      senderName: currentUser?.name || 'You (Lead)',
      content: textToSend,
      createdAt: new Date().toISOString()
    };

    setChannels(prev => prev.map(c => 
      c.id === selectedChannelId 
        ? { ...c, messages: [...c.messages, newMsg] } 
        : c
    ));

    // Handle Nova AI
    if (selectedChannelId === 'nova') {
      setIsAiThinking(true);
      try {
        const history = activeChannel.messages.slice(-6).map(m => ({
          role: m.senderId === 'nova-ai' ? ('assistant' as const) : ('user' as const),
          content: m.content
        }));

        const reply = await aiApi.chat(textToSend, history);
        
        const novaMsg = {
          id: `nova-${Date.now()}`,
          senderId: 'nova-ai',
          senderName: 'Nova AI',
          content: reply,
          createdAt: new Date().toISOString()
        };

        setChannels(prev => prev.map(c => 
          c.id === 'nova' 
            ? { ...c, messages: [...c.messages, novaMsg] } 
            : c
        ));
      } catch (err) {
        const fallbackText = "🤖 **Nova Multi-Agent Orchestrator:** The ML model is operating with +54% gain. All 3 fog clusters (Alpha, Beta, Gamma) are healthy.";
        const novaMsg = {
          id: `nova-${Date.now()}`,
          senderId: 'nova-ai',
          senderName: 'Nova AI',
          content: fallbackText,
          createdAt: new Date().toISOString()
        };
        setChannels(prev => prev.map(c => 
          c.id === 'nova' 
            ? { ...c, messages: [...c.messages, novaMsg] } 
            : c
        ));
      } finally {
        setIsAiThinking(false);
      }
      return;
    }

    // Auto-response simulation for team channels
    if (selectedChannelId === 'chan-telemetry') {
      setTimeout(() => {
        const botReply = {
          id: `bot-${Date.now()}`,
          senderId: 'sys-bot',
          senderName: 'Cluster Monitor',
          content: `⚡ [Telemetry ACK] Recorded query: "${textToSend}". Dynamic queue depth is nominal.`,
          createdAt: new Date().toISOString()
        };
        setChannels(prev => prev.map(c => 
          c.id === 'chan-telemetry' ? { ...c, messages: [...c.messages, botReply] } : c
        ));
      }, 800);
    } else if (selectedChannelId === 'user-sarah') {
      setTimeout(() => {
        const sarahReply = {
          id: `sarah-${Date.now()}`,
          senderId: 'sarah-c',
          senderName: 'Sarah Connor',
          content: `Got it! Running a health check on the worker instances now. Everything looks solid.`,
          createdAt: new Date().toISOString()
        };
        setChannels(prev => prev.map(c => 
          c.id === 'user-sarah' ? { ...c, messages: [...c.messages, sarahReply] } : c
        ));
      }, 1000);
    } else if (selectedChannelId === 'user-alex') {
      setTimeout(() => {
        const alexReply = {
          id: `alex-${Date.now()}`,
          senderId: 'alex-v',
          senderName: 'Dr. Alex Vance',
          content: `Awesome point. I will integrate that parameter into our next reinforcement learning training epoch.`,
          createdAt: new Date().toISOString()
        };
        setChannels(prev => prev.map(c => 
          c.id === 'user-alex' ? { ...c, messages: [...c.messages, alexReply] } : c
        ));
      }, 1200);
    }
  };

  const handleStartCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setIsCallActive(true);
    toast.success('Call Connected', `Simulated ${type} call with ${activeChannel.name}`);
  };

  const handleCreateNewDirectChat = (userName: string, userRole: string) => {
    const existing = channels.find(c => c.name.toLowerCase() === userName.toLowerCase());
    if (existing) {
      setSelectedChannelId(existing.id);
      setIsNewChatModalOpen(false);
      return;
    }

    const newChannel: DemoChannel = {
      id: `user-custom-${Date.now()}`,
      name: userName,
      type: 'DIRECT',
      role: userRole,
      description: 'Direct Message',
      online: true,
      messages: [
        {
          id: `init-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          content: `This is the start of your direct message history with ${userName}.`,
          createdAt: new Date().toISOString()
        }
      ]
    };

    setChannels(prev => [newChannel, ...prev]);
    setSelectedChannelId(newChannel.id);
    setIsNewChatModalOpen(false);
    toast.success('Conversation Created', `Chat opened with ${userName}`);
  };

  const handleClearHistory = () => {
    setChannels(prev => prev.map(c => 
      c.id === selectedChannelId ? { ...c, messages: [] } : c
    ));
    toast.success('History Cleared', 'Conversation history cleared.');
  };

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-white dark:bg-[#1a2234] rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xl animate-fade-in relative">
      
      {/* ── SIDEBAR ── */}
      <div className="w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-[#131b2e]/50 shrink-0">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black shadow-md shadow-primary-500/20">
                <Users className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-black text-gray-900 dark:text-white">MessageSquare</h1>
            </div>
            <button 
              onClick={() => setIsNewChatModalOpen(true)}
              title="Start New Conversation"
              className="p-2 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl transition-all"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
          {/* AI Assistant Item */}
          <button 
            onClick={() => setSelectedChannelId('nova')}
            className={clsx(
              "w-full p-3.5 rounded-2xl flex items-center gap-3 transition-all group relative",
              selectedChannelId === 'nova' 
                ? "bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-300 shadow-sm border border-primary-100 dark:border-primary-800/40" 
                : "hover:bg-gray-100/60 dark:hover:bg-gray-800/40"
            )}
          >
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
                <Bot className="w-6 h-6" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#1a2234] rounded-full animate-pulse" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex justify-between items-baseline">
                <span className="font-black text-sm text-gray-900 dark:text-white">Nova AI</span>
                <span className="text-[10px] text-primary-600 dark:text-primary-400 font-black tracking-wider uppercase bg-primary-100/60 dark:bg-primary-950/60 px-1.5 py-0.5 rounded">Live AI</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Multi-Agent Neural Orchestrator</p>
            </div>
          </button>

          {/* Section: Channels */}
          <div className="pt-3 pb-1 px-2 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span>Team Channels</span>
          </div>

          {filteredChannels.filter(c => c.type === 'CHANNEL').map(chan => (
            <button 
              key={chan.id}
              onClick={() => setSelectedChannelId(chan.id)}
              className={clsx(
                "w-full p-3 rounded-xl flex items-center gap-3 transition-all",
                selectedChannelId === chan.id 
                  ? "bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-300 font-bold" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/40"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold shrink-0">
                <Hash className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="text-xs font-bold truncate block text-gray-900 dark:text-white">#{chan.name}</span>
                <span className="text-[10px] text-gray-400 truncate block">{chan.description}</span>
              </div>
            </button>
          ))}

          {/* Section: Direct Messages */}
          <div className="pt-3 pb-1 px-2 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span>Direct Messages</span>
            <button onClick={() => setIsNewChatModalOpen(true)} className="hover:text-primary-500 text-xs font-bold">+</button>
          </div>

          {filteredChannels.filter(c => c.type === 'DIRECT').map(dm => (
            <button 
              key={dm.id}
              onClick={() => setSelectedChannelId(dm.id)}
              className={clsx(
                "w-full p-3 rounded-xl flex items-center gap-3 transition-all",
                selectedChannelId === dm.id 
                  ? "bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-300 font-bold" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/40"
              )}
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-black">
                  {dm.name.charAt(0)}
                </div>
                {dm.online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#1a2234] rounded-full" />}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold truncate text-gray-900 dark:text-white">{dm.name}</span>
                </div>
                <span className="text-[10px] text-gray-400 truncate block">{dm.role || 'Member'}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CHAT AREA ── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0f172a]/30 min-w-0">
        
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-[#1a2234]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-800/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
              {activeChannel.type === 'AI' ? <Bot className="w-6 h-6" /> : activeChannel.type === 'CHANNEL' ? <Hash className="w-5 h-5" /> : activeChannel.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-gray-900 dark:text-white text-sm">
                  {activeChannel.type === 'CHANNEL' ? `#${activeChannel.name}` : activeChannel.name}
                </h2>
                {activeChannel.type === 'AI' && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-md text-[10px] font-black">
                    Live Neural AI
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 font-medium">
                {activeChannel.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => handleStartCall('audio')}
              title="Start Audio Call"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 hover:text-primary-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleStartCall('video')}
              title="Start Video Call"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 hover:text-primary-600 transition-colors"
            >
              <Video className="w-4 h-4" />
            </button>
            <button 
              onClick={handleClearHistory}
              title="Clear Conversation"
              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-gray-400 hover:text-rose-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar" ref={scrollRef}>
          {activeChannel.messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id || msg.senderId === 'demo-user-001';
            const isNova = msg.senderId === 'nova-ai';

            return (
              <div key={msg.id} className={clsx("flex flex-col animate-fade-in", isMe ? "items-end" : "items-start")}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] font-bold text-gray-400">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <span className="text-[9px] text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className={clsx(
                  "max-w-[80%] p-4 rounded-2xl shadow-sm text-xs leading-relaxed whitespace-pre-wrap",
                  isMe 
                    ? "bg-primary-600 text-white rounded-tr-none shadow-primary-500/20" 
                    : isNova
                      ? "bg-gradient-to-br from-white to-gray-50 dark:from-[#1e293b] dark:to-[#0f172a] text-gray-900 dark:text-gray-100 border border-primary-100 dark:border-primary-900/40 rounded-tl-none"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700/60 rounded-tl-none"
                )}>
                  {msg.content}
                </div>
              </div>
            );
          })}

          {isAiThinking && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl rounded-tl-none border border-primary-200 dark:border-primary-800/60 flex items-center gap-3 shadow-md shadow-primary-500/5">
                <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                <span className="text-xs font-bold text-primary-600 dark:text-primary-400">Nova is computing response with live AI...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Prompts for Nova */}
        {selectedChannelId === 'nova' && (
          <div className="px-5 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar bg-gray-50/50 dark:bg-[#131b2e]/50">
            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Prompts:
            </span>
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendQuery(qp)}
                disabled={isAiThinking}
                className="whitespace-nowrap text-[11px] font-semibold px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 dark:hover:text-primary-400 transition-colors border border-gray-200 dark:border-gray-700 shrink-0 shadow-sm disabled:opacity-50"
              >
                {qp}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1a2234]">
          <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-2xl border border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => toast.success('Attachment', 'Simulated file drop attached.')}
              className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl text-gray-400 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendQuery())}
              placeholder={selectedChannelId === 'nova' ? "Ask Nova about 54% ML efficiency, task offloading, Fog nodes..." : `Message ${activeChannel.type === 'CHANNEL' ? '#' + activeChannel.name : activeChannel.name}...`} 
              className="flex-1 bg-transparent border-none focus:ring-0 text-xs py-1.5 resize-none max-h-24 min-h-[36px] dark:text-white outline-none"
            />

            <button 
              onClick={() => handleSendQuery()}
              disabled={!message.trim() || isAiThinking}
              className={clsx(
                "p-2.5 rounded-xl transition-all shadow-md",
                message.trim() && !isAiThinking
                  ? "bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/25 hover:scale-105 active:scale-95" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── NEW CONVERSATION MODAL ── */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a2234] w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden scale-in">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Start New Conversation</h3>
              </div>
              <button onClick={() => setIsNewChatModalOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select a team member to start chatting:</p>
              
              {[
                { name: 'Dr. Evelyn Reed', role: 'Chief AI Architect', email: 'evelyn@scheduler.cloud' },
                { name: 'Marcus Chen', role: 'Senior SRE / Cloud Lead', email: 'marcus@nebula.io' },
                { name: 'Elena Rostova', role: 'Distributed Systems Specialist', email: 'elena@cluster.ai' },
                { name: 'David Kim', role: 'Security & Compliance Analyst', email: 'david@scheduler.cloud' }
              ].map((user, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCreateNewDirectChat(user.name, user.role)}
                  className="w-full p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60 hover:bg-primary-50 dark:hover:bg-primary-950/30 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-primary-600">{user.name}</h4>
                      <p className="text-[10px] text-gray-400">{user.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">Chat →</span>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-end">
              <button 
                onClick={() => setIsNewChatModalOpen(false)} 
                className="px-5 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CALL SIMULATION MODAL ── */}
      {isCallActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#111827] text-white w-full max-w-lg rounded-3xl p-8 border border-gray-800 shadow-2xl flex flex-col items-center text-center scale-in relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-3xl font-black shadow-2xl shadow-primary-500/40 animate-pulse">
                {activeChannel.name.charAt(0)}
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-[#111827] rounded-full" />
            </div>

            <h3 className="text-xl font-black mb-1">{activeChannel.name}</h3>
            <p className="text-xs text-gray-400 mb-4">{callType === 'video' ? 'HD Video Call Connected' : 'Encrypted Voice Call Connected'}</p>

            <div className="px-4 py-1.5 bg-gray-800/80 rounded-full border border-gray-700 text-xs font-mono font-bold text-emerald-400 mb-8 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {formatCallTime(callDuration)}
            </div>

            {callType === 'video' && (
              <div className="w-full h-36 bg-gray-900 rounded-2xl mb-8 border border-gray-800 flex items-center justify-center relative overflow-hidden">
                <div className="flex flex-col items-center text-gray-500">
                  <Video className="w-8 h-8 mb-1" />
                  <span className="text-xs font-semibold">Video Stream 1080p 60fps</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", isMuted ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "bg-gray-800 hover:bg-gray-700 text-white")}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button 
                onClick={() => setIsCallActive(false)} 
                className="w-16 h-16 rounded-3xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button 
                onClick={() => toast.success('Volume', 'Speaker output adjusted')} 
                className="w-12 h-12 rounded-2xl bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-all"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
