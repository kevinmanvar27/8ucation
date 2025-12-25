'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Loading, TableLoading } from '@/components/ui/loading';
import { 
  Plus, 
  Edit, 
  Trash2,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FeeMaster {
  id: string;
  classId: string;
  groupId: string;
  typeId: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
  class: {
    name: string;
  };
  group: {
    name: string;
  };
  type: {
    name: string;
  };
}

interface ClassOption {
  id: string;
  name: string;
}

interface FeeGroup {
  id: string;
  name: string;
}

interface FeeType {
  id: string;
  name: string;
}

export default function FeeMasterPage() {
  const { data: session } = useSession();
  const [feeMasters, setFeeMasters] = useState<FeeMaster[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [feeGroups, setFeeGroups] = useState<FeeGroup[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFeeMaster, setEditingFeeMaster] = useState<FeeMaster | null>(null);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    classId: '',
    groupId: '',
    typeId: '',
    amount: '',
  });

  const fetchFeeMasters = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/fees/master');
      const data = await res.json();
      
      if (data.success) {
        setFeeMasters(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch fee masters');
      }
    } catch (error) {
      toast.error('Failed to fetch fee masters');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/academics/classes');
      const data = await res.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const fetchFeeGroups = async () => {
    try {
      const res = await fetch('/api/fees/groups');
      const data = await res.json();
      if (data.success) {
        setFeeGroups(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch fee groups');
    }
  };

  const fetchFeeTypes = async () => {
    try {
      const res = await fetch('/api/fees/types');
      const data = await res.json();
      if (data.success) {
        setFeeTypes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch fee types');
    }
  };

  useEffect(() => {
    fetchFeeMasters();
    fetchClasses();
    fetchFeeGroups();
    fetchFeeTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.classId || !formData.groupId || !formData.typeId || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      
      const url = editingFeeMaster ? `/api/fees/master/${editingFeeMaster.id}` : '/api/fees/master';
      const method = editingFeeMaster ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: formData.classId,
          groupId: formData.groupId,
          typeId: formData.typeId,
          amount: parseFloat(formData.amount),
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(editingFeeMaster ? 'Fee master updated successfully' : 'Fee master created successfully');
        setModalOpen(false);
        setEditingFeeMaster(null);
        setFormData({ classId: '', groupId: '', typeId: '', amount: '' });
        fetchFeeMasters();
      } else {
        toast.error(data.error || `Failed to ${editingFeeMaster ? 'update' : 'create'} fee master`);
      }
    } catch (error) {
      toast.error(`Failed to ${editingFeeMaster ? 'update' : 'create'} fee master`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee master record?')) return;
    
    try {
      const res = await fetch(`/api/fees/master/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Fee master deleted successfully');
        fetchFeeMasters();
      } else {
        toast.error(data.error || 'Failed to delete fee master');
      }
    } catch (error) {
      toast.error('Failed to delete fee master');
    }
  };

  const openEditModal = (feeMaster: FeeMaster) => {
    setEditingFeeMaster(feeMaster);
    setFormData({
      classId: feeMaster.classId,
      groupId: feeMaster.groupId,
      typeId: feeMaster.typeId,
      amount: feeMaster.amount.toString(),
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingFeeMaster(null);
    setFormData({ classId: '', groupId: '', typeId: '', amount: '' });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Master</h1>
          <p className="text-muted-foreground">
            Manage fee structures for different classes and groups
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Fee Structure
        </Button>
      </div>

      {/* Fee Masters Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Fee Structures</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading columns={5} rows={5} />
          ) : feeMasters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No fee structures found</h3>
              <p className="text-muted-foreground">
                Get started by adding a new fee structure
              </p>
              <Button onClick={openCreateModal} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Fee Structure
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeMasters.map((feeMaster) => (
                    <TableRow key={feeMaster.id}>
                      <TableCell>
                        <p className="font-medium">{feeMaster.class.name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{feeMaster.group.name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{feeMaster.type.name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">${feeMaster.amount.toFixed(2)}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditModal(feeMaster)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(feeMaster.id)}
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

      {/* Fee Master Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingFeeMaster(null);
          setFormData({ classId: '', groupId: '', typeId: '', amount: '' });
        }}
        title={editingFeeMaster ? 'Edit Fee Structure' : 'Add Fee Structure'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="classId">Class *</Label>
            <Select
              id="classId"
              value={formData.classId}
              onChange={(e) => setFormData({...formData, classId: e.target.value})}
              options={[
                { value: '', label: 'Select Class' },
                ...classes.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupId">Fee Group *</Label>
            <Select
              id="groupId"
              value={formData.groupId}
              onChange={(e) => setFormData({...formData, groupId: e.target.value})}
              options={[
                { value: '', label: 'Select Fee Group' },
                ...feeGroups.map(g => ({ value: g.id, label: g.name }))
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="typeId">Fee Type *</Label>
            <Select
              id="typeId"
              value={formData.typeId}
              onChange={(e) => setFormData({...formData, typeId: e.target.value})}
              options={[
                { value: '', label: 'Select Fee Type' },
                ...feeTypes.map(t => ({ value: t.id, label: t.name }))
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="pl-8"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingFeeMaster(null);
                setFormData({ classId: '', groupId: '', typeId: '', amount: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={processing}
            >
              {editingFeeMaster ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}