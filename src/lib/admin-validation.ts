import { z } from "zod";

export const productInputSchema = z.object({
  sku: z.string().trim().min(1).max(50).transform((sku) => sku.toUpperCase()),
  name: z.string().trim().min(1).max(200),
  brand: z.string().trim().min(1).max(100),
  price: z.number().int().positive().max(9_999_999_999),
  stock: z.number().int().min(0).max(1_000_000),
  description: z.string().trim().min(1).max(10_000),
  specs: z.record(z.string(), z.json()),
  imageUrl: z.string().trim().max(500).refine((path) => path.startsWith("/") && !path.startsWith("//")),
  categoryId: z.string().min(1),
  isActive: z.boolean(),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export function productSlug(name: string, sku: string) {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${normalized}-${sku.toLowerCase().replace(/[^a-z0-9-]+/g, "-")}`;
}
