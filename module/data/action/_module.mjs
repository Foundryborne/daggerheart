import AttackAction from './attackAction.mjs';
import BaseAction from './baseAction.mjs';
import BeastformAction from './beastformAction.mjs';
import CountdownAction from './countdownAction.mjs';
import DamageAction from './damageAction.mjs';
import EffectAction from './effectAction.mjs';
import HealingAction from './healingAction.mjs';
import MacroAction from './macroAction.mjs';
import SummonAction from './summonAction.mjs';

export const actionsTypes = {
    base: BaseAction,
    attack: AttackAction,
    countdown: CountdownAction,
    damage: DamageAction,
    healing: HealingAction,
    summon: SummonAction,
    effect: EffectAction,
    macro: MacroAction,
    beastform: BeastformAction
};
