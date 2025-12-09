export interface SchoolData {
  name: string;
  address: string;
  headTeacher: string;
  contact: string;
  termName: string;
  logo: string | null;
}

export interface Subject {
  id: string;
  name: string;
  category: string;
}

export interface StudentMark {
  subject: string;
  maxMarks: number;
  obtainedMarks: number;
}

export interface StudentTermMarks {
  termId: string;
  marks: StudentMark[];
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
}

export interface Student {
  id: string;
  fullName: string;
  termMarks: StudentTermMarks[];
  overallTotal: number;
  overallMax: number;
  overallPercentage: number;
  position: number;
  remark: string;
}

export interface ReportCardData {
  school: SchoolData;
  students: Student[];
  selectedSubjects: string[];
  totalStudents: number;
  classTeacher: string;
}

export interface TermSection {
  id: string;
  name: string;
  shortName: string;
  selected: boolean;
  file: File | null;
  students: StudentTermMarks[];
  detectedSubjects: string[];
}

export type ThemeMode = 'light' | 'dark' | 'colorful';
