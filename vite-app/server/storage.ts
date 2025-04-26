import { users, type User, type InsertUser, type FormSubmission, type InsertFormSubmission } from "@shared/schema";
import * as TinyDbBridge from "./tinydb_bridge";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  getAllFormSubmissions(): Promise<FormSubmission[]>;
}

// Memory storage implementation (for fallback/testing)
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private formSubmissions: Map<number, FormSubmission>;
  currentId: number;
  formSubmissionId: number;

  constructor() {
    this.users = new Map();
    this.formSubmissions = new Map();
    this.currentId = 1;
    this.formSubmissionId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createFormSubmission(insertSubmission: InsertFormSubmission): Promise<FormSubmission> {
    const id = this.formSubmissionId++;
    const submission: FormSubmission = { ...insertSubmission, id };
    this.formSubmissions.set(id, submission);
    return submission;
  }

  async getAllFormSubmissions(): Promise<FormSubmission[]> {
    return Array.from(this.formSubmissions.values());
  }
}

// TinyDB storage implementation
export class TinyDbStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return TinyDbBridge.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return TinyDbBridge.getUserByUsername(username);
  }

  async createUser(user: InsertUser): Promise<User> {
    return TinyDbBridge.createUser(user);
  }

  async createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission> {
    return TinyDbBridge.createFormSubmission(submission);
  }

  async getAllFormSubmissions(): Promise<FormSubmission[]> {
    return TinyDbBridge.getAllFormSubmissions();
  }
}

// Export the TinyDB implementation as the storage to use
export const storage = new TinyDbStorage();
