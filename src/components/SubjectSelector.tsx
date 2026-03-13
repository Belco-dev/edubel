import { useState } from 'react';
import { BookOpen, ChevronDown, Check, X } from 'lucide-react';
import { rwandanSubjects, subjectCategories } from '@/data/rwandanSubjects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SubjectSelectorProps {
  selectedSubjects: string[];
  onSubjectsChange: (subjects: string[]) => void;
}

const categoryColors: Record<string, string> = {
  'Languages': 'bg-blue/20 text-blue border-blue/30',
  'Sciences': 'bg-green/20 text-green border-green/30',
  'Social Studies': 'bg-purple/20 text-purple border-purple/30',
  'Arts & Religion': 'bg-coral/20 text-coral border-coral/30',
  'Technical': 'bg-yellow/20 text-yellow border-yellow/30',
  'Physical Education': 'bg-teal/20 text-teal border-teal/30',
  'Pre-Primary': 'bg-secondary/20 text-secondary border-secondary/30',
  'Additional': 'bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30',
};

export function SubjectSelector({ selectedSubjects, onSubjectsChange }: SubjectSelectorProps) {
  const [openCategories, setOpenCategories] = useState<string[]>(['Languages', 'Sciences']);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleSubject = (subjectName: string) => {
    onSubjectsChange(
      selectedSubjects.includes(subjectName)
        ? selectedSubjects.filter(s => s !== subjectName)
        : [...selectedSubjects, subjectName]
    );
  };

  const selectAllInCategory = (category: string) => {
    const categorySubjects = rwandanSubjects
      .filter(s => s.category === category)
      .map(s => s.name);
    
    const allSelected = categorySubjects.every(s => selectedSubjects.includes(s));
    
    if (allSelected) {
      onSubjectsChange(selectedSubjects.filter(s => !categorySubjects.includes(s)));
    } else {
      const newSubjects = [...new Set([...selectedSubjects, ...categorySubjects])];
      onSubjectsChange(newSubjects);
    }
  };

  const selectAll = () => {
    onSubjectsChange(rwandanSubjects.map(s => s.name));
  };

  const clearAll = () => {
    onSubjectsChange([]);
  };

  const [sectionOpen, setSectionOpen] = useState(true);

  return (
    <Card className="card-hover overflow-hidden">
      <CardHeader className="bg-gradient-secondary text-secondary-foreground cursor-pointer select-none" onClick={() => setSectionOpen(!sectionOpen)}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <BookOpen className="h-5 w-5" />
              Select Subjects
            </CardTitle>
            <CardDescription className="text-secondary-foreground/80">
              Choose subjects for the report cards
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-background/20 text-secondary-foreground">
              {selectedSubjects.length} selected
            </Badge>
            <ChevronDown className={`h-5 w-5 text-secondary-foreground transition-transform duration-200 ${sectionOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </CardHeader>
      {sectionOpen && <CardContent className="p-6">
        <div className="flex gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={selectAll}
            className="btn-bounce"
          >
            <Check className="h-4 w-4 mr-1" />
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAll}
            className="btn-bounce"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {subjectCategories.map((category) => {
            const categorySubjects = rwandanSubjects.filter(s => s.category === category);
            const selectedCount = categorySubjects.filter(s => 
              selectedSubjects.includes(s.name)
            ).length;
            const allSelected = selectedCount === categorySubjects.length && categorySubjects.length > 0;
            
            return (
              <Collapsible 
                key={category}
                open={openCategories.includes(category)}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger asChild>
                  <div 
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01] border ${categoryColors[category] || 'bg-muted'}`}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform ${
                          openCategories.includes(category) ? 'rotate-180' : ''
                        }`} 
                      />
                      <span className="font-medium">{category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {selectedCount}/{categorySubjects.length}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectAllInCategory(category);
                      }}
                      className="h-7 text-xs"
                    >
                      {allSelected ? 'Deselect' : 'Select'} All
                    </Button>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 ml-8">
                    {categorySubjects.map((subject) => (
                      <div
                        key={subject.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all hover:bg-muted ${
                          selectedSubjects.includes(subject.name) 
                            ? 'bg-primary/10 border border-primary/30' 
                            : ''
                        }`}
                        onClick={() => toggleSubject(subject.name)}
                      >
                        <Checkbox
                          id={subject.id}
                          checked={selectedSubjects.includes(subject.name)}
                          onCheckedChange={() => toggleSubject(subject.name)}
                        />
                        <label 
                          htmlFor={subject.id}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {subject.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
