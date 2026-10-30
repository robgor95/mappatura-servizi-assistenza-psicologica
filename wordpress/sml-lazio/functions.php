<?php
/**
 * Theme bridge for original V7.18.
 * Serve only curated files under legacy/. No PHP, SQL, private files or code
 * from previous backups are exposed by this router.
 */
if (!defined('ABSPATH')) exit;
function sml_theme_asset_allowed(string $path): bool {
    if (strpos($path,"\0")!==false || preg_match('#(^|/)\.#',$path) || str_contains($path,'\\')) return false;
    if (!preg_match('#^[a-zA-Z0-9_./-]+$#D',$path) || str_contains($path,'..')) return false;
    if (preg_match('#^(?:assets|data|downloads|guide|guide[s]?|territori|tipi-servizi|offline)/#',$path)) {
        return (bool)preg_match('/\.(?:css|js|mjs|json|geojson|html|txt|pdf|csv|md|xlsx|png|webp|jpe?g|gif|svg|ico)$/i',$path);
    }
    return (bool)preg_match('#^(?:(?:[a-z0-9-]+)\.html|robots\.txt|sitemap\.xml)$#i',$path);
}
function sml_theme_mime(string $path): string {
    $ext=strtolower(pathinfo($path,PATHINFO_EXTENSION));
    $types=[
        'html'=>'text/html; charset=utf-8','css'=>'text/css; charset=utf-8',
        'js'=>'text/javascript; charset=utf-8','mjs'=>'text/javascript; charset=utf-8',
        'json'=>'application/json; charset=utf-8','geojson'=>'application/geo+json; charset=utf-8',
        'xml'=>'application/xml; charset=utf-8','txt'=>'text/plain; charset=utf-8',
        'png'=>'image/png','jpg'=>'image/jpeg','jpeg'=>'image/jpeg','gif'=>'image/gif',
        'webp'=>'image/webp','svg'=>'image/svg+xml','ico'=>'image/x-icon',
        'pdf'=>'application/pdf','csv'=>'text/csv; charset=utf-8','md'=>'text/markdown; charset=utf-8','xlsx'=>'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    return $types[$ext]??'application/octet-stream';
}
function sml_theme_legacy(): void {
    $request=(string)(wp_parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH)?:'/');
    if ($request==='/admin' || $request==='/admin/' || $request==='/admin/index.html') {
        wp_safe_redirect(admin_url('admin.php?page=sml-catalogo'),302);exit;
    }
    if ($request==='/') $request='/index.html';
    $path=rawurldecode(ltrim($request,'/'));
    if (!sml_theme_asset_allowed($path)) return;
    $base=realpath(get_stylesheet_directory().'/legacy');
    if (!$base) return;
    $candidate=realpath($base.'/'.$path);
    if (!$candidate || !str_starts_with($candidate,$base.'/') || !is_file($candidate)) return;
    $mime=sml_theme_mime($path);
    if ($mime==='application/octet-stream' || headers_sent()) return;
    $staging=(string)get_option('blog_public')==='0';
    if ($staging && $path==='sitemap.xml') {
        status_header(404);
        header('X-Robots-Tag: noindex, nofollow, noarchive');
        exit;
    }
    status_header(200);
    header('Content-Type: '.$mime);
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    if ($staging) header('X-Robots-Tag: noindex, nofollow, noarchive');
    if (str_contains($mime,'text/html') || str_ends_with($path,'.xml') || $path==='robots.txt') {
        header('Cache-Control: public, max-age=120, must-revalidate');
        if ($staging && $path==='robots.txt') {
            echo "User-agent: *\nDisallow: /\n";
            exit;
        }
        $html=file_get_contents($candidate);
        if ($html===false) {status_header(500);exit;}
        $html=str_replace('https://mappatura-servizi-assistenza-psicologica.pages.dev',untrailingslashit(home_url()),$html);
        if ($staging && str_contains($mime,'text/html')) {
            $robot='<meta name="robots" content="noindex,nofollow,noarchive">';
            $replaced=preg_replace('/<meta[^>]+name="robots"[^>]*>/i',$robot,$html);
            if (is_string($replaced)) $html=$replaced;
            if (!str_contains($html,$robot)) $html=str_replace('<head>','<head>'.$robot,$html);
        }
        $html=str_replace('/cdn-cgi/access/logout',wp_logout_url(),$html);
        $html=str_replace('href="/admin/index.html"','href="'.esc_url(admin_url('admin.php?page=sml-catalogo')).'"',$html);
        echo $html;
    } else {
        header('Cache-Control: public, max-age=3600');
        readfile($candidate);
    }
    exit;
}
add_action('template_redirect','sml_theme_legacy',0);
add_action('after_setup_theme', static function (): void {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
});
