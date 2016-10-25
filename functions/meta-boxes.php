<?php

/*  Initialize the meta boxes.
/* ------------------------------------ */
add_action( 'admin_init', '_custom_meta_boxes' );

function _custom_meta_boxes() {

/*  Custom meta boxes
/* ------------------------------------ */


$test_options = array(

	'id'          => 'term_options',
	'title'       => __('Term Options', 'asdbturbo'),
	'desc'        => ' ',
	'pages'       => array( 'category'),
	'context'     => 'normal',
	'priority'    => 'high',
	'fields'      => array(
//		array(
//			'id'		=> 'fslider',
//			'label'		=> __('Featured Slider', 'asdbturbo'),
//			'std'		=> 'no',
//			'desc'        => 'Featured Slider for Taxonomy ',
//			'type'		=> 'select',
//			'choices'	=> array(
//				array(
//					'value' => 'no',
//					'label' => __('No', 'asdbturbo'),
//				),
//				array(
//					'value' => 'fslider_style_1',
//					'label' => __('Style 1', 'asdbturbo'),
//				),
//			)
//		),

		array(
			'id'		=> 'shortcode_block',
			'label'		=> __('Shortcode for Block', 'asdbturbo'),
			'std'		=> '',
			'type'		=> 'text',
		),
		array(
			'label'		=> __('Columns Number', 'asdbturbo'),
			'id'		=> 'col_num',
			'type'		=> 'radio-image',
			'desc'		=> ' ',
			'std'		=> 'inherit',
			'choices'	=> array(
				array(
					'value'		=> 'inherit',
					'label'		=> __('Global Settings', 'asdbturbo'),
					'src'		=> get_template_directory_uri() . '/assets/images/theme/gs.png'
				),
				array(
					'value'		=> '1',
					'label'		=> __('One Column', 'asdbturbo'),
					'src'		=> get_template_directory_uri() . '/assets/images/theme/col-1.png'
				),
				array(
					'value'		=> '2',
					'label'		=> __('Two Column', 'asdbturbo'),
					'src'		=> get_template_directory_uri() . '/assets/images/theme/col-2.png'
				),
				array(
					'value'		=> '3',
					'label'		=> __('Three Column', 'asdbturbo'),
					'src'		=> get_template_directory_uri() . '/assets/images/theme/col-3.png'
				),
			)
		),
		array(
			'label'		=> __('Taxonomy Style', 'asdbturbo'),
			'id'		=> 'cat_style',
			'type'		=> 'radio-image',
			'desc'		=> ' ',
			'std'		=> 'inherit',
			'choices'	=> array(
				array(
					'value'		=> 'inherit',
					'label'		=> __('Global Settings', 'asdbturbo'),
					'src'		=> get_template_directory_uri() . '/assets/images/theme/gs.png'
				),
				array(
					'value'		=> 'cat-style-1',
					'label'		=> 'Style 1',
					'src'		=> get_template_directory_uri() . '/assets/images/theme/block_10.png'
				),
				array(
					'value'		=> 'cat-style-2',
					'label'		=> 'Style 2',
					'src'		=> get_template_directory_uri() . '/assets/images/theme/block_3.png'
				),
				array(
					'value'		=> 'cat-style-3',
					'label'		=> 'Style 3',
					'src'		=> get_template_directory_uri() . '/assets/images/theme/block_1.png'
				),
				array(
					'value'		=> 'cat-style-4',
					'label'		=> 'Style 4',
					'src'		=> get_template_directory_uri() . '/assets/images/theme/block_2.png'
				),
			)
		),
		array(
			'label'		=> __('Title Background', 'asdbturbo'),
			'id'		=> 'title_background',
			'desc'      => 'Set Background Color or Image for Title',
			'type'		=> 'background',
		),

	),
);


$page_options = array(
	'id'          => 'page_options',
	'title'       => 'Page Options',
	'desc'        => '',
	'pages'       => array( 'page' ),
	'context'     => 'normal',
	'priority'    => 'high',
	'fields'      => array(
		array(
			'label'		=> 'Page Title',
			'id'		=> '_pagetitle',
			'type'		=> 'on-off',
			'desc'		=> 'Display Page Title+Breadcrumbs',
			'std'		=> 'on',
		),
		array(
			'id'		=> 'page_background',
			'label'		=> 'Page Background',
			'desc'		=> 'Set background color and/or upload your own background image',
			'type'		=> 'background',
			'std'		=> '',
		),
		array(
			'label'		=> 'Primary Sidebar',
			'id'		=> '_sidebar_primary',
			'type'		=> 'sidebar-select',
			'desc'		=> ''
		),
		array(
			'label'		=> 'Secondary Sidebar',
			'id'		=> '_sidebar_secondary',
			'type'		=> 'sidebar-select',
			'desc'		=> ''
		),
		array(
			'label'		=> 'Layout',
			'id'		=> '_layout',
			'type'		=> 'radio-image',
			'desc'		=> '',
			'std'		=> 'inherit',
			'choices'	=> array(
				array(
					'value'		=> 'inherit',
					'label'		=> 'Inherit Layout',
					'src'		=> get_template_directory_uri() . '/functions/images/layout-off.png'
				),
				array(
					'value'		=> 'col-1c',
					'label'		=> '1 Column',
					'src'		=> get_template_directory_uri() . '/functions/images/col-1c.png'
				),
				array(
					'value'		=> 'col-2cl',
					'label'		=> '2 Column Left',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cl.png'
				),
				array(
					'value'		=> 'col-2cr',
					'label'		=> '2 Column Right',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cr.png'
				),
			)
		),
	)
);

$section_options = array(
	'id'          => 'section_options',
	'title'       => 'Section Options',
	'desc'        => '',
	'pages'       => array( 'page' ),
	'context'     => 'normal',
	'priority'    => 'high',
	'fields'      => array(
		array(
			'label'		=> 'Featured Post Slider from Category/Tag',
			'id'		=> '_featured_slider',
			'type'		=> 'on-off',
			'desc'		=> 'Display slider for Page',
			'std'		=> 'off',
		),
		array(
		    'id'          => 'featured_category',
    		'label'        => __( 'Select Category for Featured Posts Slider', 'asdbturbo' ),
    		'type'        => 'category-select',
			'condition'   => '_featured_slider:is(on)',
		),
		array(
		    'id'          => 'featured_tag',
    		'label'       => __( 'Select Таg for Featured Posts Slider', 'asdbturbo' ),
    		'type'        => 'tag-select',
    		'condition'   => '_featured_slider:is(on)',
		),
		array(
		    'id'          => 'featured_limit',
    		'label'       => __( 'Select limit nember of post', 'asdbturbo' ),
    		'type'        => 'numeric-slider',
    		'std'		=> '5',
    		'min_max_step'=> '1,6,1',
    		'condition'   => '_featured_slider:is(on)',
		),
		array(
		    'id'          => 'featured_tag_1',
    		'label'       => __( 'Select Таg for Featured Block 1', 'asdbturbo' ),
    		'type'        => 'tag-select',
    		'condition'   => '_featured_slider:is(on)',
		),
		array(
		    'id'          => 'featured_tag_2',
    		'label'       => __( 'Select Таg for Featured Block 2', 'asdbturbo' ),
    		'type'        => 'tag-select',
    		'condition'   => '_featured_slider:is(on)',
		),
		array(
		    'id'          => 'featured_tag_3',
    		'label'       => __( 'Select Таg for Featured Block 3', 'asdbturbo' ),
    		'type'        => 'tag-select',
    		'condition'   => '_featured_slider:is(on)',
		),
		array(
		    'id'          => 'featured_tag_4',
    		'label'       => __( 'Select Таg for Featured Block 4', 'asdbturbo' ),
    		'type'        => 'tag-select',
    		'condition'   => '_featured_slider:is(on)',
		),

		array(
			'id'		=> '_featured_style',
			'label'       => __( 'Style for Featured Blocks', 'asdbturbo' ),
			'type'		=> 'select',
			'std'		=> 'style1',
			'condition'   => '_featured_slider:is(on)',
			'choices'	=> array(
				array(
					'value'		=> 'style1',
					'label'		=> 'Style 1',
				),
				array(
					'value'		=> 'style2',
					'label'		=> 'Style 2',
				),
				array(
					'value'		=> 'style3',
					'label'		=> 'Style 3',
				),
				array(
					'value'		=> 'style4',
					'label'		=> 'Style 4',
				),
			),
		),
		array(
    		'label'       => __( 'Post carusel from Category', 'asdbturbo' ),
			'id'		=> '_carousel',
    		'type'        => 'on-off',
    		'std'		=> 'off',
		),
		array(
		    'id'          => '_carousel_category',
    		'desc'        => __( 'Select Category for Carusel', 'asdbturbo' ),
    		'type'        => 'category-select',
			'condition'   => '_carousel:is(on)',
		),
		array(
			'label'		=> 'Related posts from Tags',
			'id'		=> '_related_type',
			'type'		=> 'on-off',
			'desc'		=> __( 'Show related posts', 'asdbturbo' ),
			'std'		=> 'off',
		),
		array(
		    'id'          => 'related_tag',
    		'label'       => __( 'Select Таg for related', 'asdbturbo' ),
    		'desc'        => __( 'Select Tag for related', 'asdbturbo' ),
    		'type'        => 'tag-select',
    		'condition'   => '_related_type:is(on)',
		),
		array(
			'id'		=> '_numlinks',
			'type'		=> 'select',
			'desc'		=> __( 'Number Links ', 'asdbturbo' ),
			'std'		=> '4',
			'condition'   => '_related_type:is(on)',
			'choices'	=> array(
				array(
					'value'		=> '2',
					'label'		=> '2',
				),
				array(
					'value'		=> '4',
					'label'		=> '4',
				),
				array(
					'value'		=> '6',
					'label'		=> '6',
				),
			),
		),
	)
);


$post_options = array(
	'id'          => 'post-options',
	'title'       => 'Post Options',
	'desc'        => '',
	'pages'       => array( 'post' ),
	'context'     => 'normal',
	'priority'    => 'high',
	'fields'      => array(
		array(
			'id'		=> '_thumb',
			'label'		=> 'Use Thumbnail image for post',
			'desc'		=> '',
			'std'		=> 'on',
			'type'		=> 'on-off',
		),
		array(
			'label'		=> 'Primary Sidebar',
			'id'		=> '_sidebar_primary',
			'type'		=> 'sidebar-select',
			'desc'		=> 'Overrides default'
		),
		array(
			'label'		=> 'Secondary Sidebar',
			'id'		=> '_sidebar_secondary',
			'type'		=> 'sidebar-select',
			'desc'		=> 'Overrides default'
		),
		array(
			'label'		=> 'Related link Block',
			'id'		=> '_related_type',
			'type'		=> 'radio',
			'desc'		=> 'Показать релевантные материалы по тэгам или по индивидуальному выбору',
			'std'		=> '2',
			'choices'	=> array(
				array(
					'value'		=> '0',
					'label'		=> __( 'Dont Show', 'asdbturbo' ),
				),
				array(
					'value'		=> '1',
					'label'		=> __( 'Individual Tag', 'asdbturbo' ),
				),
				array(
					'value'		=> '2',
					'label'		=> __( 'Global Settings', 'asdbturbo' ),
				),
			),
		),
		array(
		    'id'          => 'related_tag',
    		'label'       => __( 'Select Таg for related', 'asdbturbo' ),
    		'desc'        => __( 'Select Tag for related', 'asdbturbo' ),
    		'type'        => 'tag-select',
    		'condition'   => '_related_type:is(1)',
		),
		array(
			'label'		=> 'Style',
			'id'		=> '_style',
			'type'		=> 'radio-image',
			'desc'		=> 'Overrides the default style',
			'std'		=> 'style-3',
			'choices'	=> array(
				array(
					'value'		=> 'style-1',
					'label'		=> 'Style 1',
					'src'		=> get_template_directory_uri() . '/functions/images/block_1.png'
				),
				array(
					'value'		=> 'style-2',
					'label'		=> 'Style 2',
					'src'		=> get_template_directory_uri() . '/functions/images/block_2.png'
				),
				array(
					'value'		=> 'style-3',
					'label'		=> 'Style 3',
					'src'		=> get_template_directory_uri() . '/functions/images/single-style-3.png'
				),
			),
		),
		array(
			'label'		=> 'Layout',
			'id'		=> '_layout',
			'type'		=> 'radio-image',
			'desc'		=> 'Overrides the default layout option',
			'std'		=> 'inherit',
			'choices'	=> array(
				array(
					'value'		=> 'inherit',
					'label'		=> 'Inherit Layout',
					'src'		=> get_template_directory_uri() . '/functions/images/layout-off.png'
				),
				array(
					'value'		=> 'col-1c',
					'label'		=> '1 Column',
					'src'		=> get_template_directory_uri() . '/functions/images/col-1c.png'
				),
				array(
					'value'		=> 'col-2cl',
					'label'		=> '2 Column Left',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cl.png'
				),
				array(
					'value'		=> 'col-2cr',
					'label'		=> '2 Column Right',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cr.png'
				),
			),
		),
	)
);

$post_format_audio = array(
	'id'          => 'format-audio',
	'title'       => 'Format: Audio',
	'desc'        => 'These settings enable you to embed audio into your posts. You must provide both .mp3 and .ogg/.oga file formats in order for self hosted audio to function accross all browsers.',
	'pages'       => array( 'post' ),
	'context'     => 'normal',
	'priority'    => 'high',
	'fields'      => array(
		array(
			'label'		=> 'MP3 File URL',
			'id'		=> '_audio_mp3_url',
			'type'		=> 'upload',
			'desc'		=> 'The URL to the .mp3 or .m4a audio file'
		),
		array(
			'label'		=> 'OGA File URL',
			'id'		=> '_audio_ogg_url',
			'type'		=> 'upload',
			'desc'		=> 'The URL to the .oga, .ogg audio file'
		)
	)
);
$post_format_gallery = array(
	'id'          => 'format-gallery',
	'title'       => 'Format: Gallery',
	'desc'        => '<a title="Add Media" data-editor="content" class="button insert-media add_media" id="insert-media-button" href="#">Add Media</a> <br /><br />
						To create a gallery, upload your images and then select "<strong>Uploaded to this post</strong>" from the dropdown (in the media popup) to see images attached to this post. You can drag to re-order or delete them there. <br /><br /><i>Note: Do not click the "Insert into post" button. Only use the "Insert Media" section of the upload popup, not "Create Gallery" which is for standard post galleries.</i>',
	'pages'       => array( 'post' ),
	'context'     => 'normal',
	'priority'    => 'high',
	'fields'      => array()
);
$post_format_chat = array(
	'id'          => 'format-chat',
	'title'       => 'Format: Chat',
	'desc'        => 'Input chat dialogue.',
	'pages'       => array( 'post' ),
	'context'     => 'normal',
	'priority'    => 'high',
	'fields'      => array(
		array(
			'label'		=> 'Chat Text',
			'id'		=> '_chat',
			'type'		=> 'textarea',
			'rows'		=> '2'
		)
	)
);
$post_format_link = array(
	'id'          => 'format-link',
	'title'       => 'Format: Link',
	'desc'        => 'Input your link.',
	'pages'       => array( 'post' ),
	'context'     => 'normal',
	'priority'    => 'high',
	'fields'      => array(
		array(
			'label'		=> 'Link Title',
			'id'		=> '_link_title',
			'type'		=> 'text'
		),
		array(
			'label'		=> 'Link URL',
			'id'		=> '_link_url',
			'type'		=> 'text'
		)
	)
);
$post_format_quote = array(
	'id'          => 'format-quote',
	'title'       => 'Format: Quote',
	'desc'        => 'Input your quote.',
	'pages'       => array( 'post' ),
	'context'     => 'normal',
	'priority'    => 'high',
	'fields'      => array(
		array(
			'label'		=> 'Quote',
			'id'		=> '_quote',
			'type'		=> 'textarea',
			'rows'		=> '2'
		),
		array(
			'label'		=> 'Quote Author',
			'id'		=> '_quote_author',
			'type'		=> 'text'
		)
	)
);
$post_format_video = array(
	'id'          => 'format-video',
	'title'       => 'Format: Video',
	'desc'        => 'These settings enable you to embed videos into your posts.',
	'pages'       => array( 'post' ),
	'context'     => 'normal',
	'priority'    => 'high',
	'fields'      => array(
		array(
			'label'		=> 'Video URL',
			'id'		=> '_video_url',
			'type'		=> 'text',
			'desc'		=> ''
		)
	)
);



/*  Register meta boxes
/* ------------------------------------ */
	ot_register_meta_box( $page_options );
	ot_register_meta_box( $section_options );
	ot_register_meta_box( $post_format_audio );
	ot_register_meta_box( $post_format_chat );
	ot_register_meta_box( $post_format_gallery );
	ot_register_meta_box( $post_format_link );
	ot_register_meta_box( $post_format_quote );
	ot_register_meta_box( $post_format_video );
	ot_register_meta_box( $post_options );
	register_taxmeta( $test_options );
}
