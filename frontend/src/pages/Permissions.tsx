import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, AlertCircle, Settings, Database, BarChart2, Cpu, Lock, Loader2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { userApi } from '../lib/api';
import { useToast } from '../contexts/ToastContext';

interface PermissionItem {
  id: number;
  name: string;
  roles: string[];
  createdDate: string;
}

const INITIAL_PERMISSIONS: PermissionItem[] = [
  { id: 1, name: 'Manage Algorithm Lifecycle', roles: ['ADMIN'], createdDate: '14 Apr 2024, 08:43 PM' },
  { id: 2, name: 'Trigger Distributed Benchmark', roles: ['ADMIN', 'USER'], createdDate: '12 Apr 2024, 10:20 AM' },
  { id: 3, name: 'View Real-time Node Telemetry', roles: ['ADMIN', 'USER', 'VIEWER'], createdDate: '10 Apr 2024, 09:15 AM' },
  { id: 4, name: 'Access Raw Dataset Logs', roles: ['ADMIN', 'USER'], createdDate: '08 Apr 2024, 04:30 PM' },
  { id: 5, name: 'Modify Fog Node Configs', roles: ['ADMIN'], createdDate: '06 Apr 2024, 11:00 AM' },
  { id: 6, name: 'Export Experiment Results', roles: ['ADMIN', 'USER', 'VIEWER'], createdDate: '04 Apr 2024, 02:45 PM' },
  { id: 7, name: 'Manage System Security', roles: ['ADMIN'], createdDate: '02 Apr 2024, 05:30 PM' },
];

interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function Permissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [permissions, setPermissions] = useState<PermissionItem[]>(INITIAL_PERMISSIONS);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPerm, setSelectedPerm] = useState<PermissionItem | null>(null);

  const [newPermName, setNewPermName] = useState('');
  const [newPermRoles, setNewPermRoles] = useState<string[]>(['ADMIN', 'USER']);

  const [editRoles, setEditRoles] = useState<string[]>([]);

  useEffect(() => {
    userApi.getAll()
      .then(res => setUsers(Array.isArray(res) ? res : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const roleCounts: Record<string, number> = {};
  users.forEach(u => {
    roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
  });

  const filteredPermissions = permissions.filter(perm =>
    perm.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermName.trim()) return;

    const newItem: PermissionItem = {
      id: Date.now(),
      name: newPermName.trim(),
      roles: newPermRoles,
      createdDate: new Date().toLocaleString()
    };

    setPermissions(prev => [newItem, ...prev]);
    toast.success('Permission Created', `Permission "${newItem.name}" added successfully.`);
    setIsAddModalOpen(false);
    setNewPermName('');
    setNewPermRoles(['ADMIN', 'USER']);
  };

  const openEditModal = (perm: PermissionItem) => {
    setSelectedPerm(perm);
    setEditRoles([...perm.roles]);
    setIsEditModalOpen(true);
  };

  const handleEditPermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerm) return;

    setPermissions(prev => prev.map(p => 
      p.id === selectedPerm.id ? { ...p, roles: editRoles } : p
    ));

    toast.success('Permission Updated', `Roles for "${selectedPerm.name}" updated.`);
    setIsEditModalOpen(false);
  };

  const handleDeletePermission = (id: number, name: string) => {
    setPermissions(prev => prev.filter(p => p.id !== id));
    toast.success('Permission Removed', `Permission "${name}" deleted.`);
  };

  const toggleRoleInList = (role: string, isAdd: boolean) => {
    if (isAdd) {
      setNewPermRoles(prev => 
        prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
      );
    } else {
      setEditRoles(prev => 
        prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
      );
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Research Permissions</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and assign granular permissions for the ML Task Scheduler research pipeline.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary px-6 py-3 flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-5 h-5" /> Add Permission
        </button>
      </div>

      {/* ── ROLE SUMMARY CARDS ── */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-500">Loading user roles...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['ADMIN', 'USER', 'VIEWER'].map(role => (
            <div key={role} className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  role === 'ADMIN' ? "bg-rose-100 dark:bg-rose-900/20" :
                  role === 'USER' ? "bg-primary-100 dark:bg-primary-900/20" :
                  "bg-gray-100 dark:bg-gray-800"
                )}>
                  <Lock className={clsx(
                    "w-5 h-5",
                    role === 'ADMIN' ? "text-rose-600" :
                    role === 'USER' ? "text-primary-600" :
                    "text-gray-500"
                  )} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{role}</h3>
                  <p className="text-sm text-gray-500">{roleCounts[role] || 0} users</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── INFO ALERT ── */}
      <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl">
         <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
         <div className="text-sm">
            <h4 className="font-bold text-amber-900 dark:text-amber-400 mb-1">Important Note!</h4>
            <p className="text-amber-700 dark:text-amber-500/80">Changing permission settings dynamically updates system RBAC authorization across algorithm & benchmark tasks.</p>
         </div>
      </div>

      {/* ── PERMISSIONS TABLE ── */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search Permission" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 w-72 text-gray-900 dark:text-white"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Assigned Roles</th>
                <th className="px-6 py-4">Users with Access</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredPermissions.map(perm => {
                const accessCount = perm.roles.reduce((sum, r) => sum + (roleCounts[r] || 0), 0);
                return (
                  <tr key={perm.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <PermissionIcon name={perm.name} />
                         <span className="text-sm font-bold text-gray-900 dark:text-white">{perm.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {perm.roles.map(role => (
                          <span 
                            key={role} 
                            className={clsx(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                              role === 'ADMIN' ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                              role === 'USER' ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400" :
                              "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            )}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-semibold">{accessCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{perm.createdDate}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                         <button onClick={() => openEditModal(perm)} className="p-2 text-gray-400 hover:text-primary-600 transition-colors"><Edit className="w-4 h-4" /></button>
                         <button onClick={() => handleDeletePermission(perm.id, perm.name)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD PERMISSION MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a2234] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Permission</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPermission} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">Permission Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Execute cuOpt Acceleration"
                  value={newPermName}
                  onChange={e => setNewPermName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">Assign to Roles</label>
                <div className="flex items-center gap-4">
                  {['ADMIN', 'USER', 'VIEWER'].map(role => (
                    <label key={role} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPermRoles.includes(role)}
                        onChange={() => toggleRoleInList(role, true)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-bold text-xs">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary px-5 py-2.5 text-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary px-6 py-2.5 text-sm">
                  Create Permission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT PERMISSION ROLES MODAL ── */}
      {isEditModalOpen && selectedPerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a2234] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Permission Access</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditPermission} className="p-6 space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{selectedPerm.name}</p>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">Toggle Roles with Access</label>
                <div className="flex items-center gap-4">
                  {['ADMIN', 'USER', 'VIEWER'].map(role => (
                    <label key={role} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editRoles.includes(role)}
                        onChange={() => toggleRoleInList(role, false)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-bold text-xs">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary px-5 py-2.5 text-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary px-6 py-2.5 text-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PermissionIcon({ name }: { name: string }) {
  if (name.includes('Algorithm')) return <Settings className="w-5 h-5 text-primary-600" />;
  if (name.includes('Benchmark')) return <Cpu className="w-5 h-5 text-emerald-600" />;
  if (name.includes('Telemetry')) return <BarChart2 className="w-5 h-5 text-sky-600" />;
  if (name.includes('Dataset')) return <Database className="w-5 h-5 text-amber-600" />;
  if (name.includes('Security')) return <Lock className="w-5 h-5 text-rose-600" />;
  return <AlertCircle className="w-5 h-5 text-gray-400" />;
}
