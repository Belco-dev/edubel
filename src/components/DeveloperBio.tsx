import { GraduationCap, ExternalLink, Mail, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DeveloperBio() {
  return (
    <section className="py-10 sm:py-14 bg-muted/60 border-t border-border/40">
      <div className="container px-4 max-w-3xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
          <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-primary flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="text-center sm:text-left space-y-3">
            <h3 className="text-lg sm:text-xl font-display font-bold">
              Developed by Prof. Tr. Belco N.
            </h3>
            <blockquote className="text-sm sm:text-base text-muted-foreground italic border-l-2 border-primary pl-4">
              "I am a dedicated Science, Mathematics, and ICT specialist committed
              to making STEM education accessible and efficient. Edubel was created
              to empower fellow educators with secure, easy-to-use digital tools."
            </blockquote>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground gap-1.5">
                <a href="https://www.upwork.com/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Upwork Profile
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href="mailto:belco@example.com">
                  <Mail className="h-3.5 w-3.5" />
                  Contact
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
