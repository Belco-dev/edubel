import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, SchoolData, TermUpload } from '@/types/reportCard';

interface RankingOptions {
  students: Student[];
  school: SchoolData;
  terms: TermUpload[];
}

interface RankedRow {
  student: Student;
  // null entries indicate the student was absent / has no data for that term.
  termPercents: (number | null)[];
  average: number;
  attemptedCount: number;
}

/**
 * Class Ranking sort algorithm.
 *
 * Steps:
 *  1. Pull each student's per-term percentage. A missing term yields `null`
 *     and is excluded from the average — keeping the rank fair when a
 *     student was absent for one assessment.
 *     Average = sum(actual marks) / number of terms attempted.
 *  2. Sort descending by average. If averages are equal, fall back to
 *     alphabetical order on full name for a stable, defensible tie-break.
 *  3. Assign 1..N ranks (standard competition ranking, 1,2,2,4).
 */
export function buildClassRanking(students: Student[], selectedTerms: TermUpload[]): RankedRow[] {
  const rows: RankedRow[] = students.map((student) => {
    const termPercents: (number | null)[] = selectedTerms.map((selectedTerm) => {
      const termData =
        student.terms.find((termValue) => termValue.termId === selectedTerm.id) ??
        student.terms.find((termValue) => termValue.shortName === selectedTerm.shortName);
      const pct = termData?.percentage;
      return typeof pct === 'number' && !Number.isNaN(pct) ? pct : null;
    });
    const attempted = termPercents.filter((value): value is number => value !== null);
    const average =
      attempted.length > 0
        ? attempted.reduce((sum, value) => sum + value, 0) / attempted.length
        : 0;
    return { student, termPercents, average, attemptedCount: attempted.length };
  });

  rows.sort((rowA, rowB) => {
    if (rowB.average !== rowA.average) return rowB.average - rowA.average;
    return rowA.student.fullName.localeCompare(rowB.student.fullName);
  });

  return rows;
}

export async function generateClassRankingPDF(options: RankingOptions): Promise<jsPDF> {
  const { students, school, terms } = options;
  const selectedTerms = terms.filter((termValue) => termValue.selected && (termValue.testParsedData || termValue.examParsedData));
  const ranked = buildClassRanking(students, selectedTerms);
  const showAverage = selectedTerms.length >= 2;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  // Title block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(school.name || 'School', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`${school.className || 'Class'} - Class Ranking`, pageWidth / 2, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (school.termName) {
    doc.text(school.termName, pageWidth / 2, 28, { align: 'center' });
  }

  // Build table
  const head: string[] = ['Rank', 'Full Names'];
  selectedTerms.forEach((termValue) => head.push(`${termValue.shortName} %`));
  if (showAverage) head.push('Average %');

  // Standard competition ranking (1, 2, 2, 4) on the value used for sorting.
  // When only one term exists we rank by that term's percentage; otherwise by average.
  const rankValues = ranked.map((row) =>
    showAverage ? row.average : (row.termPercents[0] ?? 0)
  );
  const ranks: number[] = [];
  rankValues.forEach((value, index) => {
    if (index === 0) {
      ranks.push(1);
    } else if (value === rankValues[index - 1]) {
      ranks.push(ranks[index - 1]);
    } else {
      ranks.push(index + 1);
    }
  });

  const body = ranked.map((row, index) => {
    const cells: (string | number)[] = [ranks[index], row.student.fullName];
    // Render '—' for absent terms so the average math (which excludes them) is visible.
    row.termPercents.forEach((p) => cells.push(p === null ? '—' : `${p.toFixed(1)}%`));
    if (showAverage) {
      cells.push(row.attemptedCount === 0 ? '—' : `${row.average.toFixed(1)}%`);
    }
    return cells;
  });

  autoTable(doc, {
    startY: 34,
    head: [head],
    body,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      minCellHeight: 7,
      valign: 'middle',
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: { halign: 'center' },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 60, halign: 'left' },
    },
    margin: { left: margin, right: margin },
  });

  return doc;
}

export function classRankingFilename(school: SchoolData): string {
  const className = (school.className || 'Class').replace(/\s+/g, '_');
  return `${className}_Class_Ranking.pdf`;
}
