<?php

/**
 * Add custom fields to Page Builder Part
 *
 * @param $fields
 * @return array
 */
    function fields_for_block( $fields ) {
        $new_fields = array(
				array(
					'name'    => 'Post Limit',
					'desc'    => 'Enter post number',
					'default' => '6',
					'id'      => 'posts_num',
					'type'    => 'text_small'
				),
				array(
					'name'    => 'Block Category',
					'desc'    => 'Set category',
					'id'      => 'posts_cat_id',
					'type'    => 'select',
					'options' => cmb2_get_cat_opt(),
				),
            array(
			    'name'    => 'Title Color',
    			'desc'    => 'Set a featured term for this post.',
    			'id'      => 'title_color',
    			'type'    => 'select',
    			'default'	=> 'color-default',
    			'options' => array(
					'color-default'			=> __('Default', 'asdbturbo'),
					'color-primary'		=> __('Primary', 'asdbturbo'),
					'color-secondary'	=> __('Secondary', 'asdbturbo'),
					'color-info'		=> __('Info', 'asdbturbo'),
					'color-success'		=> __('Success', 'asdbturbo'),
					'color-alert'		=> __('Alert', 'asdbturbo'),
	    			),
           		),
            array(
				'name'      => __( 'Block Type', 'asdbturbo' ),
				'desc'      => __( 'Select Block Type', 'asdbturbo' ),
				'id'        => 'block_id',
				'type'      => 'radio_image',
				'default'	=> '1',
				    'options' => array(
							'1'	=> __('Block 1', 'asdbturbo'),
							'2'	=> __('Block 2', 'asdbturbo'),
							'3'	=> __('Block 3', 'asdbturbo'),
							),
		    		'src' => array(
							'1'	=> get_template_directory_uri() . '/assets/images/theme/block_1.png',
							'2'	=> get_template_directory_uri() . '/assets/images/theme/block_2.png',
							'3'	=> get_template_directory_uri() . '/assets/images/theme/block_3.png'
		    				),
            		),
             array(
				'name'       => __( 'Block Style', 'asdbturbo' ),
				'desc'       => __( 'Select Block Style', 'asdbturbo' ),
				'id'         => 'cat_style',
				'type'       => 'radio_image',
				'default'	=> 'style-1',
				    'options' => array(
							'style-1'	=> __('Style 1', 'asdbturbo'),
							'style-2'	=> __('Style 2', 'asdbturbo'),
							'style-3'	=> __('Style 3', 'asdbturbo'),
							),
		    		'src' => array(
							'style-1'	=> get_template_directory_uri() . '/assets/images/theme/style-1.png',
							'style-2'	=> get_template_directory_uri() . '/assets/images/theme/style-2.png',
							'style-3'	=> get_template_directory_uri() . '/assets/images/theme/style-3.png'
		    				),
            		),

				array(
					'name'    => 'Number columns',
					'desc'    => '',
					'id'      => 'cat_col',
					'type'    => 'select',
					'default'	=> '2',
					    'options' => array(
						'1'	=> __('1', 'asdbturbo'),
						'2'	=> __('2', 'asdbturbo'),
						'3'	=> __('3', 'asdbturbo'),
						'4'	=> __('4', 'asdbturbo'),
						'6'	=> __('6', 'asdbturbo'),
					),
				),
				array(
					'name'    => 'Ajax LoadMore',
					'desc'    => 'Show Ajax Loadmore Button',
					'id'      => 'loadmore',
					'type'    => 'select',
					'default'	=> '0',
					    'options' => array(
						'0'	=> __('No', 'asdbturbo'),
						'1'	=> __('Yes', 'asdbturbo'),
					),
				),
        );
        return array_merge( $fields, $new_fields );
    }

add_filter( 'wds_page_builder_fields_block', 'fields_for_block' );
