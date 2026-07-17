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
  loadSnapshot(userId: string): Promise<DashboardSnapshot>;
}

export function loadDashboard(
  repository: DashboardRepository,
  userId: string,
) {
  return repository.loadSnapshot(userId);
}
