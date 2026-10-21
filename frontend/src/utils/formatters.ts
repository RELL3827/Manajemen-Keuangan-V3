/**
 * Format number to Indonesian Rupiah (IDR)
 * Example: 2500000 -> "Rp 2.500.000"
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  const val = Math.round(Number(amount));
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * Format compact Indonesian Rupiah (e.g. 2.5 Jt, 500 Rb)
 */
export function formatCompactRupiah(amount: number | string | null | undefined): string {
  if (!amount || isNaN(Number(amount))) return 'Rp 0';
  const val = Number(amount);
  if (Math.abs(val) >= 1_000_000_000) {
    return `Rp ${(val / 1_000_000_000).toFixed(1)} M`;
  }
  if (Math.abs(val) >= 1_000_000) {
    return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
  }
  if (Math.abs(val) >= 1_000) {
    return `Rp ${(val / 1_000).toFixed(0)} Rb`;
  }
  return formatRupiah(val);
}

/**
 * Format standard Indonesian date
 * Example: "2026-10-21" -> "21 Okt 2026"
 */
export function formatDate(dateString: string | null | undefined, includeTime = false): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Format relative time in Indonesian (Hari ini, Kemarin, x hari lalu)
 */
export function formatRelativeDate(dateString: string): string {
  if (!dateString) return '-';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Besok';
  if (diffDays === -1) return 'Kemarin';
  if (diffDays > 1) return `${diffDays} hari lagi`;
  return `${Math.abs(diffDays)} hari lalu`;
}
