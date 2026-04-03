import { RefreshType } from '../../systemRegistration/socket.mjs';
import Party from '../sheets/actors/party.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class GroupRollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(party) {
        super();

        this.party = party;
        this.partyMembers = party.system.partyMembers
            .filter(x => Party.DICE_ROLL_ACTOR_TYPES.includes(x.type))
            .map(member => ({
                ...member.toObject(),
                uuid: member.uuid,
                id: member.id,
                selected: false,
                owned: member.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
            }));

        Hooks.on(socketEvent.Refresh, this.groupRollRefresh.bind());
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.APPLICATIONS.GroupRoll.title');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'GroupRollDialog',
        classes: ['daggerheart', 'views', 'dh-style', 'dialog', 'group-roll-dialog'],
        position: { width: 550, height: 'auto' },
        actions: {},
        form: { handler: this.updateData, submitOnChange: true, closeOnSubmit: false }
    };

    static PARTS = {
        groupRoll: {
            id: 'groupRoll',
            template: 'systems/daggerheart/templates/dialogs/groupRollDialog/groupRoll.hbs'
        }
    };

    _configureRenderParts(options) {
        const { groupRoll } = super._configureRenderParts(options);
        const augmentedParts = { groupRoll };
        for (const memberKey of Object.keys(this.party.system.tagTeam.members)) {
            augmentedParts[memberKey] = {
                id: memberKey,
                template: 'systems/daggerheart/templates/dialogs/tagTeamDialog/tagTeamMember.hbs'
            };
        }
        augmentedParts.rollSelection = rollSelection;
        augmentedParts.tagTeamRoll = tagTeamRoll;

        return augmentedParts;
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        return context;
    }

    async _preparePartContext(partId, context, options) {
        const partContext = await super._preparePartContext(partId, context, options);

        switch (partId) {
            case 'groupRoll':
                break;
        }

        if (Object.keys(this.party.system.tagTeam.members).includes(partId)) {
            const data = this.party.system.tagTeam.members[partId];
            const actor = game.actors.get(partId);
        }

        return partContext;
    }

    static async updateData(event, _, formData) {
        const partyData = foundry.utils.expandObject(formData.object);

        this.updatePartyData(partyData, this.getUpdatingParts(event.target));
    }

    async updatePartyData(update, updatingParts, options = { render: true }) {
        if (!game.users.activeGM)
            return ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.gmRequired'));

        const gmUpdate = async update => {
            await this.party.update(update);
            this.render({ parts: updatingParts });
            game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.Refresh,
                data: { refreshType: RefreshType.TagTeamRoll, action: 'refresh', parts: updatingParts }
            });
        };

        await emitAsGM(
            GMUpdateEvent.UpdateDocument,
            gmUpdate,
            update,
            this.party.uuid,
            options.render
                ? { refreshType: RefreshType.TagTeamRoll, action: 'refresh', parts: updatingParts }
                : undefined
        );
    }

    getUpdatingParts(target) {
        const updatingMember = target.closest('.team-member-container')?.dataset?.memberKey;

        return [...(updatingMember ? [updatingMember] : []), rollSelection.id];
    }

    groupRollRefresh = ({ refreshType, action, parts }) => {
        if (refreshType !== RefreshType.GroupRoll) return;

        switch (action) {
            case 'refresh':
                this.render({ parts });
                break;
            case 'close':
                this.close();
                break;
        }
    };

    async close(options = {}) {
        /* Opt out of Foundry's standard behavior of closing all application windows marked as UI when Escape is pressed */
        if (options.closeKey) return;

        Hooks.off(socketEvent.Refresh, this.groupRollRefresh);
        return super.close(options);
    }
}
