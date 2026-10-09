# SKILL: Сборка и тулинг

## Назначение

Сборка, запуск и настройка окружения проекта.

## Область

- `package.json`
- `tsconfig.json`
- `.gitignore`

## Ключевые факты

### package.json

- `"type": "module"` — проект на ESM (запуск через `node`, не `require`).
- `"main": "dist/src/index.js"`.
- Скрипты:

| Скрипт | Действие |
|--------|----------|
| `npm run build` | `tsc` — компиляция в `dist/` |
| `npm start` | `npm run build && node dist/examples/hello.js` |
| `npm run dev` | `tsc --watch` |
| `npm run clean` | `rm -rf dist` |

- devDependencies: `typescript` (`^5.6.0`), `@types/node`.

### tsconfig.json

- `module`/`moduleResolution`: `NodeNext` — **требует `.js` в импортах** при
  импорте `.ts`-файлов.
- `target`: `ES2022`.
- `strict: true`, `noEmitOnError: true`.
- `rootDir: "."`, `outDir: "dist"` — в `dist/` попадают `dist/src/*` и
  `dist/examples/*`.
- `types: ["node"]`, `include: ["src/**/*.ts", "examples/**/*.ts"]`.
- `.md`-файлы не компилируются (в `include` только `.ts`).

### Артефакты сборки

- `dist/` — результат `tsc` (в `.gitignore`).
- `node_modules/` — в `.gitignore`.

## Правила

- Все **относительные** импорты внутри `src/` и `examples/` указывают расширение
  `.js` (даже если файл `.ts`). Пример:
  `import { Uxn } from '../src/uxn-vm.js';`
- Импорт типов оформлять как `import type { ... }`, чтобы типы не попадали в
  рантайм и не создавали циклов.
- Не добавлять рантайм-зависимости без необходимости: интерпретатор
  самодостаточен.
- После изменений всегда прогонять `npm run build`.

## Проверка

```bash
npm install
npm run build            # без ошибок
node dist/examples/hello.js
```

Частые причины ошибок сборки: пропущенное расширение `.js` в импорте,
использование `require`, отсутствие `import type` для типов.

Связанные скилы: `project-overview`, `vm-core`.
