<?php
/**
 * Menta Campus editorial subsystem. Private WordPress post types and
 * explicitly authorised proposals. No patient, chat or visit data.
 * A published record is never edited directly by an editor/reviewer.
 */
if (!defined('ABSPATH')) exit;

function smltv_register_types() {
    foreach (array('smltv_entry'=>'Servizi Campus', 'smltv_proposal'=>'Proposte Campus', 'smltv_event'=>'Registro Campus') as $type=>$label) {
        register_post_type($type, array(
            'label'=>$label, 'public'=>false, 'publicly_queryable'=>false,
            'exclude_from_search'=>true, 'show_ui'=>false, 'show_in_menu'=>false,
            'show_in_rest'=>false, 'rewrite'=>false, 'query_var'=>false,
            'can_export'=>true, 'supports'=>array('title','author','revisions'),
            'capabilities'=>array('create_posts'=>'do_not_allow','edit_posts'=>'do_not_allow',
               'edit_post'=>'do_not_allow','delete_posts'=>'do_not_allow','delete_post'=>'do_not_allow'),
        ));
    }
}
add_action('init','smltv_register_types',5);

function smltv_cap($cap) {
    return current_user_can('manage_options') || current_user_can('smltv_'.$cap);
}
function smltv_activate() {
    smltv_register_types();
    $roles=array(
        'smltv_editor'=>array('label'=>'Menta Campus — redattore','caps'=>array('view','propose')),
        'smltv_reviewer'=>array('label'=>'Menta Campus — revisore','caps'=>array('view','review')),
        'smltv_approver'=>array('label'=>'Menta Campus — approvatore','caps'=>array('view','approve')),
    );
    foreach($roles as $role=>$config){
        $caps=array('read'=>true);
        foreach($config['caps'] as $cap) $caps['smltv_'.$cap]=true;
        $existing=get_role($role);
        if(!$existing) $existing=add_role($role,$config['label'],$caps);
        if($existing) foreach($caps as $cap=>$on) $existing->add_cap($cap);
    }
    $admin=get_role('administrator');
    if($admin) foreach(array('view','propose','review','approve','manage') as $cap) $admin->add_cap('smltv_'.$cap);
    smltv_seed();
    if(!wp_next_scheduled('smltv_weekly_check')) wp_schedule_event(time()+DAY_IN_SECONDS,'weekly','smltv_weekly_check');
}
function smltv_admin_bootstrap(){
    if(!smltv_cap('manage') || get_option('smltv_schema_version')==='0.2')return;
    smltv_activate();
    update_option('smltv_schema_version','0.2',false);
}
add_action('admin_init','smltv_admin_bootstrap',20);
add_action('smltv_weekly_check','smltv_check_links');
function smltv_deactivate(){
    wp_clear_scheduled_hook('smltv_weekly_check');
}
register_deactivation_hook(SMLTV_PLUGIN_FILE,'smltv_deactivate');

