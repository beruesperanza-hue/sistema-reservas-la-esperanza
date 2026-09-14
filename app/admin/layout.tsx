import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="admin-ui min-h-screen bg-paper">{children}</div>;
}
