"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useBookings } from "@/hooks/use-bookings"
import { useMachines } from "@/hooks/use-machines"
import { PageContainer, ContentSection } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookingStatus } from "@/types/enums"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Booking, Customer, Land, Machine } from "@prisma/client"

type BookingWithRelations = Booking & {
  customer: Customer
  land: Land | null
}

export default function DashboardPage() {
  const { data: bookings = [], isLoading: isLoadingBookings } = useBookings()
  const { data: machines = [], isLoading: isLoadingMachines } = useMachines()

  // Calculate ongoing bookings (NEW, IN_PROGRESS)
  const ongoingBookings = useMemo(() => {
    return bookings.filter(
      (booking) =>
        booking.status === BookingStatus.New ||
        booking.status === BookingStatus.InProgress
    )
  }, [bookings])

  // Calculate active machines (AVAILABLE or IN_USE)
  const activeMachines = useMemo(() => {
    return machines.filter(
      (machine: Machine) =>
        machine.status === "AVAILABLE" || machine.status === "IN_USE"
    )
  }, [machines])

  // Calculate bookings per day in the last 7 days
  const bookingsPerDay = useMemo(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentBookings = bookings.filter(
      (booking) => new Date(booking.created_at) >= sevenDaysAgo
    )

    // Group by date
    const dateMap = new Map<string, number>()

    recentBookings.forEach((booking: BookingWithRelations) => {
      const date = new Date(booking.created_at).toLocaleDateString("vi-VN")
      dateMap.set(date, (dateMap.get(date) || 0) + 1)
    })

    // Convert to chart data format
    const chartData = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, "Số lượng": count }))
      .sort((a, b) => {
        const dateA = a.date.split("/").reverse().join("-")
        const dateB = b.date.split("/").reverse().join("-")
        return dateA.localeCompare(dateB)
      })

    return chartData
  }, [bookings])

  const isLoading = isLoadingBookings || isLoadingMachines

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Dashboard" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <ContentSection
        title="Dashboard"
        description="Tổng quan hệ thống quản lý dịch vụ nông nghiệp"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
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

          {/* Active Machines KPI */}
          <Link href="/machines">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
          </Link>
        </div>
      </ContentSection>

      {/* Bookings Chart */}
      <ContentSection
        title="Đơn hàng theo ngày"
        description="7 ngày gần đây"
      >
        <Card>
          <CardContent className="p-6">
            {bookingsPerDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={bookingsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="Số lượng" fill="#3b82f6" />
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
  )
}
