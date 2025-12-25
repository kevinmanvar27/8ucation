'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Shield,
  Users,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id: number;
  name: string;
  slug: string;
  permissions: string[];
  isSystem: boolean;
  _count?: { staff: number };
}

const allPermissions = [
  { group: 'Dashboard', permissions: ['dashboard.view'] },
  { group: 'Students', permissions: ['students.view', 'students.create', 'students.edit', 'students.delete'] },
  { group: 'Staff', permissions: ['staff.view', 'staff.create', 'staff.edit', 'staff.delete'] },
  { group: 'Academics', permissions: ['academics.view', 'academics.manage'] },
  { group: 'Exams', permissions: ['exams.view', 'exams.manage', 'exams.results'] },
  { group: 'Finance', permissions: ['finance.view', 'finance.manage', 'finance.fees'] },
  { group: 'Transport', permissions: ['transport.view', 'transport.manage'] },
  { group: 'Hostel', permissions: ['hostel.view', 'hostel.manage'] },
  { group: 'Library', permissions: ['library.view', 'library.manage'] },
  { group: 'Reports', permissions: ['reports.view'] },
  { group: 'Settings', permissions: ['settings.view', 'settings.manage'] },
];

const defaultRole = {
  name: '',
  permissions: [] as string[],
};

export default function RolesSettingsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState(defaultRole);
  const [submitting, setSubmitting] = useState(false);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingRole ? 'Role updated' : 'Role created');
        fetchRoles();
        setIsDialogOpen(false);
        setEditingRole(null);
        setFormData(defaultRole);
      } else {
        toast.error('Failed to save role');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      permissions: role.permissions || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Role deleted');
        fetchRoles();
      } else {
        toast.error('Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const toggleGroupPermissions = (permissions: string[]) => {
    const allSelected = permissions.every(p => formData.permissions.includes(p));
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !permissions.includes(p))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: Array.from(new Set([...prev.permissions, ...permissions]))
      }));
    }
  };

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormData(defaultRole);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage user roles and their permissions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Edit Role' : 'Add New Role'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Teacher, Accountant"
                  required
                />
              </div>
              <div className="space-y-4">
                <Label>Permissions</Label>
                {allPermissions.map((group) => (
                  <div key={group.group} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        checked={group.permissions.every(p => formData.permissions.includes(p))}
                        onCheckedChange={() => toggleGroupPermissions(group.permissions)}
                      />
                      <Label className="font-medium">{group.group}</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-6">
                      {group.permissions.map((permission) => (
                        <div key={permission} className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.permissions.includes(permission)}
                            onCheckedChange={() => togglePermission(permission)}
                          />
                          <Label className="text-sm font-normal">
                            {permission.split('.')[1]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingRole ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Permissions Dialog */}
      <Dialog open={!!viewingRole} onOpenChange={() => setViewingRole(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Permissions for {viewingRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {viewingRole?.permissions?.length ? (
              <div className="flex flex-wrap gap-2">
                {viewingRole.permissions.map((p) => (
                  <Badge key={p} variant="secondary">{p}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No permissions assigned</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No roles found. Create your first role.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="text-muted-foreground">{role.slug}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {role._count?.staff || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingRole(role)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        {role.permissions?.length || 0} permissions
                      </Button>
                    </TableCell>
                    <TableCell>
                      {role.isSystem ? (
                        <Badge variant="secondary">System</Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(role)}
                          disabled={role.isSystem}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(role.id)}
                          disabled={role.isSystem}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
