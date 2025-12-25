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
  Briefcase,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RoleData {
  id: number;
  name: string;
}

interface DepartmentData {
  id: number;
  name: string;
}

interface StaffAttendance {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string | null;
  image: string | null;
  role: { id: number; name: string };
  department: { id: number; name: string } | null;
  attendance: {
    id: number;
    status: string;
    checkIn: string | null;
    checkOut: string | null;
    remark: string | null;
  } | null;
}

interface AttendanceRecord {
  staffId: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'holiday';
  checkIn: string;
  checkOut: string;
  remark: string;
}

const statusOptions = [
  { value: 'present', label: 'Present', color: 'bg-green-500', icon: CheckCircle },
  { value: 'absent', label: 'Absent', color: 'bg-red-500', icon: XCircle },
  { value: 'late', label: 'Late', color: 'bg-yellow-500', icon: Clock },
  { value: 'half_day', label: 'Half Day', color: 'bg-orange-500', icon: AlertCircle },
  { value: 'holiday', label: 'Holiday', color: 'bg-blue-500', icon: Calendar },
];

export default function StaffAttendancePage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [staffList, setStaffList] = useState<StaffAttendance[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<number, AttendanceRecord>>(new Map());
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch roles and departments on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [rolesRes, deptRes] = await Promise.all([
          fetch('/api/roles'),
          fetch('/api/staff/departments'),
        ]);
        
        const [rolesData, deptData] = await Promise.all([
          rolesRes.json(),
          deptRes.json(),
        ]);

        if (rolesData.success) {
          const rolesArray = rolesData.data || [];
          setRoles(Array.isArray(rolesArray) ? rolesArray : []);
        }
        if (deptData.success) {
          const deptArray = deptData.data || [];
          setDepartments(Array.isArray(deptArray) ? deptArray : []);
        }
      } catch (error) {
        toast.error('Failed to fetch filters');
        setRoles([]);
        setDepartments([]);
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilters();
  }, []);

  // Fetch attendance
  const fetchAttendance = useCallback(async () => {
    if (!selectedDate) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({ date: selectedDate });
      if (filterRole) params.append('roleId', filterRole);
      if (filterDepartment) params.append('departmentId', filterDepartment);

      const res = await fetch(`/api/attendance/staff?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        const staffArray = data.data?.staff || [];
        setStaffList(Array.isArray(staffArray) ? staffArray : []);
        
        // Initialize attendance records from existing data
        const records = new Map<number, AttendanceRecord>();
        (Array.isArray(staffArray) ? staffArray : []).forEach((staff: StaffAttendance) => {
          const att = staff.attendance;
          records.set(staff.id, {
            staffId: staff.id,
            status: (att?.status as AttendanceRecord['status']) || 'present',
            checkIn: att?.checkIn ? new Date(att.checkIn).toTimeString().slice(0, 5) : '',
            checkOut: att?.checkOut ? new Date(att.checkOut).toTimeString().slice(0, 5) : '',
            remark: att?.remark || '',
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
  }, [selectedDate, filterRole, filterDepartment]);

  // Auto-fetch when selection changes
  useEffect(() => {
    if (selectedDate) {
      fetchAttendance();
    }
  }, [selectedDate, filterRole, filterDepartment, fetchAttendance]);

  // Update attendance for a staff member
  const updateAttendance = (staffId: number, field: keyof AttendanceRecord, value: string) => {
    setAttendanceRecords(prev => {
      const newRecords = new Map(prev);
      const existing = newRecords.get(staffId) || {
        staffId,
        status: 'present' as const,
        checkIn: '',
        checkOut: '',
        remark: '',
      };
      
      if (field === 'status') {
        newRecords.set(staffId, { ...existing, status: value as AttendanceRecord['status'] });
      } else {
        newRecords.set(staffId, { ...existing, [field]: value });
      }
      
      return newRecords;
    });
    setHasChanges(true);
  };

  // Mark all staff with a status
  const markAll = (status: AttendanceRecord['status']) => {
    setAttendanceRecords(prev => {
      const newRecords = new Map(prev);
      staffList.forEach(staff => {
        const existing = newRecords.get(staff.id);
        if (existing) {
          newRecords.set(staff.id, { ...existing, status });
        }
      });
      return newRecords;
    });
    setHasChanges(true);
    toast.success(`Marked all staff as ${status}`);
  };

  // Save attendance
  const saveAttendance = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    try {
      setSaving(true);
      const attendances = Array.from(attendanceRecords.values()).map(record => ({
        staffId: record.staffId,
        status: record.status,
        checkIn: record.checkIn || null,
        checkOut: record.checkOut || null,
        remark: record.remark || null,
      }));

      const res = await fetch('/api/attendance/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
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
          <h1 className="text-2xl font-bold text-gray-900">Staff Attendance</h1>
          <p className="text-gray-600 mt-1">Mark daily attendance for staff members</p>
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
                label="Role"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                disabled={loadingFilters}
                options={[
                  { value: '', label: 'All Roles' },
                  ...roles.map((role) => ({ value: String(role.id), label: role.name }))
                ]}
              />
            </div>
            <div>
              <SimpleSelect
                label="Department"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                disabled={loadingFilters}
                options={[
                  { value: '', label: 'All Departments' },
                  ...departments.map((dept) => ({ value: String(dept.id), label: dept.name }))
                ]}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchAttendance}
                disabled={!selectedDate || loading}
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
      {staffList.length > 0 && (
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
      {staffList.length > 0 && (
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
            <Briefcase className="h-5 w-5" />
            Staff Members ({staffList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading columns={6} rows={10} />
          ) : staffList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No staff members found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role / Department</TableHead>
                    <TableHead className="w-48">Status</TableHead>
                    <TableHead className="w-28">Check In</TableHead>
                    <TableHead className="w-28">Check Out</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.map((staff, index) => {
                    const record = attendanceRecords.get(staff.id);
                    const currentStatus = record?.status || 'present';
                    
                    return (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {staff.image ? (
                                <img
                                  src={staff.image}
                                  alt={staff.firstName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-600 font-medium">
                                  {staff.firstName[0]}
                                  {staff.lastName?.[0] || ''}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {staff.firstName} {staff.lastName || ''}
                              </p>
                              <p className="text-sm text-gray-500">{staff.employeeId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="secondary">{staff.role.name}</Badge>
                            {staff.department && (
                              <p className="text-xs text-gray-500">{staff.department.name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {statusOptions.map((option) => {
                              const Icon = option.icon;
                              const isSelected = currentStatus === option.value;
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => updateAttendance(staff.id, 'status', option.value)}
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
                            type="time"
                            value={record?.checkIn || ''}
                            onChange={(e) => updateAttendance(staff.id, 'checkIn', e.target.value)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            value={record?.checkOut || ''}
                            onChange={(e) => updateAttendance(staff.id, 'checkOut', e.target.value)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Add remark..."
                            value={record?.remark || ''}
                            onChange={(e) => updateAttendance(staff.id, 'remark', e.target.value)}
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
      {staffList.length > 0 && hasChanges && (
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
