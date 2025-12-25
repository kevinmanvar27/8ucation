'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SimpleSelect } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface ClassOption {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
}

export default function CreateHomeworkPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    dueDate: '',
  });

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/academics/classes?withSections=true&withSubjects=true');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.classId || !formData.sectionId || !formData.subjectId || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('Homework created successfully');
        router.push('/homework');
      } else {
        toast.error(data.error || 'Failed to create homework');
      }
    } catch (error) {
      toast.error('Failed to create homework');
    } finally {
      setLoading(false);
    }
  };

  const sections = formData.classId 
    ? classes.find(c => c.id === formData.classId)?.sections || []
    : [];

  const subjects = formData.classId 
    ? classes.find(c => c.id === formData.classId)?.subjects || []
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Homework</h1>
        <p className="text-muted-foreground">
          Create a new homework assignment for students
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Homework Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter homework title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classId">Class *</Label>
                <SimpleSelect
                  id="classId"
                  value={formData.classId}
                  onChange={(e) => setFormData({...formData, classId: e.target.value, sectionId: '', subjectId: ''})}
                  options={[
                    { value: '', label: 'Select Class' },
                    ...classes.map(c => ({ value: c.id, label: c.name }))
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sectionId">Section *</Label>
                <SimpleSelect
                  id="sectionId"
                  value={formData.sectionId}
                  onChange={(e) => setFormData({...formData, sectionId: e.target.value})}
                  options={[
                    { value: '', label: 'Select Section' },
                    ...sections.map(s => ({ value: s.id, label: s.name }))
                  ]}
                  disabled={!formData.classId}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectId">Subject *</Label>
                <SimpleSelect
                  id="subjectId"
                  value={formData.subjectId}
                  onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
                  options={[
                    { value: '', label: 'Select Subject' },
                    ...subjects.map(s => ({ value: s.id, label: s.name }))
                  ]}
                  disabled={!formData.classId}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter homework description"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/homework')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
              >
                Create Homework
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}