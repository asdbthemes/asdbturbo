<?php

/**
 * Хлебные крошки для WordPress (breadcrumbs)
 *
 * $sep  - разделитель. По умолчанию ' » '
 * $l10n - массив. для локализации. См. переменную $default_l10n.
 * $args - массив. дополнительные аргументы.
 * version 1.5
*/
function kama_breadcrumbs( $sep = '', $l10n = array(), $args = array() ){
	global $post, $wp_query, $wp_post_types;

	// Локализация
	$default_l10n = array(
		'home'       => '<i class="fa fa-home"></i>',
		'paged'      => 'Страница %d',
		'_404'       => 'Ошибка 404',
		'search'     => 'Результаты поиска по запросу - <b>%s</b>',
		'author'     => 'Архив автора: <b>%s</b>',
		'year'       => 'Архив за <b>%d</b> год',
		'month'      => 'Архив за: <b>%s</b>',
		'day'        => '',
		'attachment' => 'Медиа: %s',
		'tag'        => 'Записи по метке: <b>%s</b>',
		'tax_tag'    => '%1$s из "%2$s" по тегу: <b>%3$s</b>',
		// tax_tag выведет: 'тип_записи из "название_таксы" по тегу: имя_термина'.
		// Если нужны отдельные холдеры, например только имя термина, пишем так: 'записи по тегу: %3$s'
	);

	// Параметры по умолчанию
	$default_args = array(
		'on_front_page'   => true,  // выводить крошки на главной странице
		'show_post_title' => true,  // показывать ли название записи в конце (последний элемент). Для записей, страниц, вложений
		// можно указать строку вида <span>%s</span>, когда нужно обернуть заголовок в html
		'sep'             => ' <i class="fa fa-angle-right"></i> ', // разделитель
		'markup'          => 'schema.org',
		// 'markup' - микроразметка. Может быть: 'rdf.data-vocabulary.org', 'schema.org', '' - без микроразметки
		// или можно указать свой массив разметки:
		// array( 'wrap'=>'<div class="kama_breadcrumbs">',   'wrap_close'=>'</div>', 'linkpatt'=>'<a href="%s">%s</a>', 'sep_after'=>'', )
		'priority_tax'    => array('category'), // приоритетные таксономии, нужно когда запись в нескольких таксах
		'priority_terms'  => array(),
		// 'priority_terms' - приоритетные элементы таксономий, когда запись находится в нескольких элементах одной таксы одновременно.
		// Например: array( 'category'=>array(45,'term_name'), 'tax_name'=>array(1,2,'name') )
		// 'category' - такса для которой указываются приор. элементы: 45 - ID термина и 'term_name' - ярлык.
		// порядок 45 и 'term_name' имеет значение: чем раньше тем важнее. Все указанные термины важнее неуказанных...
		'nofollow' => false, // добавлять rel=nofollow к ссылкам?
	);

	// Фильтрует аргументы по умолчанию
	$default_args = apply_filters('kama_breadcrumbs_default_args', $default_args );

	$loc  = (object) array_merge( $default_l10n, $l10n );
	$args = (object) array_merge( $default_args, $args );

	if( ! $sep ) $sep = $args->sep;

	// микроразметка ---
	if(1){
		$mrk = & $args->markup;

		// Разметка по умолчанию default
		if( ! $mrk ){
			$mrk = array(
				'wrap'       => '<div class="crumbs">',
				'wrap_close' => '</div>',
				'linkpatt'   => '<a href="%s">%s</a>',
				'sep_after'  => '',
			);
		}
		if( $mrk == 'rdf.data-vocabulary.org' ){
			$mrk = array(
				'wrap'       => '<div class="crumbs" prefix="v: http://rdf.data-vocabulary.org/#">',
				'wrap_close' => '</div>',
				'linkpatt'   => '<span typeof="v:Breadcrumb"><a href="%s" rel="v:url" property="v:title">%s</a>',
				'sep_after'  => '</span>', // закрываем span после разделителя!
			);
		}
		// schema.org
		elseif( $mrk == 'schema.org' ){
			$mrk = array(
				'wrap'       => '<div class="crumbs" itemscope itemtype="http://schema.org/BreadcrumbList">',
				'wrap_close' => '</div>',
				'linkpatt'   => '<span itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem"><a href="%s" itemprop="item"><span itemprop="name">%s</span></a></span>',
				'sep_after'  => '', // закрываем span после разделителя!
			);
		}
		elseif( ! is_array($mrk) )
			die( __FUNCTION__ .': "markup" parameter must be array...');

		$wrap       = $mrk['wrap']."\n";
		$wrap_close = $mrk['wrap_close']."\n";
		$linkpatt   = $args->nofollow ? str_replace('<a ','<a rel="nofollow"', $mrk['linkpatt']) : $mrk['linkpatt'];
		$sep       .= $mrk['sep_after']."\n";
	}

	$ptype = & $wp_post_types[ $post->post_type ];

	// paged
	$pg_end = '';
	if( $paged_num = $wp_query->query_vars['paged'] ){
		$pg_end  = /*'</a>'.*/ $sep . sprintf( $loc->paged, (int) $paged_num );
	}

	// OUT
	$out = '';

	// front page
	if( is_front_page() ){
		return $args->on_front_page ? ( print $wrap .( $paged_num ? sprintf($linkpatt, get_home_url(), $loc->home) . $pg_end : $loc->home ). $wrap_close ) : '';
	}
	elseif( is_404() ){
		$out = $loc->_404;
	}
	elseif( is_search() ){
		$out = sprintf( $loc->search, esc_html( $GLOBALS['s'] ) );
	}
	elseif( is_author() ){
		$q_obj = &$wp_query->queried_object;
		$tit = sprintf( $loc->author, esc_html($q_obj->display_name) );
		$out = ( $paged_num ? sprintf( $linkpatt, get_author_posts_url( $q_obj->ID, $q_obj->user_nicename ) . $pg_end, $tit ) : $tit );
	}
	elseif( is_year() || is_month() || is_day() ){
		$y_url  = get_year_link( $year = get_the_time('Y') );

		if( is_year() ){
			$tit = sprintf( $loc->year, $year );
			$out = ( $paged_num ? sprintf($linkpatt, $y_url, $tit) . $pg_end : $tit );
		}
		// month day
		else {
			$y_link = sprintf( $linkpatt, $y_url, $year);
			$m_url  = get_month_link( $year, get_the_time('m') );

			if( is_month() ){
				$tit = sprintf( $loc->month, get_the_time('F') );
				$out = $y_link . $sep . ( $paged_num ? sprintf( $linkpatt, $m_url, $tit ) . $pg_end : $tit );
			}
			elseif( is_day() ){
				$m_link = sprintf( $linkpatt, $m_url, get_the_time('F'));
				$out = $y_link . $sep . $m_link . $sep . get_the_time('l');
			}
		}
	}
	// Древовидные записи
	elseif( is_singular() && $ptype->hierarchical ){
		$out = __hierarchical_posts( $args, $sep, $linkpatt, $post );
	}
	// Таксы, вложения и не древовидные записи
	else {
		$term = false;
		// set term (attachments too)
		if( is_singular() ){
			// Чтобы определить термин для вложения
			if( is_attachment() && $post->post_parent ){
				$save_post = $post;
				$post = get_post( $post->post_parent );

				if( is_post_type_hierarchical( $post->post_type ) ){
					$hierarchical_post_attach_out = __hierarchical_posts( $args, $sep, $linkpatt, $post );
				}
			}

			// учитывает если вложения прикрепляются к таксам древовидным - все бывает :)

			$taxonomies = get_object_taxonomies( $post->post_type );
			// оставим только древовидные и публичные, мало ли...
			$taxonomies = array_intersect( $taxonomies, get_taxonomies( array('hierarchical' => true, 'public' => true) ) );

			// не делаем лишнего...
			if( $taxonomies ){
				// пробуем найти приоритетные
				$priority_tax = array_intersect( $taxonomies, $args->priority_tax );
				// получаем название таксы
				$taxonomy = $priority_tax ? array_shift( $priority_tax ) : array_shift( $taxonomies );

				if( $terms = get_the_terms( $post->ID, $taxonomy ) ){
					$term = array_shift( $terms );

					// проверим приоритетные термины для таксы
					$prior_terms = & $args->priority_terms[ $taxonomy ];
					if( $prior_terms && count($terms) > 1 ){
						foreach( (array) $prior_terms as $term_id ){
							$filter_field = is_numeric($term_id) ? 'term_id' : 'slug';
							$_terms = wp_list_filter( $terms, array($filter_field=>$term_id) );

							if( $_terms ){
								$term = array_shift( $_terms );
								break;
							}
						}
					}
				}
			}

			if( isset($save_post) ) $post = $save_post; // вернем обратно (для вложений)
		}
		// term for tax page
		else
			$term = get_queried_object();

		//if( ! $term && ! is_attachment() ) return print "Error: Taxonomy is not defined!";
		//var_dump($term);
		// вложение древовидного типа записи
		if( isset($hierarchical_post_attach_out) ){
			$out = $hierarchical_post_attach_out . sprintf( $linkpatt, get_permalink( $post->post_parent ), get_the_title( $post->post_parent ) ) . $sep . __show_post_title( $args->show_post_title, $post->post_title );
		}
		// если есть термин
		elseif( $term ){
			$term = apply_filters('kama_breadcrumbs_term', $term );

			$term_tit_patt = '';
			if( $term->term_id )
				$term_tit_patt = $paged_num ? sprintf( $linkpatt, get_term_link($term->term_id, $term->taxonomy), '{title}' ) . $pg_end : '{title}';

			// attachment
			if( is_attachment() ){
				if( ! $post->post_parent )
					$out = sprintf( $loc->attachment, esc_html($post->post_title) );
				else{
					$tit = sprintf( $linkpatt, get_permalink($post->post_parent), get_the_title($post->post_parent) ) . $sep . __show_post_title( $args->show_post_title, $post->post_title );
					$out = __crumbs_tax( $term->term_id, $term->taxonomy, $sep, $linkpatt ) . $tit;
				}
			}
			// single
			elseif( is_single() ){
				$out = __crumbs_tax( $term->parent, $term->taxonomy, $sep, $linkpatt ) . sprintf( $linkpatt, get_term_link( $term->term_id, $term->taxonomy ), $term->name ). $sep . __show_post_title( $args->show_post_title, $post->post_title );
				// Метки, архивная страница типа записи, произвольные одноуровневые таксономии
			}
			// taxonomy не древовидная
			elseif( ! is_taxonomy_hierarchical( $term->taxonomy ) ){
				// метка
				if( is_tag() )
					$out = str_replace('{title}', sprintf( $loc->tag, $term->name ), $term_tit_patt );
				// таксономия
				elseif( is_tax() ){
					$post_label = $ptype->labels->name;
					$tax_label = $GLOBALS['wp_taxonomies'][ $term->taxonomy ]->labels->name;
					$out = str_replace('{title}', sprintf( $loc->tax_tag, $post_label, $tax_label, $term->name ), $term_tit_patt );
				}
			}
			// Рубрики и таксономии
			else{
				//die( $term->taxonomy );
				$out = __crumbs_tax( $term->parent, $term->taxonomy, $sep, $linkpatt ) . str_replace('{title}', $term->name, $term_tit_patt );
			}
		}
	}

	$home_after = '';

	// замена ссылки на архивную страницу для типа записи
	$home_after = apply_filters('kama_breadcrumbs_home_after', false, $linkpatt, $sep );

	// Ссылка на архивную страницу произвольно типа поста. Ссылку можно заменить с помощью хука 'kama_breadcrumbs_home_after'
	if( ! $home_after && $ptype->has_archive && (is_post_type_archive() || is_singular()) && ! in_array( $post->post_type, array('post','page','attachment') ) ){
		$pt_name = $ptype->labels->name;

		if( is_post_type_archive() && ! $paged_num )
			$home_after = $pt_name;
		else
			$home_after = sprintf( $linkpatt, get_post_type_archive_link( $post->post_type ), $pt_name ) . ($pg_end ? $pg_end : $sep);
	}

	$home = sprintf( $linkpatt, home_url(), $loc->home ). $sep . $home_after;

	$out = apply_filters('kama_breadcrumbs_pre_out', $out );

	$out = $wrap. $home . $out .$wrap_close;

	return print apply_filters('kama_breadcrumbs', $out, $sep );
}
function __hierarchical_posts( $args, $sep, $linkpatt, $post ){
	$parent = $post->post_parent;

	$crumbs = array();
	while( $parent ){
		$page = get_post( $parent );
		$crumbs[] = sprintf( $linkpatt, get_permalink( $page->ID ), $page->post_title );
		$parent = $page->post_parent;
	}
	$crumbs = array_reverse( $crumbs );

	$out = '';
	foreach( $crumbs as $crumb )
		$out .= $crumb . $sep;

	return $out . __show_post_title( $args->show_post_title, $post->post_title );
}
function __show_post_title( $is_show, $title ){
	return $is_show ? ( is_string($is_show) ? sprintf( $is_show, esc_html($title) ) : esc_html($title) ) : '';
}
function __crumbs_tax( $term_id, $tax, $sep, $linkpatt ){
	$termlink = array();
	while( $term_id ){
		$term2      = get_term( $term_id, $tax );
		$termlink[] = sprintf( $linkpatt, get_term_link( $term2->term_id, $term2->taxonomy ), esc_html($term2->name) ). $sep;
		$term_id    = $term2->parent;
	}

	$termlinks = array_reverse( $termlink );

	return implode('', $termlinks );
}
