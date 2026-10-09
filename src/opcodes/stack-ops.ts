// ============================================================================
// Файл: opcodes/stack-ops.ts
// Опкоды работы со стеками
// ============================================================================

import type { OpcodeFlags, VMState } from '../uxn-types.js';
import {
    getStack,
    popByte,
    popShort,
    pushByte,
    pushShort,
} from '../stack.js';

/**
 * 0x01: INC - инкремент вершины стека
 */
export function opInc(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const value = popShort(stack);
        const result = (value + 1) & 0xffff;
        if (!flags.keep) {
            pushShort(stack, result);
        } else {
            stack.index = (stack.index - 2) & 0xff;
            pushShort(stack, result);
        }
    } else {
        const value = popByte(stack);
        const result = (value + 1) & 0xff;
        if (!flags.keep) {
            pushByte(stack, result);
        } else {
            stack.index = (stack.index - 1) & 0xff;
            pushByte(stack, result);
        }
    }
    return pc;
}

/**
 * 0x20 (РАСШИРЕНИЕ, неканонический Uxn): DEC - декремент вершины стека.
 * Зеркально повторяет opInc (учитывает флаги short/keep/returnStack).
 * В каноне Uxn отдельного опкода DEC нет (вычитается через #01 SUB); слот 0x20
 * в этой ВМ свободен, т.к. immediate-опкод JCI здесь не реализован.
 */
export function opDec(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const value = popShort(stack);
        const result = (value - 1) & 0xffff;
        if (!flags.keep) {
            pushShort(stack, result);
        } else {
            stack.index = (stack.index - 2) & 0xff;
            pushShort(stack, result);
        }
    } else {
        const value = popByte(stack);
        const result = (value - 1) & 0xff;
        if (!flags.keep) {
            pushByte(stack, result);
        } else {
            stack.index = (stack.index - 1) & 0xff;
            pushByte(stack, result);
        }
    }
    return pc;
}

/**
 * 0x02: POP - удалить вершину стека
 */
export function opPop(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        popShort(stack);
    } else {
        popByte(stack);
    }
    return pc;
}

/**
 * 0x03: NIP - удалить второй элемент стека
 */
export function opNip(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const top = popShort(stack);
        popShort(stack);
        pushShort(stack, top);
    } else {
        const top = popByte(stack);
        popByte(stack);
        pushByte(stack, top);
    }
    return pc;
}

/**
 * 0x04: SWP - поменять местами два верхних элемента
 */
export function opSwp(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const a = popShort(stack);
        const b = popShort(stack);
        pushShort(stack, a);
        pushShort(stack, b);
    } else {
        const a = popByte(stack);
        const b = popByte(stack);
        pushByte(stack, a);
        pushByte(stack, b);
    }
    return pc;
}

/**
 * 0x05: ROT - ротация трех верхних элементов (a b c -> b c a)
 */
export function opRot(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const a = popShort(stack);
        const b = popShort(stack);
        const c = popShort(stack);
        pushShort(stack, b);
        pushShort(stack, a);
        pushShort(stack, c);
    } else {
        const a = popByte(stack);
        const b = popByte(stack);
        const c = popByte(stack);
        pushByte(stack, b);
        pushByte(stack, a);
        pushByte(stack, c);
    }
    return pc;
}

/**
 * 0x06: DUP - дублировать вершину стека
 */
export function opDup(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const value = popShort(stack);
        pushShort(stack, value);
        pushShort(stack, value);
    } else {
        const value = popByte(stack);
        pushByte(stack, value);
        pushByte(stack, value);
    }
    return pc;
}

/**
 * 0x07: OVR - скопировать второй элемент на вершину
 */
export function opOvr(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);

    if (flags.short) {
        const a = popShort(stack);
        const b = popShort(stack);
        pushShort(stack, b);
        pushShort(stack, a);
        pushShort(stack, b);
    } else {
        const a = popByte(stack);
        const b = popByte(stack);
        pushByte(stack, b);
        pushByte(stack, a);
        pushByte(stack, b);
    }
    return pc;
}

/**
 * 0x0F: STH - сохранить в другой стек
 */
export function opSth(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const srcStack = getStack(vm, flags);
    const dstStack = flags.returnStack ? vm.stack : vm.ret;

    if (flags.short) {
        const value = popShort(srcStack);
        pushShort(dstStack, value);
    } else {
        const value = popByte(srcStack);
        pushByte(dstStack, value);
    }
    return pc;
}
