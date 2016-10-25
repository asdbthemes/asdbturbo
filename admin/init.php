<?php
/** Get CMB2 **/
//if ( file_exists(  __DIR__ . '/cmb2/init.php' ) ) { require_once  __DIR__ . '/cmb2/init.php';}

/** PageBuilder **/
if (ot_get_option('pbuilder')!='off'){
require_once( 'pagebuilder/wds-simple-page-builder.php' );
require_once( 'cmb2-functions.php' );
require_once( 'pbf-block.php' );
require_once( 'pbf-hero.php' );
require_once( 'pbf-widget-area.php' );
require_once( 'pbf-cf7.php' );
require_once( 'pbf-divider.php' );
}

/** ASDB Mega Menu **/
if (ot_get_option('mmenu')!='off'){
require_once( 'mmenu/asdb-mega-menu.php' );}

/** Hero **/
if (ot_get_option('hero')!='off'){
require_once( 'hero/wds-hero-widget.php' );}
