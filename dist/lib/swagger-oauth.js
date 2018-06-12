let appName;
let popupMask;
let popupDialog;
let clientId;
let realm;
let redirect_uri;
let clientSecret;
let scopeSeparator;
let additionalQueryStringParams;

function handleLogin() {
	let scopes = [];

	let auths = window.swaggerUi.api.authSchemes || window.swaggerUi.api.securityDefinitions;
	if(auths) {
		let key;
		let defs = auths;
		for(key in defs) {
			let auth = defs[key];
			if(auth.type === 'oauth2' && auth.scopes) {
				let scope;
				if(Array.isArray(auth.scopes)) {
					// 1.2 support
					let i;
					for(i = 0; i < auth.scopes.length; i++) {
						scopes.push(auth.scopes[i]);
					}
				}
				else {
					// 2.0 support
					for(scope in auth.scopes) {
						scopes.push({scope: scope, description: auth.scopes[scope], OAuthSchemeKey: key});
					}
				}
			}
		}
	}

	if(window.swaggerUi.api
    && window.swaggerUi.api.info) {
		appName = window.swaggerUi.api.info.title;
	}

	$('.api-popup-dialog').remove(); 
	popupDialog = $(
		[
			'<div class="api-popup-dialog">',
			'<div class="api-popup-title">Select OAuth2.0 Scopes</div>',
			'<div class="api-popup-content">',
			'<p>Scopes are used to grant an application different levels of access to data on behalf of the end user. Each API may declare one or more scopes.',
			'<a href="#">Learn how to use</a>',
			'</p>',
			'<p><strong>' + appName + '</strong> API requires the following scopes. Select which ones you want to grant to Swagger UI.</p>',
			'<ul class="api-popup-scopes">',
			'</ul>',
			'<p class="error-msg"></p>',
			'<div class="api-popup-actions"><button class="api-popup-authbtn api-button green" type="button">Authorize</button><button class="api-popup-cancel api-button gray" type="button">Cancel</button></div>',
			'</div>',
			'</div>'].join(''));
	$(document.body).append(popupDialog);

	//TODO: only display applicable scopes (will need to pass them into handleLogin)
	popup = popupDialog.find('ul.api-popup-scopes').empty();
	for (i = 0; i < scopes.length; i ++) {
		scope = scopes[i];
		str = '<li><input type="checkbox" id="scope_' + i + '" scope="' + scope.scope + '"' +'" oauthtype="' + scope.OAuthSchemeKey +'"/>' + '<label for="scope_' + i + '">' + scope.scope ;
		if (scope.description) {
			if ($.map(auths, function(n, i) { return i; }).length > 1) //if we have more than one scheme, display schemes
	    str += '<br/><span class="api-scope-desc">' + scope.description + ' ('+ scope.OAuthSchemeKey+')' +'</span>';
	  else
	    str += '<br/><span class="api-scope-desc">' + scope.description + '</span>';
		}
		str += '</label></li>';
		popup.append(str);
	}

	let $win = $(window),
		dw = $win.width(),
		dh = $win.height(),
		st = $win.scrollTop(),
		dlgWd = popupDialog.outerWidth(),
		dlgHt = popupDialog.outerHeight(),
		top = (dh -dlgHt)/2 + st,
		left = (dw - dlgWd)/2;

	popupDialog.css({
		top: (top < 0? 0 : top) + 'px',
		left: (left < 0? 0 : left) + 'px'
	});

	popupDialog.find('button.api-popup-cancel').click(function() {
		popupMask.hide();
		popupDialog.hide();
		popupDialog.empty();
		popupDialog = [];
	});

	$('button.api-popup-authbtn').unbind();
	popupDialog.find('button.api-popup-authbtn').click(function() {
		popupMask.hide();
		popupDialog.hide();

		let authSchemes = window.swaggerUi.api.authSchemes;
		let host = window.location;
		let pathname = location.pathname.substring(0, location.pathname.lastIndexOf('/'));
		let defaultRedirectUrl = host.protocol + '//' + host.host + pathname + '/o2c.html';
		let redirectUrl = window.oAuthRedirectUrl || defaultRedirectUrl;
		let url = null;
		let scopes = [];
		let o = popup.find('input:checked'); 
		let OAuthSchemeKeys = [];
		let state;
		for(k =0; k < o.length; k++) {
			let scope = $(o[k]).attr('scope');
			if (scopes.indexOf(scope) === -1)
				scopes.push(scope);
			let OAuthSchemeKey = $(o[k]).attr('oauthtype');      
			if (OAuthSchemeKeys.indexOf(OAuthSchemeKey) === -1)
				OAuthSchemeKeys.push(OAuthSchemeKey);
		}
    
		//TODO: merge not replace if scheme is different from any existing 
		//(needs to be aware of schemes to do so correctly)
		window.enabledScopes=scopes;    
    
		for (let key in authSchemes) { 
			if (authSchemes.hasOwnProperty(key) && OAuthSchemeKeys.indexOf(key) != -1) { //only look at keys that match this scope.
				let flow = authSchemes[key].flow;

				if(authSchemes[key].type === 'oauth2' && flow && (flow === 'implicit' || flow === 'accessCode')) {
					let dets = authSchemes[key];
					url = dets.authorizationUrl + '?response_type=' + (flow === 'implicit' ? 'token' : 'code');
					window.swaggerUi.tokenName = dets.tokenName || 'access_token';
					window.swaggerUi.tokenUrl = (flow === 'accessCode' ? dets.tokenUrl : null);
					state = key;
				}
				else if(authSchemes[key].type === 'oauth2' && flow && (flow === 'application')) {
					let dets = authSchemes[key];
					window.swaggerUi.tokenName = dets.tokenName || 'access_token';
					clientCredentialsFlow(scopes, dets.tokenUrl, key);
					return;
				}        
				else if(authSchemes[key].grantTypes) {
					// 1.2 support
					let o = authSchemes[key].grantTypes;
					for(let t in o) {
						if(o.hasOwnProperty(t) && t === 'implicit') {
							let dets = o[t];
							let ep = dets.loginEndpoint.url;
							url = dets.loginEndpoint.url + '?response_type=token';
							window.swaggerUi.tokenName = dets.tokenName;
						}
						else if (o.hasOwnProperty(t) && t === 'accessCode') {
							let dets = o[t];
							let ep = dets.tokenRequestEndpoint.url;
							url = dets.tokenRequestEndpoint.url + '?response_type=code';
							window.swaggerUi.tokenName = dets.tokenName;
						}
					}
				}
			}
		}

		redirect_uri = redirectUrl;

		url += '&redirect_uri=' + encodeURIComponent(redirectUrl);
		url += '&realm=' + encodeURIComponent(realm);
		url += '&client_id=' + encodeURIComponent(clientId);
		url += '&scope=' + encodeURIComponent(scopes.join(scopeSeparator));
		url += '&state=' + encodeURIComponent(state);
		for (let key in additionalQueryStringParams) {
			url += '&' + key + '=' + encodeURIComponent(additionalQueryStringParams[key]);
		}

		window.open(url);
	});

	popupMask.show();
	popupDialog.show();
	return;
}


