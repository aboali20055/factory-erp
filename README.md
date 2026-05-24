# نظام إدارة المصنع — Factory ERP

نظام ERP متكامل لمصانع الملابس مبني بـ React + Node.js + PostgreSQL.

---

## 📦 المشروع

```
factory-erp/
├── backend/          # Node.js + Express + Prisma API
├── frontend/         # React 18 + TypeScript + Vite
└── ANALYSIS_AND_PLAN.md
```

---

## ⚡ التشغيل السريع

### المتطلبات
- Node.js 18+
- PostgreSQL 14+
- npm 9+

---

### 1. إعداد قاعدة البيانات

```bash
# أنشئ قاعدة بيانات PostgreSQL
createdb factory_erp

# أو داخل psql:
# CREATE DATABASE factory_erp;
```

---

### 2. تشغيل الـ Backend

```bash
cd backend

# نسخ ملف البيئة وتعديله
cp .env.example .env
# عدّل DATABASE_URL و JWT_SECRET في .env

# تثبيت الحزم
npm install

# تطبيق الـ schema على قاعدة البيانات
npx prisma migrate dev --name init

# إدراج البيانات التجريبية (اختياري)
npx prisma db seed

# تشغيل سيرفر التطوير
npm run dev
```

الـ API يعمل على: `http://localhost:3001`

**حسابات تجريبية (بعد الـ seed):**
| البريد | كلمة المرور | الدور |
|--------|-------------|-------|
| admin@factory.com | admin123 | مدير النظام |
| manager@factory.com | manager123 | مدير |

---

### 3. تشغيل الـ Frontend

```bash
cd frontend

# نسخ ملف البيئة
cp .env.example .env.local

# تثبيت الحزم
npm install

# تشغيل سيرفر التطوير
npm run dev
```

الواجهة تعمل على: `http://localhost:5173`

---

## 🏗️ المعمارية

### Backend Stack
| المكوّن | التقنية |
|---------|---------|
| Runtime | Node.js 18 |
| Framework | Express 4 + TypeScript |
| ORM | Prisma 5 |
| Database | PostgreSQL 14 |
| Auth | JWT + bcryptjs |
| Validation | Zod |
| Security | Helmet + CORS + Rate Limiting |

### Frontend Stack
| المكوّن | التقنية |
|---------|---------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS v3 |
| Data Fetching | TanStack Query v5 |
| State | Zustand (auth only) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| HTTP | Axios |

---

## 📋 الصفحات

| الصفحة | المسار | الوصف |
|--------|--------|-------|
| الدخول | `/login` | JWT authentication |
| الرئيسية | `/dashboard` | KPIs + رسوم بيانية |
| المبيعات | `/sales` | فواتير مع بنود متعددة |
| أوامر القص | `/production/cutting` | إدارة القص |
| الإنتاج | `/production/models` | إنتاج الموديلات |
| مخزن الأقمشة | `/inventory/fabric` | وارد + مستهلك |
| المخزون الجاهز | `/inventory/ready-stock` | رصيد بالموديل/المقاس/اللون |
| الاكسسوارات | `/inventory/accessories` | خامات ومستلزمات |
| المصروفات | `/finance/expenses` | مصروفات ببنود تفصيلية |
| الديون | `/finance/debts` | متابعة الديون + دفعات |
| حسابات العملاء | `/finance/client-accounts` | رصيد العملاء |
| المستخدمون | `/admin/users` | ADMIN فقط |

---

## 🔐 نظام الصلاحيات (RBAC)

| الدور | الصلاحية |
|-------|---------|
| `ADMIN` | كامل الصلاحيات + إدارة المستخدمين |
| `MANAGER` | جميع العمليات بدون إدارة المستخدمين |
| `STAFF` | إضافة وتعديل (بدون حذف في بعض الموارد) |
| `VIEWER` | عرض فقط (GET requests) |

---

## 🔌 API Routes

### Auth
```
POST /api/auth/login
GET  /api/auth/me
GET  /api/auth/users          (ADMIN)
POST /api/auth/users          (ADMIN)
PUT  /api/auth/users/:id      (ADMIN)
```

### Sales
```
GET    /api/sales
POST   /api/sales
GET    /api/sales/:id
PUT    /api/sales/:id
DELETE /api/sales/:id
GET    /api/sales/returns
POST   /api/sales/:id/returns
```

### Production
```
GET/POST/PUT/DELETE /api/production/cutting
GET/POST/PUT/DELETE /api/production/models
```

### Inventory
```
GET/POST/PUT/DELETE /api/inventory/fabric
GET/POST/PUT/DELETE /api/inventory/ready-stock
GET/POST/PUT/DELETE /api/inventory/accessories
```

### Finance
```
GET/POST/PUT/DELETE /api/finance/expenses
GET/POST/PUT/DELETE /api/finance/debts
POST /api/finance/debts/:id/payments
GET/POST/PUT/DELETE /api/finance/client-accounts
POST /api/finance/client-accounts/:id/payments
GET/POST/PUT/DELETE /api/finance/partners
```

### Dashboard
```
GET /api/dashboard
```

---

## 🚀 النشر للإنتاج (Production)

### Backend على Render / Railway

```bash
# Build
npm run build

# Start
npm start
```

متغيرات البيئة المطلوبة:
```env
DATABASE_URL=postgresql://user:pass@host:5432/factory_erp
JWT_SECRET=<random-64-char-string>
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-domain.com
```

### Frontend على Vercel / Netlify

```bash
npm run build
# رفع مجلد dist/
```

متغيرات البيئة:
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### Docker (اختياري)

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
RUN npx prisma generate
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

---

## 🛠️ أوامر مفيدة

```bash
# إعادة ضبط قاعدة البيانات من الصفر
npx prisma migrate reset

# فتح Prisma Studio (واجهة قاعدة البيانات)
npx prisma studio

# توليد Prisma Client بعد تعديل الـ schema
npx prisma generate

# بناء الـ backend للإنتاج
npm run build

# فحص TypeScript
npx tsc --noEmit
```

---

## 📈 التحسينات مقارنة بالنظام القديم

| المشكلة القديمة | الحل الجديد |
|----------------|-------------|
| localStorage فقط | PostgreSQL + Prisma |
| لا يوجد تشفير | JWT + bcrypt |
| اسماء مشفّرة في الكود | جدول Partners قابل للتعديل |
| 5 موديلات فقط للفاتورة | SaleItems بلا حد |
| polling كل 1.5 ثانية | React Query + 30s staleTime |
| لا صلاحيات | RBAC كامل (ADMIN/MANAGER/STAFF/VIEWER) |
| لا تحقق من البيانات | Zod على الـ API + React Hook Form |
| لا سجل تدقيق | AuditLog على كل تغيير |
| حذف نهائي | Soft deletes (deleted_at) |
| لا pagination | Cursor-based pagination على كل قائمة |
