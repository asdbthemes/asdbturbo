<?php
/**
  * Add custom fields to Page Builder Part
  *
  * @param $fields
  * @return array
  */

    function fields_for_hero( $fields ) {
        $new_fields = array(
				array(
					'name'    => 'Hero Style',
					'id'      => 'hero_type',
					'type'    => 'select',
					'default'	=> 'primary',
					    'options' => array(
						'primary'	=> __('Primary', 'asdbturbo'),
						'secondary'	=> __('Secondary', 'asdbturbo'),
						'secondary-parallaxed'	=> __('Parallax', 'asdbturbo'),
					),
				),
				array(
					'name'    => 'Title',
					'default' => '',
					'id'      => 'hero_title',
					'type'    => 'text'
				),
				array(
					'name'    => 'SubTitle',
					'default' => '',
					'id'      => 'hero_subtitle',
					'type'    => 'text'
				),
				array(
					'name'    => 'Button Text',
					'default' => '',
					'id'      => 'hero_btn',
					'type'    => 'text'
				),
				array(
					'name'    => 'Button URL',
					'default' => '',
					'id'      => 'hero_btnurl',
					'type'    => 'text'
				),
				array(
					'name'    => 'Background',
					'default' => '',
					'id'      => 'hero_bg',
					'type'    => 'file'
				),

        );

        return array_merge( $fields, $new_fields );
    }

add_filter( 'wds_page_builder_fields_hero', 'fields_for_hero' );
