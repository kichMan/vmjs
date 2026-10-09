// ============================================================================
// Файл: opcodes/algebra-ops.ts
// Опкоды сравнений и арифметико-логических операций
// ============================================================================

import type { OpcodeFlags, VMState } from '../uxn-types.js';
import { getStack, popByte, popShort, pushByte, pushShort } from '../stack.js';

/**
 * 0x08: EQU - сравнение на равенство
 */
export function opEqu(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const b = popShort(stack);
        const a = popShort(stack);
        pushByte(stack, a === b ? 1 : 0);
    } else {
        const b = popByte(stack);
        const a = popByte(stack);
        pushByte(stack, a === b ? 1 : 0);
    }
    return pc;
}

/**
 * 0x09: NEQ - сравнение на неравенство
 */
export function opNeq(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const b = popShort(stack);
        const a = popShort(stack);
        pushByte(stack, a !== b ? 1 : 0);
    } else {
        const b = popByte(stack);
        const a = popByte(stack);
        pushByte(stack, a !== b ? 1 : 0);
    }
    return pc;
}

/**
 * 0x0A: GTH - больше
 */
export function opGth(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const b = popShort(stack);
        const a = popShort(stack);
        pushByte(stack, a > b ? 1 : 0);
    } else {
        const b = popByte(stack);
        const a = popByte(stack);
        pushByte(stack, a > b ? 1 : 0);
    }
    return pc;
}

/**
 * 0x0B: LTH - меньше
 */
export function opLth(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const b = popShort(stack);
        const a = popShort(stack);
        pushByte(stack, a < b ? 1 : 0);
    } else {
        const b = popByte(stack);
        const a = popByte(stack);
        pushByte(stack, a < b ? 1 : 0);
    }
    return pc;
}

/**
 * 0x18: ADD - сложение
 */
export function opAdd(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const b = popShort(stack);
        const a = popShort(stack);
        pushShort(stack, (a + b) & 0xffff);
    } else {
        const b = popByte(stack);
        const a = popByte(stack);
        pushByte(stack, (a + b) & 0xff);
    }
    return pc;
}

/**
 * 0x19: SUB - вычитание
 */
export function opSub(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const b = popShort(stack);
        const a = popShort(stack);
        pushShort(stack, (a - b) & 0xffff);
    } else {
        const b = popByte(stack);
        const a = popByte(stack);
        pushByte(stack, (a - b) & 0xff);
    }
    return pc;
}

/**
 * 0x1A: MUL - умножение
 */
export function opMul(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const b = popShort(stack);
        const a = popShort(stack);
        pushShort(stack, (a * b) & 0xffff);
    } else {
        const b = popByte(stack);
        const a = popByte(stack);
        pushByte(stack, (a * b) & 0xff);
    }
    return pc;
}

/**
 * 0x1B: DIV - деление
 */
export function opDiv(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const b = popShort(stack);
        const a = popShort(stack);
        pushShort(stack, b !== 0 ? (Math.floor(a / b)) & 0xffff : 0);
    } else {
        const b = popByte(stack);
        const a = popByte(stack);
        pushByte(stack, b !== 0 ? (Math.floor(a / b)) & 0xff : 0);
    }
    return pc;
}

/**
 * 0x1C: AND - логическое И
 */
export function opAnd(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const b = popShort(stack);
        const a = popShort(stack);
        pushShort(stack, a & b);
    } else {
        const b = popByte(stack);
        const a = popByte(stack);
        pushByte(stack, a & b);
    }
    return pc;
}

/**
 * 0x1D: ORA - логическое ИЛИ
 */
export function opOra(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const b = popShort(stack);
        const a = popShort(stack);
        pushShort(stack, a | b);
    } else {
        const b = popByte(stack);
        const a = popByte(stack);
        pushByte(stack, a | b);
    }
    return pc;
}

/**
 * 0x1E: EOR - исключающее ИЛИ
 */
export function opEor(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const b = popShort(stack);
        const a = popShort(stack);
        pushShort(stack, a ^ b);
    } else {
        const b = popByte(stack);
        const a = popByte(stack);
        pushByte(stack, a ^ b);
    }
    return pc;
}

/**
 * 0x1F: SFT - сдвиг
 */
export function opSft(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const shift = popByte(stack);
        const value = popShort(stack);
        const rightShift = shift & 0x0f;
        const leftShift = (shift >> 4) & 0x0f;
        const result = ((value >> rightShift) << leftShift) & 0xffff;
        pushShort(stack, result);
    } else {
        const shift = popByte(stack);
        const value = popByte(stack);
        const rightShift = shift & 0x0f;
        const leftShift = (shift >> 4) & 0x0f;
        const result = ((value >> rightShift) << leftShift) & 0xff;
        pushByte(stack, result);
    }
    return pc;
}
