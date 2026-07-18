import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLogin from '@/components/admin/AdminLogin';

export const metadata = {
  title: 'Admin - La Esperanza',
  robots: 'noindex, nofollow',
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');

  if (token) {
    redirect('/admin/dashboard');
  }

  return <AdminLogin />;
}
