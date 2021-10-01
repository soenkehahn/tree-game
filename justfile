ci:
  yarn
  yarn run tsc
  yarn run jest --forceExit

bundle:
  mkdir -p dist
  cp src/frontend/index.html dist/
  cp graph.dot dist/
  yarn run esbuild --bundle src/frontend/index.tsx --outfile=dist/index.js

serve:
  (cd dist && python3 -m http.server 8080)

watch-tsc:
  yarn run tsc --watch

watch-tests *args:
  yarn run jest --watch --forceExit {{args}}

render-graph:
  dot -Tpdf graph.dot > graph.pdf
