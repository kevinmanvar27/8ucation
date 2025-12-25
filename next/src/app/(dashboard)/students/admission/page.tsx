'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, User, Users, MapPin, GraduationCap, Bus, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
const admissionSchema = z.object({
  // Basic Info
  admissionNo: z.string().min(1, 'Admission number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.enum(['Male', 'Female', 'Other'], { message: 'Gender is required' }),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  admissionDate: z.string().optional(),
  bloodGroup: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  nationality: z.string().optional(),
  motherTongue: z.string().optional(),
  categoryId: z.string().optional(),
  schoolHouseId: z.string().optional(),
  
  // Address
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  
  // Class Assignment
  sessionId: z.string().min(1, 'Session is required'),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  rollNo: z.string().optional(),
  
  // Parent Info
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  guardianName: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  guardianAddress: z.string().optional(),
  
  // Transport
  routeId: z.string().optional(),
  pickupPointId: z.string().optional(),
  
  // Hostel
  hostelRoomId: z.string().optional(),
});

type AdmissionFormData = z.infer<typeof admissionSchema>;

interface ClassOption {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
}

export default function StudentAdmissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [schoolHouses, setSchoolHouses] = useState<{ id: string; name: string }[]>([]);
  const [routes, setRoutes] = useState<{ id: string; name: string; pickupPoints: { id: string; name: string }[] }[]>([]);
  const [hostels, setHostels] = useState<{ id: string; name: string; rooms: { id: string; roomNo: string }[] }[]>([]);
  const [activeTab, setActiveTab] = useState('basic');

  // Track which data has been loaded
  const [loadedData, setLoadedData] = useState<Record<string, boolean>>({});

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdmissionFormData>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      admissionDate: new Date().toISOString().split('T')[0],
      nationality: 'Indian',
    },
  });

  const selectedClassId = watch('classId');
  const selectedRouteId = watch('routeId');

  // Load data on demand when tabs are switched
  useEffect(() => {
    const loadDataForTab = async () => {
      // Skip if data already loaded
      if (loadedData[activeTab]) return;

      try {
        switch (activeTab) {
          case 'basic':
            // Load critical data first
            if (!loadedData['critical']) {
              const [sessionsRes, classesRes] = await Promise.all([
                fetch('/api/settings/sessions'),
                fetch('/api/academics/classes?withSections=true'),
              ]);

              const [sessionsData, classesData] = await Promise.all([
                sessionsRes.json(),
                classesRes.json(),
              ]);

              if (sessionsData.success) {
                setSessions(sessionsData.data);
                // Set current session as default
                const currentSession = sessionsData.data.find((s: any) => s.isCurrent);
                if (currentSession) {
                  setValue('sessionId', currentSession.id);
                }
              }
              if (classesData.success) setClasses(classesData.data);
              
              setLoadedData(prev => ({ ...prev, critical: true }));
            }
            
            // Load secondary data
            if (!loadedData['secondary']) {
              const [categoriesRes, housesRes, admissionRes] = await Promise.all([
                fetch('/api/students/categories'),
                fetch('/api/settings/school-houses'),
                fetch('/api/students/generate-admission-no'),
              ]);

              const [categoriesData, housesData, admissionData] = await Promise.all([
                categoriesRes.json(),
                housesRes.json(),
                admissionRes.json(),
              ]);

              if (categoriesData.success) setCategories(categoriesData.data);
              if (housesData.success) setSchoolHouses(housesData.data);
              if (admissionData.success) {
                setValue('admissionNo', admissionData.data);
              }
              
              setLoadedData(prev => ({ ...prev, secondary: true }));
            }
            break;

          case 'transport':
            if (!loadedData['transport']) {
              const routesRes = await fetch('/api/transport/routes?withPickupPoints=true');
              const routesData = await routesRes.json();
              if (routesData.success) setRoutes(routesData.data);
              setLoadedData(prev => ({ ...prev, transport: true }));
            }
            break;

          case 'hostel':
            if (!loadedData['hostel']) {
              const hostelsRes = await fetch('/api/hostel?withRooms=true');
              const hostelsData = await hostelsRes.json();
              if (hostelsData.success) setHostels(hostelsData.data);
              setLoadedData(prev => ({ ...prev, hostel: true }));
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to load data for ${activeTab} tab:`, error);
      }
      
      // Mark this tab as loaded
      setLoadedData(prev => ({ ...prev, [activeTab]: true }));
    };

    loadDataForTab();
  }, [activeTab, loadedData, setValue]);

  const sections = selectedClassId 
    ? classes.find(c => c.id === selectedClassId)?.sections || []
    : [];

  const pickupPoints = selectedRouteId
    ? routes.find(r => r.id === selectedRouteId)?.pickupPoints || []
    : [];

  // Update loaded tabs when switching
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setLoadedData(prev => ({ ...prev, [tabId]: true }));
  };  const onSubmit = async (data: AdmissionFormData) => {
    try {
      setLoading(true);

      // Transform data for API
      const payload = {
        admissionNo: data.admissionNo,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        email: data.email || null,
        phone: data.phone || null,
        admissionDate: data.admissionDate,
        bloodGroup: data.bloodGroup || null,
        religion: data.religion || null,
        caste: data.caste || null,
        nationality: data.nationality || null,
        motherTongue: data.motherTongue || null,
        currentAddress: data.currentAddress || null,
        permanentAddress: data.permanentAddress || null,
        categoryId: data.categoryId || null,
        schoolHouseId: data.schoolHouseId || null,
        sessionId: data.sessionId,
        classId: data.classId,
        sectionId: data.sectionId,
        rollNo: data.rollNo || null,
        routeId: data.routeId || null,
        pickupPointId: data.pickupPointId || null,
        hostelRoomId: data.hostelRoomId || null,
        parent: {
          fatherName: data.fatherName || null,
          fatherPhone: data.fatherPhone || null,
          fatherOccupation: data.fatherOccupation || null,
          fatherEmail: data.fatherEmail || null,
          motherName: data.motherName || null,
          motherPhone: data.motherPhone || null,
          motherOccupation: data.motherOccupation || null,
          motherEmail: data.motherEmail || null,
          guardianName: data.guardianName || null,
          guardianRelation: data.guardianRelation || null,
          guardianPhone: data.guardianPhone || null,
          guardianEmail: data.guardianEmail || null,
          guardianAddress: data.guardianAddress || null,
        },
      };

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        toast.success('Student admitted successfully');
        router.push(`/students/${result.data.id}`);
      } else {
        toast.error(result.error || 'Failed to admit student');
      }
    } catch (error) {
      toast.error('Failed to admit student');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'parent', label: 'Parent/Guardian', icon: Users },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'transport', label: 'Transport', icon: Bus },
    { id: 'hostel', label: 'Hostel', icon: Home },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/students">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Student Admission</h1>
            <p className="text-muted-foreground">Add a new student to the school</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
        {/* Basic Info Tab */}
        {activeTab === 'basic' && loadedData.basic && (          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  label="Admission No *"
                  {...register('admissionNo')}
                  error={errors.admissionNo?.message}
                />
                <Input
                  label="First Name *"
                  {...register('firstName')}
                  error={errors.firstName?.message}
                />
                <Input
                  label="Last Name *"
                  {...register('lastName')}
                  error={errors.lastName?.message}
                />
                <Select
                  label="Gender *"
                  {...register('gender')}
                  error={errors.gender?.message}
                  options={[
                    { value: '', label: 'Select Gender' },
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                  ]}
                />
                <Input
                  label="Date of Birth *"
                  type="date"
                  {...register('dateOfBirth')}
                  error={errors.dateOfBirth?.message}
                />
                <Input
                  label="Admission Date"
                  type="date"
                  {...register('admissionDate')}
                />
                <Input
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                />
                <Input
                  label="Phone"
                  {...register('phone')}
                />
                <Select
                  label="Blood Group"
                  {...register('bloodGroup')}
                  options={[
                    { value: '', label: 'Select Blood Group' },
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' },
                  ]}
                />
                <Input
                  label="Religion"
                  {...register('religion')}
                />
                <Input
                  label="Caste"
                  {...register('caste')}
                />
                <Input
                  label="Nationality"
                  {...register('nationality')}
                />
                <Input
                  label="Mother Tongue"
                  {...register('motherTongue')}
                />
                <Select
                  label="Category"
                  {...register('categoryId')}
                  options={[
                    { value: '', label: 'Select Category' },
                    ...categories.map(c => ({ value: c.id, label: c.name })),
                  ]}
                />
                <Select
                  label="School House"
                  {...register('schoolHouseId')}
                  options={[
                    { value: '', label: 'Select House' },
                    ...schoolHouses.map(h => ({ value: h.id, label: h.name })),
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parent/Guardian Tab */}
        {activeTab === 'parent' && loadedData.parent && (          <Card>
            <CardHeader>
              <CardTitle>Parent/Guardian Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Father */}
              <div>
                <h3 className="text-lg font-medium mb-4">Father Details</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <Input label="Father Name" {...register('fatherName')} />
                  <Input label="Phone" {...register('fatherPhone')} />
                  <Input label="Occupation" {...register('fatherOccupation')} />
                  <Input label="Email" type="email" {...register('fatherEmail')} error={errors.fatherEmail?.message} />
                </div>
              </div>

              {/* Mother */}
              <div>
                <h3 className="text-lg font-medium mb-4">Mother Details</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <Input label="Mother Name" {...register('motherName')} />
                  <Input label="Phone" {...register('motherPhone')} />
                  <Input label="Occupation" {...register('motherOccupation')} />
                  <Input label="Email" type="email" {...register('motherEmail')} error={errors.motherEmail?.message} />
                </div>
              </div>

              {/* Guardian */}
              <div>
                <h3 className="text-lg font-medium mb-4">Guardian Details (if different from parents)</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input label="Guardian Name" {...register('guardianName')} />
                  <Input label="Relation" {...register('guardianRelation')} />
                  <Input label="Phone" {...register('guardianPhone')} />
                  <Input label="Email" type="email" {...register('guardianEmail')} error={errors.guardianEmail?.message} />
                  <div className="md:col-span-2">
                    <Textarea label="Guardian Address" {...register('guardianAddress')} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Address Tab */}
        {activeTab === 'address' && loadedData.address && (          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Textarea
                  label="Current Address"
                  {...register('currentAddress')}
                  rows={4}
                />
                <Textarea
                  label="Permanent Address"
                  {...register('permanentAddress')}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Academic Tab */}
        {activeTab === 'academic' && (
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Select
                  label="Session *"
                  {...register('sessionId')}
                  error={errors.sessionId?.message}
                  options={[
                    { value: '', label: 'Select Session' },
                    ...sessions.map(s => ({ value: s.id, label: s.name })),
                  ]}
                />
                <Select
                  label="Class *"
                  {...register('classId')}
                  error={errors.classId?.message}
                  onChange={(e) => {
                    setValue('classId', e.target.value);
                    setValue('sectionId', '');
                  }}
                  options={[
                    { value: '', label: 'Select Class' },
                    ...classes.map(c => ({ value: c.id, label: c.name })),
                  ]}
                />
                <Select
                  label="Section *"
                  {...register('sectionId')}
                  error={errors.sectionId?.message}
                  disabled={!selectedClassId}
                  options={[
                    { value: '', label: 'Select Section' },
                    ...sections.map(s => ({ value: s.id, label: s.name })),
                  ]}
                />
                <Input
                  label="Roll No"
                  {...register('rollNo')}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transport Tab */}
        {activeTab === 'transport' && (
          <Card>
            <CardHeader>
              <CardTitle>Transport Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Route"
                  {...register('routeId')}
                  onChange={(e) => {
                    setValue('routeId', e.target.value);
                    setValue('pickupPointId', '');
                  }}
                  options={[
                    { value: '', label: 'Select Route' },
                    ...routes.map(r => ({ value: r.id, label: r.name })),
                  ]}
                />
                <Select
                  label="Pickup Point"
                  {...register('pickupPointId')}
                  disabled={!selectedRouteId}
                  options={[
                    { value: '', label: 'Select Pickup Point' },
                    ...pickupPoints.map(p => ({ value: p.id, label: p.name })),
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hostel Tab */}
        {activeTab === 'hostel' && (
          <Card>
            <CardHeader>
              <CardTitle>Hostel Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Hostel Room"
                  {...register('hostelRoomId')}
                  options={[
                    { value: '', label: 'Select Room' },
                    ...hostels.flatMap(h => 
                      h.rooms.map(r => ({ 
                        value: r.id, 
                        label: `${h.name} - Room ${r.roomNo}` 
                      }))
                    ),
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="mt-6 flex justify-end gap-4">
          <Link href="/students">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" loading={loading}>
            <Save className="mr-2 h-4 w-4" />
            Save Student
          </Button>
        </div>
      </form>
    </div>
  );
}