function handleLogout() {
	for(key in window.swaggerUi.api.clientAuthorizations.authz){
		window.swaggerUi.api.clientAuthorizations.remove(key);
	}
	window.enabledScopes = null;
	$('.api-ic.ic-on').addClass('ic-off');
	$('.api-ic.ic-on').removeClass('ic-on');

	// set the info box
	$('.api-ic.ic-warning').addClass('ic-error');
	$('.api-ic.ic-warning').removeClass('ic-warning');
}

function initOAuth(opts) {
	let o = (opts||{});
	let errors = [];

	appName = (o.appName||errors.push('missing appName'));
	popupMask = (o.popupMask||$('#api-common-mask'));
	popupDialog = (o.popupDialog||$('.api-popup-dialog'));
	clientId = (o.clientId||errors.push('missing client id'));
	clientSecret = (o.clientSecret||null);
	realm = (o.realm||errors.push('missing realm'));
	scopeSeparator = (o.scopeSeparator||' ');
	additionalQueryStringParams = (o.additionalQueryStringParams||{});

	if(errors.length > 0){
		log('auth unable initialize oauth: ' + errors);
		return;
	}

	$('pre code').each(function(i, e) {hljs.highlightBlock(e);});
	$('.api-ic').unbind();
	$('.api-ic').click(function(s) {
		if($(s.target).hasClass('ic-off'))
			handleLogin();
		else {
			handleLogout();
		}
		false;
	});
}

