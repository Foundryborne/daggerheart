export {}; // top level import/export required for merges to happen

declare module './countdowns.mjs' {
    export default interface DhCountdowns {
        countdowns: Record<string, DhCountdown>;
        hideNewCountdowns: boolean;
    }

    export interface DhCountdown {
        type: string;
        name: string;
        img?: string;
        ownership: Record<string, number>
        /** True if the countdown is hidden to players by default, unless the player has the observer or owner permission */
        hidden: boolean;
        progress: {
            current: number;
            start: number;
            startFormula?: number;
            looping: keyof typeof CONFIG.DH.GENERAL.countdownLoopingTypes;
            type: keyof typeof CONFIG.DH.GENERAL.countdownProgressionTypes;
        }
    }
}