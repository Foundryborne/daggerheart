import * as dice from './_module.mjs';

/**
 * Data used to build a RollConfig object such as duality rolls.
 * @see RollConfig
 */
interface RollConfigParams {
    event: Event;
    actor: DhActor;
    item: DhItem;
    action: DHBaseAction;
    title: string;
    headerTitle: string;
    actionType: string;
    selectedMessageMode: unknown;
    tierLimit: number;
    modifications: unknown;
    costs: unknown[];
    targets: unknown[];
    countdowns: unknown;
    hasRoll: boolean;
    rollType?: keyof typeof CONFIG.Dice.daggerheart;
    roll: {
        lite?: boolean;
        type?: string;
        trait?: string;
        difficulty?: number;
    };
    damageOptions: {
        groupAttack?: boolean;
    };
    skips: {
        resources?: boolean;
        triggers?: boolean;
        createMessage?: boolean;
        updateCountdowns?: boolean;
        reaction?: boolean;
    };        
    source: {
        /** uuid of the actor this roll is coming from */
        actor: string;
        item: string;
        action: string;
        originItem: string;
    };
    evaluated: dice.DHRoll;
}