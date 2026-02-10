import { useState, useRef } from 'react';
import { Building2, Phone, Calendar, Upload, ImageIcon, X, FileText, GraduationCap, Plus, Trash2, GripVertical } from 'lucide-react';
import { SchoolData, CustomDetail } from '@/types/reportCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SchoolSetupProps {
  schoolData: SchoolData;
  onSchoolDataChange: (data: SchoolData) => void;
}

export function SchoolSetup({ schoolData, onSchoolDataChange }: SchoolSetupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleFieldDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleFieldDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleFieldDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const items = [...(schoolData.customDetails || [])];
    const [moved] = items.splice(dragIndex, 1);
    items.splice(index, 0, moved);
    onSchoolDataChange({ ...schoolData, customDetails: items });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onSchoolDataChange({
        ...schoolData,
        logo: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleLogoUpload(file);
    }
  };

  const handleCustomDetailChange = (field: 'text' | 'position', value: string) => {
    const current = schoolData.customDetail || { text: '', position: 'topLeft' as const };
    onSchoolDataChange({
      ...schoolData,
      customDetail: {
        ...current,
        [field]: value,
      } as CustomDetail,
    });
  };

  return (
    <Card className="card-hover overflow-hidden">
      <CardHeader className="bg-gradient-primary text-primary-foreground">
        <CardTitle className="flex items-center gap-2 font-display">
          <Building2 className="h-5 w-5" />
          School Information
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Enter your school details for the report cards
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Logo Upload */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            School Logo
          </Label>
          <div
            className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 ${
              dragOver 
                ? 'border-primary bg-primary/5 scale-[1.02]' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {schoolData.logo ? (
              <div className="flex items-center gap-4">
                <img 
                  src={schoolData.logo} 
                  alt="School Logo" 
                  className="h-20 w-20 object-contain rounded-lg bg-muted p-2"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Logo uploaded</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive/80 mt-1"
                    onClick={() => onSchoolDataChange({ ...schoolData, logo: null })}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="flex flex-col items-center gap-2 cursor-pointer py-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-3 bg-primary/10 rounded-full">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Drag & drop logo here or <span className="text-primary font-medium">browse</span>
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Optional Ministry/Header Field */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ministryName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-accent" />
              Ministry/Header (Optional)
            </Label>
            <Input
              id="ministryName"
              placeholder="e.g., Ministry of Education, Rwanda"
              value={schoolData.ministryName || ''}
              onChange={(e) => onSchoolDataChange({ ...schoolData, ministryName: e.target.value })}
              className="transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              School Name
            </Label>
            <Input
              id="schoolName"
              placeholder="Enter school name"
              value={schoolData.name}
              onChange={(e) => onSchoolDataChange({ ...schoolData, name: e.target.value })}
              className="transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-secondary" />
              Address
            </Label>
            <Input
              id="address"
              placeholder="School address"
              value={schoolData.address}
              onChange={(e) => onSchoolDataChange({ ...schoolData, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-green" />
              Contact Number
            </Label>
            <Input
              id="contact"
              placeholder="Phone number"
              value={schoolData.contact}
              onChange={(e) => onSchoolDataChange({ ...schoolData, contact: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="className" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue" />
              Class Name
            </Label>
            <Input
              id="className"
              placeholder="e.g., P5A, S3 Science"
              value={schoolData.className}
              onChange={(e) => onSchoolDataChange({ ...schoolData, className: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classTeacher" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple" />
              Class Teacher Name
            </Label>
            <Input
              id="classTeacher"
              placeholder="Enter class teacher name"
              value={schoolData.classTeacher || ''}
              onChange={(e) => onSchoolDataChange({ ...schoolData, classTeacher: e.target.value })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="termName" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple" />
              Term Name
            </Label>
            <Input
              id="termName"
              placeholder="e.g., First Term 2024"
              value={schoolData.termName}
              onChange={(e) => onSchoolDataChange({ ...schoolData, termName: e.target.value })}
            />
          </div>
        </div>

        {/* Custom Detail Fields */}
        <div className="pt-4 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-base font-medium">
              <FileText className="h-4 w-4 text-accent" />
              Custom Fields (Optional)
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const current = schoolData.customDetails || [];
                onSchoolDataChange({
                  ...schoolData,
                  customDetails: [...current, { text: '', position: 'topLeft' as const }],
                });
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Add extra information to appear on the report card</p>
          
          {/* Legacy single custom detail */}
          {schoolData.customDetail?.text && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label>Detail Text</Label>
                <Input
                  placeholder="e.g., Academic Year 2024-2025"
                  value={schoolData.customDetail.text}
                  onChange={(e) => handleCustomDetailChange('text', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={schoolData.customDetail.position} onValueChange={(v) => handleCustomDetailChange('position', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="topLeft">Top Left</SelectItem>
                    <SelectItem value="topRight">Top Right</SelectItem>
                    <SelectItem value="bottomLeft">Bottom Left</SelectItem>
                    <SelectItem value="bottomRight">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Dynamic custom details */}
          {(schoolData.customDetails || []).map((detail, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleFieldDragStart(index)}
              onDragOver={(e) => handleFieldDragOver(e, index)}
              onDrop={() => handleFieldDrop(index)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              className={`grid grid-cols-[auto_1fr_1fr_auto] md:grid-cols-[auto_2fr_1fr_auto] gap-4 items-end transition-all ${
                dragOverIndex === index ? 'border-t-2 border-primary' : ''
              } ${dragIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-center cursor-grab active:cursor-grabbing pt-6">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label>Field {index + 1} Text</Label>
                <Input
                  placeholder="e.g., P.O. Box 123, Kigali"
                  value={detail.text}
                  onChange={(e) => {
                    const updated = [...(schoolData.customDetails || [])];
                    updated[index] = { ...updated[index], text: e.target.value };
                    onSchoolDataChange({ ...schoolData, customDetails: updated });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Select 
                  value={detail.position} 
                  onValueChange={(v) => {
                    const updated = [...(schoolData.customDetails || [])];
                    updated[index] = { ...updated[index], position: v as CustomDetail['position'] };
                    onSchoolDataChange({ ...schoolData, customDetails: updated });
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="topLeft">Top Left</SelectItem>
                    <SelectItem value="topRight">Top Right</SelectItem>
                    <SelectItem value="bottomLeft">Bottom Left</SelectItem>
                    <SelectItem value="bottomRight">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive/80"
                onClick={() => {
                  const updated = (schoolData.customDetails || []).filter((_, i) => i !== index);
                  onSchoolDataChange({ ...schoolData, customDetails: updated });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {(!schoolData.customDetails || schoolData.customDetails.length === 0) && !schoolData.customDetail?.text && (
            <p className="text-xs text-muted-foreground italic text-center py-2">Click "Add Field" to add custom information to your report cards</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
