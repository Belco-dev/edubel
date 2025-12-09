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

export interface Student {
  id: string;
  fullName: string;
  marks: StudentMark[];
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
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

export type ThemeMode = 'light' | 'dark' | 'colorful';
