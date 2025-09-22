'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';
import { FoodUnit } from '@/types/nutrition-v2';

export default function CreateFoodPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState<FoodUnit>('g');
  const [servingDescription, setServingDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Food name is required');
      return;
    }

    setSaving(true);

    try {
      const foodData = {
        name: name.trim(),
        brand: brand.trim() || null,
        barcode: barcode.trim() || null,
        serving_size: parseFloat(servingSize) || 100,
        serving_unit: servingUnit,
        serving_description: servingDescription.trim() || null,
        calories: calories ? parseFloat(calories) : null,
        protein_g: protein ? parseFloat(protein) : null,
        carbs_g: carbs ? parseFloat(carbs) : null,
        fat_g: fat ? parseFloat(fat) : null,
        fiber_g: fiber ? parseFloat(fiber) : null,
        sugar_g: sugar ? parseFloat(sugar) : null,
        sodium_mg: sodium ? parseFloat(sodium) : null,
        is_public: isPublic,
      };

      const response = await fetch('/api/nutrition/foods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(foodData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create food');
      }

      // Redirect back to add meal page
      router.push('/nutrition/add');
    } catch (error) {
      console.error('Error creating food:', error);
      alert(error instanceof Error ? error.message : 'Failed to create food');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/nutrition/add"
              className="text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="font-heading text-4xl text-iron-orange">CREATE CUSTOM FOOD</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border border-iron-gray p-6 space-y-6">
            <h2 className="font-heading text-xl text-iron-white">BASIC INFORMATION</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Food Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="e.g., Protein Bar"
                  required
                />
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="e.g., MyProtein"
                />
              </div>
            </div>

            <div>
              <label className="block text-iron-gray text-xs uppercase mb-2">
                Barcode (Optional)
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                placeholder="e.g., 1234567890"
              />
            </div>
          </div>

          {/* Serving Information */}
          <div className="border border-iron-gray p-6 space-y-6">
            <h2 className="font-heading text-xl text-iron-white">SERVING INFORMATION</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Serving Size *
                </label>
                <input
                  type="number"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="100"
                  step="0.1"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Unit *
                </label>
                <select
                  value={servingUnit}
                  onChange={(e) => setServingUnit(e.target.value as FoodUnit)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                >
                  <option value="g">grams (g)</option>
                  <option value="ml">milliliters (ml)</option>
                  <option value="oz">ounces (oz)</option>
                  <option value="cup">cup</option>
                  <option value="tbsp">tablespoon</option>
                  <option value="tsp">teaspoon</option>
                  <option value="serving">serving</option>
                  <option value="piece">piece</option>
                </select>
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={servingDescription}
                  onChange={(e) => setServingDescription(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="e.g., 1 bar, 2 scoops"
                />
              </div>
            </div>
          </div>

          {/* Nutritional Information */}
          <div className="border border-iron-gray p-6 space-y-6">
            <h2 className="font-heading text-xl text-iron-white">NUTRITIONAL INFORMATION</h2>
            <p className="text-iron-gray text-sm">Per serving size specified above</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Calories
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Fat (g)
                </label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Fiber (g)
                </label>
                <input
                  type="number"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Sugar (g)
                </label>
                <input
                  type="number"
                  value={sugar}
                  onChange={(e) => setSugar(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Sodium (mg)
                </label>
                <input
                  type="number"
                  value={sodium}
                  onChange={(e) => setSodium(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Privacy Setting */}
          <div className="border border-iron-gray p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 bg-iron-black border-2 border-iron-gray checked:bg-iron-orange checked:border-iron-orange focus:outline-none"
              />
              <div>
                <span className="text-iron-white">Make this food public</span>
                <p className="text-iron-gray text-sm">
                  Other users will be able to search and use this food
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-iron-orange text-iron-black font-heading py-3 uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Creating...' : 'Create Food'}
            </button>
            <Link
              href="/nutrition/add"
              className="flex-1 border border-iron-gray text-iron-white font-heading py-3 uppercase tracking-wider hover:bg-iron-gray/20 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}