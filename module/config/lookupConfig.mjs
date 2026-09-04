import { omit } from '../helpers/utils.mjs';
import { range as rangeConfig } from './generalConfig.mjs';

/** Configuration for @Lookup[] of type range */
export const range = {
    entries: foundry.utils.deepClone(omit(rangeConfig, ['self']))
};