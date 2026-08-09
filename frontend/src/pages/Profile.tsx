import { useState, useEffect } from 'react';
import { 
  User, Lock, Bell, AlertTriangle, Upload, 
  Bookmark, Link, Code, Plus, Check, 
  Trash2, Key, Webhook 
} from 'lucide-react';
import { IconBrandGoogle, IconBrandGithub, IconBrandSlack } from '../components/shared/BrandIcons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  authApi, userApi, 
  billingApi, connectionsApi, developerApi 
} from '../lib/api';
import { clsx } from 'clsx';
import ProgressBar from '../components/shared/ProgressBar';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
}

interface NotificationSettings {
  emailOnTaskComplete: boolean;
  emailOnTaskFailed: boolean;
  emailDailySummary: boolean;
}

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState('account');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  
  // Account State
  const [profile, setProfile] = useState<ProfileData>({
    firstName: user?.name ? user.name.split(' ')[0] : '',
    lastName: user?.name ? user.name.split(' ').slice(1).join(' ') : '',
    email: user?.email || '',
  });

  // Security State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notifications State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailOnTaskComplete: true,
    emailOnTaskFailed: true,
    emailDailySummary: false
  });

  // Billing State
  const [subscription, setSubscription] = useState<any>(null);

  // Connections State
  const [connections, setConnections] = useState<any[]>([]);

  // Developer State
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newKeyDisplay, setNewKeyDisplay] = useState<string | null>(null);

  // Data Loading
  useEffect(() => {
    if (activeTab === 'notifications') loadNotificationSettings();
    if (activeTab === 'billing') loadSubscription();
    if (activeTab === 'connections') loadConnections();
    if (activeTab === 'developer') {
      loadApiKeys();
      loadWebhooks();
    }
  }, [activeTab]);

  // --- API Methods ---
  
  const loadNotificationSettings = async () => {
    try {
      const settings = await userApi.getSettings();
      if (settings) {
        setNotificationSettings({
          emailOnTaskComplete: settings.emailOnTaskComplete ?? true,
          emailOnTaskFailed: settings.emailOnTaskFailed ?? true,
          emailDailySummary: settings.emailDailySummary ?? false
        });
      }
    } catch (err) {
      toast.error('Error', 'Failed to load notification settings.');
    }
  };

  const loadSubscription = async () => {
    try {
      const data = await billingApi.getSubscription();
      setSubscription(data);
    } catch (err) {
      toast.error('Error', 'Failed to load billing details.');
    }
  };

  const loadConnections = async () => {
    try {
      const data = await connectionsApi.getConnections();
      setConnections(data);
    } catch (err) {
      toast.error('Error', 'Failed to load connections.');
    }
  };

  const loadApiKeys = async () => {
    try {
      const data = await developerApi.getApiKeys();
      setApiKeys(data);
    } catch (err) {
      toast.error('Error', 'Failed to load API keys.');
    }
  };

  const loadWebhooks = async () => {
    try {
      const data = await developerApi.getWebhooks();
      setWebhooks(data);
    } catch (err) {
      toast.error('Error', 'Failed to load Webhooks.');
    }
  };

  // --- Event Handlers ---

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await authApi.updateProfile({
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email,
      });
      toast.success('Profile updated', 'Your account details have been saved successfully.');
    } catch (error) {
      toast.error('Failed to save', 'Could not update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('Error', 'New passwords do not match.');
    }
    if (passwords.newPassword.length < 8) {
      return toast.error('Error', 'Password must be at least 8 characters.');
    }
    setIsSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Success', 'Password has been updated.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error('Failed', err?.response?.data?.error || 'Failed to change password.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await userApi.updateSettings(notificationSettings);
      toast.success('Success', 'Notification preferences updated.');
    } catch (err: any) {
      toast.error('Failed', 'Could not save notification preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    toast.error('Not Supported', 'Account deactivation is not supported in this environment.');
    setConfirmDeactivate(false);
  };

  const handleUpgradePlan = async (planType: 'Standard' | 'Enterprise') => {
    try {
      const res = await billingApi.upgradePlan(planType);
      setSubscription(res);
      toast.success('Success', `Successfully upgraded to ${planType} plan.`);
    } catch (err) {
      toast.error('Upgrade Failed', 'Could not upgrade plan.');
    }
  };

  const handleConnect = async (provider: string, accountName: string) => {
    try {
      await connectionsApi.addConnection(provider, accountName);
      toast.success('Connected', `Successfully linked ${provider} account.`);
      loadConnections();
    } catch (err) {
      toast.error('Failed', 'Could not add connection.');
    }
  };

  const handleRemoveConnection = async (id: string) => {
    try {
      await connectionsApi.removeConnection(id);
      toast.success('Success', 'Connection removed.');
      loadConnections();
    } catch (err) {
      toast.error('Failed', 'Could not remove connection.');
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName) return toast.error('Error', 'Key name is required.');
    try {
      const res = await developerApi.createApiKey(newKeyName);
      setNewKeyDisplay(res.rawKey);
      setNewKeyName('');
      loadApiKeys();
      toast.success('Success', 'API Key generated. Copy it now, it will not be shown again.');
    } catch (err) {
      toast.error('Failed', 'Could not generate API key.');
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await developerApi.deleteApiKey(id);
      toast.success('Deleted', 'API Key has been revoked.');
      loadApiKeys();
    } catch (err) {
      toast.error('Failed', 'Could not revoke API key.');
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl) return toast.error('Error', 'Endpoint URL is required.');
    try {
      await developerApi.createWebhook(newWebhookUrl, ['task.fail', 'node.down']);
      setNewWebhookUrl('');
      loadWebhooks();
      toast.success('Success', 'Webhook registered.');
    } catch (err: any) {
      toast.error('Failed', err.response?.data?.error || 'Could not register webhook.');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await developerApi.deleteWebhook(id);
      toast.success('Deleted', 'Webhook has been removed.');
      loadWebhooks();
    } catch (err) {
      toast.error('Failed', 'Could not remove webhook.');
    }
  };

  // UI Helpers
  const getConnection = (provider: string) => connections.find(c => c.provider === provider);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* ── TABS ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={User} label="Account" />
        <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={Lock} label="Security" />
        <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} icon={Bookmark} label="Billing & Plans" />
        <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={Bell} label="Notifications" />
        <TabButton active={activeTab === 'connections'} onClick={() => setActiveTab('connections')} icon={Link} label="Connections" />
        <TabButton active={activeTab === 'developer'} onClick={() => setActiveTab('developer')} icon={Code} label="Developer" />
      </div>

      <div className="animate-fade-in-up">
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Details</h3>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                    {user?.picture ? (
                      <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-primary-500">
                        {profile.firstName.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex gap-3 mb-2">
                      <button className="btn btn-primary flex items-center gap-2 px-5 py-2.5">
                        <Upload className="w-4 h-4" strokeWidth={1.5} />
                        Upload new photo
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Allowed JPG, GIF or PNG. Max size of 800K
                    </p>
                  </div>
                </div>

                <div className="w-full h-px bg-gray-200 dark:bg-gray-800 mb-8" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">First Name</label>
                    <input type="text" value={profile.firstName} onChange={e => setProfile(p => ({...p, firstName: e.target.value}))} className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1a2234] border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-900 dark:text-white transition-all outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Last Name</label>
                    <input type="text" value={profile.lastName} onChange={e => setProfile(p => ({...p, lastName: e.target.value}))} className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1a2234] border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-900 dark:text-white transition-all outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <input type="email" value={profile.email} onChange={e => setProfile(p => ({...p, email: e.target.value}))} className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1a2234] border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-900 dark:text-white transition-all outline-none" />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button onClick={handleSaveProfile} disabled={isSaving} className="btn btn-primary px-6 py-2.5 text-sm font-semibold">
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Account</h3>
              </div>
              <div className="p-6">
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded-lg p-4 mb-6 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" strokeWidth={1.5} />
                  <div>
                    <h4 className="text-orange-800 dark:text-orange-300 font-semibold mb-1 text-sm">Are you sure you want to delete your account?</h4>
                    <p className="text-orange-700 dark:text-orange-400 text-sm">Once you delete your account, there is no going back. Please be certain.</p>
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer group mb-6">
                  <input type="checkbox" checked={confirmDeactivate} onChange={(e) => setConfirmDeactivate(e.target.checked)} className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">I confirm my account deactivation</span>
                </label>
                <button onClick={handleDeactivate} disabled={!confirmDeactivate} className={clsx("btn px-6 py-2.5 text-sm font-semibold transition-all", confirmDeactivate ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 border-none" : "bg-red-500/50 text-white/70 cursor-not-allowed border-none")}>
                  Deactivate Account
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
                    <input type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({...p, currentPassword: e.target.value}))} placeholder="············" className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1a2234] border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
                    <input type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({...p, newPassword: e.target.value}))} placeholder="············" className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1a2234] border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
                    <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({...p, confirmPassword: e.target.value}))} placeholder="············" className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1a2234] border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleChangePassword} disabled={isSaving} className="btn btn-primary px-6 py-2.5">
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notification Settings</h3>
              <p className="text-sm text-gray-500">Configure how you receive alerts and updates.</p>
            </div>
            <div className="p-6">
               <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={notificationSettings.emailOnTaskComplete} onChange={e => setNotificationSettings(s => ({ ...s, emailOnTaskComplete: e.target.checked }))} className="w-5 h-5 rounded border-gray-300 text-primary-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Email me when a task completes</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={notificationSettings.emailOnTaskFailed} onChange={e => setNotificationSettings(s => ({ ...s, emailOnTaskFailed: e.target.checked }))} className="w-5 h-5 rounded border-gray-300 text-primary-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Email me when a task fails</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={notificationSettings.emailDailySummary} onChange={e => setNotificationSettings(s => ({ ...s, emailDailySummary: e.target.checked }))} className="w-5 h-5 rounded border-gray-300 text-primary-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Send me a daily summary report</span>
                  </label>
               </div>
               <div className="mt-8 flex gap-3">
                  <button onClick={handleSaveNotifications} disabled={isSaving} className="btn btn-primary px-6 py-2.5">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && subscription && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                 <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Current Plan</h3>
                          <p className="text-sm text-gray-500">Your current subscription details.</p>
                       </div>
                       <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                         {subscription.planType}
                       </span>
                    </div>
                    <div className="space-y-4">
                       <div>
                          <div className="flex justify-between text-sm mb-1.5">
                             <span className="font-semibold text-gray-700 dark:text-gray-300">Storage Usage</span>
                             <span className="font-bold text-gray-900 dark:text-white">{subscription.storageUsage.toFixed(1)} GB / {subscription.storageLimit} GB</span>
                          </div>
                          <ProgressBar value={(subscription.storageUsage / subscription.storageLimit) * 100} color="primary" height={8} />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                {subscription.planType !== 'Enterprise' && (
                 <div className="bg-primary-600 rounded-xl p-6 text-white shadow-xl shadow-primary-500/20">
                    <h3 className="text-lg font-bold mb-1">Enterprise Plan</h3>
                    <p className="text-primary-100 text-sm mb-6">For advanced research teams.</p>
                    <div className="flex items-baseline gap-1 mb-6">
                       <span className="text-3xl font-bold">$299</span>
                       <span className="text-primary-200 text-sm">/month</span>
                    </div>
                    <ul className="space-y-3 text-sm mb-8">
                       <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Unlimited Members</li>
                       <li className="flex items-center gap-2"><Check className="w-4 h-4" /> 500 GB Storage</li>
                       <li className="flex items-center gap-2"><Check className="w-4 h-4" /> 24/7 Priority Support</li>
                    </ul>
                    <button onClick={() => handleUpgradePlan('Enterprise')} className="w-full py-2.5 bg-white text-primary-600 font-bold rounded-lg hover:bg-gray-50 transition-colors">
                      Upgrade to Enterprise
                    </button>
                 </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">Connected Accounts</h3>
                   <p className="text-sm text-gray-500">Manage external third-party integrations.</p>
                </div>
                <div className="p-6 space-y-5">
                   <ConnectionItem 
                      icon={IconBrandGoogle} name="Google" 
                      connection={getConnection('Google')} 
                      onConnect={() => handleConnect('Google', user?.email || 'user@gmail.com')}
                      onRemove={() => handleRemoveConnection(getConnection('Google').id)}
                   />
                   <ConnectionItem 
                      icon={IconBrandSlack} name="Slack" 
                      connection={getConnection('Slack')} 
                      onConnect={() => handleConnect('Slack', 'Research Team Workspace')}
                      onRemove={() => handleRemoveConnection(getConnection('Slack').id)}
                   />
                   <ConnectionItem 
                      icon={IconBrandGithub} name="Github" 
                      connection={getConnection('Github')} 
                      onConnect={() => handleConnect('Github', 'github_researcher')}
                      onRemove={() => handleRemoveConnection(getConnection('Github').id)}
                   />
                </div>
             </div>
          </div>
        )}

        {activeTab === 'developer' && (
          <div className="space-y-6">
            {/* API Keys */}
            <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">API Keys</h3>
                    <p className="text-sm text-gray-500">Manage your secret keys for API access.</p>
                  </div>
               </div>
               <div className="p-6 space-y-4">
                  {newKeyDisplay && (
                    <div className="p-4 mb-4 bg-green-50 text-green-800 border border-green-200 rounded-lg">
                      <p className="font-bold mb-2">New API Key generated!</p>
                      <code className="block p-3 bg-white rounded border border-green-200 font-mono text-sm break-all">
                        {newKeyDisplay}
                      </code>
                      <p className="text-sm mt-2">Please copy this key now. It will not be shown again.</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3 mb-6">
                    <input 
                      type="text" 
                      value={newKeyName} 
                      onChange={e => setNewKeyName(e.target.value)} 
                      placeholder="e.g. CI/CD Pipeline Key" 
                      className="flex-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-primary-500 outline-none"
                    />
                    <button onClick={handleCreateApiKey} className="btn btn-primary flex items-center gap-2 px-4 shrink-0">
                      <Plus className="w-4 h-4" /> Create Key
                    </button>
                  </div>

                  {apiKeys.map(key => (
                    <div key={key.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl gap-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600">
                             <Key className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-gray-900 dark:text-white">{key.name}</p>
                             <p className="text-xs text-gray-500 font-mono">{key.prefix}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <button onClick={() => handleDeleteApiKey(key.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Webhooks */}
            <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Webhook className="w-5 h-5 text-primary-600" />
                      Webhooks
                    </h3>
                    <p className="text-sm text-gray-500">Receive real-time events on your server.</p>
                  </div>
               </div>
               <div className="p-6">
                  <div className="flex gap-3 mb-6">
                    <input 
                      type="text" 
                      value={newWebhookUrl} 
                      onChange={e => setNewWebhookUrl(e.target.value)} 
                      placeholder="https://your-server.com/webhook" 
                      className="flex-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-primary-500 outline-none"
                    />
                    <button onClick={handleCreateWebhook} className="btn btn-primary flex items-center gap-2 px-4 shrink-0">
                      <Plus className="w-4 h-4" /> Add Webhook
                    </button>
                  </div>

                  <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                           <tr className="border-b border-gray-100 dark:border-gray-800">
                              <th className="px-6 py-3 font-bold text-gray-600 dark:text-gray-400">Endpoint</th>
                              <th className="px-6 py-3 font-bold text-gray-600 dark:text-gray-400">Events</th>
                              <th className="px-6 py-3 font-bold text-gray-600 dark:text-gray-400">Status</th>
                              <th className="px-6 py-3 font-bold text-gray-600 dark:text-gray-400">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                           {webhooks.map(wh => (
                             <tr key={wh.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                <td className="px-6 py-4 font-mono text-xs text-primary-600">{wh.endpoint}</td>
                                <td className="px-6 py-4">
                                   <div className="flex flex-wrap gap-1">
                                      {wh.events.map((ev: string) => (
                                        <span key={ev} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-[10px] font-bold rounded">{ev}</span>
                                      ))}
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <span className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                                      <Check className="w-3 h-3" /> {wh.isActive ? 'Active' : 'Inactive'}
                                   </span>
                                </td>
                                <td className="px-6 py-4">
                                   <button onClick={() => handleDeleteWebhook(wh.id)} className="text-gray-400 hover:text-red-500">
                                     <Trash2 className="w-4 h-4" />
                                   </button>
                                </td>
                             </tr>
                           ))}
                           {webhooks.length === 0 && (
                             <tr>
                               <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No webhooks registered.</td>
                             </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all",
        active 
          ? "bg-primary-600 text-white shadow-md shadow-primary-500/20" 
          : "text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={1.5} />
      {label}
    </button>
  );
}

function ConnectionItem({ icon: Icon, name, connection, onConnect, onRemove }: { icon: any, name: string, connection?: any, onConnect: () => void, onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700">
           <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{name}</p>
          <p className="text-xs text-gray-500">{connection ? `Connected as ${connection.accountName}` : 'Not Connected'}</p>
        </div>
      </div>
      <div className="flex items-center">
        {connection ? (
          <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Disconnect">
            <Trash2 className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={onConnect} className="p-2 text-gray-400 hover:text-primary-500 transition-colors" title="Connect">
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
