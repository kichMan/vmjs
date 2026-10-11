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
    stack-ops.ts     INC POP NIP SWP ROT DUP OVR STH
    flow-ops.ts      BRK JMP JCN JSR
    mem-ops.ts       LDZ STZ LDR STR LDA STA
    dev-ops.ts       DEI DEO
    algebra-ops.ts   EQU NEQ GTH LTH ADD SUB MUL DIV AND ORA EOR SFT
    immediate-ops.ts LIT LIT2 LITr LIT2r
  ConsoleDevice.ts Пример устройства вывода в консоль
  index.ts         Публичный API библиотеки
examples/
  hello.ts         Пример запуска ВМ (выводит "Hello")
  README.md        Как устроен пример: API, зависимости и используемые опкоды
tests/
  canonical.test.mjs  Проверка канонического поведения опкодов (npm run test)
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

## Документация

- [`src/opcodes/README.md`](src/opcodes/README.md) — справочник всех опкодов с
  аналогиями на JavaScript и C и примерами на Uxntal.
- [`examples/README.md`](examples/README.md) — детальный разбор примера `hello.ts`:
  используемый API, зависимости и применяемые опкоды.

## Сборка и запуск

```bash
npm install
npm run build      # tsc -> dist/
npm start          # build + запуск примера examples/hello.ts
npm run dev        # tsc --watch
npm run test       # build + проверка канонического поведения опкодов
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
   `LITr`, `LIT2r`. Константы задаются напрямую (`LIT <byte>`).
2. **DEO — это `0x17`, а не `0x1d`.** `0x1d & 0x1f == 0x1d` — это `ORA`.
   (Исправлено в примере относительно исходного `main.ts`.)
3. **Остановка устройством.** Если `Device.deo()` возвращает `false`, опкод `DEO`
   возвращает `null` (как `BRK`), и `Uxn.run()` корректно завершается.
4. Набор реализует **32 базовых опкода** и immediate-семейство LIT, корректно
   применяет флаги `SHORT (0x80)`, `RETURN (0x40)`, `KEEP (0x20)` во всех опкодах.
5. **Immediate-опкоды `JCI`/`JMI`/`JSI`** (байты `0x20`/`0x40`/`0x60`) не
   реализованы: при их встрече выводится предупреждение в консоль.

