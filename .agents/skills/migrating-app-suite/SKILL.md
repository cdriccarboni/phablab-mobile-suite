---
name: migrating-app-suite
description: Use when splitting a legacy multi-app suite into independent application repositories while preserving traceability and avoiding accidental feature mixing.
---

# Migrating App Suite

## Goal
Move each standalone app into a clean independent repository without losing source, history context, assets, buildability, or release identity.

## Workflow
1. Read the suite registry and identify one app at a time.
2. Locate all source, assets, manifests, docs, tests, and build files belonging to that app.
3. Detect shared code explicitly; copy or extract it intentionally rather than dragging unrelated sibling apps into the new repository.
4. Create a clean app identity: repository name, package/bundle identifier, versioning, README, license status, and CI.
5. Verify the standalone app builds and its main journey works before marking the migration complete.
6. Record the source suite path, destination repository, commit, artifact, and migration status.
7. Keep the legacy suite unchanged as a recovery source until every migrated app is verified.

## Guardrails
- Never mix two apps into one destination repository by convenience.
- Never archive/delete the legacy source before verified migration completion.
- Do not copy credentials, local paths, signing keys, or private account identifiers.
- New standalone repositories remain private unless publication is intentional.

## Completion contract
One migrated app = one verified destination repository + traceable source mapping + successful build evidence.
