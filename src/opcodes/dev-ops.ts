// ============================================================================
// Файл: opcodes/dev-ops.ts
// Опкоды доступа к устройствам
// ============================================================================

import type { OpcodeFlags, VMState } from '../uxn-types.js';
import { getStack, popByte, popShort, pushByte, pushShort } from '../stack.js';

/**
 * 0x16: DEI - чтение из устройства
 */
export function opDei(vm: VMState, flags: OpcodeFlags, pc: number): number {
    const stack = getStack(vm, flags);
    const sp = stack.index;

    if (flags.short) {
        const addr = popByte(stack);
        vm.device.dei(vm, addr);
        const hi = vm.dev[addr];
        vm.device.dei(vm, (addr + 1) & 0xff);
        const lo = vm.dev[(addr + 1) & 0xff];
        if (flags.keep) stack.index = sp;
        pushShort(stack, (hi << 8) | lo);
    } else {
        const addr = popByte(stack);
        vm.device.dei(vm, addr);
        const value = vm.dev[addr];
        if (flags.keep) stack.index = sp;
        pushByte(stack, value);
    }
    return pc;
}

/**
 * 0x17: DEO - запись в устройство
 * @returns новый PC либо null, если устройство запросило остановку ВМ
 */
export function opDeo(vm: VMState, flags: OpcodeFlags, pc: number): number | null {
    const stack = getStack(vm, flags);
    const sp = stack.index;

    if (flags.short) {
        const value = popShort(stack);
        const addr = popByte(stack);
        vm.dev[addr] = (value >> 8) & 0xff;
        if (!vm.device.deo(vm, addr)) return null;
        vm.dev[(addr + 1) & 0xff] = value & 0xff;
        if (!vm.device.deo(vm, (addr + 1) & 0xff)) return null;
    } else {
        const value = popByte(stack);
        const addr = popByte(stack);
        vm.dev[addr] = value;
        if (!vm.device.deo(vm, addr)) return null;
    }

    if (flags.keep) stack.index = sp;
    return pc;
}
