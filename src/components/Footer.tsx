import { Heart, Mail } from 'lucide-react';
export function Footer() {
  return <footer className="border-t border-border/40 bg-muted/30 py-6 mt-auto">
      <div className="container text-center">
        <p className="flex items-center justify-center gap-2 text-muted-foreground">
          Made with{' '}
          <Heart className="h-4 w-4 text-secondary fill-secondary animate-pulse" />{' '}
          by <span className="font-semibold text-foreground">Belco       /     Call and Whatsapp +250799389818  /       Buy me a cup of coffee if satisfied.</span>
        </p>
        <a href="mailto:nzirorerabelico@gmail.com" className="inline-flex items-center gap-2 mt-2 text-sm text-primary hover:text-primary/80 transition-colors btn-bounce">mail me at: nzirorerabelico@gmail.com<Mail className="h-4 w-4" />
          nzirorerabelico@gmail.com
        </a>
      </div>
    </footer>;
}