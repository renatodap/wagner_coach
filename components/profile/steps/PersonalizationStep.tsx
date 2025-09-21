'use client';

import React, { useState } from 'react';
import { PersonalizationStepProps, ValidationResult } from '@/types/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { TimePicker } from '@/components/ui/time-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Mail, Smartphone, Calendar, Brain, Salad, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'keto', label: 'Keto', icon: '🥑' },
  { value: 'paleo', label: 'Paleo', icon: '🍖' },
  { value: 'gluten_free', label: 'Gluten-Free', icon: '🌾' },
  { value: 'dairy_free', label: 'Dairy-Free', icon: '🥛' },
  { value: 'low_carb', label: 'Low Carb', icon: '🍞' },
  { value: 'high_protein', label: 'High Protein', icon: '💪' },
  { value: 'mediterranean', label: 'Mediterranean', icon: '🫒' },
  { value: 'intermittent_fasting', label: 'Intermittent Fasting', icon: '⏰' },
  { value: 'whole30', label: 'Whole30', icon: '30' },
  { value: 'none', label: 'No Restrictions', icon: '✨' }
];

export function PersonalizationStep({ data, onChange, onValidate, isActive }: PersonalizationStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAboutMeChange = (value: string) => {
    onChange({ ...data, about_me: value });
  };

  const handleDietaryToggle = (diet: string, checked: boolean) => {
    const current = data.dietary_preferences || [];

    if (diet === 'none') {
      // If selecting "no restrictions", clear all others
      onChange({ ...data, dietary_preferences: checked ? ['none'] : [] });
      return;
    }

    // If selecting a specific diet, remove "none" if present
    let updated = current.filter(d => d !== 'none');

    if (checked) {
      updated = [...updated, diet];
    } else {
      updated = updated.filter(d => d !== diet);
    }

    onChange({ ...data, dietary_preferences: updated });
  };

  const handleNotificationChange = (key: string, value: any) => {
    const currentPrefs = data.notification_preferences || {
      email_notifications: true,
      push_notifications: true,
      workout_reminders: true,
      progress_updates: true,
      coach_messages: true,
      weekly_summary: true,
      reminder_time: null
    };

    onChange({
      ...data,
      notification_preferences: {
        ...currentPrefs,
        [key]: value
      }
    });
  };

  const validate = (): ValidationResult => {
    const newErrors: Record<string, string> = {};

    // About me is optional but has max length
    if (data.about_me && data.about_me.length > 2000) {
      newErrors.about_me = 'About me text is too long (max 2000 characters)';
    }

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

  const notifications = data.notification_preferences || {
    email_notifications: true,
    push_notifications: true,
    workout_reminders: true,
    progress_updates: true,
    coach_messages: true,
    weekly_summary: true,
    reminder_time: null
  };

  const hasNoDietaryRestrictions = data.dietary_preferences?.includes('none') || false;

  return (
    <div className="space-y-6">
      {/* About Me */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            Tell Us About Yourself
          </CardTitle>
          <CardDescription>
            Share anything that will help our AI coach understand you better
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Examples:
- I'm training for my first marathon in 6 months
- I work long hours and need quick morning workouts
- I have two kids and limited time for exercise
- I played sports in college and want to get back in shape
- I'm recovering from an injury and building back slowly
- I prefer outdoor activities over gym workouts"
            rows={8}
            value={data.about_me || ''}
            onChange={(e) => handleAboutMeChange(e.target.value)}
            maxLength={2000}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-muted-foreground">
              This helps create truly personalized workout plans
            </p>
            <span className="text-xs text-muted-foreground">
              {data.about_me?.length || 0} / 2000
            </span>
          </div>
          {errors.about_me && (
            <p className="text-sm text-red-500 mt-2">{errors.about_me}</p>
          )}
        </CardContent>
      </Card>

      {/* Dietary Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Salad className="mr-2 h-5 w-5" />
            Dietary Preferences
          </CardTitle>
          <CardDescription>
            We'll provide nutrition guidance based on your preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {DIETARY_OPTIONS.map((diet) => (
              <div
                key={diet.value}
                className={cn(
                  "flex items-center space-x-2 p-2 rounded-lg",
                  diet.value === 'none' && "col-span-3 border bg-muted/50"
                )}
              >
                <Checkbox
                  id={diet.value}
                  checked={data.dietary_preferences?.includes(diet.value) || false}
                  onCheckedChange={(checked) => handleDietaryToggle(diet.value, !!checked)}
                  disabled={diet.value !== 'none' && hasNoDietaryRestrictions}
                />
                <Label
                  htmlFor={diet.value}
                  className="flex items-center space-x-1 cursor-pointer"
                >
                  <span className="text-lg">{diet.icon}</span>
                  <span className="text-sm">{diet.label}</span>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Stay motivated with timely reminders and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="channels" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="types">Content</TabsTrigger>
            </TabsList>

            <TabsContent value="channels" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notif" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email Notifications</span>
                </Label>
                <Switch
                  id="email-notif"
                  checked={notifications.email_notifications}
                  onCheckedChange={(checked) =>
                    handleNotificationChange('email_notifications', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="push-notif" className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Push Notifications</span>
                </Label>
                <Switch
                  id="push-notif"
                  checked={notifications.push_notifications}
                  onCheckedChange={(checked) =>
                    handleNotificationChange('push_notifications', checked)
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="types" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="workout-remind" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Workout Reminders</span>
                </Label>
                <Switch
                  id="workout-remind"
                  checked={notifications.workout_reminders}
                  onCheckedChange={(checked) =>
                    handleNotificationChange('workout_reminders', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="progress-update" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Progress Updates</span>
                </Label>
                <Switch
                  id="progress-update"
                  checked={notifications.progress_updates}
                  onCheckedChange={(checked) =>
                    handleNotificationChange('progress_updates', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="coach-msg" className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>AI Coach Messages</span>
                </Label>
                <Switch
                  id="coach-msg"
                  checked={notifications.coach_messages}
                  onCheckedChange={(checked) =>
                    handleNotificationChange('coach_messages', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="weekly-summary" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Weekly Summary</span>
                </Label>
                <Switch
                  id="weekly-summary"
                  checked={notifications.weekly_summary}
                  onCheckedChange={(checked) =>
                    handleNotificationChange('weekly_summary', checked)
                  }
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Reminder Time */}
          {notifications.workout_reminders && (
            <div className="mt-4 pt-4 border-t">
              <Label htmlFor="reminder-time">Daily Reminder Time</Label>
              <Select
                value={notifications.reminder_time || ''}
                onValueChange={(value) => handleNotificationChange('reminder_time', value)}
              >
                <SelectTrigger id="reminder-time" className="mt-2">
                  <SelectValue placeholder="Select time for daily reminder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="06:00">6:00 AM</SelectItem>
                  <SelectItem value="07:00">7:00 AM</SelectItem>
                  <SelectItem value="08:00">8:00 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="17:00">5:00 PM</SelectItem>
                  <SelectItem value="18:00">6:00 PM</SelectItem>
                  <SelectItem value="19:00">7:00 PM</SelectItem>
                  <SelectItem value="20:00">8:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle>You're All Set! 🎉</CardTitle>
          <CardDescription>
            Here's a summary of your personalized fitness profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.about_me && (
            <div>
              <span className="text-sm font-medium">Your Story:</span>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                {data.about_me}
              </p>
            </div>
          )}

          {data.dietary_preferences && data.dietary_preferences.length > 0 && (
            <div>
              <span className="text-sm font-medium">Nutrition:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.dietary_preferences.map(diet => {
                  const d = DIETARY_OPTIONS.find(o => o.value === diet);
                  return (
                    <Badge key={diet} variant="secondary" className="text-xs">
                      {d?.icon} {d?.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <span className="text-sm font-medium">Notifications:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {notifications.email_notifications && (
                <Badge variant="outline" className="text-xs">
                  <Mail className="h-3 w-3 mr-1" /> Email
                </Badge>
              )}
              {notifications.push_notifications && (
                <Badge variant="outline" className="text-xs">
                  <Smartphone className="h-3 w-3 mr-1" /> Push
                </Badge>
              )}
              {notifications.workout_reminders && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {notifications.reminder_time || 'Daily'} Reminder
                </Badge>
              )}
            </div>
          </div>

          <div className="pt-3 border-t">
            <p className="text-sm font-medium text-primary">
              Ready to start your personalized fitness journey!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Complete" to save your profile and get started
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}