'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Bus, Route, Users, MapPin } from 'lucide-react';

export default function TransportPage() {
  const modules = [
    {
      title: 'Vehicles',
      description: 'Manage school vehicles and their details',
      icon: Bus,
      href: '/transport/vehicles',
      color: 'bg-blue-500',
    },
    {
      title: 'Routes',
      description: 'Configure transport routes and stops',
      icon: Route,
      href: '/transport/routes',
      color: 'bg-green-500',
    },
    {
      title: 'Assign Transport',
      description: 'Assign students to transport routes',
      icon: Users,
      href: '/transport/assign',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transport Management</h1>
        <p className="text-muted-foreground">
          Manage school vehicles, routes, and student transport
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
