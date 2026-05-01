// ==================== sw.js - Service Worker ====================
// 百事通 PWA 离线缓存策略 v2
// 缓存版本管理 + 多策略缓存 + 离线回退

// ==================== 缓存版本管理 ====================
const CACHE_VERSION = '2';
const CACHE_NAME = 'baishitong-v' + CACHE_VERSION;

// 预缓存：核心静态资源（cache-first 策略）
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './offline.html',
    './css/design-tokens.css',
    './css/base.css',
    './css/layout.css',
    './css/pages.css',
    './css/effects.css',
    './js/app.js',
    './js/state.js',
    './js/router.js',
    './js/auth.js',
    './js/ai-engine.js',
    './js/data-loader.js',
    './js/leancloud-service.js',
    './js/utils/icons.js',
    './js/utils/search.js',
    './js/utils/crypto.js',
    './js/utils/ui.js',
    './js/utils/storage.js',
    './js/utils/sound.js',
    './js/utils/web-search.js',
    './js/pages/home.js',
    './js/pages/explore.js',
    './js/pages/tips.js',
    './js/pages/compare.js',
    './js/pages/ai-chat.js',
    './js/pages/profile.js',
    './js/pages/community.js',
    './js/pages/achievements.js',
    './js/pages/favorites.js',
    './js/pages/checkin.js',
    './js/pages/assessment.js',
    './js/pages/onboarding.js'
];

// 数据文件（stale-while-revalidate 策略）
const DATA_CACHE_NAME = 'baishitong-data-v' + CACHE_VERSION;
const DATA_URL_PATTERN = /\/js\/data\/.*\.json$/;

// 不缓存的域名（API 调用、第三方服务等）
const NO_CACHE_DOMAINS = [
    'aliyuncs.com',
    'volcengineapi.com',
    'openai.com',
    'anthropic.com',
    'leancloud.cn',
    'zhipuai.cn',
    'moonshot.cn',
    'googleapis.com'
];

// ==================== 工具函数 ====================

/**
 * 判断 URL 是否属于不缓存域名
 */
function isNoCacheDomain(url) {
    for (var i = 0; i < NO_CACHE_DOMAINS.length; i++) {
        if (url.indexOf(NO_CACHE_DOMAINS[i]) !== -1) return true;
    }
    return false;
}

/**
 * 判断 URL 是否为数据文件
 */
function isDataRequest(url) {
    return DATA_URL_PATTERN.test(url);
}

/**
 * 判断 URL 是否为同源请求
 */
function isSameOrigin(url) {
    return url.indexOf(self.location.origin) === 0;
}

// ==================== 安装事件：预缓存核心资源 ====================
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('[SW] 预缓存核心资源...');
            return cache.addAll(PRECACHE_ASSETS).then(function() {
                console.log('[SW] 预缓存完成: ' + PRECACHE_ASSETS.length + ' 个资源');
            }).catch(function(err) {
                // 部分资源可能不存在（开发环境），不阻塞安装
                console.warn('[SW] 部分资源预缓存失败（开发环境正常）:', err);
                // 逐个尝试缓存，跳过失败的
                return Promise.all(
                    PRECACHE_ASSETS.map(function(url) {
                        return cache.add(url).catch(function() {
                            console.warn('[SW] 跳过: ' + url);
                        });
                    })
                );
            });
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

// ==================== 激活事件：清理旧版本缓存 ====================
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) {
                    // 清理所有非当前版本的缓存
                    return key !== CACHE_NAME && key !== DATA_CACHE_NAME;
                }).map(function(key) {
                    console.log('[SW] 清理旧缓存: ' + key);
                    return caches.delete(key);
                })
            );
        }).then(function() {
            console.log('[SW] 激活完成，缓存版本: v' + CACHE_VERSION);
            return self.clients.claim();
        })
    );
});

// ==================== 请求拦截：多策略缓存 ====================
self.addEventListener('fetch', function(event) {
    // 只处理 GET 请求
    if (event.request.method !== 'GET') return;

    var url = event.request.url;

    // 跳过不缓存域名
    if (isNoCacheDomain(url)) return;

    // 根据请求类型选择策略
    if (isDataRequest(url)) {
        // JSON 数据文件：stale-while-revalidate 策略
        event.respondWith(staleWhileRevalidate(event.request));
    } else if (isSameOrigin(url)) {
        // 同源静态资源：cache-first 策略
        event.respondWith(cacheFirst(event.request));
    } else {
        // 其他请求：network-first 策略
        event.respondWith(networkFirst(event.request));
    }
});

// ==================== 缓存策略实现 ====================

/**
 * Cache-First 策略
 * 优先从缓存读取，缓存未命中时从网络获取并缓存
 * 适用于：HTML、CSS、JS、字体等静态资源
 */
function cacheFirst(request) {
    return caches.match(request).then(function(cached) {
        if (cached) {
            return cached;
        }

        return fetch(request).then(function(response) {
            if (!response || response.status !== 200) {
                return response;
            }

            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
                cache.put(request, clone);
            });

            return response;
        }).catch(function() {
            // 离线且无缓存：导航请求返回离线页面
            if (request.mode === 'navigate') {
                return caches.match('./offline.html');
            }
            return new Response('离线不可用', {
                status: 503,
                statusText: 'Service Unavailable'
            });
        });
    });
}

/**
 * Stale-While-Revalidate 策略
 * 立即返回缓存（如有），同时后台更新缓存
 * 适用于：JSON 数据文件
 */
function staleWhileRevalidate(request) {
    return caches.open(DATA_CACHE_NAME).then(function(cache) {
        return cache.match(request).then(function(cached) {
            var fetchPromise = fetch(request).then(function(response) {
                if (response && response.status === 200) {
                    var clone = response.clone();
                    cache.put(request, clone);
                }
                return response;
            }).catch(function() {
                // 网络失败，返回缓存（如果有）
                return cached;
            });

            // 有缓存则立即返回，同时后台更新
            return cached || fetchPromise;
        });
    });
}

/**
 * Network-First 策略
 * 优先从网络获取，网络失败时回退到缓存
 * 适用于：非同源资源
 */
function networkFirst(request) {
    return fetch(request).then(function(response) {
        if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
                cache.put(request, clone);
            });
        }
        return response;
    }).catch(function() {
        return caches.match(request).then(function(cached) {
            if (cached) return cached;

            // 导航请求返回离线页面
            if (request.mode === 'navigate') {
                return caches.match('./offline.html');
            }
            return new Response('离线不可用', {
                status: 503,
                statusText: 'Service Unavailable'
            });
        });
    });
}

// ==================== 消息通信 ====================
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
