// Stereotype Fighters V6.6 gameplay tuning. Collision is independent of artwork dimensions.
const move=(startup,active,recovery,damage,forward,up,w,h,knockback,hitStun,blockStun,extra={})=>({startup,active,recovery,damage,knockback,hitStun,blockStun,hitbox:{forward,up,w,h},...extra});
export const ARCHETYPES={
 balanced:{walk:3.35,jump:12.6,airControl:.72,defense:1,punch:move(6,5,11,8,34,86,72,46,6,16,8),kick:move(10,7,13,12,48,78,92,54,9,20,10),special:move(13,8,19,17,55,88,120,60,12,28,13,{cost:35,kind:'burst'})},
 rushdown:{walk:3.72,jump:12.9,airControl:.8,defense:.96,punch:move(4,5,9,7,37,87,75,44,5,13,7),kick:move(8,7,11,10,52,74,96,54,8,17,9),special:move(8,10,15,15,48,86,108,56,11,23,11,{cost:30,kind:'dash',dash:4.8})},
 heavy:{walk:2.85,jump:11.7,airControl:.58,defense:1.1,punch:move(8,6,14,11,38,88,78,50,9,20,10),kick:move(13,7,17,16,53,75,102,62,13,26,12),special:move(17,9,22,22,60,82,144,72,16,36,16,{cost:40,kind:'burst'})},
 zoner:{walk:3.15,jump:12.4,airControl:.67,defense:.97,punch:move(6,5,11,7,34,88,68,44,5,14,8),kick:move(10,6,14,10,46,78,86,52,8,18,9),special:move(12,1,20,15,30,98,30,28,10,24,11,{cost:32,kind:'projectile',projectile:{speed:6.3,life:95,w:34,h:24,y:102}})},
 mobile:{walk:3.65,jump:13.6,airControl:.9,defense:.93,punch:move(5,5,10,7,36,86,70,44,5,13,7),kick:move(8,6,12,11,55,72,100,55,9,18,9),special:move(9,8,16,14,52,82,112,58,10,22,10,{cost:30,kind:'dash',dash:5.6})},
 defensive:{walk:3.05,jump:12.1,airControl:.62,defense:1.13,punch:move(6,5,12,8,34,87,70,46,6,16,8),kick:move(10,6,15,11,47,77,88,55,8,19,10),special:move(11,6,19,16,47,88,112,62,12,30,15,{cost:35,kind:'burst',armor:5})}
};
export const FIGHTER_BALANCE={
 lefty:{archetype:'defensive',specialKind:'projectile',specialName:'Megaphone Blast',special:{cost:38,damage:17,projectile:{speed:5.2,life:105,w:42,h:30,y:105}}},
 agenda:{archetype:'mobile',specialKind:'burst',specialName:'Pronoun Shift',walk:3.78,special:{cost:30,damage:15,active:10,hitbox:{forward:50,up:90,w:132,h:64}}},
 'bimbo-babe':{archetype:'rushdown',specialKind:'projectile',specialName:'Camera Flash',special:{cost:30,damage:14,projectile:{speed:5.8,life:95,w:32,h:28,y:103}}},
 'douchebag-dave':{archetype:'balanced',specialKind:'projectile',specialName:'Bro Blast',special:{cost:35,damage:16,projectile:{speed:5.5,life:100,w:38,h:26,y:104}}},
 junkie:{archetype:'rushdown',specialKind:'dash',specialName:'Chaos Rush',walk:3.9,special:{cost:28,dash:6.1,damage:14,recovery:13}},
 rapthug:{archetype:'heavy',specialKind:'burst',specialName:'Bass Drop',special:{cost:40,damage:21,hitbox:{forward:54,up:78,w:150,h:82}}},
 killwoodrat:{archetype:'rushdown',specialKind:'dash',specialName:'Dumpster Dive',special:{cost:30,dash:5.7,damage:16}},
 'sk8r-boi':{archetype:'mobile',specialKind:'dash',specialName:'Kickflip Crush',jump:14.1,special:{cost:30,dash:6,damage:16,knockback:13}},
 'club-doll':{archetype:'mobile',specialKind:'burst',specialName:'Laser Lash',special:{cost:32,active:11,damage:15,hitbox:{forward:45,up:85,w:138,h:72}}},
 grunge:{archetype:'heavy',specialKind:'burst',specialName:'Feedback Loop',special:{cost:38,damage:20,hitbox:{forward:58,up:86,w:146,h:75}}},
 yuppie:{archetype:'balanced',specialKind:'projectile',specialName:'Hostile Takeover',special:{cost:34,damage:16,projectile:{speed:6.1,life:90,w:34,h:24,y:103}}},
 'fat-gamer':{archetype:'defensive',specialKind:'burst',specialName:'Lag Spike',walk:2.95,special:{cost:38,damage:19,armor:7,hitbox:{forward:46,up:86,w:128,h:70}}},
 influencer:{archetype:'mobile',specialKind:'projectile',specialName:'Ring Light Burst',special:{cost:30,damage:14,projectile:{speed:6.5,life:85,w:30,h:30,y:100}}},
 'yoga-mom':{archetype:'defensive',specialKind:'burst',specialName:'Zen Spiral',special:{cost:34,damage:16,blockStun:17,hitbox:{forward:50,up:90,w:126,h:66}}},
 'e-girl':{archetype:'zoner',specialKind:'projectile',specialName:'Emoji Storm',special:{cost:28,damage:13,projectile:{speed:4.8,life:120,w:36,h:28,y:101}}},
 cheerleader:{archetype:'rushdown',specialKind:'dash',specialName:'Pep Rally',special:{cost:30,dash:5.9,active:11,damage:15}},
 'punk-princess':{archetype:'rushdown',specialKind:'burst',specialName:'Safety Pin Shot',special:{cost:32,damage:17,active:10}},
 'neckbeard-nate':{archetype:'zoner',specialKind:'projectile',specialName:'Forum Flame',walk:3,special:{cost:35,damage:17,projectile:{speed:5.1,life:112,w:40,h:28,y:100}}},
 'gym-bro':{archetype:'heavy',specialKind:'projectile',specialName:'Protein Shaker Blast',special:{cost:40,damage:20,projectile:{speed:5.4,life:100,w:42,h:30,y:105}}},
 'bogan-tradie':{archetype:'balanced',specialKind:'projectile',specialName:'Nail Gun Burst',special:{cost:32,damage:15,projectile:{speed:7.2,life:82,w:38,h:20,y:98}}}
};
const clone=o=>structuredClone(o);const mergeMove=(base,override={})=>({...base,...override,hitbox:{...base.hitbox,...override.hitbox},projectile:override.projectile?{...(base.projectile||{}),...override.projectile}:base.projectile});
export function getFighterBalance(def){const own=FIGHTER_BALANCE[def.id]||{archetype:'balanced'},base=clone(ARCHETYPES[own.archetype]||ARCHETYPES.balanced),special={...(own.special||{})};if(own.specialKind)special.kind=own.specialKind;return{archetype:own.archetype,walk:own.walk??base.walk,jump:own.jump??base.jump,airControl:own.airControl??base.airControl,defense:(def.defense||1)*(own.defense??base.defense),punch:mergeMove(base.punch,own.punch),kick:mergeMove(base.kick,own.kick),special:mergeMove(base.special,special),specialName:own.specialName||def.special}}
export const CPU_LEVELS={easy:{reaction:[25,34],aggression:.42,defense:.28,spacing:.55,special:.12,antiAir:.15,punish:.2,retreat:.15,mistake:.22},normal:{reaction:[13,20],aggression:.62,defense:.48,spacing:.72,special:.26,antiAir:.38,punish:.48,retreat:.25,mistake:.1},hard:{reaction:[7,12],aggression:.76,defense:.67,spacing:.86,special:.4,antiAir:.62,punish:.7,retreat:.36,mistake:.035}};
export const HURTBOXES={standing:{x:-26,y:-112,w:52,h:112},crouching:{x:-29,y:-74,w:58,h:74},airborne:{x:-25,y:-104,w:50,h:100}};
