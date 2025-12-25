'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Loading, TableLoading } from '@/components/ui/loading';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen,
  Calendar,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Homework {
  id: string;
  title: string;
  description: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  dueDate: string;
  createdBy: string;
  createdAt: string;
  class: {
    name: string;
  };
  section: {
    name: string;
  };
  subject: {
    name: string;
  };
  creator: {
    name: string;
  };
}

interface ClassOption {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
}

export default function HomeworkPage() {
  const { data: session } = useSession();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [homeworkToDelete, setHomeworkToDelete] = useState<Homework | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  const fetchHomework = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedSection) params.append('sectionId', selectedSection);

      const res = await fetch(`/api/homework?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setHomework(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
      } else {
        toast.error(data.error || 'Failed to fetch homework');
      }
    } catch (error) {
      toast.error('Failed to fetch homework');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/academics/classes?withSections=true');
      const data = await res.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchHomework();
  }, [currentPage, searchTerm, selectedClass, selectedSection]);

  const handleDelete = async () => {
    if (!homeworkToDelete) return;
    
    try {
      setDeleting(true);
      const res = await fetch(`/api/homework/${homeworkToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Homework deleted successfully');
        fetchHomework();
        setDeleteModalOpen(false);
        setHomeworkToDelete(null);
      } else {
        toast.error(data.error || 'Failed to delete homework');
      }
    } catch (error) {
      toast.error('Failed to delete homework');
    } finally {
      setDeleting(false);
    }
  };

  const sections = selectedClass 
    ? classes.find(c => c.id === selectedClass)?.sections || []
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Homework</h1>
          <p className="text-muted-foreground">
            Manage homework assignments for students
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/homework/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Homework
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, subject..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
                setCurrentPage(1);
              }}
              options={[
                { value: '', label: 'All Classes' },
                ...classes.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
            <Select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: '', label: 'All Sections' },
                ...sections.map(s => ({ value: s.id, label: s.name }))
              ]}
              disabled={!selectedClass}
            />
          </div>
        </CardContent>
      </Card>

      {/* Homework Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Homework Assignments</span>
            <Badge variant="secondary">{totalCount} assignments</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading columns={6} rows={5} />
          ) : homework.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No homework found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedClass 
                  ? 'Try adjusting your filters'
                  : 'Get started by adding a new homework assignment'}
              </p>
              {!searchTerm && !selectedClass && (
                <Link href="/homework/create" className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Homework
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {homework.map((hw) => (
                      <TableRow key={hw.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{hw.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {hw.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{hw.class.name} - {hw.section.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{hw.subject.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(hw.dueDate).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{hw.creator.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/homework/${hw.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/homework/${hw.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setHomeworkToDelete(hw);
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
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} assignments
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setHomeworkToDelete(null);
        }}
        title="Delete Homework"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete the homework assignment{' '}
            <strong>{homeworkToDelete?.title}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setHomeworkToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={deleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}