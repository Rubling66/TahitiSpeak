import { 
  CollaborationAPI, 
  ContentVersion, 
  Comment, 
  Annotation, 
  ReviewWorkflow, 
  ReviewRequest, 
  ReviewFeedback,
  CollaborationSession, 
  SessionParticipant,
  Branch, 
  MergeRequest, 
  AuditTrail, 
  Notification, 
  NotificationPreferences,
  Permission,
  ContentChange,
  MergeConflict
} from '@/types/collaboration';
import { DataService, LocalDataService } from '@/lib/data/DataService';

class CollaborationService implements CollaborationAPI {
  private dataService: DataService;
  private websocket: WebSocket | null = null;
  private sessionId: string | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.dataService = new LocalDataService();
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    try {
      // In a real implementation, this would connect to your WebSocket server
      // For now, we'll simulate real-time functionality
      this.websocket = null; // Placeholder
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  // Event handling for real-time updates
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Version Control Methods
  async createVersion(contentId: string, data: Partial<ContentVersion>): Promise<ContentVersion> {
    try {
      const version: ContentVersion = {
        id: this.generateId(),
        contentId,
        version: this.generateVersionNumber(contentId),
        title: data.title || 'Untitled Version',
        content: data.content || '',
        metadata: data.metadata || {},
        authorId: data.authorId || 'current-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: data.status || 'draft',
        changeLog: data.changeLog || [],
        parentVersion: data.parentVersion,
        branches: data.branches || [],
        tags: data.tags || [],
        size: (data.content || '').length,
        checksum: this.generateChecksum(data.content || '')
      };

      await this.dataService.create('content_versions', version);
      
      // Create audit trail entry
      await this.createAuditEntry({
        entityType: 'version',
        entityId: version.id,
        action: 'create',
        performedBy: version.authorId,
        timestamp: new Date(),
        details: { contentId, version: version.version }
      });

      this.emit('version:created', version);
      return version;
    } catch (error) {
      console.error('Error creating version:', error);
      throw new Error('Failed to create version');
    }
  }

  async getVersions(contentId: string, options?: { limit?: number; offset?: number }): Promise<ContentVersion[]> {
    try {
      const query = { contentId };
      const versions = await this.dataService.query('content_versions', query, {
        limit: options?.limit || 50,
        offset: options?.offset || 0,
        orderBy: 'createdAt',
        order: 'desc'
      });
      return versions as ContentVersion[];
    } catch (error) {
      console.error('Error fetching versions:', error);
      throw new Error('Failed to fetch versions');
    }
  }

  async getVersion(versionId: string): Promise<ContentVersion> {
    try {
      const version = await this.dataService.getById('content_versions', versionId);
      if (!version) {
        throw new Error('Version not found');
      }
      return version as ContentVersion;
    } catch (error) {
      console.error('Error fetching version:', error);
      throw new Error('Failed to fetch version');
    }
  }

  async updateVersion(versionId: string, data: Partial<ContentVersion>): Promise<ContentVersion> {
    try {
      const existingVersion = await this.getVersion(versionId);
      const updatedVersion = {
        ...existingVersion,
        ...data,
        updatedAt: new Date(),
        size: data.content ? data.content.length : existingVersion.size,
        checksum: data.content ? this.generateChecksum(data.content) : existingVersion.checksum
      };

      await this.dataService.update('content_versions', versionId, updatedVersion);
      
      await this.createAuditEntry({
        entityType: 'version',
        entityId: versionId,
        action: 'update',
        performedBy: data.authorId || 'current-user',
        timestamp: new Date(),
        details: { changes: Object.keys(data) }
      });

      this.emit('version:updated', updatedVersion);
      return updatedVersion;
    } catch (error) {
      console.error('Error updating version:', error);
      throw new Error('Failed to update version');
    }
  }

  async deleteVersion(versionId: string): Promise<void> {
    try {
      await this.dataService.delete('content_versions', versionId);
      
      await this.createAuditEntry({
        entityType: 'version',
        entityId: versionId,
        action: 'delete',
        performedBy: 'current-user',
        timestamp: new Date(),
        details: {}
      });

      this.emit('version:deleted', { versionId });
    } catch (error) {
      console.error('Error deleting version:', error);
      throw new Error('Failed to delete version');
    }
  }

  async compareVersions(version1Id: string, version2Id: string): Promise<ContentChange[]> {
    try {
      const [version1, version2] = await Promise.all([
        this.getVersion(version1Id),
        this.getVersion(version2Id)
      ]);

      // Simple diff implementation - in production, use a proper diff library
      const changes: ContentChange[] = [];
      
      if (version1.content !== version2.content) {
        changes.push({
          id: this.generateId(),
          type: 'modification',
          section: 'content',
          oldValue: version1.content,
          newValue: version2.content
        });
      }

      if (version1.title !== version2.title) {
        changes.push({
          id: this.generateId(),
          type: 'modification',
          section: 'title',
          oldValue: version1.title,
          newValue: version2.title
        });
      }

      return changes;
    } catch (error) {
      console.error('Error comparing versions:', error);
      throw new Error('Failed to compare versions');
    }
  }

  // Branch Management
  async createBranch(data: Partial<Branch>): Promise<Branch> {
    try {
      const branch: Branch = {
        id: this.generateId(),
        name: data.name || 'new-branch',
        description: data.description || '',
        contentId: data.contentId!,
        parentVersionId: data.parentVersionId!,
        currentVersionId: data.currentVersionId || data.parentVersionId!,
        createdBy: data.createdBy || 'current-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        protection: data.protection || {
          requireReview: false,
          requiredReviewers: [],
          allowForcePush: true,
          restrictedUsers: []
        }
      };

      await this.dataService.create('branches', branch);
      this.emit('branch:created', branch);
      return branch;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw new Error('Failed to create branch');
    }
  }

