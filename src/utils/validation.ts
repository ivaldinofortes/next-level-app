export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isValidPhone = (phone: string) => /^\d+$/.test(phone.replace(/[\s\-()+]/g, ''));
