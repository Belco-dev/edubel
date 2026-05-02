import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Zap, Download, Wifi, ScanLine, ArrowRight, BookOpen, Users, FileSpreadsheet, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import edubelLogo from '@/assets/edubel-logo.png';
import heroImg from '@/assets/landing-hero.jpg';

const features = [
  { icon: Zap, title: 'Lightning fast', text: 'Generate hundreds of report cards in seconds, fully offline.' },
  { icon: Lock, title: 'Privacy first', text: 'No accounts, no servers. Student data never leaves your browser.' },
  { icon: ShieldCheck, title: 'QR authenticity', text: 'Every card carries a tamper-proof QR — scan to verify originals.' },
  { icon: Wifi, title: 'Works offline', text: 'Install once and keep generating cards even without internet.' },
  { icon: BookOpen, title: 'Rwandan curriculum', text: 'Pre-loaded subjects from Nursery 1 to Senior 6.' },
  { icon: Download, title: 'Batch download', text: 'Export every card and a class summary as one ZIP file.' },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur bg-background/85 border-b border-border/40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover-scale">
            <img src={edubelLogo} alt="EduBel logo" className="h-8 w-8 object-contain rounded-md" width={32} height={32} />
            <span className="font-display font-bold text-lg gradient-text">EDUBEL</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link to="/scan">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ScanLine className="h-4 w-4" /> <span className="hidden sm:inline">Verify</span>
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">About</Button>
            </Link>
            <Link to="/app">
              <Button size="sm" className="gap-1.5 bg-gradient-primary text-primary-foreground btn-bounce">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        {/* animated gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-pulse" />
          <div className="absolute top-40 -right-20 h-72 w-72 rounded-full bg-secondary/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container relative mx-auto px-4 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5 animate-fade-in">
              <Badge variant="outline" className="gap-1.5 border-primary/40 bg-primary/5 text-primary">
                <Sparkles className="h-3 w-3" /> 100% Free · No Sign Up
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight">
                Beautiful report cards for{' '}
                <span className="gradient-text">every Rwandan classroom</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
                EduBel turns your Excel marks into polished, single-page report cards with one click —
                privately, offline, and with QR-verified authenticity.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/app">
                  <Button size="lg" className="gap-2 bg-gradient-primary text-primary-foreground btn-bounce">
                    Create Report Cards <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/scan">
                  <Button size="lg" variant="outline" className="gap-2">
                    <ScanLine className="h-5 w-5" /> Verify a Card
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-4 pt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> Schools across Rwanda</span>
                <span className="flex items-center gap-1.5"><FileSpreadsheet className="h-4 w-4 text-secondary" /> N1 → S6</span>
              </div>
            </div>

            <div className="relative animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/30 via-secondary/20 to-accent/30 blur-2xl rounded-3xl" />
              <img
                src={heroImg}
                alt="Teacher and students using EduBel report cards in a Rwandan classroom"
                width={1024}
                height={1024}
                className="relative rounded-3xl shadow-2xl border border-border/40 hover-scale"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <Badge variant="outline" className="border-secondary/40 bg-secondary/5 text-secondary">Why EduBel</Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold">
            Everything you need. <span className="gradient-text">Nothing you don't.</span>
          </h2>
          <p className="text-muted-foreground">
            Designed for teachers — not engineers. Built for the Rwandan curriculum, end to end.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, text }, i) => (
            <div
              key={title}
              className="group p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-lg transition-all hover-scale animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10 space-y-2">
          <Badge variant="outline">How it works</Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold">From Excel to PDF in 5 steps</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {['Set up school', 'Pick terms', 'Upload marks', 'Tune grading', 'Download PDFs'].map((step, i) => (
            <div key={step} className="relative p-4 rounded-2xl border border-border/60 bg-card hover-scale animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
                {i + 1}
              </div>
              <p className="pt-2 font-medium text-sm">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QR AUTHENTICITY HIGHLIGHT */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-3xl bg-gradient-primary text-primary-foreground p-8 sm:p-12 text-center shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-1/4 h-40 w-40 rounded-full bg-white blur-2xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-white blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <ShieldCheck className="h-12 w-12 mx-auto mb-3 animate-bounce" />
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3 relative">Stop fake report cards</h2>
          <p className="max-w-xl mx-auto mb-6 opacity-95 relative">
            Every PDF carries a cryptographically signed QR. Parents and schools can scan to instantly confirm the card is genuine — and tampered copies are exposed on sight.
          </p>
          <Link to="/scan" className="relative inline-block">
            <Button size="lg" variant="secondary" className="gap-2 btn-bounce">
              <ScanLine className="h-5 w-5" /> Try the Verifier
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center space-y-5">
        <h2 className="text-3xl sm:text-5xl font-display font-bold">
          Ready in <span className="gradient-text">2 minutes.</span>
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">No download. No account. Just open and create.</p>
        <Link to="/app">
          <Button size="lg" className="gap-2 bg-gradient-primary text-primary-foreground btn-bounce">
            Start Now — It's Free <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </section>

      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        EDUBEL · A Division of Belcom · Built for Rwandan teachers
      </footer>
    </div>
  );
};

export default Landing;
