<?php

/**
 * Add custom fields to Page Builder Part
 *
 * @param $fields
 * @return array
 */
    function fields_for_divider( $fields ) {
        $new_fields = array(
				array(
					'name'    => 'Height Section',
					'desc'    => 'Enter height section',
					'default' => '1px',
					'id'      => 'section_height',
					'type'    => 'text_small'
				),
				array(
					'name'    => 'Color Section',
					'desc'    => 'Enter color section',
					'default' => '#ffffff',
					'id'      => 'section_color',
					'type'    => 'colorpicker'
				),
        );
        return array_merge( $fields, $new_fields );
    }

add_filter( 'wds_page_builder_fields_divider', 'fields_for_divider' );
