/**
 * השלמת יישוב אוטומטית לשדות עיר באתר.
 *
 * למה: עיר שנכתבת בכל פעם אחרת ("תל אביב" / "ת״א" / "תל-אביב") שוברת את
 * הקיבוץ הגיאוגרפי במורד הזרם — שיוך למסלול חלוקה ותמחור משלוח. ברשימה סגורה
 * כל יישוב נכתב בדיוק בצורה אחת, זהה לזו שב-CRM.
 *
 * מימוש: <datalist> מקורי במקום רכיב מותאם — הדפדפן נותן חיפוש-תוך-הקלדה,
 * ניווט מקלדת ונגישות בחינם, וזה עובד גם כשה-JS נכשל (השדה נשאר טקסט רגיל).
 *
 * שימוש: הוסף data-city-list לשדה, וטען את הקובץ עם defer.
 * מקור הנתונים: data.gov.il — "רשימת ישובים בישראל". זהה ל-crm-app/src/lib/israel-cities.ts.
 */
(function () {
  'use strict';

  var LIST_ID = 'il-cities-list';

  function init() {
    var fields = document.querySelectorAll('[data-city-list]');
    if (!fields.length) return;

    fetch('/js/israel-cities.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (names) {
        if (!names || !names.length) return;

        var list = document.getElementById(LIST_ID);
        if (!list) {
          list = document.createElement('datalist');
          list.id = LIST_ID;
          document.body.appendChild(list);
        }
        // הזרקה אחת דרך innerHTML — 1310 appendChild נפרדים מקפיאים מובייל חלש
        var html = '';
        for (var i = 0; i < names.length; i++) {
          html += '<option value="' + names[i].replace(/"/g, '&quot;') + '"></option>';
        }
        list.innerHTML = html;

        for (var j = 0; j < fields.length; j++) {
          fields[j].setAttribute('list', LIST_ID);
        }
      })
      .catch(function () {
        // ברירת מחדל שקטה: השדה נשאר טקסט חופשי ואפשר לשלוח את הטופס
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
