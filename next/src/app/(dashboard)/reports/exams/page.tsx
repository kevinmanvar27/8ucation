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
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Filter,
  Loader2,
  FileSpreadsheet,
  Printer,
  Trophy,
  TrendingUp,
  TrendingDown,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

interface ExamResult {
  id: number;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  examName: string;
  subject: string;
  maxMarks: number;
  marksObtained: number;
  percentage: number;
  grade?: string;
  isAbsent: boolean;
}

interface Class {
  id: number;
  className: string;
}

interface Exam {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
}

export default function ExamReportsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    classId: '',
    examId: '',
    subjectId: '',
    search: '',
  });

  useEffect(() => {
    fetchClasses();
    fetchExams();
    fetchSubjects();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        const classesArray = data.data || data || [];
        setClasses(Array.isArray(classesArray) ? classesArray : []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/exams');
      if (response.ok) {
        const data = await response.json();
        const examsArray = data.data || data || [];
        setExams(Array.isArray(examsArray) ? examsArray : []);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setExams([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const data = await response.json();
        const subjectsArray = data.data || data || [];
        setSubjects(Array.isArray(subjectsArray) ? subjectsArray : []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.classId) params.append('classId', filters.classId);
      if (filters.examId) params.append('examId', filters.examId);
      if (filters.subjectId) params.append('subjectId', filters.subjectId);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/reports/exams?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        toast.success(`Found ${data.length} results`);
      } else {
        toast.error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Admission No', 'Student Name', 'Class', 'Section', 'Exam', 'Subject', 'Max Marks', 'Marks Obtained', 'Percentage', 'Grade', 'Status'];
    const rows = results.map(r => [
      r.admissionNo,
      r.studentName,
      r.className,
      r.section,
      r.examName,
      r.subject,
      r.maxMarks,
      r.isAbsent ? 'AB' : r.marksObtained,
      r.isAbsent ? '-' : `${r.percentage.toFixed(1)}%`,
      r.grade || '-',
      r.isAbsent ? 'Absent' : (r.percentage >= 33 ? 'Pass' : 'Fail')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const printReport = () => {
    window.print();
  };

  const getGradeBadge = (percentage: number, isAbsent: boolean) => {
    if (isAbsent) return <Badge variant="outline">Absent</Badge>;
    if (percentage >= 90) return <Badge className="bg-green-600">A+</Badge>;
    if (percentage >= 80) return <Badge className="bg-green-500">A</Badge>;
    if (percentage >= 70) return <Badge className="bg-blue-500">B+</Badge>;
    if (percentage >= 60) return <Badge className="bg-blue-400">B</Badge>;
    if (percentage >= 50) return <Badge className="bg-yellow-500">C</Badge>;
    if (percentage >= 33) return <Badge className="bg-orange-500">D</Badge>;
    return <Badge variant="destructive">F</Badge>;
  };

  const validResults = results.filter(r => !r.isAbsent);
  const stats = {
    total: results.length,
    passed: validResults.filter(r => r.percentage >= 33).length,
    failed: validResults.filter(r => r.percentage < 33).length,
    absent: results.filter(r => r.isAbsent).length,
    avgPercentage: validResults.length > 0 
      ? (validResults.reduce((sum, r) => sum + r.percentage, 0) / validResults.length).toFixed(1)
      : '0',
    highest: validResults.length > 0 ? Math.max(...validResults.map(r => r.percentage)).toFixed(1) : '0',
    lowest: validResults.length > 0 ? Math.min(...validResults.map(r => r.percentage)).toFixed(1) : '0',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exam Reports</h1>
          <p className="text-muted-foreground">Generate exam performance reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={results.length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={printReport} disabled={results.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={filters.classId} onValueChange={(v) => setFilters({ ...filters, classId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.filter((c) => c.id).map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Exam</Label>
              <Select value={filters.examId} onValueChange={(v) => setFilters({ ...filters, examId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Exams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {exams.filter((e) => e.id).map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={filters.subjectId} onValueChange={(v) => setFilters({ ...filters, subjectId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.filter((s) => s.id).map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Name or Admission No"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={generateReport} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {results.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-3">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Passed</p>
                  <p className="text-2xl font-bold">{stats.passed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-red-100 p-3">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold">{stats.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-purple-100 p-3">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-2xl font-bold">{stats.avgPercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Highest</p>
                  <p className="text-2xl font-bold">{stats.highest}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-yellow-100 p-3">
                  <TrendingDown className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lowest</p>
                  <p className="text-2xl font-bold">{stats.lowest}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      <Card className="print:shadow-none">
        <CardHeader>
          <CardTitle>Report Results</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No data to display. Use the filters above to generate a report.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Max Marks</TableHead>
                  <TableHead className="text-center">Obtained</TableHead>
                  <TableHead className="text-center">Percentage</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.admissionNo}</TableCell>
                    <TableCell>{result.studentName}</TableCell>
                    <TableCell>{result.className} - {result.section}</TableCell>
                    <TableCell>{result.examName}</TableCell>
                    <TableCell>{result.subject}</TableCell>
                    <TableCell className="text-center">{result.maxMarks}</TableCell>
                    <TableCell className="text-center">
                      {result.isAbsent ? <span className="text-muted-foreground">AB</span> : result.marksObtained}
                    </TableCell>
                    <TableCell className="text-center">
                      {result.isAbsent ? '-' : `${result.percentage.toFixed(1)}%`}
                    </TableCell>
                    <TableCell className="text-center">
                      {getGradeBadge(result.percentage, result.isAbsent)}
                    </TableCell>
                    <TableCell className="text-center">
                      {result.isAbsent ? (
                        <Badge variant="outline">Absent</Badge>
                      ) : result.percentage >= 33 ? (
                        <Badge variant="default">Pass</Badge>
                      ) : (
                        <Badge variant="destructive">Fail</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
