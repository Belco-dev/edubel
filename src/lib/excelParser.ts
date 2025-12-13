import * as XLSX from 'xlsx';
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
 * New Excel format:
 * Full names | Mathematics/30 | ENGLISH/100 | SET/50 | Conduct/100
 * 
 * For midterm files: Each column is a subject with /MAX at the end indicating max marks
 * For exam files: Same format
 * 
 * The system extracts the subject name (before /) and max marks (after /)
 */
export function parseExcelFile(file: File, isMidtermFile: boolean = false): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        if (jsonData.length < 2) {
          resolve({
            success: false,
            students: [],
            detectedSubjects: [],
            error: 'Excel file must have at least a header row and one data row.',
          });
          return;
        }
        
        const headers = jsonData[0] as string[];
        
        // Find the name column
        const nameColumnIndex = headers.findIndex(
          (h) => h && (
            h.toString().toLowerCase().includes('name') ||
            h.toString().toLowerCase().includes('student')
          )
        );
        
        if (nameColumnIndex === -1) {
          resolve({
            success: false,
            students: [],
            detectedSubjects: [],
            error: 'Could not find a "Name" or "Student" column.',
          });
          return;
        }

        // Find conduct column - format: Conduct/MAX
        let conductColumnIndex = -1;
        let conductMaxFromFile = 100; // Default if not specified in Excel
        
        headers.forEach((h, index) => {
          if (!h) return;
          const headerStr = h.toString();
          const headerLower = headerStr.toLowerCase();
          
          if (headerLower.includes('conduct')) {
            conductColumnIndex = index;
            // Extract max from conduct column if present
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
        
        headers.forEach((header, index) => {
          if (processedIndices.has(index) || !header) return;
          
          const headerStr = header.toString().trim();
          const headerLower = headerStr.toLowerCase();
          
          // Skip non-subject columns
          if (headerLower.includes('total') || headerLower.includes('percentage') || 
              headerLower.includes('position') || headerLower.includes('rank') ||
              headerLower.includes('grade') || headerLower.includes('remark') ||
              headerLower.includes('average') || headerLower.includes('comment')) {
            return;
          }
          
          // Parse Subject/MAX format - MAX is required
          let subjectName = headerStr;
          let maxMarks = 100; // Default if no /MAX specified
          
          if (headerStr.includes('/')) {
            const parts = headerStr.split('/');
            subjectName = parts[0].trim();
            const maxVal = parseInt(parts[1], 10);
            if (!isNaN(maxVal)) maxMarks = maxVal;
          }
          
          // Clean up subject name (remove any trailing numbers or special chars)
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
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as (string | number)[];
          const fullName = row[nameColumnIndex]?.toString();
          
          if (!fullName || fullName.trim() === '') continue;
          
          const marks: { subject: string; mtt: number; exam: number; total: number; maxMtt: number; maxExam: number }[] = [];
          let totalMarks = 0;
          
          subjectColumns.forEach((col) => {
            const value = Number(row[col.index]) || 0;
            
            // If this is a midterm file, marks go to MTT, otherwise to EXAM
            const mtt = isMidtermFile ? value : 0;
            const exam = isMidtermFile ? 0 : value;
            const total = value;
            
            marks.push({ 
              subject: col.name, 
              mtt, 
              exam, 
              total,
              maxMtt: isMidtermFile ? col.maxMarks : 0,
              maxExam: isMidtermFile ? 0 : col.maxMarks,
            });
            totalMarks += total;
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
        
        resolve({
          success: true,
          students,
          detectedSubjects,
        });
        
      } catch (error) {
        resolve({
          success: false,
          students: [],
          detectedSubjects: [],
          error: 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.',
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        students: [],
        detectedSubjects: [],
        error: 'Failed to read the file.',
      });
    };
    
    reader.readAsBinaryString(file);
  });
}
