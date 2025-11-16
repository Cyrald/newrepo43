import { db } from "./db";
import { users, userRoles, categories, products, productImages } from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
  console.log("🌱 Начинаем заполнение базы данных...");

  const adminEmail = "admin@ecomarket.ru";
  const existingAdmin = await db
    .select()
    .from(users)
    .where((u) => u.email === adminEmail)
    .limit(1);

  let adminUser;
  if (existingAdmin.length === 0) {
    console.log("👤 Создаём админ-пользователя...");
    const adminPasswordHash = await hashPassword("admin123");
    
    const [newAdmin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash: adminPasswordHash,
        firstName: "Администратор",
        lastName: "Системы",
        phone: "+79991234567",
        isVerified: true,
        bonusBalance: 0,
      })
      .returning();
    
    adminUser = newAdmin;

    await db.insert(userRoles).values({
      userId: adminUser.id,
      role: "admin",
    });

    console.log("✓ Админ создан: admin@ecomarket.ru / admin123");
  } else {
    adminUser = existingAdmin[0];
    console.log("✓ Админ уже существует");
  }

  const existingCategories = await db.select().from(categories).limit(1);
  
  if (existingCategories.length === 0) {
    console.log("📂 Создаём категории...");
    
    const categoryData = [
      { name: "Мёд и продукты пчеловодства", slug: "honey", description: "Натуральный мёд, прополис, пчелиная пыльца", sortOrder: 1 },
      { name: "Травяные сборы и чаи", slug: "herbs", description: "Лечебные травы и натуральные чаи", sortOrder: 2 },
      { name: "Органическая косметика", slug: "cosmetics", description: "Натуральная косметика и средства по уходу", sortOrder: 3 },
      { name: "Суперфуды", slug: "superfoods", description: "Спирулина, хлорелла, семена чиа и другие суперфуды", sortOrder: 4 },
      { name: "Масла и орехи", slug: "oils-nuts", description: "Органические масла и орехи", sortOrder: 5 },
    ];

    const createdCategories = await db.insert(categories).values(categoryData).returning();
    console.log(`✓ Создано ${createdCategories.length} категорий`);

    console.log("🛍️ Создаём тестовые товары...");
    
    const honeyCategory = createdCategories.find(c => c.slug === "honey")!;
    const herbsCategory = createdCategories.find(c => c.slug === "herbs")!;
    const superfoodsCategory = createdCategories.find(c => c.slug === "superfoods")!;

    const productData = [
      {
        categoryId: honeyCategory.id,
        sku: "HONEY-001",
        name: "Мёд цветочный натуральный",
        description: "Натуральный цветочный мёд высшего качества, собранный в экологически чистых районах. Богат витаминами и минералами, укрепляет иммунитет.",
        composition: "100% натуральный цветочный мёд",
        storageConditions: "Хранить при температуре от +4°C до +20°C в тёмном месте",
        usageInstructions: "Употреблять по 1-2 чайные ложки в день",
        contraindications: "Индивидуальная непереносимость продуктов пчеловодства",
        weight: "500",
        volume: null,
        dimensionsHeight: "12",
        dimensionsLength: "8",
        dimensionsWidth: "8",
        shelfLifeDays: 730,
        stockQuantity: 50,
        price: "850",
        discountPercentage: "0",
        isNew: true,
        isArchived: false,
      },
      {
        categoryId: honeyCategory.id,
        sku: "HONEY-002",
        name: "Мёд гречишный тёмный",
        description: "Тёмный гречишный мёд с насыщенным вкусом и ароматом. Содержит повышенное количество железа и белка.",
        composition: "100% натуральный гречишный мёд",
        storageConditions: "Хранить при температуре от +4°C до +20°C в тёмном месте",
        usageInstructions: "Употреблять по 1-2 чайные ложки в день",
        contraindications: "Индивидуальная непереносимость продуктов пчеловодства",
        weight: "500",
        volume: null,
        dimensionsHeight: "12",
        dimensionsLength: "8",
        dimensionsWidth: "8",
        shelfLifeDays: 730,
        stockQuantity: 35,
        price: "950",
        discountPercentage: "10",
        discountStartDate: new Date(),
        discountEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isNew: false,
        isArchived: false,
      },
      {
        categoryId: herbsCategory.id,
        sku: "HERB-001",
        name: "Иван-чай ферментированный",
        description: "Традиционный русский чай из кипрея узколистного. Обладает успокаивающим действием, улучшает пищеварение.",
        composition: "Листья кипрея узколистного ферментированные - 100%",
        storageConditions: "Хранить в сухом прохладном месте в герметичной упаковке",
        usageInstructions: "Заваривать 1-2 чайные ложки на 200 мл кипятка, настаивать 5-7 минут",
        contraindications: "Индивидуальная непереносимость",
        weight: "100",
        volume: null,
        dimensionsHeight: "15",
        dimensionsLength: "10",
        dimensionsWidth: "5",
        shelfLifeDays: 365,
        stockQuantity: 100,
        price: "350",
        discountPercentage: "0",
        isNew: true,
        isArchived: false,
      },
      {
        categoryId: herbsCategory.id,
        sku: "HERB-002",
        name: "Сбор трав \"Здоровый сон\"",
        description: "Натуральный травяной сбор для спокойного и крепкого сна. Содержит мяту, мелиссу, ромашку и лаванду.",
        composition: "Мята перечная, мелисса лекарственная, ромашка аптечная, лаванда",
        storageConditions: "Хранить в сухом прохладном месте",
        usageInstructions: "Заваривать 1 пакетик на чашку кипятка за 30 минут до сна",
        contraindications: "Беременность, индивидуальная непереносимость",
        weight: "50",
        volume: null,
        dimensionsHeight: "12",
        dimensionsLength: "8",
        dimensionsWidth: "4",
        shelfLifeDays: 540,
        stockQuantity: 75,
        price: "280",
        discountPercentage: "0",
        isNew: false,
        isArchived: false,
      },
      {
        categoryId: superfoodsCategory.id,
        sku: "SUPER-001",
        name: "Спирулина органическая в порошке",
        description: "100% натуральная спирулина - источник белка, витаминов и минералов. Повышает энергию и укрепляет иммунитет.",
        composition: "Спирулина платенсис (Spirulina platensis) - 100%",
        storageConditions: "Хранить в сухом прохладном месте, вдали от солнечных лучей",
        usageInstructions: "Принимать по 5-10 г (1-2 чайные ложки) в день с водой или соком",
        contraindications: "Беременность, лактация, аутоиммунные заболевания",
        weight: "200",
        volume: null,
        dimensionsHeight: "15",
        dimensionsLength: "10",
        dimensionsWidth: "10",
        shelfLifeDays: 730,
        stockQuantity: 40,
        price: "1250",
        discountPercentage: "15",
        discountStartDate: new Date(),
        discountEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        isNew: true,
        isArchived: false,
      },
      {
        categoryId: superfoodsCategory.id,
        sku: "SUPER-002",
        name: "Семена чиа органические",
        description: "Органические семена чиа - богатый источник Омега-3, клетчатки и антиоксидантов.",
        composition: "Семена чиа (Salvia hispanica) - 100%",
        storageConditions: "Хранить в сухом прохладном месте",
        usageInstructions: "Добавлять 1-2 столовые ложки в день в йогурты, каши, смузи",
        contraindications: "Индивидуальная непереносимость",
        weight: "250",
        volume: null,
        dimensionsHeight: "18",
        dimensionsLength: "12",
        dimensionsWidth: "6",
        shelfLifeDays: 730,
        stockQuantity: 60,
        price: "450",
        discountPercentage: "0",
        isNew: false,
        isArchived: false,
      },
    ];

    const createdProducts = await db.insert(products).values(productData).returning();
    console.log(`✓ Создано ${createdProducts.length} товаров`);

    console.log("🖼️ Добавляем изображения для товаров...");
    const imageData = createdProducts.map(product => ({
      productId: product.id,
      url: "/placeholder-product.jpg",
      sortOrder: 0,
    }));

    await db.insert(productImages).values(imageData);
    console.log(`✓ Добавлено ${imageData.length} изображений`);
  } else {
    console.log("✓ Категории и товары уже существуют");
  }

  console.log("✅ База данных успешно заполнена!");
}

seed()
  .catch((error) => {
    console.error("❌ Ошибка при заполнении базы данных:", error);
    process.exit(1);
  })
  .then(() => {
    console.log("👋 Готово!");
    process.exit(0);
  });
