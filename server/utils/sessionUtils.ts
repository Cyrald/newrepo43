import { Request } from 'express';
import { logger } from './logger';
import { db } from '../db';

/**
 * Promisified version of session.save()
 * Guarantees that the session is ACTUALLY written to the database before resolving
 */
export function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) {
        logger.error('Session save failed', { error: err.message });
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Promisified version of session.regenerate()
 * Creates a new session and guarantees it's ready before resolving
 */
export function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        logger.error('Session regeneration failed', { error: err.message });
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Full session initialization flow:
 * 1. Regenerate session
 * 2. Set user data
 * 3. Save to database
 * 4. Verify session exists in DB before returning
 * 5. GUARANTEE session is ready for use
 */
export async function initializeSessionWithUser(
  req: Request, 
  userId: string,
  userRoles: string[]
): Promise<void> {
  try {
    // Step 1: Regenerate (create new session)
    await regenerateSession(req);
    
    // Step 2: Set user data
    req.session.userId = userId;
    req.session.userRoles = userRoles;
    
    // Step 3: Save and WAIT for completion
    await saveSession(req);
    
    // Step 4: VERIFY session actually exists in database
    // This is critical to prevent race conditions where CSRF token
    // is generated before session is fully persisted to PostgreSQL
    await verifySessionInDatabase(req.sessionID);
    
    logger.info('Session initialized and verified in database', { 
      userId, 
      sessionId: req.sessionID 
    });
  } catch (error) {
    logger.error('Session initialization failed', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

/**
 * Verify that session exists in the database
 * Uses retry logic with exponential backoff to handle async write delays
 */
export async function verifySessionInDatabase(
  sessionId: string,
  maxAttempts: number = 5,
  initialDelayMs: number = 50
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const sessionRecord = await db.query.sessions.findFirst({
        where: (sessions, { eq }) => eq(sessions.sid, sessionId),
      });
      
      if (sessionRecord) {
        logger.debug('Session verified in database', { 
          sessionId, 
          attempt,
          sessionCreated: !!sessionRecord 
        });
        return; // Success!
      }
      
      logger.warn('Session not found in database (attempt)', { 
        sessionId, 
        attempt, 
        maxAttempts 
      });
      
    } catch (error) {
      logger.error('Session verification database error', { 
        sessionId, 
        attempt, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // Wait before retry with exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms
    if (attempt < maxAttempts) {
      const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // If we get here, session was not found after all attempts
  throw new Error(`Session ${sessionId} not found in database after ${maxAttempts} attempts`);
}

/**
 * Check if session is ready in the database
 * Returns true only if session actually exists in DB
 * @deprecated Use verifySessionInDatabase instead
 */
export async function isSessionReady(sessionId: string, storage: any): Promise<boolean> {
  try {
    // This will query the database directly to verify session exists
    const sessionData = await storage.db.query.session.findFirst({
      where: (session: any) => session.sid === sessionId,
    });
    return !!sessionData;
  } catch (error) {
    logger.warn('Session ready check failed', { sessionId, error });
    return false;
  }
}
