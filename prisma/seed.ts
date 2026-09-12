import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting DineFlow database seed with authentic Kerala & Indian dishes...");

  // Clean existing records in reverse dependency order
  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users (RBAC)
  const adminUser = await prisma.user.create({
    data: {
      name: "Sujith Nair (Manager)",
      email: "admin@dineflow.com",
      role: "ADMIN",
      pin: "9999",
    },
  });

  const cashierUser = await prisma.user.create({
    data: {
      name: "Anjali Menon (Cashier)",
      email: "cashier@dineflow.com",
      role: "CASHIER",
      pin: "1111",
    },
  });

  await prisma.user.create({
    data: {
      name: "Chef Moideen (Head Chef)",
      email: "chef@dineflow.com",
      role: "KITCHEN_STAFF",
      pin: "2222",
    },
  });

  console.log("✅ Seeded Users (Admin, Cashier, Kitchen Staff)");

  // 2. Seed 5 Culinary Categories
  const catBreakfast = await prisma.category.create({
    data: {
      name: "Kerala Breakfast & Breads",
      slug: "breakfast-breads",
      icon: "Croissant",
      sortOrder: 1,
    },
  });

  const catMains = await prisma.category.create({
    data: {
      name: "Mains & Traditional Curries",
      slug: "mains-curries",
      icon: "Flame",
      sortOrder: 2,
    },
  });

  const catSadya = await prisma.category.create({
    data: {
      name: "Meals & Vegetarian (Sadya)",
      slug: "meals-vegetarian",
      icon: "Leaf",
      sortOrder: 3,
    },
  });

  const catStarters = await prisma.category.create({
    data: {
      name: "Starters & Snacks",
      slug: "starters-snacks",
      icon: "Utensils",
      sortOrder: 4,
    },
  });

  const catBeverages = await prisma.category.create({
    data: {
      name: "Desserts & Beverages",
      slug: "desserts-beverages",
      icon: "Coffee",
      sortOrder: 5,
    },
  });

  console.log("✅ Seeded 5 Cuisine Categories");

  // 3. Seed Menu Items (Kerala & Indian Cuisine with High-Res Photos)
  const menuData = [
    // --- 1. Kerala Breakfast & Breads ---
    {
      name: "Kerala Malabar Porotta (Set of 2)",
      description: "Flaky, multi-layered golden flatbread prepared with beaten dough, griddled to crisp perfection with pure ghee.",
      price: 60,
      categoryId: catBreakfast.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 10,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Nadan Appam with Vegetable Ishtu",
      description: "Lacy fermented rice pancake with soft spongy centre, served with mildly spiced coconut milk vegetable stew.",
      price: 120,
      categoryId: catBreakfast.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 12,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Puttu and Kadala Curry",
      description: "Cylindrical steamed rice cake layered with fresh coconut, paired with roasted black chickpea curry in coconut gravy.",
      price: 130,
      categoryId: catBreakfast.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "VEG",
      prepTimeMinutes: 12,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Steamed Idiyappam (String Hoppers)",
      description: "Delicate steamed rice noodle nests served piping hot with freshly extracted sweetened coconut milk and sugar.",
      price: 70,
      categoryId: catBreakfast.id,
      spiceLevel: "MILD",
      dietaryTag: "VEGAN",
      prepTimeMinutes: 10,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
    },

    // --- 2. Mains & Traditional Curries ---
    {
      name: "Malabar Chicken Dum Biryani",
      description: "Fragrant short-grain Khaima/Jeerakasala rice dum-cooked with marinated chicken, fried golden cashews, sultanas & boiled egg.",
      price: 320,
      categoryId: catMains.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "NON_VEG",
      prepTimeMinutes: 15,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Thalassery Mutton Biryani",
      description: "Authentic North Malabar baby goat biryani layered with aromatic ghee rice, fresh mint, and spiced date pickle.",
      price: 420,
      categoryId: catMains.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "NON_VEG",
      prepTimeMinutes: 18,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Kerala Meen Curry (Kudampuli Fish Curry)",
      description: "Fresh Seer fish simmered in an earthen pot with Malabar kokum (kudampuli), shallots, curry leaves, and spicy red gravy.",
      price: 360,
      categoryId: catMains.id,
      spiceLevel: "SPICY",
      dietaryTag: "NON_VEG",
      prepTimeMinutes: 20,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Kerala Beef Roast (Ularthiyathu)",
      description: "Slow-roasted beef chunks tossed in crushed Tellicherry black pepper, toasted coconut slivers (thenga kothu), and curry leaves.",
      price: 320,
      categoryId: catMains.id,
      spiceLevel: "VERY_SPICY",
      dietaryTag: "NON_VEG",
      prepTimeMinutes: 20,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Alleppey Fish Moilee",
      description: "Kingfish steaks gently simmered in velvety coconut milk, green chillies, raw mango slices, and ginger.",
      price: 390,
      categoryId: catMains.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "NON_VEG",
      prepTimeMinutes: 18,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Delhi Style Butter Chicken",
      description: "Tandoori chicken morsels simmered in a silky, rich cashew-tomato makhani gravy with butter and aromatic Kasuri Methi.",
      price: 340,
      categoryId: catMains.id,
      spiceLevel: "MILD",
      dietaryTag: "NON_VEG",
      prepTimeMinutes: 15,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Paneer Butter Masala",
      description: "Fresh cottage cheese cubes simmered in a creamy, velvety cashew-tomato sauce with mild spices and fenugreek.",
      price: 270,
      categoryId: catMains.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "VEG",
      prepTimeMinutes: 15,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Dal Makhani",
      description: "Whole black urad lentils and red kidney beans slow-simmered overnight with churned white butter and cream.",
      price: 230,
      categoryId: catMains.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 12,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    },

    // --- 3. Meals & Vegetarian (Sadya Specialties) ---
    {
      name: "Traditional Kerala Sadya Feast",
      description: "Grand vegetarian banquet served on a fresh banana leaf with red matta rice, avial, thoran, sambar, rasam, payasam & chips.",
      price: 290,
      categoryId: catSadya.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "VEG",
      prepTimeMinutes: 10,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Heritage Kerala Avial",
      description: "Heritage medley of raw plantain, elephant yam, drumsticks and beans in a crushed cumin-coconut yogurt gravy.",
      price: 180,
      categoryId: catSadya.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 15,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Beans & Carrot Thoran",
      description: "Finely diced French beans and carrots stir-fried with freshly grated coconut, mustard seeds, and crisp curry leaves.",
      price: 150,
      categoryId: catSadya.id,
      spiceLevel: "MILD",
      dietaryTag: "VEGAN",
      prepTimeMinutes: 10,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Travancore Sambar & Pepper Rasam Set",
      description: "Traditional drumstick shallot sambar made with freshly roasted spices, paired with digestive black pepper rasam.",
      price: 160,
      categoryId: catSadya.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "VEGAN",
      prepTimeMinutes: 10,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    },

    // --- 4. Starters & Snacks ---
    {
      name: "Kerala Banana Fritters (Pazham Pori)",
      description: "Sweet, ripe Nendran plantains dipped in golden batter and fried till crisp on the outside, tender inside.",
      price: 90,
      categoryId: catStarters.id,
      spiceLevel: "MILD",
      dietaryTag: "VEGAN",
      prepTimeMinutes: 8,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Crispy Parippu Vada (Dal Fritters - 4 pcs)",
      description: "Crunchy tea-time fritters prepared with coarse Bengal gram, shallots, ginger, and green chillies.",
      price: 80,
      categoryId: catStarters.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "VEGAN",
      prepTimeMinutes: 8,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Malabar Chicken 65",
      description: "Spicy, deep-fried chicken morsels marinated in Kashmiri chili, crushed garlic, and tossed with fresh curry leaves.",
      price: 260,
      categoryId: catStarters.id,
      spiceLevel: "SPICY",
      dietaryTag: "NON_VEG",
      prepTimeMinutes: 15,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Classic Punjabi Samosas (Set of 2)",
      description: "Crispy flaky pastry crust filled with spiced potatoes, green peas, and toasted cumin seeds, served with mint chutney.",
      price: 80,
      categoryId: catStarters.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "VEG",
      prepTimeMinutes: 8,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    },

    // --- 5. Desserts & Beverages ---
    {
      name: "Palada Pradhaman Payasam",
      description: "Royal Kerala dessert of steamed rice flakes cooked in sweetened reduced milk, cardamom, and ghee roasted cashews.",
      price: 120,
      categoryId: catBeverages.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 5,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Malabar Sulaimani Chai",
      description: "Golden cardamom and clove infused black tea finished with freshly squeezed yellow lime juice and mint.",
      price: 40,
      categoryId: catBeverages.id,
      spiceLevel: "MILD",
      dietaryTag: "VEGAN",
      prepTimeMinutes: 5,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "South Indian Filter Coffee",
      description: "Strong chicory-blended coffee decoction frothed with boiling whole milk, served in a traditional dabarah tumbler.",
      price: 60,
      categoryId: catBeverages.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 5,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Alphonso Mango Lassi",
      description: "Thick sweet churned yogurt blended with luscious Alphonso mango pulp, a hint of cardamom, and crushed pistachios.",
      price: 110,
      categoryId: catBeverages.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 5,
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const createdMenuItems: Record<string, any> = {};
  for (const item of menuData) {
    const created = await prisma.menuItem.create({ data: item });
    createdMenuItems[item.name] = created;
  }
  console.log(`✅ Seeded ${menuData.length} authentic Kerala & Indian menu items with high-res photography`);

  // 4. Seed Floor Tables (Tables 1 to 12 + Takeaways)
  const createdTables: Record<number, any> = {};
  for (let i = 1; i <= 12; i++) {
    const table = await prisma.table.create({
      data: {
        number: i,
        name: `Table ${i}`,
        capacity: i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
        status: i === 3 ? "OCCUPIED" : i === 5 ? "OCCUPIED" : i === 8 ? "BILLING" : "AVAILABLE",
      },
    });
    createdTables[i] = table;
  }

  // Seed Takeaway Counters
  await prisma.table.create({
    data: {
      number: 91,
      name: "Takeaway Express 1",
      capacity: 1,
      status: "OCCUPIED",
    },
  });

  await prisma.table.create({
    data: {
      number: 92,
      name: "Takeaway Express 2",
      capacity: 1,
      status: "AVAILABLE",
    },
  });

  console.log("✅ Seeded 14 Tables (Floor tables + Takeaways)");

  // 5. Seed Realistic Historical Orders (Past 3 Days) for AI Analytics
  const now = new Date();
  let orderSeq = 1001;

  const getPastDate = (daysAgo: number, hour: number, minute: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const sampleHistoricalDishes = [
    [createdMenuItems["Malabar Chicken Dum Biryani"], createdMenuItems["Malabar Sulaimani Chai"]],
    [createdMenuItems["Kerala Malabar Porotta (Set of 2)"], createdMenuItems["Kerala Beef Roast (Ularthiyathu)"], createdMenuItems["Malabar Sulaimani Chai"]],
    [createdMenuItems["Nadan Appam with Vegetable Ishtu"], createdMenuItems["Alleppey Fish Moilee"], createdMenuItems["Palada Pradhaman Payasam"]],
    [createdMenuItems["Traditional Kerala Sadya Feast"], createdMenuItems["Alphonso Mango Lassi"]],
    [createdMenuItems["Kerala Meen Curry (Kudampuli Fish Curry)"], createdMenuItems["Kerala Malabar Porotta (Set of 2)"], createdMenuItems["Palada Pradhaman Payasam"]],
    [createdMenuItems["Puttu and Kadala Curry"], createdMenuItems["South Indian Filter Coffee"]],
    [createdMenuItems["Thalassery Mutton Biryani"], createdMenuItems["Malabar Chicken 65"], createdMenuItems["Malabar Sulaimani Chai"]],
    [createdMenuItems["Delhi Style Butter Chicken"], createdMenuItems["Kerala Malabar Porotta (Set of 2)"]],
    [createdMenuItems["Paneer Butter Masala"], createdMenuItems["Kerala Malabar Porotta (Set of 2)"], createdMenuItems["Classic Punjabi Samosas (Set of 2)"]],
  ];

  for (let daysAgo = 3; daysAgo >= 1; daysAgo--) {
    const dailyPeakHours = [
      { hour: 12, min: 45 },
      { hour: 13, min: 15 },
      { hour: 13, min: 45 },
      { hour: 14, min: 10 },
      { hour: 19, min: 30 },
      { hour: 20, min: 0 },
      { hour: 20, min: 45 },
      { hour: 21, min: 30 },
    ];

    for (const peak of dailyPeakHours) {
      const dishGroup = sampleHistoricalDishes[orderSeq % sampleHistoricalDishes.length];
      const orderDate = getPastDate(daysAgo, peak.hour, peak.min);

      let subtotal = 0;
      const orderItemsData = dishGroup.map((dish) => {
        const qty = dish.price < 100 ? 2 : 1;
        subtotal += dish.price * qty;
        return {
          menuItemId: dish.id,
          quantity: qty,
          unitPrice: dish.price,
          status: "READY",
        };
      });

      const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
      const finalAmount = Math.round(subtotal + taxAmount);
      const paymentMethods = ["UPI", "CARD", "CASH"];
      const pMethod = paymentMethods[orderSeq % paymentMethods.length];

      const order = await prisma.order.create({
        data: {
          orderNumber: `DF-${orderSeq}`,
          orderType: orderSeq % 4 === 0 ? "TAKEAWAY" : "DINE_IN",
          status: "BILLED",
          tableId: createdTables[(orderSeq % 10) + 1]?.id || createdTables[1].id,
          userId: cashierUser.id,
          subtotal,
          taxAmount,
          discountAmount: 0,
          finalAmount,
          paymentStatus: "PAID",
          paymentMethod: pMethod,
          createdAt: orderDate,
          updatedAt: orderDate,
          items: {
            create: orderItemsData,
          },
        },
      });

      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-2026-${orderSeq}`,
          orderId: order.id,
          subtotal,
          cgst: Math.round(taxAmount / 2 * 100) / 100,
          sgst: Math.round(taxAmount / 2 * 100) / 100,
          totalAmount: finalAmount,
          paymentMethod: pMethod,
          customerName: ["Rahul Kurup", "Fathima Zahra", "Vineeth Nair", "Lakshmi Pillai", "Mathew Thomas"][orderSeq % 5],
          createdAt: orderDate,
        },
      });

      orderSeq++;
    }
  }

  console.log("✅ Seeded 24 Historical Orders with Invoices for Gemini Sales Intelligence");

  // 6. Seed Active Live Orders for Real-Time Kitchen Display System (KDS)
  // Ticket 1: Preparing (Table 3)
  const activeOrder1 = await prisma.order.create({
    data: {
      orderNumber: `DF-${orderSeq++}`,
      orderType: "DINE_IN",
      status: "PREPARING",
      tableId: createdTables[3].id,
      userId: adminUser.id,
      subtotal: 700,
      taxAmount: 35,
      finalAmount: 735,
      specialNotes: "Make biryani raita extra chilled; porotta well done",
      createdAt: new Date(Date.now() - 14 * 60 * 1000),
      items: {
        create: [
          {
            menuItemId: createdMenuItems["Malabar Chicken Dum Biryani"].id,
            quantity: 2,
            unitPrice: 320,
            spicePreference: "MEDIUM",
            status: "PREPARING",
          },
          {
            menuItemId: createdMenuItems["Kerala Malabar Porotta (Set of 2)"].id,
            quantity: 1,
            unitPrice: 60,
            spicePreference: "MILD",
            notes: "Crisp and hot",
            status: "PREPARING",
          },
        ],
      },
    },
  });
  await prisma.table.update({
    where: { id: createdTables[3].id },
    data: { currentOrderId: activeOrder1.id },
  });

  // Ticket 2: Sent to Kitchen (Table 5)
  const activeOrder2 = await prisma.order.create({
    data: {
      orderNumber: `DF-${orderSeq++}`,
      orderType: "DINE_IN",
      status: "SENT_TO_KITCHEN",
      tableId: createdTables[5].id,
      userId: adminUser.id,
      subtotal: 420,
      taxAmount: 21,
      finalAmount: 441,
      specialNotes: "Kudampuli gravy extra spicy please",
      createdAt: new Date(Date.now() - 4 * 60 * 1000),
      items: {
        create: [
          {
            menuItemId: createdMenuItems["Kerala Meen Curry (Kudampuli Fish Curry)"].id,
            quantity: 1,
            unitPrice: 360,
            spicePreference: "SPICY",
            notes: "Earthen pot served",
            status: "PENDING",
          },
          {
            menuItemId: createdMenuItems["Kerala Malabar Porotta (Set of 2)"].id,
            quantity: 1,
            unitPrice: 60,
            status: "PENDING",
          },
        ],
      },
    },
  });
  await prisma.table.update({
    where: { id: createdTables[5].id },
    data: { currentOrderId: activeOrder2.id },
  });

  // Ticket 3: Ready for Serving (Table 8)
  const activeOrder3 = await prisma.order.create({
    data: {
      orderNumber: `DF-${orderSeq++}`,
      orderType: "DINE_IN",
      status: "READY",
      tableId: createdTables[8].id,
      userId: cashierUser.id,
      subtotal: 500,
      taxAmount: 25,
      finalAmount: 525,
      createdAt: new Date(Date.now() - 22 * 60 * 1000),
      items: {
        create: [
          {
            menuItemId: createdMenuItems["Kerala Beef Roast (Ularthiyathu)"].id,
            quantity: 1,
            unitPrice: 320,
            spicePreference: "VERY_SPICY",
            status: "READY",
          },
          {
            menuItemId: createdMenuItems["Kerala Malabar Porotta (Set of 2)"].id,
            quantity: 2,
            unitPrice: 60,
            status: "READY",
          },
          {
            menuItemId: createdMenuItems["Malabar Sulaimani Chai"].id,
            quantity: 2,
            unitPrice: 40,
            status: "READY",
          },
        ],
      },
    },
  });
  await prisma.table.update({
    where: { id: createdTables[8].id },
    data: { currentOrderId: activeOrder3.id },
  });

  console.log("✅ Seeded 3 Live Active Orders for real-time KDS testing");
  console.log("🎉 DineFlow Database Seed Completed Successfully with Authentic Kerala Dishes!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
