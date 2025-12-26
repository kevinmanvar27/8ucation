'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Pencil, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, isValid, parseISO } from 'date-fns';
import Link from 'next/link';

interface Exam {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  session: { name: string } | null;
}

// Helper function to safely format dates
const formatDate = (dateString: string | null | undefined, formatStr: string = 'MMM dd, yyyy'): string => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(date)) return '-';
    return format(date, formatStr);
  } catch {
    return '-';
  }
};

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams');
      if (res.ok) {
        const data = await res.json();
        const examsArray = data.data || data || [];
        setExams(Array.isArray(examsArray) ? examsArray : []);
      }
    } catch (error) {
      toast.error('Failed to fetch exams');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingExam ? `/api/exams/${editingExam.id}` : '/api/exams';
      const method = editingExam ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingExam ? 'Exam updated' : 'Exam created');
        setIsDialogOpen(false);
        setEditingExam(null);
        setFormData({ name: '', description: '', startDate: '', endDate: '' });
        fetchExams();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      description: exam.description || '',
      startDate: exam.startDate ? exam.startDate.split('T')[0] : '',
      endDate: exam.endDate ? exam.endDate.split('T')[0] : '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;

    try {
      const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Exam deleted');
        fetchExams();
      } else {
        toast.error('Failed to delete exam');
      }
    } catch (error) {
      toast.error('Failed to delete exam');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'ongoing':
        return <Badge className="bg-blue-500">Ongoing</Badge>;
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openNewDialog = () => {
    setEditingExam(null);
    setFormData({ name: '', description: '', startDate: '', endDate: '' });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Examinations</h1>
          <p className="text-muted-foreground">Manage school examinations</p>
        </div>
        <div className="flex gap-2">
          <Link href="/exams/schedule">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          </Link>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingExam ? 'Edit Exam' : 'Add New Exam'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Exam Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingExam ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Exams</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No exams found
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.name}</TableCell>
                    <TableCell>{formatDate(exam.startDate)}</TableCell>
                    <TableCell>{formatDate(exam.endDate)}</TableCell>
                    <TableCell>{getStatusBadge(exam.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(exam)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(exam.id)}>
                        <Trash2 className="h-4 w-4" />
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
