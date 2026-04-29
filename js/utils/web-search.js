// ==================== web-search.js - 联网搜索工具 ====================
// 使用 DuckDuckGo Instant Answer API（免费、无需 API Key）

/**
 * 联网搜索
 * @param {string} query - 搜索关键词
 * @returns {Promise<{success: boolean, text: string, sources: Array}>}
 */
export async function searchWeb(query) {
    if (!query || typeof query !== 'string') {
        return { success: false, text: '', sources: [] };
    }

    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, 8000);

    try {
        // DuckDuckGo Instant Answer API
        var url = 'https://api.duckduckgo.com/?q=' +
            encodeURIComponent(query) +
            '&format=json&no_html=1&skip_disambig=1';

        var response = await fetch(url, {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return { success: false, text: '', sources: [] };
        }

        var data = await response.json();
        var results = [];
        var sources = [];

        // 1. Abstract（摘要）
        if (data.Abstract) {
            results.push(data.Abstract);
            if (data.AbstractSource) {
                sources.push({ title: data.AbstractSource, url: data.AbstractURL });
            }
        }

        // 2. RelatedTopics（相关主题）
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            var count = 0;
            for (var i = 0; i < data.RelatedTopics.length && count < 5; i++) {
                var topic = data.RelatedTopics[i];
                if (topic.Text) {
                    results.push(topic.Text);
                    if (topic.FirstURL) {
                        sources.push({ title: topic.Text.substring(0, 30), url: topic.FirstURL });
                    }
                    count++;
                }
            }
        }

        // 3. Infobox（信息卡片）
        if (data.Infobox && data.Infobox.content) {
            var infoItems = [];
            for (var j = 0; j < data.Infobox.content.length && j < 6; j++) {
                var item = data.Infobox.content[j];
                if (item.label && item.value) {
                    infoItems.push(item.label + ': ' + item.value);
                }
            }
            if (infoItems.length > 0) {
                results.push(infoItems.join('\n'));
            }
        }

        if (results.length === 0) {
            return { success: false, text: '', sources: [] };
        }

        // 格式化搜索结果文本
        var text = '【联网搜索结果】\n';
        for (var k = 0; k < results.length; k++) {
            text += (k + 1) + '. ' + results[k] + '\n';
        }
        if (sources.length > 0) {
            text += '\n信息来源：';
            for (var s = 0; s < sources.length; s++) {
                text += '\n- ' + sources[s].title;
                if (sources[s].url) text += ' (' + sources[s].url + ')';
            }
        }

        return { success: true, text: text, sources: sources };

    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            return { success: false, text: '', sources: [] };
        }
        return { success: false, text: '', sources: [] };
    }
}

window.searchWeb = searchWeb;
