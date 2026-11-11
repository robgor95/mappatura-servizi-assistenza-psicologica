<?php
/**
 * Static and validator security checks for the WordPress editorial subsystem.
 * No database, WordPress server, network, credentials or patient data needed.
 */
declare(strict_types=1);
define('ABSPATH','/');
define('SMLTV_PLUGIN_FILE',dirname(__DIR__).'/wordpress/sml-tor-vergata/sml-tor-vergata.php');
function add_action(...$args):void {}
function register_deactivation_hook(...$args):void {}
class WP_Error {
    private string $msg;
    public function __construct($code,$message){$this->msg=(string)$message;}
    public function get_error_message():string{return $this->msg;}
}
function is_wp_error($x):bool {return $x instanceof WP_Error;}
function sanitize_textarea_field($x):string{return strip_tags((string)$x);}
function wp_http_validate_url($x){return filter_var((string)$x,FILTER_VALIDATE_URL)?:false;}
function is_email($x):bool{return (bool)filter_var((string)$x,FILTER_VALIDATE_EMAIL);}
require dirname(__DIR__).'/wordpress/sml-tor-vergata/editorial.php';
$sample=[
 'title'=>'Sportello di esempio','title_en'=>'Example desk',
 'audience'=>'Studenti','audience_en'=>'Students',
 'summary'=>'Descrizione documentata','summary_en'=>'Verified description',
 'price'=>'Gratuito','place'=>'Roma','place_en'=>'Rome',
 'email'=>'desk@example.org','phone'=>'061234567',
 'access'=>'Su richiesta','access_en'=>'By request',
 'source'=>'https://web.uniroma2.it/contenuto/sportello-ptv-per-studenti-e-studentesse',
 'checked_at'=>gmdate('Y-m-d')
];
$tests=[];
function test_(bool $ok,string $message):void {
    global $tests;
    $tests[]=$message;
    if(!$ok){fwrite(STDERR,"FAIL ".$message.PHP_EOL);exit(1);}
    echo "PASS ".$message.PHP_EOL;
}
test_(is_array(smltv_validate_entry($sample)),'valid structured entry');
$bad=$sample;$bad['email']='not-an-email';
test_(is_wp_error(smltv_validate_entry($bad)),'reject invalid email');
$bad=$sample;$bad['source']='javascript:alert(1)';
test_(is_wp_error(smltv_validate_entry($bad)),'reject dangerous URL');
$bad=$sample;$bad['checked_at']='2999-01-01';
test_(is_wp_error(smltv_validate_entry($bad)),'reject future date');
$bad=$sample;$bad['title']='';
test_(is_wp_error(smltv_validate_entry($bad)),'require title');
$bad=$sample;$bad['summary']=str_repeat('a',700);
test_(is_wp_error(smltv_validate_entry($bad)),'length limit');
$public=smltv_public_fields(array_merge($sample,['id'=>'UNI-004','author_email'=>'private@example.org','internal_note'=>'secret','reviewer_id'=>123]));
test_(!isset($public['author_email'])&&!isset($public['internal_note'])&&!isset($public['reviewer_id']),'hide internal review metadata from public projection');
$source=file_get_contents(dirname(__DIR__).'/wordpress/sml-tor-vergata/editorial.php');
test_(str_contains($source,"check_admin_referer('smltv_action','smltv_nonce')"),'POST-CSRF checks');
test_(str_contains($source,'$reviewer===(int)$post->post_author'),'reviewer and proposer separated');
test_(str_contains($source,'$reviewer===$user'),'reviewer and approver separated');
test_(str_contains($source,'$user===(int)$post->post_author'),'proposer and approver separated');
test_(str_contains($source,"'permission_callback'=>'__return_true'"),'only explicit public REST route');
echo "Total ".count($tests)." security/validation checks".PHP_EOL;
