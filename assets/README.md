# Resilience Coach illustration library

This folder contains the original child-facing illustration system for Resilience Coach, an adult-guided resilience practice application for children ages 6–8.

## Inventory

- 52 final production illustrations in `source` and matching optimized files in `web`.
- 1 retained chroma-key generation source for the transparent progress motif, making 53 image files under `source`.
- 3 art-direction reference images: style board, character reference sheet, and expression reference sheet.
- 3 QA contact sheets.
- A 52-entry `manifest.json` with paths, dimensions, alt text, prompts, provenance fields, and SHA-256 hashes.

## Folders

- `art-direction`: visual-system specification, prompt record, and accepted reference sheets.
- `source`: highest-quality accepted generated masters and the retained motif extraction source.
- `web`: production derivatives organized by brand, scenarios, cards, grown-up co-practice, and completion.
- `contact-sheets`: flagship sharing review, picture-card thumbnail review, and complete-library review.
- `qa`: final validation report.

## Production use

Use files under `web` in the application. Rectangular scenes are WebP, square picture cards are WebP, and the small progress motif is a transparent PNG. Text and controls must remain in accessible HTML; the illustrations intentionally contain no written labels.

The pictures are meaning-bearing supports, not decoration. Keep their associated alt text from `manifest.json`, preserve the intended crop, and do not recolor individual assets in ways that break scenario continuity.

## Important boundaries

These illustrations cover ordinary, non-dangerous setbacks only. They are not clinical diagrams, therapy content, diagnostic material, or crisis guidance. Trusted grown-ups are depicted as nearby and non-controlling. No image promises that a difficult feeling disappears or that another child immediately cooperates.
