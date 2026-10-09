// ============================================================================
// Файл: index.ts
// Публичный API библиотеки vmjs
// ============================================================================

export { Uxn } from './uxn-vm.js';
export { ConsoleDevice } from './ConsoleDevice.js';
export { OPCODE_TABLE } from './opcode-table.js';
export { DEC_OPCODE } from './opcodes/immediate-ops.js';

export type {
    Device,
    OpcodeFlags,
    OpcodeFn,
    Stack,
    VMState,
} from './uxn-types.js';

export {
    getStack,
    peekByte,
    peekShort,
    popByte,
    popShort,
    pushByte,
    pushShort,
} from './stack.js';
