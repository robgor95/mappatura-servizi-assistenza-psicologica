<?php
if (!defined('ABSPATH')) exit;
get_header();
echo '<main style="max-width:60rem;margin:3rem auto;padding:1rem">';
if (have_posts()) {
    while (have_posts()) {
        the_post();
        echo '<article><h1>'.esc_html(get_the_title()).'</h1>';
        the_content();
        echo '</article>';
    }
} else {
    echo '<h1>Pagina non trovata</h1><p><a href="'.esc_url(home_url('/')).'">Torna alla pagina iniziale</a></p>';
}
echo '</main>';
get_footer();
