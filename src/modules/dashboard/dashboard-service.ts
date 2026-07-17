export interface DashboardSnapshot {
  activeCustomers: number;
  openQuotes: number;
  activeOrders: number;
  dueTasks: number;
  recentCustomers: Array<{
    id: string;
    companyName: string;
    countryCode: string;
    createdAt: Date;
  }>;
}

export interface DashboardRepository {
  loadSnapshot(context: AuthorizationContext): Promise<DashboardSnapshot>;
}

export function loadDashboard(
  repository: DashboardRepository,
  context: AuthorizationContext,
) {
  return repository.loadSnapshot(context);
}
import type { AuthorizationContext } from "@/lib/rbac";
