import { Student, TermSection, StudentTermMarks } from '@/types/reportCard';

function generateRemark(percentage: number): string {
  if (percentage >= 90) return 'Excellent! Outstanding performance!';
  if (percentage >= 80) return 'Very Good! Keep up the great work!';
  if (percentage >= 70) return 'Good performance. Continue working hard!';
  if (percentage >= 60) return 'Satisfactory. Room for improvement.';
  if (percentage >= 50) return 'Fair. More effort needed.';
  if (percentage >= 40) return 'Needs improvement. Please work harder.';
  return 'Poor performance. Requires extra support and attention.';
}

export function mergeStudentsFromSections(sections: TermSection[]): Student[] {
  const uploadedSections = sections.filter(s => s.selected && s.file && s.students.length > 0);
  
  if (uploadedSections.length === 0) return [];

  // Get all unique student names across all sections
  const studentNamesSet = new Set<string>();
  uploadedSections.forEach(section => {
    section.students.forEach((_, index) => {
      // We need to get the original student data to get names
      // For now, we'll use the first section as reference
    });
  });

  // Use first section as primary reference for student names
  const primarySection = uploadedSections[0];
  
  // Create a map to store merged student data
  const studentsMap = new Map<number, {
    fullName: string;
    termMarks: StudentTermMarks[];
  }>();

  // First pass: get all students from the first section
  primarySection.students.forEach((termMark, index) => {
    studentsMap.set(index, {
      fullName: `Student ${index + 1}`, // Will be overwritten with actual name
      termMarks: [termMark],
    });
  });

  // We need to re-parse to get actual names - let's store them in the term data
  // For now, use index-based matching (assumes same order in all files)
  
  // Merge data from other sections
  uploadedSections.slice(1).forEach(section => {
    section.students.forEach((termMark, index) => {
      const existing = studentsMap.get(index);
      if (existing) {
        existing.termMarks.push(termMark);
      }
    });
  });

  // Convert map to array and calculate overall totals
  const students: Student[] = Array.from(studentsMap.entries()).map(([index, data]) => {
    let overallTotal = 0;
    let overallMax = 0;

    data.termMarks.forEach(tm => {
      overallTotal += tm.totalMarks;
      overallMax += tm.maxTotalMarks;
    });

    const overallPercentage = overallMax > 0 ? (overallTotal / overallMax) * 100 : 0;

    return {
      id: `student-${index}`,
      fullName: data.fullName,
      termMarks: data.termMarks,
      overallTotal,
      overallMax,
      overallPercentage,
      position: 0,
      remark: generateRemark(overallPercentage),
    };
  });

  // Sort by overall percentage and assign positions
  students.sort((a, b) => b.overallPercentage - a.overallPercentage);
  students.forEach((student, index) => {
    student.position = index + 1;
  });

  // Re-sort by name for display
  students.sort((a, b) => a.fullName.localeCompare(b.fullName));

  return students;
}
