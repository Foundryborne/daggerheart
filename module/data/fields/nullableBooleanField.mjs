/** 
 * A BooleanField that can handle null in form inputs and form parsing.
 */
export class NullableBooleanField extends foundry.data.fields.BooleanField {
    /** @inheritdoc */
    _cast(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null' || value === '') return this.nullable ? null : false;
        if (typeof value === 'object') return false;
        return Boolean(value);
    }

    /** @inheritdoc. */
    _toInput(config) {
        if (!this.nullable) return super._toInput(config);
        const value = String(config.value ?? null);
        const options = [
            { value: 'true', label: _loc('COMMON.Yes'), selected: value === 'true' },
            { value: 'false', label: _loc('COMMON.No'), selected: value === 'false' },
            { value: 'null', label: '', selected: value === 'null' }
        ];
        const data = foundry.utils.mergeObject(config, { value, options, dataset: { data: 'JSON' } });
        return foundry.applications.fields.createSelectInput(data);
    }
}