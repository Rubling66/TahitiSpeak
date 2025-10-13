'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  RotateCcw, 
  Eye, 
  Clock,
  FileText,
  Plus,
  Minus,
  Edit,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DocumentVersion, collaborationService } from '@/services/collaboration/CollaborationService';

interface VersionHistoryProps {
  className?: string;
  onVersionRestore?: (version: DocumentVersion) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  className = '',
  onVersionRestore
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Load initial version history
    setVersions(collaborationService.getVersionHistory());

    // Listen for new versions
    const handleContentChanged = ({ content, changes, author }: any) => {
      const newVersion: DocumentVersion = {
        id: `version-${Date.now()}-${author.id}`,
        content,
        author,
        timestamp: Date.now(),
        changes: changes || []
      };
      
      setVersions(prev => [...prev, newVersion]);
    };

    const handleVersionRollback = (version: DocumentVersion) => {
      setVersions(prev => [...prev, {
        ...version,
        id: `rollback-${Date.now()}`,
        timestamp: Date.now()
      }]);
    };

    collaborationService.on('content-changed', handleContentChanged);
    collaborationService.on('version-rollback', handleVersionRollback);

    return () => {
      collaborationService.off('content-changed', handleContentChanged);
      collaborationService.off('version-rollback', handleVersionRollback);
    };
  }, []);

  const handleRestoreVersion = (version: DocumentVersion) => {
    const restoredVersion = collaborationService.rollbackToVersion(version.id);
    if (restoredVersion) {
      onVersionRestore?.(restoredVersion);
      toast.success(`Restored to version from ${formatTimestamp(version.timestamp)}`);
    } else {
      toast.error('Failed to restore version');
    }
  };

  const handlePreviewVersion = (version: DocumentVersion) => {
    setSelectedVersion(version);
    setPreviewContent(version.content);
    setShowPreview(true);
  };

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChangesSummary = (changes: DocumentVersion['changes']): string => {
    if (!changes || changes.length === 0) return 'No specific changes tracked';
    
    const insertions = changes.filter(c => c.type === 'insert').length;
    const deletions = changes.filter(c => c.type === 'delete').length;
    const replacements = changes.filter(c => c.type === 'replace').length;
    
    const parts = [];
    if (insertions > 0) parts.push(`+${insertions} additions`);
    if (deletions > 0) parts.push(`-${deletions} deletions`);
    if (replacements > 0) parts.push(`${replacements} modifications`);
    
    return parts.join(', ') || 'Content updated';
  };

  const getChangeIcon = (change: DocumentVersion['changes'][0]) => {
    switch (change.type) {
      case 'insert':
        return <Plus className="h-3 w-3 text-green-600" />;
      case 'delete':
        return <Minus className="h-3 w-3 text-red-600" />;
      case 'replace':
        return <Edit className="h-3 w-3 text-blue-600" />;
      default:
        return <FileText className="h-3 w-3 text-gray-600" />;
    }
  };

  // Sort versions by timestamp (newest first)
  const sortedVersions = [...versions].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <>
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History ({versions.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {sortedVersions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No version history yet</p>
                  <p className="text-sm text-gray-400">
                    Changes will appear here as you edit the document
                  </p>
                </div>
              ) : (
                sortedVersions.map((version, index) => (
                  <div key={version.id} className="space-y-2">
                    <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={version.author.avatar} alt={version.author.name} />
                        <AvatarFallback 
                          className="text-xs font-medium text-white"
                          style={{ backgroundColor: version.author.color }}
                        >
                          {getUserInitials(version.author.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{version.author.name}</span>
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(version.timestamp)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {getChangesSummary(version.changes)}
                        </p>

                        {/* Changes breakdown */}
                        {version.changes && version.changes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {version.changes.slice(0, 3).map((change, changeIndex) => (
                              <div 
                                key={changeIndex}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
                              >
                                {getChangeIcon(change)}
                                <span className="capitalize">{change.type}</span>
                                <span className="text-gray-500">
                                  @{change.position}
                                </span>
                              </div>
                            ))}
                            {version.changes.length > 3 && (
                              <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                                +{version.changes.length - 3} more
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewVersion(version)}
                            className="h-7 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          
                          {index !== 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestoreVersion(version)}
                              className="h-7 text-xs text-orange-600 hover:text-orange-700"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {index < sortedVersions.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Version Preview
            </DialogTitle>
            <DialogDescription>
              {selectedVersion && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedVersion.author.avatar} alt={selectedVersion.author.name} />
                    <AvatarFallback 
                      className="text-xs font-medium text-white"
                      style={{ backgroundColor: selectedVersion.author.color }}
                    >
                      {getUserInitials(selectedVersion.author.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    By {selectedVersion.author.name} • {formatTimestamp(selectedVersion.timestamp)}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedVersion && selectedVersion.id !== sortedVersions[0]?.id && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-800">
                  This is a previous version. Restoring will replace the current content.
                </span>
              </div>
            )}

            <ScrollArea className="h-96 border rounded-lg p-4">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </ScrollArea>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedVersion && getChangesSummary(selectedVersion.changes)}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                {selectedVersion && selectedVersion.id !== sortedVersions[0]?.id && (
                  <Button
                    onClick={() => {
                      handleRestoreVersion(selectedVersion);
                      setShowPreview(false);
                    }}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore This Version
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};