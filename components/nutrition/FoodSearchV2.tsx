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

  // Load recent foods on mount (only when auth is ready)
  useEffect(() => {
    if (showRecentFoods) {
      // Check auth first, then load
      const supabase = createClient()
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          loadRecentFoods(session.access_token)
        }
      })
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

  async function loadRecentFoods(token: string) {
    try {
      const response = await getRecentFoods({
        limit: 10,
        token
      })

      setRecentFoods(response.foods)
    } catch (err) {
      console.error('Error loading recent foods:', err)
      // Silently fail for recent foods - not critical
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

      console.log('🔍 [FoodSearch] Searching for:', searchQuery)
      console.log('🔑 [FoodSearch] Token present:', !!session.access_token, 'Length:', session.access_token.length)

      const response = await searchFoods(searchQuery, {
        limit: 20,
        includeRecent: true,
        token: session.access_token
      })

      console.log('✅ [FoodSearch] Search results:', {
        query: searchQuery,
        totalFound: response.foods.length,
        foodNames: response.foods.map(f => f.name).slice(0, 5)
      })

      setFoods(response.foods)
    } catch (err) {
      console.error('❌ [FoodSearch] Search error:', err)
      console.error('❌ [FoodSearch] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        query: searchQuery
      })
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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-iron-gray" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="w-full bg-neutral-800 border border-iron-gray/30 text-white placeholder:text-iron-gray pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-iron-orange focus:border-transparent transition-all"
          autoComplete="off"
        />
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute z-[999] w-full mt-2 bg-neutral-800 border border-iron-gray/30 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-iron-gray">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-iron-gray border-t-iron-orange rounded-full mb-2" />
              <p>Searching foods...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-400">
              <p>{error}</p>
            </div>
          ) : displayFoods.length > 0 ? (
            <>
              {query.length < 2 && recentFoods.length > 0 && (
                <div className="px-4 py-2 bg-iron-black/50 border-b border-iron-gray/20 flex items-center gap-2">
                  <Clock size={16} className="text-iron-gray" />
                  <span className="text-sm font-medium text-iron-gray">Recent Foods</span>
                </div>
              )}
              <div className="divide-y divide-iron-gray/20">
                {displayFoods.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => handleSelectFood(food)}
                    className="w-full p-4 hover:bg-iron-orange/10 transition-colors text-left group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-white group-hover:text-iron-orange transition-colors">
                          {food.name}
                          {food.brand_name && (
                            <span className="text-iron-gray text-sm ml-2 font-normal">
                              {food.brand_name}
                            </span>
                          )}

                          {/* Type badges */}
                          {food.is_recent && (
                            <span className="ml-2 px-2 py-0.5 bg-iron-orange/20 text-iron-orange text-xs rounded-full">
                              🕐 Recent
                            </span>
                          )}
                          {food.is_user_template && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                              💾 My Meal
                            </span>
                          )}
                          {food.is_restaurant && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                              🍽️ Restaurant
                            </span>
                          )}
                          {food.is_community && (
                            <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                              👥 Community
                            </span>
                          )}
                          {food.is_favorite && (
                            <span className="ml-2 text-yellow-500">⭐</span>
                          )}
                        </div>

                        {/* Description for templates */}
                        {food.is_template && food.description && (
                          <div className="text-xs text-iron-gray/80 mt-0.5 italic">
                            {food.description}
                          </div>
                        )}

                        <div className="text-sm text-iron-gray mt-1">
                          {food.serving_size} {food.serving_unit}
                          {food.last_quantity && food.last_unit && (
                            <span className="ml-2 text-iron-orange">
                              (last: {food.last_quantity} {food.last_unit})
                            </span>
                          )}
                          {food.is_template && food.use_count && food.use_count > 0 && (
                            <span className="ml-2 text-iron-gray/70">
                              • Used {food.use_count} time{food.use_count !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-iron-gray mt-1">
                          {formatNutrition(food)}
                        </div>
                      </div>
                      <Plus className="text-iron-gray group-hover:text-iron-orange transition-colors ml-2 flex-shrink-0" size={20} />
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-iron-gray">
              <p>No foods found. Try a different search term.</p>
            </div>
          ) : (
            <div className="p-4 text-center text-iron-gray">
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
