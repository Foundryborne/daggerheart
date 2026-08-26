const fields = foundry.data.fields;

/**
 * @import DHGroupedAction from '../../action/groupedAction.mjs'
 */

export default class DHGroupedField extends fields.SchemaField {
    /**
     * Action Workflow order
     */
    static order = 130;

    constructor(options = {}, context = {}) {
        const groupedFields = {
            selectionType: new fields.StringField({ 
                required: true, nullable: false, 
                choices: CONFIG.DH.ACTIONS.groupActionSelectionType, 
                initial: CONFIG.DH.ACTIONS.groupActionSelectionType.selected.id
            }),
            groupedActions: new fields.SetField(new fields.StringField({ required: true, nullable: false }))
        };
        super(groupedFields, options, context);
    }

    static async execute(config) {
        const groupedActions = 
            Array.from(this.grouped.groupedActions).map(x => this.item.system.actions.get(x)).filter(Boolean);
        if (!groupedActions.length) {
            return ui.notifications.error(_loc('Failed'));
        }

        let selectedAction;
        if (this.grouped.selectionType === CONFIG.DH.ACTIONS.groupActionSelectionType.randomized.id) {
            const roll = await (new Roll(`1d${groupedActions.length}`)).evaluate();

            const cls = getDocumentClass('ChatMessage');
            const msg = {
                user: game.user.id,
                rolls: [roll],
                title: this.item.name,
                speaker: cls.getSpeaker(),
                flags: { daggerheart: { noButtons: true } }
            };
            const message = await cls.create(msg);

            if (game.dice3d) {
                await game.dice3d.waitFor3DAnimationByMessageID(message.id);
            }

            selectedAction = groupedActions[roll.total - 1];
        } else {
            selectedAction = await game.system.api.applications.dialogs.MultiActionSelectionDialog.create(
                this.item.name,
                groupedActions    
            );
        }

        if (!selectedAction) return false;

        selectedAction.use(config.event);
        config.skips.createMessage = true;
    }
}