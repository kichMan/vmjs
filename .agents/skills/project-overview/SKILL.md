# SKILL: Обзор проекта

## Назначение

Быстро погрузить агента в архитектуру проекта **vmjs** — реализации виртуальной
машины Uxn на TypeScript. Это отправная точка для любой задачи.

## Область

Весь проект.

## Ключевые факты

- **Что это:** интерпретатор стековой виртуальной машины Uxn (Hundred Rabbits).
- **Язык:** TypeScript (строгий режим), модули ESM (`"type": "module"`).
- **Зависимостей в рантайме нет**: только `typescript` и `@types/node` как dev.
- **Опкоды:** 32 базовых слота `0x00..0x1f` + семейство `LIT*`.

### Карта модулей

| Модуль | Роль |
|--------|------|
| `src/uxn-types.ts` | Единый источник типов и контрактов (`Device`, `OpcodeFlags`, `Stack`, `VMState`, `OpcodeFn`). Разрывает цикл зависимостей. |
| `src/Device.ts` | Совместимый реэкспорт `Device` из `uxn-types.ts`. |
| `src/stack.ts` | Хелперы стеков: `pushByte/popByte/peekByte`, `pushShort/popShort/peekShort`, `getStack`. |
| `src/uxn-vm.ts` | Класс `Uxn implements VMState`: состояние, `run(pc)`, диспетчер `executeOp`. |
| `src/opcode-table.ts` | Таблица `OPCODE_TABLE` (ключ — базовый опкод `0x00..0x1f`). |
| `src/opcodes/*` | Реализация опкодов по группам (см. скил `opcodes`). |
| `src/opcodes/immediate-ops.ts` | `LIT/LIT2/LITr/LIT2r` (см. скил `immediate-opcodes`). |
| `src/ConsoleDevice.ts` | Пример устройства вывода в консоль (см. скил `driver-devices`). |
| `src/index.ts` | Публичный API (баррель). |
| `examples/hello.ts` | Пример запуска ВМ (см. скил `examples`). |

### Направление зависимостей (важно)

```
uxn-types.ts  <--  stack.ts
      ^              ^
      |              |
   opcodes/*  -->  opcode-table.ts  -->  uxn-vm.ts  -->  index.ts
```

Циклов быть не должно. `opcodes/*` и `Device` зависят только от **типов**
(`VMState`), а не от класса `Uxn`.

### Поток исполнения

`Uxn.run(pc)` читает байт из `ram[pc]`, увеличивает PC, вызывает `executeOp`,
который:
- для `baseOp === 0x00` (и `op !== 0x00`) уходит в `opImmediate`;
- иначе берёт обработчик из `OPCODE_TABLE[baseOp]`.

Обработчик возвращает новый PC либо `null` (для `BRK` — остановка).

## Правила

- Не вводить цикл зависимостей: опкоды и устройства не импортируют класс `Uxn`.
- Не изменять поведение опкодов без явного запроса: проект придерживается канона
  Uxn.
- Импорты внутри `src/` указывают расширение `.js` (требование NodeNext).
- Держать типы в `uxn-types.ts`, а не разбрасывать по модулям.

## Проверка

```bash
npm run build      # tsc должен пройти без ошибок
node dist/examples/hello.js   # пример печатает "Hello"
```

Связанные скилы: `build-and-tooling`, `vm-core`, `opcodes`.
