import * as dice from './_module.mjs';

/**
 * Data used to build rolls such as duality rolls. The definition is incomplete and likely incorrect.
 * Objects will often accept a Partial<RollConfig> and spit out a non-partial. Those that are not guaranteed should be marked optional.
 */
interface RollConfigParams {
    // unverified, check which ones are used and optional/not optional
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