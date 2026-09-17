import Papa from 'papaparse';
import { z } from 'zod';
import { Dish, MealSlot } from '../../domain/models';

const MealSlotEnum = z.enum(['breakfast', 'lunch', 'dinner']);

const RawRowSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(80),
  search_query: z.string().min(1),
  meal_slots: z.string().transform((s) =>
    s.split('|').map((v) => v.trim()).filter(Boolean)
  ).pipe(z.array(MealSlotEnum).min(1)),
  category: z.string().optional().default(''),
  description: z.string().max(240).optional().default(''),
  image_url: z.string().url().optional().or(z.literal('')).default(''),
  tags: z.string().optional().transform((s) => (s || '').split('|').map((v) => v.trim()).filter(Boolean)),
  weight: z.coerce.number().int().min(1).max(1000).optional().default(100),
  active: z.string().transform((s) => s.toLowerCase() === 'true'),
  min_rating: z.coerce.number().min(0).max(5).optional(),
  min_reviews: z.coerce.number().int().min(0).optional(),
});

export interface ParseResult {
  dishes: Dish[];
  errors: string[];
}

export function parseCsv(csvText: string): ParseResult {
  const { data, errors: parseErrors } = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true, skipEmptyLines: true,
  });
  if (parseErrors.length > 0) {
    return { dishes: [], errors: parseErrors.map((e) => `CSV parse error: ${e.message}`) };
  }
  const dishes: Dish[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();

  data.forEach((row, idx) => {
    const lineNum = idx + 2;
    const result = RawRowSchema.safeParse(row);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        errors.push(`Dòng ${lineNum}: ${issue.path.join('.')} — ${issue.message}`);
      });
      return;
    }
    const r = result.data;
    if (seenIds.has(r.id)) { errors.push(`Dòng ${lineNum}: ID trùng "${r.id}"`); return; }
    seenIds.add(r.id);
    dishes.push({
      id: r.id, name: r.name, searchQuery: r.search_query,
      mealSlots: r.meal_slots as MealSlot[],
      category: r.category || undefined, description: r.description || undefined,
      imageUrl: r.image_url || undefined, tags: r.tags, weight: r.weight,
      active: r.active, minRating: r.min_rating, minReviews: r.min_reviews,
    });
  });

  const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner'];
  for (const slot of slots) {
    if (!dishes.some((d) => d.active && d.mealSlots.includes(slot))) {
      errors.push(`Banner "${slot}" không có món nào active. Catalog bị từ chối.`);
    }
  }
  return { dishes, errors };
}

export async function fetchCatalog(url: string): Promise<ParseResult> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const text = await resp.text();
  return parseCsv(text);
}
