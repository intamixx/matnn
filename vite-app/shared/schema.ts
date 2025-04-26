import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Form submission schema
export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  bpm: boolean("bpm").notNull().default(false),
  key: boolean("key").notNull().default(false),
  approachability: boolean("approachability").notNull().default(false),
  modelType: text("model_type").notNull(), // For radio selection: 'discogs-effnet', 'musicnn', 'magnatagatune'
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  fileType: text("file_type"),
  submittedAt: text("submitted_at").notNull(),
});

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
  id: true,
});

// Extend the schema with validation rules
//export const formValidationSchema = insertFormSubmissionSchema.extend({
//  // Ensure at least one option is selected
//  bpm: z.boolean(),
//  key: z.boolean(),
//  approachability: z.boolean(),
//  modelType: z.enum(['discogs-effnet', 'musicnn', 'magnatagatune']),
//  fileName: z.string().optional().nullable(),
//  fileSize: z.number().optional().nullable(),
//  fileType: z.string().optional().nullable(),
//  submittedAt: z.string(),
//}).refine(data => {
//  return data.bpm || data.key || data.approachability;
//}, {
//  message: "Please select at least one option",
//  path: ["options"]
//});


export const formValidationSchema = insertFormSubmissionSchema.extend({
// Form validation schema (Vue-inspired approach)
  bpm: z.boolean(),
  key: z.boolean(),
  approachability: z.boolean(),
  modelType: z.enum(['discogs-effnet', 'musicnn', 'magnatagatune']),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  fileType: z.string().optional().nullable(),
  faid: z.string(),
  submittedAt: z.string(),
}).superRefine((data, ctx) => {
  //if (!data.fileName || data.fileName.trim() === "") {
  console.log("Hello");
  console.log(data.fileName);
  if (data.fileName = '') {
  console.log("match filename is blank");
    ctx.addIssue({
      path: ['options'],
      code: z.ZodIssueCode.custom,
      message: 'Please select a filename',
    });
  }
  if (!(data.bpm || data.key || data.approachability)) {
    ctx.addIssue({
      path: ['options'],
      code: z.ZodIssueCode.custom,
      message: 'Please select at least one option',
    });
  }
});


export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type FormSubmission = typeof formSubmissions.$inferSelect;
