<?php
/**
  * Add custom fields to Page Builder Part
  *
  * @param $fields
  * @return array
  */

function cmb2_get_cf7() {
		$cf7 = get_posts( 'post_type="wpcf7_contact_form"&numberposts=-1' );
		$contact_forms = array();
		if ( $cf7 ) {
			foreach ( $cf7 as $cform ) {
				$contact_forms[ $cform->ID ] = $cform->post_title;
			}
		} else {
			$contact_forms[ __( 'No contact forms found', 'asdbturbo' ) ] = 0;
		}
	return $contact_forms;
}

    function fields_for_cf7( $fields ) {
        $new_fields = array(
				array(
					'name'    => 'Contact Form 7',
					'desc'    => 'Select Contact Form 7',
					'default' => '',
					'id'      => 'cf7',
					'type'    => 'select',
					'options' => cmb2_get_cf7(),

				)
        );
        return array_merge( $fields, $new_fields );
    }

add_filter( 'wds_page_builder_fields_cf7', 'fields_for_cf7' );
