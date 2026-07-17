export interface DashboardSnapshot {
  activeCustomers: number;
  openLeads: number;
  pipelineValueUsd: string;
  weightedForecastUsd: string;
  openQuotes: number;
  activeOrders: number;
  dueTasks: number;
  recentCustomers: Array<{
    id: string;
    companyName: string;
    countryCode: string;
    createdAt: Date;
  }>;
  salesFunnel: Array<{ stage: string; count: number; valueUsd: string }>;
  monthlyOrderTrend: Array<{ month: string; count: number; valueUsd: string }>;
  leadSources: Array<{ source: string; count: number }>;
  upcomingFollowUps: Array<{
    id: string;
    summary: string;
    nextActionAt: Date;
    related: string;
  }>;
  recentLeads: Array<{
    id: string;
    companyName: string;
    status: string;
    createdAt: Date;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalUsd: string;
    createdAt: Date;
  }>;
  risks: {
    overdueFollowUps: number;
    highRiskCustomers: number;
    staleOpportunities: number;
  };
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

export function dashboardKpis(
  context: AuthorizationContext,
  snapshot: DashboardSnapshot,
) {
  const salesRole =
    context.roles?.includes("SALES_REP") ||
    context.roles?.includes("SALES_MANAGER") ||
    context.roles?.includes("SUPER_ADMIN");
  return salesRole
    ? ([
        ["activeCustomers", snapshot.activeCustomers],
        ["openLeads", snapshot.openLeads],
        ["pipelineValueUsd", snapshot.pipelineValueUsd],
        ["weightedForecastUsd", snapshot.weightedForecastUsd],
      ] as const)
    : ([
        ["activeCustomers", snapshot.activeCustomers],
        ["openQuotes", snapshot.openQuotes],
        ["activeOrders", snapshot.activeOrders],
        ["dueTasks", snapshot.dueTasks],
      ] as const);
}
import type { AuthorizationContext } from "@/lib/rbac";
