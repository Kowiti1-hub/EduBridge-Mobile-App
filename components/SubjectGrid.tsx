
import React, { useState, useEffect } from 'react';
import { Heart, ChevronRight, Star } from 'lucide-react';
import { SUBJECTS } from '../constants';
import { Subject, LearningStage } from '../types';

interface SubjectGridProps {
  onSelect: (subject: Subject) => void;
  stage: LearningStage;
}

const SubjectGrid: React.FC<SubjectGridProps> = ({ onSelect, stage }) => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('edubridge_favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem('edubridge_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Critical: Prevent triggering the parent onSelect
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  // Filter subjects by stage
  const stageSubjects = SUBJECTS.filter(s => s.stage === stage);

  // Sort subjects: favorites at the top, then by original order
  const sortedSubjects = [...stageSubjects].sort((a, b) => {
    const aFav = favorites.includes(a.id);
    const bFav = favorites.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  return (
    <div className="p-4 space-y-3">
      {sortedSubjects.map((subject) => {
        const isFavorite = favorites.includes(subject.id);
        const originalIndex = stageSubjects.findIndex(s => s.id === subject.id) + 1;
        
        return (
          <div
            key={subject.id}
            onClick={() => onSelect(subject)}
            className={`w-full p-4 rounded-2xl border transition-all duration-300 active:scale-[0.98] cursor-pointer group text-left flex items-center gap-4 relative overflow-hidden ${
              isFavorite 
                ? 'bg-amber-50 border-amber-200 shadow-md ring-1 ring-amber-100/50' 
                : 'bg-white border-emerald-50 hover:shadow-md hover:border-emerald-200'
            }`}
          >
            {/* Visual Flair for Favorites */}
            {isFavorite && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-400/10 to-transparent rounded-bl-full pointer-events-none" />
            )}

            {/* Icon Container with USSD Number Indicator */}
            <div className="relative">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner ${
                isFavorite ? 'bg-amber-100' : 'bg-[#e7fce3]'
              }`}>
                {subject.icon}
              </div>
              <div className="absolute -top-1 -left-1 w-5 h-5 bg-[#075e54] text-white rounded-md flex items-center justify-center text-[10px] font-bold shadow-sm border border-[#054d44]">
                {originalIndex}
              </div>
            </div>
            
            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-gray-800 text-base truncate">
                  {subject.title}
                </h3>
                {isFavorite && (
                  <span className="text-[8px] bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full uppercase font-black tracking-widest animate-in fade-in zoom-in duration-300">
                    FAV
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium leading-tight line-clamp-2">
                {subject.description}
              </p>
            </div>

            {/* Favorite Toggle & Navigation Indicator */}
            <div className="flex flex-col items-center justify-between self-stretch gap-1">
              <button
                onClick={(e) => toggleFavorite(e, subject.id)}
                className={`p-2.5 rounded-full transition-all duration-300 hover:scale-110 active:scale-90 ${
                  isFavorite 
                    ? 'text-rose-500 bg-white shadow-sm ring-1 ring-rose-100' 
                    : 'text-gray-300 hover:text-rose-300 bg-gray-50'
                }`}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart 
                  className={`h-5 w-5 ${isFavorite ? 'fill-current animate-in zoom-in-125' : ''}`}
                />
              </button>
              
              <div className={`transition-colors ${
                isFavorite ? 'text-amber-500' : 'text-emerald-200 group-hover:text-emerald-500'
              }`}>
                <ChevronRight className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SubjectGrid;
