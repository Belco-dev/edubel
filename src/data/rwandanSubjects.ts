import { Subject } from '@/types/reportCard';

export const rwandanSubjects: Subject[] = [
  // Nursery & Lower Primary
  { id: 'kinyarwanda', name: 'Kinyarwanda', category: 'Languages' },
  { id: 'english', name: 'English', category: 'Languages' },
  { id: 'french', name: 'French', category: 'Languages' },
  { id: 'kiswahili', name: 'Kiswahili', category: 'Languages' },
  
  // Core Subjects
  { id: 'mathematics', name: 'Mathematics', category: 'Sciences' },
  { id: 'physics', name: 'Physics', category: 'Sciences' },
  { id: 'chemistry', name: 'Chemistry', category: 'Sciences' },
  { id: 'biology', name: 'Biology', category: 'Sciences' },
  { id: 'integrated-science', name: 'Integrated Science', category: 'Sciences' },
  { id: 'set', name: 'Science & Elementary Technology (SET)', category: 'Sciences' },
  { id: 'computer-science', name: 'Computer Science', category: 'Sciences' },
  { id: 'ict', name: 'ICT', category: 'Sciences' },
  
  // Social Studies
  { id: 'social-studies', name: 'Social Studies', category: 'Social Studies' },
  { id: 'history', name: 'History', category: 'Social Studies' },
  { id: 'geography', name: 'Geography', category: 'Social Studies' },
  { id: 'economics', name: 'Economics', category: 'Social Studies' },
  { id: 'entrepreneurship', name: 'Entrepreneurship', category: 'Social Studies' },
  { id: 'political-education', name: 'Political Education', category: 'Social Studies' },
  { id: 'general-studies', name: 'General Studies & Communication Skills', category: 'Social Studies' },
  
  // Arts & Religion
  { id: 'religion', name: 'Religion & Ethics', category: 'Arts & Religion' },
  { id: 'creative-arts', name: 'Creative Arts & Culture', category: 'Arts & Religion' },
  { id: 'music', name: 'Music', category: 'Arts & Religion' },
  { id: 'fine-art', name: 'Fine Art', category: 'Arts & Religion' },
  { id: 'literature', name: 'Literature in English', category: 'Arts & Religion' },
  
  // Technical & Vocational
  { id: 'tvet', name: 'Technical & Vocational Education', category: 'Technical' },
  { id: 'agriculture', name: 'Agriculture', category: 'Technical' },
  { id: 'home-science', name: 'Home Science', category: 'Technical' },
  
  // Physical Education
  { id: 'sports', name: 'Sports & Physical Education', category: 'Physical Education' },
  
  // Pre-Primary Specific
  { id: 'discovery', name: 'Discovery of the World', category: 'Pre-Primary' },
  { id: 'creative-performance', name: 'Creative Performance', category: 'Pre-Primary' },
  { id: 'language-literacy', name: 'Language & Literacy', category: 'Pre-Primary' },
  { id: 'numeracy', name: 'Numeracy', category: 'Pre-Primary' },
  
  // Additional
  { id: 'handwriting', name: 'Handwriting', category: 'Additional' },
  { id: 'reading', name: 'Reading', category: 'Additional' },
  { id: 'spelling', name: 'Spelling', category: 'Additional' },
  { id: 'conduct', name: 'Conduct & Discipline', category: 'Additional' },
];

export const subjectCategories = [
  'Languages',
  'Sciences',
  'Social Studies',
  'Arts & Religion',
  'Technical',
  'Physical Education',
  'Pre-Primary',
  'Additional',
];
