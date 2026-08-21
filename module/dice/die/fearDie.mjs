import DualityDie from './dualityDie.mjs';

export default class FearDie extends DualityDie { 
    constructor(options) {
        options.modifiers = options.modifiers ? 
            (options.modifiers.includes('f') ? options.modifiers : [...options.modifiers, 'f'])
            : ['f'];
            
        super(options);
    }
}
