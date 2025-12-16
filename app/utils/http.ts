export async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Invalid JSON response: ${(error as Error).message}`);
  }
}