function smltv_private_posts($type,$limit=200) {
    // Explicitly access only plugin-owned CPTs: public REST users must read
    // approved university records, never drafts or editorial identities.
    if(!in_array($type,array('smltv_entry','smltv_proposal','smltv_event'),true))return array();
    global $wpdb;
    $sql=$wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE post_type=%s AND post_status='private' ORDER BY ID ASC LIMIT %d",
        $type, max(1,min(1000,(int)$limit)));
    $ids=$wpdb->get_col($sql);
    return array_values(array_filter(array_map('get_post',array_map('intval',(array)$ids))));
}
function smltv_key_of($post_id){return (string)get_post_meta($post_id,'_smltv_key',true);}
function smltv_entries() {
    $items=array();
    foreach(smltv_private_posts('smltv_entry',500) as $post){
        $raw=get_post_meta($post->ID,'_smltv_live',true);
        $row=json_decode((string)$raw,true);
        if(is_array($row) && !empty($row['id'])){
            $row['version']=(int)get_post_meta($post->ID,'_smltv_version',true);
            $row['wp_id']=(int)$post->ID;
            $items[$row['id']]=$row;
        }
    }
    return $items;
}
function smltv_seed_english($id){
    $map=array(
      'UNI-004'=>array('title_en'=>'PTV Listening Desk for Students','audience_en'=>'Tor Vergata students',
        'summary_en'=>'Free psychological assessment and listening service for students.',
        'place_en'=>'Location confirmed when booking.',
        'access_en'=>'Email the service with your phone number to request an appointment.'),
      'TV-CARIS-COUNSELLING'=>array('title_en'=>'CARIS Psychological Counselling — Students',
        'audience_en'=>'Tor Vergata students',
        'summary_en'=>'Psychological counselling for students; the official page describes approximately eight sessions. Confirm current availability.',
        'place_en'=>'Engineering teaching building, CARIS Projects room, first floor; Thursday 09:00–14:00 according to the source. Confirm first.',
        'access_en'=>'Email CARIS with the subject “Richiesta counselling psicologico” and request an appointment.'),
      'TV-PROBEN'=>array('title_en'=>'Pro-Ben — Student Wellbeing',
        'audience_en'=>'University students','summary_en'=>'Workshops, group activities and possible individual support programmes.',
        'place_en'=>'University of Rome Tor Vergata',
        'access_en'=>'Check current initiatives and access conditions on the official website.'),
      'TV-FIRSTPOINT'=>array('title_en'=>'First Point — Support and Listening',
        'audience_en'=>'Students and the university community',
        'summary_en'=>'Confidential support and guidance on distress, discrimination and violence; not an emergency service.',
        'place_en'=>'Desks in several faculties; schedules vary.',
        'access_en'=>'Check the current desk schedule. Cultural mediation: Monday 10:00–17:00, Medicine Building B, floor 2, room 2B2; Italian, English and Farsi.'),
      'UNI-005'=>array('title_en'=>'Psychological Counselling for University Staff',
        'audience_en'=>'University staff',
        'summary_en'=>'Free listening and psychological assessment for staff, separate from student services.',
        'place_en'=>'Location arranged with the service.',
        'access_en'=>'Request an appointment by email, including your contact telephone number.'),
    );
    return $map[$id]??array();
}
function smltv_seed(){
    $source=plugin_dir_path(SMLTV_PLUGIN_FILE).'public/servizi.json';
    if(!is_readable($source))return;
    $data=json_decode(file_get_contents($source),true);
    if(!is_array($data)||empty($data['university'])||count($data['university'])<5)return;
    $existing=smltv_entries();
    foreach($data['university'] as $row){
        if(empty($row['id']) || isset($existing[$row['id']]))continue; // Never overwrite editorial changes.
        $row=array_merge($row,smltv_seed_english($row['id']));
        $post_id=wp_insert_post(array('post_type'=>'smltv_entry','post_status'=>'private',
           'post_title'=>sanitize_text_field($row['title']),'post_author'=>get_current_user_id()),true);
        if(is_wp_error($post_id)||!$post_id) continue;
        update_post_meta($post_id,'_smltv_key',sanitize_key($row['id']));
        update_post_meta($post_id,'_smltv_live',wp_slash(wp_json_encode($row,JSON_UNESCAPED_UNICODE)));
        update_post_meta($post_id,'_smltv_version',1);
        update_post_meta($post_id,'_smltv_source_seed','V7.18: GitHub main; Tor Vergata pilot 0.1.3');
    }
}
function smltv_public_fields($row){
    $keys=array('id','title','title_en','audience','audience_en','summary','summary_en',
      'price','place','place_en','email','phone','access','access_en','source','checked_at');
    $out=array();
    foreach($keys as $key)if(isset($row[$key])&&is_string($row[$key]))$out[$key]=$row[$key];
    return $out;
}
function smltv_public_records(){
    $items=array_values(array_map('smltv_public_fields',smltv_entries()));
    if(!$items) {
        $raw=@file_get_contents(plugin_dir_path(SMLTV_PLUGIN_FILE).'public/servizi.json');
        $data=json_decode((string)$raw,true);
        $items=array_map('smltv_public_fields',$data['university']??array());
        foreach($items as &$r) $r=array_merge($r,smltv_seed_english($r['id']??''));unset($r);
    }
    usort($items,function($a,$b){
        $ranks=array('UNI-004'=>0,'TV-CARIS-COUNSELLING'=>1,'TV-PROBEN'=>2,'TV-FIRSTPOINT'=>3,'UNI-005'=>4);
        return ($ranks[$a['id']]??100)<=>($ranks[$b['id']]??100);
    });
    return $items;
}
function smltv_rest_init(){
    register_rest_route('mentacampus/v1','/university',array(
        'methods'=>'GET','permission_callback'=>'__return_true',
        'callback'=>function(){
            $r=new WP_REST_Response(array('active'=>true,'items'=>smltv_public_records()),200);
            $r->header('Cache-Control','no-store,max-age=0');
            return $r;
        }
    ));
}
add_action('rest_api_init','smltv_rest_init');
function smltv_audit($verb,$key,$old,$new){
    $p=wp_insert_post(array('post_type'=>'smltv_event','post_status'=>'private',
       'post_title'=>sanitize_text_field($verb.' — '.$key),'post_author'=>get_current_user_id()),true);
    if(is_wp_error($p)||!$p)return;
    update_post_meta($p,'_smltv_action',$verb);
    update_post_meta($p,'_smltv_target',$key);
    update_post_meta($p,'_smltv_before',wp_slash(wp_json_encode($old)));
    update_post_meta($p,'_smltv_after',wp_slash(wp_json_encode($new)));
    update_post_meta($p,'_smltv_actor',get_current_user_id());
}
function smltv_validate_entry($src,$is_new=false) {
    $limits=array('title'=>150,'title_en'=>150,'audience'=>240,'audience_en'=>240,
      'summary'=>500,'summary_en'=>500,'price'=>160,'place'=>500,'place_en'=>500,
      'email'=>160,'phone'=>100,'access'=>1200,'access_en'=>1200,'source'=>2048,'checked_at'=>10);
    $clean=array();
    foreach($limits as $key=>$max){
        $val=(isset($src[$key])&&is_string($src[$key]))?trim($src[$key]):'';
        if((function_exists('mb_strlen')?mb_strlen($val,'UTF-8'):strlen($val))>$max)return new WP_Error('too_long','Campo troppo lungo: '.$key);
        $clean[$key]=sanitize_textarea_field($val);
    }
    if($clean['title']===''||$clean['audience']===''||$clean['summary']==='')
        return new WP_Error('missing_fields','Compilare titolo, destinatari e descrizione');
    if(!$clean['source'] || !wp_http_validate_url($clean['source']) ||
       parse_url($clean['source'],PHP_URL_SCHEME)!=='https')
        return new WP_Error('source_required','Inserire un indirizzo HTTPS attendibile della fonte');
    if($clean['email']!==''&&!is_email($clean['email']))
        return new WP_Error('bad_email','Indirizzo email non valido');
    if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$clean['checked_at']) ||
        $clean['checked_at']>gmdate('Y-m-d'))
        return new WP_Error('bad_day','Data di verifica non valida');
    return $clean;
}
function smltv_proposals(){
    $out=array();
    foreach(smltv_private_posts('smltv_proposal',300) as $p){
        $data=json_decode((string)get_post_meta($p->ID,'_smltv_payload',true),true);
        if(!is_array($data))continue;
        $data['post_id']=$p->ID;
        $data['state']=(string)get_post_meta($p->ID,'_smltv_state',true);
        $data['reviewer']=(int)get_post_meta($p->ID,'_smltv_reviewer',true);
        $data['author']=(int)$p->post_author;
        $out[]=$data;
    }
    return array_reverse($out);
}
function smltv_redirect($msg,$is_error=false) {
    wp_safe_redirect(add_query_arg(array('page'=>'sml-tv-admin',
         'message'=>rawurlencode($msg),'kind'=>$is_error?'error':'ok'),admin_url('admin.php')));
    exit;
}
function smltv_admin_action(){
    if(!is_user_logged_in() || !smltv_cap('view')) wp_die('Accesso non autorizzato',403);
    check_admin_referer('smltv_action','smltv_nonce');
    $action=isset($_POST['operation'])?sanitize_key(wp_unslash($_POST['operation'])):'';
    if($action==='submit'){
        if(!smltv_cap('propose'))wp_die('Non autorizzato',403);
        $target=isset($_POST['target'])?sanitize_text_field(wp_unslash($_POST['target'])):'new';
        $raw=isset($_POST['entry'])&&is_array($_POST['entry'])?wp_unslash($_POST['entry']):array();
        $entry=smltv_validate_entry($raw,$target==='new');
        if(is_wp_error($entry))smltv_redirect($entry->get_error_message(),true);
        $rows=smltv_entries();
        if($target!=='new'&&!isset($rows[$target]))smltv_redirect('Scheda inesistente',true);
        $version=$target==='new'?0:(int)$rows[$target]['version'];
        $payload=array('target'=>$target,'version'=>$version,'entry'=>$entry);
        $p=wp_insert_post(array('post_type'=>'smltv_proposal','post_status'=>'private',
          'post_title'=>'Proposta '.($target==='new'?'nuova':$target),
          'post_author'=>get_current_user_id()),true);
        if(is_wp_error($p)||!$p)smltv_redirect('Impossibile salvare la proposta',true);
        update_post_meta($p,'_smltv_payload',wp_slash(wp_json_encode($payload,JSON_UNESCAPED_UNICODE)));
        update_post_meta($p,'_smltv_state','submitted');
        smltv_audit('proposed',$target,null,array('proposal_id'=>$p));
        smltv_redirect('Proposta inviata: i dati pubblici non sono cambiati');
    }
    if($action==='check_links'){
        if(!smltv_cap('manage'))wp_die('Non autorizzato',403);
        smltv_check_links();
        smltv_redirect('Controllo dei collegamenti completato');
    }
    if($action==='restore'){
        if(!smltv_cap('propose'))wp_die('Non autorizzato',403);
        $event_id=absint($_POST['event_id']??0);
        $event=get_post($event_id);
        if(!$event||$event->post_type!=='smltv_event'||get_post_meta($event_id,'_smltv_action',true)!=='approved')
            smltv_redirect('Versione non disponibile',true);
        $old=json_decode((string)get_post_meta($event_id,'_smltv_before',true),true);
        $target=(string)get_post_meta($event_id,'_smltv_target',true);
        $entries=smltv_entries();
        if(!is_array($old)||empty($entries[$target]))smltv_redirect('Versione non ripristinabile',true);
        $validated=smltv_validate_entry($old);
        if(is_wp_error($validated))smltv_redirect($validated->get_error_message(),true);
        $p=wp_insert_post(array('post_type'=>'smltv_proposal','post_status'=>'private',
           'post_title'=>'Proposta ripristino '.$target,'post_author'=>get_current_user_id()),true);
        if(is_wp_error($p)||!$p)smltv_redirect('Impossibile proporre il ripristino',true);
        $payload=array('target'=>$target,'version'=>(int)$entries[$target]['version'],'entry'=>$validated,'restore_from'=>$event_id);
        update_post_meta($p,'_smltv_payload',wp_slash(wp_json_encode($payload,JSON_UNESCAPED_UNICODE)));
        update_post_meta($p,'_smltv_state','submitted');
        smltv_audit('restore_proposed',$target,null,array('event_id'=>$event_id,'proposal_id'=>$p));
        smltv_redirect('Ripristino proposto: richiede una nuova revisione e approvazione');
    }
    $id=absint($_POST['proposal_id']??0);
    $post=get_post($id);
    if(!$post||$post->post_type!=='smltv_proposal')smltv_redirect('Proposta non trovata',true);
    $state=(string)get_post_meta($id,'_smltv_state',true);
    $payload=json_decode((string)get_post_meta($id,'_smltv_payload',true),true);
    if(!is_array($payload))smltv_redirect('Proposta non valida',true);
    $user=get_current_user_id();
    if($user===(int)$post->post_author)smltv_redirect('Non puoi approvare la tua proposta',true);
    if($action==='review'){
        if(!smltv_cap('review') || $state!=='submitted')wp_die('Revisione non autorizzata',403);
        update_post_meta($id,'_smltv_reviewer',$user);
        update_post_meta($id,'_smltv_state','reviewed');
        smltv_audit('reviewed',$payload['target'],null,array('proposal_id'=>$id));
        smltv_redirect('Revisione registrata: in attesa di approvazione separata');
    }
    if($action==='reject'){
        if(!(smltv_cap('review')||smltv_cap('approve'))||!in_array($state,array('submitted','reviewed'),true))
            wp_die('Rifiuto non autorizzato',403);
        update_post_meta($id,'_smltv_state','rejected');
        smltv_audit('rejected',$payload['target'],null,array('proposal_id'=>$id));
        smltv_redirect('Proposta respinta; il sito pubblico resta invariato');
    }
    if($action!=='approve'||!smltv_cap('approve')||$state!=='reviewed')
        wp_die('Approvazione non autorizzata',403);
    $reviewer=(int)get_post_meta($id,'_smltv_reviewer',true);
    if(!$reviewer || $reviewer===$user || $reviewer===(int)$post->post_author)
        smltv_redirect('Servono proponente, revisore e approvatore distinti',true);
    $target=(string)$payload['target'];$entries=smltv_entries();
    $incoming=$payload['entry'];$is_new=$target==='new';
    if($is_new){
        $target='TV-NEW-'.strtoupper(str_replace('-','',wp_generate_uuid4()));
        $incoming['id']=$target;
        $published=wp_insert_post(array('post_type'=>'smltv_entry','post_status'=>'private',
            'post_title'=>$incoming['title'],'post_author'=>$user),true);
        if(is_wp_error($published)||!$published)smltv_redirect('Pubblicazione fallita',true);
        update_post_meta($published,'_smltv_key',sanitize_key($target));
        update_post_meta($published,'_smltv_live',wp_slash(wp_json_encode($incoming,JSON_UNESCAPED_UNICODE)));
        update_post_meta($published,'_smltv_version',1);
        $old=null;
    }else{
        if(!isset($entries[$target]))smltv_redirect('Scheda non disponibile',true);
        $old=$entries[$target];
        if((int)$old['version']!==(int)$payload['version'])smltv_redirect('Conflitto: scheda aggiornata dopo la proposta, riproporre',true);
        $published=$old['wp_id'];
        $raw=(string)get_post_meta($published,'_smltv_live',true);
        $incoming['id']=$target;
        $updated=update_post_meta($published,'_smltv_live',wp_slash(wp_json_encode($incoming,JSON_UNESCAPED_UNICODE)),wp_slash($raw));
        if(!$updated)smltv_redirect('Aggiornamento non riuscito o versione cambiata',true);
        update_post_meta($published,'_smltv_version',(int)$old['version']+1);
    }
    update_post_meta($id,'_smltv_state','approved');
    update_post_meta($id,'_smltv_approver',$user);
    smltv_audit('approved',$target,$old,$incoming);
    smltv_redirect('Approvato e pubblicato in Menta Campus');
}
add_action('admin_post_smltv_action','smltv_admin_action');

