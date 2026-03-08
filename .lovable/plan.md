

## Plan: Remove PPTX Support & Create Generic Types Module

### Files to Delete
- `src/components/PptxUploader.tsx`
- `src/lib/pptxParser.ts`

### Files to Create
- `src/types/slides.ts` — move all types from `src/types/pptx.ts` here, remove `ParsedPptx` and `PptxMetadata` (only used by the parser)

### Files to Delete (after migration)
- `src/types/pptx.ts`

### Files to Update (import path changes `@/types/pptx` → `@/types/slides`)
- `src/components/ZipUploader.tsx`
- `src/components/PptxCarousel.tsx`
- `src/components/SlideRenderer.tsx`
- `src/components/HotspotOverlay.tsx`
- `src/components/VimeoInput.tsx`
- `src/lib/downloadUtils.ts`
- `src/pages/Index.tsx` — also remove `PptxUploader` import, remove the PPTX collapsible section (lines 100–113), update page title/description to remove "PowerPoint" references

### No Other Impact
- `jszip` dependency stays (used by `ZipUploader`)
- Carousel, renderer, hotspots, share utils, download utils all remain intact

