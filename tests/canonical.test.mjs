// ============================================================================
// Файл: tests/canonical.test.mjs
// Проверка канонического поведения ВМ Uxn (без внешних фреймворков).
//
// Запуск:  npm run test      (собирает dist/ и выполняет этот файл)
//          node tests/canonical.test.mjs
//
// Тесты работают против собранных артефактов в dist/ (как пример hello.ts).
// ============================================================================

import assert from 'node:assert/strict';
import { Uxn } from '../dist/src/uxn-vm.js';
import { OPCODE_TABLE } from '../dist/src/opcode-table.js';

// ---------------------------------------------------------------------------
// Байты опкодов и флагов
// ---------------------------------------------------------------------------

const OP = {
    BRK: 0x00, INC: 0x01, POP: 0x02, NIP: 0x03, SWP: 0x04, ROT: 0x05, DUP: 0x06, OVR: 0x07,
    EQU: 0x08, NEQ: 0x09, GTH: 0x0a, LTH: 0x0b, JMP: 0x0c, JCN: 0x0d, JSR: 0x0e, STH: 0x0f,
    LDZ: 0x10, STZ: 0x11, LDR: 0x12, STR: 0x13, LDA: 0x14, STA: 0x15, DEI: 0x16, DEO: 0x17,
    ADD: 0x18, SUB: 0x19, MUL: 0x1a, DIV: 0x1b, AND: 0x1c, ORA: 0x1d, EOR: 0x1e, SFT: 0x1f,
    LIT: 0x80, LIT2: 0xa0, LITr: 0xc0, LIT2r: 0xe0,
};

const K = 0x20; // keep
const R = 0x40; // return stack
const S = 0x80; // short

const ENTRY = 0x0100;

