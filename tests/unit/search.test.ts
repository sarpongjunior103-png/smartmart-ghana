import { spellCorrect } from '@/lib/search/spell-correct';

describe('spellCorrect', () => {
  // Single word corrections
  it('corrects "fone" to "phone"', () => {
    expect(spellCorrect('fone')).toBe('phone');
  });

  it('corrects "laptob" to "laptop"', () => {
    expect(spellCorrect('laptob')).toBe('laptop');
  });

  it('corrects "shose" to "shoes"', () => {
    expect(spellCorrect('shose')).toBe('shoes');
  });

  it('corrects "shrit" to "shirt"', () => {
    expect(spellCorrect('shrit')).toBe('shirt');
  });

  it('corrects "headphons" to "headphones"', () => {
    expect(spellCorrect('headphons')).toBe('headphones');
  });

  // Multiple words
  it('corrects multiple words in a phrase', () => {
    expect(spellCorrect('fone laptob')).toBe('phone laptop');
  });

  it('corrects mixed correct and misspelled words', () => {
    expect(spellCorrect('red fone case')).toBe('red phone case');
  });

  it('corrects a longer phrase with multiple errors', () => {
    expect(spellCorrect('blue laptob bag')).toBe('blue laptop bag');
  });

  // Case insensitivity
  it('handles uppercase input', () => {
    expect(spellCorrect('FONE')).toBe('phone');
  });

  it('handles mixed case input', () => {
    expect(spellCorrect('LaPtOb')).toBe('laptop');
  });

  it('handles all-caps phrase', () => {
    expect(spellCorrect('FONE LAPTOB')).toBe('phone laptop');
  });

  it('preserves case for correct words', () => {
    expect(spellCorrect('PHONE')).toBe('phone');
  });

  // Empty input
  it('returns empty string for empty input', () => {
    expect(spellCorrect('')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(spellCorrect('   ')).toBe('');
  });

  it('returns empty string for null input', () => {
    expect(spellCorrect(null as unknown as string)).toBe('');
  });

  it('returns empty string for undefined input', () => {
    expect(spellCorrect(undefined as unknown as string)).toBe('');
  });

  // Correct words unchanged
  it('leaves correct words unchanged', () => {
    expect(spellCorrect('phone')).toBe('phone');
  });

  it('leaves correct multi-word phrases unchanged', () => {
    expect(spellCorrect('laptop case')).toBe('laptop case');
  });

  it('leaves unknown words unchanged', () => {
    expect(spellCorrect('xyzabc')).toBe('xyzabc');
  });

  it('leaves a correct longer phrase unchanged', () => {
    expect(spellCorrect('wireless bluetooth headphones')).toBe('wireless bluetooth headphones');
  });

  // Edge cases
  it('trims leading and trailing whitespace', () => {
    expect(spellCorrect('  fone  ')).toBe('phone');
  });

  it('handles single character input', () => {
    expect(spellCorrect('a')).toBe('a');
  });

  it('handles numbers in input', () => {
    expect(spellCorrect('iphone 14')).toBe('iphone 14');
  });
});
