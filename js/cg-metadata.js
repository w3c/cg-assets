/******************************************************************************
 *        Status metadata for W3C Community Group specifications
 *
 * A living specification shows collected status metadata -- the progress bar,
 * the browser-support summary and the whole usage-guidance section -- and a
 * snapshot shows one thing: when the living document it points at was last
 * edited. None of it is written into the document. This script builds all of
 * it, so nothing that claims to be current status can ever be stale markup.
 *
 * The document says what it is, and the generator leaves an empty container
 * where each block goes:
 *
 *   <meta name="cg-spec-type" content="living">   (or "snapshot")
 *   <meta name="cg-spec-shortname" content="scheduling-apis">
 *
 *   <li  data-cg-region="last-edited"></li>
 *   <div data-cg-region="progress"></div>
 *   <div data-cg-region="browser-support"></div>
 *   <div data-cg-region="usage-guidance"></div>
 *   <li  data-cg-region="living-spec"></li>
 *
 * A snapshot is archival, so it is allowed only the "living-spec" region --
 * the address and last-edited date of the document it points at. Every other
 * region is refused even if the container is present, so a copy-paste or a
 * generator bug cannot put live status on an archival document.
 *
 * Optionally, <meta name="cg-spec-maturity"> records draft / transferred /
 * unmaintained. This script never reads it: the maturity stage changes the
 * markup around these regions rather than any value in them, so it is chosen
 * when the document is generated.
 *
 * If a region cannot be built -- the endpoint is unreachable, the spec is
 * absent from it, or the document does not say what it is -- the region says
 * so. It is never left silently empty, and a value the collectors do not have
 * is rendered as "Not available" rather than omitted. Put a <noscript> inside
 * a container for the no-JavaScript case; nothing else may go in one.
 *
 * Nothing here uses innerHTML: every node is built with createElement and
 * textContent, so the third-party prose in the metadata cannot inject markup.
 *
 * The root element records what happened, for CSS to react to:
 *
 *   data-cg-metadata="static"        no script ran (the generator's default)
 *                    "fresh"         the regions were built from the endpoint
 *                    "stale"         the fetch failed; the regions say so
 *                    "unknown-type"  the document does not say what it is
 *
 ******************************************************************************/
