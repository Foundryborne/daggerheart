import { SYSTEM } from './module/config/system.mjs';
import * as applications from './module/applications/_module.mjs';
import * as models from './module/data/_module.mjs';
import * as documents from './module/documents/_module.mjs';
import RegisterHandlebarsHelpers from './module/helpers/handlebarsHelper.mjs';
import { DhDualityRollEnricher, DhTemplateEnricher } from './module/enrichers/_module.mjs';
import { getCommandTarget, rollCommandToJSON } from './module/helpers/utils.mjs';
import { NarrativeCountdowns } from './module/applications/ui/countdowns.mjs';
import { DualityRollColor } from './module/data/settings/Appearance.mjs';
import { DHRoll, DualityRoll, D20Roll, DamageRoll, DualityDie } from './module/dice/_module.mjs';
import { renderDualityButton } from './module/enrichers/DualityRollEnricher.mjs';
import { renderMeasuredTemplate } from './module/enrichers/TemplateEnricher.mjs';
import { registerCountdownHooks } from './module/data/countdowns.mjs';
import {
    handlebarsRegistration,
    settingsRegistration,
    socketRegistration
} from './module/systemRegistration/_module.mjs';
import { placeables } from './module/canvas/_module.mjs';
import { registerRollDiceHooks } from './module/dice/dhRoll.mjs';
import { registerDHActorHooks } from './module/documents/actor.mjs';
import './node_modules/@yaireo/tagify/dist/tagify.css';

