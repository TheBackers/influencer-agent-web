#!/bin/bash
set -e
cd /home/claude/mock-build && node build.mjs >/dev/null
cd /home/claude/web && npx @tailwindcss/cli -i /home/claude/mock-build/mock.css -o /home/claude/mock-build/out/app.css --minify 2>/dev/null
cd /home/claude/mock-build && python3 - <<'PY'
import re
css=open('out/app.css').read()
m=re.search(r'@media \(prefers-color-scheme:dark\)\{:root\{([^}]*)\}\}',css); body=m.group(1)
css=css.replace(m.group(0),'@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){'+body+'}}:root[data-theme="dark"]{'+body+'}')
old=open('mockup_v4.html').read()
head=old.split('<style>')[0]
extra=old.split('<style>')[1].split('</style>')[0]
extra=extra[extra.index('\n:root{--font-geist-sans'):]
js=open('out/app.js').read()
html=head+'<style>'+css+extra+'</style>\n<div id="root"></div>\n<script>'+js+'</script>\n'
open('mockup_v4.html','w').write(html)
open('test.html','w').write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>')
print(len(html))
PY
