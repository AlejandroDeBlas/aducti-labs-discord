import { type Guild, type GuildMember } from 'discord.js';
import { db } from '../db/index.js';
import { users, type User } from '../db/schema.js';
import { UserService } from './user.service.js';
import { SubscriptionService } from './subscription.service.js';
import { DiscordLogger } from '../discord/logger.js';
import { ROLE_NAMES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export class ReconcileService {
  /**
   * Reconciles a single user's roles against their DB and Stripe state
   */
  static async reconcileUser(
    user: User,
    guild: Guild
  ): Promise<{ rolesAdded: number; rolesRemoved: number }> {
    let rolesAdded = 0;
    let rolesRemoved = 0;

    let member: GuildMember | null = null;
    try {
      member = await guild.members.fetch(user.discordUserId);
    } catch {
      // User is not in the guild
      return { rolesAdded: 0, rolesRemoved: 0 };
    }

    if (!member) return { rolesAdded: 0, rolesRemoved: 0 };

    const targetRoles = await SubscriptionService.computeUserTargetRoles(user.id);

    const memberRole = guild.roles.cache.find((r) => r.name === ROLE_NAMES.MEMBER);
    const proRole = guild.roles.cache.find((r) => r.name === ROLE_NAMES.PRO);
    const founderRole = guild.roles.cache.find((r) => r.name === ROLE_NAMES.FOUNDER);

    // 1. Reconcile Member role
    if (memberRole) {
      const hasMember = member.roles.cache.has(memberRole.id);
      if (targetRoles.shouldHaveMember && !hasMember) {
        await member.roles.add(memberRole);
        rolesAdded++;
      }
    }

    // 2. Reconcile Pro role
    if (proRole) {
      const hasPro = member.roles.cache.has(proRole.id);
      if (targetRoles.shouldHavePro && !hasPro) {
        await member.roles.add(proRole);
        rolesAdded++;
        logger.info({ userId: user.id, discordUserId: user.discordUserId }, 'Reconciliation added PRO role');
      } else if (!targetRoles.shouldHavePro && hasPro) {
        await member.roles.remove(proRole);
        rolesRemoved++;
        await DiscordLogger.logProRemoved(guild, member.user, 'Reconciliación: suscripción no activa');
        logger.info({ userId: user.id, discordUserId: user.discordUserId }, 'Reconciliation removed PRO role');
      }
    }

    // 3. Reconcile Founder role (Only ADD, never remove historical Founder status)
    if (founderRole) {
      const hasFounder = member.roles.cache.has(founderRole.id);
      if (targetRoles.shouldHaveFounder && !hasFounder) {
        await member.roles.add(founderRole);
        rolesAdded++;
        logger.info({ userId: user.id, discordUserId: user.discordUserId }, 'Reconciliation added FOUNDER role');
      }
    }

    // Update DB state
    await UserService.updateRoleState(user.id, {
      memberRole: targetRoles.shouldHaveMember,
      proRole: targetRoles.shouldHavePro,
      founderRole: targetRoles.shouldHaveFounder,
    });

    return { rolesAdded, rolesRemoved };
  }

  /**
   * Reconciles all users in the database against guild roles
   */
  static async reconcileGuildMembers(guild: Guild): Promise<{
    checked: number;
    rolesAdded: number;
    rolesRemoved: number;
    errors: number;
  }> {
    logger.info('Starting full guild reconciliation...');
    await guild.roles.fetch();

    const allUsers = await db.query.users.findMany();
    let totalAdded = 0;
    let totalRemoved = 0;
    let errors = 0;

    for (const user of allUsers) {
      try {
        const { rolesAdded, rolesRemoved } = await this.reconcileUser(user, guild);
        totalAdded += rolesAdded;
        totalRemoved += rolesRemoved;
      } catch (err) {
        logger.error({ err, userId: user.id }, 'Error reconciling user');
        errors++;
      }
    }

    const summary = {
      checked: allUsers.length,
      rolesAdded: totalAdded,
      rolesRemoved: totalRemoved,
      errors,
    };

    logger.info(summary, 'Full guild reconciliation completed');
    await DiscordLogger.logReconciliation(guild, summary);

    return summary;
  }
}
