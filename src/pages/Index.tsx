import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SchoolSetup } from '@/components/SchoolSetup';
import { SubjectSelector } from '@/components/SubjectSelector';
import { FileUpload } from '@/components/FileUpload';
import { ReportCardPreview } from '@/components/ReportCardPreview';
import { SchoolData, Student, ThemeMode } from '@/types/reportCard';
import { Sparkles, BookOpen, FileSpreadsheet, Download } from 'lucide-react';

const Index = () => {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [schoolData, setSchoolData] = useState<SchoolData>({
    name: '',
    address: '',
    headTeacher: '',
    contact: '',
    termName: '',
    logo: null,
  });
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [detectedSubjects, setDetectedSubjects] = useState<string[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-colorful');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'colorful') {
      root.classList.add('theme-colorful');
    }
  }, [theme]);

  const handleStudentsLoaded = (loadedStudents: Student[], subjects: string[]) => {
    setStudents(loadedStudents);
    setDetectedSubjects(subjects);
    // Auto-select detected subjects if none are selected
    if (selectedSubjects.length === 0) {
      setSelectedSubjects(subjects);
    }
  };

  const steps = [
    { icon: BookOpen, title: 'Setup School', description: 'Enter school details and upload logo' },
    { icon: FileSpreadsheet, title: 'Upload Excel', description: 'Upload student marks spreadsheet' },
    { icon: Sparkles, title: 'Select Subjects', description: 'Choose subjects for report cards' },
    { icon: Download, title: 'Download PDFs', description: 'Generate and download report cards' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header theme={theme} onThemeChange={setTheme} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 md:py-20">
          <div className="absolute inset-0 bg-gradient-hero opacity-5" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
          
          <div className="container relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6 animate-fade-up">
                <Sparkles className="h-4 w-4" />
                Rwanda Curriculum Compatible
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                Generate Beautiful{' '}
                <span className="gradient-text">Report Cards</span>{' '}
                in Seconds
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                Upload your Excel file with student marks and instantly create professional, 
                colorful report cards. No login required, no data saved!
              </p>
              
              {/* Steps */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                {steps.map((step, index) => (
                  <div 
                    key={step.title}
                    className="p-4 bg-card rounded-2xl border border-border card-hover animate-fade-up"
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 container">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <SchoolSetup 
                  schoolData={schoolData} 
                  onSchoolDataChange={setSchoolData} 
                />
              </div>
              
              <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
                <FileUpload onStudentsLoaded={handleStudentsLoaded} />
              </div>
              
              <div className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
                <SubjectSelector 
                  selectedSubjects={selectedSubjects}
                  onSubjectsChange={setSelectedSubjects}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:sticky lg:top-24 lg:self-start animate-slide-in" style={{ animationDelay: '0.4s' }}>
              <ReportCardPreview 
                students={students}
                school={schoolData}
                selectedSubjects={selectedSubjects}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        {students.length === 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container">
              <h2 className="text-3xl font-display font-bold text-center mb-12">
                Why Choose <span className="gradient-text">EDUBEL</span>?
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'No Data Saved',
                    description: 'Your student data stays on your device. We never store or upload any information.',
                    color: 'bg-green/20 text-green',
                  },
                  {
                    title: 'Colorful PDFs',
                    description: 'Generate beautiful, professional report cards with grades highlighted in colors.',
                    color: 'bg-blue/20 text-blue',
                  },
                  {
                    title: 'Rwanda Curriculum',
                    description: 'Covers all subjects from Nursery 1 to Senior 6 following the Rwandan education system.',
                    color: 'bg-purple/20 text-purple',
                  },
                ].map((feature, index) => (
                  <div 
                    key={feature.title}
                    className="p-6 bg-card rounded-2xl border border-border card-hover"
                  >
                    <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
