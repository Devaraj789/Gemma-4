import { loadJSON, saveJSON } from "@/lib/storage";

const STORAGE_KEY = "@gemma/favourite_prompts";
const MAX_FAVOURITES = 30;

export type FavouritePrompt = {
  id: string;
  text: string;
  createdAt: number;
};

export async function getFavourites(): Promise<FavouritePrompt[]> {
  return loadJSON<FavouritePrompt[]>(STORAGE_KEY, []);
}

export async function addFavourite(text: string): Promise<FavouritePrompt[]> {
  const current = await getFavourites();
  const trimmed = text.trim();
  if (!trimmed) return current;
  if (current.some((f) => f.text === trimmed)) return current;
  const entry: FavouritePrompt = { id: String(Date.now()), text: trimmed, createdAt: Date.now() };
  const next = [entry, ...current].slice(0, MAX_FAVOURITES);
  await saveJSON(STORAGE_KEY, next);
  return next;
}

export async function removeFavourite(id: string): Promise<FavouritePrompt[]> {
  const current = await getFavourites();
  const next = current.filter((f) => f.id !== id);
  await saveJSON(STORAGE_KEY, next);
  return next;
}

export async function clearFavourites(): Promise<void> {
  await saveJSON(STORAGE_KEY, []);
}
