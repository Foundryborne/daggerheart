import { SYSTEM } from './module/config/system.mjs';
import * as applications from './module/applications/_module.mjs';
import * as data from './module/data/_module.mjs';
import * as models from './module/data/_module.mjs';
import * as documents from './module/documents/_module.mjs';
import * as dice from './module/dice/_module.mjs';
import * as fields from './module/data/fields/_module.mjs';
import RegisterHandlebarsHelpers from './module/helpers/handlebarsHelper.mjs';
import { enricherConfig, enricherRenderSetup } from './module/enrichers/_module.mjs';
import { getCommandTarget, rollCommandToJSON } from './module/helpers/utils.mjs';
import { BaseRoll, DHRoll, DualityRoll, D20Roll, DamageRoll } from './module/dice/_module.mjs';
import { enrichedDualityRoll } from './module/enrichers/DualityRollEnricher.mjs';
import {
    handlebarsRegistration,
    runMigrations,
    settingsRegistration,
    socketRegistration
} from './module/systemRegistration/_module.mjs';
import { placeables } from './module/canvas/_module.mjs';
import { registerRollDiceHooks } from './module/dice/dhRoll.mjs';
import './node_modules/@yaireo/tagify/dist/tagify.css';
import TemplateManager from './module/documents/templateManager.mjs';

CONFIG.DH = SYSTEM;
CONFIG.TextEditor.enrichers.push(...enricherConfig);

CONFIG.Dice.rolls = [BaseRoll, DHRoll, DualityRoll, D20Roll, DamageRoll];
CONFIG.Dice.daggerheart = {
    DHRoll: DHRoll,
    DualityRoll: DualityRoll,
    D20Roll: D20Roll,
    DamageRoll: DamageRoll
};

CONFIG.Actor.documentClass = documents.DhpActor;
CONFIG.Actor.dataModels = models.actors.config;

CONFIG.Item.documentClass = documents.DHItem;
CONFIG.Item.dataModels = models.items.config;

CONFIG.ActiveEffect.documentClass = documents.DhActiveEffect;
CONFIG.ActiveEffect.dataModels = models.activeEffects.config;

CONFIG.Combat.documentClass = documents.DhpCombat;
CONFIG.Combat.dataModels = { base: models.DhCombat };
CONFIG.Combatant.dataModels = { base: models.DhCombatant };

CONFIG.ChatMessage.dataModels = models.chatMessages.config;
CONFIG.ChatMessage.documentClass = documents.DhChatMessage;
CONFIG.ChatMessage.template = 'systems/daggerheart/templates/ui/chat/chat-message.hbs';

CONFIG.Canvas.rulerClass = placeables.DhRuler;
CONFIG.Canvas.layers.templates.layerClass = placeables.DhTemplateLayer;
CONFIG.MeasuredTemplate.objectClass = placeables.DhMeasuredTemplate;

CONFIG.Token.documentClass = documents.DhToken;
CONFIG.Token.prototypeSheetClass = applications.sheetConfigs.DhPrototypeTokenConfig;
CONFIG.Token.objectClass = placeables.DhTokenPlaceable;
CONFIG.Token.rulerClass = placeables.DhTokenRuler;
CONFIG.Token.hudClass = applications.hud.DHTokenHUD;

CONFIG.ui.combat = applications.ui.DhCombatTracker;
CONFIG.ui.chat = applications.ui.DhChatLog;
CONFIG.ui.hotbar = applications.ui.DhHotbar;
CONFIG.ui.sidebar = applications.sidebar.DhSidebar;
CONFIG.ui.daggerheartMenu = applications.sidebar.DaggerheartMenu;
CONFIG.ui.resources = applications.ui.DhFearTracker;
CONFIG.ui.countdowns = applications.ui.DhCountdowns;
CONFIG.ux.ContextMenu = applications.ux.DHContextMenu;
CONFIG.ux.TooltipManager = documents.DhTooltipManager;
CONFIG.ux.TemplateManager = new TemplateManager();

