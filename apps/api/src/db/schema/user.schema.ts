import {
	boolean,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	username: varchar("username", { length: 50 }).unique(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	password: text("password").notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	emailVerified: boolean("email_verified").notNull().default(false),
	isActive: boolean("is_active").notNull().default(true),
	lastLoginAt: timestamp("last_login_at"),
	image: text("image"),
	bio: text("bio"),
	role: varchar("role", { length: 20 }).notNull().default("user"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});
