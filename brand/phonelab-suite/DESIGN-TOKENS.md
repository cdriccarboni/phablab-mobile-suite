# PHONELAB SUITE — Design Tokens

## Typography

- Primary family: system UI / SF Pro on Apple platforms / Roboto on Android through system fallback.
- Headings: strong weight, compact line height.
- Body: comfortable line height.
- Numeric measurements: tabular/monospaced-capable styling where useful.

## Shape

- Small control radius: 12px
- Standard control radius: 15px
- Card radius: 20–22px
- Large stage radius: 28–32px

## Spacing

Base unit: 4px.

Preferred scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48

## Interaction

- Minimum touch target: 44×44 CSS px.
- Focus state must remain visible.
- Loading state must not look like success.
- Disabled state must preserve readable contrast.

## Semantic theme tokens

--pl-bg
--pl-surface
--pl-surface-strong
--pl-text
--pl-text-muted
--pl-border
--pl-accent
--pl-accent-contrast
--pl-success
--pl-warning
--pl-danger

Each product may override --pl-accent while retaining the family structure.
