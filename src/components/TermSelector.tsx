import { ClipboardList, Check } from 'lucide-react';
import { TermUpload } from '@/types/reportCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface TermSelectorProps {
  terms: TermUpload[];
  onTermsChange: (terms: TermUpload[]) => void;
}

const termColors: Record<string, string> = {
  'term1': 'bg-green/20 text-green border-green/30',
  'term2': 'bg-blue/20 text-blue border-blue/30',
  'term3': 'bg-purple/20 text-purple border-purple/30',
};

export function TermSelector({ terms, onTermsChange }: TermSelectorProps) {
  const toggleTerm = (termId: string) => {
    onTermsChange(
      terms.map(t => 
        t.id === termId ? { ...t, selected: !t.selected } : t
      )
    );
  };

  const selectedCount = terms.filter(t => t.selected).length;

  return (
    <Card className="card-hover overflow-hidden" id="term-selector-section">
      <CardHeader className="bg-gradient-to-r from-purple to-blue text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <ClipboardList className="h-5 w-5" />
              Select Terms
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Choose which terms to include on report cards
            </CardDescription>
          </div>
          <Badge className="bg-background/20 text-primary-foreground">
            {selectedCount} selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <p className="text-sm text-muted-foreground mb-4">
          For each selected term, you'll upload TEST marks and EXAM marks separately.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {terms.map((term) => {
            const hasTestData = !!term.testParsedData;
            const hasExamData = !!term.examParsedData;
            
            return (
              <div
                key={term.id}
                className={`relative flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                  term.selected 
                    ? `${termColors[term.id]} border-current` 
                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                }`}
                onClick={() => toggleTerm(term.id)}
              >
                <Checkbox
                  id={term.id}
                  checked={term.selected}
                  onCheckedChange={() => toggleTerm(term.id)}
                  className="pointer-events-none"
                />
                <div className="flex-1">
                  <label 
                    htmlFor={term.id}
                    className="font-medium cursor-pointer block text-sm sm:text-base"
                  >
                    {term.name}
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {term.shortName}
                  </span>
                </div>
                {term.selected && (hasTestData || hasExamData) && (
                  <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    {hasTestData && hasExamData ? 'Both' : hasTestData ? 'Test' : 'Exam'}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
        
        {selectedCount === 0 && (
          <p className="text-sm text-destructive mt-4">
            Please select at least one term.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
