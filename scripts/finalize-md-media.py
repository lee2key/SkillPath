from pathlib import Path
import json,re,html,requests
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'artifacts/md-research'
dest=ROOT/'content/assets/md-basics'
page=(out/'epic.html').read_text(encoding='utf-8')
for tag in re.findall(r'<img\b[^>]*>',page):
    attrs=dict(re.findall(r'([\w-]+)="([^"]*)"',tag))
    if attrs.get('alt')!='Export': continue
    url=html.unescape(attrs['src'])
    r=requests.get(url,timeout=45);r.raise_for_status()
    (dest/'export-menu.png').write_bytes(r.content)
    manifest=json.loads((out/'media-manifest.json').read_text(encoding='utf-8'))
    manifest.append({'file':'export-menu.png','imageUrl':url,'credit':'Epic Games — Making a Sweater with Marvelous Designer','accessed':'2026-11-02'})
    (out/'media-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Saved export-menu.png')
