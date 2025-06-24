import { SYSTEM } from './module/config/system.mjs';
import * as applications from './module/applications/_module.mjs';
import * as models from './module/data/_module.mjs';
import * as documents from './module/documents/_module.mjs';
import RegisterHandlebarsHelpers from './module/helpers/handlebarsHelper.mjs';
import DhCombatTracker from './module/ui/combatTracker.mjs';
import { handleSocketEvent, registerSocketHooks } from './module/helpers/socket.mjs';
import { registerDHSettings } from './module/applications/settings.mjs';
import DhpChatLog from './module/ui/chatLog.mjs';
import DhpRuler from './module/ui/ruler.mjs';
import DhpTokenRuler from './module/ui/tokenRuler.mjs';
import { DhDualityRollEnricher, DhTemplateEnricher } from './module/enrichers/_module.mjs';
import { getCommandTarget, rollCommandToJSON, setDiceSoNiceForDualityRoll } from './module/helpers/utils.mjs';
import { abilities } from './module/config/actorConfig.mjs';
import Resources from './module/applications/resources.mjs';
import { NarrativeCountdowns, registerCountdownApplicationHooks } from './module/applications/countdowns.mjs';
import DHDualityRoll from './module/data/chat-message/dualityRoll.mjs';
import { DualityRollColor } from './module/data/settings/Appearance.mjs';
import { DHRoll, DualityRoll, D20Roll, DamageRoll, DualityDie } from './module/applications/roll.mjs';
import { DhMeasuredTemplate } from './module/placeables/_module.mjs';
import { renderDualityButton } from './module/enrichers/DualityRollEnricher.mjs';
import { renderMeasuredTemplate } from './module/enrichers/TemplateEnricher.mjs';
import { registerCountdownHooks } from './module/data/countdowns.mjs';

globalThis.SYSTEM = SYSTEM;

