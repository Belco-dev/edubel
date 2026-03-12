import writeXlsxFile from 'write-excel-file/browser';
import { Student, SchoolData, TermUpload } from '@/types/reportCard';

interface ExportOptions {
  students: Student[];
  school: SchoolData;
  selectedSubjects: string[];
  terms: TermUpload[];
}

export async function generateReportCardWorkbook(options: ExportOptions): Promise<Blob> {
  const { students, school, selectedSubjects, terms } = options;
  const selectedTerms = terms.filter((t) => t.selected && (t.testParsedData || t.examParsedData));
  const hasThreeTerms = selectedTerms.length === 3;

  const subjectsFromData = getSubjects(students, selectedTerms);
  const subjects = selectedSubjects.length > 0 ? selectedSubjects : subjectsFromData;

  const headers: (string | number)[] = ['#', 'Student Name'];
  for (const term of selectedTerms) {
    for (const subject of subjects) {
      headers.push(`${subject} (${term.shortName})`);
    }
    headers.push(`Total (${term.shortName})`, `% (${term.shortName})`, `Rank (${term.shortName})`);
  }

  if (hasThreeTerms) {
    headers.push('Avg Total', 'Avg %', 'Annual Rank');
  }

  const rows: (string | number)[][] = [headers];

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const row: (string | number)[] = [i + 1, student.fullName];

    for (const selectedTerm of selectedTerms) {
      const term = student.terms.find((t) => t.id === selectedTerm.id) ?? student.terms.find((t) => t.shortName === selectedTerm.shortName);

      for (const subject of subjects) {
        const mark = term?.subjects.find((m) => m.subject === subject);
        row.push(mark?.total ?? 0);
      }

      row.push(
        term?.totalMarks ?? 0,
        Math.round((term?.percentage ?? 0) * 10) / 10,
        term?.termRank ?? '-'
      );
    }

    if (hasThreeTerms && student.subjectAverages) {
      const avgTotal = Math.round(student.subjectAverages.reduce((sum, avg) => sum + avg.avgTotal, 0) * 10) / 10;
      row.push(avgTotal, Math.round(student.overallPercentage * 10) / 10, student.annualRank ?? student.position ?? '-');
    }

    rows.push(row);
  }

  const sheetName = (school.className || 'Report Cards').substring(0, 31);
  const columns = headers.map((header, index) => ({
    width: index === 1 ? 30 : Math.max(String(header).length + 2, 10),
  }));

  const output = await writeXlsxFile(rows, {
    sheet: sheetName,
    columns,
    blob: true,
  });

  return output instanceof Blob
    ? output
    : new Blob([output], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
}

function getSubjects(students: Student[], selectedTerms: TermUpload[]): string[] {
  if (students.length === 0) return [];

  const firstStudent = students[0];
  const firstSelectedTerm = selectedTerms[0];
  if (!firstSelectedTerm) return [];

  const term = firstStudent.terms.find((t) => t.id === firstSelectedTerm.id) ?? firstStudent.terms[0];
  return term?.subjects.map((s) => s.subject) ?? [];
}
