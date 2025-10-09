"use client"

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle2,
  Edit2,
  Heart,
  Utensils,
  Dumbbell,
  Target,
  Settings,
  Ruler,
  Moon,
  Brain,
  ChevronRight
} from 'lucide-react';
import type { ConsultationSummary } from '@/types/consultation';

interface StructuredDataPreviewProps {
  summary: ConsultationSummary;
  onEdit?: (category: string, data: any) => void;
  onConfirm?: () => void;
  isConfirming?: boolean;
}

interface CategoryConfig {
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  health_history: {
    title: 'Health History',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  nutrition_patterns: {
    title: 'Nutrition Patterns',
    icon: Utensils,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  training_history: {
    title: 'Training History',
    icon: Dumbbell,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  goals: {
    title: 'Goals',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  preferences: {
    title: 'Preferences',
    icon: Settings,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  measurements: {
    title: 'Measurements',
    icon: Ruler,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200'
  },
  lifestyle: {
    title: 'Lifestyle',
    icon: Moon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  psychology: {
    title: 'Psychology',
    icon: Brain,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  }
};

export function StructuredDataPreview({
  summary,
  onEdit,
  onConfirm,
  isConfirming = false
}: StructuredDataPreviewProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const renderValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">Not provided</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400 italic">None</span>;
      }
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, idx) => (
            <Badge key={idx} variant="secondary">
              {String(item)}
            </Badge>
          ))}
        </div>
      );
    }

    if (typeof value === 'object') {
      return (
        <div className="space-y-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="font-medium text-gray-700">{formatKey(k)}:</span>
              <span className="text-gray-900">{String(v)}</span>
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return value ? (
        <Badge variant="success">Yes</Badge>
      ) : (
        <Badge variant="secondary">No</Badge>
      );
    }

    return <span className="text-gray-900">{String(value)}</span>;
  };

  const formatKey = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const hasData = (data: any): boolean => {
    if (!data) return false;
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data === 'object') return Object.keys(data).length > 0;
    return true;
  };

  const categoriesWithData = Object.entries(summary)
    .filter(([key, value]) => key !== '_metadata' && hasData(value))
    .map(([key, value]) => ({ key, value, config: CATEGORY_CONFIGS[key] }))
    .filter((cat) => cat.config);

  if (categoriesWithData.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 mb-4">
          <Brain className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-gray-600">
          No data extracted yet. Continue the consultation to gather your information.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Profile Summary</h2>
          <p className="text-gray-600 mt-1">
            Review the information we've gathered from your consultation
          </p>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">{categoriesWithData.length} categories</span>
        </div>
      </div>

      {/* Categories */}
      <Accordion type="multiple" value={expandedCategories} onValueChange={setExpandedCategories}>
        {categoriesWithData.map(({ key, value, config }) => {
          const Icon = config.icon;

          return (
            <AccordionItem key={key} value={key} className="border rounded-lg mb-3">
              <AccordionTrigger className="hover:no-underline px-4 py-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`${config.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">{config.title}</h3>
                    <p className="text-sm text-gray-500">
                      {Object.keys(value || {}).length} {Object.keys(value || {}).length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(key, value);
                      }}
                      className="mr-2"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4">
                <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 space-y-3`}>
                  {Object.entries(value || {}).map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-gray-700">
                        {formatKey(k)}
                      </span>
                      <div className="text-sm">
                        {renderValue(k, v)}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Metadata (if exists) */}
      {summary._metadata && (
        <Card className="p-4 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Consultation Info</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {summary._metadata.specialist_type && (
              <div>
                <span className="text-gray-600">Specialist:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formatKey(summary._metadata.specialist_type)}
                </span>
              </div>
            )}
            {summary._metadata.total_messages && (
              <div>
                <span className="text-gray-600">Messages:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {summary._metadata.total_messages}
                </span>
              </div>
            )}
            {summary._metadata.session_duration_minutes && (
              <div>
                <span className="text-gray-600">Duration:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {summary._metadata.session_duration_minutes} minutes
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Confirm Button */}
      {onConfirm && (
        <div className="flex justify-end gap-3">
          <Button
            onClick={onConfirm}
            disabled={isConfirming}
            size="lg"
            className="px-8"
          >
            {isConfirming ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Confirming...
              </>
            ) : (
              <>
                Confirm & Continue
                <ChevronRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
