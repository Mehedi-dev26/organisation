import { supabase } from '@/integrations/supabase/client';

export interface NextMemberIdOptions {
  prefix?: string; // Default: 'SB-'
  year?: string;   // Default: 2-digit current year, e.g. '26'
  padLength?: number; // Minimum digits for serial (default: 2, e.g. 01, 02, 10)
}

/**
 * Returns the current 2-digit year (e.g. 2026 -> '26', 2027 -> '27').
 */
export function getCurrentMemberYear(): string {
  try {
    return String(new Date().getFullYear()).slice(-2);
  } catch {
    return '26';
  }
}

/**
 * Parses any member_id string and returns its numerical sequence value for the given year.
 * Handles:
 * - 'SB-2601' -> 1 (for year '26')
 * - 'SB-2610' -> 10 (for year '26')
 * - '2601' -> 1
 * - 'SB2601' -> 1
 * - 'SB/2601' -> 1
 * - 'SB-001' -> 1 (legacy 1st member, attributed to launch year '26')
 * - 'SB-2026-2719' -> 1 (legacy 1st member)
 */
export function parseMemberSequence(
  memberId: string | null | undefined,
  targetYear: string = getCurrentMemberYear()
): number {
  if (!memberId) return 0;
  const clean = memberId.trim().toUpperCase().replace(/[\s/]/g, '-');

  // Legacy special cases: treat as 1st member if targeting launch year '26'
  if (/^SB-\d{4}-\d+$/.test(clean)) {
    return targetYear === '26' ? 1 : 0;
  }

  // Pattern 1: SB-YYSS... or YYSS... (e.g. SB-2601, SB2601, 2601, 2610)
  const yearMatch = clean.match(/^(?:SB-?)?(\d{2})(\d{2,})$/i);
  if (yearMatch) {
    const yr = yearMatch[1];
    const seq = parseInt(yearMatch[2], 10);
    if (yr === targetYear && !isNaN(seq) && seq > 0) {
      return seq;
    }
    // If it has a different 2-digit year prefix (e.g. 26 vs 27), it does not belong to targetYear
    return 0;
  }

  // Pattern 2: Legacy SB-001, SB-01, SB-1 (applicable to launch year '26')
  if (clean.startsWith('SB-')) {
    const numPart = clean.replace(/^SB-/, '').trim();
    const parsed = parseInt(numPart, 10);
    if (targetYear === '26' && !isNaN(parsed) && parsed > 0 && parsed < 2000) {
      return parsed;
    }
    return 0;
  }

  // Pattern 3: Pure digits < 1000 (legacy 1, 01, 001)
  const parsed = parseInt(clean, 10);
  if (targetYear === '26' && !isNaN(parsed) && parsed > 0 && parsed < 1000) {
    return parsed;
  }

  return 0;
}

/**
 * Format a serial number into standard Member ID format with year.
 * E.g.
 * - 1 -> 'SB-2601'
 * - 2 -> 'SB-2602'
 * - 10 -> 'SB-2610'
 * - 100 -> 'SB-26100'
 */
export function formatMemberId(
  num: number,
  padLength = 2,
  prefix = 'SB-',
  year = getCurrentMemberYear()
): string {
  const safeNum = Math.max(1, Math.floor(num));
  const serialStr = safeNum < 100 ? String(safeNum).padStart(padLength, '0') : String(safeNum);
  return `${prefix}${year}${serialStr}`;
}

/**
 * Generates candidate member ID strings from user input for flexible search/lookup/login.
 * E.g.:
 * - '2601' -> ['2601', 'SB-2601', 'SB2601', 'SB-001', 'SB-01', '1']
 * - 'SB-2601' -> ['SB-2601', '2601', 'SB2601', 'SB-001', '1']
 * - '1' or '01' -> ['1', '01', '2601', 'SB-2601', 'SB-001', '001', 'SB-2026-2719']
 */
