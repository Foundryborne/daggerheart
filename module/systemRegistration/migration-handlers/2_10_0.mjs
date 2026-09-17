import { MigrationHandlerBase } from './base.mjs';

/** Migrates action point automation to be part of the variant rule settings */
export class Migration_2_10_0 extends MigrationHandlerBase {
    /** @inheritdoc */
    version = '2.10.0';

    async migrate() {
        if (!game.dice3d) return;

        const appearanceSetting = 
            game.settings.storage.get('client').getItem(`${CONFIG.DH.id}.${CONFIG.DH.SETTINGS.gameSettings.appearance}`);
        if (!appearanceSetting) return;
        const rawAppearanceData = JSON.parse(appearanceSetting);

        const globalSetting = 
            game.settings.storage.get('world').getSetting(`${CONFIG.DH.id}.GlobalOverrides`);
        if (!globalSetting) return;
        const rawGlobalData = JSON.parse(globalSetting.toJSON().value);
        const overrideEnabled = Boolean(rawGlobalData.diceSoNice?.sfx?.overrideEnabled);

        const { name: triggerName } = CONFIG.DH.DICESONICE.dualityTrigger;
        const sfxList = game.user.getFlag('dice-so-nice', 'sfxList') ?? [];

        const migrateTrigger = (key, animation) => {
            if (animation.class) {
                const effect = diceSoNiceSFXClasses[animation.class].id;
                sfxList.push({  
                    diceType: triggerName,
                    mode: 'basic',
                    onResult: [key],
                    options: { isGlobal: overrideEnabled, muteSound: Boolean(animation.options.muteSound) },
                    specialEffect: effect    
                });
            }
        };
        
        migrateTrigger('hope', rawAppearanceData.diceSoNice.hope.sfx.higher);
        migrateTrigger('fear', rawAppearanceData.diceSoNice.fear.sfx.higher);
        migrateTrigger('critical', rawAppearanceData.diceSoNice.sfx.critical);

        game.user.setFlag('dice-so-nice', 'sfxList', sfxList);
    }
}

/* Removed from config, so defined here */
const diceSoNiceSFXClasses = {
    PlayAnimationBright: {
        id: 'PlayAnimationBright',
        label: 'DICESONICE.PlayAnimationBright'
    },
    PlayAnimationDark: {
        id: 'PlayAnimationDark',
        label: 'DICESONICE.PlayAnimationDark'
    },
    PlayAnimationOutline: {
        id: 'PlayAnimationOutline',
        label: 'DICESONICE.PlayAnimationOutline'
    },
    PlayAnimationImpact: {
        id: 'PlayAnimationImpact',
        label: 'DICESONICE.PlayAnimationImpact'
    },
    PlayAnimationThormund: {
        id: 'PlayAnimationThormund',
        label: 'DICESONICE.PlayAnimationThormund'
    },
    PlayAnimationParticleSpiral: {
        id: 'PlayAnimationParticleSpiral',
        label: 'DICESONICE.PlayAnimationParticleSpiral'
    },
    PlayAnimationParticleSparkles: {
        id: 'PlayAnimationParticleSparkles',
        label: 'DICESONICE.PlayAnimationParticleSparkles'
    },
    PlayAnimationParticleVortex: {
        id: 'PlayAnimationParticleVortex',
        label: 'DICESONICE.PlayAnimationParticleVortex'
    },
    PlaySoundEpicWin: {
        id: 'PlaySoundEpicWin',
        label: 'DICESONICE.PlaySoundEpicWin'
    },
    PlaySoundEpicFail: {
        id: 'PlaySoundEpicFail',
        label: 'DICESONICE.PlaySoundEpicFail'
    }
};