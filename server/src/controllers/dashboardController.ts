import type { Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import type { AuthRequest } from "../middleware/auth.js";
import {
  Workspace,
  Card,
  Activity,
  Notification,
  Comment,
  Project,
} from "../models/index.js";

interface customError extends Error {
  status?: number;
}

const toIdString = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === "object" && "_id" in value) {
    const id = (value as { _id: unknown })._id;
    return id != null ? String(id) : null;
  }
  return String(value);
};

const categorizeColumn = (title: string): "todo" | "inProgress" | "done" | "other" => {
  const t = title.toLowerCase();
  if (t.includes("done")) return "done";
  if (t.includes("progress") || t.includes("review")) return "inProgress";
  if (t.includes("backlog") || t.includes("to do") || t.includes("todo")) return "todo";
  return "other";
};

const formatCard = (card: any) => ({
  _id: card._id,
  title: card.title,
  priority: card.priority,
  dueDate: card.dueDate,
  updatedAt: card.updatedAt,
  project: card.project
    ? { _id: card.project._id, name: card.project.name }
    : null,
  column: card.column
    ? { _id: card.column._id, title: card.column.title }
    : null,
  workspace: card.workspace,
});

export const getDashboard = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
    if (!req.user?._id) {
      const error = new Error("Unauthorized") as customError;
      error.status = 401;
      return next(error);
    }

    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error("Invalid user id") as customError;
      error.status = 400;
      return next(error);
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const workspaces = await Workspace.find({
      members: { $elemMatch: { user: userObjectId } },
    }).populate("members.user", "name email");

    const workspaceIds = workspaces.map((ws) => ws._id);

    const isWorkspaceAdmin = (ws: (typeof workspaces)[0]) =>
      toIdString(ws.owner) === userId ||
      ws.members.some((m) => {
        if (!m?.user) return false;
        return toIdString(m.user) === userId && m.role === "admin";
      });

    if (workspaceIds.length === 0) {
      res.status(200).json({
        personal: {
          assignedCards: [],
          urgentCards: [],
          recentlyTouchedCards: [],
          activityCount: 0,
        },
        workspaces: [],
        recentProjects: [],
        boardHealth: {
          byStatus: { todo: 0, inProgress: 0, done: 0, other: 0 },
          unassignedCount: 0,
          overdueCount: 0,
          totalCards: 0,
        },
        activityFeed: [],
        pendingJoinRequests: [],
        notifications: {
          unreadCount: 0,
          unread: [],
          cardsWithUnreadMessages: [],
          cardsMovedAssignedToYou: [],
        },
      });
      return;
    }

    const cardPopulate = [
      { path: "project", select: "name" },
      { path: "column", select: "title" },
    ];

    const [assignedCards, urgentCards, recentlyTouchedCards, allCards, activityFeed, userActivityCount] =
      await Promise.all([
        Card.find({ workspace: { $in: workspaceIds }, assignees: { $in: [userObjectId, userId] } })
          .populate(cardPopulate)
          .sort({ updatedAt: -1 })
          .limit(8),
        Card.find({
          workspace: { $in: workspaceIds },
          priority: { $in: ["urgent", "high"] },
        })
          .populate(cardPopulate)
          .sort({ updatedAt: -1 })
          .limit(8),
        Card.find({
          workspace: { $in: workspaceIds },
          $or: [
            { createdBy: userObjectId },
            { assignees: { $in: [userObjectId, userId] } },
          ],
        })
          .populate(cardPopulate)
          .sort({ updatedAt: -1 })
          .limit(8),
        Card.find({ workspace: { $in: workspaceIds } }).populate("column", "title"),
        Activity.find({ workspace: { $in: workspaceIds } })
          .populate("user", "name email")
          .populate("project", "name")
          .sort({ createdAt: -1 })
          .limit(20),
        Activity.countDocuments({ user: userObjectId, workspace: { $in: workspaceIds } }),
      ]);

    const now = new Date();
    const byStatus = { todo: 0, inProgress: 0, done: 0, other: 0 };
    let unassignedCount = 0;
    let overdueCount = 0;

    for (const card of allCards) {
      if (!card.assignees?.length) unassignedCount++;
      if (card.dueDate && new Date(card.dueDate) < now) overdueCount++;
      const colTitle = (card.column as any)?.title || "";
      byStatus[categorizeColumn(colTitle)]++;
    }

    const adminWorkspaceIds = workspaces
      .filter(isWorkspaceAdmin)
      .map((ws) => ws._id);

    const [pendingJoinRequests, allNotifications, projectCounts, recentProjectActivity] =
      await Promise.all([
        Notification.find({
          workspace: { $in: adminWorkspaceIds },
          type: "join_request",
          status: "pending",
        })
          .populate("sender", "name email")
          .sort({ createdAt: -1 }),
        Notification.find({ recipient: userObjectId }).sort({ createdAt: -1 }),
        Project.aggregate([
          { $match: { workspace: { $in: workspaceIds } } },
          { $group: { _id: "$workspace", count: { $sum: 1 } } },
        ]),
        Activity.aggregate([
          { $match: { workspace: { $in: workspaceIds }, project: { $exists: true, $ne: null } } },
          { $sort: { createdAt: -1 } },
          { $group: { _id: "$project", lastActivity: { $first: "$createdAt" } } },
          { $limit: 6 },
        ]),
      ]);

    const unreadNotifications = allNotifications.filter((n) => !n.read);

    const relevantCards = await Card.find({
      workspace: { $in: workspaceIds },
      $or: [
        { assignees: { $in: [userObjectId, userId] } },
        { createdBy: userObjectId },
      ],
    })
      .populate("project", "name")
      .select("_id title project workspace")
      .limit(30);

    const cardsWithUnreadMessages: any[] = [];

    for (const card of relevantCards) {
      const lastUserComment = await Comment.findOne({
        card: card._id,
        author: userObjectId,
      }).sort({ createdAt: -1 });

      const unreadQuery: Record<string, unknown> = {
        card: card._id,
        author: { $ne: userObjectId },
      };
      if (lastUserComment) {
        unreadQuery.createdAt = { $gt: lastUserComment.createdAt };
      }

      const unreadComment = await Comment.findOne(unreadQuery)
        .populate("author", "name")
        .sort({ createdAt: -1 });

      if (unreadComment) {
        cardsWithUnreadMessages.push({
          card: {
            _id: card._id,
            title: card.title,
            project: card.project,
          },
          lastComment: {
            content: unreadComment.content,
            author: unreadComment.author,
            createdAt: unreadComment.createdAt,
          },
        });
      }
      if (cardsWithUnreadMessages.length >= 6) break;
    }

    const movedActivities = await Activity.find({
      workspace: { $in: workspaceIds },
      action: { $regex: /moved/i },
      card: { $exists: true, $ne: null },
    })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(30);

    const seenCardIds = new Set<string>();
    const cardsMovedAssignedToYou: any[] = [];

    for (const act of movedActivities) {
      const cardId = act.card?.toString();
      if (!cardId || seenCardIds.has(cardId)) continue;

      const card = await Card.findById(cardId)
        .populate("project", "name")
        .populate("column", "title");

      const actUserId = toIdString(act.user);
      if (
        card &&
        card.assignees?.some((a) => toIdString(a) === userId) &&
        actUserId &&
        actUserId !== userId
      ) {
        seenCardIds.add(cardId);
        cardsMovedAssignedToYou.push({
          card: formatCard(card),
          activity: {
            action: act.action,
            user: act.user,
            createdAt: act.createdAt,
          },
        });
      }
      if (cardsMovedAssignedToYou.length >= 6) break;
    }

    const projectCountMap = new Map(
      projectCounts.map((p: any) => [p._id.toString(), p.count])
    );

    const workspaceSummaries = workspaces.map((ws) => ({
      _id: ws._id,
      name: ws.name,
      slug: ws.slug,
      memberCount: ws.members.filter((m) => m?.user).length,
      projectCount: projectCountMap.get(ws._id.toString()) || 0,
      isAdmin: isWorkspaceAdmin(ws),
    }));

    const recentProjectIds = recentProjectActivity.map((p: any) => p._id);
    const recentProjects = await Project.find({
      _id: { $in: recentProjectIds },
    }).select("name workspace createdAt");

    const recentProjectsWithMeta = recentProjects.map((proj) => {
      const activity = recentProjectActivity.find(
        (a: any) => a._id.toString() === proj._id.toString()
      );
      const ws = workspaces.find(
        (w) => w._id.toString() === proj.workspace.toString()
      );
      return {
        _id: proj._id,
        name: proj.name,
        workspaceName: ws?.name || "",
        workspaceId: proj.workspace,
        lastActivity: activity?.lastActivity || proj.createdAt,
      };
    });

    recentProjectsWithMeta.sort(
      (a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    res.status(200).json({
      personal: {
        assignedCards: assignedCards.map(formatCard),
        urgentCards: urgentCards.map(formatCard),
        recentlyTouchedCards: recentlyTouchedCards.map(formatCard),
        activityCount: userActivityCount,
      },
      workspaces: workspaceSummaries,
      recentProjects: recentProjectsWithMeta,
      boardHealth: {
        byStatus,
        unassignedCount,
        overdueCount,
        totalCards: allCards.length,
      },
      activityFeed: activityFeed.map((a) => ({
        _id: a._id,
        action: a.action,
        createdAt: a.createdAt,
        user: a.user,
        project: a.project,
        workspace: a.workspace,
      })),
      pendingJoinRequests: pendingJoinRequests.map((n) => ({
        _id: n._id,
        message: n.message,
        sender: n.sender,
        workspace: n.workspace,
        createdAt: n.createdAt,
      })),
      notifications: {
        unreadCount: unreadNotifications.length,
        unread: unreadNotifications.slice(0, 10),
        cardsWithUnreadMessages,
        cardsMovedAssignedToYou,
      },
    });
    } catch (err) {
      console.error("Dashboard error:", err);
      const error = new Error(
        err instanceof Error ? err.message : "Failed to load dashboard"
      ) as customError;
      error.status = 500;
      return next(error);
    }
  }
);
