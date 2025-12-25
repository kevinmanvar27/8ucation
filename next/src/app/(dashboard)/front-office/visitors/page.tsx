'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Loader2, LogOut, Users, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Visitor {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  toMeet: string;
  idType: string | null;
  idNumber: string | null;
  checkInTime: string;
  checkOutTime: string | null;
  notes: string | null;
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    purpose: '',
    toMeet: '',
    idType: '',
    idNumber: '',
    notes: '',
  });

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const res = await fetch('/api/front-office/visitors');
      if (res.ok) {
        const data = await res.json();
        setVisitors(data.data || data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch visitors');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/front-office/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Visitor checked in');
        setIsDialogOpen(false);
        resetForm();
        fetchVisitors();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to check in visitor');
      }
    } catch (error) {
      toast.error('Failed to check in visitor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      const res = await fetch(`/api/front-office/visitors/${id}/checkout`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Visitor checked out');
        fetchVisitors();
      } else {
        toast.error('Failed to check out visitor');
      }
    } catch (error) {
      toast.error('Failed to check out visitor');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      purpose: '',
      toMeet: '',
      idType: '',
      idNumber: '',
      notes: '',
    });
  };

  const filteredVisitors = visitors.filter((visitor) => {
    const matchesSearch = visitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visitor.phone.includes(searchQuery);
    const matchesFilter = filter === 'all' ||
      (filter === 'in' && !visitor.checkOutTime) ||
      (filter === 'out' && visitor.checkOutTime);
    return matchesSearch && matchesFilter;
  });

  const currentlyIn = visitors.filter((v) => !v.checkOutTime).length;

  const openNewDialog = () => {
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
          <h1 className="text-3xl font-bold">Visitors</h1>
          <p className="text-muted-foreground">Manage visitor check-in/check-out</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Check In Visitor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Visitor Check-In</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Visitor Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Purpose of Visit</Label>
                  <Input
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="e.g., Meeting, Delivery"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Person to Meet</Label>
                  <Input
                    value={formData.toMeet}
                    onChange={(e) => setFormData({ ...formData, toMeet: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID Type</Label>
                  <Input
                    value={formData.idType}
                    onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                    placeholder="e.g., Aadhar, Passport"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID Number</Label>
                  <Input
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Check In
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently In</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{currentlyIn}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked Out Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visitors.filter((v) => v.checkOutTime).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitors.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Visitor Log</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search visitors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                className="h-10 px-3 rounded-md border border-input bg-background"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="in">Currently In</option>
                <option value="out">Checked Out</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>To Meet</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisitors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No visitors found
                  </TableCell>
                </TableRow>
              ) : (
                filteredVisitors.map((visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell className="font-medium">{visitor.name}</TableCell>
                    <TableCell>{visitor.phone}</TableCell>
                    <TableCell>{visitor.purpose}</TableCell>
                    <TableCell>{visitor.toMeet}</TableCell>
                    <TableCell>{format(new Date(visitor.checkInTime), 'h:mm a')}</TableCell>
                    <TableCell>
                      {visitor.checkOutTime
                        ? format(new Date(visitor.checkOutTime), 'h:mm a')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {visitor.checkOutTime ? (
                        <Badge className="bg-gray-500">Out</Badge>
                      ) : (
                        <Badge className="bg-green-500">In</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!visitor.checkOutTime && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckOut(visitor.id)}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Check Out
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