function smltv_check_links(){
    $results=array();
    foreach(smltv_public_records() as $row){
        $url=$row['source']??'';
        $host=(string)parse_url($url,PHP_URL_HOST);
        // Only official University of Tor Vergata subdomains. Avoid SSRF.
        if(!preg_match('/(^|\.)uniroma2\.it$/i',$host)||parse_url($url,PHP_URL_SCHEME)!=='https')continue;
        $response=wp_safe_remote_head($url,array('timeout'=>6,'redirection'=>2,
          'user-agent'=>'MentaCampus/0.2 (link audit; public informational portal)'));
        $code=is_wp_error($response)?null:wp_remote_retrieve_response_code($response);
        $results[]=array('id'=>$row['id'],'url'=>$url,'status'=>$code===200?'ok':(($code===404||$code===410)?'broken':'review'),
          'http'=>$code,'checked_at'=>gmdate('c'));
    }
    update_option('smltv_link_audit',$results,false);
}
function smltv_admin_menu(){
    add_menu_page('Menta Campus','Menta Campus','smltv_view','sml-tv-admin','smltv_admin_page','dashicons-location-alt',38);
}
add_action('admin_menu','smltv_admin_menu');
function smltv_input($key,$value,$label,$textarea=false){
    echo '<label style="display:block;margin:0 0 12px;"><strong>'.esc_html($label).'</strong><br>';
    if($textarea)echo '<textarea name="entry['.esc_attr($key).']" rows="3" style="width:100%;max-width:780px;">'.esc_textarea((string)$value).'</textarea>';
    else echo '<input type="text" name="entry['.esc_attr($key).']" value="'.esc_attr((string)$value).'" style="width:100%;max-width:780px;">';
    echo '</label>';
}
function smltv_admin_page(){
    if(!smltv_cap('view'))wp_die('Accesso riservato',403);
    $entries=smltv_entries();$proposals=smltv_proposals();
    $id=isset($_GET['edit'])?sanitize_text_field(wp_unslash($_GET['edit'])):'';
    $row=isset($entries[$id])?$entries[$id]:array();
    $action_url=esc_url(admin_url('admin-post.php'));
    echo '<div class="wrap"><h1>Menta Campus — Redazione</h1>';
    echo '<p>Sezione indipendente Tor Vergata. Le proposte non cambiano il catalogo regionale. Tutti i contenuti pubblici richiedono tre persone distinte: proponente, revisore e approvatore.</p>';
    if(isset($_GET['message']))echo '<div class="notice notice-'.(($_GET['kind']??'')==='error'?'error':'success').'"><p>'.esc_html(sanitize_text_field(wp_unslash($_GET['message']))).'</p></div>';
    echo '<h2>Schede universitarie pubblicate</h2><table class="widefat striped"><thead><tr><th>Servizio</th><th>Destinatari</th><th>Versione</th><th>Azioni</th></tr></thead><tbody>';
    foreach($entries as $k=>$e){
        echo '<tr><td>'.esc_html($e['title']).'</td><td>'.esc_html($e['audience']).'</td><td>'.esc_html((string)$e['version']).'</td><td><a href="'.esc_url(add_query_arg(array('page'=>'sml-tv-admin','edit'=>$k),admin_url('admin.php'))).'">Prepara modifica</a></td></tr>';
    }
    echo '</tbody></table>';
    if(smltv_cap('propose')){
        echo '<h2>'.($row?'Proponi modifica':'Proponi nuovo servizio').'</h2><p>La proposta passa a un revisore e poi a un approvatore diverso dall’autore e dal revisore.</p>';
        echo '<form method="post" action="'.$action_url.'"><input type="hidden" name="action" value="smltv_action"><input type="hidden" name="operation" value="submit"><input type="hidden" name="target" value="'.esc_attr($row?$id:'new').'">';
        wp_nonce_field('smltv_action','smltv_nonce');
        foreach(array('title'=>'Nome servizio (IT)','title_en'=>'Name (EN)',
          'audience'=>'Destinatari (IT)','audience_en'=>'Audience (EN)',
          'summary'=>'Descrizione (IT)','summary_en'=>'Summary (EN)',
          'price'=>'Costo (se documentato)','place'=>'Sede e orari (IT)','place_en'=>'Place (EN)',
          'email'=>'Email','phone'=>'Telefono',
          'access'=>'Come si accede (IT)','access_en'=>'How to access (EN)',
          'source'=>'Fonte ufficiale HTTPS','checked_at'=>'Data verifica AAAA-MM-GG'
        ) as $key=>$label){
            smltv_input($key,$row[$key]??($key==='checked_at'?gmdate('Y-m-d'):''),$label,in_array($key,array('summary','summary_en','access','access_en'),true));
        }
        submit_button('Invia per revisione');
        echo '</form>';
    }
    echo '<h2>Proposte e approvazioni</h2><table class="widefat striped"><thead><tr><th>ID</th><th>Servizio</th><th>Stato</th><th>Utenti interni</th><th>Azioni</th></tr></thead><tbody>';
    foreach($proposals as $p){
        $can_review=smltv_cap('review')&&$p['state']==='submitted'&&$p['author']!==get_current_user_id();
        $can_approve=smltv_cap('approve')&&$p['state']==='reviewed' &&
            $p['author']!==get_current_user_id()&&$p['reviewer']!==get_current_user_id();
        echo '<tr><td>'.esc_html((string)$p['post_id']).'</td><td>'.esc_html($p['entry']['title']??'').'</td><td>'.esc_html($p['state']).'</td><td>Autore #'.esc_html((string)$p['author']).' · Revisore #'.esc_html((string)$p['reviewer']).'</td><td>';
        foreach(array('review'=>'Revisiona','approve'=>'Approva e pubblica','reject'=>'Rifiuta') as $act=>$label){
            if(!(($act==='review'&&$can_review)||($act==='approve'&&$can_approve)||($act==='reject'&&($can_review||$can_approve))))continue;
            echo '<form style="display:inline-block;margin-right:8px;" method="post" action="'.$action_url.'">';
            echo '<input type="hidden" name="action" value="smltv_action"><input type="hidden" name="operation" value="'.esc_attr($act).'"><input type="hidden" name="proposal_id" value="'.esc_attr((string)$p['post_id']).'">';
            wp_nonce_field('smltv_action','smltv_nonce');
            echo '<button class="button" type="submit">'.esc_html($label).'</button></form>';
        }
        echo '</td></tr>';
    }
    echo '</tbody></table><h2>Controllo link ufficiali</h2>';
    $report=get_option('smltv_link_audit',array());
    echo '<p>Controllo automatico tramite WordPress Cron (dipende dalle visite al sito). Nessuna ricerca o dato degli utenti viene memorizzato.</p>';
    if($report)foreach($report as $r)echo '<p>'.esc_html($r['id'].' — '.$r['status'].' (HTTP '.($r['http']??'non disponibile').') '.$r['checked_at']).'</p>';
    if(smltv_cap('manage')){
        echo '<form method="post" action="'.$action_url.'"><input type="hidden" name="action" value="smltv_action"><input type="hidden" name="operation" value="check_links">';
        wp_nonce_field('smltv_action','smltv_nonce');
        echo '<button type="submit" class="button">Controlla ora i link ufficiali</button></form>';
    }
    echo '<h2>Storico e ripristini</h2><p>Ripristinare una versione crea una nuova proposta, senza eliminare lo storico.</p>';
    $events=array_reverse(smltv_private_posts('smltv_event',80));$shown=0;
    foreach($events as $event){
        if($shown>=25)break;
        if(get_post_meta($event->ID,'_smltv_action',true)!=='approved')continue;
        $previous=(string)get_post_meta($event->ID,'_smltv_before',true);
        if(!$previous||json_decode($previous,true)===null)continue;
        $shown++;
        $target=(string)get_post_meta($event->ID,'_smltv_target',true);
        echo '<p>'.esc_html($event->post_date.' · '.$target);
        if(smltv_cap('propose')){
            echo '<form method="post" action="'.$action_url.'" style="display:inline-block;margin-left:10px"><input type="hidden" name="action" value="smltv_action"><input type="hidden" name="operation" value="restore"><input type="hidden" name="event_id" value="'.esc_attr((string)$event->ID).'">';
            wp_nonce_field('smltv_action','smltv_nonce');
            echo '<button type="submit" class="button">Proponi ripristino</button></form>';
        }
        echo '</p>';
    }
    echo '<h2>Prerequisiti per collaboratori reali</h2><p><strong>Backup:</strong> l’export XML WordPress non comprende tutte le tabelle, media e impostazioni. Prima del collaudo utenti verificare una copia ripristinabile dell’intera installazione e definire privacy e responsabilità editoriale.</p>';
    echo '<p>Per la gestione dei ruoli usa Utenti → Aggiungi nuovo, assegnando Menta Campus — redattore, revisore o approvatore a persone distinte.</p></div>';
}
