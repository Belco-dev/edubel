import { useState, useEffect } from 'react';
import { Footer } from '@/components/Footer';
import { SchoolSetup } from '@/components/SchoolSetup';
import { TermSelector } from '@/components/TermSelector';
import { MultiFileUpload } from '@/components/MultiFileUpload';
import { ReportCardPreview } from '@/components/ReportCardPreview';
import { FAQSection } from '@/components/FAQSection';
import { DeveloperBio } from '@/components/DeveloperBio';
import { GradingSystem, DEFAULT_GRADING_RULES } from '@/components/GradingSystem';
import { mergeStudentsFromTerms } from '@/lib/studentMerger';
import { SchoolData, Student, ThemeMode, TermUpload, ReportCardStyle, GradingRule, ReportCardTemplate } from '@/types/reportCard';
import { ChevronLeft, ChevronRight, Sparkles, Menu } from 'lucide-react';
import { useSessionAutoSave, loadSession } from '@/hooks/useSessionPersistence';
import { WelcomeModal } from '@/components/WelcomeModal';
import { TutorialGuide } from '@/components/TutorialGuide';
import { SpreadsheetEditor } from '@/components/SpreadsheetEditor';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar, WizardStep } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const defaultTerms: TermUpload[] = [
  { id: 'term1', name: 'Term 1', shortName: 'T1', selected: false, testFile: null, examFile: null, testParsedData: null, examParsedData: null },
  { id: 'term2', name: 'Term 2', shortName: 'T2', selected: false, testFile: null, examFile: null, testParsedData: null, examParsedData: null },
  { id: 'term3', name: 'Term 3', shortName: 'T3', selected: false, testFile: null, examFile: null, testParsedData: null, examParsedData: null },
];

const STEP_ORDER: WizardStep[] = ['school', 'terms', 'upload', 'grading', 'preview'];

const STEP_LABELS: Record<WizardStep, { title: string; subtitle: string }> = {
  school: { title: 'Step 1 — School Setup', subtitle: 'Enter your school information and class details.' },
  terms: { title: 'Step 2 — Select Terms', subtitle: 'Choose which terms to include in the report cards.' },
  upload: { title: 'Step 3 — Upload Marks', subtitle: 'Upload Excel files with student test and exam scores. Subjects are detected automatically.' },
  grading: { title: 'Step 4 — Grading System', subtitle: 'Customize grade ranges and auto-comments.' },
  preview: { title: 'Step 5 — Preview & Download', subtitle: 'Review report cards then download or share.' },
};

const SESSION_KEY = 'edubel_session_v1';

interface PersistedSession {
  theme: ThemeMode;
  currentStep: WizardStep;
  schoolData: SchoolData;
  selectedSubjects: string[];
  terms: TermUpload[];
  reportCardStyle: ReportCardStyle;
  gradingRules: GradingRule[];
  template: ReportCardTemplate;
}

