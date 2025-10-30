import { useState } from "react";
import { Utensils, Clock, Plus, ChevronRight, Star } from "lucide-react";

function BasicRecipes({ basicRecipes, handleAddRecipe }) {
  const [showRecipes, setShowRecipes] = useState(true);
  const [expandedRecipe, setExpandedRecipe] = useState(null);

  const toggleExpand = (index) => {
    setExpandedRecipe(expandedRecipe === index ? null : index);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
      {/* Header with toggle button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 shadow-sm">
            <Utensils className="h-5 w-5 text-green-700" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Basic Recipes</h2>
            <p className="text-sm text-gray-500">Quick and easy meal ideas</p>
          </div>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors rounded-lg border border-gray-200 hover:border-gray-300"
          onClick={() => setShowRecipes(!showRecipes)}
        >
          {showRecipes ? 'Hide Recipes' : 'Show Recipes'}
          <ChevronRight 
            className={`h-4 w-4 transition-transform ${showRecipes ? 'rotate-90' : ''}`} 
          />
        </button>
      </div>

      {/* Conditional recipe list */}
      {showRecipes && (
        <div className="flex flex-row gap-5 overflow-x-auto pb-4">
          {basicRecipes.map((rec, idx) => {
            const maxShow = 3;
            const moreCount = Math.max(0, (rec.ingredients?.length || 0) - maxShow);
            const isExpanded = expandedRecipe === idx;
            
            return (
              <div
                key={idx}
                className="group relative flex-shrink-0 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-100 p-5 shadow-sm transition-all duration-300 hover:shadow-xl"
                style={{ height: '340px' }}
              >
                {/* Decorative elements */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-green-50 to-emerald-50 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="pointer-events-none absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-amber-50 opacity-50" />

                <div className="relative z-10 flex flex-col h-full justify-between">
                  {/* Header section */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800 leading-tight">{rec.name}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 whitespace-nowrap">
                        <Clock className="h-3.5 w-3.5" />
                        Quick
                      </span>
                    </div>
                    {rec.notes && (
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{rec.notes}</p>
                    )}
                  </div>

                  {/* Center section with ingredients and button */}
                  <div className="flex flex-col items-center justify-center flex-1 my-4">
                    {/* Ingredients preview */}
                    <div className={`w-full transition-all duration-300 ${isExpanded ? 'mb-4' : 'mb-6'}`}>
                      <div 
                        className="rounded-xl bg-white ring-1 ring-gray-100 p-3 cursor-pointer hover:ring-green-200 transition-all"
                        onClick={() => toggleExpand(idx)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Ingredients
                          </p>
                          <ChevronRight 
                            className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                          />
                        </div>
                        
                        <ul className="space-y-1.5">
                          {(rec.ingredients || [])
                            .slice(0, isExpanded ? rec.ingredients.length : maxShow)
                            .map((ing, i) => (
                              <li key={i} className="text-sm text-gray-700 flex justify-between">
                                <span>{ing.name}</span>
                                <span className="text-gray-500 font-medium">× {ing.quantity}</span>
                              </li>
                            ))}
                          {!isExpanded && moreCount > 0 && (
                            <li className="text-xs text-gray-500 text-center pt-1">
                              + {moreCount} more ingredients
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Centered Add to Meal Plan button */}
                    <div className="flex justify-center w-full">
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
                        onClick={() => handleAddRecipe(rec)}
                        title="Add this recipe to your meal plan"
                      >
                        <Plus className="h-4.5 w-4.5" />
                        Add to Meal Plan
                      </button>
                    </div>
                  </div>

                  {/* Footer section - could add ratings or additional info */}
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>4.8</span>
                    </span>
                    <span>Easy • 15 min</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BasicRecipes;