import writeXlsxFile from 'write-excel-file/browser';
import { Student, SchoolData, TermUpload } from '@/types/reportCard';

interface ExportOptions {
  students: Student[];
  school: SchoolData;
  selectedSubjects: string[];
  terms: TermUpload[];
}

type CellValue = {
  value: string | number | null;
  type?: typeof String | typeof Number;
  fontWeight?: 'bold';
};

export async function generateReportCardWorkbook(options: ExportOptions): Promise<Blob> {
  const { students, school, selectedSubjects, terms } = options;
  const selectedTerms = terms.filter((t) => t.selected && (t.testParsedData || t.examParsedData));
  const hasThreeTerms = selectedTerms.length === 3;

  const subjectsFromData = getSubjects(students, selectedTerms);
  const subjects = selectedSubjects.length > 0 ? selectedSubjects : subjectsFromData;

  // Build header labels
  const headers: string[] = ['#', 'Student Name'];
  for (const term of selectedTerms) {
    for (const subject of subjects) {
      headers.push(`${subject} (${term.shortName})`);
    }
    headers.push(`Total (${term.shortName})`, `% (${term.shortName})`, `Rank (${term.shortName})`);
  }

  if (hasThreeTerms) {
    headers.push('Avg Total', 'Avg %', 'Annual Rank');
  }

  // Build cell data with proper cell objects
  const allRows: CellValue[][] = [];

  // Header row
  allRows.push(
    headers.map((h) => ({
      value: h,
      fontWeight: 'bold' as const,
    }))
  );

  // Data rows
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const row: CellValue[] = [
      { value: i + 1, type: Number },
      { value: student.fullName },
    ];

    for (const selectedTerm of selectedTerms) {
      const term =
        student.terms.find((t) => t.termId === selectedTerm.id) ??
        student.terms.find((t) => t.shortName === selectedTerm.shortName);

      for (const subject of subjects) {
        const mark = term?.subjects.find((m) => m.subject === subject);
        row.push({ value: mark?.total ?? 0, type: Number });
      }

      row.push(
        { value: term?.totalMarks ?? 0, type: Number },
        { value: Math.round((term?.percentage ?? 0) * 10) / 10, type: Number },
        { value: term?.termRank ?? 0, type: Number }
      );
    }

    if (hasThreeTerms && student.subjectAverages) {
      const avgTotal = Math.round(student.subjectAverages.reduce((sum, avg) => sum + avg.avgTotal, 0) * 10) / 10;
      row.push(
        { value: avgTotal, type: Number },
        { value: Math.round(student.overallPercentage * 10) / 10, type: Number },
        { value: student.annualRank ?? student.position ?? 0, type: Number }
      );
    }

    allRows.push(row);
  }

  // Excel forbids : \ / ? * [ ] in sheet names, and caps length at 31 chars.
  const sheetName =
    (school.className || 'Report Cards')
      .replace(/[:\\/?*\[\]]/g, ' ')
      .trim()
      .substring(0, 31) || 'Report Cards';

  const columns = headers.map((header, index) => ({
    width: index === 1 ? 30 : Math.max(header.length + 2, 10),
  }));

  // write-excel-file's /browser entry returns a Blob directly — do NOT pass
  // `buffer: true` (Node-only) and do NOT re-wrap the result in another Blob,
  // or Excel will see a corrupted file ("unable to open" / repair dialog).
  const blob = (await writeXlsxFile(allRows as any, {
    sheet: sheetName,
    columns,
  } as any)) as unknown as Blob;

  return blob;
}

function getSubjects(students: Student[], selectedTerms: TermUpload[]): string[] {
  if (students.length === 0) return [];

  const firstStudent = students[0];
  const firstSelectedTerm = selectedTerms[0];
  if (!firstSelectedTerm) return [];

  const term = firstStudent.terms.find((t) => t.termId === firstSelectedTerm.id) ?? firstStudent.terms[0];
  return term?.subjects.map((s) => s.subject) ?? [];
}
