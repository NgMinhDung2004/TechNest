import { Prisma, PrismaClient } from "@prisma/client";
import productImagePaths from "../src/data/product-image-paths.json";
import { writeProductImageAssets } from "../src/lib/product-image-assets";

const prisma = new PrismaClient();

const categories = [
  { name: "Laptop", slug: "laptop" },
  { name: "Linh kiện máy tính", slug: "linh-kien" },
  { name: "Phụ kiện", slug: "phu-kien" },
  { name: "Màn hình", slug: "man-hinh" },
  { name: "Thiết bị mạng", slug: "thiet-bi-mang" },
] as const;

type LaptopSpec = readonly [
  name: string,
  brand: string,
  price: number,
  cpu: string,
  ram: string,
  storage: string,
  graphics: string,
];

const laptops: LaptopSpec[] = [
  ["Aspire 5 A515-58M", "Acer", 15990000, "Intel Core i5-1335U", "16GB", "512GB SSD", "Intel Iris Xe"],
  ["Aspire 7 A715-76G", "Acer", 18990000, "Intel Core i5-12450H", "16GB", "512GB SSD", "RTX 2050 4GB"],
  ["Nitro V 15 ANV15", "Acer", 22990000, "Intel Core i5-13420H", "16GB", "512GB SSD", "RTX 4050 6GB"],
  ["IdeaPad Slim 3 15IRH8", "Lenovo", 14990000, "Intel Core i5-13420H", "16GB", "512GB SSD", "Intel UHD"],
  ["IdeaPad Slim 5 14IMH9", "Lenovo", 21990000, "Intel Core Ultra 5 125H", "16GB", "512GB SSD", "Intel Arc"],
  ["LOQ 15IAX9", "Lenovo", 23990000, "Intel Core i5-12450HX", "16GB", "512GB SSD", "RTX 3050 6GB"],
  ["LOQ 15IRX9", "Lenovo", 27990000, "Intel Core i7-13650HX", "16GB", "512GB SSD", "RTX 4050 6GB"],
  ["VivoBook 15 X1504VA", "ASUS", 13990000, "Intel Core i5-1335U", "16GB", "512GB SSD", "Intel Iris Xe"],
  ["Vivobook S 14 OLED M5406", "ASUS", 24990000, "AMD Ryzen 7 8845HS", "16GB", "1TB SSD", "Radeon 780M"],
  ["TUF Gaming A15 FA507", "ASUS", 26990000, "AMD Ryzen 7 7735HS", "16GB", "512GB SSD", "RTX 4050 6GB"],
  ["TUF Gaming F15 FX507", "ASUS", 28990000, "Intel Core i7-13620H", "16GB", "512GB SSD", "RTX 4050 6GB"],
  ["Modern 14 C13M", "MSI", 15990000, "Intel Core i5-1335U", "16GB", "512GB SSD", "Intel Iris Xe"],
  ["Thin 15 B13UC", "MSI", 19990000, "Intel Core i5-13420H", "16GB", "512GB SSD", "RTX 3050 4GB"],
  ["Katana 15 B13V", "MSI", 30990000, "Intel Core i7-13620H", "16GB", "1TB SSD", "RTX 4060 8GB"],
  ["Pavilion 15-eg", "HP", 16990000, "Intel Core i5-1335U", "16GB", "512GB SSD", "Intel Iris Xe"],
  ["Victus 15-fa", "HP", 22990000, "Intel Core i5-12450H", "16GB", "512GB SSD", "RTX 3050 6GB"],
  ["Inspiron 15 3530", "Dell", 17990000, "Intel Core i5-1334U", "16GB", "512GB SSD", "Intel Iris Xe"],
  ["Vostro 14 3430", "Dell", 18990000, "Intel Core i5-1335U", "16GB", "512GB SSD", "Intel Iris Xe"],
  ["MacBook Air 13 M2", "Apple", 24990000, "Apple M2", "8GB", "256GB SSD", "Apple GPU 8-core"],
  ["MacBook Air 13 M3", "Apple", 29990000, "Apple M3", "16GB", "256GB SSD", "Apple GPU 8-core"],
];

