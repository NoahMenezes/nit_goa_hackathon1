// In-memory database for serverless deployment
// This can be replaced with a real database (e.g., Vercel Postgres, MongoDB Atlas, Supabase)

import { User, Issue, Comment, Vote } from "./types";
import { hashPassword } from "./auth";

// In-memory storage
const db = {
  users: new Map<string, User>(),
  issues: new Map<string, Issue>(),
  comments: new Map<string, Comment>(),
  votes: new Map<string, Vote>(),
};

// Helper function to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// User operations
export const userDb = {
  async create(
    user: Omit<User, "id" | "createdAt" | "updatedAt">,
  ): Promise<User> {
    const newUser: User = {
      ...user,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.set(newUser.id, newUser);
    return newUser;
  },

  async findById(id: string): Promise<User | undefined> {
    return db.users.get(id);
  },

  async findByEmail(email: string): Promise<User | undefined> {
    return Array.from(db.users.values()).find((user) => user.email === email);
  },

  async update(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = db.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db.users.set(id, updatedUser);
    return updatedUser;
  },

  async delete(id: string): Promise<boolean> {
    return db.users.delete(id);
  },

  async getAll(): Promise<User[]> {
    return Array.from(db.users.values());
  },
};

// Issue operations
export const issueDb = {
  async create(
    issue: Omit<Issue, "id" | "createdAt" | "updatedAt" | "votes" | "comments">,
  ): Promise<Issue> {
    const newIssue: Issue = {
      ...issue,
      id: generateId(),
      votes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.issues.set(newIssue.id, newIssue);
    return newIssue;
  },

  async findById(id: string): Promise<Issue | undefined> {
    return db.issues.get(id);
  },

  async update(
    id: string,
    updates: Partial<Issue>,
  ): Promise<Issue | undefined> {
    const issue = db.issues.get(id);
    if (!issue) return undefined;

    const updatedIssue = {
      ...issue,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status === "resolved" && !issue.resolvedAt) {
      updatedIssue.resolvedAt = new Date().toISOString();
    }

    db.issues.set(id, updatedIssue);
    return updatedIssue;
  },

  async delete(id: string): Promise<boolean> {
    return db.issues.delete(id);
  },

  async getAll(): Promise<Issue[]> {
    return Array.from(db.issues.values());
  },

  async findByUserId(userId: string): Promise<Issue[]> {
    return Array.from(db.issues.values()).filter(
      (issue) => issue.userId === userId,
    );
  },

  async findByStatus(status: string): Promise<Issue[]> {
    return Array.from(db.issues.values()).filter(
      (issue) => issue.status === status,
    );
  },

  async findByCategory(category: string): Promise<Issue[]> {
    return Array.from(db.issues.values()).filter(
      (issue) => issue.category === category,
    );
  },

  async incrementVotes(id: string): Promise<Issue | undefined> {
    const issue = db.issues.get(id);
    if (!issue) return undefined;

    issue.votes += 1;
    issue.updatedAt = new Date().toISOString();
    db.issues.set(id, issue);
    return issue;
  },

  async decrementVotes(id: string): Promise<Issue | undefined> {
    const issue = db.issues.get(id);
    if (!issue) return undefined;

    if (issue.votes > 0) {
      issue.votes -= 1;
      issue.updatedAt = new Date().toISOString();
      db.issues.set(id, issue);
    }
    return issue;
  },
};

// Comment operations
export const commentDb = {
  async create(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment> {
    const newComment: Comment = {
      ...comment,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    db.comments.set(newComment.id, newComment);

    // Add comment to issue
    const issue = db.issues.get(comment.issueId);
    if (issue) {
      issue.comments.push(newComment);
      db.issues.set(issue.id, issue);
    }

    return newComment;
  },

  async findById(id: string): Promise<Comment | undefined> {
    return db.comments.get(id);
  },

  async findByIssueId(issueId: string): Promise<Comment[]> {
    return Array.from(db.comments.values()).filter(
      (comment) => comment.issueId === issueId,
    );
  },

  async delete(id: string): Promise<boolean> {
    const comment = db.comments.get(id);
    if (!comment) return false;

    // Remove from issue
    const issue = db.issues.get(comment.issueId);
    if (issue) {
      issue.comments = issue.comments.filter((c) => c.id !== id);
      db.issues.set(issue.id, issue);
    }

    return db.comments.delete(id);
  },
};

// Vote operations
export const voteDb = {
  async create(vote: Omit<Vote, "id" | "createdAt">): Promise<Vote> {
    const newVote: Vote = {
      ...vote,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    db.votes.set(newVote.id, newVote);
    return newVote;
  },

  async findByUserAndIssue(
    userId: string,
    issueId: string,
  ): Promise<Vote | undefined> {
    return Array.from(db.votes.values()).find(
      (vote) => vote.userId === userId && vote.issueId === issueId,
    );
  },

  async delete(id: string): Promise<boolean> {
    return db.votes.delete(id);
  },

  async findByIssueId(issueId: string): Promise<Vote[]> {
    return Array.from(db.votes.values()).filter(
      (vote) => vote.issueId === issueId,
    );
  },
};

// Seed data for demo purposes
export async function seedDatabase() {
  // Create sample users with properly hashed passwords
  const user1 = await userDb.create({
    name: "John Doe",
    email: "john@example.com",
    password: await hashPassword("Demo1234"), // Password: Demo1234
    role: "citizen",
  });

  const user2 = await userDb.create({
    name: "Jane Smith",
    email: "jane@example.com",
    password: await hashPassword("Demo1234"), // Password: Demo1234
    role: "citizen",
  });

  const admin = await userDb.create({
    name: "Admin User",
    email: "admin@ourstreet.com",
    password: await hashPassword("Admin1234"), // Password: Admin1234
    role: "admin",
  });

  // Create sample issues
  const issue1 = await issueDb.create({
    title: "Pothole on Main Street",
    description: "Large pothole causing traffic issues and vehicle damage",
    category: "pothole",
    location: "Main Street, Panjim, Goa",
    coordinates: { lat: 15.4909, lng: 73.8278 },
    status: "open",
    priority: "high",
    userId: user1.id,
  });

  const issue2 = await issueDb.create({
    title: "Broken Streetlight",
    description:
      "Streetlight not working since last week, making the area unsafe at night",
    category: "streetlight",
    location: "Church Square, Panjim, Goa",
    coordinates: { lat: 15.4989, lng: 73.8345 },
    status: "in-progress",
    priority: "medium",
    userId: user2.id,
  });

  void (await issueDb.create({
    title: "Overflowing Garbage Bin",
    description: "Garbage bin overflowing for 3 days, creating health hazards",
    category: "garbage",
    location: "Market Area, Panjim, Goa",
    coordinates: { lat: 15.485, lng: 73.825 },
    status: "resolved",
    priority: "high",
    userId: user1.id,
    resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  const issue4 = await issueDb.create({
    title: "Water Leak",
    description: "Continuous water leak from pipe, wasting water",
    category: "water_leak",
    location: "Residency Road, Panjim, Goa",
    coordinates: { lat: 15.495, lng: 73.83 },
    status: "open",
    priority: "medium",
    userId: user2.id,
  });

  void (await issueDb.create({
    title: "Damaged Road",
    description: "Road surface damaged after recent rains",
    category: "road",
    location: "MG Road, Panjim, Goa",
    coordinates: { lat: 15.4875, lng: 73.8275 },
    status: "open",
    priority: "medium",
    userId: user1.id,
  }));

  // Add some votes
  await issueDb.incrementVotes(issue1.id);
  await issueDb.incrementVotes(issue1.id);
  await issueDb.incrementVotes(issue1.id);
  await issueDb.incrementVotes(issue2.id);
  await issueDb.incrementVotes(issue4.id);

  // Add some comments
  await commentDb.create({
    issueId: issue1.id,
    userId: user2.id,
    userName: user2.name,
    content: "I saw this too! It's really bad and needs immediate attention.",
  });

  await commentDb.create({
    issueId: issue1.id,
    userId: admin.id,
    userName: admin.name,
    content: "This has been escalated to the road maintenance department.",
  });

  await commentDb.create({
    issueId: issue2.id,
    userId: user1.id,
    userName: user1.name,
    content: "Thank you for reporting. Work is in progress.",
  });

  console.log("Database seeded with sample data");
}

// Initialize with seed data
seedDatabase();

export default db;
