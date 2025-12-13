import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, SchoolData, TermSection, ReportCardStyle } from '@/types/reportCard';

interface GeneratePDFOptions {
  student: Student;
  school: SchoolData;
  totalStudents: number;
  classTeacher: string;
  selectedSubjects: string[];
  sections: TermSection[];
  hasMidterm: boolean;
  reportCardStyle: ReportCardStyle;
}

export async function generateStudentPDF(options: GeneratePDFOptions): Promise<jsPDF> {
  const { student, school, totalStudents, classTeacher, selectedSubjects, sections, hasMidterm, reportCardStyle } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const isBlackWhite = reportCardStyle === 'blackWhite';
  
  // Colors based on style
  const primaryColor: [number, number, number] = isBlackWhite ? [0, 0, 0] : [20, 184, 166];
  const headerBg: [number, number, number] = isBlackWhite ? [245, 245, 245] : [240, 253, 250];
  const textWhite: [number, number, number] = [255, 255, 255];
  const textBlack: [number, number, number] = [0, 0, 0];
  
  let currentY = 0;
  
  // Custom Detail - Top positions
  if (school.customDetail?.text && (school.customDetail.position === 'topLeft' || school.customDetail.position === 'topRight')) {
    doc.setFontSize(8);
    doc.setTextColor(...textBlack);
    const xPos = school.customDetail.position === 'topRight' ? pageWidth - 10 : 10;
    const align = school.customDetail.position === 'topRight' ? 'right' : 'left';
    doc.text(school.customDetail.text, xPos, 8, { align: align as 'left' | 'right' });
    currentY = 10;
  }
  
  // Header
  const headerY = currentY;
  doc.setFillColor(...primaryColor);
  doc.rect(0, headerY, pageWidth, 35, 'F');
  
  if (school.logo) {
    try {
      doc.addImage(school.logo, 'PNG', pageWidth - 40, headerY + 3, 30, 28);
    } catch (e) {
      console.log('Could not add logo');
    }
  }
  
  doc.setTextColor(...(isBlackWhite ? textBlack : textWhite));
  if (isBlackWhite) {
    doc.setFillColor(245, 245, 245);
    doc.rect(0, headerY, pageWidth, 35, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(0, headerY + 35, pageWidth, headerY + 35);
  }
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(school.name || 'School Name', 10, headerY + 14);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(school.address || 'School Address', 10, headerY + 21);
  doc.text(`Contact: ${school.contact || 'N/A'}`, 10, headerY + 27);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(school.termName || 'Term Report Card', pageWidth / 2, headerY + 33, { align: 'center' });
  
  currentY = headerY + 40;
  
  // Student Info
  doc.setTextColor(...textBlack);
  doc.setFillColor(...headerBg);
  doc.roundedRect(10, currentY, pageWidth - 20, 18, 2, 2, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Name:', 15, currentY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(student.fullName, 50, currentY + 8);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Conduct:', 15, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.conductMarks} / ${student.conductMax}`, 40, currentY + 14);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Class Teacher:', pageWidth / 2, currentY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(classTeacher || '________________', pageWidth / 2 + 30, currentY + 8);
  
  currentY += 22;
  
  // Build table headers - Dynamic based on hasMidterm
  const selectedSections = sections.filter(s => s.selected && s.parsedData);
  const tableHeaders: string[][] = [
    ['SUBJECTS'],
    [''],
  ];
  
  selectedSections.forEach(section => {
    if (hasMidterm) {
      tableHeaders[0].push(section.shortName, '', '');
      tableHeaders[1].push('TEST', 'EX', 'TOT');
    } else {
      tableHeaders[0].push(section.shortName, '');
      tableHeaders[1].push('EX', 'TOT');
    }
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
      
      if (hasMidterm) {
        row.push(
          hasMtt ? mark.mtt : '-', 
          hasExam ? mark.exam : '-', 
          mark?.total || '-'
        );
      } else {
        row.push(
          hasExam ? mark.exam : '-', 
          mark?.total || '-'
        );
      }
    });
    
    row.push(subjectData.rank || '-', '');
    tableData.push(row);
  });
  
  // Total row
  const totalRow: (string | number)[] = ['Total'];
  student.terms.forEach(term => {
    const termMtt = term.subjects.reduce((sum, s) => sum + s.mtt, 0);
    const termExam = term.subjects.reduce((sum, s) => sum + s.exam, 0);
    if (hasMidterm) {
      totalRow.push(termMtt || '-', termExam || '-', term.totalMarks);
    } else {
      totalRow.push(termExam || '-', term.totalMarks);
    }
  });
  totalRow.push('', '');
  tableData.push(totalRow);
  
  // Average row
  const avgRow: (string | number)[] = ['Average', `${student.overallPercentage.toFixed(1)}%`];
  const colsPerSection = hasMidterm ? 3 : 2;
  for (let i = 1; i < selectedSections.length * colsPerSection - 1; i++) {
    if (i === 1) avgRow.push('Rank');
    else avgRow.push('');
  }
  avgRow.push(student.position.toString(), '');
  tableData.push(avgRow);
  
  // Calculate column widths dynamically
  const numTerms = selectedSections.length;
  const subjectColWidth = 35;
  const termColWidth = hasMidterm ? 10 : 12;
  const rankColWidth = 12;
  const commentsColWidth = 25;
  
  const columnStyles: Record<number, { cellWidth: number; halign?: 'left' | 'center' | 'right' }> = {
    0: { cellWidth: subjectColWidth, halign: 'left' },
  };
  
  const totalCols = numTerms * colsPerSection;
  for (let i = 1; i <= totalCols; i++) {
    columnStyles[i] = { cellWidth: termColWidth, halign: 'center' };
  }
  columnStyles[totalCols + 1] = { cellWidth: rankColWidth, halign: 'center' };
  columnStyles[totalCols + 2] = { cellWidth: commentsColWidth, halign: 'left' };
  
  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders[0], tableHeaders[1]],
    body: tableData,
    theme: 'grid',
    styles: { 
      fontSize: 7, 
      cellPadding: 1.5, 
      lineColor: [0, 0, 0], 
      lineWidth: 0.2 
    },
    headStyles: { 
      fillColor: isBlackWhite ? [220, 220, 220] : [240, 240, 240], 
      textColor: [0, 0, 0], 
      fontStyle: 'bold', 
      halign: 'center', 
      fontSize: 7 
    },
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
        data.cell.styles.fillColor = isBlackWhite ? [235, 235, 235] : [248, 248, 248];
      }
    },
  });
  
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  
  // Observations and Signatures box
  const boxY = finalY + 5;
  const boxHeight = 35;
  
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
  
  // Custom Detail - Bottom positions
  if (school.customDetail?.text && (school.customDetail.position === 'bottomLeft' || school.customDetail.position === 'bottomRight')) {
    const bottomY = boxY + boxHeight + 8;
    doc.setFontSize(8);
    doc.setTextColor(...textBlack);
    const xPos = school.customDetail.position === 'bottomRight' ? pageWidth - 10 : 10;
    const align = school.customDetail.position === 'bottomRight' ? 'right' : 'left';
    doc.text(school.customDetail.text, xPos, bottomY, { align: align as 'left' | 'right' });
  }
  
  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
