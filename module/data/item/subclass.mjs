import BaseDataItem from './base.mjs';

export default class DHSubclass extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.subclass',
            type: 'subclass',
            hasDescription: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            spellcastingTrait: new fields.StringField({
                choices: SYSTEM.ACTOR.abilities,
                integer: false,
                nullable: true,
                initial: null
            }),
            foundationFeature: new fields.SchemaField({
                description: new fields.HTMLField({}),
                abilities: new fields.ArrayField(
                    new fields.SchemaField({
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    })
                )
            }),
            specializationFeature: new fields.SchemaField({
                unlocked: new fields.BooleanField({ initial: false }),
                tier: new fields.NumberField({ initial: null, nullable: true, integer: true }),
                description: new fields.HTMLField({}),
                abilities: new fields.ArrayField(
                    new fields.SchemaField({
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    })
                )
            }),
            masteryFeature: new fields.SchemaField({
                unlocked: new fields.BooleanField({ initial: false }),
                tier: new fields.NumberField({ initial: null, nullable: true, integer: true }),
                description: new fields.HTMLField({}),
                abilities: new fields.ArrayField(
                    new fields.SchemaField({
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    })
                )
            }),
            isMulticlass: new fields.BooleanField({ initial: false })
        };
    }

    async _preCreate(data, options, user) {
        const allowed = await super._preCreate(data, options, user);
        if (allowed === false) return;

        if (this.actor?.type === 'pc') {
            const path = data.system.isMulticlass ? 'system.multiclass' : 'system.class';
            const classData = foundry.utils.getProperty(this.actor, path);
            if (!classData.value) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.Item.Errors.MissingClass'));
                return false;
            } else if (classData.subclass) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.Item.Errors.SubclassAlreadySelected'));
                return false;
            } else if (classData.value.system.subclasses.every(x => x.uuid !== `Item.${data._id}`)) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.Item.Errors.SubclassNotInClass'));
                return false;
            }
        }
    }

    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);

        if (options.parent?.type === 'pc') {
            const path = `system.${data.system.isMulticlass ? 'multiclass.subclass' : 'class.subclass'}`;
            options.parent.update({ [path]: `${options.parent.uuid}.Item.${data._id}` });
        }
    }

    _onDelete(options, userId) {
        super._onDelete(options, userId);

        if (options.parent?.type === 'pc') {
            const path = `system.${this.isMulticlass ? 'multiclass.subclass' : 'class.subclass'}`;
            options.parent.update({ [path]: null });
        }
    }
}