(function () {
  "use strict";

  const DEFAULT_SRC = "https://w3c.github.io/cg-spec-metadata/specs/";
  /* The shape this script understands. A published document can never be
     updated, so it refuses a projection it does not recognise. */
  const FORMAT_VERSION = 1;
  const TIMEOUT_MS = 6000;

  /* What a snapshot may show: the living specification it points at, and
     nothing about the current state of the work. */
  const SNAPSHOT_REGIONS = new Set(["living-spec"]);

  const LIFECYCLE_URL =
    "https://github.com/w3c/cg-program/blob/main/proposals/spec-lifecycle.md#progress-bar";
  const PROGRAMS_URL =
    "https://github.com/w3c/cg-program/blob/main/beta-2026/w3c-programs.md#living-specification-v-snapshot";
  const CLA_URL = "https://www.w3.org/community/about/process/cla/";

  const PROGRESS_STEPS = [
    "Early idea",
    "Implementer experimentation",
    "Partial availability",
    "Standardization started",
  ];

  const BROWSERS = [
    { key: "chrome", name: "Chrome" },
    { key: "edge", name: "Edge" },
    { key: "firefox", name: "Firefox" },
    { key: "webkit", name: "WebKit" },
  ];

  const UNAVAILABLE = "Not available";

  /* Path data for the inline icons, lifted from the agreed design. */
  const ICONS = {
    chrome:
      "M9.82726 21.7633C5.34912 20.7712 2 16.7767 2 12C2 10.1779 2.48734 8.46958 3.33878 6.99834L7.62189 14.4169C8.47396 15.9571 10.1152 17 12 17C12.2023 17 12.4018 16.988 12.5978 16.9646L9.82726 21.7633ZM12 22L16.2868 14.5751C16.7396 13.8229 17 12.9419 17 12C17 10.8744 16.6281 9.83566 16.0004 9H21.5422C21.8396 9.94704 22 10.9548 22 12C22 17.5228 17.5228 22 12 22ZM14.5721 13.545C14.0473 14.4168 13.0917 15 12 15C10.8897 15 9.92024 14.3968 9.40149 13.5002L9.37313 13.4501C9.13535 13.0203 9 12.526 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12C15 12.5465 14.8539 13.0589 14.5985 13.5002L14.5721 13.545ZM4.6322 5.23859C6.46008 3.24783 9.08432 2 12 2C15.7014 2 18.9331 4.01099 20.6622 7H12C9.93635 7 8.1647 8.25019 7.40112 10.0345L4.6322 5.23859Z",
    edge:
      "M13.817 21.8353C13.7106 21.8384 13.6049 21.84 13.5 21.84 12.4265 21.84 11.1264 21.2191 10.0806 20.0816 9.04473 18.9549 8.30005 17.363 8.30005 15.5 8.30005 14.0815 8.81836 12.9347 9.50108 12.0942 9.55796 14.5796 11.8588 17.7 16.5 17.7 18.1779 17.7 19.2172 17.2476 19.7794 17.0029 19.9878 16.9122 20.1306 16.85 20.2161 16.85 20.4 16.85 20.5 16.95 20.5 17.15 20.5 17.3366 20.3987 17.4712 20.0742 17.9023L20.0007 18C18.5223 19.9682 16.3345 21.3732 13.817 21.8353ZM10.7016 21.9165C5.79216 21.2799 2 17.0828 2 12 2 10.7202 2.74053 9.67125 3.89749 8.91922 5.05841 8.16463 6.58675 7.75 8 7.75 10.2764 7.75 11.6347 8.51511 12.4284 9.39698 12.4785 9.45269 12.5265 9.50903 12.5725 9.56586 12.3887 9.52278 12.197 9.5 12 9.5L11.996 9.5C11.5608 9.50069 11.1518 9.61255 10.7956 9.80869 10.7171 9.84506 10.6385 9.88421 10.5603 9.92588 10.0565 10.1942 9.52919 10.587 9.04942 11.0938 8.08779 12.1096 7.30005 13.6034 7.30005 15.5 7.30005 17.637 8.15534 19.4651 9.34445 20.7584 9.75828 21.2085 10.2178 21.5991 10.7016 21.9165ZM13.8515 13.5956C14.1178 13.3151 14.5 12.9123 14.5 12 14.5 11.1394 14.1625 9.82898 13.1716 8.72802 12.1653 7.60989 10.5236 6.75 8 6.75 6.41325 6.75 4.69159 7.21037 3.35251 8.08078 3.07269 8.26266 2.80734 8.46421 2.5626 8.68489 3.93023 4.7914 7.63913 2 12 2 17.5228 2 22 6 22 10.5 22 13.3 19.8 15.35 17 15.35 15 15.35 13.6 14.7 13.6 14 13.6 13.8607 13.7092 13.7456 13.8515 13.5956Z",
    firefox:
      "M21.2827 8.26012C20.8473 7.213 19.9656 6.08244 19.2733 5.72516C19.7521 6.6637 20.1656 7.72752 20.2895 8.78174C19.1569 5.95869 17.2363 4.82021 15.6678 2.34173C15.4719 2.03155 15.2431 1.61425 15.1225 1.32928C12.8952 2.63386 11.972 4.91762 11.7347 6.37128C11.0465 6.41037 10.3724 6.58239 9.7497 6.87781C9.63641 6.93386 9.57928 7.07722 9.62296 7.19583C9.67063 7.33373 9.83148 7.40294 9.9644 7.34275C10.599 7.0433 11.2978 6.8858 11.9991 6.87856C13.8038 6.86599 15.517 7.86963 16.4149 9.43745C15.88 9.06171 14.9224 8.69063 13.9997 8.8511C17.6025 10.6522 16.6353 16.8547 11.6429 16.6205C9.62869 16.5384 7.69791 14.9706 7.51696 12.8904C7.51696 12.8904 7.97932 11.1676 10.8277 11.1676C11.1356 11.1676 12.0159 10.3084 12.0323 10.0592C12.0285 9.97778 10.2852 9.28436 9.60553 8.61473C9.30353 8.3172 9.01156 7.99714 8.65778 7.75909C8.42944 6.96033 8.41973 6.11491 8.62964 5.31111C7.6007 5.77968 6.7957 6.52028 6.21389 7.1742C5.81676 6.67125 5.84482 5.01215 5.86745 4.66575C4.9941 5.13081 4.22465 5.9396 3.6187 6.80337C2.59006 8.26122 1.99707 10.1738 1.99707 11.9845C1.99707 17.5158 6.46835 21.9997 12.0002 21.9997C16.9545 21.9997 21.0815 18.4032 21.8869 13.6792C22.128 11.8573 21.9935 9.97004 21.2827 8.26012Z",
    webkit:
      "M16.7012 6.80069L10.5868 10.5858L6.80166 16.7002L6.69768 16.5962L5.28346 18.0104L5.99057 18.7175L7.40478 17.3033L7.3008 17.1993L13.4152 13.4142L17.2003 7.29982L17.3043 7.40381L18.7185 5.98959L18.0114 5.28249L16.5972 6.6967L16.7012 6.80069ZM12.001 22C6.47813 22 2.00098 17.5228 2.00098 12C2.00098 6.47715 6.47813 2 12.001 2C17.5238 2 22.001 6.47715 22.001 12C22.001 17.5228 17.5238 22 12.001 22ZM11.501 3V5H12.501V3H11.501ZM11.501 19V21H12.501V19H11.501ZM8.09489 3.87643L8.86025 5.72418L9.78413 5.3415L9.01877 3.49374L8.09489 3.87643ZM14.2178 18.6585L14.9832 20.5063L15.9071 20.1236L15.1417 18.2758L14.2178 18.6585ZM14.9832 3.49374L14.2178 5.3415L15.1417 5.72418L15.9071 3.87643L14.9832 3.49374ZM8.86025 18.2758L8.09489 20.1236L9.01877 20.5063L9.78413 18.6585L8.86025 18.2758ZM21.001 11.5H19.001V12.5H21.001V11.5ZM5.00098 11.5H3.00098V12.5H5.00098V11.5ZM20.4593 15.1155L18.6238 14.3212L18.2267 15.2389L20.0622 16.0332L20.4593 15.1155ZM5.77527 8.76109L3.93976 7.96679L3.54261 8.88455L5.37812 9.67884L5.77527 8.76109ZM20.1245 8.09391L18.2768 8.85928L18.6595 9.78316L20.5072 9.01779L20.1245 8.09391ZM5.34248 14.2168L3.49472 14.9822L3.8774 15.9061L5.72516 15.1407L5.34248 14.2168ZM18.7185 18.0104L17.3043 16.5962L16.5972 17.3033L18.0114 18.7175L18.7185 18.0104ZM7.40478 6.6967L5.99057 5.28249L5.28346 5.98959L6.69768 7.40381L7.40478 6.6967ZM11.3132 11.3122L14.9241 9.07686L12.6888 12.6878L11.3132 11.3122Z",
    star:
      "M12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26ZM12.0006 15.968L16.2473 18.3451L15.2988 13.5717L18.8719 10.2674L14.039 9.69434L12.0006 5.27502L9.96214 9.69434L5.12921 10.2674L8.70231 13.5717L7.75383 18.3451L12.0006 15.968Z",
    signal:
      "M2 8.99997H5V21H2C1.44772 21 1 20.5523 1 20V9.99997C1 9.44769 1.44772 8.99997 2 8.99997ZM7.29289 7.70708L13.6934 1.30661C13.8693 1.13066 14.1479 1.11087 14.3469 1.26016L15.1995 1.8996C15.6842 2.26312 15.9026 2.88253 15.7531 3.46966L14.5998 7.99997H21C22.1046 7.99997 23 8.8954 23 9.99997V12.1043C23 12.3656 22.9488 12.6243 22.8494 12.8658L19.755 20.3807C19.6007 20.7554 19.2355 21 18.8303 21H8C7.44772 21 7 20.5523 7 20V8.41419C7 8.14897 7.10536 7.89462 7.29289 7.70708Z",
    chevronDown:
      "M12 19.1642L18.2071 12.9571L16.7929 11.5429L12 16.3358L7.20712 11.5429L5.79291 12.9571L12 19.1642ZM12 13.5143L18.2071 7.30722L16.7929 5.89301L12 10.6859L7.20712 5.89301L5.79291 7.30722L12 13.5143Z",
  };

  /* ---------------------------------------------------------------- DOM --- */

  const SVG_NS = "http://www.w3.org/2000/svg";

  /** el("td", {colSpan: 4}, "text", node) */
  function el(name, attrs, ...children) {
    const node = document.createElement(name);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === null || value === undefined) continue;
      if (key === "class") node.className = value;
      else if (key in node) node[key] = value;
      else node.setAttribute(key, value);
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined) continue;
      node.append(child);
    }
    return node;
  }

  function icon(name, extraClass) {
    const path = ICONS[name];
    if (!path) return null;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "icon" + (extraClass ? " " + extraClass : ""));
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("aria-hidden", "true");
    const d = document.createElementNS(SVG_NS, "path");
    d.setAttribute("d", path);
    svg.append(d);
    return svg;
  }

  /* Dates are written W3C style -- "30 July 2026", day first, two digits, no
     comma -- whatever the document's language. */
  const dateFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  /** A <time>, or the "Not available" marker when there is no date. */
  function time(value) {
    const iso = typeof value === "string" ? value.slice(0, 10) : "";
    const date = new Date(iso + "T00:00:00Z");
    if (!iso || !Number.isFinite(date.valueOf())) return missing();
    return el("time", { datetime: iso }, dateFormat.format(date));
  }

  /** Marks a value the collectors do not have, rather than omitting it. */
  function missing(what) {
    return el("span", { class: "cg-metadata-missing" }, what || UNAVAILABLE);
  }

  /** A link, or plain text when there is no URL for it. */
  function link(href, ...children) {
    return href ? el("a", { href: href }, children) : el("span", {}, children);
  }

  function table(caption, widths, rows) {
    const t = el("table", {}, el("caption", { id: caption.id }, caption.text));
    for (const width of widths) t.append(el("col", { width: width }));
    for (const row of rows) t.append(row);
    return el(
      "div",
      { class: "table-wrap", role: "region", tabindex: "0", "aria-labelledby": caption.id },
      t
    );
  }

  /* ----------------------------------------------------------- regions --- */

  /** "It was last edited on <date>." */
  function buildLastEdited(data) {
    return ["It was last edited on ", time(data.lastEdited && data.lastEdited.date), "."];
  }

  /** "This living specification: <url> (last edited: <date>)" */
  function buildLivingSpec(data, specType) {
    const url = data.specUrl;
    return [
      specType === "snapshot" ? "The " : "This ",
      el("a", { href: PROGRAMS_URL }, "living specification"),
      ": ",
      url ? el("a", { href: url }, url) : missing("Address not available"),
      " (last edited: ",
      time(data.lastEdited && data.lastEdited.date),
      ")",
    ];
  }

  /**
   * The four-step bar. `progress` is the 0-based index of the last step the
   * work has *completed*, so every step up to and including it is ticked and
   * the one after it, if there is one, is where the work stands now.
   */
  function buildProgress(data) {
    const lastComplete = data.progress;
    if (!Number.isInteger(lastComplete) || lastComplete < 0 || lastComplete >= PROGRESS_STEPS.length) {
      return unavailable("The progress towards standardization is not available for this specification.");
    }

    const list = el("ol", { class: "clean-list progress-list", role: "list" });
    PROGRESS_STEPS.forEach((label, index) => {
      const isComplete = index <= lastComplete;
      const isCurrent = index === lastComplete + 1;
      const note = isComplete
        ? "(This step is completed.)"
        : isCurrent
          ? "(This is the current step.)"
          : null;

      list.append(
        el(
          "li",
          {
            class: "progress-step" + (isCurrent ? " current" : ""),
            "aria-current": isCurrent ? "step" : null,
          },
          el(
            "div",
            { class: "progress-step__inner" },
            el("div", {
              class: "progress-step__marker" + (isComplete ? " complete" : ""),
              "aria-hidden": "true",
            }),
            el(
              "a",
              { href: LIFECYCLE_URL },
              el("span", {}, label, note ? " " : null,
                note ? el("span", { class: "visuallyhidden" }, note) : null)
            )
          )
        )
      );
    });
    return list;
  }

  /** One browser column: "Shipped", or a position linked to its issue. */
  function supportCell(data, key) {
    const cell = (data.support || {})[key] || {};
    if (!cell.label) return el("td", {}, missing());
    return el("td", {}, link(cell.url, cell.label));
  }

  function supportHeaderRow(id) {
    const row = el("tr", {}, el("th", { id: id || null, rowSpan: 2, scope: "rowgroup" }, "Browser support"));
    for (const browser of BROWSERS) {
      row.append(el("th", { scope: "col" }, icon(browser.key, "icon--before"), browser.name));
    }
    return row;
  }

  function supportValueRow(data) {
    const row = el("tr");
    for (const browser of BROWSERS) row.append(supportCell(data, browser.key));
    return row;
  }

  /** The summary in the header box, with a link down to the detail. */
  function buildBrowserSupport(data) {
    if (!data.support) return unavailable("Browser support data is not available for this specification.");

    const t = el("table", {});
    for (const width of ["40%", "15%", "15%", "15%", "15%"]) t.append(el("col", { width: width }));
    t.append(supportHeaderRow("browser-support"), supportValueRow(data));
    t.append(
      el(
        "tr",
        {},
        el(
          "td",
          { colSpan: 5 },
          el("a", { class: "link--button float--r", href: "#usage-guidance" },
            "More usage guidance ", icon("chevronDown"))
        )
      )
    );
    return el(
      "div",
      { class: "table-wrap", role: "region", tabindex: "0", "aria-labelledby": "browser-support" },
      t
    );
  }

  function labelledRow(label, ...cells) {
    return el("tr", {}, el("th", { scope: "row" }, label), cells);
  }

  function buildUsageGuidance(data) {
    const github = data.github || {};
    const wpt = data.wpt || {};
    const signals = data.developerSignals || {};
    const chromeStatus = data.chromeStatus || {};
    const plan = data.standardizationPlan || {};
    const contributions = data.contributions || {};
    const fragment = document.createDocumentFragment();

    fragment.append(el("p", {}, "Status data collected on ", time(data.collectedAt), "."));

    fragment.append(
      table(
        { id: "usage-guidance-specification-development-status", text: "Specification development status" },
        ["40%", "60%"],
        [
          labelledRow("Community Group status", el("td", {}, data.cgStatus || missing())),
          labelledRow("Specification stability", el("td", {}, data.stability || missing())),
          labelledRow("Latest GitHub commit", el("td", {}, time(github.lastCommitDate))),
        ]
      )
    );

    const testSuite = Number.isInteger(wpt.tests)
      ? [
          "[", link(wpt.url, "Test Results"), "] from ",
          String(wpt.tests), " tests / ",
          Number.isInteger(wpt.subtests) ? String(wpt.subtests) : missing("an unknown number of"),
          " subtests",
        ]
      : [missing()];

    fragment.append(
      table(
        { id: "usage-guidance-browser-support", text: "Implementation info" },
        ["40%", "15%", "15%", "15%", "15%"],
        [
          supportHeaderRow(),
          supportValueRow(data),
          labelledRow("Test suite", el("td", { colSpan: 4 }, testSuite)),
        ]
      )
    );

    const adopterHeader = el(
      "tr",
      {},
      el("th", { rowSpan: 2, scope: "rowgroup" }, "Known adopter interest"),
      el("th", { scope: "col" }, "GitHub"),
      el("th", { scope: "col" }, "WebDX signals"),
      el("th", { scope: "col" }, "Chrome Status")
    );
    const adopterValues = el(
      "tr",
      {},
      el("td", {}, Number.isInteger(github.stars)
        ? link(github.starsUrl, icon("star", "icon--before"), String(github.stars))
        : missing()),
      el("td", {}, Number.isInteger(signals.votes)
        ? link(signals.url, icon("signal", "icon--before"), String(signals.votes))
        : missing()),
      el("td", {}, chromeStatus.label
        ? link(chromeStatus.url, icon("signal", "icon--before"), chromeStatus.label)
        : missing())
    );

    const commitments = Number.isInteger(contributions.count)
      ? [
          link(contributions.url,
            String(contributions.count), " substantive contributions from ",
            String(contributions.contributors),
            contributions.contributors === 1 ? " contributor" : " contributors"),
          " under the ",
          el("a", { href: CLA_URL }, "W3C Community Contributor License Agreement (CLA)"),
          ".",
        ]
      : [missing()];

    fragment.append(
      table(
        { id: "usage-guidance-adopter-guidance", text: "Adopter guidance" },
        ["40%", "20%", "20%", "20%"],
        [
          labelledRow(
            "Experimentation status",
            el("td", { colSpan: 3 }, data.experimentationStatus
              ? [data.experimentationStatus, data.compatDataUrl
                  ? [" (see ", el("a", { href: data.compatDataUrl }, "detailed browser compatibility data"), ")."]
                  : "."]
              : missing())
          ),
          adopterHeader,
          adopterValues,
          labelledRow("Patent licensing commitments", el("td", { colSpan: 3 }, commitments)),
        ]
      )
    );

    fragment.append(
      table(
        { id: "usage-guidance-standardization-plan", text: "Standardization plan" },
        ["40%", "60%"],
        [labelledRow("Plans", el("td", {}, plan.text ? [link(plan.url, plan.text), "."] : missing()))]
      )
    );

    return fragment;
  }

  const BUILDERS = {
    "last-edited": buildLastEdited,
    "living-spec": buildLivingSpec,
    "progress": buildProgress,
    "browser-support": buildBrowserSupport,
    "usage-guidance": buildUsageGuidance,
  };

  /* --------------------------------------------------------- placement --- */

  /** A region that could not be built says why, rather than staying empty. */
  function unavailable(message) {
    return el("p", { class: "cg-metadata-unavailable" }, message);
  }

  /** Replaces a region's content, leaving any <noscript> in place. */
  function fill(container, content) {
    for (const child of Array.from(container.children)) {
      if (child.localName !== "noscript") child.remove();
    }
    for (const node of Array.from(container.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) node.remove();
    }
    /* A builder may return one node, a fragment, or a list of nodes and
       strings; append() does not spread an array on its own. */
    container.append(...[].concat(content));
  }

  function regions() {
    return Array.from(document.querySelectorAll("[data-cg-region]"));
  }

  function sayEverywhere(message, allowed) {
    for (const container of regions()) {
      if (allowed && !allowed.has(container.dataset.cgRegion)) continue;
      fill(container, unavailable(message));
    }
  }

  function metaContent(name) {
    const values = new Set(
      Array.prototype.map
        .call(document.querySelectorAll('meta[name="' + name + '"]'), (m) => (m.content || "").trim())
        .filter(Boolean)
    );
    return values.size === 1 ? values.values().next().value : null;
  }

  /* ------------------------------------------------------------- start --- */

  const specType = (() => {
    const value = metaContent("cg-spec-type");
    return value === "living" || value === "snapshot" ? value : null;
  })();
  const shortname = metaContent("cg-spec-shortname");

  if (!specType || !shortname) {
    document.documentElement.dataset.cgMetadata = "unknown-type";
    sayEverywhere("Status data could not be loaded: this document does not record which specification it is.");
    console.warn(
      "[cg-metadata] This document does not say which specification it is, or whether it is a" +
        ' living specification or a snapshot. Please set <meta name="cg-spec-type"' +
        ' content="living|snapshot"> and <meta name="cg-spec-shortname" content="...">.'
    );
    return;
  }

  const allowed = specType === "snapshot" ? SNAPSHOT_REGIONS : null;

  const base = metaContent("cg-metadata-src") || DEFAULT_SRC;
  const url = base.replace(/\/?$/, "/") + encodeURIComponent(shortname) + ".json";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  fetch(url, { signal: controller.signal, redirect: "error" })
    .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then((data) => {
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("not an object");
      }
      /* Guards against a cache or proxy handing us another spec's numbers. */
      if (data.shortname !== shortname) {
        throw new Error('data for "' + data.shortname + '", expected "' + shortname + '"');
      }
      if (data.formatVersion !== FORMAT_VERSION) {
        throw new Error("format version " + data.formatVersion + ", expected " + FORMAT_VERSION);
      }

      for (const container of regions()) {
        const name = container.dataset.cgRegion;

        /* A region a snapshot may not show. The generator should not have
           emitted it, so say so rather than leaving a silent gap. */
        if (allowed && !allowed.has(name)) {
          fill(container, unavailable("Not shown: this document is a snapshot, which records the state of the work when it was published rather than the current state."));
          console.warn('[cg-metadata] Ignoring data-cg-region="' + name + '" in a snapshot.');
          continue;
        }

        const build = BUILDERS[name];
        if (!build) {
          console.warn('[cg-metadata] No builder for data-cg-region="' + name + '".');
          continue;
        }
        fill(container, build(data, specType));
      }
      document.documentElement.dataset.cgMetadata = "fresh";
    })
    .catch((error) => {
      document.documentElement.dataset.cgMetadata = "stale";
      sayEverywhere("Status data could not be loaded.", allowed);
      console.warn(
        "[cg-metadata] Could not load the status metadata from " + url + " (" + error.message + ")."
      );
    })
    .finally(() => clearTimeout(timeout));
})();
