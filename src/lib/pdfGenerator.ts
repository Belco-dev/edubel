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
  const margin = 10;
  const totalAvailWidth = pageWidth - margin * 2;
  
  const primaryColor: [number, number, number] = isBlackWhite ? [0, 0, 0] : [20, 184, 166];
  const headerBg: [number, number, number] = isBlackWhite ? [245, 245, 245] : [240, 253, 250];
  const textWhite: [number, number, number] = [255, 255, 255];
  const textBlack: [number, number, number] = [0, 0, 0];
  
  let currentY = 0;
  
  // Number of students at the very top
  const numStudents = school.numberOfStudents || totalStudents;
  doc.setFontSize(8);
  doc.setTextColor(...textBlack);
  doc.setFont('helvetica', 'normal');
  doc.text(`Number of students ${numStudents}`, margin, 6);
  currentY = 8;
  
  // Ministry/Header
  if (school.ministryName) {
    doc.setFontSize(9);
    doc.setTextColor(...textBlack);
    doc.setFont('helvetica', 'bold');
    doc.text(school.ministryName, pageWidth / 2, currentY + 4, { align: 'center' });
    currentY += 8;
  }
  
  // Custom Details - Top positions
  const allDetails = [...(school.customDetail?.text ? [school.customDetail] : []), ...(school.customDetails || [])];
  const topDetails = allDetails.filter(d => d.text && (d.position === 'topLeft' || d.position === 'topRight'));
  topDetails.forEach(detail => {
    doc.setFontSize(8);
    doc.setTextColor(...textBlack);
    doc.setFont('helvetica', 'normal');
    const xPos = detail.position === 'topRight' ? pageWidth - margin : margin;
    const align = detail.position === 'topRight' ? 'right' : 'left';
    const yPos = currentY > 0 ? currentY + 4 : 8;
    doc.text(detail.text, xPos, yPos, { align: align as 'left' | 'right' });
    currentY = Math.max(currentY, yPos + 4);
  });
  
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
  doc.text(school.name || 'School Name', margin, headerY + 14);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(school.address || 'School Address', margin, headerY + 21);
  doc.text(`Contact: ${school.contact || 'N/A'}`, margin, headerY + 27);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const termDisplay = school.className ? `${school.className} - ${school.termName || 'Term Report Card'}` : (school.termName || 'Term Report Card');
  doc.text(termDisplay, pageWidth / 2, headerY + 33, { align: 'center' });
  
  currentY = headerY + 40;
  
  // Student Info
  doc.setTextColor(...textBlack);
  doc.setFillColor(...headerBg);
  doc.roundedRect(margin, currentY, totalAvailWidth, 18, 2, 2, 'F');
  
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
  
  // Build table
  const selectedTerms = terms.filter(t => t.selected && (t.testParsedData || t.examParsedData));
  const numTerms = selectedTerms.length;
  const hasThreeTerms = numTerms === 3;
  
  // Header rows - with Rank column per term
  const headerRow1: string[] = ['SUBJECTS', 'MAX', '', ''];
  const headerRow2: string[] = ['', 'TEST', 'EX', 'TOT'];
  
  selectedTerms.forEach(t => {
    headerRow1.push(t.shortName, '', '', '');
    headerRow2.push('TEST', 'EX', 'TOT', 'Rank');
  });
  
  if (hasThreeTerms) {
    headerRow1.push('AVERAGE', '', '');
    headerRow2.push('TEST', 'EX', 'TOT');
  }
  
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
        mark?.rank || '-',
      );
    });
    
    if (hasThreeTerms) {
      const avgData = student.subjectAverages?.find(a => a.subject === subjectData.subject);
      row.push(
        avgData?.avgTest || '-',
        avgData?.avgExam || '-',
        avgData?.avgTotal || '-'
      );
    }
    
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
    totalRow.push(termMtt || '-', termExam || '-', term.totalMarks, '');
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
  tableData.push(totalRow);
  
  // Percentage row
  const pctRow: (string | number)[] = ['Percentage', '', '', ''];
  
  student.terms.forEach(term => {
    pctRow.push('', '', `${term.percentage.toFixed(1)}%`, '');
  });
  
  if (hasThreeTerms) {
    const avgTotalSum = student.subjectAverages?.reduce((sum, s) => sum + s.avgTotal, 0) || 0;
    const avgMaxSum = filteredSubjects.reduce((sum, s) => sum + (s.maxTotal || 0), 0);
    const annualPercentage = avgMaxSum > 0 ? (avgTotalSum / avgMaxSum) * 100 : 0;
    pctRow.push('', '', `${annualPercentage.toFixed(1)}%`);
  }
  
  pctRow.push('');
  tableData.push(pctRow);
  
  // Rank row - term rank goes in Rank column
  const rankRow: (string | number)[] = ['Rank', '', '', ''];
  
  student.terms.forEach(term => {
    rankRow.push('', '', '', term.termRank || '-');
  });
  
  if (hasThreeTerms) {
    rankRow.push('', '', student.annualRank || student.position);
  }
  
  rankRow.push('');
  tableData.push(rankRow);
  
  // Calculate column widths to fill the full available width
  // Columns: SUBJECTS(1) + MAX(3) + per-term(4: TEST,EX,TOT,Rank) + AVG(3 if 3 terms) + Comments(1)
  const numCols = 4 + numTerms * 4 + (hasThreeTerms ? 3 : 0) + 1;
  
  // Give proportional widths
  const subjectPct = 0.14;
  const commentsPct = 0.07;
  const subjectColWidth = totalAvailWidth * subjectPct;
  const commentsColWidth = totalAvailWidth * commentsPct;
  const remainingWidth = totalAvailWidth - subjectColWidth - commentsColWidth;
  const numDataCols = numCols - 2; // all except SUBJECTS and Comments
  const dataColWidth = remainingWidth / numDataCols;
  
  const columnStyles: Record<number, { cellWidth: number; halign?: 'left' | 'center' | 'right' }> = {
    0: { cellWidth: subjectColWidth, halign: 'left' },
  };
  
  for (let i = 1; i < numCols - 1; i++) {
    columnStyles[i] = { cellWidth: dataColWidth, halign: 'center' };
  }
  
  columnStyles[numCols - 1] = { cellWidth: commentsColWidth, halign: 'left' };
  
  const fontSize = hasThreeTerms ? 5 : (numTerms === 2 ? 5.5 : 6);
  
  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders[0], tableHeaders[1]],
    body: tableData,
    theme: 'grid',
    tableWidth: totalAvailWidth,
    margin: { left: margin, right: margin },
    styles: { 
      fontSize, 
      cellPadding: 1, 
      lineColor: [0, 0, 0], 
      lineWidth: 0.2 
    },
    headStyles: { 
      fillColor: isBlackWhite ? [220, 220, 220] : [240, 240, 240], 
      textColor: [0, 0, 0], 
      fontStyle: 'bold', 
      halign: 'center', 
      fontSize 
    },
    bodyStyles: { halign: 'center', textColor: [0, 0, 0] },
    columnStyles,
    didParseCell: (data) => {
      if (data.row.index === tableData.length - 3) {
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.row.index === tableData.length - 2) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = isBlackWhite ? [235, 235, 235] : [248, 248, 248];
      }
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = isBlackWhite ? [230, 230, 230] : [245, 245, 245];
      }
    },
  });
  
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  
  // Observations and Signatures box - same width as table
  const boxY = finalY + 5;
  const boxHeight = 35;
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(margin, boxY, totalAvailWidth, boxHeight);
  
  const dividerX = margin + totalAvailWidth / 2;
  doc.line(dividerX, boxY, dividerX, boxY + boxHeight);
  doc.line(dividerX, boxY + boxHeight / 2, margin + totalAvailWidth, boxY + boxHeight / 2);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Observations', margin + 2, boxY + 6);
  doc.text('Teacher Signature', dividerX + 3, boxY + 6);
  doc.text('Parent Signature', dividerX + 3, boxY + boxHeight / 2 + 6);
  
  // Custom Details - Bottom positions
  const bottomDetails = allDetails.filter(d => d.text && (d.position === 'bottomLeft' || d.position === 'bottomRight'));
  let bottomY = boxY + boxHeight + 8;
  bottomDetails.forEach(detail => {
    doc.setFontSize(8);
    doc.setTextColor(...textBlack);
    const xPos = detail.position === 'bottomRight' ? pageWidth - margin : margin;
    const align = detail.position === 'bottomRight' ? 'right' : 'left';
    doc.text(detail.text, xPos, bottomY, { align: align as 'left' | 'right' });
    bottomY += 5;
  });
  
  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
