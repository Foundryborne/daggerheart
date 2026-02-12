import { SYSTEM } from './module/config/system.mjs';
import * as applications from './module/applications/_module.mjs';
import * as data from './module/data/_module.mjs';
import * as models from './module/data/_module.mjs';
import * as documents from './module/documents/_module.mjs';
import * as collections from './module/documents/collections/_module.mjs';
import * as dice from './module/dice/_module.mjs';
import * as fields from './module/data/fields/_module.mjs';
import RegisterHandlebarsHelpers from './module/helpers/handlebarsHelper.mjs';
import { enricherConfig, enricherRenderSetup } from './module/enrichers/_module.mjs';
import { getCommandTarget, rollCommandToJSON } from './module/helpers/utils.mjs';
import { BaseRoll, DHRoll, DualityRoll, D20Roll, DamageRoll, FateRoll } from './module/dice/_module.mjs';
import { enrichedDualityRoll } from './module/enrichers/DualityRollEnricher.mjs';
import { enrichedFateRoll, getFateTypeData } from './module/enrichers/FateRollEnricher.mjs';
import {
    handlebarsRegistration,
    runMigrations,
    settingsRegistration,
    socketRegistration
} from './module/systemRegistration/_module.mjs';
import { placeables, DhTokenLayer } from './module/canvas/_module.mjs';
import './node_modules/@yaireo/tagify/dist/tagify.css';
import TemplateManager from './module/documents/templateManager.mjs';
import TokenManager from './module/documents/tokenManager.mjs';

CONFIG.DH = SYSTEM;
CONFIG.TextEditor.enrichers.push(...enricherConfig);

CONFIG.Dice.rolls = [BaseRoll, DHRoll, DualityRoll, D20Roll, DamageRoll, FateRoll];
CONFIG.Dice.daggerheart = {
    DHRoll: DHRoll,
    DualityRoll: DualityRoll,
    D20Roll: D20Roll,
    DamageRoll: DamageRoll,
    FateRoll: FateRoll
};

CONFIG.Actor.documentClass = documents.DhpActor;
CONFIG.Actor.dataModels = models.actors.config;
CONFIG.Actor.collection = collections.DhActorCollection;

CONFIG.Item.documentClass = documents.DHItem;
CONFIG.Item.dataModels = models.items.config;

CONFIG.ActiveEffect.documentClass = documents.DhActiveEffect;
CONFIG.ActiveEffect.dataModels = models.activeEffects.config;

CONFIG.Combat.documentClass = documents.DhpCombat;
CONFIG.Combat.dataModels = { base: models.DhCombat };
CONFIG.Combatant.documentClass = documents.DHCombatant;
CONFIG.Combatant.dataModels = { base: models.DhCombatant };

CONFIG.ChatMessage.dataModels = models.chatMessages.config;
CONFIG.ChatMessage.documentClass = documents.DhChatMessage;
CONFIG.ChatMessage.template = 'systems/daggerheart/templates/ui/chat/chat-message.hbs';

CONFIG.Canvas.rulerClass = placeables.DhRuler;
CONFIG.Canvas.layers.templates.layerClass = placeables.DhTemplateLayer;
CONFIG.Canvas.layers.tokens.layerClass = DhTokenLayer;

CONFIG.MeasuredTemplate.objectClass = placeables.DhMeasuredTemplate;

CONFIG.RollTable.documentClass = documents.DhRollTable;
CONFIG.RollTable.resultTemplate = 'systems/daggerheart/templates/ui/chat/table-result.hbs';

CONFIG.Scene.documentClass = documents.DhScene;

CONFIG.Token.documentClass = documents.DhToken;
CONFIG.Token.prototypeSheetClass = applications.sheetConfigs.DhPrototypeTokenConfig;
CONFIG.Token.objectClass = placeables.DhTokenPlaceable;
CONFIG.Token.rulerClass = placeables.DhTokenRuler;
CONFIG.Token.hudClass = applications.hud.DHTokenHUD;

