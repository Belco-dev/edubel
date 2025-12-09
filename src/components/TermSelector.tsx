import { ClipboardList, Check } from 'lucide-react';
import { TermSection } from '@/types/reportCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface TermSelectorProps {
  sections: TermSection[];
  onSectionsChange: (sections: TermSection[]) => void;
}

const sectionColors: Record<string, string> = {
  'midterm': 'bg-yellow/20 text-yellow border-yellow/30',
  'term1': 'bg-green/20 text-green border-green/30',
  'term2': 'bg-blue/20 text-blue border-blue/30',
  'term3': 'bg-purple/20 text-purple border-purple/30',
};

export function TermSelector({ sections, onSectionsChange }: TermSelectorProps) {
  const toggleSection = (sectionId: string) => {
    onSectionsChange(
      sections.map(s => 
        s.id === sectionId ? { ...s, selected: !s.selected } : s
      )
    );
  };

  const selectedCount = sections.filter(s => s.selected).length;

  return (
    <Card className="card-hover overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple to-blue text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <ClipboardList className="h-5 w-5" />
              Report Card Sections
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Choose which sections to include on report cards
            </CardDescription>
          </div>
          <Badge className="bg-background/20 text-primary-foreground">
            {selectedCount} selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground mb-4">
          Select the terms/tests you want to include. You'll upload marks for each selected section.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`relative flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                section.selected 
                  ? `${sectionColors[section.id]} border-current` 
                  : 'border-border hover:border-primary/30 hover:bg-muted/50'
              }`}
              onClick={() => toggleSection(section.id)}
            >
              <Checkbox
                id={section.id}
                checked={section.selected}
                onCheckedChange={() => toggleSection(section.id)}
                className="pointer-events-none"
              />
              <div className="flex-1">
                <label 
                  htmlFor={section.id}
                  className="font-medium cursor-pointer block"
                >
                  {section.name}
                </label>
                <span className="text-xs text-muted-foreground">
                  {section.shortName}
                </span>
              </div>
              {section.selected && section.file && (
                <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Uploaded
                </Badge>
              )}
            </div>
          ))}
        </div>
        
        {selectedCount === 0 && (
          <p className="text-sm text-destructive mt-4">
            Please select at least one section to generate report cards.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
