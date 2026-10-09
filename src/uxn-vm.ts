import type { Device, OpcodeFlags, Stack, VMState } from './uxn-types.js';
import { OPCODE_TABLE } from './opcode-table.js';
import { opImmediate } from './opcodes/immediate-ops.js';


// ----------------------------------------------------------------------------
// КЛАСС ВИРТУАЛЬНОЙ МАШИНЫ
// ----------------------------------------------------------------------------

export class Uxn implements VMState {
    stack: Stack;           // Стек данных
    ret: Stack;             // Стек возвратов
    ram: Uint8Array;        // 65536 байт RAM
    dev: Uint8Array;        // 256 байт памяти устройств
    device: Device;         // Текущее устройство

    constructor(device: Device) {
        this.stack = {
            data: new Uint8Array(256),
            index: 0
        };
        this.ret = {
            data: new Uint8Array(256),
            index: 0
        };
        this.ram = new Uint8Array(65536);
        this.dev = new Uint8Array(256);
        this.device = device;
    }

    /**
     * Запускает ВМ с указанного адреса до завершения
     */
    run(pc: number): number {
        while (true) {
            const op = this.ram[pc];
            pc = (pc + 1) & 0xffff;

            const result = this.executeOp(op, pc);
            if (result === null) {
                break;  // Опкод BRK
            }
            pc = result;
        }
        return pc;
    }

    /**
     * Извлекает флаги из опкода
     */
    private extractFlags(op: number): OpcodeFlags {
        return {
            short: (op & 0x80) !== 0,
            returnStack: (op & 0x40) !== 0,
            keep: (op & 0x20) !== 0
        };
    }

    /**
     * Выполняет одну операцию (диспетчеризация через таблицу опкодов)
     */
    private executeOp(op: number, pc: number): number | null {
        const baseOp = op & 0x1f;  // Младшие 5 бит - базовая операция
        const flags = this.extractFlags(op);

        // Базовый опкод 0x00 — это семейство BRK/LIT/LIT2/LITr/LIT2r (и
        // неканонический DEC на байте 0x20). Чистый 0x00 — это BRK и
        // обрабатывается таблицей; любой другой опкод с baseOp == 0x00
        // является immediate-опкодом.
        if (baseOp === 0x00 && op !== 0x00) {
            return opImmediate(this, op, pc);
        }

        const handler = OPCODE_TABLE[baseOp];
        if (!handler) {
            console.warn(`Неизвестный опкод: 0x${op.toString(16)}`);
            return pc;
        }
        return handler(this, flags, pc);
    }
}
