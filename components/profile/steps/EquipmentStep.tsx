'use client';

import React, { useState } from 'react';
import { EquipmentStepProps, ValidationResult, EQUIPMENT_CATEGORIES } from '@/types/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Home, Building2, AlertCircle, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EquipmentStep({ data, onChange, onValidate, isActive }: EquipmentStepProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['cardio', 'strength']);
  const [customEquipment, setCustomEquipment] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasNoEquipment, setHasNoEquipment] = useState(
    data.available_equipment?.includes('bodyweight') || false
  );

  const handleEquipmentToggle = (equipment: string, checked: boolean) => {
    const current = data.available_equipment || [];

    if (equipment === 'bodyweight') {
      // Special handling for "no equipment" option
      if (checked) {
        onChange({ ...data, available_equipment: ['bodyweight'] });
        setHasNoEquipment(true);
      } else {
        onChange({ ...data, available_equipment: [] });
        setHasNoEquipment(false);
      }
      return;
    }

    if (hasNoEquipment && checked) {
      // If "no equipment" is selected, deselect it when selecting other equipment
      setHasNoEquipment(false);
      onChange({ ...data, available_equipment: [equipment] });
    } else {
      const updated = checked
        ? [...current, equipment]
        : current.filter(e => e !== equipment);
      onChange({ ...data, available_equipment: updated });
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAddCustomEquipment = () => {
    if (!customEquipment.trim()) return;

    const current = data.available_equipment || [];
    if (!current.includes(customEquipment)) {
      onChange({
        ...data,
        available_equipment: [...current, customEquipment]
      });
    }
    setCustomEquipment('');
  };

  const handleRemoveCustomEquipment = (item: string) => {
    const current = data.available_equipment || [];
    onChange({
      ...data,
      available_equipment: current.filter(e => e !== item)
    });
  };

  const handleLimitationsChange = (value: string) => {
    // Split by newlines and filter empty lines
    const limitations = value.split('\n').filter(l => l.trim());
    onChange({
      ...data,
      physical_limitations: limitations
    });
  };

  const validate = (): ValidationResult => {
    const newErrors: Record<string, string> = {};

    // Equipment is optional, so no validation needed unless you want to enforce at least one selection

    setErrors(newErrors);

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: Object.entries(newErrors).map(([field, message]) => ({ field, message }))
    };
  };

  // Expose validation for parent component
  React.useEffect(() => {
    onValidate = validate;
  }, [data]);

  if (!isActive) return null;

  // Get custom equipment (items not in predefined categories)
  const customEquipmentItems = (data.available_equipment || []).filter(item =>
    !EQUIPMENT_CATEGORIES.flatMap(cat => cat.items.map(i => i.id)).includes(item) &&
    item !== 'bodyweight'
  );

  return (
    <div className="space-y-6">
      {/* Location Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Where Do You Train?</CardTitle>
          <CardDescription>
            This helps us recommend appropriate workouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              className={cn(
                "p-4 rounded-lg border-2 transition-colors",
                "flex flex-col items-center",
                data.available_equipment?.length === 0 || hasNoEquipment
                  ? "border-primary bg-primary/10"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => handleEquipmentToggle('bodyweight', true)}
            >
              <Home className="h-8 w-8 mb-2" />
              <span className="font-medium">Home</span>
              <span className="text-xs text-muted-foreground">No equipment</span>
            </button>

            <button
              className={cn(
                "p-4 rounded-lg border-2 transition-colors",
                "flex flex-col items-center",
                data.available_equipment?.length > 0 && !hasNoEquipment
                  ? "border-primary bg-primary/10"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => {
                setHasNoEquipment(false);
                if (data.available_equipment?.includes('bodyweight')) {
                  onChange({ ...data, available_equipment: [] });
                }
              }}
            >
              <Building2 className="h-8 w-8 mb-2" />
              <span className="font-medium">Gym/Home Gym</span>
              <span className="text-xs text-muted-foreground">Select equipment</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Selection */}
      {!hasNoEquipment && (
        <Card>
          <CardHeader>
            <CardTitle>Available Equipment</CardTitle>
            <CardDescription>
              Select all equipment you have regular access to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {EQUIPMENT_CATEGORIES.filter(cat => cat.id !== 'none').map((category) => (
              <Collapsible
                key={category.id}
                open={expandedCategories.includes(category.id)}
                onOpenChange={() => handleCategoryToggle(category.id)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-muted">
                  <span className="font-medium">{category.name}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {category.items.filter(item =>
                        data.available_equipment?.includes(item.id)
                      ).length} / {category.items.length}
                    </Badge>
                    {expandedCategories.includes(category.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 pt-2 space-y-2">
                  {category.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={data.available_equipment?.includes(item.id) || false}
                        onCheckedChange={(checked) => handleEquipmentToggle(item.id, !!checked)}
                      />
                      <Label htmlFor={item.id} className="flex-1 cursor-pointer">
                        <span className={cn(
                          "text-sm",
                          item.isCommon && "font-medium"
                        )}>
                          {item.name}
                        </span>
                        {item.isCommon && (
                          <Badge variant="outline" className="ml-2 text-xs">Popular</Badge>
                        )}
                        {item.requiresSpace && (
                          <Badge variant="outline" className="ml-2 text-xs">Needs space</Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}

            {/* Custom Equipment */}
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-2 block">Other Equipment</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add custom equipment..."
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomEquipment();
                    }
                  }}
                />
                <Button
                  onClick={handleAddCustomEquipment}
                  disabled={!customEquipment.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {customEquipmentItems.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {customEquipmentItems.map(item => (
                    <Badge key={item} variant="secondary" className="pr-1">
                      {item}
                      <button
                        onClick={() => handleRemoveCustomEquipment(item)}
                        className="ml-2 hover:bg-gray-200 rounded p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Physical Limitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Physical Limitations or Injuries
          </CardTitle>
          <CardDescription>
            Help us create safe workouts by sharing any physical constraints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Examples:
- Lower back pain
- Knee injury (right knee)
- Limited shoulder mobility
- Recovering from surgery
- Pregnancy
- Chronic conditions"
            rows={6}
            value={(data.physical_limitations || []).join('\n')}
            onChange={(e) => handleLimitationsChange(e.target.value)}
          />
          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Privacy Notice:</strong> This information is kept strictly confidential
              and is only used to ensure your safety during workouts. We recommend consulting
              with a healthcare provider before starting any new exercise program.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Summary */}
      {data.available_equipment && data.available_equipment.length > 0 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Your Setup</CardTitle>
          </CardHeader>
          <CardContent>
            {hasNoEquipment ? (
              <div className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Bodyweight training (no equipment needed)</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">Equipment Available:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.available_equipment.map(item => {
                    const equipment = EQUIPMENT_CATEGORIES
                      .flatMap(cat => cat.items)
                      .find(e => e.id === item);
                    return (
                      <Badge key={item} variant="outline">
                        {equipment?.name || item}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {data.physical_limitations && data.physical_limitations.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">Limitations to Consider:</span>
                </div>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {data.physical_limitations.map((limitation, idx) => (
                    <li key={idx}>{limitation}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}