CONFIG.ui.combat = applications.ui.DhCombatTracker;
CONFIG.ui.nav = applications.ui.DhSceneNavigation;
CONFIG.ui.chat = applications.ui.DhChatLog;
CONFIG.ui.effectsDisplay = applications.ui.DhEffectsDisplay;
CONFIG.ui.hotbar = applications.ui.DhHotbar;
CONFIG.ui.sidebar = applications.sidebar.DhSidebar;
CONFIG.ui.actors = applications.sidebar.DhActorDirectory;
CONFIG.ui.daggerheartMenu = applications.sidebar.DaggerheartMenu;
CONFIG.ui.resources = applications.ui.DhFearTracker;
CONFIG.ui.countdowns = applications.ui.DhCountdowns;
CONFIG.ux.ContextMenu = applications.ux.DHContextMenu;
CONFIG.ux.TooltipManager = documents.DhTooltipManager;
CONFIG.ux.TemplateManager = new TemplateManager();
CONFIG.ux.TokenManager = new TokenManager();
CONFIG.debug.triggers = false;

Hooks.once('init', () => {
    game.system.api = {
        applications,
        data,
        models,
        documents,
        dice,
        fields
    };

    game.system.registeredTriggers = new game.system.api.data.RegisteredTriggers();

    const { DocumentSheetConfig } = foundry.applications.apps;
    DocumentSheetConfig.unregisterSheet(TokenDocument, 'core', foundry.applications.sheets.TokenConfig);
    DocumentSheetConfig.registerSheet(TokenDocument, SYSTEM.id, applications.sheetConfigs.DhTokenConfig, {
        makeDefault: true
    });

    const sheetLabel = typePath => () =>
        game.i18n.format('DAGGERHEART.GENERAL.typeSheet', {
            type: game.i18n.localize(typePath)
        });

    const { Items, Actors, RollTables } = foundry.documents.collections;
    Items.unregisterSheet('core', foundry.applications.sheets.ItemSheetV2);
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Ancestry, {
        types: ['ancestry'],
        makeDefault: true,
        label: sheetLabel('TYPES.Item.ancestry')
    });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Community, {
        types: ['community'],
        makeDefault: true,
        label: sheetLabel('TYPES.Item.community')
    });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Class, {
        types: ['class'],
        makeDefault: true,
        label: sheetLabel('TYPES.Item.class')
    });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Subclass, {
        types: ['subclass'],
        makeDefault: true,
        label: sheetLabel('TYPES.Item.subclass')
    });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Feature, {
        types: ['feature'],
        makeDefault: true,
        label: sheetLabel('TYPES.Item.feature')
    });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.DomainCard, {
        types: ['domainCard'],
        makeDefault: true,
        label: sheetLabel('TYPES.Item.domainCard')
    });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Loot, {
        types: ['loot'],
        makeDefault: true,
        label: sheetLabel('TYPES.Item.loot')
    });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Consumable, {
        types: ['consumable'],
        makeDefault: true,
        label: sheetLabel('TYPES.Item.consumable')
    });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Weapon, {
        types: ['weapon'],
        makeDefault: true,
        label: sheetLabel('TYPES.Item.weapon')
    });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Armor, {
        types: ['armor'],
        makeDefault: true,
        label: sheetLabel('TYPES.Item.armor')
    });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Beastform, {
        types: ['beastform'],
        makeDefault: true,
        label: sheetLabel('TYPES.Item.beastform')
    });

    Actors.unregisterSheet('core', foundry.applications.sheets.ActorSheetV2);
    Actors.registerSheet(SYSTEM.id, applications.sheets.actors.Character, {
        types: ['character'],
        makeDefault: true,
        label: sheetLabel('TYPES.Actor.character')
    });
    Actors.registerSheet(SYSTEM.id, applications.sheets.actors.Companion, {
        types: ['companion'],
        makeDefault: true,
        label: sheetLabel('TYPES.Actor.companion')
    });
    Actors.registerSheet(SYSTEM.id, applications.sheets.actors.Adversary, {
        types: ['adversary'],
        makeDefault: true,
        label: sheetLabel('TYPES.Actor.adversary')
    });
    Actors.registerSheet(SYSTEM.id, applications.sheets.actors.Environment, {
        types: ['environment'],
        makeDefault: true,
        label: sheetLabel('TYPES.Actor.environment')
    });
    Actors.registerSheet(SYSTEM.id, applications.sheets.actors.Party, {
        types: ['party'],
        makeDefault: true,
        label: sheetLabel('TYPES.Actor.party')
    });

    RollTables.unregisterSheet('core', foundry.applications.sheets.RollTableSheet);
    RollTables.registerSheet(SYSTEM.id, applications.sheets.rollTables.RollTableSheet, {
        types: ['base'],
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
            makeDefault: true,
            label: sheetLabel('DOCUMENT.ActiveEffect')
        }
    );

    game.socket.on(`system.${SYSTEM.id}`, socketRegistration.handleSocketEvent);

    // Make Compendium Dialog resizable
    foundry.applications.sidebar.apps.Compendium.DEFAULT_OPTIONS.window.resizable = true;

    DocumentSheetConfig.unregisterSheet(foundry.documents.Scene, 'core', foundry.applications.sheets.SceneConfig);
    DocumentSheetConfig.registerSheet(foundry.documents.Scene, SYSTEM.id, applications.scene.DhSceneConfigSettings, {
        makeDefault: true,
        label: sheetLabel('DOCUMENT.Scene')
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

    const damageThresholds = ['damageThresholds.major', 'damageThresholds.severe'];
    const traits = Object.keys(game.system.api.data.actors.DhCharacter.schema.fields.traits.fields).map(
        trait => `traits.${trait}.value`
    );
    const resistance = Object.values(game.system.api.data.actors.DhCharacter.schema.fields.resistance.fields).flatMap(
        type => Object.keys(type.fields).map(x => `resistance.${type.name}.${x}`)
    );
    const actorCommon = {
        bar: ['resources.stress'],
        value: [...resistance, 'advantageSources', 'disadvantageSources']
    };
    CONFIG.Actor.trackableAttributes = {
        character: {
            bar: [...actorCommon.bar, 'resources.hitPoints', 'resources.hope'],
            value: [
                ...actorCommon.value,
                ...traits,
                ...damageThresholds,
                'proficiency',
                'evasion',
                'armorScore',
                'scars',
                'levelData.level.current'
            ]
        },
        adversary: {
            bar: [...actorCommon.bar, 'resources.hitPoints'],
            value: [...actorCommon.value, ...damageThresholds, 'criticalThreshold', 'difficulty']
        },
        companion: {
            bar: [...actorCommon.bar],
            value: [...actorCommon.value, 'evasion', 'levelData.level.current']
        }
    };
});

