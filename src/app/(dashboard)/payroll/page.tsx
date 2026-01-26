import { PageContainer, ContentSection } from "@/components/layout";
import { PayrollList } from "@/components/payroll/payroll-list";

export default function PayrollListPage() {
  return (
    <PageContainer>
      <ContentSection
        title="Phiếu lương"
        description="Quản lý phiếu lương công nhân"
      >
        <PayrollList />
      </ContentSection>
    </PageContainer>
  );
}
