// ============================================================================
// Файл: opcodes/flow-ops.ts
// Опкоды управления потоком выполнения
// ============================================================================

import type { OpcodeFlags, VMState } from '../uxn-types.js';
import { getStack, popByte, popShort, pushShort } from '../stack.js';

/**
 * 0x00: BRK - остановка ВМ
 */
export function opBrk(vm: VMState, flags: OpcodeFlags, pc: number): number | null {
    return null;
}

/**
 * 0x0C: JMP - безусловный переход
 */
export function opJmp(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);
    const sp = stack.index;
    let target: number;

    if (flags.short) {
        target = popShort(stack);
    } else {
        const offset = popByte(stack);
        const signedOffset = offset > 127 ? offset - 256 : offset;
        target = (pc + signedOffset) & 0xffff;
    }

    if (flags.keep) stack.index = sp;
    return target;
}

/**
 * 0x0D: JCN - условный переход
 */
export function opJcn(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);
    const sp = stack.index;

    if (flags.short) {
        const addr = popShort(stack);
        const cond = popByte(stack);
        if (flags.keep) stack.index = sp;
        return cond !== 0 ? addr : pc;
    } else {
        const offset = popByte(stack);
        const cond = popByte(stack);
        if (flags.keep) stack.index = sp;
        if (cond !== 0) {
            const signedOffset = offset > 127 ? offset - 256 : offset;
            return (pc + signedOffset) & 0xffff;
        }
        return pc;
    }
}

/**
 * 0x0E: JSR - вызов подпрограммы
 */
export function opJsr(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);
    const sp = stack.index;

    pushShort(vm.ret, pc);

    let target: number;
    if (flags.short) {
        target = popShort(stack);
    } else {
        const offset = popByte(stack);
        const signedOffset = offset > 127 ? offset - 256 : offset;
        target = (pc + signedOffset) & 0xffff;
    }

    if (flags.keep) stack.index = sp;
    return target;
}
