'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { 
  DollarSign,
  User,
  Calendar,
  CreditCard,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  class: {
    name: string;
  };
  section: {
    name: string;
  };
  fees: {
    total: number;
    paid: number;
    due: number;
  };
}

interface FeeType {
  id: string;
  name: string;
  amount: number;
}

export default function CollectStudentFeePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    feeTypeId: '',
    paymentMethod: 'cash',
    notes: '',
  });

  const fetchStudent = async () => {
    try {
      const res = await fetch(`/api/students/${studentId}?includeFees=true`);
      const data = await res.json();
      
      if (data.success) {
        setStudent(data.data);
        // Set default amount to due amount
        setFormData(prev => ({
          ...prev,
          amount: data.data.fees.due.toString()
        }));
      } else {
        toast.error(data.error || 'Failed to fetch student');
      }
    } catch (error) {
      toast.error('Failed to fetch student');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeTypes = async () => {
    try {
      const res = await fetch('/api/fees/types');
      const data = await res.json();
      
      if (data.success) {
        setFeeTypes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch fee types');
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchStudent();
      fetchFeeTypes();
    }
  }, [studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setProcessing(true);
      
      const res = await fetch('/api/fees/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          amount: parseFloat(formData.amount),
          feeTypeId: formData.feeTypeId,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('Fee collected successfully');
        router.push('/fees/collect');
      } else {
        toast.error(data.error || 'Failed to collect fee');
      }
    } catch (error) {
      toast.error('Failed to collect fee');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!student) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Student not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Button 
          variant="ghost" 
          onClick={() => router.push('/fees/collect')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collect Fees
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Collect Fee</h1>
        <p className="text-muted-foreground">
          Collect fee from {student.firstName} {student.lastName}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Student Info */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-medium text-primary">
                    {student.firstName[0]}{student.lastName[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Admission No: {student.admissionNo}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Class:</span>
                  <span>{student.class.name} - {student.section.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Fees:</span>
                  <span className="font-medium">${student.fees.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid:</span>
                  <span className="text-green-600">${student.fees.paid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due:</span>
                  <span className={`font-medium ${student.fees.due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${student.fees.due.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="pl-10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feeTypeId">Fee Type</Label>
                    <Select
                      id="feeTypeId"
                      value={formData.feeTypeId}
                      onChange={(e) => setFormData({...formData, feeTypeId: e.target.value})}
                      options={[
                        { value: '', label: 'Select Fee Type' },
                        ...feeTypes.map(ft => ({ value: ft.id, label: ft.name }))
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      id="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                      options={[
                        { value: 'cash', label: 'Cash' },
                        { value: 'card', label: 'Credit/Debit Card' },
                        { value: 'bank', label: 'Bank Transfer' },
                        { value: 'cheque', label: 'Cheque' },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes (optional)"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/fees/collect')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={processing}
                    disabled={processing || student.fees.due <= 0}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Collect Fee
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}