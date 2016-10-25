<?php
/**
  * Add custom fields to Page Builder Part
  *
  * @param $fields
  * @return array
  */

function cmb2_get_sidebars() {

        global $wp_registered_sidebars;
        $sidebars = array();
        	foreach( $wp_registered_sidebars as $id=>$sidebar ) {
          		$sidebars[ $id ] = $sidebar[ 'name' ];
        	}
    return $sidebars;
}


    function fields_for_widget_area( $fields ) {
        $new_fields = array(
				array(
					'name'    => 'Widget Area',
					'desc'    => 'Select Widget Area',
					'default' => '',
					'id'      => 'widget_area',
					'type'    => 'select',
					'options' => cmb2_get_sidebars(),

				)
        );
        return array_merge( $fields, $new_fields );
    }

add_filter( 'wds_page_builder_fields_widget_area', 'fields_for_widget_area' );
