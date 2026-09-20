'use client';

// ============================================================
// Company OS — Public Client Approval & Feedback Portal
// Allows clients to review, zoom, approve or request revisions
// ============================================================

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, XCircle, ZoomIn, Eye, Sparkles, AlertCircle,
  Clock, ShieldCheck, Loader2, MessageSquare, ChevronRight, X
} from 'lucide-react';
import { approvalsApi } from '@/lib/api/index';
import type { PublicReviewDeliverable } from '@/types/approval';
import { toast } from 'sonner';

export default function PublicClientReviewPage() {
  const params = useParams();
  const token = (params?.token as string) || '';
  const queryClient = useQueryClient();

  // Selected item for lightbox full zoom
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Reject / Revision Request Modal state
  const [rejectModalItem, setRejectModalItem] = useState<PublicReviewDeliverable | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewerName, setReviewerName] = useState('');

  // Per-item local decision overrides for instant optimistic UI feedback
  const [itemStatuses, setItemStatuses] = useState<Record<string, { status: 'approved' | 'rejected'; reason?: string }>>({});

  // Query review data
  const { data: reviewRes, isLoading, error } = useQuery({
    queryKey: ['public-review', token],
    queryFn: () => approvalsApi.getPublicReview(token),
    enabled: !!token,
    retry: 1,
  });

  const review = reviewRes?.data;
  const deliverables: PublicReviewDeliverable[] = review?.deliverables || (review ? [{
    id: review.content_id,
    file_name: review.file_name,
    display_name: review.display_name,
    target_month: review.target_month,
    approval_status: review.approval_status,
    rejection_reason: review.rejection_reason,
    preview_url: review.preview_url,
  }] : []);

  // Submit decision mutation
  const decisionMutation = useMutation({
    mutationFn: (payload: { decision: 'approved' | 'rejected'; content_id: string; reason?: string; reviewer?: string }) =>
      approvalsApi.submitDecision(token, {
        decision: payload.decision,
        content_id: payload.content_id,
        rejection_reason: payload.reason,
        approved_by_name: payload.reviewer || reviewerName || 'Client Reviewer',
      }),
    onSuccess: (_, vars) => {
      setItemStatuses((prev) => ({
        ...prev,
        [vars.content_id]: { status: vars.decision, reason: vars.reason },
      }));
      queryClient.invalidateQueries({ queryKey: ['public-review', token] });

      if (vars.decision === 'approved') {
        toast.success('Deliverable approved! Thank you.');
      } else {
        toast.info('Revision request submitted to the editing team.');
        setRejectModalItem(null);
        setRejectionReason('');
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.response?.data?.error?.message || 'Failed to submit feedback';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const handleApprove = (item: PublicReviewDeliverable) => {
    decisionMutation.mutate({
      decision: 'approved',
      content_id: item.id,
      reviewer: reviewerName,
    });
  };

  const handleOpenRejectModal = (item: PublicReviewDeliverable) => {
    setRejectModalItem(item);
    setRejectionReason('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Please enter revision instructions or why this needs edit');
      return;
    }
    if (!rejectModalItem) return;

    decisionMutation.mutate({
      decision: 'rejected',
      content_id: rejectModalItem.id,
      reason: rejectionReason.trim(),
      reviewer: reviewerName,
    });
  };

  // Quick feedback tag helpers
  const appendReasonTag = (tag: string) => {
    setRejectionReason((prev) => (prev ? `${prev}, ${tag}` : tag));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-zinc-400 text-sm">Loading client review session...</p>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold mb-2">Review Session Unavailable</h1>
        <p className="text-zinc-400 text-sm max-w-md mb-6">
          This client approval link is invalid, has expired, or has already been completed. Please contact your production team for a new link.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-white pb-20">
      {/* Top Banner Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
              OS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Client Review Portal
                </span>
                <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Link
                </span>
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                {review.client_name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Your Name (Optional)"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-zinc-400 font-medium px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700">
              {deliverables.length} Deliverables
            </span>
          </div>
        </div>
      </header>

      {/* Intro Welcome Card */}
      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 p-6 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Deliverables Awaiting Your Review</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Please inspect the edited photos below. You can click on any image to view it full-screen. Click <span className="text-emerald-400 font-semibold">Approve</span> if you are happy with the edit, or click <span className="text-amber-400 font-semibold">Request Changes</span> to specify adjustments for the editor.
            </p>
          </div>
        </div>

        {/* Deliverables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliverables.map((item) => {
            const currentStatus = itemStatuses[item.id]?.status || item.approval_status;
            const currentReason = itemStatuses[item.id]?.reason || item.rejection_reason;
            const isApproved = currentStatus === 'approved';
            const isRejected = currentStatus === 'rejected';

            const photoUrl = item.image_url || item.thumbnail_url || item.preview_url || '';

            return (
              <div
                key={item.id}
                className={`rounded-xl border overflow-hidden flex flex-col justify-between transition-all duration-200 bg-zinc-900/90 ${
                  isApproved
                    ? 'border-emerald-500/40 ring-1 ring-emerald-500/30'
                    : isRejected
                    ? 'border-amber-500/40 ring-1 ring-amber-500/30'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Image Media Preview */}
                <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden group">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={item.display_name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                      No Preview Available
                    </div>
                  )}

                  {/* Zoom Overlay */}
                  {photoUrl && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <button
                        onClick={() => setLightboxUrl(photoUrl)}
                        className="p-2.5 rounded-full bg-white/90 text-zinc-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-lg cursor-pointer transform group-hover:scale-110"
                        title="Zoom Image"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Status Overlay Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    {isApproved ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white shadow-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approved</span>
                      </span>
                    ) : isRejected ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-zinc-950 shadow-lg">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Revision Requested</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800/90 text-zinc-300 border border-zinc-700 backdrop-blur-md">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Pending Review</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-sm text-white truncate" title={item.display_name}>
                      {item.display_name}
                    </h3>
                    <p className="text-xs font-mono text-zinc-400 truncate">
                      {item.file_name}
                    </p>
                    {item.target_month && (
                      <span className="text-[11px] text-zinc-500 block">
                        Target: {item.target_month}
                      </span>
                    )}

                    {/* Show Rejection Feedback If Present */}
                    {isRejected && currentReason && (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1 mt-2">
                        <span className="font-semibold block text-[10px] uppercase tracking-wider text-amber-400">
                          Feedback for Editor:
                        </span>
                        <p className="leading-snug">{currentReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                    {isApproved ? (
                      <div className="w-full py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready for Posting</span>
                      </div>
                    ) : isRejected ? (
                      <div className="w-full py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center text-xs font-semibold text-amber-400 flex items-center justify-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Sent to Editor for Revision</span>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(item)}
                          disabled={decisionMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Request Changes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprove(item)}
                          disabled={decisionMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve ✓</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Lightbox Full Zoom Modal */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
            <img
              src={lightboxUrl}
              alt="Enlarged view"
              className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Request Changes / Rejection Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <MessageSquare className="w-4 h-4" />
                <span>Request Revision from Editor</span>
              </div>
              <button
                onClick={() => setRejectModalItem(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              {(rejectModalItem.image_url || rejectModalItem.thumbnail_url) && (
                <img
                  src={rejectModalItem.image_url || rejectModalItem.thumbnail_url}
                  alt={rejectModalItem.display_name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <h4 className="font-semibold text-xs text-white truncate">
                  {rejectModalItem.display_name}
                </h4>
                <p className="text-[11px] font-mono text-zinc-400 truncate">
                  {rejectModalItem.file_name}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  What adjustments are needed? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Please brighten shadows, make skin tone warmer, and crop tighter..."
                  className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-950 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Quick Tags */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-zinc-400 block">Quick Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Brighten Exposure', 'Warmer Tone', 'Cooler Tone', 'Skin Retouch', 'Crop Adjustment', 'Contrast Boost'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => appendReasonTag(tag)}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={decisionMutation.isPending || !rejectionReason.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {decisionMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Submit Feedback ➔</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
