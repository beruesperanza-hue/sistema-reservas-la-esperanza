# Sistema de Reservas - La Esperanza

Sistema profesional de reservas para restaurantes, desarrollado con **Next.js 15**, **React**, **TypeScript**, **Tailwind CSS** y **Prisma**.

## 🌟 Características

### Página Pública de Reservas
- ✅ Interfaz elegante y responsiva
- ✅ Selector de fechas (hasta 60 días en avance)
- ✅ Horarios disponibles dinámicos
- ✅ Formulario de datos personalizado
- ✅ Email de confirmación automático
- ✅ Validaciones en tiempo real
- ✅ Prevención de reservas duplicadas
- ✅ Control de capacidad por turno

### Panel de Administración
- ✅ Autenticación segura (usuario/contraseña)
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Gestión completa de reservas
- ✅ Filtros por fecha, hoy, mañana
- ✅ Búsqueda por nombre, email o teléfono
- ✅ Confirmar, cancelar, editar y eliminar reservas
- ✅ Agrupar reservas por horario
- ✅ Configuración flexible de horarios
- ✅ Gestión de capacidad por turno
- ✅ Calendario mensual

### Tecnología
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js 15 con Server Actions
- **Database**: Prisma ORM + SQLite (migratable a PostgreSQL)
- **Email**: Nodemailer (configurable con SMTP)
- **Autenticación**: JWT + Bcrypt
- **Deploy**: Optimizado para Vercel

## 🚀 Instalación y Setup

### 1. Requisitos Previos
- Node.js 18+ (o npm/yarn/pnpm)
- Base de datos SQLite (incluida) o PostgreSQL

### 2. Clonar Repositorio
```bash
git clone <tu-repo>
cd sistema-reservas
```

### 3. Instalar Dependencias
```bash
npm install
# o yarn install / pnpm install
```

### 4. Configurar Variables de Entorno
```bash
cp .env.local.example .env.local
```

**Editar `.env.local` con tus valores:**

```env
# Database
DATABASE_URL="file:./dev.db"

# SMTP Configuration (Email)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASSWORD="tu-contraseña-app"
SMTP_FROM="noreply@laesperanza.com"

# Restaurant Settings
RESTAURANT_NAME="La Esperanza"
RESTAURANT_EMAIL="reservas@laesperanza.com"
RESTAURANT_PHONE="+34-XXX-XXX-XXX"
RESTAURANT_ADDRESS="Tu dirección aquí"

# Reservation Settings
DEFAULT_CAPACITY_PER_SLOT=20
ADVANCE_BOOKING_DAYS=60
```

### 5. Configurar Base de Datos
```bash
# Crear base de datos y tablas
npm run db:push

# Poblar con datos de ejemplo (horarios, usuario admin, etc)
npm run db:seed
```

### 6. Ejecutar en Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en:
- 🌐 **Página pública**: http://localhost:3000/reservas
- 🔐 **Panel admin**: http://localhost:3000/admin

### Credenciales de Demo
- **Usuario**: `admin`
- **Contraseña**: `admin123`

## 📊 Estructura del Proyecto

```
sistema-reservas/
├── app/
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx             # Página de inicio
│   ├── globals.css          # Estilos globales
│   ├── reservas/
│   │   └── page.tsx         # Página pública de reservas
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Login del admin
│   │   ├── dashboard/       # Dashboard con estadísticas
│   │   ├── reservas/        # Gestión de reservas
│   │   └── settings/        # Configuración
│   ├── api/
│   │   ├── disponibilidad/  # Horarios disponibles
│   │   ├── auth/            # Autenticación
│   │   └── admin/           # Endpoints del admin
│   └── actions/
│       └── reservations.ts  # Server Actions
├── components/
│   ├── common/              # Header, Footer
│   ├── reservas/            # Componentes de reservas
│   └── admin/               # Componentes del admin
├── lib/
│   ├── auth.ts              # Funciones de autenticación
│   ├── email.ts             # Envío de emails
│   ├── db.ts                # Conexión Prisma
│   └── constants.ts         # Constantes
├── prisma/
│   ├── schema.prisma        # Esquema de BD
│   └── seed.js              # Script de población
├── public/                  # Assets estáticos
├── .env.local               # Variables de entorno (no commitear)
└── package.json
```

## 🎨 Identidad Visual

El sistema incluye los colores y estilos de La Esperanza:
- **Color primario**: `#a0826d` (Beige/Marrón cálido)
- **Tipografía**: Elegante e itálica
- **Modo oscuro**: Incluido automáticamente
- **Animaciones**: Suaves y profesionales

## 🛠️ Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Producción
npm run build           # Compilar para producción
npm start              # Ejecutar en producción

# Base de datos
npm run db:push        # Sincronizar schema con BD
npm run db:seed        # Poblar datos de ejemplo
npm run db:studio      # Abrir Prisma Studio

# Linting
npm run lint           # Ejecutar ESLint
```

## 📧 Configuración de Email

### Con Gmail
1. Habilitar ["Contraseñas de aplicación"](https://support.google.com/accounts/answer/185833)
2. En `.env.local`:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASSWORD="contraseña-generada"
```

### Con otro proveedor (Sendgrid, Mailgun, etc.)
Ajustar `SMTP_HOST` y credenciales en `.env.local`

## 🔐 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Validación de inputs en cliente y servidor
- ✅ CORS configurado
- ✅ SQL Injection prevenido (Prisma ORM)
- ✅ XSS prevenido (React + escape automático)
- ✅ Autenticación session-based
- ✅ Datos sensibles en variables de entorno

## 📱 Responsive Design

- ✅ Mobile-first
- ✅ Tablet optimizado
- ✅ Desktop full-featured
- ✅ Dark mode automático
- ✅ Accesible (WCAG 2.1 AA)

## 🚀 Deploy en Vercel

### Paso 1: Preparar repo
```bash
git init
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Paso 2: Conectar con Vercel
1. Ir a [vercel.com](https://vercel.com)
2. Conectar repositorio
3. Seleccionar proyecto
4. Agregar variables de entorno
5. Deploy automático

### Paso 3: Configurar Database (PostgreSQL recomendado)
1. Usar [Vercel Postgres](https://vercel.com/docs/storage/postgres) o similar
2. Actualizar `DATABASE_URL` en production
3. Ejecutar migraciones: `prisma migrate deploy`

## 🐛 Solución de Problemas

### Error: "no database schema"
```bash
npm run db:push
npm run db:seed
```

### Error: "Cannot find module"
```bash
npm install
npm run dev
```

### Email no se envía
- Verificar credenciales SMTP en `.env.local`
- Revisar logs del servidor
- Para testing: comentar línea de email en `sendReservationConfirmation()`

### Admin login no funciona
- Regenerar contraseña: Editar `prisma/seed.js`, ejecutar `npm run db:seed`
- Verificar cookie: Revisar cookies en DevTools

## 📝 Personalización

### Cambiar colores
Editar `tailwind.config.ts`:
```ts
colors: {
  'esperanza': {
    500: '#tu-color-aqui',
    // ...
  }
}
```

### Cambiar capacidad por turno
En admin/settings o `.env.local`:
```env
DEFAULT_CAPACITY_PER_SLOT=25
```

### Cambiar días de reserva anticipada
```env
ADVANCE_BOOKING_DAYS=90
```

## 📞 Soporte y Contacto

Para reportar bugs o sugerencias, contactar con el equipo de desarrollo.

## 📄 Licencia

Todos los derechos reservados © 2024 La Esperanza

---

**¡Desarrollado con ❤️ para una mejor experiencia en La Esperanza!**
