import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../logger';
import { environment } from '../config/env';

// SECURITY: Validation to prevent insecure production deployments
if (environment.nodeEnv === 'production' && !environment.jwtSecret && !environment.supabase.serviceRoleKey) {
    throw new Error('FATAL: JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY is missing in production.');
}

const JWT_SECRET = environment.jwtSecret || environment.supabase.serviceRoleKey || 'insecure-fallback-dev-secret';

// Define the custom claims we add to the token
interface InvitationClaims {
    role: 'ADMIN' | 'INSTRUCTOR';
    studioId: string | null;
    creatorId: string;
}

const ISSUER = 'classly-backend';
const AUDIENCE = 'classly-users';

const JWT_OPTIONS: jwt.SignOptions = {
    expiresIn: '3d',
    issuer: ISSUER,
    audience: AUDIENCE
};

export class InvitationService {

    static async createInvitation(
        creatorId: string,
        role: 'ADMIN' | 'INSTRUCTOR',
        studioId: string | null = null
    ) {
        logger.info({ creatorId, role, studioId }, 'Creating invitation token');

        // Generic logic: studioId is strictly for INSTRUCTOR invites in this flow
        const payloadStudioId = role === 'INSTRUCTOR' ? studioId : null;

        // Simple, clean payload object
        const claims: InvitationClaims = { role, studioId: payloadStudioId, creatorId };

        // Sign the token
        const token = jwt.sign(claims, JWT_SECRET, JWT_OPTIONS);

        return {
            token,
            ...claims,
            expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
        };
    }

    // Validate an invitation token
    static async validateInvitation(token: string) {
        logger.info('Validating invitation token');

        try {
            // Verify and decode
            const decoded = jwt.verify(token, JWT_SECRET, {
                issuer: ISSUER,
                audience: AUDIENCE
            }) as InvitationClaims & jwt.JwtPayload;

            let studio = null;
            if (decoded.studioId && decoded.role == 'INSTRUCTOR') {
                const { data } = await supabaseAdmin
                    .from('studios')
                    .select('name, serial_number')
                    .eq('id', decoded.studioId)
                    .single();
                studio = data;
            }

            return { valid: true, ...decoded, studio };
        } catch (error: any) {
            logger.warn({ err: error.message }, 'Invalid or expired token');
            return null;
        }
    }

    // Accept an invitation: Promote the user
    static async acceptInvitation(token: string, userId: string) {
        logger.info({ userId }, 'Accepting invitation');

        const invitation = await this.validateInvitation(token);
        if (!invitation || !invitation.valid) {
            throw new Error('Invalid or expired invitation token');
        }

        const { role, studioId } = invitation;

        // Prepare user updates
        const userUpdates: any = { role };

        // Only update studio_id if it is part of the invitation (e.g. for INSTRUCTORS)
        if (studioId) {
            userUpdates.studio_id = studioId;
        }

        // 1. Update public.users
        const { error: publicError } = await supabaseAdmin
            .from('users')
            .update(userUpdates)
            .eq('id', userId);

        if (publicError) {
            logger.error({ err: publicError }, 'Failed to update public user profile');
            throw new Error('Failed to update user profile');
        }

        // 2. Update auth.users metadata (for session consistency)
        const metadataUpdates: any = { role };
        if (studioId) {
            metadataUpdates.studio_id = studioId;
        }

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { user_metadata: metadataUpdates }
        );

        if (authError) {
            logger.error({ err: authError }, 'Failed to update auth metadata');
            // Not critical if public profile updated, but good to have sync
        }

        logger.info({ userId, role, studioId }, 'User successfully promoted via invitation');
        return { success: true, role, studioId };
    }

    // Stateless tokens cannot be "marked as used" without a blacklist.
    static async markAsUsed(token: string) {
        // No-op for stateless implementation
        return;
    }
}
