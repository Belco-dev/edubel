import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Shield, Wifi, WifiOff, UserX, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ThemeMode } from '@/types/reportCard';

const About = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemeMode>('light');

  const promises = [
    {
      icon: Shield,
      title: '100% Local Processing',
      description: 'Your student names and grades are never uploaded to our servers. All Excel parsing and PDF generation happens entirely in your browser.',
    },
    {
      icon: WifiOff,
      title: 'Offline Ready',
      description: 'Once loaded, turn off Wi-Fi and continue generating reports securely. The app works fully offline thanks to service worker caching.',
    },
    {
      icon: UserX,
      title: 'Zero Accounts',
      description: 'No sign-up, no email collection, and zero tracking. We don\'t use cookies, analytics, or any form of user identification.',
    },
    {
      icon: Lock,
      title: 'Encrypted Storage',
      description: 'Saved school info stays in your browser\'s private memory. It never syncs to any cloud and can be cleared at any time.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header theme={theme} onThemeChange={setTheme} />
      <main className="flex-1 container px-4 py-8 sm:py-16 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            Privacy Promise
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            The Edubel <span className="gradient-text">Privacy Promise</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Your students' data never leaves your computer. At Edubel, we believe in <strong>Privacy by Design</strong>.
          </p>
        </div>

        <div className="space-y-4">
          {promises.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 items-start p-5 sm:p-6 rounded-2xl bg-card border border-border"
            >
              <div className="w-11 h-11 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-base sm:text-lg mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 p-5 rounded-2xl bg-muted/50 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Privacy Note:</strong> Data processing happens 100% on your device. Internet is only needed for the initial load.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
