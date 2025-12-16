import { Student, TermUpload, TermData, SubjectMark } from '@/types/reportCard';

export function mergeStudentsFromTerms(terms: TermUpload[]): Student[] {
  const uploadedTerms = terms.filter(t => t.selected && (t.testParsedData || t.examParsedData));
  
  if (uploadedTerms.length === 0) return [];

  // Get student count from first available data
  const firstTerm = uploadedTerms[0];
  const firstData = firstTerm.testParsedData || firstTerm.examParsedData;
  if (!firstData) return [];
  
  const studentCount = firstData.students.length;
  const students: Student[] = [];
  
  // Get all unique subjects from all terms
  const allSubjectsMap = new Map<string, { maxMtt: number; maxExam: number }>();
  
  uploadedTerms.forEach(term => {
    if (term.testParsedData) {
      term.testParsedData.students[0]?.marks.forEach(m => {
        const existing = allSubjectsMap.get(m.subject) || { maxMtt: 0, maxExam: 0 };
        existing.maxMtt = Math.max(existing.maxMtt, m.maxMarks);
        allSubjectsMap.set(m.subject, existing);
      });
    }
    if (term.examParsedData) {
      term.examParsedData.students[0]?.marks.forEach(m => {
        const existing = allSubjectsMap.get(m.subject) || { maxMtt: 0, maxExam: 0 };
        existing.maxExam = Math.max(existing.maxExam, m.maxMarks);
        allSubjectsMap.set(m.subject, existing);
      });
    }
  });
  
  for (let i = 0; i < studentCount; i++) {
    const termsData: TermData[] = [];
    let grandTotal = 0;
    let grandMax = 0;
    let conductMarks = 0;
    let conductMax = 100;
    let studentName = '';
    
    uploadedTerms.forEach(term => {
      const testStudent = term.testParsedData?.students[i];
      const examStudent = term.examParsedData?.students[i];
      
      // Get student name from whichever source is available
      studentName = testStudent?.fullName || examStudent?.fullName || studentName;
      conductMarks = testStudent?.conductMarks || examStudent?.conductMarks || conductMarks;
      conductMax = testStudent?.conductMax || examStudent?.conductMax || conductMax;
      
      // Build subjects for this term
      const subjects: SubjectMark[] = [];
      let termTotal = 0;
      let termMax = 0;
      
      allSubjectsMap.forEach((maxValues, subjectName) => {
        const testMark = testStudent?.marks.find(m => m.subject === subjectName);
        const examMark = examStudent?.marks.find(m => m.subject === subjectName);
        
        const mtt = testMark?.marks || 0;
        const exam = examMark?.marks || 0;
        const maxMtt = testMark?.maxMarks || maxValues.maxMtt;
        const maxExam = examMark?.maxMarks || maxValues.maxExam;
        const total = mtt + exam;
        const maxTotal = maxMtt + maxExam;
        
        subjects.push({
          subject: subjectName,
          mtt,
          exam,
          total,
          maxMtt,
          maxExam,
          maxTotal,
        });
        
        termTotal += total;
        termMax += maxTotal;
      });
      
      const termPercentage = termMax > 0 ? (termTotal / termMax) * 100 : 0;
      
      termsData.push({
        termId: term.id,
        termName: term.name,
        shortName: term.shortName,
        subjects,
        totalMarks: termTotal,
        maxMarks: termMax,
        percentage: termPercentage,
      });
      
      grandTotal += termTotal;
      grandMax += termMax;
    });
    
    const overallPercentage = grandMax > 0 ? (grandTotal / grandMax) * 100 : 0;
    
    students.push({
      id: `student-${i}`,
      fullName: studentName,
      conductMarks,
      conductMax,
      terms: termsData,
      grandTotal,
      grandMax,
      overallPercentage,
      position: 0,
    });
  }
  
  // Calculate subject ranks for each subject (across all students, summing all terms)
  if (students.length > 0 && students[0].terms.length > 0) {
    const subjects = Array.from(allSubjectsMap.keys());
    
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
      
      // Assign rank to each student's subject marks (in first term for display)
      students.forEach(student => {
        if (student.terms[0]) {
          const mark = student.terms[0].subjects.find(s => s.subject === subject);
          if (mark) {
            mark.rank = ranks.get(student.id);
          }
        }
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
