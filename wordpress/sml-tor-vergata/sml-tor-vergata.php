<?php
/**
 * Plugin Name: Menta Campus - Tor Vergata (microsito)
 * Description: Microsito informativo Tor Vergata in una sezione autonoma dello stesso WordPress MappaMenta. Nessuna nuova installazione, account o database.
 * Version: 0.1.1-beta
 * Requires at least: 6.4
 * Requires PHP: 8.0
 * Author: Progetto MappaMenta
 * Text Domain: sml-tor-vergata
 */
if (!defined('ABSPATH')) { exit; }

/** Allowlist deterministica dei soli percorsi pubblici appartenenti al pilota. */
function sml_tv_route_spec(string $path): ?array {
    $static = [
        '/tor-vergata'                 => ['index.html', 'text/html; charset=utf-8'],
        '/tor-vergata/'                => ['index.html', 'text/html; charset=utf-8'],
        '/tor-vergata/index.html'      => ['index.html', 'text/html; charset=utf-8'],
        '/tor-vergata/tv.css'          => ['tv.css', 'text/css; charset=utf-8'],
        '/tor-vergata/tv.js'           => ['tv.js', 'text/javascript; charset=utf-8'],
        '/tor-vergata/servizi.json'    => ['servizi.json', 'application/json; charset=utf-8'],
        '/tor-vergata/assets/menta.webp'           => ['assets/menta.webp', 'image/webp'],
        '/tor-vergata/assets/leaflet/leaflet.js'   => ['assets/leaflet/leaflet.js', 'text/javascript; charset=utf-8'],
        '/tor-vergata/assets/leaflet/leaflet.css'  => ['assets/leaflet/leaflet.css', 'text/css; charset=utf-8'],
    ];
    if (isset($static[$path])) { return $static[$path]; }
    $images = [
        'layers.png', 'layers-2x.png', 'marker-icon.png',
        'marker-icon-2x.png', 'marker-shadow.png',
    ];
    $prefix = '/tor-vergata/assets/leaflet/images/';
    if (str_starts_with($path, $prefix)) {
        $basename = substr($path, strlen($prefix));
        if (in_array($basename, $images, true)) {
            return ['assets/leaflet/images/' . $basename, 'image/png'];
        }
    }
    return null;
}

/** Serve il microsito prima del tema regionale, senza modificare permalink o database. */
function sml_tv_serve_route(): void {
    $uri = (string)($_SERVER['REQUEST_URI'] ?? '/');
    $path = wp_parse_url($uri, PHP_URL_PATH);
    if (!is_string($path)) { return; }
    $route = sml_tv_route_spec($path);
    if ($route === null) { return; }
    $file = __DIR__ . '/public/' . $route[0];
    if (!is_file($file) || !is_readable($file)) {
        status_header(503);
        header('Content-Type: text/plain; charset=utf-8');
        header('X-Robots-Tag: noindex, nofollow, noarchive');
        echo 'Risorsa del microsito temporaneamente non disponibile.';
        exit;
    }
    if (headers_sent()) { return; }
    status_header(200);
    header('Content-Type: ' . $route[1], true);
    header('X-Robots-Tag: noindex, nofollow, noarchive', true);
    header('X-Content-Type-Options: nosniff', true);
    header('Referrer-Policy: strict-origin-when-cross-origin', true);
    header('X-Frame-Options: DENY', true);
    if ($route[0] === 'index.html' || $route[0] === 'servizi.json') {
        header('Cache-Control: no-store, max-age=0', true);
    } else {
        header('Cache-Control: public, max-age=300, must-revalidate', true);
    }
    readfile($file);
    exit;
}
add_action('template_redirect', 'sml_tv_serve_route', -1000);
