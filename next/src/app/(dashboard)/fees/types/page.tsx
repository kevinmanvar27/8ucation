'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Loading, TableLoading } from '@/components/ui/loading';
import { 
  Plus, 
  Edit, 
  Trash2,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FeeType {
  id: string;
  name: string;
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function FeeTypesPage() {
  const { data: session } = useSession();
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFeeType, setEditingFeeType] = useState<FeeType | null>(null);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const fetchFeeTypes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/fees/types');
      const data = await res.json();
      
      if (data.success) {
        const feeTypesArray = data.data || [];
        setFeeTypes(Array.isArray(feeTypesArray) ? feeTypesArray : []);
      } else {
        toast.error(data.error || 'Failed to fetch fee types');
      }
    } catch (error) {
      toast.error('Failed to fetch fee types');
      setFeeTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      
      const url = editingFeeType ? `/api/fees/types/${editingFeeType.id}` : '/api/fees/types';
      const method = editingFeeType ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(editingFeeType ? 'Fee type updated successfully' : 'Fee type created successfully');
        setModalOpen(false);
        setEditingFeeType(null);
        setFormData({ name: '', code: '', description: '' });
        fetchFeeTypes();
      } else {
        toast.error(data.error || `Failed to ${editingFeeType ? 'update' : 'create'} fee type`);
      }
    } catch (error) {
      toast.error(`Failed to ${editingFeeType ? 'update' : 'create'} fee type`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee type?')) return;
    
    try {
      const res = await fetch(`/api/fees/types/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Fee type deleted successfully');
        fetchFeeTypes();
      } else {
        toast.error(data.error || 'Failed to delete fee type');
      }
    } catch (error) {
      toast.error('Failed to delete fee type');
    }
  };

  const openEditModal = (feeType: FeeType) => {
    setEditingFeeType(feeType);
    setFormData({
      name: feeType.name,
      code: feeType.code,
      description: feeType.description,
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingFeeType(null);
    setFormData({ name: '', code: '', description: '' });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Types</h1>
          <p className="text-muted-foreground">
            Manage different types of fees
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Fee Type
        </Button>
      </div>

      {/* Fee Types Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Fee Types</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading columns={4} rows={5} />
          ) : feeTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No fee types found</h3>
              <p className="text-muted-foreground">
                Get started by adding a new fee type
              </p>
              <Button onClick={openCreateModal} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Fee Type
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeTypes.map((feeType) => (
                    <TableRow key={feeType.id}>
                      <TableCell>
                        <p className="font-medium">{feeType.name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{feeType.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-muted-foreground">{feeType.description}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditModal(feeType)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(feeType.id)}
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

      {/* Fee Type Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingFeeType(null);
          setFormData({ name: '', code: '', description: '' });
        }}
        title={editingFeeType ? 'Edit Fee Type' : 'Add Fee Type'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="name"
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter fee type name"
            />
          </div>

          <div className="space-y-2">
            <Input
              id="code"
              label="Code *"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              placeholder="Enter fee type code"
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
                setEditingFeeType(null);
                setFormData({ name: '', code: '', description: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={processing}
            >
              {editingFeeType ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}