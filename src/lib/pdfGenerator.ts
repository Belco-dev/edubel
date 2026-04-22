import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, SchoolData, TermUpload, ReportCardStyle, GradingRule } from '@/types/reportCard';
import { getAutoComment } from '@/components/GradingSystem';

interface GeneratePDFOptions {
  student: Student;
  school: SchoolData;
  totalStudents: number;
  selectedSubjects: string[];
  terms: TermUpload[];
  reportCardStyle: ReportCardStyle;
  gradingRules: GradingRule[];
}

const DEFAULT_FIELD_ORDER = [
  'ministryName', 'name', 'address', 'contact',
  'className', 'classTeacher', 'termName', 'numberOfStudents'
];

// Fields that appear ABOVE the REPORT CARD title (general school info)
const SCHOOL_HEADER_FIELDS = ['ministryName', 'name', 'address', 'contact', 'termName'];
// Fields that appear BELOW the title (student/class context)
const STUDENT_CONTEXT_FIELDS = ['className', 'classTeacher', 'numberOfStudents'];

function getFieldValue(data: SchoolData, id: string): string {
  switch (id) {
    case 'ministryName': return data.ministryName || '';
    case 'name': return data.name || '';
    case 'address': return data.address || '';
    case 'contact': return data.contact ? `Contact: ${data.contact}` : '';
    case 'className': return data.className || '';
    case 'classTeacher': return data.classTeacher || '';
    case 'termName': return data.termName || '';
    case 'numberOfStudents': return data.numberOfStudents?.toString() || '';
    default: return '';
  }
}

function getFieldLabel(id: string): string {
  const labels: Record<string, string> = {
    ministryName: '',
    name: '',
    address: '',
    contact: '',
    className: 'Class:',
    classTeacher: 'Class Teacher:',
    termName: 'Term:',
    numberOfStudents: 'Number of Students:',
  };
  return labels[id] ?? '';
}

// Auto-fit text: reduce font size if text exceeds maxWidth
function autoFitText(doc: jsPDF, text: string, maxWidth: number, startSize: number, minSize: number = 5): number {
  let size = startSize;
  doc.setFontSize(size);
  while (doc.getTextWidth(text) > maxWidth && size > minSize) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  return size;
}

