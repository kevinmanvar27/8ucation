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
import { Plus, Loader2, Pencil, Trash2, Building, Users } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Hostel {
  id: string;
  name: string;
  type: string;
  address: string | null;
  description: string | null;
  warden: string | null;
  wardenPhone: string | null;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
}

export default function HostelPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Boys',
    address: '',
    description: '',
    warden: '',
    wardenPhone: '',
  });

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      const res = await fetch('/api/hostel');
      if (res.ok) {
        const data = await res.json();
        setHostels(data.data || data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch hostels');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingHostel ? `/api/hostel/${editingHostel.id}` : '/api/hostel';
      const method = editingHostel ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingHostel ? 'Hostel updated' : 'Hostel created');
        setIsDialogOpen(false);
        setEditingHostel(null);
        resetForm();
        fetchHostels();
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
      name: '',
      type: 'Boys',
      address: '',
      description: '',
      warden: '',
      wardenPhone: '',
    });
  };

  const handleEdit = (hostel: Hostel) => {
    setEditingHostel(hostel);
    setFormData({
      name: hostel.name,
      type: hostel.type,
      address: hostel.address || '',
      description: hostel.description || '',
      warden: hostel.warden || '',
      wardenPhone: hostel.wardenPhone || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hostel?')) return;

    try {
      const res = await fetch(`/api/hostel/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Hostel deleted');
        fetchHostels();
      } else {
        toast.error('Failed to delete hostel');
      }
    } catch (error) {
      toast.error('Failed to delete hostel');
    }
  };

  const totalBeds = hostels.reduce((sum, h) => sum + h.totalBeds, 0);
  const occupiedBeds = hostels.reduce((sum, h) => sum + h.occupiedBeds, 0);

  const openNewDialog = () => {
    setEditingHostel(null);
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
          <h1 className="text-3xl font-bold">Hostels</h1>
          <p className="text-muted-foreground">Manage hostel buildings</p>
        </div>
        <div className="flex gap-2">
          <Link href="/hostel/room-types">
            <Button variant="outline">Room Types</Button>
          </Link>
          <Link href="/hostel/rooms">
            <Button variant="outline">Rooms</Button>
          </Link>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Hostel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingHostel ? 'Edit Hostel' : 'Add New Hostel'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hostel Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Boys">Boys</option>
                      <option value="Girls">Girls</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Warden Name</Label>
                    <Input
                      value={formData.warden}
                      onChange={(e) => setFormData({ ...formData, warden: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Warden Phone</Label>
                    <Input
                      value={formData.wardenPhone}
                      onChange={(e) => setFormData({ ...formData, wardenPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingHostel ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hostels</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hostels.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beds</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBeds}</div>
            <p className="text-xs text-muted-foreground">{totalBeds - occupiedBeds} available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">{occupiedBeds} occupied</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Hostels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Warden</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead>Beds</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hostels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hostels found
                  </TableCell>
                </TableRow>
              ) : (
                hostels.map((hostel) => (
                  <TableRow key={hostel.id}>
                    <TableCell className="font-medium">{hostel.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{hostel.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {hostel.warden ? (
                        <div>
                          <div>{hostel.warden}</div>
                          {hostel.wardenPhone && (
                            <div className="text-xs text-muted-foreground">{hostel.wardenPhone}</div>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{hostel.totalRooms}</TableCell>
                    <TableCell>{hostel.totalBeds}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${hostel.totalBeds > 0 ? (hostel.occupiedBeds / hostel.totalBeds) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm">{hostel.occupiedBeds}/{hostel.totalBeds}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(hostel)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(hostel.id)}>
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
