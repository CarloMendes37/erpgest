export const fmt = {
  currency: (v: number | string, currency = 'EUR') =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(Number(v)),

  number: (v: number | string, decimals = 2) =>
    new Intl.NumberFormat('pt-PT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(v)),

  date: (v: string | Date | undefined | null) => {
    if (!v) return '—';
    return new Intl.DateTimeFormat('pt-PT').format(new Date(v));
  },

  dateTime: (v: string | Date | undefined | null) => {
    if (!v) return '—';
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(v));
  },

  initials: (name: string) =>
    name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase(),
};
