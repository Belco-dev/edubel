import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ArrowDown, ArrowUp, ArrowRight, ChevronRight, ChevronLeft, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TutorialStep {
  targetId: string;
  title: string;
  description: string;
  arrowDirection: 'down' | 'up' | 'right' | 'left';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: 'school-setup-section',
    title: 'Step 1: School Setup',
    description: 'Fill in your school details like name, address, head teacher, and class info. You can also upload your school logo. Empty fields won\'t appear on the report card.',
    arrowDirection: 'down',
  },
  {
    targetId: 'school-setup-submit',
    title: 'Step 2: Submit & Preview Format',
    description: 'Click this button to open the Report Card Format Editor. You can drag fields to reorder them, edit table column titles, and customize the layout.',
    arrowDirection: 'up',
  },
  {
    targetId: 'term-selector-section',
    title: 'Step 3: Select Terms',
    description: 'Choose which terms to include in your report card. You can select one term or multiple terms for a combined report.',
    arrowDirection: 'down',
  },
  {
    targetId: 'file-upload-section',
    title: 'Step 4: Upload Marks',
    description: 'Upload Excel files containing student test and exam marks for each selected term. The system will automatically detect subjects and student names.',
    arrowDirection: 'down',
  },
  {
    targetId: 'subject-selector-section',
    title: 'Step 5: Select Subjects',
    description: 'Review and adjust the detected subjects. You can add or remove subjects that appear on the report card.',
    arrowDirection: 'down',
  },
  {
    targetId: 'grading-system-section',
    title: 'Step 6: Grading System',
    description: 'Customize the grading ranges and auto-comments. The default grading is already set, but you can edit marks ranges and comments to match your school\'s system.',
    arrowDirection: 'down',
  },
  {
    targetId: 'report-preview-section',
    title: 'Step 7: Preview & Download',
    description: 'Preview each student\'s report card here. Use the Download PDF or Download All as ZIP buttons to get your finished report cards!',
    arrowDirection: 'down',
  },
];

const STORAGE_KEY = 'edubel_tutorial_completed';

interface TutorialGuideProps {
  onDownloadComplete?: () => void;
}

export function TutorialGuide({ onDownloadComplete }: TutorialGuideProps) {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [showWellDone, setShowWellDone] = useState(false);
  const [showFooterHighlight, setShowFooterHighlight] = useState(false);
  const animFrameRef = useRef<number>(0);

  // Check if tutorial was previously dismissed
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Auto-start for first time users after a short delay
      const timer = setTimeout(() => setActive(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (!active) return;
    const step = TUTORIAL_STEPS[currentStep];
    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
      // Scroll element into view
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [active, currentStep]);

  useEffect(() => {
    if (!active) return;
    // Delay to allow scroll
    const timer = setTimeout(updatePosition, 400);
    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
    };
  }, [active, currentStep, updatePosition]);

  const handleClose = () => {
    setActive(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setActive(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Listen for global restart events (from sidebar menu, etc.)
  useEffect(() => {
    const onRestart = () => handleRestart();
    window.addEventListener('edubel:restart-tutorial', onRestart);
    return () => window.removeEventListener('edubel:restart-tutorial', onRestart);
  }, []);

  // Called externally when download completes
  useEffect(() => {
    if (!onDownloadComplete) return;
  }, [onDownloadComplete]);

  if (showWellDone) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 animate-fade-in">
        <div className="bg-card border-2 border-primary rounded-2xl p-8 text-center shadow-2xl animate-scale-in">
          <PartyPopper className="h-16 w-16 mx-auto text-primary mb-4" />
          <h2 className="text-3xl font-bold gradient-text mb-2">Well Done! 🎉</h2>
          <p className="text-muted-foreground">Your report cards are ready!</p>
        </div>
      </div>
    );
  }

  if (showFooterHighlight) {
    return null; // Footer highlight is handled via CSS class
  }

  // Floating button to restart tutorial
  if (!active) {
    return (
      <button
        onClick={handleRestart}
        className="fixed bottom-20 right-4 z-50 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 tutorial-bounce"
        title="Start Tutorial"
      >
        <span className="text-lg">📖</span>
        Guide
      </button>
    );
  }

  const step = TUTORIAL_STEPS[currentStep];
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  // Calculate dialog position
  const dialogStyle: React.CSSProperties = position
    ? {
        position: 'absolute',
        zIndex: 9999,
        ...(step.arrowDirection === 'down'
          ? { top: position.top - 12, left: Math.max(16, position.left), transform: 'translateY(-100%)' }
          : step.arrowDirection === 'up'
          ? { top: position.top + 60, left: Math.max(16, position.left) }
          : { top: position.top, left: position.left + position.width + 16 }),
      }
    : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9990] bg-black/30 pointer-events-none" />

      {/* Tutorial dialog */}
      <div style={dialogStyle} className="pointer-events-auto max-w-xs sm:max-w-sm w-full">
        <div className="relative bg-card border-2 border-primary rounded-2xl shadow-2xl p-4 tutorial-dialog-bounce">
          {/* Animated Arrow */}
          <div
            className={`absolute ${
              step.arrowDirection === 'down'
                ? 'bottom-0 left-8 translate-y-full'
                : step.arrowDirection === 'up'
                ? 'top-0 left-8 -translate-y-full'
                : 'left-0 top-4 -translate-x-full'
            }`}
          >
            <div className="tutorial-arrow-bounce">
              {step.arrowDirection === 'down' && (
                <ArrowDown className="h-8 w-8 text-primary drop-shadow-lg" />
              )}
              {step.arrowDirection === 'up' && (
                <ArrowUp className="h-8 w-8 text-primary drop-shadow-lg" />
              )}
              {(step.arrowDirection === 'right' || step.arrowDirection === 'left') && (
                <ArrowRight className="h-8 w-8 text-primary drop-shadow-lg" />
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Step counter badge */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            {currentStep + 1} / {TUTORIAL_STEPS.length}
          </div>

          <h3 className="font-bold text-sm text-foreground mb-1">{step.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{step.description}</p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="h-7 text-xs gap-1"
            >
              <ChevronLeft className="h-3 w-3" /> Back
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="h-7 text-xs gap-1 bg-primary text-primary-foreground"
            >
              {isLast ? 'Finish' : 'Next'} <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Trigger "Well Done" celebration and footer highlight
export function triggerDownloadCelebration() {
  // Show well done popup
  const overlay = document.createElement('div');
  overlay.id = 'well-done-overlay';
  overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/40';
  overlay.innerHTML = `
    <div class="bg-card border-2 border-primary rounded-2xl p-8 text-center shadow-2xl animate-scale-in">
      <div style="font-size:64px;margin-bottom:12px">🎉</div>
      <h2 class="text-3xl font-bold mb-2" style="background:linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)));-webkit-background-clip:text;-webkit-text-fill-color:transparent">Well Done!</h2>
      <p class="text-muted-foreground">Your report cards are ready!</p>
    </div>
  `;
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.remove();

    // Scroll to footer and highlight
    const footer = document.querySelector('footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      footer.classList.add('footer-celebration-ring');
      setTimeout(() => {
        footer.classList.remove('footer-celebration-ring');
      }, 3000);
    }
  }, 3000);
}

// Restart the tutorial from anywhere
export function restartTutorial() {
  window.dispatchEvent(new Event('edubel:restart-tutorial'));
}
