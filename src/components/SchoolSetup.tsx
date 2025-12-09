import { useState, useRef } from 'react';
import { Building2, User, Phone, Calendar, Upload, ImageIcon, X } from 'lucide-react';
import { SchoolData } from '@/types/reportCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface SchoolSetupProps {
  schoolData: SchoolData;
  onSchoolDataChange: (data: SchoolData) => void;
}

export function SchoolSetup({ schoolData, onSchoolDataChange }: SchoolSetupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

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
            <Label htmlFor="headTeacher" className="flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              Head Teacher / Principal
            </Label>
            <Input
              id="headTeacher"
              placeholder="Principal's name"
              value={schoolData.headTeacher}
              onChange={(e) => onSchoolDataChange({ ...schoolData, headTeacher: e.target.value })}
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
      </CardContent>
    </Card>
  );
}
