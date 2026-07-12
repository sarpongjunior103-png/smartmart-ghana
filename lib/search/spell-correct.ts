// Simple spell correction for common product search terms
export function spellCorrect(query: string): string {
  const corrections: Record<string, string> = {
    'fone': 'phone',
    'laptob': 'laptop',
    'shooes': 'shoes',
    'shose': 'shoes',
    'lapto': 'laptop',
    'phne': 'phone',
    'fashon': 'fashion',
    'electrnics': 'electronics',
    'groceris': 'groceries',
    'computr': 'computer',
    'wath': 'watch',
    'headphne': 'headphone',
    'camra': 'camera',
    'tablet': 'tablet',
  };

  const words = query.toLowerCase().split(/\s+/);
  const corrected = words.map((w) => corrections[w] ?? w);
  return corrected.join(' ');
}
