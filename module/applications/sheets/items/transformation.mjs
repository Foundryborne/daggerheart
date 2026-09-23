import DHBaseItemSheet from '../api/base-item.mjs';

export default class TransformationSheet extends DHBaseItemSheet {    
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        position: { width: 450, height: 700 },
        classes: ['transformation']
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/transformation/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { 
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs',
            scrollable: ['.description-section']
        },
        features: { 
            template: 'systems/daggerheart/templates/sheets/items/transformation/features.hbs',
            scrollable: ['']
        },
        questions: { 
            template: 'systems/daggerheart/templates/sheets/items/transformation/questions.hbs',
            scrollable: ['.questions-container']
        }
    };

    /** @override*/
    static TABS = {
        primary: {
            tabs: [{ id: 'description' }, { id: 'features' }, { id: 'questions' }],
            initial: 'description',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /**@inheritdoc */
    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case 'questions':
                const { TextEditor } = foundry.applications.ux;
                context.enrichedQuestions = 
                    await TextEditor.implementation.enrichHTML(this.document.system.questions, {
                        secrets: this.document.isOwner,
                        relativeTo: this.document,
                        rollData: this.document.getRollData()
                    });
                break;
        }

        return context;
    }
}