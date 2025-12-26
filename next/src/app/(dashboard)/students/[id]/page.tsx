'use client';
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loading } from '@/components/ui/loading';
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  Users,
  Bus,
  Home,
  FileText,
  CreditCard,
  ClipboardCheck,
  Award,
  History,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/modal';

interface StudentData {
  id: number;
  admissionNo: string;
  firstName: string;
  lastName: string | null;
  gender: string;
  dob: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
  bloodGroup: string | null;
  religion: string | null;
  caste: string | null;
  category: string | null;
  motherTongue: string | null;
  currentAddress: string | null;
  permanentAddress: string | null;
  admissionDate: string | null;
  isActive: boolean;
  fatherName: string | null;
  fatherPhone: string | null;
  fatherOccupation: string | null;
  motherName: string | null;
  motherPhone: string | null;
  motherOccupation: string | null;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  guardianAddress: string | null;
  parents: {
    fatherName: string | null;
    fatherPhone: string | null;
    fatherOccupation: string | null;
    motherName: string | null;
    motherPhone: string | null;
    motherOccupation: string | null;
    guardianName: string | null;
    guardianRelation: string | null;
    guardianPhone: string | null;
    guardianEmail: string | null;
    guardianAddress: string | null;
  } | null;
  student_sessions: Array<{
    id: number;
    rollNo: string | null;
    sessions: { session: string } | null;
    class_sections: {
      classes: { className: string } | null;
      sections: { sectionName: string } | null;
    } | null;
  }>;
  hostel_rooms: {
    roomNo: string;
    hostels: { name: string } | null;
    room_types: { name: string } | null;
  } | null;
  route_pickup_points: {
    name: string;
    transport_routes: { name: string } | null;
  } | null;
  student_documents: Array<{
    id: number;
    title: string;
    documentType: string;
    filePath: string;
    createdAt: string;
  }>;
  student_timeline: Array<{
    id: number;
    title: string;
    description: string | null;
    date: string;
  }>;
  fee_payments: Array<{
    id: number;
    amount: number;
    paymentDate: string;
    paymentMode: string;
    status: string;
  }>;
  student_attendances: Array<{
    id: number;
    date: string;
    status: string;
    remarks: string | null;
  }>;
  exam_results: Array<{
    id: number;
    marksObtained: number;
    exam_subjects: {
      maxMarks: number;
      exams: { name: string } | null;
      subjects: { name: string } | null;
    } | null;
  }>;
}

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const studentId = params.id as string;

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/students/${studentId}`);
        const data = await res.json();

        if (data.success) {
          setStudent(data.data);
        } else {
          toast.error(data.error || 'Failed to fetch student');
          router.push('/students');
        }
      } catch (error) {
        toast.error('Failed to fetch student');
        router.push('/students');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStudent();
    }
  }, [studentId, router]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Student deleted successfully');
        router.push('/students');
      } else {
        toast.error(data.error || 'Failed to delete student');
      }
    } catch (error) {
      toast.error('Failed to delete student');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return 'N/A';
    try {
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) return 'N/A';
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} years`;
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Student not found</p>
        <Link href="/students" className="mt-4">
          <Button>Back to Students</Button>
        </Link>
      </div>
    );
  }

  const currentSession = student.student_sessions?.[0];
  const parentInfo = student.parents || {
    fatherName: student.fatherName,
    fatherPhone: student.fatherPhone,
    fatherOccupation: student.fatherOccupation,
    motherName: student.motherName,
    motherPhone: student.motherPhone,
    motherOccupation: student.motherOccupation,
    guardianName: student.guardianName,
    guardianRelation: student.guardianRelation,
    guardianPhone: student.guardianPhone,
    guardianEmail: student.guardianEmail,
    guardianAddress: student.guardianAddress,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/students">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-muted-foreground">
              Admission No: {student.admissionNo}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/students/${studentId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setDeleteModalOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center">
                {student.image ? (
                  <img
                    src={student.image}
                    alt={student.firstName}
                    className="h-32 w-32 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-primary">
                    {student.firstName[0]}
                    {student.lastName?.[0] || ''}
                  </span>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Class & Section</p>
                <p className="font-medium">
                  {currentSession?.class_sections?.classes?.className || 'Not Assigned'}{' '}
                  {currentSession?.class_sections?.sections?.sectionName && 
                    `- ${currentSession.class_sections.sections.sectionName}`}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Roll No</p>
                <p className="font-medium">{currentSession?.rollNo || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Session</p>
                <p className="font-medium">{currentSession?.sessions?.session || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{student.gender}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{formatDate(student.dob)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{calculateAge(student.dob)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={student.isActive ? 'success' : 'secondary'}>
                  {student.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Admission Date</p>
                <p className="font-medium">{formatDate(student.admissionDate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Blood Group</p>
                <p className="font-medium">{student.bloodGroup || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="parents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Parents
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Academic
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Fees
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Personal Tab */}
        <TabsContent value="personal">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Religion</p>
                    <p className="font-medium">{student.religion || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Caste</p>
                    <p className="font-medium">{student.caste || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{student.category || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mother Tongue</p>
                    <p className="font-medium">{student.motherTongue || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{student.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{student.phone || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Address</p>
                    <p className="font-medium">{student.currentAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Permanent Address</p>
                    <p className="font-medium">{student.permanentAddress || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transport Info */}
            {student.route_pickup_points && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="h-5 w-5" />
                    Transport
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Route</p>
                      <p className="font-medium">
                        {student.route_pickup_points.transport_routes?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup Point</p>
                      <p className="font-medium">{student.route_pickup_points.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hostel Info */}
            {student.hostel_rooms && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Hostel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Hostel</p>
                      <p className="font-medium">
                        {student.hostel_rooms.hostels?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Room</p>
                      <p className="font-medium">{student.hostel_rooms.roomNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Room Type</p>
                      <p className="font-medium">
                        {student.hostel_rooms.room_types?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Parents Tab */}
        <TabsContent value="parents">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Father Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{parentInfo?.fatherName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{parentInfo?.fatherPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Occupation</p>
                  <p className="font-medium">{parentInfo?.fatherOccupation || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mother Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{parentInfo?.motherName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{parentInfo?.motherPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Occupation</p>
                  <p className="font-medium">{parentInfo?.motherOccupation || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guardian Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{parentInfo?.guardianName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Relation</p>
                  <p className="font-medium">{parentInfo?.guardianRelation || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{parentInfo?.guardianPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{parentInfo?.guardianEmail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{parentInfo?.guardianAddress || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Session History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {student.student_sessions.length === 0 ? (
                  <p className="text-muted-foreground">No session history available</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Roll No</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.student_sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.sessions?.session || 'N/A'}</TableCell>
                          <TableCell>
                            {session.class_sections?.classes?.className || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {session.class_sections?.sections?.sectionName || 'N/A'}
                          </TableCell>
                          <TableCell>{session.rollNo || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Recent Exam Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {student.exam_results.length === 0 ? (
                  <p className="text-muted-foreground">No exam results available</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Max Marks</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.exam_results.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell>
                            {result.exam_subjects?.exams?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {result.exam_subjects?.subjects?.name || 'N/A'}
                          </TableCell>
                          <TableCell>{result.marksObtained}</TableCell>
                          <TableCell>{result.exam_subjects?.maxMarks || 'N/A'}</TableCell>
                          <TableCell>
                            {result.exam_subjects?.maxMarks
                              ? `${((result.marksObtained / result.exam_subjects.maxMarks) * 100).toFixed(1)}%`
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Recent Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.student_attendances.length === 0 ? (
                <p className="text-muted-foreground">No attendance records available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.student_attendances.map((attendance) => (
                      <TableRow key={attendance.id}>
                        <TableCell>{formatDate(attendance.date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              attendance.status === 'present'
                                ? 'success'
                                : attendance.status === 'absent'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {attendance.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{attendance.remarks || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Fee Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.fee_payments.length === 0 ? (
                <p className="text-muted-foreground">No fee payments available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.fee_payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{payment.paymentMode}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === 'completed'
                                ? 'success'
                                : payment.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.student_documents.length === 0 ? (
                <p className="text-muted-foreground">No documents uploaded</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.student_documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>{doc.title}</TableCell>
                        <TableCell>{doc.documentType}</TableCell>
                        <TableCell>{formatDate(doc.createdAt)}</TableCell>
                        <TableCell>
                          <a
                            href={doc.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Student"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete{' '}
            <strong>
              {student.firstName} {student.lastName}
            </strong>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
