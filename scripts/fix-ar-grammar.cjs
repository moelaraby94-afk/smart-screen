/**
 * Second pass: fix remaining مساحة/مساحات (workspace context),
 * منطقة العمل (work area), and Arabic grammar (فرع is masculine).
 */
const fs = require('fs');
const path = require('path');

const arFile = path.join(__dirname, '..', 'apps', 'dashboard', 'src', 'i18n', 'messages', 'ar.json');
const raw = fs.readFileSync(arFile, 'utf8');
const json = JSON.parse(raw);
const before = JSON.stringify(json);

function fix(str) {
  return str
    // "منطقة العمل" → "الفرع" (work area → branch)
    .replace(/منطقة العمل/g, 'الفرع')
    .replace(/كل مناطق العمل/g, 'كل الفروع')
    // "مساحات عمل" (without ال) → "فروع"
    .replace(/مساحات عمل/g, 'فروع')
    // "المساحة" in workspace context → "الفرع" (but NOT "مساحة التخزين" or "المساحة المستخدمة")
    .replace(/افتح المساحة كمالك/g, 'افتح الفرع كمالك')
    .replace(/لهذه المساحة/g, 'لهذا الفرع')
    .replace(/في هذه المساحة/g, 'في هذا الفرع')
    .replace(/لتلك المساحة/g, 'لذلك الفرع')
    .replace(/مساحات عملك/g, 'فروعك')
    .replace(/مساحات عملهم/g, 'فروعهم')
    // Grammar: فرع is masculine
    .replace(/فرع جديدة/g, 'فرع جديد')
    .replace(/فرع واحدة/g, 'فرع واحد')
    .replace(/فرع محددة/g, 'فرع محدد')
    .replace(/الفرع هذه/g, 'هذا الفرع')
    .replace(/الفرع المختارة/g, 'الفرع المختار')
    .replace(/الفرع النشطة/g, 'الفرع النشط')
    .replace(/الفرع الحالية/g, 'الفرع الحالي')
    .replace(/لالفرع/g, 'للفرع')
    .replace(/بالفرع هذه/g, 'بهذا الفرع')
    // "منطقة زمنية للفرع" fix (timezone context - not workspace, just fix grammar)
    .replace(/منطقة زمنية للفرع هي المرجع/g, 'المنطقة الزمنية للفرع هي المرجع')
    // "تفاصيل الفرع الحالية" → "تفاصيل الفرع الحالي"
    .replace(/تفاصيل الفرع الحالية/g, 'تفاصيل الفرع الحالي')
    // "مراقبة مباشرة للفرع الحالية" → "مراقبة مباشرة للفرع الحالي"
    .replace(/للفرع الحالية/g, 'للفرع الحالي')
    // "ستُزال الفرع نهائياً مع شاشاتها" → "ستُزال الفرع نهائياً مع شاشاته" (masculine)
    .replace(/مع شاشاتها/g, 'مع شاشاته')
    // "الفرع هذه موقوفة" → "الفرع هذا موقوف"
    .replace(/الفرع هذه موقوفة/g, 'الفرع هذا موقوف')
    // "حذف الفرع هذه؟" → "حذف هذا الفرع؟"
    .replace(/حذف الفرع هذه/g, 'حذف هذا الفرع')
    // "داخل الفرع هذه" already handled by "الفرع هذه" → "هذا الفرع"
    // "للفرع هذه" already handled
    // "شاشات الفرع هذه" → "شاشات هذا الفرع" - already handled by "الفرع هذه" → "هذا الفرع"
    // "في الفرع هذه" → "في هذا الفرع" - already handled
    // "للفرع هذه" already handled
    // "لرفع الملفات إلى فرع محددة" → already handled by "فرع محددة" → "فرع محدد"
    // "انتقل إلى «هذا الفرع»" - already handled
    // "«هذا الفرع»" in scopeBranch - already handled
    // "إنشاء فرع جديدة" → already handled by "فرع جديدة" → "فرع جديد"
    // "فرع محددة" → already handled
    // "مراقبة كاملة لشاشات هذا الفرع" - already handled
    // "داخل هذا الفرع" - already handled
    // "لهذا الفرع" - already handled
    // "في هذا الفرع" - already handled
    // "لالفرع" → "للفرع" already handled
    // "للفرع هذه" already handled by "الفرع هذه" → "هذا الفرع"
    // Fix: "لا توجد شاشات مسجّلة لهذا الفرع بعد" - already handled
    // "تم بلوغ حد الشاشات ({limit} شاشة للفرع هذه)" - already handled by "الفرع هذه" → "هذا الفرع"
    // "لربط الشاشة بهذا الفرع" - already handled
    // "لا يوجد حد أقصى للتخزين للفرع هذه" - already handled by "الفرع هذه" → "هذا الفرع"
    // "استخدام التخزين لهذا الفرع" - already handled
    // "لا توجد شاشات في هذا الفرع حتى الآن" - already handled
    // "كل الوسائط المرفوعة لهذا الفرع" - already handled
    // "لا توجد وسائط مرفوعة لهذا الفرع حتى الآن" - already handled
    // "لربطه بهذا الفرع" - already handled
    // "اقتران من 6 أرقام، ثم أدخله هنا لربط الشاشة بهذا الفرع" - already handled
    ;
}

function walk(obj) {
  if (typeof obj === 'string') return fix(obj);
  if (Array.isArray(obj)) return obj.map((v) => walk(v));
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const key of Object.keys(obj)) {
      out[key] = walk(obj[key]);
    }
    return out;
  }
  return obj;
}

const result = walk(json);
const after = JSON.stringify(result);

if (before !== after) {
  fs.writeFileSync(arFile, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log('ar.json: second pass fixes applied');
} else {
  console.log('ar.json: no additional changes needed');
}
