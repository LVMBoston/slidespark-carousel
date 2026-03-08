

## Issues Identified

1. **Swipe gesture zones block bottom controls**: The swipe zones (`z-30`, full height) cover the slide counter (`bottom-4`, no z-index), making it untappable.
2. **Swipe zones are narrow on image slides unnecessarily**: Image slides have no tap-to-play overlay conflict, so the 15% edge zones limit swipe area for no reason.

## Plan

### `src/components/PptxCarousel.tsx`

1. **Raise slide counter z-index**: Add `z-40` to the slide counter div so it renders above the `z-30` swipe zones.

2. **Shorten swipe zones to avoid bottom controls**: Change swipe zone height from `h-full` to `h-[85%]` so they don't cover the bottom area where the slide counter sits.

### `src/components/SlideRenderer.tsx`

No changes needed — the tap overlays are already correctly scoped to `video` and `vimeo` slide types only. The overlays do not affect image, gif, or link slides.

