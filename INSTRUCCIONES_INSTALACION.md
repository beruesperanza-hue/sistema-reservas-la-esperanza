# 🚀 INSTRUCCIONES DE INSTALACIÓN - Sistema de Reservas La Esperanza

## ⚡ Inicio Rápido (5 minutos)

### 1. Abrir Terminal en la Carpeta del Proyecto
```bash
cd "/Users/martinberaldi/Desktop/Staff/CLAUDITO/LA ESPERANZA/sistema-reservas"
```

### 2. Instalar Dependencias
```bash
npm install
```

**Nota**: Si no tienes npm instalado, instala Node.js desde [nodejs.org](https://nodejs.org)

### 3. Configurar Base de Datos
```bash
npm run db:push
npm run db:seed
```

Esto creará:
- ✅ Base de datos SQLite (`prisma/dev.db`)
- ✅ Tablas (Reservas, Horarios, Configuración, Admin)
- ✅ Horarios de ejemplo (lunes a sábado, 20:00-23:30)
- ✅ Usuario admin (usuario: `admin`, contraseña: `admin123`)

### 4. Configurar Email (Opcional)
Copiar `.env.local.example` a `.env.local`:
```bash
cp .env.local.example .env.local
```

Editar `.env.local` con tus datos de SMTP (Gmail, SendGrid, etc.)

**Si no configuras email**: Las confirmaciones se registran en logs solamente (bueno para testing)

### 5. Ejecutar Servidor de Desarrollo
```bash
npm run dev
```

### 6. Abrir en Navegador
- 🌐 **Página de Reservas**: http://localhost:3000/reservas
- 🔐 **Panel Admin**: http://localhost:3000/admin
- 📄 **Inicio**: http://localhost:3000

---

## 👨‍💼 Credenciales de Demo

### Admin Panel
- **URL**: http://localhost:3000/admin
- **Usuario**: `admin`
- **Contraseña**: `admin123`

**Cambiar contraseña después del primer login**

---

## 📦 Dependencias Instaladas

```
react@19.0.0                  - Framework UI
next@15.0.0                   - Framework web
typescript@5.6.3              - Lenguaje tipado
tailwindcss@3.4.3             - Estilos CSS
@prisma/client@5.19.0         - ORM para BD
bcryptjs@2.4.3                - Hash de contraseñas
date-fns@3.6.0                - Manejo de fechas
lucide-react@0.385.0          - Iconos
```

---

## 🗂️ Estructura de Carpetas Creada

```
sistema-reservas/
├── app/                      # App router de Next.js
│   ├── reservas/            # Página pública de reservas
│   ├── admin/               # Panel de administración
│   └── api/                 # API routes
├── components/              # Componentes React
│   ├── common/              # Header, Footer
│   ├── reservas/            # Componentes de reservas
│   └── admin/               # Componentes del admin
├── lib/                     # Funciones utilitarias
├── prisma/                  # BD y esquema
├── public/                  # Assets estáticos
├── node_modules/            # Dependencias (se instalan con npm install)
└── .env.local              # Variables de entorno (NO commitear)
```

---

## 🎯 Flujo de Uso

### Para Cliente (Página Pública)
1. Ir a http://localhost:3000/reservas
2. Seleccionar fecha
3. Seleccionar horario disponible
4. Completar datos (nombre, email, teléfono)
5. Confirmar reserva
6. ✅ Recibir confirmación por email (si SMTP está configurado)

### Para Admin
1. Ir a http://localhost:3000/admin
2. Ingresar: usuario `admin` / contraseña `admin123`
3. **Dashboard**: Ver estadísticas del día
4. **Reservas**: Ver, editar, cancelar, eliminar reservas
5. **Configuración**: 
   - Editar datos del restaurante
   - Agregar/eliminar horarios
   - Cambiar capacidad por turno
   - Cambiar días de reserva anticipada

---

## 🔧 Configuración Importante

### `.env.local` - Variables de Entorno

```env
# Database (SQLite por defecto)
DATABASE_URL="file:./dev.db"

# SMTP para emails (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASSWORD="tu-contraseña"

# Info del restaurante
RESTAURANT_NAME="La Esperanza"
RESTAURANT_EMAIL="reservas@laesperanza.com"
RESTAURANT_PHONE="+34-XXX-XXX-XXX"

# Capacidad
DEFAULT_CAPACITY_PER_SLOT=20       # 20 personas por turno
ADVANCE_BOOKING_DAYS=60            # Reservar hasta 60 días adelante
```

---

## 📧 Configurar Email con Gmail

1. **Activar "Contraseñas de Aplicación"**:
   - Ir a https://myaccount.google.com/security
   - Habilitar "Verificación en dos pasos"
   - Generar "Contraseña de aplicación" para "Correo"

2. **Editar `.env.local`**:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASSWORD="contraseña-generada"  # La de Google, no tu contraseña normal
SMTP_FROM="noreply@laesperanza.com"
```

3. **Reiniciar servidor**:
```bash
npm run dev
```

---

## 🚀 Desplegar en Vercel

### Opción 1: Deploy Automático (Recomendado)

1. Crear cuenta en [vercel.com](https://vercel.com)
2. Conectar tu repositorio GitHub/GitLab
3. Vercel detecta Next.js automáticamente
4. Agregar variables de entorno en Settings
5. Deploy automático ✅

### Opción 2: Deploy Manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## 🐛 Troubleshooting

### ❌ "npm: command not found"
**Solución**: Instalar Node.js desde [nodejs.org](https://nodejs.org)

### ❌ "database schema not up to date"
**Solución**:
```bash
npm run db:push
npm run db:seed
```

### ❌ "Cannot find module '@prisma/client'"
**Solución**:
```bash
npm install
```

### ❌ "SMTP login failed"
- Verificar credenciales en `.env.local`
- Chequear que el app password de Gmail sea correcto
- Revisar logs: `npm run dev`

### ❌ "Admin login no funciona"
**Solución**:
```bash
npm run db:seed  # Regenera usuario admin con contraseña admin123
```

### ❌ Emails no se envían
- Por desarrollo: Normal, se registran en logs
- Para producción: Configurar SMTP válido
- Testing: Revisar `.env.local` tiene SMTP válido

---

## 📊 Base de Datos

### Tablas Creadas

**Reservation** (Reservas)
- id, nombre, apellido, email, teléfono, personas, fecha, hora, comentarios, estado, createdAt, updatedAt

**Schedule** (Horarios)
- id, día, hora, capacidad, activo, createdAt, updatedAt

**Settings** (Configuración)
- id, nombreRestaurante, emailRestaurante, telefonoRestaurante, direccionRestaurante, capacidadPorTurno, diasAvanzados, createdAt, updatedAt

**AdminUser** (Admin)
- id, username, password (hash), email, active, createdAt, updatedAt

### Ver/Editar Base de Datos

```bash
# Abrir Prisma Studio (interfaz visual)
npm run db:studio
```

Esto abre http://localhost:5555 con una interfaz gráfica para ver y editar datos

---

## 🎨 Personalización

### Cambiar Nombre del Restaurante
1. Ir a Admin → Configuración
2. Editar "Nombre del Restaurante"
3. Guardar

### Cambiar Colores
Editar `tailwind.config.ts`:
```ts
colors: {
  'esperanza': {
    50: '#faf8f5',
    500: '#a0826d',  // Color principal - cambiar aquí
    // ...
  }
}
```

### Cambiar Capacidad por Turno
1. Admin → Configuración
2. Editar "Capacidad por Turno"
3. Guardar

### Agregar Nuevos Horarios
1. Admin → Configuración
2. Agregar día y hora
3. Sistema valida automáticamente

---

## 📝 Comandos Útiles

```bash
# Desarrollo
npm run dev                 # Iniciar servidor (hot reload)

# Producción
npm run build              # Compilar para producción
npm start                  # Ejecutar en producción

# Base de datos
npm run db:push           # Sincronizar schema
npm run db:seed           # Crear datos ejemplo
npm run db:studio         # Abrir interfaz gráfica

# Código
npm run lint              # Verificar errores ESLint
npm run build && npm start # Build + iniciar
```

---

## ✅ Checklist Pre-Lanzamiento

- [ ] Base de datos creada: `npm run db:seed`
- [ ] Usuario admin funciona (admin/admin123)
- [ ] Página de reservas accesible: http://localhost:3000/reservas
- [ ] Admin panel accesible: http://localhost:3000/admin
- [ ] Email configurado (opcional pero recomendado)
- [ ] Horarios configurados en admin
- [ ] Capacidad ajustada a realidad
- [ ] Datos del restaurante actualizados
- [ ] Modo oscuro probado
- [ ] Responsive en móvil probado

---

## 🎉 ¡Listo!

Tu sistema de reservas está funcionando. 

**Próximos pasos**:
1. Personalizar datos del restaurante
2. Agregar horarios según tu calendario
3. Probar flujo completo de reserva
4. Desplegar en Vercel o tu servidor

**¿Dudas?** Revisar `README.md` para más detalles técnicos.

---

**Desarrollado con ❤️ para La Esperanza**
