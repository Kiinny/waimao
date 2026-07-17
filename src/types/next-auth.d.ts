import "next-auth";

declare module "next-auth" {
  interface User {
    roles: string[];
    permissions: string[];
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles: string[];
      permissions: string[];
    };
  }
}
