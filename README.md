# Portfolio

Personal portfolio of ALBANO — a single-screen concept homepage built around an interactive inverted-lens cursor effect.

## Features

- Interactive Hero with spring-followed inverted lens, motion-driven stretch, idle breathing, and edge-bleed behavior
- Front face (ES) / inverted face (中文) flip card
- Keyboard, hover, and reduced-motion accessible

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- CSS Modules
- Tailwind CSS 4

## Getting Started

Requires Node.js 24 or higher.

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Check & Build

```bash
npm run check
```

Runs ESLint, TypeScript type-check, and a production build in sequence.

## Structure

```text
src/app/          Page entry, root layout, and global styles
src/components/   Page components
src/data/         Works and experience data
public/           Static assets
```

## License

[MIT](./LICENSE) © ALBANO
