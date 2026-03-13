import { GraduationCap, Moon, Sun, Palette, Download, CheckCircle, Wifi } from 'lucide-react';
import { ThemeMode } from '@/types/reportCard';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export function Header({ theme, onThemeChange }: HeaderProps) {
  const { isOfflineReady, canInstall, install } = usePWA();

  const themes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
    { mode: 'light', icon: Sun, label: 'Light' },
    { mode: 'dark', icon: Moon, label: 'Dark' },
    { mode: 'colorful', icon: Palette, label: 'Colorful' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary rounded-xl blur-lg opacity-50" />
            <div className="relative bg-gradient-primary p-2.5 rounded-xl">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold gradient-text">
              EDUBEL
            </h1>
            <p className="text-xs text-muted-foreground -mt-1">
              Student Report Card Generator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOfflineReady && (
            <Badge variant="outline" className="hidden sm:inline-flex gap-1 border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 text-[10px] px-2 py-0.5">
              <CheckCircle className="h-3 w-3" />
              Offline Ready
            </Badge>
          )}

          {canInstall && (
            <Button variant="outline" size="sm" onClick={install} className="hidden sm:inline-flex gap-1 text-xs">
              <Download className="h-3.5 w-3.5" />
              Install Edubel
            </Button>
          )}

          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl">
            {themes.map(({ mode, icon: Icon, label }) => (
              <Button
                key={mode}
                variant={theme === mode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onThemeChange(mode)}
                className={`gap-2 btn-bounce ${
                  theme === mode
                    ? 'bg-gradient-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile install + offline row */}
      {(canInstall || isOfflineReady) && (
        <div className="sm:hidden flex items-center justify-center gap-2 pb-2">
          {isOfflineReady && (
            <Badge variant="outline" className="gap-1 border-green-500/30 bg-green-500/10 text-green-700 text-[10px] px-2 py-0.5">
              <CheckCircle className="h-3 w-3" />
              Offline Ready
            </Badge>
          )}
          {canInstall && (
            <Button variant="outline" size="sm" onClick={install} className="gap-1 text-xs h-7">
              <Download className="h-3 w-3" />
              Install
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
