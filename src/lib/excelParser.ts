import readXlsxFile from 'read-excel-file';
import { ParsedStudent, ParsedSectionData } from '@/types/reportCard';

export interface ParseResult {
  success: boolean;
  students: ParsedStudent[];
  detectedSubjects: string[];
  error?: string;
}

export interface CombinedParseResult {
  success: boolean;
  testSection: ParsedSectionData | null;
  examSection: ParsedSectionData | null;
  detectedSubjects: string[];
  error?: string;
}

type Row = (string | number | boolean | Date | null)[];

/** A subject column after header parsing. */
interface SubjectCol {
  /** Display name (first spelling encountered). */
  name: string;
  /** Normalized key for merging (case-insensitive, trimmed). */
  key: string;
  /** 'test' | 'exam' | 'none' (none = plain subject column). */
  section: 'test' | 'exam' | 'none';
  index: number;
  maxMarks: number;
}

const normalizeSubject = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');

function isNameHeader(h: string): boolean {
  const l = h.toLowerCase();
  return l.includes('name') || l.includes('student');
}

function isIndexHeader(h: string): boolean {
  const l = h.toLowerCase().trim();
  if (isNameHeader(h)) return false;
  return (
    l.includes('index') ||
    l.includes('sdms') ||
    /\breg(istration)?\b/.test(l) ||
    /\badm(ission)?\b/.test(l) ||
    l === 'code' || l.endsWith(' code') ||
    /\bid\b/.test(l) || l.endsWith(' no') || l.endsWith(' no.') || l.endsWith(' number')
  );
}

function isBornHeader(h: string): boolean {
  const l = h.toLowerCase().trim();
  return l === 'born at' || l === 'date of birth' || l === 'dob' || l.includes('born');
}

function isConductHeader(h: string): boolean {
  return h.toLowerCase().includes('conduct');
}

function isSkipHeader(h: string): boolean {
  const l = h.toLowerCase();
  return (
    l.includes('total') || l.includes('percentage') || l.includes('position') ||
    l.includes('rank') || l.includes('grade') || l.includes('remark') ||
    l.includes('average') || l.includes('comment')
  );
}

/**
 * Parse a single subject header into section / name / max.
 *  - TEST/SUBJECT/MAX or EXAM/SUBJECT/MAX (prefix case-insensitive)
 *  - SUBJECT/MAX  (plain)
 *  - SUBJECT      (no max -> 100)
 */
function parseSubjectHeader(headerStr: string): { section: 'test' | 'exam' | 'none'; name: string; max: number } {
  const parts = headerStr.split('/').map(p => p.trim());
  if (parts.length >= 3) {
    const prefix = parts[0].toLowerCase();
    if (prefix === 'test' || prefix === 'exam') {
      const max = parseInt(parts[2], 10);
      return { section: prefix, name: parts[1], max: isNaN(max) ? 100 : max };
    }
    // unknown 3-part header -> treat first two as name, last as max
    const max = parseInt(parts[2], 10);
    return { section: 'none', name: `${parts[0]} ${parts[1]}`.trim(), max: isNaN(max) ? 100 : max };
  }
  if (parts.length === 2) {
    const max = parseInt(parts[1], 10);
    return { section: 'none', name: parts[0], max: isNaN(max) ? 100 : max };
  }
  let name = headerStr.trim().replace(/_MTT|_EXAM|_mtt|_exam/gi, '').trim();
  return { section: 'none', name, max: 100 };
}

interface ScanResult {
  nameIdx: number;
  indexIdx: number;
  bornIdx: number;
  conductIdx: number;
  conductMax: number;
  headers: string[];
  subjectCols: SubjectCol[];
}

function scanHeaders(headers: string[]): ScanResult {
  let nameIdx = -1, indexIdx = -1, bornIdx = -1, conductIdx = -1, conductMax = 100;

  // Name first (so index detection can exclude it)
  nameIdx = headers.findIndex(h => h && isNameHeader(h));

  headers.forEach((h, i) => {
    if (!h || i === nameIdx) return;
    if (indexIdx === -1 && isIndexHeader(h)) { indexIdx = i; return; }
    if (bornIdx === -1 && isBornHeader(h)) { bornIdx = i; return; }
    if (conductIdx === -1 && isConductHeader(h)) {
      conductIdx = i;
      if (h.includes('/')) {
        const m = parseInt(h.split('/')[1], 10);
        if (!isNaN(m)) conductMax = m;
      }
      return;
    }
  });

  const reserved = new Set([nameIdx, indexIdx, bornIdx, conductIdx].filter(i => i !== -1));
  const subjectCols: SubjectCol[] = [];
  headers.forEach((h, i) => {
    if (!h || reserved.has(i) || isSkipHeader(h)) return;
    const parsed = parseSubjectHeader(h);
    if (!parsed.name) return;
    subjectCols.push({
      name: parsed.name,
      key: `${parsed.section}::${normalizeSubject(parsed.name)}`,
      section: parsed.section,
      index: i,
      maxMarks: parsed.max,
    });
  });

  return { nameIdx, indexIdx, bornIdx, conductIdx, conductMax, headers, subjectCols };
}

