export const compareValues = (a: any, b: any, direction: 'asc' | 'desc' = 'asc'): number => {
  if (a === null || a === undefined) a = '';
  if (b === null || b === undefined) b = '';

  // Try to parse as numbers first (only if the entire string is a number)
  const numA = Number(a);
  const numB = Number(b);
  if (!isNaN(numA) && !isNaN(numB) && a !== '' && b !== '' && typeof a !== 'boolean' && typeof b !== 'boolean') {
    return direction === 'asc' ? numA - numB : numB - numA;
  }

  // Check if they are dates (only if they are not just numbers)
  const dateA = new Date(a);
  const dateB = new Date(b);
  if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime()) && isNaN(Number(a)) && isNaN(Number(b)) && (typeof a === 'string' || a instanceof Date) && (typeof b === 'string' || b instanceof Date)) {
    const timeA = dateA.getTime();
    const timeB = dateB.getTime();
    return direction === 'asc' ? timeA - timeB : timeB - timeA;
  }

  // String check (with Turkish locale)
  const strA = String(a).toLocaleLowerCase('tr');
  const strB = String(b).toLocaleLowerCase('tr');
  const comparison = strA.localeCompare(strB, 'tr');
  return direction === 'asc' ? comparison : -comparison;
};
