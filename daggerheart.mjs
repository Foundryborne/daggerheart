import { SYSTEM } from './module/config/system.mjs';
import * as applications from './module/applications/_module.mjs';
import * as models from './module/data/_module.mjs';
import * as documents from './module/documents/_module.mjs';
import RegisterHandlebarsHelpers from './module/helpers/handlebarsHelper.mjs';
import DhCombatTracker from './module/ui/combatTracker.mjs';
import { GMUpdateEvent, handleSocketEvent, socketEvent } from './module/helpers/socket.mjs';
import { registerDHSettings } from './module/applications/settings.mjs';
import DhpChatLog from './module/ui/chatLog.mjs';
import DhpRuler from './module/ui/ruler.mjs';
import DhpTokenRuler from './module/ui/tokenRuler.mjs';
import { dualityRollEnricher } from './module/enrichers/DualityRollEnricher.mjs';
import { getCommandTarget, rollCommandToJSON, setDiceSoNiceForDualityRoll } from './module/helpers/utils.mjs';
import { abilities } from './module/config/actorConfig.mjs';
import Resources from './module/applications/resources.mjs';
import DHDualityRoll from './module/data/chat-message/dualityRoll.mjs';
import { DualityRollColor } from './module/data/settings/Appearance.mjs';

globalThis.SYSTEM = SYSTEM;

Hooks.once('init', () => {
    CONFIG.daggerheart = SYSTEM;

    game.system.api = {
        applications,
        models,
        documents
    };

    CONFIG.TextEditor.enrichers.push({
        pattern: /\[\[\/dr\s?(.*?)\]\]/g,
        enricher: dualityRollEnricher
    });

    CONFIG.statusEffects = Object.values(SYSTEM.GENERAL.conditions).map(x => ({
        ...x,
        name: game.i18n.localize(x.name)
    }));

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
    DocumentSheetConfig.unregisterSheet(
        CONFIG.ActiveEffect.documentClass,
        'core',
        foundry.applications.sheets.ActiveEffectConfig
    );
    DocumentSheetConfig.registerSheet(CONFIG.ActiveEffect.documentClass, SYSTEM.id, applications.DhActiveEffectConfig, {
        makeDefault: true
    });

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
    if(game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Resources.DisplayFear) !== 'hide') ui.resources.render({ force: true });
    document.body.classList.toggle('theme-colorful', game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance).dualityColorScheme === DualityRollColor.colorful.value);
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

const renderDualityButton = async event => {
    const button = event.currentTarget,
        traitValue = button.dataset.trait?.toLowerCase(),
        target = getCommandTarget();
    if (!target) return;

    const config = {
        event: event,
        title: button.dataset.title,
        roll: {
            modifier: traitValue ? target.system.traits[traitValue].value : null,
            label: button.dataset.label,
            type: button.dataset.actionType ?? null // Need check
        },
        chatMessage: {
            template: 'systems/daggerheart/templates/chat/duality-roll.hbs'
        }
    };
    await target.diceRoll(config);
};

Hooks.on('renderChatMessageHTML', (_, element) => {
    element
        .querySelectorAll('.duality-roll-button')
        .forEach(element => element.addEventListener('click', renderDualityButton));
});

Hooks.on('renderJournalEntryPageProseMirrorSheet', (_, element) => {
    element
        .querySelectorAll('.duality-roll-button')
        .forEach(element => element.addEventListener('click', renderDualityButton));
});

Hooks.on('renderHandlebarsApplication', (_, element) => {
    element
        .querySelectorAll('.duality-roll-button')
        .forEach(element => element.addEventListener('click', renderDualityButton));
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
        'systems/daggerheart/templates/sheets/parts/weapons.hbs',
        'systems/daggerheart/templates/sheets/parts/domainCard.hbs',
        'systems/daggerheart/templates/sheets/parts/heritage.hbs',
        'systems/daggerheart/templates/sheets/parts/subclassFeature.hbs',
        'systems/daggerheart/templates/sheets/parts/effects.hbs',
        'systems/daggerheart/templates/sheets/character/sections/inventory.hbs',
        'systems/daggerheart/templates/sheets/character/sections/loadout.hbs',
        'systems/daggerheart/templates/sheets/character/parts/heritageCard.hbs',
        'systems/daggerheart/templates/sheets/character/parts/advancementCard.hbs',
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
        'systems/daggerheart/templates/views/actionTypes/effect.hbs'
    ]);
};