export async function generateStudentPDF(options: GeneratePDFOptions): Promise<jsPDF> {
  const { student, school, totalStudents, selectedSubjects, terms, reportCardStyle, gradingRules } = options;
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
  
  // Get field order
  const fieldOrder = school.fieldOrder || DEFAULT_FIELD_ORDER;
  
  // Collect filled fields in order
  const filledFields = fieldOrder.filter(id => {
    const val = getFieldValue(school, id);
    return val.trim() !== '';
  });
  
  // Custom Details
  const allDetails = [...(school.customDetail?.text ? [school.customDetail] : []), ...(school.customDetails || [])];
  const topDetails = allDetails.filter(d => d.text && (d.position === 'topLeft' || d.position === 'topRight'));
  const bottomDetails = allDetails.filter(d => d.text && (d.position === 'bottomLeft' || d.position === 'bottomRight'));
  
  // Render top custom details first
  currentY = 5;
  topDetails.forEach(detail => {
    doc.setFontSize(8);
    doc.setTextColor(...textBlack);
    doc.setFont('helvetica', 'normal');
    const xPos = detail.position === 'topRight' ? pageWidth - margin : margin;
    const align = detail.position === 'topRight' ? 'right' : 'left';
    doc.text(detail.text, xPos, currentY + 4, { align: align as 'left' | 'right' });
    currentY += 5;
  });
  
  // Header background with rounded corners
  const headerStartY = currentY;
  // Calculate header height based on number of filled fields
  const headerLineHeight = 5.5;
  const headerPadding = 8;
  const headerHeight = Math.max(35, headerPadding + filledFields.length * headerLineHeight + 4);
  
  if (isBlackWhite) {
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin / 2, headerStartY, pageWidth - margin, headerHeight, 3, 3, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin / 2, headerStartY + headerHeight, pageWidth - margin / 2, headerStartY + headerHeight);
  } else {
    doc.setFillColor(...primaryColor);
    doc.roundedRect(margin / 2, headerStartY, pageWidth - margin, headerHeight, 3, 3, 'F');
  }
  
  // Logo
  if (school.logo) {
    try {
      doc.addImage(school.logo, 'PNG', pageWidth - 40, headerStartY + 3, 30, Math.min(28, headerHeight - 6));
    } catch (e) {
      console.log('Could not add logo');
    }
  }
  
  doc.setTextColor(...(isBlackWhite ? textBlack : textWhite));
  
  // Render header fields in order
  let headerTextY = headerStartY + headerPadding;
  const maxTextWidth = school.logo ? pageWidth - margin - 45 : pageWidth - margin * 2 - 5;
  
  filledFields.forEach(id => {
    const value = getFieldValue(school, id);
    const label = getFieldLabel(id);
    const displayText = label ? `${label} ${value}` : value;
    
    // Determine font size based on field type
    let baseFontSize = 9;
    let fontStyle: 'bold' | 'normal' = 'normal';
    
    if (id === 'name') {
      baseFontSize = 16;
      fontStyle = 'bold';
    } else if (id === 'ministryName') {
      baseFontSize = 9;
      fontStyle = 'bold';
    }
    
    doc.setFont('helvetica', fontStyle);
    const usedSize = autoFitText(doc, displayText, maxTextWidth, baseFontSize);
    doc.text(displayText, margin, headerTextY);
    
    headerTextY += id === 'name' ? 7 : headerLineHeight;
  });
  
  currentY = headerStartY + headerHeight + 4;
  
  // Student Info with collision prevention
  doc.setTextColor(...textBlack);
  doc.setFillColor(...headerBg);

  // Calculate student info box height based on whether dateOfBirth exists
  const hasDateOfBirth = !!student.dateOfBirth;
  const studentInfoHeight = hasDateOfBirth ? 24 : 18;
  doc.roundedRect(margin, currentY, totalAvailWidth, studentInfoHeight, 2, 2, 'F');
  
  const halfWidth = totalAvailWidth / 2 - 5;
  
  // Left side: Student Name (auto-fit)
  const studentLabel = 'Student Name: ';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const labelWidth = doc.getTextWidth(studentLabel);
  
  doc.setFont('helvetica', 'bold');
  autoFitText(doc, studentLabel, halfWidth, 10);
  doc.text('Student Name:', margin + 3, currentY + 8);
  
  doc.setFont('helvetica', 'normal');
  const nameMaxWidth = halfWidth - labelWidth - 2;
  autoFitText(doc, student.fullName, nameMaxWidth > 10 ? nameMaxWidth : halfWidth * 0.6, 10);
  doc.text(student.fullName, margin + 3 + labelWidth, currentY + 8);
  
  // Right side: Class Teacher (auto-fit)
  const rightX = margin + totalAvailWidth / 2 + 2;
  const teacherLabel = 'Class Teacher: ';
  const teacherName = school.classTeacher || '________________';
  
  doc.setFont('helvetica', 'bold');
  autoFitText(doc, teacherLabel, halfWidth, 10);
  const teacherLabelWidth = doc.getTextWidth(teacherLabel);
  doc.text(teacherLabel, rightX, currentY + 8);
  
  doc.setFont('helvetica', 'normal');
  const teacherNameMaxWidth = halfWidth - teacherLabelWidth - 2;
  autoFitText(doc, teacherName, teacherNameMaxWidth > 10 ? teacherNameMaxWidth : halfWidth * 0.6, 10);
  doc.text(teacherName, rightX + teacherLabelWidth, currentY + 8);
  
  // Conduct & Born at row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Conduct:', margin + 3, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.conductMarks} / ${student.conductMax}`, margin + 3 + doc.getTextWidth('Conduct: '), currentY + 14);

  if (hasDateOfBirth) {
    doc.setFont('helvetica', 'bold');
    doc.text('Born at:', rightX, currentY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(student.dateOfBirth || '', rightX + doc.getTextWidth('Born at: '), currentY + 14);
  }
  
  currentY += studentInfoHeight + 4;
  
  // Build table
  const selectedTerms = terms.filter(t => t.selected && (t.testParsedData || t.examParsedData));
  const numTerms = selectedTerms.length;
  const hasThreeTerms = numTerms === 3;
  
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
  
  // Rank row
  const rankRow: (string | number)[] = ['Rank', '', '', ''];
  
  student.terms.forEach(term => {
    rankRow.push('', '', '', term.termRank || '-');
  });
  
  if (hasThreeTerms) {
    rankRow.push('', '', student.annualRank || student.position);
  }
  
  rankRow.push('');
  tableData.push(rankRow);
  
  // Column widths
  const numCols = 4 + numTerms * 4 + (hasThreeTerms ? 3 : 0) + 1;
  
  const subjectPct = 0.14;
  const commentsPct = 0.07;
  const subjectColWidth = totalAvailWidth * subjectPct;
  const commentsColWidth = totalAvailWidth * commentsPct;
  const remainingWidth = totalAvailWidth - subjectColWidth - commentsColWidth;
  const numDataCols = numCols - 2;
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
  
  // Observations and Signatures box
  const boxY = finalY + 5;
  const isAnnual = hasThreeTerms;
  const boxHeight = isAnnual ? 40 : 35;
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, boxY, totalAvailWidth, boxHeight, 2, 2);
  
  const dividerX = margin + totalAvailWidth / 2;
  doc.line(dividerX, boxY, dividerX, boxY + boxHeight);
  doc.line(dividerX, boxY + boxHeight / 2, margin + totalAvailWidth, boxY + boxHeight / 2);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Observations', margin + 2, boxY + 6);

  // Auto-comment based on grading rules
  // Use last term's percentage for the comment
  const lastTerm = student.terms[student.terms.length - 1];
  const commentPercentage = lastTerm?.percentage || 0;
  const autoComment = getAutoComment(commentPercentage, gradingRules);
  
  if (autoComment) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(autoComment, margin + 2, boxY + 12);
  }

  // For annual report cards, add Promoted/Repeated checkboxes
  if (isAnnual) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const checkY = boxY + 18;
    // Promoted checkbox
    doc.rect(margin + 2, checkY - 2.5, 3, 3);
    doc.text('Promoted', margin + 6, checkY);
    // Repeated checkbox
    doc.rect(margin + 30, checkY - 2.5, 3, 3);
    doc.text('Repeated', margin + 34, checkY);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Teacher Signature', dividerX + 3, boxY + 6);
  doc.text('Parent Signature', dividerX + 3, boxY + boxHeight / 2 + 6);
  
  // Bottom custom details
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