function readCellString(v: Row[number]): string {
  if (v == null) return '';
  if (v instanceof Date) {
    const dd = String(v.getDate()).padStart(2, '0');
    const mm = String(v.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${v.getFullYear()}`;
  }
  return String(v).trim();
}

/** Merge subject columns of a given section by normalized name, summing max marks. */
function buildMergedSubjects(cols: SubjectCol[]): { name: string; key: string; max: number; indices: number[] }[] {
  const map = new Map<string, { name: string; key: string; max: number; indices: number[] }>();
  cols.forEach(c => {
    const existing = map.get(c.key);
    if (existing) {
      existing.max += c.maxMarks;
      existing.indices.push(c.index);
    } else {
      map.set(c.key, { name: c.name, key: c.key, max: c.maxMarks, indices: [c.index] });
    }
  });
  return Array.from(map.values());
}

function buildStudents(
  rows: Row[],
  scan: ScanResult,
  sectionFilter: ('test' | 'exam' | 'none')[]
): { students: ParsedStudent[]; detectedSubjects: string[] } {
  const cols = scan.subjectCols.filter(c => sectionFilter.includes(c.section));
  const merged = buildMergedSubjects(cols);
  const detectedSubjects = merged.map(m => m.name);
  const totalMax = merged.reduce((sum, m) => sum + m.max, 0);

  const students: ParsedStudent[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const fullName = scan.nameIdx !== -1 ? readCellString(row[scan.nameIdx]) : '';
    if (!fullName) continue;

    const marks: { subject: string; marks: number; maxMarks: number }[] = [];
    let totalMarks = 0;
    merged.forEach(m => {
      const value = m.indices.reduce((sum, idx) => sum + (Number(row[idx]) || 0), 0);
      marks.push({ subject: m.name, marks: value, maxMarks: m.max });
      totalMarks += value;
    });

    const conductMarks = scan.conductIdx !== -1 ? Number(row[scan.conductIdx]) || 0 : 0;
    const dateOfBirth = scan.bornIdx !== -1 ? readCellString(row[scan.bornIdx]) || undefined : undefined;
    const indexNumber = scan.indexIdx !== -1 ? readCellString(row[scan.indexIdx]) || undefined : undefined;

    // Capture every non-name column as an extra field (for custom headers)
    const extraFields: Record<string, string> = {};
    scan.headers.forEach((h, idx) => {
      if (!h || idx === scan.nameIdx) return;
      const val = readCellString(row[idx]);
      if (val) extraFields[h.trim()] = val;
    });

    const percentage = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
    students.push({
      fullName,
      dateOfBirth,
      indexNumber,
      extraFields,
      marks,
      conductMarks,
      conductMax: scan.conductMax,
      totalMarks,
      maxMarks: totalMax,
      percentage,
    });
  }
  return { students, detectedSubjects };
}

/**
 * Multi-file mode: the whole sheet is ONE section (test OR exam).
 * Columns: FullName | Subject/MAX | ... | Conduct/MAX
 * Duplicate subject columns (same spelling, case-insensitive) are merged & summed.
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  try {
    const rows = (await readXlsxFile(file)) as Row[];
    if (rows.length < 2) {
      return { success: false, students: [], detectedSubjects: [], error: 'Excel file must have at least a header row and one data row.' };
    }
    const headers = rows[0].map(h => (h != null ? String(h) : ''));
    const scan = scanHeaders(headers);
    if (scan.nameIdx === -1) {
      return { success: false, students: [], detectedSubjects: [], error: 'Could not find a "Name" or "Student" column.' };
    }
    const { students, detectedSubjects } = buildStudents(rows, scan, ['test', 'exam', 'none']);
    return { success: true, students, detectedSubjects };
  } catch {
    return { success: false, students: [], detectedSubjects: [], error: 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.' };
  }
}

/**
 * Single-file (combined) mode: one sheet holds BOTH test and exam marks.
 * Column titles: TEST/SUBJECT/MAX  and  EXAM/SUBJECT/MAX (case-insensitive).
 * Plain Subject/MAX columns (no prefix) are treated as TEST marks.
 * Returns a test section and an exam section that feed the same term.
 */
export async function parseCombinedExcelFile(file: File): Promise<CombinedParseResult> {
  try {
    const rows = (await readXlsxFile(file)) as Row[];
    if (rows.length < 2) {
      return { success: false, testSection: null, examSection: null, detectedSubjects: [], error: 'Excel file must have at least a header row and one data row.' };
    }
    const headers = rows[0].map(h => (h != null ? String(h) : ''));
    const scan = scanHeaders(headers);
    if (scan.nameIdx === -1) {
      return { success: false, testSection: null, examSection: null, detectedSubjects: [], error: 'Could not find a "Name" or "Student" column.' };
    }

    const hasExam = scan.subjectCols.some(c => c.section === 'exam');
    const hasTest = scan.subjectCols.some(c => c.section === 'test');
    if (!hasExam && !hasTest) {
      return {
        success: false, testSection: null, examSection: null, detectedSubjects: [],
        error: 'Combined format needs columns starting with TEST/ or EXAM/ (e.g. TEST/Mathematics/30, EXAM/Mathematics/70).',
      };
    }

    // Plain columns count as test marks.
    const test = buildStudents(rows, scan, ['test', 'none']);
    const exam = buildStudents(rows, scan, ['exam']);

    const allSubjects = Array.from(new Set([...test.detectedSubjects, ...exam.detectedSubjects]));
    return {
      success: true,
      testSection: test.students.length ? { students: test.students, detectedSubjects: test.detectedSubjects } : null,
      examSection: exam.students.length ? { students: exam.students, detectedSubjects: exam.detectedSubjects } : null,
      detectedSubjects: allSubjects,
    };
  } catch {
    return { success: false, testSection: null, examSection: null, detectedSubjects: [], error: 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.' };
  }
}
