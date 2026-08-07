/* ============================================================
 *  📝 Guestbook — 基于 GitHub Issues 的留言板
 *  ============================================================
 *  工作原理：
 *    1. 每条留言 = 一个 GitHub Issue（标题为昵称，正文为留言内容）
 *    2. 读取留言 = 调用 GET /repos/{owner}/{repo}/issues
 *    3. 发布留言 = 调用 POST /repos/{owner}/{repo}/issues
 *    4. 配置信息保存在浏览器 localStorage 中
 *
 *  部署方式：
 *    - 将此文件夹推送到 GitHub 仓库
 *    - 在仓库 Settings → Pages 中开启 GitHub Pages
 *    - 访问 https://<user>.github.io/<repo>/ 即可看到留言板
 * ============================================================ */

(function () {
    'use strict';

    /* ---------- 默认配置（可修改） ---------- */
    const DEFAULT_CONFIG = {
        owner: 'toyking',      // GitHub 用户名
        repo: 'guestbook',       // 仓库名
        token: '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',      // GitHub Token（可选）
    };

    /* ---------- 工具函数 ---------- */
    const $  = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    function loadConfig() {
        try {
            const saved = localStorage.getItem('guestbook_config');
            if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        } catch (_) {}
        return { ...DEFAULT_CONFIG };
    }

    function saveConfig(cfg) {
        localStorage.setItem('guestbook_config', JSON.stringify(cfg));
    }

    function getAuthHeaders(cfg) {
        const headers = { 'Content-Type': 'application/json' };
        if (cfg.token) headers['Authorization'] = `Bearer ${cfg.token}`;
        return headers;
    }

    function timeAgo(dateStr) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const min = 60 * 1000, hr = 60 * min, day = 24 * hr;
        if (diff < min)      return '刚刚';
        if (diff < hr)       return Math.floor(diff / min) + ' 分钟前';
        if (diff < day)      return Math.floor(diff / hr) + ' 小时前';
        if (diff < 30 * day) return Math.floor(diff / day) + ' 天前';
        return new Date(dateStr).toLocaleDateString('zh-CN');
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function getAvatarEmoji(name) {
        const emojis = ['😀','😎','🤩','🥳','😺','🤖','👽','🦊','🐱','🐼','🦄','🐸','🐙','🦋','🌟','🍀','🎈','🚀','💡','🎯'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
        return emojis[Math.abs(hash) % emojis.length];
    }

    /* ---------- GitHub API 封装 ---------- */
    async function fetchIssues(cfg, page = 1, perPage = 10) {
        const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/issues?state=open&per_page=${perPage}&page=${page}&sort=created&direction=desc`;
        const res = await fetch(url, { headers: getAuthHeaders(cfg) });
        if (!res.ok) throw new Error(`GitHub API 错误: ${res.status} ${res.statusText}`);
        return res.json();
    }

    async function createIssue(cfg, title, body) {
        const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/issues`;
        const res = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(cfg),
            body: JSON.stringify({ title, body }),
        });
        if (!res.ok) throw new Error(`发布失败: ${res.status} ${res.statusText}`);
        return res.json();
    }

    /* ---------- 渲染留言列表 ---------- */
    let allMessages = [];
    let currentSort = 'newest';
    let currentPage = 1;
    const PER_PAGE = 10;

    function renderMessages() {
        const list = $('#messagesList');
        if (allMessages.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💭</div>
                    <p>还没有留言，来做第一个留言的人吧！</p>
                </div>`;
            return;
        }

        const sorted = [...allMessages].sort((a, b) => {
            const ta = new Date(a.created_at).getTime();
            const tb = new Date(b.created_at).getTime();
            return currentSort === 'newest' ? tb - ta : ta - tb;
        });

        list.innerHTML = sorted.map(issue => {
            const name = issue.title.replace(/^\[留言\]\s*/, '');
            const emailMatch = issue.body.match(/📧\s*(.+)/);
            const msgMatch   = issue.body.match(/💬\s*([\s\S]+?)(?:\n---|$)/);
            const message    = msgMatch ? msgMatch[1].trim() : issue.body;
            const email      = emailMatch ? emailMatch[1].trim() : '';
            const avatar     = getAvatarEmoji(name);

            return `
            <div class="message-card">
                <div class="message-header">
                    <div class="avatar">${avatar}</div>
                    <div class="message-meta">
                        <div class="message-author">${escapeHtml(name)}</div>
                        <div class="message-time">${timeAgo(issue.created_at)} · ${new Date(issue.created_at).toLocaleString('zh-CN')}</div>
                    </div>
                </div>
                <div class="message-body">${escapeHtml(message)}</div>
                <div class="message-footer">
                    ${email ? `<span>📧 ${escapeHtml(email)}</span>` : ''}
                    <a href="${issue.html_url}" target="_blank" rel="noopener">🔗 在 GitHub 查看</a>
                </div>
            </div>`;
        }).join('');

        // 显示/隐藏加载更多
        const container = $('#loadMoreContainer');
        if (allMessages.length >= currentPage * PER_PAGE + 1) {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    /* ---------- 加载留言 ---------- */
    async function loadMessages(page = 1, append = false) {
        const cfg = loadConfig();
        if (!cfg.owner || !cfg.repo) {
            $('#messagesList').innerHTML = `
                <div class="error-state">
                    <p>⚙️ 请先点击右下角「配置」按钮，填写 GitHub 仓库信息。</p>
                </div>`;
            $('#msgCount').textContent = '未配置';
            return;
        }

        try {
            const issues = await fetchIssues(cfg, page, PER_PAGE + 1);
            const hasMore = issues.length > PER_PAGE;
            const pageIssues = hasMore ? issues.slice(0, PER_PAGE) : issues;

            if (append) {
                allMessages = [...allMessages, ...pageIssues];
            } else {
                allMessages = pageIssues;
            }
            currentPage = page;

            $('#msgCount').textContent = `共 ${allMessages.length}+ 条留言`;
            renderMessages();
        } catch (err) {
            console.error(err);
            $('#messagesList').innerHTML = `
                <div class="error-state">
                    <p>⚠️ 加载失败：${escapeHtml(err.message)}</p>
                    <p style="font-size:0.85rem;margin-top:0.5rem;">请检查仓库配置是否正确，或稍后重试。</p>
                </div>`;
            $('#msgCount').textContent = '加载失败';
        }
    }

    /* ---------- 提交留言 ---------- */
    async function handleSubmit(e) {
        e.preventDefault();
        const cfg = loadConfig();
        if (!cfg.owner || !cfg.repo) {
            showStatus('formStatus', '请先配置 GitHub 仓库信息 ⚙️', 'error');
            return;
        }

        const username = $('#username').value.trim();
        const email    = $('#email').value.trim();
        const message  = $('#message').value.trim();

        if (!username || !message) {
            showStatus('formStatus', '昵称和留言内容不能为空！', 'error');
            return;
        }

        const btn = $('#submitBtn');
        btn.disabled = true;
        $('.btn-text').style.display = 'none';
        $('.btn-loading').style.display = 'inline';

        // 构造 Issue Body
        const body = `👤 **昵称：** ${username}\n📧 **邮箱：** ${email || '未填写'}\n\n---\n\n💬 **留言：**\n${message}`;

        try {
            const issue = await createIssue(cfg, `[留言] ${username}`, body);
            showStatus('formStatus', '🎉 留言发布成功！感谢你的留言～', 'success');
            $('#guestbookForm').reset();
            $('#charCount').textContent = '0';

            // 重新加载第一页
            await loadMessages(1, false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error(err);
            let msg = err.message;
            if (err.message.includes('404')) msg = '仓库不存在或无权限访问，请检查配置';
            if (err.message.includes('403')) msg = 'API 速率限制或权限不足，建议配置 Token';
            showStatus('formStatus', '❌ ' + msg, 'error');
        } finally {
            btn.disabled = false;
            $('.btn-text').style.display = 'inline';
            $('.btn-loading').style.display = 'none';
        }
    }

    function showStatus(id, text, type) {
        const el = $('#' + id);
        el.className = `form-status ${type}`;
        el.textContent = text;
        if (type === 'success') {
            setTimeout(() => { el.style.display = 'none'; }, 4000);
        }
    }

    /* ---------- 配置弹窗 ---------- */
    function openConfig() {
        const cfg = loadConfig();
        $('#cfgOwner').value = cfg.owner;
        $('#cfgRepo').value  = cfg.repo;
        $('#cfgToken').value = cfg.token;
        $('#configModal').style.display = 'flex';
    }

    function closeConfig() {
        $('#configModal').style.display = 'none';
        $('#configStatus').style.display = 'none';
    }

    /* ---------- 初始化 ---------- */
    function init() {
        // 字符计数
        $('#message').addEventListener('input', () => {
            $('#charCount').textContent = $('#message').value.length;
        });

        // 表单提交
        $('#guestbookForm').addEventListener('submit', handleSubmit);

        // 排序切换
        $$('.sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.sort-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentSort = btn.dataset.sort;
                renderMessages();
            });
        });

        // 加载更多
        $('#loadMoreBtn').addEventListener('click', () => {
            loadMessages(currentPage + 1, true);
        });

        // 配置弹窗
        $('#configLink').addEventListener('click', (e) => { e.preventDefault(); openConfig(); });
        $('#modalClose').addEventListener('click', closeConfig);
        $('#configModal').addEventListener('click', (e) => { if (e.target === $('#configModal')) closeConfig(); });

        // 保存配置
        $('#saveConfig').addEventListener('click', () => {
            const cfg = {
                owner: $('#cfgOwner').value.trim(),
                repo:  $('#cfgRepo').value.trim(),
                token: $('#cfgToken').value.trim(),
            };
            if (!cfg.owner || !cfg.repo) {
                showStatus('configStatus', '用户名和仓库名不能为空！', 'error');
                return;
            }
            saveConfig(cfg);
            showStatus('configStatus', '✅ 配置已保存！正在加载留言...', 'success');
            setTimeout(() => { closeConfig(); loadMessages(1, false); }, 800);
        });

        // ESC 关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeConfig();
        });

        // 首次加载
        loadMessages(1, false);
    }

    // DOM 就绪后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
