#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BUILD — Samuel Quest

Inlines the shared engine (assets/engine.css + assets/engine.js) and each
subject's data.js into ONE self-contained .html file per game, written to the
repo root.

Why: GitHub's drag-and-drop upload silently drops subfolders. A game that
depends on assets/engine.css renders unstyled the moment that happens. A single
file cannot half-upload.

The folders stay in the repo as the source of truth. The browser never needs
them.

Usage:
    python3 tools/build.py
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read(*parts):
    with open(os.path.join(ROOT, *parts), encoding="utf-8") as fh:
        return fh.read()

def write(name, text):
    path = os.path.join(ROOT, name)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)
    return len(text)

FAVICON = ("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' "
           "viewBox='0 0 16 16'><text y='14' font-size='14'>%F0%9F%8E%AE</text></svg>")

SPRITE = """<svg class="avatar avatar--lg avatar--bob" viewBox="0 0 17 20" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true">
      <path fill="#2b1a12" d="M4 1h9v2H4z M3 2h1v4H3z M13 2h1v4h-1z M4 2h9v2H4z"/>
      <path fill="#e8b088" d="M4 4h9v8H4z"/>
      <path fill="#141a33" d="M6 6h1v2H6z M10 6h1v2h-1z"/>
      <path fill="#8c4a3a" d="M6 10h5v1H6z M5 9h1v1H5z M11 9h1v1h-1z"/>
      <path fill="var(--accent)" d="M3 5h1v3H3z M13 5h1v3h-1z M3 4h11v1H3z"/>
      <path fill="var(--accent-2)" d="M5 12h7v6H5z M3 13h2v4H3z M12 13h2v4h-2z"/>
      <path fill="#fff" d="M8 14h1v3H8z M7 15h3v1H7z"/>
      <path fill="#1c2555" d="M5 18h3v2H5z M9 18h3v2H9z"/>
    </svg>"""


def split_css(css):
    """Pull the Google Fonts @import out so it can become a <link> in <head>.
    An @import inside an inlined <style> still works, but a <link> starts the
    font download earlier and survives stricter CSP setups."""
    m = re.search(r"@import\s+url\(([^)]+)\);", css)
    if not m:
        return None, css
    return m.group(1).strip("'\""), css.replace(m.group(0), "")


def head(title, description, font_href, css, accent):
    return (
        '<!DOCTYPE html>\n'
        '<html lang="en" data-accent="' + accent + '">\n'
        '<head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<title>' + title + '</title>\n'
        '<meta name="description" content="' + description + '">\n'
        '<link rel="icon" href="' + FAVICON + '">\n'
        + ('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
           '<link rel="stylesheet" href="' + font_href + '">\n' if font_href else '')
        + '<style>\n' + css + '\n</style>\n'
        '</head>\n<body>\n'
    )


def build_game(sub, css, font_href, engine):
    data = read("subjects", sub["slug"], "data.js")
    title = "Samuel Quest — " + sub["topic"]
    desc = sub["blurb"].replace('"', "&quot;")
    html = head(title, desc, font_href, css, sub.get("accent", "maths"))
    html += '<div id="app"></div>\n'
    html += '<script>\n' + data + '\n</script>\n'
    html += '<script>\n' + engine + '\n</script>\n'
    html += '</body>\n</html>\n'
    return sub["slug"] + ".html", html


