const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function checkAndSeed() {
  try {
    const adminCount = await prisma.adminUser.count();

    if (adminCount === 0) {
      console.log('🌱 BD vacía, ejecutando seed...');
      execSync('node prisma/seed.js', { stdio: 'inherit' });
      console.log('✅ Seed completado');
    } else {
      console.log('✅ BD ya está poblada');
    }
  } catch (error) {
    console.error('Error al verificar/ejecutar seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndSeed();
