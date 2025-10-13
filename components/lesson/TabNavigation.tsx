'use client';

import React, { useRef, useEffect } from 'react';
import { Target, BookOpen, Dumbbell, Globe, CheckCircle } from 'lucide-react';
import { TabNavigationProps } from '@/types';

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  customTabs = []
}) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeTabIndex = useRef<number>(0);
  const defaultTabs = [
    {
      id: 'Objectives',
      label: 'Aperçu',
      icon: <Target className="w-4 h-4" />
    },
    {
      id: 'Vocabulary',
      label: 'Vocabulaire',
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      id: 'Practice',
      label: 'Pratique',
      icon: <Dumbbell className="w-4 h-4" />
    },
    {
      id: 'Culture',
      label: 'Culture',
      icon: <Globe className="w-4 h-4" />
    },
    {
      id: 'Review',
      label: 'Révision',
      icon: <CheckCircle className="w-4 h-4" />
    }
  ];

  const allTabs = customTabs.length > 0 ? customTabs : defaultTabs;

  // Update active tab index when activeTab changes
  useEffect(() => {
    const index = allTabs.findIndex(tab => tab.id === activeTab);
    if (index !== -1) {
      activeTabIndex.current = index;
    }
  }, [activeTab, allTabs]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    let newIndex = index;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = index > 0 ? index - 1 : allTabs.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = index < allTabs.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = allTabs.length - 1;
        break;
      default:
        return;
    }
    
    // Focus the new tab and activate it
    tabRefs.current[newIndex]?.focus();
    onTabChange(allTabs[newIndex].id);
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="flex space-x-8 px-6" role="tablist" aria-label="Lesson sections">
        {allTabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            
          return (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon && (
                <span className={`${isActive ? 'text-blue-500' : 'text-gray-400'}`} aria-hidden="true">
                  {tab.icon}
                </span>
              )}
              
              <span>{tab.label}</span>
              
              {tab.count !== undefined && (
                <span className={`
                  ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                  ${isActive
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-500'
                  }
                `} aria-label={`${tab.count} items`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
          })}
      </nav>
    </div>
  );
};

export default TabNavigation;