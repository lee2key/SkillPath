import pathlib, requests, re, json, html
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/md-research'
DEST=ROOT/'content/assets/md-basics'
DEST.mkdir(parents=True,exist_ok=True)
url='https://dev.epicgames.com/documentation/fortnite/making-a-sweater-with-marvelous-designer-in-unreal-editor-for-fortnite'
r=requests.get(url,timeout=45);r.raise_for_status()
(OUT/'epic.html').write_text(r.text,encoding='utf-8')
imgs=re.findall(r'<img\b[^>]*>',r.text)
selected = {'Moving Garments':'move-garment','Simulation Button':'simulate','Edit Pattern':'edit-pattern','Unfold Symmetric Editing':'unfold','Segment Sewing':'segment-sewing','Connected Segments':'sewing-correct','Twisted Segments':'sewing-twisted','Extend Sleeves':'extend-sleeve','Check Sewing Length':'check-length','Edit Curvature':'edit-curvature','Internal Lines':'internal-lines','Internal Polygon/Line':'internal-tool','Library Garment':'library','Garment':'garment','Importing Avatar':'avatar','UV Packing':'uv-packing'}
manifest=[]
for tag in imgs:
    attrs=dict(re.findall(r'([\w-]+)="([^"]*)"',tag))
    name=selected.get(attrs.get('alt'))
    if not name: continue
    u=html.unescape(attrs['src'])
    rr=requests.get(u,timeout=45);rr.raise_for_status()
    ext={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp'}.get(rr.headers.get('Content-Type','').split(';')[0])
    if not ext: raise ValueError(rr.headers)
    file=name+ext
    (DEST/file).write_bytes(rr.content)
    manifest.append({'file':file,'title':attrs['alt'],'source':url,'imageUrl':u,'credit':'Epic Games — Making a Sweater with Marvelous Designer','accessed':'2026-11-02'})
    print(file,len(rr.content))
for name,aid in [('fabric-presets',47438811408409),('export-obj',47438235048217),('seam-types',47438733625881)]:
    u=f'https://support.marvelousdesigner.com/hc/article_attachments/{aid}'
    rr=requests.get(u,timeout=45);rr.raise_for_status()
    ext={'image/png':'.png','image/jpeg':'.jpg','image/gif':'.gif'}.get(rr.headers.get('Content-Type','').split(';')[0])
    if not ext: raise ValueError(rr.headers)
    (DEST/(name+ext)).write_bytes(rr.content)
    manifest.append({'file':name+ext,'imageUrl':u,'credit':'Marvelous Designer Help Center','accessed':'2026-11-02'})
    print(name,ext,len(rr.content))
(OUT/'media-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
