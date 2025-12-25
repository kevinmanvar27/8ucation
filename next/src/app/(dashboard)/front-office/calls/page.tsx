'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Loader2, Pencil, Trash2, Phone, Search, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CallLog {
  id: string;
  type: string;
  name: string;
  phone: string;
  purpose: string;
  notes: string | null;
  callDate: string;
  duration: number | null;
  followUpRequired: boolean;
  followUpDate: string | null;
  handledBy: string | null;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCall, setEditingCall] = useState<CallLog | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    type: 'Incoming',
    name: '',
    phone: '',
    purpose: '',
    notes: '',
    callDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    duration: '',
    followUpRequired: false,
    followUpDate: '',
    handledBy: '',
  });

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const res = await fetch('/api/front-office/calls');
      if (res.ok) {
        const data = await res.json();
        setCalls(data.data || data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch call logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingCall ? `/api/front-office/calls/${editingCall.id}` : '/api/front-office/calls';
      const method = editingCall ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          duration: formData.duration ? parseInt(formData.duration) : null,
        }),
      });

      if (res.ok) {
        toast.success(editingCall ? 'Call log updated' : 'Call log created');
        setIsDialogOpen(false);
        setEditingCall(null);
        resetForm();
        fetchCalls();
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
      type: 'Incoming',
      name: '',
      phone: '',
      purpose: '',
      notes: '',
      callDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      duration: '',
      followUpRequired: false,
      followUpDate: '',
      handledBy: '',
    });
  };

  const handleEdit = (call: CallLog) => {
    setEditingCall(call);
    setFormData({
      type: call.type,
      name: call.name,
      phone: call.phone,
      purpose: call.purpose,
      notes: call.notes || '',
      callDate: call.callDate.slice(0, 16),
      duration: call.duration?.toString() || '',
      followUpRequired: call.followUpRequired,
      followUpDate: call.followUpDate ? call.followUpDate.split('T')[0] : '',
      handledBy: call.handledBy || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this call log?')) return;

    try {
      const res = await fetch(`/api/front-office/calls/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Call log deleted');
        fetchCalls();
      } else {
        toast.error('Failed to delete call log');
      }
    } catch (error) {
      toast.error('Failed to delete call log');
    }
  };

  const filteredCalls = calls.filter((call) => {
    const matchesSearch = call.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.phone.includes(searchQuery);
    const matchesType = filterType === 'all' || call.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const incomingCount = calls.filter((c) => c.type === 'Incoming').length;
  const outgoingCount = calls.filter((c) => c.type === 'Outgoing').length;

  const openNewDialog = () => {
    setEditingCall(null);
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
          <h1 className="text-3xl font-bold">Call Logs</h1>
          <p className="text-muted-foreground">Track phone calls</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Log Call
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCall ? 'Edit Call Log' : 'Log New Call'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Call Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Incoming">Incoming</SelectItem>
                      <SelectItem value="Outgoing">Outgoing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.callDate}
                    onChange={(e) => setFormData({ ...formData, callDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Caller/Recipient Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Input
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="e.g., Admission Enquiry, Fee Query"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Handled By</Label>
                  <Input
                    value={formData.handledBy}
                    onChange={(e) => setFormData({ ...formData, handledBy: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="followUp"
                    checked={formData.followUpRequired}
                    onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                  />
                  <Label htmlFor="followUp">Follow-up Required</Label>
                </div>
                {formData.followUpRequired && (
                  <div className="flex-1">
                    <Input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    />
                  </div>
                )}
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
                  {editingCall ? 'Update' : 'Log Call'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incoming</CardTitle>
            <PhoneIncoming className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{incomingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outgoing</CardTitle>
            <PhoneOutgoing className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{outgoingCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Call History</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="incoming">Incoming</SelectItem>
                  <SelectItem value="outgoing">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No call logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      {call.type === 'Incoming' ? (
                        <Badge className="bg-green-500">
                          <PhoneIncoming className="h-3 w-3 mr-1" />
                          In
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500">
                          <PhoneOutgoing className="h-3 w-3 mr-1" />
                          Out
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{call.name}</TableCell>
                    <TableCell>{call.phone}</TableCell>
                    <TableCell>{call.purpose}</TableCell>
                    <TableCell>{format(new Date(call.callDate), 'MMM d, h:mm a')}</TableCell>
                    <TableCell>{call.duration ? `${call.duration} min` : '-'}</TableCell>
                    <TableCell>
                      {call.followUpRequired ? (
                        <Badge variant="outline" className="text-yellow-600">
                          {call.followUpDate
                            ? format(new Date(call.followUpDate), 'MMM d')
                            : 'Yes'}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(call)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(call.id)}>
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
