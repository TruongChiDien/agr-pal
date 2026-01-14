"use client";

import { PageContainer, ContentSection } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookingStatusBadge,
  JobStatusBadge,
  PaymentStatusBadge,
  BillStatusBadge,
  PayrollStatusBadge,
  MachineStatusBadge,
} from "@/components/status";
import {
  BookingStatus,
  JobStatus,
  PaymentStatus,
  BillStatus,
  PayrollStatus,
  MachineStatus,
} from "@/types";

export default function StatusBadgesPage() {
  return (
    <PageContainer>
      <ContentSection
        title="Status Badge System"
        description="Comprehensive status badges for all business workflows"
      >
        <div className="space-y-6">
          {/* Booking Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <BookingStatusBadge status={BookingStatus.New} />
                <BookingStatusBadge status={BookingStatus.InProgress} />
                <BookingStatusBadge status={BookingStatus.Completed} />
                <BookingStatusBadge status={BookingStatus.Blocked} />
                <BookingStatusBadge status={BookingStatus.Canceled} />
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Without icons:</p>
                <div className="flex flex-wrap gap-3">
                  <BookingStatusBadge status={BookingStatus.New} showIcon={false} />
                  <BookingStatusBadge status={BookingStatus.InProgress} showIcon={false} />
                  <BookingStatusBadge status={BookingStatus.Completed} showIcon={false} />
                  <BookingStatusBadge status={BookingStatus.Blocked} showIcon={false} />
                  <BookingStatusBadge status={BookingStatus.Canceled} showIcon={false} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <JobStatusBadge status={JobStatus.New} />
                <JobStatusBadge status={JobStatus.InProgress} />
                <JobStatusBadge status={JobStatus.Completed} />
                <JobStatusBadge status={JobStatus.Blocked} />
                <JobStatusBadge status={JobStatus.Canceled} />
              </div>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Status (Booking → Bill)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <PaymentStatusBadge status={PaymentStatus.PendingBill} />
                <PaymentStatusBadge status={PaymentStatus.AddedBill} />
                <PaymentStatusBadge status={PaymentStatus.FullyPaid} />
              </div>
            </CardContent>
          </Card>

          {/* Bill Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bill Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <BillStatusBadge status={BillStatus.Open} />
                <BillStatusBadge status={BillStatus.PartialPaid} />
                <BillStatusBadge status={BillStatus.Completed} />
              </div>
            </CardContent>
          </Card>

          {/* Payroll Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payroll Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <PayrollStatusBadge status={PayrollStatus.Open} />
                <PayrollStatusBadge status={PayrollStatus.PartialPaid} />
                <PayrollStatusBadge status={PayrollStatus.Completed} />
              </div>
            </CardContent>
          </Card>

          {/* Machine Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Machine Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <MachineStatusBadge status={MachineStatus.Available} />
                <MachineStatusBadge status={MachineStatus.InUse} />
                <MachineStatusBadge status={MachineStatus.Maintenance} />
              </div>
            </CardContent>
          </Card>

          {/* Usage Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Usage in Data Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Booking</th>
                      <th className="text-left p-3 font-medium">Customer</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t hover:bg-accent/50">
                      <td className="p-3 font-mono">BK-001</td>
                      <td className="p-3">Nguyễn Văn A</td>
                      <td className="p-3">
                        <BookingStatusBadge status={BookingStatus.New} />
                      </td>
                      <td className="p-3">
                        <PaymentStatusBadge status={PaymentStatus.PendingBill} />
                      </td>
                    </tr>
                    <tr className="border-t hover:bg-accent/50">
                      <td className="p-3 font-mono">BK-002</td>
                      <td className="p-3">Trần Thị B</td>
                      <td className="p-3">
                        <BookingStatusBadge status={BookingStatus.InProgress} />
                      </td>
                      <td className="p-3">
                        <PaymentStatusBadge status={PaymentStatus.AddedBill} />
                      </td>
                    </tr>
                    <tr className="border-t hover:bg-accent/50">
                      <td className="p-3 font-mono">BK-003</td>
                      <td className="p-3">Lê Văn C</td>
                      <td className="p-3">
                        <BookingStatusBadge status={BookingStatus.Completed} />
                      </td>
                      <td className="p-3">
                        <PaymentStatusBadge status={PaymentStatus.FullyPaid} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Color System */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Design System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-sm">Color Meanings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-100 border border-blue-700"></div>
                    <span className="text-muted-foreground">Blue - New/Initial state</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-100 border border-orange-700"></div>
                    <span className="text-muted-foreground">Orange - In Progress/Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border border-green-700"></div>
                    <span className="text-muted-foreground">Green - Completed/Success</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-700"></div>
                    <span className="text-muted-foreground">Yellow - Pending/Waiting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-100 border border-amber-700"></div>
                    <span className="text-muted-foreground">Amber - Partial/Incomplete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100 border border-gray-700"></div>
                    <span className="text-muted-foreground">Gray - Blocked/Inactive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 border border-red-700"></div>
                    <span className="text-muted-foreground">Red - Canceled/Error</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2 text-sm">Design Features</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ WCAG AA compliant color contrast</li>
                  <li>✓ Dark mode support</li>
                  <li>✓ Optional icons for visual clarity</li>
                  <li>✓ Consistent font weight (medium) for readability</li>
                  <li>✓ Border for better visibility</li>
                  <li>✓ Vietnamese labels for all statuses</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </ContentSection>
    </PageContainer>
  );
}