HUB_BODY = """<div class="wrap">

  <header class="site-head">
    __SPRITE__
    <div>
      <h1>SAMUEL QUEST</h1>
      <p>Year 6 &middot; British International School &middot; Pick a game, clear one level a day.</p>
    </div>
  </header>

  <div class="pixel-box hud">
    <div class="hud__group"><span class="hud__stat">GAMES <b id="cnt">0</b></span></div>
    <div class="hud__group"><span class="hud__stat text-dim">5 levels &middot; ~30 min each</span></div>
  </div>

  <div class="levels" id="list"></div>

  <div class="pixel-box brief mt-lg">
    <h2>HOW TO PLAY</h2>
    <ul>
      <li><b>One level per day</b>, five days before the test. Each level is about 30 minutes.</li>
      <li>Read the <b>briefing</b> first &mdash; it teaches the method for that level.</li>
      <li>Answer with the mouse or the keyboard: <b>A B C D</b> or <b>1 2 3 4</b>.</li>
      <li>Get one wrong and it comes back later <b>with different numbers</b>, so you have to think it through again.</li>
      <li>Clear every challenge to finish the level and unlock the next one.</li>
      <li>Progress is saved in this browser. Replay any level to hunt for 3 stars.</li>
    </ul>
  </div>

  <footer>Samuel Quest &middot; built for Samuel</footer>
</div>

<script>
var SUBJECTS = __REGISTRY__;
(function () {
  var list = document.getElementById('list');
  document.getElementById('cnt').textContent = SUBJECTS.length;

  if (!SUBJECTS.length) {
    list.innerHTML = '<div class="pixel-box stage"><p>No games yet.</p></div>';
    return;
  }

  SUBJECTS.forEach(function (s) {
    var done = 0, stars = 0;
    try {
      var raw = localStorage.getItem('samuel-quest:' + s.slug);
      if (raw) {
        var st = JSON.parse(raw);
        Object.keys(st.levels || {}).forEach(function (k) {
          if (st.levels[k].done) done++;
          stars += st.levels[k].stars || 0;
        });
      }
    } catch (e) { /* storage blocked */ }

    var a = document.createElement('a');
    a.className = 'pixel-box level-card';
    a.href = s.slug + '.html';
    a.style.textDecoration = 'none';
    a.style.color = 'inherit';
    a.setAttribute('data-accent', s.accent || 'maths');
    if (done >= s.levels) a.classList.add('is-done');
    a.innerHTML =
      '<div class="level-card__num" style="font-size:11px">' + s.subject.slice(0, 4).toUpperCase() + '</div>' +
      '<div>' +
        '<div class="level-card__name">' + s.topic + '</div>' +
        '<div class="level-card__sub">' + s.blurb + '</div>' +
        '<div class="level-card__sub text-dim" style="margin-top:6px;font-size:13px">' +
          s.test + ' &middot; ' + s.levels + ' levels &middot; ' + done + '/' + s.levels + ' cleared</div>' +
      '</div>' +
      '<div class="stars">' + stars + '&#9733;</div>';
    list.appendChild(a);
  });
})();
</script>
</body>
</html>
"""


def main():
    css_raw = read("assets", "engine.css")
    font_href, css = split_css(css_raw)
    engine = read("assets", "engine.js")

    reg_src = read("subjects.js")
    m = re.search(r"window\.SUBJECTS\s*=\s*(\[.*?\]);", reg_src, re.S)
    if not m:
        sys.exit("could not parse subjects.js")
    # JS object literal -> JSON: quote the keys, drop trailing commas
    js = m.group(1)
    js = re.sub(r"//.*", "", js)
    js = re.sub(r"([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:", r'\1"\2":', js)
    js = re.sub(r",(\s*[}\]])", r"\1", js)
    subjects = json.loads(js)

    built = []
    for sub in subjects:
        name, html = build_game(sub, css, font_href, engine)
        built.append((name, write(name, html)))

    hub = head("Samuel Quest",
               "Samuel&#39;s revision arcade &mdash; one game per test, five levels each.",
               font_href, css, "maths")
    hub += (HUB_BODY
            .replace("__SPRITE__", SPRITE)
            .replace("__REGISTRY__", json.dumps(subjects, indent=2)))
    built.insert(0, ("index.html", write("index.html", hub)))

    print("Built self-contained files in the repo root:")
    for name, size in built:
        print("  %-42s %6.1f KB" % (name, size / 1024))
    print("\nUpload ONLY these files to GitHub. No folders required.")


if __name__ == "__main__":
    main()
