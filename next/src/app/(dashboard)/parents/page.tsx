'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Users,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Download,
  GraduationCap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface Student {
  id: number;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  class: { name: string } | null;
  section: { name: string } | null;
}

interface Parent {
  id: number;
  fatherName: string | null;
  fatherPhone: string | null;
  motherName: string | null;
  motherPhone: string | null;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string | null;
  guardianRelation: string | null;
  students: Student[];
  _count: {
    students: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchParents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
      });

      const res = await fetch(`/api/parents?${params}`);
      const data = await res.json();

      if (data.success) {
        const parentsArray = data.data || [];
        setParents(Array.isArray(parentsArray) ? parentsArray : []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      } else {
        toast.error(data.error || 'Failed to fetch parents');
      }
    } catch (error) {
      toast.error('Failed to fetch parents');
      setParents([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm]);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewStudents = (parent: Parent) => {
    setSelectedParent(parent);
    setShowStudentsModal(true);
  };

  const handleDelete = (parent: Parent) => {
    setSelectedParent(parent);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedParent) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/parents/${selectedParent.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Parent deleted successfully');
        setShowDeleteModal(false);
        fetchParents();
      } else {
        toast.error(data.error || 'Failed to delete parent');
      }
    } catch (error) {
      toast.error('Failed to delete parent');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    const exportData = parents.map((parent) => ({
      'Guardian Name': parent.guardianName,
      'Guardian Phone': parent.guardianPhone,
      'Guardian Email': parent.guardianEmail || '',
      'Guardian Relation': parent.guardianRelation || '',
      'Father Name': parent.fatherName || '',
      'Father Phone': parent.fatherPhone || '',
      'Mother Name': parent.motherName || '',
      'Mother Phone': parent.motherPhone || '',
      'No. of Students': parent._count.students,
      'Students': parent.students.map((s) => `${s.firstName} ${s.lastName || ''} (${s.admissionNo})`).join(', '),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Parents');
    XLSX.writeFile(wb, `parents_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage parent/guardian information
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} disabled={parents.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/parents/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Parent
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Parents ({pagination.total})</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : parents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No parents found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? 'Try a different search term'
                  : 'Parents are created when students are admitted'}
              </p>
              {!searchTerm && (
                <Link href="/students/admission">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Admit Student
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guardian</TableHead>
                    <TableHead>Father</TableHead>
                    <TableHead>Mother</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parents.map((parent) => (
                    <TableRow key={parent.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{parent.guardianName}</p>
                          {parent.guardianRelation && (
                            <p className="text-xs text-gray-500">{parent.guardianRelation}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {parent.guardianPhone}
                            </span>
                            {parent.guardianEmail && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {parent.guardianEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {parent.fatherName ? (
                          <div>
                            <p className="font-medium">{parent.fatherName}</p>
                            {parent.fatherPhone && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {parent.fatherPhone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {parent.motherName ? (
                          <div>
                            <p className="font-medium">{parent.motherName}</p>
                            {parent.motherPhone && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {parent.motherPhone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewStudents(parent)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <GraduationCap className="h-4 w-4 mr-1" />
                          {parent._count.students} student(s)
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/parents/${parent.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/parents/${parent.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(parent)}
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} parents
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Students Modal */}
      <Modal
        isOpen={showStudentsModal}
        onClose={() => setShowStudentsModal(false)}
        title={`Students of ${selectedParent?.guardianName}`}
      >
        <div className="space-y-4">
          {selectedParent?.students.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No students assigned</p>
          ) : (
            <div className="space-y-3">
              {selectedParent?.students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {student.admissionNo} • {student.class?.name || 'No class'}{' '}
                      {student.section?.name ? `- ${student.section.name}` : ''}
                    </p>
                  </div>
                  <Link href={`/students/${student.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowStudentsModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Parent"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedParent?.guardianName}</strong>?
          </p>
          {selectedParent && selectedParent._count.students > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                This parent has {selectedParent._count.students} student(s) assigned. You cannot
                delete until all students are reassigned to another parent.
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
              disabled={deleting || (selectedParent?._count.students ?? 0) > 0}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
