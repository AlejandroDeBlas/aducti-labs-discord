import { describe, it, expect } from 'vitest';
import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { DECLARATIVE_SERVER_CONFIG } from '../src/config/discord.js';
import { ROLE_NAMES, CATEGORY_NAMES, CHANNEL_NAMES } from '../src/config/constants.js';

describe('Discord Declarative Configuration', () => {
  it('should have all 6 required roles with correct hierarchy positions', () => {
    const roles = DECLARATIVE_SERVER_CONFIG.roles;
    expect(roles).toHaveLength(6);

    const roleNames = roles.map((r) => r.name);
    expect(roleNames).toContain(ROLE_NAMES.OWNER);
    expect(roleNames).toContain(ROLE_NAMES.BOT);
    expect(roleNames).toContain(ROLE_NAMES.MODERATOR);
    expect(roleNames).toContain(ROLE_NAMES.FOUNDER);
    expect(roleNames).toContain(ROLE_NAMES.PRO);
    expect(roleNames).toContain(ROLE_NAMES.MEMBER);

    // Verify ordering
    const owner = roles.find((r) => r.name === ROLE_NAMES.OWNER);
    const bot = roles.find((r) => r.name === ROLE_NAMES.BOT);
    const mod = roles.find((r) => r.name === ROLE_NAMES.MODERATOR);
    const founder = roles.find((r) => r.name === ROLE_NAMES.FOUNDER);
    const pro = roles.find((r) => r.name === ROLE_NAMES.PRO);
    const member = roles.find((r) => r.name === ROLE_NAMES.MEMBER);

    expect(owner?.positionIndex).toBeLessThan(bot!.positionIndex);
    expect(bot?.positionIndex).toBeLessThan(founder!.positionIndex);
    expect(founder?.positionIndex).toBeLessThan(pro!.positionIndex);
    expect(pro?.positionIndex).toBeLessThan(member!.positionIndex);
  });

  it('should contain all 6 required categories', () => {
    const categories = DECLARATIVE_SERVER_CONFIG.categories;
    expect(categories).toHaveLength(6);

    const catNames = categories.map((c) => c.name);
    expect(catNames).toEqual([
      CATEGORY_NAMES.START_HERE,
      CATEGORY_NAMES.COMMUNITY,
      CATEGORY_NAMES.AI,
      CATEGORY_NAMES.RESOURCES,
      CATEGORY_NAMES.LABS_PRO,
      CATEGORY_NAMES.STAFF,
    ]);
  });

  it('should contain exactly 15 text channels and 1 voice channel', () => {
    const categories = DECLARATIVE_SERVER_CONFIG.categories;
    const allChannels = categories.flatMap((c) => c.channels);

    expect(allChannels).toHaveLength(16);

    const textChannels = allChannels.filter((c) => c.type === ChannelType.GuildText);
    const voiceChannels = allChannels.filter((c) => c.type === ChannelType.GuildVoice);

    expect(textChannels).toHaveLength(15);
    expect(voiceChannels).toHaveLength(1);
    expect(voiceChannels[0].name).toBe(CHANNEL_NAMES.SALA_PRO);
  });

  it('should restrict access to LABS_PRO category for everyone and members', () => {
    const proCategory = DECLARATIVE_SERVER_CONFIG.categories.find(
      (c) => c.name === CATEGORY_NAMES.LABS_PRO
    );
    expect(proCategory).toBeDefined();

    const mockRoles = {
      [ROLE_NAMES.MEMBER]: 'role_member_id',
      [ROLE_NAMES.PRO]: 'role_pro_id',
      [ROLE_NAMES.MODERATOR]: 'role_mod_id',
      [ROLE_NAMES.BOT]: 'role_bot_id',
      [ROLE_NAMES.OWNER]: 'role_owner_id',
    };
    const everyoneId = 'role_everyone_id';

    const overwrites = proCategory!.permissionOverwrites(mockRoles, everyoneId);

    // Everyone denied ViewChannel
    const everyoneOverwrite = overwrites.find((o) => o.id === everyoneId);
    expect(everyoneOverwrite).toBeDefined();
    expect((everyoneOverwrite as any).deny).toContain(PermissionFlagsBits.ViewChannel);

    // Member denied ViewChannel
    const memberOverwrite = overwrites.find((o) => o.id === mockRoles[ROLE_NAMES.MEMBER]);
    expect(memberOverwrite).toBeDefined();
    expect((memberOverwrite as any).deny).toContain(PermissionFlagsBits.ViewChannel);

    // Pro allowed ViewChannel
    const proOverwrite = overwrites.find((o) => o.id === mockRoles[ROLE_NAMES.PRO]);
    expect(proOverwrite).toBeDefined();
    expect((proOverwrite as any).allow).toContain(PermissionFlagsBits.ViewChannel);
  });
});
