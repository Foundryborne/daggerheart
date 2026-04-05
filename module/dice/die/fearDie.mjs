import { getDiceSoNicePresets } from '../../config/generalConfig.mjs';
import DualityDie from './dualityDie.mjs';

export default class FearDie extends DualityDie {
    async getDiceSoNiceAppearance(roll) {
        const { fear } = await getDiceSoNicePresets(roll, this.denomination, this.denomination);
        return fear;
    }
}
