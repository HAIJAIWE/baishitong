// ==================== sw.js - Service Worker ====================
// 百事通 PWA 离线缓存策略
// 缓存优先 + 网络回退

const CACHE_NAME = 'baishitong-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json'
];

// 安装：预缓存核心资源
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(STATIC_ASSETS);
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

// 激活：清理旧缓存
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) {
                    return key !== CACHE_NAME;
                }).map(function(key) {
                    return caches.delete(key);
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// 请求拦截：缓存优先策略
self.addEventListener('fetch', function(event) {
    // 只处理 GET 请求
    if (event.request.method !== 'GET') return;

    // 跳过跨域 API 请求（AI 模型调用、LeanCloud 等）
    var url = event.request.url;
    if (url.indexOf('aliyuncs.com') !== -1 ||
        url.indexOf('volcengineapi.com') !== -1 ||
        url.indexOf('openai.com') !== -1 ||
        url.indexOf('anthropic.com') !== -1 ||
        url.indexOf('leancloud.cn') !== -1 ||
        url.indexOf('zhipuai.cn') !== -1 ||
        url.indexOf('moonshot.cn') !== -1 ||
        url.indexOf('googleapis.com') !== -1) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function(cached) {
            if (cached) {
                // 缓存命中，同时后台更新
                var fetchPromise = fetch(event.request).then(function(response) {
                    if (response && response.status === 200) {
                        var clone = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                }).catch(function() {
                    return cached;
                });

                return cached;
            }

            // 缓存未命中，网络请求并缓存
            return fetch(event.request).then(function(response) {
                if (!response || response.status !== 200) {
                    return response;
                }

                // 只缓存同源资源
                if (url.indexOf(self.location.origin) === 0) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                }

                return response;
            }).catch(function() {
                // 离线回退
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return new Response('离线不可用', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            });
        })
    );
});
