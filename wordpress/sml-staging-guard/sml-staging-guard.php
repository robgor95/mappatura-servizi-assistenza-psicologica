<?php
/**
 * Plugin Name: SML - Protezione indicizzazione sito di prova
 * Description: Mantiene MappaMenta fuori dall'indice durante la migrazione. Non protegge l'accesso ai contenuti.
 * Version: 0.1.0
 * Requires at least: 6.4
 * Requires PHP: 8.0
 * Text Domain: sml-staging-guard
 */
if (!defined('ABSPATH')) { exit; }

function sml_guard_activate(): void {
    update_option('blog_public', '0');
}
register_activation_hook(__FILE__, 'sml_guard_activate');

/* Anche il tema ponte stampa HTML legacy senza chiamare wp_head(). */
function sml_guard_noindex(): void {
    if (!headers_sent()) {
        header('X-Robots-Tag: noindex, nofollow, noarchive', true);
        header('Referrer-Policy: no-referrer', true);
    }
}
add_action('send_headers', 'sml_guard_noindex', 0);
add_action('init', static function (): void {
    if (!is_admin() && !headers_sent()) sml_guard_noindex();
}, 0);

add_action('wp_head', static function (): void {
    echo "<meta name=\"robots\" content=\"noindex,nofollow,noarchive\">\n";
}, 0);

/* Disattivazione temporanea delle sitemap durante il collaudo. */
add_filter('wp_sitemaps_enabled', '__return_false', 999);
add_action('template_redirect', static function (): void {
    $path = wp_parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    if ($path === '/sitemap.xml' || $path === '/wp-sitemap.xml') {
        status_header(404);
        header('Content-Type: text/plain; charset=utf-8');
        header('X-Robots-Tag: noindex, nofollow, noarchive');
        echo 'Sitemap disattivata durante il collaudo.';
        exit;
    }
    if ($path === '/robots.txt') {
        status_header(200);
        header('Content-Type: text/plain; charset=utf-8');
        header('X-Robots-Tag: noindex, nofollow, noarchive');
        header('Cache-Control: no-store, max-age=0');
        echo "User-agent: *\nDisallow: /\n";
        exit;
    }
}, -999);

add_action('admin_notices', static function (): void {
    if (!current_user_can('manage_options')) return;
    echo '<div class="notice notice-warning"><p><strong>SML: sito in collaudo.</strong> Indicizzazione disattivata, sitemap escluse e header noindex attivi. Questa misura non rende privati i contenuti pubblici. Non caricare dati sanitari di persone né credenziali.</p></div>';
});
