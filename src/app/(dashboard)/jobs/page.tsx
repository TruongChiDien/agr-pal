"use client";

import { JobList } from "@/components/jobs/job-list";
import { PageContainer, ContentSection } from "@/components/layout";

export default function JobsPage() {
  return (
    <PageContainer>
      <ContentSection
        title="Công việc"
        description="Quản lý công việc và phân công công nhân"
      >
        <JobList />
      </ContentSection>
    </PageContainer>
  );
}