Hooks.once('init', () => {
    game.system.api = {
        applications,
        data,
        models,
        documents,
        dice,
        fields
    };

    const { DocumentSheetConfig } = foundry.applications.apps;
    DocumentSheetConfig.unregisterSheet(TokenDocument, 'core', foundry.applications.sheets.TokenConfig);
    DocumentSheetConfig.registerSheet(TokenDocument, SYSTEM.id, applications.sheetConfigs.DhTokenConfig, {
        makeDefault: true
    });

    const { Items, Actors } = foundry.documents.collections;
    Items.unregisterSheet('core', foundry.applications.sheets.ItemSheetV2);
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Ancestry, { types: ['ancestry'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Community, { types: ['community'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Class, { types: ['class'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Subclass, { types: ['subclass'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Feature, { types: ['feature'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.DomainCard, { types: ['domainCard'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Loot, {
        types: ['loot'],
        makeDefault: true
    });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Consumable, { types: ['consumable'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Weapon, { types: ['weapon'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Armor, { types: ['armor'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Beastform, { types: ['beastform'], makeDefault: true });

    Actors.unregisterSheet('core', foundry.applications.sheets.ActorSheetV2);
    Actors.registerSheet(SYSTEM.id, applications.sheets.actors.Character, { types: ['character'], makeDefault: true });
    Actors.registerSheet(SYSTEM.id, applications.sheets.actors.Companion, { types: ['companion'], makeDefault: true });
    Actors.registerSheet(SYSTEM.id, applications.sheets.actors.Adversary, { types: ['adversary'], makeDefault: true });
    Actors.registerSheet(SYSTEM.id, applications.sheets.actors.Environment, {
        types: ['environment'],
        makeDefault: true
    });
    Actors.registerSheet(SYSTEM.id, applications.sheets.actors.Party, {
        types: ['party'],
        makeDefault: true
    });

    DocumentSheetConfig.unregisterSheet(
        CONFIG.ActiveEffect.documentClass,
        'core',
        foundry.applications.sheets.ActiveEffectConfig
    );
    DocumentSheetConfig.registerSheet(
        CONFIG.ActiveEffect.documentClass,
        SYSTEM.id,
        applications.sheetConfigs.ActiveEffectConfig,
        {
            makeDefault: true
        }
    );

    game.socket.on(`system.${SYSTEM.id}`, socketRegistration.handleSocketEvent);

    // Make Compendium Dialog resizable
    foundry.applications.sidebar.apps.Compendium.DEFAULT_OPTIONS.window.resizable = true;

    DocumentSheetConfig.registerSheet(foundry.documents.Scene, SYSTEM.id, applications.scene.DhSceneConfigSettings, {
        makeDefault: true,
        label: 'Daggerheart'
    });

    settingsRegistration.registerDHSettings();
    RegisterHandlebarsHelpers.registerHelpers();

    return handlebarsRegistration();
});

Hooks.on('setup', () => {
    CONFIG.statusEffects = [
        ...CONFIG.statusEffects.filter(x => !['dead', 'unconscious'].includes(x.id)),
        ...Object.values(SYSTEM.GENERAL.conditions()).map(x => ({
            ...x,
            name: game.i18n.localize(x.name),
            systemEffect: true
        }))
    ];
});

Hooks.on('ready', async () => {
    const appearanceSettings = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance);
    ui.resources = new CONFIG.ui.resources();
    if (appearanceSettings.displayFear !== 'hide') ui.resources.render({ force: true });

    if (appearanceSettings.displayCountdownUI) {
        ui.countdowns = new CONFIG.ui.countdowns();
        ui.countdowns.render({ force: true });
    }

    if (!(ui.compendiumBrowser instanceof applications.ui.ItemBrowser))
        ui.compendiumBrowser = new applications.ui.ItemBrowser();

    socketRegistration.registerSocketHooks();
    registerRollDiceHooks();
    socketRegistration.registerUserQueries();

    if (!game.user.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.welcomeMessage)) {
        const welcomeMessage = await foundry.utils.fromUuid(CONFIG.DH.GENERAL.compendiumJournals.welcome);
        if (welcomeMessage) {
            welcomeMessage.sheet.render({ force: true });
            game.user.setFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.userFlags.welcomeMessage, true);
        }
    }

    runMigrations();
});

Hooks.once('dicesoniceready', () => {});

Hooks.on('renderChatMessageHTML', (_, element, message) => {
    enricherRenderSetup(element);
    const cssClass = message.message.flags?.daggerheart?.cssClass;
    if (cssClass) cssClass.split(' ').forEach(cls => element.classList.add(cls));
});

Hooks.on('renderJournalEntryPageProseMirrorSheet', (_, element) => {
    enricherRenderSetup(element);
});

Hooks.on('renderHandlebarsApplication', (_, element) => {
    enricherRenderSetup(element);
});

Hooks.on('chatMessage', (_, message) => {
    if (message.startsWith('/dr')) {
        const result =
            message.trim().toLowerCase() === '/dr' ? { result: {} } : rollCommandToJSON(message.replace(/\/dr\s?/, ''));
        if (!result) {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.dualityParsing'));
            return false;
        }

        const { result: rollCommand, flavor } = result;

        const reaction = rollCommand.reaction;
        const traitValue = rollCommand.trait?.toLowerCase();
        const advantage = rollCommand.advantage
            ? CONFIG.DH.ACTIONS.advantageState.advantage.value
            : rollCommand.disadvantage
              ? CONFIG.DH.ACTIONS.advantageState.disadvantage.value
              : undefined;
        const difficulty = rollCommand.difficulty;

        const target = getCommandTarget({ allowNull: true });
        const title = traitValue
            ? game.i18n.format('DAGGERHEART.UI.Chat.dualityRoll.abilityCheckTitle', {
                  ability: game.i18n.localize(SYSTEM.ACTOR.abilities[traitValue].label)
              })
            : game.i18n.localize('DAGGERHEART.GENERAL.duality');

        enrichedDualityRoll({
            reaction,
            traitValue,
            target,
            difficulty,
            title,
            label: 'test',
            actionType: null,
            advantage
        });
        return false;
    }
});

Hooks.on('moveToken', async (movedToken, data) => {
    const effectsAutomation = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).effects;
    if (!effectsAutomation.rangeDependent) return;

    const rangeDependantEffects = movedToken.actor.effects.filter(effect => effect.system.rangeDependence?.enabled);

    const updateEffects = async (disposition, token, effects, effectUpdates) => {
        const rangeMeasurement = game.settings.get(
            CONFIG.DH.id,
            CONFIG.DH.SETTINGS.gameSettings.variantRules
        ).rangeMeasurement;

        for (let effect of effects.filter(x => x.system.rangeDependence?.enabled)) {
            const { target, range, type } = effect.system.rangeDependence;
            if ((target === 'friendly' && disposition !== 1) || (target === 'hostile' && disposition !== -1))
                return false;

            const distanceBetween = canvas.grid.measurePath([
                { ...movedToken.toObject(), x: data.destination.x, y: data.destination.y },
                token
            ]).distance;
            const distance = rangeMeasurement[range];

            const reverse = type === CONFIG.DH.GENERAL.rangeInclusion.outsideRange.id;
            const newDisabled = reverse ? distanceBetween <= distance : distanceBetween > distance;
            const oldDisabled = effectUpdates[effect.uuid] ? effectUpdates[effect.uuid].disabled : newDisabled;
            effectUpdates[effect.uuid] = {
                disabled: oldDisabled || newDisabled,
                value: effect
            };
        }
    };

    const effectUpdates = {};
    for (let token of game.scenes.find(x => x.active).tokens) {
        if (token.id !== movedToken.id) {
            await updateEffects(token.disposition, token, rangeDependantEffects, effectUpdates);
        }

        if (token.actor) await updateEffects(movedToken.disposition, token, token.actor.effects, effectUpdates);
    }

    for (let key in effectUpdates) {
        const effect = effectUpdates[key];
        await effect.value.update({ disabled: effect.disabled });
    }
});

Hooks.on('renderCompendiumDirectory', (app, html) => applications.ui.ItemBrowser.injectSidebarButton(html));
Hooks.on('renderDocumentDirectory', (app, html) => applications.ui.ItemBrowser.injectSidebarButton(html));
