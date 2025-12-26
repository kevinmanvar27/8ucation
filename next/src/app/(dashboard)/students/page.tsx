'use client';
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleSelect } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Loading, TableLoading } from '@/components/ui/loading';
import { formatDateShort } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Upload,
  Filter,
  MoreHorizontal,
  GraduationCap,
  Phone,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: string;
  dateOfBirth: string;
  photo: string | null;
  isActive: boolean;
  currentSession: {
    class: { name: string };
    section: { name: string };
    rollNo: string | null;
  } | null;
  parent: {
    fatherName: string | null;
    motherName: string | null;
    guardianPhone: string | null;
  } | null;
}

interface ClassOption {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
}

export default function StudentsPage() {
  const { data: session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 20;

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        status: selectedStatus,
      });
      if (searchTerm) params.append('search', searchTerm);
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedSection) params.append('sectionId', selectedSection);

      const res = await fetch(`/api/students?${params}`);
      const data = await res.json();
      
      if (data.success) {
        const studentsArray = data.data || [];
        setStudents(Array.isArray(studentsArray) ? studentsArray : []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        toast.error(data.error || 'Failed to fetch students');
      }
    } catch (error) {
      toast.error('Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedClass, selectedSection, selectedStatus]);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/academics/classes?withSections=true');
      const data = await res.json();
      if (data.success) {
        const classesArray = data.data || [];
        setClasses(Array.isArray(classesArray) ? classesArray : []);
      }
    } catch (error) {
      console.error('Failed to fetch classes');
      setClasses([]);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleDelete = async () => {
    if (!studentToDelete) return;
    
    try {
      setDeleting(true);
      const res = await fetch(`/api/students/${studentToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Student deleted successfully');
        fetchStudents();
        setDeleteModalOpen(false);
        setStudentToDelete(null);
      } else {
        toast.error(data.error || 'Failed to delete student');
      }
    } catch (error) {
      toast.error('Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ format: 'excel' });
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedSection) params.append('sectionId', selectedSection);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await fetch(`/api/students/export?${params}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Export started');
    } catch (error) {
      toast.error('Failed to export students');
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
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage all students in your school
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/students/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </Link>
          <Link href="/students/admission">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Admission
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, admission no, phone..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <SimpleSelect
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
            <SimpleSelect
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
            <SimpleSelect
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'all', label: 'All Students' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Student List</span>
            <Badge variant="secondary">{totalCount} students</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading columns={7} rows={10} />
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No students found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedClass 
                  ? 'Try adjusting your filters'
                  : 'Get started by adding a new student'}
              </p>
              {!searchTerm && !selectedClass && (
                <Link href="/students/admission" className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
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
                      <TableHead>Student</TableHead>
                      <TableHead>Admission No</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {student.photo ? (
                                <img 
                                  src={student.photo} 
                                  alt={student.firstName}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-primary">
                                  {student.firstName[0]}{student.lastName[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {student.gender} • {formatDateShort(student.dateOfBirth)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{student.admissionNo}</span>
                        </TableCell>
                        <TableCell>
                          {student.currentSession ? (
                            <div>
                              <p className="font-medium">
                                {student.currentSession.class.name} - {student.currentSession.section.name}
                              </p>
                              {student.currentSession.rollNo && (
                                <p className="text-sm text-muted-foreground">
                                  Roll: {student.currentSession.rollNo}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {student.parent ? (
                            <div>
                              <p className="font-medium">{student.parent.fatherName || student.parent.motherName}</p>
                              {student.parent.guardianPhone && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {student.parent.guardianPhone}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No parent</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {student.phone && (
                              <p className="text-sm flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {student.phone}
                              </p>
                            )}
                            {student.email && (
                              <p className="text-sm flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {student.email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.isActive ? 'success' : 'secondary'}>
                            {student.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/students/${student.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/students/${student.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setStudentToDelete(student);
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
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} students
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
          setStudentToDelete(null);
        }}
        title="Delete Student"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete{' '}
            <strong>{studentToDelete?.firstName} {studentToDelete?.lastName}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setStudentToDelete(null);
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
