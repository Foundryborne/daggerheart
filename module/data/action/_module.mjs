import AttackAction from './attackAction.mjs';
import BaseAction from './baseAction.mjs';
import BeastformAction from './beastformAction.mjs';
import DamageAction from './damageAction.mjs';
import EffectAction from './effectAction.mjs';
import HealingAction from './healingAction.mjs';
import MacroAction from './macroAction.mjs';
import SummonAction from './summonAction.mjs';

export const actionsTypes = {
    base: BaseAction,
    attack: AttackAction,
    damage: DamageAction,
    healing: HealingAction,
    summon: SummonAction,
    effect: EffectAction,
    macro: MacroAction,
    beastform: BeastformAction
};
