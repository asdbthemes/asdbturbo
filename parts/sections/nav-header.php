<?php
$walker_menu = '';
if (ot_get_option('mmenu')!='off'){
$walker_menu = new ASDB_Mega_Menu_Walker(); }
if (ot_get_option('nav-menu-full')!='off'){$nmc='nav-menu-full';} else {$nmc='';}

//if ( has_nav_menu('header') ): ?>
<section class="nav-header">
			<nav id="site-navigation" class="main-navigation <?php echo $nmc; ?>">
			    <div class="home-icon front_page_on"><a href="<?php echo home_url('/'); ?>" title="<?php echo get_bloginfo('name'); ?>"><i class="fa fa-home"></i></a></div>
				<?php
					wp_nav_menu( array(
						'theme_location' => 'primary',
						'menu_id'        => 'primary-menu',
						'menu_class'     => 'menu dropdown',
						'walker'		 => $walker_menu
					) );
				?>
			</nav><!-- #site-navigation -->
</section>
<?php //endif; ?>
