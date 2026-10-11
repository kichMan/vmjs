// ============================================================================
// Файл: opcodes/immediate-ops.ts
// Immediate-опкоды семейства базового опкода 0x00 (BRK/LIT/LIT2/LITr/LIT2r),
// а также неканонический расширенный опкод DEC.
//
// Канон Uxn: базовый опкод 0x00 — это целое семейство, где старшие биты
// выбирают конкретную операцию (как в switch(instr & 0x1f) -> case 0x00 в uxn.c):
//
//   0x00  BRK        остановка (обрабатывается OPCODE_TABLE, см. opBrk)
//   0x20  (JCI)      не реализован
//   0x40  (JMI)      не реализован
//   0x60  (JSI)      не реализован
//   0x80  LIT   -> M[PC]'   , PC += 1
//   0xa0  LIT2  -> M[PC]"   , PC += 2
//   0xc0  LITr  -> .M[PC]'  , PC += 1   (в стек возвратов)
//   0xe0  LIT2r -> .M[PC]"  , PC += 2   (в стек возвратов)
//
// Для LIT-семейства биты читаются как: 0x40 = возвратный стек, 0x20 = 2 байта.
// ============================================================================

import type { VMState } from '../uxn-types.js';
import { pushByte, pushShort } from '../stack.js';

// Значения старших бит для immediate-семейства (базовый опкод 0x00)
const LIT_SHORT_FLAG = 0x20;    // "2": читать два байта
const LIT_RETURN_FLAG = 0x40;   // "r": писать в стек возвратов
const LIT_BIT = 0x80;           // признак LIT-семейства



// ----------------------------------------------------------------------------
// LIT / LIT2 / LITr / LIT2r
// ----------------------------------------------------------------------------

/**
 * 0x80: LIT - положить следующий байт программы в стек данных
 */
export function opLit(vm: VMState, pc: number): number {
    pushByte(vm.stack, vm.ram[pc]);
    return (pc + 1) & 0xffff;
}

/**
 * 0xa0: LIT2 - положить следующие два байта (short, big-endian) в стек данных
 */
export function opLit2(vm: VMState, pc: number): number {
    const hi = vm.ram[pc];
    const lo = vm.ram[(pc + 1) & 0xffff];
    pushShort(vm.stack, (hi << 8) | lo);
    return (pc + 2) & 0xffff;
}

/**
 * 0xc0: LITr - положить следующий байт программы в стек возвратов
 */
export function opLitr(vm: VMState, pc: number): number {
    pushByte(vm.ret, vm.ram[pc]);
    return (pc + 1) & 0xffff;
}

/**
 * 0xe0: LIT2r - положить следующие два байта (short) в стек возвратов
 */
export function opLit2r(vm: VMState, pc: number): number {
    const hi = vm.ram[pc];
    const lo = vm.ram[(pc + 1) & 0xffff];
    pushShort(vm.ret, (hi << 8) | lo);
    return (pc + 2) & 0xffff;
}

// ----------------------------------------------------------------------------
// ДИСПЕТЧЕР IMMEDIATE-ОПКОДОВ
// ----------------------------------------------------------------------------

/**
 * Обрабатывает базовый опкод 0x00 (кроме самого BRK == 0x00).
 * Возвращает новый PC либо null, если нужно остановиться.
 */
export function opImmediate(vm: VMState, op: number, pc: number): number | null {
    // LIT-семейство: установлен старший бит 0x80
    if ((op & LIT_BIT) !== 0) {
        const twoBytes = (op & LIT_SHORT_FLAG) !== 0;
        const useReturn = (op & LIT_RETURN_FLAG) !== 0;

        if (twoBytes) {
            return useReturn ? opLit2r(vm, pc) : opLit2(vm, pc);
        }
        return useReturn ? opLitr(vm, pc) : opLit(vm, pc);
    }


    return pc;
}
