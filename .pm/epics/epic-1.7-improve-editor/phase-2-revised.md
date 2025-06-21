# **Plan: Editor Experience Overhaul (Phase 2, Final Revision)**

**Objective**: A zero-tolerance, root-and-branch overhaul of the editor to fix all outstanding UI, UX, and architectural failures. The previous plan was insufficient. This is the definitive roadmap to a production-quality, Notion-like editor.

---

## **Strike 1: Total CSS Overhaul & Cleanup**

**Goal**: Eradicate all styling issues: obnoxious highlights, incorrect colors, and massive spacing.
**File**: `features/editor/styles/editor.css`

### **Actions**:
1.  **De-duplicate & Consolidate**:
    -   Action: Find all repeated rules for `::selection`, `*:hover`, and `.placeholder`.
    -   Implementation: Remove the redundant rules and consolidate them into a single, authoritative source at the top of the file to eliminate conflicts.

2.  **Fix Header Spacing**:
    -   Action: The `margin-top: 1.5em` on headings is creating huge gaps.
    -   Implementation: Change this value to a more balanced `0.8em` for `h1` and scale it down for `h2`, `h3`, etc.

3.  **Force Correct Placeholder Color**:
    -   Action: The default browser heading color is overriding the placeholder's muted color.
    -   Implementation: Create a new, high-specificity rule to force the color.
    ```css
    .ProseMirror :is(h1, h2, h3, h4, h5, h6)[data-placeholder]::before {
      color: hsl(var(--muted-foreground));
    }
    ```

4.  **Fix Block Handle & Bubble Menu Styles**:
    -   Action: The green accent color is still used for hover states. The `code` icon in the bubble menu is misaligned.
    -   Implementation:
        -   Target the `button` elements within `block-handle.tsx` and explicitly set their `hover:bg` to `hsl(var(--muted))`.
        -   Add `display: flex` and `align-items: center` to the `Toggle` component in `editor-bubble-menu.tsx` to fix the icon alignment.

---

## **Strike 2: Perfecting Placeholders & Block Interactions**

**Goal**: Fix the logical failures in placeholder visibility, block handle alignment, and post-action editor state.
**Files**: `features/editor/extensions/placeholder.ts`, `features/editor/components/block-handle-container.tsx`

### **Actions**:
1.  **Fix Generic Placeholder Logic**:
    -   Action: The `"Write, press 'space'..."` placeholder only appears on a totally blank document. It must appear on *any* empty new line.
    -   Implementation: In `placeholder.ts`, modify the `getPlaceholderText` function. Remove the `editor.state.doc.content.size === 2` check and instead show the generic placeholder for any `paragraph` node that is a direct child of the `doc` and is empty.

2.  **Fix Block Handle Vertical Alignment**:
    -   Action: The handle aligns to the top of the block, not its center.
    -   Implementation: In `block-handle-container.tsx`:
        -   Use a `useRef` on the handle `div` to get its height.
        -   Update the `top` calculation to be: `top = blockRect.top - editorRect.top + (blockRect.height / 2) - (handleRef.current.offsetHeight / 2)`. This will achieve perfect vertical centering regardless of block or handle size.

3.  **Fix New Block Focus**:
    -   Action: Creating a new block does not reliably focus the editor on it.
    -   Implementation: In `block-handle-container.tsx`, update the `handleAddBlock` function's command chain. After inserting the new paragraph, add `.setTextSelection(endPos + 1)` to explicitly move the cursor into the new empty block.

4.  **Fix Erratic Handle Behavior**:
    -   Action: The `mousemove` logic is architecturally unsound.
    -   Implementation: I will re-architect the handle to be CSS-driven.
        -   Each block node will get a `position: relative` in the CSS.
        -   The `BlockHandleContainer` will still use a portal, but instead of tracking the mouse, it will be positioned relative to the `activeBlock.dom` element. The hover effect will be handled by CSS (`.ProseMirror > *:hover .block-handle-wrapper { opacity: 1; }`), which is more reliable and performant.

---

## **Strike 3: Final Polish**

**Goal**: Clean up any remaining minor issues and ensure the editor feels complete.

### Actions:
1.  **Review and Verify**:
    -   Action: Systematically go through every point of user feedback and verify that the implemented solution is working correctly in a real-world scenario.
    -   Checklist:
        -   [ ] Placeholders on new lines?
        -   [ ] All placeholder text is light grey?
        -   [ ] Block handle hover is subtle grey?
        -   [ ] Block handle is vertically centered?
        -   [ ] Block handle is stable and does not flicker?
        -   [ ] New blocks are focused correctly?
        -   [ ] Header spacing is reasonable?
        -   [ ] Bubble menu icons are aligned?
        -   [ ] Slash command highlight is subtle grey?
        -   [ ] Slash command hover bug is fixed? 