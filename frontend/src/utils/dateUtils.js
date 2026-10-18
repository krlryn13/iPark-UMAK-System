/**
 * @param {string | Date | number | null | undefined} rawDate
 * @returns {Date | null}
 */
export const parseDateSafely = (rawDate) => {
  if (!rawDate) return null;
  if (rawDate instanceof Date) {
    return isNaN(rawDate.getTime()) ? null : rawDate;
  }

  if (typeof rawDate === 'string') {
    const s = rawDate.trim();
    if (!s) return null;


    const matchYMD = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchYMD) {
      const year = parseInt(matchYMD[1], 10);
      const month = parseInt(matchYMD[2], 10) - 1;
      const day = parseInt(matchYMD[3], 10);
      const localDate = new Date(year, month, day);
      return isNaN(localDate.getTime()) ? null : localDate;
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }

  const fallback = new Date(rawDate);
  return isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * @param {string | Date | number | null | undefined} rawDate
 * @returns {string}
 */
export const formatDateClean = (rawDate) => {
  const d = parseDateSafely(rawDate);
  if (!d) return rawDate ? String(rawDate) : '';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${daysOfWeek[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/**
 * @param {string | Date | number | null | undefined} rawDate
 * @returns {string}
 */
export const formatDateShort = (rawDate) => {
  const d = parseDateSafely(rawDate);
  if (!d) return rawDate ? String(rawDate) : '';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/**
 * @param {Date | string} date
 * @returns {string}
 */
export const formatDateInput = (date) => {
  const d = date instanceof Date ? date : parseDateSafely(date);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
