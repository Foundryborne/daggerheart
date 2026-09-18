import BaseDie from './baseDie.mjs';

export default class DisadvantageDie extends BaseDie { 
    constructor(options) {
        options.modifiers = options.modifiers ? 
            (options.modifiers.includes('d') ? options.modifiers : [...options.modifiers, 'd'])
            : ['d'];
            
        super(options);
    }
}
