# CG VisualLab – Interactive Computer Graphics Algorithm Simulator

## 1. Project overview

CG VisualLab is an interactive educational simulator for foundational 2D rasterization and geometry algorithms, with a WebGL-powered 3D extension. Students can enter geometry, run an algorithm, inspect per-step calculations, and compare computed points with the rendered result.

## 2. Objectives

- Connect computer-graphics equations to visible raster output.
- Make algorithm state inspectable one iteration at a time.
- Demonstrate homogeneous-coordinate transformations and clipping decisions.
- Provide an interactive 3D viewport for spatial line algorithms and geometry.

## 3. Features

- Editable line and shape parameters with validation.
- DDA and generalized Bresenham line drawing.
- Midpoint circle pixels with eight-way symmetry.
- Translation, pivot-based rotation/scaling, reflection, and shear using 3×3 homogeneous matrices.
- Cohen–Sutherland endpoint outcodes, bitwise decisions, and intersection traces.
- Play, pause, previous, next, complete, reset, clear, and selectable playback speed where step controls are available.
- 2D point inspection and draggable line endpoints.
- Perspective 3D WebGL viewport with depth testing, XYZ axes, orbit, zoom, and point inspection.

## 4–5. Algorithms implemented: 2D

### DDA line drawing

Uses $steps=\lceil\max(|dx|,|dy|)\rceil$, increments $dx/steps$ and $dy/steps$, and plots each sample after rounding. The interface distinguishes floating-point samples from raster pixels. Complexity: $O(\max(|dx|,|dy|))$.

### Bresenham line drawing

Uses integer decision/error updates and supports all octants and reversed endpoints. Inputs are normalized to integer pixel endpoints. Complexity: $O(\max(|dx|,|dy|))$.

### Midpoint circle

Uses the midpoint decision parameter and eight-way symmetry to generate discrete pixels. The current and next decision values and symmetric coordinates are shown. Complexity: $O(r)$.

### 2D transformations

Uses 3×3 homogeneous matrices for translation, scaling, rotation, reflection about either axis or the origin, and X/Y shear. The active composite matrix and per-operation point trace are displayed. Pivoted operations use the explicit order $T(tx,ty)T(pivot)RTST(-pivot)$ with the selected reflection and shear matrices included in the composition. For $n$ vertices, the point pipeline is $O(n)$.

### Cohen–Sutherland clipping

Shows four-bit TOP/BOTTOM/RIGHT/LEFT outcodes, the bitwise AND result, selected edge, intersection equation, updated endpoint, and subsequent iteration. Work depends on the number of clipping iterations.

## 6–7. 3D advanced extension and graphics concepts

- **3D DDA:** samples a segment using the largest absolute direction difference and displays XYZ increments and voxels.
- **3D Bresenham:** uses major-axis stepping and two error terms to rasterize 3D line segments.
- **3D transformations:** transforms cube vertices with translation, rotation, and scaling and shows original/transformed coordinates.
- **3D clipping:** clips a segment to an axis-aligned volume using six region planes.
- **WebGL rendering:** perspective projection, depth buffer, vertex geometry, directional diffuse lighting, orbit camera, and zoom.

## 8. Technology stack

- React 19 and JavaScript ES modules
- Vite
- HTML Canvas WebGL API
- Oxlint

## 9. System architecture

Algorithm functions in `src/algorithms/` return computed step data. React pages own inputs, validation, step index, and displayed calculations. Shared controls and calculation/table components present that data. `CanvasGrid` renders the 2D XY plane; `AlgorithmScene3D` renders the 3D scene through WebGL.

## 10. Project structure

```text
src/
├── algorithms/       # 2D and 3D algorithm computations
├── components/       # Canvas, WebGL scene, controls, panels, tables
├── pages/            # 2D workbench and 3D scene lab
├── App.jsx
├── index.css
└── main.jsx
public/               # Project branding assets
```

## 11. Installation

Requires Node.js 22 or a compatible current LTS release and npm.

```sh
npm install
```

## 12. Running the project

```sh
npm run dev
```

Create a production build with `npm run build`; check source with `npm run lint`.

## 13. Algorithm explanations

The simulator exposes each algorithm’s current iteration values next to its visualization. The line rasterizers distinguish the mathematical sample/decision state from the integer pixels drawn. The transformation panel shows the composite matrix and intermediate coordinates. Clipping shows the endpoint regions, bitwise decision, intersection, and updated outcode.

## 14. Screenshots



## 15. Results

A successful run produces per-step values and a visualization driven by the same computed algorithm result. 2D raster output uses integer pixel coordinates; the 3D viewport uses depth-tested WebGL geometry.

## 16. Limitations

- Rasterization and clipping operate on finite coordinates; the UI limits line coordinates to a safe range.
- 2D visualization uses a fixed logical grid scale.
- WebGL availability and performance depend on the browser/device.
- Timing comparisons are not reported; complexity descriptions are theoretical.

## 17. Future enhancements

- Broader automated algorithm edge-case coverage.
- Exportable calculation traces and user-selected polygon input.
- More accessible keyboard controls and configurable animation timing across all views.

## 18. Viva questions

1. How does DDA choose its number of samples?
2. Why does Bresenham avoid floating-point increments?
3. How does the midpoint decision select circle pixels?
4. Why are homogeneous coordinates useful for composing transformations?
5. How does pivot rotation use translations around the rotation matrix?
6. What does a nonzero bitwise AND of Cohen–Sutherland outcodes mean?
7. What role does the depth buffer play in the 3D viewport?
8. How does perspective projection differ from an orthographic projection?

## 19. Author information

**Author:** Add the project author’s name and institution here.

**Project:** CG VisualLab – Interactive Computer Graphics Algorithm Simulator
