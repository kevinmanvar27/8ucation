'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

interface Designation {
  id: number;
  name: string;
  _count: {
    staff: number;
  };
}

export default function DesignationsPage() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState<Designation | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({ name: '' });

  const fetchDesignations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/staff/designations');
      const data = await res.json();
      if (data.success) {
        setDesignations(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch designations');
      }
    } catch (error) {
      toast.error('Failed to fetch designations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  const filteredDesignations = designations.filter(desig =>
    desig.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({ name: '' });
    setShowAddModal(true);
  };

  const handleEdit = (designation: Designation) => {
    setSelectedDesignation(designation);
    setFormData({ name: designation.name });
    setShowEditModal(true);
  };

  const handleDelete = (designation: Designation) => {
    setSelectedDesignation(designation);
    setShowDeleteModal(true);
  };

  const handleSubmitAdd = async () => {
    if (!formData.name.trim()) {
      toast.error('Designation name is required');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/staff/designations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Designation created successfully');
        setShowAddModal(false);
        fetchDesignations();
      } else {
        toast.error(data.error || 'Failed to create designation');
      }
    } catch (error) {
      toast.error('Failed to create designation');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!formData.name.trim() || !selectedDesignation) {
      toast.error('Designation name is required');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/staff/designations/${selectedDesignation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Designation updated successfully');
        setShowEditModal(false);
        fetchDesignations();
      } else {
        toast.error(data.error || 'Failed to update designation');
      }
    } catch (error) {
      toast.error('Failed to update designation');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedDesignation) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/staff/designations/${selectedDesignation.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Designation deleted successfully');
        setShowDeleteModal(false);
        fetchDesignations();
      } else {
        toast.error(data.error || 'Failed to delete designation');
      }
    } catch (error) {
      toast.error('Failed to delete designation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Designations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff designations/job titles</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Designation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Designations</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search designations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDesignations.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No designations found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try a different search term' : 'Get started by creating your first designation'}
              </p>
              {!searchTerm && (
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Designation
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Staff Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDesignations.map((designation) => (
                  <TableRow key={designation.id}>
                    <TableCell className="font-medium">{designation.name}</TableCell>
                    <TableCell>
                      <Badge variant={designation._count.staff > 0 ? 'default' : 'secondary'}>
                        {designation._count.staff} staff
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(designation)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(designation)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Designation"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              placeholder="Enter designation name (e.g., Principal, Teacher)"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAdd} disabled={saving}>
              {saving ? 'Creating...' : 'Create Designation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Designation"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              placeholder="Enter designation name"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Designation"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedDesignation?.name}</strong>?
          </p>
          {selectedDesignation && selectedDesignation._count.staff > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                This designation has {selectedDesignation._count.staff} staff member(s) assigned. 
                You cannot delete it until all staff are reassigned.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={saving || (selectedDesignation?._count.staff ?? 0) > 0}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
