'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface CreateWorkoutFormProps {
  userId: string;
}

export default function CreateWorkoutForm({ userId }: CreateWorkoutFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name || !type || !difficulty) {
      setError(
        'Please fill out all required fields: Name, Type, and Difficulty.'
      );
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from('workouts')
      .insert({
        name,
        description,
        type,
        difficulty,
        is_public: isPublic,
        user_id: userId
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating workout:', insertError);
      setError(`Failed to create workout: ${insertError.message}`);
      setLoading(false);
    } else if (data) {
      // Redirect to the edit page for the new workout
      router.push(`/workouts/edit/${data.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="text-red-500 bg-red-500/10 border border-red-500 p-3">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-iron-gray">
          Workout Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Morning Push Day"
          className="bg-iron-gray/10 border-iron-gray text-iron-white"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-iron-gray">
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief summary of the workout's focus and goals."
          className="bg-iron-gray/10 border-iron-gray text-iron-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="type" className="text-iron-gray">
            Workout Type
          </Label>
          <Select onValueChange={setType} value={type}>
            <SelectTrigger className="bg-iron-gray/10 border-iron-gray text-iron-white">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent className="bg-iron-black border-iron-gray text-iron-white">
              <SelectItem value="push">Push</SelectItem>
              <SelectItem value="pull">Pull</SelectItem>
              <SelectItem value="legs">Legs</SelectItem>
              <SelectItem value="upper">Upper</SelectItem>
              <SelectItem value="lower">Lower</SelectItem>
              <SelectItem value="full_body">Full Body</SelectItem>
              <SelectItem value="core">Core</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty" className="text-iron-gray">
            Difficulty
          </Label>
          <Select onValueChange={setDifficulty} value={difficulty}>
            <SelectTrigger className="bg-iron-gray/10 border-iron-gray text-iron-white">
              <SelectValue placeholder="Select a difficulty" />
            </SelectTrigger>
            <SelectContent className="bg-iron-black border-iron-gray text-iron-white">
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => setIsPublic(Boolean(checked))}
          className="border-iron-gray"
        />
        <Label htmlFor="isPublic" className="text-iron-gray font-normal">
          Make this workout a public template
        </Label>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-iron-gray">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-iron-gray text-iron-gray hover:bg-iron-gray/20"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-iron-orange text-iron-black hover:bg-iron-white"
        >
          {loading ? 'Saving...' : 'Save and Add Exercises'}
        </Button>
      </div>
    </form>
  );
}
