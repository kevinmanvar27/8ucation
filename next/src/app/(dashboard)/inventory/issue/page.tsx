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
import { Plus, Loader2, RotateCcw, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ItemIssue {
  id: string;
  item: { id: string; name: string; unit: string };
  issuedTo: string;
  department: string | null;
  quantity: number;
  issueDate: string;
  returnDate: string | null;
  status: string;
  notes: string | null;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export default function ItemIssuePage() {
  const [issues, setIssues] = useState<ItemIssue[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    itemId: '',
    issuedTo: '',
    department: '',
    quantity: '1',
    notes: '',
  });

  useEffect(() => {
    fetchIssues();
    fetchItems();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/inventory/issue');
      if (res.ok) {
        const data = await res.json();
        setIssues(data.data || data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/inventory/items');
      if (res.ok) {
        const data = await res.json();
        const itemsArray = data.data || data || [];
        setItems(Array.isArray(itemsArray) ? itemsArray.filter((i: InventoryItem) => i.quantity > 0) : []);
      }
    } catch (error) {
      console.error('Failed to fetch items');
      setItems([]);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/inventory/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
        }),
      });

      if (res.ok) {
        toast.success('Item issued successfully');
        setIsDialogOpen(false);
        resetForm();
        fetchIssues();
        fetchItems();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to issue item');
      }
    } catch (error) {
      toast.error('Failed to issue item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (id: string) => {
    if (!confirm('Mark this item as returned?')) return;

    try {
      const res = await fetch(`/api/inventory/issue/${id}/return`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Item returned successfully');
        fetchIssues();
        fetchItems();
      } else {
        toast.error('Failed to return item');
      }
    } catch (error) {
      toast.error('Failed to return item');
    }
  };

  const resetForm = () => {
    setFormData({
      itemId: '',
      issuedTo: '',
      department: '',
      quantity: '1',
      notes: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'issued':
        return <Badge className="bg-blue-500">Issued</Badge>;
      case 'returned':
        return <Badge className="bg-green-500">Returned</Badge>;
      case 'damaged':
        return <Badge className="bg-red-500">Damaged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredIssues = issues.filter((issue) => {
    if (filter === 'issued') return issue.status.toLowerCase() === 'issued';
    if (filter === 'returned') return issue.status.toLowerCase() === 'returned';
    return true;
  });

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
          <h1 className="text-3xl font-bold">Item Issue/Return</h1>
          <p className="text-muted-foreground">Track inventory distribution</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Issue Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Issue Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleIssue} className="space-y-4">
              <div className="space-y-2">
                <Label>Item</Label>
                <Select
                  value={formData.itemId}
                  onValueChange={(value) => setFormData({ ...formData, itemId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.filter((item) => item.id).map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name} ({item.quantity} {item.unit} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issued To</Label>
                  <Input
                    value={formData.issuedTo}
                    onChange={(e) => setFormData({ ...formData, issuedTo: e.target.value })}
                    placeholder="Person name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Admin, Science"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Purpose or additional info"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Issue
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Issued</CardTitle>
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {issues.filter((i) => i.status.toLowerCase() === 'issued').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issued (All Time)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issues.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {issues.filter((i) => i.status.toLowerCase() === 'returned').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Issue Records</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="issued">Currently Issued</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Issued To</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredIssues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">{issue.item.name}</TableCell>
                    <TableCell>{issue.issuedTo}</TableCell>
                    <TableCell>{issue.department || '-'}</TableCell>
                    <TableCell>
                      {issue.quantity} {issue.item.unit}
                    </TableCell>
                    <TableCell>{format(new Date(issue.issueDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {issue.returnDate ? format(new Date(issue.returnDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(issue.status)}</TableCell>
                    <TableCell className="text-right">
                      {issue.status.toLowerCase() === 'issued' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReturn(issue.id)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Return
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
