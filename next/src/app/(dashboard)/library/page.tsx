'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Users, BookMarked, ArrowLeftRight } from 'lucide-react';

export default function LibraryPage() {
  const modules = [
    {
      title: 'Books',
      description: 'Manage library book inventory',
      icon: BookOpen,
      href: '/library/books',
      color: 'bg-blue-500',
    },
    {
      title: 'Members',
      description: 'Manage library members',
      icon: Users,
      href: '/library/members',
      color: 'bg-green-500',
    },
    {
      title: 'Issue/Return',
      description: 'Issue and return books',
      icon: ArrowLeftRight,
      href: '/library/issue',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Library Management</h1>
        <p className="text-muted-foreground">
          Manage library books, members, and book issues
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
