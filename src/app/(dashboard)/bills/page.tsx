"use client";

import { BillList } from "@/components/bills/bill-list";
import { PageContainer, ContentSection } from "@/components/layout";

export default function BillsPage() {
  return (
    <PageContainer>
      <ContentSection
        title="Hóa đơn"
        description="Quản lý hóa đơn và theo dõi công nợ khách hàng"
      >
        <BillList />
      </ContentSection>
    </PageContainer>
  );
}