type SimpleProduct = readonly [
  sku: string,
  name: string,
  brand: string,
  price: number,
  stock: number,
  category: string,
  specs: Prisma.InputJsonObject,
];

const otherProducts: SimpleProduct[] = [
  ["CPU-001", "Core i5-14400F", "Intel", 4890000, 20, "linh-kien", { type: "CPU", socket: "LGA1700", cores: 10 }],
  ["CPU-002", "Core i7-14700K", "Intel", 10990000, 12, "linh-kien", { type: "CPU", socket: "LGA1700", cores: 20 }],
  ["CPU-003", "Ryzen 5 7600", "AMD", 4990000, 18, "linh-kien", { type: "CPU", socket: "AM5", cores: 6 }],
  ["CPU-004", "Ryzen 7 7800X3D", "AMD", 10990000, 8, "linh-kien", { type: "CPU", socket: "AM5", cores: 8 }],
  ["GPU-001", "GeForce RTX 4060 Ventus 2X 8G", "MSI", 8390000, 10, "linh-kien", { type: "GPU", memory: "8GB GDDR6" }],
  ["GPU-002", "GeForce RTX 4070 SUPER Dual 12GB", "ASUS", 16990000, 7, "linh-kien", { type: "GPU", memory: "12GB GDDR6X" }],
  ["RAM-001", "Vengeance LPX 16GB DDR4 3200", "Corsair", 890000, 30, "linh-kien", { type: "RAM", capacity: "16GB", speed: "3200MHz" }],
  ["RAM-002", "Fury Beast 32GB DDR5 5600", "Kingston", 2190000, 24, "linh-kien", { type: "RAM", capacity: "32GB", speed: "5600MHz" }],
  ["SSD-001", "980 1TB NVMe", "Samsung", 2190000, 26, "linh-kien", { type: "SSD", capacity: "1TB", interface: "NVMe PCIe 3.0" }],
  ["SSD-002", "SN850X 2TB NVMe", "Western Digital", 4290000, 14, "linh-kien", { type: "SSD", capacity: "2TB", interface: "NVMe PCIe 4.0" }],
  ["ACC-001", "MX Master 3S", "Logitech", 2490000, 20, "phu-kien", { type: "Mouse", connectivity: "Bluetooth, USB receiver" }],
  ["ACC-002", "G304 Lightspeed", "Logitech", 790000, 35, "phu-kien", { type: "Mouse", connectivity: "2.4GHz wireless" }],
  ["ACC-003", "DeathAdder Essential", "Razer", 490000, 28, "phu-kien", { type: "Mouse", connectivity: "USB wired" }],
  ["ACC-004", "K552 Kumara RGB", "Redragon", 890000, 18, "phu-kien", { type: "Keyboard", switches: "Red mechanical" }],
  ["ACC-005", "K8 Pro Wireless", "Keychron", 2490000, 10, "phu-kien", { type: "Keyboard", layout: "TKL, hot-swappable" }],
  ["ACC-006", "Cloud III", "HyperX", 2390000, 12, "phu-kien", { type: "Headset", connectivity: "USB, 3.5mm" }],
  ["ACC-007", "WH-CH720N", "Sony", 2390000, 11, "phu-kien", { type: "Headphones", features: "ANC, Bluetooth" }],
  ["ACC-008", "Essential 15.6-inch Backpack", "Targus", 690000, 16, "phu-kien", { type: "Backpack", laptopSize: "Up to 15.6 inch" }],
  ["ACC-009", "65W USB-C GaN Charger", "Anker", 990000, 22, "phu-kien", { type: "Charger", power: "65W", ports: 3 }],
  ["ACC-010", "USB-C 7-in-1 Hub", "Ugreen", 790000, 19, "phu-kien", { type: "Hub", ports: "HDMI, USB-A, USB-C, SD" }],
  ["MON-001", "UltraGear 24GN60R 24-inch", "LG", 3290000, 9, "man-hinh", { type: "Monitor", size: "24 inch", resolution: "1920x1080", refreshRate: "144Hz" }],
  ["MON-002", "TUF Gaming VG27AQ 27-inch", "ASUS", 6990000, 6, "man-hinh", { type: "Monitor", size: "27 inch", resolution: "2560x1440", refreshRate: "165Hz" }],
  ["MON-003", "Odyssey G5 27-inch", "Samsung", 6490000, 8, "man-hinh", { type: "Monitor", size: "27 inch", resolution: "2560x1440", refreshRate: "144Hz" }],
  ["MON-004", "ProArt PA278QV 27-inch", "ASUS", 7990000, 5, "man-hinh", { type: "Monitor", size: "27 inch", resolution: "2560x1440", color: "100% sRGB" }],
  ["MON-005", "24E1N1100A 24-inch", "Philips", 2190000, 12, "man-hinh", { type: "Monitor", size: "24 inch", resolution: "1920x1080", refreshRate: "100Hz" }],
  ["NET-001", "Archer AX55 Wi-Fi 6 Router", "TP-Link", 2190000, 14, "thiet-bi-mang", { type: "Router", standard: "Wi-Fi 6", speed: "AX3000" }],
  ["NET-002", "Deco X20 2-Pack Mesh Wi-Fi 6", "TP-Link", 3490000, 7, "thiet-bi-mang", { type: "Mesh Wi-Fi", standard: "Wi-Fi 6", coverage: "Up to 370 m2" }],
  ["NET-003", "RT-AX57 AX3000 Router", "ASUS", 2690000, 8, "thiet-bi-mang", { type: "Router", standard: "Wi-Fi 6", speed: "AX3000" }],
  ["NET-004", "GS308 8-Port Gigabit Switch", "Netgear", 690000, 16, "thiet-bi-mang", { type: "Switch", ports: 8, speed: "Gigabit" }],
  ["NET-005", "TX20U Plus AX1800 USB Adapter", "TP-Link", 690000, 13, "thiet-bi-mang", { type: "Wi-Fi Adapter", standard: "Wi-Fi 6", interface: "USB 3.0" }],
];

