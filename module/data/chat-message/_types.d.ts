import { DhChatMessage } from '../../documents/_module.mjs';

declare module './base.mjs' {
    export default interface DhBaseChatData {
        parent: DhChatMessage<this>;
    }
}