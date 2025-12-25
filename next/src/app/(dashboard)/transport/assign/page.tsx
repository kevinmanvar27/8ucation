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
import { Plus, Loader2, Trash2, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface TransportAssignment {
  id: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    class: { name: string } | null;
  };
  route: {
    id: string;
    name: string;
    fare: number;
  };
  pickupPoint: string;
  dropPoint: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
}

interface Route {
  id: string;
  name: string;
  stops: string[];
  fare: number;
}

export default function TransportAssignPage() {
  const [assignments, setAssignments] = useState<TransportAssignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRoute, setFilterRoute] = useState('all');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    routeId: '',
    pickupPoint: '',
    dropPoint: '',
  });

  useEffect(() => {
    fetchAssignments();
    fetchStudents();
    fetchRoutes();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/transport/assign');
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.data || data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch students');
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await fetch('/api/transport/routes');
      if (res.ok) {
        const data = await res.json();
        const routesData = data.data || data || [];
        // Transform API response to match Route interface
        const transformedRoutes: Route[] = routesData.map((route: any) => ({
          id: String(route.id),
          name: route.title || route.name || '',
          fare: route.fare || 0,
          // Extract stops from routePickupPoints if available
          stops: route.routePickupPoints
            ? route.routePickupPoints
                .map((rpp: any) => rpp.pickupPoint?.name || rpp.pickupPoint?.location || '')
                .filter((stop: string) => stop !== '')
            : route.stops || [],
        }));
        setRoutes(transformedRoutes);
      }
    } catch (error) {
      console.error('Failed to fetch routes');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/transport/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Student assigned to route');
        setIsDialogOpen(false);
        resetForm();
        fetchAssignments();
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
      studentId: '',
      routeId: '',
      pickupPoint: '',
      dropPoint: '',
    });
    setSelectedRoute(null);
  };

  const handleRouteChange = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId);
    setSelectedRoute(route || null);
    setFormData({ ...formData, routeId, pickupPoint: '', dropPoint: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      const res = await fetch(`/api/transport/assign/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Assignment removed');
        fetchAssignments();
      } else {
        toast.error('Failed to remove assignment');
      }
    } catch (error) {
      toast.error('Failed to remove assignment');
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = 
      a.student.firstName.toLowerCase().includes(search.toLowerCase()) ||
      a.student.lastName.toLowerCase().includes(search.toLowerCase()) ||
      a.student.admissionNumber.toLowerCase().includes(search.toLowerCase());
    const matchesRoute = filterRoute === 'all' || a.route.id === filterRoute;
    return matchesSearch && matchesRoute;
  });

  const totalFare = filteredAssignments.reduce((sum, a) => sum + a.route.fare, 0);

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
          <h1 className="text-3xl font-bold">Transport Assignment</h1>
          <p className="text-muted-foreground">Assign students to transport routes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Assign Student to Route</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select
                  value={formData.studentId}
                  onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.filter((student) => student.id).map((student) => (
                      <SelectItem key={student.id} value={String(student.id)}>
                        {student.firstName} {student.lastName} ({student.admissionNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Route</Label>
                <Select
                  value={formData.routeId}
                  onValueChange={handleRouteChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.filter((route) => route.id).map((route) => (
                      <SelectItem key={route.id} value={String(route.id)}>
                        {route.name} (${route.fare})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedRoute && selectedRoute.stops && selectedRoute.stops.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label>Pickup Point</Label>
                    <Select
                      value={formData.pickupPoint}
                      onValueChange={(value) => setFormData({ ...formData, pickupPoint: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pickup point" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedRoute.stops.filter((stop) => stop && String(stop).trim() !== '').map((stop, index) => (
                          <SelectItem key={`pickup-${index}-${stop}`} value={String(stop)}>{stop}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Drop Point</Label>
                    <Select
                      value={formData.dropPoint}
                      onValueChange={(value) => setFormData({ ...formData, dropPoint: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select drop point" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedRoute.stops.filter((stop) => stop && String(stop).trim() !== '').map((stop, index) => (
                          <SelectItem key={`drop-${index}-${stop}`} value={String(stop)}>{stop}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assign
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAssignments.length}</div>
            <p className="text-xs text-muted-foreground">students using transport</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monthly Fare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFare.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">from assigned students</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assigned Students</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={filterRoute} onValueChange={setFilterRoute}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Routes</SelectItem>
                  {routes.filter((route) => route.id).map((route) => (
                    <SelectItem key={route.id} value={String(route.id)}>{route.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission #</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Drop</TableHead>
                <TableHead className="text-right">Fare</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No assignments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.student.firstName} {assignment.student.lastName}
                    </TableCell>
                    <TableCell>{assignment.student.admissionNumber}</TableCell>
                    <TableCell>{assignment.student.class?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{assignment.route.name}</Badge>
                    </TableCell>
                    <TableCell>{assignment.pickupPoint || '-'}</TableCell>
                    <TableCell>{assignment.dropPoint || '-'}</TableCell>
                    <TableCell className="text-right">${assignment.route.fare}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment.id)}>
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
