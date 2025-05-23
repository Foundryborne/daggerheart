import { SYSTEM } from './module/config/system.mjs';
import * as applications from './module/applications/_module.mjs';
import * as models from './module/data/_module.mjs';
import * as documents from './module/documents/_module.mjs';
import RegisterHandlebarsHelpers from './module/helpers/handlebarsHelper.mjs';
import DhpCombatTracker from './module/ui/combatTracker.mjs';
import { GMUpdateEvent, handleSocketEvent, socketEvent } from './module/helpers/socket.mjs';
import { registerDHPSettings } from './module/applications/settings.mjs';
import DhpChatLog from './module/ui/chatLog.mjs';
import DhpPlayers from './module/ui/players.mjs';
import DhpRuler from './module/ui/ruler.mjs';

globalThis.SYSTEM = SYSTEM;

Hooks.once('init', () => {
    CONFIG.daggerheart = SYSTEM;
    game.system.api = {
        applications,
        models,
        documents
    };

    CONFIG.statusEffects = Object.values(SYSTEM.GENERAL.conditions).map(x => ({
        ...x,
        name: game.i18n.localize(x.name)
    }));

    CONFIG.Item.documentClass = documents.DhpItem;
    CONFIG.Item.dataModels = {
        ancestry: models.DhpAncestry,
        community: models.DhpCommunity,
        class: models.DhpClass,
        subclass: models.DhpSubclass,
        feature: models.DhpFeature,
        domainCard: models.DhpDomainCard,
        miscellaneous: models.DhpMiscellaneous,
        consumable: models.DhpConsumable,
        weapon: models.DhpWeapon,
        armor: models.DhpArmor
    };

    const { Items, Actors } = foundry.documents.collections;
    Items.unregisterSheet('core', foundry.appv1.sheets.ItemSheet);
    Items.registerSheet(SYSTEM.id, applications.DhpAncestry, { types: ['ancestry'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.DhpCommunity, { types: ['community'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.DhpClassSheet, { types: ['class'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.DhpSubclass, { types: ['subclass'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.DhpFeatureSheet, { types: ['feature'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.DhpDomainCardSheet, { types: ['domainCard'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.DhpMiscellaneous, { types: ['miscellaneous'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.DhpConsumable, { types: ['consumable'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.DhpWeapon, { types: ['weapon'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.DhpArmor, { types: ['armor'], makeDefault: true });

    CONFIG.Actor.documentClass = documents.DhpActor;
    CONFIG.Actor.dataModels = {
        pc: models.DhpPC,
        adversary: models.DhpAdversary,
        environment: models.DhpEnvironment
    };
    Actors.unregisterSheet('core', foundry.appv1.sheets.ActorSheet);
    Actors.registerSheet(SYSTEM.id, applications.DhpPCSheet, { types: ['pc'], makeDefault: true });
    Actors.registerSheet(SYSTEM.id, applications.DhpAdversarySheet, { types: ['adversary'], makeDefault: true });
    Actors.registerSheet(SYSTEM.id, applications.DhpEnvironment, { types: ['environment'], makeDefault: true });

    CONFIG.Combat.dataModels = {
        base: models.DhpCombat
    };

    CONFIG.Combatant.dataModels = {
        base: models.DhpCombatant
    };

    CONFIG.ChatMessage.dataModels = {
        dualityRoll: models.DhpDualityRoll,
        adversaryRoll: models.DhpAdversaryRoll,
        abilityUse: models.DhpAbilityUse
    };
    CONFIG.ChatMessage.documentClass = applications.DhpChatMessage;

    CONFIG.Canvas.rulerClass = DhpRuler;
    CONFIG.Combat.documentClass = documents.DhpCombat;
    CONFIG.ui.combat = DhpCombatTracker;
    CONFIG.ui.chat = DhpChatLog;
    CONFIG.ui.players = DhpPlayers;

    game.socket.on(`system.${SYSTEM.id}`, handleSocketEvent);

    registerDHPSettings();

    RegisterHandlebarsHelpers.registerHelpers();

    return preloadHandlebarsTemplates();
});

Hooks.once('dicesoniceready', () => {});

Hooks.on(socketEvent.GMUpdate, async (action, uuid, update) => {
    if (game.user.isGM) {
        const document = uuid ? await fromUuid(uuid) : null;
        switch (action) {
            case GMUpdateEvent.UpdateDocument:
                if (document && update) {
                    await document.update(update);
                }
                break;
            case GMUpdateEvent.UpdateFear:
                if (game.user.isGM) {
                    await game.settings.set(
                        SYSTEM.id,
                        SYSTEM.SETTINGS.gameSettings.Resources.Fear,
                        Math.max(Math.min(update, 6), 0)
                    );
                    Hooks.callAll(socketEvent.DhpFearUpdate);
                    await game.socket.emit(`system.${SYSTEM.id}`, { action: socketEvent.DhpFearUpdate });
                }
                break;
        }
    }
});

const preloadHandlebarsTemplates = async function () {
    return foundry.applications.handlebars.loadTemplates([
        'systems/daggerheart/templates/sheets/parts/attributes.hbs',
        'systems/daggerheart/templates/sheets/parts/defense.hbs',
        'systems/daggerheart/templates/sheets/parts/armor.hbs',
        'systems/daggerheart/templates/sheets/parts/experience.hbs',
        'systems/daggerheart/templates/sheets/parts/features.hbs',
        'systems/daggerheart/templates/sheets/parts/gold.hbs',
        'systems/daggerheart/templates/sheets/parts/health.hbs',
        'systems/daggerheart/templates/sheets/parts/hope.hbs',
        'systems/daggerheart/templates/sheets/parts/inventory.hbs',
        'systems/daggerheart/templates/sheets/parts/weapons.hbs',
        'systems/daggerheart/templates/sheets/parts/domainCard.hbs',
        'systems/daggerheart/templates/sheets/parts/heritage.hbs',
        'systems/daggerheart/templates/sheets/parts/subclassFeature.hbs',
        'systems/daggerheart/templates/sheets/parts/effects.hbs',
        'systems/daggerheart/templates/sheets/pc/sections/inventory.hbs',
        'systems/daggerheart/templates/sheets/pc/sections/loadout.hbs',
        'systems/daggerheart/templates/sheets/pc/parts/heritageCard.hbs',
        'systems/daggerheart/templates/sheets/pc/parts/advancementCard.hbs',
        'systems/daggerheart/templates/views/parts/level.hbs',
        'systems/daggerheart/templates/components/slider.hbs'
    ]);
};
