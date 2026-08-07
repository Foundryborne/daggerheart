// const fields = foundry.data.fields;

export default class EphemeralChange extends foundry.data.ActiveEffectTypeDataModel {
    static changeEffect = {
        ...super.changeEffect,
        label: 'Ephemeral',
        defaultPriority: 0,
        handler: (doc, change, _options, _field, _replacementData) => {
            if (!doc.ephemeralEffects) return;
            
            doc.ephemeralEffects.add(change);
        },
        render: null
    }
}