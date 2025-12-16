export interface CustomDetail {
  text: string;
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

export interface SchoolData {
  name: string;
  address: string;
  headTeacher: string;
  contact: string;
  className: string; // Added class name field
  termName: string;
  logo: string | null;
  customDetail?: CustomDetail;
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
  total: number; // Total (mtt + exam)
  maxMtt: number; // Max marks for TEST
  maxExam: number; // Max marks for EXAM
  maxTotal: number; // Max total (maxMtt + maxExam)
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
  conductMax: number;
  terms: TermData[];
  grandTotal: number;
  grandMax: number;
  overallPercentage: number;
  position: number;
}

// Each term has separate test and exam file uploads
export interface TermUpload {
  id: string;
  name: string;
  shortName: string;
  selected: boolean;
  testFile: File | null;
  examFile: File | null;
  testParsedData: ParsedSectionData | null;
  examParsedData: ParsedSectionData | null;
}

export interface ParsedSectionData {
  students: ParsedStudent[];
  detectedSubjects: string[];
}

export interface ParsedStudent {
  fullName: string;
  marks: { subject: string; marks: number; maxMarks: number }[];
  conductMarks: number;
  conductMax: number;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
}

export interface MarkSettings {
  mttMax: number;
  examMax: number;
  conductMax: number;
}

export type ThemeMode = 'light' | 'dark' | 'colorful';
export type ReportCardStyle = 'colorful' | 'blackWhite';
