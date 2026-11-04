/* =========================================================
   AnnaSIS Mobile Navigation
   ========================================================= */

window.annasisToggleMenu = function (button) {
    const nav = document.getElementById('mobileNav');

    if (!nav) {
        console.warn('AnnaSIS mobile navigation element was not found.');
        return;
    }

    const isOpen = nav.classList.toggle('is-open');

    button.classList.toggle('is-open', isOpen);
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    button.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    nav.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

    if (isOpen) {
        const first = nav.querySelector('a');
        if (first) { first.focus(); }
    }
};

window.annasisCloseMenu = function (returnFocus) {
    const nav = document.getElementById('mobileNav');
    const button = document.querySelector('.mobile-menu-button');
    const wasOpen = !!(nav && nav.classList.contains('is-open'));

    if (nav) {
        nav.classList.remove('is-open');
        nav.setAttribute('aria-hidden', 'true');
    }

    if (button) {
        button.classList.remove('is-open');
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'Open navigation menu');
        if (returnFocus === true && wasOpen) { button.focus(); }
    }
};

/* Escape closes the menu (focus back on the button); a click outside closes it too. */
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
        const nav = document.getElementById('mobileNav');
        if (nav && nav.classList.contains('is-open')) { window.annasisCloseMenu(true); }
    }
});

document.addEventListener('click', function (e) {
    const nav = document.getElementById('mobileNav');
    if (!nav || !nav.classList.contains('is-open')) { return; }
    if (nav.contains(e.target) || e.target.closest('.mobile-menu-button')) { return; }
    window.annasisCloseMenu();
});


/* =========================================================
   Pipedrive LeadBooster
   ========================================================= */

(function () {

    function loadScriptOnce(id, src, isAsync) {
        if (document.getElementById(id)) {
            return;
        }

        const script = document.createElement('script');

        script.id = id;
        script.src = src;
        script.async = isAsync;

        document.body.appendChild(script);
    }

    function initializeLeadBooster() {
        window.pipedriveLeadboosterConfig = {
            base: 'leadbooster-chat.pipedrive.com',
            companyId: 13851722,
            playbookUuid: 'fe7940be-2952-44fb-aa6c-ea33b7fa01df',
            version: 2
        };

        if (!window.LeadBooster) {
            window.LeadBooster = {
                q: [],

                on: function (name, handler) {
                    this.q.push({
                        t: 'o',
                        n: name,
                        h: handler
                    });
                },

                trigger: function (name) {
                    this.q.push({
                        t: 't',
                        n: name
                    });
                }
            };
        }

        loadScriptOnce(
            'annasis-pipedrive-leadbooster',
            'https://leadbooster-chat.pipedrive.com/assets/loader.js',
            true
        );
    }

    function initialize() {
        initializeLeadBooster();
    }

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }

})();