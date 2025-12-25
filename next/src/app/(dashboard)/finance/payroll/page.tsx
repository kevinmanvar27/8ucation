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
import { Plus, Loader2, Pencil, DollarSign, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PayrollRecord {
  id: string;
  staff: { 
    id: string;
    firstName: string;
    lastName: string;
    department: { name: string } | null;
  };
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: string;
  paidDate: string | null;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    staffId: '',
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear().toString(),
    basicSalary: '',
    allowances: '0',
    deductions: '0',
  });

  useEffect(() => {
    fetchPayrolls();
    fetchStaff();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const res = await fetch('/api/finance/payroll');
      if (res.ok) {
        const data = await res.json();
        setPayrolls(data.data || data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch payroll records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        const staffData = data.data || data || [];
        setStaffList(Array.isArray(staffData) ? staffData : []);
      }
    } catch (error) {
      console.error('Failed to fetch staff');
      setStaffList([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingPayroll ? `/api/finance/payroll/${editingPayroll.id}` : '/api/finance/payroll';
      const method = editingPayroll ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          year: parseInt(formData.year),
          basicSalary: parseFloat(formData.basicSalary),
          allowances: parseFloat(formData.allowances),
          deductions: parseFloat(formData.deductions),
        }),
      });

      if (res.ok) {
        toast.success(editingPayroll ? 'Payroll updated' : 'Payroll created');
        setIsDialogOpen(false);
        setEditingPayroll(null);
        resetForm();
        fetchPayrolls();
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

  const resetForm = () => {
    setFormData({
      staffId: '',
      month: MONTHS[new Date().getMonth()],
      year: new Date().getFullYear().toString(),
      basicSalary: '',
      allowances: '0',
      deductions: '0',
    });
  };

  const handleEdit = (payroll: PayrollRecord) => {
    setEditingPayroll(payroll);
    setFormData({
      staffId: payroll.staff.id,
      month: payroll.month,
      year: payroll.year.toString(),
      basicSalary: payroll.basicSalary.toString(),
      allowances: payroll.allowances.toString(),
      deductions: payroll.deductions.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/finance/payroll/${id}/pay`, { method: 'POST' });
      if (res.ok) {
        toast.success('Marked as paid');
        fetchPayrolls();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredPayrolls = payrolls.filter((p) => {
    const matchesMonth = filterMonth === 'all' || p.month === filterMonth;
    const matchesStatus = filterStatus === 'all' || p.status.toLowerCase() === filterStatus;
    return matchesMonth && matchesStatus;
  });

  const totalPayroll = filteredPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const pendingCount = filteredPayrolls.filter((p) => p.status.toLowerCase() === 'pending').length;

  const netSalary = parseFloat(formData.basicSalary || '0') + 
                    parseFloat(formData.allowances || '0') - 
                    parseFloat(formData.deductions || '0');

  const openNewDialog = () => {
    setEditingPayroll(null);
    resetForm();
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
          <h1 className="text-3xl font-bold">Payroll</h1>
          <p className="text-muted-foreground">Manage staff salaries</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Payroll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPayroll ? 'Edit Payroll' : 'Generate Payroll'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Staff Member</Label>
                <Select
                  value={formData.staffId}
                  onValueChange={(value) => setFormData({ ...formData, staffId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select
                    value={formData.month}
                    onValueChange={(value) => setFormData({ ...formData, month: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Basic Salary</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Allowances</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deductions</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                  />
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium">Net Salary:</span>
                  <span className="font-bold text-lg">${netSalary.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingPayroll ? 'Update' : 'Generate'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{filteredPayrolls.length} records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Count</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffList.length}</div>
            <p className="text-xs text-muted-foreground">total staff</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payroll Records</CardTitle>
            <div className="flex gap-2">
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No payroll records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell className="font-medium">
                      {payroll.staff.firstName} {payroll.staff.lastName}
                    </TableCell>
                    <TableCell>{payroll.staff.department?.name || '-'}</TableCell>
                    <TableCell>{payroll.month} {payroll.year}</TableCell>
                    <TableCell className="text-right">${payroll.basicSalary.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">${payroll.netSalary.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(payroll)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {payroll.status.toLowerCase() === 'pending' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMarkPaid(payroll.id)}
                        >
                          Mark Paid
                        </Button>
                      )}
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
