# vmjs

Реализация виртуальной машины **Uxn** на TypeScript.

## Структура

```
src/
  uxn-types.ts     Общие типы и контракты (Device, OpcodeFlags, Stack, VMState, OpcodeFn)
  Device.ts        Совместимый реэкспорт контракта Device (для старых импортов)
  stack.ts         Хелперы стеков (push/pop/peek для байтов и short)
  uxn-vm.ts        Класс Uxn (implements VMState) — состояние и цикл run()
  opcode-table.ts  Таблица диспетчеризации базовых опкодов (0x00..0x1f)
  opcodes/         Реализация опкодов по группам:
    stack-ops.ts     INC DEC POP NIP SWP ROT DUP OVR STH
    flow-ops.ts      BRK JMP JCN JSR
    mem-ops.ts       LDZ STZ LDR STR LDA STA
    dev-ops.ts       DEI DEO
    algebra-ops.ts   EQU NEQ GTH LTH ADD SUB MUL DIV AND ORA EOR SFT
    immediate-ops.ts LIT LIT2 LITr LIT2r (+ расширение DEC)
  ConsoleDevice.ts Пример устройства вывода в консоль
  index.ts         Публичный API библиотеки
examples/
  hello.ts         Пример запуска ВМ (выводит "Hello", демонстрирует LIT и DEC)
```

## Immediate-опкоды (LIT-семейство)

В каноне Uxn `LIT` — это не отдельный слот таблицы `0x00..0x1f`, а **семейство
базового опкода `0x00`**, различаемое старшими битами опкода (как `case 0x00`
в `uxn.c`). Реализация — `src/opcodes/immediate-ops.ts`:

| Байт | Опкод | Действие |
|------|-------|----------|
| `0x80` | LIT   | `push (M[PC])`, `PC += 1` |
| `0xa0` | LIT2  | `push (M[PC] << 8 \| M[PC+1])`, `PC += 2` |
| `0xc0` | LITr  | то же, что LIT, но в стек возвратов |
| `0xe0` | LIT2r | то же, что LIT2, но в стек возвратов |
| `0x00` | BRK   | остановка (обрабатывается таблицей) |

В `Uxn.executeOp` чистый `0x00` идёт в таблицу (BRK), а любой другой опкод с
`op & 0x1f == 0` — в `opImmediate`.

## Расширение DEC (неканонический Uxn)

В каноне Uxn отдельного опкода декремента **нет** (декремент — это `#01 SUB`),
и все 32 базовых слота заняты. Поэтому `DEC` добавлен как расширение на байте
`0x20` (в каноне это immediate-опкод `JCI`, который здесь не реализован).
`opDec` зеркально повторяет `opInc` и учитывает флаги `short`/`keep`/`returnStack`.

Ограничение: `DEC2` был бы байтом `0xa0`, но `0xa0` — это канонический `LIT2`,
поэтому фактически доступна только байтовая форма `DEC` (`0x20`).


## Сборка и запуск

```bash
npm install
npm run build      # tsc -> dist/
npm start          # build + запуск примера examples/hello.ts
npm run dev        # tsc --watch
npm run clean      # rm -rf dist
```

## Публичный API

```ts
import { Uxn, ConsoleDevice } from 'vmjs';
import type { Device, VMState } from 'vmjs';

const vm = new Uxn(new ConsoleDevice());
const finalPc = vm.run(0x0100);
```

## Отмеченные особенности текущей реализации

1. **LIT реализован** (как семейство базового опкода `0x00`): `LIT`, `LIT2`,
   `LITr`, `LIT2r`. Константы теперь задаются напрямую (`LIT <byte>`).
2. **DEO — это `0x17`, а не `0x1d`.** `0x1d & 0x1f == 0x1d` — это `ORA`.
   (Исправлено в примере относительно исходного `main.ts`.)
3. **DEC добавлен как расширение** на байте `0x20` (неканонично: в Uxn декремент
   делается через `#01 SUB`). Доступна только байтовая форма.
4. Набор реализует **32 базовых опкода**, immediate-семейство LIT и корректно
   применяет флаги `SHORT (0x80)`, `RETURN (0x40)`, `KEEP (0x20)`.

