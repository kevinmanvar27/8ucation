import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  GraduationCap,
  DollarSign,
  BookOpen,
  Calendar,
  TrendingUp,
  TrendingDown,
  UserCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'School management dashboard overview',
};

async function getDashboardStats(schoolId: number) {
  const [
    totalStudents,
    totalStaff,
    totalParents,
    activeClasses,
    todayAttendance,
    pendingFees,
    recentAdmissions,
    upcomingEvents,
  ] = await Promise.all([
    prisma.student.count({ where: { schoolId } }),
    prisma.staff.count({ where: { schoolId, isActive: true } }),
    prisma.parent.count({ where: { schoolId } }),
    prisma.class.count({ where: { schoolId, isActive: true } }),
    prisma.studentAttendance.count({
      where: {
        student: { schoolId },
        date: new Date(),
        status: 'Present',
      },
    }),
    // Get pending fees through FeePayment or simplified count
    prisma.feePayment.aggregate({
      where: {
        student: { schoolId },
      },
      _sum: { amount: true },
    }),
    prisma.student.count({
      where: {
        schoolId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.event.count({
      where: {
        schoolId,
        startDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    totalStudents,
    totalStaff,
    totalParents,
    activeClasses,
    todayAttendance,
    pendingFees: pendingFees._sum.amount || 0,
    recentAdmissions,
    upcomingEvents,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.schoolId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Unable to load dashboard</p>
      </div>
    );
  }

  const stats = await getDashboardStats(Number(session.user.schoolId));

  const kpiCards: Array<{
    title: string;
    value: string;
    icon: typeof GraduationCap;
    change: number | null;
    changeLabel: string;
    changeType: 'increase' | 'decrease' | 'neutral';
  }> = [
    {
      title: 'Total Students',
      value: stats.totalStudents.toLocaleString(),
      icon: GraduationCap,
      change: stats.recentAdmissions,
      changeLabel: 'new this month',
      changeType: 'increase' as const,
    },
    {
      title: 'Total Staff',
      value: stats.totalStaff.toLocaleString(),
      icon: Users,
      change: null,
      changeLabel: 'active members',
      changeType: 'neutral' as const,
    },
    {
      title: 'Total Parents',
      value: stats.totalParents.toLocaleString(),
      icon: Users,
      change: null,
      changeLabel: 'registered',
      changeType: 'neutral' as const,
    },
    {
      title: 'Active Classes',
      value: stats.activeClasses.toLocaleString(),
      icon: BookOpen,
      change: null,
      changeLabel: 'classes running',
      changeType: 'neutral' as const,
    },
    {
      title: "Today's Attendance",
      value: stats.todayAttendance.toLocaleString(),
      icon: UserCheck,
      change: null,
      changeLabel: 'students present',
      changeType: 'neutral' as const,
    },
    {
      title: 'Pending Fees',
      value: `$${stats.pendingFees.toLocaleString()}`,
      icon: DollarSign,
      change: null,
      changeLabel: 'to collect',
      changeType: 'decrease' as const,
    },
    {
      title: 'New Admissions',
      value: stats.recentAdmissions.toLocaleString(),
      icon: TrendingUp,
      change: null,
      changeLabel: 'this month',
      changeType: 'increase' as const,
    },
    {
      title: 'Upcoming Events',
      value: stats.upcomingEvents.toLocaleString(),
      icon: Calendar,
      change: null,
      changeLabel: 'this week',
      changeType: 'neutral' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name}! Here&apos;s an overview of your school.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">
                {kpi.change !== null && (
                  <span
                    className={
                      kpi.changeType === 'increase'
                        ? 'text-green-600'
                        : kpi.changeType === 'decrease'
                        ? 'text-red-600'
                        : ''
                    }
                  >
                    {kpi.changeType === 'increase' && '+'}
                    {kpi.change}{' '}
                  </span>
                )}
                {kpi.changeLabel}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <a
              href="/students/admission"
              className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent"
            >
              <GraduationCap className="h-4 w-4" />
              New Student Admission
            </a>
            <a
              href="/fees/collect"
              className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent"
            >
              <DollarSign className="h-4 w-4" />
              Collect Fees
            </a>
            <a
              href="/attendance/students"
              className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent"
            >
              <UserCheck className="h-4 w-4" />
              Mark Attendance
            </a>
            <a
              href="/homework"
              className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent"
            >
              <BookOpen className="h-4 w-4" />
              Add Homework
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity to display.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No announcements at this time.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
