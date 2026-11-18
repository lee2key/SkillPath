"""Collect public official reference pages for the course editorial review."""
import json, re, pathlib, concurrent.futures
import requests
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts' / 'md-research'
OUT.mkdir(parents=True, exist_ok=True)
BASE = 'https://support.marvelousdesigner.com/api/v2/help_center/en-us/'
sections = [47114858062233, 51986608298009, 51986755223705]
ids = [47358262924185,47358232630937,47358440962713,47358268602777,47358219651225,47358223288601]
def get(url):
    r = requests.get(url, timeout=45); r.raise_for_status(); return r.json()
articles = []
for sid in sections:
    articles.extend(get(BASE + f'sections/{sid}/articles.json?per_page=100')['articles'])
for aid in ids:
    articles.append(get(BASE + f'articles/{aid}.json')['article'])
for a in articles:
    (OUT / f"{a['id']}.json").write_text(json.dumps(a,ensure_ascii=False,indent=2),encoding='utf-8')
    media = re.findall(r'<(?:img|iframe)[^>]+src=[\"\x27]([^\"\x27]+)',a['body'])
    print(a['id'],a['title'],json.dumps(media))
