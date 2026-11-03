import { supabase } from '@/integrations/supabase/client';

export interface NextMemberIdOptions {
  prefix?: string; // Default: 'SB-'
  padLength?: number; // Default: 3 (e.g. 001, 002, 003...)
}

/**
 * Parses any member_id string and returns its numerical sequence value if valid.
 * Handles:
 * - 'SB-001' -> 1
 * - 'SB-0001' -> 1
 * - 'SB-02' -> 2
 * - '001' -> 1
 * - 'SB-2026-2719' -> 1 (treated as legacy 1st member)
 */
export function parseMemberSequence(memberId: string | null | undefined): number {
  if (!memberId) return 0;
  const clean = memberId.trim().toUpperCase();

  // If it's the old legacy format 'SB-YYYY-XXXX', treat as 1st member
  if (/^SB-\d{4}-\d+$/.test(clean)) {
    return 1;
  }

  // If it starts with 'SB-'
  if (clean.startsWith('SB-')) {
    const numPart = clean.replace(/^SB-/, '').trim();
    const parsed = parseInt(numPart, 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : 0;
  }

  // Pure digits (e.g., '001', '01', '1')
  const parsed = parseInt(clean, 10);
  return !isNaN(parsed) && parsed > 0 ? parsed : 0;
}

/**
 * Format a number into standard Member ID format.
 * E.g. 1 -> 'SB-001', 2 -> 'SB-002', 25 -> 'SB-025'
 */
export function formatMemberId(num: number, padLength = 3, prefix = 'SB-'): string {
  const safeNum = Math.max(1, Math.floor(num));
  return `${prefix}${String(safeNum).padStart(padLength, '0')}`;
}

/**
 * Generates candidate member ID strings from user input for flexible search/lookup.
 * e.g. input '1' or '001' or 'sb-001' -> ['SB-001', 'SB-01', 'SB-1', '001', '01', '1', 'SB-2026-2719']
 */
export function getCandidateMemberIds(rawInput: string): string[] {
  if (!rawInput) return [];
  const input = rawInput.trim();
  const upper = input.toUpperCase();
  const digitsOnly = input.replace(/\D/g, '');

  const set = new Set<string>();
  set.add(input);
  set.add(upper);

  if (upper.startsWith('SB-')) {
    set.add(upper);
  } else {
    set.add(`SB-${upper}`);
  }

  if (digitsOnly) {
    const num = parseInt(digitsOnly, 10);
    if (!isNaN(num) && num > 0) {
      set.add(formatMemberId(num, 3, 'SB-'));
      set.add(formatMemberId(num, 4, 'SB-'));
      set.add(formatMemberId(num, 2, 'SB-'));
      set.add(`SB-${num}`);
      set.add(String(num).padStart(3, '0'));
      set.add(String(num).padStart(4, '0'));
      set.add(String(num));

      // Legacy special case: If looking for 1, also include legacy 1st member ID
      if (num === 1) {
        set.add('SB-2026-2719');
      }
    }
  }

  return Array.from(set);
}

/**
 * Computes next member ID from an existing list of member objects or ID strings.
 */
export function computeNextMemberId(
  existingIds: (string | null | undefined)[],
  options: NextMemberIdOptions = {}
): string {
  const { prefix = 'SB-', padLength = 3 } = options;
  if (!existingIds || existingIds.length === 0) {
    return `${prefix}${String(1).padStart(padLength, '0')}`;
  }

  let maxSerial = 0;
  for (const id of existingIds) {
    const serial = parseMemberSequence(id);
    if (serial > maxSerial) {
      maxSerial = serial;
    }
  }

  const nextSerial = maxSerial + 1;
  return `${prefix}${String(nextSerial).padStart(padLength, '0')}`;
}

/**
 * Fetches all existing members from Supabase, finds the highest sequential ID,
 * and generates the next consecutive ID maintaining the sequence.
 *
 * Example sequence:
 * - 1st member: 'SB-001'
 * - 2nd member: 'SB-002'
 * - 3rd member: 'SB-003'
 * ...
 * - 10th member: 'SB-010'
 * ...
 * - 100th member: 'SB-100'
 */
export async function generateNextMemberId(
  options: NextMemberIdOptions = {}
): Promise<string> {
  const { prefix = 'SB-', padLength = 3 } = options;

  try {
    const { data, error } = await supabase
      .from('members')
      .select('member_id');

    if (error) {
      console.warn('Error fetching members to determine next ID:', error);
      return `${prefix}${String(1).padStart(padLength, '0')}`;
    }

    if (!data || data.length === 0) {
      return `${prefix}${String(1).padStart(padLength, '0')}`;
    }

    const ids = data.map((m) => m.member_id);
    return computeNextMemberId(ids, { prefix, padLength });
  } catch (err) {
    console.error('Failed to compute next member ID:', err);
    return `${prefix}${String(1).padStart(padLength, '0')}`;
  }
}
