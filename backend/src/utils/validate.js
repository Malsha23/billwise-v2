const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (v) => typeof v === 'string' && EMAIL.test(v.trim());
export const isText = (v, min = 1, max = 100) =>
  typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;