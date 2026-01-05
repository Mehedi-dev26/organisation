import * as XLSX from 'xlsx';
import { Database } from '@/integrations/supabase/types';

type TransactionType = Database['public']['Enums']['transaction_type'];

export interface ExcelTransaction {
  date: string;
  type: TransactionType;
  amount: number;
  description_bn: string | null;
  description_en: string | null;
  donor_name: string | null;
  payment_method: string;
  receipt_number: string | null;
  notes: string | null;
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  messageBn: string;
}

export interface ParseResult {
  data: ExcelTransaction[];
  errors: ValidationError[];
  totalRows: number;
}

// Valid transaction types
const validTypes: TransactionType[] = [
  'member_fee',
  'donation',
  'event_fee',
  'expense',
  'other_income',
  'other_expense'
];

// Type mapping from Bengali/English to database enum
const typeMapping: { [key: string]: TransactionType } = {
  // Bengali
  'সদস্য চাঁদা': 'member_fee',
  'দান': 'donation',
  'দান/অনুদান': 'donation',
  'অনুদান': 'donation',
  'অনুষ্ঠান ফি': 'event_fee',
  'ইভেন্ট ফি': 'event_fee',
  'ব্যয়': 'expense',
  'অন্যান্য আয়': 'other_income',
  'অন্যান্য ব্যয়': 'other_expense',
  // English
  'member fee': 'member_fee',
  'member_fee': 'member_fee',
  'donation': 'donation',
  'event fee': 'event_fee',
  'event_fee': 'event_fee',
  'expense': 'expense',
  'other income': 'other_income',
  'other_income': 'other_income',
  'other expense': 'other_expense',
  'other_expense': 'other_expense',
};

// Payment method mapping
const paymentMethodMapping: { [key: string]: string } = {
  'নগদ': 'cash',
  'cash': 'cash',
  'ব্যাংক': 'bank',
  'bank': 'bank',
  'বিকাশ': 'mobile',
  'bkash': 'mobile',
  'মোবাইল': 'mobile',
  'mobile': 'mobile',
  'mobile banking': 'mobile',
  'মোবাইল ব্যাংকিং': 'mobile',
};

// Parse date from various formats
function parseDate(value: any): string | null {
  if (!value) return null;
  
  // If it's already a Date object (Excel serial date)
  if (value instanceof Date) {
    return formatDate(value);
  }
  
  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Try YYYY-MM-DD format
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2, '0')}-${String(isoMatch[3]).padStart(2, '0')}`;
    }
    
    // Try DD/MM/YYYY or DD-MM-YYYY format
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${String(dmyMatch[2]).padStart(2, '0')}-${String(dmyMatch[1]).padStart(2, '0')}`;
    }
    
    // Try MM/DD/YYYY format
    const mdyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (mdyMatch) {
      const month = parseInt(mdyMatch[1]);
      const day = parseInt(mdyMatch[2]);
      // If first number > 12, assume DD/MM/YYYY
      if (month > 12) {
        return `${mdyMatch[3]}-${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`;
      }
    }
  }
  
  return null;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse amount from various formats
