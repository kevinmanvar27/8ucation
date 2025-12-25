'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  class: { name: string } | null;
  section: { name: string } | null;
}

export default function DisabledStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDisabledStudents();
  }, []);

  const fetchDisabledStudents = async () => {
    try {
      const res = await fetch('/api/students?status=inactive');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || data);
      }
    } catch (error) {
      toast.error('Failed to fetch disabled students');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (id: string) => {
    if (!confirm('Are you sure you want to enable this student?')) return;

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });

      if (res.ok) {
        toast.success('Student enabled successfully');
        fetchDisabledStudents();
      } else {
        toast.error('Failed to enable student');
      }
    } catch (error) {
      toast.error('Failed to enable student');
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.firstName.toLowerCase().includes(search.toLowerCase()) ||
      student.lastName.toLowerCase().includes(search.toLowerCase()) ||
      student.admissionNo.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Disabled Students</h1>
        <p className="text-muted-foreground">View and manage disabled student accounts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disabled Students List</CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No disabled students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.admissionNo}</TableCell>
                    <TableCell>{student.firstName} {student.lastName}</TableCell>
                    <TableCell>{student.class?.name || '-'}</TableCell>
                    <TableCell>{student.section?.name || '-'}</TableCell>
                    <TableCell>
                      {student.email || student.phone || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">Disabled</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEnable(student.id)}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Enable
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
