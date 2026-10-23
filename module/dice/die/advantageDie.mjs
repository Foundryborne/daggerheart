import BaseDie from './baseDie.mjs';

export default class AdvantageDie extends BaseDie { 
    constructor(options) {
        options.modifiers = options.modifiers ? 
            (options.modifiers.includes('a') ? options.modifiers : [...options.modifiers, 'a'])
            : ['a'];
            
        super(options);
    }
}
