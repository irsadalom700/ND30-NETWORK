/**
 * ND30 LIVE - Admin Dashboard Client Controller
 * Multilingual Editor, AI Translation Assistant, IFTTT Testing & Facebook Review
 */

document.addEventListener('DOMContentLoaded', () => {
  // 0. Mobile Admin Sidebar Drawer Controller
  const sidebar = document.getElementById('adminSidebar');
  const toggleBtn = document.getElementById('adminSidebarToggleBtn');
  const closeBtn = document.getElementById('adminSidebarCloseBtn');
  const backdrop = document.getElementById('adminSidebarBackdrop');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
    document.body.classList.add('sidebar-open');
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.classList.remove('sidebar-open');
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openSidebar();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSidebar();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  // Auto-close when clicking any nav item on mobile
  if (sidebar) {
    const navItems = sidebar.querySelectorAll('.admin-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          closeSidebar();
        }
      });
    });
  }

  // 1. Multilingual Tab Switching
  const langTabs = document.querySelectorAll('.editor-lang-tab');
  const langPanels = document.querySelectorAll('.editor-body-panel');

  langTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetLang = tab.getAttribute('data-lang');
      
      langTabs.forEach(t => t.classList.remove('active'));
      langPanels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(`panel-${targetLang}`);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // 2. Auto slug generation on headline input
  ['as', 'hi', 'en'].forEach(lang => {
    const titleInput = document.getElementById(`title-${lang}`);
    const slugInput = document.getElementById(`slug-${lang}`);
    if (titleInput && slugInput) {
      titleInput.addEventListener('input', () => {
        if (!slugInput.dataset.manualEdit) {
          const val = titleInput.value;
          // Generate clean URL slug
          const slug = val.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80);
          if (slug) slugInput.value = slug;
        }
      });
      slugInput.addEventListener('input', () => {
        slugInput.dataset.manualEdit = 'true';
      });
    }
  });

  // 3. AI Translation Assistant Modal
  const openAiModalBtn = document.getElementById('openAiModalBtn');
  const aiModal = document.getElementById('aiTranslationModal');
  const closeAiModalBtn = document.getElementById('closeAiModalBtn');
  const triggerAiTranslateBtn = document.getElementById('triggerAiTranslateBtn');
  const acceptAiTranslationBtn = document.getElementById('acceptAiTranslationBtn');

  if (openAiModalBtn && aiModal) {
    openAiModalBtn.addEventListener('click', () => {
      aiModal.classList.add('active');
    });
  }

  if (closeAiModalBtn && aiModal) {
    closeAiModalBtn.addEventListener('click', () => {
      aiModal.classList.remove('active');
    });
  }

  // Trigger Translation
  if (triggerAiTranslateBtn) {
    triggerAiTranslateBtn.addEventListener('click', async () => {
      const sourceLang = document.getElementById('aiSourceLang').value;
      const targetLang = document.getElementById('aiTargetLang').value;

      if (sourceLang === targetLang) {
        alert('Source and target languages must be different.');
        return;
      }

      const sourceTitle = document.getElementById(`title-${sourceLang}`)?.value || '';
      const sourceSummary = document.getElementById(`summary-${sourceLang}`)?.value || '';
      const sourceContent = document.getElementById(`content-${sourceLang}`)?.value || '';
      const sourceTags = document.getElementById(`tags-${sourceLang}`)?.value || '';

      if (!sourceTitle.trim()) {
        alert(`Please enter a headline in the ${sourceLang.toUpperCase()} tab first.`);
        return;
      }

      triggerAiTranslateBtn.disabled = true;
      triggerAiTranslateBtn.innerText = 'Translating with AI...';

      try {
        const res = await fetch('/api/admin/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: sourceTitle,
            summary: sourceSummary,
            content: sourceContent,
            tags: sourceTags,
            sourceLang,
            targetLang
          })
        });

        const data = await res.json();
        if (data.success) {
          const draft = data.translation.translatedDraft;
          document.getElementById('aiPreviewTitle').value = draft.title;
          document.getElementById('aiPreviewSummary').value = draft.summary;
          document.getElementById('aiPreviewContent').value = draft.content;
          document.getElementById('aiPreviewTags').value = draft.tags;
          document.getElementById('aiResultContainer').style.display = 'block';
        } else {
          alert('Translation failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Error connecting to translation service: ' + err.message);
      } finally {
        triggerAiTranslateBtn.disabled = false;
        triggerAiTranslateBtn.innerText = 'Generate AI Translation';
      }
    });
  }

  // Accept Translation into target tab
  if (acceptAiTranslationBtn) {
    acceptAiTranslationBtn.addEventListener('click', () => {
      const targetLang = document.getElementById('aiTargetLang').value;
      const title = document.getElementById('aiPreviewTitle').value;
      const summary = document.getElementById('aiPreviewSummary').value;
      const content = document.getElementById('aiPreviewContent').value;
      const tags = document.getElementById('aiPreviewTags').value;

      if (document.getElementById(`title-${targetLang}`)) {
        document.getElementById(`title-${targetLang}`).value = title;
      }
      if (document.getElementById(`summary-${targetLang}`)) {
        document.getElementById(`summary-${targetLang}`).value = summary;
      }
      if (document.getElementById(`content-${targetLang}`)) {
        document.getElementById(`content-${targetLang}`).value = content;
      }
      if (document.getElementById(`tags-${targetLang}`)) {
        document.getElementById(`tags-${targetLang}`).value = tags;
      }

      // Also auto-generate slug
      const slugInput = document.getElementById(`slug-${targetLang}`);
      if (slugInput && !slugInput.value) {
        slugInput.value = title.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80);
      }

      // Switch active tab to target language to review
      const targetTab = document.querySelector(`.editor-lang-tab[data-lang="${targetLang}"]`);
      if (targetTab) targetTab.click();

      aiModal.classList.remove('active');
      showAdminToast(`Translation accepted into ${targetLang.toUpperCase()} tab! Review and approve.`);
    });
  }

  // 3b. Auto-Fill All 3 Languages Trigger
  const autoTranslateAllBtn = document.getElementById('autoTranslateAllBtn');
  if (autoTranslateAllBtn) {
    autoTranslateAllBtn.addEventListener('click', async () => {
      // Find active or non-empty language
      let activeLang = document.querySelector('.editor-lang-tab.active')?.getAttribute('data-lang') || 'as';
      let title = document.getElementById(`title-${activeLang}`)?.value.trim() || '';
      let content = document.getElementById(`content-${activeLang}`)?.value.trim() || '';

      if (!title && !content) {
        for (const l of ['as', 'hi', 'en']) {
          const t = document.getElementById(`title-${l}`)?.value.trim() || '';
          const c = document.getElementById(`content-${l}`)?.value.trim() || '';
          if (t || c) {
            activeLang = l;
            title = t;
            content = c;
            break;
          }
        }
      }

      if (!title && !content) {
        alert('Please write a headline or news story in at least one language tab first.');
        return;
      }

      const summary = document.getElementById(`summary-${activeLang}`)?.value || '';
      const tags = document.getElementById(`tags-${activeLang}`)?.value || '';
      const categoryId = document.getElementById(`category-${activeLang}`)?.value || null;
      const featuredImage = document.getElementById(`image-${activeLang}`)?.value || '';
      const imageCaption = document.getElementById(`caption-${activeLang}`)?.value || '';
      const isBreaking = document.getElementById(`breaking-${activeLang}`)?.checked ? 1 : 0;
      const isFeatured = document.getElementById(`featured-${activeLang}`)?.checked ? 1 : 0;
      const isTrending = document.getElementById(`trending-${activeLang}`)?.checked ? 1 : 0;

      autoTranslateAllBtn.disabled = true;
      const origHtml = autoTranslateAllBtn.innerHTML;
      autoTranslateAllBtn.innerHTML = '<span>⏳</span> Auto-translating all languages...';

      try {
        const res = await fetch('/api/admin/translate-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceLang: activeLang,
            title,
            summary,
            content,
            tags,
            categoryId,
            featuredImage,
            imageCaption,
            isBreaking,
            isFeatured,
            isTrending
          })
        });

        const data = await res.json();
        if (data.success && data.translations) {
          for (const [targetLang, tData] of Object.entries(data.translations)) {
            const titleEl = document.getElementById(`title-${targetLang}`);
            const slugEl = document.getElementById(`slug-${targetLang}`);
            const summaryEl = document.getElementById(`summary-${targetLang}`);
            const contentEl = document.getElementById(`content-${targetLang}`);
            const tagsEl = document.getElementById(`tags-${targetLang}`);
            const catEl = document.getElementById(`category-${targetLang}`);
            const imgEl = document.getElementById(`image-${targetLang}`);
            const capEl = document.getElementById(`caption-${targetLang}`);
            const seoTitleEl = document.getElementById(`seoTitle-${targetLang}`);
            const seoDescEl = document.getElementById(`seoDescription-${targetLang}`);
            const breakEl = document.getElementById(`breaking-${targetLang}`);
            const featEl = document.getElementById(`featured-${targetLang}`);
            const trendEl = document.getElementById(`trending-${targetLang}`);

            if (titleEl) titleEl.value = tData.title || '';
            if (slugEl) slugEl.value = tData.slug || '';
            if (summaryEl) summaryEl.value = tData.summary || '';
            if (contentEl) contentEl.value = tData.content || '';
            if (tagsEl) tagsEl.value = tData.tags || '';
            if (catEl && tData.categoryId) catEl.value = tData.categoryId;
            if (imgEl && tData.featuredImage) imgEl.value = tData.featuredImage;
            if (capEl && tData.imageCaption) capEl.value = tData.imageCaption;
            if (seoTitleEl) seoTitleEl.value = tData.seoTitle || '';
            if (seoDescEl) seoDescEl.value = tData.seoDescription || '';
            if (breakEl) breakEl.checked = !!tData.isBreaking;
            if (featEl) featEl.checked = !!tData.isFeatured;
            if (trendEl) trendEl.checked = !!tData.isTrending;

            // Update tab badge indicator
            const tabPill = document.querySelector(`.editor-lang-tab[data-lang="${targetLang}"] .tab-status-pill`);
            if (tabPill) {
              tabPill.className = 'tab-status-pill status-draft';
              tabPill.textContent = 'Auto-Draft';
            }
          }

          showAdminToast('All 3 languages auto-populated! Review tabs or click Publish.');
        } else {
          alert('Auto-translation failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Network error auto-translating: ' + err.message);
      } finally {
        autoTranslateAllBtn.disabled = false;
        autoTranslateAllBtn.innerHTML = origHtml;
      }
    });
  }

  // 4. News Publishing Actions
  const publishAllBtn = document.getElementById('publishAllBtn');
  const saveDraftsBtn = document.getElementById('saveDraftsBtn');
  const publishCurrentTabBtn = document.getElementById('publishCurrentTabBtn');

  if (publishAllBtn) {
    publishAllBtn.addEventListener('click', () => saveArticle('publish_all'));
  }
  if (saveDraftsBtn) {
    saveDraftsBtn.addEventListener('click', () => saveArticle('save_all_drafts'));
  }
  if (publishCurrentTabBtn) {
    publishCurrentTabBtn.addEventListener('click', () => {
      const activeTab = document.querySelector('.editor-lang-tab.active')?.getAttribute('data-lang') || 'as';
      saveArticle(`publish_single_${activeTab}`);
    });
  }

  async function saveArticle(actionType) {
    const articleIdInput = document.getElementById('articleId');
    const articleId = articleIdInput ? articleIdInput.value : '';

    const payload = {
      articleId,
      action: actionType,
      translations: {}
    };

    ['as', 'hi', 'en'].forEach(lang => {
      const title = document.getElementById(`title-${lang}`)?.value || '';
      const content = document.getElementById(`content-${lang}`)?.value || '';
      if (title.trim() || content.trim()) {
        payload.translations[lang] = {
          title,
          slug: document.getElementById(`slug-${lang}`)?.value || '',
          summary: document.getElementById(`summary-${lang}`)?.value || '',
          content,
          categoryId: document.getElementById(`category-${lang}`)?.value || null,
          tags: document.getElementById(`tags-${lang}`)?.value || '',
          featuredImage: document.getElementById(`image-${lang}`)?.value || '',
          imageCaption: document.getElementById(`caption-${lang}`)?.value || '',
          seoTitle: document.getElementById(`seoTitle-${lang}`)?.value || '',
          seoDescription: document.getElementById(`seoDescription-${lang}`)?.value || '',
          isBreaking: document.getElementById(`breaking-${lang}`)?.checked ? 1 : 0,
          isFeatured: document.getElementById(`featured-${lang}`)?.checked ? 1 : 0,
          isTrending: document.getElementById(`trending-${lang}`)?.checked ? 1 : 0
        };
      }
    });

    if (Object.keys(payload.translations).length === 0) {
      alert('Please fill in headline or content in at least one language tab.');
      return;
    }

    if (publishAllBtn && actionType === 'publish_all') {
      publishAllBtn.disabled = true;
      publishAllBtn.innerText = 'Publishing in All Languages...';
    }

    try {
      const res = await fetch('/api/admin/articles/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showAdminToast('Story successfully published across ALL 3 languages (Assamese, Hindi & English)!');
        setTimeout(() => {
          window.location.href = '/admin/articles';
        }, 1200);
      } else {
        alert('Save failed: ' + (data.error || 'Unknown error'));
        if (publishAllBtn) {
          publishAllBtn.disabled = false;
          publishAllBtn.innerText = '🚀 Publish in All Languages (Assamese, Hindi & English)';
        }
      }
    } catch (e) {
      alert('Network error saving article: ' + e.message);
      if (publishAllBtn) {
        publishAllBtn.disabled = false;
        publishAllBtn.innerText = '🚀 Publish in All Languages (Assamese, Hindi & English)';
      }
    }
  }

  // 5. IFTTT Studio Actions
  const testIftttBtn = document.getElementById('testIftttBtn');
  if (testIftttBtn) {
    testIftttBtn.addEventListener('click', async () => {
      const selectedLang = document.getElementById('testIftttLang')?.value || 'en';
      const consoleBox = document.getElementById('iftttConsoleBox');
      if (consoleBox) {
        consoleBox.innerHTML += `\n[${new Date().toLocaleTimeString()}] Triggering test IFTTT webhook for language: ${selectedLang}...`;
      }

      testIftttBtn.disabled = true;
      try {
        const res = await fetch('/api/admin/ifttt/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lang: selectedLang })
        });
        const data = await res.json();
        if (consoleBox) {
          consoleBox.innerHTML += `\n[${new Date().toLocaleTimeString()}] Status: ${data.success ? 'SUCCESS' : 'FAILED'} (HTTP ${data.statusCode || 200})\nResponse: ${JSON.stringify(data, null, 2)}\n`;
          consoleBox.scrollTop = consoleBox.scrollHeight;
        }
        showAdminToast(data.success ? 'IFTTT test event dispatched successfully!' : 'IFTTT test failed.');
      } catch (err) {
        if (consoleBox) consoleBox.innerHTML += `\n[ERROR] ${err.message}`;
      } finally {
        testIftttBtn.disabled = false;
      }
    });
  }

  // Retry Failed IFTTT Event
  document.querySelectorAll('.btn-retry-ifttt').forEach(btn => {
    btn.addEventListener('click', async () => {
      const eventId = btn.getAttribute('data-event-id');
      btn.disabled = true;
      btn.innerText = 'Retrying...';

      try {
        const res = await fetch(`/api/admin/ifttt/retry/${eventId}`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          showAdminToast('Event retried successfully!');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          alert('Retry failed: ' + data.error);
          btn.disabled = false;
          btn.innerText = 'Retry';
        }
      } catch (e) {
        alert('Retry network error: ' + e.message);
        btn.disabled = false;
      }
    });
  });

  // Regenerate Webhook Secret
  const regenSecretBtn = document.getElementById('regenSecretBtn');
  if (regenSecretBtn) {
    regenSecretBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to regenerate the IFTTT Webhook secret key?')) return;
      try {
        const res = await fetch('/api/admin/ifttt/regen-secret', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          document.getElementById('webhookSecretInput').value = data.newSecret;
          showAdminToast('New webhook secret generated!');
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    });
  }

  // 6. Facebook Connect, Disconnect & Import Actions
  const connectModal = document.getElementById('fbConnectModal');
  const openConnectFbModalBtn = document.getElementById('openConnectFbModalBtn');
  const closeFbConnectModalBtn = document.getElementById('closeFbConnectModalBtn');
  const saveFbConnectBtn = document.getElementById('saveFbConnectBtn');

  if (openConnectFbModalBtn && connectModal) {
    openConnectFbModalBtn.addEventListener('click', () => {
      connectModal.classList.add('active');
    });
  }

  if (closeFbConnectModalBtn && connectModal) {
    closeFbConnectModalBtn.addEventListener('click', () => {
      connectModal.classList.remove('active');
    });
  }

  // Handle Save / Connect Facebook via Link
  if (saveFbConnectBtn) {
    saveFbConnectBtn.addEventListener('click', async () => {
      const pageUrl = document.getElementById('fbConnectUrl')?.value.trim();
      const pageName = document.getElementById('fbConnectName')?.value.trim();
      const pageType = document.getElementById('fbConnectType')?.value || 'page';
      const defaultLang = document.getElementById('fbConnectLang')?.value || 'as';
      const autoImportMode = document.getElementById('fbConnectMode')?.value || 'review';
      const accessToken = document.getElementById('fbConnectToken')?.value.trim();

      if (!pageUrl) {
        alert('Please enter a Facebook Page or Profile URL.');
        return;
      }

      saveFbConnectBtn.disabled = true;
      saveFbConnectBtn.innerText = 'Connecting...';

      try {
        const res = await fetch('/api/admin/facebook/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageUrl, pageName, pageType, defaultLang, autoImportMode, accessToken })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast('Facebook connected successfully!');
          connectModal?.classList.remove('active');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          alert('Connection failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Error connecting Facebook: ' + err.message);
      } finally {
        saveFbConnectBtn.disabled = false;
        saveFbConnectBtn.innerText = '🔗 Connect Account';
      }
    });
  }

  // Disconnect Facebook
  document.querySelectorAll('.btn-disconnect-fb').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pageId = btn.getAttribute('data-page-id');
      const pageName = btn.getAttribute('data-page-name') || 'this Facebook account';

      if (!confirm(`Are you sure you want to disconnect "${pageName}" from ND30 LIVE?`)) {
        return;
      }

      btn.disabled = true;
      btn.innerText = 'Disconnecting...';

      try {
        const res = await fetch('/api/admin/facebook/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: pageId })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast(`Disconnected ${pageName} successfully.`);
          setTimeout(() => window.location.reload(), 1000);
        } else {
          alert('Disconnect failed: ' + (data.error || 'Unknown error'));
          btn.disabled = false;
          btn.innerText = '🔌 Disconnect';
        }
      } catch (err) {
        alert('Error disconnecting: ' + err.message);
        btn.disabled = false;
        btn.innerText = '🔌 Disconnect';
      }
    });
  });

  // Individual Page Sync
  document.querySelectorAll('.btn-sync-single-fb').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pageId = btn.getAttribute('data-page-id');
      btn.disabled = true;
      btn.innerText = 'Syncing...';

      try {
        const res = await fetch('/api/admin/facebook/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast(`Synced! ${data.importedDrafts || 0} drafts imported, ${data.reviewQueue || 0} in review queue.`);
          setTimeout(() => window.location.reload(), 1200);
        } else {
          alert('Sync failed: ' + (data.error || 'Unknown error'));
          btn.disabled = false;
          btn.innerText = '🔄 Sync';
        }
      } catch (err) {
        alert('Network error syncing: ' + err.message);
        btn.disabled = false;
        btn.innerText = '🔄 Sync';
      }
    });
  });

  // Global Facebook Sync
  const syncFbBtn = document.getElementById('syncFbBtn');
  if (syncFbBtn) {
    syncFbBtn.addEventListener('click', async () => {
      syncFbBtn.disabled = true;
      syncFbBtn.innerText = 'Syncing Meta Feed...';
      try {
        const res = await fetch('/api/admin/facebook/sync', { method: 'POST' });
        const data = await res.json();
        showAdminToast(`Synced! ${data.importedDrafts || 0} drafts imported, ${data.reviewQueue || 0} in review, ${data.loopsPrevented || 0} loops prevented.`);
        setTimeout(() => window.location.reload(), 1500);
      } catch (e) {
        alert('Error syncing: ' + e.message);
      } finally {
        syncFbBtn.disabled = false;
        syncFbBtn.innerText = 'Sync Facebook Now';
      }
    });
  }

  // Review & Approve Facebook Post Modal
  const reviewModal = document.getElementById('fbReviewModal');
  const closeFbModalBtn = document.getElementById('closeFbModalBtn');
  if (closeFbModalBtn && reviewModal) {
    closeFbModalBtn.addEventListener('click', () => reviewModal.classList.remove('active'));
  }

  document.querySelectorAll('.btn-review-fb-post').forEach(btn => {
    btn.addEventListener('click', () => {
      const postId = btn.getAttribute('data-post-id');
      const message = btn.getAttribute('data-message');
      const suggestedLang = btn.getAttribute('data-suggested-lang') || 'as';

      document.getElementById('fbReviewPostId').value = postId;
      document.getElementById('fbReviewContent').value = message;
      document.getElementById('fbReviewLang').value = suggestedLang;
      document.getElementById('fbReviewHeadline').value = message.split('\n')[0].slice(0, 100);

      reviewModal.classList.add('active');
    });
  });

  const approveFbPostBtn = document.getElementById('approveFbPostBtn');
  if (approveFbPostBtn) {
    approveFbPostBtn.addEventListener('click', async () => {
      const postId = document.getElementById('fbReviewPostId').value;
      const targetLang = document.getElementById('fbReviewLang').value;
      const headline = document.getElementById('fbReviewHeadline').value;
      const content = document.getElementById('fbReviewContent').value;

      try {
        const res = await fetch('/api/admin/facebook/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, targetLang, headline, content })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast('Post approved and added to ' + targetLang.toUpperCase() + ' drafts!');
          setTimeout(() => window.location.reload(), 1200);
        } else {
          alert('Approval failed: ' + data.error);
        }
      } catch (e) {
        alert('Network error: ' + e.message);
      }
    });
  }

  // ==========================================
  // ARTICLE MANAGEMENT: HIDE, UNHIDE & DELETE
  // ==========================================

  // Toggle Article Status (Hide / Unhide)
  document.querySelectorAll('.btn-toggle-article-status').forEach(btn => {
    btn.addEventListener('click', async () => {
      const articleId = btn.getAttribute('data-article-id');
      const action = btn.getAttribute('data-action') || 'hide';
      const title = btn.getAttribute('data-title') || 'this story';

      const promptMsg = action === 'hide'
        ? `Are you sure you want to HIDE "${title}" from all public portals?\n\nReaders will not see this story until you unhide it.`
        : `Make "${title}" LIVE and visible on public portals?`;

      if (!confirm(promptMsg)) return;

      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = action === 'hide' ? 'Hiding...' : 'Publishing...';

      try {
        const res = await fetch('/api/admin/articles/toggle-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId, action })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast(data.message || 'Article status updated successfully.');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          alert('Failed to update status: ' + (data.error || 'Unknown error'));
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      } catch (err) {
        alert('Error: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  });

  // Permanently Delete Article
  document.querySelectorAll('.btn-delete-article').forEach(btn => {
    btn.addEventListener('click', async () => {
      const articleId = btn.getAttribute('data-article-id');
      const title = btn.getAttribute('data-title') || 'this story';
      const redirect = btn.getAttribute('data-redirect');

      if (!confirm(`⚠️ PERMANENT DELETE WARNING:\n\nAre you sure you want to permanently delete "${title}" and all its translations across Assamese, Hindi, and English?\n\nThis cannot be undone.`)) {
        return;
      }

      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Deleting...';

      try {
        const res = await fetch('/api/admin/articles/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast('Story permanently deleted.');
          if (redirect) {
            setTimeout(() => window.location.href = redirect, 800);
          } else {
            // Remove row from table smoothly
            const row = btn.closest('tr');
            if (row) {
              row.style.transition = 'all 0.3s ease';
              row.style.opacity = '0';
              setTimeout(() => row.remove(), 300);
            } else {
              setTimeout(() => window.location.reload(), 1000);
            }
          }
        } else {
          alert('Delete failed: ' + (data.error || 'Unknown error'));
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      } catch (err) {
        alert('Network error deleting story: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  });

  // Articles Table Filter Pills & Search
  const articleFilterPills = document.querySelectorAll('#articleFilterPills .filter-pill');
  const articleRows = document.querySelectorAll('.article-row');
  const articleSearchInput = document.getElementById('articleSearchInput');

  function filterArticlesTable() {
    const activeFilter = document.querySelector('#articleFilterPills .filter-pill.active')?.getAttribute('data-filter') || 'all';
    const query = (articleSearchInput?.value || '').toLowerCase().trim();

    articleRows.forEach(row => {
      const status = row.getAttribute('data-status');
      const text = row.textContent.toLowerCase();

      const matchesStatus = (activeFilter === 'all') || (status === activeFilter);
      const matchesQuery = !query || text.includes(query);

      if (matchesStatus && matchesQuery) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  if (articleFilterPills.length > 0) {
    articleFilterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        articleFilterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        filterArticlesTable();
      });
    });
  }

  if (articleSearchInput) {
    articleSearchInput.addEventListener('input', filterArticlesTable);
  }

  // ==========================================
  // FACEBOOK IMPORTED POSTS: HIDE & DELETE
  // ==========================================

  // Toggle Hide / Unhide Facebook Post
  document.querySelectorAll('.btn-toggle-fb-post-hide').forEach(btn => {
    btn.addEventListener('click', async () => {
      const postId = btn.getAttribute('data-post-id');
      const action = btn.getAttribute('data-action') || 'hide';

      const promptMsg = action === 'hide'
        ? 'Hide this post from the active review queue?'
        : 'Restore this post to the active review queue?';

      if (!confirm(promptMsg)) return;

      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = action === 'hide' ? 'Hiding...' : 'Restoring...';

      try {
        const res = await fetch('/api/admin/facebook/posts/toggle-hide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, action })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast(data.message || 'Post status updated.');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          alert('Update failed: ' + (data.error || 'Unknown error'));
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      } catch (err) {
        alert('Network error: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  });

  // Permanently Delete Facebook Post
  document.querySelectorAll('.btn-delete-fb-post').forEach(btn => {
    btn.addEventListener('click', async () => {
      const postId = btn.getAttribute('data-post-id');
      const snippet = btn.getAttribute('data-snippet') || 'this post';

      if (!confirm(`Are you sure you want to permanently delete this imported Facebook post:\n\n"${snippet}..."?`)) {
        return;
      }

      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Deleting...';

      try {
        const res = await fetch('/api/admin/facebook/posts/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast('Imported post deleted.');
          const row = document.getElementById(`fb-row-${postId}`) || btn.closest('tr');
          if (row) {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            setTimeout(() => row.remove(), 300);
          } else {
            setTimeout(() => window.location.reload(), 1000);
          }
        } else {
          alert('Delete failed: ' + (data.error || 'Unknown error'));
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      } catch (err) {
        alert('Network error deleting post: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  });

  // Facebook Filter Pills & Search
  const fbFilterPills = document.querySelectorAll('#fbFilterPills .filter-pill');
  const fbRows = document.querySelectorAll('.fb-post-row');
  const fbSearchInput = document.getElementById('fbSearchInput');

  function filterFbTable() {
    const activeFilter = document.querySelector('#fbFilterPills .filter-pill.active')?.getAttribute('data-filter') || 'all';
    const query = (fbSearchInput?.value || '').toLowerCase().trim();

    fbRows.forEach(row => {
      const status = row.getAttribute('data-status');
      const text = row.textContent.toLowerCase();

      const matchesStatus = (activeFilter === 'all') || (status === activeFilter);
      const matchesQuery = !query || text.includes(query);

      if (matchesStatus && matchesQuery) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  if (fbFilterPills.length > 0) {
    fbFilterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        fbFilterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        filterFbTable();
      });
    });
  }

  if (fbSearchInput) {
    fbSearchInput.addEventListener('input', filterFbTable);
  }

  // Reporter Applications Status Update
  document.querySelectorAll('.btn-update-reporter-status').forEach(btn => {
    btn.addEventListener('click', async () => {
      const appId = btn.getAttribute('data-app-id');
      const status = btn.getAttribute('data-status');

      if (!confirm(`Mark this reporter application as ${status.toUpperCase()}?`)) return;

      btn.disabled = true;
      try {
        const res = await fetch('/api/admin/reporters/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId, status })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast(`Application marked as ${status}.`);
          setTimeout(() => window.location.reload(), 800);
        } else {
          alert('Update failed: ' + data.error);
          btn.disabled = false;
        }
      } catch (err) {
        alert('Network error: ' + err.message);
        btn.disabled = false;
      }
    });
  });

  function showAdminToast(msg) {
    let toast = document.getElementById('adminToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminToast';
      toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.5);font-size:0.95rem;font-weight:600;z-index:9999;transition:opacity 0.3s ease;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 3200);
  }
});
