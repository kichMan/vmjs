# SKILL: Ядро виртуальной машины

## Назначение

Работа с состоянием ВМ, памятью, стеками и циклом исполнения.

## Область

- `src/uxn-types.ts`
- `src/stack.ts`
- `src/uxn-vm.ts`

## Ключевые факты

### Состояние (`VMState`)

| Поле | Тип | Размер |
|------|-----|--------|
| `stack` | `Stack` | 256 байт (рабочий стек данных) |
| `ret` | `Stack` | 256 байт (стек возвратов) |
| `ram` | `Uint8Array` | 65536 байт |
| `dev` | `Uint8Array` | 256 байт (порты устройств) |
| `device` | `Device` | подключённое устройство |

`Stack` — это `{ data: Uint8Array(256), index: number }`. `index` оборачивается
по модулю 256 (`& 0xff`), поэтому переполнение стека не бросает исключение.

### Флаги (`OpcodeFlags`)

| Флаг | Бит | Смысл |
|------|:---:|-------|
| `short` | `0x80` | 16-битные значения вместо 8-битных |
| `returnStack` | `0x40` | работать со стеком возвратов |
| `keep` | `0x20` | не снимать операнды, положить результат сверху |

`extractFlags(op)` в `uxn-vm.ts` строит `OpcodeFlags` из старших битов байта.

### Хелперы стеков (`stack.ts`)

- `pushByte/popByte/peekByte` — байтовые операции;
- `pushShort/popShort/peekShort` — 16-битные, порядок **big-endian**
  (`pushShort` кладёт старший байт первым);
- `getStack(vm, flags)` — выбирает `vm.ret` или `vm.stack` по флагу `returnStack`.

`peekByte/peekShort` не изменяют `index`.

### Цикл исполнения (`Uxn.run`)

```ts
run(pc: number): number {
    while (true) {
        const op = this.ram[pc];
        pc = (pc + 1) & 0xffff;
        const result = this.executeOp(op, pc);
        if (result === null) break;   // BRK
        pc = result;
    }
    return pc;
}
```

PC инкрементируется **до** вызова обработчика, поэтому относительные переходы
считаются от адреса следующей инструкции, а `BRK` возвращает PC за собой.

## Правила

- Любое адресное выражение маскировать: `& 0xffff` для PC/адресов, `& 0xff`
  для байтов и индексов стеков.
- 16-битные значения на стеке хранить в порядке big-endian.
- Не менять публичную сигнатуру `run(pc): number`.
- Новые типы добавлять только в `uxn-types.ts`.

## Проверка

```bash
npm run build
```

Быстрый smoke-тест: `INC` на пустом стеке даёт `1`, `LIT 0x41` кладёт `0x41`,
итоговый PC после `BRK` равен адресу за `BRK`.

Связанные скилы: `project-overview`, `opcodes`, `immediate-opcodes`.
