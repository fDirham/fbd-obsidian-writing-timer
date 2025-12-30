# Idea

Have an icon on bottom right, along with word count, that looks like a timer. Pressing on it reveals a pop up to set writing session time. We press start and it counts down.

When done, the timer changes and takes note of number of words added in the current note.

## Questions

### Only one note?

Yes, a timer is localized per note

### How do we calculate number of words added?

Just a simple `end - start` words, so we need to track first and last

### How about FEATURE_IDEA

Out of scope for now, we'll focus just on getting the timer and getting this published.

# Working design

## How is pause implemented?

-   Every tick, we get `countdownMs` by minusing `endDate` with `nowDate`, `endDate` being set when we started timer
-   When paused, `countdownMs` is paused as well
-   We need to update `endDate` such that `newEndDate - nowDate` will equal `countdownMs`, so `newEndDate = nowDate + countdownMs`
