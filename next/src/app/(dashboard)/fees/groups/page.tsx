'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Loading, TableLoading } from '@/components/ui/loading';
import { 
  Plus, 
  Edit, 
  Trash2,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FeeGroup {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function FeeGroupsPage() {
  const { data: session } = useSession();
  const [feeGroups, setFeeGroups] = useState<FeeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFeeGroup, setEditingFeeGroup] = useState<FeeGroup | null>(null);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const fetchFeeGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/fees/groups');
      const data = await res.json();
      
      if (data.success) {
        setFeeGroups(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch fee groups');
      }
    } catch (error) {
      toast.error('Failed to fetch fee groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeGroups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      
      const url = editingFeeGroup ? `/api/fees/groups/${editingFeeGroup.id}` : '/api/fees/groups';
      const method = editingFeeGroup ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(editingFeeGroup ? 'Fee group updated successfully' : 'Fee group created successfully');
        setModalOpen(false);
        setEditingFeeGroup(null);
        setFormData({ name: '', description: '' });
        fetchFeeGroups();
      } else {
        toast.error(data.error || `Failed to ${editingFeeGroup ? 'update' : 'create'} fee group`);
      }
    } catch (error) {
      toast.error(`Failed to ${editingFeeGroup ? 'update' : 'create'} fee group`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee group?')) return;
    
    try {
      const res = await fetch(`/api/fees/groups/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Fee group deleted successfully');
        fetchFeeGroups();
      } else {
        toast.error(data.error || 'Failed to delete fee group');
      }
    } catch (error) {
      toast.error('Failed to delete fee group');
    }
  };

  const openEditModal = (feeGroup: FeeGroup) => {
    setEditingFeeGroup(feeGroup);
    setFormData({
      name: feeGroup.name,
      description: feeGroup.description,
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingFeeGroup(null);
    setFormData({ name: '', description: '' });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Groups</h1>
          <p className="text-muted-foreground">
            Manage fee groups for different categories of students
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Fee Group
        </Button>
      </div>

      {/* Fee Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Fee Groups</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading columns={3} rows={5} />
          ) : feeGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No fee groups found</h3>
              <p className="text-muted-foreground">
                Get started by adding a new fee group
              </p>
              <Button onClick={openCreateModal} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Fee Group
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeGroups.map((feeGroup) => (
                    <TableRow key={feeGroup.id}>
                      <TableCell>
                        <p className="font-medium">{feeGroup.name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-muted-foreground">{feeGroup.description}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditModal(feeGroup)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(feeGroup.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Group Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingFeeGroup(null);
          setFormData({ name: '', description: '' });
        }}
        title={editingFeeGroup ? 'Edit Fee Group' : 'Add Fee Group'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="name"
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter fee group name"
            />
          </div>

          <div className="space-y-2">
            <Input
              id="description"
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Enter description (optional)"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingFeeGroup(null);
                setFormData({ name: '', description: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={processing}
            >
              {editingFeeGroup ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}