Hooks.once('init', () => {
    CONFIG.daggerheart = SYSTEM;

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
    CONFIG.MeasuredTemplate.objectClass = DhMeasuredTemplate;

    CONFIG.Item.documentClass = documents.DhpItem;

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

    CONFIG.Actor.documentClass = documents.DhpActor;
    CONFIG.Actor.dataModels = models.actors.config;

    Actors.unregisterSheet('core', foundry.applications.sheets.ActorSheetV2);
    Actors.registerSheet(SYSTEM.id, applications.DhCharacterSheet, { types: ['character'], makeDefault: true });
    Actors.registerSheet(SYSTEM.id, applications.DhpAdversarySheet, { types: ['adversary'], makeDefault: true });
    Actors.registerSheet(SYSTEM.id, applications.DhpEnvironment, { types: ['environment'], makeDefault: true });

    CONFIG.ActiveEffect.documentClass = documents.DhActiveEffect;
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
    CONFIG.ChatMessage.documentClass = applications.DhpChatMessage;

    CONFIG.Canvas.rulerClass = DhpRuler;
    CONFIG.Combat.documentClass = documents.DhpCombat;
    CONFIG.ui.combat = DhCombatTracker;
    CONFIG.ui.chat = DhpChatLog;
    // CONFIG.ui.players = DhpPlayers;
    CONFIG.Token.rulerClass = DhpTokenRuler;

    CONFIG.ui.resources = Resources;

    game.socket.on(`system.${SYSTEM.id}`, handleSocketEvent);

    // Make Compendium Dialog resizable
    foundry.applications.sidebar.apps.Compendium.DEFAULT_OPTIONS.window.resizable = true;

    registerDHSettings();
    RegisterHandlebarsHelpers.registerHelpers();

    return preloadHandlebarsTemplates();
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
    registerSocketHooks();
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
                          ability: game.i18n.localize(abilities[traitValue].label)
                      })
                    : game.i18n.localize('DAGGERHEART.General.Duality');

                const hopeAndFearRoll = `1${rollCommand.hope ?? 'd12'}+1${rollCommand.fear ?? 'd12'}`;
                const advantageRoll = `${advantageState === true ? '+d6' : advantageState === false ? '-d6' : ''}`;
                const attributeRoll = `${trait?.value ? `${trait.value > 0 ? `+${trait.value}` : `${trait.value}`}` : ''}`;
                const roll = await Roll.create(`${hopeAndFearRoll}${advantageRoll}${attributeRoll}`).evaluate();

                setDiceSoNiceForDualityRoll(roll, advantageState);

                resolve({
                    roll,
                    trait: trait
                        ? {
                              value: trait.value,
                              label: `${game.i18n.localize(abilities[traitValue].label)} ${trait.value >= 0 ? `+` : ``}${trait.value}`
                          }
                        : undefined,
                    title
                });
            }).then(async ({ roll, trait, title }) => {
                const cls = getDocumentClass('ChatMessage');
                const systemData = new DHDualityRoll({
                    title: title,
                    origin: target?.id,
                    roll: roll,
                    modifiers: trait ? [trait] : [],
                    hope: { dice: rollCommand.hope ?? 'd12', value: roll.dice[0].total },
                    fear: { dice: rollCommand.fear ?? 'd12', value: roll.dice[1].total },
                    advantage: advantageState !== null ? { dice: 'd6', value: roll.dice[2].total } : undefined,
                    advantageState
                });

                const msgData = {
                    type: 'dualityRoll',
                    sound: CONFIG.sounds.dice,
                    system: systemData,
                    user: game.user.id,
                    content: 'systems/daggerheart/templates/chat/duality-roll.hbs',
                    rolls: [roll]
                };

                cls.create(msgData);
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

const preloadHandlebarsTemplates = async function () {
    return foundry.applications.handlebars.loadTemplates([
        'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs',
        'systems/daggerheart/templates/sheets/global/partials/inventory-item.hbs',
        'systems/daggerheart/templates/sheets/global/partials/domain-card-item.hbs',
        'systems/daggerheart/templates/sheets/global/partials/inventory-fieldset-items.hbs',

        'systems/daggerheart/templates/sheets/parts/attributes.hbs',
        'systems/daggerheart/templates/sheets/parts/defense.hbs',
        'systems/daggerheart/templates/sheets/parts/armor.hbs',
        'systems/daggerheart/templates/sheets/parts/experience.hbs',
        'systems/daggerheart/templates/sheets/parts/features.hbs',
        'systems/daggerheart/templates/sheets/parts/gold.hbs',
        'systems/daggerheart/templates/sheets/parts/health.hbs',
        'systems/daggerheart/templates/sheets/parts/hope.hbs',
        'systems/daggerheart/templates/sheets/parts/weapons.hbs',
        'systems/daggerheart/templates/sheets/parts/domainCard.hbs',
        'systems/daggerheart/templates/sheets/parts/heritage.hbs',
        'systems/daggerheart/templates/sheets/parts/subclassFeature.hbs',
        'systems/daggerheart/templates/sheets/parts/effects.hbs',
        'systems/daggerheart/templates/sheets/character/sections/inventory.hbs',
        'systems/daggerheart/templates/sheets/character/sections/loadout.hbs',
        'systems/daggerheart/templates/sheets/character/parts/heritageCard.hbs',
        'systems/daggerheart/templates/sheets/character/parts/advancementCard.hbs',
        'systems/daggerheart/templates/sheets/items/subclass/parts/subclass-features.hbs',
        'systems/daggerheart/templates/sheets/items/subclass/parts/subclass-feature.hbs',
        'systems/daggerheart/templates/components/card-preview.hbs',
        'systems/daggerheart/templates/views/levelup/parts/selectable-card-preview.hbs',
        'systems/daggerheart/templates/sheets/global/partials/feature-section-item.hbs',
        'systems/daggerheart/templates/ui/combat/combatTrackerSection.hbs',
        'systems/daggerheart/templates/views/actionTypes/damage.hbs',
        'systems/daggerheart/templates/views/actionTypes/healing.hbs',
        'systems/daggerheart/templates/views/actionTypes/resource.hbs',
        'systems/daggerheart/templates/views/actionTypes/uuid.hbs',
        'systems/daggerheart/templates/views/actionTypes/uses.hbs',
        'systems/daggerheart/templates/views/actionTypes/roll.hbs',
        'systems/daggerheart/templates/views/actionTypes/cost.hbs',
        'systems/daggerheart/templates/views/actionTypes/range-target.hbs',
        'systems/daggerheart/templates/views/actionTypes/effect.hbs',
        'systems/daggerheart/templates/settings/components/settings-item-line.hbs'
    ]);
};
