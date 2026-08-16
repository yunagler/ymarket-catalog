# -*- coding: utf-8 -*-
"""
מוסיף את קובץ המדידה לדפי נחיתה שנבנו ידנית ולכן הגנרטור לא נוגע בהם.
בהם נמצאים דפי הקמפיין הארוז (thermal-paper-80x80) ודף התודה — עמוד ההמרה.
בלי זה, כל קליק מקמפיין ממומן נוחת על עמוד שלא מדווח דבר.
"""
import pathlib
import sys

SNIPPET = '  <script src="/js/analytics.js?v=20260314"></script>\n'
root = pathlib.Path(__file__).parent / 'lp'

fixed, already, no_head = [], 0, []
for f in sorted(root.rglob('index.html')):
    text = f.read_text(encoding='utf-8')
    if 'analytics.js' in text or 'analytics.min.js' in text:
        already += 1
        continue
    if '</head>' not in text:
        no_head.append(f)
        continue
    f.write_text(text.replace('</head>', SNIPPET + '</head>', 1), encoding='utf-8')
    fixed.append(f)

out = sys.stdout
out.reconfigure(encoding='utf-8')
print('tagged now : %d' % len(fixed))
for f in fixed:
    print('   + /%s' % f.relative_to(root.parent).as_posix())
print('already ok : %d' % already)
if no_head:
    print('NO HEAD (skipped): %d' % len(no_head))
    for f in no_head:
        print('   ! /%s' % f.relative_to(root.parent).as_posix())
