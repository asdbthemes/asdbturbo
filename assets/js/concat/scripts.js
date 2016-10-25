/*
	scripts.js

	License: GNU General Public License v3.0
	License URI: http://www.gnu.org/licenses/gpl-3.0.html

	Copyright: (c) 2013 Alexander "Alx" Agnarson, http://alxmedia.se
*/

"use strict";

jQuery(document).ready(function($) {


$('.lazyload').lazyload({
  // Sets the pixels to load earlier. Setting threshold to 200 causes image to load 200 pixels
  // before it appears on viewport. It should be greater or equal zero.
  threshold: 0,

  // Sets the callback function when the load event is firing.
  // element: The content in lazyload tag will be returned as a jQuery object.
  load: function(element) {},

  // Sets events to trigger lazyload. Default is customized event `appear`, it will trigger when
  // element appear in screen. You could set other events including each one separated by a space.
  trigger: "appear touchstart"
});

// $('.lightbox').magnificPopup({type:'image'});
// $('.wpb-modal-image').magnificPopup({type:'image'});

jQuery( 'article' ).magnificPopup({
        type: 'image',
        delegate: ".wpb-modal-image",
        gallery: {
            enabled: true,
            preload: [0,2],
			navigateByImgClick: true,
			arrowMarkup: '<span class="mfp-arrow mfp-arrow-%dir%" title="%title%"><i class="fa fa-2x fa-angle-%dir%"></i></span>',
			tPrev: 'Previous',
			tNext: 'Next',
			tCounter: '<span class="mfp-counter">%curr% of %total%</span>'
        },
});

// Add modal native wordpress gallery
jQuery( '.gallery' ).magnificPopup({
        type: 'image',
        delegate: ".gallery-icon > a",
        gallery: {
            enabled: true,
            preload: [0,2],
			navigateByImgClick: true,
			arrowMarkup: '<span class="mfp-arrow mfp-arrow-%dir%" title="%title%"><i class="fa fa-2x fa-angle-%dir%"></i></span>',
			tPrev: 'Previous',
			tNext: 'Next',
			tCounter: '<span class="mfp-counter">%curr% of %total%</span>'
        },
});



/*  Toggle header search
/* ------------------------------------ */
	$('.toggle-search').click(function(){
		$('.toggle-search').toggleClass('active');
		$('.search-expand').fadeToggle(250);
            setTimeout(function(){
                $('.search-expand input').focus();
            }, 300);
	});

/*  Scroll to top
/* ------------------------------------ */
	$('a#gototop').click(function() {
		$('html, body').animate({scrollTop:0},'slow');
		return false;
	});

/*  Comments / pingbacks tabs
/* ------------------------------------ */
    $(".tabs .tabs-title").click(function() {
        $(".tabs .tabs-title").removeClass('is-active');
        $(this).addClass("is-active");
        $(".tabs-content .tabs-panel").removeClass('is-active').hide();
        var selected_tab = $(this).find("a").attr("href");
        $(selected_tab).fadeIn();
        console.log(selected_tab);
        return false;
    });

/*  Table odd row class
/* ------------------------------------ */
	$('table tr:odd').addClass('alt');


/*  Dropdown menu animation
/* ------------------------------------ */
	$('.nav ul.sub-menu').hide();
	$('.nav li').hover(
		function() {
			$(this).children('ul.sub-menu').slideDown('fast');
		},
		function() {
			$(this).children('ul.sub-menu').hide();
		}
	);

/*  Mobile menu smooth toggle height
/* ------------------------------------ */
	$('.nav-toggle').on('click', function() {
		slide($('.nav-wrap .nav', $(this).parent()));
	});

	function slide(content) {
		var wrapper = content.parent();
		var contentHeight = content.outerHeight(true);
		var wrapperHeight = wrapper.height();

		wrapper.toggleClass('expand');
		if (wrapper.hasClass('expand')) {
		setTimeout(function() {
			wrapper.addClass('transition').css('height', contentHeight);
		}, 10);
	}
	else {
		setTimeout(function() {
			wrapper.css('height', wrapperHeight);
			setTimeout(function() {
			wrapper.addClass('transition').css('height', 0);
			}, 10);
		}, 10);
	}

	wrapper.one('transitionEnd webkitTransitionEnd transitionend oTransitionEnd msTransitionEnd', function() {
		if(wrapper.hasClass('open')) {
			wrapper.removeClass('transition').css('height', 'auto');
		}
	});
	}

});