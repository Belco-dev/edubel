import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const WELCOME_KEY = 'edubel_welcome_seen';

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(WELCOME_KEY)) {
      setOpen(true);
    }
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem(WELCOME_KEY, 'true');
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleGetStarted(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-primary/20 bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-display text-center leading-tight">
            🏫 Welcome to Edubel
            <span className="block text-sm sm:text-base font-medium text-muted-foreground mt-1">
              The Privacy-First Report Card Generator
            </span>
          </DialogTitle>
          <DialogDescription className="pt-4 text-left space-y-4 text-sm sm:text-base">
            <p className="text-foreground/80">
              We believe student data belongs in the classroom, not the cloud. Edubel is built with your security in mind:
            </p>

            <div className="space-y-3">
              <div className="flex gap-3 items-start p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-lg shrink-0">🔒</span>
                <div>
                  <p className="font-semibold text-foreground">Privacy by Design</p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Your files stay on your computer. Processing happens 100% in your browser.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-lg shrink-0">📡</span>
                <div>
                  <p className="font-semibold text-foreground">Works Offline</p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Once loaded, you can generate reports anywhere—no Wi-Fi needed.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-lg shrink-0">⚡</span>
                <div>
                  <p className="font-semibold text-foreground">No Accounts</p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    No sign-up, no passwords, no data tracking. Just upload, create, and download.
                  </p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Button
          onClick={handleGetStarted}
          size="lg"
          className="w-full mt-2 bg-gradient-primary text-primary-foreground font-semibold text-base shadow-md hover:shadow-lg transition-shadow"
        >
          Get Started
        </Button>
      </DialogContent>
    </Dialog>
  );
}