const Index = () => {
  // Restore prior session (if any) on first mount.
  const restored = typeof window !== 'undefined' ? loadSession<PersistedSession>(SESSION_KEY) : null;

  const [theme, setTheme] = useState<ThemeMode>(restored?.theme ?? 'light');
  const [currentStep, setCurrentStep] = useState<WizardStep>(restored?.currentStep ?? 'school');
  const [schoolData, setSchoolData] = useState<SchoolData>(
    restored?.schoolData ?? {
      name: '', address: '', headTeacher: '', contact: '', className: '', termName: '', logo: null, classTeacher: '', ministryName: '',
    }
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(restored?.selectedSubjects ?? []);
  // Files cannot be persisted but parsed term data can — strip File refs on restore.
  const [terms, setTerms] = useState<TermUpload[]>(
    restored?.terms
      ? restored.terms.map(t => ({ ...t, testFile: null, examFile: null }))
      : defaultTerms
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [reportCardStyle, setReportCardStyle] = useState<ReportCardStyle>(restored?.reportCardStyle ?? 'colorful');
  const [gradingRules, setGradingRules] = useState<GradingRule[]>(restored?.gradingRules ?? [...DEFAULT_GRADING_RULES]);
  const [template, setTemplate] = useState<ReportCardTemplate>(restored?.template ?? 'classic');

  // Auto-save full session on every change.
  useSessionAutoSave<PersistedSession>(SESSION_KEY, {
    theme, currentStep, schoolData, selectedSubjects, terms, reportCardStyle, gradingRules, template,
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-colorful');
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'colorful') root.classList.add('theme-colorful');
  }, [theme]);

  // Tutorial drives the wizard: when the user advances or closes the tutorial,
  // it dispatches `edubel:goto-step` so the right page is on screen.
  useEffect(() => {
    const onGoto = (e: Event) => {
      const detail = (e as CustomEvent<{ step: WizardStep }>).detail;
      if (detail?.step) setCurrentStep(detail.step);
    };
    window.addEventListener('edubel:goto-step', onGoto);
    return () => window.removeEventListener('edubel:goto-step', onGoto);
  }, []);

  // Merge students when terms are updated
  useEffect(() => {
    const merged = mergeStudentsFromTerms(terms);
    setStudents(merged);
    const allSubjects = new Set<string>();
    terms.forEach((t) => {
      if (t.testParsedData) t.testParsedData.detectedSubjects.forEach((sub) => allSubjects.add(sub));
      if (t.examParsedData) t.examParsedData.detectedSubjects.forEach((sub) => allSubjects.add(sub));
    });
    if (allSubjects.size > 0 && selectedSubjects.length === 0) {
      setSelectedSubjects(Array.from(allSubjects));
    }
  }, [terms]);

  const stepIndex = STEP_ORDER.indexOf(currentStep);

  const goNext = () => {
    if (stepIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[stepIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const goBack = () => {
    if (stepIndex > 0) {
      setCurrentStep(STEP_ORDER[stepIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCreateNew = () => {
    if (!confirm('Start over? This will clear current students and uploads (school info is kept).')) return;
    setTerms(defaultTerms);
    setStudents([]);
    setSelectedSubjects([]);
    setCurrentStep('school');
    toast({ title: 'New report card session', description: 'Ready to start fresh.' });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'school':
        return <SchoolSetup schoolData={schoolData} onSchoolDataChange={setSchoolData} />;
      case 'terms':
        return <TermSelector terms={terms} onTermsChange={setTerms} />;
      case 'upload':
        return <MultiFileUpload terms={terms} onTermsUpdate={setTerms} />;
      case 'grading':
        return <GradingSystem rules={gradingRules} onRulesChange={setGradingRules} />;
      case 'preview':
        return (
          <ReportCardPreview
            students={students}
            school={schoolData}
            selectedSubjects={selectedSubjects}
            terms={terms}
            reportCardStyle={reportCardStyle}
            onStyleChange={setReportCardStyle}
            gradingRules={gradingRules}
            template={template}
          />
        );
    }
  };

  const isLast = stepIndex === STEP_ORDER.length - 1;
  const isFirst = stepIndex === 0;
  const labels = STEP_LABELS[currentStep];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <WelcomeModal />
        <TutorialGuide />
        <SpreadsheetEditor />

        <AppSidebar
          theme={theme}
          onThemeChange={setTheme}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          onCreateNew={handleCreateNew}
          template={template}
          onTemplateChange={setTemplate}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-40 h-14 flex items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur px-3">
            <SidebarTrigger className="shrink-0">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-semibold truncate">{labels.title}</h2>
              <p className="text-[11px] text-muted-foreground truncate hidden sm:block">{labels.subtitle}</p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-medium">
              <Sparkles className="h-3 w-3" />
              {stepIndex + 1} / {STEP_ORDER.length}
            </div>
          </header>

          <main className="flex-1">
            {/* Progress bar */}
            <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border/40">
              <div className="container px-4 py-2">
                <div className="flex items-center gap-1">
                  {STEP_ORDER.map((s, i) => (
                    <div
                      key={s}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i <= stepIndex ? 'bg-gradient-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Step content */}
            <section className="container px-4 py-6 sm:py-8 animate-fade-up" key={currentStep}>
              {renderStep()}
            </section>

            {/* Nav buttons */}
            <section className="container px-4 pb-8">
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/40">
                <Button
                  variant="outline"
                  onClick={goBack}
                  disabled={isFirst}
                  className="gap-2 btn-bounce"
                  size="lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>

                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {labels.title}
                </span>

                <Button
                  onClick={goNext}
                  disabled={isLast}
                  className="gap-2 bg-gradient-primary text-primary-foreground btn-bounce"
                  size="lg"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </section>

            {/* FAQ anchor (accessible from sidebar) */}
            <div id="faq">
              <FAQSection />
            </div>
          </main>

          <DeveloperBio />
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
