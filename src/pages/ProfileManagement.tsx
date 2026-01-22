import React, { useState, useEffect } from 'react';
import { 
  UserCircle, 
  Settings, 
  UserPlus, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  Cake,
  Edit2,
  Trash2,
  Loader2,
  X,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { blink } from '../lib/blink';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface TeamMember {
  id: string;
  username: string;
  mobile: string;
  role: 'super_admin' | 'sales_team';
  avatar?: string;
  dob?: string;
  date_joined: string;
  email?: string; // We'll get this from auth
}

export default function ProfileManagement() {
  const { user, userExtra, isAdmin, refreshUserExtra } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const fetchTeam = async () => {
    try {
      const data = await blink.db.table<TeamMember>('users_extra').list();
      setTeam(data);
    } catch (error) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await blink.db.table('users_extra').update(user!.id, {
        username: formData.get('username'),
        mobile: formData.get('mobile'),
        dob: formData.get('dob'),
        avatar: formData.get('avatar'),
      });
      await refreshUserExtra();
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;
    const role = formData.get('role') as any;

    try {
      setLoading(true);
      // Create auth user
      const { user: newUser } = await blink.auth.signUp({ email, password });
      
      // Create extra record
      await blink.db.table('users_extra').create({
        id: newUser.id,
        username,
        role,
        mobile: formData.get('mobile'),
        date_joined: new Date().toISOString(),
      });

      toast.success('Team member added');
      setShowAddMember(false);
      fetchTeam();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (id === user?.id) return toast.error("You can't delete your own account");
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    
    try {
      await blink.db.table('users_extra').delete(id);
      // Note: In a real app, you'd also delete the auth user via Admin API if available
      toast.success('Member removed');
      fetchTeam();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Team & Profile</h2>
        <p className="text-muted-foreground">Manage your own profile and team access levels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Profile */}
        <div className="lg:col-span-1 space-y-8">
          <div className="card-premium p-6">
            <h3 className="font-bold mb-6 flex items-center">
              <UserCircle className="h-5 w-5 mr-2" />
              My Profile
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-primary/20">
                    {userExtra?.avatar ? (
                      <img src={userExtra.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserCircle className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input 
                  name="username" 
                  defaultValue={userExtra?.username}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-100 dark:bg-zinc-900 opacity-60 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile</label>
                <input 
                  name="mobile" 
                  defaultValue={userExtra?.mobile}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Avatar URL</label>
                <input 
                  name="avatar" 
                  defaultValue={userExtra?.avatar}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">DOB</label>
                  <input 
                    name="dob" 
                    type="date"
                    defaultValue={userExtra?.dob}
                    className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Joined</label>
                  <p className="text-sm py-2 px-1 text-muted-foreground">
                    {userExtra?.date_joined ? new Date(userExtra.date_joined).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <button type="submit" className="w-full btn-primary mt-4">Save Changes</button>
            </form>
          </div>
        </div>

        {/* Team Management */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Organization Team
              </h3>
              {isAdmin && (
                <button 
                  onClick={() => setShowAddMember(true)}
                  className="btn-primary text-sm flex items-center py-2"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Team Member
                </button>
              )}
            </div>

            <div className="space-y-4">
              {team.map((member) => (
                <div key={member.id} className="p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                      {member.avatar ? (
                        <img src={member.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <UserCircle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold">{member.username}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          member.role === 'super_admin' ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-700"
                        )}>
                          {member.role.replace('_', ' ')}
                        </span>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Joined {new Date(member.date_joined).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Mobile</span>
                      <span className="font-medium">{member.mobile || 'N/A'}</span>
                    </div>
                    {isAdmin && member.id !== user?.id && (
                      <button 
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Add Team Member</h3>
              <button onClick={() => setShowAddMember(false)} className="p-1 hover:bg-secondary rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input name="username" required className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select name="role" required className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <option value="sales_team">Sales Team</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input name="email" type="email" required className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input name="password" type="password" required className="w-full px-3 py-2 border rounded-lg" minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile (Optional)</label>
                <input name="mobile" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowAddMember(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 btn-primary">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
