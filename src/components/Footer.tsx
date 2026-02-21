import { Heart, Mail } from 'lucide-react';
export function Footer() {
  return <footer className="border-t border-border/40 bg-muted/30 py-6 mt-auto">
      <div className="container text-center">
        <p className="flex items-center justify-center gap-2 text-[#131335] mx-px py-0 px-0 text-xs font-serif font-bold">
          Made with{' '}
          <Heart className="fill-secondary animate-pulse w-[20px] h-[20px] bg-destructive-foreground text-destructive" />{' '}
          by <span className="font-semibold text-foreground">Belco / Call and Whatsapp +250799389818 / Buy me a cup of coffee if satisfied. MOMO 1348629</span>
        </p>
        <a className="inline-flex items-center gap-2 mt-2 text-sm transition-colors btn-bounce text-green font-serif font-extrabold text-center" href="">   
nzirorerabelico@gmail.com <Mail className="h-4 w-4" />
          nzirorerabelico@gmail.com
        </a>
      </div>
    </footer>;}