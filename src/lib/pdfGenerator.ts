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
  
  // Build table headers
  const selectedSections = sections.filter(s => s.selected && s.parsedData);
  const tableHeaders: string[][] = [
    ['#', 'Subject'],
    ['', ''],
  ];
  
  selectedSections.forEach(section => {
    tableHeaders[0].push(section.shortName, '', '');
    tableHeaders[1].push('MTT', 'EXM', 'TOT');
  });
  tableHeaders[0].push('Total');
  tableHeaders[1].push('');
  
  // Build table data
  const allSubjects = student.terms[0]?.subjects || [];
  const filteredSubjects = allSubjects.filter(s => 
    selectedSubjects.length === 0 || selectedSubjects.includes(s.subject)
  );
  
  const tableData: (string | number)[][] = [];
  
  filteredSubjects.forEach((subjectData, index) => {
    const row: (string | number)[] = [index + 1, subjectData.subject];
    let rowTotal = 0;
    
    student.terms.forEach(term => {
      const mark = term.subjects.find(s => s.subject === subjectData.subject);
      row.push(mark?.mtt || 0, mark?.exam || 0, mark?.total || 0);
      if (mark) rowTotal += mark.total;
    });
    
    row.push(rowTotal);
    tableData.push(row);
  });
  
  // Total row
  const totalRow: (string | number)[] = ['', 'TOTAL'];
  let grandTotal = 0;
  student.terms.forEach(term => {
    const termMtt = term.subjects.reduce((sum, s) => sum + s.mtt, 0);
    const termExam = term.subjects.reduce((sum, s) => sum + s.exam, 0);
    totalRow.push(termMtt, termExam, term.totalMarks);
    grandTotal += term.totalMarks;
  });
  totalRow.push(grandTotal);
  tableData.push(totalRow);
  
  // Calculate column widths dynamically
  const numTerms = selectedSections.length;
  const fixedWidth = 10 + 35; // # + Subject columns
  const totalColWidth = 18;
  const termColWidth = Math.min(15, (pageWidth - 20 - fixedWidth - totalColWidth) / (numTerms * 3));
  
  const columnStyles: Record<number, { cellWidth: number; halign?: 'left' | 'center' | 'right' }> = {
    0: { cellWidth: 8, halign: 'center' },
    1: { cellWidth: 35, halign: 'left' },
  };
  
  for (let i = 2; i < 2 + numTerms * 3; i++) {
    columnStyles[i] = { cellWidth: termColWidth, halign: 'center' };
  }
  columnStyles[2 + numTerms * 3] = { cellWidth: totalColWidth, halign: 'center' };
  
  autoTable(doc, {
    startY: 62,
    head: [tableHeaders[0], tableHeaders[1]],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 7 },
    bodyStyles: { halign: 'center' },
    columnStyles,
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [226, 232, 240];
      }
    },
  });
  
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  
  // Position, Percentage, Grade - Below Table
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(10, finalY + 5, pageWidth - 20, 18, 2, 2, 'F');
  
  const gradeColor = getGradeColor(student.overallPercentage);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Position:', 15, finalY + 12);
  doc.setTextColor(...gradeColor);
  doc.text(`${student.position} / ${totalStudents}`, 38, finalY + 12);
  
  doc.setTextColor(0, 0, 0);
  doc.text('Percentage:', 65, finalY + 12);
  doc.setTextColor(...gradeColor);
  doc.text(`${student.overallPercentage.toFixed(1)}%`, 95, finalY + 12);
  
  doc.setTextColor(0, 0, 0);
  doc.text('Grade:', 125, finalY + 12);
  doc.setTextColor(...gradeColor);
  doc.text(getGrade(student.overallPercentage), 145, finalY + 12);
  
  doc.setTextColor(0, 0, 0);
  doc.text('Total:', 165, finalY + 12);
  doc.text(`${student.grandTotal}`, 182, finalY + 12);
  
  // Teacher's Remark - Blank
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(10, finalY + 28, pageWidth - 20, 22, 2, 2, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("Teacher's Remark:", 15, finalY + 36);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(15, finalY + 43, pageWidth - 15, finalY + 43);
  
  // Signatures
  const signatureY = finalY + 58;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  
  doc.line(15, signatureY + 12, 60, signatureY + 12);
  doc.setFontSize(8);
  doc.text('Class Teacher', 27, signatureY + 18);
  
  doc.line(75, signatureY + 12, 125, signatureY + 12);
  doc.text('Head Teacher', 88, signatureY + 18);
  
  doc.line(140, signatureY + 12, pageWidth - 15, signatureY + 12);
  doc.text('Parent/Guardian', 150, signatureY + 18);
  
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
