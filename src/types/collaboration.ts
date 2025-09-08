export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'reviewer' | 'viewer';
  permissions: Permission[];
  lastActive: Date;
  status: 'online' | 'offline' | 'away';
}

export interface Permission {
  id: string;
  resource: string;
  action: 'read' | 'write' | 'delete' | 'publish' | 'review';
  granted: boolean;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  version: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  changeLog: ChangeLogEntry[];
  parentVersion?: string;
  branches: string[];
  tags: string[];
  size: number;
  checksum: string;
}

export interface ChangeLogEntry {
  id: string;
  type: 'create' | 'update' | 'delete' | 'merge' | 'branch' | 'tag';
  description: string;
  authorId: string;
  timestamp: Date;
  changes: ContentChange[];
  affectedSections: string[];
}

export interface ContentChange {
  id: string;
  type: 'addition' | 'deletion' | 'modification';
  section: string;
  oldValue?: string;
  newValue?: string;
  lineNumber?: number;
  characterPosition?: number;
  metadata?: Record<string, any>;
}

export interface Comment {
  id: string;
  contentId: string;
  versionId: string;
  authorId: string;
  text: string;
  type: 'general' | 'suggestion' | 'question' | 'approval' | 'rejection';
  status: 'open' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  position?: {
    section: string;
    lineNumber?: number;
    characterStart?: number;
    characterEnd?: number;
  };
  attachments: Attachment[];
  replies: CommentReply[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  tags: string[];
}

export interface CommentReply {
  id: string;
  authorId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Annotation {
  id: string;
  contentId: string;
  versionId: string;
  authorId: string;
  type: 'highlight' | 'note' | 'suggestion' | 'correction';
  text: string;
  position: {
    section: string;
    startLine: number;
    endLine: number;
    startChar: number;
    endChar: number;
  };
  style?: {
    color: string;
    backgroundColor: string;
    fontWeight?: string;
    textDecoration?: string;
  };
  visibility: 'public' | 'private' | 'team';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface ReviewWorkflow {
  id: string;
  name: string;
  description: string;
  steps: ReviewStep[];
  contentTypes: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewStep {
  id: string;
  name: string;
  description: string;
  order: number;
  type: 'review' | 'approval' | 'testing' | 'validation';
  assignedRoles: string[];
  assignedUsers: string[];
  requiredApprovals: number;
  timeLimit?: number; // in hours
  isOptional: boolean;
  conditions: ReviewCondition[];
  actions: ReviewAction[];
}

export interface ReviewCondition {
  id: string;
  type: 'content_type' | 'author_role' | 'content_size' | 'custom';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: string | number;
  description: string;
}

export interface ReviewAction {
  id: string;
  type: 'notify' | 'assign' | 'move_to_step' | 'publish' | 'archive' | 'custom';
  parameters: Record<string, any>;
  description: string;
}

export interface ReviewRequest {
  id: string;
  contentId: string;
  versionId: string;
  workflowId: string;
  currentStepId: string;
  requestedBy: string;
  assignedTo: string[];
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  feedback: ReviewFeedback[];
  history: ReviewHistoryEntry[];
}

export interface ReviewFeedback {
  id: string;
  reviewerId: string;
  stepId: string;
  decision: 'approve' | 'reject' | 'request_changes';
  comments: string;
  suggestions: string[];
  attachments: Attachment[];
  createdAt: Date;
}

export interface ReviewHistoryEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  details: Record<string, any>;
  stepId?: string;
}

export interface CollaborationSession {
  id: string;
  contentId: string;
  versionId: string;
  participants: SessionParticipant[];
  status: 'active' | 'paused' | 'ended';
  startedAt: Date;
  endedAt?: Date;
  lastActivity: Date;
  settings: SessionSettings;
  events: SessionEvent[];
}

export interface SessionParticipant {
  userId: string;
  role: 'host' | 'editor' | 'viewer';
  joinedAt: Date;
  lastSeen: Date;
  cursor?: {
    section: string;
    line: number;
    character: number;
  };
  selection?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  isActive: boolean;
}

export interface SessionSettings {
  allowAnonymous: boolean;
  maxParticipants: number;
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  conflictResolution: 'last_write_wins' | 'manual_merge' | 'operational_transform';
  permissions: {
    canEdit: string[];
    canComment: string[];
    canView: string[];
  };
}

export interface SessionEvent {
  id: string;
  type: 'join' | 'leave' | 'edit' | 'comment' | 'cursor_move' | 'selection_change';
  userId: string;
  timestamp: Date;
  data: Record<string, any>;
}

export interface MergeConflict {
  id: string;
  contentId: string;
  baseVersionId: string;
  sourceVersionId: string;
  targetVersionId: string;
  conflicts: ConflictSection[];
  status: 'pending' | 'resolved' | 'cancelled';
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface ConflictSection {
  id: string;
  section: string;
  type: 'content' | 'metadata' | 'structure';
  baseContent: string;
  sourceContent: string;
  targetContent: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  autoResolvable: boolean;
}

export interface Branch {
  id: string;
  name: string;
  description: string;
  contentId: string;
  parentVersionId: string;
  currentVersionId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'merged' | 'abandoned';
  mergedInto?: string;
  mergedAt?: Date;
  mergedBy?: string;
  protection: {
    requireReview: boolean;
    requiredReviewers: string[];
    allowForcePush: boolean;
    restrictedUsers: string[];
  };
}

export interface MergeRequest {
  id: string;
  title: string;
  description: string;
  sourceBranchId: string;
  targetBranchId: string;
  sourceVersionId: string;
  targetVersionId: string;
  authorId: string;
  assignedReviewers: string[];
  status: 'open' | 'merged' | 'closed' | 'draft';
  conflicts: MergeConflict[];
  reviews: MergeReview[];
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  mergedBy?: string;
  closedAt?: Date;
  closedBy?: string;
}

export interface MergeReview {
  id: string;
  reviewerId: string;
  status: 'pending' | 'approved' | 'changes_requested' | 'commented';
  comments: Comment[];
  submittedAt?: Date;
  updatedAt: Date;
}

export interface AuditTrail {
  id: string;
  entityType: 'content' | 'version' | 'comment' | 'review' | 'user';
  entityId: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
}

export interface NotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    types: NotificationType[];
  };
  inApp: {
    enabled: boolean;
    types: NotificationType[];
  };
  push: {
    enabled: boolean;
    types: NotificationType[];
  };
}

export interface NotificationType {
  type: 'comment' | 'review_request' | 'approval' | 'rejection' | 'mention' | 'assignment';
  enabled: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType['type'];
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

// API Interfaces
export interface CollaborationAPI {
  // Version Control
  createVersion(contentId: string, data: Partial<ContentVersion>): Promise<ContentVersion>;
  getVersions(contentId: string, options?: { limit?: number; offset?: number }): Promise<ContentVersion[]>;
  getVersion(versionId: string): Promise<ContentVersion>;
  updateVersion(versionId: string, data: Partial<ContentVersion>): Promise<ContentVersion>;
  deleteVersion(versionId: string): Promise<void>;
  compareVersions(version1Id: string, version2Id: string): Promise<ContentChange[]>;
  
