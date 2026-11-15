# Builds idle.png and run.png from the loose frames in idle-src/ and run-src/
# (all on the same 1024x687 canvas with the feet on the same row). Run from art/samu/anim.
from PIL import Image
CANVAS_W = 1024
# Idle: guard (pause), reach for the dumbbell, two slow curls, put it back.
# curl-down / curl-up are the same picture except the curling arm, so nothing else moves.
IDLE = ['pose-1', 'pose-2', 'curl-down', 'curl-down', 'curl-up', 'curl-up', 'curl-down', 'curl-down',
        'curl-up', 'curl-up', 'curl-down', 'pose-2']
RUN = [1, 2, 4, 3]
def strip(paths, out):
    frames = [Image.open(p).convert('RGB') for p in paths]
    s = Image.new('RGB', (CANVAS_W * len(frames), frames[0].height), (255, 0, 255))
    for i, f in enumerate(frames): s.paste(f, (i * CANVAS_W, 0))
    s.save(out)
strip([f'idle-src/{p}.webp' for p in IDLE], 'idle.png')
strip([f'run-src/run-{p}.webp' for p in RUN], 'run.png')
