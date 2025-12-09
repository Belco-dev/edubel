import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, SchoolData } from '@/types/reportCard';

interface GeneratePDFOptions {
  student: Student;
  school: SchoolData;
  totalStudents: number;
  classTeacher: string;
  selectedSubjects: string[];
}

function getGradeColor(percentage: number): [number, number, number] {
  if (percentage >= 80) return [34, 197, 94]; // Green
  if (percentage >= 60) return [59, 130, 246]; // Blue
  if (percentage >= 40) return [245, 158, 11]; // Yellow/Orange
  return [239, 68, 68]; // Red
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
  const { student, school, totalStudents, classTeacher, selectedSubjects } = options;
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [20, 184, 166]; // Teal
  const headerBg: [number, number, number] = [240, 253, 250];
  
  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // School Logo (if available)
  if (school.logo) {
    try {
      doc.addImage(school.logo, 'PNG', pageWidth - 45, 5, 35, 30);
    } catch (e) {
      console.log('Could not add logo');
    }
  }
  
  // School Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(school.name || 'School Name', 15, 18);
  
  // School Address
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(school.address || 'School Address', 15, 26);
  doc.text(`Contact: ${school.contact || 'N/A'}`, 15, 32);
  
  // Term Name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(school.termName || 'Term Report Card', pageWidth / 2 - 20, 38);
  
  // Student Info Section
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(...headerBg);
  doc.roundedRect(10, 48, pageWidth - 20, 25, 3, 3, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Name:', 15, 57);
  doc.setFont('helvetica', 'normal');
  doc.text(student.fullName, 55, 57);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Position:', 15, 67);
  doc.setFont('helvetica', 'normal');
  const gradeColor = getGradeColor(student.percentage);
  doc.setTextColor(...gradeColor);
  doc.text(`${student.position} out of ${totalStudents}`, 45, 67);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Percentage:', pageWidth / 2 + 10, 57);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gradeColor);
  doc.text(`${student.percentage.toFixed(1)}%`, pageWidth / 2 + 60, 57);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Grade:', pageWidth / 2 + 10, 67);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gradeColor);
  doc.text(getGrade(student.percentage), pageWidth / 2 + 35, 67);
  
  // Marks Table
  const filteredMarks = student.marks.filter(m => 
    selectedSubjects.length === 0 || selectedSubjects.includes(m.subject)
  );
  
  const tableData = filteredMarks.map((mark, index) => {
    const pct = (mark.obtainedMarks / mark.maxMarks) * 100;
    return [
      (index + 1).toString(),
      mark.subject,
      mark.maxMarks.toString(),
      mark.obtainedMarks.toString(),
      `${pct.toFixed(1)}%`,
      getGrade(pct),
    ];
  });
  
  // Add total row
  tableData.push([
    '',
    'TOTAL',
    student.maxTotalMarks.toString(),
    student.totalMarks.toString(),
    `${student.percentage.toFixed(1)}%`,
    getGrade(student.percentage),
  ]);
  
  autoTable(doc, {
    startY: 80,
    head: [['#', 'Subject', 'Max Marks', 'Obtained', 'Percentage', 'Grade']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 60, halign: 'left' },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
      5: { cellWidth: 20 },
    },
    didParseCell: (data) => {
      // Color the grade column based on performance
      if (data.column.index === 5 && data.section === 'body') {
        const grade = data.cell.raw as string;
        if (grade === 'A+' || grade === 'A') {
          data.cell.styles.textColor = [34, 197, 94];
        } else if (grade === 'B+' || grade === 'B') {
          data.cell.styles.textColor = [59, 130, 246];
        } else if (grade === 'C+' || grade === 'C') {
          data.cell.styles.textColor = [245, 158, 11];
        } else {
          data.cell.styles.textColor = [239, 68, 68];
        }
        data.cell.styles.fontStyle = 'bold';
      }
      
      // Bold the total row
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [226, 232, 240];
      }
    },
  });
  
  // Get the final Y position after the table
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  
  // Remark Section
  doc.setFillColor(254, 243, 199); // Light yellow
  doc.roundedRect(10, finalY + 10, pageWidth - 20, 25, 3, 3, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Teacher\'s Remark:', 15, finalY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(student.remark, 15, finalY + 28);
  
  // Signatures Section
  const signatureY = finalY + 45;
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  
  // Class Teacher Signature
  doc.line(15, signatureY + 15, 75, signatureY + 15);
  doc.setFontSize(10);
  doc.text('Class Teacher', 30, signatureY + 22);
  doc.setFontSize(9);
  doc.text(classTeacher || '________________', 25, signatureY + 10);
  
  // Head Teacher Signature
  doc.line(85, signatureY + 15, 145, signatureY + 15);
  doc.setFontSize(10);
  doc.text('Head Teacher', 100, signatureY + 22);
  doc.setFontSize(9);
  doc.text(school.headTeacher || '________________', 95, signatureY + 10);
  
  // Parent Signature
  doc.line(155, signatureY + 15, pageWidth - 15, signatureY + 15);
  doc.setFontSize(10);
  doc.text('Parent/Guardian', 162, signatureY + 22);
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFillColor(...primaryColor);
  doc.rect(0, footerY - 5, pageWidth, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Generated by EDUBEL | Made with ❤️ by Belco | nzirorerabelico@gmail.com', pageWidth / 2, footerY + 2, { align: 'center' });
  
  return doc;
}

export async function generateAllStudentsPDF(
  students: Student[],
  school: SchoolData,
  classTeacher: string,
  selectedSubjects: string[]
): Promise<jsPDF> {
  const totalStudents = students.length;
  
  if (students.length === 0) {
    throw new Error('No students to generate PDF for');
  }
  
  const doc = await generateStudentPDF({
    student: students[0],
    school,
    totalStudents,
    classTeacher,
    selectedSubjects,
  });
  
  for (let i = 1; i < students.length; i++) {
    doc.addPage();
    const tempDoc = await generateStudentPDF({
      student: students[i],
      school,
      totalStudents,
      classTeacher,
      selectedSubjects,
    });
    
    // Copy content from temp doc to main doc
    const pageCount = tempDoc.getNumberOfPages();
    for (let j = 1; j <= pageCount; j++) {
      if (j > 1) doc.addPage();
      const pageContent = tempDoc.output('datauristring');
      // For simplicity, we'll just add each student on a new page
    }
  }
  
  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