  // Branching
  createBranch(data: Partial<Branch>): Promise<Branch>;
  getBranches(contentId: string): Promise<Branch[]>;
  getBranch(branchId: string): Promise<Branch>;
  updateBranch(branchId: string, data: Partial<Branch>): Promise<Branch>;
  deleteBranch(branchId: string): Promise<void>;
  
  // Merging
  createMergeRequest(data: Partial<MergeRequest>): Promise<MergeRequest>;
  getMergeRequests(options?: { status?: string; author?: string }): Promise<MergeRequest[]>;
  getMergeRequest(mergeRequestId: string): Promise<MergeRequest>;
  updateMergeRequest(mergeRequestId: string, data: Partial<MergeRequest>): Promise<MergeRequest>;
  mergeBranches(mergeRequestId: string): Promise<ContentVersion>;
  
  // Comments & Annotations
  createComment(data: Partial<Comment>): Promise<Comment>;
  getComments(contentId: string, versionId?: string): Promise<Comment[]>;
  updateComment(commentId: string, data: Partial<Comment>): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;
  resolveComment(commentId: string): Promise<Comment>;
  
  createAnnotation(data: Partial<Annotation>): Promise<Annotation>;
  getAnnotations(contentId: string, versionId?: string): Promise<Annotation[]>;
  updateAnnotation(annotationId: string, data: Partial<Annotation>): Promise<Annotation>;
  deleteAnnotation(annotationId: string): Promise<void>;
  
  // Review Workflows
  createWorkflow(data: Partial<ReviewWorkflow>): Promise<ReviewWorkflow>;
  getWorkflows(): Promise<ReviewWorkflow[]>;
  updateWorkflow(workflowId: string, data: Partial<ReviewWorkflow>): Promise<ReviewWorkflow>;
  deleteWorkflow(workflowId: string): Promise<void>;
  
  createReviewRequest(data: Partial<ReviewRequest>): Promise<ReviewRequest>;
  getReviewRequests(options?: { status?: string; assignee?: string }): Promise<ReviewRequest[]>;
  updateReviewRequest(requestId: string, data: Partial<ReviewRequest>): Promise<ReviewRequest>;
  submitReview(requestId: string, feedback: ReviewFeedback): Promise<ReviewRequest>;
  
  // Real-time Collaboration
  startCollaborationSession(contentId: string, versionId: string): Promise<CollaborationSession>;
  joinCollaborationSession(sessionId: string): Promise<CollaborationSession>;
  leaveCollaborationSession(sessionId: string): Promise<void>;
  updateCursor(sessionId: string, position: SessionParticipant['cursor']): Promise<void>;
  updateSelection(sessionId: string, selection: SessionParticipant['selection']): Promise<void>;
  
  // Audit & History
  getAuditTrail(entityType: string, entityId: string): Promise<AuditTrail[]>;
  createAuditEntry(data: Partial<AuditTrail>): Promise<AuditTrail>;
  
  // Notifications
  getNotifications(userId: string, options?: { unread?: boolean }): Promise<Notification[]>;
  markNotificationRead(notificationId: string): Promise<void>;
  updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void>;
  
  // Permissions
  getUserPermissions(userId: string, resourceId: string): Promise<Permission[]>;
  updateUserPermissions(userId: string, permissions: Permission[]): Promise<void>;
  checkPermission(userId: string, resource: string, action: string): Promise<boolean>;
}