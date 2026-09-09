/******************************************************************************
 *         Dark mode toggle for the W3C specification style sheets           *
 *                                                                            *
 * Adds a light / dark / auto radio group to the navigation block at the top  *
 * of the page, remembers the choice in localStorage["tr-theme"], and enables *
 * or disables the dark style sheet to match.                                 *
 *                                                                            *
 * The dark style sheet is found by class="dark-mode" on its <link>, falling  *
 * back to any stylesheet URL containing "dark.css". Give that link           *
 * media="(prefers-color-scheme: dark)" so that a reader without JavaScript   *
 * still gets a matching palette; this script then takes the media list over. *
 *                                                                            *
 * Self-contained: it creates the navigation block if cg-fixup.js has not     *
 * already. Load it after cg-fixup.js for the conventional control order.     *
 ******************************************************************************/
(function() {
  "use strict";

  const tocThemeToggle = 'toc-theme-toggle';

  const darkCss = document.querySelector(
    'link[rel~="stylesheet"].dark-mode, link[rel~="stylesheet"][href*="dark.css"]');
  if (darkCss) {
    let colorScheme = "auto";
    /* Take over the media query from the document; see setDarkEnabled(). */
    const setDarkEnabled = (on) => { darkCss.media = on ? "all" : "not all"; };
    function updateTheme() {
      colorScheme = localStorage.getItem("tr-theme");
      if (colorScheme !== "light" && colorScheme !== "dark") {
        colorScheme = "auto";
      }
      const browserDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = colorScheme === "auto" ? (browserDarkMode ? "dark" : "light") : colorScheme;

      setDarkEnabled(theme === "dark");
      document.body.classList.toggle("darkmode", theme === "dark")
    }

    updateTheme();
    const render = document.createElement("div");
    function createOption(option) {
      const checked = option === colorScheme;
      return `
        <label>
          <input name="color-scheme" type="radio" value="${option}" ${checked ? "checked": ""}>
          <span>${option}</span>
        </label>
      `.trim();
    }
    if (!document.getElementById(tocThemeToggle)) {
      render.innerHTML = `
        <a id="toc-theme-toggle" role="radiogroup" aria-label="Select a color scheme">
          <span aria-hidden="true"><img src="https://www.w3.org/StyleSheets/TR/2021/logos/dark.svg" title="theme toggle icon" /></span>
          <span>
          ${["light", "dark", "auto"].map(createOption).join("")}
          </span>
        </a>
      `;
    }
    const changeListener = (event) => {
      const { value } = event.target;
      const browserDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = value === "auto" ? (browserDarkMode ? "dark" : "light") : value;

      setDarkEnabled(theme === "dark");
      document.body.classList.toggle("darkmode", theme === "dark")
      localStorage.setItem("tr-theme", value);
    };
    render.querySelectorAll("input[type='radio']").forEach((input) => {
      input.addEventListener("change", changeListener);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      updateTheme();
    });

    /* Get <nav id=toc-nav>, or make it if we don't have one; cg-fixup.js
       creates the same element for the table-of-contents controls. */
    var tocNav = document.getElementById('toc-nav');
    if (!tocNav) {
      tocNav = document.createElement('p');
      tocNav.id = 'toc-nav';
      /* Prepend for better keyboard navigation */
      document.body.insertBefore(tocNav, document.body.firstChild);
    }
    if (!document.getElementById(tocThemeToggle)) {
      tocNav.appendChild(...render.children);
    }
  }
})();
