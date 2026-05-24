import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Admin user ───────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@factory.com' },
    update: {},
    create: { name: 'مدير النظام', email: 'admin@factory.com', passwordHash: adminHash, role: 'ADMIN' },
  });

  const managerHash = await bcrypt.hash('manager123', 12);
  await prisma.user.upsert({
    where: { email: 'manager@factory.com' },
    update: {},
    create: { name: 'مدير المصنع', email: 'manager@factory.com', passwordHash: managerHash, role: 'MANAGER' },
  });

  console.log('✅ Users created');

  // ── Partners ─────────────────────────────────────
  const hatem = await prisma.partner.upsert({
    where: { name: 'حاتم' },
    update: {},
    create: { name: 'حاتم' },
  });

  const mido = await prisma.partner.upsert({
    where: { name: 'ميدو' },
    update: {},
    create: { name: 'ميدو' },
  });

  console.log('✅ Partners created');

  // ── Ready Stock ──────────────────────────────────
  const stockItems = [
    { modelCode: 'M001', productName: 'تيشيرت قطن', color: 'أبيض', openingBalance: 50, costPerPiece: 45, location: 'مخزن رئيسي' },
    { modelCode: 'M001', productName: 'تيشيرت قطن', color: 'أسود', openingBalance: 30, costPerPiece: 45, location: 'مخزن رئيسي' },
    { modelCode: 'M002', productName: 'قميص كاجوال', color: 'أزرق', openingBalance: 25, costPerPiece: 85, location: 'مخزن رئيسي' },
    { modelCode: 'M003', productName: 'بلكشت صوف', color: 'رمادي', openingBalance: 40, costPerPiece: 120, location: 'مخزن رئيسي' },
    { modelCode: 'M004', productName: 'جاكيت جينز', color: 'أزرق', openingBalance: 15, costPerPiece: 200, location: 'مخزن رئيسي' },
  ];
  for (const item of stockItems) {
    await prisma.readyStock.upsert({ where: { modelCode_color: { modelCode: item.modelCode, color: item.color } }, update: {}, create: item });
  }
  console.log('✅ Ready stock seeded');

  // ── Fabric ───────────────────────────────────────
  await prisma.fabricEntry.createMany({
    data: [
      { date: new Date('2025-01-15'), materialType: 'قطن', color: 'أبيض', qtyIn: 500, costPerKg: 25 },
      { date: new Date('2025-01-20'), materialType: 'قطن', color: 'أسود', qtyIn: 300, costPerKg: 25 },
      { date: new Date('2025-02-01'), materialType: 'صوف', color: 'رمادي', qtyIn: 200, costPerKg: 60 },
      { date: new Date('2025-02-10'), materialType: 'جينز', color: 'أزرق', qtyIn: 350, costPerKg: 35 },
    ],
  });
  console.log('✅ Fabric entries seeded');

  // ── Accessories ──────────────────────────────────
  await prisma.accessoryEntry.createMany({
    data: [
      { date: new Date('2025-01-10'), itemName: 'أزرار معدنية', qtyIn: 1000, qtyConsumed: 200, cost: 2 },
      { date: new Date('2025-01-10'), itemName: 'خيوط', qtyIn: 500, qtyConsumed: 100, cost: 15 },
      { date: new Date('2025-02-01'), itemName: 'سوستة', qtyIn: 300, qtyConsumed: 50, cost: 8 },
    ],
  });
  console.log('✅ Accessories seeded');

  // ── Cutting ──────────────────────────────────────
  const cut1 = await prisma.cuttingOrder.upsert({
    where: { cutNumber: 1001 },
    update: {},
    create: { date: new Date('2025-01-20'), cutNumber: 1001, cutDescription: 'قص تيشيرت قطن', materialType: 'قطن', color: 'أبيض', layersCount: 20, spreadLengthM: 100, totalPieces: 400, kgConsumed: 150 },
  });
  const cut2 = await prisma.cuttingOrder.upsert({
    where: { cutNumber: 1002 },
    update: {},
    create: { date: new Date('2025-02-05'), cutNumber: 1002, cutDescription: 'قص بلكشت صوف', materialType: 'صوف', color: 'رمادي', layersCount: 15, spreadLengthM: 80, totalPieces: 240, kgConsumed: 80 },
  });
  console.log('✅ Cutting orders seeded');

  // ── Model Productions ────────────────────────────
  await prisma.modelProduction.createMany({
    data: [
      { date: new Date('2025-01-25'), cuttingOrderId: cut1.id, modelCode: 'M001', modelDescription: 'تيشيرت قطن', color: 'أبيض', sizes: 'S,M,L,XL', qtyFromCutting: 400, status: 'COMPLETED', wastage: 10, qtyReceived: 390, warehouseEntryDate: new Date('2025-01-28') },
      { date: new Date('2025-02-10'), cuttingOrderId: cut2.id, modelCode: 'M003', modelDescription: 'بلكشت صوف', color: 'رمادي', sizes: 'M,L,XL', qtyFromCutting: 240, status: 'COMPLETED', wastage: 5, qtyReceived: 235, warehouseEntryDate: new Date('2025-02-15') },
    ],
  });
  console.log('✅ Model productions seeded');

  // ── Sales ────────────────────────────────────────
  const sale1 = await prisma.sale.create({
    data: {
      orderNumber: 'ORD-001', rowNumber: 1, marketerName: 'أحمد',
      clientName: 'سوق شعبي', clientMobile: '01012345678',
      invoiceValue: 725, depositPaid: 300, depositReceiverId: mido.id, remaining: 425,
      shippingNumber: 'SHP-001', orderStatus: 'NOT_DISPATCHED', deliveryMethod: 'ايرجنت',
      warehouseLocation: 'مخزن رئيسي',
      items: { create: [
        { modelCode: 'M001', color: 'أبيض', quantity: 10 },
        { modelCode: 'M001', color: 'أسود', quantity: 5 },
      ]},
    },
  });

  await prisma.sale.create({
    data: {
      orderNumber: 'ORD-002', rowNumber: 2, marketerName: 'محمد',
      clientName: 'متجر أزياء', clientMobile: '01198765432',
      invoiceValue: 1275, depositPaid: 1275, depositReceiverId: hatem.id, remaining: 0,
      shippingNumber: 'SHP-002', orderStatus: 'DISPATCHED', deliveryMethod: 'مصنع',
      warehouseLocation: 'مخزن رئيسي', shippingCollected: 50,
      items: { create: [{ modelCode: 'M002', color: 'أزرق', quantity: 15 }] },
    },
  });

  await prisma.sale.create({
    data: {
      orderNumber: 'ORD-003', rowNumber: 3, marketerName: 'أحمد',
      clientName: 'عبد الرحمن', clientMobile: '01234567890',
      invoiceValue: 1560, depositPaid: 500, depositReceiverId: hatem.id, remaining: 1060,
      orderStatus: 'CLIENT_ACCOUNT', deliveryMethod: 'البريد',
      warehouseLocation: 'مخزن رئيسي',
      items: { create: [
        { modelCode: 'M003', color: 'رمادي', quantity: 8 },
        { modelCode: 'M004', color: 'أزرق', quantity: 3 },
      ]},
    },
  });

  console.log('✅ Sales seeded');

  // ── Expenses ─────────────────────────────────────
  await prisma.expenseRecord.create({
    data: {
      date: new Date('2025-01-01'), operationType: 'CAPITAL', statement: 'رأس المال المبدئي',
      lines: { create: [
        { partnerId: hatem.id, amountIn: 50000, amountOut: 0 },
        { partnerId: mido.id, amountIn: 50000, amountOut: 0 },
      ]},
    },
  });

  await prisma.expenseRecord.create({
    data: {
      date: new Date('2025-01-15'), operationType: 'OPERATING_EXP', statement: 'إيجار المصنع',
      lines: { create: [
        { partnerId: hatem.id, amountIn: 0, amountOut: 3000 },
        { partnerId: mido.id, amountIn: 0, amountOut: 3000 },
      ]},
    },
  });

  await prisma.expenseRecord.create({
    data: {
      date: new Date('2025-02-01'), operationType: 'OPERATING_EXP', statement: 'رواتب العمالة',
      lines: { create: [
        { partnerId: hatem.id, amountIn: 0, amountOut: 5000 },
        { partnerId: mido.id, amountIn: 0, amountOut: 5000 },
      ]},
    },
  });

  console.log('✅ Expenses seeded');

  // ── Debts ─────────────────────────────────────────
  await prisma.debt.createMany({
    data: [
      { date: new Date('2025-01-10'), creditor: 'مورد القماش', totalAmount: 10000, amountPaid: 4000, remaining: 6000 },
      { date: new Date('2025-02-01'), creditor: 'كهرباء', totalAmount: 2500, amountPaid: 2500, remaining: 0 },
    ],
  });

  // ── Client Account ────────────────────────────────
  await prisma.clientAccount.create({
    data: {
      date: new Date('2025-02-05'), clientName: 'عبد الرحمن',
      modelName: 'بلكشت صوف', quantity: 8,
      totalAmount: 960, amountPaid: 500, remaining: 460, notes: 'دفعة أولى',
    },
  });

  console.log('✅ All seed data inserted successfully!');
  console.log('\n🔑 Demo credentials:');
  console.log('   Admin:   admin@factory.com / admin123');
  console.log('   Manager: manager@factory.com / manager123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
