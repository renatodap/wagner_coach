'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Clock } from 'lucide-react'
import { searchFoods, getRecentFoods, type Food } from '@/lib/api/foods'
import { createClient } from '@/lib/supabase/client'

interface FoodSearchV2Props {
  onSelectFood: (food: Food) => void
  placeholder?: string
  showRecentFoods?: boolean
}

export function FoodSearchV2({
  onSelectFood,
  placeholder = 'Search foods...',
  showRecentFoods = true
}: FoodSearchV2Props) {
  const [query, setQuery] = useState('')
  const [foods, setFoods] = useState<Food[]>([])
  const [recentFoods, setRecentFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load recent foods on mount
  useEffect(() => {
    if (showRecentFoods) {
      loadRecentFoods()
    }
  }, [showRecentFoods])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query)
      } else if (query.length === 0) {
        setFoods([])
        setError(null)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  async function loadRecentFoods() {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        return
      }

      const response = await getRecentFoods({
        limit: 10,
        token: session.access_token
      })

      setRecentFoods(response.foods)
    } catch (err) {
      console.error('Error loading recent foods:', err)
    }
  }

  async function performSearch(searchQuery: string) {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await searchFoods(searchQuery, {
        limit: 20,
        includeRecent: true,
        token: session.access_token
      })

      setFoods(response.foods)
    } catch (err) {
      console.error('Error searching foods:', err)
      setError(err instanceof Error ? err.message : 'Failed to search foods')
      setFoods([])
    } finally {
      setLoading(false)
    }
  }

  function handleSelectFood(food: Food) {
    onSelectFood(food)
    setQuery('')
    setShowResults(false)
  }

  function formatNutrition(food: Food): string {
    const parts: string[] = []
    if (food.calories) parts.push(`${Math.round(food.calories)} cal`)
    if (food.protein_g) parts.push(`${food.protein_g.toFixed(1)}g protein`)
    return parts.join(' • ')
  }

  const displayFoods = query.length >= 2 ? foods : (showResults ? recentFoods : [])

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="w-full bg-white border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          autoComplete="off"
        />
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-green-500 rounded-full mb-2" />
              <p>Searching foods...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">
              <p>{error}</p>
            </div>
          ) : displayFoods.length > 0 ? (
            <>
              {query.length < 2 && recentFoods.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <Clock size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">Recent Foods</span>
                </div>
              )}
              <div className="divide-y divide-gray-100">
                {displayFoods.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => handleSelectFood(food)}
                    className="w-full p-4 hover:bg-green-50 transition-colors text-left group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                          {food.name}
                          {food.brand_name && (
                            <span className="text-gray-500 text-sm ml-2 font-normal">
                              {food.brand_name}
                            </span>
                          )}
                          {food.is_recent && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              Recent
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {food.serving_size} {food.serving_unit}
                          {food.last_quantity && food.last_unit && (
                            <span className="ml-2 text-blue-600">
                              (last: {food.last_quantity} {food.last_unit})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {formatNutrition(food)}
                        </div>
                      </div>
                      <Plus className="text-gray-400 group-hover:text-green-600 transition-colors ml-2 flex-shrink-0" size={20} />
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No foods found. Try a different search term.</p>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">Start typing to search foods</p>
              {showRecentFoods && recentFoods.length === 0 && (
                <p className="text-xs mt-2">Recent foods will appear here after you log meals</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
