'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Building,
  Shield,
  Key,
  Save,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: number;
  email: string;
  username: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  roles: { id: number; name: string } | null;
  staff: { firstName: string; lastName: string } | null;
  students: { firstName: string; lastName: string } | null;
  parents: { guardianName: string } | null;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session?.user?.id]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${session?.user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEmail(data.email || '');
        setUsername(data.username || '');
      } else {
        toast.error('Failed to fetch profile');
      }
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username }),
      });

      if (res.ok) {
        toast.success('Profile updated successfully');
        fetchProfile();
        // Update session with new name
        await updateSession({ name: username });
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (!newPassword) {
      toast.error('New password is required');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      if (res.ok) {
        toast.success('Password changed successfully');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const getDisplayName = () => {
    if (profile?.staff) {
      return `${profile.staff.firstName} ${profile.staff.lastName}`;
    }
    if (profile?.students) {
      return `${profile.students.firstName} ${profile.students.lastName}`;
    }
    if (profile?.parents) {
      return profile.parents.guardianName;
    }
    return profile?.username || session?.user?.name || 'User';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View and manage your account settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Overview Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <User className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>{getDisplayName()}</CardTitle>
            <CardDescription>{profile?.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Badge variant={profile?.isActive ? 'default' : 'destructive'}>
                {profile?.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {profile?.roles && (
                <Badge variant="outline">{profile.roles.name}</Badge>
              )}
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building className="h-4 w-4" />
                <span>{session?.user?.schoolName || 'School'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>{session?.user?.role || 'User'}</span>
              </div>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground">
              <p>Last login: {formatDate(profile?.lastLogin || null)}</p>
              <p>Account created: {formatDate(profile?.createdAt || null)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Update your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your password and security settings</CardDescription>
          </CardHeader>
          <CardContent>
            {!showPasswordForm ? (
              <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            ) : (
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleChangePassword} disabled={changingPassword}>
                    {changingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
