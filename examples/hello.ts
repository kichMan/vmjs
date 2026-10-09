// ============================================================================
// Файл: examples/hello.ts
// Пример запуска ВМ Uxn: программа выводит "Hello" через ConsoleDevice
//
// Используются опкоды:
//   0x80 LIT  - положить следующий байт в стек данных
//   0x17 DEO  - записать значение в устройство (value addr -> )
//   0x00 BRK  - остановка
//
// Замечание: opDeo снимает со стека сначала value (вершина), затем addr,
// поэтому на стек кладём addr, а затем value.
// ============================================================================

import { pathToFileURL } from 'node:url';
import { Uxn } from '../src/uxn-vm.js';
import { ConsoleDevice } from '../src/ConsoleDevice.js';

const ADDR_CONSOLE = 0x18;  // Стандартный адрес вывода консоли (байт)
const OP_LIT = 0x80;        // LIT: загрузить байт из программы на стек
const OP_DEO = 0x17;        // DEO: запись в устройство
const OP_DEC = 0x20;        // DEC (расширение): декремент вершины стека
const OP_BRK = 0x00;        // BRK: остановка

/**
 * Кладёт на стек пару (addr, value) и выполняет DEO.
 * opDeo снимает сначала value, затем addr, поэтому addr кладётся первым.
 */
function emitChar(char: number): number[] {
    return [
        OP_LIT, ADDR_CONSOLE,  // addr устройства консоли
        OP_LIT, char,          // код символа
        OP_DEO,
    ];
}

function main() {
    const device = new ConsoleDevice();
    const vm = new Uxn(device);

    // Программа: вывод "Hello" и остановка.
    const program: number[] = [
        ...emitChar(0x48),  // 'H'
        ...emitChar(0x65),  // 'e'
        ...emitChar(0x6c),  // 'l'
        ...emitChar(0x6c),  // 'l'
        ...emitChar(0x6f),  // 'o'
        OP_BRK,
    ];

    // Копируем программу в RAM по адресу 0x0100 (стандартный адрес входа)
    program.forEach((byte, i) => {
        vm.ram[0x0100 + i] = byte;
    });

    console.log("Запуск программы Uxn...\n");
    const finalPc = vm.run(0x0100);
    console.log(`\nПрограмма завершена. Финальный PC: 0x${finalPc.toString(16)}`);

    // Демонстрация DEC: LIT 0x41 ('A'), DEC -> 'A' - 1 == '@'
    const decProgram: number[] = [
        OP_LIT, 0x41,
        OP_DEC,
        OP_BRK,
    ];
    decProgram.forEach((byte, i) => {
        vm.ram[0x0100 + i] = byte;
    });
    vm.stack.index = 0;
    vm.run(0x0100);
    console.log(`DEC: 'A'(0x41) -> 0x${vm.stack.data[(vm.stack.index - 1) & 0xff].toString(16)} (ожидается 0x40 '@')`);
}

// Запуск только если этот файл является точкой входа (не при импорте)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main();
}


