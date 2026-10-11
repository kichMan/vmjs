// ============================================================================
// Файл: opcodes/mem-ops.ts
// Опкоды доступа к памяти (zero page, относительные и абсолютные)
// ============================================================================

import type { OpcodeFlags, VMState } from '../uxn-types.js';
import { getStack, popByte, popShort, pushByte, pushShort } from '../stack.js';

/**
 * 0x10: LDZ - загрузка из zero page
 */
export function opLdz(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);
    const sp = stack.index;
    const addr = popByte(stack);

    if (flags.short) {
        const hi = vm.ram[addr & 0xff];
        const lo = vm.ram[(addr + 1) & 0xff];
        if (flags.keep) stack.index = sp;
        pushShort(stack, (hi << 8) | lo);
    } else {
        const value = vm.ram[addr & 0xff];
        if (flags.keep) stack.index = sp;
        pushByte(stack, value);
    }
    return pc;
}

/**
 * 0x11: STZ - сохранение в zero page
 */
export function opStz(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);
    const sp = stack.index;

    if (flags.short) {
        const value = popShort(stack);
        const addr = popByte(stack);
        vm.ram[addr & 0xff] = (value >> 8) & 0xff;
        vm.ram[(addr + 1) & 0xff] = value & 0xff;
    } else {
        const value = popByte(stack);
        const addr = popByte(stack);
        vm.ram[addr & 0xff] = value;
    }

    if (flags.keep) stack.index = sp;
    return pc;
}

/**
 * 0x12: LDR - загрузка относительная
 */
export function opLdr(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);
    const sp = stack.index;
    const offset = popByte(stack);
    const signedOffset = offset > 127 ? offset - 256 : offset;
    const addr = (pc + signedOffset) & 0xffff;

    if (flags.short) {
        const hi = vm.ram[addr];
        const lo = vm.ram[(addr + 1) & 0xffff];
        if (flags.keep) stack.index = sp;
        pushShort(stack, (hi << 8) | lo);
    } else {
        const value = vm.ram[addr];
        if (flags.keep) stack.index = sp;
        pushByte(stack, value);
    }
    return pc;
}

/**
 * 0x13: STR - сохранение относительное
 */
export function opStr(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);
    const sp = stack.index;

    if (flags.short) {
        const value = popShort(stack);
        const offset = popByte(stack);
        const signedOffset = offset > 127 ? offset - 256 : offset;
        const addr = (pc + signedOffset) & 0xffff;
        vm.ram[addr] = (value >> 8) & 0xff;
        vm.ram[(addr + 1) & 0xffff] = value & 0xff;
    } else {
        const value = popByte(stack);
        const offset = popByte(stack);
        const signedOffset = offset > 127 ? offset - 256 : offset;
        const addr = (pc + signedOffset) & 0xffff;
        vm.ram[addr] = value;
    }

    if (flags.keep) stack.index = sp;
    return pc;
}

/**
 * 0x14: LDA - загрузка абсолютная
 */
export function opLda(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);
    const sp = stack.index;
    const addr = popShort(stack);

    if (flags.short) {
        const hi = vm.ram[addr];
        const lo = vm.ram[(addr + 1) & 0xffff];
        if (flags.keep) stack.index = sp;
        pushShort(stack, (hi << 8) | lo);
    } else {
        const value = vm.ram[addr];
        if (flags.keep) stack.index = sp;
        pushByte(stack, value);
    }
    return pc;
}

/**
 * 0x15: STA - сохранение абсолютное
 */
export function opSta(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);
    const sp = stack.index;

    if (flags.short) {
        const value = popShort(stack);
        const addr = popShort(stack);
        vm.ram[addr] = (value >> 8) & 0xff;
        vm.ram[(addr + 1) & 0xffff] = value & 0xff;
    } else {
        const value = popByte(stack);
        const addr = popShort(stack);
        vm.ram[addr] = value;
    }

    if (flags.keep) stack.index = sp;
    return pc;
}
