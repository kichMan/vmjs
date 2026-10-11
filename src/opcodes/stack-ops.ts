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
    const sp = stack.index;

    if (flags.short) {
        const value = popShort(stack);
        const result = (value + 1) & 0xffff;
        if (flags.keep) stack.index = sp;
        pushShort(stack, result);
    } else {
        const value = popByte(stack);
        const result = (value + 1) & 0xff;
        if (flags.keep) stack.index = sp;
        pushByte(stack, result);
    }
    return pc;
}

/**
 * 0x02: POP - удалить вершину стека
 * При флаге KEEP ничего не удаляется (канон: операнды сохраняются).
 */
export function opPop(vm: VMState, flags: OpcodeFlags, pc: number): number {
    if (flags.keep) {
        return pc;
    }

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
    const sp = stack.index;

    if (flags.short) {
        const b = popShort(stack);   // вершина
        popShort(stack);             // нижележащий элемент (отбрасывается)
        if (flags.keep) stack.index = sp;
        pushShort(stack, b);
    } else {
        const b = popByte(stack);
        popByte(stack);
        if (flags.keep) stack.index = sp;
        pushByte(stack, b);
    }
    return pc;
}

/**
 * 0x04: SWP - поменять местами два верхних элемента
 */
export function opSwp(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);
    const sp = stack.index;

    if (flags.short) {
        const a = popShort(stack);
        const b = popShort(stack);
        if (flags.keep) stack.index = sp;
        pushShort(stack, a);
        pushShort(stack, b);
    } else {
        const a = popByte(stack);
        const b = popByte(stack);
        if (flags.keep) stack.index = sp;
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
    const sp = stack.index;

    if (flags.short) {
        const a = popShort(stack);
        const b = popShort(stack);
        const c = popShort(stack);
        if (flags.keep) stack.index = sp;
        pushShort(stack, b);
        pushShort(stack, a);
        pushShort(stack, c);
    } else {
        const a = popByte(stack);
        const b = popByte(stack);
        const c = popByte(stack);
        if (flags.keep) stack.index = sp;
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
    const sp = stack.index;

    if (flags.short) {
        const value = popShort(stack);
        if (flags.keep) stack.index = sp;
        pushShort(stack, value);
        pushShort(stack, value);
    } else {
        const value = popByte(stack);
        if (flags.keep) stack.index = sp;
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
    const sp = stack.index;

    if (flags.short) {
        const a = popShort(stack);
        const b = popShort(stack);
        if (flags.keep) stack.index = sp;
        pushShort(stack, b);
        pushShort(stack, a);
        pushShort(stack, b);
    } else {
        const a = popByte(stack);
        const b = popByte(stack);
        if (flags.keep) stack.index = sp;
        pushByte(stack, b);
        pushByte(stack, a);
        pushByte(stack, b);
    }
    return pc;
}

/**
 * 0x0F: STH - сохранить в другой стек
 * При флаге KEEP значение остаётся в исходном стеке, в другой кладётся копия.
 */
export function opSth(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const srcStack = getStack(vm, flags);
    const dstStack = flags.returnStack ? vm.stack : vm.ret;
    const sp = srcStack.index;

    if (flags.short) {
        const value = popShort(srcStack);
        if (flags.keep) srcStack.index = sp;
        pushShort(dstStack, value);
    } else {
        const value = popByte(srcStack);
        if (flags.keep) srcStack.index = sp;
        pushByte(dstStack, value);
    }
    return pc;
}
