

## Plan: Persist Video Playback Position Across Slide Navigation

### Problem
Currently, `PptxCarousel` only renders the active slide. When you navigate away from a video slide, its `<video>` element is destroyed. Returning to it remounts a fresh video starting at 0:00.

### Solution
Render **all** slide renderers but only show the active one (using CSS visibility/display). This keeps video elements alive in the DOM, preserving their playback position.

### Changes

**`src/components/PptxCarousel.tsx`**:
- Instead of rendering only `visibleSlides[currentIndex]`, render all `visibleSlides` in a stack.
- Use `display: none` / `display: block` (or absolute positioning with visibility) to show only the active slide.
- Pass `isActive` based on whether the slide's index matches `currentIndex`.

**`src/components/SlideRenderer.tsx`**:
- No changes needed -- it already pauses video when `isActive` is false.

### Technical Detail
```text
Before:  <SlideRenderer slide={visibleSlides[currentIndex]} isActive={true} />

After:   {visibleSlides.map((slide, i) => (
           <div key={slide.index} style={{ display: i === currentIndex ? 'block' : 'none' }}
                className="w-full h-full">
             <SlideRenderer slide={slide} isActive={i === currentIndex} />
           </div>
         ))}
```

This is a minimal change -- one file, ~5 lines modified. All slide types (images, GIFs, Vimeo iframes, videos) benefit from DOM persistence.

