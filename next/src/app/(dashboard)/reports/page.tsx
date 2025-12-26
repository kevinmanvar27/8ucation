'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { GraduationCap, UserCheck, FileText, DollarSign } from 'lucide-react';

export default function ReportsPage() {
  const modules = [
    {
      title: 'Student Reports',
      description: 'Generate student-related reports',
      icon: GraduationCap,
      href: '/reports/students',
      color: 'bg-blue-500',
    },
    {
      title: 'Attendance Reports',
      description: 'View attendance statistics and reports',
      icon: UserCheck,
      href: '/reports/attendance',
      color: 'bg-green-500',
    },
    {
      title: 'Exam Reports',
      description: 'Generate exam results and analysis',
      icon: FileText,
      href: '/reports/exams',
      color: 'bg-purple-500',
    },
    {
      title: 'Finance Reports',
      description: 'Financial statements and fee reports',
      icon: DollarSign,
      href: '/reports/finance',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and view various reports
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.title} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${module.color}`}>
                  <module.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {module.description}
              </p>
              <Link href={module.href}>
                <Button className="w-full">Open</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
