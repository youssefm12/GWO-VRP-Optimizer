# 🎨 3D Route Visualization

## Overview

The VRP Optimizer now includes a powerful 3D visualization mode that provides an immersive view of your vehicle routing solutions. The 3D view uses React Three Fiber and Three.js to render an interactive 3D scene with smooth animations and real-time controls.

## Features

### 🎯 Core Visualization

- **3D Depot Marker**: Red building with animated roof that bounces on hover
- **Customer Markers**: Blue pin markers with hover tooltips showing customer ID and demand
- **Route Paths**: Smooth curved lines in the 3D space with height representing distance/complexity
- **Animated Vehicles**: 3D truck models that follow routes during animation playback
- **Grid Floor**: Optional grid floor with customizable visibility
- **Dynamic Lighting**: Ambient, directional, and point lights with optional shadow casting

### 🎮 Interactive Controls

#### Camera Controls
- **Orbit**: Left-click and drag to rotate around the scene
- **Pan**: Right-click and drag to pan the camera
- **Zoom**: Mouse wheel to zoom in/out
- **Damping**: Smooth, physics-based camera movement

#### Camera Presets
Quick camera position shortcuts:
- **Default View**: Isometric perspective (60, 40, 60)
- **Top View**: Bird's eye view from above
- **Side View**: Side profile view
- **Front View**: Front-facing view

#### View Options
Toggle these features in real-time:
- **Grid Floor**: Show/hide the ground grid
- **Labels**: Enable/disable hover tooltips
- **Shadows**: Toggle shadow rendering for performance
- **Camera Mode**: Switch between Perspective and Orthographic projection

### 📊 Performance Stats

Real-time performance monitoring:
- **FPS Counter**: Current frames per second
- **Renderer Info**: WebGL details
- **Device Pixel Ratio**: Display quality metric
- **Performance Tips**: Automatic suggestions for optimization

### 🎨 Visual Features

- **Color-Coded Routes**: Each vehicle route has a unique color matching the 2D view
- **Smooth Animations**: Route drawing and vehicle movement animations
- **Glowing Effects**: Routes have a subtle glow effect
- **Interactive Highlighting**: Hover over markers for emphasis
- **Seamless Transitions**: Smooth fade between 2D/3D views

## Usage

### Switching Views

Click the **3D View** button in the center toggle at the top of the map to switch from 2D to 3D mode. The transition is animated and seamless.

### Navigating the Scene

1. **Rotate**: Click and drag with left mouse button
2. **Pan**: Click and drag with right mouse button  
3. **Zoom**: Use mouse wheel or trackpad pinch
4. **Quick Views**: Click camera preset buttons in the bottom-left

### Controlling Visibility

Use the controls panel in the top-right to:
- Toggle grid visibility
- Enable/disable labels
- Turn shadows on/off
- Switch camera projection modes

### Viewing Performance

Click the **Show Stats** button in the bottom-right to monitor:
- Current FPS
- Renderer information
- Performance optimization tips

## Technical Details

### Architecture

```
MapView3D.tsx          - Main 3D component
├── Scene3D            - Core 3D scene setup
├── DepotMarker        - 3D depot building
├── CustomerMarker     - Customer pin markers
├── Route3D            - 3D route paths
├── AnimatedVehicle    - Moving truck models
├── GridFloor          - Ground grid
└── CameraController   - Smooth camera transitions

View3DControls.tsx     - Control panel UI
CameraPresets.tsx      - Quick camera positions
Scene3DStats.tsx       - Performance monitoring
Scene3DLoader.tsx      - Loading screen
```

### Performance Optimization

The 3D view is optimized for performance:
- **Instanced Geometries**: Efficient rendering of multiple objects
- **Dynamic LOD**: Simplified geometries for distant objects
- **Shadow Maps**: Configurable shadow quality
- **FPS Monitoring**: Real-time performance feedback
- **Smart Culling**: Only render visible objects

### Height Mapping

Routes in 3D have height variation based on distance from the depot:
```typescript
height = distance * 2
```
This creates a visual representation where longer routes arc higher in the 3D space.

## Browser Compatibility

The 3D visualization requires:
- WebGL 2.0 support
- Modern browser (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+)
- Hardware acceleration enabled

### Fallback

If WebGL is not available, the application automatically falls back to the 2D view.

## Tips

1. **Performance**: Disable shadows if experiencing low FPS
2. **Clarity**: Use Top View preset for a clean overview
3. **Details**: Hover over markers to see customer information
4. **Animation**: Watch route animations in 3D for better understanding
5. **Export**: Use camera presets to capture consistent viewpoints

## Keyboard Shortcuts

While 3D controls are primarily mouse-based, you can:
- Press `Esc` to reset camera to default position
- Use arrow keys with OrbitControls for fine-tuned rotation

## Future Enhancements

Potential additions:
- VR/AR support
- Route comparison overlay
- Time-of-day lighting
- Weather effects
- Terrain elevation data
- Screenshot/video export
- Measurement tools
- Route difficulty indicators

## Troubleshooting

### Low FPS
1. Disable shadows in controls
2. Reduce number of customers
3. Close other GPU-intensive applications

### Graphics Artifacts
1. Update graphics drivers
2. Enable hardware acceleration in browser
3. Try a different browser

### Controls Not Working
1. Ensure WebGL is enabled
2. Check browser console for errors
3. Refresh the page

## Credits

Built with:
- **React Three Fiber**: React renderer for Three.js
- **Three.js**: 3D graphics library
- **@react-three/drei**: Useful helpers for R3F
- **Motion**: Animation library (formerly Framer Motion)
