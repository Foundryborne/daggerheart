
import DualityDie from './dualityDie.mjs';

export default class HopeDie extends DualityDie { 
    constructor(options) {
        options.modifiers = options.modifiers ? 
            (options.modifiers.includes('h') ? options.modifiers : [...options.modifiers, 'h'])
            : ['h'];
            
        super(options);
    }
}
