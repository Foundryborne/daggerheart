import { ResourceUpdateMap } from './module/data/action/baseAction.mjs';

import * as applications from './module/applications/_module.mjs';
import * as data from './module/data/_module.mjs';
import * as models from './module/data/_module.mjs';
import * as documents from './module/documents/_module.mjs';
import { macros } from './module/_module.mjs';
import * as dice from './module/dice/_module.mjs';
import * as fields from './module/data/fields/_module.mjs';
import { gameSettings } from './module/config/settingsConfig.mjs';
import DhAutomation from './module/data/settings/Automation.mjs';
import FearTracker from './module/applications/ui/fearTracker.mjs';
import DhCountdowns from './module/data/countdowns.mjs';
import DhEffectsDisplay from './module/applications/ui/effectsDisplay.mjs';
import DhHomebrew from './module/data/settings/Homebrew.mjs';
import DhAppearance from './module/data/settings/Appearance.mjs';
import DhVariantRules from './module/data/settings/VariantRules.mjs';
import BaseDataItem from './module/data/item/base.mjs';
import BaseDataActor from './module/data/actor/base.mjs';

// Used to refine the foundry global types (with overrides)
import * as PixiGraphicsSmooth from '@pixi/graphics-smooth';
import * as PixiParticles from '@pixi/particle-emitter';
import * as handlebars from 'handlebars';
import PixiJS from 'pixi.js';
import * as SocketIO from 'socket.io-client';
import Canvas from '@client/canvas/board.mjs';
import * as globalFoundry from '@client/client.mjs';
import * as globalConfig from '@client/config.mjs';
import Game from '@client/game.mjs';
import Localization from '@client/helpers/localization.mjs';
import * as globalUI from '@client/ui.mjs';

// Foundry's use of `Object.assign(globalThis) means many globally available objects are not read as such
// This declare global hopefully fixes that
// Note: eslint is not aware of these, whatever is added here should go in the eslint's globals list
declare global {
    // These are convenience types for common imported things. This allows them to be used in JSDoc directly
    // For actual use such as instanceof, an import is still required
    type DhItem<T extends BaseDataItem = BaseDataItem> = InstanceType<typeof documents.DhItem<T>>;
    type DhActor<T extends BaseDataActor = BaseDataActor> = InstanceType<typeof documents.DhActor<T>>;
    type DhActiveEffect = InstanceType<typeof documents.DhActiveEffect>;
    
    /**
     * A simple event framework used throughout Foundry Virtual Tabletop.
     * When key actions or events occur, a "hook" is defined where user-defined callback functions can execute.
     * This class manages the registration and execution of hooked callback functions.
     */
    class Hooks extends foundry.helpers.Hooks {}
    const fromUuid: typeof foundry.utils.fromUuid;
    const fromUuidSync: typeof foundry.utils.fromUuidSync;
    /**
     * A representation of a color in hexadecimal format.
     * This class provides methods for transformations and manipulations of colors.
     */
    class Color extends foundry.utils.Color {}

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
    const RollTable: foundry.documents.RollTable;

    const Collection: typeof foundry.utils.Collection;
    const FormDataExtended: foundry.applications.ux.FormDataExtended;
    /** @deprecated */
    const TextEditor: foundry.applications.ux.TextEditor;
    const Roll: dice.BaseRoll;

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

// A copy of foundry/client/global.d.mts with dheart specific overrides
declare module 'pixi.js' {
    export import LegacyGraphics = PixiJS.Graphics;
    export import smooth = PixiGraphicsSmooth;
    export import particles = PixiParticles;
}

declare global {
    namespace globalThis {
        export import CONFIG = globalConfig;
        export import Handlebars = handlebars;
        export import PIXI = PixiJS;
        export import ProseMirror = globalFoundry.prosemirror;
        export import foundry = globalFoundry;
        export import getDocumentClass = globalFoundry.utils.getDocumentClass;
        export import io = SocketIO;
        export import ui = globalUI;

        const canvas: Omit<Canvas, 'scene'> & {
            get scene(): documents.DhScene | null;
        };
        const game: Game;
        const _loc: Localization['localize'];
    }
}

declare module '@client/packages/system.mjs' {
    export default interface System {
        api: {
            applications: typeof applications,
            data: typeof data,
            models: typeof models,
            documents: typeof documents,
            macros: typeof macros,
            dice: typeof dice,
            fields: typeof fields
        };
        /** 
         * Various cached versions of settings that are reassigned in the handleChange handlers.
         * Using these avoids the data model re-validated and re-initializing 
         */
        settings: {
            appearance: DhAppearance;
            automation: DhAutomation;
            homebrew: DhHomebrew;
            variantRules: DhVariantRules;
        }
    }
}

declare module '@client/helpers/client-settings.mjs' {
    // Add explicit typed overrides for auto complete. These require /** @type {"string"} on the vars themselves to work */
    export default interface ClientSettings {
        get(namespace: 'daggerheart', key: typeof gameSettings.appearance): DhAutomation;
        get(namespace: 'daggerheart', key: typeof gameSettings.Automation): DhAutomation;
        get(namespace: 'daggerheart', key: typeof gameSettings.Homebrew): DhHomebrew;
        get(namespace: 'daggerheart', key: typeof gameSettings.Countdowns): DhCountdowns;
        get(namespace: 'daggerheart', key: typeof gameSettings.variantRules): DhVariantRules;
        get(namespace: 'daggerheart', key: string): unknown;
    }
}

// Add to global ui object
declare module '@client/ui.mjs' {
    const countdowns: DhCountdowns;
    const resources: FearTracker;
    const effectsDisplay: DhEffectsDisplay;
}
