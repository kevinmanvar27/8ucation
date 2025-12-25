'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { TableLoading } from '@/components/ui/loading';
import { Plus, Edit, Trash2, BookOpen, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface SubjectData {
  id: string;
  name: string;
  code: string;
  type: string;
  isActive: boolean;
  _count: {
    classSubjects: number;
  };
}

interface ClassData {
  id: string;
  name: string;
}

const subjectTypes = [
  { value: 'THEORY', label: 'Theory' },
  { value: 'PRACTICAL', label: 'Practical' },
  { value: 'BOTH', label: 'Both' },
];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectData | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'THEORY',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterType) params.append('type', filterType);
      
      const res = await fetch(`/api/academics/subjects?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSubjects(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterType]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/academics/classes');
      const data = await res.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
    fetchClasses();
  }, [fetchSubjects, fetchClasses]);

  const handleOpenModal = (subject?: SubjectData) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name,
        code: subject.code,
        type: subject.type,
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        code: '',
        type: 'THEORY',
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Subject name is required');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('Subject code is required');
      return;
    }

    try {
      setSaving(true);
      const url = editingSubject
        ? `/api/academics/subjects/${editingSubject.id}`
        : '/api/academics/subjects';

      const res = await fetch(url, {
        method: editingSubject ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingSubject ? 'Subject updated successfully' : 'Subject created successfully');
        setModalOpen(false);
        fetchSubjects();
      } else {
        toast.error(data.error || 'Failed to save subject');
      }
    } catch (error) {
      toast.error('Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!subjectToDelete) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/academics/subjects/${subjectToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Subject deleted successfully');
        setDeleteModalOpen(false);
        setSubjectToDelete(null);
        fetchSubjects();
      } else {
        toast.error(data.error || 'Failed to delete subject');
      }
    } catch (error) {
      toast.error('Failed to delete subject');
    } finally {
      setDeleting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'THEORY':
        return 'default';
      case 'PRACTICAL':
        return 'warning';
      case 'BOTH':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || subject.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground">Manage academic subjects</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full sm:w-48"
              options={[
                { value: '', label: 'All Types' },
                ...subjectTypes
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Subjects Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subjects ({filteredSubjects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading columns={6} rows={8} />
          ) : filteredSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No subjects found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType
                  ? 'Try adjusting your filters'
                  : 'Get started by adding a new subject'}
              </p>
              {!searchTerm && !filterType && (
                <Button className="mt-4" onClick={() => handleOpenModal()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Classes Assigned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject, index) => (
                  <TableRow key={subject.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-sm">
                        {subject.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeColor(subject.type) as any}>
                        {subject.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {subject._count.classSubjects}{' '}
                        {subject._count.classSubjects === 1 ? 'class' : 'classes'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={subject.isActive ? 'success' : 'secondary'}>
                        {subject.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(subject)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSubjectToDelete(subject);
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
        title={editingSubject ? 'Edit Subject' : 'Add Subject'}
      >
        <div className="space-y-4">
          <Input
            label="Subject Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Mathematics"
          />

          <Input
            label="Subject Code *"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g., MATH"
          />

          <Select
            label="Subject Type *"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={subjectTypes}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingSubject ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSubjectToDelete(null);
        }}
        title="Delete Subject"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete <strong>{subjectToDelete?.name}</strong>?
            {subjectToDelete && subjectToDelete._count.classSubjects > 0 && (
              <span className="text-destructive block mt-2">
                Warning: This subject is assigned to {subjectToDelete._count.classSubjects}{' '}
                class(es).
              </span>
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setSubjectToDelete(null);
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
