import { Student, TermSection, TermData, MarkSettings } from '@/types/reportCard';

export function mergeStudentsFromSections(sections: TermSection[], settings: MarkSettings): Student[] {
  const uploadedSections = sections.filter(s => s.selected && s.parsedData && s.parsedData.students.length > 0);
  
  if (uploadedSections.length === 0) return [];

  // Get student names from first uploaded section
  const firstSection = uploadedSections[0];
  const studentCount = firstSection.parsedData!.students.length;
  
  // Build students array
  const students: Student[] = [];
  
  for (let i = 0; i < studentCount; i++) {
    const terms: TermData[] = [];
    let grandTotal = 0;
    let grandMax = 0;
    let conductMarks = 0;
    let studentName = '';
    
    uploadedSections.forEach(section => {
      const studentData = section.parsedData!.students[i];
      if (!studentData) return;
      
      studentName = studentData.fullName;
      conductMarks = studentData.conductMarks;
      
      // Convert ParsedStudent marks to SubjectMark format
      const subjects = studentData.marks.map(m => ({
        subject: m.subject,
        mtt: m.mtt,
        exam: m.exam,
        total: m.total,
        maxMtt: m.maxMtt,
        maxExam: m.maxExam,
      }));
      
      const termData: TermData = {
        termId: section.id,
        termName: section.name,
        shortName: section.shortName,
        subjects,
        totalMarks: studentData.totalMarks,
        maxMarks: studentData.maxMarks,
        percentage: studentData.percentage,
      };
      
      terms.push(termData);
      grandTotal += studentData.totalMarks;
      grandMax += studentData.maxMarks;
    });
    
    const overallPercentage = grandMax > 0 ? (grandTotal / grandMax) * 100 : 0;
    
    students.push({
      id: `student-${i}`,
      fullName: studentName,
      conductMarks,
      terms,
      grandTotal,
      grandMax,
      overallPercentage,
      position: 0,
    });
  }
  
  // Calculate subject ranks for each subject
  if (students.length > 0 && students[0].terms.length > 0) {
    const subjects = students[0].terms[0].subjects.map(s => s.subject);
    
    subjects.forEach(subject => {
      // Get all students' totals for this subject (across all terms)
      const subjectTotals = students.map(student => {
        let total = 0;
        student.terms.forEach(term => {
          const mark = term.subjects.find(s => s.subject === subject);
          if (mark) total += mark.total;
        });
        return { studentId: student.id, total };
      });
      
      // Sort by total descending and assign ranks
      subjectTotals.sort((a, b) => b.total - a.total);
      const ranks = new Map<string, number>();
      subjectTotals.forEach((item, idx) => {
        ranks.set(item.studentId, idx + 1);
      });
      
      // Assign rank to each student's subject marks
      students.forEach(student => {
        student.terms.forEach(term => {
          const mark = term.subjects.find(s => s.subject === subject);
          if (mark) {
            mark.rank = ranks.get(student.id);
          }
        });
      });
    });
  }
  
  // Sort by percentage and assign positions
  students.sort((a, b) => b.overallPercentage - a.overallPercentage);
  students.forEach((student, index) => {
    student.position = index + 1;
  });
  
  // Re-sort by name for display
  students.sort((a, b) => a.fullName.localeCompare(b.fullName));
  
  return students;
}
