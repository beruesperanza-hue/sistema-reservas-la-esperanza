'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function toggleMenuItem(seccion: string, nombre: string, activo: boolean) {
  try {
    await prisma.menuItemEstado.upsert({
      where: { seccion_nombre: { seccion, nombre } },
      update: { activo },
      create: { seccion, nombre, activo },
    });
    revalidatePath('/carta');
    revalidatePath('/admin/carta');
    return { success: true };
  } catch (error) {
    console.error('Error actualizando estado del ítem de carta:', error);
    return { success: false, error: 'No se pudo actualizar' };
  }
}
