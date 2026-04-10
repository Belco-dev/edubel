import { useState } from 'react';
import { GraduationCap, Plus, Trash2, ChevronDown } from 'lucide-react';
import { GradingRule } from '@/types/reportCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const DEFAULT_GRADING_RULES: GradingRule[] = [
  { min: 80, max: 100, comment: 'Excellent, keep it up!' },
  { min: 75, max: 79, comment: 'Very good, Try to improve' },
  { min: 70, max: 74, comment: 'Good, more effort is needed!' },
  { min: 65, max: 69, comment: 'Tried, Work harder than before' },
  { min: 50, max: 64, comment: 'Put much effort' },
  { min: 0, max: 49, comment: 'Fail, Put as much effort as possible' },
];

interface GradingSystemProps {
  rules: GradingRule[];
  onRulesChange: (rules: GradingRule[]) => void;
}

export function getAutoComment(percentage: number, rules: GradingRule[]): string {
  const activeRules = rules.length > 0 ? rules : DEFAULT_GRADING_RULES;
  for (const rule of activeRules) {
    if (percentage >= rule.min && percentage <= rule.max) {
      return rule.comment;
    }
  }
  return '';
}

export function GradingSystem({ rules, onRulesChange }: GradingSystemProps) {
  const [sectionOpen, setSectionOpen] = useState(false);

  const activeRules = rules.length > 0 ? rules : DEFAULT_GRADING_RULES;

  const handleRuleChange = (index: number, field: keyof GradingRule, value: string) => {
    const updated = [...activeRules];
    if (field === 'comment') {
      updated[index] = { ...updated[index], comment: value };
    } else {
      updated[index] = { ...updated[index], [field]: parseInt(value, 10) || 0 };
    }
    onRulesChange(updated);
  };

  const addRule = () => {
    onRulesChange([...activeRules, { min: 0, max: 0, comment: '' }]);
  };

  const removeRule = (index: number) => {
    onRulesChange(activeRules.filter((_, i) => i !== index));
  };

  const resetToDefaults = () => {
    onRulesChange([...DEFAULT_GRADING_RULES]);
  };

  return (
    <Card className="card-hover overflow-hidden" id="grading-system-section">
      <CardHeader
        className="bg-gradient-primary text-primary-foreground cursor-pointer select-none"
        onClick={() => setSectionOpen(!sectionOpen)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <GraduationCap className="h-5 w-5" />
              Grading System
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Auto-comment rules based on percentage ranges
            </CardDescription>
          </div>
          <ChevronDown className={`h-5 w-5 text-primary-foreground transition-transform duration-200 ${sectionOpen ? 'rotate-180' : ''}`} />
        </div>
      </CardHeader>
      {sectionOpen && (
        <CardContent className="p-4 sm:p-6 space-y-4">
          <p className="text-xs text-muted-foreground">
            These comments auto-fill the Observation box on each report card based on a student's percentage.
          </p>
          <div className="space-y-2">
            {activeRules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <Input
                  type="number"
                  value={rule.min}
                  onChange={e => handleRuleChange(index, 'min', e.target.value)}
                  className="w-16 text-center text-sm"
                  placeholder="Min"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="number"
                  value={rule.max}
                  onChange={e => handleRuleChange(index, 'max', e.target.value)}
                  className="w-16 text-center text-sm"
                  placeholder="Max"
                />
                <span className="text-xs text-muted-foreground">%</span>
                <Input
                  value={rule.comment}
                  onChange={e => handleRuleChange(index, 'comment', e.target.value)}
                  className="flex-1 text-sm"
                  placeholder="Comment..."
                />
                <Button variant="ghost" size="icon" className="text-destructive flex-shrink-0" onClick={() => removeRule(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addRule}>
              <Plus className="h-4 w-4 mr-1" /> Add Rule
            </Button>
            <Button variant="ghost" size="sm" onClick={resetToDefaults}>
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
