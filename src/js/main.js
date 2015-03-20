(function($) {
    'use strict';
    $( document ).ready(function() {
        $(window).scroll(function() {
            $(".cover").css({
                'opacity' : 1-(($(this).scrollTop())/500)
            });
        });

        // much wow, very animation
        new WOW().init();

        // count up timer
        var div = document.getElementById( 'deaths' );
        var i	= 0;
        setInterval(function(){ div.innerHTML=i; i++; },2000);


    });
})(jQuery);