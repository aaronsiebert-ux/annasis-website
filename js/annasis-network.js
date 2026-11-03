/* Network page: hotspot tap/hover notes (network.html only). */
(function () {
    function init() {
        var spots = document.querySelectorAll('.nw-spot .nw-spot-btn');
        Array.prototype.forEach.call(spots, function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var li = btn.parentNode, open = !li.classList.contains('is-open');
                Array.prototype.forEach.call(document.querySelectorAll('.nw-spot.is-open'), function (o) {
                    o.classList.remove('is-open'); o.querySelector('.nw-spot-btn').setAttribute('aria-expanded', 'false');
                });
                if (open) { li.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
            });
        });
        document.addEventListener('click', function () {
            Array.prototype.forEach.call(document.querySelectorAll('.nw-spot.is-open'), function (o) {
                o.classList.remove('is-open'); o.querySelector('.nw-spot-btn').setAttribute('aria-expanded', 'false');
            });
        });
    }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