Hooks.once('init', () => {
    CONFIG.DH = SYSTEM;
    game.system.api = {
        applications,
        models,
        documents
    };

    CONFIG.TextEditor.enrichers.push(
        ...[
            {
                pattern: /\[\[\/dr\s?(.*?)\]\]/g,
                enricher: DhDualityRollEnricher
            },
            {
                pattern: /^@Template\[(.*)\]$/g,
                enricher: DhTemplateEnricher
            }
        ]
    );

    CONFIG.statusEffects = [
        ...CONFIG.statusEffects.filter(x => !['dead', 'unconscious'].includes(x.id)),
        ...Object.values(SYSTEM.GENERAL.conditions).map(x => ({
            ...x,
            name: game.i18n.localize(x.name),
            systemEffect: true
        }))
    ];

    CONFIG.Dice.daggerheart = {
        DualityDie: DualityDie,
        DHRoll: DHRoll,
        DualityRoll: DualityRoll,
        D20Roll: D20Roll,
        DamageRoll: DamageRoll
    };

    CONFIG.Dice.rolls = [...CONFIG.Dice.rolls, ...[DHRoll, DualityRoll, D20Roll, DamageRoll]];
    CONFIG.MeasuredTemplate.objectClass = placeables.DhMeasuredTemplate;

    const { DocumentSheetConfig } = foundry.applications.apps;
    CONFIG.Token.documentClass = documents.DhToken;
    CONFIG.Token.prototypeSheetClass = applications.sheetConfigs.DhPrototypeTokenConfig;
    DocumentSheetConfig.unregisterSheet(TokenDocument, 'core', foundry.applications.sheets.TokenConfig);
    DocumentSheetConfig.registerSheet(TokenDocument, SYSTEM.id, applications.sheetConfigs.DhTokenConfig, {
        makeDefault: true
    });

    CONFIG.Item.documentClass = documents.DHItem;

    //Registering the Item DataModel
    CONFIG.Item.dataModels = models.items.config;

    const { Items, Actors } = foundry.documents.collections;
    Items.unregisterSheet('core', foundry.applications.sheets.ItemSheetV2);
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Ancestry, { types: ['ancestry'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Community, { types: ['community'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Class, { types: ['class'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Subclass, { types: ['subclass'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Feature, { types: ['feature'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.DomainCard, { types: ['domainCard'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Miscellaneous, {
        types: ['miscellaneous'],
        makeDefault: true
    });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Consumable, { types: ['consumable'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Weapon, { types: ['weapon'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Armor, { types: ['armor'], makeDefault: true });
    Items.registerSheet(SYSTEM.id, applications.sheets.items.Beastform, { types: ['beastform'], makeDefault: true });

    CONFIG.Actor.documentClass = documents.DhpActor;
    CONFIG.Actor.dataModels = models.actors.config;

    Actors.unregisterSheet('core', foundry.applications.sheets.ActorSheetV2);
    Actors.registerSheet(SYSTEM.id, applications.sheets.actors.Character, { types: ['character'], makeDefault: true });
    Actors.registerSheet(SYSTEM.id, applications.sheets.actors.Companion, { types: ['companion'], makeDefault: true });
    Actors.registerSheet(SYSTEM.id, applications.sheets.actors.Adversary, { types: ['adversary'], makeDefault: true });
    Actors.registerSheet(SYSTEM.id, applications.sheets.actors.Environment, {
        types: ['environment'],
        makeDefault: true
    });

    CONFIG.ActiveEffect.documentClass = documents.DhActiveEffect;
    CONFIG.ActiveEffect.dataModels = models.activeEffects.config;

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

    CONFIG.Token.hudClass = applications.hud.DHTokenHUD;

    CONFIG.Combat.dataModels = {
        base: models.DhCombat
    };

    CONFIG.Combatant.dataModels = {
        base: models.DhCombatant
    };

    CONFIG.ChatMessage.dataModels = models.chatMessages.config;
    CONFIG.ChatMessage.documentClass = documents.DhChatMessage;

    CONFIG.Canvas.rulerClass = placeables.DhRuler;
    CONFIG.Canvas.layers.templates.layerClass = placeables.DhTemplateLayer;
    CONFIG.Token.objectClass = placeables.DhTokenPlaceable;
    CONFIG.Combat.documentClass = documents.DhpCombat;
    CONFIG.ui.combat = applications.ui.DhCombatTracker;
    CONFIG.ui.chat = applications.ui.DhChatLog;
    CONFIG.ui.hotbar = applications.ui.DhHotbar;
    CONFIG.Token.rulerClass = placeables.DhTokenRuler;

    CONFIG.ui.resources = applications.ui.DhFearTracker;
    CONFIG.ux.ContextMenu = applications.ux.DHContextMenu;
    CONFIG.ux.TooltipManager = documents.DhTooltipManager;

    game.socket.on(`system.${SYSTEM.id}`, socketRegistration.handleSocketEvent);

    // Make Compendium Dialog resizable
    foundry.applications.sidebar.apps.Compendium.DEFAULT_OPTIONS.window.resizable = true;

    settingsRegistration.registerDHSettings();
    RegisterHandlebarsHelpers.registerHelpers();

    return handlebarsRegistration();
});

Hooks.on('ready', () => {
    ui.resources = new CONFIG.ui.resources();
    if (game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance).displayFear !== 'hide')
        ui.resources.render({ force: true });

    document.body.classList.toggle(
        'theme-colorful',
        game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance).dualityColorScheme ===
            DualityRollColor.colorful.value
    );

    registerCountdownHooks();
    socketRegistration.registerSocketHooks();
    registerRollDiceHooks();
    registerDHActorHooks();
});

Hooks.once('dicesoniceready', () => {});

Hooks.on('renderChatMessageHTML', (_, element) => {
    element
        .querySelectorAll('.duality-roll-button')
        .forEach(element => element.addEventListener('click', renderDualityButton));

    element
        .querySelectorAll('.measured-template-button')
        .forEach(element => element.addEventListener('click', renderMeasuredTemplate));
});

Hooks.on('renderJournalEntryPageProseMirrorSheet', (_, element) => {
    element
        .querySelectorAll('.duality-roll-button')
        .forEach(element => element.addEventListener('click', renderDualityButton));

    element
        .querySelectorAll('.measured-template-button')
        .forEach(element => element.addEventListener('click', renderMeasuredTemplate));
});

Hooks.on('renderHandlebarsApplication', (_, element) => {
    element
        .querySelectorAll('.duality-roll-button')
        .forEach(element => element.addEventListener('click', renderDualityButton));

    element
        .querySelectorAll('.measured-template-button')
        .forEach(element => element.addEventListener('click', renderMeasuredTemplate));
});

Hooks.on('chatMessage', (_, message) => {
    if (message.startsWith('/dr')) {
        const rollCommand = rollCommandToJSON(message.replace(/\/dr\s?/, ''));
        if (!rollCommand) {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.dualityParsing'));
            return false;
        }

        const traitValue = rollCommand.trait?.toLowerCase();
        const advantageState = rollCommand.advantage ? true : rollCommand.disadvantage ? false : null;

        // Target not required if an attribute is not used.
        const target = traitValue ? getCommandTarget() : undefined;
        if (target || !traitValue) {
            new Promise(async (resolve, reject) => {
                const trait = target ? target.system.traits[traitValue] : undefined;
                if (traitValue && !trait) {
                    ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.attributeFaulty'));
                    reject();
                    return;
                }

                const title = traitValue
                    ? game.i18n.format('DAGGERHEART.UI.Chat.dualityRoll.abilityCheckTitle', {
                          ability: game.i18n.localize(SYSTEM.ACTOR.abilities[traitValue].label)
                      })
                    : game.i18n.localize('DAGGERHEART.GENERAL.duality');

                const config = {
                    title: title,
                    roll: {
                        trait: traitValue
                    },
                    data: {
                        traits: {
                            [traitValue]: trait
                        }
                    },
                    source: target,
                    hasSave: false,
                    dialog: { configure: false },
                    evaluate: true,
                    advantage: rollCommand.advantage == true,
                    disadvantage: rollCommand.disadvantage == true
                };

                await CONFIG.Dice.daggerheart['DualityRoll'].build(config);

                resolve();
            });
        }

        return false;
    }
});

Hooks.on('renderJournalDirectory', async (tab, html, _, options) => {
    if (tab.id === 'journal') {
        if (options.parts && !options.parts.includes('footer')) return;

        const buttons = tab.element.querySelector('.directory-footer.action-buttons');
        const title = game.i18n.format('DAGGERHEART.APPLICATIONS.Countdown.title', {
            type: game.i18n.localize('DAGGERHEART.APPLICATIONS.Countdown.types.narrative')
        });
        buttons.insertAdjacentHTML(
            'afterbegin',
            `
            <button id="narrative-countdown-button">
                <i class="fa-solid fa-stopwatch"></i>
                <span style="font-weight: 400; font-family: var(--font-sans);">${title}</span>
            </button>`
        );

        buttons.querySelector('#narrative-countdown-button').onclick = async () => {
            new NarrativeCountdowns().open();
        };
    }
});
