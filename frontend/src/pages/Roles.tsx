import { useState, useEffect } from 'react';
import { Users, Shield, Edit, Trash2, Plus, Search, Copy, MoreVertical, Loader2, Code } from 'lucide-react';
import { clsx } from 'clsx';
import { userApi } from '../lib/api';

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

  useEffect(() => {
    userApi.getAll()
      .then(res => setUsers(Array.isArray(res) ? res : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
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
                  <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all">
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* ADD ROLE CARD */}
          <div className="bg-white dark:bg-[#1a2234] rounded-2xl p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary-500/50 transition-all">
             <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8" />
             </div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Add New Role</h3>
             <p className="text-sm text-gray-500">Add role, if it does not exist.</p>
          </div>
        </div>
      )}

      {/* ── USER TABLE ── */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white">Team Members</h3>
           <div className="flex items-center gap-3">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input 
                    type="text" 
                    placeholder="Search member" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 w-64"
                 />
              </div>
              <button className="btn btn-primary px-5 py-2.5 flex items-center gap-2">
                 <Plus className="w-4 h-4" /> Add Member
              </button>
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
                        <img
                          className="h-10 w-10 rounded-full"
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=0D8ABC&color=ffffff&size=40`}
                          alt={user.name || user.email}
                        />
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{user.name || user.email.split('@')[0]}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                         <RoleIcon role={user.role} />
                         {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                        user.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : 
                        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      )}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                         <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors"><Edit className="w-4 h-4" /></button>
                         <button className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                         <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><MoreVertical className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleIcon({ role }: { role: string }) {
  if (role === 'ADMIN') return <Shield className="w-4 h-4 text-rose-600" />;
  if (role === 'USER') return <Code className="w-4 h-4 text-primary-600" />;
  if (role === 'VIEWER') return <Users className="w-4 h-4 text-amber-600" />;
  return <Users className="w-4 h-4 text-gray-600" />;
}
