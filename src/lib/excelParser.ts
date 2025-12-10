import * as XLSX from 'xlsx';
import { ParsedStudent } from '@/types/reportCard';

export interface ParseResult {
  success: boolean;
  students: ParsedStudent[];
  detectedSubjects: string[];
  error?: string;
}

export function parseExcelFile(file: File, mttMax: number, examMax: number, conductMax: number): Promise<ParseResult> {
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

        // Find conduct column
        const conductColumnIndex = headers.findIndex(
          (h) => h && h.toString().toLowerCase().includes('conduct')
        );
        
        // Detect subjects - Format: Subject_MTT, Subject_EXAM columns
        // OR just Subject column with marks
        const detectedSubjects: string[] = [];
        const subjectColumns: { 
          name: string; 
          mttIndex?: number; 
          examIndex?: number;
          singleIndex?: number;
        }[] = [];
        
        // First pass: find all subject patterns
        const processedIndices = new Set<number>();
        processedIndices.add(nameColumnIndex);
        if (conductColumnIndex !== -1) processedIndices.add(conductColumnIndex);
        
        headers.forEach((header, index) => {
          if (processedIndices.has(index) || !header) return;
          
          const headerStr = header.toString();
          const headerLower = headerStr.toLowerCase();
          
          // Skip non-subject columns
          if (headerLower.includes('total') || headerLower.includes('percentage') || 
              headerLower.includes('position') || headerLower.includes('rank') ||
              headerLower.includes('grade') || headerLower.includes('remark') ||
              headerLower.includes('max') || headerLower.includes('conduct')) {
            return;
          }
          
          // Check for MTT/EXAM pattern in column name
          if (headerLower.includes('_mtt') || headerLower.includes(' mtt')) {
            const subjectName = headerStr.replace(/_mtt|_MTT| mtt| MTT/gi, '').trim();
            // Find corresponding EXAM column
            const examIndex = headers.findIndex((h, i) => 
              h && (h.toString().toLowerCase().includes(subjectName.toLowerCase()) && 
                   (h.toString().toLowerCase().includes('_exam') || h.toString().toLowerCase().includes(' exam')))
            );
            
            if (!detectedSubjects.includes(subjectName)) {
              detectedSubjects.push(subjectName);
              subjectColumns.push({
                name: subjectName,
                mttIndex: index,
                examIndex: examIndex !== -1 ? examIndex : undefined,
              });
              processedIndices.add(index);
              if (examIndex !== -1) processedIndices.add(examIndex);
            }
          } else if (headerLower.includes('_exam') || headerLower.includes(' exam')) {
            // Skip - already handled with MTT
          } else {
            // Single column subject (marks only)
            if (!detectedSubjects.includes(headerStr)) {
              detectedSubjects.push(headerStr);
              subjectColumns.push({
                name: headerStr,
                singleIndex: index,
              });
              processedIndices.add(index);
            }
          }
        });
        
        const totalMax = subjectColumns.length * (mttMax + examMax);
        const students: ParsedStudent[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as (string | number)[];
          const fullName = row[nameColumnIndex]?.toString();
          
          if (!fullName || fullName.trim() === '') continue;
          
          const marks: { subject: string; mtt: number; exam: number; total: number }[] = [];
          let totalMarks = 0;
          
          subjectColumns.forEach((col) => {
            let mtt = 0;
            let exam = 0;
            
            if (col.mttIndex !== undefined) {
              mtt = Number(row[col.mttIndex]) || 0;
            }
            if (col.examIndex !== undefined) {
              exam = Number(row[col.examIndex]) || 0;
            }
            if (col.singleIndex !== undefined) {
              // If single column, treat as total and split proportionally
              const total = Number(row[col.singleIndex]) || 0;
              exam = total;
              mtt = 0;
            }
            
            const total = mtt + exam;
            marks.push({ subject: col.name, mtt, exam, total });
            totalMarks += total;
          });
          
          const conductMarks = conductColumnIndex !== -1 
            ? Number(row[conductColumnIndex]) || 0 
            : 0;
          
          const percentage = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
          
          students.push({
            fullName: fullName.trim(),
            marks,
            conductMarks,
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
