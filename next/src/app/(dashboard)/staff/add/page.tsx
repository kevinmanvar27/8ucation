'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, User, Briefcase, MapPin, CreditCard, Link2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface RoleData {
  id: number;
  name: string;
}

interface DepartmentData {
  id: number;
  name: string;
}

interface DesignationData {
  id: number;
  name: string;
}

const tabs = [
  { id: 'basic', label: 'Basic Info', icon: User },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'address', label: 'Address', icon: MapPin },
  { id: 'bank', label: 'Bank Details', icon: CreditCard },
  { id: 'social', label: 'Social Links', icon: Link2 },
  { id: 'login', label: 'Login Details', icon: Lock },
];

export default function AddStaffPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [designations, setDesignations] = useState<DesignationData[]>([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    // Basic Info
    employeeId: '',
    firstName: '',
    lastName: '',
    gender: 'Male',
    dob: '',
    email: '',
    phone: '',
    emergencyPhone: '',
    maritalStatus: '',
    image: '',

    // Employment
    roleId: '',
    departmentId: '',
    designationId: '',
    qualification: '',
    experience: '',
    joiningDate: '',
    basicSalary: '',
    contractType: '',
    note: '',

    // Address
    currentAddress: '',
    permanentAddress: '',

    // Bank Details
    bankName: '',
    bankAccountNo: '',
    ifscCode: '',
    panNumber: '',

    // Social Links
    facebook: '',
    twitter: '',
    linkedin: '',
    instagram: '',

    // Login Details
    createLogin: false,
    password: '',
    confirmPassword: '',
  });

  const fetchDropdownData = useCallback(async () => {
    try {
      const [rolesRes, deptRes, desigRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/staff/departments'),
        fetch('/api/staff/designations'),
      ]);

      const rolesData = await rolesRes.json();
      const deptData = await deptRes.json();
      const desigData = await desigRes.json();

      if (rolesData.success) setRoles(rolesData.data);
      if (deptData.success) setDepartments(deptData.data);
      if (desigData.success) setDesignations(desigData.data);
    } catch (error) {
      console.error('Failed to fetch dropdown data');
    }
  }, []);

  const generateEmployeeId = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/generate-id');
      const data = await res.json();
      if (data.success) {
        setFormData((prev) => ({ ...prev, employeeId: data.data }));
      }
    } catch (error) {
      // Generate a simple ID if API fails
      const id = `EMP${Date.now().toString().slice(-6)}`;
      setFormData((prev) => ({ ...prev, employeeId: id }));
    }
  }, []);

  useEffect(() => {
    fetchDropdownData();
    generateEmployeeId();
  }, [fetchDropdownData, generateEmployeeId]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.employeeId.trim()) {
      toast.error('Employee ID is required');
      setActiveTab('basic');
      return false;
    }
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      setActiveTab('basic');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      setActiveTab('basic');
      return false;
    }
    if (!formData.roleId) {
      toast.error('Role is required');
      setActiveTab('employment');
      return false;
    }
    if (formData.createLogin) {
      if (!formData.password) {
        toast.error('Password is required when creating login');
        setActiveTab('login');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        setActiveTab('login');
        return false;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        setActiveTab('login');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        employeeId: formData.employeeId,
        firstName: formData.firstName,
        lastName: formData.lastName || null,
        gender: formData.gender,
        dob: formData.dob || null,
        email: formData.email,
        phone: formData.phone || null,
        emergencyPhone: formData.emergencyPhone || null,
        maritalStatus: formData.maritalStatus || null,
        image: formData.image || null,
        roleId: parseInt(formData.roleId),
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        designationId: formData.designationId ? parseInt(formData.designationId) : null,
        qualification: formData.qualification || null,
        experience: formData.experience || null,
        joiningDate: formData.joiningDate || null,
        basicSalary: formData.basicSalary ? parseFloat(formData.basicSalary) : 0,
        contractType: formData.contractType || null,
        note: formData.note || null,
        currentAddress: formData.currentAddress || null,
        permanentAddress: formData.permanentAddress || null,
        bankName: formData.bankName || null,
        bankAccountNo: formData.bankAccountNo || null,
        ifscCode: formData.ifscCode || null,
        panNumber: formData.panNumber || null,
        facebook: formData.facebook || null,
        twitter: formData.twitter || null,
        linkedin: formData.linkedin || null,
        instagram: formData.instagram || null,
        createLogin: formData.createLogin,
        password: formData.createLogin ? formData.password : undefined,
      };

      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Staff member added successfully');
        router.push('/staff');
      } else {
        toast.error(data.error || 'Failed to add staff');
      }
    } catch (error) {
      toast.error('Failed to add staff');
    } finally {
      setSaving(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Employee ID *"
              value={formData.employeeId}
              onChange={(e) => handleChange('employeeId', e.target.value)}
              placeholder="Auto-generated"
            />
            <Input
              label="First Name *"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="Enter first name"
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Enter last name"
            />
            <Select
              label="Gender *"
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
            />
            <Input
              type="date"
              label="Date of Birth"
              value={formData.dob}
              onChange={(e) => handleChange('dob', e.target.value)}
            />
            <Input
              type="email"
              label="Email *"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter email address"
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter phone number"
            />
            <Input
              label="Emergency Phone"
              value={formData.emergencyPhone}
              onChange={(e) => handleChange('emergencyPhone', e.target.value)}
              placeholder="Enter emergency contact"
            />
            <Select
              label="Marital Status"
              value={formData.maritalStatus}
              onChange={(e) => handleChange('maritalStatus', e.target.value)}
              placeholder="Select Status"
              options={[
                { value: 'Single', label: 'Single' },
                { value: 'Married', label: 'Married' },
                { value: 'Divorced', label: 'Divorced' },
                { value: 'Widowed', label: 'Widowed' },
              ]}
            />
            <Input
              label="Photo URL"
              value={formData.image}
              onChange={(e) => handleChange('image', e.target.value)}
              placeholder="Enter image URL"
            />
          </div>
        );

      case 'employment':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label="Role *"
              value={formData.roleId}
              onChange={(e) => handleChange('roleId', e.target.value)}
              placeholder="Select Role"
              options={roles.map((role) => ({
                value: role.id.toString(),
                label: role.name,
              }))}
            />
            <Select
              label="Department"
              value={formData.departmentId}
              onChange={(e) => handleChange('departmentId', e.target.value)}
              placeholder="Select Department"
              options={departments.map((dept) => ({
                value: dept.id.toString(),
                label: dept.name,
              }))}
            />
            <Select
              label="Designation"
              value={formData.designationId}
              onChange={(e) => handleChange('designationId', e.target.value)}
              placeholder="Select Designation"
              options={designations.map((desig) => ({
                value: desig.id.toString(),
                label: desig.name,
              }))}
            />
            <Input
              label="Qualification"
              value={formData.qualification}
              onChange={(e) => handleChange('qualification', e.target.value)}
              placeholder="e.g., B.Ed, M.Sc"
            />
            <Input
              label="Experience"
              value={formData.experience}
              onChange={(e) => handleChange('experience', e.target.value)}
              placeholder="e.g., 5 years"
            />
            <Input
              type="date"
              label="Joining Date"
              value={formData.joiningDate}
              onChange={(e) => handleChange('joiningDate', e.target.value)}
            />
            <Input
              type="number"
              label="Basic Salary"
              value={formData.basicSalary}
              onChange={(e) => handleChange('basicSalary', e.target.value)}
              placeholder="Enter salary"
            />
            <Select
              label="Contract Type"
              value={formData.contractType}
              onChange={(e) => handleChange('contractType', e.target.value)}
              placeholder="Select Type"
              options={[
                { value: 'Permanent', label: 'Permanent' },
                { value: 'Temporary', label: 'Temporary' },
                { value: 'Contract', label: 'Contract' },
                { value: 'Probation', label: 'Probation' },
              ]}
            />
            <div className="md:col-span-2 lg:col-span-3">
              <Textarea
                label="Note"
                value={formData.note}
                onChange={(e) => handleChange('note', e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Current Address"
              value={formData.currentAddress}
              onChange={(e) => handleChange('currentAddress', e.target.value)}
              placeholder="Enter current address"
              rows={4}
            />
            <Textarea
              label="Permanent Address"
              value={formData.permanentAddress}
              onChange={(e) => handleChange('permanentAddress', e.target.value)}
              placeholder="Enter permanent address"
              rows={4}
            />
          </div>
        );

      case 'bank':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Bank Name"
              value={formData.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              placeholder="Enter bank name"
            />
            <Input
              label="Account Number"
              value={formData.bankAccountNo}
              onChange={(e) => handleChange('bankAccountNo', e.target.value)}
              placeholder="Enter account number"
            />
            <Input
              label="IFSC Code"
              value={formData.ifscCode}
              onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
              placeholder="Enter IFSC code"
            />
            <Input
              label="PAN Number"
              value={formData.panNumber}
              onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
              placeholder="Enter PAN number"
            />
          </div>
        );

      case 'social':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Facebook"
              value={formData.facebook}
              onChange={(e) => handleChange('facebook', e.target.value)}
              placeholder="Facebook profile URL"
            />
            <Input
              label="Twitter"
              value={formData.twitter}
              onChange={(e) => handleChange('twitter', e.target.value)}
              placeholder="Twitter profile URL"
            />
            <Input
              label="LinkedIn"
              value={formData.linkedin}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              placeholder="LinkedIn profile URL"
            />
            <Input
              label="Instagram"
              value={formData.instagram}
              onChange={(e) => handleChange('instagram', e.target.value)}
              placeholder="Instagram profile URL"
            />
          </div>
        );

      case 'login':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="createLogin"
                checked={formData.createLogin}
                onChange={(e) => handleChange('createLogin', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="createLogin" className="text-sm font-medium">
                Create login account for this staff member
              </label>
            </div>

            {formData.createLogin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Username will be the staff member&apos;s email address
                  </p>
                  <Input
                    label="Username"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div />
                <Input
                  type="password"
                  label="Password *"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Enter password"
                />
                <Input
                  type="password"
                  label="Confirm Password *"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirm password"
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add Staff</h1>
            <p className="text-muted-foreground">Add a new staff member</p>
          </div>
        </div>
        <Button onClick={handleSubmit} loading={saving}>
          <Save className="mr-2 h-4 w-4" />
          Save Staff
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {tabs.find((t) => t.id === activeTab)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>{renderTabContent()}</CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const currentIndex = tabs.findIndex((t) => t.id === activeTab);
            if (currentIndex > 0) {
              setActiveTab(tabs[currentIndex - 1].id);
            }
          }}
          disabled={activeTab === tabs[0].id}
        >
          Previous
        </Button>
        <Button
          onClick={() => {
            const currentIndex = tabs.findIndex((t) => t.id === activeTab);
            if (currentIndex < tabs.length - 1) {
              setActiveTab(tabs[currentIndex + 1].id);
            } else {
              handleSubmit();
            }
          }}
          loading={saving && activeTab === tabs[tabs.length - 1].id}
        >
          {activeTab === tabs[tabs.length - 1].id ? 'Save Staff' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
