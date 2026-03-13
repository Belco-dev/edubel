import { Heart, Shield, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function Footer() {
  const { clearStoredData } = usePWA();

  return (
    <footer className="border-t border-border/40 bg-muted/30 py-6 mt-auto">
      <div className="container px-4 space-y-4">
        {/* Privacy note */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground">
          <Shield className="inline h-3.5 w-3.5 mr-1 text-primary" />
          Data processing happens 100% on your device. Internet is only needed for the initial load.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link to="/about" className="text-xs sm:text-sm text-primary hover:underline underline-offset-4 inline-flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            How we protect your data
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive gap-1 h-7">
                <Trash2 className="h-3 w-3" />
                Clear Stored Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all stored data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all saved school information and preferences from this browser. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearStoredData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Clear Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          Made with <Heart className="h-4 w-4 fill-primary text-primary animate-pulse" /> by{' '}
          <span className="font-semibold text-foreground">Belco</span>
          <span className="hidden sm:inline">| Call & Whatsapp +250799389818 | MOMO 1348629</span>
        </p>
      </div>
    </footer>
  );
}
