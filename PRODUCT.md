# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
People who keep their logins, bank cards, addresses and private notes on their own Windows or Linux desktop and want one place to find, copy and check them. (Inferred from README.md; not confirmed in an interview.)

## Product Purpose
Nexus Vault is a local, zero-knowledge desktop password manager. Success: the user unlocks with one master password, finds an entry in seconds, copies it, and knows which passwords are weak or reused.

## Positioning
Everything stays on the device: Argon2id + XChaCha20-Poly1305 in a Rust core, each record encrypted with its own context-bound AAD, no cloud account. (Source: CRYPTO_FORMAT_SPEC.md, ARCHITECTURE.md.)

## Operating Context
Desktop app (Tauri 2, WebView2 / WebKitGTK), window 900×600 minimum, 1200×800 default. Short, frequent visits: unlock, search, copy, lock. Occasional longer sessions: password check, import, settings.

## Capabilities and Constraints
- Item types: login, secure note, bank card, identity/address.
- Generator (password + passphrase), password check (weak / reused / old), folders, favourites, trash, auto-lock, clipboard clearing, master-password change.
- Not yet built: document scans, 2FA authenticator, breach check, real CSV import, encrypted export, browser extension, sync. Never present these as working.
- Strict CSP: no remote fonts, scripts or images.
- UI language: Spanish.

## Brand Commitments
- Name: Nexus Vault.
- User-pinned direction (2026-10-27): the ergonomics and feel of Kaspersky Password Manager — light and clean by default, green/teal accent, roomy layout, dark mode optional. Visual identity must stay original (README: "diseño ... 100% originales").

## Evidence on Hand
Mock vault data in `src/mock/vaultData.ts` (synthetic). No real users, testimonials, audits or benchmarks exist; do not invent them.

## Product Principles
1. Find and copy beats explore: search and copy are always one step away.
2. Security state is shown plainly, never as theatre.
3. Nothing leaves the device; the UI never implies otherwise.
4. Familiar desktop patterns over novelty.
