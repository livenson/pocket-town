# Design reference

Copies of the artboards from the Pocket Town design canvas. They are written for a design tool's runtime and will not render on their own. Read them as a spec:

- Visual markup is inside `<x-dc>`; exact sizes, colours and radii are in inline styles.
- `{{name}}`, `<sc-for>` and `<sc-if>` are filled from the object returned by `renderVals()` in the `<script type="text/x-dc">` block at the bottom.
- `<dc-import name="Peg" ...>` renders `Peg.dc.html` with those props (same for `Icon`, `Diorama`, `Room`).

The two interactive prototypes hold the intended behaviour in their scripts:

- `Proto-Onboarding.dc.html`: first-time onboarding (splash → age → gate → profile → dice avatar → hooray → first play with hint chain).
- `Proto-House.dc.html`: the full house wizard (plot, shape, ready/decorate, rooms, walls and floors, furniture grid, move in, housewarming) with undo/redo.