function clientCredentialsFlow(scopes, tokenUrl, OAuthSchemeKey) {
	let params = {
		'client_id': clientId,
		'client_secret': clientSecret,
		'scope': scopes.join(' '),
		'grant_type': 'client_credentials'
	};
	$.ajax(
		{
			url : tokenUrl,
			type: 'POST',
			data: params,
			success:function(data, textStatus, jqXHR)
			{
				onOAuthComplete(data,OAuthSchemeKey);
			},
			error: function(jqXHR, textStatus, errorThrown)
			{
				onOAuthComplete('');
			}
		});
    
}

window.processOAuthCode = function processOAuthCode(data) {
	let OAuthSchemeKey = data.state;

	// redirect_uri is required in auth code flow 
	// see https://tools.ietf.org/html/draft-ietf-oauth-v2-31#section-4.1.3
	let host = window.location;
	let pathname = location.pathname.substring(0, location.pathname.lastIndexOf('/'));
	let defaultRedirectUrl = host.protocol + '//' + host.host + pathname + '/o2c.html';
	let redirectUrl = window.oAuthRedirectUrl || defaultRedirectUrl;

	let params = {
		'client_id': clientId,
		'code': data.code,
		'grant_type': 'authorization_code',
		'redirect_uri': redirectUrl
	};

	if (clientSecret) {
		params.client_secret = clientSecret;
	}

	$.ajax(
		{
			url : window.swaggerUi.tokenUrl,
			type: 'POST',
			data: params,
			success:function(data, textStatus, jqXHR)
			{
				onOAuthComplete(data, OAuthSchemeKey);
			},
			error: function(jqXHR, textStatus, errorThrown)
			{
				onOAuthComplete('');
			}
		});
};

window.onOAuthComplete = function onOAuthComplete(token,OAuthSchemeKey) {
	if(token) {
		if(token.error) {
			let checkbox = $('input[type=checkbox],.secured');
			checkbox.each(function(pos){
				checkbox[pos].checked = false;
			});
			alert(token.error);
		}
		else {
			let b = token[window.swaggerUi.tokenName];      
			if (!OAuthSchemeKey){
				OAuthSchemeKey = token.state;
			}
			if(b){
				// if all roles are satisfied
				let o = null;
				$.each($('.auth .api-ic .api_information_panel'), function(k, v) { 
					let children = v;
					if(children && children.childNodes) {
						let requiredScopes = [];
						$.each((children.childNodes), function (k1, v1){
							let inner = v1.innerHTML;
							if(inner)
								requiredScopes.push(inner);
						});
						let diff = [];
						for(let i=0; i < requiredScopes.length; i++) {
							let s = requiredScopes[i];
							if(window.enabledScopes && window.enabledScopes.indexOf(s) == -1) {
								diff.push(s);
							}
						}
						if(diff.length > 0){
							o = v.parentNode.parentNode;
							$(o.parentNode).find('.api-ic.ic-on').addClass('ic-off');
							$(o.parentNode).find('.api-ic.ic-on').removeClass('ic-on');

							// sorry, not all scopes are satisfied
							$(o).find('.api-ic').addClass('ic-warning');
							$(o).find('.api-ic').removeClass('ic-error');
						}
						else {
							o = v.parentNode.parentNode;
							$(o.parentNode).find('.api-ic.ic-off').addClass('ic-on');
							$(o.parentNode).find('.api-ic.ic-off').removeClass('ic-off');

							// all scopes are satisfied
							$(o).find('.api-ic').addClass('ic-info');
							$(o).find('.api-ic').removeClass('ic-warning');
							$(o).find('.api-ic').removeClass('ic-error');
						}
					}
				});
				window.swaggerUi.api.clientAuthorizations.add(window.OAuthSchemeKey, new SwaggerClient.ApiKeyAuthorization('Authorization', 'Bearer ' + b, 'header'));
				window.swaggerUi.load();
			}
		}
	}
};
