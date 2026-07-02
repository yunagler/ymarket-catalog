# YMarket Website (ymarket.co.il)

אתר סטטי המתארח ב-GitHub Pages מהרפו `yunagler/ymarket-catalog`.
כל push ל-`master` מתפרסם אוטומטית לייצור תוך ~2 דקות.

## ⚠️ חוקים קריטיים

### 1. ההדר והפוטר — מקור אמת יחיד

**אל תערוך את ההדר או הפוטר ידנית באף עמוד HTML.** יש מקור אמת אחד לכל אחד מהם, וסקריפטים שדואגים לעקביות על 975-977 העמודים באתר.

#### מקורות האמת
| מה | איפה | סקריפט הפצה |
|---|---|---|
| **HTML של ההדר** (announcement + info-bar + header עם mega-menu) | `includes/site-header.html` | `build_header.py` |
| **CSS של ההדר** (מחולץ מה-`<style>` ב-`index.html`) | `index.html` inline `<style>` → `css/site-header.css` | `build_header_css.py` |
| **HTML של הפוטר** (brand + קטגוריות + קישורים + contact + copyright) | `includes/site-footer.html` | `build_footer.py` |

#### איך לשנות את ההדר או הפוטר

```bash
cd C:\Users\DELL\ymarket\website

# (א) שינוי ב-HTML של ההדר (לוגו, קישורי ניווט, קטגוריות mega-menu)
#     ערוך את includes/site-header.html ואז:
python build_header.py

# (ב) שינוי ב-CSS של ההדר (צבעים, רווחים, פונטים, responsive)
#     ערוך את ה-<style> הפנימי ב-index.html ואז:
python build_header_css.py

# (ג) שינוי ב-HTML של הפוטר (קטגוריות, קישורים, contact info, copyright)
#     ערוך את includes/site-footer.html ואז:
python build_footer.py

# בסיום - commit + push
git add -u
git commit -m "Update header/footer: <מה שינית>"
git push origin master
```

#### מה הסקריפטים עושים
- **`build_header.py`** — קורא `includes/site-header.html` ומחליף את בלוק ההדר (announcement + info-bar + `<header class="header">...</header>`) בכל קובץ HTML באתר.
- **`build_header_css.py`** — מחלץ את ה-`<style>` הפנימי מ-`index.html` ל-`css/site-header.css`, ומכניס `<link rel="stylesheet" href="/css/site-header.css?v=...">` ב-`<head>` של כל עמוד (עם busting גרסה אוטומטי בכל ריצה).
- **`build_footer.py`** — קורא `includes/site-footer.html` ומחליף את בלוק `<footer class="footer">...</footer>` בכל קובץ HTML באתר.
- כל הסקריפטים יוצרים גיבוי אוטומטי ב-`backups/headers_<timestamp>/` או `backups/footers_<timestamp>/` לפני השינוי (`backups/` לא נדחף ל-git).

#### למה שני סקריפטים?
ה-HTML וה-CSS הם שני דברים נפרדים:
- ה-HTML חי ב-`includes/site-header.html` (קובץ עצמאי, נוח לעריכה).
- ה-CSS חי **inline** ב-`index.html` ← זו החלטה מודעת, כי ה-`<style>` של `index.html` מכיל גם סגנונות לעמוד הבית (hero carousel וכו'). הסקריפט מחלץ את כל ה-`<style>` ל-CSS חיצוני כדי ששאר העמודים יקבלו אותו, אבל נקודת האמת נשארת `index.html`.

#### שגיאות נפוצות
- ❌ עריכה ידנית של ההדר בעמוד בודד → יימחק ב-build הבא.
- ❌ הרצת `replace_headers.py.deprecated` (הסקריפט הישן הושבת). הוא יוצא עם שגיאה אם מופעל.
- ❌ commit של `backups/` — מוחרג ב-`.gitignore`.

### 2. דחיפה לייצור

כל push ל-`master` = פרסום מיידי לאתר החי. אין environment staging.
לפני push: וודא שהאתר המקומי תקין (פתח `products/*/index.html` בדפדפן).

---

## מבנה הפרויקט

```
website/
├── includes/
│   ├── site-header.html           ← מקור אמת HTML של ההדר
│   └── site-footer.html           ← מקור אמת HTML של הפוטר
├── css/
│   ├── site-header.css            ← נוצר אוטומטית מ-build_header_css.py
│   ├── style.min.css              ← CSS כללי של האתר
│   └── pages/                     ← CSS ספציפי לעמודים
├── js/                            ← JavaScript
├── images/                        ← תמונות ונכסים
├── items/                         ← תמונות מוצרים לפי item_id
├── products/                      ← ~824 עמודי מוצר (HTML סטטי)
│   └── <product-slug>/index.html
├── category/                      ← עמודי קטגוריות
├── blog/                          ← מאמרים
├── legal/                         ← תנאי שימוש, פרטיות וכו'
├── backups/                       ← גיבויים אוטומטיים (לא ב-git)
├── index.html                     ← דף הבית + מקור אמת CSS inline
├── build_header.py                ← הפצת HTML הדר
├── build_header_css.py            ← הפצת CSS הדר
├── build_footer.py                ← הפצת HTML פוטר
├── _audit_headers.py              ← בדיקת עקביות הדר
├── _audit_footers.py              ← בדיקת עקביות פוטר
└── replace_headers.py.deprecated  ← הסקריפט הישן (מושבת)
```

## בדיקת עקביות ההדר

בכל עת אפשר לוודא שההדר אחיד:

```bash
python _audit_headers.py
```

התוצאה הנכונה כרגע: `with_mega_menu: 977, without_mega_menu: 0`.

## הערות טכניות

- **דפוס קישורים:** הדר הנווט משתמש ב-URLs אבסולוטיים (`/catalog`, `/category/...`). זה עובד מכל עומק בספריות כי GitHub Pages משרת את האתר משורש הדומיין.
- **עברית בנתיבי קבצים:** תיקיות המוצר משתמשות בשמות עברית מקודדים (URL-encoded בפרוטוקול). הסקריפטים משתמשים ב-UTF-8 עם `io.TextIOWrapper` כדי לטפל בהם נכון.
- **Cache busting:** `build_header_css.py` מוסיף timestamp לקישור ה-CSS בכל ריצה — זה מבטיח שהלקוחות יקבלו את הגרסה החדשה מיד, בלי Ctrl+F5.
