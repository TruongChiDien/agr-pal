"use client";

import { BookingList } from "@/components/bookings/booking-list";
import { PageContainer, ContentSection } from "@/components/layout";

export default function BookingsPage() {
  return (
    <PageContainer>
      <ContentSection
        title="Đơn hàng"
        description="Quản lý đơn hàng và theo dõi trạng thái thanh toán"
      >
        <BookingList />
      </ContentSection>
    </PageContainer>
  );
}
