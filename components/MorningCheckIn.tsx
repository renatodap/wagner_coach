'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Sun,
  Moon,
  Battery,
  Brain,
  Smile,
  Frown,
  Meh,
  Check,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MorningCheckInProps {
  trigger?: React.ReactNode;
}

export function MorningCheckIn({ trigger }: MorningCheckInProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [sleepQuality, setSleepQuality] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [mood, setMood] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [muscleSoreness, setMuscleSoreness] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement API call to save morning check-in
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call

      toast({
        title: 'Check-In Complete',
        description: 'Your morning metrics have been recorded.',
      });

      setOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save your check-in. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSleepQuality(5);
    setEnergyLevel(5);
    setMood(5);
    setStressLevel(5);
    setMuscleSoreness(0);
    setNotes('');
  };

  const getMoodIcon = (value: number) => {
    if (value >= 7) return <Smile className="h-5 w-5 text-green-500" />;
    if (value >= 4) return <Meh className="h-5 w-5 text-yellow-500" />;
    return <Frown className="h-5 w-5 text-red-500" />;
  };

  const getSliderColor = (value: number) => {
    if (value >= 7) return 'text-green-600';
    if (value >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-iron-orange hover:bg-orange-600">
            <Sun className="mr-2 h-4 w-4" />
            Morning Check-In
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-iron-black border-iron-gray">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading text-iron-white flex items-center gap-2">
            <Sun className="h-6 w-6 text-iron-orange" />
            MORNING CHECK-IN
          </DialogTitle>
          <DialogDescription className="text-iron-gray">
            Quick daily assessment to track your recovery and readiness
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Sleep Quality */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-iron-white flex items-center gap-2">
                <Moon className="h-4 w-4 text-iron-orange" />
                Sleep Quality
              </Label>
              <span className={`font-bold ${getSliderColor(sleepQuality)}`}>
                {sleepQuality}/10
              </span>
            </div>
            <Slider
              value={[sleepQuality]}
              onValueChange={(value) => setSleepQuality(value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-iron-gray">
              How well did you sleep last night? (1 = Poor, 10 = Excellent)
            </p>
          </div>

          {/* Energy Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-iron-white flex items-center gap-2">
                <Battery className="h-4 w-4 text-iron-orange" />
                Energy Level
              </Label>
              <span className={`font-bold ${getSliderColor(energyLevel)}`}>
                {energyLevel}/10
              </span>
            </div>
            <Slider
              value={[energyLevel]}
              onValueChange={(value) => setEnergyLevel(value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-iron-gray">
              How energized do you feel? (1 = Exhausted, 10 = Fully Charged)
            </p>
          </div>

          {/* Mood */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-iron-white flex items-center gap-2">
                {getMoodIcon(mood)}
                Mood
              </Label>
              <span className={`font-bold ${getSliderColor(mood)}`}>
                {mood}/10
              </span>
            </div>
            <Slider
              value={[mood]}
              onValueChange={(value) => setMood(value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-iron-gray">
              How do you feel mentally? (1 = Very Low, 10 = Excellent)
            </p>
          </div>

          {/* Stress Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-iron-white flex items-center gap-2">
                <Brain className="h-4 w-4 text-iron-orange" />
                Stress Level
              </Label>
              <span className={`font-bold ${getSliderColor(11 - stressLevel)}`}>
                {stressLevel}/10
              </span>
            </div>
            <Slider
              value={[stressLevel]}
              onValueChange={(value) => setStressLevel(value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-iron-gray">
              How stressed do you feel? (1 = No Stress, 10 = Very Stressed)
            </p>
          </div>

          {/* Muscle Soreness */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-iron-white">
                Muscle Soreness
              </Label>
              <span className={`font-bold ${getSliderColor(11 - muscleSoreness)}`}>
                {muscleSoreness}/10
              </span>
            </div>
            <Slider
              value={[muscleSoreness]}
              onValueChange={(value) => setMuscleSoreness(value[0])}
              max={10}
              min={0}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-iron-gray">
              Overall muscle soreness level (0 = None, 10 = Very Sore)
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label className="text-iron-white">
              Notes (Optional)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about how you're feeling..."
              className="min-h-[80px] bg-iron-black border-iron-gray text-iron-white"
              maxLength={500}
            />
            <p className="text-xs text-iron-gray text-right">
              {notes.length}/500
            </p>
          </div>

          {/* Summary */}
          <div className="p-4 bg-iron-gray/10 rounded-lg border border-iron-gray">
            <h4 className="text-sm font-medium text-iron-white mb-2">Quick Assessment:</h4>
            <div className="space-y-1 text-sm text-iron-gray">
              <p>• Sleep: {sleepQuality >= 7 ? 'Great' : sleepQuality >= 4 ? 'Fair' : 'Poor'}</p>
              <p>• Energy: {energyLevel >= 7 ? 'High' : energyLevel >= 4 ? 'Moderate' : 'Low'}</p>
              <p>• Readiness: {(sleepQuality + energyLevel - stressLevel - (muscleSoreness / 2)) >= 10 ? 'Ready to Train' : 'Consider Easy Training'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-iron-gray text-iron-white hover:bg-iron-gray"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-iron-orange hover:bg-orange-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Complete Check-In
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
