from pathlib import Path
import subprocess,tarfile,shutil,json
root=Path(__file__).resolve().parents[1];release=root/'release'
if release.exists():shutil.rmtree(release)
release.mkdir()
# Match upstream's retained public assets, then overlay this build's compiled modules.
for p in (root/'public').iterdir():
 if p.is_dir():shutil.copytree(p,release/p.name)
 elif p.suffix in ('.xml','.webmanifest','.hbs') or p.name=='version' or 'Worker.min.' in p.name or p.name=='recorder.min.js':shutil.copy2(p,release/p.name)
shutil.copytree(root/'dist',release,dirs_exist_ok=True)
source=release/'source';source.mkdir()
shutil.copy2(root/'LICENSE',source/'LICENSE.txt')
(source/'NOTICE.txt').write_text('Bullgram WebK: adapted from Telegram Web K by Eduard Kuzmenko and contributors, GPLv3.\nUpstream: https://github.com/morethanwords/tweb\nPinned commit: 8197da75 (API layer 229).\nChanges: Bullgram domain, server RSA public key, WebSocket endpoint, branding, bridge/deployment, minifier workaround, TCP stream reassembly, TGS MIME recognition.\nComplete corresponding source: bullgram-webk-source.tar.gz\nBuild: pnpm install --frozen-lockfile && pnpm build\n')
files=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
files += subprocess.check_output(['git','ls-files','--others','--exclude-standard','-z','--','src'],cwd=root).decode().split('\0')
files += ['.env.production.local']+[str(p.relative_to(root)) for p in (root/'deployment').glob('*') if p.is_file()]
with tarfile.open(source/'bullgram-webk-source.tar.gz','w:gz') as tar:
 for name in sorted(set(files)):
  if name and (root/name).is_file():tar.add(root/name,arcname='bullgram-webk/'+name,recursive=False)
with tarfile.open(root/'reports/release.tar.gz','w:gz') as tar:
 for p in release.iterdir():tar.add(p,arcname=p.name)
print('Release packaged with corresponding GPLv3 source.')
