import { SYSTEM } from './module/applications/config/system.mjs';
import * as applications from './module/applications/_module.mjs';
import * as models from './module/data/_module.mjs';
import * as documents from './module/documents/_module.mjs';
import RegisterHandlebarsHelpers from './module/helpers/handlebarsHelper.mjs';
import { DhDualityRollEnricher, DhTemplateEnricher } from './module/enrichers/_module.mjs';
import { getCommandTarget, rollCommandToJSON } from './module/helpers/utils.mjs';
import { NarrativeCountdowns, registerCountdownApplicationHooks } from './module/applications/ui/countdowns.mjs';
import { DualityRollColor } from './module/data/settings/Appearance.mjs';
import { DHRoll, DualityRoll, D20Roll, DamageRoll, DualityDie } from './module/documents/roll.mjs';
import { renderDualityButton } from './module/enrichers/DualityRollEnricher.mjs';
import { renderMeasuredTemplate } from './module/enrichers/TemplateEnricher.mjs';
import { registerCountdownHooks } from './module/data/countdowns.mjs';
import {
    handlebarsRegistration,
    settingsRegistration,
    socketRegistration
} from './module/systemRegistration/_module.mjs';
import { DhPlaceables } from './module/canvas/_module.mjs';

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

    CONFIG.statusEffects = Object.values(SYSTEM.GENERAL.conditions).map(x => ({
        ...x,
        name: game.i18n.localize(x.name)
    }));

    CONFIG.Dice.daggerheart = {
        DualityDie: DualityDie,
        DHRoll: DHRoll,
        DualityRoll: DualityRoll,
        D20Roll: D20Roll,
        DamageRoll: DamageRoll
    };

    CONFIG.Dice.rolls = [...CONFIG.Dice.rolls, ...[DHRoll, DualityRoll, D20Roll, DamageRoll]];
    CONFIG.MeasuredTemplate.objectClass = DhPlaceables.DhMeasuredTemplate;

    CONFIG.Item.documentClass = documents.DHItem;

    //Registering the Item DataModel
    CONFIG.Item.dataModels = models.items.config;

    const { Items, Actors } = foundry.documents.collections;
    Items.unregisterSheet('core', foundry.applications.sheets.ItemSheetV2);
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
    Items.registerSheet(SYSTEM.id, applications.DhBeastform, { types: ['beastform'], makeDefault: true });

    CONFIG.Actor.documentClass = documents.DhpActor;
    CONFIG.Actor.dataModels = models.actors.config;

    Actors.unregisterSheet('core', foundry.applications.sheets.ActorSheetV2);
    Actors.registerSheet(SYSTEM.id, applications.DhCharacterSheet, { types: ['character'], makeDefault: true });
    Actors.registerSheet(SYSTEM.id, applications.DhCompanionSheet, { types: ['companion'], makeDefault: true });
    Actors.registerSheet(SYSTEM.id, applications.DhpAdversarySheet, { types: ['adversary'], makeDefault: true });
    Actors.registerSheet(SYSTEM.id, applications.DhpEnvironment, { types: ['environment'], makeDefault: true });

    CONFIG.ActiveEffect.documentClass = documents.DhActiveEffect;
    CONFIG.ActiveEffect.dataModels = models.activeEffects.config;

    foundry.applications.apps.DocumentSheetConfig.unregisterSheet(
        CONFIG.ActiveEffect.documentClass,
        'core',
        foundry.applications.sheets.ActiveEffectConfig
    );
    foundry.applications.apps.DocumentSheetConfig.registerSheet(
        CONFIG.ActiveEffect.documentClass,
        SYSTEM.id,
        applications.DhActiveEffectConfig,
        {
            makeDefault: true
        }
    );

    CONFIG.Combat.dataModels = {
        base: models.DhCombat
    };

    CONFIG.Combatant.dataModels = {
        base: models.DhCombatant
    };

    CONFIG.ChatMessage.dataModels = models.messages.config;
    CONFIG.ChatMessage.documentClass = documents.DhChatMessage;

    CONFIG.Canvas.rulerClass = DhPlaceables.DhRuler;
    CONFIG.Combat.documentClass = documents.DhpCombat;
    CONFIG.ui.combat = applications.ui.DhCombatTracker;
    CONFIG.ui.chat = applications.ui.DhChatLog;
    CONFIG.Token.rulerClass = DhPlaceables.DhTokenRuler;

    CONFIG.ui.resources = applications.ui.DhFearTracker;
    CONFIG.ux.ContextMenu = applications.DhContextMenu;
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
    registerCountdownApplicationHooks();
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
            ui.notifications.error(game.i18n.localize('DAGGERHEART.Notification.Error.DualityParsing'));
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
                    ui.notifications.error(game.i18n.localize('DAGGERHEART.Notification.Error.AttributeFaulty'));
                    reject();
                    return;
                }

                const title = traitValue
                    ? game.i18n.format('DAGGERHEART.Chat.DualityRoll.AbilityCheckTitle', {
                          ability: game.i18n.localize(applications.config.actorConfig.abilities[traitValue].label)
                      })
                    : game.i18n.localize('DAGGERHEART.General.Duality');

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
        const title = game.i18n.format('DAGGERHEART.Countdown.Title', {
            type: game.i18n.localize('DAGGERHEART.Countdown.Types.narrative')
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
