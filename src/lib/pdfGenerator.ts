import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, SchoolData, TermUpload, ReportCardStyle, GradingRule, ReportCardTemplate } from '@/types/reportCard';
import { getAutoComment } from '@/components/GradingSystem';

interface GeneratePDFOptions {
  student: Student;
  school: SchoolData;
  totalStudents: number;
  selectedSubjects: string[];
  terms: TermUpload[];
  reportCardStyle: ReportCardStyle;
  gradingRules: GradingRule[];
  template?: ReportCardTemplate;
}

// Region into which a single report card is rendered. Allows the same drawing
// code to render full A4 portrait OR a half of a landscape A4 (duo template).
interface RegionLayout {
  ox: number;        // x offset on the page (mm)
  oy: number;        // y offset on the page (mm)
  width: number;     // region width (mm)
  height: number;    // region height (mm)
  scale: number;     // uniform scale factor applied to all sizes/coords
  drawFooter: boolean; // whether to draw the generation footer inside region
  boldBody?: boolean;  // bolder body text for visibility after compression
}

interface TemplateTheme {
  accent: [number, number, number];
  headerFill: [number, number, number];
  tableHeadFill: [number, number, number];
  titleFont: 'times' | 'helvetica';
}

function getTemplateTheme(t: ReportCardTemplate, isBW: boolean): TemplateTheme {
  if (isBW) {
    return { accent: [0, 0, 0], headerFill: [245, 245, 245], tableHeadFill: [220, 220, 220], titleFont: 'times' };
  }
  switch (t) {
    case 'modern':
      return { accent: [99, 102, 241], headerFill: [238, 242, 255], tableHeadFill: [224, 231, 255], titleFont: 'helvetica' };
    case 'elegant':
      return { accent: [136, 19, 55], headerFill: [253, 244, 236], tableHeadFill: [253, 230, 211], titleFont: 'times' };
    case 'minimal':
      return { accent: [71, 85, 105], headerFill: [248, 250, 252], tableHeadFill: [241, 245, 249], titleFont: 'helvetica' };
    case 'duo':
    case 'classic':
    default:
      return { accent: [20, 184, 166], headerFill: [240, 253, 250], tableHeadFill: [240, 240, 240], titleFont: 'times' };
  }
}

const DEFAULT_FIELD_ORDER = [
  'ministryName', 'name', 'address', 'contact',
  'academicYear', 'className', 'classTeacher', 'termName', 'numberOfStudents'
];
const SCHOOL_HEADER_FIELDS = ['ministryName', 'name', 'address', 'contact', 'termName'];
const STUDENT_CONTEXT_FIELDS = ['className', 'classTeacher', 'academicYear', 'numberOfStudents'];

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
    case 'academicYear': return data.academicYear || '';
    default: return '';
  }
}
function getFieldLabel(id: string): string {
  const labels: Record<string, string> = {
    ministryName: '', name: '', address: '', contact: '',
    className: 'Class:', classTeacher: 'Head Teacher:', termName: 'Term:',
    numberOfStudents: 'Number of Students:', academicYear: 'Academic Year:',
  };
  return labels[id] ?? '';
}

