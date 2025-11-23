(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();
    
    
    // Initiate the wowjs
    new WOW().init();


    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.sticky-top').addClass('shadow-sm').css('top', '0px');
        } else {
            $('.sticky-top').removeClass('shadow-sm').css('top', '-100px');
        }
    });
    
    
    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // Facts counter
    $('[data-toggle="counter-up"]').counterUp({
        delay: 10,
        time: 2000
    });


    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        items: 1,
        dots: false,
        loop: true,
        nav: true,
        navText : [
            '<i class="bi bi-chevron-left"></i>',
            '<i class="bi bi-chevron-right"></i>'
        ]
    });

    
})(jQuery);

(function () {
    function readFixedCartInfo() {
        const infoEl = document.getElementById('fixedCartBaseCountInfo');
        if (!infoEl) {
            return { count: 0, ids: [] };
        }
        const countRaw = infoEl.dataset.count || infoEl.textContent || '0';
        const idsRaw = infoEl.dataset.ids || '';
        const countParsed = parseInt(countRaw, 10);
        const ids = idsRaw
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean);
        return { count: Number.isNaN(countParsed) ? 0 : countParsed, ids };
    }

    const fixedInfo = readFixedCartInfo();
    const fixedIds = new Set(fixedInfo.ids);

    function getFixedCartBaseQty() {
        const stored = parseInt(localStorage.getItem('fixedCartBaseCount'), 10);
        if (!Number.isNaN(stored) && stored >= 0) {
            return stored;
        }
        return fixedInfo.count;
    }

    function sanitizeCartItems() {
        try {
            localStorage.removeItem('cart');
        } catch (error) {
            console.warn('Không thể làm trống giỏ hàng động:', error);
        }
        return [];
    }

    function updateCartBadgeDisplay() {
        const cartCount = document.getElementById('cartCount');
        if (!cartCount) return;
        sanitizeCartItems();
        cartCount.textContent = getFixedCartBaseQty();
    }

    window.getFixedCartBaseQty = getFixedCartBaseQty;
    window.updateCartBadgeDisplay = updateCartBadgeDisplay;

    document.addEventListener('DOMContentLoaded', function () {
        sanitizeCartItems();
        updateCartBadgeDisplay();
    });
})();

