const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  try {
    // Admin user
    await prisma.adminUser.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        email: 'admin@laesperanza.com',
      },
    });
    console.log('✅ Admin user');

    // Settings
    await prisma.settings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        nombreRestaurante: 'La Esperanza',
        emailRestaurante: 'eventoslaesperanza@gmail.com',
        telefonoRestaurante: '+54 9 11 2182-3702',
        direccionRestaurante: 'Aguirre 526, Villa Crespo, Buenos Aires',
        capacidadPorTurno: 20,
        diasAvanzados: 60,
      },
    });
    console.log('✅ Settings');

    // Horarios
    const dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const horas = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];
    
    for (const dia of dias) {
      for (const hora of horas) {
        await prisma.schedule.upsert({
          where: { dia_hora: { dia, hora } },
          update: {},
          // capacidadVereda arranca en 8 como punto de partida; ajustable desde
          // el panel de admin (Configuración > Horarios).
          create: { dia, hora, capacidad: 20, capacidadVereda: 8, activo: true },
        });
      }
    }
    console.log('✅ Horarios');
    console.log('🎉 Base de datos lista!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main().finally(() => prisma.$disconnect());