function autoFitText(doc: jsPDF, text: string, maxWidth: number, startSize: number, minSize: number = 4): number {
  let size = startSize;
  doc.setFontSize(size);
  while (doc.getTextWidth(text) > maxWidth && size > minSize) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  return size;
}

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
      } catch { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Draw a single student's report card into a region of the given doc.
 * All hardcoded mm sizes are multiplied by `layout.scale` so the same
 * design works at full A4 or compressed onto half of a landscape page.
 */
async function drawStudentReport(
  doc: jsPDF,
  options: GeneratePDFOptions,
  layout: RegionLayout
): Promise<void> {
  const { student, school, selectedSubjects, terms, reportCardStyle, gradingRules } = options;
  const template: ReportCardTemplate = options.template || 'classic';
  const { ox, oy, width: regionW, height: regionH, scale: s, drawFooter, boldBody } = layout;

  const isBlackWhite = reportCardStyle === 'blackWhite';
  const margin = 10 * s;
  const totalAvailWidth = regionW - margin * 2;
  const rightEdge = ox + regionW - margin;
  const leftEdge = ox + margin;

  const theme = getTemplateTheme(template, isBlackWhite);
  const primaryColor = theme.accent;
  const textBlack: [number, number, number] = [0, 0, 0];

  const fieldOrder = school.fieldOrder || DEFAULT_FIELD_ORDER;
  const schoolFields = fieldOrder.filter(id =>
    SCHOOL_HEADER_FIELDS.includes(id) && getFieldValue(school, id).trim() !== ''
  );
  const contextFields = fieldOrder.filter(id =>
    STUDENT_CONTEXT_FIELDS.includes(id) && getFieldValue(school, id).trim() !== ''
  );

  const allDetails = [...(school.customDetail?.text ? [school.customDetail] : []), ...(school.customDetails || [])];
  const topDetails = allDetails.filter(d => d.text && (d.position === 'topLeft' || d.position === 'topRight'));
  const bottomDetails = allDetails.filter(d => d.text && (d.position === 'bottomLeft' || d.position === 'bottomRight'));

  let currentY = oy + 5 * s;

  topDetails.forEach(detail => {
    doc.setFontSize(9.5 * s);
    doc.setTextColor(...textBlack);
    doc.setFont('helvetica', 'normal');
    const xPos = detail.position === 'topRight' ? rightEdge : leftEdge;
    const align = detail.position === 'topRight' ? 'right' : 'left';
    doc.text(detail.text, xPos, currentY + 4 * s, { align: align as 'left' | 'right' });
    currentY += 5 * s;
  });

  // ===== Boundary box header =====
  const boxStartY = currentY;
  const boxPadding = 5 * s;
  const schoolLineHeight = 5.5 * s;
  const minLogoSlot = school.logo ? 36 * s : 0;
  const schoolTextHeight = boxPadding + schoolFields.length * schoolLineHeight + 3 * s;
  const schoolBlockHeight = Math.max(schoolTextHeight, minLogoSlot);
  const titleBlockHeight = 14 * s;
  const hasDateOfBirth = !!student.dateOfBirth;
  const studentLines = 1 + 1 + Math.max(1, Math.ceil(contextFields.length / 2));
  const studentBlockHeight = studentLines * 6 * s + boxPadding + 2 * s;
  const totalBoxHeight = schoolBlockHeight + titleBlockHeight + studentBlockHeight;

  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5 * s);
  doc.roundedRect(leftEdge, boxStartY, totalAvailWidth, totalBoxHeight, 2 * s, 2 * s, 'S');

  // School info block
  doc.setTextColor(...textBlack);
  let schoolY = boxStartY + boxPadding + 2 * s;
  const logoSize = school.logo ? Math.min(schoolBlockHeight - 4 * s, 34 * s) : 0;
  const logoX = rightEdge - logoSize - 2 * s;
  if (school.logo) {
    try {
      const processedLogo = await processLogo(school.logo, isBlackWhite);
      doc.addImage(processedLogo, 'PNG', logoX, boxStartY + 2 * s, logoSize, logoSize);
    } catch { /* ignore */ }
  }
  const schoolTextMaxWidth = (school.logo ? logoX - leftEdge - 4 * s : totalAvailWidth - 6 * s);

  schoolFields.forEach(id => {
    const value = getFieldValue(school, id);
    const label = getFieldLabel(id);
    const displayText = label ? `${label} ${value}` : value;
    let baseFontSize = 11 * s;
    let fontStyle: 'bold' | 'normal' = 'normal';
    if (id === 'name') { baseFontSize = 17 * s; fontStyle = 'bold'; }
    else if (id === 'ministryName') { baseFontSize = 12 * s; fontStyle = 'bold'; }
    doc.setFont('helvetica', fontStyle);
    autoFitText(doc, displayText, schoolTextMaxWidth, baseFontSize);
    doc.text(displayText, leftEdge + 3 * s, schoolY);
    schoolY += id === 'name' ? 7.5 * s : schoolLineHeight;
  });

  // REPORT CARD title with two boundary lines
  const titleY = boxStartY + schoolBlockHeight;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.6 * s);
  doc.line(leftEdge, titleY, leftEdge + totalAvailWidth, titleY);
  doc.setFont(theme.titleFont, 'bold');
  doc.setFontSize(20 * s);
  doc.setTextColor(...primaryColor);
  doc.text('REPORT CARD', ox + regionW / 2, titleY + 9 * s, { align: 'center' });
  doc.line(leftEdge, titleY + titleBlockHeight, leftEdge + totalAvailWidth, titleY + titleBlockHeight);
  doc.setTextColor(...textBlack);

  // Student/class context
  const ctxStartY = titleY + titleBlockHeight;
  let ctxY = ctxStartY + 6 * s;
  const halfBoxWidth = totalAvailWidth / 2 - 6 * s;
  const rightX = leftEdge + totalAvailWidth / 2 + 2 * s;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13 * s);
  const sLabel = 'Student Name: ';
  doc.text('Student Name:', leftEdge + 3 * s, ctxY);
  const sLabelW = doc.getTextWidth(sLabel);
  doc.setFont('helvetica', 'normal');
  autoFitText(doc, student.fullName, totalAvailWidth - sLabelW - 8 * s, 13 * s);
  doc.text(student.fullName, leftEdge + 3 * s + sLabelW, ctxY);
  ctxY += 6 * s;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11 * s);
  doc.text('Conduct:', leftEdge + 3 * s, ctxY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.conductMarks} / ${student.conductMax}`, leftEdge + 3 * s + doc.getTextWidth('Conduct: '), ctxY);
  if (hasDateOfBirth) {
    doc.setFont('helvetica', 'bold');
    doc.text('Born at:', rightX, ctxY);
    doc.setFont('helvetica', 'normal');
    doc.text(student.dateOfBirth || '', rightX + doc.getTextWidth('Born at: '), ctxY);
  }
  ctxY += 6 * s;

  for (let i = 0; i < contextFields.length; i += 2) {
    const leftId = contextFields[i];
    const rightId = contextFields[i + 1];
    const drawField = (id: string, x: number) => {
      const label = getFieldLabel(id);
      const val = getFieldValue(school, id);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11 * s);
      doc.text(label, x, ctxY);
      const lw = doc.getTextWidth(label + ' ');
      doc.setFont('helvetica', 'normal');
      autoFitText(doc, val, halfBoxWidth - lw, 11 * s);
      doc.text(val, x + lw, ctxY);
    };
    if (leftId) drawField(leftId, leftEdge + 3 * s);
    if (rightId) drawField(rightId, rightX);
    ctxY += 6 * s;
  }

  currentY = boxStartY + totalBoxHeight + 4 * s;

  // ===== Marks table =====
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
  const filteredSubjects = allSubjects.filter(s2 =>
    selectedSubjects.length === 0 || selectedSubjects.includes(s2.subject)
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
      const mark = term.subjects.find(s2 => s2.subject === subjectData.subject);
      row.push(
        mark && mark.mtt > 0 ? mark.mtt : '-',
        mark && mark.exam > 0 ? mark.exam : '-',
        mark?.total || '-',
        mark?.rank || '-',
      );
    });
    if (hasThreeTerms) {
      const avgData = student.subjectAverages?.find(a => a.subject === subjectData.subject);
      row.push(avgData?.avgTest || '-', avgData?.avgExam || '-', avgData?.avgTotal || '-');
    }
    row.push('');
    tableData.push(row);
  });

  const totalRow: (string | number)[] = [
    'Total',
    filteredSubjects.reduce((sum, s2) => sum + (s2.maxMtt || 0), 0) || '-',
    filteredSubjects.reduce((sum, s2) => sum + (s2.maxExam || 0), 0) || '-',
    filteredSubjects.reduce((sum, s2) => sum + (s2.maxTotal || 0), 0) || '-',
  ];
  student.terms.forEach(term => {
    const termMtt = term.subjects.reduce((sum, s2) => sum + s2.mtt, 0);
    const termExam = term.subjects.reduce((sum, s2) => sum + s2.exam, 0);
    totalRow.push(termMtt || '-', termExam || '-', term.totalMarks, '');
  });
  if (hasThreeTerms) {
    const avgTestTotal = student.subjectAverages?.reduce((sum, s2) => sum + s2.avgTest, 0) || 0;
    const avgExamTotal = student.subjectAverages?.reduce((sum, s2) => sum + s2.avgExam, 0) || 0;
    const avgTotalTotal = student.subjectAverages?.reduce((sum, s2) => sum + s2.avgTotal, 0) || 0;
    totalRow.push(
      Math.round(avgTestTotal * 10) / 10 || '-',
      Math.round(avgExamTotal * 10) / 10 || '-',
      Math.round(avgTotalTotal * 10) / 10 || '-'
    );
  }
  totalRow.push('');
  tableData.push(totalRow);

  const pctRow: (string | number)[] = ['Percentage', '', '', ''];
  student.terms.forEach(term => { pctRow.push('', '', `${term.percentage.toFixed(1)}%`, ''); });
  if (hasThreeTerms) {
    const avgTotalSum = student.subjectAverages?.reduce((sum, s2) => sum + s2.avgTotal, 0) || 0;
    const avgMaxSum = filteredSubjects.reduce((sum, s2) => sum + (s2.maxTotal || 0), 0);
    const annualPercentage = avgMaxSum > 0 ? (avgTotalSum / avgMaxSum) * 100 : 0;
    pctRow.push('', '', `${annualPercentage.toFixed(1)}%`);
  }
  pctRow.push('');
  tableData.push(pctRow);

  const rankRow: (string | number)[] = ['Rank', '', '', ''];
  student.terms.forEach(term => { rankRow.push('', '', '', term.termRank || '-'); });
  if (hasThreeTerms) rankRow.push('', '', student.annualRank || student.position);
  rankRow.push('');
  tableData.push(rankRow);

  const numCols = 4 + numTerms * 4 + (hasThreeTerms ? 3 : 0) + 1;
  // Wider subject column to accommodate long subject names; narrower data
  // columns so we can grow the font size without overflowing the table.
  const subjectPct = hasThreeTerms ? 0.22 : (numTerms === 2 ? 0.26 : 0.3);
  const commentsPct = 0.08;
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

  // Roughly doubled body font size for legibility (was 5–6).
  const baseFontSize = hasThreeTerms ? 9 : (numTerms === 2 ? 10 : 11);
  const fontSize = baseFontSize * s;

  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders[0], tableHeaders[1]],
    body: tableData,
    theme: 'grid',
    tableWidth: totalAvailWidth,
    margin: { left: leftEdge, right: doc.internal.pageSize.getWidth() - (leftEdge + totalAvailWidth) },
    styles: {
      fontSize,
      cellPadding: 1.6 * s,
      minCellHeight: 5.5 * s,
      valign: 'middle',
      lineColor: [0, 0, 0],
      lineWidth: 0.2 * s,
      fontStyle: boldBody ? 'bold' : 'normal',
    },
    headStyles: {
      fillColor: theme.tableHeadFill,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      minCellHeight: 5 * s,
      fontSize
    },
    bodyStyles: { halign: 'center', textColor: [0, 0, 0], fontStyle: boldBody ? 'bold' : 'normal' },
    columnStyles,
    didParseCell: (data) => {
      if (data.row.index === tableData.length - 3) data.cell.styles.fontStyle = 'bold';
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

  // Observations + Signatures box
  const boxY = finalY + 5 * s;
  const isAnnual = hasThreeTerms;
  const boxHeight = (isAnnual ? 40 : 35) * s;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3 * s);
  doc.roundedRect(leftEdge, boxY, totalAvailWidth, boxHeight, 2 * s, 2 * s);
  const dividerX = leftEdge + totalAvailWidth / 2;
  doc.line(dividerX, boxY, dividerX, boxY + boxHeight);
  doc.line(dividerX, boxY + boxHeight / 2, leftEdge + totalAvailWidth, boxY + boxHeight / 2);

  doc.setFontSize(8 * s);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Observations', leftEdge + 2 * s, boxY + 6 * s);

  const lastTerm = student.terms[student.terms.length - 1];
  const commentPercentage = lastTerm?.percentage || 0;
  const autoComment = getAutoComment(commentPercentage, gradingRules);
  if (autoComment) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7 * s);
    doc.text(autoComment, leftEdge + 2 * s, boxY + 12 * s);
  }

  if (isAnnual) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7 * s);
    const checkY = boxY + 18 * s;
    doc.rect(leftEdge + 2 * s, checkY - 2.5 * s, 3 * s, 3 * s);
    doc.text('Promoted', leftEdge + 6 * s, checkY);
    doc.rect(leftEdge + 30 * s, checkY - 2.5 * s, 3 * s, 3 * s);
    doc.text('Repeated', leftEdge + 34 * s, checkY);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8 * s);
  doc.text('Teacher Signature', dividerX + 3 * s, boxY + 6 * s);
  doc.text('Parent Signature', dividerX + 3 * s, boxY + boxHeight / 2 + 6 * s);

  // Bottom custom details
  let bottomY = boxY + boxHeight + 8 * s;
  bottomDetails.forEach(detail => {
    doc.setFontSize(8 * s);
    doc.setTextColor(...textBlack);
    const xPos = detail.position === 'bottomRight' ? rightEdge : leftEdge;
    const align = detail.position === 'bottomRight' ? 'right' : 'left';
    doc.text(detail.text, xPos, bottomY, { align: align as 'left' | 'right' });
    bottomY += 5 * s;
  });

  if (drawFooter) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const now = new Date();
    const stamp = now.toLocaleString('en-GB', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const footerText = `Report card generated on: ${stamp} (${tz}) by EduBel Report Card Generator`;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5 * s);
    doc.setTextColor(120, 120, 120);
    // Place near bottom of region
    doc.text(footerText, ox + regionW / 2, oy + regionH - 4 * s, { align: 'center' });
  }
}

export async function generateStudentPDF(options: GeneratePDFOptions): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await drawStudentReport(doc, options, {
    ox: 0, oy: 0,
    width: doc.internal.pageSize.getWidth(),
    height: doc.internal.pageSize.getHeight(),
    scale: 1,
    drawFooter: true,
  });
  return doc;
}

/**
 * Duo layout: one landscape A4 page (297 x 210mm) holds two report cards
 * stacked side-by-side, separated by a dashed cut line down the middle.
 * Each half is ~148.5mm wide x 210mm tall — portrait once cut.
 *
 * Pass `students` already ranked; pairs are formed (0,1), (2,3), …
 * Returns a multi-page PDF with one landscape page per pair.
 */
export async function generateDuoPDF(
  studentsInOrder: Student[],
  baseOpts: Omit<GeneratePDFOptions, 'student'>
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();   // 297
  const pageH = doc.internal.pageSize.getHeight();  // 210
  const halfW = pageW / 2;
  // Scale so the original 210mm-wide / 297mm-tall design fits in 148.5mm x 210mm
  const scale = Math.min(halfW / 210, pageH / 297); // ~0.707

  const drawDashedCutLine = () => {
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.4);
    const dash = 2.5;
    const gap = 2;
    let y = 4;
    while (y < pageH - 4) {
      doc.line(halfW, y, halfW, Math.min(y + dash, pageH - 4));
      y += dash + gap;
    }
    // Tiny cut-here hint (small label near top-center of the divider)
    doc.setFontSize(6);
    doc.setTextColor(140, 140, 140);
    doc.text('-- cut here --', halfW, 3, { align: 'center' });
  };

  for (let i = 0; i < studentsInOrder.length; i += 2) {
    if (i > 0) doc.addPage('a4', 'landscape');
    const a = studentsInOrder[i];
    const b = studentsInOrder[i + 1];

    await drawStudentReport(doc, { ...baseOpts, student: a }, {
      ox: 0, oy: 0, width: halfW, height: pageH, scale, drawFooter: true, boldBody: true,
    });
    if (b) {
      await drawStudentReport(doc, { ...baseOpts, student: b }, {
        ox: halfW, oy: 0, width: halfW, height: pageH, scale, drawFooter: true, boldBody: true,
      });
    }
    drawDashedCutLine();
  }
  return doc;
}

/**
 * Single landscape page containing the given student paired with their
 * adjacent classmate by ranking position. Used for previewing one card
 * in duo mode.
 */
export async function generateDuoPagePDF(
  student: Student,
  studentsInOrder: Student[],
  baseOpts: Omit<GeneratePDFOptions, 'student'>
): Promise<jsPDF> {
  const idx = studentsInOrder.findIndex(s => s.id === student.id);
  let pairStart = idx % 2 === 0 ? idx : idx - 1;
  if (pairStart < 0) pairStart = 0;
  const pair = [studentsInOrder[pairStart], studentsInOrder[pairStart + 1]].filter(Boolean) as Student[];
  return generateDuoPDF(pair, baseOpts);
}

export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
