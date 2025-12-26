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
import { Plus, Loader2, RotateCcw, BookOpen, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays, isValid, parseISO } from 'date-fns';

interface BookIssue {
  id: string;
  book: { id: string; title: string; author: string };
  member: { id: string; name: string; membershipId: string };
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  fine: number;
}

interface Book {
  id: string;
  title: string;
  author: string;
  availableQuantity: number;
}

interface Member {
  id: string;
  name: string;
  membershipId: string;
}

// Helper function to safely format dates
const formatDate = (dateString: string | null | undefined, formatStr: string = 'MMM d, yyyy'): string => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(date)) return '-';
    return format(date, formatStr);
  } catch {
    return '-';
  }
};

// Helper function to safely calculate days difference
const safeDifferenceInDays = (date1: Date, dateString: string): number => {
  try {
    const date2 = parseISO(dateString);
    if (!isValid(date2)) return 0;
    return differenceInDays(date1, date2);
  } catch {
    return 0;
  }
};

export default function BookIssuePage() {
  const [issues, setIssues] = useState<BookIssue[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    bookId: '',
    memberId: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchIssues();
    fetchBooks();
    fetchMembers();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/library/issue');
      if (res.ok) {
        const data = await res.json();
        const issuesArray = data.data || data || [];
        setIssues(Array.isArray(issuesArray) ? issuesArray : []);
      }
    } catch (error) {
      toast.error('Failed to fetch issues');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/library/books');
      if (res.ok) {
        const data = await res.json();
        const booksArray = data.data || data || [];
        setBooks(Array.isArray(booksArray) ? booksArray.filter((b: Book) => b.availableQuantity > 0) : []);
      }
    } catch (error) {
      console.error('Failed to fetch books');
      setBooks([]);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/library/members');
      if (res.ok) {
        const data = await res.json();
        const membersArray = data.data || data || [];
        setMembers(Array.isArray(membersArray) ? membersArray : []);
      }
    } catch (error) {
      console.error('Failed to fetch members');
      setMembers([]);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/library/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Book issued successfully');
        setIsDialogOpen(false);
        resetForm();
        fetchIssues();
        fetchBooks();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to issue book');
      }
    } catch (error) {
      toast.error('Failed to issue book');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (id: string) => {
    if (!confirm('Mark this book as returned?')) return;

    try {
      const res = await fetch(`/api/library/issue/${id}/return`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Book returned successfully');
        fetchIssues();
        fetchBooks();
      } else {
        toast.error('Failed to return book');
      }
    } catch (error) {
      toast.error('Failed to return book');
    }
  };

  const resetForm = () => {
    setFormData({
      bookId: '',
      memberId: '',
      dueDate: '',
    });
  };

  const getStatusBadge = (issue: BookIssue) => {
    if (issue.returnDate) {
      return <Badge className="bg-green-500">Returned</Badge>;
    }
    const daysOverdue = safeDifferenceInDays(new Date(), issue.dueDate);
    if (daysOverdue > 0) {
      return <Badge className="bg-red-500">Overdue ({daysOverdue} days)</Badge>;
    }
    return <Badge className="bg-blue-500">Issued</Badge>;
  };

  // Ensure issues is an array before filtering
  const issuesArray = Array.isArray(issues) ? issues : [];
  
  const filteredIssues = issuesArray.filter((issue) => {
    if (filter === 'issued') return !issue.returnDate;
    if (filter === 'returned') return !!issue.returnDate;
    if (filter === 'overdue') {
      return !issue.returnDate && safeDifferenceInDays(new Date(), issue.dueDate) > 0;
    }
    return true;
  });

  const overdueCount = issuesArray.filter(
    (i) => !i.returnDate && safeDifferenceInDays(new Date(), i.dueDate) > 0
  ).length;

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Ensure arrays for mapping
  const booksArray = Array.isArray(books) ? books : [];
  const membersArray = Array.isArray(members) ? members : [];

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
          <h1 className="text-3xl font-bold">Book Issue/Return</h1>
          <p className="text-muted-foreground">Manage book circulation</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Issue Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Issue Book</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleIssue} className="space-y-4">
              <div className="space-y-2">
                <Label>Book</Label>
                <Select
                  value={formData.bookId}
                  onValueChange={(value) => setFormData({ ...formData, bookId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select book" />
                  </SelectTrigger>
                  <SelectContent>
                    {booksArray.filter((book) => book.id).map((book) => (
                      <SelectItem key={book.id} value={String(book.id)}>
                        {book.title} - {book.author} ({book.availableQuantity} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Member</Label>
                <Select
                  value={formData.memberId}
                  onValueChange={(value) => setFormData({ ...formData, memberId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {membersArray.filter((member) => member.id).map((member) => (
                      <SelectItem key={member.id} value={String(member.id)}>
                        {member.name} ({member.membershipId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Issue
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Issued</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {issuesArray.filter((i) => !i.returnDate).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdueCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {issuesArray.filter((i) => i.returnDate).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Issue Records</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="issued">Currently Issued</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredIssues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <div className="font-medium">{issue.book?.title || '-'}</div>
                      <div className="text-xs text-muted-foreground">{issue.book?.author || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div>{issue.member?.name || '-'}</div>
                      <div className="text-xs text-muted-foreground">{issue.member?.membershipId || '-'}</div>
                    </TableCell>
                    <TableCell>{formatDate(issue.issueDate)}</TableCell>
                    <TableCell>{formatDate(issue.dueDate)}</TableCell>
                    <TableCell>{formatDate(issue.returnDate)}</TableCell>
                    <TableCell>{getStatusBadge(issue)}</TableCell>
                    <TableCell className="text-right">
                      {!issue.returnDate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReturn(issue.id)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Return
                        </Button>
                      )}
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
