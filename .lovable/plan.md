

## Plan: Add swipe gesture zones to carousel

Add two vertical touch zones on the left and right edges of the carousel that detect horizontal swipe gestures to navigate between slides. These sit at `z-30` (above the `z-20` tap overlay) and are transparent, ~15% width strips on each side.

### Changes: `src/components/PptxCarousel.tsx`

1. Add touch state tracking (`touchStartX`, `touchEndX` via `useRef`)
2. Create `onTouchStart`/`onTouchEnd` handlers that detect left vs right swipe (threshold ~50px) and call `goToNext`/`goToPrevious`
3. Add two invisible `<div>` elements inside the carousel container:
   - Left zone: `absolute left-0 top-0 w-[15%] h-full z-30` with the touch handlers → swipe right triggers `goToPrevious`
   - Right zone: `absolute right-0 top-0 w-[15%] h-full z-30` with the touch handlers → swipe left triggers `goToNext`
4. Both zones are fully transparent and don't interfere with the tap-to-play overlay in the center

