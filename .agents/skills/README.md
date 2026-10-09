# Skills

Каталог скилов проекта **vmjs** (виртуальная машина Uxn на TypeScript).
Каждый скил — это краткая инструкция для агента: что знать и как действовать
при работе над конкретной частью проекта.

## Состав

| Скил | Раздел проекта | Каталог скила |
|------|----------------|---------------|
| Обзор проекта | архитектура в целом | [`project-overview/SKILL.md`](./project-overview/SKILL.md) |
| Ядро ВМ | `src/uxn-vm.ts`, `src/stack.ts`, `src/uxn-types.ts` | [`vm-core/SKILL.md`](./vm-core/SKILL.md) |
| Опкоды | `src/opcodes/*` (базовые), `src/opcode-table.ts` | [`opcodes/SKILL.md`](./opcodes/SKILL.md) |
| Immediate-опкоды | `src/opcodes/immediate-ops.ts` (`LIT*`, `DEC`) | [`immediate-opcodes/SKILL.md`](./immediate-opcodes/SKILL.md) |
| Драйвер устройств | `src/Device.ts`, `src/ConsoleDevice.ts`, `src/uxn-types.ts` | [`driver-devices/SKILL.md`](./driver-devices/SKILL.md) |
| Сборка и тулинг | `package.json`, `tsconfig.json`, ESM | [`build-and-tooling/SKILL.md`](./build-and-tooling/SKILL.md) |
| Примеры | `examples/*` | [`examples/SKILL.md`](./examples/SKILL.md) |
| Стиль документации | все `README.md`, комментарии | [`docs-style/SKILL.md`](./docs-style/SKILL.md) |

## Как пользоваться

1. Определите, к какому разделу относится задача.
2. Прочитайте соответствующий `SKILL.md`.
3. Если задача затрагивает несколько разделов, начните с
   [`project-overview/SKILL.md`](./project-overview/SKILL.md), затем переходите к
   конкретным скилам.
4. Перед завершением задачи сверьтесь со скилом
   [`docs-style/SKILL.md`](./docs-style/SKILL.md) — он задаёт обязательные правила
   (в частности, политику по эмодзи).

## Формат скила

Каждый `SKILL.md` содержит:

- **Назначение** — зачем нужен скил.
- **Область** — какие файлы он покрывает.
- **Ключевые факты** — то, что нельзя забывать.
- **Правила** — что можно и что нельзя делать.
- **Проверка** — как убедиться, что изменение корректно.
