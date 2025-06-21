import * as GENERAL from './generalConfig.mjs';
import * as DOMAIN from './domainConfig.mjs';
import * as ACTOR from './actorConfig.mjs';
import * as ITEM from './itemConfig.mjs';
import * as SETTINGS from './settingsConfig.mjs';
import { hooks as HOOKS } from './hooksConfig.mjs';
import * as EFFECTS from './effectConfig.mjs';
import * as ACTIONS from './actionConfig.mjs';

export const SYSTEM_ID = 'daggerheart';

export const SYSTEM = {
    id: SYSTEM_ID,
    GENERAL,
    DOMAIN,
    ACTOR,
    ITEM,
    SETTINGS,
    HOOKS,
    EFFECTS,
    ACTIONS
};
