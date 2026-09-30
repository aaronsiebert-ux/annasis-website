/* =========================================================
   ANNASIS Mobile Navigation
   ========================================================= */

window.annasisToggleMenu = function (button) {
    const nav = document.getElementById('mobileNav');

    if (!nav) {
        console.warn('ANNASIS mobile navigation element was not found.');
        return;
    }

    const isOpen = nav.classList.toggle('is-open');

    button.classList.toggle('is-open', isOpen);
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
};

window.annasisCloseMenu = function () {
    const nav = document.getElementById('mobileNav');
    const button = document.querySelector('.mobile-menu-button');

    if (nav) {
        nav.classList.remove('is-open');
    }

    if (button) {
        button.classList.remove('is-open');
        button.setAttribute('aria-expanded', 'false');
    }
};


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