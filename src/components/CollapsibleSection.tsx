import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  children: ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({ children, defaultOpen = true }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  // Find CardHeader inside children to attach toggle
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="absolute top-4 right-4 z-10 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
        aria-label={open ? 'Collapse section' : 'Expand section'}
      >
        <ChevronDown
          className={`h-5 w-5 text-primary-foreground transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div>
        {/* Always show the card shell; toggle content visibility */}
        <div className={open ? '' : '[&_.card-collapsible-content]:hidden'}>
          {children}
        </div>
      </div>
    </div>
  );
}
