import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  Mail, 
  Star, 
  Send, 
  Pencil, 
  Trash2, 
  Search, 
  Plus, 
  Paperclip, 
  Archive, 
  Reply, 
  Forward, 
  CheckCircle2, 
  MailOpen, 
  Sparkles, 
  Copy, 
  Tag 
} from 'lucide-react';
import { clsx } from 'clsx';
import { useToast } from '../contexts/ToastContext';

const QUICK_CONTACTS = [
  { name: 'Nova Core', email: 'nova@scheduler.cloud' },
  { name: 'Sarah Connor (DevOps)', email: 'sarah.dev@nebula.io' },
  { name: 'Dr. Alex Vance (ML)', email: 'alex.ml@cluster.ai' },
  { name: 'Cluster Telemetry', email: 'telemetry@fog.internal' },
];

export default function Email() {
  const { 
    mails, 
    mailLoading, 
    fetchMails, 
    sendMail, 
    toggleMailStar, 
    markMailRead, 
    updateMailLabel, 
    deleteMail 
  } = useStore();

  const [activeFolder, setActiveFolder] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({ recipients: '', subject: '', content: '' });
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const toast = useToast();

  useEffect(() => {
    fetchMails(activeFolder);
  }, [activeFolder, fetchMails]);

  const filteredMails = useMemo(() => {
    return mails.filter(m => {
      const matchesSearch =
        !searchTerm ||
        m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.sender?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.sender?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFolder === 'starred') return m.isStarred;
      if (activeFolder === 'sent') return m.label === 'SENT' || m.label === 'sent';
      if (activeFolder === 'drafts') return m.label === 'DRAFT' || m.label === 'drafts';
      if (activeFolder === 'trash') return m.label === 'TRASH' || m.label === 'trash';
      // Inbox
      return m.label === 'INBOX' || m.label === 'inbox' || !m.label;
    });
  }, [mails, searchTerm, activeFolder]);

  // Auto-select first email if none selected or selection was deleted
  useEffect(() => {
    if (filteredMails.length > 0 && !filteredMails.some(m => m.id === selectedMailId)) {
      setSelectedMailId(filteredMails[0].id);
    } else if (filteredMails.length === 0) {
      setSelectedMailId(null);
    }
  }, [filteredMails, selectedMailId]);

  const selectedMail = mails.find(m => m.id === selectedMailId);

  const handleSelectMail = (mail: any) => {
    setSelectedMailId(mail.id);
    if (!mail.isRead) {
      markMailRead(mail.id, true);
    }
  };

  const handleSend = async () => {
    if (!composeData.recipients || !composeData.subject) {
      toast.error('Validation Error', 'Please specify a recipient and subject.');
      return;
    }
    try {
      await sendMail({
        recipients: composeData.recipients.split(',').map(s => s.trim()),
        subject: composeData.subject,
        content: composeData.content
      });
      setIsComposeOpen(false);
      setComposeData({ recipients: '', subject: '', content: '' });
      setAttachedFiles([]);
      toast.success('Email Sent', 'Your message has been delivered.');
      if (activeFolder === 'sent') {
        fetchMails('sent');
      }
    } catch (error) {
      toast.error('Error', 'Failed to send email.');
    }
  };

  const handleToggleStar = (e: React.MouseEvent, mailId: string, currentStatus?: boolean) => {
    e.stopPropagation();
    toggleMailStar(mailId, !currentStatus);
    toast.success('Updated', !currentStatus ? 'Starred message' : 'Unstarred message');
  };

  const handleToggleRead = (mailId: string, currentRead?: boolean) => {
    markMailRead(mailId, !currentRead);
    toast.success('Updated', !currentRead ? 'Marked as read' : 'Marked as unread');
  };

  const handleMoveToTrash = async (mailId: string) => {
    if (activeFolder === 'trash') {
      await deleteMail(mailId);
      toast.success('Deleted', 'Email permanently deleted.');
    } else {
      await updateMailLabel(mailId, 'TRASH');
      toast.success('Moved to Trash', 'Email moved to trash folder.');
    }
  };

  const handleArchive = async (mailId: string) => {
    await updateMailLabel(mailId, 'ARCHIVE');
    toast.success('Archived', 'Email conversation moved to archive.');
  };

  const handleReply = (mail: any) => {
    setComposeData({
      recipients: mail.sender?.email || 'nova@scheduler.cloud',
      subject: mail.subject?.startsWith('Re:') ? mail.subject : `Re: ${mail.subject}`,
      content: `\n\n--- On ${new Date(mail.createdAt).toLocaleString()}, ${mail.sender?.name || 'Sender'} wrote: ---\n> ${mail.content?.split('\n').join('\n> ')}`
    });
    setIsComposeOpen(true);
  };

  const handleForward = (mail: any) => {
    setComposeData({
      recipients: '',
      subject: mail.subject?.startsWith('Fwd:') ? mail.subject : `Fwd: ${mail.subject}`,
      content: `\n\n---------- Forwarded message ---------\nFrom: ${mail.sender?.name} <${mail.sender?.email}>\nDate: ${new Date(mail.createdAt).toLocaleString()}\nSubject: ${mail.subject}\n\n${mail.content}`
    });
    setIsComposeOpen(true);
  };

  const handleCopyBody = (content?: string) => {
    if (content) {
      navigator.clipboard.writeText(content);
      toast.success('Copied', 'Email body copied to clipboard.');
    }
  };

  const handleAddAttachment = () => {
    const mockFiles = ['telemetry_report.pdf', 'fog_cluster_dump.json', 'neural_weights.bin', 'sla_audit.xlsx'];
    const chosen = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    if (!attachedFiles.includes(chosen)) {
      setAttachedFiles([...attachedFiles, chosen]);
      toast.success('Attached', `File ${chosen} added.`);
    }
  };

  const unreadCount = mails.filter(m => !m.isRead && m.label !== 'TRASH').length;

  const FOLDERS = [
    { id: 'inbox', name: 'Inbox', icon: Mail, count: unreadCount, color: 'text-primary-600' },
    { id: 'starred', name: 'Starred', icon: Star, count: mails.filter(m => m.isStarred).length, color: 'text-yellow-500' },
    { id: 'sent', name: 'Sent', icon: Send, count: 0, color: 'text-gray-500' },
    { id: 'drafts', name: 'Drafts', icon: Pencil, count: 0, color: 'text-amber-500' },
    { id: 'trash', name: 'Trash', icon: Trash2, count: 0, color: 'text-rose-500' },
  ];

  return (
    <div className="h-[calc(100vh-12rem)] animate-fade-in flex bg-white dark:bg-[#1a2234] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
      
      {/* ── SIDEBAR ── */}
      <aside className="w-64 border-r border-gray-100 dark:border-gray-800 flex flex-col shrink-0 bg-gray-50/50 dark:bg-[#131b2e]/50">
        <div className="p-5">
           <button 
             onClick={() => {
               setComposeData({ recipients: '', subject: '', content: '' });
               setAttachedFiles([]);
               setIsComposeOpen(true);
             }}
             className="w-full bg-primary-600 hover:bg-primary-500 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 hover:scale-[1.02] active:scale-95 transition-all"
           >
              <Plus className="w-5 h-5" /> 
              <span>Compose</span>
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 space-y-1.5 custom-scrollbar">
           {FOLDERS.map(folder => (
              <button 
                key={folder.id}
                onClick={() => { setActiveFolder(folder.id); setSelectedMailId(null); }}
                className={clsx(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                  activeFolder === folder.id 
                    ? "bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 shadow-sm" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/50"
                )}
              >
                 <div className="flex items-center gap-3">
                    <folder.icon className={clsx("w-5 h-5", activeFolder === folder.id ? "text-primary-600 dark:text-primary-400" : "text-gray-400")} />
                    <span>{folder.name}</span>
                 </div>
                 {folder.count > 0 && (
                    <span className="px-2 py-0.5 bg-primary-600 text-white rounded-lg text-[10px] font-black">
                       {folder.count}
                    </span>
                 )}
              </button>
           ))}

           <div className="pt-6 px-3">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
               <Tag className="w-3 h-3" /> Quick Contacts
             </span>
             <div className="space-y-1">
               {QUICK_CONTACTS.map((qc, i) => (
                 <button
                   key={i}
                   onClick={() => {
                     setComposeData({ recipients: qc.email, subject: '', content: '' });
                     setIsComposeOpen(true);
                   }}
                   className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white transition-colors truncate"
                 >
                   {qc.name}
                 </button>
               ))}
             </div>
           </div>
        </div>
      </aside>

      {/* ── EMAIL LIST ── */}
      <div className={clsx("border-r border-gray-100 dark:border-gray-800 flex flex-col min-w-0 transition-all duration-300", selectedMailId ? "w-96" : "flex-1")}>
         <header className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
            <div className="relative flex-1">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                  type="text" 
                  placeholder="Search emails, topics, senders..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all" 
               />
            </div>
         </header>

         <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-50 dark:divide-gray-800/50">
            {mailLoading ? (
              <div className="flex items-center justify-center h-48 text-primary-500">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
              </div>
            ) : filteredMails.map(mail => (
               <div 
                 key={mail.id} 
                 onClick={() => handleSelectMail(mail)}
                 className={clsx(
                  "p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-all cursor-pointer group relative",
                  selectedMailId === mail.id && "bg-primary-50/60 dark:bg-primary-500/10",
                  !mail.isRead && "bg-white dark:bg-[#1a2234]"
                 )}
               >
                  {!mail.isRead && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-600 rounded-full ring-4 ring-primary-500/20" />}
                  
                  <div className="flex items-center justify-between mb-1.5 pl-3">
                     <span className={clsx("text-sm truncate pr-2", !mail.isRead ? "font-black text-gray-900 dark:text-white" : "font-semibold text-gray-700 dark:text-gray-300")}>
                       {mail.sender?.name || 'System'}
                     </span>
                     <div className="flex items-center gap-2 shrink-0">
                       <button 
                         onClick={(e) => handleToggleStar(e, mail.id, mail.isStarred)}
                         className={clsx("p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors", mail.isStarred ? "text-amber-500" : "text-gray-300 hover:text-gray-500")}
                       >
                         <Star className={clsx("w-4 h-4", mail.isStarred && "fill-amber-500")} />
                       </button>
                       <span className="text-[10px] font-medium text-gray-400">
                         {new Date(mail.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                       </span>
                     </div>
                  </div>

                  <h4 className={clsx("text-xs truncate mb-1 pl-3", !mail.isRead ? "font-bold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300")}>
                    {mail.subject}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 pl-3">
                    {mail.content}
                  </p>
               </div>
            ))}

            {!mailLoading && filteredMails.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-3">
                  <Mail className="w-8 h-8 opacity-25" />
                </div>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">No emails in {activeFolder}</p>
                <p className="text-xs text-gray-400 mt-1">Compose a message or change folders.</p>
              </div>
            )}
         </div>

         <footer className="p-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-[#1a2234]">
            <p className="text-xs font-semibold text-gray-500">{filteredMails.length} messages listed</p>
         </footer>
      </div>

      {/* ── EMAIL VIEW ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50/30 dark:bg-[#0f172a]/20">
        {selectedMail ? (
          <>
            {/* Header Actions */}
            <header className="h-16 px-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-[#1a2234]">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleReply(selectedMail)}
                  title="Reply"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 flex items-center gap-1.5 text-xs font-bold transition-colors"
                >
                  <Reply className="w-4 h-4 text-primary-500" />
                  <span>Reply</span>
                </button>
                <button 
                  onClick={() => handleForward(selectedMail)}
                  title="Forward"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 flex items-center gap-1.5 text-xs font-bold transition-colors"
                >
                  <Forward className="w-4 h-4 text-primary-500" />
                  <span>Forward</span>
                </button>
                
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

                <button 
                  onClick={() => handleArchive(selectedMail.id)}
                  title="Archive"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 hover:text-primary-600 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleMoveToTrash(selectedMail.id)}
                  title="Move to Trash"
                  className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-gray-500 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => handleToggleStar(e, selectedMail.id, selectedMail.isStarred)}
                  title="Toggle Star"
                  className={clsx("p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors", selectedMail.isStarred ? "text-amber-500" : "text-gray-500")}
                >
                  <Star className={clsx("w-4 h-4", selectedMail.isStarred && "fill-amber-500")} />
                </button>
                <button 
                  onClick={() => handleToggleRead(selectedMail.id, selectedMail.isRead)}
                  title="Mark as Read/Unread"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 hover:text-primary-600 transition-colors"
                >
                  <MailOpen className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleCopyBody(selectedMail.content)}
                  title="Copy message content"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              </div>
            </header>

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-5 leading-tight">
                    {selectedMail.subject}
                  </h1>
                  
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-primary-500/20">
                        {selectedMail.sender?.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{selectedMail.sender?.name || 'System Notification'}</h4>
                        <p className="text-xs text-gray-500 font-medium">From: <span className="text-primary-600 dark:text-primary-400">{selectedMail.sender?.email || 'system@scheduler.cloud'}</span></p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-gray-400 block">{new Date(selectedMail.createdAt).toLocaleString()}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Delivered
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1a2234] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm leading-relaxed whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                  {selectedMail.content}
                </div>

                {/* Quick Reply Box */}
                <div className="p-4 bg-primary-50/50 dark:bg-primary-950/20 rounded-2xl border border-primary-100 dark:border-primary-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-primary-700 dark:text-primary-300 font-semibold">
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    <span>Quick response needed?</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleReply(selectedMail)}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Reply className="w-3.5 h-3.5" /> Reply to {selectedMail.sender?.name || 'Sender'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
             <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-4">
                <Mail className="w-10 h-10 opacity-25" />
             </div>
             <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Select a message from the left to read</p>
             <p className="text-xs text-gray-400 mt-1">Or click Compose to draft a new email.</p>
          </div>
        )}
      </div>

      {/* ── COMPOSE MODAL ── */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a2234] w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden scale-in flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary-500" />
                <h3 className="font-black text-gray-900 dark:text-white">New Message</h3>
              </div>
              <button onClick={() => setIsComposeOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">✕</button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">To (Email or Name)</label>
                <input 
                  type="text" 
                  placeholder="e.g. nova@scheduler.cloud, sarah.dev@nebula.io" 
                  value={composeData.recipients}
                  onChange={e => setComposeData({...composeData, recipients: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20" 
                />
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] text-gray-400 font-bold shrink-0">Quick add:</span>
                  {QUICK_CONTACTS.map((qc, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setComposeData({ ...composeData, recipients: composeData.recipients ? `${composeData.recipients}, ${qc.email}` : qc.email })}
                      className="text-[11px] font-semibold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-gray-600 dark:text-gray-300 rounded-lg shrink-0 transition-colors"
                    >
                      +{qc.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Subject</label>
                <input 
                  type="text" 
                  placeholder="Subject line" 
                  value={composeData.subject}
                  onChange={e => setComposeData({...composeData, subject: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Message</label>
                <textarea 
                  placeholder="Write your email body..." 
                  rows={8}
                  value={composeData.content}
                  onChange={e => setComposeData({...composeData, content: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 outline-none text-sm dark:text-white focus:ring-2 focus:ring-primary-500/20 resize-none"
                />
              </div>

              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {attachedFiles.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 rounded-lg text-xs font-bold border border-primary-200 dark:border-primary-800/60">
                      <Paperclip className="w-3 h-3" /> {f}
                      <button onClick={() => setAttachedFiles(attachedFiles.filter((_, idx) => idx !== i))} className="hover:text-rose-500 ml-1">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
              <button 
                type="button"
                onClick={handleAddAttachment}
                className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 flex items-center gap-1.5 text-xs font-bold transition-colors"
              >
                <Paperclip className="w-4 h-4" />
                <span>Attach file</span>
              </button>
              
              <div className="flex gap-2.5">
                <button 
                  type="button"
                  onClick={() => setIsComposeOpen(false)} 
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSend}
                  disabled={!composeData.recipients || !composeData.subject}
                  className="bg-primary-600 hover:bg-primary-500 text-white px-7 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-primary-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
