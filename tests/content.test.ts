import { describe, it, expect } from 'vitest';
import { getWelcomeMessage } from '../src/content/welcome.js';
import { getHowItWorksEmbed } from '../src/content/howItWorks.js';
import { getProLandingEmbed } from '../src/content/pro.js';

describe('Centralized Content & Copywriting Verification', () => {
  it('welcome message should lead with the core value proposition and 4 pillars', () => {
    const { embed } = getWelcomeMessage();
    const description = embed.data.description || '';
    expect(description).toContain('La IA cambia demasiado rápido para aprenderla viendo vídeos sueltos');

    const fields = embed.data.fields || [];
    const fieldsText = fields.map((f) => `${f.name} ${f.value}`).join(' ');
    expect(fieldsText).toContain('Coding con IA');
    expect(fieldsText).toContain('Automatizaciones');
    expect(fieldsText).toContain('Modelos y Herramientas');
  });

  it('howItWorks should clearly differentiate Free vs Pro', () => {
    const embed = getHowItWorksEmbed();
    const description = embed.data.description || '';
    expect(description).toContain('Free te ayuda a descubrir y aprender. Pro te ayuda a implementar');

    const fields = embed.data.fields || [];
    const fieldsText = fields.map((f) => `${f.name} ${f.value}`).join(' ');
    expect(fieldsText).toContain('Descubrimiento');
    expect(fieldsText).toContain('Implementación');
  });

  it('pro landing embed should contain the 3 core benefits and no fake claims', () => {
    const { embed } = getProLandingEmbed({ founderAvailable: true, founderSlotsRemaining: 15 });
    const description = embed.data.description || '';
    expect(description).toContain('La IA cambia demasiado rápido para intentar seguirla');

    const fields = embed.data.fields || [];
    const fieldTitles = fields.map((f) => f.name);

    expect(fieldTitles.some((t) => t.includes('1. Aprende lo que importa'))).toBe(true);
    expect(fieldTitles.some((t) => t.includes('2. Construye cosas reales'))).toBe(true);
    expect(fieldTitles.some((t) => t.includes('3. Obtén ayuda'))).toBe(true);
    expect(fieldTitles.some((t) => t.includes('Proof of Work'))).toBe(true);
    expect(fieldTitles.some((t) => t.includes('Garantía Simple de 7 Días'))).toBe(true);
    expect(fieldTitles.some((t) => t.includes('Plazas Fundador (15 disponibles)'))).toBe(true);
  });

  it('pro landing embed should hide Founder section when founderAvailable is false', () => {
    const { embed, row } = getProLandingEmbed({ founderAvailable: false, founderSlotsRemaining: 0 });
    const fields = embed.data.fields || [];
    const fieldTitles = fields.map((f) => f.name);

    expect(fieldTitles.some((t) => t.includes('Plazas Fundador'))).toBe(false);

    const buttons = row.components;
    expect(buttons).toHaveLength(1);
    expect((buttons[0].data as any).label).toBe('Hazte Pro');
  });
});
