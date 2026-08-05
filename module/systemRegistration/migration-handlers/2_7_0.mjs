import { MigrationHandlerBase } from './base.mjs';

export class Migration_2_7_0 extends MigrationHandlerBase {
    version = '2.7.0';

    /** @inheritdoc */
    async updateItemSource(item) {
        if (item.type !== 'beastform') return;

        const beastformEffect = item.system.effects.find(x => x.type === 'beastform');
        if (!beastformEffect) return;
        
        const { evolved } = CONFIG.DH.ITEM.beastformTypes.types;
        if (item.system.beastformType !== evolved.id) return;

        const update = { 
            _id: item._id,
            system: { evolved: {} } 
        };

        const evasionChange = beastformEffect.system.changes.find(x => x.key === 'system.evasion');
        const physicalDamageBonusChange = beastformEffect.system.changes.find(x => x.key === 'system.bonuses.damage.physical.bonus');
        const damageDieIncreaseChange = beastformEffect.system.changes.find(x => x.key === 'system.rules.attack.damage.diceIndex');

        if (physicalDamageBonusChange?.value) {
            update.system.evolved.damageBonus = physicalDamageBonusChange.value;
        }
        if (evasionChange?.value) {
            update.system.evolved.evasionBonus = evasionChange.value;
        }
        if (damageDieIncreaseChange?.value) {
            update.system.evolved.increaseDamageDice = damageDieIncreaseChange.value;
        }

        return update;
    }
    

    async updateActiveEffectSource(effect, item) {
        // const isItem = item instanceof CONFIG.Item.documentClass;
        // if (item !== 'Item' || item.type !== 'beastform') return;

        // const damageDieChange = effect.system.changes.find(x => x.key === 'system.rules.attack.damage.diceIndex');
        // const damageBonusChange = effect.system.changes.find(x => x.key === 'system.rules.attack.damage.bonus');
        // const traitRollChange =  effect.system.changes.find(x => x.key === 'system.rules.attack.roll.trait');

        // const { evolved } = CONFIG.DH.ITEM.beastformTypes.types;
        // if (effect.system.beastformType !== evolved.id) {
        //     effect.system.changes.push({
        //         type: 'standardAttack',
        //         phase: 'initial',
        //         priority: 0,
        //         value: {
        //             name: 'DAGGERHEART.ITEMS.Beastform.attackName',
        //             damageTypes: ['physical'],
        //             attackRange: 'melee',
        //             trait: effect.system.mainTrait,
        //             damageFormula: `@prof${}${damageBonusChange?.value ? ` + ${damageBonusChange.value}` : ''}`,
        //             img: 'icons/creatures/claws/claw-straight-brown.webp'
        //         }
        //     })
        // }

        // const cleanedChanges = item.sytem.changes.filter(x => ![
        //     'system.rules.attack.damage.diceIndex',
        //     'system.rules.attack.damage.bonus',
        //     'system.bonuses.damage.physical.bonus',
        //     'system.rules.attack.roll.trait',
        // ].includes(x.key));

        // return {
        //     _id: effect._id,
        //     system: {
        //         changes: cleanedChanges 
        //     }
        // };
    }
}