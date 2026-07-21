# Provenance

## Generation record

- Local production date: July 20, 2026, America/New_York (EDT, UTC−04:00).
- Project: Resilience Coach, OpenAI Build Week 2026 Education track.
- Art-direction and production orchestrator: GPT-5.6.
- Rendering tool: OpenAI built-in image-generation tool. The underlying rendering model name was not surfaced by the tool, so no more specific model claim is made.
- Post-processing: local Pillow-based sRGB crop, resize, WebP conversion, metadata stripping, contact-sheet assembly, and SHA-256 calculation.
- Transparent motif extraction: the installed OpenAI image-generation skill chroma-key removal helper, using a generated flat magenta background, soft matte, and despill.

The artwork was generated specifically for Resilience Coach during the Build Week project period. No external stock illustration, copyrighted character, franchise asset, commercial classroom-card system, or existing social-emotional curriculum artwork was used as an input. The three accepted local reference sheets were generated during this same production run and then used to maintain visual and character continuity.

## Prompt record

The visual system and major shared prompts are recorded in `art-direction/visual-system.md` and `art-direction/generation-prompts.md`. Each final manifest entry includes an asset-specific generation prompt summary. Production prompts consistently required warm editorial children’s gouache, paper-cut texture, strong silhouettes, grounded emotion, literal action, natural anatomy, no text, no logos, no reward imagery, and no copyrighted-character resemblance.

## Generated and processed files

- 52 accepted production illustrations were generated and preserved as final source masters.
- 1 additional magenta chroma-key source was retained for `small-progress-motif.png`, for 53 files under `source`.
- 52 web derivatives were created: 51 WebP images and 1 transparent PNG.
- 3 art-direction reference PNGs were generated.
- 3 JPEG contact sheets were assembled locally.
- Rectangular scenario, grown-up, and completion images were center-cropped to consistent 4:3 frames when needed and resized to 800×600.
- Brand derivatives were cropped and resized to their exact requested dimensions.
- Square card grids were cropped into individual 512×512 masters; three rejected cells were replaced with new standalone square generations.
- Web metadata was stripped during export. Manifest SHA-256 values cover the final `web_path` files.

## Regeneration record

Three picture-card cells were rejected during visual review and regenerated:

1. `calm-ready`: the grid cell read as an adult instead of a child.
2. `unsure`: the grid cell read as an adult instead of a child.
3. `press-hands-gently`: the first pose resembled prayer rather than literal horizontal palm pressure.

The accepted one-up replacements are the only versions exposed as final source and web assets. The rejected composite-sheet cells remain only in the tool’s generation history and are not copied into the project.

## Licensing and human review

The tool did not surface a rendering-model identifier or a separate per-image license statement. Human project owners should confirm the applicable OpenAI service terms for the account and event before external distribution. A human should also approve the final child-development, accessibility, safeguarding, and cultural review before real-world use with children.
