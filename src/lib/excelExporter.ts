import * as XLSX from 'xlsx';
import { Student, SchoolData, TermUpload } from '@/types/reportCard';

interface ExportOptions {
  students: Student[];
  school: SchoolData;
  selectedSubjects: string[];
  terms: TermUpload[];
}

export function generateReportCardWorkbook(options: ExportOptions): Blob {
  const { students, school, selectedSubjects, terms } = options;
  const selectedTerms = terms.filter(t => t.selected && (t.testParsedData || t.examParsedData));
  const hasThreeTerms = selectedTerms.length === 3;

  const wb = XLSX.utils.book_new();

  // Build header row
  const headers: string[] = ['#', 'Student Name'];
  for (const term of selectedTerms) {
    for (const subj of selectedSubjects.length > 0 ? selectedSubjects : getSubjects(students)) {
      headers.push(`${subj} (${term.shortName})`);
    }
    headers.push(`Total (${term.shortName})`, `% (${term.shortName})`, `Rank (${term.shortName})`);
  }
  if (hasThreeTerms) {
    headers.push('Avg Total', 'Avg %', 'Annual Rank');
  }

  const rows: (string | number)[][] = [headers];

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const row: (string | number)[] = [i + 1, s.fullName];

    for (const term of s.terms) {
      const subjects = selectedSubjects.length > 0
        ? selectedSubjects
        : term.subjects.map(sub => sub.subject);

      for (const subj of subjects) {
        const mark = term.subjects.find(m => m.subject === subj);
        row.push(mark?.total ?? 0);
      }
      row.push(term.totalMarks, Math.round(term.percentage * 10) / 10, term.termRank ?? '-');
    }

    if (hasThreeTerms && s.subjectAverages) {
      const avgTotal = Math.round(s.subjectAverages.reduce((sum, a) => sum + a.avgTotal, 0) * 10) / 10;
      row.push(avgTotal, Math.round(s.overallPercentage * 10) / 10, s.annualRank ?? s.position);
    }

    rows.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  // Auto-size columns
  ws['!cols'] = headers.map((h, i) => ({ wch: i === 1 ? 25 : Math.max(h.length, 8) }));

  const sheetName = (school.className || 'Report Cards').substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function getSubjects(students: Student[]): string[] {
  if (students.length === 0 || students[0].terms.length === 0) return [];
  return students[0].terms[0].subjects.map(s => s.subject);
}
