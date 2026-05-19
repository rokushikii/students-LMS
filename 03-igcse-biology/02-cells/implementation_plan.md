# Implementation Plan - 3D Cell Explorer Bug Fixes & Realism Overhaul

This plan addresses the four major issues reported in the 3D Interactive Cell Explorer and proposes structural and visual fixes.

## 1. Organelle Visual Realism
**Issue**: The procedurally generated organelles look too basic and abstract.
**Proposed Fixes**:
- **Mitochondria**: Instead of a simple oval and wavy cylinder, we will use a refined `SphereGeometry` scaled into a capsule and build the inner `cristae` using a series of overlapping, angled `PlaneGeometries` to realistically mimic the folded inner membrane.
- **Chloroplasts**: We will use heavily smoothed, flattened spheres (discs) and generate distinct stacks of `CylinderGeometry` coins (thylakoids/grana) interconnected by lamellae.
- **Nucleus**: We will add distinct nuclear pores (small scattered spheres on the surface) and a clearly defined nucleolus.
- **Golgi Apparatus & ER**: We will add the missing Golgi apparatus to the Animal Cell using stacked, curved `TorusGeometry` segments to represent the cisternae.
- **Cell Wall**: We will use rounded box geometries or add beveling to make the plant cell boundaries look more organic and less rigid.

## 2. Clipping Plane Cutout Issue
**Issue**: When isolating an organelle, the cutout appears inverted or shows an empty shell.
**Proposed Fixes**:
- **DoubleSide Rendering**: We will change the material side of all organelles to `THREE.DoubleSide` so that when the front is sliced off, the inside wall of the back half is rendered correctly instead of disappearing.
- **Normal Vector Correction**: We will dynamically calculate the clipping plane normal to always face the camera based on the current `OrbitControls` angle. This guarantees that the front half (the side blocking the user's view) is clipped away, perfectly revealing the cross-section.

## 3. Exploded View Failure
**Issue**: Sliding the exploded view slider does not move the organelles correctly.
**Proposed Fixes**:
- **Hierarchy Correction**: The current code applies the explosion math to the child `Mesh` (which has a local position of 0,0,0) rather than the parent `Group` (which has the actual world position). We will refactor `generatePlantCell` and `generateAnimalCell` to attach `userData.explodeVector` to the top-level **Group** of each organelle.
- **Math Update**: The slider will now translate the entire `Group` along its radial vector from the center of the cell.

## 4. Click vs. Rotate Conflict
**Issue**: Trying to rotate the camera triggers an organelle selection, locking the view.
**Proposed Fixes**:
- **Pointer Distance Tracking**: We will replace the native `click` event listener with a custom `pointerdown` and `pointerup` handler.
- By tracking the X/Y coordinates of the mouse on `down` and comparing them on `up`, we can easily distinguish between a **Drag** (distance > 5px, intended to rotate the camera) and a **Click** (distance < 5px, intended to select an organelle).

## Verification Plan
1. Launch the updated `index.html` file.
2. Drag to rotate the cell to verify that organelles are not accidentally selected.
3. Use the Exploded View slider to verify organelles move outward radially.
4. Click a Mitochondrion and verify that the clipping plane cleanly slices the front off, revealing the newly designed cristae folds inside.