Hooks.on('ready', async () => {
    const appearanceSettings = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance);
    ui.resources = new CONFIG.ui.resources();
    if (appearanceSettings.displayFear !== 'hide') ui.resources.render({ force: true });

    if (appearanceSettings.displayCountdownUI) {
        ui.countdowns = new CONFIG.ui.countdowns();
        ui.countdowns.render({ force: true });
    }

    ui.effectsDisplay = new CONFIG.ui.effectsDisplay();
    ui.effectsDisplay.render({ force: true });

    if (!(ui.compendiumBrowser instanceof applications.ui.ItemBrowser))
        ui.compendiumBrowser = new applications.ui.ItemBrowser();

    socketRegistration.registerSocketHooks();
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

Hooks.on('renderChatMessageHTML', (document, element) => {
    enricherRenderSetup(element);
    const cssClass = document.flags?.daggerheart?.cssClass;
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
        const grantResources = rollCommand.grantResources;

        const target = getCommandTarget({ allowNull: true });
        const title =
            (flavor ?? traitValue)
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
            label: game.i18n.localize('DAGGERHEART.GENERAL.dualityRoll'),
            actionType: null,
            advantage,
            grantResources
        });
        return false;
    }

    if (message.startsWith('/fr')) {
        const result =
            message.trim().toLowerCase() === '/fr' ? { result: {} } : rollCommandToJSON(message.replace(/\/fr\s?/, ''));

        if (!result) {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.fateParsing'));
            return false;
        }

        const { result: rollCommand, flavor } = result;
        const fateTypeData = getFateTypeData(rollCommand?.type);

        if (!fateTypeData)
            return ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.fateTypeParsing'));

        const { value: fateType, label: fateTypeLabel } = fateTypeData;
        const target = getCommandTarget({ allowNull: true });
        const title = flavor ?? game.i18n.localize('DAGGERHEART.GENERAL.fateRoll');

        enrichedFateRoll({
            target,
            title,
            label: fateTypeLabel,
            fateType
        });
        return false;
    }
});

