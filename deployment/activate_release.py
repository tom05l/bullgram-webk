"""Run on the VPS after uploading a release archive; preserve public bundles for open tabs."""
from pathlib import Path
import hashlib,os,re,subprocess,sys,tarfile
base=Path('/opt/bullgram-webk')
name=sys.argv[1]
assert re.fullmatch(r'[a-zA-Z0-9-]+',name)
release=base/'releases'/name
assert not release.exists(), 'Release already exists; choose a new name'
release.mkdir(mode=0o755)
with tarfile.open(base/'releases'/(name+'.tar.gz'),'r:gz') as archive:
    archive.extractall(release,filter='data')
assert (release/'index.html').is_file()
for p in release.rglob('*'):
    if not p.is_symlink():p.chmod(0o755 if p.is_dir() else 0o644)
subprocess.run([sys.executable,str(base/'retain_runtime_assets.py')],check=True)
current=base/'current'
if current.is_symlink():
    (base/'backups'/('before-'+name+'.path')).write_text(os.readlink(current)+'\n')
pending=base/'current.next'
assert not pending.exists() and not pending.is_symlink()
pending.symlink_to(release)
os.replace(pending,current)
print('Activated',name,'index SHA256',hashlib.sha256((release/'index.html').read_bytes()).hexdigest())
