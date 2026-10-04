# PHONELAB SUITE — App Identity Rules

Every autonomous application receives:

- its own repository
- its own application/package identity
- its own icon
- its own store listing
- its own version and release notes
- its own tests
- its own screenshots

It may consume shared Phonelab design tokens, but must not consume another product's application logic.

## Product lockup

Preferred hierarchy:

PHONELAB SUITE
PRODUCT NAME

The product name is the dominant product identifier. The suite label is the family signature.

## Migration rule

A product is autonomous only when its source can be built and tested without importing another product's application source.

Shared code must be explicitly classified as design system, generic utility, or infrastructure. Anything product-specific stays in that product repository.

## Anti-mixing rule

Do not solve a missing dependency by copying the entire monorepo source tree. Perform dependency tracing and extract only the required product code.
