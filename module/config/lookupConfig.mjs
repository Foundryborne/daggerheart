import { omit } from '../helpers/utils.mjs';
import { range as rangeConfig } from './generalConfig.mjs';
import { abilities as traitConfig } from './actorConfig.mjs';

/** Configuration for @Lookup[] of type range */
export const range = {
    entries: foundry.utils.deepClone(omit(rangeConfig, ['self']))
};

export const trait = {
    entries: foundry.utils.deepClone(traitConfig)
}