  async getBranches(contentId: string): Promise<Branch[]> {
    try {
      const branches = await this.dataService.query('branches', { contentId });
      return branches as Branch[];
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw new Error('Failed to fetch branches');
    }
  }

  async getBranch(branchId: string): Promise<Branch> {
    try {
      const branch = await this.dataService.getById('branches', branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }
      return branch as Branch;
    } catch (error) {
      console.error('Error fetching branch:', error);
      throw new Error('Failed to fetch branch');
    }
  }

  async updateBranch(branchId: string, data: Partial<Branch>): Promise<Branch> {
    try {
      const existingBranch = await this.getBranch(branchId);
      const updatedBranch = {
        ...existingBranch,
        ...data,
        updatedAt: new Date()
      };

      await this.dataService.update('branches', branchId, updatedBranch);
      this.emit('branch:updated', updatedBranch);
      return updatedBranch;
    } catch (error) {
      console.error('Error updating branch:', error);
      throw new Error('Failed to update branch');
    }
  }

  async deleteBranch(branchId: string): Promise<void> {
    try {
      await this.dataService.delete('branches', branchId);
      this.emit('branch:deleted', { branchId });
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw new Error('Failed to delete branch');
    }
  }

  // Merge Requests
  async createMergeRequest(data: Partial<MergeRequest>): Promise<MergeRequest> {
    try {
      const mergeRequest: MergeRequest = {
        id: this.generateId(),
        title: data.title || 'Merge Request',
        description: data.description || '',
        sourceBranchId: data.sourceBranchId!,
        targetBranchId: data.targetBranchId!,
        sourceVersionId: data.sourceVersionId!,
        targetVersionId: data.targetVersionId!,
        authorId: data.authorId || 'current-user',
        assignedReviewers: data.assignedReviewers || [],
        status: 'open',
        conflicts: [],
        reviews: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.dataService.create('merge_requests', mergeRequest);
      this.emit('merge_request:created', mergeRequest);
      return mergeRequest;
    } catch (error) {
      console.error('Error creating merge request:', error);
      throw new Error('Failed to create merge request');
    }
  }

  async getMergeRequests(options?: { status?: string; author?: string }): Promise<MergeRequest[]> {
    try {
      const query: any = {};
      if (options?.status) query.status = options.status;
      if (options?.author) query.authorId = options.author;
      
      const mergeRequests = await this.dataService.query('merge_requests', query);
      return mergeRequests as MergeRequest[];
    } catch (error) {
      console.error('Error fetching merge requests:', error);
      throw new Error('Failed to fetch merge requests');
    }
  }

  async getMergeRequest(mergeRequestId: string): Promise<MergeRequest> {
    try {
      const mergeRequest = await this.dataService.getById('merge_requests', mergeRequestId);
      if (!mergeRequest) {
        throw new Error('Merge request not found');
      }
      return mergeRequest as MergeRequest;
    } catch (error) {
      console.error('Error fetching merge request:', error);
      throw new Error('Failed to fetch merge request');
    }
  }

  async updateMergeRequest(mergeRequestId: string, data: Partial<MergeRequest>): Promise<MergeRequest> {
    try {
      const existingMergeRequest = await this.getMergeRequest(mergeRequestId);
      const updatedMergeRequest = {
        ...existingMergeRequest,
        ...data,
        updatedAt: new Date()
      };

      await this.dataService.update('merge_requests', mergeRequestId, updatedMergeRequest);
      this.emit('merge_request:updated', updatedMergeRequest);
      return updatedMergeRequest;
    } catch (error) {
      console.error('Error updating merge request:', error);
      throw new Error('Failed to update merge request');
    }
  }

  async mergeBranches(mergeRequestId: string): Promise<ContentVersion> {
    try {
      const mergeRequest = await this.getMergeRequest(mergeRequestId);
      const [sourceBranch, targetBranch] = await Promise.all([
        this.getBranch(mergeRequest.sourceBranchId),
        this.getBranch(mergeRequest.targetBranchId)
      ]);

      const [sourceVersion, targetVersion] = await Promise.all([
        this.getVersion(sourceBranch.currentVersionId),
        this.getVersion(targetBranch.currentVersionId)
      ]);

      // Create merged version
      const mergedVersion = await this.createVersion(targetBranch.contentId, {
        title: `Merged: ${sourceVersion.title}`,
        content: sourceVersion.content, // Simple merge - in production, handle conflicts
        metadata: { ...targetVersion.metadata, ...sourceVersion.metadata },
        authorId: mergeRequest.authorId,
        status: 'draft',
        parentVersion: targetVersion.id
      });

      // Update merge request status
      await this.updateMergeRequest(mergeRequestId, {
        status: 'merged',
        mergedAt: new Date(),
        mergedBy: 'current-user'
      });

      // Update target branch
      await this.updateBranch(targetBranch.id, {
        currentVersionId: mergedVersion.id
      });

      this.emit('branches:merged', { mergeRequest, mergedVersion });
      return mergedVersion;
    } catch (error) {
      console.error('Error merging branches:', error);
      throw new Error('Failed to merge branches');
    }
  }

  // Comments & Annotations
  async createComment(data: Partial<Comment>): Promise<Comment> {
    try {
      const comment: Comment = {
        id: this.generateId(),
        contentId: data.contentId!,
        versionId: data.versionId!,
        authorId: data.authorId || 'current-user',
        text: data.text || '',
        type: data.type || 'general',
        status: 'open',
        priority: data.priority || 'medium',
        position: data.position,
        attachments: data.attachments || [],
        replies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: data.tags || []
      };

      await this.dataService.create('comments', comment);
      this.emit('comment:created', comment);
      return comment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error('Failed to create comment');
    }
  }

  async getComments(contentId: string, versionId?: string): Promise<Comment[]> {
    try {
      const query: any = { contentId };
      if (versionId) query.versionId = versionId;
      
      const comments = await this.dataService.query('comments', query);
      return comments as Comment[];
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw new Error('Failed to fetch comments');
    }
  }

  async updateComment(commentId: string, data: Partial<Comment>): Promise<Comment> {
    try {
      const existingComment = await this.dataService.getById('comments', commentId);
      if (!existingComment) {
        throw new Error('Comment not found');
      }

      const updatedComment = {
        ...existingComment,
        ...data,
        updatedAt: new Date()
      };

      await this.dataService.update('comments', commentId, updatedComment);
      this.emit('comment:updated', updatedComment);
      return updatedComment as Comment;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Failed to update comment');
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      await this.dataService.delete('comments', commentId);
      this.emit('comment:deleted', { commentId });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  async resolveComment(commentId: string): Promise<Comment> {
    try {
      return await this.updateComment(commentId, {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: 'current-user'
      });
    } catch (error) {
      console.error('Error resolving comment:', error);
      throw new Error('Failed to resolve comment');
    }
  }

  async createAnnotation(data: Partial<Annotation>): Promise<Annotation> {
    try {
      const annotation: Annotation = {
        id: this.generateId(),
        contentId: data.contentId!,
        versionId: data.versionId!,
        authorId: data.authorId || 'current-user',
        type: data.type || 'note',
        text: data.text || '',
        position: data.position!,
        style: data.style,
        visibility: data.visibility || 'public',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: data.tags || []
      };

      await this.dataService.create('annotations', annotation);
      this.emit('annotation:created', annotation);
      return annotation;
    } catch (error) {
      console.error('Error creating annotation:', error);
      throw new Error('Failed to create annotation');
    }
  }

  async getAnnotations(contentId: string, versionId?: string): Promise<Annotation[]> {
    try {
      const query: any = { contentId };
      if (versionId) query.versionId = versionId;
      
      const annotations = await this.dataService.query('annotations', query);
      return annotations as Annotation[];
    } catch (error) {
      console.error('Error fetching annotations:', error);
      throw new Error('Failed to fetch annotations');
    }
  }

  async updateAnnotation(annotationId: string, data: Partial<Annotation>): Promise<Annotation> {
    try {
      const existingAnnotation = await this.dataService.getById('annotations', annotationId);
      if (!existingAnnotation) {
        throw new Error('Annotation not found');
      }

      const updatedAnnotation = {
        ...existingAnnotation,
        ...data,
        updatedAt: new Date()
      };

      await this.dataService.update('annotations', annotationId, updatedAnnotation);
      this.emit('annotation:updated', updatedAnnotation);
      return updatedAnnotation as Annotation;
    } catch (error) {
      console.error('Error updating annotation:', error);
      throw new Error('Failed to update annotation');
    }
  }

  async deleteAnnotation(annotationId: string): Promise<void> {
    try {
      await this.dataService.delete('annotations', annotationId);
      this.emit('annotation:deleted', { annotationId });
    } catch (error) {
      console.error('Error deleting annotation:', error);
      throw new Error('Failed to delete annotation');
    }
  }

  // Review Workflows
  async createWorkflow(data: Partial<ReviewWorkflow>): Promise<ReviewWorkflow> {
    try {
      const workflow: ReviewWorkflow = {
        id: this.generateId(),
        name: data.name || 'New Workflow',
        description: data.description || '',
        steps: data.steps || [],
        contentTypes: data.contentTypes || [],
        isActive: data.isActive ?? true,
        createdBy: data.createdBy || 'current-user',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.dataService.create('review_workflows', workflow);
      return workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw new Error('Failed to create workflow');
    }
  }

  async getWorkflows(): Promise<ReviewWorkflow[]> {
    try {
      const workflows = await this.dataService.query('review_workflows', {});
      return workflows as ReviewWorkflow[];
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw new Error('Failed to fetch workflows');
    }
  }

  async updateWorkflow(workflowId: string, data: Partial<ReviewWorkflow>): Promise<ReviewWorkflow> {
    try {
      const existingWorkflow = await this.dataService.getById('review_workflows', workflowId);
      if (!existingWorkflow) {
        throw new Error('Workflow not found');
      }

      const updatedWorkflow = {
        ...existingWorkflow,
        ...data,
        updatedAt: new Date()
      };

      await this.dataService.update('review_workflows', workflowId, updatedWorkflow);
      return updatedWorkflow as ReviewWorkflow;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw new Error('Failed to update workflow');
    }
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      await this.dataService.delete('review_workflows', workflowId);
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw new Error('Failed to delete workflow');
    }
  }

  async createReviewRequest(data: Partial<ReviewRequest>): Promise<ReviewRequest> {
    try {
      const reviewRequest: ReviewRequest = {
        id: this.generateId(),
        contentId: data.contentId!,
        versionId: data.versionId!,
        workflowId: data.workflowId!,
        currentStepId: data.currentStepId!,
        requestedBy: data.requestedBy || 'current-user',
        assignedTo: data.assignedTo || [],
        status: 'pending',
        priority: data.priority || 'medium',
        dueDate: data.dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        feedback: [],
        history: []
      };

      await this.dataService.create('review_requests', reviewRequest);
      this.emit('review_request:created', reviewRequest);
      return reviewRequest;
    } catch (error) {
      console.error('Error creating review request:', error);
      throw new Error('Failed to create review request');
    }
  }

  async getReviewRequests(options?: { status?: string; assignee?: string }): Promise<ReviewRequest[]> {
    try {
      const query: any = {};
      if (options?.status) query.status = options.status;
      if (options?.assignee) query.assignedTo = { $in: [options.assignee] };
      
      const reviewRequests = await this.dataService.query('review_requests', query);
      return reviewRequests as ReviewRequest[];
    } catch (error) {
      console.error('Error fetching review requests:', error);
      throw new Error('Failed to fetch review requests');
    }
  }

  async updateReviewRequest(requestId: string, data: Partial<ReviewRequest>): Promise<ReviewRequest> {
    try {
      const existingRequest = await this.dataService.getById('review_requests', requestId);
      if (!existingRequest) {
        throw new Error('Review request not found');
      }

      const updatedRequest = {
        ...existingRequest,
        ...data,
        updatedAt: new Date()
      };

      await this.dataService.update('review_requests', requestId, updatedRequest);
      this.emit('review_request:updated', updatedRequest);
      return updatedRequest as ReviewRequest;
    } catch (error) {
      console.error('Error updating review request:', error);
      throw new Error('Failed to update review request');
    }
  }

  async submitReview(requestId: string, feedback: ReviewFeedback): Promise<ReviewRequest> {
    try {
      const reviewRequest = await this.dataService.getById('review_requests', requestId) as ReviewRequest;
      if (!reviewRequest) {
        throw new Error('Review request not found');
      }

      const updatedFeedback = [...reviewRequest.feedback, feedback];
      const updatedRequest = {
        ...reviewRequest,
        feedback: updatedFeedback,
        status: feedback.decision === 'approve' ? 'approved' : 
                feedback.decision === 'reject' ? 'rejected' : 'in_review',
        updatedAt: new Date()
      };

      await this.dataService.update('review_requests', requestId, updatedRequest);
      this.emit('review:submitted', { requestId, feedback });
      return updatedRequest;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw new Error('Failed to submit review');
    }
  }

  // Real-time Collaboration
  async startCollaborationSession(contentId: string, versionId: string): Promise<CollaborationSession> {
    try {
      const session: CollaborationSession = {
        id: this.generateId(),
        contentId,
        versionId,
        participants: [],
        status: 'active',
        startedAt: new Date(),
        lastActivity: new Date(),
        settings: {
          allowAnonymous: false,
          maxParticipants: 10,
          autoSave: true,
          autoSaveInterval: 30,
          conflictResolution: 'last_write_wins',
          permissions: {
            canEdit: [],
            canComment: [],
            canView: []
          }
        },
        events: []
      };

      await this.dataService.create('collaboration_sessions', session);
      this.sessionId = session.id;
      this.emit('session:started', session);
      return session;
    } catch (error) {
      console.error('Error starting collaboration session:', error);
      throw new Error('Failed to start collaboration session');
    }
  }

  async joinCollaborationSession(sessionId: string): Promise<CollaborationSession> {
    try {
      const session = await this.dataService.getById('collaboration_sessions', sessionId) as CollaborationSession;
      if (!session) {
        throw new Error('Collaboration session not found');
      }

      const participant: SessionParticipant = {
        userId: 'current-user',
        role: 'editor',
        joinedAt: new Date(),
        lastSeen: new Date(),
        isActive: true
      };

      const updatedSession = {
        ...session,
        participants: [...session.participants, participant],
        lastActivity: new Date()
      };

      await this.dataService.update('collaboration_sessions', sessionId, updatedSession);
      this.sessionId = sessionId;
      this.emit('session:joined', { session: updatedSession, participant });
      return updatedSession;
    } catch (error) {
      console.error('Error joining collaboration session:', error);
      throw new Error('Failed to join collaboration session');
    }
  }

  async leaveCollaborationSession(sessionId: string): Promise<void> {
    try {
      const session = await this.dataService.getById('collaboration_sessions', sessionId) as CollaborationSession;
      if (!session) {
        throw new Error('Collaboration session not found');
      }

      const updatedParticipants = session.participants.filter(p => p.userId !== 'current-user');
      const updatedSession = {
        ...session,
        participants: updatedParticipants,
        lastActivity: new Date(),
        status: updatedParticipants.length === 0 ? 'ended' as const : session.status
      };

      await this.dataService.update('collaboration_sessions', sessionId, updatedSession);
      this.sessionId = null;
      this.emit('session:left', { sessionId });
    } catch (error) {
      console.error('Error leaving collaboration session:', error);
      throw new Error('Failed to leave collaboration session');
    }
  }

  async updateCursor(sessionId: string, position: SessionParticipant['cursor']): Promise<void> {
    try {
      // In a real implementation, this would update the cursor position via WebSocket
      this.emit('cursor:updated', { sessionId, userId: 'current-user', position });
    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  }

  async updateSelection(sessionId: string, selection: SessionParticipant['selection']): Promise<void> {
    try {
      // In a real implementation, this would update the selection via WebSocket
      this.emit('selection:updated', { sessionId, userId: 'current-user', selection });
    } catch (error) {
      console.error('Error updating selection:', error);
    }
  }

  // Audit & History
  async getAuditTrail(entityType: string, entityId: string): Promise<AuditTrail[]> {
    try {
      const auditEntries = await this.dataService.query('audit_trail', { entityType, entityId });
      return auditEntries as AuditTrail[];
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      throw new Error('Failed to fetch audit trail');
    }
  }

  async createAuditEntry(data: Partial<AuditTrail>): Promise<AuditTrail> {
    try {
      const auditEntry: AuditTrail = {
        id: this.generateId(),
        entityType: data.entityType!,
        entityId: data.entityId!,
        action: data.action!,
        performedBy: data.performedBy!,
        timestamp: data.timestamp || new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        details: data.details || {},
        changes: data.changes
      };

      await this.dataService.create('audit_trail', auditEntry);
      return auditEntry;
    } catch (error) {
      console.error('Error creating audit entry:', error);
      throw new Error('Failed to create audit entry');
    }
  }

  // Notifications
  async getNotifications(userId: string, options?: { unread?: boolean }): Promise<Notification[]> {
    try {
      const query: any = { userId };
      if (options?.unread) query.read = false;
      
      const notifications = await this.dataService.query('notifications', query);
      return notifications as Notification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      await this.dataService.update('notifications', notificationId, {
        read: true,
        readAt: new Date()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  async updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    try {
      await this.dataService.update('notification_preferences', userId, preferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  // Permissions
  async getUserPermissions(userId: string, resourceId: string): Promise<Permission[]> {
    try {
      const permissions = await this.dataService.query('permissions', { userId, resource: resourceId });
      return permissions as Permission[];
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw new Error('Failed to fetch user permissions');
    }
  }

  async updateUserPermissions(userId: string, permissions: Permission[]): Promise<void> {
    try {
      // In a real implementation, this would update permissions in the database
      for (const permission of permissions) {
        await this.dataService.update('permissions', permission.id, permission);
      }
    } catch (error) {
      console.error('Error updating user permissions:', error);
      throw new Error('Failed to update user permissions');
    }
  }

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId, resource);
      return permissions.some(p => p.action === action && p.granted);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private generateVersionNumber(contentId: string): string {
    // In a real implementation, this would generate proper semantic versioning
    return `v${Date.now()}`;
  }

  private generateChecksum(content: string): string {
    // Simple checksum implementation - use a proper hash function in production
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}

export default CollaborationService;