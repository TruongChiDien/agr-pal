import { PageContainer, ContentSection } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  return (
    <PageContainer>
      <ContentSection
        title="Dashboard"
        description="Welcome to Agri-ERP - Your agricultural service management system"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Quick Action
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45,231,000 đ</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Active Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12</div>
              <p className="text-xs text-muted-foreground">
                +4 from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Pending Bills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Total: 12,500,000 đ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Active Machines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">
                3 in maintenance
              </p>
            </CardContent>
          </Card>
        </div>
      </ContentSection>

      <ContentSection
        title="Recent Activity"
        description="Latest updates from your operations"
      >
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Recent activity will appear here...
            </p>
          </CardContent>
        </Card>
      </ContentSection>
    </PageContainer>
  );
}
