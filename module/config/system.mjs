import * as GENERAL from './generalConfig.mjs';
import * as DOMAIN from './domainConfig.mjs';
import * as ACTOR from './actorConfig.mjs';
import * as ITEM from './itemConfig.mjs';
import * as SETTINGS from './settingsConfig.mjs';
import * as EFFECTS from './effectConfig.mjs';
import * as ACTIONS from './actionConfig.mjs';
import * as FLAGS from './flagsConfig.mjs';
import * as ITEMBROWSER from './itemBrowserConfig.mjs'

export const SYSTEM_ID = 'daggerheart';

export const SYSTEM = {
    id: SYSTEM_ID,
    GENERAL,
    DOMAIN,
    ACTOR,
    ITEM,
    SETTINGS,
    EFFECTS,
    ACTIONS,
    FLAGS,
    ITEMBROWSER
};
