import DhTokenPlaceable from './placeables/token.mjs';

declare module './tokens.mjs' {
    export default interface DhTokenLayer {
        get controlled(): DhTokenPlaceable[];
    }
}