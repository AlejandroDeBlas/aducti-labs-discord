import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  users,
  stripeCustomers,
  discordRoleState,
  type User,
  type StripeCustomer,
  type DiscordRoleState,
} from '../db/schema.js';
import { logger } from '../utils/logger.js';

export class UserService {
  static async upsertUser(data: {
    discordUserId: string;
    discordUsername: string;
    discordGlobalName?: string | null;
  }): Promise<User> {
    const existing = await db.query.users.findFirst({
      where: eq(users.discordUserId, data.discordUserId),
    });

    if (existing) {
      const [updated] = await db
        .update(users)
        .set({
          discordUsername: data.discordUsername,
          discordGlobalName: data.discordGlobalName ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(users)
      .values({
        discordUserId: data.discordUserId,
        discordUsername: data.discordUsername,
        discordGlobalName: data.discordGlobalName ?? null,
      })
      .returning();

    // Initialize default role state
    await db.insert(discordRoleState).values({
      userId: created.id,
      memberRole: false,
      proRole: false,
      founderRole: false,
      lastSyncedAt: new Date(),
    });

    logger.info({ userId: created.id, discordUserId: data.discordUserId }, 'User created in database');
    return created;
  }

  static async saveOnboardingResponse(
    userId: string,
    data: {
      primaryInterest?: string;
      userProfile?: string;
      completed?: boolean;
    }
  ): Promise<User | null> {
    const updateData: Partial<User> = {
      updatedAt: new Date(),
    };

    if (data.primaryInterest !== undefined) {
      updateData.primaryInterest = data.primaryInterest;
    }
    if (data.userProfile !== undefined) {
      updateData.userProfile = data.userProfile;
    }
    if (data.completed) {
      updateData.onboardingCompletedAt = new Date();
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return updated ?? null;
  }

  static async getUserByDiscordId(discordUserId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.discordUserId, discordUserId),
      with: {
        stripeCustomer: true,
        subscriptions: true,
        roleState: true,
      },
    });
    return user ?? null;
  }

  static async getUserById(userId: string): Promise<User | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    return user ?? null;
  }

  static async linkStripeCustomer(userId: string, stripeCustomerId: string): Promise<StripeCustomer> {
    const existing = await db.query.stripeCustomers.findFirst({
      where: eq(stripeCustomers.userId, userId),
    });

    if (existing) {
      if (existing.stripeCustomerId === stripeCustomerId) {
        return existing;
      }
      const [updated] = await db
        .update(stripeCustomers)
        .set({
          stripeCustomerId,
          updatedAt: new Date(),
        })
        .where(eq(stripeCustomers.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(stripeCustomers)
      .values({
        userId,
        stripeCustomerId,
      })
      .returning();

    return created;
  }

  static async getUserByStripeCustomerId(stripeCustomerId: string) {
    const customer = await db.query.stripeCustomers.findFirst({
      where: eq(stripeCustomers.stripeCustomerId, stripeCustomerId),
      with: {
        user: {
          with: {
            stripeCustomer: true,
            subscriptions: true,
            roleState: true,
          },
        },
      },
    });
    return customer?.user ?? null;
  }

  static async updateRoleState(
    userId: string,
    state: Partial<Omit<DiscordRoleState, 'id' | 'userId' | 'lastSyncedAt'>>
  ): Promise<DiscordRoleState> {
    const existing = await db.query.discordRoleState.findFirst({
      where: eq(discordRoleState.userId, userId),
    });

    if (existing) {
      const [updated] = await db
        .update(discordRoleState)
        .set({
          ...state,
          lastSyncedAt: new Date(),
        })
        .where(eq(discordRoleState.userId, userId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(discordRoleState)
      .values({
        userId,
        memberRole: state.memberRole ?? false,
        proRole: state.proRole ?? false,
        founderRole: state.founderRole ?? false,
        lastSyncedAt: new Date(),
      })
      .returning();

    return created;
  }

  static async getRoleState(userId: string): Promise<DiscordRoleState | null> {
    const state = await db.query.discordRoleState.findFirst({
      where: eq(discordRoleState.userId, userId),
    });
    return state ?? null;
  }
}