function parseAmount(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  
  if (typeof value === 'number') return Math.abs(value);
  
  if (typeof value === 'string') {
    // Remove currency symbols, commas, spaces
    const cleaned = value.replace(/[৳$,\s]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : Math.abs(num);
  }
  
  return null;
}

// Parse transaction type
function parseType(value: any): TransactionType | null {
  if (!value) return null;
  
  const str = String(value).toLowerCase().trim();
  
  // Check direct mapping
  if (typeMapping[str]) return typeMapping[str];
  
  // Check if it's already a valid type
  if (validTypes.includes(str as TransactionType)) return str as TransactionType;
  
  // Check original case mapping
  const original = String(value).trim();
  if (typeMapping[original]) return typeMapping[original];
  
  return null;
}

// Parse payment method
function parsePaymentMethod(value: any): string {
  if (!value) return 'cash';
  
  const str = String(value).toLowerCase().trim();
  return paymentMethodMapping[str] || paymentMethodMapping[String(value).trim()] || 'cash';
}

// Main parsing function
export function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
        
        if (jsonData.length < 2) {
          resolve({ data: [], errors: [], totalRows: 0 });
          return;
        }
        
        // First row is header
        const headerRow = jsonData[0].map((h: any) => String(h).toLowerCase().trim());
        
        // Map column indices
        const columnMap = {
          date: findColumnIndex(headerRow, ['তারিখ', 'date', 'transaction_date', 'transaction date']),
          type: findColumnIndex(headerRow, ['ধরন', 'type', 'transaction_type', 'transaction type', 'লেনদেনের ধরন']),
          amount: findColumnIndex(headerRow, ['টাকা', 'amount', 'পরিমাণ', 'taka', 'টাকার পরিমাণ']),
          description_bn: findColumnIndex(headerRow, ['বিবরণ', 'বিবরণ (বাংলা)', 'description_bn', 'description bn', 'description']),
          description_en: findColumnIndex(headerRow, ['বিবরণ (ইংরেজি)', 'description_en', 'description en', 'english description']),
          donor_name: findColumnIndex(headerRow, ['নাম', 'name', 'donor_name', 'donor name', 'সদস্য/দাতার নাম', 'member name']),
          payment_method: findColumnIndex(headerRow, ['পেমেন্ট পদ্ধতি', 'payment_method', 'payment method', 'পেমেন্ট']),
          receipt_number: findColumnIndex(headerRow, ['রশিদ নম্বর', 'receipt_number', 'receipt number', 'receipt', 'রশিদ']),
          notes: findColumnIndex(headerRow, ['মন্তব্য', 'notes', 'note', 'নোট']),
        };
        
        const transactions: ExcelTransaction[] = [];
        const errors: ValidationError[] = [];
        
        // Process data rows (skip header)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowNum = i + 1; // Excel row number (1-indexed)
          
          // Skip empty rows
          if (!row || row.every((cell: any) => !cell)) continue;
          
          // Parse date
          const dateValue = columnMap.date !== -1 ? row[columnMap.date] : null;
          const parsedDate = parseDate(dateValue);
          if (!parsedDate) {
            errors.push({
              row: rowNum,
              column: 'তারিখ',
              message: `Invalid date format: "${dateValue}"`,
              messageBn: `অবৈধ তারিখ ফরম্যাট: "${dateValue}"`
            });
            continue;
          }
          
          // Parse type
          const typeValue = columnMap.type !== -1 ? row[columnMap.type] : null;
          const parsedType = parseType(typeValue);
          if (!parsedType) {
            errors.push({
              row: rowNum,
              column: 'ধরন',
              message: `Invalid transaction type: "${typeValue}"`,
              messageBn: `অবৈধ লেনদেনের ধরন: "${typeValue}"`
            });
            continue;
          }
          
          // Parse amount
          const amountValue = columnMap.amount !== -1 ? row[columnMap.amount] : null;
          const parsedAmount = parseAmount(amountValue);
          if (parsedAmount === null || parsedAmount <= 0) {
            errors.push({
              row: rowNum,
              column: 'টাকা',
              message: `Invalid amount: "${amountValue}"`,
              messageBn: `অবৈধ টাকার পরিমাণ: "${amountValue}"`
            });
            continue;
          }
          
          // Create transaction object
          transactions.push({
            date: parsedDate,
            type: parsedType,
            amount: parsedAmount,
            description_bn: columnMap.description_bn !== -1 ? String(row[columnMap.description_bn] || '').trim() || null : null,
            description_en: columnMap.description_en !== -1 ? String(row[columnMap.description_en] || '').trim() || null : null,
            donor_name: columnMap.donor_name !== -1 ? String(row[columnMap.donor_name] || '').trim() || null : null,
            payment_method: columnMap.payment_method !== -1 ? parsePaymentMethod(row[columnMap.payment_method]) : 'cash',
            receipt_number: columnMap.receipt_number !== -1 ? String(row[columnMap.receipt_number] || '').trim() || null : null,
            notes: columnMap.notes !== -1 ? String(row[columnMap.notes] || '').trim() || null : null,
          });
        }
        
        resolve({
          data: transactions,
          errors,
          totalRows: jsonData.length - 1 // Exclude header
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.indexOf(name.toLowerCase());
    if (index !== -1) return index;
  }
  return -1;
}

