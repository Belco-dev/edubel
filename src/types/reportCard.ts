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

export interface SubjectMark {
  subject: string;
  mtt: number; // Midterm Test marks
  exam: number; // End of term exam marks
  total: number; // Total out of maxTotal
  rank?: number; // Subject rank among all students
}

export interface TermData {
  termId: string;
  termName: string;
  shortName: string;
  subjects: SubjectMark[];
  totalMarks: number;
  maxMarks: number;
  percentage: number;
}

export interface Student {
  id: string;
  fullName: string;
  conductMarks: number;
  terms: TermData[];
  grandTotal: number;
  grandMax: number;
  overallPercentage: number;
  position: number;
}

export interface TermSection {
  id: string;
  name: string;
  shortName: string;
  selected: boolean;
  file: File | null;
  parsedData: ParsedSectionData | null;
}

export interface ParsedSectionData {
  students: ParsedStudent[];
  detectedSubjects: string[];
}

export interface ParsedStudent {
  fullName: string;
  marks: { subject: string; mtt: number; exam: number; total: number }[];
  conductMarks: number;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
}

export interface MarkSettings {
  mttMax: number; // Max marks for midterm test per subject
  examMax: number; // Max marks for exam per subject
  conductMax: number; // Max marks for conduct
}

export type ThemeMode = 'light' | 'dark' | 'colorful';
