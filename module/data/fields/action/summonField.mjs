const fields = foundry.data.fields;
import DHSummonDialog from '../../../applications/dialogs/summonDialog.mjs';

export default class DHSummonField extends fields.ArrayField {
    /**
     * Action Workflow order
     */
    static order = 120;

    constructor(options = {}, context = {}) {
        const summonFields = new fields.SchemaField({
            actorUUID: new fields.DocumentUUIDField({
                type: 'Actor',
                required: true
            }),
            count: new fields.NumberField({
                required: true,
                default: 1,
                min: 1,
                integer: true
            })
        });
        super(summonFields, options, context);
    }

    static async execute() {
        if(!canvas.scene){
            ui.notifications.warn(game.i18n.localize("DAGGERHEART.ACTIONS.TYPES.summon.error"));
            return;
        }
        const validSummons = this.summon.filter(entry => entry.actorUUID);
        if (validSummons.length === 0) {
            console.log("No actors configured for this Summon action.");
            return;
        }
        
        for (const entry of validSummons) {
            const actor = await fromUuid(entry.actorUUID);
        }

        // //Open Summon Dialog
        // const summonData = { summons: validSummons };
        // console.log(summonData);
        // const dialog = new DHSummonDialog(summonData);
        // dialog.render(true);

        // Create folder and add tokens to actor folder
        const rootFolderName = game.i18n.localize("DAGGERHEART.APPLICATIONS.Summon.title");
        let rootFolder = game.folders.find(f => f.name === rootFolderName && f.type === 'Actor');
        if (!rootFolder) {
            rootFolder = await Folder.create({ 
                name: rootFolderName, 
                type: 'Actor', 
            });
        }
        const parentName = this.item.name ?? "Unkown Feature";
        const actionName = this.name ?? "Unkown Action";
        const subFolderName = `${parentName} - ${actionName}`;

        let subFolder = game.folders.find(f => f.name === subFolderName && f.type === 'Actor' && f.folder?.id === rootFolder.id);
        if (!subFolder) {
            subFolder = await Folder.create({
                name: subFolderName,
                type: 'Actor',
                folder: rootFolder.id
            });
            const actorsToSummon = [];
            for (const entry of validSummons) {
                const sourceActor = await fromUuid(entry.actorUUID);
                if (!sourceActor) {
                    console.warn('DHSummonField: Could not find actor for UUID', entry.actorUUID);
                    continue;
                }
                const actorData = sourceActor.toObject();
                delete actorData._id; // Remove _id to create a new Actor
                actorData.folder = subFolder.id;

                for (let i = 0; i < entry.count; i++) {
                    const newActor = foundry.utils.deepClone(actorData);
                    if (entry.count > 1) {
                        newActor.name = `${actorData.name} ${i + 1}`;
                    }
                    actorsToSummon.push(newActor);
                }
            }
            if (actorsToSummon.length > 0) {
                await Actor.createDocuments(actorsToSummon);
                ui.notifications.info(`Summoned ${actorsToSummon.length} actors successfully in folder ${subFolder.name}.`);
            }
        } else {
            ui.notifications.info(`Summon actors already exist in folder ${subFolder.name}.`);
        }
    }
}
