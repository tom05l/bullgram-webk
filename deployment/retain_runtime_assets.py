"""Retain public runtime bundles so open tabs can still lazy-load their release."""
from pathlib import Path
import shutil
base=Path('/opt/bullgram-webk')
out=base/'runtime-assets'
out.mkdir(mode=0o755,exist_ok=True)
count=0
for release in (base/'releases').iterdir():
    if not release.is_dir() or release.is_symlink():
        continue
    for source in release.iterdir():
        if not source.is_file() or source.is_symlink() or source.suffix not in {'.js','.css','.wasm','.map'}:
            continue
        target=out/source.name
        if not target.exists():
            shutil.copyfile(source,target)
            target.chmod(0o644)
            count+=1
print('Retained runtime assets:',count)
