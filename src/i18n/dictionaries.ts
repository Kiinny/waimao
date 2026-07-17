export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

const dictionaries = {
  en: {
    appName: "Atlas CRM",
    languageName: "English",
    languageSwitch: "Switch language",
    signOutLabel: "Sign out",
    notificationsLabel: "View notifications and risks",
    nav: {
      workspace: "Workspace",
      dashboard: "Dashboard",
      users: "Users",
      roles: "Roles",
    },
    search: {
      label: "Global search",
      placeholder: "Search customers, orders, quotes\u2026",
      submit: "Search",
      title: "Search",
      results: "Results for",
      empty: "No matching customers, orders or quotes.",
      table: {
        type: "Type",
        reference: "Reference",
        statusCountry: "Status / Country",
      },
      entities: {
        customer: "Customer",
        order: "Order",
        quote: "Quote",
      },
    },
    dashboard: {
      title: "Good to see you",
      subtitle: "Here is the current operating picture.",
      customers: "Active customers",
      quotes: "Open quotations",
      orders: "Orders in progress",
      tasks: "Tasks due",
      recent: "Recently added customers",
      empty: "No customers have been added yet.",
      table: {
        company: "Company",
        country: "Country",
        added: "Added",
      },
      risks: {
        title: "Notifications and risks",
        clear: "No urgent risks need your attention.",
        overdueTasks: "overdue tasks require attention.",
      },
    },
    users: {
      title: "Users",
      subtitle: "Accounts, access status and assigned roles.",
      denied: "You do not have access to user management.",
      empty: "No users found.",
      table: {
        name: "Name",
        email: "Email",
        role: "Role",
        status: "Status",
      },
    },
    roles: {
      title: "Roles",
      subtitle: "System responsibilities and permission coverage.",
      denied: "You do not have access to role management.",
      table: {
        role: "Role",
        code: "Code",
        users: "Users",
        permissions: "Permissions",
      },
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
    appName: "Atlas \u5916\u8d38 CRM",
    languageName: "\u4e2d\u6587",
    languageSwitch: "\u5207\u6362\u8bed\u8a00",
    signOutLabel: "\u9000\u51fa\u767b\u5f55",
    notificationsLabel: "\u67e5\u770b\u901a\u77e5\u4e0e\u98ce\u9669",
    nav: {
      workspace: "\u5de5\u4f5c\u53f0",
      dashboard: "\u4eea\u8868\u76d8",
      users: "\u7528\u6237",
      roles: "\u89d2\u8272",
    },
    search: {
      label: "\u5168\u5c40\u641c\u7d22",
      placeholder:
        "\u641c\u7d22\u5ba2\u6237\u3001\u8ba2\u5355\u3001\u62a5\u4ef7\u2026",
      submit: "\u641c\u7d22",
      title: "\u641c\u7d22",
      results: "\u641c\u7d22\u7ed3\u679c",
      empty:
        "\u672a\u627e\u5230\u5339\u914d\u7684\u5ba2\u6237\u3001\u8ba2\u5355\u6216\u62a5\u4ef7\u3002",
      table: {
        type: "\u7c7b\u578b",
        reference: "\u53c2\u8003\u53f7",
        statusCountry: "\u72b6\u6001 / \u56fd\u5bb6\u5730\u533a",
      },
      entities: {
        customer: "\u5ba2\u6237",
        order: "\u8ba2\u5355",
        quote: "\u62a5\u4ef7",
      },
    },
    dashboard: {
      title: "\u6b22\u8fce\u56de\u6765",
      subtitle:
        "\u8fd9\u662f\u5f53\u524d\u4e1a\u52a1\u8fd0\u8425\u6982\u89c8\u3002",
      customers: "\u6d3b\u8dc3\u5ba2\u6237",
      quotes: "\u8fdb\u884c\u4e2d\u62a5\u4ef7",
      orders: "\u5c65\u7ea6\u4e2d\u8ba2\u5355",
      tasks: "\u5f85\u529e\u4efb\u52a1",
      recent: "\u6700\u8fd1\u65b0\u589e\u5ba2\u6237",
      empty: "\u6682\u65f6\u8fd8\u6ca1\u6709\u5ba2\u6237\u6570\u636e\u3002",
      table: {
        company: "\u516c\u53f8",
        country: "\u56fd\u5bb6/\u5730\u533a",
        added: "\u65b0\u589e\u65e5\u671f",
      },
      risks: {
        title: "\u901a\u77e5\u4e0e\u98ce\u9669",
        clear: "\u76ee\u524d\u6ca1\u6709\u9700\u8981\u7acb\u5373\u5904\u7406\u7684\u98ce\u9669\u3002",
        overdueTasks:
          "\u4e2a\u903e\u671f\u4efb\u52a1\u9700\u8981\u5904\u7406\u3002",
      },
    },
    users: {
      title: "\u7528\u6237",
      subtitle:
        "\u7ba1\u7406\u8d26\u6237\u3001\u8bbf\u95ee\u72b6\u6001\u4e0e\u5df2\u5206\u914d\u89d2\u8272\u3002",
      denied:
        "\u60a8\u6ca1\u6709\u8bbf\u95ee\u7528\u6237\u7ba1\u7406\u7684\u6743\u9650\u3002",
      empty: "\u672a\u627e\u5230\u7528\u6237\u3002",
      table: {
        name: "\u59d3\u540d",
        email: "\u90ae\u7bb1",
        role: "\u89d2\u8272",
        status: "\u72b6\u6001",
      },
    },
    roles: {
      title: "\u89d2\u8272",
      subtitle:
        "\u7ba1\u7406\u7cfb\u7edf\u804c\u8d23\u4e0e\u6743\u9650\u8303\u56f4\u3002",
      denied:
        "\u60a8\u6ca1\u6709\u8bbf\u95ee\u89d2\u8272\u7ba1\u7406\u7684\u6743\u9650\u3002",
      table: {
        role: "\u89d2\u8272",
        code: "\u4ee3\u7801",
        users: "\u7528\u6237\u6570",
        permissions: "\u6743\u9650\u6570",
      },
    },
    auth: {
      title: "\u6b22\u8fce\u56de\u6765",
      subtitle:
        "\u767b\u5f55\u540e\u8fdb\u5165\u60a8\u7684\u5de5\u4f5c\u53f0\u3002",
      email: "\u5de5\u4f5c\u90ae\u7bb1",
      password: "\u5bc6\u7801",
      signIn: "\u5b89\u5168\u767b\u5f55",
      error:
        "\u90ae\u7bb1\u6216\u5bc6\u7801\u9519\u8bef\uff0c\u6216\u8be5\u8d26\u6237\u5df2\u505c\u7528\u3002",
      heroTitle:
        "\u8ba9\u6bcf\u4e00\u4e2a\u5916\u8d38\u73af\u8282\u6e05\u6670\u53ef\u89c1\u3002",
      heroText:
        "\u5728\u4e00\u4e2a\u53ef\u4fe1\u5de5\u4f5c\u53f0\u4e2d\u8fde\u63a5\u5ba2\u6237\u4fe1\u606f\u3001\u5546\u52a1\u51b3\u7b56\u4e0e\u5c65\u7ea6\u8fdb\u5ea6\u3002",
    },
  },
} as const;

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
