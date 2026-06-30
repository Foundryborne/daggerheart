import '@client/global.mjs';
import '@common/global.mjs';
import '@common/primitives/global.mjs';
import Canvas from '@client/canvas/board.mjs';
import { ResourceUpdateMap } from './module/data/action/baseAction.mjs';

// Foundry's use of `Object.assign(globalThis) means many globally available objects are not read as such
// This declare global hopefully fixes that
// Note: eslint is not aware of these, whatever is added here should go in the eslint's globals list
declare global {
    /**
     * A simple event framework used throughout Foundry Virtual Tabletop.
     * When key actions or events occur, a "hook" is defined where user-defined callback functions can execute.
     * This class manages the registration and execution of hooked callback functions.
     */
    class Hooks extends foundry.helpers.Hooks {}
    const fromUuid = foundry.utils.fromUuid;
    const fromUuidSync = foundry.utils.fromUuidSync;
    /**
     * A representation of a color in hexadecimal format.
     * This class provides methods for transformations and manipulations of colors.
     */
    class Color extends foundry.utils.Color {}
    /**
     * The singleton game canvas
     */
    const canvas: Canvas;

    const ActiveEffect: foundry.documents.ActiveEffect;
    const Actor: foundry.documents.Actor;
    const BaseScene: foundry.documents.BaseScene;
    const ChatMessage: foundry.documents.ChatMessage;
    const Combat: foundry.documents.Combat;
    const Combatant: foundry.documents.Combatant;
    const Item: foundry.documents.Item;
    const Macro: foundry.documents.Macro;
    const Scene: foundry.documents.Scene;
    const TokenDocument: foundry.documents.TokenDocument;

    const Collection: foundry.utils.Collection;
    const FormDataExtended: foundry.applications.ux.FormDataExtended;
    const TextEditor: foundry.applications.ux.TextEditor;

    /**
     * Data used to build rolls such as duality rolls. The definition is incomplete and likely incorrect.
     * Objects will often accept a Partial<RollConfig> and spit out a non-partial. Those that are not guaranteed should be marked optional.
     */
    interface RollConfig {
        // unverified, check which ones are used and optional/not optional
        event: Event;
        title: string;
        roll: {
            modifier: number;
            simple: boolean;
            type: string;
            difficulty: number;
        };
        hasDamage: boolean;
        hasEffect: boolean;
        hasRoll: boolean;
        chatMessage: {
            template: string;
            mute: boolean;
        };
        targets: object;
        costs: object;

        // verified
        source?: {
            /** uuid of the actor this roll is coming from */
            actor: string;
        };
        /** Roll data associated with the actor or item */
        data: object;
        resourceUpdates: ResourceUpdateMap;
        hooks: string[];
        dialog: {
            configure: boolean;
        };
        damageOptions: object;
    }
}
