import { db } from "./db";

export async function seedDatabase(customPrisma?: any) {
  const prisma = customPrisma || db;

  console.log("🌱 Seeding DineFlow with authentic Kerala & Indian menu, tables, and roles...");

  // Check if categories already exist
  const existingCount = await prisma.category.count().catch(() => 0);
  if (existingCount > 0) {
    console.log("Categories already exist. Skipping seed.");
    return { success: true, message: "Database already contains menu data." };
  }

  // 1. Seed Users (RBAC)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@dineflow.com" },
    update: {},
    create: {
      name: "Sujith Nair (Manager)",
      email: "admin@dineflow.com",
      role: "ADMIN",
      pin: "9999",
    },
  });

  const cashierUser = await prisma.user.upsert({
    where: { email: "cashier@dineflow.com" },
    update: {},
    create: {
      name: "Anjali Menon (Cashier)",
      email: "cashier@dineflow.com",
      role: "CASHIER",
      pin: "1111",
    },
  });

  await prisma.user.upsert({
    where: { email: "chef@dineflow.com" },
    update: {},
    create: {
      name: "Chef Moideen (Head Chef)",
      email: "chef@dineflow.com",
      role: "KITCHEN_STAFF",
      pin: "2222",
    },
  });

  // 2. Seed 5 Cuisine Categories
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

  // 3. Seed 24 Authentic Kerala & Indian Dishes
  const dishes = [
    // Kerala Breakfast & Breads
    {
      name: "Kerala Malabar Porotta (Set of 2)",
      description: "Flaky, multi-layered golden flatbread prepared with beaten dough, griddled to crisp perfection with pure ghee.",
      price: 60,
      categoryId: catBreakfast.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 10,
      imageUrl: "",
    },
    {
      name: "Nadan Appam with Vegetable Ishtu",
      description: "Lacy fermented rice pancake with soft spongy centre, served with mildly spiced coconut milk vegetable stew.",
      price: 120,
      categoryId: catBreakfast.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 12,
      imageUrl: "",
    },
    {
      name: "Puttu and Kadala Curry",
      description: "Cylindrical steamed rice cake layered with fresh coconut, paired with roasted black chickpea curry in coconut gravy.",
      price: 130,
      categoryId: catBreakfast.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "VEG",
      prepTimeMinutes: 12,
      imageUrl: "",
    },
    {
      name: "Steamed Idiyappam (String Hoppers)",
      description: "Delicate steamed rice noodle nests served piping hot with freshly extracted sweetened coconut milk and sugar.",
      price: 70,
      categoryId: catBreakfast.id,
      spiceLevel: "MILD",
      dietaryTag: "VEGAN",
      prepTimeMinutes: 10,
      imageUrl: "",
    },

    // Mains & Traditional Curries
    {
      name: "Malabar Chicken Dum Biryani",
      description: "Fragrant short-grain Khaima/Jeerakasala rice dum-cooked with marinated chicken, fried golden cashews, sultanas & boiled egg.",
      price: 320,
      categoryId: catMains.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "NON_VEG",
      prepTimeMinutes: 15,
      imageUrl: "",
    },
    {
      name: "Thalassery Mutton Biryani",
      description: "Authentic North Malabar baby goat biryani layered with aromatic ghee rice, fresh mint, and spiced date pickle.",
      price: 420,
      categoryId: catMains.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "NON_VEG",
      prepTimeMinutes: 18,
      imageUrl: "",
    },
    {
      name: "Kerala Meen Curry (Kudampuli Fish Curry)",
      description: "Fresh Seer fish simmered in an earthen pot with Malabar kokum (kudampuli), shallots, curry leaves, and spicy red gravy.",
      price: 360,
      categoryId: catMains.id,
      spiceLevel: "SPICY",
      dietaryTag: "NON_VEG",
      prepTimeMinutes: 20,
      imageUrl: "",
    },
    {
      name: "Kerala Beef Roast (Ularthiyathu)",
      description: "Slow-roasted beef chunks tossed in crushed Tellicherry black pepper, toasted coconut slivers (thenga kothu), and curry leaves.",
      price: 320,
      categoryId: catMains.id,
      spiceLevel: "SPICY",
      dietaryTag: "NON_VEG",
      prepTimeMinutes: 15,
      imageUrl: "",
    },
    {
      name: "Alleppey Fish Moilee",
      description: "Delicate kingfish fillets poached gently in rich velvety coconut milk with green chillies, ginger, and turmeric.",
      price: 380,
      categoryId: catMains.id,
      spiceLevel: "MILD",
      dietaryTag: "NON_VEG",
      prepTimeMinutes: 18,
      imageUrl: "",
    },
    {
      name: "Delhi Style Butter Chicken",
      description: "Tandoori chicken tikka simmered in a velvety, buttery tomato gravy scented with dried fenugreek (kasuri methi).",
      price: 340,
      categoryId: catMains.id,
      spiceLevel: "MILD",
      dietaryTag: "NON_VEG",
      prepTimeMinutes: 15,
      imageUrl: "",
    },
    {
      name: "Paneer Butter Masala",
      description: "Cubes of fresh malai cottage cheese simmered in a creamy, mild tomato-cashew satin gravy with gentle spices.",
      price: 290,
      categoryId: catMains.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 14,
      imageUrl: "",
    },
    {
      name: "Dal Makhani",
      description: "Whole black lentils and kidney beans slow-cooked overnight on charcoal embers with butter, fresh cream, and aromatics.",
      price: 260,
      categoryId: catMains.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 10,
      imageUrl: "",
    },

    // Meals & Vegetarian (Sadya)
    {
      name: "Traditional Kerala Sadya Feast",
      description: "Grand banquet meal served with red matta rice, parippu, sambar, rasam, avial, thoran, olan, pachadi, inji puli & pappadam.",
      price: 280,
      categoryId: catSadya.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "VEG",
      prepTimeMinutes: 10,
      imageUrl: "",
    },
    {
      name: "Heritage Kerala Avial",
      description: "Thick melange of indigenous vegetables, drumstick, raw banana & elephant foot yam in ground coconut, curd, and fresh coconut oil.",
      price: 180,
      categoryId: catSadya.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 12,
      imageUrl: "",
    },
    {
      name: "Beans & Carrot Thoran",
      description: "Finely chopped fresh French beans and sweet carrots stir-fried with freshly grated coconut, black mustard seeds & curry leaves.",
      price: 150,
      categoryId: catSadya.id,
      spiceLevel: "MILD",
      dietaryTag: "VEGAN",
      prepTimeMinutes: 10,
      imageUrl: "",
    },
    {
      name: "Travancore Sambar & Pepper Rasam Set",
      description: "Steaming aromatic set of roasted coriander-spiced lentil sambar accompanied by tangy black pepper tamarind rasam.",
      price: 140,
      categoryId: catSadya.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "VEGAN",
      prepTimeMinutes: 8,
      imageUrl: "",
    },

    // Starters & Snacks
    {
      name: "Kerala Banana Fritters (Pazham Pori)",
      description: "Ripe Nendran bananas dipped in spiced all-purpose batter and deep-fried till golden crisp. A classic tea-stall staple.",
      price: 80,
      categoryId: catStarters.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 8,
      imageUrl: "",
    },
    {
      name: "Crispy Parippu Vada (Dal Fritters)",
      description: "Coarsely ground crunchy Bengal gram fritters seasoned with shallots, fiery green chillies, fresh ginger, and curry leaves.",
      price: 70,
      categoryId: catStarters.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "VEGAN",
      prepTimeMinutes: 8,
      imageUrl: "",
    },
    {
      name: "Malabar Chicken 65",
      description: "Spicy, crispy deep-fried chicken morsels marinated in Kashmiri chilli, ginger-garlic paste, and tempered with crisp curry leaves.",
      price: 240,
      categoryId: catStarters.id,
      spiceLevel: "SPICY",
      dietaryTag: "NON_VEG",
      prepTimeMinutes: 12,
      imageUrl: "",
    },
    {
      name: "Classic Punjabi Samosas (Set of 2)",
      description: "Handcrafted flaky pastry cones stuffed with spiced potatoes, green peas, and toasted cumin. Served with mint chutney.",
      price: 90,
      categoryId: catStarters.id,
      spiceLevel: "MEDIUM",
      dietaryTag: "VEG",
      prepTimeMinutes: 10,
      imageUrl: "",
    },

    // Desserts & Beverages
    {
      name: "Palada Pradhaman Payasam",
      description: "Royal dessert crafted from delicate steamed rice flakes simmered for hours in reduced thickened milk and cardamom.",
      price: 140,
      categoryId: catBeverages.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 5,
      imageUrl: "",
    },
    {
      name: "Malabar Sulaimani Chai",
      description: "Golden brewed black tea infused with cracked cardamom, cinnamon, fresh mint, and a squeeze of fresh lime.",
      price: 40,
      categoryId: catBeverages.id,
      spiceLevel: "MILD",
      dietaryTag: "VEGAN",
      prepTimeMinutes: 5,
      imageUrl: "",
    },
    {
      name: "South Indian Filter Coffee",
      description: "Traditional chicory blend freshly decocted in a brass filter, frothered with hot foaming milk in a traditional dabarah set.",
      price: 60,
      categoryId: catBeverages.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 5,
      imageUrl: "",
    },
    {
      name: "Alphonso Mango Lassi",
      description: "Creamy churned yogurt smoothie blended with sweet Ratnagiri Alphonso mango pulp and garnished with crushed pistachios.",
      price: 110,
      categoryId: catBeverages.id,
      spiceLevel: "MILD",
      dietaryTag: "VEG",
      prepTimeMinutes: 5,
      imageUrl: "",
    },
  ];

  for (const item of dishes) {
    await prisma.menuItem.create({ data: item });
  }

  // 4. Seed 14 Restaurant Tables
  for (let i = 1; i <= 12; i++) {
    await prisma.table.create({
      data: {
        number: i,
        name: `Table ${i}`,
        capacity: i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
        status: i === 3 || i === 5 ? "OCCUPIED" : i === 8 ? "BILLING" : "AVAILABLE",
      },
    });
  }

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

  console.log("✅ Seed completed successfully!");
  return {
    success: true,
    message: "Successfully seeded 5 categories, 24 Kerala dishes, and 14 tables!",
  };
}
