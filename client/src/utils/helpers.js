export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount || 0);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const daysUntil = (dateStr) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dateStr + 'T00:00:00');
  return Math.round((due - today) / 86400000);
};

export const CATEGORIES = [
  { value: 'software', label: 'Software & SaaS', icon: '💻', color: 'var(--primary)' },
  { value: 'tech', label: 'Tech & Hosting', icon: '🖥️', color: '#06b6d4' },
  { value: 'invoice', label: 'Client Invoice', icon: '📄', color: '#f59e0b' },
  { value: 'utility', label: 'Utilities', icon: '⚡', color: '#10b981' },
  { value: 'subscription', label: 'Subscription', icon: '🔄', color: '#ec4899' },
  { value: 'tax', label: 'Tax & Legal', icon: '📋', color: '#ef4444' },
  { value: 'marketing', label: 'Marketing', icon: '📢', color: '#f97316' },
  { value: 'other', label: 'Other', icon: '📦', color: '#64748b' },
];

export const RECURRENCES = [
  { value: 'one-time', label: 'One-Time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export const CURRENCIES = [
  { value: 'USD', label: 'USD – US Dollar' },
  { value: 'EUR', label: 'EUR – Euro' },
  { value: 'GBP', label: 'GBP – British Pound' },
  { value: 'INR', label: 'INR – Indian Rupee' },
  { value: 'CAD', label: 'CAD – Canadian Dollar' },
  { value: 'AUD', label: 'AUD – Australian Dollar' },
];

export const getCategoryMeta = (value) =>
  CATEGORIES.find(c => c.value === value) || CATEGORIES[CATEGORIES.length - 1];
