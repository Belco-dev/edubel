export interface CustomDetail {
  text: string;
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

export interface SchoolData {
  name: string;
  address: string;
  headTeacher: string;
  contact: string;
  className: string;
  termName: string;
  logo: string | null;
  customDetail?: CustomDetail;
  customDetails?: CustomDetail[];
  classTeacher: string;
  ministryName?: string;
  numberOfStudents?: number;
  fieldOrder?: string[];
}

export interface Subject {
  id: string;
  name: string;
  category: string;
}

export interface SubjectMark {
  subject: string;
  mtt: number;
  exam: number;
  total: number;
  maxMtt: number;
  maxExam: number;
  maxTotal: number;
  rank?: number;
}

export interface TermData {
  termId: string;
  termName: string;
  shortName: string;
  subjects: SubjectMark[];
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  termRank?: number;
}

export interface AverageData {
  avgTest: number;
  avgExam: number;
  avgTotal: number;
}

export interface Student {
  id: string;
  fullName: string;
  dateOfBirth?: string;
  conductMarks: number;
  conductMax: number;
  terms: TermData[];
  grandTotal: number;
  grandMax: number;
  overallPercentage: number;
  position: number;
  annualRank?: number;
  subjectAverages?: { subject: string; avgTest: number; avgExam: number; avgTotal: number }[];
}

export interface GradingRule {
  min: number;
  max: number;
  comment: string;
}

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
  dateOfBirth?: string;
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
