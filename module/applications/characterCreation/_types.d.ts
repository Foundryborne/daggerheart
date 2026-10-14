import DHClass from '../../data/item/class.mjs';
import DHCommunity from '../../data/item/community.mjs';
import DHSubclass from '../../data/item/subclass.mjs';
import { CharacterCreatorData } from './data.mjs';

interface LoadedData {
    class: DhItem<DHClass>;
    subclass: DhItem<DHSubclass>;
    community: DhItem<DHCommunity>;
}

export type LoadedCharacterCreatorData = Omit<CharacterCreatorData, keyof LoadedData> & LoadedData;