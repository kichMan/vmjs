// ============================================================================
// Файл: ConsoleDevice.ts
// Простое консольное устройство для вывода символов
// ============================================================================

import type { VMState } from './uxn-types.js';

/**
 * Консольное устройство для вывода символов.
 */
export class ConsoleDevice {
    dei(vm: VMState, target: number): void {
        // Чтение из консоли (не реализовано в этом примере)
        vm.dev[target] = 0;
    }

    deo(vm: VMState, target: number): boolean {
        // Запись в консоль
        if (target === 0x18) {  // Стандартный адрес вывода консоли
            const char = vm.dev[target];
            if (typeof process !== 'undefined' && process.stdout) {
                process.stdout.write(String.fromCharCode(char));
            } else {
                console.log(String.fromCharCode(char));
            }
        }
        return true;  // Продолжать выполнение
    }
}
