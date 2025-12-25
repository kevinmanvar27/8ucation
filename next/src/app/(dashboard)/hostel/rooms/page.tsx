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
import { Plus, Loader2, Pencil, Trash2, Bed } from 'lucide-react';
import { toast } from 'sonner';

interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  hostel: { id: string; name: string };
  roomType: { id: string; name: string; bedsPerRoom: number };
  occupiedBeds: number;
  status: string;
}

interface Hostel {
  id: string;
  name: string;
}

interface RoomType {
  id: string;
  name: string;
  bedsPerRoom: number;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterHostel, setFilterHostel] = useState('all');
  const [formData, setFormData] = useState({
    roomNumber: '',
    floor: '1',
    hostelId: '',
    roomTypeId: '',
    status: 'Available',
  });

  useEffect(() => {
    fetchRooms();
    fetchHostels();
    fetchRoomTypes();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/hostel/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.data || data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchHostels = async () => {
    try {
      const res = await fetch('/api/hostel');
      if (res.ok) {
        const data = await res.json();
        setHostels(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch hostels');
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const res = await fetch('/api/hostel/room-types');
      if (res.ok) {
        const data = await res.json();
        setRoomTypes(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch room types');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingRoom ? `/api/hostel/rooms/${editingRoom.id}` : '/api/hostel/rooms';
      const method = editingRoom ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          floor: parseInt(formData.floor),
        }),
      });

      if (res.ok) {
        toast.success(editingRoom ? 'Room updated' : 'Room created');
        setIsDialogOpen(false);
        setEditingRoom(null);
        resetForm();
        fetchRooms();
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
      roomNumber: '',
      floor: '1',
      hostelId: '',
      roomTypeId: '',
      status: 'Available',
    });
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      floor: room.floor.toString(),
      hostelId: room.hostel.id,
      roomTypeId: room.roomType.id,
      status: room.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const res = await fetch(`/api/hostel/rooms/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Room deleted');
        fetchRooms();
      } else {
        toast.error('Failed to delete room');
      }
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  const getStatusBadge = (status: string, occupiedBeds: number, totalBeds: number) => {
    if (status.toLowerCase() === 'maintenance') {
      return <Badge variant="secondary">Maintenance</Badge>;
    }
    if (occupiedBeds >= totalBeds) {
      return <Badge className="bg-red-500">Full</Badge>;
    }
    if (occupiedBeds > 0) {
      return <Badge className="bg-yellow-500">Partial</Badge>;
    }
    return <Badge className="bg-green-500">Available</Badge>;
  };

  const filteredRooms = filterHostel === 'all' 
    ? rooms 
    : rooms.filter((r) => r.hostel.id === filterHostel);

  const openNewDialog = () => {
    setEditingRoom(null);
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
          <h1 className="text-3xl font-bold">Rooms</h1>
          <p className="text-muted-foreground">Manage hostel rooms</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Number</Label>
                  <Input
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="e.g., 101, A-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Floor</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Hostel</Label>
                <Select
                  value={formData.hostelId}
                  onValueChange={(value) => setFormData({ ...formData, hostelId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hostel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hostels.filter((hostel) => hostel.id).map((hostel) => (
                      <SelectItem key={hostel.id} value={String(hostel.id)}>{hostel.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room Type</Label>
                <Select
                  value={formData.roomTypeId}
                  onValueChange={(value) => setFormData({ ...formData, roomTypeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.filter((type) => type.id).map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name} ({type.bedsPerRoom} beds)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Maintenance">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingRoom ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRooms.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredRooms.filter((r) => r.occupiedBeds < r.roomType.bedsPerRoom && r.status !== 'Maintenance').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Rooms</CardTitle>
            <Select value={filterHostel} onValueChange={setFilterHostel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by hostel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hostels</SelectItem>
                {hostels.filter((hostel) => hostel.id).map((hostel) => (
                  <SelectItem key={hostel.id} value={String(hostel.id)}>{hostel.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room #</TableHead>
                <TableHead>Hostel</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No rooms found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.roomNumber}</TableCell>
                    <TableCell>{room.hostel.name}</TableCell>
                    <TableCell>{room.floor}</TableCell>
                    <TableCell>{room.roomType.name}</TableCell>
                    <TableCell>
                      {room.occupiedBeds}/{room.roomType.bedsPerRoom} beds
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(room.status, room.occupiedBeds, room.roomType.bedsPerRoom)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(room)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(room.id)}>
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
