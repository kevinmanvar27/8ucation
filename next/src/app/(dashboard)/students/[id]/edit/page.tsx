'use client';
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { SimpleSelect } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loading } from '@/components/ui/loading';
import { ArrowLeft, Save, User, Users, MapPin, GraduationCap, Bus, Home } from 'lucide-react';
import toast from 'react-hot-toast';

const editStudentSchema = z.object({
  // Basic Info
  admissionNo: z.string().min(1, 'Admission number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().nullable(),
  gender: z.enum(['Male', 'Female', 'Other'], { message: 'Gender is required' }),
  dob: z.string().min(1, 'Date of birth is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  caste: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  motherTongue: z.string().optional().nullable(),
  isActive: z.boolean().optional(),

  // Address
  currentAddress: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),

  // Parent Info
  fatherName: z.string().optional().nullable(),
  fatherPhone: z.string().optional().nullable(),
  fatherOccupation: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  motherPhone: z.string().optional().nullable(),
  motherOccupation: z.string().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianRelation: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  guardianEmail: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
  guardianAddress: z.string().optional().nullable(),
});

type EditStudentFormData = z.infer<typeof editStudentSchema>;

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const studentId = params.id as string;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditStudentFormData>({
    resolver: zodResolver(editStudentSchema),
  });

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/students/${studentId}`);
        const data = await res.json();

        if (data.success) {
          const student = data.data;
          // Format the date for the form
          const formattedDob = student.dob
            ? new Date(student.dob).toISOString().split('T')[0]
            : '';

          // Get parent info from either parents relation or direct fields
          const parentInfo = student.parents || {};

          reset({
            admissionNo: student.admissionNo,
            firstName: student.firstName,
            lastName: student.lastName || '',
            gender: student.gender,
            dob: formattedDob,
            email: student.email || '',
            phone: student.phone || '',
            bloodGroup: student.bloodGroup || '',
            religion: student.religion || '',
            caste: student.caste || '',
            category: student.category || '',
            motherTongue: student.motherTongue || '',
            isActive: student.isActive,
            currentAddress: student.currentAddress || '',
            permanentAddress: student.permanentAddress || '',
            fatherName: parentInfo.fatherName || student.fatherName || '',
            fatherPhone: parentInfo.fatherPhone || student.fatherPhone || '',
            fatherOccupation: parentInfo.fatherOccupation || student.fatherOccupation || '',
            motherName: parentInfo.motherName || student.motherName || '',
            motherPhone: parentInfo.motherPhone || student.motherPhone || '',
            motherOccupation: parentInfo.motherOccupation || student.motherOccupation || '',
            guardianName: parentInfo.guardianName || student.guardianName || '',
            guardianRelation: parentInfo.guardianRelation || student.guardianRelation || '',
            guardianPhone: parentInfo.guardianPhone || student.guardianPhone || '',
            guardianEmail: parentInfo.guardianEmail || student.guardianEmail || '',
            guardianAddress: parentInfo.guardianAddress || student.guardianAddress || '',
          });
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
  }, [studentId, reset, router]);

  const onSubmit = async (data: EditStudentFormData) => {
    try {
      setSaving(true);

      // Transform data for API
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName || null,
        gender: data.gender,
        dob: data.dob,
        email: data.email || null,
        phone: data.phone || null,
        bloodGroup: data.bloodGroup || null,
        religion: data.religion || null,
        caste: data.caste || null,
        category: data.category || null,
        motherTongue: data.motherTongue || null,
        currentAddress: data.currentAddress || null,
        permanentAddress: data.permanentAddress || null,
        isActive: data.isActive,
        parent: {
          fatherName: data.fatherName || null,
          fatherPhone: data.fatherPhone || null,
          fatherOccupation: data.fatherOccupation || null,
          motherName: data.motherName || null,
          motherPhone: data.motherPhone || null,
          motherOccupation: data.motherOccupation || null,
          guardianName: data.guardianName || null,
          guardianRelation: data.guardianRelation || null,
          guardianPhone: data.guardianPhone || null,
          guardianEmail: data.guardianEmail || null,
          guardianAddress: data.guardianAddress || null,
        },
      };

      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        toast.success('Student updated successfully');
        router.push(`/students/${studentId}`);
      } else {
        toast.error(result.error || 'Failed to update student');
      }
    } catch (error) {
      toast.error('Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'parent', label: 'Parent/Guardian', icon: Users },
    { id: 'address', label: 'Address', icon: MapPin },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/students/${studentId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Student</h1>
            <p className="text-muted-foreground">Update student information</p>
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
              onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'basic' && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  label="Admission No"
                  {...register('admissionNo')}
                  error={errors.admissionNo?.message}
                  disabled
                />
                <Input
                  label="First Name *"
                  {...register('firstName')}
                  error={errors.firstName?.message}
                />
                <Input
                  label="Last Name"
                  {...register('lastName')}
                  error={errors.lastName?.message}
                />
                <SimpleSelect
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
                <Controller
                  name="dob"
                  control={control}
                  render={({ field }) => (
                    <DateInput
                      label="Date of Birth *"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      error={errors.dob?.message}
                    />
                  )}
                />
                <Input
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                />
                <Input label="Phone" {...register('phone')} />
                <SimpleSelect
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
                <Input label="Religion" {...register('religion')} />
                <Input label="Caste" {...register('caste')} />
                <Input label="Category" {...register('category')} />
                <Input label="Mother Tongue" {...register('motherTongue')} />
                <SimpleSelect
                  label="Status"
                  {...register('isActive', {
                    setValueAs: (v) => v === 'true' || v === true,
                  })}
                  options={[
                    { value: 'true', label: 'Active' },
                    { value: 'false', label: 'Inactive' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parent/Guardian Tab */}
        {activeTab === 'parent' && (
          <Card>
            <CardHeader>
              <CardTitle>Parent/Guardian Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Father */}
              <div>
                <h3 className="text-lg font-medium mb-4">Father Details</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input label="Father Name" {...register('fatherName')} />
                  <Input label="Phone" {...register('fatherPhone')} />
                  <Input label="Occupation" {...register('fatherOccupation')} />
                </div>
              </div>

              {/* Mother */}
              <div>
                <h3 className="text-lg font-medium mb-4">Mother Details</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input label="Mother Name" {...register('motherName')} />
                  <Input label="Phone" {...register('motherPhone')} />
                  <Input label="Occupation" {...register('motherOccupation')} />
                </div>
              </div>

              {/* Guardian */}
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Guardian Details (if different from parents)
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input label="Guardian Name" {...register('guardianName')} />
                  <Input label="Relation" {...register('guardianRelation')} />
                  <Input label="Phone" {...register('guardianPhone')} />
                  <Input
                    label="Email"
                    type="email"
                    {...register('guardianEmail')}
                    error={errors.guardianEmail?.message}
                  />
                  <div className="md:col-span-2">
                    <Textarea label="Guardian Address" {...register('guardianAddress')} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Address Tab */}
        {activeTab === 'address' && (
          <Card>
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

        {/* Submit Button */}
        <div className="mt-6 flex justify-end gap-4">
          <Link href={`/students/${studentId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
