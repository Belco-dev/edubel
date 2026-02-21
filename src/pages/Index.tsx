import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SchoolSetup } from '@/components/SchoolSetup';
import { SubjectSelector } from '@/components/SubjectSelector';
import { TermSelector } from '@/components/TermSelector';
import { MultiFileUpload } from '@/components/MultiFileUpload';
import { ReportCardPreview } from '@/components/ReportCardPreview';
import { mergeStudentsFromTerms } from '@/lib/studentMerger';
import { SchoolData, Student, ThemeMode, TermUpload, ReportCardStyle } from '@/types/reportCard';
import { Sparkles, BookOpen, FileSpreadsheet, Download, ClipboardList } from 'lucide-react';
const defaultTerms: TermUpload[] = [{
  id: 'term1',
  name: 'Term 1',
  shortName: 'T1',
  selected: false,
  testFile: null,
  examFile: null,
  testParsedData: null,
  examParsedData: null
}, {
  id: 'term2',
  name: 'Term 2',
  shortName: 'T2',
  selected: false,
  testFile: null,
  examFile: null,
  testParsedData: null,
  examParsedData: null
}, {
  id: 'term3',
  name: 'Term 3',
  shortName: 'T3',
  selected: false,
  testFile: null,
  examFile: null,
  testParsedData: null,
  examParsedData: null
}];
const Index = () => {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [schoolData, setSchoolData] = useState<SchoolData>({
    name: '',
    address: '',
    headTeacher: '',
    contact: '',
    className: '',
    termName: '',
    logo: null,
    classTeacher: '',
    ministryName: ''
  });
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [terms, setTerms] = useState<TermUpload[]>(defaultTerms);
  const [students, setStudents] = useState<Student[]>([]);
  const [reportCardStyle, setReportCardStyle] = useState<ReportCardStyle>('colorful');
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-colorful');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'colorful') {
      root.classList.add('theme-colorful');
    }
  }, [theme]);

  // Merge students when terms are updated
  useEffect(() => {
    const merged = mergeStudentsFromTerms(terms);
    setStudents(merged);

    // Auto-select detected subjects
    const allSubjects = new Set<string>();
    terms.forEach((t) => {
      if (t.testParsedData) {
        t.testParsedData.detectedSubjects.forEach((sub) => allSubjects.add(sub));
      }
      if (t.examParsedData) {
        t.examParsedData.detectedSubjects.forEach((sub) => allSubjects.add(sub));
      }
    });
    if (allSubjects.size > 0 && selectedSubjects.length === 0) {
      setSelectedSubjects(Array.from(allSubjects));
    }
  }, [terms]);
  const steps = [{
    icon: BookOpen,
    title: 'Setup School',
    description: 'Enter school info'
  }, {
    icon: ClipboardList,
    title: 'Select Terms',
    description: 'Choose terms'
  }, {
    icon: FileSpreadsheet,
    title: 'Upload Marks',
    description: 'Upload Excel files'
  }, {
    icon: Download,
    title: 'Download PDFs',
    description: 'Get report cards'
  }];
  return <div className="min-h-screen flex flex-col bg-background">
      <Header theme={theme} onThemeChange={setTheme} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-8 sm:py-12 md:py-16">
          <div className="absolute inset-0 bg-gradient-hero opacity-5" />
          <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/20 rounded-full blur-3xl" />
          
          <div className="container relative px-4">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary/10 rounded-full text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6 animate-fade-up">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                Rwanda Curriculum Compatible
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 sm:mb-6 animate-fade-up" style={{
              animationDelay: '0.1s'
            }}>
                Generate Beautiful{' '}
                <span className="gradient-text">Report Cards</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 animate-fade-up px-4" style={{
              animationDelay: '0.2s'
            }}>
                Multi-term report cards with MAX, TEST, EXAM & TOTAL columns. Works on phone, tablet & computer!
              </p>
              
              {/* Steps */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-8 sm:mt-12">
                {steps.map((step, index) => <div key={step.title} className="p-3 sm:p-4 rounded-xl border card-hover animate-fade-up mx-px px-[18px] sm:rounded-3xl shadow-inner border-primary-foreground bg-primary-foreground" style={{
                animationDelay: `${0.3 + index * 0.1}s`
              }}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-lg sm:rounded-xl bg-gradient-primary flex items-center justify-center">
                      <step.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-xs sm:text-sm">{step.title}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{step.description}</p>
                  </div>)}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 sm:py-12 container px-4">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Left Column */}
            <div className="space-y-6 sm:space-y-8">
              <div className="animate-slide-in" style={{
              animationDelay: '0.1s'
            }}>
                <SchoolSetup schoolData={schoolData} onSchoolDataChange={setSchoolData} />
              </div>
              
              <div className="animate-slide-in" style={{
              animationDelay: '0.2s'
            }}>
                <TermSelector terms={terms} onTermsChange={setTerms} />
              </div>
              
              <div className="animate-slide-in" style={{
              animationDelay: '0.3s'
            }}>
                <MultiFileUpload terms={terms} onTermsUpdate={setTerms} />
              </div>
              
              <div className="animate-slide-in" style={{
              animationDelay: '0.4s'
            }}>
                <SubjectSelector selectedSubjects={selectedSubjects} onSubjectsChange={setSelectedSubjects} />
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:sticky lg:top-20 lg:self-start animate-slide-in" style={{
            animationDelay: '0.5s'
          }}>
              <ReportCardPreview students={students} school={schoolData} selectedSubjects={selectedSubjects} terms={terms} reportCardStyle={reportCardStyle} onStyleChange={setReportCardStyle} />
            </div>
          </div>
        </section>

        {/* Features Section */}
        {students.length === 0 && <section className="py-12 sm:py-16 bg-muted/30">
            <div className="container px-4">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-8 sm:mb-12">Why Choose EDUBEL?<span className="gradient-text">EDUBEL</span>?
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {[{
              title: 'Multi-Term Support',
              description: 'Generate reports with MAX, TEST, EXAM, and TOTAL columns for multiple terms.',
              color: 'bg-green/20 text-green'
            }, {
              title: 'Works Everywhere',
              description: 'Responsive design works perfectly on phones, tablets, and computers.',
              color: 'bg-blue/20 text-blue'
            }, {
              title: 'No Data Saved',
              description: 'Your student data stays on your device. We never store anything.',
              color: 'bg-purple/20 text-purple'
            }].map((feature) => <div key={feature.title} className="p-4 sm:p-6 bg-card rounded-xl sm:rounded-2xl border border-border card-hover">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${feature.color} flex items-center justify-center mb-3 sm:mb-4`}>
                      <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <h3 className="font-display font-semibold text-base sm:text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">{feature.description}</p>
                  </div>)}
              </div>
            </div>
          </section>}
      </main>

      <Footer className="my-0 py-0" />
    </div>;
};
export default Index;