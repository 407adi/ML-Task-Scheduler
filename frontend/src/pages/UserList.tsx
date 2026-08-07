import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store';
import { userApi } from '../lib/api';
import { Plus, Search, Edit, Trash2, Filter, Download, Shield, Server, Code, Eye, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useToast } from '../contexts/ToastContext';
import { User } from '../types';

const PERMISSION_OPTIONS = [
  'Manage Algorithm Lifecycle',
  'Trigger Distributed Benchmark',
  'View Real-time Node Telemetry',
  'Access Raw Dataset Logs',
  'Modify Fog Node Configs',
  'Export Experiment Results',
  'Manage System Security'
];

export default function UserList() {
  const { users, fetchUsers, usersLoading } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const toast = useToast();

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add User Form State
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'USER' | 'VIEWER',
    permissions: ['View Real-time Node Telemetry', 'Export Experiment Results'] as string[]
  });

  // Edit User Form State
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'USER' as 'ADMIN' | 'USER' | 'VIEWER',
    isActive: true,
    permissions: [] as string[]
  });

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const STATS = useMemo(() => [
    { label: 'Total Members', value: users.length, change: '+0%', icon: Shield, color: 'primary' },
    { label: 'Active Admins', value: users.filter(u => u.role === 'ADMIN').length, change: '+0', icon: Shield, color: 'success' },
    { label: 'Viewers', value: users.filter(u => u.role === 'VIEWER').length, change: '+0', icon: Eye, color: 'info' },
    { label: 'Registered Today', value: users.filter(u => u.isActive).length, change: 'Active', icon: Server, color: 'warning' },
  ], [users]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password) {
      toast.error('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await userApi.create({
        name: addForm.name,
        email: addForm.email,
        password: addForm.password,
        role: addForm.role
      });
      toast.success('User Created', `User ${addForm.name} (${addForm.role}) added successfully.`);
      setIsAddModalOpen(false);
      setAddForm({
        name: '',
        email: '',
        password: '',
        role: 'USER',
        permissions: ['View Real-time Node Telemetry', 'Export Experiment Results']
      });
      fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      toast.error('Creation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      role: user.role,
      isActive: user.isActive,
      permissions: user.role === 'ADMIN' 
        ? PERMISSION_OPTIONS 
        : user.role === 'USER' 
        ? ['View Real-time Node Telemetry', 'Trigger Distributed Benchmark', 'Export Experiment Results']
        : ['View Real-time Node Telemetry', 'Export Experiment Results']
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await userApi.update(selectedUser.id, {
        name: editForm.name,
        role: editForm.role,
        isActive: editForm.isActive
      });
      toast.success('User Updated', `User ${editForm.name} role set to ${editForm.role}.`);
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      toast.error('Update Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await userApi.delete(selectedUser.id);
      toast.success('User Deactivated', `User ${selectedUser.name || selectedUser.email} has been deactivated.`);
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete user';
      toast.error('Action Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (perm: string, isAddForm: boolean) => {
    if (isAddForm) {
      setAddForm(prev => ({
        ...prev,
        permissions: prev.permissions.includes(perm)
          ? prev.permissions.filter(p => p !== perm)
          : [...prev.permissions, perm]
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        permissions: prev.permissions.includes(perm)
          ? prev.permissions.filter(p => p !== perm)
          : [...prev.permissions, perm]
      }));
    }
  };

  if (usersLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map(stat => (
          <div key={stat.label} className="bg-white dark:bg-[#1a2234] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className={clsx(
              "p-4 rounded-xl",
              stat.color === 'primary' ? "bg-primary-50 text-primary-600" :
              stat.color === 'success' ? "bg-emerald-50 text-emerald-600" :
              stat.color === 'warning' ? "bg-amber-50 text-amber-600" :
              "bg-sky-50 text-sky-600"
            )}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
                <span className="text-xs font-bold text-emerald-500">{stat.change}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── USER TABLE ── */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-700 dark:text-gray-200 font-medium"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search users or emails..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 w-64 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const data = JSON.stringify(users, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'system-users.json';
                a.click();
              }}
              className="btn btn-secondary px-4 py-2 text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary px-5 py-2.5 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Assigned Role</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No users match your search or filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold uppercase shrink-0">
                          {(user.name || user.email).charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{user.name || 'Anonymous User'}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                        <RoleIcon role={user.role} />
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                        user.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                      )}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(user)}
                          title="Edit Role & Permissions"
                          className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(user)}
                          title="Deactivate User"
                          className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD USER MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a2234] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add System User</h3>
                  <p className="text-xs text-gray-500">Create account & assign role / permissions</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Alex Vance"
                  value={addForm.name}
                  onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex.vance@scheduler.cloud"
                  value={addForm.email}
                  onChange={e => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={addForm.password}
                  onChange={e => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">System Role</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-900 dark:text-white font-bold"
                >
                  <option value="USER">USER (Research Engineer)</option>
                  <option value="ADMIN">ADMIN (Full Pipeline Control)</option>
                  <option value="VIEWER">VIEWER (Read-only Telemetry)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">Assigned Permissions</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                  {PERMISSION_OPTIONS.map(perm => (
                    <label key={perm} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-lg">
                      <input
                        type="checkbox"
                        checked={addForm.permissions.includes(perm)}
                        onChange={() => togglePermission(perm, true)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary px-5 py-2.5 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
                  {isSubmitting ? 'Adding...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT USER & ROLE / PERMISSION MODAL ── */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a2234] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit User & Assign Permissions</h3>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">Assigned Role</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-900 dark:text-white font-bold"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="USER">USER</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">Account Status</label>
                  <select
                    value={editForm.isActive ? 'active' : 'disabled'}
                    onChange={e => setEditForm(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-900 dark:text-white font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">Granular Role Permissions</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {PERMISSION_OPTIONS.map(perm => (
                    <label key={perm} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-lg">
                      <input
                        type="checkbox"
                        checked={editForm.permissions.includes(perm)}
                        onChange={() => togglePermission(perm, false)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary px-5 py-2.5 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ── */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a2234] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 mx-auto flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Deactivate User Account</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to deactivate <strong className="text-gray-900 dark:text-white">{selectedUser.name || selectedUser.email}</strong>? They will no longer be able to log in or access the ML scheduler pipeline.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary px-5 py-2.5 text-sm">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md">
                {isSubmitting ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleIcon({ role }: { role: string }) {
  if (role === 'ADMIN') return <Shield className="w-4 h-4 text-rose-600" />;
  if (role === 'USER') return <Code className="w-4 h-4 text-emerald-600" />;
  if (role === 'VIEWER') return <Eye className="w-4 h-4 text-sky-600" />;
  return <Shield className="w-4 h-4 text-gray-400" />;
}
