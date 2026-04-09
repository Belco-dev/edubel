import readXlsxFile from 'read-excel-file';
import { ParsedStudent } from '@/types/reportCard';

export interface ParseResult {
  success: boolean;
  students: ParsedStudent[];
  detectedSubjects: string[];
  error?: string;
}

interface SubjectColumn {
  name: string;
  index: number;
  maxMarks: number;
}

/**
 * Excel format:
 * Full names | Mathematics/30 | ENGLISH/100 | SET/50 | Conduct/100
 * 
 * Each column is a subject with /MAX at the end indicating max marks
 * The system extracts the subject name (before /) and max marks (after /)
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  try {
    const rows = await readXlsxFile(file);

    if (rows.length < 2) {
      return {
        success: false,
        students: [],
        detectedSubjects: [],
        error: 'Excel file must have at least a header row and one data row.',
      };
    }

    const headers = rows[0].map(h => (h != null ? String(h) : ''));

    // Find the name column
    const nameColumnIndex = headers.findIndex(
      (h) => h && (
        h.toLowerCase().includes('name') ||
        h.toLowerCase().includes('student')
      )
    );

    if (nameColumnIndex === -1) {
      return {
        success: false,
        students: [],
        detectedSubjects: [],
        error: 'Could not find a "Name" or "Student" column.',
      };
    }

    // Find "Born at" column
    let bornAtColumnIndex = -1;
    headers.forEach((headerStr, index) => {
      if (!headerStr) return;
      const headerLower = headerStr.toLowerCase().trim();
      if (headerLower === 'born at' || headerLower === 'date of birth' || headerLower === 'dob') {
        bornAtColumnIndex = index;
      }
    });

    // Find conduct column - format: Conduct/MAX
    let conductColumnIndex = -1;
    let conductMaxFromFile = 100;

    headers.forEach((headerStr, index) => {
      if (!headerStr) return;
      const headerLower = headerStr.toLowerCase();

      if (headerLower.includes('conduct')) {
        conductColumnIndex = index;
        if (headerStr.includes('/')) {
          const parts = headerStr.split('/');
          const maxVal = parseInt(parts[1], 10);
          if (!isNaN(maxVal)) conductMaxFromFile = maxVal;
        }
      }
    });

    // Detect subjects - Format: SubjectName/MAX
    const subjectColumns: SubjectColumn[] = [];
    const detectedSubjects: string[] = [];
    const processedIndices = new Set<number>();
    processedIndices.add(nameColumnIndex);
    if (conductColumnIndex !== -1) processedIndices.add(conductColumnIndex);
    if (bornAtColumnIndex !== -1) processedIndices.add(bornAtColumnIndex);

    headers.forEach((headerStr, index) => {
      if (processedIndices.has(index) || !headerStr) return;

      const headerLower = headerStr.toLowerCase();

      // Skip non-subject columns
      if (headerLower.includes('total') || headerLower.includes('percentage') ||
          headerLower.includes('position') || headerLower.includes('rank') ||
          headerLower.includes('grade') || headerLower.includes('remark') ||
          headerLower.includes('average') || headerLower.includes('comment')) {
        return;
      }

      // Parse Subject/MAX format
      let subjectName = headerStr;
      let maxMarks = 100;

      if (headerStr.includes('/')) {
        const parts = headerStr.split('/');
        subjectName = parts[0].trim();
        const maxVal = parseInt(parts[1], 10);
        if (!isNaN(maxVal)) maxMarks = maxVal;
      }

      // Clean up subject name
      subjectName = subjectName.replace(/_MTT|_EXAM|_mtt|_exam/gi, '').trim();

      if (subjectName && !detectedSubjects.includes(subjectName)) {
        detectedSubjects.push(subjectName);
        subjectColumns.push({
          name: subjectName,
          index,
          maxMarks,
        });
        processedIndices.add(index);
      }
    });

    // Calculate total max marks
    const totalMax = subjectColumns.reduce((sum, col) => sum + col.maxMarks, 0);
    const students: ParsedStudent[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const fullName = row[nameColumnIndex] != null ? String(row[nameColumnIndex]) : '';

      if (!fullName || fullName.trim() === '') continue;

      const marks: { subject: string; marks: number; maxMarks: number }[] = [];
      let totalMarks = 0;

      subjectColumns.forEach((col) => {
        const value = Number(row[col.index]) || 0;
        marks.push({
          subject: col.name,
          marks: value,
          maxMarks: col.maxMarks,
        });
        totalMarks += value;
      });

      const conductMarksValue = conductColumnIndex !== -1
        ? Number(row[conductColumnIndex]) || 0
        : 0;

      const percentage = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;

      students.push({
        fullName: fullName.trim(),
        marks,
        conductMarks: conductMarksValue,
        conductMax: conductMaxFromFile,
        totalMarks,
        maxMarks: totalMax,
        percentage,
      });
    }

    return {
      success: true,
      students,
      detectedSubjects,
    };

  } catch (error) {
    return {
      success: false,
      students: [],
      detectedSubjects: [],
      error: 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.',
    };
  }
}
