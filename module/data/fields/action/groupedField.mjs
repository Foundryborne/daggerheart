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
                label: 'DAGGERHEART.ACTIONS.TYPES.grouped.selectionType.label',
                required: true, nullable: false, 
                choices: CONFIG.DH.ACTIONS.groupActionSelectionType, 
                initial: CONFIG.DH.ACTIONS.groupActionSelectionType.selected.id
            }),
            groupedActions: new fields.SetField(new fields.StringField({ required: true, nullable: false }), {
                label: 'DAGGERHEART.ACTIONS.TYPES.grouped.groupedActions.label'
            })
        };
        super(groupedFields, options, context);
    }

    static async execute(config) {
        const groupedActions = 
            Array.from(this.grouped.groupedActions).map(x => this.item.system.actions.get(x)).filter(Boolean);
        if (!groupedActions.length) {
            return ui.notifications.error(_loc('DAGGERHEART.ACTIONS.TYPES.grouped.missingGroupedActions'));
        }

        let selectedAction;
        const isSelected = this.grouped.selectionType === CONFIG.DH.ACTIONS.groupActionSelectionType.selected.id;
        if (isSelected || config.groupAction?.forceSelect) {
            selectedAction = await game.system.api.applications.dialogs.MultiActionSelectionDialog.create(
                this.item.name,
                groupedActions    
            );
        } else {
            const roll = await (new Roll(`1d${groupedActions.length}`)).evaluate();

            const cls = getDocumentClass('ChatMessage');
            const message = await cls.create({
                user: game.user.id,
                rolls: [roll],
                title: this.item.name,
                speaker: cls.getSpeaker(),
                flags: { daggerheart: { noButtons: true } }
            });

            if (game.dice3d) {
                await game.dice3d.waitFor3DAnimationByMessageID(message.id);
            }

            selectedAction = groupedActions[roll.total - 1];
        }

        if (!selectedAction) return false;

        selectedAction.use(config.event);
        config.skips.createMessage = true;
    }
}