import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, SchoolData, TermSection, MarkSettings } from '@/types/reportCard';

interface GeneratePDFOptions {
  student: Student;
  school: SchoolData;
  totalStudents: number;
  classTeacher: string;
  selectedSubjects: string[];
  sections: TermSection[];
  markSettings: MarkSettings;
}

function getGradeColor(percentage: number): [number, number, number] {
  if (percentage >= 80) return [34, 197, 94];
  if (percentage >= 60) return [59, 130, 246];
  if (percentage >= 40) return [245, 158, 11];
  return [239, 68, 68];
}

function getGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 30) return 'D';
  return 'E';
}

export async function generateStudentPDF(options: GeneratePDFOptions): Promise<jsPDF> {
  const { student, school, totalStudents, classTeacher, selectedSubjects, sections, markSettings } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor: [number, number, number] = [20, 184, 166];
  const headerBg: [number, number, number] = [240, 253, 250];
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  if (school.logo) {
    try {
      doc.addImage(school.logo, 'PNG', pageWidth - 40, 3, 30, 28);
    } catch (e) {
      console.log('Could not add logo');
    }
  }
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(school.name || 'School Name', 10, 14);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(school.address || 'School Address', 10, 21);
  doc.text(`Contact: ${school.contact || 'N/A'}`, 10, 27);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(school.termName || 'Term Report Card', pageWidth / 2, 33, { align: 'center' });
  
  // Student Info
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(...headerBg);
  doc.roundedRect(10, 40, pageWidth - 20, 18, 2, 2, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Name:', 15, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(student.fullName, 50, 48);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Conduct:', 15, 54);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.conductMarks} / ${markSettings.conductMax}`, 40, 54);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Class Teacher:', pageWidth / 2, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(classTeacher || '________________', pageWidth / 2 + 30, 48);
  
  // Build table headers - matching reference format: SUBJECTS | TEST | EX | TOT (per term) | Rank | Comments
  const selectedSections = sections.filter(s => s.selected && s.parsedData);
  const tableHeaders: string[][] = [
    ['SUBJECTS'],
    [''],
  ];
  
  selectedSections.forEach(section => {
    tableHeaders[0].push(section.shortName, '', '');
    tableHeaders[1].push('TEST', 'EX', 'TOT');
  });
  tableHeaders[0].push('Rank', 'Comments');
  tableHeaders[1].push('', '');
  
  // Build table data
  const allSubjects = student.terms[0]?.subjects || [];
  const filteredSubjects = allSubjects.filter(s => 
    selectedSubjects.length === 0 || selectedSubjects.includes(s.subject)
  );
  
  const tableData: (string | number)[][] = [];
  
  filteredSubjects.forEach((subjectData) => {
    const row: (string | number)[] = [subjectData.subject];
    
    student.terms.forEach(term => {
      const mark = term.subjects.find(s => s.subject === subjectData.subject);
      const hasMtt = mark && mark.mtt > 0;
      const hasExam = mark && mark.exam > 0;
      row.push(
        hasMtt ? mark.mtt : '-', 
        hasExam ? mark.exam : '-', 
        mark?.total || '-'
      );
    });
    
    row.push(subjectData.rank || '-', ''); // Rank and Comments (blank)
    tableData.push(row);
  });
  
  // Total row
  const totalRow: (string | number)[] = ['Total'];
  student.terms.forEach(term => {
    const termMtt = term.subjects.reduce((sum, s) => sum + s.mtt, 0);
    const termExam = term.subjects.reduce((sum, s) => sum + s.exam, 0);
    totalRow.push(termMtt || '-', termExam || '-', term.totalMarks);
  });
  totalRow.push('', '');
  tableData.push(totalRow);
  
  // Average row
  const avgRow: (string | number)[] = ['Average', `${student.overallPercentage.toFixed(1)}%`];
  for (let i = 1; i < selectedSections.length * 3 - 1; i++) {
    if (i === 1) avgRow.push('Rank');
    else avgRow.push('');
  }
  avgRow.push(student.position.toString(), '');
  tableData.push(avgRow);
  
  // Calculate column widths dynamically
  const numTerms = selectedSections.length;
  const subjectColWidth = 35;
  const termColWidth = 10;
  const rankColWidth = 12;
  const commentsColWidth = 25;
  
  const columnStyles: Record<number, { cellWidth: number; halign?: 'left' | 'center' | 'right' }> = {
    0: { cellWidth: subjectColWidth, halign: 'left' },
  };
  
  for (let i = 1; i <= numTerms * 3; i++) {
    columnStyles[i] = { cellWidth: termColWidth, halign: 'center' };
  }
  columnStyles[numTerms * 3 + 1] = { cellWidth: rankColWidth, halign: 'center' };
  columnStyles[numTerms * 3 + 2] = { cellWidth: commentsColWidth, halign: 'left' };
  
  autoTable(doc, {
    startY: 62,
    head: [tableHeaders[0], tableHeaders[1]],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 7 },
    bodyStyles: { halign: 'center', textColor: [0, 0, 0] },
    columnStyles,
    didParseCell: (data) => {
      // Bold the total row
      if (data.row.index === tableData.length - 2) {
        data.cell.styles.fontStyle = 'bold';
      }
      // Style average row
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [248, 248, 248];
      }
    },
  });
  
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  
  // Observations and Signatures box - matching reference layout
  const boxY = finalY + 5;
  const boxHeight = 35;
  
  // Draw observation/signature box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(10, boxY, pageWidth - 20, boxHeight);
  
  // Vertical divider
  const dividerX = 10 + (pageWidth - 20) / 2;
  doc.line(dividerX, boxY, dividerX, boxY + boxHeight);
  
  // Horizontal divider for signatures
  doc.line(dividerX, boxY + boxHeight / 2, pageWidth - 10, boxY + boxHeight / 2);
  
  // Labels
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Observations', 12, boxY + 6);
  doc.text('Teacher Signature', dividerX + 3, boxY + 6);
  doc.text('Parent Signature', dividerX + 3, boxY + boxHeight / 2 + 6);
  
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFillColor(...primaryColor);
  doc.rect(0, footerY - 3, pageWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text('Generated by EDUBEL | Made with ❤️ by Belco | nzirorerabelico@gmail.com', pageWidth / 2, footerY + 3, { align: 'center' });
  
  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
