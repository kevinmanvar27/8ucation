'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Wallet, Users } from 'lucide-react';

export default function FinancePage() {
  const modules = [
    {
      title: 'Income',
      description: 'Track and manage all income sources',
      icon: TrendingUp,
      href: '/finance/income',
      color: 'bg-green-500',
    },
    {
      title: 'Expense',
      description: 'Record and monitor expenses',
      icon: TrendingDown,
      href: '/finance/expense',
      color: 'bg-red-500',
    },
    {
      title: 'Payroll',
      description: 'Manage staff salaries and payroll',
      icon: Users,
      href: '/finance/payroll',
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Management</h1>
        <p className="text-muted-foreground">
          Manage income, expenses, and payroll
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
