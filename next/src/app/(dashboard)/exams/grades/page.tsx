'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Grade {
  id: string;
  name: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoint: number | null;
  description: string | null;
}

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    minPercentage: '',
    maxPercentage: '',
    gradePoint: '',
    description: '',
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const res = await fetch('/api/exams/grades');
      if (res.ok) {
        const data = await res.json();
        setGrades(data.data || data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch grades');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingGrade ? `/api/exams/grades/${editingGrade.id}` : '/api/exams/grades';
      const method = editingGrade ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          minPercentage: parseFloat(formData.minPercentage),
          maxPercentage: parseFloat(formData.maxPercentage),
          gradePoint: formData.gradePoint ? parseFloat(formData.gradePoint) : null,
          description: formData.description || null,
        }),
      });

      if (res.ok) {
        toast.success(editingGrade ? 'Grade updated' : 'Grade created');
        setIsDialogOpen(false);
        setEditingGrade(null);
        setFormData({ name: '', minPercentage: '', maxPercentage: '', gradePoint: '', description: '' });
        fetchGrades();
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

  const handleEdit = (grade: Grade) => {
    setEditingGrade(grade);
    setFormData({
      name: grade.name,
      minPercentage: grade.minPercentage.toString(),
      maxPercentage: grade.maxPercentage.toString(),
      gradePoint: grade.gradePoint?.toString() || '',
      description: grade.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this grade?')) return;

    try {
      const res = await fetch(`/api/exams/grades/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Grade deleted');
        fetchGrades();
      } else {
        toast.error('Failed to delete grade');
      }
    } catch (error) {
      toast.error('Failed to delete grade');
    }
  };

  const openNewDialog = () => {
    setEditingGrade(null);
    setFormData({ name: '', minPercentage: '', maxPercentage: '', gradePoint: '', description: '' });
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
          <h1 className="text-3xl font-bold">Grades</h1>
          <p className="text-muted-foreground">Manage grading system</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Grade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGrade ? 'Edit Grade' : 'Add New Grade'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Grade Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., A+, A, B+"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPercentage">Min Percentage</Label>
                  <Input
                    id="minPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.minPercentage}
                    onChange={(e) => setFormData({ ...formData, minPercentage: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPercentage">Max Percentage</Label>
                  <Input
                    id="maxPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.maxPercentage}
                    onChange={(e) => setFormData({ ...formData, maxPercentage: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gradePoint">Grade Point (Optional)</Label>
                <Input
                  id="gradePoint"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.gradePoint}
                  onChange={(e) => setFormData({ ...formData, gradePoint: e.target.value })}
                  placeholder="e.g., 4.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Excellent"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingGrade ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grading Scale</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grade</TableHead>
                <TableHead>Min %</TableHead>
                <TableHead>Max %</TableHead>
                <TableHead>Grade Point</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No grades defined
                  </TableCell>
                </TableRow>
              ) : (
                grades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell className="font-medium">{grade.name}</TableCell>
                    <TableCell>{grade.minPercentage}%</TableCell>
                    <TableCell>{grade.maxPercentage}%</TableCell>
                    <TableCell>{grade.gradePoint || '-'}</TableCell>
                    <TableCell>{grade.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(grade)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(grade.id)}>
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
