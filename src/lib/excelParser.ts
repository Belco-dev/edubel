import * as XLSX from 'xlsx';
import { Student, StudentMark } from '@/types/reportCard';

export interface ParseResult {
  success: boolean;
  students: Student[];
  detectedSubjects: string[];
  error?: string;
}

function generateRemark(percentage: number): string {
  if (percentage >= 90) return 'Excellent! Outstanding performance!';
  if (percentage >= 80) return 'Very Good! Keep up the great work!';
  if (percentage >= 70) return 'Good performance. Continue working hard!';
  if (percentage >= 60) return 'Satisfactory. Room for improvement.';
  if (percentage >= 50) return 'Fair. More effort needed.';
  if (percentage >= 40) return 'Needs improvement. Please work harder.';
  return 'Poor performance. Requires extra support and attention.';
}

export function parseExcelFile(file: File): Promise<ParseResult> {
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
            error: 'Could not find a "Name" or "Student" column. Please ensure your Excel has a column with student names.',
          });
          return;
        }
        
        // Detect subjects - looking for columns that might be subjects
        // Format expected: Subject Name, Subject Max, Subject Obtained OR Subject (marks/max)
        const detectedSubjects: string[] = [];
        const subjectColumns: { name: string; maxIndex?: number; obtainedIndex: number; maxValue?: number }[] = [];
        
        headers.forEach((header, index) => {
          if (index === nameColumnIndex) return;
          if (!header) return;
          
          const headerStr = header.toString().toLowerCase();
          
          // Skip common non-subject columns
          if (headerStr.includes('position') || headerStr.includes('total') || 
              headerStr.includes('percentage') || headerStr.includes('remark') ||
              headerStr.includes('rank') || headerStr.includes('grade')) {
            return;
          }
          
          // Check if this is a max marks column
          if (headerStr.includes('max')) {
            return;
          }
          
          // Check if next column is max marks
          const nextHeader = headers[index + 1]?.toString().toLowerCase() || '';
          if (nextHeader.includes('max')) {
            detectedSubjects.push(header.toString());
            subjectColumns.push({
              name: header.toString(),
              obtainedIndex: index,
              maxIndex: index + 1,
            });
          } else {
            // Assume it's a single column with marks
            detectedSubjects.push(header.toString());
            subjectColumns.push({
              name: header.toString(),
              obtainedIndex: index,
              maxValue: 100, // Default max marks
            });
          }
        });
        
        const students: Student[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as (string | number)[];
          const fullName = row[nameColumnIndex]?.toString();
          
          if (!fullName || fullName.trim() === '') continue;
          
          const marks: StudentMark[] = [];
          let totalObtained = 0;
          let totalMax = 0;
          
          subjectColumns.forEach((col) => {
            const obtained = Number(row[col.obtainedIndex]) || 0;
            const max = col.maxIndex !== undefined 
              ? Number(row[col.maxIndex]) || 100 
              : col.maxValue || 100;
            
            marks.push({
              subject: col.name,
              obtainedMarks: obtained,
              maxMarks: max,
            });
            
            totalObtained += obtained;
            totalMax += max;
          });
          
          const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
          
          students.push({
            id: `student-${i}`,
            fullName: fullName.trim(),
            marks,
            totalMarks: totalObtained,
            maxTotalMarks: totalMax,
            percentage,
            position: 0, // Will be calculated after sorting
            remark: generateRemark(percentage),
          });
        }
        
        // Sort by percentage and assign positions
        students.sort((a, b) => b.percentage - a.percentage);
        students.forEach((student, index) => {
          student.position = index + 1;
        });
        
        // Re-sort by name for display
        students.sort((a, b) => a.fullName.localeCompare(b.fullName));
        
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
