'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleSelect } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TableLoading } from '@/components/ui/loading';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  RefreshCw,
  UserCheck,
  UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ClassData {
  id: number;
  name: string;
  sections: { id: number; name: string }[];
}

interface StudentAttendance {
  studentSessionId: number;
  studentId: number;
  rollNo: number | null;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  image: string | null;
  attendance: {
    id: number;
    status: string;
    remark: string | null;
  } | null;
}

interface AttendanceRecord {
  studentSessionId: number;
  studentId: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'holiday';
  remark: string;
}

const statusOptions = [
  { value: 'present', label: 'Present', color: 'bg-green-500', icon: CheckCircle },
  { value: 'absent', label: 'Absent', color: 'bg-red-500', icon: XCircle },
  { value: 'late', label: 'Late', color: 'bg-yellow-500', icon: Clock },
  { value: 'half_day', label: 'Half Day', color: 'bg-orange-500', icon: AlertCircle },
  { value: 'holiday', label: 'Holiday', color: 'bg-blue-500', icon: Calendar },
];

export default function StudentAttendancePage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<number, AttendanceRecord>>(new Map());
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [availableSections, setAvailableSections] = useState<{ id: number; name: string }[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/academics/classes?withSections=true');
        const data = await res.json();
        if (data.success) {
          const classesArray = data.data || [];
          setClasses(Array.isArray(classesArray) ? classesArray : []);
        }
      } catch (error) {
        toast.error('Failed to fetch classes');
        setClasses([]);
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  // Update sections when class changes
  useEffect(() => {
    if (selectedClass) {
      const classData = classes.find(c => c.id === parseInt(selectedClass));
      setAvailableSections(classData?.sections || []);
      setSelectedSection('');
      setStudents([]);
      setAttendanceRecords(new Map());
    } else {
      setAvailableSections([]);
      setSelectedSection('');
    }
  }, [selectedClass, classes]);

  // Fetch attendance when date, class, and section are selected
  const fetchAttendance = useCallback(async () => {
    if (!selectedDate || !selectedClass || !selectedSection) {
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        date: selectedDate,
        classId: selectedClass,
        sectionId: selectedSection,
      });

      const res = await fetch(`/api/attendance/students?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        const studentsArray = data.data?.students || [];
        setStudents(Array.isArray(studentsArray) ? studentsArray : []);
        
        // Initialize attendance records from existing data
        const records = new Map<number, AttendanceRecord>();
        (Array.isArray(studentsArray) ? studentsArray : []).forEach((student: StudentAttendance) => {
          records.set(student.studentSessionId, {
            studentSessionId: student.studentSessionId,
            studentId: student.studentId,
            status: (student.attendance?.status as AttendanceRecord['status']) || 'present',
            remark: student.attendance?.remark || '',
          });
        });
        setAttendanceRecords(records);
        setHasChanges(false);
      } else {
        toast.error(data.error || 'Failed to fetch attendance');
      }
    } catch (error) {
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedClass, selectedSection]);

  // Auto-fetch when selection changes
  useEffect(() => {
    if (selectedDate && selectedClass && selectedSection) {
      fetchAttendance();
    }
  }, [selectedDate, selectedClass, selectedSection, fetchAttendance]);

  // Update attendance status for a student
  const updateAttendance = (studentSessionId: number, studentId: number, field: 'status' | 'remark', value: string) => {
    setAttendanceRecords(prev => {
      const newRecords = new Map(prev);
      const existing = newRecords.get(studentSessionId) || {
        studentSessionId,
        studentId,
        status: 'present' as const,
        remark: '',
      };
      
      if (field === 'status') {
        newRecords.set(studentSessionId, { ...existing, status: value as AttendanceRecord['status'] });
      } else {
        newRecords.set(studentSessionId, { ...existing, remark: value });
      }
      
      return newRecords;
    });
    setHasChanges(true);
  };

  // Mark all students with a status
  const markAll = (status: AttendanceRecord['status']) => {
    setAttendanceRecords(prev => {
      const newRecords = new Map(prev);
      students.forEach(student => {
        const existing = newRecords.get(student.studentSessionId);
        if (existing) {
          newRecords.set(student.studentSessionId, { ...existing, status });
        }
      });
      return newRecords;
    });
    setHasChanges(true);
    toast.success(`Marked all students as ${status}`);
  };

  // Save attendance
  const saveAttendance = async () => {
    if (!selectedDate || !selectedClass || !selectedSection) {
      toast.error('Please select date, class, and section');
      return;
    }

    try {
      setSaving(true);
      const attendances = Array.from(attendanceRecords.values());

      const res = await fetch('/api/attendance/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          classId: parseInt(selectedClass),
          sectionId: parseInt(selectedSection),
          attendances,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'Attendance saved successfully');
        setHasChanges(false);
      } else {
        toast.error(data.error || 'Failed to save attendance');
      }
    } catch (error) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // Get attendance stats
  const getStats = () => {
    const stats = { present: 0, absent: 0, late: 0, half_day: 0, holiday: 0 };
    attendanceRecords.forEach(record => {
      stats[record.status]++;
    });
    return stats;
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Attendance</h1>
          <p className="text-gray-600 mt-1">Mark daily attendance for students</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <SimpleSelect
                label="Class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={loadingClasses}
                options={[
                  { value: '', label: 'Select Class' },
                  ...classes.map((cls) => ({ value: String(cls.id), label: cls.name }))
                ]}
              />
            </div>
            <div>
              <SimpleSelect
                label="Section"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass || availableSections.length === 0}
                options={[
                  { value: '', label: 'Select Section' },
                  ...availableSections.map((section) => ({ value: String(section.id), label: section.name }))
                ]}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchAttendance}
                disabled={!selectedDate || !selectedClass || !selectedSection || loading}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Present</p>
                  <p className="text-2xl font-bold text-green-700">{stats.present}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Absent</p>
                  <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">Late</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.late}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Half Day</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.half_day}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Holiday</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.holiday}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      {students.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Quick Actions:</span>
              <Button size="sm" variant="outline" onClick={() => markAll('present')} className="text-green-600 border-green-300 hover:bg-green-50">
                <UserCheck className="h-4 w-4 mr-1" />
                Mark All Present
              </Button>
              <Button size="sm" variant="outline" onClick={() => markAll('absent')} className="text-red-600 border-red-300 hover:bg-red-50">
                <UserX className="h-4 w-4 mr-1" />
                Mark All Absent
              </Button>
              <Button size="sm" variant="outline" onClick={() => markAll('holiday')} className="text-blue-600 border-blue-300 hover:bg-blue-50">
                <Calendar className="h-4 w-4 mr-1" />
                Mark Holiday
              </Button>
              <div className="flex-1" />
              <Button onClick={saveAttendance} disabled={saving || !hasChanges}>
                <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-pulse' : ''}`} />
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedClass || !selectedSection ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a date, class, and section to view students</p>
            </div>
          ) : loading ? (
            <TableLoading columns={5} rows={10} />
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No students found in this class/section</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-32">Roll No</TableHead>
                    <TableHead className="w-48">Status</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => {
                    const record = attendanceRecords.get(student.studentSessionId);
                    const currentStatus = record?.status || 'present';
                    
                    return (
                      <TableRow key={student.studentSessionId}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {student.image ? (
                                <img
                                  src={student.image}
                                  alt={student.firstName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-600 font-medium">
                                  {student.firstName[0]}
                                  {student.lastName?.[0] || ''}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {student.firstName} {student.lastName || ''}
                              </p>
                              <p className="text-sm text-gray-500">{student.admissionNo}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{student.rollNo || '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {statusOptions.map((option) => {
                              const Icon = option.icon;
                              const isSelected = currentStatus === option.value;
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => updateAttendance(student.studentSessionId, student.studentId, 'status', option.value)}
                                  className={`p-2 rounded-lg transition-all ${
                                    isSelected
                                      ? `${option.color} text-white shadow-md`
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                  title={option.label}
                                >
                                  <Icon className="h-4 w-4" />
                                </button>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Add remark..."
                            value={record?.remark || ''}
                            onChange={(e) => updateAttendance(student.studentSessionId, student.studentId, 'remark', e.target.value)}
                            className="w-full max-w-xs"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Save Button for Mobile */}
      {students.length > 0 && hasChanges && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <Button
            size="lg"
            onClick={saveAttendance}
            disabled={saving}
            className="rounded-full shadow-lg"
          >
            <Save className={`h-5 w-5 ${saving ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      )}
    </div>
  );
}
