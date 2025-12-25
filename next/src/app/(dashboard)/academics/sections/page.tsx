'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { TableLoading } from '@/components/ui/loading';
import { Plus, Edit, Trash2, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

interface SectionData {
  id: string;
  name: string;
  isActive: boolean;
  _count: {
    classSections: number;
  };
}

export default function SectionsPage() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionData | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<SectionData | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academics/sections');
      const data = await res.json();
      if (data.success) {
        const sectionsArray = data.data || [];
        setSections(Array.isArray(sectionsArray) ? sectionsArray : []);
      }
    } catch (error) {
      toast.error('Failed to fetch sections');
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleOpenModal = (section?: SectionData) => {
    if (section) {
      setEditingSection(section);
      setFormData({ name: section.name });
    } else {
      setEditingSection(null);
      setFormData({ name: '' });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Section name is required');
      return;
    }

    try {
      setSaving(true);
      const url = editingSection 
        ? `/api/academics/sections/${editingSection.id}`
        : '/api/academics/sections';
      
      const res = await fetch(url, {
        method: editingSection ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingSection ? 'Section updated successfully' : 'Section created successfully');
        setModalOpen(false);
        fetchSections();
      } else {
        toast.error(data.error || 'Failed to save section');
      }
    } catch (error) {
      toast.error('Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sectionToDelete) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/academics/sections/${sectionToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Section deleted successfully');
        setDeleteModalOpen(false);
        setSectionToDelete(null);
        fetchSections();
      } else {
        toast.error(data.error || 'Failed to delete section');
      }
    } catch (error) {
      toast.error('Failed to delete section');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sections</h1>
          <p className="text-muted-foreground">Manage class sections</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>

      {/* Sections Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Sections</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading columns={4} rows={6} />
          ) : sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No sections found</h3>
              <p className="text-muted-foreground">Get started by adding a new section</p>
              <Button className="mt-4" onClick={() => handleOpenModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Section Name</TableHead>
                  <TableHead>Classes Using</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.map((section, index) => (
                  <TableRow key={section.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{section.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {section._count.classSections} {section._count.classSections === 1 ? 'class' : 'classes'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={section.isActive ? 'success' : 'secondary'}>
                        {section.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(section)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSectionToDelete(section);
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
        title={editingSection ? 'Edit Section' : 'Add Section'}
      >
        <div className="space-y-4">
          <Input
            label="Section Name *"
            value={formData.name}
            onChange={(e) => setFormData({ name: e.target.value })}
            placeholder="e.g., A, B, C"
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingSection ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSectionToDelete(null);
        }}
        title="Delete Section"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete <strong>{sectionToDelete?.name}</strong>?
            {sectionToDelete && sectionToDelete._count.classSections > 0 && (
              <span className="text-destructive block mt-2">
                Warning: This section is assigned to {sectionToDelete._count.classSections} class(es).
              </span>
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setSectionToDelete(null);
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
