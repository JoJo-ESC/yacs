# Inconsistent Conflict Tags

## Description
On the schedule page, Conflict tags only show up next to big titles when they only have one section available. If a section has more than two sections and at least one conflicts, the tag doesn’t show up, which is not helpful for alerting purposes if the person has to click through all classes to find which one is causing the conflict

## Steps to Reproduce
1. Navigate to the browse page
2. Add two conflicting courses with only one section available
3. Navigate to the schedule page --> Observe the conflict tag appears for both courses next to the title(without clicking the dropdown arrow)
4. Go back to browse and add two conflicting courses with more than one section available
5. Back to schedule page, observe the conflict tag will not appear for either course


## Expected Behavior
Conflict tags show up at header for any course whose selected section conflicts with another

## Actual Behavior
Conflict tags only show up at header if only one section is possible

## Notes
This may be intentional. It is slightly inconvenient to the user however because they have to click through classes(using drop down icon) to find the conflict instead of the conflicted classes being highlighted on the surface.
See WeekScheduler.tsx line 270-278