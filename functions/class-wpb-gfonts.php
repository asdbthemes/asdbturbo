<?php

if ( ! class_exists( 'WPB_Gfonts' ) ) {

	class WPB_Gfonts {

	static $fonts_list = array(
			'Arial'					=> array('family' => 'Arial','weight' => '400,600'),
			'Georgia'				=> array('family' => 'Georgia','weight' => '400,600'),
			'Verdana'				=> array('family' => 'Verdana','weight' => '400,600'),
			'Tahoma'				=> array('family' => 'Tahoma','weight' => '400,600'),
			'andika'				=> array('family' => 'Andika','weight' => '400'),
			'anonymous-pro'			=> array('family' => 'Anonymous Pro','weight' => '400,700,400italic,700italic'),
			'arimo'					=> array('family' => 'Arimo','weight' => '400,700,400italic,700italic'),
			'bad-script'			=> array('family' => 'Bad Script','weight' => '400'),
			'comfortaa'				=> array('family' => 'Comfortaa','weight' => '300,400,700'),
			'cousine'				=> array('family' => 'Cousine','weight' => '400,700,400italic,700italic'),
			'cuprum'				=> array('family' => 'Cuprum','weight' => '400,700'),
			'didact-gothic'			=> array('family' => 'Didact Gothic','weight' => '400'),
			'eb-garamond'			=> array('family' => 'EB Garamond','weight' => '400'),
			'exo-2'					=> array('family' => 'Exo 2','weight' => '100,200,300,400,500,600,700,800,900,100italic,200italic,300italic,400italic,500italic,600italic,700italic,800italic,900italic'),
			'fira-mono'				=> array('family' => 'Fira Mono','weight' => '400,700'),
			'fira-sans'				=> array('family' => 'Fira Sans','weight' => '300,400,500,700,300italic,400italic,500italic,700italic'),
			'forum'					=> array('family' => 'Forum','weight' => '400'),
			'istok-web'				=> array('family' => 'Istok Web','weight' => '400,700,400italic,700italic'),
			'jura'					=> array('family' => 'Jura','weight' => '300,400,500,600'),
			'kelly-slab'			=> array('family' => 'Kelly Slab','weight' => '400'),
			'kurale'				=> array('family' => 'Kurale','weight' => '400'),
			'ledger'				=> array('family' => 'Ledger','weight' => '400'),
			'lobster'				=> array('family' => 'Lobster','weight' => '400'),
			'lora'					=> array('family' => 'Lora','weight' => '400,700,400italic,700italic'),
			'marck-script'			=> array('family' => 'Marck Script','weight' => '400'),
			'marmelad'				=> array('family' => 'Marmelad','weight' => '400'),
			'neucha'				=> array('family' => 'Neucha','weight' => '400'),
			'noto-sans'				=> array('family' => 'Noto Sans','weight' => '400,700,400italic,700italic'),
			'noto-serif'			=> array('family' => 'Noto Serif','weight' => '400,700,400italic,700italic'),
			'open-sans'				=> array('family' => 'Open Sans','weight' => '300,400,600,700,800,300italic,400italic,600italic,700italic,800italic'),
			'open-sans-condensed'	=> array('family' => 'Open Sans Condensed','weight' => '300,700,300italic'),
			'oranienbaum'			=> array('family' => 'Oranienbaum','weight' => '400'),
			'pt-mono'				=> array('family' => 'PT Mono','weight' => '400'),
			'pt-sans'				=> array('family' => 'PT Sans','weight' => '400,700'),
			'pt-sans-caption'		=> array('family' => 'PT Sans Caption','weight' => '400,700'),
			'pt-sans-narrow'		=> array('family' => 'PT Sans Narrow','weight' => '400,700'),
			'pt-serif'				=> array('family' => 'PT Serif','weight' => '400,700,400italic,700italic'),
			'pt-serif-caption'		=> array('family' => 'PT Serif Caption','weight' => '400,400italic'),
			'philosopher'			=> array('family' => 'Philosopher','weight' => '400,700,400italic,700italic'),
			'play'					=> array('family' => 'Play','weight' => '400,700'),
			'playfair-display'		=> array('family' => 'Playfair Display','weight' => '400,700,900,400italic,700italic,900italic'),
			'playfair-display-sc'	=> array('family' => 'Playfair Display SC','weight' => '400,700,900,400italic,700italic,900italic'),
			'poiret-one'			=> array('family' => 'Poiret One','weight' => '400'),
			'press-start-2p'		=> array('family' => 'Press Start 2P','weight' => '400'),
			'prosto-one'			=> array('family' => 'Prosto One','weight' => '400'),
			'roboto'				=> array('family' => 'Roboto','weight' => '100,300,400,500,700,900,100italic,300italic,400italic,500italic,700italic,900italic'),
			'roboto-condensed'		=> array('family' => 'Roboto Condensed','weight' => '300,400,700,300italic,400italic,700italic'),
			'roboto-mono'			=> array('family' => 'Roboto Mono','weight' => '100,300,400,700,100italic,300italic,400italic,700italic'),
			'roboto-slab'			=> array('family' => 'Roboto Slab','weight' => '100,300,400,700'),
			'rubik'					=> array('family' => 'Rubik','weight' => '300,400,500,700,900,300italic,400italic,500italic,700italic,900italic'),
			'rubik-mono-one'		=> array('family' => 'Rubik Mono One','weight' => '400'),
			'rubik-one'				=> array('family' => 'Rubik One','weight' => '400'),
			'ruslan-display'		=> array('family' => 'Ruslan Display','weight' => '400'),
			'russo-one'				=> array('family' => 'Russo One','weight' => '400'),
			'scada'					=> array('family' => 'Scada','weight' => '400,700,400italic,700italic'),
			'seymour-one'			=> array('family' => 'Seymour One','weight' => '400'),
			'stalinist-one'			=> array('family' => 'Stalinist One','weight' => '400'),
			'tenor-sans'			=> array('family' => 'Tenor Sans','weight' => '400'),
			'tinos'					=> array('family' => 'Tinos','weight' => '400,700,400italic,700italic'),
			'ubuntu'				=> array('family' => 'Ubuntu','weight' => '300,400,500,700,300italic,400italic,500italic,700italic'),
			'ubuntu-condensed'		=> array('family' => 'Ubuntu Condensed','weight' => '400'),
			'ubuntu-mono'			=> array('family' => 'Ubuntu Mono','weight' => '400,700,400italic,700italic'),
			'underdog'				=> array('family' => 'Underdog','weight' => '400'),
			'yeseva-one'			=> array('family' => 'Yeseva One','weight' => '400'),
		);



    	static function get_google_fonts_subset_query() {
        	$google_subset_list = ot_get_option('font-subset');
        	if( $google_subset_list ) {
				foreach ($google_subset_list as $value) {
				$google_subset[] = $value;
				}
			$google_subset = implode(',', $google_subset);
        	} else {
			$google_subset = 'latin';
        	}
			return $google_subset;
    	}


    	static function get_google_fonts() {
			$fonts= array();
			$font_families = array();

			$fonts[] = ot_get_option( 'font-body' );
			$fonts[] = ot_get_option( 'font-head' );
			$fonts[] = ot_get_option( 'font-meta' );
			$fonts = array_unique ($fonts);

			foreach($fonts as $font) {
				$font_families[] = self::$fonts_list[$font]['family'].':'.self::$fonts_list[$font]['weight'];
				}
			$query_args = array(
				'family' => implode( '|', str_replace(' ', '+', $font_families ) ),
				'subset' => self::get_google_fonts_subset_query()
			);

			$fonts_url = add_query_arg( $query_args, '//fonts.googleapis.com/css' );
			return $fonts_url;
    	}

		static function get_google_fonts_names() {
			foreach (self::$fonts_list as $key => $font ) {
				$out[] = array('value' => $key, 'label' => $font['family'] );
			}
		return $out;
		}

		static function get_google_fonts_family( $font='' ) {
			return self::$fonts_list[$font]['family'];
		}


	}
}//end class