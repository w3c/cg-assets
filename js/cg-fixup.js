/******************************************************************************
 *       JS extension for the W3C Community Group specification styles        *
 *                                                                            *
 * This code handles:                                                         *
 * - the table of contents: sidebar toggle, jump link, auto-collapse          *
 * - amendment / correction / addition diff toggling                          *
 * - wrapping wide tables so that they can scroll                             *
 * - the "W3C Community Group incubation" warning (sticky, dismissible)       *
 *                                                                            *
 * The dark mode toggle is in dark.js. Load this file before it, so that the  *
 * theme toggle ends up after the table-of-contents controls.                 *
 ******************************************************************************/
(function() {
  "use strict";

  /* ---- BETA ---------------------------------------------------------- *
   * Temporary notice
   * -------------------------------------------------------------------- */
  if (!document.getElementById('beta-feedback-notice')) {
    var betaNotice = document.createElement('p');
    betaNotice.id = 'beta-feedback-notice';
    betaNotice.innerHTML = 'W3C is beta testing new styles for CG ' +
      'specifications. We welcome your <a href="https://github.com/w3c/' +
      'cg-program/tree/main/beta-2026">feedback</a>.';
    document.body.insertBefore(betaNotice, document.body.firstChild);
  }

  try {
    var details = document.querySelector("div.head details");
    details.addEventListener("toggle", function toggle() {
      window.localStorage.setItem("tr-metadata", details.open);
    }, false);
    details.open = !localStorage.getItem("tr-metadata") || localStorage.getItem("tr-metadata") === 'true';
  } catch (e) {}; // ignore errors for this interaction

  const tocToggleId = 'toc-toggle';
  const tocJumpId = 'toc-jump';
  const tocCollapseId = 'toc-collapse';
  const tocExpandId = 'toc-expand';

  var ESCAPEKEY = 27;

  // Internationalization support for sidebar/jump text
  var lang = document.documentElement.lang || 'en';
  var i18n = {
    en: {
      collapseSidebar: 'Collapse Sidebar',
      expandSidebar: 'Pop Out Sidebar',
      jumpToToc: 'Jump to Table of Contents',
    },
    cs: {
      collapseSidebar: 'Skrýt postranní panel',
      expandSidebar: 'Zobrazit postranní panel',
      jumpToToc: 'Přejít na obsah',
    },
    de: {
      collapseSidebar: 'Seitenleiste einklappen',
      expandSidebar: 'Seitenleiste ausklappen',
      jumpToToc: 'Zum Inhaltsverzeichnis springen',
    },
    es: {
      collapseSidebar: 'Colapsar barra lateral',
      expandSidebar: 'Mostrar barra lateral',
      jumpToToc: 'Ir al índice',
    },
    ja: {
      collapseSidebar: 'サイドバーを折りたたむ',
      expandSidebar: 'サイドバーを表示',
      jumpToToc: '目次へジャンプ',
    },
    ko: {
      collapseSidebar: '사이드바 접기',
      expandSidebar: '사이드바 펼치기',
      jumpToToc: '목차로 이동',
    },
    nl: {
      collapseSidebar: 'Zijbalk samenvouwen',
      expandSidebar: 'Zijbalk uitklappen',
      jumpToToc: 'Naar inhoudsopgave',
    },
    zh: {
      collapseSidebar: '收起侧边栏',
      expandSidebar: '展开侧边栏',
      jumpToToc: '跳转到目录',
    }
  };
  var t = i18n[lang] || i18n['en'];
  var collapseSidebarText = '<span aria-hidden="true">←</span> '
                          + `<span id="${tocCollapseId}-text">${t.collapseSidebar}</span>`;
  var expandSidebarText   = '<span aria-hidden="true">→</span> '
                          + `<span id="${tocExpandId}-text">${t.expandSidebar}</span>`;
  var tocJumpText         = '<span aria-hidden="true">↑</span> '
                          + `<span id="${tocJumpId}-text">${t.jumpToToc}</span>`;

  var sidebarMedia = window.matchMedia('screen and (min-width: 78em)');
  var autoToggle   = function(e){ toggleSidebar(e.matches) };
  if(sidebarMedia.addListener) {
    sidebarMedia.addListener(autoToggle);
  }

  function toggleSidebar(on, skipScroll) {
    if (on == undefined) {
      on = !document.body.classList.contains('toc-sidebar');
    }

    if (!skipScroll) {
      /* Don't scroll to compensate for the ToC if we're above it already. */
      var headY = 0;
      var head = document.querySelector('.head, .box--head');
      if (head) {
        // terrible approx of "top of ToC"
        headY += head.offsetTop + head.offsetHeight;
      }
      skipScroll = window.scrollY < headY;
    }

    var toggle = document.getElementById(tocToggleId);
    var tocNav = document.getElementById('toc');
    if (on) {
      var tocHeight = tocNav.offsetHeight;
      document.body.classList.add('toc-sidebar');
      document.body.classList.remove('toc-inline');
      toggle.innerHTML = collapseSidebarText;
      toggle.setAttribute('aria-labelledby', `${tocCollapseId}-text`);
      if (!skipScroll) {
        window.scrollBy(0, 0 - tocHeight);
      }
      tocNav.focus();
      sidebarMedia.addListener(autoToggle); // auto-collapse when out of room
    }
    else {
      document.body.classList.add('toc-inline');
      document.body.classList.remove('toc-sidebar');
      toggle.innerHTML = expandSidebarText;
      toggle.setAttribute('aria-labelledby', `${tocExpandId}-text`);
      if (!skipScroll) {
        window.scrollBy(0, tocNav.offsetHeight);
      }
      if (toggle.matches(':hover')) {
        /* Unfocus button when not using keyboard navigation,
           because I don't know where else to send the focus. */
        toggle.blur();
      }
    }
  }

  function createSidebarToggle() {
    /* Create the sidebar toggle in JS; it shouldn't exist when JS is off. */
    var toggle = document.createElement('a');
      /* This should probably be a button, but appearance isn't standards-track.*/
    toggle.id = tocToggleId;
    toggle.class = 'toc-toggle';
    toggle.href = '#toc';
    toggle.innerHTML = collapseSidebarText;
    toggle.setAttribute('aria-labelledby', `${tocCollapseId}-text`);

    sidebarMedia.addListener(autoToggle);
    var toggler = function(e) {
      e.preventDefault();
      sidebarMedia.removeListener(autoToggle); // persist explicit off states
      toggleSidebar();
      return false;
    }
    toggle.addEventListener('click', toggler, false);


    /* Get <nav id=toc-nav>, or make it if we don't have one. */
    var tocNav = document.getElementById('toc-nav');
    if (!tocNav) {
      tocNav = document.createElement('p');
      tocNav.id = 'toc-nav';
      /* Prepend for better keyboard navigation */
      document.body.insertBefore(tocNav, document.body.firstChild);
    }
    /* While we're at it, make sure we have a Jump to Toc link. */
    var tocJump = document.getElementById(tocJumpId);
    if (!tocJump) {
      tocJump = document.createElement('a');
      tocJump.id = tocJumpId;
      tocJump.href = '#toc';
      tocJump.innerHTML = tocJumpText;
      tocJump.setAttribute('aria-labelledby', `${tocJumpId}-text`);
      tocNav.appendChild(tocJump);
    }

    tocNav.appendChild(toggle);
  }

  var toc = document.getElementById('toc');
  if (toc) {
    if (!document.getElementById(tocToggleId)) {
      createSidebarToggle();
    }
    toggleSidebar(sidebarMedia.matches, true);

    /* If the sidebar has been manually opened and is currently overlaying the text
       (window too small for the MQ to add the margin to body),
       then auto-close the sidebar once you click on something in there. */
    toc.addEventListener('click', function(e) {
      if(document.body.classList.contains('toc-sidebar') && !sidebarMedia.matches) {
        var el = e.target;
        while (el != toc) { // find closest <a>
          if (el.tagName.toLowerCase() == "a") {
            toggleSidebar(false);
            return;
          }
          el = el.parentElement;
        }
      }
    }, false);
  }
  else {
    console.warn("Can't find Table of Contents. Please use <nav id='toc'> around the ToC.");
  }

  /* Amendment Diff Toggling */
  var showDiff = function(event) {
    var a = event.target.parentElement.parentElement;
    var ins = document.querySelectorAll("ins[cite='#" + a.id + "'], #" + a.id + " ins" );
    var del = document.querySelectorAll("del[cite='#" + a.id + "'], #" + a.id + " del" );
    ins.forEach( function(e) { e.hidden = false; e.classList.remove("diff-inactive") });
    del.forEach( function(e) { e.hidden = false; e.classList.remove("diff-inactive") });
    a.querySelectorAll("button[value=diff]")[0].disabled = true;
    a.querySelectorAll("button[value=old]")[0].disabled = false;
    a.querySelectorAll("button[value=new]")[0].disabled = false;
  }
  var showOld = function(event) {
    var a = event.target.parentElement.parentElement;
    var ins = document.querySelectorAll("ins[cite='#" + a.id + "'], #" + a.id + " ins" );
    var del = document.querySelectorAll("del[cite='#" + a.id + "'], #" + a.id + " del" );
    ins.forEach( function(e) { e.hidden = true;  e.classList.add("diff-inactive") });
    del.forEach( function(e) { e.hidden = false; e.classList.add("diff-inactive") });
    a.querySelectorAll("button[value=diff]")[0].disabled = false;
    a.querySelectorAll("button[value=old]")[0].disabled = true;
    a.querySelectorAll("button[value=new]")[0].disabled = false;
  }
  var showNew = function(event) {
    var a = event.target.parentElement.parentElement;
    var ins = document.querySelectorAll("ins[cite='#" + a.id + "'], #" + a.id + " ins" );
    var del = document.querySelectorAll("del[cite='#" + a.id + "'], #" + a.id + " del" );
    ins.forEach( function(e) { e.hidden = false;  e.classList.add("diff-inactive") });
    del.forEach( function(e) { e.hidden = true; e.classList.add("diff-inactive") });
    a.querySelectorAll("button[value=diff]")[0].disabled = false;
    a.querySelectorAll("button[value=old]")[0].disabled = false;
    a.querySelectorAll("button[value=new]")[0].disabled = true;
  }
  var amendments = document.querySelectorAll('[id].amendment, [id].correction, [id].addition');
  amendments.forEach( function(a) {
    var ins = document.querySelectorAll("ins[cite='#" + a.id + "'], #" + a.id + " ins" );
    var del = document.querySelectorAll("del[cite='#" + a.id + "'], #" + a.id + " del" );
    if (ins.length == 0 && del.length == 0) { return; }

    var tbar = document.createElement('div');
    tbar.lang = 'en';
    tbar.className = 'amendment-toggles';

    if (document.respec) tbar.classList.add('removeOnSave');

    var toggle = document.createElement('button');
    toggle.value = 'diff'; toggle.innerHTML = 'Show Change'; toggle.disabled = true;
    toggle.addEventListener('click', showDiff, false);
    tbar.appendChild(toggle);

    toggle = document.createElement('button');
    toggle.value = 'old'; toggle.innerHTML = 'Show Current';
    toggle.addEventListener('click', showOld, false);
    tbar.appendChild(toggle);

    toggle = document.createElement('button');
    toggle.value = 'new'; toggle.innerHTML = 'Show Future';
    toggle.addEventListener('click', showNew, false);
    tbar.appendChild(toggle);

    a.appendChild(tbar);
  });

  /* Wrap tables in case they overflow */
  var tables = document.querySelectorAll(':not(.overlarge) > table.data, :not(.overlarge) > table.index');
  var numTables = tables.length;
  for (var i = 0; i < numTables; i++) {
    var table = tables[i];
    if (!table.matches('.example *, .note *, .advisement *, .def *, .issue *')) {
      /* Overflowing colored boxes looks terrible, and also
         the kinds of tables inside these boxes
         are less likely to need extra space. */
      var wrapper = document.createElement('div');
      wrapper.className = 'overlarge';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  }

  /* Incubation warning shown collapsed at the bottom of the page.
     Its wording depends on what the document says it is, in the
     cg-spec-type and cg-spec-maturity <meta> elements. As in the generators'
     notice boxes, a snapshot is a snapshot whatever its maturity. */
  var PROGRAMS_URL = 'https://github.com/w3c/cg-program/blob/main/beta-2026/w3c-programs.md';
  var LIFECYCLE_URL = 'https://github.com/w3c/cg-program/blob/main/proposals/spec-lifecycle.md#maturity-stages';
  var STATUS_BLOCK_FRAGMENT = '#top-status-block';

  function metaContent(name) {
    var meta = document.querySelector('meta[name="' + name + '"]');
    return meta ? meta.content.trim() : '';
  }

  /* A link, or plain text when there is no URL for it. */
  function warningLink(href, text) {
    if (!href) return text;
    var anchor = document.createElement('a');
    anchor.href = href;
    anchor.textContent = text;
    return anchor;
  }

  /* The living specification a snapshot points at: its canonical URL, unless
     that is the snapshot itself. */
  function livingSpecUrl() {
    var canonical = document.querySelector('link[rel~="canonical"][href]');
    if (!canonical) return null;
    var here = document.location.href.split('#')[0];
    return canonical.href === here ? null : canonical.href;
  }

  /* The warning's lines, each a list of strings and nodes. */
  function incubationLines() {
    if (metaContent('cg-spec-type') === 'snapshot') {
      return [
        ['This is a ', warningLink(PROGRAMS_URL + '#living-specification-v-snapshot', 'snapshot'),
         ' of an incubation and may be outdated!'],
        ['Please see the ', warningLink(livingSpecUrl(), 'living specification'),
         ' for the latest updates on this incubation.']
      ];
    }
    switch (metaContent('cg-spec-maturity')) {
      case 'unmaintained':
        return [
          ['This specification is no longer in development and is ',
           warningLink(LIFECYCLE_URL, 'unmaintained'), '!'],
          ['Do not use or reference. If these circumstances change in the ' +
           'future, we will review our guidance.']
        ];
      case 'transferred':
        return [
          ['This specification has been ', warningLink(LIFECYCLE_URL, 'transferred'), '!'],
          ['See new contact information at the ',
           warningLink(STATUS_BLOCK_FRAGMENT, 'top of this document'), '.']
        ];
      default:
        return [
          ['This is a ', warningLink(PROGRAMS_URL + '#introduction', 'W3C Community Group incubation'), '.']
        ];
    }
  }

  if (!document.getElementById('cg-incubation-warning')) {
    var incubationWarning = document.createElement('p');
    incubationWarning.id = 'cg-incubation-warning';
    incubationWarning.lang = 'en';
    incubationWarning.className = 'outdated-warning outdated-collapsed cg-incubation-warning';
    if (document.respec) incubationWarning.classList.add('removeOnSave');

    incubationLines().forEach(function(parts) {
      var incubationText = document.createElement('span');
      incubationText.append.apply(incubationText, parts);
      incubationWarning.appendChild(incubationText);
    });

    var incubationButton = document.createElement('button');
    incubationButton.type = 'button';
    incubationButton.innerText = '✕';
    incubationButton.setAttribute('aria-label', 'Hide warning');
    incubationButton.addEventListener('click', function() {
      incubationWarning.remove();
    }, false);
    incubationWarning.appendChild(incubationButton);

    document.body.prepend(incubationWarning);
  }
})();
