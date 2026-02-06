import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, SchoolData, TermUpload, ReportCardStyle } from '@/types/reportCard';

interface GeneratePDFOptions {
  student: Student;
  school: SchoolData;
  totalStudents: number;
  selectedSubjects: string[];
  terms: TermUpload[];
  reportCardStyle: ReportCardStyle;
}

export async function generateStudentPDF(options: GeneratePDFOptions): Promise<jsPDF> {
  const { student, school, totalStudents, selectedSubjects, terms, reportCardStyle } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const isBlackWhite = reportCardStyle === 'blackWhite';
  
  // Colors based on style
  const primaryColor: [number, number, number] = isBlackWhite ? [0, 0, 0] : [20, 184, 166];
  const headerBg: [number, number, number] = isBlackWhite ? [245, 245, 245] : [240, 253, 250];
  const textWhite: [number, number, number] = [255, 255, 255];
  const textBlack: [number, number, number] = [0, 0, 0];
  
  let currentY = 0;
  
  // Ministry/Header at the very top (optional)
  if (school.ministryName) {
    doc.setFontSize(9);
    doc.setTextColor(...textBlack);
    doc.setFont('helvetica', 'bold');
    doc.text(school.ministryName, pageWidth / 2, 8, { align: 'center' });
    currentY = 12;
  }
  
  // Custom Detail - Top positions
  if (school.customDetail?.text && (school.customDetail.position === 'topLeft' || school.customDetail.position === 'topRight')) {
    doc.setFontSize(8);
    doc.setTextColor(...textBlack);
    doc.setFont('helvetica', 'normal');
    const xPos = school.customDetail.position === 'topRight' ? pageWidth - 10 : 10;
    const align = school.customDetail.position === 'topRight' ? 'right' : 'left';
    const yPos = currentY > 0 ? currentY + 4 : 8;
    doc.text(school.customDetail.text, xPos, yPos, { align: align as 'left' | 'right' });
    currentY = Math.max(currentY, yPos + 4);
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
  const termDisplay = school.className ? `${school.className} - ${school.termName || 'Term Report Card'}` : (school.termName || 'Term Report Card');
  doc.text(termDisplay, pageWidth / 2, headerY + 33, { align: 'center' });
  
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
  doc.text(school.classTeacher || '________________', pageWidth / 2 + 30, currentY + 8);
  
  currentY += 22;
  
  // Build table headers - New format with MAX columns first
  const selectedTerms = terms.filter(t => t.selected && (t.testParsedData || t.examParsedData));
  const hasThreeTerms = selectedTerms.length === 3;
  
  // Build header rows
  const headerRow1: string[] = ['SUBJECTS', 'MAX', '', ''];
  const headerRow2: string[] = ['', 'TEST', 'EX', 'TOT'];
  
  // Add term columns with rank
  selectedTerms.forEach(t => {
    headerRow1.push(t.shortName, '', '', 'Rank');
    headerRow2.push('TEST', 'EX', 'TOT', '');
  });
  
  // Add average columns if 3 terms
  if (hasThreeTerms) {
    headerRow1.push('AVERAGE', '', '');
    headerRow2.push('TEST', 'EX', 'TOT');
  }
  
  // Add final rank column
  headerRow1.push(hasThreeTerms ? 'Annual Rank' : 'Rank');
  headerRow2.push('');
  
  // Comments column
  headerRow1.push('Comments');
  headerRow2.push('');
  
  const tableHeaders: string[][] = [headerRow1, headerRow2];
  
  // Build table data
  const allSubjects = student.terms[0]?.subjects || [];
  const filteredSubjects = allSubjects.filter(s => 
    selectedSubjects.length === 0 || selectedSubjects.includes(s.subject)
  );
  
  const tableData: (string | number)[][] = [];
  
  filteredSubjects.forEach((subjectData) => {
    const row: (string | number)[] = [
      subjectData.subject,
      subjectData.maxMtt || '-',
      subjectData.maxExam || '-',
      subjectData.maxTotal || '-',
    ];
    
    student.terms.forEach(term => {
      const mark = term.subjects.find(s => s.subject === subjectData.subject);
      row.push(
        mark && mark.mtt > 0 ? mark.mtt : '-',
        mark && mark.exam > 0 ? mark.exam : '-',
        mark?.total || '-',
        '' // Placeholder for per-term rank (only shown in total row)
      );
    });
    
    // Add averages if 3 terms
    if (hasThreeTerms) {
      const avgData = student.subjectAverages?.find(a => a.subject === subjectData.subject);
      row.push(
        avgData?.avgTest || '-',
        avgData?.avgExam || '-',
        avgData?.avgTotal || '-'
      );
    }
    
    row.push(subjectData.rank || '-');
    row.push('');
    tableData.push(row);
  });
  
  // Total row
  const totalRow: (string | number)[] = [
    'Total',
    filteredSubjects.reduce((sum, s) => sum + (s.maxMtt || 0), 0) || '-',
    filteredSubjects.reduce((sum, s) => sum + (s.maxExam || 0), 0) || '-',
    filteredSubjects.reduce((sum, s) => sum + (s.maxTotal || 0), 0) || '-',
  ];
  
  student.terms.forEach(term => {
    const termMtt = term.subjects.reduce((sum, s) => sum + s.mtt, 0);
    const termExam = term.subjects.reduce((sum, s) => sum + s.exam, 0);
    totalRow.push(termMtt || '-', termExam || '-', term.totalMarks, term.termRank || '-');
  });
  
  if (hasThreeTerms) {
    const avgTestTotal = student.subjectAverages?.reduce((sum, s) => sum + s.avgTest, 0) || 0;
    const avgExamTotal = student.subjectAverages?.reduce((sum, s) => sum + s.avgExam, 0) || 0;
    const avgTotalTotal = student.subjectAverages?.reduce((sum, s) => sum + s.avgTotal, 0) || 0;
    totalRow.push(
      Math.round(avgTestTotal * 10) / 10 || '-',
      Math.round(avgExamTotal * 10) / 10 || '-',
      Math.round(avgTotalTotal * 10) / 10 || '-'
    );
  }
  
  totalRow.push('');
  totalRow.push('');
  tableData.push(totalRow);
  
  // Percentage/Average row
  const avgRow: (string | number)[] = ['Percentage', `${student.overallPercentage.toFixed(1)}%`, '', ''];
  
  selectedTerms.forEach(term => {
    const termData = student.terms.find(t => t.termId === term.id);
    avgRow.push(`${termData?.percentage.toFixed(1) || 0}%`, '', '', '');
  });
  
  if (hasThreeTerms) {
    const avgTotalSum = student.subjectAverages?.reduce((sum, s) => sum + s.avgTotal, 0) || 0;
    const avgMaxSum = filteredSubjects.reduce((sum, s) => sum + (s.maxTotal || 0), 0);
    const annualPercentage = avgMaxSum > 0 ? (avgTotalSum / avgMaxSum) * 100 : 0;
    avgRow.push(`${annualPercentage.toFixed(1)}%`, '', '');
  }
  
  avgRow.push(hasThreeTerms ? (student.annualRank || student.position).toString() : student.position.toString());
  avgRow.push('');
  tableData.push(avgRow);
  
  // Calculate column widths dynamically
  const numTerms = selectedTerms.length;
  const subjectColWidth = hasThreeTerms ? 22 : 28;
  const maxColWidth = 7;
  const termColWidth = 7;
  const rankColWidth = 8;
  const commentsColWidth = hasThreeTerms ? 12 : 18;
  
  const columnStyles: Record<number, { cellWidth: number; halign?: 'left' | 'center' | 'right' }> = {
    0: { cellWidth: subjectColWidth, halign: 'left' },
    1: { cellWidth: maxColWidth, halign: 'center' },
    2: { cellWidth: maxColWidth, halign: 'center' },
    3: { cellWidth: maxColWidth, halign: 'center' },
  };
  
  let colIdx = 4;
  for (let i = 0; i < numTerms; i++) {
    columnStyles[colIdx++] = { cellWidth: termColWidth, halign: 'center' };
    columnStyles[colIdx++] = { cellWidth: termColWidth, halign: 'center' };
    columnStyles[colIdx++] = { cellWidth: termColWidth, halign: 'center' };
    columnStyles[colIdx++] = { cellWidth: rankColWidth, halign: 'center' }; // Term rank
  }
  
  if (hasThreeTerms) {
    columnStyles[colIdx++] = { cellWidth: termColWidth, halign: 'center' };
    columnStyles[colIdx++] = { cellWidth: termColWidth, halign: 'center' };
    columnStyles[colIdx++] = { cellWidth: termColWidth, halign: 'center' };
  }
  
  columnStyles[colIdx++] = { cellWidth: rankColWidth, halign: 'center' }; // Annual/Overall rank
  columnStyles[colIdx] = { cellWidth: commentsColWidth, halign: 'left' };
  
  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders[0], tableHeaders[1]],
    body: tableData,
    theme: 'grid',
    styles: { 
      fontSize: hasThreeTerms ? 5 : 6, 
      cellPadding: 1, 
      lineColor: [0, 0, 0], 
      lineWidth: 0.2 
    },
    headStyles: { 
      fillColor: isBlackWhite ? [220, 220, 220] : [240, 240, 240], 
      textColor: [0, 0, 0], 
      fontStyle: 'bold', 
      halign: 'center', 
      fontSize: hasThreeTerms ? 5 : 6 
    },
    bodyStyles: { halign: 'center', textColor: [0, 0, 0] },
    columnStyles,
    didParseCell: (data) => {
      // Bold the total row
      if (data.row.index === tableData.length - 2) {
        data.cell.styles.fontStyle = 'bold';
      }
      // Style percentage row
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
