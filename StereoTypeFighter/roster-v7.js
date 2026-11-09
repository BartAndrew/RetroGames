// V7 vertical-slice roster: Bogan Tradie, Yuppie, Gym Bro.
// Each fighter has its own move tuning, special and super so no two play the same.
import { baseMoves } from './combat-v7.js';

export const ROSTER = [
  {
    id: 'bogan-tradie', name: 'Bogan Tradie', nick: 'Gaz', country: 'Australia', accent: '#ffd31a', accent2: '#1b2a5a',
    style: 'Tradie Brawler', bio: 'Steel-capped pressure, heavy hands, and a ute parked illegally outside the arena.',
    hp: 1050, speed: 0.98, jump: 13.4, special: 'Nail Gun Burst', superName: 'KNOCK-OFF TIME',
    look: { skin: '#d9a07a', hair: '#4a3320', top: '#ff8a1a', topDark: '#c85f00', pants: '#2c3e63', boots: '#6b4a2a', hat: 'hardhat', hatColor: '#ffd31a', build: 1.08, prop: 'none' },
    specialSpec: { kind: 'projectile', speed: 9, dmg: 11, w: 40, h: 16, py: 90, fx: 'nail' },
    moves: baseMoves({
      hp: { name: 'Shovel Hand', dmg: 10, hitstun: 21, kb: 9 },
      launcher: { name: 'Tailgate Uppercut', dmg: 9 },
      special: { name: 'Nail Gun Burst', startup: 13, recovery: 22, type: 'strike' },
      super: { name: 'Knock-Off Time', dmg: 5, hits: [0, 5, 10, 15, 20, 26], finisher: { dmg: 22, launch: 11.5, kb: 12 } },
    }),
  },
  {
    id: 'yuppie', name: 'Yuppie', nick: 'Preston', country: 'USA', accent: '#7fe0d2', accent2: '#102a43',
    style: 'Executive Counter', bio: 'Polished, competitive, and describes every combo as a synergy.',
    hp: 980, speed: 1.02, jump: 13.8, special: 'Hostile Takeover', superName: 'GOLDEN PARACHUTE',
    look: { skin: '#e6b693', hair: '#2a2118', top: '#16284a', topDark: '#0c1830', pants: '#16284a', boots: '#1a1a1a', hat: 'none', tie: '#c8202e', shirt: '#f4f4f4', build: 0.98, prop: 'briefcase' },
    specialSpec: { kind: 'charge', dash: 6.5 },
    moves: baseMoves({
      lp: { startup: 4, name: 'Cuff Jab', advance: 1.4 },
      lk: { name: 'Loafer Kick' },
      hp: { name: 'Briefcase Swing', dmg: 9, hb: { w: 82 } },
      special: { name: 'Hostile Takeover', startup: 10, active: 14, recovery: 22, dmg: 11, kb: 8, type: 'strike', hb: { x: 8, y: 50, w: 70, h: 70 } },
      super: { name: 'Golden Parachute', dmg: 5, hits: [0, 6, 12, 18, 25], finisher: { dmg: 21, launch: 12, kb: 13 } },
    }),
  },
  {
    id: 'gym-bro', name: 'Gym Bro', nick: 'Tyler', country: 'USA', accent: '#8cff20', accent2: '#1e1e1e',
    style: 'Fitness Brawler', bio: 'Heavy punches, high kicks, and a shaker bottle full of explosive opinions.',
    hp: 1100, speed: 0.94, jump: 13.0, special: 'Protein Shaker Blast', superName: 'LEG DAY TSUNAMI',
    look: { skin: '#c98e68', hair: '#2b1d12', top: '#8cff20', topDark: '#4f9a00', pants: '#222222', boots: '#e8e8e8', hat: 'none', tank: true, build: 1.22, prop: 'shaker' },
    specialSpec: { kind: 'projectile', speed: 6.2, dmg: 13, w: 46, h: 34, py: 88, fx: 'shaker' },
    moves: baseMoves({
      lp: { dmg: 5, startup: 5, name: 'Pump Jab' },
      hp: { name: 'Bicep Cross', dmg: 11, startup: 10, hitstun: 22, kb: 10, hitstop: 9 },
      hk: { name: 'Quad Axe', dmg: 11 },
      launcher: { name: 'Deadlift Uppercut', dmg: 10, launch: 13.2 },
      special: { name: 'Protein Shaker Blast', startup: 14, recovery: 26, type: 'strike' },
      super: { name: 'Leg Day Tsunami', dmg: 6, hits: [0, 6, 12, 18, 24], finisher: { dmg: 24, launch: 11, kb: 13 } },
    }),
  },
];

export const byId = id => ROSTER.find(r => r.id === id);
