'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Phone, Mail, MessageSquare, AlertTriangle } from 'lucide-react';

export default function FrontOfficePage() {
  const modules = [
    {
      title: 'Visitors',
      description: 'Manage visitor logs and appointments',
      icon: Users,
      href: '/front-office/visitors',
      color: 'bg-blue-500',
    },
    {
      title: 'Phone Calls',
      description: 'Log and track phone calls',
      icon: Phone,
      href: '/front-office/calls',
      color: 'bg-green-500',
    },
    {
      title: 'Postal',
      description: 'Manage incoming and outgoing mail',
      icon: Mail,
      href: '/front-office/postal',
      color: 'bg-purple-500',
    },
    {
      title: 'Enquiries',
      description: 'Handle admission enquiries',
      icon: MessageSquare,
      href: '/front-office/enquiries',
      color: 'bg-orange-500',
    },
    {
      title: 'Complaints',
      description: 'Manage and resolve complaints',
      icon: AlertTriangle,
      href: '/front-office/complaints',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Front Office</h1>
        <p className="text-muted-foreground">
          Manage visitors, calls, enquiries, and complaints
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
