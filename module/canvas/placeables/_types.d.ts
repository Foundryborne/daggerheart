export {};

declare module './token.mjs' {
    export default interface DhTokenPlaceable {
        document: DhTokenDocument;
    }
}