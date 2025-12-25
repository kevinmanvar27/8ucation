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
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface RoomType {
  id: string;
  name: string;
  description: string | null;
  bedsPerRoom: number;
  monthlyFee: number;
  amenities: string[];
}

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bedsPerRoom: '1',
    monthlyFee: '',
    amenities: '',
  });

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const res = await fetch('/api/hostel/room-types');
      if (res.ok) {
        const data = await res.json();
        setRoomTypes(data.data || data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch room types');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingRoomType ? `/api/hostel/room-types/${editingRoomType.id}` : '/api/hostel/room-types';
      const method = editingRoomType ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          bedsPerRoom: parseInt(formData.bedsPerRoom),
          monthlyFee: parseFloat(formData.monthlyFee),
          amenities: formData.amenities.split(',').map((a) => a.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        toast.success(editingRoomType ? 'Room type updated' : 'Room type created');
        setIsDialogOpen(false);
        setEditingRoomType(null);
        resetForm();
        fetchRoomTypes();
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
      description: '',
      bedsPerRoom: '1',
      monthlyFee: '',
      amenities: '',
    });
  };

  const handleEdit = (roomType: RoomType) => {
    setEditingRoomType(roomType);
    setFormData({
      name: roomType.name,
      description: roomType.description || '',
      bedsPerRoom: roomType.bedsPerRoom.toString(),
      monthlyFee: roomType.monthlyFee.toString(),
      amenities: roomType.amenities.join(', '),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room type?')) return;

    try {
      const res = await fetch(`/api/hostel/room-types/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Room type deleted');
        fetchRoomTypes();
      } else {
        toast.error('Failed to delete room type');
      }
    } catch (error) {
      toast.error('Failed to delete room type');
    }
  };

  const openNewDialog = () => {
    setEditingRoomType(null);
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
          <h1 className="text-3xl font-bold">Room Types</h1>
          <p className="text-muted-foreground">Define hostel room categories</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Room Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRoomType ? 'Edit Room Type' : 'Add Room Type'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Single Room, Double Room"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Beds Per Room</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.bedsPerRoom}
                    onChange={(e) => setFormData({ ...formData, bedsPerRoom: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Fee ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Amenities (comma-separated)</Label>
                <Input
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="AC, WiFi, Attached Bathroom"
                />
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
                  {editingRoomType ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Room Types</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Beds/Room</TableHead>
                <TableHead>Monthly Fee</TableHead>
                <TableHead>Amenities</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No room types found
                  </TableCell>
                </TableRow>
              ) : (
                roomTypes.map((roomType) => (
                  <TableRow key={roomType.id}>
                    <TableCell className="font-medium">{roomType.name}</TableCell>
                    <TableCell>{roomType.bedsPerRoom}</TableCell>
                    <TableCell>${roomType.monthlyFee.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {roomType.amenities.length > 0 
                          ? roomType.amenities.slice(0, 3).map((a) => (
                              <span key={a} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {a}
                              </span>
                            ))
                          : '-'}
                        {roomType.amenities.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{roomType.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(roomType)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(roomType.id)}>
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
