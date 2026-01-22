"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useBookings } from "@/hooks/use-bookings";
import { useJobs } from "@/hooks/use-jobs";
import { useMachines } from "@/hooks/use-machines";
import { PageContainer, ContentSection } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatus } from "@/types/enums";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Booking, Customer, Land, Service, Machine } from "@prisma/client";

type BookingWithRelations = Booking & {
  customer: Customer;
  land: Land | null;
  service: Service;
};

export default function DashboardPage() {
  const { data: bookings = [], isLoading: isLoadingBookings } = useBookings();
  const { data: jobs = [], isLoading: isLoadingJobs } = useJobs();
  const { data: machines = [], isLoading: isLoadingMachines } = useMachines();

  // Calculate ongoing bookings (NEW, IN_PROGRESS)
  const ongoingBookings = useMemo(() => {
    return bookings.filter(
      (booking) =>
        booking.status === BookingStatus.New ||
        booking.status === BookingStatus.InProgress
    );
  }, [bookings]);

  // Calculate ongoing jobs (NEW, IN_PROGRESS)
  const ongoingJobs = useMemo(() => {
    return jobs.filter(
      (job) => job.status === "NEW" || job.status === "IN_PROGRESS"
    );
  }, [jobs]);

  // Calculate active machines (AVAILABLE or IN_USE)
  const activeMachines = useMemo(() => {
    return machines.filter(
      (machine: Machine) =>
        machine.status === "AVAILABLE" || machine.status === "IN_USE"
    );
  }, [machines]);

  // Calculate bookings by service in the last 7 days
  const bookingsByService = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentBookings = bookings.filter(
      (booking) => new Date(booking.created_at) >= sevenDaysAgo
    );

    // Group by date and service
    const dateServiceMap = new Map<string, Map<string, number>>();

    recentBookings.forEach((booking: BookingWithRelations) => {
      const date = new Date(booking.created_at).toLocaleDateString("vi-VN");
      const serviceName = booking.service.name;

      if (!dateServiceMap.has(date)) {
        dateServiceMap.set(date, new Map());
      }

      const serviceMap = dateServiceMap.get(date)!;
      serviceMap.set(serviceName, (serviceMap.get(serviceName) || 0) + 1);
    });

    // Get all unique service names
    const allServices = Array.from(
      new Set(recentBookings.map((b: BookingWithRelations) => b.service.name))
    );

    // Convert to chart data format
    const chartData = Array.from(dateServiceMap.entries())
      .map(([date, serviceMap]) => {
        const dataPoint: any = { date };
        allServices.forEach((service) => {
          dataPoint[service] = serviceMap.get(service) || 0;
        });
        return dataPoint;
      })
      .sort((a, b) => {
        const dateA = a.date.split("/").reverse().join("-");
        const dateB = b.date.split("/").reverse().join("-");
        return dateA.localeCompare(dateB);
      });

    return { chartData, services: allServices };
  }, [bookings]);

  // Colors for the stacked bars
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f97316", // orange
  ];

  const isLoading = isLoadingBookings || isLoadingJobs || isLoadingMachines;

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Dashboard" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection
        title="Dashboard"
        description="Tổng quan hệ thống quản lý dịch vụ nông nghiệp"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Ongoing Bookings KPI */}
          <Link href="/bookings?status=NEW,IN_PROGRESS">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Đơn hàng đang xử lý
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ongoingBookings.length}</div>
                <p className="text-xs text-muted-foreground">
                  Mới & Đang xử lý
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Ongoing Jobs KPI */}
          <Link href="/jobs?status=NEW,IN_PROGRESS">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Công việc đang xử lý
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ongoingJobs.length}</div>
                <p className="text-xs text-muted-foreground">
                  Mới & Đang xử lý
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Active Machines KPI */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Máy móc hoạt động
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeMachines.length}</div>
              <p className="text-xs text-muted-foreground">
                {machines.length} tổng số
              </p>
            </CardContent>
          </Card>
        </div>
      </ContentSection>

      {/* Bookings by Service Chart */}
      <ContentSection
        title="Đơn hàng theo dịch vụ"
        description="7 ngày gần đây"
      >
        <Card>
          <CardContent className="p-6">
            {bookingsByService.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={bookingsByService.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {bookingsByService.services.map((service, index) => (
                    <Bar
                      key={service}
                      dataKey={service}
                      stackId="a"
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Chưa có đơn hàng trong 7 ngày gần đây
              </p>
            )}
          </CardContent>
        </Card>
      </ContentSection>
    </PageContainer>
  );
}
