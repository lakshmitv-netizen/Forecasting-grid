import React, { useState } from 'react';
import { CellEditHistoryEntry } from '../types/editHistory';
import '../styles/components/CellEditHistoryCard.css';

interface CardReply {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
}

interface CellEditHistoryCardProps {
  entry: CellEditHistoryEntry;
  replies?: CardReply[];
  onAddReply?: (entryId: string, message: string) => void;
  isLast?: boolean;
  isFirst?: boolean;
}

const CellEditHistoryCard: React.FC<CellEditHistoryCardProps> = ({ entry, replies = [], onAddReply, isLast = false, isFirst = false }) => {
  const [isExpanded, setIsExpanded] = useState(isFirst);
  const [replyText, setReplyText] = useState('');
  
  // Only consider it an "edit" if values are defined AND actually different
  const hasEdit = entry.oldValue !== undefined && entry.newValue !== undefined && entry.oldValue !== entry.newValue;
  const hasNote = !!(entry.note && entry.note.trim() !== '');
  const hasReplies = replies.length > 0;
  
  // Only calculate delta if we have both values
  const delta = hasEdit ? (entry.newValue! - entry.oldValue!) : 0;
  const isIncrease = delta > 0;
  
  const formattedOldValue = hasEdit ? entry.oldValue!.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }) : '';
  const formattedNewValue = hasEdit ? entry.newValue!.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }) : '';
  const formattedDelta = hasEdit ? Math.abs(delta).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }) : '';

  // Get user initials from name
  const getUserInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Format full timestamp with date and time
  const formatFullTimestamp = (date: Date): string => {
    const timestamp = date instanceof Date ? date : new Date(date);
    return timestamp.toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format timestamp for replies
  const formatReplyTimestamp = (date: Date): string => {
    const timestamp = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return timestamp.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleSubmitReply = () => {
    if (replyText.trim() && onAddReply) {
      onAddReply(entry.id, replyText.trim());
      setReplyText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitReply();
    }
    if (e.key === 'Escape') {
      setReplyText('');
    }
  };

  // Use "John Carter" as the user name, initials "JC"
  const userName = entry.userName || 'John Carter';
  const userInitials = getUserInitials(userName);
  
  // Check if this is a draft (unsaved) entry
  const isDraft = entry.id.startsWith('draft-');

  // For note-only entries, show a truncated preview
  const isNoteOnly = !hasEdit && hasNote;
  const notePreviewLength = 40;
  const truncatedNote = hasNote && entry.note!.length > notePreviewLength 
    ? entry.note!.substring(0, notePreviewLength) + '...' 
    : entry.note;
  const needsSeeMore = hasNote && entry.note!.length > notePreviewLength;

  return (
    <div className={`sf-timeline-item ${isExpanded ? 'expanded' : ''}`}>
      {/* Left side: Expand arrow + Avatar + Line */}
      <div className="sf-timeline-left">
        <div className="sf-timeline-left-row">
          {/* Always show expand button so user can access comments */}
          <button 
            className="sf-timeline-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              {isExpanded ? (
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              ) : (
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              )}
            </svg>
          </button>
          <div className="sf-timeline-avatar">
            <span className="sf-timeline-avatar-initials">{userInitials}</span>
          </div>
        </div>
        {!isLast && <div className="sf-timeline-line"></div>}
      </div>
      
      {/* Right side: Content */}
      <div className="sf-timeline-content">
        {/* Header Row */}
        <div className="sf-timeline-header">
          <div className="sf-timeline-title-row">
            <span className="sf-timeline-username">{userName}</span>
            {isDraft && <span className="sf-timeline-draft-badge">Unsaved</span>}
            <span className="sf-timeline-timestamp">{formatFullTimestamp(entry.timestamp)}</span>
          </div>
          <div className="sf-timeline-subtitle">
            {hasEdit ? (
              // Edit with or without note - show edit info
              <div>
                <span className="sf-timeline-edit-info">
                  {isIncrease ? 'Increased' : 'Decreased'} from <strong>{formattedOldValue}</strong> to <strong>{formattedNewValue}</strong> <span className={`sf-timeline-delta ${isIncrease ? 'increase' : 'decrease'}`}>({isIncrease ? '+' : '-'}{formattedDelta})</span>
                  {hasNote && (
                    <button 
                      className="sf-timeline-see-note-btn"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      {isExpanded ? 'Hide note' : 'See note'}
                    </button>
                  )}
                </span>
                {/* Show note inline in white region when expanded */}
                {hasNote && isExpanded && (
                  <div className="sf-timeline-note-preview" style={{ marginTop: '4px' }}>
                    <span className="sf-timeline-note-text">{entry.note}</span>
                  </div>
                )}
              </div>
            ) : isNoteOnly ? (
              // Note only - show truncated preview or full note when expanded
              <div className="sf-timeline-note-preview">
                <span className="sf-timeline-note-text">
                  {isExpanded ? entry.note : truncatedNote}
                </span>
                {needsSeeMore && (
                  <button 
                    className="sf-timeline-see-more-btn"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? 'see less' : 'see more'}
                  </button>
                )}
              </div>
            ) : (
              <>Added a note with value unchanged</>
            )}
          </div>
        </div>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="sf-timeline-details">
            {/* Discussion - always show for threaded comments */}
            <div className="sf-timeline-discussion">
              {hasReplies && (
                <div className="sf-timeline-replies">
                  {replies.map((reply) => (
                    <div key={reply.id} className="sf-timeline-reply">
                      <div className="sf-timeline-reply-avatar">
                        {getUserInitials(reply.userName)}
                      </div>
                      <div className="sf-timeline-reply-content">
                        <span className="sf-timeline-reply-username">{reply.userName}</span>
                        <span className="sf-timeline-reply-message">{reply.message}</span>
                        <span className="sf-timeline-reply-timestamp">
                          {formatReplyTimestamp(reply.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Reply Input */}
              <div className="sf-timeline-reply-input">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a comment..."
                />
                <button 
                  className="sf-timeline-post-btn"
                  onClick={handleSubmitReply}
                  disabled={!replyText.trim()}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CellEditHistoryCard;
