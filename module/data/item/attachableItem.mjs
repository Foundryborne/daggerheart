import BaseDataItem from './base.mjs';

export default class AttachableItem extends BaseDataItem {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            attached: new fields.ArrayField(new fields.DocumentUUIDField({ type: 'Item', nullable: true }))
        };
    }

    async _preUpdate(changes, options, user) {
        const allowed = await super._preUpdate(changes, options, user);
        if (allowed === false) return false;

        // Handle equipped status changes for attachment effects
        if (changes.system?.equipped !== undefined && changes.system.equipped !== this.equipped) {
            await this.#handleAttachmentEffectsOnEquipChange(changes.system.equipped);
        }
    }

    async #handleAttachmentEffectsOnEquipChange(newEquippedStatus) {
        const actor = this.parent.parent?.type === 'character' ? this.parent.parent : this.parent.parent?.parent;
        const parentType = this.parent.type;

        if (!actor || !this.attached?.length) {
            return;
        }

        if (newEquippedStatus) {
            // Item is being equipped - add attachment effects
            for (const attachedUuid of this.attached) {
                const attachedItem = await fromUuid(attachedUuid);
                if (attachedItem && attachedItem.effects.size > 0) {
                    await this.#copyAttachmentEffectsToActor({
                        attachedItem,
                        attachedUuid,
                        parentType
                    });
                }
            }
        } else {
            // Item is being unequipped - remove attachment effects
            await this.#removeAllAttachmentEffects(parentType);
        }
    }

    async #copyAttachmentEffectsToActor({ attachedItem, attachedUuid, parentType }) {
        const actor = this.parent.parent;
        if (!actor || !attachedItem.effects.size > 0 || !this.equipped) {
            return [];
        }

        const effectsToCreate = [];
        for (const effect of attachedItem.effects) {
            const effectData = effect.toObject();
            effectData.origin = `${this.parent.uuid}:${attachedUuid}`;

            const attachmentSource = {
                itemUuid: attachedUuid,
                originalEffectId: effect.id
            };
            attachmentSource[`${parentType}Uuid`] = this.parent.uuid;

            effectData.flags = {
                ...effectData.flags,
                [CONFIG.DH.id]: {
                    ...effectData.flags?.[CONFIG.DH.id],
                    [CONFIG.DH.FLAGS.itemAttachmentSource]: attachmentSource
                }
            };
            effectsToCreate.push(effectData);
        }

        if (effectsToCreate.length > 0) {
            return await actor.createEmbeddedDocuments('ActiveEffect', effectsToCreate);
        }

        return [];
    }

    async #removeAllAttachmentEffects(parentType) {
        const actor = this.parent.parent;
        if (!actor) return;

        const parentUuidProperty = `${parentType}Uuid`;
        const effectsToRemove = actor.effects.filter(effect => {
            const attachmentSource = effect.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.itemAttachmentSource);
            return attachmentSource && attachmentSource[parentUuidProperty] === this.parent.uuid;
        });

        if (effectsToRemove.length > 0) {
            await actor.deleteEmbeddedDocuments(
                'ActiveEffect',
                effectsToRemove.map(e => e.id)
            );
        }
    }

    /**
     * Public method for adding an attachment
     */
    async addAttachment(droppedItem) {
        const newUUID = droppedItem.uuid;

        if (this.attached.includes(newUUID)) {
            ui.notifications.warn(`${droppedItem.name} is already attached to this ${this.parent.type}.`);
            return;
        }

        const updatedAttached = [...this.attached, newUUID];
        await this.parent.update({
            'system.attached': updatedAttached
        });

        // Copy effects if equipped
        if (this.equipped && droppedItem.effects.size > 0) {
            await this.#copyAttachmentEffectsToActor({
                attachedItem: droppedItem,
                attachedUuid: newUUID,
                parentType: this.parent.type
            });
        }
    }

    /**
     * Public method for removing an attachment
     */
    async removeAttachment(attachedUuid) {
        await this.parent.update({
            'system.attached': this.attached.filter(uuid => uuid !== attachedUuid)
        });

        // Remove effects
        await this.#removeAttachmentEffects(attachedUuid);
    }

    async #removeAttachmentEffects(attachedUuid) {
        const actor = this.parent.parent;
        if (!actor) return;

        const parentType = this.parent.type;
        const parentUuidProperty = `${parentType}Uuid`;
        const effectsToRemove = actor.effects.filter(effect => {
            const attachmentSource = effect.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.itemAttachmentSource);
            return (
                attachmentSource &&
                attachmentSource[parentUuidProperty] === this.parent.uuid &&
                attachmentSource.itemUuid === attachedUuid
            );
        });

        if (effectsToRemove.length > 0) {
            await actor.deleteEmbeddedDocuments(
                'ActiveEffect',
                effectsToRemove.map(e => e.id)
            );
        }
    }
}
