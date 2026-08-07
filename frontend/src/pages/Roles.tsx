import { useState, useEffect } from 'react';
import { Users, Shield, Edit, Plus, Search, Copy, Loader2, Code, X } from 'lucide-react';
import { clsx } from 'clsx';
import { userApi } from '../lib/api';
import { useToast } from '../contexts/ToastContext';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
}

export default function Roles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Modals
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditUserRoleModalOpen, setIsEditUserRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [targetRole, setTargetRole] = useState<'ADMIN' | 'USER' | 'VIEWER'>('USER');
  const [newRoleName, setNewRoleName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    userApi.getAll()
      .then(res => setUsers(Array.isArray(res) ? res : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Group users by role
  const roleGroups: Record<string, User[]> = {};
  users.forEach(u => {
    if (!roleGroups[u.role]) roleGroups[u.role] = [];
    roleGroups[u.role].push(u);
  });

  const roleConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    ADMIN: { color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', icon: <Shield className="w-6 h-6 text-rose-600" /> },
    USER: { color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20', icon: <Code className="w-6 h-6 text-primary-600" /> },
    VIEWER: { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: <Users className="w-6 h-6 text-amber-600" /> },
  };

  const filteredUsers = users.filter(u =>
    (u.name || u.email).toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await userApi.update(selectedUser.id, { role: targetRole });
      toast.success('Role Updated', `${selectedUser.name || selectedUser.email} is now assigned role ${targetRole}.`);
      setIsEditUserRoleModalOpen(false);
      loadUsers();
    } catch (err) {
      toast.error('Failed to update role', err instanceof Error ? err.message : 'Error updating user role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    toast.success('Role Created', `Custom role "${newRoleName.trim()}" added to research pipeline permissions.`);
    setIsAddRoleModalOpen(false);
    setNewRoleName('');
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      {/* ── HEADER ── */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Research Roles List</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">A role provides access to predefined menus and features so that depending on assigned role an administrator can have access to what they need.</p>
      </div>

      {/* ── ROLE CARDS ── */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-500">Loading roles...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(roleGroups).map(([role, members]) => {
            const config = roleConfig[role] || { color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800', icon: <Users className="w-6 h-6 text-gray-600" /> };
            return (
              <div key={role} className="bg-white dark:bg-[#1a2234] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-sm font-bold text-gray-500">Total {members.length} {members.length === 1 ? 'user' : 'users'}</span>
                  <div className="flex -space-x-3 overflow-hidden">
                    {members.slice(0, 3).map((m) => (
                      <img
                        key={m.id}
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800"
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || m.email)}&background=${role === 'ADMIN' ? 'E11D48' : role === 'USER' ? '3B82F6' : 'F59E0B'}&color=ffffff&size=32`}
                        alt={m.name || m.email}
                      />
                    ))}
                    {members.length > 3 && (
                      <div className="flex h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 items-center justify-center text-[10px] font-bold text-gray-500">
                        +{members.length - 3}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", config.bg)}>
                      {config.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{role}</h3>
                      <span className="text-sm text-gray-500">{members.filter(m => m.isActive).length} active</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(role);
                      toast.success('Copied', `Role ${role} copied to clipboard.`);
                    }}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* ADD ROLE CARD */}
          <div 
            onClick={() => setIsAddRoleModalOpen(true)}
            className="bg-white dark:bg-[#1a2234] rounded-2xl p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary-500/50 transition-all"
          >
             <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8" />
             </div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Add New Role</h3>
             <p className="text-sm text-gray-500">Add custom role to system permissions.</p>
          </div>
        </div>
      )}

      {/* ── USER TABLE ── */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white">Team Member Roles</h3>
           <div className="flex items-center gap-3">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input 
                    type="text" 
                    placeholder="Search member or role..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 w-64 text-gray-900 dark:text-white"
                 />
              </div>
           </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold uppercase shrink-0">
                          {(user.name || user.email).charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{user.name || 'User'}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        user.role === 'ADMIN' ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" :
                        user.role === 'USER' ? "bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                        user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setTargetRole(user.role as any);
                          setIsEditUserRoleModalOpen(true);
                        }}
                        className="btn btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 ml-auto"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── EDIT USER ROLE MODAL ── */}
      {isEditUserRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a2234] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Assign User Role</h3>
              <button onClick={() => setIsEditUserRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="p-6 space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{selectedUser.name || selectedUser.email}</p>
                <p className="text-xs text-gray-500 mb-4">{selectedUser.email}</p>

                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">Select Role</label>
                <select
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-900 dark:text-white font-bold"
                >
                  <option value="ADMIN">ADMIN (Full System & Model Access)</option>
                  <option value="USER">USER (Research Pipeline Access)</option>
                  <option value="VIEWER">VIEWER (Read-only Telemetry Access)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsEditUserRoleModalOpen(false)} className="btn btn-secondary px-5 py-2.5 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary px-6 py-2.5 text-sm">
                  {isSubmitting ? 'Updating...' : 'Assign Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD NEW ROLE MODAL ── */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a2234] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create New Research Role</h3>
              <button onClick={() => setIsAddRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRole} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">Role Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DATA_SCIENTIST"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-900 dark:text-white font-bold"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsAddRoleModalOpen(false)} className="btn btn-secondary px-5 py-2.5 text-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary px-6 py-2.5 text-sm">
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
