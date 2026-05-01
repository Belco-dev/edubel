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
    classTeacher: 'Head Teacher:',
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

// Convert a logo data URL to grayscale (for black & white report cards) and
// strip any transparent padding so the on-paper logo has no extra boundary
// regardless of crop shape.
async function processLogo(dataUrl: string, blackAndWhite: boolean): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0);
        if (blackAndWhite) {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            d[i] = d[i + 1] = d[i + 2] = gray;
          }
          ctx.putImageData(imgData, 0, 0);
        }
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
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

  // Split fields: school info (top) vs student/class context (under title)
  const schoolFields = fieldOrder.filter(id =>
    SCHOOL_HEADER_FIELDS.includes(id) && getFieldValue(school, id).trim() !== ''
  );
  const contextFields = fieldOrder.filter(id =>
    STUDENT_CONTEXT_FIELDS.includes(id) && getFieldValue(school, id).trim() !== ''
  );

  // Custom Details
  const allDetails = [...(school.customDetail?.text ? [school.customDetail] : []), ...(school.customDetails || [])];
  const topDetails = allDetails.filter(d => d.text && (d.position === 'topLeft' || d.position === 'topRight'));
  const bottomDetails = allDetails.filter(d => d.text && (d.position === 'bottomLeft' || d.position === 'bottomRight'));

  // Render top custom details first (outside the boundary box)
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

  // ===== SINGLE BOUNDARY BOX enclosing entire report card header =====
  const boxStartY = currentY;
  const boxPadding = 5;

  // Compute heights — logo wants up to 34mm so reserve enough vertical space
  const schoolLineHeight = 5.5;
  const minLogoSlot = school.logo ? 36 : 0;
  const schoolTextHeight = boxPadding + schoolFields.length * schoolLineHeight + 3;
  const schoolBlockHeight = Math.max(schoolTextHeight, minLogoSlot);
  const titleBlockHeight = 14; // REPORT CARD with two boundary lines
  const hasDateOfBirth = !!student.dateOfBirth;
  // Student name row + (conduct/born row) + (class/teacher/students row)
  const studentLines = 1 + 1 + Math.max(1, Math.ceil(contextFields.length / 2));
  const studentBlockHeight = studentLines * 6 + boxPadding + 2;

  const totalBoxHeight = schoolBlockHeight + titleBlockHeight + studentBlockHeight;

  // Draw the outer boundary box (rounded corners matching marks table style)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, boxStartY, totalAvailWidth, totalBoxHeight, 2, 2, 'S');

  // ----- School info block (top) -----
  doc.setTextColor(...textBlack);
  let schoolY = boxStartY + boxPadding + 2;
  // Bigger, clearly readable logo on the right side. No bounding box drawn —
  // jsPDF.addImage preserves the original PNG transparency so any non-square
  // crop sits naturally on the page without an extra border.
  const logoSize = school.logo ? Math.min(schoolBlockHeight - 4, 34) : 0;
  const logoX = pageWidth - margin - logoSize - 2;
  if (school.logo) {
    try {
      const processedLogo = await processLogo(school.logo, isBlackWhite);
      doc.addImage(processedLogo, 'PNG', logoX, boxStartY + 2, logoSize, logoSize);
    } catch {
      // ignore
    }
  }
  const schoolTextMaxWidth = (school.logo ? logoX - margin - 4 : totalAvailWidth - 6);

  schoolFields.forEach(id => {
    const value = getFieldValue(school, id);
    const label = getFieldLabel(id);
    const displayText = label ? `${label} ${value}` : value;

    let baseFontSize = 9;
    let fontStyle: 'bold' | 'normal' = 'normal';
    if (id === 'name') { baseFontSize = 14; fontStyle = 'bold'; }
    else if (id === 'ministryName') { baseFontSize = 9; fontStyle = 'bold'; }

    doc.setFont('helvetica', fontStyle);
    autoFitText(doc, displayText, schoolTextMaxWidth, baseFontSize);
    doc.text(displayText, margin + 3, schoolY);
    schoolY += id === 'name' ? 6.5 : schoolLineHeight;
  });

  // ----- REPORT CARD title with two boundary lines -----
  const titleY = boxStartY + schoolBlockHeight;
  // Top boundary line (full width across the box)
  doc.setLineWidth(0.6);
  doc.line(margin, titleY, margin + totalAvailWidth, titleY);
  // Title text
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...textBlack);
  doc.text('REPORT CARD', pageWidth / 2, titleY + 9, { align: 'center' });
  // Bottom boundary line
  doc.line(margin, titleY + titleBlockHeight, margin + totalAvailWidth, titleY + titleBlockHeight);

  // ----- Student / class context block (below title) -----
  const ctxStartY = titleY + titleBlockHeight;
  let ctxY = ctxStartY + 6;
  const halfBoxWidth = totalAvailWidth / 2 - 6;
  const rightX = margin + totalAvailWidth / 2 + 2;

  // Row 1: Student Name (full width)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const sLabel = 'Student Name: ';
  doc.text('Student Name:', margin + 3, ctxY);
  const sLabelW = doc.getTextWidth(sLabel);
  doc.setFont('helvetica', 'normal');
  autoFitText(doc, student.fullName, totalAvailWidth - sLabelW - 8, 10);
  doc.text(student.fullName, margin + 3 + sLabelW, ctxY);
  doc.setFontSize(10);
  ctxY += 6;

  // Row 2: Conduct (left) + Born at (right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Conduct:', margin + 3, ctxY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.conductMarks} / ${student.conductMax}`, margin + 3 + doc.getTextWidth('Conduct: '), ctxY);
  if (hasDateOfBirth) {
    doc.setFont('helvetica', 'bold');
    doc.text('Born at:', rightX, ctxY);
    doc.setFont('helvetica', 'normal');
    doc.text(student.dateOfBirth || '', rightX + doc.getTextWidth('Born at: '), ctxY);
  }
  ctxY += 6;

  // Remaining context fields (Class, Class Teacher, N. Students) - 2 per row
  for (let i = 0; i < contextFields.length; i += 2) {
    const leftId = contextFields[i];
    const rightId = contextFields[i + 1];
    const drawField = (id: string, x: number) => {
      const label = getFieldLabel(id);
      const val = getFieldValue(school, id);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(label, x, ctxY);
      const lw = doc.getTextWidth(label + ' ');
      doc.setFont('helvetica', 'normal');
      autoFitText(doc, val, halfBoxWidth - lw, 9);
      doc.text(val, x + lw, ctxY);
      doc.setFontSize(9);
    };
    if (leftId) drawField(leftId, margin + 3);
    if (rightId) drawField(rightId, rightX);
    ctxY += 6;
  }

  currentY = boxStartY + totalBoxHeight + 4;


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
      cellPadding: 1.6,
      minCellHeight: 5.5,
      valign: 'middle',
      lineColor: [0, 0, 0],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: isBlackWhite ? [220, 220, 220] : [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      minCellHeight: 5,
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
