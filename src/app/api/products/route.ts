import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ParsedInteger = { value: number; error?: never } | { value?: never; error: string };

function parseIntegerParameter(
  searchParams: URLSearchParams,
  name: string,
  defaultValue: number,
  min: number,
  max: number,
): ParsedInteger {
  const rawValue = searchParams.get(name);
  if (rawValue === null) {
    return { value: defaultValue };
  }

  if (!/^\d+$/.test(rawValue)) {
    return { error: `${name} must be an integer between ${min} and ${max}.` };
  }

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    return { error: `${name} must be an integer between ${min} and ${max}.` };
  }

  return { value };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageResult = parseIntegerParameter(searchParams, "page", 1, 1, Number.MAX_SAFE_INTEGER);
  const limitResult = parseIntegerParameter(searchParams, "limit", 12, 1, 50);
  const q = searchParams.get("q")?.trim() || undefined;
  const category = searchParams.get("category")?.trim() || undefined;
  const errors: Record<string, string> = {};

  if (pageResult.error) errors.page = pageResult.error;
  if (limitResult.error) errors.limit = limitResult.error;
  if (q && q.length > 100) errors.q = "q must be 100 characters or fewer.";
  if (category && category.length > 100) {
    errors.category = "category must be 100 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Invalid query parameters.", details: errors }, { status: 400 });
  }

  const page = pageResult.value!;
  const limit = limitResult.value!;
  const where = {
    isActive: true,
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    ...(category ? { category: { slug: category } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: "asc" },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
}
