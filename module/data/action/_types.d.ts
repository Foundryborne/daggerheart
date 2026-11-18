import DhpChatMessage from '../../documents/chatMessage.mjs';
import { DHDamageData, DHResourceData } from '../fields/action/damageField.mjs';
import * as dice from './_module.mjs';

/**
 * Data used to build a RollConfig object such as duality rolls.
 * @see MoveContext
 */
interface MoveContextParams {
    event: Event;
    actor: DhActor;
    item: DhItem;
    action: DHBaseAction;
    /** Not persisted, but if set, informs followup events of what message to update */
    message: DhpChatMessage;

    title: string;
    headerTitle: string;
    actionType: string;
    selectedMessageMode: unknown;
    tierLimit: number;
    modifications: unknown;
    targets: unknown[];
    countdowns: unknown;
    hasRoll: boolean;
    rollType?: keyof typeof CONFIG.Dice.daggerheart;

    /** The list of selected experiences */
    experiences: string[];
    /** The list of selected costs */
    costs: MoveCost[];

    roll: {
        lite?: boolean;
        type?: string;
        trait?: string;
        difficulty?: number;
    };
    damage: unknown;
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

    /** Processing flags. Not part of the move, but tracks information about its usage */
    flags?: Partial<MoveFlags>;
}

/** Processing flags. Not part of the move, but tracks information about its usage */
export interface MoveFlags {
    /** If set, skips creation of dedicated toChat messages. Used to prevent duplicates. */
    actionChatMessageHandled: boolean;
    /** If set, spentResources has been executed */
    resourcesSpent: boolean;
    /** If set, roll sound will be muted by the system */
    mute: boolean;
}

export interface MoveCost {
    key: string; 
    scale: number; 
    step: number; 
    total: number; 
    enabled: boolean; 
    max: number; 
    maxStep: number;
}


declare module './baseAction.mjs' {
    export default interface DHBaseAction {
        _id: string;
        systemPath: string;
        type?: string;
        baseAction: boolean;
        name?: string;
        description: string;
        img?: string;
        chatDisplay: boolean;
        originItem: object;
        actionType: string;
        targetUuid?: string;
        
        damage: {
            main: DHDamageData;
            /** An iterable record of items (todo: type the iterable record) */
            resources: Record<string, DHResourceData>;
        }
    }
}
