// Notification trigger utilities for OurStreet
// Automatically sends notifications when issue status changes

import { Issue, IssueStatus, NotificationPayload } from "./types";
import { sendNotification } from "./notifications";
import { userDb } from "./db";

/**
 * Trigger notification when issue status changes
 */
export async function notifyOnStatusChange(
  issue: Issue,
  oldStatus: IssueStatus,
  newStatus: IssueStatus,
  additionalMessage?: string,
): Promise<void> {
  try {
    // Get the issue reporter
    const reporter = await userDb.findById(issue.userId);
    if (!reporter || !reporter.email) {
      console.warn(
        `Cannot send notification - user ${issue.userId} not found or has no email`,
      );
      return;
    }

    const payload: NotificationPayload = {
      type: "status_change",
      issueId: issue.id,
      issueTitle: issue.title,
      recipient: {
        userId: reporter.id,
        email: reporter.email,
      },
      data: {
        oldStatus,
        newStatus,
        message: additionalMessage,
        url: `/issues/${issue.id}`,
      },
    };

    await sendNotification(payload);
    console.log(`Notification sent to ${reporter.email} for issue ${issue.id}`);
  } catch (error) {
    console.error("Error sending status change notification:", error);
    // Don't throw - notification failures shouldn't break the main flow
  }
}

/**
 * Trigger notification when issue is resolved
 */
export async function notifyOnResolution(
  issue: Issue,
  resolutionMessage?: string,
): Promise<void> {
  try {
    // Get the issue reporter
    const reporter = await userDb.findById(issue.userId);
    if (!reporter || !reporter.email) {
      console.warn(
        `Cannot send notification - user ${issue.userId} not found or has no email`,
      );
      return;
    }

    const payload: NotificationPayload = {
      type: "resolution",
      issueId: issue.id,
      issueTitle: issue.title,
      recipient: {
        userId: reporter.id,
        email: reporter.email,
      },
      data: {
        message:
          resolutionMessage ||
          "Your reported issue has been successfully resolved. Thank you for your contribution!",
        url: `/issues/${issue.id}`,
        newStatus: "resolved",
      },
    };

    await sendNotification(payload);
    console.log(
      `Resolution notification sent to ${reporter.email} for issue ${issue.id}`,
    );
  } catch (error) {
    console.error("Error sending resolution notification:", error);
  }
}

/**
 * Trigger notification when issue is assigned to authority
 */
export async function notifyOnAssignment(
  issue: Issue,
  authorityId: string,
  assignmentMessage?: string,
): Promise<void> {
  try {
    // Get the assigned authority
    const authority = await userDb.findById(authorityId);
    if (!authority || !authority.email) {
      console.warn(
        `Cannot send notification - authority ${authorityId} not found or has no email`,
      );
      return;
    }

    const payload: NotificationPayload = {
      type: "assignment",
      issueId: issue.id,
      issueTitle: issue.title,
      recipient: {
        userId: authority.id,
        email: authority.email,
      },
      data: {
        message:
          assignmentMessage ||
          `A new issue has been assigned to you. Priority: ${issue.priority.toUpperCase()}`,
        url: `/issues/${issue.id}`,
      },
    };

    await sendNotification(payload);
    console.log(
      `Assignment notification sent to ${authority.email} for issue ${issue.id}`,
    );
  } catch (error) {
    console.error("Error sending assignment notification:", error);
  }
}

/**
 * Trigger notification when someone comments on an issue
 */
export async function notifyOnComment(
  issue: Issue,
  commentText: string,
  commenterName: string,
): Promise<void> {
  try {
    // Get the issue reporter
    const reporter = await userDb.findById(issue.userId);
    if (!reporter || !reporter.email) {
      console.warn(
        `Cannot send notification - user ${issue.userId} not found or has no email`,
      );
      return;
    }

    const payload: NotificationPayload = {
      type: "comment",
      issueId: issue.id,
      issueTitle: issue.title,
      recipient: {
        userId: reporter.id,
        email: reporter.email,
      },
      data: {
        message: `${commenterName} commented: "${commentText.substring(0, 100)}${commentText.length > 100 ? "..." : ""}"`,
        url: `/issues/${issue.id}`,
      },
    };

    await sendNotification(payload);
    console.log(
      `Comment notification sent to ${reporter.email} for issue ${issue.id}`,
    );
  } catch (error) {
    console.error("Error sending comment notification:", error);
  }
}

/**
 * Check if notification should be sent based on status transition
 */
export function shouldNotifyOnStatusChange(
  oldStatus: IssueStatus,
  newStatus: IssueStatus,
): boolean {
  // Always notify when status changes
  if (oldStatus === newStatus) return false;

  // Notify on all status transitions
  return true;
}

/**
 * Get notification message based on status transition
 */
export function getStatusChangeMessage(
  oldStatus: IssueStatus,
  newStatus: IssueStatus,
): string {
  if (newStatus === "resolved") {
    return "Great news! Your issue has been resolved. Please check the resolution photos.";
  } else if (newStatus === "in-progress") {
    return "Your issue is now being worked on by our team.";
  } else if (newStatus === "closed") {
    return "Your issue has been closed. If you have concerns, please contact support.";
  } else if (newStatus === "open" && oldStatus !== "open") {
    return "Your issue has been reopened for review.";
  }

  return `Issue status updated from ${oldStatus} to ${newStatus}.`;
}
