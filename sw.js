/*
  Service Worker — خزنة
  الهدف: تشغيل التطبيق حتى بدون إنترنت (Offline)، وتلبية شرط "قابلية التثبيت" (Installability)
  الذي تتطلبه متصفحات أندرويد وأدوات التغليف مثل Bubblewrap/PWABuilder.

  ملاحظة أمنية مهمة: هذا الـ Service Worker لا يخزّن أي بيانات حسّاسة (لا كلمات مرور ولا محتوى الخزنة).
  كل ما يخزّنه هو "الهيكل الثابت" للتطبيق (HTML/CSS/JS/الأيقونات) لتشغيله دون إنترنت.
  البيانات الفعلية تبقى فقط في localStorage المشفّر على جهاز المستخدم كما هي.
*/

const CACHE_NAME = 'khazna-vault-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// استراتيجية: الشبكة أولًا مع رجوع للكاش عند انقطاع الإنترنت (Network-first, cache fallback)
// هذا يضمن أن المستخدم يحصل على آخر نسخة محدّثة من التطبيق عند توفر الإنترنت، مع بقائه يعمل بدونه.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