const updateActorsRangeDependentEffects = async token => {
    const rangeMeasurement = game.settings.get(
        CONFIG.DH.id,
        CONFIG.DH.SETTINGS.gameSettings.variantRules
    ).rangeMeasurement;

    for (let effect of token.actor?.allApplicableEffects() ?? []) {
        if (!effect.system.rangeDependence?.enabled) continue;
        const { target, range, type } = effect.system.rangeDependence;

        // If there are no targets, assume false. Otherwise, start with the effect enabled.
        let enabledEffect = game.user.targets.size !== 0;
        // Expect all targets to meet the rangeDependence requirements
        for (let userTarget of game.user.targets) {
            const disposition = userTarget.document.disposition;
            if ((target === 'friendly' && disposition !== 1) || (target === 'hostile' && disposition !== -1)) {
                enabledEffect = false;
                break;
            }

            // Get required distance and special case 5 feet to test adjacency
            const required = rangeMeasurement[range];
            const reverse = type === CONFIG.DH.GENERAL.rangeInclusion.outsideRange.id;
            const inRange =
                required === 5
                    ? userTarget.isAdjacentWith(token.object)
                    : userTarget.distanceTo(token.object) <= required;
            if (reverse ? inRange : !inRange) {
                enabledEffect = false;
                break;
            }
        }

        await effect.update({ disabled: !enabledEffect });
    }
};

const updateAllRangeDependentEffects = async () => {
    const effectsAutomation = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).effects;
    if (!effectsAutomation.rangeDependent) return;

    const tokens = canvas.scene?.tokens;
    if (!tokens) return;

    if (game.user.character) {
        // The character updates their character's token. There can be only one token.
        const characterToken = tokens.find(x => x.actor === game.user.character);
        updateActorsRangeDependentEffects(characterToken);
    } else if (game.user.isActiveGM) {
        // The GM is responsible for all other tokens.
        const playerCharacters = game.users.players.filter(x => x.active).map(x => x.character);
        for (const token of tokens.filter(x => !playerCharacters.includes(x.actor))) {
            updateActorsRangeDependentEffects(token);
        }
    }
};

const debouncedRangeEffectCall = foundry.utils.debounce(updateAllRangeDependentEffects, 50);

Hooks.on('targetToken', () => {
    debouncedRangeEffectCall();
});

Hooks.on('refreshToken', (token, options) => {
    if (options.refreshPosition && !token._original) {
        debouncedRangeEffectCall();
    }
});

Hooks.on('renderCompendiumDirectory', (app, html) => applications.ui.ItemBrowser.injectSidebarButton(html));
Hooks.on('renderDocumentDirectory', (app, html) => applications.ui.ItemBrowser.injectSidebarButton(html));

/* Non actor-linked Actors should unregister the triggers of their tokens if a scene's token layer is torn down */
Hooks.on('canvasTearDown', canvas => {
    game.system.registeredTriggers.unregisterSceneTriggers(canvas.scene);
});

/* Non actor-linked Actors should register the triggers of their tokens on a readied scene */
Hooks.on('canvasReady', canas => {
    game.system.registeredTriggers.registerSceneTriggers(canvas.scene);
});