// Generate Excel template
export function generateExcelTemplate(): void {
  const templateData = [
    {
      'তারিখ': '2024-01-15',
      'ধরন': 'সদস্য চাঁদা',
      'টাকা': 500,
      'বিবরণ': 'জানুয়ারি মাসের চাঁদা',
      'নাম': 'মোহাম্মদ করিম',
      'পেমেন্ট পদ্ধতি': 'নগদ',
      'রশিদ নম্বর': 'R-001',
      'মন্তব্য': ''
    },
    {
      'তারিখ': '2024-01-20',
      'ধরন': 'দান/অনুদান',
      'টাকা': 5000,
      'বিবরণ': 'মসজিদ মেরামতের জন্য অনুদান',
      'নাম': 'আব্দুল রহমান',
      'পেমেন্ট পদ্ধতি': 'ব্যাংক',
      'রশিদ নম্বর': 'D-001',
      'মন্তব্য': ''
    },
    {
      'তারিখ': '2024-01-25',
      'ধরন': 'ব্যয়',
      'টাকা': 2000,
      'বিবরণ': 'বিদ্যুৎ বিল',
      'নাম': '',
      'পেমেন্ট পদ্ধতি': 'নগদ',
      'রশিদ নম্বর': '',
      'মন্তব্য': 'জানুয়ারি মাসের বিদ্যুৎ বিল'
    }
  ];
  
  const ws = XLSX.utils.json_to_sheet(templateData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 12 },  // তারিখ
    { wch: 15 },  // ধরন
    { wch: 10 },  // টাকা
    { wch: 30 },  // বিবরণ
    { wch: 20 },  // নাম
    { wch: 15 },  // পেমেন্ট পদ্ধতি
    { wch: 12 },  // রশিদ নম্বর
    { wch: 25 },  // মন্তব্য
  ];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'লেনদেন');
  
  // Add instructions sheet
  const instructionsData = [
    ['লেনদেনের ধরন (ইংরেজি)', 'লেনদেনের ধরন (বাংলা)'],
    ['member_fee', 'সদস্য চাঁদা'],
    ['donation', 'দান/অনুদান'],
    ['event_fee', 'অনুষ্ঠান ফি'],
    ['expense', 'ব্যয়'],
    ['other_income', 'অন্যান্য আয়'],
    ['other_expense', 'অন্যান্য ব্যয়'],
    ['', ''],
    ['পেমেন্ট পদ্ধতি (ইংরেজি)', 'পেমেন্ট পদ্ধতি (বাংলা)'],
    ['cash', 'নগদ'],
    ['bank', 'ব্যাংক'],
    ['mobile', 'মোবাইল/বিকাশ'],
  ];
  
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 25 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'নির্দেশিকা');
  
  XLSX.writeFile(wb, 'transaction_template.xlsx');
}

// Export transactions to Excel
export function exportTransactionsToExcel(transactions: any[], year: string): void {
  const exportData = transactions.map((t) => ({
    'তারিখ': t.transaction_date,
    'ধরন': t.type,
    'টাকা': t.amount,
    'বিবরণ (বাংলা)': t.description_bn || '',
    'বিবরণ (ইংরেজি)': t.description_en || '',
    'নাম': t.donor_name || '',
    'পেমেন্ট পদ্ধতি': t.payment_method || 'cash',
    'রশিদ নম্বর': t.receipt_number || '',
    'মন্তব্য': t.notes || '',
  }));
  
  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 30 },
    { wch: 30 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 25 },
  ];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `লেনদেন ${year}`);
  
  XLSX.writeFile(wb, `transactions_${year}.xlsx`);
}
