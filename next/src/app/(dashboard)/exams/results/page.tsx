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
import { Loader2, Search, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ExamResult {
  id: string;
  marksObtained: number;
  grade: string | null;
  remarks: string | null;
  student: {
    admissionNo: string;
    firstName: string;
    lastName: string;
  };
  subject: { name: string };
}

interface Exam {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

export default function ExamResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchExams();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedExam && selectedClass) {
      fetchResults();
    }
  }, [selectedExam, selectedClass]);

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams');
      if (res.ok) {
        const data = await res.json();
        setExams(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch exams');
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/academics/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exams/results?examId=${selectedExam}&classId=${selectedClass}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.data || data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(
    (result) =>
      result.student.firstName.toLowerCase().includes(search.toLowerCase()) ||
      result.student.lastName.toLowerCase().includes(search.toLowerCase()) ||
      result.student.admissionNo.toLowerCase().includes(search.toLowerCase())
  );

  // Group results by student
  const groupedResults = filteredResults.reduce((acc, result) => {
    const studentId = result.student.admissionNo;
    if (!acc[studentId]) {
      acc[studentId] = {
        student: result.student,
        subjects: [],
        total: 0,
      };
    }
    acc[studentId].subjects.push({
      name: result.subject.name,
      marks: result.marksObtained,
      grade: result.grade,
    });
    acc[studentId].total += result.marksObtained;
    return acc;
  }, {} as Record<string, { student: ExamResult['student']; subjects: { name: string; marks: number; grade: string | null }[]; total: number }>);

  if (loading && !selectedExam) {
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
          <h1 className="text-3xl font-bold">Exam Results</h1>
          <p className="text-muted-foreground">View and manage exam results</p>
        </div>
        <Button variant="outline" disabled={results.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="w-48">
              <Label>Exam</Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.filter((exam) => exam.id).map((exam) => (
                    <SelectItem key={exam.id} value={String(exam.id)}>{exam.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.filter((cls) => cls.id).map((cls) => (
                    <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Search Student</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or admission no..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedExam && selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : Object.keys(groupedResults).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No results found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Average</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(groupedResults).map((data) => (
                    <TableRow key={data.student.admissionNo}>
                      <TableCell className="font-medium">{data.student.admissionNo}</TableCell>
                      <TableCell>{data.student.firstName} {data.student.lastName}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {data.subjects.map((subject, idx) => (
                            <div key={idx} className="text-sm">
                              {subject.name}: {subject.marks} {subject.grade && `(${subject.grade})`}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{data.total}</TableCell>
                      <TableCell>
                        {data.subjects.length > 0
                          ? (data.total / data.subjects.length).toFixed(1)
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
