# Phonelab Suite — Migration Architecture

## Current source of truth

cdriccarboni/phablab-mobile-suite is the historical migration source. The .split/ directories are intended as application extraction roots.

## First extraction target

PhabLabPhone → .split/phablabphone

A dedicated split already exists and contains its own package.json, Capacitor configuration, source files, tests, app-specific AGENTS.md and migration provenance.

## Important audit finding

The split is structurally separate, but the current PhabLabPhone source still requires a careful dependency/content audit before it can be declared a clean standalone product.

In particular, src/apps.tsx imports a large collection of shared logic and UI helpers. The fact that AppRouter currently returns the PhabLabPhone screen does not by itself prove that all imported code is product-specific.

Therefore extraction must be dependency-traced, not copied blindly.

## Target architecture

Each product gets its own repository and Android application identity. The legacy repository remains until every extraction has been verified.

## Completion gate

1. Repository exists.
2. Product source is isolated.
3. No imports from another product's application source.
4. Tests pass.
5. Web/PWA build passes when applicable.
6. Android build passes.
7. Package ID is verified.
8. Store metadata is product-specific.
9. Privacy/data-safety statements match actual behaviour.
10. Legacy source remains recoverable.

Never delete the legacy source merely because an export exists.
