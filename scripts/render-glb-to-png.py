"""
Render GLB building models to isometric 512×512 transparent PNG sprites.
Run with: /Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/render-glb-to-png.py
"""
import bpy
import os
import sys
import math

# ── Config ─────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
GLB_DIR = os.path.join(PROJECT_DIR, 'src', 'assets', 'glb')
OUTPUT_DIR = os.path.join(PROJECT_DIR, 'src', 'assets', 'buildings')

SIZE = 512

RENDER_JOBS = [
    {'glb': 'Rathaus lvl1.glb', 'output': 'burg_level_1.png'},
    {'glb': 'Rathaus lvl2.glb', 'output': 'burg_level_2.png'},
]

# Isometric camera angles
ISO_ROTATION_Z = math.radians(45)       # 45° horizontal
ISO_ELEVATION = math.atan(1 / math.sqrt(2))  # ~35.264°
CAM_DISTANCE = 10


def setup_scene():
    """Clean scene and set up render settings."""
    # Delete everything
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    # Remove orphan data
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)

    # Render settings
    scene = bpy.context.scene
    scene.render.resolution_x = SIZE
    scene.render.resolution_y = SIZE
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True  # Transparent background
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.compression = 90

    # Use EEVEE for fast flat-shaded rendering
    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except TypeError:
        scene.render.engine = 'BLENDER_EEVEE'
    try:
        scene.eevee.taa_render_samples = 64
    except AttributeError:
        pass

    # Color management
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'

    return scene


def setup_camera(scene):
    """Create isometric orthographic camera."""
    cam_data = bpy.data.cameras.new('IsoCam')
    cam_data.type = 'ORTHO'
    cam_obj = bpy.data.objects.new('IsoCam', cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Position: isometric angle
    cam_obj.location = (
        CAM_DISTANCE * math.cos(ISO_ELEVATION) * math.sin(ISO_ROTATION_Z),
        -CAM_DISTANCE * math.cos(ISO_ELEVATION) * math.cos(ISO_ROTATION_Z),
        CAM_DISTANCE * math.sin(ISO_ELEVATION),
    )

    # Look at origin
    direction = cam_obj.location.copy()
    direction.negate()
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()

    return cam_obj, cam_data


def setup_lighting(scene):
    """Set up warm ambient + directional lighting."""
    # Sun light (main directional)
    sun_data = bpy.data.lights.new('SunLight', 'SUN')
    sun_data.energy = 3.0
    sun_data.color = (1.0, 0.98, 0.95)
    sun_obj = bpy.data.objects.new('SunLight', sun_data)
    scene.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (math.radians(50), math.radians(-15), math.radians(-30))

    # Fill light (softer, from opposite side)
    fill_data = bpy.data.lights.new('FillLight', 'SUN')
    fill_data.energy = 1.2
    fill_data.color = (0.95, 0.95, 1.0)
    fill_obj = bpy.data.objects.new('FillLight', fill_data)
    scene.collection.objects.link(fill_obj)
    fill_obj.rotation_euler = (math.radians(40), math.radians(20), math.radians(150))

    # World background (ambient)
    world = bpy.data.worlds.new('World')
    scene.world = world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    bg = None
    for n in nodes:
        if n.type == 'BACKGROUND':
            bg = n
            break
    if bg:
        bg.inputs[0].default_value = (0.85, 0.82, 0.78, 1.0)
        bg.inputs[1].default_value = 0.5


def fit_camera_to_model(cam_obj, cam_data, model_objects):
    """Auto-fit orthographic camera to the model bounding box."""
    # Calculate combined bounding box
    min_co = [float('inf')] * 3
    max_co = [float('-inf')] * 3

    from mathutils import Vector
    for obj in model_objects:
        if obj.type != 'MESH':
            continue
        for corner in obj.bound_box:
            world_co = obj.matrix_world @ Vector(corner)
            for i in range(3):
                min_co[i] = min(min_co[i], world_co[i])
                max_co[i] = max(max_co[i], world_co[i])

    if min_co[0] == float('inf'):
        # Fallback
        cam_data.ortho_scale = 4.0
        return

    size = [max_co[i] - min_co[i] for i in range(3)]
    max_dim = max(size)

    # Set ortho scale with padding
    cam_data.ortho_scale = max_dim * 1.4

    # Center camera on model center
    center = [(min_co[i] + max_co[i]) / 2 for i in range(3)]
    # Offset camera look-at to model center
    cam_obj.location.x += center[0]
    cam_obj.location.y += center[1]
    cam_obj.location.z += center[2]


def render_job(job, scene, cam_obj, cam_data):
    """Import GLB, fit camera, render, cleanup."""
    glb_path = os.path.join(GLB_DIR, job['glb'])
    output_path = os.path.join(OUTPUT_DIR, job['output'])

    if not os.path.exists(glb_path):
        print(f"⚠️  GLB not found: {glb_path}")
        return False

    # Backup existing PNG
    if os.path.exists(output_path):
        backup = output_path.replace('.png', '_backup.png')
        import shutil
        shutil.copy2(output_path, backup)
        print(f"📦 Backup: {job['output']} → {os.path.basename(backup)}")

    # Import GLB
    bpy.ops.import_scene.gltf(filepath=glb_path)

    # Get imported objects
    imported = [obj for obj in bpy.context.scene.objects
                if obj.type == 'MESH' and obj.name not in ('IsoCam', 'SunLight', 'FillLight')]

    if not imported:
        print(f"⚠️  No meshes in {job['glb']}")
        return False

    # Fit camera
    fit_camera_to_model(cam_obj, cam_data, imported)

    # Render
    scene.render.filepath = output_path
    bpy.ops.render.render(write_still=True)

    print(f"✅ {job['glb']} → {job['output']} ({SIZE}×{SIZE})")

    # Cleanup imported objects
    for obj in imported:
        bpy.data.objects.remove(obj, do_unlink=True)

    # Reset camera position
    cam_obj.location = (
        CAM_DISTANCE * math.cos(ISO_ELEVATION) * math.sin(ISO_ROTATION_Z),
        -CAM_DISTANCE * math.cos(ISO_ELEVATION) * math.cos(ISO_ROTATION_Z),
        CAM_DISTANCE * math.sin(ISO_ELEVATION),
    )

    return True


def main():
    print("\n🏰 FitRealm GLB → PNG Renderer")
    print("=" * 40)

    scene = setup_scene()
    cam_obj, cam_data = setup_camera(scene)
    setup_lighting(scene)

    success = 0
    for job in RENDER_JOBS:
        if render_job(job, scene, cam_obj, cam_data):
            success += 1

    print(f"\n🎉 {success}/{len(RENDER_JOBS)} renders complete!")


if __name__ == '__main__':
    main()