// ---------------------------------------------------------------------------
// Инфраструктура
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ok   ${name}`);
    } catch (err) {
        failed++;
        console.error(`  FAIL ${name}`);
        console.error(`       ${err.message}`);
    }
}

function stubDevice(overrides = {}) {
    return {
        dei() { },
        deo() { return true; },
        ...overrides,
    };
}

function runProgram(bytes, device = stubDevice()) {
    const vm = new Uxn(device);
    bytes.forEach((b, i) => { vm.ram[(ENTRY + i) & 0xffff] = b & 0xff; });
    const pc = vm.run(ENTRY);
    return { vm, pc };
}

function stackOf(vm, useRet = false) {
    const s = useRet ? vm.ret : vm.stack;
    return Array.from(s.data.slice(0, s.index));
}

/** Проверяет содержимое рабочего стека после выполнения программы. */
function assertStack(program, expected, message) {
    const { vm } = runProgram(program);
    assert.deepEqual(stackOf(vm), expected, message);
}

// ---------------------------------------------------------------------------
// LIT / LIT2 / LITr / LIT2r
// ---------------------------------------------------------------------------

test('LIT кладёт байт в рабочий стек', () => {
    assertStack([OP.LIT, 0x42, OP.BRK], [0x42]);
});

test('LIT2 кладёт слово (big-endian) в рабочий стек', () => {
    assertStack([OP.LIT2, 0x12, 0x34, OP.BRK], [0x12, 0x34]);
});

test('LITr кладёт байт в стек возвратов', () => {
    const { vm } = runProgram([OP.LITr, 0x05, OP.BRK]);
    assert.deepEqual(stackOf(vm), []);
    assert.deepEqual(stackOf(vm, true), [0x05]);
});

test('LIT2r кладёт слово в стек возвратов', () => {
    const { vm } = runProgram([OP.LIT2r, 0x12, 0x34, OP.BRK]);
    assert.deepEqual(stackOf(vm), []);
    assert.deepEqual(stackOf(vm, true), [0x12, 0x34]);
});

// ---------------------------------------------------------------------------
// Арифметика и логика (обычные и с keep)
// ---------------------------------------------------------------------------

test('ADD: ( a b -- a+b )', () => {
    assertStack([OP.LIT, 3, OP.LIT, 4, OP.ADD, OP.BRK], [7]);
});

test('ADDk: ( a b -- a b a+b )', () => {
    assertStack([OP.LIT, 3, OP.LIT, 4, OP.ADD | K, OP.BRK], [3, 4, 7]);
});

test('ADD2k: канонический пример (12 34 45 67 -- 12 34 45 67 57 9b)', () => {
    assertStack(
        [OP.LIT2, 0x12, 0x34, OP.LIT2, 0x45, 0x67, OP.ADD | S | K, OP.BRK],
        [0x12, 0x34, 0x45, 0x67, 0x57, 0x9b],
    );
});

test('SUB / SUBk', () => {
    assertStack([OP.LIT, 10, OP.LIT, 3, OP.SUB, OP.BRK], [7]);
    assertStack([OP.LIT, 10, OP.LIT, 3, OP.SUB | K, OP.BRK], [10, 3, 7]);
});

test('MUL / MULk', () => {
    assertStack([OP.LIT, 6, OP.LIT, 2, OP.MUL, OP.BRK], [0x0c]);
    assertStack([OP.LIT, 8, OP.LIT, 2, OP.MUL | K, OP.BRK], [8, 2, 0x10]);
});

test('DIV: обычный, keep и деление на ноль', () => {
    assertStack([OP.LIT, 0x10, OP.LIT, 2, OP.DIV, OP.BRK], [8]);
    assertStack([OP.LIT, 0x10, OP.LIT, 3, OP.DIV | K, OP.BRK], [0x10, 3, 5]);
    assertStack([OP.LIT, 0x10, OP.LIT, 0, OP.DIV, OP.BRK], [0]);
});

test('AND / ORA / EOR', () => {
    assertStack([OP.LIT, 0xfc, OP.LIT, 0x3f, OP.AND, OP.BRK], [0x3c]);
    assertStack([OP.LIT, 0xfc, OP.LIT, 0x3f, OP.ORA, OP.BRK], [0xff]);
    assertStack([OP.LIT, 0xfc, OP.LIT, 0x3f, OP.EOR, OP.BRK], [0xc3]);
});

test('SFT и SFTk (канонические примеры)', () => {
    assertStack([OP.LIT, 0x34, OP.LIT, 0x10, OP.SFT, OP.BRK], [0x68]);
    assertStack([OP.LIT, 0x34, OP.LIT, 0x33, OP.SFT | K, OP.BRK], [0x34, 0x33, 0x30]);
});

test('SFT2k: ( 12 48 34 -- 12 48 34 09 20 )', () => {
    assertStack(
        [OP.LIT2, 0x12, 0x48, OP.LIT, 0x34, OP.SFT | S | K, OP.BRK],
        [0x12, 0x48, 0x34, 0x09, 0x20],
    );
});

// ---------------------------------------------------------------------------
// Сравнения (результат всегда байт) и keep
// ---------------------------------------------------------------------------

test('EQU / NEQ / GTH / LTH', () => {
    assertStack([OP.LIT, 3, OP.LIT, 3, OP.EQU, OP.BRK], [1]);
    assertStack([OP.LIT, 3, OP.LIT, 4, OP.EQU, OP.BRK], [0]);
    assertStack([OP.LIT, 3, OP.LIT, 4, OP.NEQ, OP.BRK], [1]);
    assertStack([OP.LIT, 5, OP.LIT, 3, OP.GTH, OP.BRK], [1]);
    assertStack([OP.LIT, 3, OP.LIT, 5, OP.LTH, OP.BRK], [1]);
});

test('EQUk сохраняет операнды и кладёт результат', () => {
    assertStack([OP.LIT, 3, OP.LIT, 3, OP.EQU | K, OP.BRK], [3, 3, 1]);
});

test('EQU2 в SHORT-режиме кладёт байт 0/1', () => {
    assertStack([OP.LIT2, 0x12, 0x34, OP.LIT2, 0x12, 0x34, OP.EQU | S, OP.BRK], [1]);
    assertStack([OP.LIT2, 0x12, 0x34, OP.LIT2, 0x12, 0x35, OP.EQU | S, OP.BRK], [0]);
});

// ---------------------------------------------------------------------------
// Стековые операции (обычные и keep)
// ---------------------------------------------------------------------------

test('INC / INCk', () => {
    assertStack([OP.LIT, 5, OP.INC, OP.BRK], [6]);
    assertStack([OP.LIT, 5, OP.INC | K, OP.BRK], [5, 6]);
});

test('POP / POPk (keep = no-op)', () => {
    assertStack([OP.LIT, 5, OP.POP, OP.BRK], []);
    assertStack([OP.LIT, 5, OP.POP | K, OP.BRK], [5]);
});

test('NIP / NIPk', () => {
    assertStack([OP.LIT, 3, OP.LIT, 4, OP.NIP, OP.BRK], [4]);
    assertStack([OP.LIT, 3, OP.LIT, 4, OP.NIP | K, OP.BRK], [3, 4, 4]);
});

test('SWP / SWPk', () => {
    assertStack([OP.LIT, 3, OP.LIT, 4, OP.SWP, OP.BRK], [4, 3]);
    assertStack([OP.LIT, 3, OP.LIT, 4, OP.SWP | K, OP.BRK], [3, 4, 4, 3]);
});

test('ROT / ROTk', () => {
    assertStack([OP.LIT, 1, OP.LIT, 2, OP.LIT, 3, OP.ROT, OP.BRK], [2, 3, 1]);
    assertStack([OP.LIT, 1, OP.LIT, 2, OP.LIT, 3, OP.ROT | K, OP.BRK], [1, 2, 3, 2, 3, 1]);
});

test('DUP / DUPk', () => {
    assertStack([OP.LIT, 7, OP.DUP, OP.BRK], [7, 7]);
    assertStack([OP.LIT, 7, OP.DUP | K, OP.BRK], [7, 7, 7]);
});

test('OVR / OVRk', () => {
    assertStack([OP.LIT, 3, OP.LIT, 4, OP.OVR, OP.BRK], [3, 4, 3]);
    assertStack([OP.LIT, 3, OP.LIT, 4, OP.OVR | K, OP.BRK], [3, 4, 3, 4, 3]);
});

test('STH / STHk', () => {
    const plain = runProgram([OP.LIT, 7, OP.STH, OP.BRK]);
    assert.deepEqual(stackOf(plain.vm), []);
    assert.deepEqual(stackOf(plain.vm, true), [7]);

    const keep = runProgram([OP.LIT, 7, OP.STH | K, OP.BRK]);
    assert.deepEqual(stackOf(keep.vm), [7]);
    assert.deepEqual(stackOf(keep.vm, true), [7]);
});

// ---------------------------------------------------------------------------
// Память: zero page, абсолютная и относительная адресация
// ---------------------------------------------------------------------------

test('STZ / LDZ (zero page, байт)', () => {
    // STZ: ( addr value -- ), значение на вершине -> сначала адрес, затем значение.
    // #10 #2A STZ  -> M[0x10] = 0x2A ; затем #10 LDZ -> 0x2A
    assertStack([OP.LIT, 0x10, OP.LIT, 0x2a, OP.STZ, OP.LIT, 0x10, OP.LDZ, OP.BRK], [0x2a]);
});

test('STZ2 / LDZ2 (zero page, слово, big-endian)', () => {
    assertStack(
        [OP.LIT, 0x10, OP.LIT2, 0x12, 0x34, OP.STZ | S,
            OP.LIT, 0x10, OP.LDZ | S, OP.BRK],
        [0x12, 0x34],
    );
});

test('STZk сохраняет операнды (addr value)', () => {
    // Стек после STZk: ( addr value -- addr value )
    assertStack([OP.LIT, 0x10, OP.LIT, 0x2a, OP.STZ | K, OP.BRK], [0x10, 0x2a]);
});

test('STA / LDA (абсолютная адресация, слово-адрес)', () => {
    // Адрес 0x0200 в SHORT, значение байтом.
    assertStack(
        [OP.LIT2, 0x02, 0x00, OP.LIT, 0x99, OP.STA,
            OP.LIT2, 0x02, 0x00, OP.LDA, OP.BRK],
        [0x99],
    );
});

test('STA2 / LDA2 (абсолютная адресация, слово)', () => {
    assertStack(
        [OP.LIT2, 0x02, 0x00, OP.LIT2, 0xbe, 0xef, OP.STA | S,
            OP.LIT2, 0x02, 0x00, OP.LDA | S, OP.BRK],
        [0xbe, 0xef],
    );
});

test('STAk сохраняет операнды', () => {
    // ( value addr -- value addr ) ; addr — слово (0x0200)
    assertStack(
        [OP.LIT2, 0x02, 0x00, OP.LIT, 0x99, OP.STA | K, OP.BRK],
        [0x02, 0x00, 0x99],
    );
});

test('STR / LDR (относительная адресация от PC)', () => {
    // STR: ( addr_relative value -- ), адрес = PC_после_инструкции + signed_offset.
    // Записываем байт в свободную ячейку 0x120 и затем читаем его же через LDR.
    //   LIT 0x1B  LIT 0x77  STR    -> M[0x105 + 0x1B] = M[0x120] = 0x77
    //   LIT 0x18  LDR              -> читаем M[0x108 + 0x18] = M[0x120]
    const { vm } = runProgram([
        OP.LIT, 0x1b,   // offset для STR (0x105 + 0x1B = 0x120)
        OP.LIT, 0x77,   // value
        OP.STR,
        OP.LIT, 0x18,   // offset для LDR (0x108 + 0x18 = 0x120)
        OP.LDR,
        OP.BRK,
    ]);
    assert.deepEqual(stackOf(vm), [0x77]);
});

// ---------------------------------------------------------------------------
// Устройства: DEI / DEO и остановка ВМ
// ---------------------------------------------------------------------------

test('DEO записывает значение в порт устройства', () => {
    const written = [];
    const device = stubDevice({
        deo(vm, target) { written.push([target, vm.dev[target]]); return true; },
    });
    // DEO: ( addr value -- ) ; адрес ниже, значение на вершине (как в hello.ts)
    runProgram([OP.LIT, 0x18, OP.LIT, 0x41, OP.DEO, OP.BRK], device);
    assert.deepEqual(written, [[0x18, 0x41]]);
});

test('DEI читает значение из порта устройства', () => {
    const device = stubDevice({
        dei(vm, target) { vm.dev[target] = 0x5a; },
    });
    const { vm } = runProgram([OP.LIT, 0x18, OP.DEI, OP.BRK], device);
    assert.deepEqual(stackOf(vm), [0x5a], 'DEI положил значение порта');
});

test('DEOk сохраняет операнды (addr value)', () => {
    const device = stubDevice();
    assertStack([OP.LIT, 0x18, OP.LIT, 0x41, OP.DEO | K, OP.BRK], [0x18, 0x41]);
});

test('остановка устройством (deo -> false) корректно завершает run()', () => {
    const device = stubDevice({ deo() { return false; } });
    const { pc } = runProgram([OP.LIT, 0x18, OP.LIT, 0x41, OP.DEO, OP.BRK], device);
    // PC должен указывать сразу за DEO (0x0105), а не «уезжать» на адрес 0.
    assert.equal(pc, 0x0105, 'PC после остановки устройством');
});

// ---------------------------------------------------------------------------
// Поток управления: JMP / JCN / JSR / BRK
// ---------------------------------------------------------------------------

test('BRK возвращает PC за собой', () => {
    const { pc } = runProgram([OP.BRK]);
    assert.equal(pc, ENTRY + 1);
});

test('JMP (относительный, байт)', () => {
    // 0x100: LIT +2 ; 0x102: JMP -> PC 0x103 + 2 = 0x105 ; 0x105: BRK
    const { vm, pc } = runProgram([OP.LIT, 0x02, OP.JMP, OP.LIT, 0x99, OP.BRK]);
    assert.equal(pc, 0x0106);
    assert.deepEqual(stackOf(vm), []);
});

test('JCN: ( cond rel -- ), переход при cond != 0', () => {
    // 0x100: LIT 1 ; 0x102: LIT +2 ; 0x104: JCN -> PC 0x105 + 2 = 0x107 ; 0x107: BRK
    const taken = runProgram([OP.LIT, 0x01, OP.LIT, 0x02, OP.JCN, OP.LIT, 0x99, OP.BRK]);
    assert.equal(taken.pc, 0x0108);
    assert.deepEqual(stackOf(taken.vm), []);

    // cond=0 -> перехода нет, выполняется следующая инструкция (LIT 0x99, BRK)
    const notTaken = runProgram([OP.LIT, 0x00, OP.LIT, 0x02, OP.JCN, OP.LIT, 0x99, OP.BRK]);
    assert.deepEqual(stackOf(notTaken.vm), [0x99]);
});

test('JSR кладёт адрес возврата в стек возвратов и прыгает', () => {
    // 0x100: LIT +2 ; 0x102: JSR -> ret=[0x0103]; PC 0x103 + 2 = 0x105 ; 0x105: BRK
    const { vm, pc } = runProgram([OP.LIT, 0x02, OP.JSR, OP.LIT, 0x99, OP.BRK]);
    assert.equal(pc, 0x0106);
    assert.deepEqual(stackOf(vm, true), [0x01, 0x03]);
});

// ---------------------------------------------------------------------------
// Диспетчеризация
// ---------------------------------------------------------------------------

test('OPCODE_TABLE содержит ровно 32 канонических слота 0x00..0x1f', () => {
    const keys = Object.keys(OPCODE_TABLE).map(Number).sort((a, b) => a - b);
    assert.deepEqual(keys, Array.from({ length: 32 }, (_, i) => i));
});

test('нереализованный immediate-опкод (0x20) выдаёт предупреждение', () => {
    const original = console.warn;
    const warnings = [];
    console.warn = (msg) => { warnings.push(String(msg)); };
    try {
        // 0x20 (JCI) не реализован -> предупреждение, затем BRK
        runProgram([OP.LIT, 0x01, 0x20, OP.BRK]);
    } finally {
        console.warn = original;
    }
    assert.equal(warnings.length, 1, 'должно быть ровно одно предупреждение');
    assert.match(warnings[0], /0x20/);
});

// ---------------------------------------------------------------------------
// Итог
// ---------------------------------------------------------------------------

console.log('');
console.log(`Всего: ${passed + failed}, успешно: ${passed}, провалено: ${failed}`);
if (failed > 0) {
    process.exitCode = 1;
}
