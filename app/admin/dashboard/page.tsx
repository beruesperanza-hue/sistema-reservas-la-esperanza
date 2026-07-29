import { redirect } from 'next/navigation';

// El dashboard se unificó con /admin/reservas (calendario + tablero de
// turnos + listado en una sola pantalla). Se deja este redirect para no
// romper bookmarks/enlaces viejos al panel.
export default function AdminDashboardRedirect() {
  redirect('/admin/reservas');
}
