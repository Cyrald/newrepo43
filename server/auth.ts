import bcrypt from "bcryptjs";
import { type Request, type Response, type NextFunction } from "express";
import { logger } from "./utils/logger";
import { db } from "./db";
import { users, userRoles } from "@shared/schema";
import { eq } from "drizzle-orm";

const DUMMY_PASSWORD_HASH = "$2a$10$DummyHashForTimingAttackProtectionXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

let ANONYMOUS_USER_ID: string | null = null;
let ANONYMOUS_USER_ROLES: string[] = [];

async function getAnonymousUser() {
  if (ANONYMOUS_USER_ID) {
    return { id: ANONYMOUS_USER_ID, roles: ANONYMOUS_USER_ROLES };
  }

  try {
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@ecomarket.ru"))
      .limit(1);

    if (adminUser.length > 0) {
      const roles = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, adminUser[0].id));

      ANONYMOUS_USER_ID = adminUser[0].id;
      ANONYMOUS_USER_ROLES = roles.map(r => r.role);

      logger.info('Anonymous user initialized', { 
        userId: ANONYMOUS_USER_ID, 
        roles: ANONYMOUS_USER_ROLES 
      });

      return { id: ANONYMOUS_USER_ID, roles: ANONYMOUS_USER_ROLES };
    }
  } catch (error) {
    logger.error('Failed to get anonymous user', { error });
  }

  return { id: "1", roles: ["admin", "customer"] };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function safePasswordCompare(password: string, hash: string | null): Promise<boolean> {
  const actualHash = hash || DUMMY_PASSWORD_HASH;
  const result = await bcrypt.compare(password, actualHash);
  return hash !== null && result;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRoles?: string[];
    }
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const anonUser = await getAnonymousUser();
  req.userId = anonUser.id;
  req.userRoles = anonUser.roles;
  
  logger.debug('Stub authentication', { 
    userId: req.userId, 
    roles: req.userRoles 
  });
  
  next();
}

export function invalidateUserCache(userId: string) {
  logger.debug('User cache invalidation stub', { userId });
}

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.debug('Stub role check - always allowed', { 
      requestedRoles: roles, 
      userId: req.userId 
    });
    next();
  };
}
