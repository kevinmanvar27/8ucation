'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TimetableEntry {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: { name: string } | null;
  staff: { firstName: string; lastName: string } | null;
  room: string | null;
}

interface Class {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'
];

export default function TimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    day: '',
    startTime: '',
    endTime: '',
    subjectId: '',
    staffId: '',
    room: '',
  });

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSections(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchTimetable();
    }
  }, [selectedClass, selectedSection]);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/academics/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      const res = await fetch(`/api/academics/sections?classId=${classId}`);
      if (res.ok) {
        const data = await res.json();
        setSections(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch sections');
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/academics/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch subjects');
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        const staffArray = data.data || data.staff || data || [];
        setStaffList(Array.isArray(staffArray) ? staffArray : []);
      }
    } catch (error) {
      console.error('Failed to fetch staff');
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    try {
      const res = await fetch(`/api/academics/timetable?classId=${selectedClass}&sectionId=${selectedSection}`);
      if (res.ok) {
        const data = await res.json();
        setTimetable(data.data || data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch timetable');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/academics/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          classId: selectedClass,
          sectionId: selectedSection,
        }),
      });

      if (res.ok) {
        toast.success('Timetable entry added');
        setIsDialogOpen(false);
        setFormData({
          day: '',
          startTime: '',
          endTime: '',
          subjectId: '',
          staffId: '',
          room: '',
        });
        fetchTimetable();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to add entry');
      }
    } catch (error) {
      toast.error('Failed to add entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const res = await fetch(`/api/academics/timetable/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Entry deleted');
        fetchTimetable();
      } else {
        toast.error('Failed to delete entry');
      }
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const getTimetableForDay = (day: string) => {
    return timetable
      .filter((entry) => entry.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
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
          <h1 className="text-3xl font-bold">Timetable</h1>
          <p className="text-muted-foreground">Manage class timetables</p>
        </div>
        {selectedClass && selectedSection && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Timetable Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select
                    value={formData.day}
                    onValueChange={(value) => setFormData({ ...formData, day: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select
                      value={formData.startTime}
                      onValueChange={(value) => setFormData({ ...formData, startTime: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Start" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Select
                      value={formData.endTime}
                      onValueChange={(value) => setFormData({ ...formData, endTime: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="End" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.filter((subject) => subject.id).map((subject) => (
                        <SelectItem key={subject.id} value={String(subject.id)}>{subject.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Teacher</Label>
                  <Select
                    value={formData.staffId}
                    onValueChange={(value) => setFormData({ ...formData, staffId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.filter((staff) => staff.id).map((staff) => (
                        <SelectItem key={staff.id} value={String(staff.id)}>
                          {staff.firstName} {staff.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Entry
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Class & Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-48">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.filter((cls) => cls.id).map((cls) => (
                    <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label>Section</Label>
              <Select 
                value={selectedSection} 
                onValueChange={setSelectedSection}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.filter((section) => section.id).map((section) => (
                    <SelectItem key={section.id} value={String(section.id)}>{section.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && selectedSection && (
        <div className="space-y-4">
          {DAYS.map((day) => {
            const dayEntries = getTimetableForDay(day);
            return (
              <Card key={day}>
                <CardHeader className="py-3">
                  <CardTitle className="text-lg">{day}</CardTitle>
                </CardHeader>
                <CardContent>
                  {dayEntries.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No classes scheduled</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Teacher</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{entry.startTime} - {entry.endTime}</TableCell>
                            <TableCell>{entry.subject?.name || '-'}</TableCell>
                            <TableCell>
                              {entry.staff ? `${entry.staff.firstName} ${entry.staff.lastName}` : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(entry.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
