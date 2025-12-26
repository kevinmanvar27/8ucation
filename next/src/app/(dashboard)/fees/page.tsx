'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DollarSign, CreditCard, FileText, Settings, AlertCircle, Receipt } from 'lucide-react';

export default function FeesPage() {
  const modules = [
    {
      title: 'Collect Fees',
      description: 'Collect and record fee payments from students',
      icon: CreditCard,
      href: '/fees/collect',
      color: 'bg-green-500',
    },
    {
      title: 'Fee Due',
      description: 'View and manage pending fee payments',
      icon: AlertCircle,
      href: '/fees/due',
      color: 'bg-red-500',
    },
    {
      title: 'Fee Types',
      description: 'Configure different types of fees',
      icon: FileText,
      href: '/fees/types',
      color: 'bg-blue-500',
    },
    {
      title: 'Fee Groups',
      description: 'Manage fee groups and their types',
      icon: Settings,
      href: '/fees/groups',
      color: 'bg-purple-500',
    },
    {
      title: 'Fee Master',
      description: 'Assign fee groups to classes',
      icon: Receipt,
      href: '/fees/master',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fees Management</h1>
        <p className="text-muted-foreground">
          Manage student fees, payments, and collections
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
