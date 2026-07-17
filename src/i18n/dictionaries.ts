export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

const dictionaries = {
  en: {
    appName: "Atlas CRM",
    nav: {
      workspace: "Workspace",
      dashboard: "Dashboard",
      customers: "Customers",
      opportunities: "Opportunities",
      quotes: "Quotes",
      operations: "Operations",
      users: "Users",
      roles: "Roles",
    },
    search: "Search customers, orders, quotes…",
    dashboard: {
      title: "Good to see you",
      subtitle: "Here is the current operating picture.",
      customers: "Active customers",
      quotes: "Open quotations",
      orders: "Orders in progress",
      tasks: "Tasks due",
      recent: "Recently added customers",
      empty: "No customers have been added yet.",
    },
    auth: {
      title: "Welcome back",
      subtitle: "Sign in to continue to your workspace.",
      email: "Work email",
      password: "Password",
      signIn: "Sign in securely",
      error: "Email or password is incorrect, or this account is inactive.",
      heroTitle: "Trade operations, without the blind spots.",
      heroText:
        "Bring customer context, commercial decisions and fulfillment progress into one trusted workspace.",
    },
  },
  zh: {
    appName: "Atlas 外贸 CRM",
    nav: {
      workspace: "工作台",
      dashboard: "仪表盘",
      customers: "客户",
      opportunities: "商机",
      quotes: "报价",
      operations: "运营",
      users: "用户",
      roles: "角色",
    },
    search: "搜索客户、订单、报价…",
    dashboard: {
      title: "欢迎回来",
      subtitle: "这是当前业务运营概览。",
      customers: "活跃客户",
      quotes: "进行中报价",
      orders: "履约中订单",
      tasks: "待办任务",
      recent: "最近新增客户",
      empty: "暂时还没有客户数据。",
    },
    auth: {
      title: "欢迎回来",
      subtitle: "登录后进入您的工作台。",
      email: "工作邮箱",
      password: "密码",
      signIn: "安全登录",
      error: "邮箱或密码错误，或该账户已停用。",
      heroTitle: "让每一个外贸环节清晰可见。",
      heroText: "在一个可信工作台中连接客户信息、商务决策与履约进度。",
    },
  },
} as const;

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
