export default function ItemAttachmentSheet(Base) {
    return class extends Base {
        static DEFAULT_OPTIONS = {
            ...super.DEFAULT_OPTIONS,
            dragDrop: [
                ...(super.DEFAULT_OPTIONS.dragDrop || []),
                { dragSelector: null, dropSelector: '.attachments-section' }
            ],
            actions: {
                ...super.DEFAULT_OPTIONS.actions,
                removeAttachment: this.#removeAttachment
            }
        };

        static PARTS = {
            ...super.PARTS,
            attachments: {
                template: 'systems/daggerheart/templates/sheets/global/tabs/tab-attachments.hbs',
                scrollable: ['.attachments']
            }
        };

        static TABS = {
            ...super.TABS,
            primary: {
                ...super.TABS?.primary,
                tabs: [...(super.TABS?.primary?.tabs || []) /*{ id: 'attachments' }*/], // Disabled until fixed
                initial: super.TABS?.primary?.initial || 'description',
                labelPrefix: super.TABS?.primary?.labelPrefix || 'DAGGERHEART.GENERAL.Tabs'
            }
        };

        async _preparePartContext(partId, context) {
            await super._preparePartContext(partId, context);

            if (partId === 'attachments') {
                context.attachedItems = await prepareAttachmentContext(this.document);
            }

            return context;
        }

        async _onDrop(event) {
            const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);

            const attachmentsSection = event.target.closest('.attachments-section');
            if (!attachmentsSection) return super._onDrop(event);

            event.preventDefault();
            event.stopPropagation();

            const item = await Item.implementation.fromDropData(data);
            if (!item) return;

            // Call the data model's public method
            await this.document.system.addAttachment(item);
        }

        static async #removeAttachment(event, target) {
            // Call the data model's public method
            await this.document.system.removeAttachment(target.dataset.uuid);
        }

        async _preparePartContext(partId, context) {
            await super._preparePartContext(partId, context);

            if (partId === 'attachments') {
                // Keep this simple UI preparation in the mixin
                const attachedUUIDs = this.document.system.attached;
                context.attachedItems = await Promise.all(
                    attachedUUIDs.map(async uuid => {
                        const item = await fromUuid(uuid);
                        return {
                            uuid: uuid,
                            name: item?.name || 'Unknown Item',
                            img: item?.img || 'icons/svg/item-bag.svg'
                        };
                    })
                );
            }

            return context;
        }
    };
}
