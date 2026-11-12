import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu mẫu cho quán cà phê...');

  const adminPass = await bcrypt.hash('Admin@123', 10);
  const staffPass = await bcrypt.hash('Staff@123', 10);

  // 1. Users
  await prisma.user.upsert({
    where: { email: 'admin@coffee.vn' },
    update: {},
    create: {
      email: 'admin@coffee.vn',
      password: adminPass,
      fullName: 'Quản trị viên',
      phone: '0901000001',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'cashier@coffee.vn' },
    update: {},
    create: {
      email: 'cashier@coffee.vn',
      password: staffPass,
      fullName: 'Nguyễn Thu Ngân',
      phone: '0901000002',
      role: 'CASHIER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'barista@coffee.vn' },
    update: {},
    create: {
      email: 'barista@coffee.vn',
      password: staffPass,
      fullName: 'Trần Pha Chế',
      phone: '0901000003',
      role: 'BARISTA',
    },
  });

  // 2. Categories & Products
  const coffeeCat = await prisma.category.upsert({
    where: { name: 'Cà phê' },
    update: {},
    create: { name: 'Cà phê', description: 'Cà phê phin và pha máy', sortOrder: 1 },
  });

  const teaCat = await prisma.category.upsert({
    where: { name: 'Trà & Trà sữa' },
    update: {},
    create: { name: 'Trà & Trà sữa', description: 'Trà trái cây và trà sữa', sortOrder: 2 },
  });

  const pastryCat = await prisma.category.upsert({
    where: { name: 'Bánh ngọt' },
    update: {},
    create: { name: 'Bánh ngọt', description: 'Bánh ăn kèm mỗi ngày', sortOrder: 3 },
  });

  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    const sampleProducts = [
      { name: 'Cà phê sữa đá', basePrice: 35000, categoryId: coffeeCat.id, description: 'Cà phê phin truyền thống với sữa đặc' },
      { name: 'Bạc xỉu', basePrice: 39000, categoryId: coffeeCat.id, description: 'Sữa tươi nhiều, cà phê thơm nhẹ' },
      { name: 'Americano đá', basePrice: 40000, categoryId: coffeeCat.id, description: 'Espresso nguyên chất pha loãng' },
      { name: 'Trà đào cam sả', basePrice: 45000, categoryId: teaCat.id, description: 'Trà đen ủ lạnh cùng đào miếng và sả thơm' },
      { name: 'Trà sữa Ô Long', basePrice: 48000, categoryId: teaCat.id, description: 'Trà Ô Long rang đậm vị sữa' },
      { name: 'Croissant bơ Pháp', basePrice: 35000, categoryId: pastryCat.id, description: 'Bánh sừng bò giòn rụm' },
    ];

    for (const p of sampleProducts) {
      await prisma.product.create({
        data: {
          ...p,
          variants: {
            create: [
              { size: 'S', priceDelta: -5000 },
              { size: 'M', priceDelta: 0 },
              { size: 'L', priceDelta: 6000 },
            ],
          },
        },
      });
    }
  }

  // 3. Toppings
  const toppings = [
    { name: 'Trân châu đen', price: 8000 },
    { name: 'Trân châu trắng', price: 10000 },
    { name: 'Kem cheese', price: 12000 },
    { name: 'Thêm 1 shot Espresso', price: 10000 },
  ];
  for (const t of toppings) {
    await prisma.topping.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    });
  }

  // 4. Tables
  const tables = [
    { name: 'Bàn 01', zone: 'Tầng 1', capacity: 2 },
    { name: 'Bàn 02', zone: 'Tầng 1', capacity: 4 },
    { name: 'Bàn 03', zone: 'Tầng 2', capacity: 4 },
    { name: 'Bàn 04', zone: 'Sân vườn', capacity: 6 },
  ];
  for (const tb of tables) {
    await prisma.table.upsert({
      where: { name: tb.name },
      update: {},
      create: tb,
    });
  }

  // 5. Voucher
  await prisma.voucher.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: 'Giảm 10% tối đa 30k cho khách hàng mới',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 50000,
      maxDiscount: 30000,
      usageLimit: 500,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
    },
  });

  // 6. Ingredients
  const ingredients = [
    { name: 'Cà phê hạt Robusta', unit: 'g', currentStock: 5000, minStock: 1000, costPerUnit: 250 },
    { name: 'Sữa đặc Ngôi Sao', unit: 'ml', currentStock: 3000, minStock: 800, costPerUnit: 50 },
    { name: 'Sữa tươi không đường', unit: 'ml', currentStock: 10000, minStock: 2000, costPerUnit: 35 },
    { name: 'Ly nhựa 500ml', unit: 'pcs', currentStock: 500, minStock: 100, costPerUnit: 1200 },
  ];
  for (const ing of ingredients) {
    await prisma.ingredient.upsert({
      where: { name: ing.name },
      update: {},
      create: ing,
    });
  }

  console.log('✅ Seed dữ liệu hoàn tất!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

