'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { TableLoading } from '@/components/ui/loading';
import { Plus, Edit, Trash2, GripVertical, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Section {
  id: string;
  name: string;
}

interface ClassData {
  id: string;
  name: string;
  orderNo: number;
  isActive: boolean;
  sections: Section[];
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassData | null>(null);
  const [formData, setFormData] = useState({ name: '', sectionIds: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academics/classes?withSections=true');
      const data = await res.json();
      if (data.success) {
        const classesArray = data.data || [];
        setClasses(Array.isArray(classesArray) ? classesArray : []);
      }
    } catch (error) {
      toast.error('Failed to fetch classes');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/academics/sections');
      const data = await res.json();
      if (data.success) {
        const sectionsArray = data.data || [];
        setSections(Array.isArray(sectionsArray) ? sectionsArray : []);
      }
    } catch (error) {
      console.error('Failed to fetch sections');
      setSections([]);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchSections();
  }, [fetchClasses]);

  const handleOpenModal = (classData?: ClassData) => {
    if (classData) {
      setEditingClass(classData);
      setFormData({
        name: classData.name,
        sectionIds: classData.sections.map(s => s.id),
      });
    } else {
      setEditingClass(null);
      setFormData({ name: '', sectionIds: [] });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Class name is required');
      return;
    }

    try {
      setSaving(true);
      const url = editingClass 
        ? `/api/academics/classes/${editingClass.id}`
        : '/api/academics/classes';
      
      const res = await fetch(url, {
        method: editingClass ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingClass ? 'Class updated successfully' : 'Class created successfully');
        setModalOpen(false);
        fetchClasses();
      } else {
        toast.error(data.error || 'Failed to save class');
      }
    } catch (error) {
      toast.error('Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!classToDelete) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/academics/classes/${classToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Class deleted successfully');
        setDeleteModalOpen(false);
        setClassToDelete(null);
        fetchClasses();
      } else {
        toast.error(data.error || 'Failed to delete class');
      }
    } catch (error) {
      toast.error('Failed to delete class');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sectionIds: prev.sectionIds.includes(sectionId)
        ? prev.sectionIds.filter(id => id !== sectionId)
        : [...prev.sectionIds, sectionId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">Manage school classes and their sections</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading columns={5} rows={8} />
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No classes found</h3>
              <p className="text-muted-foreground">Get started by adding a new class</p>
              <Button className="mt-4" onClick={() => handleOpenModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classData, index) => (
                  <TableRow key={classData.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{classData.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {classData.sections.length > 0 ? (
                          classData.sections.map(section => (
                            <Badge key={section.id} variant="secondary">
                              {section.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No sections</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={classData.isActive ? 'success' : 'secondary'}>
                        {classData.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(classData)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setClassToDelete(classData);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClass ? 'Edit Class' : 'Add Class'}
      >
        <div className="space-y-4">
          <Input
            label="Class Name *"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Class 1, Grade 10"
          />

          <div>
            <label className="text-sm font-medium mb-2 block">Assign Sections</label>
            <div className="flex flex-wrap gap-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    formData.sectionIds.includes(section.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-accent border-input'
                  }`}
                >
                  {section.name}
                </button>
              ))}
              {sections.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No sections available. Create sections first.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingClass ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setClassToDelete(null);
        }}
        title="Delete Class"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete <strong>{classToDelete?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setClassToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
