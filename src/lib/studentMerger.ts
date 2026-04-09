import { Student, TermUpload, TermData, SubjectMark } from '@/types/reportCard';

/**
 * Competition ranking: ties share the same rank, next rank skips.
 * e.g., 1, 1, 3, 4, 4, 6
 */
function assignCompetitionRanks<T>(
  items: T[],
  getValue: (item: T) => number
): Map<T, number> {
  const sorted = [...items].sort((a, b) => getValue(b) - getValue(a));
  const ranks = new Map<T, number>();
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && getValue(sorted[i]) < getValue(sorted[i - 1])) {
      rank = i + 1;
    }
    ranks.set(sorted[i], rank);
  }
  return ranks;
}

export function mergeStudentsFromTerms(terms: TermUpload[]): Student[] {
  const uploadedTerms = terms.filter(t => t.selected && (t.testParsedData || t.examParsedData));
  
  if (uploadedTerms.length === 0) return [];

  const firstTerm = uploadedTerms[0];
  const firstData = firstTerm.testParsedData || firstTerm.examParsedData;
  if (!firstData) return [];
  
  const studentCount = firstData.students.length;
  const students: Student[] = [];
  
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
    let dateOfBirth: string | undefined;
    
    uploadedTerms.forEach(term => {
      const testStudent = term.testParsedData?.students[i];
      const examStudent = term.examParsedData?.students[i];
      
      studentName = testStudent?.fullName || examStudent?.fullName || studentName;
      dateOfBirth = testStudent?.dateOfBirth || examStudent?.dateOfBirth || dateOfBirth;
      conductMarks = testStudent?.conductMarks || examStudent?.conductMarks || conductMarks;
      conductMax = testStudent?.conductMax || examStudent?.conductMax || conductMax;
      
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
    
    const subjectAverages: { subject: string; avgTest: number; avgExam: number; avgTotal: number }[] = [];
    if (uploadedTerms.length === 3) {
      allSubjectsMap.forEach((_, subjectName) => {
        let totalTest = 0;
        let totalExam = 0;
        let totalTotal = 0;
        
        termsData.forEach(term => {
          const mark = term.subjects.find(s => s.subject === subjectName);
          if (mark) {
            totalTest += mark.mtt;
            totalExam += mark.exam;
            totalTotal += mark.total;
          }
        });
        
        subjectAverages.push({
          subject: subjectName,
          avgTest: Math.round((totalTest / 3) * 10) / 10,
          avgExam: Math.round((totalExam / 3) * 10) / 10,
          avgTotal: Math.round((totalTotal / 3) * 10) / 10,
        });
      });
    }
    
    students.push({
      id: `student-${i}`,
      fullName: studentName,
      dateOfBirth,
      conductMarks,
      conductMax,
      terms: termsData,
      grandTotal,
      grandMax,
      overallPercentage,
      position: 0,
      subjectAverages: uploadedTerms.length === 3 ? subjectAverages : undefined,
    });
  }
  
  // Per-term rankings with competition ranking (ties share rank, next skips)
  uploadedTerms.forEach((_, termIndex) => {
    // Term-level ranking by totalMarks
    const termRanks = assignCompetitionRanks(
      students,
      s => s.terms[termIndex]?.totalMarks || 0
    );
    termRanks.forEach((rank, student) => {
      if (student.terms[termIndex]) {
        student.terms[termIndex].termRank = rank;
      }
    });

    // Per-subject ranking within each term (competition ranking)
    const subjects = Array.from(allSubjectsMap.keys());
    subjects.forEach(subject => {
      const subjectRanks = assignCompetitionRanks(
        students,
        s => s.terms[termIndex]?.subjects.find(sub => sub.subject === subject)?.total || 0
      );
      subjectRanks.forEach((rank, student) => {
        const mark = student.terms[termIndex]?.subjects.find(s => s.subject === subject);
        if (mark) mark.rank = rank;
      });
    });
  });
  
  // Overall position with competition ranking
  const positionRanks = assignCompetitionRanks(students, s => s.overallPercentage);
  positionRanks.forEach((rank, student) => {
    student.position = rank;
  });
  
  // Annual rank for 3-term reports with competition ranking
  if (uploadedTerms.length === 3) {
    const annualRanks = assignCompetitionRanks(
      students,
      s => s.subjectAverages?.reduce((sum, a) => sum + a.avgTotal, 0) || 0
    );
    annualRanks.forEach((rank, student) => {
      student.annualRank = rank;
    });
  }
  
  // Sort by name for display
  students.sort((a, b) => a.fullName.localeCompare(b.fullName));
  
  return students;
}
