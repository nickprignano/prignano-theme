// Seeded random numbers, from prignano.ai's original card art: a string seed
// always gives the same sequence.

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Helpers styles use when picking parameters.
export const between = (rand, lo, hi) => lo + rand() * (hi - lo);
export const intBetween = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
export const choose = (rand, list) => list[Math.floor(rand() * list.length)];
export const gcd = (a, b) => (b ? gcd(b, a % b) : a);
