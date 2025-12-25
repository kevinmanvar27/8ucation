'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleSelect } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { TableLoading } from '@/components/ui/loading';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Users,
  Download,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface StaffData {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string | null;
  gender: string;
  email: string;
  phone: string | null;
  image: string | null;
  joiningDate: string | null;
  isActive: boolean;
  role: { id: number; name: string };
  department: { id: number; name: string } | null;
  designation: { id: number; name: string } | null;
  user: { id: number; username: string } | null;
}

interface RoleData {
  id: number;
  name: string;
}

interface DepartmentData {
  id: number;
  name: string;
}

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (filterRole) params.append('roleId', filterRole);
      if (filterDepartment) params.append('departmentId', filterDepartment);
      if (filterStatus) params.append('status', filterStatus);

      const res = await fetch(`/api/staff?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        const staffArray = data.data || [];
        setStaff(Array.isArray(staffArray) ? staffArray : []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      toast.error('Failed to fetch staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filterRole, filterDepartment, filterStatus]);

  const fetchFilters = useCallback(async () => {
    try {
      const [rolesRes, deptRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/staff/departments'),
      ]);

      const rolesData = await rolesRes.json();
      const deptData = await deptRes.json();

      if (rolesData.success) {
        const rolesArray = rolesData.data || [];
        setRoles(Array.isArray(rolesArray) ? rolesArray : []);
      }
      if (deptData.success) {
        const deptArray = deptData.data || [];
        setDepartments(Array.isArray(deptArray) ? deptArray : []);
      }
    } catch (error) {
      console.error('Failed to fetch filters');
      setRoles([]);
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  const handleSearch = () => {
    setPage(1);
    fetchStaff();
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/staff/${staffToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Staff deleted successfully');
        setDeleteModalOpen(false);
        setStaffToDelete(null);
        fetchStaff();
      } else {
        toast.error(data.error || 'Failed to delete staff');
      }
    } catch (error) {
      toast.error('Failed to delete staff');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    const exportData = staff.map((s, index) => ({
      '#': index + 1,
      'Employee ID': s.employeeId,
      'Name': `${s.firstName} ${s.lastName || ''}`.trim(),
      'Gender': s.gender,
      'Email': s.email,
      'Phone': s.phone || '-',
      'Role': s.role.name,
      'Department': s.department?.name || '-',
      'Designation': s.designation?.name || '-',
      'Joining Date': s.joiningDate ? new Date(s.joiningDate).toLocaleDateString() : '-',
      'Status': s.isActive ? 'Active' : 'Inactive',
      'Has Login': s.user ? 'Yes' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff');
    XLSX.writeFile(wb, `staff_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Staff data exported successfully');
  };

  const getFullName = (s: StaffData) => `${s.firstName} ${s.lastName || ''}`.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Directory</h1>
          <p className="text-muted-foreground">Manage all staff members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => router.push('/staff/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <SimpleSelect
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Roles' },
                ...roles.map((role) => ({
                  value: role.id.toString(),
                  label: role.name,
                })),
              ]}
            />
            <SimpleSelect
              value={filterDepartment}
              onChange={(e) => {
                setFilterDepartment(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map((dept) => ({
                  value: dept.id.toString(),
                  label: dept.name,
                })),
              ]}
            />
            <SimpleSelect
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading columns={8} rows={10} />
          ) : staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No staff found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterRole || filterDepartment || filterStatus
                  ? 'Try adjusting your filters'
                  : 'Get started by adding a new staff member'}
              </p>
              {!searchTerm && !filterRole && !filterDepartment && !filterStatus && (
                <Button className="mt-4" onClick={() => router.push('/staff/add')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Staff
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((s, index) => (
                      <TableRow key={s.id}>
                        <TableCell>{(page - 1) * 20 + index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              {s.image ? (
                                <img
                                  src={s.image}
                                  alt={getFullName(s)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-primary">
                                  {s.firstName[0]}
                                  {s.lastName?.[0] || ''}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{getFullName(s)}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.designation?.name || 'No designation'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-muted rounded text-sm">
                            {s.employeeId}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{s.role.name}</Badge>
                        </TableCell>
                        <TableCell>{s.department?.name || '-'}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{s.email}</span>
                            </div>
                            {s.phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {s.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.isActive ? 'success' : 'secondary'}>
                            {s.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/staff/${s.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/staff/${s.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setStaffToDelete(s);
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
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} staff
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setStaffToDelete(null);
        }}
        title="Delete Staff"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete{' '}
            <strong>{staffToDelete ? getFullName(staffToDelete) : ''}</strong>?
          </p>
          <p className="text-sm text-muted-foreground">
            This will also delete the staff member&apos;s login account if one exists.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setStaffToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
