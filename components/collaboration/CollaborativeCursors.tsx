'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CollaborationUser, collaborationService } from '@/services/collaboration/CollaborationService';

interface CursorPosition {
  x: number;
  y: number;
  user: CollaborationUser;
  selection?: {
    from: number;
    to: number;
  };
}

interface CollaborativeCursorsProps {
  editorRef: React.RefObject<HTMLElement>;
  className?: string;
}

export const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = ({
  editorRef,
  className = ''
}) => {
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [selections, setSelections] = useState<Map<string, { from: number; to: number; user: CollaborationUser }>>(new Map());
  const cursorsRef = useRef<Map<string, CursorPosition>>(new Map());

  useEffect(() => {
    const handleCursorMove = (user: CollaborationUser) => {
      if (!user.cursor || !editorRef.current) return;

      const newCursor: CursorPosition = {
        x: user.cursor.x,
        y: user.cursor.y,
        user,
        selection: user.cursor.selection
      };

      setCursors(prev => {
        const updated = new Map(prev);
        updated.set(user.id, newCursor);
        return updated;
      });

      // Handle text selection
      if (user.cursor.selection) {
        setSelections(prev => {
          const updated = new Map(prev);
          updated.set(user.id, {
            from: user.cursor.selection!.from,
            to: user.cursor.selection!.to,
            user
          });
          return updated;
        });
      } else {
        setSelections(prev => {
          const updated = new Map(prev);
          updated.delete(user.id);
          return updated;
        });
      }

      cursorsRef.current = new Map(cursors);
    };

    const handleUserLeft = (user: CollaborationUser) => {
      setCursors(prev => {
        const updated = new Map(prev);
        updated.delete(user.id);
        return updated;
      });

      setSelections(prev => {
        const updated = new Map(prev);
        updated.delete(user.id);
        return updated;
      });
    };

    collaborationService.on('cursor-moved', handleCursorMove);
    collaborationService.on('user-left', handleUserLeft);

    return () => {
      collaborationService.off('cursor-moved', handleCursorMove);
      collaborationService.off('user-left', handleUserLeft);
    };
  }, [editorRef]);

  // Clean up old cursors
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setCursors(prev => {
        const updated = new Map();
        for (const [userId, cursor] of prev) {
          // Keep cursors that are less than 30 seconds old
          if (now - (cursor as any).lastUpdate < 30000) {
            updated.set(userId, cursor);
          }
        }
        return updated;
      });
    }, 5000);

    return () => clearInterval(cleanup);
  }, []);

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`absolute inset-0 pointer-events-none z-10 ${className}`}>
      {/* Render text selections */}
      {Array.from(selections.values()).map((selection) => (
        <div
          key={`selection-${selection.user.id}`}
          className="absolute pointer-events-none"
          style={{
            backgroundColor: `${selection.user.color}20`,
            border: `1px solid ${selection.user.color}40`,
            borderRadius: '2px',
            // Position would be calculated based on text position
            // This is a simplified version - real implementation would need
            // to calculate actual text node positions
          }}
        />
      ))}

      {/* Render cursors */}
      {Array.from(cursors.values()).map((cursor) => (
        <div
          key={`cursor-${cursor.user.id}`}
          className="absolute pointer-events-none transition-all duration-150 ease-out"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 1000
          }}
        >
          {/* Cursor line */}
          <div
            className="w-0.5 h-5 animate-pulse"
            style={{ backgroundColor: cursor.user.color }}
          />
          
          {/* User label */}
          <div
            className="absolute top-0 left-2 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg"
            style={{ backgroundColor: cursor.user.color }}
          >
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-xs">
                {getUserInitials(cursor.user.name)}
              </div>
              <span>{cursor.user.name}</span>
            </div>
          </div>

          {/* Cursor pointer triangle */}
          <div
            className="absolute top-0 left-0 w-0 h-0"
            style={{
              borderLeft: `4px solid ${cursor.user.color}`,
              borderRight: '4px solid transparent',
              borderBottom: '4px solid transparent',
              transform: 'translate(-2px, -4px)'
            }}
          />
        </div>
      ))}
    </div>
  );
};