const imagePathsBySku: Record<string, string> = productImagePaths;

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
    categoryIds.set(category.slug, savedCategory.id);
  }

  const productRows = [
    ...laptops.map(([name, brand, price, cpu, ram, storage, graphics], index) => {
      const sku = `LAP-${String(index + 1).padStart(3, "0")}`;
      return {
        sku,
        name,
        brand,
        price,
        stock: 5 + (index % 16),
        category: "laptop",
        description: `${brand} ${name} phù hợp cho học tập, làm việc và giải trí. Cấu hình cân bằng, bảo hành chính hãng.`,
        specs: { cpu, ram, storage, graphics, display: "15.6-inch Full HD" } satisfies Prisma.InputJsonObject,
        isFeatured: index < 6,
      };
    }),
    ...otherProducts.map(([sku, name, brand, price, stock, category, specs]) => ({
      sku,
      name,
      brand,
      price,
      stock,
      category,
      description: `${name} chính hãng ${brand}, phù hợp để nâng cấp hoặc hoàn thiện bộ máy tính của bạn.`,
      specs,
      isFeatured: false,
    })),
  ];

  await writeProductImageAssets(
    productRows.map(({ sku, name, brand, category, specs }) => ({
      sku,
      name,
      brand,
      category,
      specs,
    })),
  );

  for (const product of productRows) {
    const { category, ...productData } = product;
    const categoryId = categoryIds.get(category);
    if (!categoryId) {
      throw new Error(`Unknown category "${category}" for product "${product.sku}"`);
    }
    const imagePath = imagePathsBySku[product.sku];
    if (!imagePath) {
      throw new Error(`Missing image path for product "${product.sku}"`);
    }

    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        ...productData,
        slug: toSlug(`${product.name}-${product.sku}`),
        imageUrl: imagePath,
        categoryId,
      },
      create: {
        ...productData,
        slug: toSlug(`${product.name}-${product.sku}`),
        imageUrl: imagePath,
        categoryId,
      },
    });
  }

  console.log(`Generated ${productRows.length} product images in public/products.`);
  console.log(`Seeded ${categories.length} categories and ${productRows.length} products.`);
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
