<section class="subfooter">

        <ul class="social-warp pull-center">
          <li>
          <?php wpb_social_links(); ?>
          </li>
          <li class="pull-right">
            <a id="gototop" class="gototop" href="#"><i class="fa fa-chevron-up"></i></a><!--#gototop-->
          </li>
        </ul>

	<div class="wrap row">
		<div class="medium-6">
			<div class="copyright">
				<p><?php bloginfo(); ?> &copy; <?php echo date( 'Y' ); ?>. <?php _e( 'All Rights Reserved.', 'asdbturbo' ); ?></p>
			</div>
		</div>
		<div class="medium-6">
			<div class="asdbcopy pull-right">
				<p style="text-align:center;font-size:10px;color:#787878;"><!--<?php if ( ot_get_option( 'credit' ) != 'off' ) :  ?><?php _e('Powered by','asdbsturbo'); ?> <a href="http://wordpress.org" rel="nofollow">WordPress</a>. <?php endif; ?>--><?php _e('Theme by','asdbturbo'); ?> <a href="https://asdbThemes.ru/asdbturbo/"><img style="max-width:10px;margin:2px;vertical-align:middle;" src="<?php echo get_stylesheet_directory_uri(); ?>/assets/images/icon-white.png" />asdbThemes.Ru</a> <?php _e('Development','asdbturbo'); ?> <a href="http://wpbuild.ru/">wpbuild.ru</a></p>
			</div>
		</div>

	</div><!-- .wrap -->
</section>
