'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleSelect } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loading, TableLoading } from '@/components/ui/loading';
import { 
  Search, 
  DollarSign,
  User,
  Calendar,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  class: {
    name: string;
  } | null;
  section: {
    name: string;
  } | null;
  fees: {
    total: number;
    paid: number;
    due: number;
  } | null;
}

export default function DueFeesPage() {
  const { data: session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchStudentsWithDueFees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        includeFees: 'true',
        hasDueFees: 'true',
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
  };

  useEffect(() => {
    fetchStudentsWithDueFees();
  }, [currentPage, searchTerm, selectedClass, selectedSection]);

  const handleCollectFee = (studentId: string) => {
    window.location.href = `/fees/collect/${studentId}`;
  };

  // Helper to safely get class/section display
  const getClassSection = (student: Student) => {
    const className = student.class?.name || '-';
    const sectionName = student.section?.name;
    return sectionName ? `${className} - ${sectionName}` : className;
  };

  // Helper to safely get fees
  const getFees = (student: Student) => ({
    total: student.fees?.total ?? 0,
    paid: student.fees?.paid ?? 0,
    due: student.fees?.due ?? 0,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Due Fees</h1>
        <p className="text-muted-foreground">
          View students with pending fees
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, admission no..."
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
                { value: '1', label: 'Class 1' },
                { value: '2', label: 'Class 2' },
                { value: '3', label: 'Class 3' },
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
                { value: 'A', label: 'Section A' },
                { value: 'B', label: 'Section B' },
                { value: 'C', label: 'Section C' },
              ]}
              disabled={!selectedClass}
            />
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Students with Due Fees</span>
            <Badge variant="secondary">{totalCount} students</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading columns={6} rows={5} />
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No students with due fees</h3>
              <p className="text-muted-foreground">
                All students have cleared their fees
              </p>
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
                      <TableHead>Total Fees</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const fees = getFees(student);
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {student.firstName?.[0] || ''}{student.lastName?.[0] || ''}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">
                                  {student.firstName} {student.lastName}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{student.admissionNo}</span>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{getClassSection(student)}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>{fees.total.toFixed(2)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-green-600">{fees.paid.toFixed(2)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-red-600 font-medium">
                                {fees.due.toFixed(2)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              onClick={() => handleCollectFee(student.id)}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Collect Fee
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
    </div>
  );
}