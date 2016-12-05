<?php



/*
  Initialize the options before anything else.
/* ------------------------------------ */
add_action( 'admin_init', 'custom_theme_options', 1 );


/*
  Build the custom settings & update OptionTree.
/* ------------------------------------ */
function custom_theme_options() {
	 $gfont = new WPB_Gfonts();

	// Get a copy of the saved settings array.
	$saved_settings = get_option( 'option_tree_settings', array() );

	// Custom settings array that will eventually be passed to the OptionTree Settings API Class.
	$custom_settings = array(

/*
  Help pages
/* ------------------------------------ */
	'contextual_help' => array(
	  'content'       => array(
		array(
		  'id'        => 'general_help',
		  'title'     => 'Documentation',
		  'content'   => '<h1>https://asdbthemes.ru/asdbbase/</h1><p>Thanks for using this theme! Enjoy.</p>',
		),
	  ),
	),

/*
  Admin panel sections
/* ------------------------------------ */
	'sections'        => array(
		array(
			'id'		=> 'general',
			'title'		=> 'General',
		),
		array(
			'id'		=> 'blog',
			'title'		=> 'Blog',
		),
		array(
			'id'		=> 'header',
			'title'		=> 'Header',
		),
		array(
			'id'		=> 'footer',
			'title'		=> 'Footer',
		),
		array(
			'id'		=> 'layout',
			'title'		=> 'Layout',
		),
		array(
			'id'		=> 'sidebars',
			'title'		=> 'Sidebars',
		),
		array(
			'id'		=> 'social-links',
			'title'		=> 'Social Links',
		),
		array(
			'id'		=> 'styling',
			'title'		=> 'Styling',
		),
		array(
			'id'		=> 'fonts',
			'title'		=> 'Fonts',
		),
		array(
			'id'		=> 'site',
			'title'		=> 'Custom Post Type',
		),
		array(
			'id'		=> 'addons',
			'title'		=> 'Addons',
		),

	),

/*
  Theme options
/* ------------------------------------ */
	'settings'        => array(
		// General: Favicon
		array(
			'id'		=> 'favicon',
			'label'		=> 'Favicon',
			'desc'		=> 'Upload a 16x16px Png/Gif image that will be your favicon',
			'type'		=> 'upload',
			'std'		=> get_template_directory_uri() . '/assets/images/favicon.png',
			'section'	=> 'general',
		),
		array(
			'id'		=> 'color_accent',
			'label'		=> 'Accent Color',
			'desc'		=> '',
			'type'		=> 'colorpicker',
			'std'		=> '#e31e24',
			'section'	=> 'general',
		),
		array(
			'id'		=> 'color_primary',
			'label'		=> 'Primary Color',
			'desc'		=> 'Menu, footer Background color',
			'type'		=> 'colorpicker',
			'std'		=> '#2d2d2d',
			'section'	=> 'general',
		),
		array(
			'id'		=> 'color_secondary',
			'label'		=> 'Secondary Color',
			'desc'		=> 'Menu, footer color',
			'type'		=> 'colorpicker',
			'std'		=> '#fafafa',
			'section'	=> 'general',
		),

		// General: Tracking Code
		array(
			'id'		=> 'tracking-code',
			'label'		=> 'Tracking Code',
			'desc'		=> 'Paste your Google Analytics (or other) tracking code here. It will be inserted before the closing body tag of your theme.',
			'type'		=> 'textarea-simple',
			'section'	=> 'general',
			'rows'		=> '3',
		),
		// General: Comments
		array(
			'id'		=> 'site-background',
			'label'		=> 'Site Background',
			'desc'		=> 'Set background color and/or upload your own background image',
			'type'		=> 'background',
			'std'		=> '#f1f1f1',
			'section'	=> 'general',
		),
		array(
			'id'		=> 'page-comments',
			'label'		=> 'Page Comments',
			'desc'		=> 'Comments on pages',
			'std'		=> 'off',
			'type'		=> 'on-off',
			'section'	=> 'general',
		),
		// General: Recommended Plugins
		array(
			'id'		=> 'recommended-plugins',
			'label'		=> 'Recommended Plugins',
			'desc'		=> 'Enable or disable the recommended plugins notice',
			'std'		=> 'on',
			'type'		=> 'on-off',
			'section'	=> 'general',
		),
		// Blog: Read More
		array(
			'id'			=> 'readmore',
			'label'			=> 'Read More Type',
			'desc'			=> '',
			'std'			=> '...',
			'section'		=> 'blog',
			'type'		=> 'select',
			'section'	=> 'blog',
			'choices'	=> array(
				array(
					'value' => 'button',
					'label' => 'Button',
				),
				array(
					'value' => '...',
					'label' => '...',
				),
				array(
					'value' => 'link',
					'label' => 'Link',
				),
			),

		),

		// Blog: Excerpt Length
		array(
			'id'			=> 'excerpt-length',
			'label'			=> 'Excerpt Length',
			'desc'			=> 'Maximum number of characters',
			'std'			=> '155',
			'type'			=> 'numeric-slider',
			'section'		=> 'blog',
			'min_max_step'	=> '0,400,1',
		),
		// Blog: Columns 1 or 2 or 3
		array(
			'id'		=> 'blog-columns',
			'label'		=> 'Number columns of Blog',
			'desc'		=> 'Show one, two or three post per row, image beside text',
			'std'		=> '2',
			'type'		=> 'select',
			'section'	=> 'blog',
			'choices'	=> array(
				array(
					'value' => '1',
					'label' => 'One columns',
				),
				array(
					'value' => '2',
					'label' => 'Two columns',
				),
				array(
					'value' => '3',
					'label' => 'Three columns',
				),
			),
		),
		// Blog: Thumbnail Placeholder
		array(
			'id'		=> 'placeholder',
			'label'		=> 'Thumbnail Placeholder',
			'desc'		=> 'Show featured image placeholders if no featured image is set',
			'std'		=> 'on',
			'type'		=> 'on-off',
			'section'	=> 'blog',
		),
		// Blog: Single - Sharrre
		array(
			'id'		=> 'sharrre',
			'label'		=> 'Single &mdash; Share Bar',
			'desc'		=> 'Social sharing buttons for each article',
			'std'		=> 'on',
			'type'		=> 'on-off',
			'section'	=> 'blog',
		),
		// Blog: Twitter Username
		array(
			'id'		=> 'twitter-username',
			'label'		=> 'Twitter Username',
			'desc'		=> 'Your @username will be added to share-tweets of your posts (optional)',
			'type'		=> 'text',
			'section'	=> 'blog',
		),
		array(
			'id'		=> 'related-posts',
			'label'		=> 'Single &mdash; Related Posts',
			'desc'		=> 'Shows randomized related articles below the post',
			'std'		=> 'categories',
			'type'		=> 'radio',
			'section'	=> 'blog',
			'choices'	=> array(
				array(
					'value' => '1',
					'label' => 'Disable',
				),
				array(
					'value' => 'categories',
					'label' => 'Related by categories',
				),
				array(
					'value' => 'tags',
					'label' => 'Related by tags',
				),
			),
		),
		// Blog: Single - Authorbox
		array(
			'id'		=> 'author-bio',
			'label'		=> 'Single &mdash; Author Bio',
			'desc'		=> 'Shows post author description, if it exists',
			'std'		=> 'off',
			'type'		=> 'on-off',
			'section'	=> 'blog',
		),
		// Header: Style
		array(
			'id'		=> 'header-style',
			'label'		=> 'Style for header',
			'desc'		=> 'Style for header',
			'std'		=> 'style1',
			'type'		=> 'radio-image',
			'section'	=> 'header',
			'choices'	=> array(
				array(
					'value'		=> 'style1',
					'label'		=> 'Style 1',
					'src'		=> get_template_directory_uri() . '/functions/images/header-style1.png',
				),
			),
		),
		// Header: Ads
		array(
			'id'		=> 'header-ads',
			'label'		=> 'Header widget area',
			'desc'		=> 'Header widget area',
			'std'		=> 'off',
			'type'		=> 'on-off',
			'section'	=> 'header',
		),
		// Header: Nav Menu
		array(
			'id'		=> 'nav-menu-full',
			'label'		=> 'Full Width Nav Menu',
			'desc'		=> 'ON - Full Width Nav Menu / OFF Block Width Nav Menu',
			'std'		=> 'on',
			'type'		=> 'on-off',
			'section'	=> 'header',
		),
		// Header: Custom Logo
		array(
			'id'		=> 'custom-logo',
			'label'		=> 'Custom Logo',
			'desc'		=> 'Upload your custom logo image. Set logo max-height in styling options.',
			'type'		=> 'upload',
			'section'	=> 'header',
		),
		// Header: Site Description
		array(
			'id'		=> 'site-description',
			'label'		=> 'Site Description',
			'desc'		=> 'The description that appears next to your logo',
			'std'		=> 'off',
			'type'		=> 'on-off',
			'section'	=> 'header',
		),
		// Header: Header Image
		array(
			'id'		=> 'header_image',
			'label'		=> 'Header Image',
			'desc'		=> 'Upload a header image. This will disable header title/logo and description.',
			'type'		=> 'upload',
			'section'	=> 'header',
		),
		// Footer: Style
		array(
			'id'		=> 'footer-style',
			'label'		=> 'Style for footer',
			'desc'		=> 'Style for footer',
			'std'		=> 'footer-style-3',
			'type'		=> 'radio-image',
			'section'	=> 'footer',
			'choices'	=> array(
				array(
					'value'		=> 'footer-style-1',
					'label'		=> 'Style 1',
					'src'		=> get_template_directory_uri() . '/functions/images/footer-style1.png',
				),
				array(
					'value'		=> 'footer-style-2',
					'label'		=> 'Style 2',
					'src'		=> get_template_directory_uri() . '/functions/images/footer-style2.png',
				),
				array(
					'value'		=> 'footer-style-3',
					'label'		=> 'Style 3',
					'src'		=> get_template_directory_uri() . '/functions/images/footer-style3.png',
				),
			),
		),

		// Footer: Ads
		array(
			'id'		=> 'footer-ads',
			'label'		=> 'Footer Ads',
			'desc'		=> 'Footer widget ads area',
			'std'		=> 'off',
			'type'		=> 'on-off',
			'section'	=> 'footer',
		),
		array(
			'id'		=> 'footer-ads-sidebar',
			'label'		=> 'Sidebar for footer ads',
			'type'		=> 'sidebar-select',
			'section'	=> 'footer',
			'condition'   => 'footer-ads:is(on)',
		),
		// Footer: Custom Logo
		array(
			'id'		=> 'footer-logo',
			'label'		=> 'Footer Logo',
			'desc'		=> 'Upload your custom logo image',
			'type'		=> 'upload',
			'section'	=> 'footer',
		),
		// Footer: Copyright
		array(
			'id'		=> 'copyright',
			'label'		=> 'Footer Copyright',
			'desc'		=> 'Replace the footer copyright text',
			'type'		=> 'text',
			'section'	=> 'footer',
		),
		// Footer: Footer text
		array(
			'id'		=> 'footer-text',
			'label'		=> 'Footer text',
			'desc'		=> '',
			'type'		=> 'textarea',
			'section'	=> 'footer',
		),
		// Footer: Credit
		array(
			'id'		=> 'credit',
			'label'		=> 'Footer Credit',
			'desc'		=> 'Footer credit text',
			'std'		=> 'on',
			'type'		=> 'on-off',
			'section'	=> 'footer',
		),
		// Layout : Global
		array(
			'id'		=> 'layout-global',
			'label'		=> 'Global Layout',
			'desc'		=> 'Other layouts will override this option if they are set',
			'std'		=> 'col-1c',
			'type'		=> 'radio-image',
			'section'	=> 'layout',
			'choices'	=> array(
				array(
					'value'		=> 'col-1c',
					'label'		=> '1 Column',
					'src'		=> get_template_directory_uri() . '/functions/images/col-1c.png',
				),
				array(
					'value'		=> 'col-2cl',
					'label'		=> '2 Column Left',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cl.png',
				),
				array(
					'value'		=> 'col-2cr',
					'label'		=> '2 Column Right',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cr.png',
				),
			),
		),
		// Layout : Home
		array(
			'id'		=> 'layout-home',
			'label'		=> 'Home',
			'desc'		=> '[ <strong>is_home</strong> ] Posts homepage layout',
			'std'		=> 'inherit',
			'type'		=> 'radio-image',
			'section'	=> 'layout',
			'choices'	=> array(
				array(
					'value'		=> 'inherit',
					'label'		=> 'Inherit Global Layout',
					'src'		=> get_template_directory_uri() . '/functions/images/layout-off.png',
				),
				array(
					'value'		=> 'col-1c',
					'label'		=> '1 Column',
					'src'		=> get_template_directory_uri() . '/functions/images/col-1c.png',
				),
				array(
					'value'		=> 'col-2cl',
					'label'		=> '2 Column Left',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cl.png',
				),
				array(
					'value'		=> 'col-2cr',
					'label'		=> '2 Column Right',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cr.png',
				),
			),
		),
		// Layout : Single
		array(
			'id'		=> 'layout-single',
			'label'		=> 'Single',
			'desc'		=> '[ <strong>is_single</strong> ] Single post layout - If a post has a set layout, it will override this.',
			'std'		=> 'inherit',
			'type'		=> 'radio-image',
			'section'	=> 'layout',
			'choices'	=> array(
				array(
					'value'		=> 'inherit',
					'label'		=> 'Inherit Global Layout',
					'src'		=> get_template_directory_uri() . '/functions/images/layout-off.png',
				),
				array(
					'value'		=> 'col-1c',
					'label'		=> '1 Column',
					'src'		=> get_template_directory_uri() . '/functions/images/col-1c.png',
				),
				array(
					'value'		=> 'col-2cl',
					'label'		=> '2 Column Left',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cl.png',
				),
				array(
					'value'		=> 'col-2cr',
					'label'		=> '2 Column Right',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cr.png',
				),
			),
		),
		// Layout : Archive
		array(
			'id'		=> 'layout-archive',
			'label'		=> 'Archive',
			'desc'		=> '[ <strong>is_archive</strong> ] Category, date, tag and author archive layout',
			'std'		=> 'inherit',
			'type'		=> 'radio-image',
			'section'	=> 'layout',
			'choices'	=> array(
				array(
					'value'		=> 'inherit',
					'label'		=> 'Inherit Global Layout',
					'src'		=> get_template_directory_uri() . '/functions/images/layout-off.png',
				),
				array(
					'value'		=> 'col-1c',
					'label'		=> '1 Column',
					'src'		=> get_template_directory_uri() . '/functions/images/col-1c.png',
				),
				array(
					'value'		=> 'col-2cl',
					'label'		=> '2 Column Left',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cl.png',
				),
				array(
					'value'		=> 'col-2cr',
					'label'		=> '2 Column Right',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cr.png',
				),
			),
		),
		// Layout : Archive - Category
		array(
			'id'		=> 'layout-archive-category',
			'label'		=> 'Archive &mdash; Category',
			'desc'		=> '[ <strong>is_category</strong> ] Category archive layout',
			'std'		=> 'inherit',
			'type'		=> 'radio-image',
			'section'	=> 'layout',
			'choices'	=> array(
				array(
					'value'		=> 'inherit',
					'label'		=> 'Inherit Global Layout',
					'src'		=> get_template_directory_uri() . '/functions/images/layout-off.png',
				),
				array(
					'value'		=> 'col-1c',
					'label'		=> '1 Column',
					'src'		=> get_template_directory_uri() . '/functions/images/col-1c.png',
				),
				array(
					'value'		=> 'col-2cl',
					'label'		=> '2 Column Left',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cl.png',
				),
				array(
					'value'		=> 'col-2cr',
					'label'		=> '2 Column Right',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cr.png',
				),
			),
		),
		// Layout : Search
		array(
			'id'		=> 'layout-search',
			'label'		=> 'Search',
			'desc'		=> '[ <strong>is_search</strong> ] Search page layout',
			'std'		=> 'inherit',
			'type'		=> 'radio-image',
			'section'	=> 'layout',
			'choices'	=> array(
				array(
					'value'		=> 'inherit',
					'label'		=> 'Inherit Global Layout',
					'src'		=> get_template_directory_uri() . '/functions/images/layout-off.png',
				),
				array(
					'value'		=> 'col-1c',
					'label'		=> '1 Column',
					'src'		=> get_template_directory_uri() . '/functions/images/col-1c.png',
				),
				array(
					'value'		=> 'col-2cl',
					'label'		=> '2 Column Left',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cl.png',
				),
				array(
					'value'		=> 'col-2cr',
					'label'		=> '2 Column Right',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cr.png',
				),
			),
		),
		// Layout : Error 404
		array(
			'id'		=> 'layout-404',
			'label'		=> 'Error 404',
			'desc'		=> '[ <strong>is_404</strong> ] Error 404 page layout',
			'std'		=> 'inherit',
			'type'		=> 'radio-image',
			'section'	=> 'layout',
			'choices'	=> array(
				array(
					'value'		=> 'inherit',
					'label'		=> 'Inherit Global Layout',
					'src'		=> get_template_directory_uri() . '/functions/images/layout-off.png',
				),
				array(
					'value'		=> 'col-1c',
					'label'		=> '1 Column',
					'src'		=> get_template_directory_uri() . '/functions/images/col-1c.png',
				),
				array(
					'value'		=> 'col-2cl',
					'label'		=> '2 Column Left',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cl.png',
				),
				array(
					'value'		=> 'col-2cr',
					'label'		=> '2 Column Right',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cr.png',
				),
			),
		),
		// Layout : Default Page
		array(
			'id'		=> 'layout-page',
			'label'		=> 'Default Page',
			'desc'		=> '[ <strong>is_page</strong> ] Default page layout - If a page has a set layout, it will override this.',
			'std'		=> 'inherit',
			'type'		=> 'radio-image',
			'section'	=> 'layout',
			'choices'	=> array(
				array(
					'value'		=> 'inherit',
					'label'		=> 'Inherit Global Layout',
					'src'		=> get_template_directory_uri() . '/functions/images/layout-off.png',
				),
				array(
					'value'		=> 'col-1c',
					'label'		=> '1 Column',
					'src'		=> get_template_directory_uri() . '/functions/images/col-1c.png',
				),
				array(
					'value'		=> 'col-2cl',
					'label'		=> '2 Column Left',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cl.png',
				),
				array(
					'value'		=> 'col-2cr',
					'label'		=> '2 Column Right',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cr.png',
				),
			),
		),
		// Layout : Portfolio
		array(
			'id'		=> 'layout-portfolio',
			'label'		=> 'Portfolio Page',
			'desc'		=> '[ <strong>is post_type == portfolio</strong> ] Portfolio Page layout - If a page has a set layout, it will override this.',
			'std'		=> 'inherit',
			'type'		=> 'radio-image',
			'section'	=> 'layout',
			'choices'	=> array(
				array(
					'value'		=> 'inherit',
					'label'		=> 'Inherit Global Layout',
					'src'		=> get_template_directory_uri() . '/functions/images/layout-off.png',
				),
				array(
					'value'		=> 'col-1c',
					'label'		=> '1 Column',
					'src'		=> get_template_directory_uri() . '/functions/images/col-1c.png',
				),
				array(
					'value'		=> 'col-2cl',
					'label'		=> '2 Column Left',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cl.png',
				),
				array(
					'value'		=> 'col-2cr',
					'label'		=> '2 Column Right',
					'src'		=> get_template_directory_uri() . '/functions/images/col-2cr.png',
				),
			),
		),

		// Sidebars: Create Areas
		array(
			'id'		=> 'sidebar-areas',
			'label'		=> 'Create Sidebars',
			'desc'		=> 'You must save changes for the new areas to appear below. <br /><i>Warning: Make sure each area has a unique ID.</i>',
			'type'		=> 'list-item',
			'section'	=> 'sidebars',
			'choices'	=> array(),
			'settings'	=> array(
				array(
					'id'		=> 'id',
					'label'		=> 'Sidebar ID',
					'desc'		=> 'This ID must be unique, for example "sidebar-about"',
					'std'		=> 'sidebar-',
					'type'		=> 'text',
					'choices'	=> array(),
				),
			),
		),
		array(
			'id'		=> 'sidebar-width',
			'label'		=> 'Sidebar Width',
			'type'		=> 'select',
			'section'	=> 'sidebars',
			'std'		=> 'medium-4',
			'choices'	=> array(
				array(
					'value'		=> 'medium-3',
					'label'		=> 'medium-3',
				),
				array(
					'value'		=> 'medium-4',
					'label'		=> 'medium-4',
				),
			),
		),

		// Sidebar 1 & 2
		array(
			'id'		=> 's1-home',
			'label'		=> 'Home',
			'desc'		=> '[ <strong>is_home</strong> ] Primary',
			'type'		=> 'sidebar-select',
			'section'	=> 'sidebars',
		),
		array(
			'id'		=> 's2-home',
			'label'		=> 'Home',
			'desc'		=> '[ <strong>is_home</strong> ] Secondary',
			'type'		=> 'sidebar-select',
			'section'	=> 'sidebars',
		),
		array(
			'id'		=> 's1-single',
			'label'		=> 'Single',
			'desc'		=> '[ <strong>is_single</strong> ] Primary - If a single post has a unique sidebar, it will override this.',
			'type'		=> 'sidebar-select',
			'section'	=> 'sidebars',
		),
		array(
			'id'		=> 's2-single',
			'label'		=> 'Single',
			'desc'		=> '[ <strong>is_single</strong> ] Secondary - If a single post has a unique sidebar, it will override this.',
			'type'		=> 'sidebar-select',
			'section'	=> 'sidebars',
		),
		array(
			'id'		=> 's1-archive',
			'label'		=> 'Archive',
			'desc'		=> '[ <strong>is_archive</strong> ] Primary',
			'type'		=> 'sidebar-select',
			'section'	=> 'sidebars',
		),
		array(
			'id'		=> 's2-archive',
			'label'		=> 'Archive',
			'desc'		=> '[ <strong>is_archive</strong> ] Secondary',
			'type'		=> 'sidebar-select',
			'section'	=> 'sidebars',
		),
		array(
			'id'		=> 's1-archive-category',
			'label'		=> 'Archive &mdash; Category',
			'desc'		=> '[ <strong>is_category</strong> ] Primary',
			'type'		=> 'sidebar-select',
			'section'	=> 'sidebars',
		),
		array(
			'id'		=> 's2-archive-category',
			'label'		=> 'Archive &mdash; Category',
			'desc'		=> '[ <strong>is_category</strong> ] Secondary',
			'type'		=> 'sidebar-select',
			'section'	=> 'sidebars',
		),
		array(
			'id'		=> 's1-search',
			'label'		=> 'Search',
			'desc'		=> '[ <strong>is_search</strong> ] Primary',
			'type'		=> 'sidebar-select',
			'section'	=> 'sidebars',
		),
		array(
			'id'		=> 's2-search',
			'label'		=> 'Search',
			'desc'		=> '[ <strong>is_search</strong> ] Secondary',
			'type'		=> 'sidebar-select',
			'section'	=> 'sidebars',
		),
		array(
			'id'		=> 's1-404',
			'label'		=> 'Error 404',
			'desc'		=> '[ <strong>is_404</strong> ] Primary',
			'type'		=> 'sidebar-select',
			'section'	=> 'sidebars',
		),
		array(
			'id'		=> 's2-404',
			'label'		=> 'Error 404',
			'desc'		=> '[ <strong>is_404</strong> ] Secondary',
			'type'		=> 'sidebar-select',
			'section'	=> 'sidebars',
		),
		array(
			'id'		=> 's1-page',
			'label'		=> 'Default Page',
			'desc'		=> '[ <strong>is_page</strong> ] Primary - If a page has a unique sidebar, it will override this.',
			'type'		=> 'sidebar-select',
			'section'	=> 'sidebars',
		),
		array(
			'id'		=> 's2-page',
			'label'		=> 'Default Page',
			'desc'		=> '[ <strong>is_page</strong> ] Secondary - If a page has a unique sidebar, it will override this.',
			'type'		=> 'sidebar-select',
			'section'	=> 'sidebars',
		),

		// Social Links : List
		array(
			'id'		=> 'social-links',
			'label'		=> 'Social Links',
			'desc'		=> 'Create and organize your social links',
			'type'		=> 'list-item',
			'section'	=> 'social-links',
			'choices'	=> array(),
			'settings'	=> array(
				array(
					'id'		=> 'social-icon',
					'label'		=> 'Icon Name',
					'desc'		=> 'Font Awesome icon names [<a href="http://fortawesome.github.io/Font-Awesome/icons/" target="_blank"><strong>View all</strong>]</a>  ',
					'std'		=> 'icon-',
					'type'		=> 'text',
					'choices'	=> array(),
				),
				array(
					'id'		=> 'social-link',
					'label'		=> 'Link',
					'desc'		=> 'Enter the full url for your icon button',
					'std'		=> 'http://',
					'type'		=> 'text',
					'choices'	=> array(),
				),
				array(
					'id'		=> 'social-color',
					'label'		=> 'Icon Color',
					'desc'		=> 'Set a unique color for your icon (optional)',
					'std'		=> '',
					'type'		=> 'colorpicker',
				),
				array(
					'id'		=> 'social-target',
					'label'		=> 'Link Options',
					'desc'		=> '',
					'std'		=> '',
					'type'		=> 'checkbox',
					'choices'	=> array(
						array(
							'value' => '_blank',
							'label' => 'Open in new window',
						),
					),
				),
			),
		),

		// Styling: Enable
		array(
			'id'		=> 'dynamic-styles',
			'label'		=> 'Dynamic Styles',
			'desc'		=> 'Turn on to use the styling options below',
			'std'		=> 'on',
			'type'		=> 'on-off',
			'section'	=> 'styling',
		),
		// Styling: Container Width
		array(
			'id'			=> 'container-width',
			'label'			=> 'Website Max-width',
			'desc'			=> 'Max-width of the container. If you use 2 sidebars, your container should be at least 1200px.<br /><i>Note: For 720px content (default) use <strong>1380px</strong> for 2 sidebars and <strong>1120px</strong> for 1 sidebar. If you use a combination of both, try something inbetween.</i>',
			'std'			=> '1200',
			'type'			=> 'numeric-slider',
			'section'		=> 'styling',
			'min_max_step'	=> '990,1600,10',
		),
		// Styling: Featured Image
		array(
			'id'		=> 'featured-image',
			'label'		=> 'Featured Image',
			'desc'		=> 'Show featured image on single posts',
			'type'		=> 'on-off',
			'section'	=> 'styling',
			'std'		=> 'on',
		),
		// Styling: Boxed Layout
		array(
			'id'		=> 'boxed',
			'label'		=> 'Boxed Layout',
			'desc'		=> 'Use a boxed layout',
			'std'		=> 'off',
			'type'		=> 'on-off',
			'section'	=> 'styling',
		),
		// Styling: Image Border Radius
		array(
			'id'			=> 'image-border-radius',
			'label'			=> 'Image Border Radius',
			'desc'			=> 'Give your thumbnails and layout images rounded corners',
			'std'			=> '0',
			'type'			=> 'numeric-slider',
			'section'		=> 'styling',
			'min_max_step'	=> '0,15,1',
		),

		// Fonts:
		array(
			'id'		=> 'font-head',
			'label'		=> 'Font Head',
			'desc'		=> 'Select font for the theme',
			'type'		=> 'select',
			'std'		=> 'play',
			'section'	=> 'fonts',
			'choices'	=> $gfont->get_google_fonts_names(),// (array)asdb_fgonts('type=adm'),
		),

		array(
			'id'		=> 'font-meta',
			'label'		=> 'Font Meta',
			'desc'		=> 'Select font for the theme',
			'type'		=> 'select',
			'std'		=> 'cuprum',
			'section'	=> 'fonts',
			'choices'	=> $gfont->get_google_fonts_names(),// (array)asdb_fgonts('type=adm'),
		),
		array(
			'id'		=> 'font-body',
			'label'		=> 'Font Body',
			'desc'		=> 'Select font for the theme',
			'type'		=> 'select',
			'std'		=> 'open-sans',
			'section'	=> 'fonts',
			'choices'	=> $gfont->get_google_fonts_names(),// (array)asdb_fgonts('type=adm'),
		),
		array(
			'id'		=> 'font-subset',
			'label'		=> 'Font Subset',
			'desc'		=> '',
			'type'		=> 'checkbox',
			'std'		=> array( 2 => 'cyrillic', 10 => 'latin' ),
			'section'	=> 'fonts',
			'choices'	=> array(
	            array(
	            'label' => __( 'Arabic', 'asdbturbo' ),
	            'value' => 'arabic',
	            ),
	            array(
	            'label' => __( 'Bengali', 'asdbturbo' ),
		        'value' => 'bengali',
		        ),
	            array(
	            'label' => __( 'Cyrillic', 'asdbturbo' ),
			    'value' => 'cyrillic',
			    ),
	            array(
	            'label' => __( 'Cyrillic Ext', 'asdbturbo' ),
				'value' => 'cyrillic-ext',
				),
	            array(
	            'label' => __( 'Devanagari', 'asdbturbo' ),
				'value' => 'devanagari',
				),
	            array(
	            'label' => __( 'Greek', 'asdbturbo' ),
				'value' => 'greek',
				),
	            array(
	            'label' => __( 'Greek Ext', 'asdbturbo' ),
				'value' => 'greek-ext',
				),
	            array(
	            'label' => __( 'Gujarati', 'asdbturbo' ),
				'value' => 'gujarati',
				),
	            array(
	            'label' => __( 'Hebrew', 'asdbturbo' ),
				'value' => 'hebrew',
				),
	            array(
	            'label' => __( 'Khmer', 'asdbturbo' ),
				'value' => 'khmer',
				),
	            array(
	            'label' => __( 'Latin', 'asdbturbo' ),
				'value' => 'latin',
				),
	            array(
	            'label' => __( 'Latin Ext', 'asdbturbo' ),
				'value' => 'latin-ext',
				),
	            array(
	            'label' => __( 'Tamil', 'asdbturbo' ),
				'value' => 'tamil',
				),
	            array(
	            'label' => __( 'Telugu', 'asdbturbo' ),
				'value' => 'telugu',
				),
	            array(
	            'label' => __( 'Thai', 'asdbturbo' ),
				'value' => 'thai',
				),
	            array(
	            'label' => __( 'Vietnamese', 'asdbturbo' ),
				'value' => 'vietnamese',
				),
			),
		),

		// Site Structure
		array(
			'id'		=> 'site-gallery',
			'label'		=> 'Gallery',
			'desc'		=> 'Включить галлереи',
			'type'		=> 'on-off',
			'std'		=> 'off',
			'section'	=> 'site',
		),
		array(
			'id'		=> 'site-features',
			'label'		=> 'Features',
			'desc'		=> 'Включить Блоки',
			'type'		=> 'on-off',
			'std'		=> 'off',
			'section'	=> 'site',
		),
		array(
			'id'		=> 'site-portfolio',
			'label'		=> 'Portfolio',
			'desc'		=> 'Включить портфолио',
			'type'		=> 'on-off',
			'std'		=> 'off',
			'section'	=> 'site',
		),
		array(
			'id'		=> 'site-testimonials',
			'label'		=> 'Testimonials',
			'desc'		=> 'Включить отзывы',
			'type'		=> 'on-off',
			'std'		=> 'off',
			'section'	=> 'site',
		),
		array(
			'id'		=> 'site-services',
			'label'		=> 'Service',
			'desc'		=> 'Включить услуги',
			'type'		=> 'on-off',
			'std'		=> 'off',
			'section'	=> 'site',
		),
		array(
			'id'		=> 'site-partners',
			'label'		=> 'Clients / Partners',
			'desc'		=> 'Включить партнеры/клиенты',
			'type'		=> 'on-off',
			'std'		=> 'off',
			'rows'        => '5',
			'section'	=> 'site',
		),
		array(
			'id'		=> 'site-team',
			'label'		=> 'Our Team',
			'desc'		=> 'Включить команду',
			'type'		=> 'on-off',
			'std'		=> 'off',
			'rows'        => '1',
			'section'	=> 'site',
		),
		array(
			'id'		=> 'postviews',
			'label'		=> 'AJAX Postviews',
			'desc'		=> '',
			'type'		=> 'on-off',
			'std'		=> 'off',
			'section'	=> 'addons',
		),
		array(
			'id'		=> 'who_count',
			'desc'		=> 'Who count?',
			'std'		=> 'not_administrators',
			'type'		=> 'select',
			'section'	=> 'addons',
			'condition'   => 'postviews:is(on)',
			'choices'	=> array(
				array(
					'value' => 'all',
					'label' => 'All',
				),
				array(
					'value' => 'not_logged_users',
					'label' => 'Not logged users',
				),
				array(
					'value' => 'logged_users',
					'label' => 'Logged Users',
				),
				array(
					'value' => 'not_administrators',
					'label' => 'Not Administrators',
				),

			),
		),
		array(
			'id'		=> 'hold_sec',
			'desc'		=> 'Hold in sec',
			'std'		=> '2',
			'type'		=> 'select',
			'section'	=> 'addons',
			'condition'   => 'postviews:is(on)',
			'choices'	=> array(
				array(
					'value' => '1',
					'label' => '1',
				),
				array(
					'value' => '2',
					'label' => '2',
				),
				array(
					'value' => '3',
					'label' => '3',
				),
			),
		),
		array(
			'id'		=> 'breadcrumbs',
			'label'		=> 'Breadcrumbs',
			'desc'		=> '',
			'type'		=> 'on-off',
			'std'		=> 'off',
			'section'	=> 'addons',
		),
		array(
			'id'		=> 'crumbstype',
			'label'		=> 'Breadcrubs Type',
			'desc'		=> '',
			'std'		=> '1',
			'type'		=> 'select',
			'section'	=> 'addons',
			'condition'   => 'breadcrumbs:is(on)',
			'choices'	=> array(
				array(
					'value' => '1',
					'label' => 'Embedded in Theme',
				),
				array(
					'value' => '2',
					'label' => 'Breadcrumb NavXT',
				),
				array(
					'value' => '3',
					'label' => 'Yoast SEO Breadcrumb',
				),
			),
		),
		array(
			'id'		=> 'hero',
			'label'		=> 'Hero',
			'desc'		=> '',
			'type'		=> 'on-off',
			'std'		=> 'off',
			'section'	=> 'addons',
		),
		array(
			'id'		=> 'mmenu',
			'label'		=> 'Mega Menu',
			'desc'		=> '',
			'type'		=> 'on-off',
			'std'		=> 'off',
			'section'	=> 'addons',
		),
		array(
			'id'		=> 'pbuilder',
			'label'		=> 'Simple Page Builder',
			'desc'		=> '',
			'type'		=> 'on-off',
			'std'		=> 'off',
			'section'	=> 'addons',
		),

	),
);

/*
  Settings are not the same? Update the DB
/* ------------------------------------ */
	if ( $saved_settings !== $custom_settings ) {
		update_option( 'option_tree_settings', $custom_settings );
	}
}


if ( ! function_exists( 'tax_theme' ) ) {

	function asdb_tax_opt( $args = '' ) {
		$args = array(
			'type'         => 'post',
			'child_of'     => 0,
			'parent'       => '',
			'orderby'      => 'name',
			'order'        => 'ASC',
			'hide_empty'   => 1,
			'hierarchical' => 1,
			'exclude'      => '',
			'include'      => '',
			'number'       => 0,
			'taxonomy'     => 'category',
			'pad_counts'   => false,
		);
		$categories = get_categories( $args );
			if ( $categories ) {
			foreach ( $categories as $cat ) {
			$out[] = array( 'title' => $cat->name, 'tax_ID' => $cat->cat_ID, 'tax_columns' => 0, 'tax_style' => 0, 'tax_slider' => 0, 'tax_bg' => '' );
			}
		}
	return $out;
	}
}
