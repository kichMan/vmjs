// ============================================================================
// Файл: stack.ts
// Вспомогательные функции для работы со стеками виртуальной машины
// ============================================================================

import type { OpcodeFlags, Stack, VMState } from './uxn-types.js';

export function pushByte(stack: Stack, value: number): void {
    stack.data[stack.index] = value & 0xff;
    stack.index = (stack.index + 1) & 0xff;
}

export function popByte(stack: Stack): number {
    stack.index = (stack.index - 1) & 0xff;
    return stack.data[stack.index];
}

export function peekByte(stack: Stack, offset: number = 0): number {
    const idx = (stack.index - 1 - offset) & 0xff;
    return stack.data[idx];
}

export function pushShort(stack: Stack, value: number): void {
    const hi = (value >> 8) & 0xff;
    const lo = value & 0xff;
    pushByte(stack, hi);
    pushByte(stack, lo);
}

export function popShort(stack: Stack): number {
    const lo = popByte(stack);
    const hi = popByte(stack);
    return (hi << 8) | lo;
}

export function peekShort(stack: Stack, offset: number = 0): number {
    const lo = peekByte(stack, offset);
    const hi = peekByte(stack, offset + 1);
    return (hi << 8) | lo;
}

export function getStack(vm: VMState, flags: OpcodeFlags): Stack {
    return flags.returnStack ? vm.ret : vm.stack;
}