export function getCandidateMemberIds(rawInput: string): string[] {
  if (!rawInput) return [];
  const input = rawInput.trim();
  const upper = input.toUpperCase();
  const clean = upper.replace(/[\s/]/g, '-').replace(/-+/g, '-');
  const digitsOnly = input.replace(/\D/g, '');

  const set = new Set<string>();
  set.add(input);
  set.add(upper);
  set.add(clean);

  // If input has prefix like SB- or SB/ or SB
  const strippedSb = upper.replace(/^SB[-/ ]?/, '');
  if (strippedSb) {
    set.add(strippedSb);
    set.add(`SB-${strippedSb}`);
    set.add(`SB${strippedSb}`);
  }

  const currentYear2 = getCurrentMemberYear();

  if (digitsOnly) {
    set.add(digitsOnly);
    set.add(`SB-${digitsOnly}`);
    set.add(`SB${digitsOnly}`);

    // If it's a 4+ digit number starting with year digits (e.g. "2601", "2610")
    if (digitsOnly.length >= 4 && digitsOnly.startsWith(currentYear2)) {
      const serialPart = parseInt(digitsOnly.slice(2), 10);
      if (!isNaN(serialPart)) {
        set.add(`SB-${String(serialPart).padStart(3, '0')}`);
        set.add(`SB-${String(serialPart).padStart(2, '0')}`);
        set.add(String(serialPart));
      }
    } else {
      // It's a short serial like "1" or "01" or "10"
      const num = parseInt(digitsOnly, 10);
      if (!isNaN(num) && num > 0 && num < 1000) {
        const yearFormatted = `${currentYear2}${String(num).padStart(2, '0')}`;
        set.add(yearFormatted);
        set.add(`SB-${yearFormatted}`);
        set.add(`SB${yearFormatted}`);

        set.add(`SB-${String(num).padStart(3, '0')}`);
        set.add(`SB-${String(num).padStart(2, '0')}`);
        set.add(`SB-${num}`);
        set.add(String(num).padStart(3, '0'));
        set.add(String(num).padStart(2, '0'));
        set.add(String(num));

        if (num === 1) {
          set.add('SB-2026-2719');
          set.add('SB-001');
        }
      }
    }
  }

  return Array.from(set);
}

/**
 * Computes next sequential member ID from an existing list of member objects or ID strings.
 * Example for 2026:
 * - 1st member: 'SB-2601'
 * - 2nd member: 'SB-2602'
 * - 10th member: 'SB-2610'
 */
export function computeNextMemberId(
  existingIds: (string | null | undefined)[],
  options: NextMemberIdOptions = {}
): string {
  const { prefix = 'SB-', year = getCurrentMemberYear(), padLength = 2 } = options;
  if (!existingIds || existingIds.length === 0) {
    return `${prefix}${year}${String(1).padStart(padLength, '0')}`;
  }

  let maxSerial = 0;
  for (const id of existingIds) {
    const serial = parseMemberSequence(id, year);
    if (serial > maxSerial) {
      maxSerial = serial;
    }
  }

  const nextSerial = maxSerial + 1;
  const serialStr = nextSerial < 100 ? String(nextSerial).padStart(padLength, '0') : String(nextSerial);
  return `${prefix}${year}${serialStr}`;
}

/**
 * Fetches all existing members from Supabase, finds the highest sequential ID for the year,
 * and generates the next consecutive ID maintaining the sequence.
 *
 * Example sequence:
 * - 1st member: 'SB-2601'
 * - 2nd member: 'SB-2602'
 * ...
 * - 10th member: 'SB-2610'
 * ...
 * - 100th member: 'SB-26100'
 */
export async function generateNextMemberId(
  options: NextMemberIdOptions = {}
): Promise<string> {
  const { prefix = 'SB-', year = getCurrentMemberYear(), padLength = 2 } = options;

  try {
    const { data, error } = await supabase
      .from('members')
      .select('member_id');

    if (error) {
      console.warn('Error fetching members to determine next ID:', error);
      return `${prefix}${year}${String(1).padStart(padLength, '0')}`;
    }

    if (!data || data.length === 0) {
      return `${prefix}${year}${String(1).padStart(padLength, '0')}`;
    }

    const ids = data.map((m) => m.member_id);
    return computeNextMemberId(ids, { prefix, year, padLength });
  } catch (err) {
    console.error('Failed to compute next member ID:', err);
    return `${prefix}${year}${String(1).padStart(padLength, '0')}`;
  }
}
