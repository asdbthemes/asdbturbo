<?php if ( ot_get_option('breadcrumbs')!='off') : ?>
<section class="breadcrumbs">
    <div class="container">
        <div class="row">
            <div id="breadcrumbs" class="breadcrumbs medium-8 columns" role="breadcrumbs">
			<?php
			$crumbstype = ot_get_option('crumbstype');
			switch ($crumbstype) {
				case 1:
	    		if(function_exists('kama_breadcrumbs') ) {kama_breadcrumbs();}
					break;
				case 2:
				if(function_exists('bcn_display')){ bcn_display();}
					break;
				case 3:
				if(function_exists('yoast_breadcrumb') ) {yoast_breadcrumb('','');}
					break;
			}
			?>
            </div>
            <div class="social-warp medium-4 columns">
                <span class="pull-right">
          			<?php wpb_social_links(); ?>
                </span>
            </div>
        </div><!--/.row-->
    </div><!--/.container-->
</section><!--/.sub-header-->
<?php endif; ?>
