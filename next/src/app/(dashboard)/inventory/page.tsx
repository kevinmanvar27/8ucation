'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Package, Store, Tags, Truck, ArrowRightLeft } from 'lucide-react';

export default function InventoryPage() {
  const modules = [
    {
      title: 'Items',
      description: 'Manage inventory items',
      icon: Package,
      href: '/inventory/items',
      color: 'bg-blue-500',
    },
    {
      title: 'Categories',
      description: 'Organize items into categories',
      icon: Tags,
      href: '/inventory/categories',
      color: 'bg-green-500',
    },
    {
      title: 'Stores',
      description: 'Manage storage locations',
      icon: Store,
      href: '/inventory/stores',
      color: 'bg-purple-500',
    },
    {
      title: 'Suppliers',
      description: 'Manage item suppliers',
      icon: Truck,
      href: '/inventory/suppliers',
      color: 'bg-orange-500',
    },
    {
      title: 'Issue Items',
      description: 'Issue items to staff or departments',
      icon: ArrowRightLeft,
      href: '/inventory/issue',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground">
          Manage school inventory, items, and supplies
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
