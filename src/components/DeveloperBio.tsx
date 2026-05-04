import { GraduationCap, ExternalLink, Mail, Linkedin, Globe, Heart } from 'lucide-react';
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
                <a href="https://www.upwork.com/freelancers/~017f07db2d489300c2?mp_source=share" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Upwork Profile
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href="https://www.linkedin.com/in/nzirorera-belco-89260535a" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href="mailto:nzirorerabelico@gmail.com">
                  <Mail className="h-3.5 w-3.5" />
                  Contact
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href="https://belcom.carrd.co/" target="_blank" rel="noopener noreferrer">
                  <Globe className="h-3.5 w-3.5" />
                  A.O.B
                </a>
              </Button>
              <Button asChild variant="destructive" size="sm" className="gap-1.5">
                <a href="https://wa.me/250799389818" target="_blank" rel="noopener noreferrer">
                  <Heart className="h-3.5 w-3.5" />
                  Donate
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
