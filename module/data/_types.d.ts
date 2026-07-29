import { DhCountdown } from './countdowns.mjs'

declare module './countdowns.mjs' {
    export default interface DhCountdowns {
        countdowns: Record<string, DhCountdown>;
    }
}