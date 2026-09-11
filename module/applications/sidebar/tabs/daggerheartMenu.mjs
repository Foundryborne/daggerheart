import { RefreshFeatures } from '../../../helpers/utils.mjs';

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { AbstractSidebarTab } = foundry.applications.sidebar;
/**
 * The daggerheart menu tab.
 * @extends {AbstractSidebarTab}
 * @mixes HandlebarsApplication
 */
export default class DaggerheartMenu extends HandlebarsApplicationMixin(AbstractSidebarTab) {
    constructor(options) {
        super(options);

        this.refreshSelections = DaggerheartMenu.defaultRefreshSelections();
    }

    static defaultRefreshSelections() {
        return {
            session: { selected: false, label: game.i18n.localize('DAGGERHEART.GENERAL.RefreshType.session') },
            scene: { selected: false, label: game.i18n.localize('DAGGERHEART.GENERAL.RefreshType.scene') },
            longRest: { selected: false, label: game.i18n.localize('DAGGERHEART.GENERAL.RefreshType.longrest') },
            shortRest: { selected: false, label: game.i18n.localize('DAGGERHEART.GENERAL.RefreshType.shortrest') }
        };
    }

    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['dh-style', 'directory'],
        window: {
            title: 'SIDEBAR.TabSettings'
        },
        actions: {
            selectRefreshable: DaggerheartMenu.#onSelectRefreshable,
            refreshActors: DaggerheartMenu.#onRefreshActors,
            createFallCollisionDamage: DaggerheartMenu.#onCreateFallCollisionDamage,
            rollDowntimeFear: DaggerheartMenu.#onRollDowntimeFear,
            showEffectChangePaths: DaggerheartMenu.#onShowEffectChangePaths
        }
    };

    /** @override */
    static tabName = 'daggerheartMenu';

    /** @override */
    static PARTS = {
        main: { template: 'systems/daggerheart/templates/sidebar/daggerheart-menu/main.hbs' }
    };

    /* -------------------------------------------- */

    /** @inheritDoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.refreshables = this.refreshSelections;
        context.disableRefresh = Object.values(this.refreshSelections).every(x => !x.selected);
        context.fallAndCollision = CONFIG.DH.GENERAL.fallAndCollisionDamage;

        return context;
    }

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    static async #onSelectRefreshable(_event, button) {
        const { type } = button.dataset;
        this.refreshSelections[type].selected = !this.refreshSelections[type].selected;
        this.render();
    }

    static async #onRefreshActors() {
        const refreshKeys = Object.keys(this.refreshSelections).filter(key => this.refreshSelections[key].selected);
        await RefreshFeatures(refreshKeys);

        this.refreshSelections = DaggerheartMenu.defaultRefreshSelections();
        this.render();
    }

    static async #onCreateFallCollisionDamage(_event, button) {
        const data = CONFIG.DH.GENERAL.fallAndCollisionDamage[button.dataset.key];
        const roll = new Roll(data.damageFormula);
        await roll.evaluate();

        /* class BaseRoll needed to get rendered by foundryRoll.hbs */
        const rollJSON = roll.toJSON();
        rollJSON.class = 'BaseRoll';

        foundry.documents.ChatMessage.implementation.create({
            title: game.i18n.localize(data.chatTitle),
            author: game.user.id,
            speaker: foundry.documents.ChatMessage.implementation.getSpeaker(),
            rolls: [rollJSON],
            sound: CONFIG.sounds.dice
        });
    }

    static async #onRollDowntimeFear(_event, button) {
        let formula;
        if (button.dataset.type === 'short') {
            formula = '1d4';
        } else {
            const activeParty = game.actors.find(x => x.type === 'party' && x.system.active);
            const partySize = activeParty?.system.partyMembers.length ?? await this.getFallbackPartySize();
            if (!partySize) return;
            
            if (button.dataset.type === 'long') {
                formula = `1d4 + ${partySize}`;
            } else {
                formula = `${partySize}d6`;
            }
        }

        if (!formula) return;

        const fearRoll = await (new Roll(formula)).evaluate();
        const message = await getDocumentClass('ChatMessage').create({
            user: game.user.id,
            title: _loc('DAGGERHEART.APPLICATIONS.DaggerheartMenu.chatMessageTitle'),
            flavor: `<span>${_loc('DAGGERHEART.APPLICATIONS.DaggerheartMenu.chatMessageText')}</span>`,
            rolls: [fearRoll],
            flags: { daggerheart: { noButtons: true } }
        });

        await game.dice3d.waitFor3DAnimationByMessageID(message.id);

        const automation = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).hopeFear;
        if (automation.gm) {
            ui.resources.updateFear(ui.resources.currentFear + fearRoll.total);
        }
    }

    static async #onShowEffectChangePaths() {
        game.system.api.macros.showActiveEffectPathViewer();
    }

    async getFallbackPartySize() {
        const content = new foundry.data.fields.NumberField({
            label: _loc('DAGGERHEART.APPLICATIONS.DaggerheartMenu.partSizePrompt.inputLabel'),
            required: true,
            nullable: false,
            integer: true
        }).toFormGroup({}, { name: 'partySize', localize: true }).outerHTML;

        const partySize = await foundry.applications.api.DialogV2.prompt({
            content: `
                <span>${_loc('DAGGERHEART.APPLICATIONS.DaggerheartMenu.partSizePrompt.text')}</span>
                ${content}
            `,
            rejectClose: false,
            modal: true,
            ok: { callback: (_, button) => button.form.elements.partySize.value },
            window: {
                title: _loc('DAGGERHEART.APPLICATIONS.DaggerheartMenu.partSizePrompt.title')
            },
            position: { width: 400 }
        });

        return partySize ? Number(partySize) : null;
    }
}
