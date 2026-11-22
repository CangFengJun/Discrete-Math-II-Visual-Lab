/* Main Application Controller: Routing, Theme, Global Search, 267-Card Dual-Link Drawer & Terms Modal */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});
  const { htmlEl } = DM2.Svg;

  const LAB_ORDER = ['overview', 'ch61', 'ch62', 'ch63', 'ch64', 'ch65', 'ch66', 'ch67', 'ch68'];

  const FILTER_TYPES = [
    { key: 'all', label: '全部' },
    { key: 'def', label: '定义/概念' },
    { key: 'thm', label: '定理/引理' },
    { key: 'prop', label: '性质/结论' },
    { key: 'example', label: '例题结论' },
    { key: 'supplement', label: '补充结论' },
    { key: 'handwriting', label: '手写补充' },
    { key: 'pitfall', label: '易错结论' },
    { key: 'note', label: '注意/说明' },
  ];

  function init() {
    const knowledge = root.DM2_KNOWLEDGE || { meta: {}, terminology: [], chapters: [] };
    const chapterMap = new Map(knowledge.chapters.map((c) => [c.id, c]));

    const navRail = document.getElementById('nav-rail');
    const stageMain = document.getElementById('stage-main');
    const drawer = document.getElementById('knowledge-drawer');
    const drawerTitle = document.getElementById('drawer-title');
    const drawerFilters = document.getElementById('drawer-filters');
    const drawerCards = document.getElementById('drawer-cards');
    const searchInput = document.getElementById('global-search');
    const searchClear = document.getElementById('search-clear');
    const btnTheme = document.getElementById('btn-theme');
    const btnDrawerToggle = document.getElementById('btn-drawer-toggle');
    const btnDrawerWiden = document.getElementById('btn-drawer-widen');
    const btnDrawerClose = document.getElementById('btn-drawer-close');
    const btnTerms = document.getElementById('btn-terms');
    const termsModal = document.getElementById('terms-modal');
    const termsBody = document.getElementById('terms-modal-body');
    const btnTermsClose = document.getElementById('btn-terms-close');
    const metaSub = document.getElementById('meta-subtitle');

    if (metaSub && knowledge.meta.totalCards) {
      const exPart = knowledge.meta.totalExample ? ` · ${knowledge.meta.totalExample} 例题` : '';
      const supPart = knowledge.meta.totalSupplement ? ` · ${knowledge.meta.totalSupplement} 补充` : '';
      metaSub.textContent = `6.1–6.8 全章 · ${knowledge.meta.totalCards} 卡${exPart}${supPart} · ${knowledge.meta.totalHandwriting} 手写 · ${knowledge.meta.totalPitfall} 易错`;
    }

    let currentLabId = 'overview';
    let currentController = null;
    let activeFilter = 'all';
    let searchQuery = '';
    let highlightedCardId = null;

    // -------------------------------------------------------------------------
    // Theme Persistence (Academic Light default vs 3B1B Dark)
    // -------------------------------------------------------------------------
    function applyTheme(theme) {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        btnTheme.textContent = '☀️ 学术白板';
      } else {
        document.documentElement.removeAttribute('data-theme');
        btnTheme.textContent = '🌙 3B1B 暗色';
      }
      try {
        localStorage.setItem('dm2_visual_lab_theme', theme);
      } catch (e) {}
    }

    let savedTheme = 'light';
    try {
      savedTheme = localStorage.getItem('dm2_visual_lab_theme') || 'light';
    } catch (e) {}
    applyTheme(savedTheme);

    btnTheme.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });

    // -------------------------------------------------------------------------
    // Drawer Toggle & Widen
    // -------------------------------------------------------------------------
    btnDrawerToggle.addEventListener('click', () => {
      drawer.classList.toggle('collapsed');
    });
    btnDrawerClose.addEventListener('click', () => {
      drawer.classList.add('collapsed');
    });
    btnDrawerWiden.addEventListener('click', () => {
      drawer.classList.toggle('expanded');
    });

    // -------------------------------------------------------------------------
    // Terminology Alignment Modal
    // -------------------------------------------------------------------------
    function renderTermsModal() {
      termsBody.innerHTML = '';
      termsBody.appendChild(htmlEl('p', { style: { marginTop: 0, color: 'var(--text-secondary)' } },
        '当本课程 PPT 的概念界定、符号习惯或编号顺序与外部教材存在差异时，本工作台一律严格以本课程 PPT 为绝对准则：'));
      const tbl = htmlEl('table', { className: 'term-table' });
      tbl.appendChild(htmlEl('thead', {}, htmlEl('tr', {}, [
        htmlEl('th', {}, '主题'),
        htmlEl('th', {}, '本课件 PPT 绝对准则写法'),
        htmlEl('th', {}, '市面常见其他教材写法'),
        htmlEl('th', {}, '说明'),
      ])));
      const tbody = htmlEl('tbody');
      for (const row of knowledge.terminology || []) {
        tbody.appendChild(htmlEl('tr', {}, [
          htmlEl('td', { innerHTML: row.topicHtml }),
          htmlEl('td', { innerHTML: row.pptHtml }),
          htmlEl('td', { innerHTML: row.otherHtml }),
          htmlEl('td', { innerHTML: row.noteHtml }),
        ]));
      }
      tbl.appendChild(tbody);
      termsBody.appendChild(tbl);
    }
    renderTermsModal();

    btnTerms.addEventListener('click', () => termsModal.classList.add('open'));
    btnTermsClose.addEventListener('click', () => termsModal.classList.remove('open'));
    termsModal.addEventListener('click', (ev) => {
      if (ev.target === termsModal) termsModal.classList.remove('open');
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && termsModal.classList.contains('open')) {
        termsModal.classList.remove('open');
      }
    });

    // -------------------------------------------------------------------------
    // Left Navigation Rail
    // -------------------------------------------------------------------------
    function renderNav() {
      navRail.innerHTML = '';
      navRail.appendChild(htmlEl('div', { className: 'nav-section-label' }, '全局谱系地图'));

      LAB_ORDER.forEach((labId, idx) => {
        if (idx === 1) {
          navRail.appendChild(htmlEl('div', { className: 'nav-section-label', style: { marginTop: '6px' } }, '分章交互实验室 (6.1–6.8)'));
        }
        const lab = DM2.Labs[labId];
        const ch = chapterMap.get(labId);
        if (!lab) return;

        const countText = ch ? `${ch.cardCount}卡` : `${knowledge.meta.totalCards || 267}全`;
        const item = htmlEl('button', {
          className: `nav-item ${currentLabId === labId ? 'active' : ''}`,
          onClick: () => navigate(labId, null),
        }, [
          htmlEl('div', { className: 'nav-item-top' }, [
            htmlEl('span', { className: 'nav-item-title' }, lab.title),
            htmlEl('span', { className: 'nav-count' }, countText),
          ]),
          htmlEl('span', { className: 'nav-item-sub' }, lab.subtitle || ''),
        ]);
        navRail.appendChild(item);
      });
    }

    // -------------------------------------------------------------------------
    // Right Knowledge Cards Drawer (Dual-Link with Labs + Global Search)
    // -------------------------------------------------------------------------
    function matchesFilter(card) {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'example') return !!card.isExample || (card.badge && card.badge.includes('例题'));
      if (activeFilter === 'supplement') return !!card.isSupplement || (card.badge && card.badge.includes('补充'));
      if (activeFilter === 'handwriting') return card.handwritingCount > 0 || card.kind === 'handwriting';
      if (activeFilter === 'pitfall') return card.pitfallCount > 0 || card.kind === 'pitfall';
      if (activeFilter === 'note') return card.noteCount > 0 || card.kind === 'note';
      if (activeFilter === 'prop') return card.kind === 'prop' || card.kind === 'table';
      return card.kind === activeFilter;
    }

    function matchesSearch(card, q) {
      if (!q) return true;
      const needle = q.toLowerCase();
      return (
        (card.titlePlain && card.titlePlain.toLowerCase().includes(needle)) ||
        (card.bodyPlain && card.bodyPlain.toLowerCase().includes(needle)) ||
        (card.badge && card.badge.toLowerCase().includes(needle)) ||
        (card.sectionTitle && card.sectionTitle.toLowerCase().includes(needle)) ||
        (card.chapterCode && card.chapterCode.toLowerCase().includes(needle))
      );
    }

    function renderDrawer() {
      const q = searchQuery.trim();
      const ch = chapterMap.get(currentLabId);
      const sourceChapters = (q || currentLabId === 'overview')
        ? knowledge.chapters
        : (ch ? [ch] : []);

      const poolCards = sourceChapters.flatMap((c) => c.cards);
      const filteredCards = poolCards.filter((c) => matchesFilter(c) && matchesSearch(c, q));

      drawerTitle.textContent = q
        ? `全局搜索结果（${filteredCards.length} 条）`
        : currentLabId === 'overview'
          ? `全章知识点索引（${filteredCards.length} / ${poolCards.length}）`
          : `${ch.code} ${ch.title}（${filteredCards.length} / ${poolCards.length} 卡）`;

      // Filter pills
      drawerFilters.innerHTML = '';
      for (const ft of FILTER_TYPES) {
        const cnt = poolCards.filter((c) => {
          const prev = activeFilter;
          activeFilter = ft.key;
          const ok = matchesFilter(c) && matchesSearch(c, q);
          activeFilter = prev;
          return ok;
        }).length;
        drawerFilters.appendChild(htmlEl('button', {
          className: `filter-pill ${activeFilter === ft.key ? 'active' : ''}`,
          onClick: () => { activeFilter = ft.key; renderDrawer(); },
        }, `${ft.label} (${cnt})`));
      }

      drawerCards.innerHTML = '';

      // Show section prose/notes (e.g. 6.8 top note) when not searching
      if (!q && ch && ch.notes && ch.notes.length > 0 && activeFilter === 'all') {
        for (const nt of ch.notes) {
          drawerCards.appendChild(htmlEl('div', {
            className: 'kcard kcard-note',
          }, [
            htmlEl('div', { className: 'kcard-body', innerHTML: nt.html }),
          ]));
        }
      }

      if (filteredCards.length === 0) {
        drawerCards.appendChild(htmlEl('div', {
          style: { padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' },
        }, '当前筛选条件或搜索词下没有匹配的卡片。'));
        return;
      }

      let lastGroup = '';
      for (const card of filteredCards) {
        const grp = `${card.chapterCode} · ${card.sectionTitle}`;
        if (grp !== lastGroup) {
          lastGroup = grp;
          drawerCards.appendChild(htmlEl('div', {
            className: 'drawer-sec-heading',
            innerHTML: `${card.chapterCode} · ${card.sectionHtml || card.sectionTitle}`,
          }));
        }

        const badgeVariant = (card.isExample || (card.badge && card.badge.includes('例题')))
          ? ' kbadge-example'
          : (card.isSupplement || (card.badge && card.badge.includes('补充')))
            ? ' kbadge-supplement'
            : '';

        const cardEl = htmlEl('article', {
          id: `drawer-${card.id}`,
          className: `kcard kcard-${card.kind} ${highlightedCardId === card.id ? 'highlighted' : ''}`,
        }, [
          htmlEl('header', { className: 'kcard-head' }, [
            htmlEl('span', { className: `kbadge kbadge-${card.kind}${badgeVariant}` }, card.badge),
            htmlEl('span', { className: 'kcard-title', innerHTML: card.titleHtml }),
            card.pageRef ? htmlEl('span', { className: 'page-pill' }, card.pageRef) : null,
          ]),
          htmlEl('div', { className: 'kcard-body', innerHTML: card.bodyHtml }),
        ]);

        if (card.demoPreset) {
          cardEl.appendChild(htmlEl('div', { className: 'kcard-foot' }, [
            htmlEl('span', { style: { fontSize: '11px', color: 'var(--text-muted)' } }, `${card.chapterCode} 交互联动`),
            htmlEl('button', {
              className: 'preset-link-btn',
              onClick: () => {
                highlightedCardId = card.id;
                navigate(card.demoPreset.lab, card.demoPreset.preset);
              },
            }, `${card.demoPreset.label} ▶`),
          ]));
        }

        drawerCards.appendChild(cardEl);
      }

      if (highlightedCardId) {
        const target = document.getElementById(`drawer-${highlightedCardId}`);
        if (target) target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    // -------------------------------------------------------------------------
    // Search Events
    // -------------------------------------------------------------------------
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      searchClear.classList.toggle('visible', searchQuery.length > 0);
      if (searchQuery.trim().length > 0) {
        drawer.classList.remove('collapsed');
      }
      renderDrawer();
    });

    searchClear.addEventListener('click', () => {
      searchQuery = '';
      searchInput.value = '';
      searchClear.classList.remove('visible');
      renderDrawer();
    });

    // -------------------------------------------------------------------------
    // Navigation & Lab Mounting
    // -------------------------------------------------------------------------
    function navigate(labId, preset = null, skipHash = false) {
      if (!DM2.Labs[labId]) labId = 'overview';
      const sameLab = labId === currentLabId && currentController !== null;
      currentLabId = labId;

      if (!skipHash) {
        const newHash = preset ? `#${labId}:${preset}` : `#${labId}`;
        if (location.hash !== newHash) {
          history.replaceState(null, '', newHash);
        }
      }

      if (sameLab && preset && typeof currentController.applyPreset === 'function') {
        currentController.applyPreset(preset);
        renderDrawer();
        return;
      }

      renderNav();
      stageMain.scrollTop = 0;
      currentController = DM2.Labs[labId].render(stageMain, {
        preset,
        navigate: (nextLab, nextPreset = null) => navigate(nextLab, nextPreset),
        highlightCard: (cardId) => {
          highlightedCardId = cardId;
          drawer.classList.remove('collapsed');
          renderDrawer();
        },
      }) || null;

      if (preset && currentController && typeof currentController.applyPreset === 'function') {
        currentController.applyPreset(preset);
      }
      renderDrawer();
    }

    function syncFromHash() {
      const raw = (location.hash || '').replace(/^#/, '');
      if (!raw) {
        navigate('overview', null, true);
        return;
      }
      const [labPart, presetPart] = raw.split(':');
      navigate(DM2.Labs[labPart] ? labPart : 'overview', presetPart || null, true);
    }

    window.addEventListener('hashchange', syncFromHash);
    syncFromHash();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
