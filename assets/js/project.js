( function( $ ) {
      $(document).on("click", ".cmb-radio-image", function() {
        $(this).closest(".cmb-type-radio-image").find(".cmb-radio-image").removeClass("cmb-radio-image-selected");
        $(this).toggleClass("cmb-radio-image-selected");
      });
} )( jQuery );

/*!
 * jQuery Form Plugin
 * version: 3.51.0-2014.06.20
 * Requires jQuery v1.5 or later
 * Copyright (c) 2014 M. Alsup
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Project repository: https://github.com/malsup/form
 * Dual licensed under the MIT and GPL licenses.
 * https://github.com/malsup/form#copyright-and-license
 */
/*global ActiveXObject */

// AMD support
(function (factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        // using AMD; register as anon module
        define(['jquery'], factory);
    } else {
        // no AMD; invoke directly
        factory( (typeof(jQuery) != 'undefined') ? jQuery : window.Zepto );
    }
}

(function($) {
"use strict";

/*
    Usage Note:
    -----------
    Do not use both ajaxSubmit and ajaxForm on the same form.  These
    functions are mutually exclusive.  Use ajaxSubmit if you want
    to bind your own submit handler to the form.  For example,

    $(document).ready(function() {
        $('#myForm').on('submit', function(e) {
            e.preventDefault(); // <-- important
            $(this).ajaxSubmit({
                target: '#output'
            });
        });
    });

    Use ajaxForm when you want the plugin to manage all the event binding
    for you.  For example,

    $(document).ready(function() {
        $('#myForm').ajaxForm({
            target: '#output'
        });
    });

    You can also use ajaxForm with delegation (requires jQuery v1.7+), so the
    form does not have to exist when you invoke ajaxForm:

    $('#myForm').ajaxForm({
        delegation: true,
        target: '#output'
    });

    When using ajaxForm, the ajaxSubmit function will be invoked for you
    at the appropriate time.
*/

/**
 * Feature detection
 */
var feature = {};
feature.fileapi = $("<input type='file'/>").get(0).files !== undefined;
feature.formdata = window.FormData !== undefined;

var hasProp = !!$.fn.prop;

// attr2 uses prop when it can but checks the return type for
// an expected string.  this accounts for the case where a form 
// contains inputs with names like "action" or "method"; in those
// cases "prop" returns the element
$.fn.attr2 = function() {
    if ( ! hasProp ) {
        return this.attr.apply(this, arguments);
    }
    var val = this.prop.apply(this, arguments);
    if ( ( val && val.jquery ) || typeof val === 'string' ) {
        return val;
    }
    return this.attr.apply(this, arguments);
};

/**
 * ajaxSubmit() provides a mechanism for immediately submitting
 * an HTML form using AJAX.
 */
$.fn.ajaxSubmit = function(options) {
    /*jshint scripturl:true */

    // fast fail if nothing selected (http://dev.jquery.com/ticket/2752)
    if (!this.length) {
        log('ajaxSubmit: skipping submit process - no element selected');
        return this;
    }

    var method, action, url, $form = this;

    if (typeof options == 'function') {
        options = { success: options };
    }
    else if ( options === undefined ) {
        options = {};
    }

    method = options.type || this.attr2('method');
    action = options.url  || this.attr2('action');

    url = (typeof action === 'string') ? $.trim(action) : '';
    url = url || window.location.href || '';
    if (url) {
        // clean url (don't include hash vaue)
        url = (url.match(/^([^#]+)/)||[])[1];
    }

    options = $.extend(true, {
        url:  url,
        success: $.ajaxSettings.success,
        type: method || $.ajaxSettings.type,
        iframeSrc: /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank'
    }, options);

    // hook for manipulating the form data before it is extracted;
    // convenient for use with rich editors like tinyMCE or FCKEditor
    var veto = {};
    this.trigger('form-pre-serialize', [this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-pre-serialize trigger');
        return this;
    }

    // provide opportunity to alter form data before it is serialized
    if (options.beforeSerialize && options.beforeSerialize(this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSerialize callback');
        return this;
    }

    var traditional = options.traditional;
    if ( traditional === undefined ) {
        traditional = $.ajaxSettings.traditional;
    }

    var elements = [];
    var qx, a = this.formToArray(options.semantic, elements);
    if (options.data) {
        options.extraData = options.data;
        qx = $.param(options.data, traditional);
    }

    // give pre-submit callback an opportunity to abort the submit
    if (options.beforeSubmit && options.beforeSubmit(a, this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSubmit callback');
        return this;
    }

    // fire vetoable 'validate' event
    this.trigger('form-submit-validate', [a, this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-submit-validate trigger');
        return this;
    }

    var q = $.param(a, traditional);
    if (qx) {
        q = ( q ? (q + '&' + qx) : qx );
    }
    if (options.type.toUpperCase() == 'GET') {
        options.url += (options.url.indexOf('?') >= 0 ? '&' : '?') + q;
        options.data = null;  // data is null for 'get'
    }
    else {
        options.data = q; // data is the query string for 'post'
    }

    var callbacks = [];
    if (options.resetForm) {
        callbacks.push(function() { $form.resetForm(); });
    }
    if (options.clearForm) {
        callbacks.push(function() { $form.clearForm(options.includeHidden); });
    }

    // perform a load on the target only if dataType is not provided
    if (!options.dataType && options.target) {
        var oldSuccess = options.success || function(){};
        callbacks.push(function(data) {
            var fn = options.replaceTarget ? 'replaceWith' : 'html';
            $(options.target)[fn](data).each(oldSuccess, arguments);
        });
    }
    else if (options.success) {
        callbacks.push(options.success);
    }

    options.success = function(data, status, xhr) { // jQuery 1.4+ passes xhr as 3rd arg
        var context = options.context || this ;    // jQuery 1.4+ supports scope context
        for (var i=0, max=callbacks.length; i < max; i++) {
            callbacks[i].apply(context, [data, status, xhr || $form, $form]);
        }
    };

    if (options.error) {
        var oldError = options.error;
        options.error = function(xhr, status, error) {
            var context = options.context || this;
            oldError.apply(context, [xhr, status, error, $form]);
        };
    }

     if (options.complete) {
        var oldComplete = options.complete;
        options.complete = function(xhr, status) {
            var context = options.context || this;
            oldComplete.apply(context, [xhr, status, $form]);
        };
    }

    // are there files to upload?

    // [value] (issue #113), also see comment:
    // https://github.com/malsup/form/commit/588306aedba1de01388032d5f42a60159eea9228#commitcomment-2180219
    var fileInputs = $('input[type=file]:enabled', this).filter(function() { return $(this).val() !== ''; });

    var hasFileInputs = fileInputs.length > 0;
    var mp = 'multipart/form-data';
    var multipart = ($form.attr('enctype') == mp || $form.attr('encoding') == mp);

    var fileAPI = feature.fileapi && feature.formdata;
    log("fileAPI :" + fileAPI);
    var shouldUseFrame = (hasFileInputs || multipart) && !fileAPI;

    var jqxhr;

    // options.iframe allows user to force iframe mode
    // 06-NOV-09: now defaulting to iframe mode if file input is detected
    if (options.iframe !== false && (options.iframe || shouldUseFrame)) {
        // hack to fix Safari hang (thanks to Tim Molendijk for this)
        // see:  http://groups.google.com/group/jquery-dev/browse_thread/thread/36395b7ab510dd5d
        if (options.closeKeepAlive) {
            $.get(options.closeKeepAlive, function() {
                jqxhr = fileUploadIframe(a);
            });
        }
        else {
            jqxhr = fileUploadIframe(a);
        }
    }
    else if ((hasFileInputs || multipart) && fileAPI) {
        jqxhr = fileUploadXhr(a);
    }
    else {
        jqxhr = $.ajax(options);
    }

    $form.removeData('jqxhr').data('jqxhr', jqxhr);

    // clear element array
    for (var k=0; k < elements.length; k++) {
        elements[k] = null;
    }

    // fire 'notify' event
    this.trigger('form-submit-notify', [this, options]);
    return this;

    // utility fn for deep serialization
    function deepSerialize(extraData){
        var serialized = $.param(extraData, options.traditional).split('&');
        var len = serialized.length;
        var result = [];
        var i, part;
        for (i=0; i < len; i++) {
            // #252; undo param space replacement
            serialized[i] = serialized[i].replace(/\+/g,' ');
            part = serialized[i].split('=');
            // #278; use array instead of object storage, favoring array serializations
            result.push([decodeURIComponent(part[0]), decodeURIComponent(part[1])]);
        }
        return result;
    }

     // XMLHttpRequest Level 2 file uploads (big hat tip to francois2metz)
    function fileUploadXhr(a) {
        var formdata = new FormData();

        for (var i=0; i < a.length; i++) {
            formdata.append(a[i].name, a[i].value);
        }

        if (options.extraData) {
            var serializedData = deepSerialize(options.extraData);
            for (i=0; i < serializedData.length; i++) {
                if (serializedData[i]) {
                    formdata.append(serializedData[i][0], serializedData[i][1]);
                }
            }
        }

        options.data = null;

        var s = $.extend(true, {}, $.ajaxSettings, options, {
            contentType: false,
            processData: false,
            cache: false,
            type: method || 'POST'
        });

        if (options.uploadProgress) {
            // workaround because jqXHR does not expose upload property
            s.xhr = function() {
                var xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(event) {
                        var percent = 0;
                        var position = event.loaded || event.position; /*event.position is deprecated*/
                        var total = event.total;
                        if (event.lengthComputable) {
                            percent = Math.ceil(position / total * 100);
                        }
                        options.uploadProgress(event, position, total, percent);
                    }, false);
                }
                return xhr;
            };
        }

        s.data = null;
        var beforeSend = s.beforeSend;
        s.beforeSend = function(xhr, o) {
            //Send FormData() provided by user
            if (options.formData) {
                o.data = options.formData;
            }
            else {
                o.data = formdata;
            }
            if(beforeSend) {
                beforeSend.call(this, xhr, o);
            }
        };
        return $.ajax(s);
    }

    // private function for handling file uploads (hat tip to YAHOO!)
    function fileUploadIframe(a) {
        var form = $form[0], el, i, s, g, id, $io, io, xhr, sub, n, timedOut, timeoutHandle;
        var deferred = $.Deferred();

        // #341
        deferred.abort = function(status) {
            xhr.abort(status);
        };

        if (a) {
            // ensure that every serialized input is still enabled
            for (i=0; i < elements.length; i++) {
                el = $(elements[i]);
                if ( hasProp ) {
                    el.prop('disabled', false);
                }
                else {
                    el.removeAttr('disabled');
                }
            }
        }

        s = $.extend(true, {}, $.ajaxSettings, options);
        s.context = s.context || s;
        id = 'jqFormIO' + (new Date().getTime());
        if (s.iframeTarget) {
            $io = $(s.iframeTarget);
            n = $io.attr2('name');
            if (!n) {
                $io.attr2('name', id);
            }
            else {
                id = n;
            }
        }
        else {
            $io = $('<iframe name="' + id + '" src="'+ s.iframeSrc +'" />');
            $io.css({ position: 'absolute', top: '-1000px', left: '-1000px' });
        }
        io = $io[0];


        xhr = { // mock object
            aborted: 0,
            responseText: null,
            responseXML: null,
            status: 0,
            statusText: 'n/a',
            getAllResponseHeaders: function() {},
            getResponseHeader: function() {},
            setRequestHeader: function() {},
            abort: function(status) {
                var e = (status === 'timeout' ? 'timeout' : 'aborted');
                log('aborting upload... ' + e);
                this.aborted = 1;

                try { // #214, #257
                    if (io.contentWindow.document.execCommand) {
                        io.contentWindow.document.execCommand('Stop');
                    }
                }
                catch(ignore) {}

                $io.attr('src', s.iframeSrc); // abort op in progress
                xhr.error = e;
                if (s.error) {
                    s.error.call(s.context, xhr, e, status);
                }
                if (g) {
                    $.event.trigger("ajaxError", [xhr, s, e]);
                }
                if (s.complete) {
                    s.complete.call(s.context, xhr, e);
                }
            }
        };

        g = s.global;
        // trigger ajax global events so that activity/block indicators work like normal
        if (g && 0 === $.active++) {
            $.event.trigger("ajaxStart");
        }
        if (g) {
            $.event.trigger("ajaxSend", [xhr, s]);
        }

        if (s.beforeSend && s.beforeSend.call(s.context, xhr, s) === false) {
            if (s.global) {
                $.active--;
            }
            deferred.reject();
            return deferred;
        }
        if (xhr.aborted) {
            deferred.reject();
            return deferred;
        }

        // add submitting element to data if we know it
        sub = form.clk;
        if (sub) {
            n = sub.name;
            if (n && !sub.disabled) {
                s.extraData = s.extraData || {};
                s.extraData[n] = sub.value;
                if (sub.type == "image") {
                    s.extraData[n+'.x'] = form.clk_x;
                    s.extraData[n+'.y'] = form.clk_y;
                }
            }
        }

        var CLIENT_TIMEOUT_ABORT = 1;
        var SERVER_ABORT = 2;
                
        function getDoc(frame) {
            /* it looks like contentWindow or contentDocument do not
             * carry the protocol property in ie8, when running under ssl
             * frame.document is the only valid response document, since
             * the protocol is know but not on the other two objects. strange?
             * "Same origin policy" http://en.wikipedia.org/wiki/Same_origin_policy
             */
            
            var doc = null;
            
            // IE8 cascading access check
            try {
                if (frame.contentWindow) {
                    doc = frame.contentWindow.document;
                }
            } catch(err) {
                // IE8 access denied under ssl & missing protocol
                log('cannot get iframe.contentWindow document: ' + err);
            }

            if (doc) { // successful getting content
                return doc;
            }

            try { // simply checking may throw in ie8 under ssl or mismatched protocol
                doc = frame.contentDocument ? frame.contentDocument : frame.document;
            } catch(err) {
                // last attempt
                log('cannot get iframe.contentDocument: ' + err);
                doc = frame.document;
            }
            return doc;
        }

        // Rails CSRF hack (thanks to Yvan Barthelemy)
        var csrf_token = $('meta[name=csrf-token]').attr('content');
        var csrf_param = $('meta[name=csrf-param]').attr('content');
        if (csrf_param && csrf_token) {
            s.extraData = s.extraData || {};
            s.extraData[csrf_param] = csrf_token;
        }

        // take a breath so that pending repaints get some cpu time before the upload starts
        function doSubmit() {
            // make sure form attrs are set
            var t = $form.attr2('target'), 
                a = $form.attr2('action'), 
                mp = 'multipart/form-data',
                et = $form.attr('enctype') || $form.attr('encoding') || mp;

            // update form attrs in IE friendly way
            form.setAttribute('target',id);
            if (!method || /post/i.test(method) ) {
                form.setAttribute('method', 'POST');
            }
            if (a != s.url) {
                form.setAttribute('action', s.url);
            }

            // ie borks in some cases when setting encoding
            if (! s.skipEncodingOverride && (!method || /post/i.test(method))) {
                $form.attr({
                    encoding: 'multipart/form-data',
                    enctype:  'multipart/form-data'
                });
            }

            // support timout
            if (s.timeout) {
                timeoutHandle = setTimeout(function() { timedOut = true; cb(CLIENT_TIMEOUT_ABORT); }, s.timeout);
            }

            // look for server aborts
            function checkState() {
                try {
                    var state = getDoc(io).readyState;
                    log('state = ' + state);
                    if (state && state.toLowerCase() == 'uninitialized') {
                        setTimeout(checkState,50);
                    }
                }
                catch(e) {
                    log('Server abort: ' , e, ' (', e.name, ')');
                    cb(SERVER_ABORT);
                    if (timeoutHandle) {
                        clearTimeout(timeoutHandle);
                    }
                    timeoutHandle = undefined;
                }
            }

            // add "extra" data to form if provided in options
            var extraInputs = [];
            try {
                if (s.extraData) {
                    for (var n in s.extraData) {
                        if (s.extraData.hasOwnProperty(n)) {
                           // if using the $.param format that allows for multiple values with the same name
                           if($.isPlainObject(s.extraData[n]) && s.extraData[n].hasOwnProperty('name') && s.extraData[n].hasOwnProperty('value')) {
                               extraInputs.push(
                               $('<input type="hidden" name="'+s.extraData[n].name+'">').val(s.extraData[n].value)
                                   .appendTo(form)[0]);
                           } else {
                               extraInputs.push(
                               $('<input type="hidden" name="'+n+'">').val(s.extraData[n])
                                   .appendTo(form)[0]);
                           }
                        }
                    }
                }

                if (!s.iframeTarget) {
                    // add iframe to doc and submit the form
                    $io.appendTo('body');
                }
                if (io.attachEvent) {
                    io.attachEvent('onload', cb);
                }
                else {
                    io.addEventListener('load', cb, false);
                }
                setTimeout(checkState,15);

                try {
                    form.submit();
                } catch(err) {
                    // just in case form has element with name/id of 'submit'
                    var submitFn = document.createElement('form').submit;
                    submitFn.apply(form);
                }
            }
            finally {
                // reset attrs and remove "extra" input elements
                form.setAttribute('action',a);
                form.setAttribute('enctype', et); // #380
                if(t) {
                    form.setAttribute('target', t);
                } else {
                    $form.removeAttr('target');
                }
                $(extraInputs).remove();
            }
        }

        if (s.forceSync) {
            doSubmit();
        }
        else {
            setTimeout(doSubmit, 10); // this lets dom updates render
        }

        var data, doc, domCheckCount = 50, callbackProcessed;

        function cb(e) {
            if (xhr.aborted || callbackProcessed) {
                return;
            }
            
            doc = getDoc(io);
            if(!doc) {
                log('cannot access response document');
                e = SERVER_ABORT;
            }
            if (e === CLIENT_TIMEOUT_ABORT && xhr) {
                xhr.abort('timeout');
                deferred.reject(xhr, 'timeout');
                return;
            }
            else if (e == SERVER_ABORT && xhr) {
                xhr.abort('server abort');
                deferred.reject(xhr, 'error', 'server abort');
                return;
            }

            if (!doc || doc.location.href == s.iframeSrc) {
                // response not received yet
                if (!timedOut) {
                    return;
                }
            }
            if (io.detachEvent) {
                io.detachEvent('onload', cb);
            }
            else {
                io.removeEventListener('load', cb, false);
            }

            var status = 'success', errMsg;
            try {
                if (timedOut) {
                    throw 'timeout';
                }

                var isXml = s.dataType == 'xml' || doc.XMLDocument || $.isXMLDoc(doc);
                log('isXml='+isXml);
                if (!isXml && window.opera && (doc.body === null || !doc.body.innerHTML)) {
                    if (--domCheckCount) {
                        // in some browsers (Opera) the iframe DOM is not always traversable when
                        // the onload callback fires, so we loop a bit to accommodate
                        log('requeing onLoad callback, DOM not available');
                        setTimeout(cb, 250);
                        return;
                    }
                    // let this fall through because server response could be an empty document
                    //log('Could not access iframe DOM after mutiple tries.');
                    //throw 'DOMException: not available';
                }

                //log('response detected');
                var docRoot = doc.body ? doc.body : doc.documentElement;
                xhr.responseText = docRoot ? docRoot.innerHTML : null;
                xhr.responseXML = doc.XMLDocument ? doc.XMLDocument : doc;
                if (isXml) {
                    s.dataType = 'xml';
                }
                xhr.getResponseHeader = function(header){
                    var headers = {'content-type': s.dataType};
                    return headers[header.toLowerCase()];
                };
                // support for XHR 'status' & 'statusText' emulation :
                if (docRoot) {
                    xhr.status = Number( docRoot.getAttribute('status') ) || xhr.status;
                    xhr.statusText = docRoot.getAttribute('statusText') || xhr.statusText;
                }

                var dt = (s.dataType || '').toLowerCase();
                var scr = /(json|script|text)/.test(dt);
                if (scr || s.textarea) {
                    // see if user embedded response in textarea
                    var ta = doc.getElementsByTagName('textarea')[0];
                    if (ta) {
                        xhr.responseText = ta.value;
                        // support for XHR 'status' & 'statusText' emulation :
                        xhr.status = Number( ta.getAttribute('status') ) || xhr.status;
                        xhr.statusText = ta.getAttribute('statusText') || xhr.statusText;
                    }
                    else if (scr) {
                        // account for browsers injecting pre around json response
                        var pre = doc.getElementsByTagName('pre')[0];
                        var b = doc.getElementsByTagName('body')[0];
                        if (pre) {
                            xhr.responseText = pre.textContent ? pre.textContent : pre.innerText;
                        }
                        else if (b) {
                            xhr.responseText = b.textContent ? b.textContent : b.innerText;
                        }
                    }
                }
                else if (dt == 'xml' && !xhr.responseXML && xhr.responseText) {
                    xhr.responseXML = toXml(xhr.responseText);
                }

                try {
                    data = httpData(xhr, dt, s);
                }
                catch (err) {
                    status = 'parsererror';
                    xhr.error = errMsg = (err || status);
                }
            }
            catch (err) {
                log('error caught: ',err);
                status = 'error';
                xhr.error = errMsg = (err || status);
            }

            if (xhr.aborted) {
                log('upload aborted');
                status = null;
            }

            if (xhr.status) { // we've set xhr.status
                status = (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) ? 'success' : 'error';
            }

            // ordering of these callbacks/triggers is odd, but that's how $.ajax does it
            if (status === 'success') {
                if (s.success) {
                    s.success.call(s.context, data, 'success', xhr);
                }
                deferred.resolve(xhr.responseText, 'success', xhr);
                if (g) {
                    $.event.trigger("ajaxSuccess", [xhr, s]);
                }
            }
            else if (status) {
                if (errMsg === undefined) {
                    errMsg = xhr.statusText;
                }
                if (s.error) {
                    s.error.call(s.context, xhr, status, errMsg);
                }
                deferred.reject(xhr, 'error', errMsg);
                if (g) {
                    $.event.trigger("ajaxError", [xhr, s, errMsg]);
                }
            }

            if (g) {
                $.event.trigger("ajaxComplete", [xhr, s]);
            }

            if (g && ! --$.active) {
                $.event.trigger("ajaxStop");
            }

            if (s.complete) {
                s.complete.call(s.context, xhr, status);
            }

            callbackProcessed = true;
            if (s.timeout) {
                clearTimeout(timeoutHandle);
            }

            // clean up
            setTimeout(function() {
                if (!s.iframeTarget) {
                    $io.remove();
                }
                else { //adding else to clean up existing iframe response.
                    $io.attr('src', s.iframeSrc);
                }
                xhr.responseXML = null;
            }, 100);
        }

        var toXml = $.parseXML || function(s, doc) { // use parseXML if available (jQuery 1.5+)
            if (window.ActiveXObject) {
                doc = new ActiveXObject('Microsoft.XMLDOM');
                doc.async = 'false';
                doc.loadXML(s);
            }
            else {
                doc = (new DOMParser()).parseFromString(s, 'text/xml');
            }
            return (doc && doc.documentElement && doc.documentElement.nodeName != 'parsererror') ? doc : null;
        };
        var parseJSON = $.parseJSON || function(s) {
            /*jslint evil:true */
            return window['eval']('(' + s + ')');
        };

        var httpData = function( xhr, type, s ) { // mostly lifted from jq1.4.4

            var ct = xhr.getResponseHeader('content-type') || '',
                xml = type === 'xml' || !type && ct.indexOf('xml') >= 0,
                data = xml ? xhr.responseXML : xhr.responseText;

            if (xml && data.documentElement.nodeName === 'parsererror') {
                if ($.error) {
                    $.error('parsererror');
                }
            }
            if (s && s.dataFilter) {
                data = s.dataFilter(data, type);
            }
            if (typeof data === 'string') {
                if (type === 'json' || !type && ct.indexOf('json') >= 0) {
                    data = parseJSON(data);
                } else if (type === "script" || !type && ct.indexOf("javascript") >= 0) {
                    $.globalEval(data);
                }
            }
            return data;
        };

        return deferred;
    }
};

/**
 * ajaxForm() provides a mechanism for fully automating form submission.
 *
 * The advantages of using this method instead of ajaxSubmit() are:
 *
 * 1: This method will include coordinates for <input type="image" /> elements (if the element
 *    is used to submit the form).
 * 2. This method will include the submit element's name/value data (for the element that was
 *    used to submit the form).
 * 3. This method binds the submit() method to the form for you.
 *
 * The options argument for ajaxForm works exactly as it does for ajaxSubmit.  ajaxForm merely
 * passes the options argument along after properly binding events for submit elements and
 * the form itself.
 */
$.fn.ajaxForm = function(options) {
    options = options || {};
    options.delegation = options.delegation && $.isFunction($.fn.on);

    // in jQuery 1.3+ we can fix mistakes with the ready state
    if (!options.delegation && this.length === 0) {
        var o = { s: this.selector, c: this.context };
        if (!$.isReady && o.s) {
            log('DOM not ready, queuing ajaxForm');
            $(function() {
                $(o.s,o.c).ajaxForm(options);
            });
            return this;
        }
        // is your DOM ready?  http://docs.jquery.com/Tutorials:Introducing_$(document).ready()
        log('terminating; zero elements found by selector' + ($.isReady ? '' : ' (DOM not ready)'));
        return this;
    }

    if ( options.delegation ) {
        $(document)
            .off('submit.form-plugin', this.selector, doAjaxSubmit)
            .off('click.form-plugin', this.selector, captureSubmittingElement)
            .on('submit.form-plugin', this.selector, options, doAjaxSubmit)
            .on('click.form-plugin', this.selector, options, captureSubmittingElement);
        return this;
    }

    return this.ajaxFormUnbind()
        .bind('submit.form-plugin', options, doAjaxSubmit)
        .bind('click.form-plugin', options, captureSubmittingElement);
};

// private event handlers
function doAjaxSubmit(e) {
    /*jshint validthis:true */
    var options = e.data;
    if (!e.isDefaultPrevented()) { // if event has been canceled, don't proceed
        e.preventDefault();
        $(e.target).ajaxSubmit(options); // #365
    }
}

function captureSubmittingElement(e) {
    /*jshint validthis:true */
    var target = e.target;
    var $el = $(target);
    if (!($el.is("[type=submit],[type=image]"))) {
        // is this a child element of the submit el?  (ex: a span within a button)
        var t = $el.closest('[type=submit]');
        if (t.length === 0) {
            return;
        }
        target = t[0];
    }
    var form = this;
    form.clk = target;
    if (target.type == 'image') {
        if (e.offsetX !== undefined) {
            form.clk_x = e.offsetX;
            form.clk_y = e.offsetY;
        } else if (typeof $.fn.offset == 'function') {
            var offset = $el.offset();
            form.clk_x = e.pageX - offset.left;
            form.clk_y = e.pageY - offset.top;
        } else {
            form.clk_x = e.pageX - target.offsetLeft;
            form.clk_y = e.pageY - target.offsetTop;
        }
    }
    // clear form vars
    setTimeout(function() { form.clk = form.clk_x = form.clk_y = null; }, 100);
}


// ajaxFormUnbind unbinds the event handlers that were bound by ajaxForm
$.fn.ajaxFormUnbind = function() {
    return this.unbind('submit.form-plugin click.form-plugin');
};

/**
 * formToArray() gathers form element data into an array of objects that can
 * be passed to any of the following ajax functions: $.get, $.post, or load.
 * Each object in the array has both a 'name' and 'value' property.  An example of
 * an array for a simple login form might be:
 *
 * [ { name: 'username', value: 'jresig' }, { name: 'password', value: 'secret' } ]
 *
 * It is this array that is passed to pre-submit callback functions provided to the
 * ajaxSubmit() and ajaxForm() methods.
 */
$.fn.formToArray = function(semantic, elements) {
    var a = [];
    if (this.length === 0) {
        return a;
    }

    var form = this[0];
    var formId = this.attr('id');
    var els = semantic ? form.getElementsByTagName('*') : form.elements;
    var els2;

    if (els && !/MSIE [678]/.test(navigator.userAgent)) { // #390
        els = $(els).get();  // convert to standard array
    }

    // #386; account for inputs outside the form which use the 'form' attribute
    if ( formId ) {
        els2 = $(':input[form="' + formId + '"]').get(); // hat tip @thet
        if ( els2.length ) {
            els = (els || []).concat(els2);
        }
    }

    if (!els || !els.length) {
        return a;
    }

    var i,j,n,v,el,max,jmax;
    for(i=0, max=els.length; i < max; i++) {
        el = els[i];
        n = el.name;
        if (!n || el.disabled) {
            continue;
        }

        if (semantic && form.clk && el.type == "image") {
            // handle image inputs on the fly when semantic == true
            if(form.clk == el) {
                a.push({name: n, value: $(el).val(), type: el.type });
                a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
            }
            continue;
        }

        v = $.fieldValue(el, true);
        if (v && v.constructor == Array) {
            if (elements) {
                elements.push(el);
            }
            for(j=0, jmax=v.length; j < jmax; j++) {
                a.push({name: n, value: v[j]});
            }
        }
        else if (feature.fileapi && el.type == 'file') {
            if (elements) {
                elements.push(el);
            }
            var files = el.files;
            if (files.length) {
                for (j=0; j < files.length; j++) {
                    a.push({name: n, value: files[j], type: el.type});
                }
            }
            else {
                // #180
                a.push({ name: n, value: '', type: el.type });
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            if (elements) {
                elements.push(el);
            }
            a.push({name: n, value: v, type: el.type, required: el.required});
        }
    }

    if (!semantic && form.clk) {
        // input type=='image' are not found in elements array! handle it here
        var $input = $(form.clk), input = $input[0];
        n = input.name;
        if (n && !input.disabled && input.type == 'image') {
            a.push({name: n, value: $input.val()});
            a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
        }
    }
    return a;
};

/**
 * Serializes form data into a 'submittable' string. This method will return a string
 * in the format: name1=value1&amp;name2=value2
 */
$.fn.formSerialize = function(semantic) {
    //hand off to jQuery.param for proper encoding
    return $.param(this.formToArray(semantic));
};

/**
 * Serializes all field elements in the jQuery object into a query string.
 * This method will return a string in the format: name1=value1&amp;name2=value2
 */
$.fn.fieldSerialize = function(successful) {
    var a = [];
    this.each(function() {
        var n = this.name;
        if (!n) {
            return;
        }
        var v = $.fieldValue(this, successful);
        if (v && v.constructor == Array) {
            for (var i=0,max=v.length; i < max; i++) {
                a.push({name: n, value: v[i]});
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            a.push({name: this.name, value: v});
        }
    });
    //hand off to jQuery.param for proper encoding
    return $.param(a);
};

/**
 * Returns the value(s) of the element in the matched set.  For example, consider the following form:
 *
 *  <form><fieldset>
 *      <input name="A" type="text" />
 *      <input name="A" type="text" />
 *      <input name="B" type="checkbox" value="B1" />
 *      <input name="B" type="checkbox" value="B2"/>
 *      <input name="C" type="radio" value="C1" />
 *      <input name="C" type="radio" value="C2" />
 *  </fieldset></form>
 *
 *  var v = $('input[type=text]').fieldValue();
 *  // if no values are entered into the text inputs
 *  v == ['','']
 *  // if values entered into the text inputs are 'foo' and 'bar'
 *  v == ['foo','bar']
 *
 *  var v = $('input[type=checkbox]').fieldValue();
 *  // if neither checkbox is checked
 *  v === undefined
 *  // if both checkboxes are checked
 *  v == ['B1', 'B2']
 *
 *  var v = $('input[type=radio]').fieldValue();
 *  // if neither radio is checked
 *  v === undefined
 *  // if first radio is checked
 *  v == ['C1']
 *
 * The successful argument controls whether or not the field element must be 'successful'
 * (per http://www.w3.org/TR/html4/interact/forms.html#successful-controls).
 * The default value of the successful argument is true.  If this value is false the value(s)
 * for each element is returned.
 *
 * Note: This method *always* returns an array.  If no valid value can be determined the
 *    array will be empty, otherwise it will contain one or more values.
 */
$.fn.fieldValue = function(successful) {
    for (var val=[], i=0, max=this.length; i < max; i++) {
        var el = this[i];
        var v = $.fieldValue(el, successful);
        if (v === null || typeof v == 'undefined' || (v.constructor == Array && !v.length)) {
            continue;
        }
        if (v.constructor == Array) {
            $.merge(val, v);
        }
        else {
            val.push(v);
        }
    }
    return val;
};

/**
 * Returns the value of the field element.
 */
$.fieldValue = function(el, successful) {
    var n = el.name, t = el.type, tag = el.tagName.toLowerCase();
    if (successful === undefined) {
        successful = true;
    }

    if (successful && (!n || el.disabled || t == 'reset' || t == 'button' ||
        (t == 'checkbox' || t == 'radio') && !el.checked ||
        (t == 'submit' || t == 'image') && el.form && el.form.clk != el ||
        tag == 'select' && el.selectedIndex == -1)) {
            return null;
    }

    if (tag == 'select') {
        var index = el.selectedIndex;
        if (index < 0) {
            return null;
        }
        var a = [], ops = el.options;
        var one = (t == 'select-one');
        var max = (one ? index+1 : ops.length);
        for(var i=(one ? index : 0); i < max; i++) {
            var op = ops[i];
            if (op.selected) {
                var v = op.value;
                if (!v) { // extra pain for IE...
                    v = (op.attributes && op.attributes.value && !(op.attributes.value.specified)) ? op.text : op.value;
                }
                if (one) {
                    return v;
                }
                a.push(v);
            }
        }
        return a;
    }
    return $(el).val();
};

/**
 * Clears the form data.  Takes the following actions on the form's input fields:
 *  - input text fields will have their 'value' property set to the empty string
 *  - select elements will have their 'selectedIndex' property set to -1
 *  - checkbox and radio inputs will have their 'checked' property set to false
 *  - inputs of type submit, button, reset, and hidden will *not* be effected
 *  - button elements will *not* be effected
 */
$.fn.clearForm = function(includeHidden) {
    return this.each(function() {
        $('input,select,textarea', this).clearFields(includeHidden);
    });
};

/**
 * Clears the selected form elements.
 */
$.fn.clearFields = $.fn.clearInputs = function(includeHidden) {
    var re = /^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i; // 'hidden' is not in this list
    return this.each(function() {
        var t = this.type, tag = this.tagName.toLowerCase();
        if (re.test(t) || tag == 'textarea') {
            this.value = '';
        }
        else if (t == 'checkbox' || t == 'radio') {
            this.checked = false;
        }
        else if (tag == 'select') {
            this.selectedIndex = -1;
        }
        else if (t == "file") {
            if (/MSIE/.test(navigator.userAgent)) {
                $(this).replaceWith($(this).clone(true));
            } else {
                $(this).val('');
            }
        }
        else if (includeHidden) {
            // includeHidden can be the value true, or it can be a selector string
            // indicating a special test; for example:
            //  $('#myForm').clearForm('.special:hidden')
            // the above would clean hidden inputs that have the class of 'special'
            if ( (includeHidden === true && /hidden/.test(t)) ||
                 (typeof includeHidden == 'string' && $(this).is(includeHidden)) ) {
                this.value = '';
            }
        }
    });
};

/**
 * Resets the form data.  Causes all form elements to be reset to their original value.
 */
$.fn.resetForm = function() {
    return this.each(function() {
        // guard against an input with the name of 'reset'
        // note that IE reports the reset function as an 'object'
        if (typeof this.reset == 'function' || (typeof this.reset == 'object' && !this.reset.nodeType)) {
            this.reset();
        }
    });
};

/**
 * Enables or disables any matching elements.
 */
$.fn.enable = function(b) {
    if (b === undefined) {
        b = true;
    }
    return this.each(function() {
        this.disabled = !b;
    });
};

/**
 * Checks/unchecks any matching checkboxes or radio buttons and
 * selects/deselects and matching option elements.
 */
$.fn.selected = function(select) {
    if (select === undefined) {
        select = true;
    }
    return this.each(function() {
        var t = this.type;
        if (t == 'checkbox' || t == 'radio') {
            this.checked = select;
        }
        else if (this.tagName.toLowerCase() == 'option') {
            var $sel = $(this).parent('select');
            if (select && $sel[0] && $sel[0].type == 'select-one') {
                // deselect all other options
                $sel.find('option').selected(false);
            }
            this.selected = select;
        }
    });
};

// expose debug var
$.fn.ajaxSubmit.debug = false;

// helper fn for console logging
function log() {
    if (!$.fn.ajaxSubmit.debug) {
        return;
    }
    var msg = '[jquery.form] ' + Array.prototype.join.call(arguments,'');
    if (window.console && window.console.log) {
        window.console.log(msg);
    }
    else if (window.opera && window.opera.postError) {
        window.opera.postError(msg);
    }
}

}));

/**
 * [jQuery-lazyload-any]{@link https://github.com/emn178/jquery-lazyload-any}
 *
 * @version 0.3.0
 * @author Yi-Cyuan Chen [emn178@gmail.com]
 * @copyright Yi-Cyuan Chen 2014-2016
 * @license MIT
 */
(function(d,k,l){function m(){var a=d(this),c;if(c=a.is(":visible")){c=a[0].getBoundingClientRect();var b=-a.data("jquery-lazyload-any").threshold,e=n-b,f=p-b;c=(c.top>=b&&c.top<=e||c.bottom>=b&&c.bottom<=e)&&(c.left>=b&&c.left<=f||c.right>=b&&c.right<=f)}c&&a.trigger("appear")}function q(){n=k.innerHeight||l.documentElement.clientHeight;p=k.innerWidth||l.documentElement.clientWidth;g()}function g(){h=h.filter(":jquery-lazyload-any-appear");1==this.nodeType?d(this).find(":jquery-lazyload-any-appear").each(m):
h.each(m)}function v(){var a=d(this),c=a.data("jquery-lazyload-any"),b=a.data("lazyload");b||(b=a.children().filter('script[type="text/lazyload"]').get(0),b=d(b).html());b||(b=(b=a.contents().filter(function(){return 8===this.nodeType}).get(0))&&d.trim(b.data));b=w.html(b).contents();a.replaceWith(b);d.isFunction(c.load)&&c.load.call(b,b)}function r(){var a=d(this),c;a.data("jquery-lazyload-any-scroller")?c=!1:(c=a.css("overflow"),"scroll"!=c&&"auto"!=c?c=!1:(a.data("jquery-lazyload-any-scroller",
1),a.bind("scroll",g),c=!0));var b;a.data("jquery-lazyload-any-display")?b=void 0:"none"!=a.css("display")?b=void 0:(a.data("jquery-lazyload-any-display",1),a._bindShow(g),b=!0);c|b&&!a.data("jquery-lazyload-any-watch")&&(a.data("jquery-lazyload-any-watch",1),a.bind("appear",t))}function t(){var a=d(this);0===a.find(":jquery-lazyload-any-appear").length&&(a.removeData("jquery-lazyload-any-scroller").removeData("jquery-lazyload-any-display").removeData("jquery-lazyload-any-watch"),a.unbind("scroll",
g).unbind("appear",t)._unbindShow(g))}var w=d("<div/>"),n,p,u=!1,h=d();d.expr[":"]["jquery-lazyload-any-appear"]=function(a){return void 0!==d(a).data("jquery-lazyload-any-appear")};d.fn.lazyload=function(a){var c={threshold:0,trigger:"appear"};d.extend(c,a);a=c.trigger.split(" ");this.data("jquery-lazyload-any-appear",-1!=d.inArray("appear",a)).data("jquery-lazyload-any",c);this.bind(c.trigger,v);this.each(m);this.parents().each(r);this.each(function(){h=h.add(this)});u||(u=!0,q(),d(l).ready(function(){d(k).bind("resize",
q).bind("scroll",g)}));return this};d.lazyload={check:g,refresh:function(a){(void 0===a?h:d(a)).each(function(){var a=d(this);a.is(":jquery-lazyload-any-appear")&&a.parents().each(r)})}};(function(){function a(){var a=d(this),b="none"!=a.css("display");a.data("jquery-lazyload-any-show")!=b&&(a.data("jquery-lazyload-any-show",b),b&&a.trigger("show"))}function c(){f=f.filter(":jquery-lazyload-any-show");f.each(a);0===f.length&&(e=clearInterval(e))}var b=50,e,f=d();d.expr[":"]["jquery-lazyload-any-show"]=
function(a){return void 0!==d(a).data("jquery-lazyload-any-show")};d.fn._bindShow=function(a){this.bind("show",a);this.data("jquery-lazyload-any-show","none"!=this.css("display"));f=f.add(this);b&&!e&&(e=setInterval(c,b))};d.fn._unbindShow=function(a){this.unbind("show",a);this.removeData("jquery-lazyload-any-show")};d.lazyload.setInterval=function(a){a==b||!d.isNumeric(a)||0>a||(b=a,e=clearInterval(e),0<b&&(e=setInterval(c,b)))}})()})(jQuery,window,document);

// Magnific Popup v1.1.0 by Dmitry Semenov
// http://bit.ly/magnific-popup#build=inline+image+ajax+iframe+gallery+retina+imagezoom
(function(a){typeof define=="function"&&define.amd?define(["jquery"],a):typeof exports=="object"?a(require("jquery")):a(window.jQuery||window.Zepto)})(function(a){var b="Close",c="BeforeClose",d="AfterClose",e="BeforeAppend",f="MarkupParse",g="Open",h="Change",i="mfp",j="."+i,k="mfp-ready",l="mfp-removing",m="mfp-prevent-close",n,o=function(){},p=!!window.jQuery,q,r=a(window),s,t,u,v,w=function(a,b){n.ev.on(i+a+j,b)},x=function(b,c,d,e){var f=document.createElement("div");return f.className="mfp-"+b,d&&(f.innerHTML=d),e?c&&c.appendChild(f):(f=a(f),c&&f.appendTo(c)),f},y=function(b,c){n.ev.triggerHandler(i+b,c),n.st.callbacks&&(b=b.charAt(0).toLowerCase()+b.slice(1),n.st.callbacks[b]&&n.st.callbacks[b].apply(n,a.isArray(c)?c:[c]))},z=function(b){if(b!==v||!n.currTemplate.closeBtn)n.currTemplate.closeBtn=a(n.st.closeMarkup.replace("%title%",n.st.tClose)),v=b;return n.currTemplate.closeBtn},A=function(){a.magnificPopup.instance||(n=new o,n.init(),a.magnificPopup.instance=n)},B=function(){var a=document.createElement("p").style,b=["ms","O","Moz","Webkit"];if(a.transition!==undefined)return!0;while(b.length)if(b.pop()+"Transition"in a)return!0;return!1};o.prototype={constructor:o,init:function(){var b=navigator.appVersion;n.isLowIE=n.isIE8=document.all&&!document.addEventListener,n.isAndroid=/android/gi.test(b),n.isIOS=/iphone|ipad|ipod/gi.test(b),n.supportsTransition=B(),n.probablyMobile=n.isAndroid||n.isIOS||/(Opera Mini)|Kindle|webOS|BlackBerry|(Opera Mobi)|(Windows Phone)|IEMobile/i.test(navigator.userAgent),s=a(document),n.popupsCache={}},open:function(b){var c;if(b.isObj===!1){n.items=b.items.toArray(),n.index=0;var d=b.items,e;for(c=0;c<d.length;c++){e=d[c],e.parsed&&(e=e.el[0]);if(e===b.el[0]){n.index=c;break}}}else n.items=a.isArray(b.items)?b.items:[b.items],n.index=b.index||0;if(n.isOpen){n.updateItemHTML();return}n.types=[],u="",b.mainEl&&b.mainEl.length?n.ev=b.mainEl.eq(0):n.ev=s,b.key?(n.popupsCache[b.key]||(n.popupsCache[b.key]={}),n.currTemplate=n.popupsCache[b.key]):n.currTemplate={},n.st=a.extend(!0,{},a.magnificPopup.defaults,b),n.fixedContentPos=n.st.fixedContentPos==="auto"?!n.probablyMobile:n.st.fixedContentPos,n.st.modal&&(n.st.closeOnContentClick=!1,n.st.closeOnBgClick=!1,n.st.showCloseBtn=!1,n.st.enableEscapeKey=!1),n.bgOverlay||(n.bgOverlay=x("bg").on("click"+j,function(){n.close()}),n.wrap=x("wrap").attr("tabindex",-1).on("click"+j,function(a){n._checkIfClose(a.target)&&n.close()}),n.container=x("container",n.wrap)),n.contentContainer=x("content"),n.st.preloader&&(n.preloader=x("preloader",n.container,n.st.tLoading));var h=a.magnificPopup.modules;for(c=0;c<h.length;c++){var i=h[c];i=i.charAt(0).toUpperCase()+i.slice(1),n["init"+i].call(n)}y("BeforeOpen"),n.st.showCloseBtn&&(n.st.closeBtnInside?(w(f,function(a,b,c,d){c.close_replaceWith=z(d.type)}),u+=" mfp-close-btn-in"):n.wrap.append(z())),n.st.alignTop&&(u+=" mfp-align-top"),n.fixedContentPos?n.wrap.css({overflow:n.st.overflowY,overflowX:"hidden",overflowY:n.st.overflowY}):n.wrap.css({top:r.scrollTop(),position:"absolute"}),(n.st.fixedBgPos===!1||n.st.fixedBgPos==="auto"&&!n.fixedContentPos)&&n.bgOverlay.css({height:s.height(),position:"absolute"}),n.st.enableEscapeKey&&s.on("keyup"+j,function(a){a.keyCode===27&&n.close()}),r.on("resize"+j,function(){n.updateSize()}),n.st.closeOnContentClick||(u+=" mfp-auto-cursor"),u&&n.wrap.addClass(u);var l=n.wH=r.height(),m={};if(n.fixedContentPos&&n._hasScrollBar(l)){var o=n._getScrollbarSize();o&&(m.marginRight=o)}n.fixedContentPos&&(n.isIE7?a("body, html").css("overflow","hidden"):m.overflow="hidden");var p=n.st.mainClass;return n.isIE7&&(p+=" mfp-ie7"),p&&n._addClassToMFP(p),n.updateItemHTML(),y("BuildControls"),a("html").css(m),n.bgOverlay.add(n.wrap).prependTo(n.st.prependTo||a(document.body)),n._lastFocusedEl=document.activeElement,setTimeout(function(){n.content?(n._addClassToMFP(k),n._setFocus()):n.bgOverlay.addClass(k),s.on("focusin"+j,n._onFocusIn)},16),n.isOpen=!0,n.updateSize(l),y(g),b},close:function(){if(!n.isOpen)return;y(c),n.isOpen=!1,n.st.removalDelay&&!n.isLowIE&&n.supportsTransition?(n._addClassToMFP(l),setTimeout(function(){n._close()},n.st.removalDelay)):n._close()},_close:function(){y(b);var c=l+" "+k+" ";n.bgOverlay.detach(),n.wrap.detach(),n.container.empty(),n.st.mainClass&&(c+=n.st.mainClass+" "),n._removeClassFromMFP(c);if(n.fixedContentPos){var e={marginRight:""};n.isIE7?a("body, html").css("overflow",""):e.overflow="",a("html").css(e)}s.off("keyup"+j+" focusin"+j),n.ev.off(j),n.wrap.attr("class","mfp-wrap").removeAttr("style"),n.bgOverlay.attr("class","mfp-bg"),n.container.attr("class","mfp-container"),n.st.showCloseBtn&&(!n.st.closeBtnInside||n.currTemplate[n.currItem.type]===!0)&&n.currTemplate.closeBtn&&n.currTemplate.closeBtn.detach(),n.st.autoFocusLast&&n._lastFocusedEl&&a(n._lastFocusedEl).focus(),n.currItem=null,n.content=null,n.currTemplate=null,n.prevHeight=0,y(d)},updateSize:function(a){if(n.isIOS){var b=document.documentElement.clientWidth/window.innerWidth,c=window.innerHeight*b;n.wrap.css("height",c),n.wH=c}else n.wH=a||r.height();n.fixedContentPos||n.wrap.css("height",n.wH),y("Resize")},updateItemHTML:function(){var b=n.items[n.index];n.contentContainer.detach(),n.content&&n.content.detach(),b.parsed||(b=n.parseEl(n.index));var c=b.type;y("BeforeChange",[n.currItem?n.currItem.type:"",c]),n.currItem=b;if(!n.currTemplate[c]){var d=n.st[c]?n.st[c].markup:!1;y("FirstMarkupParse",d),d?n.currTemplate[c]=a(d):n.currTemplate[c]=!0}t&&t!==b.type&&n.container.removeClass("mfp-"+t+"-holder");var e=n["get"+c.charAt(0).toUpperCase()+c.slice(1)](b,n.currTemplate[c]);n.appendContent(e,c),b.preloaded=!0,y(h,b),t=b.type,n.container.prepend(n.contentContainer),y("AfterChange")},appendContent:function(a,b){n.content=a,a?n.st.showCloseBtn&&n.st.closeBtnInside&&n.currTemplate[b]===!0?n.content.find(".mfp-close").length||n.content.append(z()):n.content=a:n.content="",y(e),n.container.addClass("mfp-"+b+"-holder"),n.contentContainer.append(n.content)},parseEl:function(b){var c=n.items[b],d;c.tagName?c={el:a(c)}:(d=c.type,c={data:c,src:c.src});if(c.el){var e=n.types;for(var f=0;f<e.length;f++)if(c.el.hasClass("mfp-"+e[f])){d=e[f];break}c.src=c.el.attr("data-mfp-src"),c.src||(c.src=c.el.attr("href"))}return c.type=d||n.st.type||"inline",c.index=b,c.parsed=!0,n.items[b]=c,y("ElementParse",c),n.items[b]},addGroup:function(a,b){var c=function(c){c.mfpEl=this,n._openClick(c,a,b)};b||(b={});var d="click.magnificPopup";b.mainEl=a,b.items?(b.isObj=!0,a.off(d).on(d,c)):(b.isObj=!1,b.delegate?a.off(d).on(d,b.delegate,c):(b.items=a,a.off(d).on(d,c)))},_openClick:function(b,c,d){var e=d.midClick!==undefined?d.midClick:a.magnificPopup.defaults.midClick;if(!e&&(b.which===2||b.ctrlKey||b.metaKey||b.altKey||b.shiftKey))return;var f=d.disableOn!==undefined?d.disableOn:a.magnificPopup.defaults.disableOn;if(f)if(a.isFunction(f)){if(!f.call(n))return!0}else if(r.width()<f)return!0;b.type&&(b.preventDefault(),n.isOpen&&b.stopPropagation()),d.el=a(b.mfpEl),d.delegate&&(d.items=c.find(d.delegate)),n.open(d)},updateStatus:function(a,b){if(n.preloader){q!==a&&n.container.removeClass("mfp-s-"+q),!b&&a==="loading"&&(b=n.st.tLoading);var c={status:a,text:b};y("UpdateStatus",c),a=c.status,b=c.text,n.preloader.html(b),n.preloader.find("a").on("click",function(a){a.stopImmediatePropagation()}),n.container.addClass("mfp-s-"+a),q=a}},_checkIfClose:function(b){if(a(b).hasClass(m))return;var c=n.st.closeOnContentClick,d=n.st.closeOnBgClick;if(c&&d)return!0;if(!n.content||a(b).hasClass("mfp-close")||n.preloader&&b===n.preloader[0])return!0;if(b!==n.content[0]&&!a.contains(n.content[0],b)){if(d&&a.contains(document,b))return!0}else if(c)return!0;return!1},_addClassToMFP:function(a){n.bgOverlay.addClass(a),n.wrap.addClass(a)},_removeClassFromMFP:function(a){this.bgOverlay.removeClass(a),n.wrap.removeClass(a)},_hasScrollBar:function(a){return(n.isIE7?s.height():document.body.scrollHeight)>(a||r.height())},_setFocus:function(){(n.st.focus?n.content.find(n.st.focus).eq(0):n.wrap).focus()},_onFocusIn:function(b){if(b.target!==n.wrap[0]&&!a.contains(n.wrap[0],b.target))return n._setFocus(),!1},_parseMarkup:function(b,c,d){var e;d.data&&(c=a.extend(d.data,c)),y(f,[b,c,d]),a.each(c,function(c,d){if(d===undefined||d===!1)return!0;e=c.split("_");if(e.length>1){var f=b.find(j+"-"+e[0]);if(f.length>0){var g=e[1];g==="replaceWith"?f[0]!==d[0]&&f.replaceWith(d):g==="img"?f.is("img")?f.attr("src",d):f.replaceWith(a("<img>").attr("src",d).attr("class",f.attr("class"))):f.attr(e[1],d)}}else b.find(j+"-"+c).html(d)})},_getScrollbarSize:function(){if(n.scrollbarSize===undefined){var a=document.createElement("div");a.style.cssText="width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;",document.body.appendChild(a),n.scrollbarSize=a.offsetWidth-a.clientWidth,document.body.removeChild(a)}return n.scrollbarSize}},a.magnificPopup={instance:null,proto:o.prototype,modules:[],open:function(b,c){return A(),b?b=a.extend(!0,{},b):b={},b.isObj=!0,b.index=c||0,this.instance.open(b)},close:function(){return a.magnificPopup.instance&&a.magnificPopup.instance.close()},registerModule:function(b,c){c.options&&(a.magnificPopup.defaults[b]=c.options),a.extend(this.proto,c.proto),this.modules.push(b)},defaults:{disableOn:0,key:null,midClick:!1,mainClass:"",preloader:!0,focus:"",closeOnContentClick:!1,closeOnBgClick:!0,closeBtnInside:!0,showCloseBtn:!0,enableEscapeKey:!0,modal:!1,alignTop:!1,removalDelay:0,prependTo:null,fixedContentPos:"auto",fixedBgPos:"auto",overflowY:"auto",closeMarkup:'<button title="%title%" type="button" class="mfp-close">&#215;</button>',tClose:"Close (Esc)",tLoading:"Loading...",autoFocusLast:!0}},a.fn.magnificPopup=function(b){A();var c=a(this);if(typeof b=="string")if(b==="open"){var d,e=p?c.data("magnificPopup"):c[0].magnificPopup,f=parseInt(arguments[1],10)||0;e.items?d=e.items[f]:(d=c,e.delegate&&(d=d.find(e.delegate)),d=d.eq(f)),n._openClick({mfpEl:d},c,e)}else n.isOpen&&n[b].apply(n,Array.prototype.slice.call(arguments,1));else b=a.extend(!0,{},b),p?c.data("magnificPopup",b):c[0].magnificPopup=b,n.addGroup(c,b);return c};var C="inline",D,E,F,G=function(){F&&(E.after(F.addClass(D)).detach(),F=null)};a.magnificPopup.registerModule(C,{options:{hiddenClass:"hide",markup:"",tNotFound:"Content not found"},proto:{initInline:function(){n.types.push(C),w(b+"."+C,function(){G()})},getInline:function(b,c){G();if(b.src){var d=n.st.inline,e=a(b.src);if(e.length){var f=e[0].parentNode;f&&f.tagName&&(E||(D=d.hiddenClass,E=x(D),D="mfp-"+D),F=e.after(E).detach().removeClass(D)),n.updateStatus("ready")}else n.updateStatus("error",d.tNotFound),e=a("<div>");return b.inlineElement=e,e}return n.updateStatus("ready"),n._parseMarkup(c,{},b),c}}});var H="ajax",I,J=function(){I&&a(document.body).removeClass(I)},K=function(){J(),n.req&&n.req.abort()};a.magnificPopup.registerModule(H,{options:{settings:null,cursor:"mfp-ajax-cur",tError:'<a href="%url%">The content</a> could not be loaded.'},proto:{initAjax:function(){n.types.push(H),I=n.st.ajax.cursor,w(b+"."+H,K),w("BeforeChange."+H,K)},getAjax:function(b){I&&a(document.body).addClass(I),n.updateStatus("loading");var c=a.extend({url:b.src,success:function(c,d,e){var f={data:c,xhr:e};y("ParseAjax",f),n.appendContent(a(f.data),H),b.finished=!0,J(),n._setFocus(),setTimeout(function(){n.wrap.addClass(k)},16),n.updateStatus("ready"),y("AjaxContentAdded")},error:function(){J(),b.finished=b.loadError=!0,n.updateStatus("error",n.st.ajax.tError.replace("%url%",b.src))}},n.st.ajax.settings);return n.req=a.ajax(c),""}}});var L,M=function(b){if(b.data&&b.data.title!==undefined)return b.data.title;var c=n.st.image.titleSrc;if(c){if(a.isFunction(c))return c.call(n,b);if(b.el)return b.el.attr(c)||""}return""};a.magnificPopup.registerModule("image",{options:{markup:'<div class="mfp-figure"><div class="mfp-close"></div><figure><div class="mfp-img"></div><figcaption><div class="mfp-bottom-bar"><div class="mfp-title"></div><div class="mfp-counter"></div></div></figcaption></figure></div>',cursor:"mfp-zoom-out-cur",titleSrc:"title",verticalFit:!0,tError:'<a href="%url%">The image</a> could not be loaded.'},proto:{initImage:function(){var c=n.st.image,d=".image";n.types.push("image"),w(g+d,function(){n.currItem.type==="image"&&c.cursor&&a(document.body).addClass(c.cursor)}),w(b+d,function(){c.cursor&&a(document.body).removeClass(c.cursor),r.off("resize"+j)}),w("Resize"+d,n.resizeImage),n.isLowIE&&w("AfterChange",n.resizeImage)},resizeImage:function(){var a=n.currItem;if(!a||!a.img)return;if(n.st.image.verticalFit){var b=0;n.isLowIE&&(b=parseInt(a.img.css("padding-top"),10)+parseInt(a.img.css("padding-bottom"),10)),a.img.css("max-height",n.wH-b)}},_onImageHasSize:function(a){a.img&&(a.hasSize=!0,L&&clearInterval(L),a.isCheckingImgSize=!1,y("ImageHasSize",a),a.imgHidden&&(n.content&&n.content.removeClass("mfp-loading"),a.imgHidden=!1))},findImageSize:function(a){var b=0,c=a.img[0],d=function(e){L&&clearInterval(L),L=setInterval(function(){if(c.naturalWidth>0){n._onImageHasSize(a);return}b>200&&clearInterval(L),b++,b===3?d(10):b===40?d(50):b===100&&d(500)},e)};d(1)},getImage:function(b,c){var d=0,e=function(){b&&(b.img[0].complete?(b.img.off(".mfploader"),b===n.currItem&&(n._onImageHasSize(b),n.updateStatus("ready")),b.hasSize=!0,b.loaded=!0,y("ImageLoadComplete")):(d++,d<200?setTimeout(e,100):f()))},f=function(){b&&(b.img.off(".mfploader"),b===n.currItem&&(n._onImageHasSize(b),n.updateStatus("error",g.tError.replace("%url%",b.src))),b.hasSize=!0,b.loaded=!0,b.loadError=!0)},g=n.st.image,h=c.find(".mfp-img");if(h.length){var i=document.createElement("img");i.className="mfp-img",b.el&&b.el.find("img").length&&(i.alt=b.el.find("img").attr("alt")),b.img=a(i).on("load.mfploader",e).on("error.mfploader",f),i.src=b.src,h.is("img")&&(b.img=b.img.clone()),i=b.img[0],i.naturalWidth>0?b.hasSize=!0:i.width||(b.hasSize=!1)}return n._parseMarkup(c,{title:M(b),img_replaceWith:b.img},b),n.resizeImage(),b.hasSize?(L&&clearInterval(L),b.loadError?(c.addClass("mfp-loading"),n.updateStatus("error",g.tError.replace("%url%",b.src))):(c.removeClass("mfp-loading"),n.updateStatus("ready")),c):(n.updateStatus("loading"),b.loading=!0,b.hasSize||(b.imgHidden=!0,c.addClass("mfp-loading"),n.findImageSize(b)),c)}}});var N,O=function(){return N===undefined&&(N=document.createElement("p").style.MozTransform!==undefined),N};a.magnificPopup.registerModule("zoom",{options:{enabled:!1,easing:"ease-in-out",duration:300,opener:function(a){return a.is("img")?a:a.find("img")}},proto:{initZoom:function(){var a=n.st.zoom,d=".zoom",e;if(!a.enabled||!n.supportsTransition)return;var f=a.duration,g=function(b){var c=b.clone().removeAttr("style").removeAttr("class").addClass("mfp-animated-image"),d="all "+a.duration/1e3+"s "+a.easing,e={position:"fixed",zIndex:9999,left:0,top:0,"-webkit-backface-visibility":"hidden"},f="transition";return e["-webkit-"+f]=e["-moz-"+f]=e["-o-"+f]=e[f]=d,c.css(e),c},h=function(){n.content.css("visibility","visible")},i,j;w("BuildControls"+d,function(){if(n._allowZoom()){clearTimeout(i),n.content.css("visibility","hidden"),e=n._getItemToZoom();if(!e){h();return}j=g(e),j.css(n._getOffset()),n.wrap.append(j),i=setTimeout(function(){j.css(n._getOffset(!0)),i=setTimeout(function(){h(),setTimeout(function(){j.remove(),e=j=null,y("ZoomAnimationEnded")},16)},f)},16)}}),w(c+d,function(){if(n._allowZoom()){clearTimeout(i),n.st.removalDelay=f;if(!e){e=n._getItemToZoom();if(!e)return;j=g(e)}j.css(n._getOffset(!0)),n.wrap.append(j),n.content.css("visibility","hidden"),setTimeout(function(){j.css(n._getOffset())},16)}}),w(b+d,function(){n._allowZoom()&&(h(),j&&j.remove(),e=null)})},_allowZoom:function(){return n.currItem.type==="image"},_getItemToZoom:function(){return n.currItem.hasSize?n.currItem.img:!1},_getOffset:function(b){var c;b?c=n.currItem.img:c=n.st.zoom.opener(n.currItem.el||n.currItem);var d=c.offset(),e=parseInt(c.css("padding-top"),10),f=parseInt(c.css("padding-bottom"),10);d.top-=a(window).scrollTop()-e;var g={width:c.width(),height:(p?c.innerHeight():c[0].offsetHeight)-f-e};return O()?g["-moz-transform"]=g.transform="translate("+d.left+"px,"+d.top+"px)":(g.left=d.left,g.top=d.top),g}}});var P="iframe",Q="//about:blank",R=function(a){if(n.currTemplate[P]){var b=n.currTemplate[P].find("iframe");b.length&&(a||(b[0].src=Q),n.isIE8&&b.css("display",a?"block":"none"))}};a.magnificPopup.registerModule(P,{options:{markup:'<div class="mfp-iframe-scaler"><div class="mfp-close"></div><iframe class="mfp-iframe" src="//about:blank" frameborder="0" allowfullscreen></iframe></div>',srcAction:"iframe_src",patterns:{youtube:{index:"youtube.com",id:"v=",src:"//www.youtube.com/embed/%id%?autoplay=1"},vimeo:{index:"vimeo.com/",id:"/",src:"//player.vimeo.com/video/%id%?autoplay=1"},gmaps:{index:"//maps.google.",src:"%id%&output=embed"}}},proto:{initIframe:function(){n.types.push(P),w("BeforeChange",function(a,b,c){b!==c&&(b===P?R():c===P&&R(!0))}),w(b+"."+P,function(){R()})},getIframe:function(b,c){var d=b.src,e=n.st.iframe;a.each(e.patterns,function(){if(d.indexOf(this.index)>-1)return this.id&&(typeof this.id=="string"?d=d.substr(d.lastIndexOf(this.id)+this.id.length,d.length):d=this.id.call(this,d)),d=this.src.replace("%id%",d),!1});var f={};return e.srcAction&&(f[e.srcAction]=d),n._parseMarkup(c,f,b),n.updateStatus("ready"),c}}});var S=function(a){var b=n.items.length;return a>b-1?a-b:a<0?b+a:a},T=function(a,b,c){return a.replace(/%curr%/gi,b+1).replace(/%total%/gi,c)};a.magnificPopup.registerModule("gallery",{options:{enabled:!1,arrowMarkup:'<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>',preload:[0,2],navigateByImgClick:!0,arrows:!0,tPrev:"Previous (Left arrow key)",tNext:"Next (Right arrow key)",tCounter:"%curr% of %total%"},proto:{initGallery:function(){var c=n.st.gallery,d=".mfp-gallery";n.direction=!0;if(!c||!c.enabled)return!1;u+=" mfp-gallery",w(g+d,function(){c.navigateByImgClick&&n.wrap.on("click"+d,".mfp-img",function(){if(n.items.length>1)return n.next(),!1}),s.on("keydown"+d,function(a){a.keyCode===37?n.prev():a.keyCode===39&&n.next()})}),w("UpdateStatus"+d,function(a,b){b.text&&(b.text=T(b.text,n.currItem.index,n.items.length))}),w(f+d,function(a,b,d,e){var f=n.items.length;d.counter=f>1?T(c.tCounter,e.index,f):""}),w("BuildControls"+d,function(){if(n.items.length>1&&c.arrows&&!n.arrowLeft){var b=c.arrowMarkup,d=n.arrowLeft=a(b.replace(/%title%/gi,c.tPrev).replace(/%dir%/gi,"left")).addClass(m),e=n.arrowRight=a(b.replace(/%title%/gi,c.tNext).replace(/%dir%/gi,"right")).addClass(m);d.click(function(){n.prev()}),e.click(function(){n.next()}),n.container.append(d.add(e))}}),w(h+d,function(){n._preloadTimeout&&clearTimeout(n._preloadTimeout),n._preloadTimeout=setTimeout(function(){n.preloadNearbyImages(),n._preloadTimeout=null},16)}),w(b+d,function(){s.off(d),n.wrap.off("click"+d),n.arrowRight=n.arrowLeft=null})},next:function(){n.direction=!0,n.index=S(n.index+1),n.updateItemHTML()},prev:function(){n.direction=!1,n.index=S(n.index-1),n.updateItemHTML()},goTo:function(a){n.direction=a>=n.index,n.index=a,n.updateItemHTML()},preloadNearbyImages:function(){var a=n.st.gallery.preload,b=Math.min(a[0],n.items.length),c=Math.min(a[1],n.items.length),d;for(d=1;d<=(n.direction?c:b);d++)n._preloadItem(n.index+d);for(d=1;d<=(n.direction?b:c);d++)n._preloadItem(n.index-d)},_preloadItem:function(b){b=S(b);if(n.items[b].preloaded)return;var c=n.items[b];c.parsed||(c=n.parseEl(b)),y("LazyLoad",c),c.type==="image"&&(c.img=a('<img class="mfp-img" />').on("load.mfploader",function(){c.hasSize=!0}).on("error.mfploader",function(){c.hasSize=!0,c.loadError=!0,y("LazyLoadError",c)}).attr("src",c.src)),c.preloaded=!0}}});var U="retina";a.magnificPopup.registerModule(U,{options:{replaceSrc:function(a){return a.src.replace(/\.\w+$/,function(a){return"@2x"+a})},ratio:1},proto:{initRetina:function(){if(window.devicePixelRatio>1){var a=n.st.retina,b=a.ratio;b=isNaN(b)?b():b,b>1&&(w("ImageHasSize."+U,function(a,c){c.img.css({"max-width":c.img[0].naturalWidth/b,width:"100%"})}),w("ElementParse."+U,function(c,d){d.src=a.replaceSrc(d,b)}))}}}}),A()})
/**
 * File js-enabled.js
 *
 * If Javascript is enabled, replace the <body> class "no-js".
 */
document.body.className = document.body.className.replace( 'no-js', 'js' );
/**
 * File modal.js
 *
 * Deal with multiple modals and their media.
 */
window.WDS_Modal = {};

( function ( window, $, app ) {

	// Constructor.
	app.init = function() {
		app.cache();

		if ( app.meetsRequirements() ) {
			app.bindEvents();
		}
	};

	// Cache all the things.
	app.cache = function() {
		app.$c = {
			body: $( 'body' ),
		};
	};

	// Do we meet the requirements?
	app.meetsRequirements = function() {
		return $( '.modal-trigger' ).length;
	};

	// Combine all events.
	app.bindEvents = function() {

		// Triger a modal to open
		app.$c.body.on( 'click', '.modal-trigger', app.openModal );

		// Trigger the close button to close the modal
		app.$c.body.on( 'click', '.close', app.closeModal );

		// Allow the user to close the modal by hitting the esc key
		app.$c.body.on( 'keydown', app.escKeyClose );

		// Allow the user to close the modal by clicking outside of the modal
		app.$c.body.on( 'click', 'div.modal-open', app.closeModalByClick );
	};

	// Open the modal.
	app.openModal = function() {

		// Figure out which modal we're opening and store the object.
		var $modal = $( $( this ).data( 'target' ) );

		// Display the modal.
		$modal.addClass( 'modal-open' );

		// Add body class.
		app.$c.body.addClass( 'modal-open' );
	};

	// Close the modal.
	app.closeModal = function() {

		// Figure the opened modal we're closing and store the object.
		var $modal = $( $( 'div.modal-open .close' ).data( 'target' ) );

		// Find the iframe in the $modal object.
		var $iframe = $modal.find( 'iframe' );

		// Get the iframe src URL.
		var url = $iframe.attr( 'src' );

		// Remove the source URL, then add it back, so the video can be played again later.
		$iframe.attr( 'src', '' ).attr( 'src', url );

		// Finally, hide the modal.
		$modal.removeClass( 'modal-open' );

		// Remove the body class.
		app.$c.body.removeClass( 'modal-open' );
	};

	// Close if "esc" key is pressed.
	app.escKeyClose = function(e) {
		if ( 27 == e.keyCode ) {
			app.closeModal();
		}
	};

	// Close if the user clicks outside of the modal
	app.closeModalByClick = function(e) {

		// If the parent container is NOT the modal dialog container, close the modal
		if ( ! $( e.target ).parents( 'div' ).hasClass( 'modal-dialog' ) ) {
			app.closeModal();
		}
	};

	// Engage!
	$( app.init );

} )( window, jQuery, window.WDS_Modal );
/*
	scripts.js

	License: GNU General Public License v3.0
	License URI: http://www.gnu.org/licenses/gpl-3.0.html

	Copyright: (c) 2013 Alexander "Alx" Agnarson, http://alxmedia.se
*/

"use strict";

jQuery(document).ready(function($) {


$('.lazyload').lazyload({
  // Sets the pixels to load earlier. Setting threshold to 200 causes image to load 200 pixels
  // before it appears on viewport. It should be greater or equal zero.
  threshold: 0,

  // Sets the callback function when the load event is firing.
  // element: The content in lazyload tag will be returned as a jQuery object.
  load: function(element) {},

  // Sets events to trigger lazyload. Default is customized event `appear`, it will trigger when
  // element appear in screen. You could set other events including each one separated by a space.
  trigger: "appear touchstart"
});

// $('.lightbox').magnificPopup({type:'image'});
// $('.wpb-modal-image').magnificPopup({type:'image'});

jQuery( 'article' ).magnificPopup({
        type: 'image',
        delegate: ".wpb-modal-image",
        gallery: {
            enabled: true,
            preload: [0,2],
			navigateByImgClick: true,
			arrowMarkup: '<span class="mfp-arrow mfp-arrow-%dir%" title="%title%"><i class="fa fa-2x fa-angle-%dir%"></i></span>',
			tPrev: 'Previous',
			tNext: 'Next',
			tCounter: '<span class="mfp-counter">%curr% of %total%</span>'
        },
});

// Add modal native wordpress gallery
jQuery( '.gallery' ).magnificPopup({
        type: 'image',
        delegate: ".gallery-icon > a",
        gallery: {
            enabled: true,
            preload: [0,2],
			navigateByImgClick: true,
			arrowMarkup: '<span class="mfp-arrow mfp-arrow-%dir%" title="%title%"><i class="fa fa-2x fa-angle-%dir%"></i></span>',
			tPrev: 'Previous',
			tNext: 'Next',
			tCounter: '<span class="mfp-counter">%curr% of %total%</span>'
        },
});



/*  Toggle header search
/* ------------------------------------ */
	$('.toggle-search').click(function(){
		$('.toggle-search').toggleClass('active');
		$('.search-expand').fadeToggle(250);
            setTimeout(function(){
                $('.search-expand input').focus();
            }, 300);
	});

/*  Scroll to top
/* ------------------------------------ */
	$('a#gototop').click(function() {
		$('html, body').animate({scrollTop:0},'slow');
		return false;
	});

/*  Comments / pingbacks tabs
/* ------------------------------------ */
    $(".tabs .tabs-title").click(function() {
        $(".tabs .tabs-title").removeClass('is-active');
        $(this).addClass("is-active");
        $(".tabs-content .tabs-panel").removeClass('is-active').hide();
        var selected_tab = $(this).find("a").attr("href");
        $(selected_tab).fadeIn();
        console.log(selected_tab);
        return false;
    });

/*  Table odd row class
/* ------------------------------------ */
	$('table tr:odd').addClass('alt');


/*  Dropdown menu animation
/* ------------------------------------ */
	$('.nav ul.sub-menu').hide();
	$('.nav li').hover(
		function() {
			$(this).children('ul.sub-menu').slideDown('fast');
		},
		function() {
			$(this).children('ul.sub-menu').hide();
		}
	);

/*  Mobile menu smooth toggle height
/* ------------------------------------ */
	$('.nav-toggle').on('click', function() {
		slide($('.nav-wrap .nav', $(this).parent()));
	});

	function slide(content) {
		var wrapper = content.parent();
		var contentHeight = content.outerHeight(true);
		var wrapperHeight = wrapper.height();

		wrapper.toggleClass('expand');
		if (wrapper.hasClass('expand')) {
		setTimeout(function() {
			wrapper.addClass('transition').css('height', contentHeight);
		}, 10);
	}
	else {
		setTimeout(function() {
			wrapper.css('height', wrapperHeight);
			setTimeout(function() {
			wrapper.addClass('transition').css('height', 0);
			}, 10);
		}, 10);
	}

	wrapper.one('transitionEnd webkitTransitionEnd transitionend oTransitionEnd msTransitionEnd', function() {
		if(wrapper.hasClass('open')) {
			wrapper.removeClass('transition').css('height', 'auto');
		}
	});
	}

});
/**
 * File search.js
 *
 * Deal with the search form.
 */
window.WDS_Search = {};

( function ( window, $, app ) {

	// Constructor.
	app.init = function() {
		app.cache();

		if ( app.meetsRequirements() ) {
			app.bindEvents();
		}
	};

	// Cache all the things.
	app.cache = function() {
		app.$c = {
			body: $( 'body' ),
		};
	};

	// Do we meet the requirements?
	app.meetsRequirements = function() {
		return $( '.search-field' ).length;
	};

	// Combine all events.
	app.bindEvents = function() {

		// Remove placeholder text from search field on focus.
		app.$c.body.on( 'focus', '.search-field', app.removePlaceholderText );

		// Add placeholder text back to search field on blur.
		app.$c.body.on( 'blur', '.search-field', app.addPlaceholderText );
	};

	// Remove placeholder text from search field.
	app.removePlaceholderText = function() {

		var $search_field = $( this );

		$search_field.data( 'placeholder', $search_field.attr( 'placeholder' ) ).attr( 'placeholder', '' );
	};

	// Replace placeholder text from search field.
	app.addPlaceholderText = function() {

		var $search_field = $( this );

		$search_field.attr( 'placeholder', $search_field.data( 'placeholder' ) ).data( 'placeholder', '' );
	};

	// Engage!
	$( app.init );

} )( window, jQuery, window.WDS_Search );
/**
 * File skip-link-focus-fix.js.
 *
 * Helps with accessibility for keyboard only users.
 *
 * Learn more: https://git.io/vWdr2
 */
( function() {
	var isWebkit = navigator.userAgent.toLowerCase().indexOf( 'webkit' ) > -1,
	    isOpera  = navigator.userAgent.toLowerCase().indexOf( 'opera' )  > -1,
	    isIe     = navigator.userAgent.toLowerCase().indexOf( 'msie' )   > -1;

	if ( ( isWebkit || isOpera || isIe ) && document.getElementById && window.addEventListener ) {
		window.addEventListener( 'hashchange', function() {
			var id = location.hash.substring( 1 ),
				element;

			if ( ! ( /^[A-z0-9_-]+$/.test( id ) ) ) {
				return;
			}

			element = document.getElementById( id );

			if ( element ) {
				if ( ! ( /^(?:a|select|input|button|textarea)$/i.test( element.tagName ) ) ) {
					element.tabIndex = -1;
				}

				element.focus();
			}
		}, false );
	}
})();
/*
     _ _      _       _
 ___| (_) ___| | __  (_)___
/ __| | |/ __| |/ /  | / __|
\__ \ | | (__|   < _ | \__ \
|___/_|_|\___|_|\_(_)/ |___/
                   |__/

 Version: 1.6.0
  Author: Ken Wheeler
 Website: http://kenwheeler.github.io
    Docs: http://kenwheeler.github.io/slick
    Repo: http://github.com/kenwheeler/slick
  Issues: http://github.com/kenwheeler/slick/issues

 */
!function(a){"use strict";"function"==typeof define&&define.amd?define(["jquery"],a):"undefined"!=typeof exports?module.exports=a(require("jquery")):a(jQuery)}(function(a){"use strict";var b=window.Slick||{};b=function(){function c(c,d){var f,e=this;e.defaults={accessibility:!0,adaptiveHeight:!1,appendArrows:a(c),appendDots:a(c),arrows:!0,asNavFor:null,prevArrow:'<button type="button" data-role="none" class="slick-prev" aria-label="Previous" tabindex="0" role="button">Previous</button>',nextArrow:'<button type="button" data-role="none" class="slick-next" aria-label="Next" tabindex="0" role="button">Next</button>',autoplay:!1,autoplaySpeed:3e3,centerMode:!1,centerPadding:"50px",cssEase:"ease",customPaging:function(b,c){return a('<button type="button" data-role="none" role="button" tabindex="0" />').text(c+1)},dots:!1,dotsClass:"slick-dots",draggable:!0,easing:"linear",edgeFriction:.35,fade:!1,focusOnSelect:!1,infinite:!0,initialSlide:0,lazyLoad:"ondemand",mobileFirst:!1,pauseOnHover:!0,pauseOnFocus:!0,pauseOnDotsHover:!1,respondTo:"window",responsive:null,rows:1,rtl:!1,slide:"",slidesPerRow:1,slidesToShow:1,slidesToScroll:1,speed:500,swipe:!0,swipeToSlide:!1,touchMove:!0,touchThreshold:5,useCSS:!0,useTransform:!0,variableWidth:!1,vertical:!1,verticalSwiping:!1,waitForAnimate:!0,zIndex:1e3},e.initials={animating:!1,dragging:!1,autoPlayTimer:null,currentDirection:0,currentLeft:null,currentSlide:0,direction:1,$dots:null,listWidth:null,listHeight:null,loadIndex:0,$nextArrow:null,$prevArrow:null,slideCount:null,slideWidth:null,$slideTrack:null,$slides:null,sliding:!1,slideOffset:0,swipeLeft:null,$list:null,touchObject:{},transformsEnabled:!1,unslicked:!1},a.extend(e,e.initials),e.activeBreakpoint=null,e.animType=null,e.animProp=null,e.breakpoints=[],e.breakpointSettings=[],e.cssTransitions=!1,e.focussed=!1,e.interrupted=!1,e.hidden="hidden",e.paused=!0,e.positionProp=null,e.respondTo=null,e.rowCount=1,e.shouldClick=!0,e.$slider=a(c),e.$slidesCache=null,e.transformType=null,e.transitionType=null,e.visibilityChange="visibilitychange",e.windowWidth=0,e.windowTimer=null,f=a(c).data("slick")||{},e.options=a.extend({},e.defaults,d,f),e.currentSlide=e.options.initialSlide,e.originalSettings=e.options,"undefined"!=typeof document.mozHidden?(e.hidden="mozHidden",e.visibilityChange="mozvisibilitychange"):"undefined"!=typeof document.webkitHidden&&(e.hidden="webkitHidden",e.visibilityChange="webkitvisibilitychange"),e.autoPlay=a.proxy(e.autoPlay,e),e.autoPlayClear=a.proxy(e.autoPlayClear,e),e.autoPlayIterator=a.proxy(e.autoPlayIterator,e),e.changeSlide=a.proxy(e.changeSlide,e),e.clickHandler=a.proxy(e.clickHandler,e),e.selectHandler=a.proxy(e.selectHandler,e),e.setPosition=a.proxy(e.setPosition,e),e.swipeHandler=a.proxy(e.swipeHandler,e),e.dragHandler=a.proxy(e.dragHandler,e),e.keyHandler=a.proxy(e.keyHandler,e),e.instanceUid=b++,e.htmlExpr=/^(?:\s*(<[\w\W]+>)[^>]*)$/,e.registerBreakpoints(),e.init(!0)}var b=0;return c}(),b.prototype.activateADA=function(){var a=this;a.$slideTrack.find(".slick-active").attr({"aria-hidden":"false"}).find("a, input, button, select").attr({tabindex:"0"})},b.prototype.addSlide=b.prototype.slickAdd=function(b,c,d){var e=this;if("boolean"==typeof c)d=c,c=null;else if(0>c||c>=e.slideCount)return!1;e.unload(),"number"==typeof c?0===c&&0===e.$slides.length?a(b).appendTo(e.$slideTrack):d?a(b).insertBefore(e.$slides.eq(c)):a(b).insertAfter(e.$slides.eq(c)):d===!0?a(b).prependTo(e.$slideTrack):a(b).appendTo(e.$slideTrack),e.$slides=e.$slideTrack.children(this.options.slide),e.$slideTrack.children(this.options.slide).detach(),e.$slideTrack.append(e.$slides),e.$slides.each(function(b,c){a(c).attr("data-slick-index",b)}),e.$slidesCache=e.$slides,e.reinit()},b.prototype.animateHeight=function(){var a=this;if(1===a.options.slidesToShow&&a.options.adaptiveHeight===!0&&a.options.vertical===!1){var b=a.$slides.eq(a.currentSlide).outerHeight(!0);a.$list.animate({height:b},a.options.speed)}},b.prototype.animateSlide=function(b,c){var d={},e=this;e.animateHeight(),e.options.rtl===!0&&e.options.vertical===!1&&(b=-b),e.transformsEnabled===!1?e.options.vertical===!1?e.$slideTrack.animate({left:b},e.options.speed,e.options.easing,c):e.$slideTrack.animate({top:b},e.options.speed,e.options.easing,c):e.cssTransitions===!1?(e.options.rtl===!0&&(e.currentLeft=-e.currentLeft),a({animStart:e.currentLeft}).animate({animStart:b},{duration:e.options.speed,easing:e.options.easing,step:function(a){a=Math.ceil(a),e.options.vertical===!1?(d[e.animType]="translate("+a+"px, 0px)",e.$slideTrack.css(d)):(d[e.animType]="translate(0px,"+a+"px)",e.$slideTrack.css(d))},complete:function(){c&&c.call()}})):(e.applyTransition(),b=Math.ceil(b),e.options.vertical===!1?d[e.animType]="translate3d("+b+"px, 0px, 0px)":d[e.animType]="translate3d(0px,"+b+"px, 0px)",e.$slideTrack.css(d),c&&setTimeout(function(){e.disableTransition(),c.call()},e.options.speed))},b.prototype.getNavTarget=function(){var b=this,c=b.options.asNavFor;return c&&null!==c&&(c=a(c).not(b.$slider)),c},b.prototype.asNavFor=function(b){var c=this,d=c.getNavTarget();null!==d&&"object"==typeof d&&d.each(function(){var c=a(this).slick("getSlick");c.unslicked||c.slideHandler(b,!0)})},b.prototype.applyTransition=function(a){var b=this,c={};b.options.fade===!1?c[b.transitionType]=b.transformType+" "+b.options.speed+"ms "+b.options.cssEase:c[b.transitionType]="opacity "+b.options.speed+"ms "+b.options.cssEase,b.options.fade===!1?b.$slideTrack.css(c):b.$slides.eq(a).css(c)},b.prototype.autoPlay=function(){var a=this;a.autoPlayClear(),a.slideCount>a.options.slidesToShow&&(a.autoPlayTimer=setInterval(a.autoPlayIterator,a.options.autoplaySpeed))},b.prototype.autoPlayClear=function(){var a=this;a.autoPlayTimer&&clearInterval(a.autoPlayTimer)},b.prototype.autoPlayIterator=function(){var a=this,b=a.currentSlide+a.options.slidesToScroll;a.paused||a.interrupted||a.focussed||(a.options.infinite===!1&&(1===a.direction&&a.currentSlide+1===a.slideCount-1?a.direction=0:0===a.direction&&(b=a.currentSlide-a.options.slidesToScroll,a.currentSlide-1===0&&(a.direction=1))),a.slideHandler(b))},b.prototype.buildArrows=function(){var b=this;b.options.arrows===!0&&(b.$prevArrow=a(b.options.prevArrow).addClass("slick-arrow"),b.$nextArrow=a(b.options.nextArrow).addClass("slick-arrow"),b.slideCount>b.options.slidesToShow?(b.$prevArrow.removeClass("slick-hidden").removeAttr("aria-hidden tabindex"),b.$nextArrow.removeClass("slick-hidden").removeAttr("aria-hidden tabindex"),b.htmlExpr.test(b.options.prevArrow)&&b.$prevArrow.prependTo(b.options.appendArrows),b.htmlExpr.test(b.options.nextArrow)&&b.$nextArrow.appendTo(b.options.appendArrows),b.options.infinite!==!0&&b.$prevArrow.addClass("slick-disabled").attr("aria-disabled","true")):b.$prevArrow.add(b.$nextArrow).addClass("slick-hidden").attr({"aria-disabled":"true",tabindex:"-1"}))},b.prototype.buildDots=function(){var c,d,b=this;if(b.options.dots===!0&&b.slideCount>b.options.slidesToShow){for(b.$slider.addClass("slick-dotted"),d=a("<ul />").addClass(b.options.dotsClass),c=0;c<=b.getDotCount();c+=1)d.append(a("<li />").append(b.options.customPaging.call(this,b,c)));b.$dots=d.appendTo(b.options.appendDots),b.$dots.find("li").first().addClass("slick-active").attr("aria-hidden","false")}},b.prototype.buildOut=function(){var b=this;b.$slides=b.$slider.children(b.options.slide+":not(.slick-cloned)").addClass("slick-slide"),b.slideCount=b.$slides.length,b.$slides.each(function(b,c){a(c).attr("data-slick-index",b).data("originalStyling",a(c).attr("style")||"")}),b.$slider.addClass("slick-slider"),b.$slideTrack=0===b.slideCount?a('<div class="slick-track"/>').appendTo(b.$slider):b.$slides.wrapAll('<div class="slick-track"/>').parent(),b.$list=b.$slideTrack.wrap('<div aria-live="polite" class="slick-list"/>').parent(),b.$slideTrack.css("opacity",0),(b.options.centerMode===!0||b.options.swipeToSlide===!0)&&(b.options.slidesToScroll=1),a("img[data-lazy]",b.$slider).not("[src]").addClass("slick-loading"),b.setupInfinite(),b.buildArrows(),b.buildDots(),b.updateDots(),b.setSlideClasses("number"==typeof b.currentSlide?b.currentSlide:0),b.options.draggable===!0&&b.$list.addClass("draggable")},b.prototype.buildRows=function(){var b,c,d,e,f,g,h,a=this;if(e=document.createDocumentFragment(),g=a.$slider.children(),a.options.rows>1){for(h=a.options.slidesPerRow*a.options.rows,f=Math.ceil(g.length/h),b=0;f>b;b++){var i=document.createElement("div");for(c=0;c<a.options.rows;c++){var j=document.createElement("div");for(d=0;d<a.options.slidesPerRow;d++){var k=b*h+(c*a.options.slidesPerRow+d);g.get(k)&&j.appendChild(g.get(k))}i.appendChild(j)}e.appendChild(i)}a.$slider.empty().append(e),a.$slider.children().children().children().css({width:100/a.options.slidesPerRow+"%",display:"inline-block"})}},b.prototype.checkResponsive=function(b,c){var e,f,g,d=this,h=!1,i=d.$slider.width(),j=window.innerWidth||a(window).width();if("window"===d.respondTo?g=j:"slider"===d.respondTo?g=i:"min"===d.respondTo&&(g=Math.min(j,i)),d.options.responsive&&d.options.responsive.length&&null!==d.options.responsive){f=null;for(e in d.breakpoints)d.breakpoints.hasOwnProperty(e)&&(d.originalSettings.mobileFirst===!1?g<d.breakpoints[e]&&(f=d.breakpoints[e]):g>d.breakpoints[e]&&(f=d.breakpoints[e]));null!==f?null!==d.activeBreakpoint?(f!==d.activeBreakpoint||c)&&(d.activeBreakpoint=f,"unslick"===d.breakpointSettings[f]?d.unslick(f):(d.options=a.extend({},d.originalSettings,d.breakpointSettings[f]),b===!0&&(d.currentSlide=d.options.initialSlide),d.refresh(b)),h=f):(d.activeBreakpoint=f,"unslick"===d.breakpointSettings[f]?d.unslick(f):(d.options=a.extend({},d.originalSettings,d.breakpointSettings[f]),b===!0&&(d.currentSlide=d.options.initialSlide),d.refresh(b)),h=f):null!==d.activeBreakpoint&&(d.activeBreakpoint=null,d.options=d.originalSettings,b===!0&&(d.currentSlide=d.options.initialSlide),d.refresh(b),h=f),b||h===!1||d.$slider.trigger("breakpoint",[d,h])}},b.prototype.changeSlide=function(b,c){var f,g,h,d=this,e=a(b.currentTarget);switch(e.is("a")&&b.preventDefault(),e.is("li")||(e=e.closest("li")),h=d.slideCount%d.options.slidesToScroll!==0,f=h?0:(d.slideCount-d.currentSlide)%d.options.slidesToScroll,b.data.message){case"previous":g=0===f?d.options.slidesToScroll:d.options.slidesToShow-f,d.slideCount>d.options.slidesToShow&&d.slideHandler(d.currentSlide-g,!1,c);break;case"next":g=0===f?d.options.slidesToScroll:f,d.slideCount>d.options.slidesToShow&&d.slideHandler(d.currentSlide+g,!1,c);break;case"index":var i=0===b.data.index?0:b.data.index||e.index()*d.options.slidesToScroll;d.slideHandler(d.checkNavigable(i),!1,c),e.children().trigger("focus");break;default:return}},b.prototype.checkNavigable=function(a){var c,d,b=this;if(c=b.getNavigableIndexes(),d=0,a>c[c.length-1])a=c[c.length-1];else for(var e in c){if(a<c[e]){a=d;break}d=c[e]}return a},b.prototype.cleanUpEvents=function(){var b=this;b.options.dots&&null!==b.$dots&&a("li",b.$dots).off("click.slick",b.changeSlide).off("mouseenter.slick",a.proxy(b.interrupt,b,!0)).off("mouseleave.slick",a.proxy(b.interrupt,b,!1)),b.$slider.off("focus.slick blur.slick"),b.options.arrows===!0&&b.slideCount>b.options.slidesToShow&&(b.$prevArrow&&b.$prevArrow.off("click.slick",b.changeSlide),b.$nextArrow&&b.$nextArrow.off("click.slick",b.changeSlide)),b.$list.off("touchstart.slick mousedown.slick",b.swipeHandler),b.$list.off("touchmove.slick mousemove.slick",b.swipeHandler),b.$list.off("touchend.slick mouseup.slick",b.swipeHandler),b.$list.off("touchcancel.slick mouseleave.slick",b.swipeHandler),b.$list.off("click.slick",b.clickHandler),a(document).off(b.visibilityChange,b.visibility),b.cleanUpSlideEvents(),b.options.accessibility===!0&&b.$list.off("keydown.slick",b.keyHandler),b.options.focusOnSelect===!0&&a(b.$slideTrack).children().off("click.slick",b.selectHandler),a(window).off("orientationchange.slick.slick-"+b.instanceUid,b.orientationChange),a(window).off("resize.slick.slick-"+b.instanceUid,b.resize),a("[draggable!=true]",b.$slideTrack).off("dragstart",b.preventDefault),a(window).off("load.slick.slick-"+b.instanceUid,b.setPosition),a(document).off("ready.slick.slick-"+b.instanceUid,b.setPosition)},b.prototype.cleanUpSlideEvents=function(){var b=this;b.$list.off("mouseenter.slick",a.proxy(b.interrupt,b,!0)),b.$list.off("mouseleave.slick",a.proxy(b.interrupt,b,!1))},b.prototype.cleanUpRows=function(){var b,a=this;a.options.rows>1&&(b=a.$slides.children().children(),b.removeAttr("style"),a.$slider.empty().append(b))},b.prototype.clickHandler=function(a){var b=this;b.shouldClick===!1&&(a.stopImmediatePropagation(),a.stopPropagation(),a.preventDefault())},b.prototype.destroy=function(b){var c=this;c.autoPlayClear(),c.touchObject={},c.cleanUpEvents(),a(".slick-cloned",c.$slider).detach(),c.$dots&&c.$dots.remove(),c.$prevArrow&&c.$prevArrow.length&&(c.$prevArrow.removeClass("slick-disabled slick-arrow slick-hidden").removeAttr("aria-hidden aria-disabled tabindex").css("display",""),c.htmlExpr.test(c.options.prevArrow)&&c.$prevArrow.remove()),c.$nextArrow&&c.$nextArrow.length&&(c.$nextArrow.removeClass("slick-disabled slick-arrow slick-hidden").removeAttr("aria-hidden aria-disabled tabindex").css("display",""),c.htmlExpr.test(c.options.nextArrow)&&c.$nextArrow.remove()),c.$slides&&(c.$slides.removeClass("slick-slide slick-active slick-center slick-visible slick-current").removeAttr("aria-hidden").removeAttr("data-slick-index").each(function(){a(this).attr("style",a(this).data("originalStyling"))}),c.$slideTrack.children(this.options.slide).detach(),c.$slideTrack.detach(),c.$list.detach(),c.$slider.append(c.$slides)),c.cleanUpRows(),c.$slider.removeClass("slick-slider"),c.$slider.removeClass("slick-initialized"),c.$slider.removeClass("slick-dotted"),c.unslicked=!0,b||c.$slider.trigger("destroy",[c])},b.prototype.disableTransition=function(a){var b=this,c={};c[b.transitionType]="",b.options.fade===!1?b.$slideTrack.css(c):b.$slides.eq(a).css(c)},b.prototype.fadeSlide=function(a,b){var c=this;c.cssTransitions===!1?(c.$slides.eq(a).css({zIndex:c.options.zIndex}),c.$slides.eq(a).animate({opacity:1},c.options.speed,c.options.easing,b)):(c.applyTransition(a),c.$slides.eq(a).css({opacity:1,zIndex:c.options.zIndex}),b&&setTimeout(function(){c.disableTransition(a),b.call()},c.options.speed))},b.prototype.fadeSlideOut=function(a){var b=this;b.cssTransitions===!1?b.$slides.eq(a).animate({opacity:0,zIndex:b.options.zIndex-2},b.options.speed,b.options.easing):(b.applyTransition(a),b.$slides.eq(a).css({opacity:0,zIndex:b.options.zIndex-2}))},b.prototype.filterSlides=b.prototype.slickFilter=function(a){var b=this;null!==a&&(b.$slidesCache=b.$slides,b.unload(),b.$slideTrack.children(this.options.slide).detach(),b.$slidesCache.filter(a).appendTo(b.$slideTrack),b.reinit())},b.prototype.focusHandler=function(){var b=this;b.$slider.off("focus.slick blur.slick").on("focus.slick blur.slick","*:not(.slick-arrow)",function(c){c.stopImmediatePropagation();var d=a(this);setTimeout(function(){b.options.pauseOnFocus&&(b.focussed=d.is(":focus"),b.autoPlay())},0)})},b.prototype.getCurrent=b.prototype.slickCurrentSlide=function(){var a=this;return a.currentSlide},b.prototype.getDotCount=function(){var a=this,b=0,c=0,d=0;if(a.options.infinite===!0)for(;b<a.slideCount;)++d,b=c+a.options.slidesToScroll,c+=a.options.slidesToScroll<=a.options.slidesToShow?a.options.slidesToScroll:a.options.slidesToShow;else if(a.options.centerMode===!0)d=a.slideCount;else if(a.options.asNavFor)for(;b<a.slideCount;)++d,b=c+a.options.slidesToScroll,c+=a.options.slidesToScroll<=a.options.slidesToShow?a.options.slidesToScroll:a.options.slidesToShow;else d=1+Math.ceil((a.slideCount-a.options.slidesToShow)/a.options.slidesToScroll);return d-1},b.prototype.getLeft=function(a){var c,d,f,b=this,e=0;return b.slideOffset=0,d=b.$slides.first().outerHeight(!0),b.options.infinite===!0?(b.slideCount>b.options.slidesToShow&&(b.slideOffset=b.slideWidth*b.options.slidesToShow*-1,e=d*b.options.slidesToShow*-1),b.slideCount%b.options.slidesToScroll!==0&&a+b.options.slidesToScroll>b.slideCount&&b.slideCount>b.options.slidesToShow&&(a>b.slideCount?(b.slideOffset=(b.options.slidesToShow-(a-b.slideCount))*b.slideWidth*-1,e=(b.options.slidesToShow-(a-b.slideCount))*d*-1):(b.slideOffset=b.slideCount%b.options.slidesToScroll*b.slideWidth*-1,e=b.slideCount%b.options.slidesToScroll*d*-1))):a+b.options.slidesToShow>b.slideCount&&(b.slideOffset=(a+b.options.slidesToShow-b.slideCount)*b.slideWidth,e=(a+b.options.slidesToShow-b.slideCount)*d),b.slideCount<=b.options.slidesToShow&&(b.slideOffset=0,e=0),b.options.centerMode===!0&&b.options.infinite===!0?b.slideOffset+=b.slideWidth*Math.floor(b.options.slidesToShow/2)-b.slideWidth:b.options.centerMode===!0&&(b.slideOffset=0,b.slideOffset+=b.slideWidth*Math.floor(b.options.slidesToShow/2)),c=b.options.vertical===!1?a*b.slideWidth*-1+b.slideOffset:a*d*-1+e,b.options.variableWidth===!0&&(f=b.slideCount<=b.options.slidesToShow||b.options.infinite===!1?b.$slideTrack.children(".slick-slide").eq(a):b.$slideTrack.children(".slick-slide").eq(a+b.options.slidesToShow),c=b.options.rtl===!0?f[0]?-1*(b.$slideTrack.width()-f[0].offsetLeft-f.width()):0:f[0]?-1*f[0].offsetLeft:0,b.options.centerMode===!0&&(f=b.slideCount<=b.options.slidesToShow||b.options.infinite===!1?b.$slideTrack.children(".slick-slide").eq(a):b.$slideTrack.children(".slick-slide").eq(a+b.options.slidesToShow+1),c=b.options.rtl===!0?f[0]?-1*(b.$slideTrack.width()-f[0].offsetLeft-f.width()):0:f[0]?-1*f[0].offsetLeft:0,c+=(b.$list.width()-f.outerWidth())/2)),c},b.prototype.getOption=b.prototype.slickGetOption=function(a){var b=this;return b.options[a]},b.prototype.getNavigableIndexes=function(){var e,a=this,b=0,c=0,d=[];for(a.options.infinite===!1?e=a.slideCount:(b=-1*a.options.slidesToScroll,c=-1*a.options.slidesToScroll,e=2*a.slideCount);e>b;)d.push(b),b=c+a.options.slidesToScroll,c+=a.options.slidesToScroll<=a.options.slidesToShow?a.options.slidesToScroll:a.options.slidesToShow;return d},b.prototype.getSlick=function(){return this},b.prototype.getSlideCount=function(){var c,d,e,b=this;return e=b.options.centerMode===!0?b.slideWidth*Math.floor(b.options.slidesToShow/2):0,b.options.swipeToSlide===!0?(b.$slideTrack.find(".slick-slide").each(function(c,f){return f.offsetLeft-e+a(f).outerWidth()/2>-1*b.swipeLeft?(d=f,!1):void 0}),c=Math.abs(a(d).attr("data-slick-index")-b.currentSlide)||1):b.options.slidesToScroll},b.prototype.goTo=b.prototype.slickGoTo=function(a,b){var c=this;c.changeSlide({data:{message:"index",index:parseInt(a)}},b)},b.prototype.init=function(b){var c=this;a(c.$slider).hasClass("slick-initialized")||(a(c.$slider).addClass("slick-initialized"),c.buildRows(),c.buildOut(),c.setProps(),c.startLoad(),c.loadSlider(),c.initializeEvents(),c.updateArrows(),c.updateDots(),c.checkResponsive(!0),c.focusHandler()),b&&c.$slider.trigger("init",[c]),c.options.accessibility===!0&&c.initADA(),c.options.autoplay&&(c.paused=!1,c.autoPlay())},b.prototype.initADA=function(){var b=this;b.$slides.add(b.$slideTrack.find(".slick-cloned")).attr({"aria-hidden":"true",tabindex:"-1"}).find("a, input, button, select").attr({tabindex:"-1"}),b.$slideTrack.attr("role","listbox"),b.$slides.not(b.$slideTrack.find(".slick-cloned")).each(function(c){a(this).attr({role:"option","aria-describedby":"slick-slide"+b.instanceUid+c})}),null!==b.$dots&&b.$dots.attr("role","tablist").find("li").each(function(c){a(this).attr({role:"presentation","aria-selected":"false","aria-controls":"navigation"+b.instanceUid+c,id:"slick-slide"+b.instanceUid+c})}).first().attr("aria-selected","true").end().find("button").attr("role","button").end().closest("div").attr("role","toolbar"),b.activateADA()},b.prototype.initArrowEvents=function(){var a=this;a.options.arrows===!0&&a.slideCount>a.options.slidesToShow&&(a.$prevArrow.off("click.slick").on("click.slick",{message:"previous"},a.changeSlide),a.$nextArrow.off("click.slick").on("click.slick",{message:"next"},a.changeSlide))},b.prototype.initDotEvents=function(){var b=this;b.options.dots===!0&&b.slideCount>b.options.slidesToShow&&a("li",b.$dots).on("click.slick",{message:"index"},b.changeSlide),b.options.dots===!0&&b.options.pauseOnDotsHover===!0&&a("li",b.$dots).on("mouseenter.slick",a.proxy(b.interrupt,b,!0)).on("mouseleave.slick",a.proxy(b.interrupt,b,!1))},b.prototype.initSlideEvents=function(){var b=this;b.options.pauseOnHover&&(b.$list.on("mouseenter.slick",a.proxy(b.interrupt,b,!0)),b.$list.on("mouseleave.slick",a.proxy(b.interrupt,b,!1)))},b.prototype.initializeEvents=function(){var b=this;b.initArrowEvents(),b.initDotEvents(),b.initSlideEvents(),b.$list.on("touchstart.slick mousedown.slick",{action:"start"},b.swipeHandler),b.$list.on("touchmove.slick mousemove.slick",{action:"move"},b.swipeHandler),b.$list.on("touchend.slick mouseup.slick",{action:"end"},b.swipeHandler),b.$list.on("touchcancel.slick mouseleave.slick",{action:"end"},b.swipeHandler),b.$list.on("click.slick",b.clickHandler),a(document).on(b.visibilityChange,a.proxy(b.visibility,b)),b.options.accessibility===!0&&b.$list.on("keydown.slick",b.keyHandler),b.options.focusOnSelect===!0&&a(b.$slideTrack).children().on("click.slick",b.selectHandler),a(window).on("orientationchange.slick.slick-"+b.instanceUid,a.proxy(b.orientationChange,b)),a(window).on("resize.slick.slick-"+b.instanceUid,a.proxy(b.resize,b)),a("[draggable!=true]",b.$slideTrack).on("dragstart",b.preventDefault),a(window).on("load.slick.slick-"+b.instanceUid,b.setPosition),a(document).on("ready.slick.slick-"+b.instanceUid,b.setPosition)},b.prototype.initUI=function(){var a=this;a.options.arrows===!0&&a.slideCount>a.options.slidesToShow&&(a.$prevArrow.show(),a.$nextArrow.show()),a.options.dots===!0&&a.slideCount>a.options.slidesToShow&&a.$dots.show()},b.prototype.keyHandler=function(a){var b=this;a.target.tagName.match("TEXTAREA|INPUT|SELECT")||(37===a.keyCode&&b.options.accessibility===!0?b.changeSlide({data:{message:b.options.rtl===!0?"next":"previous"}}):39===a.keyCode&&b.options.accessibility===!0&&b.changeSlide({data:{message:b.options.rtl===!0?"previous":"next"}}))},b.prototype.lazyLoad=function(){function g(c){a("img[data-lazy]",c).each(function(){var c=a(this),d=a(this).attr("data-lazy"),e=document.createElement("img");e.onload=function(){c.animate({opacity:0},100,function(){c.attr("src",d).animate({opacity:1},200,function(){c.removeAttr("data-lazy").removeClass("slick-loading")}),b.$slider.trigger("lazyLoaded",[b,c,d])})},e.onerror=function(){c.removeAttr("data-lazy").removeClass("slick-loading").addClass("slick-lazyload-error"),b.$slider.trigger("lazyLoadError",[b,c,d])},e.src=d})}var c,d,e,f,b=this;b.options.centerMode===!0?b.options.infinite===!0?(e=b.currentSlide+(b.options.slidesToShow/2+1),f=e+b.options.slidesToShow+2):(e=Math.max(0,b.currentSlide-(b.options.slidesToShow/2+1)),f=2+(b.options.slidesToShow/2+1)+b.currentSlide):(e=b.options.infinite?b.options.slidesToShow+b.currentSlide:b.currentSlide,f=Math.ceil(e+b.options.slidesToShow),b.options.fade===!0&&(e>0&&e--,f<=b.slideCount&&f++)),c=b.$slider.find(".slick-slide").slice(e,f),g(c),b.slideCount<=b.options.slidesToShow?(d=b.$slider.find(".slick-slide"),g(d)):b.currentSlide>=b.slideCount-b.options.slidesToShow?(d=b.$slider.find(".slick-cloned").slice(0,b.options.slidesToShow),g(d)):0===b.currentSlide&&(d=b.$slider.find(".slick-cloned").slice(-1*b.options.slidesToShow),g(d))},b.prototype.loadSlider=function(){var a=this;a.setPosition(),a.$slideTrack.css({opacity:1}),a.$slider.removeClass("slick-loading"),a.initUI(),"progressive"===a.options.lazyLoad&&a.progressiveLazyLoad()},b.prototype.next=b.prototype.slickNext=function(){var a=this;a.changeSlide({data:{message:"next"}})},b.prototype.orientationChange=function(){var a=this;a.checkResponsive(),a.setPosition()},b.prototype.pause=b.prototype.slickPause=function(){var a=this;a.autoPlayClear(),a.paused=!0},b.prototype.play=b.prototype.slickPlay=function(){var a=this;a.autoPlay(),a.options.autoplay=!0,a.paused=!1,a.focussed=!1,a.interrupted=!1},b.prototype.postSlide=function(a){var b=this;b.unslicked||(b.$slider.trigger("afterChange",[b,a]),b.animating=!1,b.setPosition(),b.swipeLeft=null,b.options.autoplay&&b.autoPlay(),b.options.accessibility===!0&&b.initADA())},b.prototype.prev=b.prototype.slickPrev=function(){var a=this;a.changeSlide({data:{message:"previous"}})},b.prototype.preventDefault=function(a){a.preventDefault()},b.prototype.progressiveLazyLoad=function(b){b=b||1;var e,f,g,c=this,d=a("img[data-lazy]",c.$slider);d.length?(e=d.first(),f=e.attr("data-lazy"),g=document.createElement("img"),g.onload=function(){e.attr("src",f).removeAttr("data-lazy").removeClass("slick-loading"),c.options.adaptiveHeight===!0&&c.setPosition(),c.$slider.trigger("lazyLoaded",[c,e,f]),c.progressiveLazyLoad()},g.onerror=function(){3>b?setTimeout(function(){c.progressiveLazyLoad(b+1)},500):(e.removeAttr("data-lazy").removeClass("slick-loading").addClass("slick-lazyload-error"),c.$slider.trigger("lazyLoadError",[c,e,f]),c.progressiveLazyLoad())},g.src=f):c.$slider.trigger("allImagesLoaded",[c])},b.prototype.refresh=function(b){var d,e,c=this;e=c.slideCount-c.options.slidesToShow,!c.options.infinite&&c.currentSlide>e&&(c.currentSlide=e),c.slideCount<=c.options.slidesToShow&&(c.currentSlide=0),d=c.currentSlide,c.destroy(!0),a.extend(c,c.initials,{currentSlide:d}),c.init(),b||c.changeSlide({data:{message:"index",index:d}},!1)},b.prototype.registerBreakpoints=function(){var c,d,e,b=this,f=b.options.responsive||null;if("array"===a.type(f)&&f.length){b.respondTo=b.options.respondTo||"window";for(c in f)if(e=b.breakpoints.length-1,d=f[c].breakpoint,f.hasOwnProperty(c)){for(;e>=0;)b.breakpoints[e]&&b.breakpoints[e]===d&&b.breakpoints.splice(e,1),e--;b.breakpoints.push(d),b.breakpointSettings[d]=f[c].settings}b.breakpoints.sort(function(a,c){return b.options.mobileFirst?a-c:c-a})}},b.prototype.reinit=function(){var b=this;b.$slides=b.$slideTrack.children(b.options.slide).addClass("slick-slide"),b.slideCount=b.$slides.length,b.currentSlide>=b.slideCount&&0!==b.currentSlide&&(b.currentSlide=b.currentSlide-b.options.slidesToScroll),b.slideCount<=b.options.slidesToShow&&(b.currentSlide=0),b.registerBreakpoints(),b.setProps(),b.setupInfinite(),b.buildArrows(),b.updateArrows(),b.initArrowEvents(),b.buildDots(),b.updateDots(),b.initDotEvents(),b.cleanUpSlideEvents(),b.initSlideEvents(),b.checkResponsive(!1,!0),b.options.focusOnSelect===!0&&a(b.$slideTrack).children().on("click.slick",b.selectHandler),b.setSlideClasses("number"==typeof b.currentSlide?b.currentSlide:0),b.setPosition(),b.focusHandler(),b.paused=!b.options.autoplay,b.autoPlay(),b.$slider.trigger("reInit",[b])},b.prototype.resize=function(){var b=this;a(window).width()!==b.windowWidth&&(clearTimeout(b.windowDelay),b.windowDelay=window.setTimeout(function(){b.windowWidth=a(window).width(),b.checkResponsive(),b.unslicked||b.setPosition()},50))},b.prototype.removeSlide=b.prototype.slickRemove=function(a,b,c){var d=this;return"boolean"==typeof a?(b=a,a=b===!0?0:d.slideCount-1):a=b===!0?--a:a,d.slideCount<1||0>a||a>d.slideCount-1?!1:(d.unload(),c===!0?d.$slideTrack.children().remove():d.$slideTrack.children(this.options.slide).eq(a).remove(),d.$slides=d.$slideTrack.children(this.options.slide),d.$slideTrack.children(this.options.slide).detach(),d.$slideTrack.append(d.$slides),d.$slidesCache=d.$slides,void d.reinit())},b.prototype.setCSS=function(a){var d,e,b=this,c={};b.options.rtl===!0&&(a=-a),d="left"==b.positionProp?Math.ceil(a)+"px":"0px",e="top"==b.positionProp?Math.ceil(a)+"px":"0px",c[b.positionProp]=a,b.transformsEnabled===!1?b.$slideTrack.css(c):(c={},b.cssTransitions===!1?(c[b.animType]="translate("+d+", "+e+")",b.$slideTrack.css(c)):(c[b.animType]="translate3d("+d+", "+e+", 0px)",b.$slideTrack.css(c)))},b.prototype.setDimensions=function(){var a=this;a.options.vertical===!1?a.options.centerMode===!0&&a.$list.css({padding:"0px "+a.options.centerPadding}):(a.$list.height(a.$slides.first().outerHeight(!0)*a.options.slidesToShow),a.options.centerMode===!0&&a.$list.css({padding:a.options.centerPadding+" 0px"})),a.listWidth=a.$list.width(),a.listHeight=a.$list.height(),a.options.vertical===!1&&a.options.variableWidth===!1?(a.slideWidth=Math.ceil(a.listWidth/a.options.slidesToShow),a.$slideTrack.width(Math.ceil(a.slideWidth*a.$slideTrack.children(".slick-slide").length))):a.options.variableWidth===!0?a.$slideTrack.width(5e3*a.slideCount):(a.slideWidth=Math.ceil(a.listWidth),a.$slideTrack.height(Math.ceil(a.$slides.first().outerHeight(!0)*a.$slideTrack.children(".slick-slide").length)));var b=a.$slides.first().outerWidth(!0)-a.$slides.first().width();a.options.variableWidth===!1&&a.$slideTrack.children(".slick-slide").width(a.slideWidth-b)},b.prototype.setFade=function(){var c,b=this;b.$slides.each(function(d,e){c=b.slideWidth*d*-1,b.options.rtl===!0?a(e).css({position:"relative",right:c,top:0,zIndex:b.options.zIndex-2,opacity:0}):a(e).css({position:"relative",left:c,top:0,zIndex:b.options.zIndex-2,opacity:0})}),b.$slides.eq(b.currentSlide).css({zIndex:b.options.zIndex-1,opacity:1})},b.prototype.setHeight=function(){var a=this;if(1===a.options.slidesToShow&&a.options.adaptiveHeight===!0&&a.options.vertical===!1){var b=a.$slides.eq(a.currentSlide).outerHeight(!0);a.$list.css("height",b)}},b.prototype.setOption=b.prototype.slickSetOption=function(){var c,d,e,f,h,b=this,g=!1;if("object"===a.type(arguments[0])?(e=arguments[0],g=arguments[1],h="multiple"):"string"===a.type(arguments[0])&&(e=arguments[0],f=arguments[1],g=arguments[2],"responsive"===arguments[0]&&"array"===a.type(arguments[1])?h="responsive":"undefined"!=typeof arguments[1]&&(h="single")),"single"===h)b.options[e]=f;else if("multiple"===h)a.each(e,function(a,c){b.options[a]=c});else if("responsive"===h)for(d in f)if("array"!==a.type(b.options.responsive))b.options.responsive=[f[d]];else{for(c=b.options.responsive.length-1;c>=0;)b.options.responsive[c].breakpoint===f[d].breakpoint&&b.options.responsive.splice(c,1),c--;b.options.responsive.push(f[d])}g&&(b.unload(),b.reinit())},b.prototype.setPosition=function(){var a=this;a.setDimensions(),a.setHeight(),a.options.fade===!1?a.setCSS(a.getLeft(a.currentSlide)):a.setFade(),a.$slider.trigger("setPosition",[a])},b.prototype.setProps=function(){var a=this,b=document.body.style;a.positionProp=a.options.vertical===!0?"top":"left","top"===a.positionProp?a.$slider.addClass("slick-vertical"):a.$slider.removeClass("slick-vertical"),(void 0!==b.WebkitTransition||void 0!==b.MozTransition||void 0!==b.msTransition)&&a.options.useCSS===!0&&(a.cssTransitions=!0),a.options.fade&&("number"==typeof a.options.zIndex?a.options.zIndex<3&&(a.options.zIndex=3):a.options.zIndex=a.defaults.zIndex),void 0!==b.OTransform&&(a.animType="OTransform",a.transformType="-o-transform",a.transitionType="OTransition",void 0===b.perspectiveProperty&&void 0===b.webkitPerspective&&(a.animType=!1)),void 0!==b.MozTransform&&(a.animType="MozTransform",a.transformType="-moz-transform",a.transitionType="MozTransition",void 0===b.perspectiveProperty&&void 0===b.MozPerspective&&(a.animType=!1)),void 0!==b.webkitTransform&&(a.animType="webkitTransform",a.transformType="-webkit-transform",a.transitionType="webkitTransition",void 0===b.perspectiveProperty&&void 0===b.webkitPerspective&&(a.animType=!1)),void 0!==b.msTransform&&(a.animType="msTransform",a.transformType="-ms-transform",a.transitionType="msTransition",void 0===b.msTransform&&(a.animType=!1)),void 0!==b.transform&&a.animType!==!1&&(a.animType="transform",a.transformType="transform",a.transitionType="transition"),a.transformsEnabled=a.options.useTransform&&null!==a.animType&&a.animType!==!1},b.prototype.setSlideClasses=function(a){var c,d,e,f,b=this;d=b.$slider.find(".slick-slide").removeClass("slick-active slick-center slick-current").attr("aria-hidden","true"),b.$slides.eq(a).addClass("slick-current"),b.options.centerMode===!0?(c=Math.floor(b.options.slidesToShow/2),b.options.infinite===!0&&(a>=c&&a<=b.slideCount-1-c?b.$slides.slice(a-c,a+c+1).addClass("slick-active").attr("aria-hidden","false"):(e=b.options.slidesToShow+a,
d.slice(e-c+1,e+c+2).addClass("slick-active").attr("aria-hidden","false")),0===a?d.eq(d.length-1-b.options.slidesToShow).addClass("slick-center"):a===b.slideCount-1&&d.eq(b.options.slidesToShow).addClass("slick-center")),b.$slides.eq(a).addClass("slick-center")):a>=0&&a<=b.slideCount-b.options.slidesToShow?b.$slides.slice(a,a+b.options.slidesToShow).addClass("slick-active").attr("aria-hidden","false"):d.length<=b.options.slidesToShow?d.addClass("slick-active").attr("aria-hidden","false"):(f=b.slideCount%b.options.slidesToShow,e=b.options.infinite===!0?b.options.slidesToShow+a:a,b.options.slidesToShow==b.options.slidesToScroll&&b.slideCount-a<b.options.slidesToShow?d.slice(e-(b.options.slidesToShow-f),e+f).addClass("slick-active").attr("aria-hidden","false"):d.slice(e,e+b.options.slidesToShow).addClass("slick-active").attr("aria-hidden","false")),"ondemand"===b.options.lazyLoad&&b.lazyLoad()},b.prototype.setupInfinite=function(){var c,d,e,b=this;if(b.options.fade===!0&&(b.options.centerMode=!1),b.options.infinite===!0&&b.options.fade===!1&&(d=null,b.slideCount>b.options.slidesToShow)){for(e=b.options.centerMode===!0?b.options.slidesToShow+1:b.options.slidesToShow,c=b.slideCount;c>b.slideCount-e;c-=1)d=c-1,a(b.$slides[d]).clone(!0).attr("id","").attr("data-slick-index",d-b.slideCount).prependTo(b.$slideTrack).addClass("slick-cloned");for(c=0;e>c;c+=1)d=c,a(b.$slides[d]).clone(!0).attr("id","").attr("data-slick-index",d+b.slideCount).appendTo(b.$slideTrack).addClass("slick-cloned");b.$slideTrack.find(".slick-cloned").find("[id]").each(function(){a(this).attr("id","")})}},b.prototype.interrupt=function(a){var b=this;a||b.autoPlay(),b.interrupted=a},b.prototype.selectHandler=function(b){var c=this,d=a(b.target).is(".slick-slide")?a(b.target):a(b.target).parents(".slick-slide"),e=parseInt(d.attr("data-slick-index"));return e||(e=0),c.slideCount<=c.options.slidesToShow?(c.setSlideClasses(e),void c.asNavFor(e)):void c.slideHandler(e)},b.prototype.slideHandler=function(a,b,c){var d,e,f,g,j,h=null,i=this;return b=b||!1,i.animating===!0&&i.options.waitForAnimate===!0||i.options.fade===!0&&i.currentSlide===a||i.slideCount<=i.options.slidesToShow?void 0:(b===!1&&i.asNavFor(a),d=a,h=i.getLeft(d),g=i.getLeft(i.currentSlide),i.currentLeft=null===i.swipeLeft?g:i.swipeLeft,i.options.infinite===!1&&i.options.centerMode===!1&&(0>a||a>i.getDotCount()*i.options.slidesToScroll)?void(i.options.fade===!1&&(d=i.currentSlide,c!==!0?i.animateSlide(g,function(){i.postSlide(d)}):i.postSlide(d))):i.options.infinite===!1&&i.options.centerMode===!0&&(0>a||a>i.slideCount-i.options.slidesToScroll)?void(i.options.fade===!1&&(d=i.currentSlide,c!==!0?i.animateSlide(g,function(){i.postSlide(d)}):i.postSlide(d))):(i.options.autoplay&&clearInterval(i.autoPlayTimer),e=0>d?i.slideCount%i.options.slidesToScroll!==0?i.slideCount-i.slideCount%i.options.slidesToScroll:i.slideCount+d:d>=i.slideCount?i.slideCount%i.options.slidesToScroll!==0?0:d-i.slideCount:d,i.animating=!0,i.$slider.trigger("beforeChange",[i,i.currentSlide,e]),f=i.currentSlide,i.currentSlide=e,i.setSlideClasses(i.currentSlide),i.options.asNavFor&&(j=i.getNavTarget(),j=j.slick("getSlick"),j.slideCount<=j.options.slidesToShow&&j.setSlideClasses(i.currentSlide)),i.updateDots(),i.updateArrows(),i.options.fade===!0?(c!==!0?(i.fadeSlideOut(f),i.fadeSlide(e,function(){i.postSlide(e)})):i.postSlide(e),void i.animateHeight()):void(c!==!0?i.animateSlide(h,function(){i.postSlide(e)}):i.postSlide(e))))},b.prototype.startLoad=function(){var a=this;a.options.arrows===!0&&a.slideCount>a.options.slidesToShow&&(a.$prevArrow.hide(),a.$nextArrow.hide()),a.options.dots===!0&&a.slideCount>a.options.slidesToShow&&a.$dots.hide(),a.$slider.addClass("slick-loading")},b.prototype.swipeDirection=function(){var a,b,c,d,e=this;return a=e.touchObject.startX-e.touchObject.curX,b=e.touchObject.startY-e.touchObject.curY,c=Math.atan2(b,a),d=Math.round(180*c/Math.PI),0>d&&(d=360-Math.abs(d)),45>=d&&d>=0?e.options.rtl===!1?"left":"right":360>=d&&d>=315?e.options.rtl===!1?"left":"right":d>=135&&225>=d?e.options.rtl===!1?"right":"left":e.options.verticalSwiping===!0?d>=35&&135>=d?"down":"up":"vertical"},b.prototype.swipeEnd=function(a){var c,d,b=this;if(b.dragging=!1,b.interrupted=!1,b.shouldClick=b.touchObject.swipeLength>10?!1:!0,void 0===b.touchObject.curX)return!1;if(b.touchObject.edgeHit===!0&&b.$slider.trigger("edge",[b,b.swipeDirection()]),b.touchObject.swipeLength>=b.touchObject.minSwipe){switch(d=b.swipeDirection()){case"left":case"down":c=b.options.swipeToSlide?b.checkNavigable(b.currentSlide+b.getSlideCount()):b.currentSlide+b.getSlideCount(),b.currentDirection=0;break;case"right":case"up":c=b.options.swipeToSlide?b.checkNavigable(b.currentSlide-b.getSlideCount()):b.currentSlide-b.getSlideCount(),b.currentDirection=1}"vertical"!=d&&(b.slideHandler(c),b.touchObject={},b.$slider.trigger("swipe",[b,d]))}else b.touchObject.startX!==b.touchObject.curX&&(b.slideHandler(b.currentSlide),b.touchObject={})},b.prototype.swipeHandler=function(a){var b=this;if(!(b.options.swipe===!1||"ontouchend"in document&&b.options.swipe===!1||b.options.draggable===!1&&-1!==a.type.indexOf("mouse")))switch(b.touchObject.fingerCount=a.originalEvent&&void 0!==a.originalEvent.touches?a.originalEvent.touches.length:1,b.touchObject.minSwipe=b.listWidth/b.options.touchThreshold,b.options.verticalSwiping===!0&&(b.touchObject.minSwipe=b.listHeight/b.options.touchThreshold),a.data.action){case"start":b.swipeStart(a);break;case"move":b.swipeMove(a);break;case"end":b.swipeEnd(a)}},b.prototype.swipeMove=function(a){var d,e,f,g,h,b=this;return h=void 0!==a.originalEvent?a.originalEvent.touches:null,!b.dragging||h&&1!==h.length?!1:(d=b.getLeft(b.currentSlide),b.touchObject.curX=void 0!==h?h[0].pageX:a.clientX,b.touchObject.curY=void 0!==h?h[0].pageY:a.clientY,b.touchObject.swipeLength=Math.round(Math.sqrt(Math.pow(b.touchObject.curX-b.touchObject.startX,2))),b.options.verticalSwiping===!0&&(b.touchObject.swipeLength=Math.round(Math.sqrt(Math.pow(b.touchObject.curY-b.touchObject.startY,2)))),e=b.swipeDirection(),"vertical"!==e?(void 0!==a.originalEvent&&b.touchObject.swipeLength>4&&a.preventDefault(),g=(b.options.rtl===!1?1:-1)*(b.touchObject.curX>b.touchObject.startX?1:-1),b.options.verticalSwiping===!0&&(g=b.touchObject.curY>b.touchObject.startY?1:-1),f=b.touchObject.swipeLength,b.touchObject.edgeHit=!1,b.options.infinite===!1&&(0===b.currentSlide&&"right"===e||b.currentSlide>=b.getDotCount()&&"left"===e)&&(f=b.touchObject.swipeLength*b.options.edgeFriction,b.touchObject.edgeHit=!0),b.options.vertical===!1?b.swipeLeft=d+f*g:b.swipeLeft=d+f*(b.$list.height()/b.listWidth)*g,b.options.verticalSwiping===!0&&(b.swipeLeft=d+f*g),b.options.fade===!0||b.options.touchMove===!1?!1:b.animating===!0?(b.swipeLeft=null,!1):void b.setCSS(b.swipeLeft)):void 0)},b.prototype.swipeStart=function(a){var c,b=this;return b.interrupted=!0,1!==b.touchObject.fingerCount||b.slideCount<=b.options.slidesToShow?(b.touchObject={},!1):(void 0!==a.originalEvent&&void 0!==a.originalEvent.touches&&(c=a.originalEvent.touches[0]),b.touchObject.startX=b.touchObject.curX=void 0!==c?c.pageX:a.clientX,b.touchObject.startY=b.touchObject.curY=void 0!==c?c.pageY:a.clientY,void(b.dragging=!0))},b.prototype.unfilterSlides=b.prototype.slickUnfilter=function(){var a=this;null!==a.$slidesCache&&(a.unload(),a.$slideTrack.children(this.options.slide).detach(),a.$slidesCache.appendTo(a.$slideTrack),a.reinit())},b.prototype.unload=function(){var b=this;a(".slick-cloned",b.$slider).remove(),b.$dots&&b.$dots.remove(),b.$prevArrow&&b.htmlExpr.test(b.options.prevArrow)&&b.$prevArrow.remove(),b.$nextArrow&&b.htmlExpr.test(b.options.nextArrow)&&b.$nextArrow.remove(),b.$slides.removeClass("slick-slide slick-active slick-visible slick-current").attr("aria-hidden","true").css("width","")},b.prototype.unslick=function(a){var b=this;b.$slider.trigger("unslick",[b,a]),b.destroy()},b.prototype.updateArrows=function(){var b,a=this;b=Math.floor(a.options.slidesToShow/2),a.options.arrows===!0&&a.slideCount>a.options.slidesToShow&&!a.options.infinite&&(a.$prevArrow.removeClass("slick-disabled").attr("aria-disabled","false"),a.$nextArrow.removeClass("slick-disabled").attr("aria-disabled","false"),0===a.currentSlide?(a.$prevArrow.addClass("slick-disabled").attr("aria-disabled","true"),a.$nextArrow.removeClass("slick-disabled").attr("aria-disabled","false")):a.currentSlide>=a.slideCount-a.options.slidesToShow&&a.options.centerMode===!1?(a.$nextArrow.addClass("slick-disabled").attr("aria-disabled","true"),a.$prevArrow.removeClass("slick-disabled").attr("aria-disabled","false")):a.currentSlide>=a.slideCount-1&&a.options.centerMode===!0&&(a.$nextArrow.addClass("slick-disabled").attr("aria-disabled","true"),a.$prevArrow.removeClass("slick-disabled").attr("aria-disabled","false")))},b.prototype.updateDots=function(){var a=this;null!==a.$dots&&(a.$dots.find("li").removeClass("slick-active").attr("aria-hidden","true"),a.$dots.find("li").eq(Math.floor(a.currentSlide/a.options.slidesToScroll)).addClass("slick-active").attr("aria-hidden","false"))},b.prototype.visibility=function(){var a=this;a.options.autoplay&&(document[a.hidden]?a.interrupted=!0:a.interrupted=!1)},a.fn.slick=function(){var f,g,a=this,c=arguments[0],d=Array.prototype.slice.call(arguments,1),e=a.length;for(f=0;e>f;f++)if("object"==typeof c||"undefined"==typeof c?a[f].slick=new b(a[f],c):g=a[f].slick[c].apply(a[f].slick,d),"undefined"!=typeof g)return g;return a}});
/**
 * Init Hero sliders.
 *
 * This just takes all the sliders places on the page
 * and initiates Slick JS to animate and slide them.
 *
 * @param  {Object} $ jQuery
 */
( function( $ ) {
	// Anything with data attached to it, slick it!
	$( '.hero .sliders' ).each( function( i, v ) {
		var speed = $( this ).attr( 'data-slider-speed' );

		$( this ).slick( {
			slidesToShow:    1,
			slidesToScroll:  1,
			autoplay:        true,
			autoplaySpeed:   speed * 1000,
			dots:				true,
			prevArrow: '',
			nextArrow: '',
		} );
	} );
} )( jQuery );

/**
 * File window-ready.js
 *
 * Add a "ready" class to <body> when window is ready.
 */
window.Window_Ready = {};
( function( window, $, app ) {

	// Constructor.
	app.init = function() {
		app.cache();
		app.bindEvents();
	};

	// Cache document elements.
	app.cache = function() {
		app.$c = {
			window: $( window ),
			body: $( document.body ),
		};
	};

	// Combine all events.
	app.bindEvents = function() {
		app.$c.window.load( app.addBodyClass );
	};

	// Add a class to <body>.
	app.addBodyClass = function() {
		app.$c.body.addClass( 'ready' );
	};

	// Engage!
	$( app.init );

})( window, jQuery, window.Window_Ready );
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNtYjItcmFkaW8taW1hZ2UtZmllbGQuanMiLCJqcXVlcnkuZm9ybS5qcyIsImpxdWVyeS5sYXp5bG9hZC1hbnkubWluLmpzIiwianF1ZXJ5Lm1hZ25pZmljcG9wdXAubWluLmpzIiwianMtZW5hYmxlZC5qcyIsIm1vZGFsLmpzIiwic2NyaXB0cy5qcyIsInNlYXJjaC5qcyIsInNraXAtbGluay1mb2N1cy1maXguanMiLCJzbGljay5taW4uanMiLCJ3ZHMtaGVyby13aWRnZXQuanMiLCJ3aW5kb3ctcmVhZHkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3dkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InByb2plY3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoIGZ1bmN0aW9uKCAkICkge1xyXG4gICAgICAkKGRvY3VtZW50KS5vbihcImNsaWNrXCIsIFwiLmNtYi1yYWRpby1pbWFnZVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAkKHRoaXMpLmNsb3Nlc3QoXCIuY21iLXR5cGUtcmFkaW8taW1hZ2VcIikuZmluZChcIi5jbWItcmFkaW8taW1hZ2VcIikucmVtb3ZlQ2xhc3MoXCJjbWItcmFkaW8taW1hZ2Utc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcyhcImNtYi1yYWRpby1pbWFnZS1zZWxlY3RlZFwiKTtcclxuICAgICAgfSk7XHJcbn0gKSggalF1ZXJ5ICk7XHJcbiIsIi8qIVxuICogalF1ZXJ5IEZvcm0gUGx1Z2luXG4gKiB2ZXJzaW9uOiAzLjUxLjAtMjAxNC4wNi4yMFxuICogUmVxdWlyZXMgalF1ZXJ5IHYxLjUgb3IgbGF0ZXJcbiAqIENvcHlyaWdodCAoYykgMjAxNCBNLiBBbHN1cFxuICogRXhhbXBsZXMgYW5kIGRvY3VtZW50YXRpb24gYXQ6IGh0dHA6Ly9tYWxzdXAuY29tL2pxdWVyeS9mb3JtL1xuICogUHJvamVjdCByZXBvc2l0b3J5OiBodHRwczovL2dpdGh1Yi5jb20vbWFsc3VwL2Zvcm1cbiAqIER1YWwgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIGxpY2Vuc2VzLlxuICogaHR0cHM6Ly9naXRodWIuY29tL21hbHN1cC9mb3JtI2NvcHlyaWdodC1hbmQtbGljZW5zZVxuICovXG4vKmdsb2JhbCBBY3RpdmVYT2JqZWN0ICovXG5cbi8vIEFNRCBzdXBwb3J0XG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIC8vIHVzaW5nIEFNRDsgcmVnaXN0ZXIgYXMgYW5vbiBtb2R1bGVcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG5vIEFNRDsgaW52b2tlIGRpcmVjdGx5XG4gICAgICAgIGZhY3RvcnkoICh0eXBlb2YoalF1ZXJ5KSAhPSAndW5kZWZpbmVkJykgPyBqUXVlcnkgOiB3aW5kb3cuWmVwdG8gKTtcbiAgICB9XG59XG5cbihmdW5jdGlvbigkKSB7XG5cInVzZSBzdHJpY3RcIjtcblxuLypcbiAgICBVc2FnZSBOb3RlOlxuICAgIC0tLS0tLS0tLS0tXG4gICAgRG8gbm90IHVzZSBib3RoIGFqYXhTdWJtaXQgYW5kIGFqYXhGb3JtIG9uIHRoZSBzYW1lIGZvcm0uICBUaGVzZVxuICAgIGZ1bmN0aW9ucyBhcmUgbXV0dWFsbHkgZXhjbHVzaXZlLiAgVXNlIGFqYXhTdWJtaXQgaWYgeW91IHdhbnRcbiAgICB0byBiaW5kIHlvdXIgb3duIHN1Ym1pdCBoYW5kbGVyIHRvIHRoZSBmb3JtLiAgRm9yIGV4YW1wbGUsXG5cbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnI215Rm9ybScpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7IC8vIDwtLSBpbXBvcnRhbnRcbiAgICAgICAgICAgICQodGhpcykuYWpheFN1Ym1pdCh7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnI291dHB1dCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIFVzZSBhamF4Rm9ybSB3aGVuIHlvdSB3YW50IHRoZSBwbHVnaW4gdG8gbWFuYWdlIGFsbCB0aGUgZXZlbnQgYmluZGluZ1xuICAgIGZvciB5b3UuICBGb3IgZXhhbXBsZSxcblxuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcjbXlGb3JtJykuYWpheEZvcm0oe1xuICAgICAgICAgICAgdGFyZ2V0OiAnI291dHB1dCdcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBZb3UgY2FuIGFsc28gdXNlIGFqYXhGb3JtIHdpdGggZGVsZWdhdGlvbiAocmVxdWlyZXMgalF1ZXJ5IHYxLjcrKSwgc28gdGhlXG4gICAgZm9ybSBkb2VzIG5vdCBoYXZlIHRvIGV4aXN0IHdoZW4geW91IGludm9rZSBhamF4Rm9ybTpcblxuICAgICQoJyNteUZvcm0nKS5hamF4Rm9ybSh7XG4gICAgICAgIGRlbGVnYXRpb246IHRydWUsXG4gICAgICAgIHRhcmdldDogJyNvdXRwdXQnXG4gICAgfSk7XG5cbiAgICBXaGVuIHVzaW5nIGFqYXhGb3JtLCB0aGUgYWpheFN1Ym1pdCBmdW5jdGlvbiB3aWxsIGJlIGludm9rZWQgZm9yIHlvdVxuICAgIGF0IHRoZSBhcHByb3ByaWF0ZSB0aW1lLlxuKi9cblxuLyoqXG4gKiBGZWF0dXJlIGRldGVjdGlvblxuICovXG52YXIgZmVhdHVyZSA9IHt9O1xuZmVhdHVyZS5maWxlYXBpID0gJChcIjxpbnB1dCB0eXBlPSdmaWxlJy8+XCIpLmdldCgwKS5maWxlcyAhPT0gdW5kZWZpbmVkO1xuZmVhdHVyZS5mb3JtZGF0YSA9IHdpbmRvdy5Gb3JtRGF0YSAhPT0gdW5kZWZpbmVkO1xuXG52YXIgaGFzUHJvcCA9ICEhJC5mbi5wcm9wO1xuXG4vLyBhdHRyMiB1c2VzIHByb3Agd2hlbiBpdCBjYW4gYnV0IGNoZWNrcyB0aGUgcmV0dXJuIHR5cGUgZm9yXG4vLyBhbiBleHBlY3RlZCBzdHJpbmcuICB0aGlzIGFjY291bnRzIGZvciB0aGUgY2FzZSB3aGVyZSBhIGZvcm0gXG4vLyBjb250YWlucyBpbnB1dHMgd2l0aCBuYW1lcyBsaWtlIFwiYWN0aW9uXCIgb3IgXCJtZXRob2RcIjsgaW4gdGhvc2Vcbi8vIGNhc2VzIFwicHJvcFwiIHJldHVybnMgdGhlIGVsZW1lbnRcbiQuZm4uYXR0cjIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoICEgaGFzUHJvcCApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0ci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgICB2YXIgdmFsID0gdGhpcy5wcm9wLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgaWYgKCAoIHZhbCAmJiB2YWwuanF1ZXJ5ICkgfHwgdHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmF0dHIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbi8qKlxuICogYWpheFN1Ym1pdCgpIHByb3ZpZGVzIGEgbWVjaGFuaXNtIGZvciBpbW1lZGlhdGVseSBzdWJtaXR0aW5nXG4gKiBhbiBIVE1MIGZvcm0gdXNpbmcgQUpBWC5cbiAqL1xuJC5mbi5hamF4U3VibWl0ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIC8qanNoaW50IHNjcmlwdHVybDp0cnVlICovXG5cbiAgICAvLyBmYXN0IGZhaWwgaWYgbm90aGluZyBzZWxlY3RlZCAoaHR0cDovL2Rldi5qcXVlcnkuY29tL3RpY2tldC8yNzUyKVxuICAgIGlmICghdGhpcy5sZW5ndGgpIHtcbiAgICAgICAgbG9nKCdhamF4U3VibWl0OiBza2lwcGluZyBzdWJtaXQgcHJvY2VzcyAtIG5vIGVsZW1lbnQgc2VsZWN0ZWQnKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIG1ldGhvZCwgYWN0aW9uLCB1cmwsICRmb3JtID0gdGhpcztcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7IHN1Y2Nlc3M6IG9wdGlvbnMgfTtcbiAgICB9XG4gICAgZWxzZSBpZiAoIG9wdGlvbnMgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cblxuICAgIG1ldGhvZCA9IG9wdGlvbnMudHlwZSB8fCB0aGlzLmF0dHIyKCdtZXRob2QnKTtcbiAgICBhY3Rpb24gPSBvcHRpb25zLnVybCAgfHwgdGhpcy5hdHRyMignYWN0aW9uJyk7XG5cbiAgICB1cmwgPSAodHlwZW9mIGFjdGlvbiA9PT0gJ3N0cmluZycpID8gJC50cmltKGFjdGlvbikgOiAnJztcbiAgICB1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLmhyZWYgfHwgJyc7XG4gICAgaWYgKHVybCkge1xuICAgICAgICAvLyBjbGVhbiB1cmwgKGRvbid0IGluY2x1ZGUgaGFzaCB2YXVlKVxuICAgICAgICB1cmwgPSAodXJsLm1hdGNoKC9eKFteI10rKS8pfHxbXSlbMV07XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcbiAgICAgICAgdXJsOiAgdXJsLFxuICAgICAgICBzdWNjZXNzOiAkLmFqYXhTZXR0aW5ncy5zdWNjZXNzLFxuICAgICAgICB0eXBlOiBtZXRob2QgfHwgJC5hamF4U2V0dGluZ3MudHlwZSxcbiAgICAgICAgaWZyYW1lU3JjOiAvXmh0dHBzL2kudGVzdCh3aW5kb3cubG9jYXRpb24uaHJlZiB8fCAnJykgPyAnamF2YXNjcmlwdDpmYWxzZScgOiAnYWJvdXQ6YmxhbmsnXG4gICAgfSwgb3B0aW9ucyk7XG5cbiAgICAvLyBob29rIGZvciBtYW5pcHVsYXRpbmcgdGhlIGZvcm0gZGF0YSBiZWZvcmUgaXQgaXMgZXh0cmFjdGVkO1xuICAgIC8vIGNvbnZlbmllbnQgZm9yIHVzZSB3aXRoIHJpY2ggZWRpdG9ycyBsaWtlIHRpbnlNQ0Ugb3IgRkNLRWRpdG9yXG4gICAgdmFyIHZldG8gPSB7fTtcbiAgICB0aGlzLnRyaWdnZXIoJ2Zvcm0tcHJlLXNlcmlhbGl6ZScsIFt0aGlzLCBvcHRpb25zLCB2ZXRvXSk7XG4gICAgaWYgKHZldG8udmV0bykge1xuICAgICAgICBsb2coJ2FqYXhTdWJtaXQ6IHN1Ym1pdCB2ZXRvZWQgdmlhIGZvcm0tcHJlLXNlcmlhbGl6ZSB0cmlnZ2VyJyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8vIHByb3ZpZGUgb3Bwb3J0dW5pdHkgdG8gYWx0ZXIgZm9ybSBkYXRhIGJlZm9yZSBpdCBpcyBzZXJpYWxpemVkXG4gICAgaWYgKG9wdGlvbnMuYmVmb3JlU2VyaWFsaXplICYmIG9wdGlvbnMuYmVmb3JlU2VyaWFsaXplKHRoaXMsIG9wdGlvbnMpID09PSBmYWxzZSkge1xuICAgICAgICBsb2coJ2FqYXhTdWJtaXQ6IHN1Ym1pdCBhYm9ydGVkIHZpYSBiZWZvcmVTZXJpYWxpemUgY2FsbGJhY2snKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIHRyYWRpdGlvbmFsID0gb3B0aW9ucy50cmFkaXRpb25hbDtcbiAgICBpZiAoIHRyYWRpdGlvbmFsID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgIHRyYWRpdGlvbmFsID0gJC5hamF4U2V0dGluZ3MudHJhZGl0aW9uYWw7XG4gICAgfVxuXG4gICAgdmFyIGVsZW1lbnRzID0gW107XG4gICAgdmFyIHF4LCBhID0gdGhpcy5mb3JtVG9BcnJheShvcHRpb25zLnNlbWFudGljLCBlbGVtZW50cyk7XG4gICAgaWYgKG9wdGlvbnMuZGF0YSkge1xuICAgICAgICBvcHRpb25zLmV4dHJhRGF0YSA9IG9wdGlvbnMuZGF0YTtcbiAgICAgICAgcXggPSAkLnBhcmFtKG9wdGlvbnMuZGF0YSwgdHJhZGl0aW9uYWwpO1xuICAgIH1cblxuICAgIC8vIGdpdmUgcHJlLXN1Ym1pdCBjYWxsYmFjayBhbiBvcHBvcnR1bml0eSB0byBhYm9ydCB0aGUgc3VibWl0XG4gICAgaWYgKG9wdGlvbnMuYmVmb3JlU3VibWl0ICYmIG9wdGlvbnMuYmVmb3JlU3VibWl0KGEsIHRoaXMsIG9wdGlvbnMpID09PSBmYWxzZSkge1xuICAgICAgICBsb2coJ2FqYXhTdWJtaXQ6IHN1Ym1pdCBhYm9ydGVkIHZpYSBiZWZvcmVTdWJtaXQgY2FsbGJhY2snKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLy8gZmlyZSB2ZXRvYWJsZSAndmFsaWRhdGUnIGV2ZW50XG4gICAgdGhpcy50cmlnZ2VyKCdmb3JtLXN1Ym1pdC12YWxpZGF0ZScsIFthLCB0aGlzLCBvcHRpb25zLCB2ZXRvXSk7XG4gICAgaWYgKHZldG8udmV0bykge1xuICAgICAgICBsb2coJ2FqYXhTdWJtaXQ6IHN1Ym1pdCB2ZXRvZWQgdmlhIGZvcm0tc3VibWl0LXZhbGlkYXRlIHRyaWdnZXInKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIHEgPSAkLnBhcmFtKGEsIHRyYWRpdGlvbmFsKTtcbiAgICBpZiAocXgpIHtcbiAgICAgICAgcSA9ICggcSA/IChxICsgJyYnICsgcXgpIDogcXggKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMudHlwZS50b1VwcGVyQ2FzZSgpID09ICdHRVQnKSB7XG4gICAgICAgIG9wdGlvbnMudXJsICs9IChvcHRpb25zLnVybC5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyBxO1xuICAgICAgICBvcHRpb25zLmRhdGEgPSBudWxsOyAgLy8gZGF0YSBpcyBudWxsIGZvciAnZ2V0J1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgb3B0aW9ucy5kYXRhID0gcTsgLy8gZGF0YSBpcyB0aGUgcXVlcnkgc3RyaW5nIGZvciAncG9zdCdcbiAgICB9XG5cbiAgICB2YXIgY2FsbGJhY2tzID0gW107XG4gICAgaWYgKG9wdGlvbnMucmVzZXRGb3JtKSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGZ1bmN0aW9uKCkgeyAkZm9ybS5yZXNldEZvcm0oKTsgfSk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLmNsZWFyRm9ybSkge1xuICAgICAgICBjYWxsYmFja3MucHVzaChmdW5jdGlvbigpIHsgJGZvcm0uY2xlYXJGb3JtKG9wdGlvbnMuaW5jbHVkZUhpZGRlbik7IH0pO1xuICAgIH1cblxuICAgIC8vIHBlcmZvcm0gYSBsb2FkIG9uIHRoZSB0YXJnZXQgb25seSBpZiBkYXRhVHlwZSBpcyBub3QgcHJvdmlkZWRcbiAgICBpZiAoIW9wdGlvbnMuZGF0YVR5cGUgJiYgb3B0aW9ucy50YXJnZXQpIHtcbiAgICAgICAgdmFyIG9sZFN1Y2Nlc3MgPSBvcHRpb25zLnN1Y2Nlc3MgfHwgZnVuY3Rpb24oKXt9O1xuICAgICAgICBjYWxsYmFja3MucHVzaChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB2YXIgZm4gPSBvcHRpb25zLnJlcGxhY2VUYXJnZXQgPyAncmVwbGFjZVdpdGgnIDogJ2h0bWwnO1xuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldClbZm5dKGRhdGEpLmVhY2gob2xkU3VjY2VzcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKG9wdGlvbnMuc3VjY2Vzcykge1xuICAgICAgICBjYWxsYmFja3MucHVzaChvcHRpb25zLnN1Y2Nlc3MpO1xuICAgIH1cblxuICAgIG9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uKGRhdGEsIHN0YXR1cywgeGhyKSB7IC8vIGpRdWVyeSAxLjQrIHBhc3NlcyB4aHIgYXMgM3JkIGFyZ1xuICAgICAgICB2YXIgY29udGV4dCA9IG9wdGlvbnMuY29udGV4dCB8fCB0aGlzIDsgICAgLy8galF1ZXJ5IDEuNCsgc3VwcG9ydHMgc2NvcGUgY29udGV4dFxuICAgICAgICBmb3IgKHZhciBpPTAsIG1heD1jYWxsYmFja3MubGVuZ3RoOyBpIDwgbWF4OyBpKyspIHtcbiAgICAgICAgICAgIGNhbGxiYWNrc1tpXS5hcHBseShjb250ZXh0LCBbZGF0YSwgc3RhdHVzLCB4aHIgfHwgJGZvcm0sICRmb3JtXSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKG9wdGlvbnMuZXJyb3IpIHtcbiAgICAgICAgdmFyIG9sZEVycm9yID0gb3B0aW9ucy5lcnJvcjtcbiAgICAgICAgb3B0aW9ucy5lcnJvciA9IGZ1bmN0aW9uKHhociwgc3RhdHVzLCBlcnJvcikge1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQgfHwgdGhpcztcbiAgICAgICAgICAgIG9sZEVycm9yLmFwcGx5KGNvbnRleHQsIFt4aHIsIHN0YXR1cywgZXJyb3IsICRmb3JtXSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgIGlmIChvcHRpb25zLmNvbXBsZXRlKSB7XG4gICAgICAgIHZhciBvbGRDb21wbGV0ZSA9IG9wdGlvbnMuY29tcGxldGU7XG4gICAgICAgIG9wdGlvbnMuY29tcGxldGUgPSBmdW5jdGlvbih4aHIsIHN0YXR1cykge1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQgfHwgdGhpcztcbiAgICAgICAgICAgIG9sZENvbXBsZXRlLmFwcGx5KGNvbnRleHQsIFt4aHIsIHN0YXR1cywgJGZvcm1dKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBhcmUgdGhlcmUgZmlsZXMgdG8gdXBsb2FkP1xuXG4gICAgLy8gW3ZhbHVlXSAoaXNzdWUgIzExMyksIGFsc28gc2VlIGNvbW1lbnQ6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21hbHN1cC9mb3JtL2NvbW1pdC81ODgzMDZhZWRiYTFkZTAxMzg4MDMyZDVmNDJhNjAxNTllZWE5MjI4I2NvbW1pdGNvbW1lbnQtMjE4MDIxOVxuICAgIHZhciBmaWxlSW5wdXRzID0gJCgnaW5wdXRbdHlwZT1maWxlXTplbmFibGVkJywgdGhpcykuZmlsdGVyKGZ1bmN0aW9uKCkgeyByZXR1cm4gJCh0aGlzKS52YWwoKSAhPT0gJyc7IH0pO1xuXG4gICAgdmFyIGhhc0ZpbGVJbnB1dHMgPSBmaWxlSW5wdXRzLmxlbmd0aCA+IDA7XG4gICAgdmFyIG1wID0gJ211bHRpcGFydC9mb3JtLWRhdGEnO1xuICAgIHZhciBtdWx0aXBhcnQgPSAoJGZvcm0uYXR0cignZW5jdHlwZScpID09IG1wIHx8ICRmb3JtLmF0dHIoJ2VuY29kaW5nJykgPT0gbXApO1xuXG4gICAgdmFyIGZpbGVBUEkgPSBmZWF0dXJlLmZpbGVhcGkgJiYgZmVhdHVyZS5mb3JtZGF0YTtcbiAgICBsb2coXCJmaWxlQVBJIDpcIiArIGZpbGVBUEkpO1xuICAgIHZhciBzaG91bGRVc2VGcmFtZSA9IChoYXNGaWxlSW5wdXRzIHx8IG11bHRpcGFydCkgJiYgIWZpbGVBUEk7XG5cbiAgICB2YXIganF4aHI7XG5cbiAgICAvLyBvcHRpb25zLmlmcmFtZSBhbGxvd3MgdXNlciB0byBmb3JjZSBpZnJhbWUgbW9kZVxuICAgIC8vIDA2LU5PVi0wOTogbm93IGRlZmF1bHRpbmcgdG8gaWZyYW1lIG1vZGUgaWYgZmlsZSBpbnB1dCBpcyBkZXRlY3RlZFxuICAgIGlmIChvcHRpb25zLmlmcmFtZSAhPT0gZmFsc2UgJiYgKG9wdGlvbnMuaWZyYW1lIHx8IHNob3VsZFVzZUZyYW1lKSkge1xuICAgICAgICAvLyBoYWNrIHRvIGZpeCBTYWZhcmkgaGFuZyAodGhhbmtzIHRvIFRpbSBNb2xlbmRpamsgZm9yIHRoaXMpXG4gICAgICAgIC8vIHNlZTogIGh0dHA6Ly9ncm91cHMuZ29vZ2xlLmNvbS9ncm91cC9qcXVlcnktZGV2L2Jyb3dzZV90aHJlYWQvdGhyZWFkLzM2Mzk1YjdhYjUxMGRkNWRcbiAgICAgICAgaWYgKG9wdGlvbnMuY2xvc2VLZWVwQWxpdmUpIHtcbiAgICAgICAgICAgICQuZ2V0KG9wdGlvbnMuY2xvc2VLZWVwQWxpdmUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGpxeGhyID0gZmlsZVVwbG9hZElmcmFtZShhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAganF4aHIgPSBmaWxlVXBsb2FkSWZyYW1lKGEpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKChoYXNGaWxlSW5wdXRzIHx8IG11bHRpcGFydCkgJiYgZmlsZUFQSSkge1xuICAgICAgICBqcXhociA9IGZpbGVVcGxvYWRYaHIoYSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBqcXhociA9ICQuYWpheChvcHRpb25zKTtcbiAgICB9XG5cbiAgICAkZm9ybS5yZW1vdmVEYXRhKCdqcXhocicpLmRhdGEoJ2pxeGhyJywganF4aHIpO1xuXG4gICAgLy8gY2xlYXIgZWxlbWVudCBhcnJheVxuICAgIGZvciAodmFyIGs9MDsgayA8IGVsZW1lbnRzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgIGVsZW1lbnRzW2tdID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBmaXJlICdub3RpZnknIGV2ZW50XG4gICAgdGhpcy50cmlnZ2VyKCdmb3JtLXN1Ym1pdC1ub3RpZnknLCBbdGhpcywgb3B0aW9uc10pO1xuICAgIHJldHVybiB0aGlzO1xuXG4gICAgLy8gdXRpbGl0eSBmbiBmb3IgZGVlcCBzZXJpYWxpemF0aW9uXG4gICAgZnVuY3Rpb24gZGVlcFNlcmlhbGl6ZShleHRyYURhdGEpe1xuICAgICAgICB2YXIgc2VyaWFsaXplZCA9ICQucGFyYW0oZXh0cmFEYXRhLCBvcHRpb25zLnRyYWRpdGlvbmFsKS5zcGxpdCgnJicpO1xuICAgICAgICB2YXIgbGVuID0gc2VyaWFsaXplZC5sZW5ndGg7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgdmFyIGksIHBhcnQ7XG4gICAgICAgIGZvciAoaT0wOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIC8vICMyNTI7IHVuZG8gcGFyYW0gc3BhY2UgcmVwbGFjZW1lbnRcbiAgICAgICAgICAgIHNlcmlhbGl6ZWRbaV0gPSBzZXJpYWxpemVkW2ldLnJlcGxhY2UoL1xcKy9nLCcgJyk7XG4gICAgICAgICAgICBwYXJ0ID0gc2VyaWFsaXplZFtpXS5zcGxpdCgnPScpO1xuICAgICAgICAgICAgLy8gIzI3ODsgdXNlIGFycmF5IGluc3RlYWQgb2Ygb2JqZWN0IHN0b3JhZ2UsIGZhdm9yaW5nIGFycmF5IHNlcmlhbGl6YXRpb25zXG4gICAgICAgICAgICByZXN1bHQucHVzaChbZGVjb2RlVVJJQ29tcG9uZW50KHBhcnRbMF0pLCBkZWNvZGVVUklDb21wb25lbnQocGFydFsxXSldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgICAvLyBYTUxIdHRwUmVxdWVzdCBMZXZlbCAyIGZpbGUgdXBsb2FkcyAoYmlnIGhhdCB0aXAgdG8gZnJhbmNvaXMybWV0eilcbiAgICBmdW5jdGlvbiBmaWxlVXBsb2FkWGhyKGEpIHtcbiAgICAgICAgdmFyIGZvcm1kYXRhID0gbmV3IEZvcm1EYXRhKCk7XG5cbiAgICAgICAgZm9yICh2YXIgaT0wOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZm9ybWRhdGEuYXBwZW5kKGFbaV0ubmFtZSwgYVtpXS52YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5leHRyYURhdGEpIHtcbiAgICAgICAgICAgIHZhciBzZXJpYWxpemVkRGF0YSA9IGRlZXBTZXJpYWxpemUob3B0aW9ucy5leHRyYURhdGEpO1xuICAgICAgICAgICAgZm9yIChpPTA7IGkgPCBzZXJpYWxpemVkRGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChzZXJpYWxpemVkRGF0YVtpXSkge1xuICAgICAgICAgICAgICAgICAgICBmb3JtZGF0YS5hcHBlbmQoc2VyaWFsaXplZERhdGFbaV1bMF0sIHNlcmlhbGl6ZWREYXRhW2ldWzFdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBvcHRpb25zLmRhdGEgPSBudWxsO1xuXG4gICAgICAgIHZhciBzID0gJC5leHRlbmQodHJ1ZSwge30sICQuYWpheFNldHRpbmdzLCBvcHRpb25zLCB7XG4gICAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICB0eXBlOiBtZXRob2QgfHwgJ1BPU1QnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChvcHRpb25zLnVwbG9hZFByb2dyZXNzKSB7XG4gICAgICAgICAgICAvLyB3b3JrYXJvdW5kIGJlY2F1c2UganFYSFIgZG9lcyBub3QgZXhwb3NlIHVwbG9hZCBwcm9wZXJ0eVxuICAgICAgICAgICAgcy54aHIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgeGhyID0gJC5hamF4U2V0dGluZ3MueGhyKCk7XG4gICAgICAgICAgICAgICAgaWYgKHhoci51cGxvYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgeGhyLnVwbG9hZC5hZGRFdmVudExpc3RlbmVyKCdwcm9ncmVzcycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGVyY2VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcG9zaXRpb24gPSBldmVudC5sb2FkZWQgfHwgZXZlbnQucG9zaXRpb247IC8qZXZlbnQucG9zaXRpb24gaXMgZGVwcmVjYXRlZCovXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG90YWwgPSBldmVudC50b3RhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVyY2VudCA9IE1hdGguY2VpbChwb3NpdGlvbiAvIHRvdGFsICogMTAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMudXBsb2FkUHJvZ3Jlc3MoZXZlbnQsIHBvc2l0aW9uLCB0b3RhbCwgcGVyY2VudCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhocjtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBzLmRhdGEgPSBudWxsO1xuICAgICAgICB2YXIgYmVmb3JlU2VuZCA9IHMuYmVmb3JlU2VuZDtcbiAgICAgICAgcy5iZWZvcmVTZW5kID0gZnVuY3Rpb24oeGhyLCBvKSB7XG4gICAgICAgICAgICAvL1NlbmQgRm9ybURhdGEoKSBwcm92aWRlZCBieSB1c2VyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5mb3JtRGF0YSkge1xuICAgICAgICAgICAgICAgIG8uZGF0YSA9IG9wdGlvbnMuZm9ybURhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBvLmRhdGEgPSBmb3JtZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGJlZm9yZVNlbmQpIHtcbiAgICAgICAgICAgICAgICBiZWZvcmVTZW5kLmNhbGwodGhpcywgeGhyLCBvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuICQuYWpheChzKTtcbiAgICB9XG5cbiAgICAvLyBwcml2YXRlIGZ1bmN0aW9uIGZvciBoYW5kbGluZyBmaWxlIHVwbG9hZHMgKGhhdCB0aXAgdG8gWUFIT08hKVxuICAgIGZ1bmN0aW9uIGZpbGVVcGxvYWRJZnJhbWUoYSkge1xuICAgICAgICB2YXIgZm9ybSA9ICRmb3JtWzBdLCBlbCwgaSwgcywgZywgaWQsICRpbywgaW8sIHhociwgc3ViLCBuLCB0aW1lZE91dCwgdGltZW91dEhhbmRsZTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgIC8vICMzNDFcbiAgICAgICAgZGVmZXJyZWQuYWJvcnQgPSBmdW5jdGlvbihzdGF0dXMpIHtcbiAgICAgICAgICAgIHhoci5hYm9ydChzdGF0dXMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChhKSB7XG4gICAgICAgICAgICAvLyBlbnN1cmUgdGhhdCBldmVyeSBzZXJpYWxpemVkIGlucHV0IGlzIHN0aWxsIGVuYWJsZWRcbiAgICAgICAgICAgIGZvciAoaT0wOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBlbCA9ICQoZWxlbWVudHNbaV0pO1xuICAgICAgICAgICAgICAgIGlmICggaGFzUHJvcCApIHtcbiAgICAgICAgICAgICAgICAgICAgZWwucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbC5yZW1vdmVBdHRyKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgJC5hamF4U2V0dGluZ3MsIG9wdGlvbnMpO1xuICAgICAgICBzLmNvbnRleHQgPSBzLmNvbnRleHQgfHwgcztcbiAgICAgICAgaWQgPSAnanFGb3JtSU8nICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpKTtcbiAgICAgICAgaWYgKHMuaWZyYW1lVGFyZ2V0KSB7XG4gICAgICAgICAgICAkaW8gPSAkKHMuaWZyYW1lVGFyZ2V0KTtcbiAgICAgICAgICAgIG4gPSAkaW8uYXR0cjIoJ25hbWUnKTtcbiAgICAgICAgICAgIGlmICghbikge1xuICAgICAgICAgICAgICAgICRpby5hdHRyMignbmFtZScsIGlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlkID0gbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICRpbyA9ICQoJzxpZnJhbWUgbmFtZT1cIicgKyBpZCArICdcIiBzcmM9XCInKyBzLmlmcmFtZVNyYyArJ1wiIC8+Jyk7XG4gICAgICAgICAgICAkaW8uY3NzKHsgcG9zaXRpb246ICdhYnNvbHV0ZScsIHRvcDogJy0xMDAwcHgnLCBsZWZ0OiAnLTEwMDBweCcgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaW8gPSAkaW9bMF07XG5cblxuICAgICAgICB4aHIgPSB7IC8vIG1vY2sgb2JqZWN0XG4gICAgICAgICAgICBhYm9ydGVkOiAwLFxuICAgICAgICAgICAgcmVzcG9uc2VUZXh0OiBudWxsLFxuICAgICAgICAgICAgcmVzcG9uc2VYTUw6IG51bGwsXG4gICAgICAgICAgICBzdGF0dXM6IDAsXG4gICAgICAgICAgICBzdGF0dXNUZXh0OiAnbi9hJyxcbiAgICAgICAgICAgIGdldEFsbFJlc3BvbnNlSGVhZGVyczogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgICAgIGdldFJlc3BvbnNlSGVhZGVyOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICAgICAgc2V0UmVxdWVzdEhlYWRlcjogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgICAgIGFib3J0OiBmdW5jdGlvbihzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IChzdGF0dXMgPT09ICd0aW1lb3V0JyA/ICd0aW1lb3V0JyA6ICdhYm9ydGVkJyk7XG4gICAgICAgICAgICAgICAgbG9nKCdhYm9ydGluZyB1cGxvYWQuLi4gJyArIGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWJvcnRlZCA9IDE7XG5cbiAgICAgICAgICAgICAgICB0cnkgeyAvLyAjMjE0LCAjMjU3XG4gICAgICAgICAgICAgICAgICAgIGlmIChpby5jb250ZW50V2luZG93LmRvY3VtZW50LmV4ZWNDb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpby5jb250ZW50V2luZG93LmRvY3VtZW50LmV4ZWNDb21tYW5kKCdTdG9wJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2goaWdub3JlKSB7fVxuXG4gICAgICAgICAgICAgICAgJGlvLmF0dHIoJ3NyYycsIHMuaWZyYW1lU3JjKTsgLy8gYWJvcnQgb3AgaW4gcHJvZ3Jlc3NcbiAgICAgICAgICAgICAgICB4aHIuZXJyb3IgPSBlO1xuICAgICAgICAgICAgICAgIGlmIChzLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHMuZXJyb3IuY2FsbChzLmNvbnRleHQsIHhociwgZSwgc3RhdHVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGcpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5ldmVudC50cmlnZ2VyKFwiYWpheEVycm9yXCIsIFt4aHIsIHMsIGVdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHMuY29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcy5jb21wbGV0ZS5jYWxsKHMuY29udGV4dCwgeGhyLCBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZyA9IHMuZ2xvYmFsO1xuICAgICAgICAvLyB0cmlnZ2VyIGFqYXggZ2xvYmFsIGV2ZW50cyBzbyB0aGF0IGFjdGl2aXR5L2Jsb2NrIGluZGljYXRvcnMgd29yayBsaWtlIG5vcm1hbFxuICAgICAgICBpZiAoZyAmJiAwID09PSAkLmFjdGl2ZSsrKSB7XG4gICAgICAgICAgICAkLmV2ZW50LnRyaWdnZXIoXCJhamF4U3RhcnRcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGcpIHtcbiAgICAgICAgICAgICQuZXZlbnQudHJpZ2dlcihcImFqYXhTZW5kXCIsIFt4aHIsIHNdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzLmJlZm9yZVNlbmQgJiYgcy5iZWZvcmVTZW5kLmNhbGwocy5jb250ZXh0LCB4aHIsIHMpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgaWYgKHMuZ2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgJC5hY3RpdmUtLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmICh4aHIuYWJvcnRlZCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KCk7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGQgc3VibWl0dGluZyBlbGVtZW50IHRvIGRhdGEgaWYgd2Uga25vdyBpdFxuICAgICAgICBzdWIgPSBmb3JtLmNsaztcbiAgICAgICAgaWYgKHN1Yikge1xuICAgICAgICAgICAgbiA9IHN1Yi5uYW1lO1xuICAgICAgICAgICAgaWYgKG4gJiYgIXN1Yi5kaXNhYmxlZCkge1xuICAgICAgICAgICAgICAgIHMuZXh0cmFEYXRhID0gcy5leHRyYURhdGEgfHwge307XG4gICAgICAgICAgICAgICAgcy5leHRyYURhdGFbbl0gPSBzdWIudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKHN1Yi50eXBlID09IFwiaW1hZ2VcIikge1xuICAgICAgICAgICAgICAgICAgICBzLmV4dHJhRGF0YVtuKycueCddID0gZm9ybS5jbGtfeDtcbiAgICAgICAgICAgICAgICAgICAgcy5leHRyYURhdGFbbisnLnknXSA9IGZvcm0uY2xrX3k7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIENMSUVOVF9USU1FT1VUX0FCT1JUID0gMTtcbiAgICAgICAgdmFyIFNFUlZFUl9BQk9SVCA9IDI7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGZ1bmN0aW9uIGdldERvYyhmcmFtZSkge1xuICAgICAgICAgICAgLyogaXQgbG9va3MgbGlrZSBjb250ZW50V2luZG93IG9yIGNvbnRlbnREb2N1bWVudCBkbyBub3RcbiAgICAgICAgICAgICAqIGNhcnJ5IHRoZSBwcm90b2NvbCBwcm9wZXJ0eSBpbiBpZTgsIHdoZW4gcnVubmluZyB1bmRlciBzc2xcbiAgICAgICAgICAgICAqIGZyYW1lLmRvY3VtZW50IGlzIHRoZSBvbmx5IHZhbGlkIHJlc3BvbnNlIGRvY3VtZW50LCBzaW5jZVxuICAgICAgICAgICAgICogdGhlIHByb3RvY29sIGlzIGtub3cgYnV0IG5vdCBvbiB0aGUgb3RoZXIgdHdvIG9iamVjdHMuIHN0cmFuZ2U/XG4gICAgICAgICAgICAgKiBcIlNhbWUgb3JpZ2luIHBvbGljeVwiIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvU2FtZV9vcmlnaW5fcG9saWN5XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGRvYyA9IG51bGw7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIElFOCBjYXNjYWRpbmcgYWNjZXNzIGNoZWNrXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChmcmFtZS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICAgICAgICAgIGRvYyA9IGZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgICAgICAvLyBJRTggYWNjZXNzIGRlbmllZCB1bmRlciBzc2wgJiBtaXNzaW5nIHByb3RvY29sXG4gICAgICAgICAgICAgICAgbG9nKCdjYW5ub3QgZ2V0IGlmcmFtZS5jb250ZW50V2luZG93IGRvY3VtZW50OiAnICsgZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRvYykgeyAvLyBzdWNjZXNzZnVsIGdldHRpbmcgY29udGVudFxuICAgICAgICAgICAgICAgIHJldHVybiBkb2M7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7IC8vIHNpbXBseSBjaGVja2luZyBtYXkgdGhyb3cgaW4gaWU4IHVuZGVyIHNzbCBvciBtaXNtYXRjaGVkIHByb3RvY29sXG4gICAgICAgICAgICAgICAgZG9jID0gZnJhbWUuY29udGVudERvY3VtZW50ID8gZnJhbWUuY29udGVudERvY3VtZW50IDogZnJhbWUuZG9jdW1lbnQ7XG4gICAgICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgICAgIC8vIGxhc3QgYXR0ZW1wdFxuICAgICAgICAgICAgICAgIGxvZygnY2Fubm90IGdldCBpZnJhbWUuY29udGVudERvY3VtZW50OiAnICsgZXJyKTtcbiAgICAgICAgICAgICAgICBkb2MgPSBmcmFtZS5kb2N1bWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkb2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSYWlscyBDU1JGIGhhY2sgKHRoYW5rcyB0byBZdmFuIEJhcnRoZWxlbXkpXG4gICAgICAgIHZhciBjc3JmX3Rva2VuID0gJCgnbWV0YVtuYW1lPWNzcmYtdG9rZW5dJykuYXR0cignY29udGVudCcpO1xuICAgICAgICB2YXIgY3NyZl9wYXJhbSA9ICQoJ21ldGFbbmFtZT1jc3JmLXBhcmFtXScpLmF0dHIoJ2NvbnRlbnQnKTtcbiAgICAgICAgaWYgKGNzcmZfcGFyYW0gJiYgY3NyZl90b2tlbikge1xuICAgICAgICAgICAgcy5leHRyYURhdGEgPSBzLmV4dHJhRGF0YSB8fCB7fTtcbiAgICAgICAgICAgIHMuZXh0cmFEYXRhW2NzcmZfcGFyYW1dID0gY3NyZl90b2tlbjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRha2UgYSBicmVhdGggc28gdGhhdCBwZW5kaW5nIHJlcGFpbnRzIGdldCBzb21lIGNwdSB0aW1lIGJlZm9yZSB0aGUgdXBsb2FkIHN0YXJ0c1xuICAgICAgICBmdW5jdGlvbiBkb1N1Ym1pdCgpIHtcbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSBmb3JtIGF0dHJzIGFyZSBzZXRcbiAgICAgICAgICAgIHZhciB0ID0gJGZvcm0uYXR0cjIoJ3RhcmdldCcpLCBcbiAgICAgICAgICAgICAgICBhID0gJGZvcm0uYXR0cjIoJ2FjdGlvbicpLCBcbiAgICAgICAgICAgICAgICBtcCA9ICdtdWx0aXBhcnQvZm9ybS1kYXRhJyxcbiAgICAgICAgICAgICAgICBldCA9ICRmb3JtLmF0dHIoJ2VuY3R5cGUnKSB8fCAkZm9ybS5hdHRyKCdlbmNvZGluZycpIHx8IG1wO1xuXG4gICAgICAgICAgICAvLyB1cGRhdGUgZm9ybSBhdHRycyBpbiBJRSBmcmllbmRseSB3YXlcbiAgICAgICAgICAgIGZvcm0uc2V0QXR0cmlidXRlKCd0YXJnZXQnLGlkKTtcbiAgICAgICAgICAgIGlmICghbWV0aG9kIHx8IC9wb3N0L2kudGVzdChtZXRob2QpICkge1xuICAgICAgICAgICAgICAgIGZvcm0uc2V0QXR0cmlidXRlKCdtZXRob2QnLCAnUE9TVCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGEgIT0gcy51cmwpIHtcbiAgICAgICAgICAgICAgICBmb3JtLnNldEF0dHJpYnV0ZSgnYWN0aW9uJywgcy51cmwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZSBib3JrcyBpbiBzb21lIGNhc2VzIHdoZW4gc2V0dGluZyBlbmNvZGluZ1xuICAgICAgICAgICAgaWYgKCEgcy5za2lwRW5jb2RpbmdPdmVycmlkZSAmJiAoIW1ldGhvZCB8fCAvcG9zdC9pLnRlc3QobWV0aG9kKSkpIHtcbiAgICAgICAgICAgICAgICAkZm9ybS5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgZW5jb2Rpbmc6ICdtdWx0aXBhcnQvZm9ybS1kYXRhJyxcbiAgICAgICAgICAgICAgICAgICAgZW5jdHlwZTogICdtdWx0aXBhcnQvZm9ybS1kYXRhJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzdXBwb3J0IHRpbW91dFxuICAgICAgICAgICAgaWYgKHMudGltZW91dCkge1xuICAgICAgICAgICAgICAgIHRpbWVvdXRIYW5kbGUgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB0aW1lZE91dCA9IHRydWU7IGNiKENMSUVOVF9USU1FT1VUX0FCT1JUKTsgfSwgcy50aW1lb3V0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gbG9vayBmb3Igc2VydmVyIGFib3J0c1xuICAgICAgICAgICAgZnVuY3Rpb24gY2hlY2tTdGF0ZSgpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhdGUgPSBnZXREb2MoaW8pLnJlYWR5U3RhdGU7XG4gICAgICAgICAgICAgICAgICAgIGxvZygnc3RhdGUgPSAnICsgc3RhdGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdGUgJiYgc3RhdGUudG9Mb3dlckNhc2UoKSA9PSAndW5pbml0aWFsaXplZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2tTdGF0ZSw1MCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgICBsb2coJ1NlcnZlciBhYm9ydDogJyAsIGUsICcgKCcsIGUubmFtZSwgJyknKTtcbiAgICAgICAgICAgICAgICAgICAgY2IoU0VSVkVSX0FCT1JUKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRpbWVvdXRIYW5kbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0SGFuZGxlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gYWRkIFwiZXh0cmFcIiBkYXRhIHRvIGZvcm0gaWYgcHJvdmlkZWQgaW4gb3B0aW9uc1xuICAgICAgICAgICAgdmFyIGV4dHJhSW5wdXRzID0gW107XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChzLmV4dHJhRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuIGluIHMuZXh0cmFEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocy5leHRyYURhdGEuaGFzT3duUHJvcGVydHkobikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHVzaW5nIHRoZSAkLnBhcmFtIGZvcm1hdCB0aGF0IGFsbG93cyBmb3IgbXVsdGlwbGUgdmFsdWVzIHdpdGggdGhlIHNhbWUgbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoJC5pc1BsYWluT2JqZWN0KHMuZXh0cmFEYXRhW25dKSAmJiBzLmV4dHJhRGF0YVtuXS5oYXNPd25Qcm9wZXJ0eSgnbmFtZScpICYmIHMuZXh0cmFEYXRhW25dLmhhc093blByb3BlcnR5KCd2YWx1ZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFJbnB1dHMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCInK3MuZXh0cmFEYXRhW25dLm5hbWUrJ1wiPicpLnZhbChzLmV4dHJhRGF0YVtuXS52YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZFRvKGZvcm0pWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFJbnB1dHMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCInK24rJ1wiPicpLnZhbChzLmV4dHJhRGF0YVtuXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZFRvKGZvcm0pWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghcy5pZnJhbWVUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWRkIGlmcmFtZSB0byBkb2MgYW5kIHN1Ym1pdCB0aGUgZm9ybVxuICAgICAgICAgICAgICAgICAgICAkaW8uYXBwZW5kVG8oJ2JvZHknKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGlvLmF0dGFjaEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlvLmF0dGFjaEV2ZW50KCdvbmxvYWQnLCBjYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpby5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgY2IsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChjaGVja1N0YXRlLDE1KTtcblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm0uc3VibWl0KCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8ganVzdCBpbiBjYXNlIGZvcm0gaGFzIGVsZW1lbnQgd2l0aCBuYW1lL2lkIG9mICdzdWJtaXQnXG4gICAgICAgICAgICAgICAgICAgIHZhciBzdWJtaXRGbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvcm0nKS5zdWJtaXQ7XG4gICAgICAgICAgICAgICAgICAgIHN1Ym1pdEZuLmFwcGx5KGZvcm0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIC8vIHJlc2V0IGF0dHJzIGFuZCByZW1vdmUgXCJleHRyYVwiIGlucHV0IGVsZW1lbnRzXG4gICAgICAgICAgICAgICAgZm9ybS5zZXRBdHRyaWJ1dGUoJ2FjdGlvbicsYSk7XG4gICAgICAgICAgICAgICAgZm9ybS5zZXRBdHRyaWJ1dGUoJ2VuY3R5cGUnLCBldCk7IC8vICMzODBcbiAgICAgICAgICAgICAgICBpZih0KSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm0uc2V0QXR0cmlidXRlKCd0YXJnZXQnLCB0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkZm9ybS5yZW1vdmVBdHRyKCd0YXJnZXQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJChleHRyYUlucHV0cykucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocy5mb3JjZVN5bmMpIHtcbiAgICAgICAgICAgIGRvU3VibWl0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGRvU3VibWl0LCAxMCk7IC8vIHRoaXMgbGV0cyBkb20gdXBkYXRlcyByZW5kZXJcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkYXRhLCBkb2MsIGRvbUNoZWNrQ291bnQgPSA1MCwgY2FsbGJhY2tQcm9jZXNzZWQ7XG5cbiAgICAgICAgZnVuY3Rpb24gY2IoZSkge1xuICAgICAgICAgICAgaWYgKHhoci5hYm9ydGVkIHx8IGNhbGxiYWNrUHJvY2Vzc2VkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBkb2MgPSBnZXREb2MoaW8pO1xuICAgICAgICAgICAgaWYoIWRvYykge1xuICAgICAgICAgICAgICAgIGxvZygnY2Fubm90IGFjY2VzcyByZXNwb25zZSBkb2N1bWVudCcpO1xuICAgICAgICAgICAgICAgIGUgPSBTRVJWRVJfQUJPUlQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZSA9PT0gQ0xJRU5UX1RJTUVPVVRfQUJPUlQgJiYgeGhyKSB7XG4gICAgICAgICAgICAgICAgeGhyLmFib3J0KCd0aW1lb3V0Jyk7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHhociwgJ3RpbWVvdXQnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChlID09IFNFUlZFUl9BQk9SVCAmJiB4aHIpIHtcbiAgICAgICAgICAgICAgICB4aHIuYWJvcnQoJ3NlcnZlciBhYm9ydCcpO1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCh4aHIsICdlcnJvcicsICdzZXJ2ZXIgYWJvcnQnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZG9jIHx8IGRvYy5sb2NhdGlvbi5ocmVmID09IHMuaWZyYW1lU3JjKSB7XG4gICAgICAgICAgICAgICAgLy8gcmVzcG9uc2Ugbm90IHJlY2VpdmVkIHlldFxuICAgICAgICAgICAgICAgIGlmICghdGltZWRPdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpby5kZXRhY2hFdmVudCkge1xuICAgICAgICAgICAgICAgIGlvLmRldGFjaEV2ZW50KCdvbmxvYWQnLCBjYik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpby5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2FkJywgY2IsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHN0YXR1cyA9ICdzdWNjZXNzJywgZXJyTXNnO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodGltZWRPdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ3RpbWVvdXQnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBpc1htbCA9IHMuZGF0YVR5cGUgPT0gJ3htbCcgfHwgZG9jLlhNTERvY3VtZW50IHx8ICQuaXNYTUxEb2MoZG9jKTtcbiAgICAgICAgICAgICAgICBsb2coJ2lzWG1sPScraXNYbWwpO1xuICAgICAgICAgICAgICAgIGlmICghaXNYbWwgJiYgd2luZG93Lm9wZXJhICYmIChkb2MuYm9keSA9PT0gbnVsbCB8fCAhZG9jLmJvZHkuaW5uZXJIVE1MKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoLS1kb21DaGVja0NvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbiBzb21lIGJyb3dzZXJzIChPcGVyYSkgdGhlIGlmcmFtZSBET00gaXMgbm90IGFsd2F5cyB0cmF2ZXJzYWJsZSB3aGVuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgb25sb2FkIGNhbGxiYWNrIGZpcmVzLCBzbyB3ZSBsb29wIGEgYml0IHRvIGFjY29tbW9kYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2coJ3JlcXVlaW5nIG9uTG9hZCBjYWxsYmFjaywgRE9NIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2IsIDI1MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gbGV0IHRoaXMgZmFsbCB0aHJvdWdoIGJlY2F1c2Ugc2VydmVyIHJlc3BvbnNlIGNvdWxkIGJlIGFuIGVtcHR5IGRvY3VtZW50XG4gICAgICAgICAgICAgICAgICAgIC8vbG9nKCdDb3VsZCBub3QgYWNjZXNzIGlmcmFtZSBET00gYWZ0ZXIgbXV0aXBsZSB0cmllcy4nKTtcbiAgICAgICAgICAgICAgICAgICAgLy90aHJvdyAnRE9NRXhjZXB0aW9uOiBub3QgYXZhaWxhYmxlJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvL2xvZygncmVzcG9uc2UgZGV0ZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICB2YXIgZG9jUm9vdCA9IGRvYy5ib2R5ID8gZG9jLmJvZHkgOiBkb2MuZG9jdW1lbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgIHhoci5yZXNwb25zZVRleHQgPSBkb2NSb290ID8gZG9jUm9vdC5pbm5lckhUTUwgOiBudWxsO1xuICAgICAgICAgICAgICAgIHhoci5yZXNwb25zZVhNTCA9IGRvYy5YTUxEb2N1bWVudCA/IGRvYy5YTUxEb2N1bWVudCA6IGRvYztcbiAgICAgICAgICAgICAgICBpZiAoaXNYbWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcy5kYXRhVHlwZSA9ICd4bWwnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIgPSBmdW5jdGlvbihoZWFkZXIpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgaGVhZGVycyA9IHsnY29udGVudC10eXBlJzogcy5kYXRhVHlwZX07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoZWFkZXJzW2hlYWRlci50b0xvd2VyQ2FzZSgpXTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8vIHN1cHBvcnQgZm9yIFhIUiAnc3RhdHVzJyAmICdzdGF0dXNUZXh0JyBlbXVsYXRpb24gOlxuICAgICAgICAgICAgICAgIGlmIChkb2NSb290KSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5zdGF0dXMgPSBOdW1iZXIoIGRvY1Jvb3QuZ2V0QXR0cmlidXRlKCdzdGF0dXMnKSApIHx8IHhoci5zdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgIHhoci5zdGF0dXNUZXh0ID0gZG9jUm9vdC5nZXRBdHRyaWJ1dGUoJ3N0YXR1c1RleHQnKSB8fCB4aHIuc3RhdHVzVGV4dDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgZHQgPSAocy5kYXRhVHlwZSB8fCAnJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB2YXIgc2NyID0gLyhqc29ufHNjcmlwdHx0ZXh0KS8udGVzdChkdCk7XG4gICAgICAgICAgICAgICAgaWYgKHNjciB8fCBzLnRleHRhcmVhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNlZSBpZiB1c2VyIGVtYmVkZGVkIHJlc3BvbnNlIGluIHRleHRhcmVhXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YSA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGV4dGFyZWEnKVswXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4aHIucmVzcG9uc2VUZXh0ID0gdGEudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzdXBwb3J0IGZvciBYSFIgJ3N0YXR1cycgJiAnc3RhdHVzVGV4dCcgZW11bGF0aW9uIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHhoci5zdGF0dXMgPSBOdW1iZXIoIHRhLmdldEF0dHJpYnV0ZSgnc3RhdHVzJykgKSB8fCB4aHIuc3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgeGhyLnN0YXR1c1RleHQgPSB0YS5nZXRBdHRyaWJ1dGUoJ3N0YXR1c1RleHQnKSB8fCB4aHIuc3RhdHVzVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzY3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFjY291bnQgZm9yIGJyb3dzZXJzIGluamVjdGluZyBwcmUgYXJvdW5kIGpzb24gcmVzcG9uc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmUgPSBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3ByZScpWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGIgPSBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4aHIucmVzcG9uc2VUZXh0ID0gcHJlLnRleHRDb250ZW50ID8gcHJlLnRleHRDb250ZW50IDogcHJlLmlubmVyVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4aHIucmVzcG9uc2VUZXh0ID0gYi50ZXh0Q29udGVudCA/IGIudGV4dENvbnRlbnQgOiBiLmlubmVyVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkdCA9PSAneG1sJyAmJiAheGhyLnJlc3BvbnNlWE1MICYmIHhoci5yZXNwb25zZVRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgeGhyLnJlc3BvbnNlWE1MID0gdG9YbWwoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IGh0dHBEYXRhKHhociwgZHQsIHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cyA9ICdwYXJzZXJlcnJvcic7XG4gICAgICAgICAgICAgICAgICAgIHhoci5lcnJvciA9IGVyck1zZyA9IChlcnIgfHwgc3RhdHVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbG9nKCdlcnJvciBjYXVnaHQ6ICcsZXJyKTtcbiAgICAgICAgICAgICAgICBzdGF0dXMgPSAnZXJyb3InO1xuICAgICAgICAgICAgICAgIHhoci5lcnJvciA9IGVyck1zZyA9IChlcnIgfHwgc3RhdHVzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHhoci5hYm9ydGVkKSB7XG4gICAgICAgICAgICAgICAgbG9nKCd1cGxvYWQgYWJvcnRlZCcpO1xuICAgICAgICAgICAgICAgIHN0YXR1cyA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzKSB7IC8vIHdlJ3ZlIHNldCB4aHIuc3RhdHVzXG4gICAgICAgICAgICAgICAgc3RhdHVzID0gKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDAgfHwgeGhyLnN0YXR1cyA9PT0gMzA0KSA/ICdzdWNjZXNzJyA6ICdlcnJvcic7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIG9yZGVyaW5nIG9mIHRoZXNlIGNhbGxiYWNrcy90cmlnZ2VycyBpcyBvZGQsIGJ1dCB0aGF0J3MgaG93ICQuYWpheCBkb2VzIGl0XG4gICAgICAgICAgICBpZiAoc3RhdHVzID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgICAgICBpZiAocy5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHMuc3VjY2Vzcy5jYWxsKHMuY29udGV4dCwgZGF0YSwgJ3N1Y2Nlc3MnLCB4aHIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHhoci5yZXNwb25zZVRleHQsICdzdWNjZXNzJywgeGhyKTtcbiAgICAgICAgICAgICAgICBpZiAoZykge1xuICAgICAgICAgICAgICAgICAgICAkLmV2ZW50LnRyaWdnZXIoXCJhamF4U3VjY2Vzc1wiLCBbeGhyLCBzXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyck1zZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGVyck1zZyA9IHhoci5zdGF0dXNUZXh0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocy5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBzLmVycm9yLmNhbGwocy5jb250ZXh0LCB4aHIsIHN0YXR1cywgZXJyTXNnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHhociwgJ2Vycm9yJywgZXJyTXNnKTtcbiAgICAgICAgICAgICAgICBpZiAoZykge1xuICAgICAgICAgICAgICAgICAgICAkLmV2ZW50LnRyaWdnZXIoXCJhamF4RXJyb3JcIiwgW3hociwgcywgZXJyTXNnXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZykge1xuICAgICAgICAgICAgICAgICQuZXZlbnQudHJpZ2dlcihcImFqYXhDb21wbGV0ZVwiLCBbeGhyLCBzXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChnICYmICEgLS0kLmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICQuZXZlbnQudHJpZ2dlcihcImFqYXhTdG9wXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocy5jb21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIHMuY29tcGxldGUuY2FsbChzLmNvbnRleHQsIHhociwgc3RhdHVzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FsbGJhY2tQcm9jZXNzZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHMudGltZW91dCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SGFuZGxlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY2xlYW4gdXBcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzLmlmcmFtZVRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICAkaW8ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgeyAvL2FkZGluZyBlbHNlIHRvIGNsZWFuIHVwIGV4aXN0aW5nIGlmcmFtZSByZXNwb25zZS5cbiAgICAgICAgICAgICAgICAgICAgJGlvLmF0dHIoJ3NyYycsIHMuaWZyYW1lU3JjKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgeGhyLnJlc3BvbnNlWE1MID0gbnVsbDtcbiAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG9YbWwgPSAkLnBhcnNlWE1MIHx8IGZ1bmN0aW9uKHMsIGRvYykgeyAvLyB1c2UgcGFyc2VYTUwgaWYgYXZhaWxhYmxlIChqUXVlcnkgMS41KylcbiAgICAgICAgICAgIGlmICh3aW5kb3cuQWN0aXZlWE9iamVjdCkge1xuICAgICAgICAgICAgICAgIGRvYyA9IG5ldyBBY3RpdmVYT2JqZWN0KCdNaWNyb3NvZnQuWE1MRE9NJyk7XG4gICAgICAgICAgICAgICAgZG9jLmFzeW5jID0gJ2ZhbHNlJztcbiAgICAgICAgICAgICAgICBkb2MubG9hZFhNTChzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhzLCAndGV4dC94bWwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAoZG9jICYmIGRvYy5kb2N1bWVudEVsZW1lbnQgJiYgZG9jLmRvY3VtZW50RWxlbWVudC5ub2RlTmFtZSAhPSAncGFyc2VyZXJyb3InKSA/IGRvYyA6IG51bGw7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYXJzZUpTT04gPSAkLnBhcnNlSlNPTiB8fCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICAvKmpzbGludCBldmlsOnRydWUgKi9cbiAgICAgICAgICAgIHJldHVybiB3aW5kb3dbJ2V2YWwnXSgnKCcgKyBzICsgJyknKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaHR0cERhdGEgPSBmdW5jdGlvbiggeGhyLCB0eXBlLCBzICkgeyAvLyBtb3N0bHkgbGlmdGVkIGZyb20ganExLjQuNFxuXG4gICAgICAgICAgICB2YXIgY3QgPSB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ2NvbnRlbnQtdHlwZScpIHx8ICcnLFxuICAgICAgICAgICAgICAgIHhtbCA9IHR5cGUgPT09ICd4bWwnIHx8ICF0eXBlICYmIGN0LmluZGV4T2YoJ3htbCcpID49IDAsXG4gICAgICAgICAgICAgICAgZGF0YSA9IHhtbCA/IHhoci5yZXNwb25zZVhNTCA6IHhoci5yZXNwb25zZVRleHQ7XG5cbiAgICAgICAgICAgIGlmICh4bWwgJiYgZGF0YS5kb2N1bWVudEVsZW1lbnQubm9kZU5hbWUgPT09ICdwYXJzZXJlcnJvcicpIHtcbiAgICAgICAgICAgICAgICBpZiAoJC5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAkLmVycm9yKCdwYXJzZXJlcnJvcicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzICYmIHMuZGF0YUZpbHRlcikge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBzLmRhdGFGaWx0ZXIoZGF0YSwgdHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdqc29uJyB8fCAhdHlwZSAmJiBjdC5pbmRleE9mKCdqc29uJykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhID0gcGFyc2VKU09OKGRhdGEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJzY3JpcHRcIiB8fCAhdHlwZSAmJiBjdC5pbmRleE9mKFwiamF2YXNjcmlwdFwiKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICQuZ2xvYmFsRXZhbChkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gZGVmZXJyZWQ7XG4gICAgfVxufTtcblxuLyoqXG4gKiBhamF4Rm9ybSgpIHByb3ZpZGVzIGEgbWVjaGFuaXNtIGZvciBmdWxseSBhdXRvbWF0aW5nIGZvcm0gc3VibWlzc2lvbi5cbiAqXG4gKiBUaGUgYWR2YW50YWdlcyBvZiB1c2luZyB0aGlzIG1ldGhvZCBpbnN0ZWFkIG9mIGFqYXhTdWJtaXQoKSBhcmU6XG4gKlxuICogMTogVGhpcyBtZXRob2Qgd2lsbCBpbmNsdWRlIGNvb3JkaW5hdGVzIGZvciA8aW5wdXQgdHlwZT1cImltYWdlXCIgLz4gZWxlbWVudHMgKGlmIHRoZSBlbGVtZW50XG4gKiAgICBpcyB1c2VkIHRvIHN1Ym1pdCB0aGUgZm9ybSkuXG4gKiAyLiBUaGlzIG1ldGhvZCB3aWxsIGluY2x1ZGUgdGhlIHN1Ym1pdCBlbGVtZW50J3MgbmFtZS92YWx1ZSBkYXRhIChmb3IgdGhlIGVsZW1lbnQgdGhhdCB3YXNcbiAqICAgIHVzZWQgdG8gc3VibWl0IHRoZSBmb3JtKS5cbiAqIDMuIFRoaXMgbWV0aG9kIGJpbmRzIHRoZSBzdWJtaXQoKSBtZXRob2QgdG8gdGhlIGZvcm0gZm9yIHlvdS5cbiAqXG4gKiBUaGUgb3B0aW9ucyBhcmd1bWVudCBmb3IgYWpheEZvcm0gd29ya3MgZXhhY3RseSBhcyBpdCBkb2VzIGZvciBhamF4U3VibWl0LiAgYWpheEZvcm0gbWVyZWx5XG4gKiBwYXNzZXMgdGhlIG9wdGlvbnMgYXJndW1lbnQgYWxvbmcgYWZ0ZXIgcHJvcGVybHkgYmluZGluZyBldmVudHMgZm9yIHN1Ym1pdCBlbGVtZW50cyBhbmRcbiAqIHRoZSBmb3JtIGl0c2VsZi5cbiAqL1xuJC5mbi5hamF4Rm9ybSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zLmRlbGVnYXRpb24gPSBvcHRpb25zLmRlbGVnYXRpb24gJiYgJC5pc0Z1bmN0aW9uKCQuZm4ub24pO1xuXG4gICAgLy8gaW4galF1ZXJ5IDEuMysgd2UgY2FuIGZpeCBtaXN0YWtlcyB3aXRoIHRoZSByZWFkeSBzdGF0ZVxuICAgIGlmICghb3B0aW9ucy5kZWxlZ2F0aW9uICYmIHRoaXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHZhciBvID0geyBzOiB0aGlzLnNlbGVjdG9yLCBjOiB0aGlzLmNvbnRleHQgfTtcbiAgICAgICAgaWYgKCEkLmlzUmVhZHkgJiYgby5zKSB7XG4gICAgICAgICAgICBsb2coJ0RPTSBub3QgcmVhZHksIHF1ZXVpbmcgYWpheEZvcm0nKTtcbiAgICAgICAgICAgICQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJChvLnMsby5jKS5hamF4Rm9ybShvcHRpb25zKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaXMgeW91ciBET00gcmVhZHk/ICBodHRwOi8vZG9jcy5qcXVlcnkuY29tL1R1dG9yaWFsczpJbnRyb2R1Y2luZ18kKGRvY3VtZW50KS5yZWFkeSgpXG4gICAgICAgIGxvZygndGVybWluYXRpbmc7IHplcm8gZWxlbWVudHMgZm91bmQgYnkgc2VsZWN0b3InICsgKCQuaXNSZWFkeSA/ICcnIDogJyAoRE9NIG5vdCByZWFkeSknKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmICggb3B0aW9ucy5kZWxlZ2F0aW9uICkge1xuICAgICAgICAkKGRvY3VtZW50KVxuICAgICAgICAgICAgLm9mZignc3VibWl0LmZvcm0tcGx1Z2luJywgdGhpcy5zZWxlY3RvciwgZG9BamF4U3VibWl0KVxuICAgICAgICAgICAgLm9mZignY2xpY2suZm9ybS1wbHVnaW4nLCB0aGlzLnNlbGVjdG9yLCBjYXB0dXJlU3VibWl0dGluZ0VsZW1lbnQpXG4gICAgICAgICAgICAub24oJ3N1Ym1pdC5mb3JtLXBsdWdpbicsIHRoaXMuc2VsZWN0b3IsIG9wdGlvbnMsIGRvQWpheFN1Ym1pdClcbiAgICAgICAgICAgIC5vbignY2xpY2suZm9ybS1wbHVnaW4nLCB0aGlzLnNlbGVjdG9yLCBvcHRpb25zLCBjYXB0dXJlU3VibWl0dGluZ0VsZW1lbnQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5hamF4Rm9ybVVuYmluZCgpXG4gICAgICAgIC5iaW5kKCdzdWJtaXQuZm9ybS1wbHVnaW4nLCBvcHRpb25zLCBkb0FqYXhTdWJtaXQpXG4gICAgICAgIC5iaW5kKCdjbGljay5mb3JtLXBsdWdpbicsIG9wdGlvbnMsIGNhcHR1cmVTdWJtaXR0aW5nRWxlbWVudCk7XG59O1xuXG4vLyBwcml2YXRlIGV2ZW50IGhhbmRsZXJzXG5mdW5jdGlvbiBkb0FqYXhTdWJtaXQoZSkge1xuICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgdmFyIG9wdGlvbnMgPSBlLmRhdGE7XG4gICAgaWYgKCFlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSB7IC8vIGlmIGV2ZW50IGhhcyBiZWVuIGNhbmNlbGVkLCBkb24ndCBwcm9jZWVkXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgJChlLnRhcmdldCkuYWpheFN1Ym1pdChvcHRpb25zKTsgLy8gIzM2NVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY2FwdHVyZVN1Ym1pdHRpbmdFbGVtZW50KGUpIHtcbiAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICB2YXIgJGVsID0gJCh0YXJnZXQpO1xuICAgIGlmICghKCRlbC5pcyhcIlt0eXBlPXN1Ym1pdF0sW3R5cGU9aW1hZ2VdXCIpKSkge1xuICAgICAgICAvLyBpcyB0aGlzIGEgY2hpbGQgZWxlbWVudCBvZiB0aGUgc3VibWl0IGVsPyAgKGV4OiBhIHNwYW4gd2l0aGluIGEgYnV0dG9uKVxuICAgICAgICB2YXIgdCA9ICRlbC5jbG9zZXN0KCdbdHlwZT1zdWJtaXRdJyk7XG4gICAgICAgIGlmICh0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldCA9IHRbMF07XG4gICAgfVxuICAgIHZhciBmb3JtID0gdGhpcztcbiAgICBmb3JtLmNsayA9IHRhcmdldDtcbiAgICBpZiAodGFyZ2V0LnR5cGUgPT0gJ2ltYWdlJykge1xuICAgICAgICBpZiAoZS5vZmZzZXRYICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGZvcm0uY2xrX3ggPSBlLm9mZnNldFg7XG4gICAgICAgICAgICBmb3JtLmNsa195ID0gZS5vZmZzZXRZO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAkLmZuLm9mZnNldCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJGVsLm9mZnNldCgpO1xuICAgICAgICAgICAgZm9ybS5jbGtfeCA9IGUucGFnZVggLSBvZmZzZXQubGVmdDtcbiAgICAgICAgICAgIGZvcm0uY2xrX3kgPSBlLnBhZ2VZIC0gb2Zmc2V0LnRvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcm0uY2xrX3ggPSBlLnBhZ2VYIC0gdGFyZ2V0Lm9mZnNldExlZnQ7XG4gICAgICAgICAgICBmb3JtLmNsa195ID0gZS5wYWdlWSAtIHRhcmdldC5vZmZzZXRUb3A7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gY2xlYXIgZm9ybSB2YXJzXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgZm9ybS5jbGsgPSBmb3JtLmNsa194ID0gZm9ybS5jbGtfeSA9IG51bGw7IH0sIDEwMCk7XG59XG5cblxuLy8gYWpheEZvcm1VbmJpbmQgdW5iaW5kcyB0aGUgZXZlbnQgaGFuZGxlcnMgdGhhdCB3ZXJlIGJvdW5kIGJ5IGFqYXhGb3JtXG4kLmZuLmFqYXhGb3JtVW5iaW5kID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMudW5iaW5kKCdzdWJtaXQuZm9ybS1wbHVnaW4gY2xpY2suZm9ybS1wbHVnaW4nKTtcbn07XG5cbi8qKlxuICogZm9ybVRvQXJyYXkoKSBnYXRoZXJzIGZvcm0gZWxlbWVudCBkYXRhIGludG8gYW4gYXJyYXkgb2Ygb2JqZWN0cyB0aGF0IGNhblxuICogYmUgcGFzc2VkIHRvIGFueSBvZiB0aGUgZm9sbG93aW5nIGFqYXggZnVuY3Rpb25zOiAkLmdldCwgJC5wb3N0LCBvciBsb2FkLlxuICogRWFjaCBvYmplY3QgaW4gdGhlIGFycmF5IGhhcyBib3RoIGEgJ25hbWUnIGFuZCAndmFsdWUnIHByb3BlcnR5LiAgQW4gZXhhbXBsZSBvZlxuICogYW4gYXJyYXkgZm9yIGEgc2ltcGxlIGxvZ2luIGZvcm0gbWlnaHQgYmU6XG4gKlxuICogWyB7IG5hbWU6ICd1c2VybmFtZScsIHZhbHVlOiAnanJlc2lnJyB9LCB7IG5hbWU6ICdwYXNzd29yZCcsIHZhbHVlOiAnc2VjcmV0JyB9IF1cbiAqXG4gKiBJdCBpcyB0aGlzIGFycmF5IHRoYXQgaXMgcGFzc2VkIHRvIHByZS1zdWJtaXQgY2FsbGJhY2sgZnVuY3Rpb25zIHByb3ZpZGVkIHRvIHRoZVxuICogYWpheFN1Ym1pdCgpIGFuZCBhamF4Rm9ybSgpIG1ldGhvZHMuXG4gKi9cbiQuZm4uZm9ybVRvQXJyYXkgPSBmdW5jdGlvbihzZW1hbnRpYywgZWxlbWVudHMpIHtcbiAgICB2YXIgYSA9IFtdO1xuICAgIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG5cbiAgICB2YXIgZm9ybSA9IHRoaXNbMF07XG4gICAgdmFyIGZvcm1JZCA9IHRoaXMuYXR0cignaWQnKTtcbiAgICB2YXIgZWxzID0gc2VtYW50aWMgPyBmb3JtLmdldEVsZW1lbnRzQnlUYWdOYW1lKCcqJykgOiBmb3JtLmVsZW1lbnRzO1xuICAgIHZhciBlbHMyO1xuXG4gICAgaWYgKGVscyAmJiAhL01TSUUgWzY3OF0vLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHsgLy8gIzM5MFxuICAgICAgICBlbHMgPSAkKGVscykuZ2V0KCk7ICAvLyBjb252ZXJ0IHRvIHN0YW5kYXJkIGFycmF5XG4gICAgfVxuXG4gICAgLy8gIzM4NjsgYWNjb3VudCBmb3IgaW5wdXRzIG91dHNpZGUgdGhlIGZvcm0gd2hpY2ggdXNlIHRoZSAnZm9ybScgYXR0cmlidXRlXG4gICAgaWYgKCBmb3JtSWQgKSB7XG4gICAgICAgIGVsczIgPSAkKCc6aW5wdXRbZm9ybT1cIicgKyBmb3JtSWQgKyAnXCJdJykuZ2V0KCk7IC8vIGhhdCB0aXAgQHRoZXRcbiAgICAgICAgaWYgKCBlbHMyLmxlbmd0aCApIHtcbiAgICAgICAgICAgIGVscyA9IChlbHMgfHwgW10pLmNvbmNhdChlbHMyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghZWxzIHx8ICFlbHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cblxuICAgIHZhciBpLGosbix2LGVsLG1heCxqbWF4O1xuICAgIGZvcihpPTAsIG1heD1lbHMubGVuZ3RoOyBpIDwgbWF4OyBpKyspIHtcbiAgICAgICAgZWwgPSBlbHNbaV07XG4gICAgICAgIG4gPSBlbC5uYW1lO1xuICAgICAgICBpZiAoIW4gfHwgZWwuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNlbWFudGljICYmIGZvcm0uY2xrICYmIGVsLnR5cGUgPT0gXCJpbWFnZVwiKSB7XG4gICAgICAgICAgICAvLyBoYW5kbGUgaW1hZ2UgaW5wdXRzIG9uIHRoZSBmbHkgd2hlbiBzZW1hbnRpYyA9PSB0cnVlXG4gICAgICAgICAgICBpZihmb3JtLmNsayA9PSBlbCkge1xuICAgICAgICAgICAgICAgIGEucHVzaCh7bmFtZTogbiwgdmFsdWU6ICQoZWwpLnZhbCgpLCB0eXBlOiBlbC50eXBlIH0pO1xuICAgICAgICAgICAgICAgIGEucHVzaCh7bmFtZTogbisnLngnLCB2YWx1ZTogZm9ybS5jbGtfeH0sIHtuYW1lOiBuKycueScsIHZhbHVlOiBmb3JtLmNsa195fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHYgPSAkLmZpZWxkVmFsdWUoZWwsIHRydWUpO1xuICAgICAgICBpZiAodiAmJiB2LmNvbnN0cnVjdG9yID09IEFycmF5KSB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudHMpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvcihqPTAsIGptYXg9di5sZW5ndGg7IGogPCBqbWF4OyBqKyspIHtcbiAgICAgICAgICAgICAgICBhLnB1c2goe25hbWU6IG4sIHZhbHVlOiB2W2pdfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZmVhdHVyZS5maWxlYXBpICYmIGVsLnR5cGUgPT0gJ2ZpbGUnKSB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudHMpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBmaWxlcyA9IGVsLmZpbGVzO1xuICAgICAgICAgICAgaWYgKGZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvciAoaj0wOyBqIDwgZmlsZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYS5wdXNoKHtuYW1lOiBuLCB2YWx1ZTogZmlsZXNbal0sIHR5cGU6IGVsLnR5cGV9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyAjMTgwXG4gICAgICAgICAgICAgICAgYS5wdXNoKHsgbmFtZTogbiwgdmFsdWU6ICcnLCB0eXBlOiBlbC50eXBlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHYgIT09IG51bGwgJiYgdHlwZW9mIHYgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmIChlbGVtZW50cykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnRzLnB1c2goZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYS5wdXNoKHtuYW1lOiBuLCB2YWx1ZTogdiwgdHlwZTogZWwudHlwZSwgcmVxdWlyZWQ6IGVsLnJlcXVpcmVkfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXNlbWFudGljICYmIGZvcm0uY2xrKSB7XG4gICAgICAgIC8vIGlucHV0IHR5cGU9PSdpbWFnZScgYXJlIG5vdCBmb3VuZCBpbiBlbGVtZW50cyBhcnJheSEgaGFuZGxlIGl0IGhlcmVcbiAgICAgICAgdmFyICRpbnB1dCA9ICQoZm9ybS5jbGspLCBpbnB1dCA9ICRpbnB1dFswXTtcbiAgICAgICAgbiA9IGlucHV0Lm5hbWU7XG4gICAgICAgIGlmIChuICYmICFpbnB1dC5kaXNhYmxlZCAmJiBpbnB1dC50eXBlID09ICdpbWFnZScpIHtcbiAgICAgICAgICAgIGEucHVzaCh7bmFtZTogbiwgdmFsdWU6ICRpbnB1dC52YWwoKX0pO1xuICAgICAgICAgICAgYS5wdXNoKHtuYW1lOiBuKycueCcsIHZhbHVlOiBmb3JtLmNsa194fSwge25hbWU6IG4rJy55JywgdmFsdWU6IGZvcm0uY2xrX3l9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYTtcbn07XG5cbi8qKlxuICogU2VyaWFsaXplcyBmb3JtIGRhdGEgaW50byBhICdzdWJtaXR0YWJsZScgc3RyaW5nLiBUaGlzIG1ldGhvZCB3aWxsIHJldHVybiBhIHN0cmluZ1xuICogaW4gdGhlIGZvcm1hdDogbmFtZTE9dmFsdWUxJmFtcDtuYW1lMj12YWx1ZTJcbiAqL1xuJC5mbi5mb3JtU2VyaWFsaXplID0gZnVuY3Rpb24oc2VtYW50aWMpIHtcbiAgICAvL2hhbmQgb2ZmIHRvIGpRdWVyeS5wYXJhbSBmb3IgcHJvcGVyIGVuY29kaW5nXG4gICAgcmV0dXJuICQucGFyYW0odGhpcy5mb3JtVG9BcnJheShzZW1hbnRpYykpO1xufTtcblxuLyoqXG4gKiBTZXJpYWxpemVzIGFsbCBmaWVsZCBlbGVtZW50cyBpbiB0aGUgalF1ZXJ5IG9iamVjdCBpbnRvIGEgcXVlcnkgc3RyaW5nLlxuICogVGhpcyBtZXRob2Qgd2lsbCByZXR1cm4gYSBzdHJpbmcgaW4gdGhlIGZvcm1hdDogbmFtZTE9dmFsdWUxJmFtcDtuYW1lMj12YWx1ZTJcbiAqL1xuJC5mbi5maWVsZFNlcmlhbGl6ZSA9IGZ1bmN0aW9uKHN1Y2Nlc3NmdWwpIHtcbiAgICB2YXIgYSA9IFtdO1xuICAgIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG4gPSB0aGlzLm5hbWU7XG4gICAgICAgIGlmICghbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciB2ID0gJC5maWVsZFZhbHVlKHRoaXMsIHN1Y2Nlc3NmdWwpO1xuICAgICAgICBpZiAodiAmJiB2LmNvbnN0cnVjdG9yID09IEFycmF5KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpPTAsbWF4PXYubGVuZ3RoOyBpIDwgbWF4OyBpKyspIHtcbiAgICAgICAgICAgICAgICBhLnB1c2goe25hbWU6IG4sIHZhbHVlOiB2W2ldfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodiAhPT0gbnVsbCAmJiB0eXBlb2YgdiAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgYS5wdXNoKHtuYW1lOiB0aGlzLm5hbWUsIHZhbHVlOiB2fSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAvL2hhbmQgb2ZmIHRvIGpRdWVyeS5wYXJhbSBmb3IgcHJvcGVyIGVuY29kaW5nXG4gICAgcmV0dXJuICQucGFyYW0oYSk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIHZhbHVlKHMpIG9mIHRoZSBlbGVtZW50IGluIHRoZSBtYXRjaGVkIHNldC4gIEZvciBleGFtcGxlLCBjb25zaWRlciB0aGUgZm9sbG93aW5nIGZvcm06XG4gKlxuICogIDxmb3JtPjxmaWVsZHNldD5cbiAqICAgICAgPGlucHV0IG5hbWU9XCJBXCIgdHlwZT1cInRleHRcIiAvPlxuICogICAgICA8aW5wdXQgbmFtZT1cIkFcIiB0eXBlPVwidGV4dFwiIC8+XG4gKiAgICAgIDxpbnB1dCBuYW1lPVwiQlwiIHR5cGU9XCJjaGVja2JveFwiIHZhbHVlPVwiQjFcIiAvPlxuICogICAgICA8aW5wdXQgbmFtZT1cIkJcIiB0eXBlPVwiY2hlY2tib3hcIiB2YWx1ZT1cIkIyXCIvPlxuICogICAgICA8aW5wdXQgbmFtZT1cIkNcIiB0eXBlPVwicmFkaW9cIiB2YWx1ZT1cIkMxXCIgLz5cbiAqICAgICAgPGlucHV0IG5hbWU9XCJDXCIgdHlwZT1cInJhZGlvXCIgdmFsdWU9XCJDMlwiIC8+XG4gKiAgPC9maWVsZHNldD48L2Zvcm0+XG4gKlxuICogIHZhciB2ID0gJCgnaW5wdXRbdHlwZT10ZXh0XScpLmZpZWxkVmFsdWUoKTtcbiAqICAvLyBpZiBubyB2YWx1ZXMgYXJlIGVudGVyZWQgaW50byB0aGUgdGV4dCBpbnB1dHNcbiAqICB2ID09IFsnJywnJ11cbiAqICAvLyBpZiB2YWx1ZXMgZW50ZXJlZCBpbnRvIHRoZSB0ZXh0IGlucHV0cyBhcmUgJ2ZvbycgYW5kICdiYXInXG4gKiAgdiA9PSBbJ2ZvbycsJ2JhciddXG4gKlxuICogIHZhciB2ID0gJCgnaW5wdXRbdHlwZT1jaGVja2JveF0nKS5maWVsZFZhbHVlKCk7XG4gKiAgLy8gaWYgbmVpdGhlciBjaGVja2JveCBpcyBjaGVja2VkXG4gKiAgdiA9PT0gdW5kZWZpbmVkXG4gKiAgLy8gaWYgYm90aCBjaGVja2JveGVzIGFyZSBjaGVja2VkXG4gKiAgdiA9PSBbJ0IxJywgJ0IyJ11cbiAqXG4gKiAgdmFyIHYgPSAkKCdpbnB1dFt0eXBlPXJhZGlvXScpLmZpZWxkVmFsdWUoKTtcbiAqICAvLyBpZiBuZWl0aGVyIHJhZGlvIGlzIGNoZWNrZWRcbiAqICB2ID09PSB1bmRlZmluZWRcbiAqICAvLyBpZiBmaXJzdCByYWRpbyBpcyBjaGVja2VkXG4gKiAgdiA9PSBbJ0MxJ11cbiAqXG4gKiBUaGUgc3VjY2Vzc2Z1bCBhcmd1bWVudCBjb250cm9scyB3aGV0aGVyIG9yIG5vdCB0aGUgZmllbGQgZWxlbWVudCBtdXN0IGJlICdzdWNjZXNzZnVsJ1xuICogKHBlciBodHRwOi8vd3d3LnczLm9yZy9UUi9odG1sNC9pbnRlcmFjdC9mb3Jtcy5odG1sI3N1Y2Nlc3NmdWwtY29udHJvbHMpLlxuICogVGhlIGRlZmF1bHQgdmFsdWUgb2YgdGhlIHN1Y2Nlc3NmdWwgYXJndW1lbnQgaXMgdHJ1ZS4gIElmIHRoaXMgdmFsdWUgaXMgZmFsc2UgdGhlIHZhbHVlKHMpXG4gKiBmb3IgZWFjaCBlbGVtZW50IGlzIHJldHVybmVkLlxuICpcbiAqIE5vdGU6IFRoaXMgbWV0aG9kICphbHdheXMqIHJldHVybnMgYW4gYXJyYXkuICBJZiBubyB2YWxpZCB2YWx1ZSBjYW4gYmUgZGV0ZXJtaW5lZCB0aGVcbiAqICAgIGFycmF5IHdpbGwgYmUgZW1wdHksIG90aGVyd2lzZSBpdCB3aWxsIGNvbnRhaW4gb25lIG9yIG1vcmUgdmFsdWVzLlxuICovXG4kLmZuLmZpZWxkVmFsdWUgPSBmdW5jdGlvbihzdWNjZXNzZnVsKSB7XG4gICAgZm9yICh2YXIgdmFsPVtdLCBpPTAsIG1heD10aGlzLmxlbmd0aDsgaSA8IG1heDsgaSsrKSB7XG4gICAgICAgIHZhciBlbCA9IHRoaXNbaV07XG4gICAgICAgIHZhciB2ID0gJC5maWVsZFZhbHVlKGVsLCBzdWNjZXNzZnVsKTtcbiAgICAgICAgaWYgKHYgPT09IG51bGwgfHwgdHlwZW9mIHYgPT0gJ3VuZGVmaW5lZCcgfHwgKHYuY29uc3RydWN0b3IgPT0gQXJyYXkgJiYgIXYubGVuZ3RoKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHYuY29uc3RydWN0b3IgPT0gQXJyYXkpIHtcbiAgICAgICAgICAgICQubWVyZ2UodmFsLCB2KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhbC5wdXNoKHYpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWw7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIHZhbHVlIG9mIHRoZSBmaWVsZCBlbGVtZW50LlxuICovXG4kLmZpZWxkVmFsdWUgPSBmdW5jdGlvbihlbCwgc3VjY2Vzc2Z1bCkge1xuICAgIHZhciBuID0gZWwubmFtZSwgdCA9IGVsLnR5cGUsIHRhZyA9IGVsLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoc3VjY2Vzc2Z1bCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHN1Y2Nlc3NmdWwgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChzdWNjZXNzZnVsICYmICghbiB8fCBlbC5kaXNhYmxlZCB8fCB0ID09ICdyZXNldCcgfHwgdCA9PSAnYnV0dG9uJyB8fFxuICAgICAgICAodCA9PSAnY2hlY2tib3gnIHx8IHQgPT0gJ3JhZGlvJykgJiYgIWVsLmNoZWNrZWQgfHxcbiAgICAgICAgKHQgPT0gJ3N1Ym1pdCcgfHwgdCA9PSAnaW1hZ2UnKSAmJiBlbC5mb3JtICYmIGVsLmZvcm0uY2xrICE9IGVsIHx8XG4gICAgICAgIHRhZyA9PSAnc2VsZWN0JyAmJiBlbC5zZWxlY3RlZEluZGV4ID09IC0xKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHRhZyA9PSAnc2VsZWN0Jykge1xuICAgICAgICB2YXIgaW5kZXggPSBlbC5zZWxlY3RlZEluZGV4O1xuICAgICAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYSA9IFtdLCBvcHMgPSBlbC5vcHRpb25zO1xuICAgICAgICB2YXIgb25lID0gKHQgPT0gJ3NlbGVjdC1vbmUnKTtcbiAgICAgICAgdmFyIG1heCA9IChvbmUgPyBpbmRleCsxIDogb3BzLmxlbmd0aCk7XG4gICAgICAgIGZvcih2YXIgaT0ob25lID8gaW5kZXggOiAwKTsgaSA8IG1heDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgb3AgPSBvcHNbaV07XG4gICAgICAgICAgICBpZiAob3Auc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IG9wLnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmICghdikgeyAvLyBleHRyYSBwYWluIGZvciBJRS4uLlxuICAgICAgICAgICAgICAgICAgICB2ID0gKG9wLmF0dHJpYnV0ZXMgJiYgb3AuYXR0cmlidXRlcy52YWx1ZSAmJiAhKG9wLmF0dHJpYnV0ZXMudmFsdWUuc3BlY2lmaWVkKSkgPyBvcC50ZXh0IDogb3AudmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGEucHVzaCh2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG4gICAgcmV0dXJuICQoZWwpLnZhbCgpO1xufTtcblxuLyoqXG4gKiBDbGVhcnMgdGhlIGZvcm0gZGF0YS4gIFRha2VzIHRoZSBmb2xsb3dpbmcgYWN0aW9ucyBvbiB0aGUgZm9ybSdzIGlucHV0IGZpZWxkczpcbiAqICAtIGlucHV0IHRleHQgZmllbGRzIHdpbGwgaGF2ZSB0aGVpciAndmFsdWUnIHByb3BlcnR5IHNldCB0byB0aGUgZW1wdHkgc3RyaW5nXG4gKiAgLSBzZWxlY3QgZWxlbWVudHMgd2lsbCBoYXZlIHRoZWlyICdzZWxlY3RlZEluZGV4JyBwcm9wZXJ0eSBzZXQgdG8gLTFcbiAqICAtIGNoZWNrYm94IGFuZCByYWRpbyBpbnB1dHMgd2lsbCBoYXZlIHRoZWlyICdjaGVja2VkJyBwcm9wZXJ0eSBzZXQgdG8gZmFsc2VcbiAqICAtIGlucHV0cyBvZiB0eXBlIHN1Ym1pdCwgYnV0dG9uLCByZXNldCwgYW5kIGhpZGRlbiB3aWxsICpub3QqIGJlIGVmZmVjdGVkXG4gKiAgLSBidXR0b24gZWxlbWVudHMgd2lsbCAqbm90KiBiZSBlZmZlY3RlZFxuICovXG4kLmZuLmNsZWFyRm9ybSA9IGZ1bmN0aW9uKGluY2x1ZGVIaWRkZW4pIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCdpbnB1dCxzZWxlY3QsdGV4dGFyZWEnLCB0aGlzKS5jbGVhckZpZWxkcyhpbmNsdWRlSGlkZGVuKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQ2xlYXJzIHRoZSBzZWxlY3RlZCBmb3JtIGVsZW1lbnRzLlxuICovXG4kLmZuLmNsZWFyRmllbGRzID0gJC5mbi5jbGVhcklucHV0cyA9IGZ1bmN0aW9uKGluY2x1ZGVIaWRkZW4pIHtcbiAgICB2YXIgcmUgPSAvXig/OmNvbG9yfGRhdGV8ZGF0ZXRpbWV8ZW1haWx8bW9udGh8bnVtYmVyfHBhc3N3b3JkfHJhbmdlfHNlYXJjaHx0ZWx8dGV4dHx0aW1lfHVybHx3ZWVrKSQvaTsgLy8gJ2hpZGRlbicgaXMgbm90IGluIHRoaXMgbGlzdFxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0ID0gdGhpcy50eXBlLCB0YWcgPSB0aGlzLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKHJlLnRlc3QodCkgfHwgdGFnID09ICd0ZXh0YXJlYScpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSAnJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0ID09ICdjaGVja2JveCcgfHwgdCA9PSAncmFkaW8nKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0YWcgPT0gJ3NlbGVjdCcpIHtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IC0xO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHQgPT0gXCJmaWxlXCIpIHtcbiAgICAgICAgICAgIGlmICgvTVNJRS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgICAgICAgICAgICAgICQodGhpcykucmVwbGFjZVdpdGgoJCh0aGlzKS5jbG9uZSh0cnVlKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQodGhpcykudmFsKCcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpbmNsdWRlSGlkZGVuKSB7XG4gICAgICAgICAgICAvLyBpbmNsdWRlSGlkZGVuIGNhbiBiZSB0aGUgdmFsdWUgdHJ1ZSwgb3IgaXQgY2FuIGJlIGEgc2VsZWN0b3Igc3RyaW5nXG4gICAgICAgICAgICAvLyBpbmRpY2F0aW5nIGEgc3BlY2lhbCB0ZXN0OyBmb3IgZXhhbXBsZTpcbiAgICAgICAgICAgIC8vICAkKCcjbXlGb3JtJykuY2xlYXJGb3JtKCcuc3BlY2lhbDpoaWRkZW4nKVxuICAgICAgICAgICAgLy8gdGhlIGFib3ZlIHdvdWxkIGNsZWFuIGhpZGRlbiBpbnB1dHMgdGhhdCBoYXZlIHRoZSBjbGFzcyBvZiAnc3BlY2lhbCdcbiAgICAgICAgICAgIGlmICggKGluY2x1ZGVIaWRkZW4gPT09IHRydWUgJiYgL2hpZGRlbi8udGVzdCh0KSkgfHxcbiAgICAgICAgICAgICAgICAgKHR5cGVvZiBpbmNsdWRlSGlkZGVuID09ICdzdHJpbmcnICYmICQodGhpcykuaXMoaW5jbHVkZUhpZGRlbikpICkge1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZXNldHMgdGhlIGZvcm0gZGF0YS4gIENhdXNlcyBhbGwgZm9ybSBlbGVtZW50cyB0byBiZSByZXNldCB0byB0aGVpciBvcmlnaW5hbCB2YWx1ZS5cbiAqL1xuJC5mbi5yZXNldEZvcm0gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBndWFyZCBhZ2FpbnN0IGFuIGlucHV0IHdpdGggdGhlIG5hbWUgb2YgJ3Jlc2V0J1xuICAgICAgICAvLyBub3RlIHRoYXQgSUUgcmVwb3J0cyB0aGUgcmVzZXQgZnVuY3Rpb24gYXMgYW4gJ29iamVjdCdcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnJlc2V0ID09ICdmdW5jdGlvbicgfHwgKHR5cGVvZiB0aGlzLnJlc2V0ID09ICdvYmplY3QnICYmICF0aGlzLnJlc2V0Lm5vZGVUeXBlKSkge1xuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIEVuYWJsZXMgb3IgZGlzYWJsZXMgYW55IG1hdGNoaW5nIGVsZW1lbnRzLlxuICovXG4kLmZuLmVuYWJsZSA9IGZ1bmN0aW9uKGIpIHtcbiAgICBpZiAoYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGIgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmRpc2FibGVkID0gIWI7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIENoZWNrcy91bmNoZWNrcyBhbnkgbWF0Y2hpbmcgY2hlY2tib3hlcyBvciByYWRpbyBidXR0b25zIGFuZFxuICogc2VsZWN0cy9kZXNlbGVjdHMgYW5kIG1hdGNoaW5nIG9wdGlvbiBlbGVtZW50cy5cbiAqL1xuJC5mbi5zZWxlY3RlZCA9IGZ1bmN0aW9uKHNlbGVjdCkge1xuICAgIGlmIChzZWxlY3QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzZWxlY3QgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdCA9IHRoaXMudHlwZTtcbiAgICAgICAgaWYgKHQgPT0gJ2NoZWNrYm94JyB8fCB0ID09ICdyYWRpbycpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tlZCA9IHNlbGVjdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSAnb3B0aW9uJykge1xuICAgICAgICAgICAgdmFyICRzZWwgPSAkKHRoaXMpLnBhcmVudCgnc2VsZWN0Jyk7XG4gICAgICAgICAgICBpZiAoc2VsZWN0ICYmICRzZWxbMF0gJiYgJHNlbFswXS50eXBlID09ICdzZWxlY3Qtb25lJykge1xuICAgICAgICAgICAgICAgIC8vIGRlc2VsZWN0IGFsbCBvdGhlciBvcHRpb25zXG4gICAgICAgICAgICAgICAgJHNlbC5maW5kKCdvcHRpb24nKS5zZWxlY3RlZChmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gc2VsZWN0O1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vLyBleHBvc2UgZGVidWcgdmFyXG4kLmZuLmFqYXhTdWJtaXQuZGVidWcgPSBmYWxzZTtcblxuLy8gaGVscGVyIGZuIGZvciBjb25zb2xlIGxvZ2dpbmdcbmZ1bmN0aW9uIGxvZygpIHtcbiAgICBpZiAoISQuZm4uYWpheFN1Ym1pdC5kZWJ1Zykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBtc2cgPSAnW2pxdWVyeS5mb3JtXSAnICsgQXJyYXkucHJvdG90eXBlLmpvaW4uY2FsbChhcmd1bWVudHMsJycpO1xuICAgIGlmICh3aW5kb3cuY29uc29sZSAmJiB3aW5kb3cuY29uc29sZS5sb2cpIHtcbiAgICAgICAgd2luZG93LmNvbnNvbGUubG9nKG1zZyk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHdpbmRvdy5vcGVyYSAmJiB3aW5kb3cub3BlcmEucG9zdEVycm9yKSB7XG4gICAgICAgIHdpbmRvdy5vcGVyYS5wb3N0RXJyb3IobXNnKTtcbiAgICB9XG59XG5cbn0pKTtcbiIsIi8qKlxuICogW2pRdWVyeS1sYXp5bG9hZC1hbnlde0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9lbW4xNzgvanF1ZXJ5LWxhenlsb2FkLWFueX1cbiAqXG4gKiBAdmVyc2lvbiAwLjMuMFxuICogQGF1dGhvciBZaS1DeXVhbiBDaGVuIFtlbW4xNzhAZ21haWwuY29tXVxuICogQGNvcHlyaWdodCBZaS1DeXVhbiBDaGVuIDIwMTQtMjAxNlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cbihmdW5jdGlvbihkLGssbCl7ZnVuY3Rpb24gbSgpe3ZhciBhPWQodGhpcyksYztpZihjPWEuaXMoXCI6dmlzaWJsZVwiKSl7Yz1hWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO3ZhciBiPS1hLmRhdGEoXCJqcXVlcnktbGF6eWxvYWQtYW55XCIpLnRocmVzaG9sZCxlPW4tYixmPXAtYjtjPShjLnRvcD49YiYmYy50b3A8PWV8fGMuYm90dG9tPj1iJiZjLmJvdHRvbTw9ZSkmJihjLmxlZnQ+PWImJmMubGVmdDw9Znx8Yy5yaWdodD49YiYmYy5yaWdodDw9Zil9YyYmYS50cmlnZ2VyKFwiYXBwZWFyXCIpfWZ1bmN0aW9uIHEoKXtuPWsuaW5uZXJIZWlnaHR8fGwuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtwPWsuaW5uZXJXaWR0aHx8bC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7ZygpfWZ1bmN0aW9uIGcoKXtoPWguZmlsdGVyKFwiOmpxdWVyeS1sYXp5bG9hZC1hbnktYXBwZWFyXCIpOzE9PXRoaXMubm9kZVR5cGU/ZCh0aGlzKS5maW5kKFwiOmpxdWVyeS1sYXp5bG9hZC1hbnktYXBwZWFyXCIpLmVhY2gobSk6XG5oLmVhY2gobSl9ZnVuY3Rpb24gdigpe3ZhciBhPWQodGhpcyksYz1hLmRhdGEoXCJqcXVlcnktbGF6eWxvYWQtYW55XCIpLGI9YS5kYXRhKFwibGF6eWxvYWRcIik7Ynx8KGI9YS5jaGlsZHJlbigpLmZpbHRlcignc2NyaXB0W3R5cGU9XCJ0ZXh0L2xhenlsb2FkXCJdJykuZ2V0KDApLGI9ZChiKS5odG1sKCkpO2J8fChiPShiPWEuY29udGVudHMoKS5maWx0ZXIoZnVuY3Rpb24oKXtyZXR1cm4gOD09PXRoaXMubm9kZVR5cGV9KS5nZXQoMCkpJiZkLnRyaW0oYi5kYXRhKSk7Yj13Lmh0bWwoYikuY29udGVudHMoKTthLnJlcGxhY2VXaXRoKGIpO2QuaXNGdW5jdGlvbihjLmxvYWQpJiZjLmxvYWQuY2FsbChiLGIpfWZ1bmN0aW9uIHIoKXt2YXIgYT1kKHRoaXMpLGM7YS5kYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueS1zY3JvbGxlclwiKT9jPSExOihjPWEuY3NzKFwib3ZlcmZsb3dcIiksXCJzY3JvbGxcIiE9YyYmXCJhdXRvXCIhPWM/Yz0hMTooYS5kYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueS1zY3JvbGxlclwiLFxuMSksYS5iaW5kKFwic2Nyb2xsXCIsZyksYz0hMCkpO3ZhciBiO2EuZGF0YShcImpxdWVyeS1sYXp5bG9hZC1hbnktZGlzcGxheVwiKT9iPXZvaWQgMDpcIm5vbmVcIiE9YS5jc3MoXCJkaXNwbGF5XCIpP2I9dm9pZCAwOihhLmRhdGEoXCJqcXVlcnktbGF6eWxvYWQtYW55LWRpc3BsYXlcIiwxKSxhLl9iaW5kU2hvdyhnKSxiPSEwKTtjfGImJiFhLmRhdGEoXCJqcXVlcnktbGF6eWxvYWQtYW55LXdhdGNoXCIpJiYoYS5kYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueS13YXRjaFwiLDEpLGEuYmluZChcImFwcGVhclwiLHQpKX1mdW5jdGlvbiB0KCl7dmFyIGE9ZCh0aGlzKTswPT09YS5maW5kKFwiOmpxdWVyeS1sYXp5bG9hZC1hbnktYXBwZWFyXCIpLmxlbmd0aCYmKGEucmVtb3ZlRGF0YShcImpxdWVyeS1sYXp5bG9hZC1hbnktc2Nyb2xsZXJcIikucmVtb3ZlRGF0YShcImpxdWVyeS1sYXp5bG9hZC1hbnktZGlzcGxheVwiKS5yZW1vdmVEYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueS13YXRjaFwiKSxhLnVuYmluZChcInNjcm9sbFwiLFxuZykudW5iaW5kKFwiYXBwZWFyXCIsdCkuX3VuYmluZFNob3coZykpfXZhciB3PWQoXCI8ZGl2Lz5cIiksbixwLHU9ITEsaD1kKCk7ZC5leHByW1wiOlwiXVtcImpxdWVyeS1sYXp5bG9hZC1hbnktYXBwZWFyXCJdPWZ1bmN0aW9uKGEpe3JldHVybiB2b2lkIDAhPT1kKGEpLmRhdGEoXCJqcXVlcnktbGF6eWxvYWQtYW55LWFwcGVhclwiKX07ZC5mbi5sYXp5bG9hZD1mdW5jdGlvbihhKXt2YXIgYz17dGhyZXNob2xkOjAsdHJpZ2dlcjpcImFwcGVhclwifTtkLmV4dGVuZChjLGEpO2E9Yy50cmlnZ2VyLnNwbGl0KFwiIFwiKTt0aGlzLmRhdGEoXCJqcXVlcnktbGF6eWxvYWQtYW55LWFwcGVhclwiLC0xIT1kLmluQXJyYXkoXCJhcHBlYXJcIixhKSkuZGF0YShcImpxdWVyeS1sYXp5bG9hZC1hbnlcIixjKTt0aGlzLmJpbmQoYy50cmlnZ2VyLHYpO3RoaXMuZWFjaChtKTt0aGlzLnBhcmVudHMoKS5lYWNoKHIpO3RoaXMuZWFjaChmdW5jdGlvbigpe2g9aC5hZGQodGhpcyl9KTt1fHwodT0hMCxxKCksZChsKS5yZWFkeShmdW5jdGlvbigpe2QoaykuYmluZChcInJlc2l6ZVwiLFxucSkuYmluZChcInNjcm9sbFwiLGcpfSkpO3JldHVybiB0aGlzfTtkLmxhenlsb2FkPXtjaGVjazpnLHJlZnJlc2g6ZnVuY3Rpb24oYSl7KHZvaWQgMD09PWE/aDpkKGEpKS5lYWNoKGZ1bmN0aW9uKCl7dmFyIGE9ZCh0aGlzKTthLmlzKFwiOmpxdWVyeS1sYXp5bG9hZC1hbnktYXBwZWFyXCIpJiZhLnBhcmVudHMoKS5lYWNoKHIpfSl9fTsoZnVuY3Rpb24oKXtmdW5jdGlvbiBhKCl7dmFyIGE9ZCh0aGlzKSxiPVwibm9uZVwiIT1hLmNzcyhcImRpc3BsYXlcIik7YS5kYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueS1zaG93XCIpIT1iJiYoYS5kYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueS1zaG93XCIsYiksYiYmYS50cmlnZ2VyKFwic2hvd1wiKSl9ZnVuY3Rpb24gYygpe2Y9Zi5maWx0ZXIoXCI6anF1ZXJ5LWxhenlsb2FkLWFueS1zaG93XCIpO2YuZWFjaChhKTswPT09Zi5sZW5ndGgmJihlPWNsZWFySW50ZXJ2YWwoZSkpfXZhciBiPTUwLGUsZj1kKCk7ZC5leHByW1wiOlwiXVtcImpxdWVyeS1sYXp5bG9hZC1hbnktc2hvd1wiXT1cbmZ1bmN0aW9uKGEpe3JldHVybiB2b2lkIDAhPT1kKGEpLmRhdGEoXCJqcXVlcnktbGF6eWxvYWQtYW55LXNob3dcIil9O2QuZm4uX2JpbmRTaG93PWZ1bmN0aW9uKGEpe3RoaXMuYmluZChcInNob3dcIixhKTt0aGlzLmRhdGEoXCJqcXVlcnktbGF6eWxvYWQtYW55LXNob3dcIixcIm5vbmVcIiE9dGhpcy5jc3MoXCJkaXNwbGF5XCIpKTtmPWYuYWRkKHRoaXMpO2ImJiFlJiYoZT1zZXRJbnRlcnZhbChjLGIpKX07ZC5mbi5fdW5iaW5kU2hvdz1mdW5jdGlvbihhKXt0aGlzLnVuYmluZChcInNob3dcIixhKTt0aGlzLnJlbW92ZURhdGEoXCJqcXVlcnktbGF6eWxvYWQtYW55LXNob3dcIil9O2QubGF6eWxvYWQuc2V0SW50ZXJ2YWw9ZnVuY3Rpb24oYSl7YT09Ynx8IWQuaXNOdW1lcmljKGEpfHwwPmF8fChiPWEsZT1jbGVhckludGVydmFsKGUpLDA8YiYmKGU9c2V0SW50ZXJ2YWwoYyxiKSkpfX0pKCl9KShqUXVlcnksd2luZG93LGRvY3VtZW50KTtcbiIsIi8vIE1hZ25pZmljIFBvcHVwIHYxLjEuMCBieSBEbWl0cnkgU2VtZW5vdlxyXG4vLyBodHRwOi8vYml0Lmx5L21hZ25pZmljLXBvcHVwI2J1aWxkPWlubGluZStpbWFnZSthamF4K2lmcmFtZStnYWxsZXJ5K3JldGluYStpbWFnZXpvb21cclxuKGZ1bmN0aW9uKGEpe3R5cGVvZiBkZWZpbmU9PVwiZnVuY3Rpb25cIiYmZGVmaW5lLmFtZD9kZWZpbmUoW1wianF1ZXJ5XCJdLGEpOnR5cGVvZiBleHBvcnRzPT1cIm9iamVjdFwiP2EocmVxdWlyZShcImpxdWVyeVwiKSk6YSh3aW5kb3cualF1ZXJ5fHx3aW5kb3cuWmVwdG8pfSkoZnVuY3Rpb24oYSl7dmFyIGI9XCJDbG9zZVwiLGM9XCJCZWZvcmVDbG9zZVwiLGQ9XCJBZnRlckNsb3NlXCIsZT1cIkJlZm9yZUFwcGVuZFwiLGY9XCJNYXJrdXBQYXJzZVwiLGc9XCJPcGVuXCIsaD1cIkNoYW5nZVwiLGk9XCJtZnBcIixqPVwiLlwiK2ksaz1cIm1mcC1yZWFkeVwiLGw9XCJtZnAtcmVtb3ZpbmdcIixtPVwibWZwLXByZXZlbnQtY2xvc2VcIixuLG89ZnVuY3Rpb24oKXt9LHA9ISF3aW5kb3cualF1ZXJ5LHEscj1hKHdpbmRvdykscyx0LHUsdix3PWZ1bmN0aW9uKGEsYil7bi5ldi5vbihpK2EraixiKX0seD1mdW5jdGlvbihiLGMsZCxlKXt2YXIgZj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO3JldHVybiBmLmNsYXNzTmFtZT1cIm1mcC1cIitiLGQmJihmLmlubmVySFRNTD1kKSxlP2MmJmMuYXBwZW5kQ2hpbGQoZik6KGY9YShmKSxjJiZmLmFwcGVuZFRvKGMpKSxmfSx5PWZ1bmN0aW9uKGIsYyl7bi5ldi50cmlnZ2VySGFuZGxlcihpK2IsYyksbi5zdC5jYWxsYmFja3MmJihiPWIuY2hhckF0KDApLnRvTG93ZXJDYXNlKCkrYi5zbGljZSgxKSxuLnN0LmNhbGxiYWNrc1tiXSYmbi5zdC5jYWxsYmFja3NbYl0uYXBwbHkobixhLmlzQXJyYXkoYyk/YzpbY10pKX0sej1mdW5jdGlvbihiKXtpZihiIT09dnx8IW4uY3VyclRlbXBsYXRlLmNsb3NlQnRuKW4uY3VyclRlbXBsYXRlLmNsb3NlQnRuPWEobi5zdC5jbG9zZU1hcmt1cC5yZXBsYWNlKFwiJXRpdGxlJVwiLG4uc3QudENsb3NlKSksdj1iO3JldHVybiBuLmN1cnJUZW1wbGF0ZS5jbG9zZUJ0bn0sQT1mdW5jdGlvbigpe2EubWFnbmlmaWNQb3B1cC5pbnN0YW5jZXx8KG49bmV3IG8sbi5pbml0KCksYS5tYWduaWZpY1BvcHVwLmluc3RhbmNlPW4pfSxCPWZ1bmN0aW9uKCl7dmFyIGE9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIikuc3R5bGUsYj1bXCJtc1wiLFwiT1wiLFwiTW96XCIsXCJXZWJraXRcIl07aWYoYS50cmFuc2l0aW9uIT09dW5kZWZpbmVkKXJldHVybiEwO3doaWxlKGIubGVuZ3RoKWlmKGIucG9wKCkrXCJUcmFuc2l0aW9uXCJpbiBhKXJldHVybiEwO3JldHVybiExfTtvLnByb3RvdHlwZT17Y29uc3RydWN0b3I6byxpbml0OmZ1bmN0aW9uKCl7dmFyIGI9bmF2aWdhdG9yLmFwcFZlcnNpb247bi5pc0xvd0lFPW4uaXNJRTg9ZG9jdW1lbnQuYWxsJiYhZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcixuLmlzQW5kcm9pZD0vYW5kcm9pZC9naS50ZXN0KGIpLG4uaXNJT1M9L2lwaG9uZXxpcGFkfGlwb2QvZ2kudGVzdChiKSxuLnN1cHBvcnRzVHJhbnNpdGlvbj1CKCksbi5wcm9iYWJseU1vYmlsZT1uLmlzQW5kcm9pZHx8bi5pc0lPU3x8LyhPcGVyYSBNaW5pKXxLaW5kbGV8d2ViT1N8QmxhY2tCZXJyeXwoT3BlcmEgTW9iaSl8KFdpbmRvd3MgUGhvbmUpfElFTW9iaWxlL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSxzPWEoZG9jdW1lbnQpLG4ucG9wdXBzQ2FjaGU9e319LG9wZW46ZnVuY3Rpb24oYil7dmFyIGM7aWYoYi5pc09iaj09PSExKXtuLml0ZW1zPWIuaXRlbXMudG9BcnJheSgpLG4uaW5kZXg9MDt2YXIgZD1iLml0ZW1zLGU7Zm9yKGM9MDtjPGQubGVuZ3RoO2MrKyl7ZT1kW2NdLGUucGFyc2VkJiYoZT1lLmVsWzBdKTtpZihlPT09Yi5lbFswXSl7bi5pbmRleD1jO2JyZWFrfX19ZWxzZSBuLml0ZW1zPWEuaXNBcnJheShiLml0ZW1zKT9iLml0ZW1zOltiLml0ZW1zXSxuLmluZGV4PWIuaW5kZXh8fDA7aWYobi5pc09wZW4pe24udXBkYXRlSXRlbUhUTUwoKTtyZXR1cm59bi50eXBlcz1bXSx1PVwiXCIsYi5tYWluRWwmJmIubWFpbkVsLmxlbmd0aD9uLmV2PWIubWFpbkVsLmVxKDApOm4uZXY9cyxiLmtleT8obi5wb3B1cHNDYWNoZVtiLmtleV18fChuLnBvcHVwc0NhY2hlW2Iua2V5XT17fSksbi5jdXJyVGVtcGxhdGU9bi5wb3B1cHNDYWNoZVtiLmtleV0pOm4uY3VyclRlbXBsYXRlPXt9LG4uc3Q9YS5leHRlbmQoITAse30sYS5tYWduaWZpY1BvcHVwLmRlZmF1bHRzLGIpLG4uZml4ZWRDb250ZW50UG9zPW4uc3QuZml4ZWRDb250ZW50UG9zPT09XCJhdXRvXCI/IW4ucHJvYmFibHlNb2JpbGU6bi5zdC5maXhlZENvbnRlbnRQb3Msbi5zdC5tb2RhbCYmKG4uc3QuY2xvc2VPbkNvbnRlbnRDbGljaz0hMSxuLnN0LmNsb3NlT25CZ0NsaWNrPSExLG4uc3Quc2hvd0Nsb3NlQnRuPSExLG4uc3QuZW5hYmxlRXNjYXBlS2V5PSExKSxuLmJnT3ZlcmxheXx8KG4uYmdPdmVybGF5PXgoXCJiZ1wiKS5vbihcImNsaWNrXCIraixmdW5jdGlvbigpe24uY2xvc2UoKX0pLG4ud3JhcD14KFwid3JhcFwiKS5hdHRyKFwidGFiaW5kZXhcIiwtMSkub24oXCJjbGlja1wiK2osZnVuY3Rpb24oYSl7bi5fY2hlY2tJZkNsb3NlKGEudGFyZ2V0KSYmbi5jbG9zZSgpfSksbi5jb250YWluZXI9eChcImNvbnRhaW5lclwiLG4ud3JhcCkpLG4uY29udGVudENvbnRhaW5lcj14KFwiY29udGVudFwiKSxuLnN0LnByZWxvYWRlciYmKG4ucHJlbG9hZGVyPXgoXCJwcmVsb2FkZXJcIixuLmNvbnRhaW5lcixuLnN0LnRMb2FkaW5nKSk7dmFyIGg9YS5tYWduaWZpY1BvcHVwLm1vZHVsZXM7Zm9yKGM9MDtjPGgubGVuZ3RoO2MrKyl7dmFyIGk9aFtjXTtpPWkuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkraS5zbGljZSgxKSxuW1wiaW5pdFwiK2ldLmNhbGwobil9eShcIkJlZm9yZU9wZW5cIiksbi5zdC5zaG93Q2xvc2VCdG4mJihuLnN0LmNsb3NlQnRuSW5zaWRlPyh3KGYsZnVuY3Rpb24oYSxiLGMsZCl7Yy5jbG9zZV9yZXBsYWNlV2l0aD16KGQudHlwZSl9KSx1Kz1cIiBtZnAtY2xvc2UtYnRuLWluXCIpOm4ud3JhcC5hcHBlbmQoeigpKSksbi5zdC5hbGlnblRvcCYmKHUrPVwiIG1mcC1hbGlnbi10b3BcIiksbi5maXhlZENvbnRlbnRQb3M/bi53cmFwLmNzcyh7b3ZlcmZsb3c6bi5zdC5vdmVyZmxvd1ksb3ZlcmZsb3dYOlwiaGlkZGVuXCIsb3ZlcmZsb3dZOm4uc3Qub3ZlcmZsb3dZfSk6bi53cmFwLmNzcyh7dG9wOnIuc2Nyb2xsVG9wKCkscG9zaXRpb246XCJhYnNvbHV0ZVwifSksKG4uc3QuZml4ZWRCZ1Bvcz09PSExfHxuLnN0LmZpeGVkQmdQb3M9PT1cImF1dG9cIiYmIW4uZml4ZWRDb250ZW50UG9zKSYmbi5iZ092ZXJsYXkuY3NzKHtoZWlnaHQ6cy5oZWlnaHQoKSxwb3NpdGlvbjpcImFic29sdXRlXCJ9KSxuLnN0LmVuYWJsZUVzY2FwZUtleSYmcy5vbihcImtleXVwXCIraixmdW5jdGlvbihhKXthLmtleUNvZGU9PT0yNyYmbi5jbG9zZSgpfSksci5vbihcInJlc2l6ZVwiK2osZnVuY3Rpb24oKXtuLnVwZGF0ZVNpemUoKX0pLG4uc3QuY2xvc2VPbkNvbnRlbnRDbGlja3x8KHUrPVwiIG1mcC1hdXRvLWN1cnNvclwiKSx1JiZuLndyYXAuYWRkQ2xhc3ModSk7dmFyIGw9bi53SD1yLmhlaWdodCgpLG09e307aWYobi5maXhlZENvbnRlbnRQb3MmJm4uX2hhc1Njcm9sbEJhcihsKSl7dmFyIG89bi5fZ2V0U2Nyb2xsYmFyU2l6ZSgpO28mJihtLm1hcmdpblJpZ2h0PW8pfW4uZml4ZWRDb250ZW50UG9zJiYobi5pc0lFNz9hKFwiYm9keSwgaHRtbFwiKS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpOm0ub3ZlcmZsb3c9XCJoaWRkZW5cIik7dmFyIHA9bi5zdC5tYWluQ2xhc3M7cmV0dXJuIG4uaXNJRTcmJihwKz1cIiBtZnAtaWU3XCIpLHAmJm4uX2FkZENsYXNzVG9NRlAocCksbi51cGRhdGVJdGVtSFRNTCgpLHkoXCJCdWlsZENvbnRyb2xzXCIpLGEoXCJodG1sXCIpLmNzcyhtKSxuLmJnT3ZlcmxheS5hZGQobi53cmFwKS5wcmVwZW5kVG8obi5zdC5wcmVwZW5kVG98fGEoZG9jdW1lbnQuYm9keSkpLG4uX2xhc3RGb2N1c2VkRWw9ZG9jdW1lbnQuYWN0aXZlRWxlbWVudCxzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7bi5jb250ZW50PyhuLl9hZGRDbGFzc1RvTUZQKGspLG4uX3NldEZvY3VzKCkpOm4uYmdPdmVybGF5LmFkZENsYXNzKGspLHMub24oXCJmb2N1c2luXCIraixuLl9vbkZvY3VzSW4pfSwxNiksbi5pc09wZW49ITAsbi51cGRhdGVTaXplKGwpLHkoZyksYn0sY2xvc2U6ZnVuY3Rpb24oKXtpZighbi5pc09wZW4pcmV0dXJuO3koYyksbi5pc09wZW49ITEsbi5zdC5yZW1vdmFsRGVsYXkmJiFuLmlzTG93SUUmJm4uc3VwcG9ydHNUcmFuc2l0aW9uPyhuLl9hZGRDbGFzc1RvTUZQKGwpLHNldFRpbWVvdXQoZnVuY3Rpb24oKXtuLl9jbG9zZSgpfSxuLnN0LnJlbW92YWxEZWxheSkpOm4uX2Nsb3NlKCl9LF9jbG9zZTpmdW5jdGlvbigpe3koYik7dmFyIGM9bCtcIiBcIitrK1wiIFwiO24uYmdPdmVybGF5LmRldGFjaCgpLG4ud3JhcC5kZXRhY2goKSxuLmNvbnRhaW5lci5lbXB0eSgpLG4uc3QubWFpbkNsYXNzJiYoYys9bi5zdC5tYWluQ2xhc3MrXCIgXCIpLG4uX3JlbW92ZUNsYXNzRnJvbU1GUChjKTtpZihuLmZpeGVkQ29udGVudFBvcyl7dmFyIGU9e21hcmdpblJpZ2h0OlwiXCJ9O24uaXNJRTc/YShcImJvZHksIGh0bWxcIikuY3NzKFwib3ZlcmZsb3dcIixcIlwiKTplLm92ZXJmbG93PVwiXCIsYShcImh0bWxcIikuY3NzKGUpfXMub2ZmKFwia2V5dXBcIitqK1wiIGZvY3VzaW5cIitqKSxuLmV2Lm9mZihqKSxuLndyYXAuYXR0cihcImNsYXNzXCIsXCJtZnAtd3JhcFwiKS5yZW1vdmVBdHRyKFwic3R5bGVcIiksbi5iZ092ZXJsYXkuYXR0cihcImNsYXNzXCIsXCJtZnAtYmdcIiksbi5jb250YWluZXIuYXR0cihcImNsYXNzXCIsXCJtZnAtY29udGFpbmVyXCIpLG4uc3Quc2hvd0Nsb3NlQnRuJiYoIW4uc3QuY2xvc2VCdG5JbnNpZGV8fG4uY3VyclRlbXBsYXRlW24uY3Vyckl0ZW0udHlwZV09PT0hMCkmJm4uY3VyclRlbXBsYXRlLmNsb3NlQnRuJiZuLmN1cnJUZW1wbGF0ZS5jbG9zZUJ0bi5kZXRhY2goKSxuLnN0LmF1dG9Gb2N1c0xhc3QmJm4uX2xhc3RGb2N1c2VkRWwmJmEobi5fbGFzdEZvY3VzZWRFbCkuZm9jdXMoKSxuLmN1cnJJdGVtPW51bGwsbi5jb250ZW50PW51bGwsbi5jdXJyVGVtcGxhdGU9bnVsbCxuLnByZXZIZWlnaHQ9MCx5KGQpfSx1cGRhdGVTaXplOmZ1bmN0aW9uKGEpe2lmKG4uaXNJT1Mpe3ZhciBiPWRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aC93aW5kb3cuaW5uZXJXaWR0aCxjPXdpbmRvdy5pbm5lckhlaWdodCpiO24ud3JhcC5jc3MoXCJoZWlnaHRcIixjKSxuLndIPWN9ZWxzZSBuLndIPWF8fHIuaGVpZ2h0KCk7bi5maXhlZENvbnRlbnRQb3N8fG4ud3JhcC5jc3MoXCJoZWlnaHRcIixuLndIKSx5KFwiUmVzaXplXCIpfSx1cGRhdGVJdGVtSFRNTDpmdW5jdGlvbigpe3ZhciBiPW4uaXRlbXNbbi5pbmRleF07bi5jb250ZW50Q29udGFpbmVyLmRldGFjaCgpLG4uY29udGVudCYmbi5jb250ZW50LmRldGFjaCgpLGIucGFyc2VkfHwoYj1uLnBhcnNlRWwobi5pbmRleCkpO3ZhciBjPWIudHlwZTt5KFwiQmVmb3JlQ2hhbmdlXCIsW24uY3Vyckl0ZW0/bi5jdXJySXRlbS50eXBlOlwiXCIsY10pLG4uY3Vyckl0ZW09YjtpZighbi5jdXJyVGVtcGxhdGVbY10pe3ZhciBkPW4uc3RbY10/bi5zdFtjXS5tYXJrdXA6ITE7eShcIkZpcnN0TWFya3VwUGFyc2VcIixkKSxkP24uY3VyclRlbXBsYXRlW2NdPWEoZCk6bi5jdXJyVGVtcGxhdGVbY109ITB9dCYmdCE9PWIudHlwZSYmbi5jb250YWluZXIucmVtb3ZlQ2xhc3MoXCJtZnAtXCIrdCtcIi1ob2xkZXJcIik7dmFyIGU9bltcImdldFwiK2MuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkrYy5zbGljZSgxKV0oYixuLmN1cnJUZW1wbGF0ZVtjXSk7bi5hcHBlbmRDb250ZW50KGUsYyksYi5wcmVsb2FkZWQ9ITAseShoLGIpLHQ9Yi50eXBlLG4uY29udGFpbmVyLnByZXBlbmQobi5jb250ZW50Q29udGFpbmVyKSx5KFwiQWZ0ZXJDaGFuZ2VcIil9LGFwcGVuZENvbnRlbnQ6ZnVuY3Rpb24oYSxiKXtuLmNvbnRlbnQ9YSxhP24uc3Quc2hvd0Nsb3NlQnRuJiZuLnN0LmNsb3NlQnRuSW5zaWRlJiZuLmN1cnJUZW1wbGF0ZVtiXT09PSEwP24uY29udGVudC5maW5kKFwiLm1mcC1jbG9zZVwiKS5sZW5ndGh8fG4uY29udGVudC5hcHBlbmQoeigpKTpuLmNvbnRlbnQ9YTpuLmNvbnRlbnQ9XCJcIix5KGUpLG4uY29udGFpbmVyLmFkZENsYXNzKFwibWZwLVwiK2IrXCItaG9sZGVyXCIpLG4uY29udGVudENvbnRhaW5lci5hcHBlbmQobi5jb250ZW50KX0scGFyc2VFbDpmdW5jdGlvbihiKXt2YXIgYz1uLml0ZW1zW2JdLGQ7Yy50YWdOYW1lP2M9e2VsOmEoYyl9OihkPWMudHlwZSxjPXtkYXRhOmMsc3JjOmMuc3JjfSk7aWYoYy5lbCl7dmFyIGU9bi50eXBlcztmb3IodmFyIGY9MDtmPGUubGVuZ3RoO2YrKylpZihjLmVsLmhhc0NsYXNzKFwibWZwLVwiK2VbZl0pKXtkPWVbZl07YnJlYWt9Yy5zcmM9Yy5lbC5hdHRyKFwiZGF0YS1tZnAtc3JjXCIpLGMuc3JjfHwoYy5zcmM9Yy5lbC5hdHRyKFwiaHJlZlwiKSl9cmV0dXJuIGMudHlwZT1kfHxuLnN0LnR5cGV8fFwiaW5saW5lXCIsYy5pbmRleD1iLGMucGFyc2VkPSEwLG4uaXRlbXNbYl09Yyx5KFwiRWxlbWVudFBhcnNlXCIsYyksbi5pdGVtc1tiXX0sYWRkR3JvdXA6ZnVuY3Rpb24oYSxiKXt2YXIgYz1mdW5jdGlvbihjKXtjLm1mcEVsPXRoaXMsbi5fb3BlbkNsaWNrKGMsYSxiKX07Ynx8KGI9e30pO3ZhciBkPVwiY2xpY2subWFnbmlmaWNQb3B1cFwiO2IubWFpbkVsPWEsYi5pdGVtcz8oYi5pc09iaj0hMCxhLm9mZihkKS5vbihkLGMpKTooYi5pc09iaj0hMSxiLmRlbGVnYXRlP2Eub2ZmKGQpLm9uKGQsYi5kZWxlZ2F0ZSxjKTooYi5pdGVtcz1hLGEub2ZmKGQpLm9uKGQsYykpKX0sX29wZW5DbGljazpmdW5jdGlvbihiLGMsZCl7dmFyIGU9ZC5taWRDbGljayE9PXVuZGVmaW5lZD9kLm1pZENsaWNrOmEubWFnbmlmaWNQb3B1cC5kZWZhdWx0cy5taWRDbGljaztpZighZSYmKGIud2hpY2g9PT0yfHxiLmN0cmxLZXl8fGIubWV0YUtleXx8Yi5hbHRLZXl8fGIuc2hpZnRLZXkpKXJldHVybjt2YXIgZj1kLmRpc2FibGVPbiE9PXVuZGVmaW5lZD9kLmRpc2FibGVPbjphLm1hZ25pZmljUG9wdXAuZGVmYXVsdHMuZGlzYWJsZU9uO2lmKGYpaWYoYS5pc0Z1bmN0aW9uKGYpKXtpZighZi5jYWxsKG4pKXJldHVybiEwfWVsc2UgaWYoci53aWR0aCgpPGYpcmV0dXJuITA7Yi50eXBlJiYoYi5wcmV2ZW50RGVmYXVsdCgpLG4uaXNPcGVuJiZiLnN0b3BQcm9wYWdhdGlvbigpKSxkLmVsPWEoYi5tZnBFbCksZC5kZWxlZ2F0ZSYmKGQuaXRlbXM9Yy5maW5kKGQuZGVsZWdhdGUpKSxuLm9wZW4oZCl9LHVwZGF0ZVN0YXR1czpmdW5jdGlvbihhLGIpe2lmKG4ucHJlbG9hZGVyKXtxIT09YSYmbi5jb250YWluZXIucmVtb3ZlQ2xhc3MoXCJtZnAtcy1cIitxKSwhYiYmYT09PVwibG9hZGluZ1wiJiYoYj1uLnN0LnRMb2FkaW5nKTt2YXIgYz17c3RhdHVzOmEsdGV4dDpifTt5KFwiVXBkYXRlU3RhdHVzXCIsYyksYT1jLnN0YXR1cyxiPWMudGV4dCxuLnByZWxvYWRlci5odG1sKGIpLG4ucHJlbG9hZGVyLmZpbmQoXCJhXCIpLm9uKFwiY2xpY2tcIixmdW5jdGlvbihhKXthLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpfSksbi5jb250YWluZXIuYWRkQ2xhc3MoXCJtZnAtcy1cIithKSxxPWF9fSxfY2hlY2tJZkNsb3NlOmZ1bmN0aW9uKGIpe2lmKGEoYikuaGFzQ2xhc3MobSkpcmV0dXJuO3ZhciBjPW4uc3QuY2xvc2VPbkNvbnRlbnRDbGljayxkPW4uc3QuY2xvc2VPbkJnQ2xpY2s7aWYoYyYmZClyZXR1cm4hMDtpZighbi5jb250ZW50fHxhKGIpLmhhc0NsYXNzKFwibWZwLWNsb3NlXCIpfHxuLnByZWxvYWRlciYmYj09PW4ucHJlbG9hZGVyWzBdKXJldHVybiEwO2lmKGIhPT1uLmNvbnRlbnRbMF0mJiFhLmNvbnRhaW5zKG4uY29udGVudFswXSxiKSl7aWYoZCYmYS5jb250YWlucyhkb2N1bWVudCxiKSlyZXR1cm4hMH1lbHNlIGlmKGMpcmV0dXJuITA7cmV0dXJuITF9LF9hZGRDbGFzc1RvTUZQOmZ1bmN0aW9uKGEpe24uYmdPdmVybGF5LmFkZENsYXNzKGEpLG4ud3JhcC5hZGRDbGFzcyhhKX0sX3JlbW92ZUNsYXNzRnJvbU1GUDpmdW5jdGlvbihhKXt0aGlzLmJnT3ZlcmxheS5yZW1vdmVDbGFzcyhhKSxuLndyYXAucmVtb3ZlQ2xhc3MoYSl9LF9oYXNTY3JvbGxCYXI6ZnVuY3Rpb24oYSl7cmV0dXJuKG4uaXNJRTc/cy5oZWlnaHQoKTpkb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCk+KGF8fHIuaGVpZ2h0KCkpfSxfc2V0Rm9jdXM6ZnVuY3Rpb24oKXsobi5zdC5mb2N1cz9uLmNvbnRlbnQuZmluZChuLnN0LmZvY3VzKS5lcSgwKTpuLndyYXApLmZvY3VzKCl9LF9vbkZvY3VzSW46ZnVuY3Rpb24oYil7aWYoYi50YXJnZXQhPT1uLndyYXBbMF0mJiFhLmNvbnRhaW5zKG4ud3JhcFswXSxiLnRhcmdldCkpcmV0dXJuIG4uX3NldEZvY3VzKCksITF9LF9wYXJzZU1hcmt1cDpmdW5jdGlvbihiLGMsZCl7dmFyIGU7ZC5kYXRhJiYoYz1hLmV4dGVuZChkLmRhdGEsYykpLHkoZixbYixjLGRdKSxhLmVhY2goYyxmdW5jdGlvbihjLGQpe2lmKGQ9PT11bmRlZmluZWR8fGQ9PT0hMSlyZXR1cm4hMDtlPWMuc3BsaXQoXCJfXCIpO2lmKGUubGVuZ3RoPjEpe3ZhciBmPWIuZmluZChqK1wiLVwiK2VbMF0pO2lmKGYubGVuZ3RoPjApe3ZhciBnPWVbMV07Zz09PVwicmVwbGFjZVdpdGhcIj9mWzBdIT09ZFswXSYmZi5yZXBsYWNlV2l0aChkKTpnPT09XCJpbWdcIj9mLmlzKFwiaW1nXCIpP2YuYXR0cihcInNyY1wiLGQpOmYucmVwbGFjZVdpdGgoYShcIjxpbWc+XCIpLmF0dHIoXCJzcmNcIixkKS5hdHRyKFwiY2xhc3NcIixmLmF0dHIoXCJjbGFzc1wiKSkpOmYuYXR0cihlWzFdLGQpfX1lbHNlIGIuZmluZChqK1wiLVwiK2MpLmh0bWwoZCl9KX0sX2dldFNjcm9sbGJhclNpemU6ZnVuY3Rpb24oKXtpZihuLnNjcm9sbGJhclNpemU9PT11bmRlZmluZWQpe3ZhciBhPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7YS5zdHlsZS5jc3NUZXh0PVwid2lkdGg6IDk5cHg7IGhlaWdodDogOTlweDsgb3ZlcmZsb3c6IHNjcm9sbDsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IC05OTk5cHg7XCIsZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKSxuLnNjcm9sbGJhclNpemU9YS5vZmZzZXRXaWR0aC1hLmNsaWVudFdpZHRoLGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoYSl9cmV0dXJuIG4uc2Nyb2xsYmFyU2l6ZX19LGEubWFnbmlmaWNQb3B1cD17aW5zdGFuY2U6bnVsbCxwcm90bzpvLnByb3RvdHlwZSxtb2R1bGVzOltdLG9wZW46ZnVuY3Rpb24oYixjKXtyZXR1cm4gQSgpLGI/Yj1hLmV4dGVuZCghMCx7fSxiKTpiPXt9LGIuaXNPYmo9ITAsYi5pbmRleD1jfHwwLHRoaXMuaW5zdGFuY2Uub3BlbihiKX0sY2xvc2U6ZnVuY3Rpb24oKXtyZXR1cm4gYS5tYWduaWZpY1BvcHVwLmluc3RhbmNlJiZhLm1hZ25pZmljUG9wdXAuaW5zdGFuY2UuY2xvc2UoKX0scmVnaXN0ZXJNb2R1bGU6ZnVuY3Rpb24oYixjKXtjLm9wdGlvbnMmJihhLm1hZ25pZmljUG9wdXAuZGVmYXVsdHNbYl09Yy5vcHRpb25zKSxhLmV4dGVuZCh0aGlzLnByb3RvLGMucHJvdG8pLHRoaXMubW9kdWxlcy5wdXNoKGIpfSxkZWZhdWx0czp7ZGlzYWJsZU9uOjAsa2V5Om51bGwsbWlkQ2xpY2s6ITEsbWFpbkNsYXNzOlwiXCIscHJlbG9hZGVyOiEwLGZvY3VzOlwiXCIsY2xvc2VPbkNvbnRlbnRDbGljazohMSxjbG9zZU9uQmdDbGljazohMCxjbG9zZUJ0bkluc2lkZTohMCxzaG93Q2xvc2VCdG46ITAsZW5hYmxlRXNjYXBlS2V5OiEwLG1vZGFsOiExLGFsaWduVG9wOiExLHJlbW92YWxEZWxheTowLHByZXBlbmRUbzpudWxsLGZpeGVkQ29udGVudFBvczpcImF1dG9cIixmaXhlZEJnUG9zOlwiYXV0b1wiLG92ZXJmbG93WTpcImF1dG9cIixjbG9zZU1hcmt1cDonPGJ1dHRvbiB0aXRsZT1cIiV0aXRsZSVcIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJtZnAtY2xvc2VcIj4mIzIxNTs8L2J1dHRvbj4nLHRDbG9zZTpcIkNsb3NlIChFc2MpXCIsdExvYWRpbmc6XCJMb2FkaW5nLi4uXCIsYXV0b0ZvY3VzTGFzdDohMH19LGEuZm4ubWFnbmlmaWNQb3B1cD1mdW5jdGlvbihiKXtBKCk7dmFyIGM9YSh0aGlzKTtpZih0eXBlb2YgYj09XCJzdHJpbmdcIilpZihiPT09XCJvcGVuXCIpe3ZhciBkLGU9cD9jLmRhdGEoXCJtYWduaWZpY1BvcHVwXCIpOmNbMF0ubWFnbmlmaWNQb3B1cCxmPXBhcnNlSW50KGFyZ3VtZW50c1sxXSwxMCl8fDA7ZS5pdGVtcz9kPWUuaXRlbXNbZl06KGQ9YyxlLmRlbGVnYXRlJiYoZD1kLmZpbmQoZS5kZWxlZ2F0ZSkpLGQ9ZC5lcShmKSksbi5fb3BlbkNsaWNrKHttZnBFbDpkfSxjLGUpfWVsc2Ugbi5pc09wZW4mJm5bYl0uYXBwbHkobixBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsMSkpO2Vsc2UgYj1hLmV4dGVuZCghMCx7fSxiKSxwP2MuZGF0YShcIm1hZ25pZmljUG9wdXBcIixiKTpjWzBdLm1hZ25pZmljUG9wdXA9YixuLmFkZEdyb3VwKGMsYik7cmV0dXJuIGN9O3ZhciBDPVwiaW5saW5lXCIsRCxFLEYsRz1mdW5jdGlvbigpe0YmJihFLmFmdGVyKEYuYWRkQ2xhc3MoRCkpLmRldGFjaCgpLEY9bnVsbCl9O2EubWFnbmlmaWNQb3B1cC5yZWdpc3Rlck1vZHVsZShDLHtvcHRpb25zOntoaWRkZW5DbGFzczpcImhpZGVcIixtYXJrdXA6XCJcIix0Tm90Rm91bmQ6XCJDb250ZW50IG5vdCBmb3VuZFwifSxwcm90bzp7aW5pdElubGluZTpmdW5jdGlvbigpe24udHlwZXMucHVzaChDKSx3KGIrXCIuXCIrQyxmdW5jdGlvbigpe0coKX0pfSxnZXRJbmxpbmU6ZnVuY3Rpb24oYixjKXtHKCk7aWYoYi5zcmMpe3ZhciBkPW4uc3QuaW5saW5lLGU9YShiLnNyYyk7aWYoZS5sZW5ndGgpe3ZhciBmPWVbMF0ucGFyZW50Tm9kZTtmJiZmLnRhZ05hbWUmJihFfHwoRD1kLmhpZGRlbkNsYXNzLEU9eChEKSxEPVwibWZwLVwiK0QpLEY9ZS5hZnRlcihFKS5kZXRhY2goKS5yZW1vdmVDbGFzcyhEKSksbi51cGRhdGVTdGF0dXMoXCJyZWFkeVwiKX1lbHNlIG4udXBkYXRlU3RhdHVzKFwiZXJyb3JcIixkLnROb3RGb3VuZCksZT1hKFwiPGRpdj5cIik7cmV0dXJuIGIuaW5saW5lRWxlbWVudD1lLGV9cmV0dXJuIG4udXBkYXRlU3RhdHVzKFwicmVhZHlcIiksbi5fcGFyc2VNYXJrdXAoYyx7fSxiKSxjfX19KTt2YXIgSD1cImFqYXhcIixJLEo9ZnVuY3Rpb24oKXtJJiZhKGRvY3VtZW50LmJvZHkpLnJlbW92ZUNsYXNzKEkpfSxLPWZ1bmN0aW9uKCl7SigpLG4ucmVxJiZuLnJlcS5hYm9ydCgpfTthLm1hZ25pZmljUG9wdXAucmVnaXN0ZXJNb2R1bGUoSCx7b3B0aW9uczp7c2V0dGluZ3M6bnVsbCxjdXJzb3I6XCJtZnAtYWpheC1jdXJcIix0RXJyb3I6JzxhIGhyZWY9XCIldXJsJVwiPlRoZSBjb250ZW50PC9hPiBjb3VsZCBub3QgYmUgbG9hZGVkLid9LHByb3RvOntpbml0QWpheDpmdW5jdGlvbigpe24udHlwZXMucHVzaChIKSxJPW4uc3QuYWpheC5jdXJzb3IsdyhiK1wiLlwiK0gsSyksdyhcIkJlZm9yZUNoYW5nZS5cIitILEspfSxnZXRBamF4OmZ1bmN0aW9uKGIpe0kmJmEoZG9jdW1lbnQuYm9keSkuYWRkQ2xhc3MoSSksbi51cGRhdGVTdGF0dXMoXCJsb2FkaW5nXCIpO3ZhciBjPWEuZXh0ZW5kKHt1cmw6Yi5zcmMsc3VjY2VzczpmdW5jdGlvbihjLGQsZSl7dmFyIGY9e2RhdGE6Yyx4aHI6ZX07eShcIlBhcnNlQWpheFwiLGYpLG4uYXBwZW5kQ29udGVudChhKGYuZGF0YSksSCksYi5maW5pc2hlZD0hMCxKKCksbi5fc2V0Rm9jdXMoKSxzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7bi53cmFwLmFkZENsYXNzKGspfSwxNiksbi51cGRhdGVTdGF0dXMoXCJyZWFkeVwiKSx5KFwiQWpheENvbnRlbnRBZGRlZFwiKX0sZXJyb3I6ZnVuY3Rpb24oKXtKKCksYi5maW5pc2hlZD1iLmxvYWRFcnJvcj0hMCxuLnVwZGF0ZVN0YXR1cyhcImVycm9yXCIsbi5zdC5hamF4LnRFcnJvci5yZXBsYWNlKFwiJXVybCVcIixiLnNyYykpfX0sbi5zdC5hamF4LnNldHRpbmdzKTtyZXR1cm4gbi5yZXE9YS5hamF4KGMpLFwiXCJ9fX0pO3ZhciBMLE09ZnVuY3Rpb24oYil7aWYoYi5kYXRhJiZiLmRhdGEudGl0bGUhPT11bmRlZmluZWQpcmV0dXJuIGIuZGF0YS50aXRsZTt2YXIgYz1uLnN0LmltYWdlLnRpdGxlU3JjO2lmKGMpe2lmKGEuaXNGdW5jdGlvbihjKSlyZXR1cm4gYy5jYWxsKG4sYik7aWYoYi5lbClyZXR1cm4gYi5lbC5hdHRyKGMpfHxcIlwifXJldHVyblwiXCJ9O2EubWFnbmlmaWNQb3B1cC5yZWdpc3Rlck1vZHVsZShcImltYWdlXCIse29wdGlvbnM6e21hcmt1cDonPGRpdiBjbGFzcz1cIm1mcC1maWd1cmVcIj48ZGl2IGNsYXNzPVwibWZwLWNsb3NlXCI+PC9kaXY+PGZpZ3VyZT48ZGl2IGNsYXNzPVwibWZwLWltZ1wiPjwvZGl2PjxmaWdjYXB0aW9uPjxkaXYgY2xhc3M9XCJtZnAtYm90dG9tLWJhclwiPjxkaXYgY2xhc3M9XCJtZnAtdGl0bGVcIj48L2Rpdj48ZGl2IGNsYXNzPVwibWZwLWNvdW50ZXJcIj48L2Rpdj48L2Rpdj48L2ZpZ2NhcHRpb24+PC9maWd1cmU+PC9kaXY+JyxjdXJzb3I6XCJtZnAtem9vbS1vdXQtY3VyXCIsdGl0bGVTcmM6XCJ0aXRsZVwiLHZlcnRpY2FsRml0OiEwLHRFcnJvcjonPGEgaHJlZj1cIiV1cmwlXCI+VGhlIGltYWdlPC9hPiBjb3VsZCBub3QgYmUgbG9hZGVkLid9LHByb3RvOntpbml0SW1hZ2U6ZnVuY3Rpb24oKXt2YXIgYz1uLnN0LmltYWdlLGQ9XCIuaW1hZ2VcIjtuLnR5cGVzLnB1c2goXCJpbWFnZVwiKSx3KGcrZCxmdW5jdGlvbigpe24uY3Vyckl0ZW0udHlwZT09PVwiaW1hZ2VcIiYmYy5jdXJzb3ImJmEoZG9jdW1lbnQuYm9keSkuYWRkQ2xhc3MoYy5jdXJzb3IpfSksdyhiK2QsZnVuY3Rpb24oKXtjLmN1cnNvciYmYShkb2N1bWVudC5ib2R5KS5yZW1vdmVDbGFzcyhjLmN1cnNvciksci5vZmYoXCJyZXNpemVcIitqKX0pLHcoXCJSZXNpemVcIitkLG4ucmVzaXplSW1hZ2UpLG4uaXNMb3dJRSYmdyhcIkFmdGVyQ2hhbmdlXCIsbi5yZXNpemVJbWFnZSl9LHJlc2l6ZUltYWdlOmZ1bmN0aW9uKCl7dmFyIGE9bi5jdXJySXRlbTtpZighYXx8IWEuaW1nKXJldHVybjtpZihuLnN0LmltYWdlLnZlcnRpY2FsRml0KXt2YXIgYj0wO24uaXNMb3dJRSYmKGI9cGFyc2VJbnQoYS5pbWcuY3NzKFwicGFkZGluZy10b3BcIiksMTApK3BhcnNlSW50KGEuaW1nLmNzcyhcInBhZGRpbmctYm90dG9tXCIpLDEwKSksYS5pbWcuY3NzKFwibWF4LWhlaWdodFwiLG4ud0gtYil9fSxfb25JbWFnZUhhc1NpemU6ZnVuY3Rpb24oYSl7YS5pbWcmJihhLmhhc1NpemU9ITAsTCYmY2xlYXJJbnRlcnZhbChMKSxhLmlzQ2hlY2tpbmdJbWdTaXplPSExLHkoXCJJbWFnZUhhc1NpemVcIixhKSxhLmltZ0hpZGRlbiYmKG4uY29udGVudCYmbi5jb250ZW50LnJlbW92ZUNsYXNzKFwibWZwLWxvYWRpbmdcIiksYS5pbWdIaWRkZW49ITEpKX0sZmluZEltYWdlU2l6ZTpmdW5jdGlvbihhKXt2YXIgYj0wLGM9YS5pbWdbMF0sZD1mdW5jdGlvbihlKXtMJiZjbGVhckludGVydmFsKEwpLEw9c2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXtpZihjLm5hdHVyYWxXaWR0aD4wKXtuLl9vbkltYWdlSGFzU2l6ZShhKTtyZXR1cm59Yj4yMDAmJmNsZWFySW50ZXJ2YWwoTCksYisrLGI9PT0zP2QoMTApOmI9PT00MD9kKDUwKTpiPT09MTAwJiZkKDUwMCl9LGUpfTtkKDEpfSxnZXRJbWFnZTpmdW5jdGlvbihiLGMpe3ZhciBkPTAsZT1mdW5jdGlvbigpe2ImJihiLmltZ1swXS5jb21wbGV0ZT8oYi5pbWcub2ZmKFwiLm1mcGxvYWRlclwiKSxiPT09bi5jdXJySXRlbSYmKG4uX29uSW1hZ2VIYXNTaXplKGIpLG4udXBkYXRlU3RhdHVzKFwicmVhZHlcIikpLGIuaGFzU2l6ZT0hMCxiLmxvYWRlZD0hMCx5KFwiSW1hZ2VMb2FkQ29tcGxldGVcIikpOihkKyssZDwyMDA/c2V0VGltZW91dChlLDEwMCk6ZigpKSl9LGY9ZnVuY3Rpb24oKXtiJiYoYi5pbWcub2ZmKFwiLm1mcGxvYWRlclwiKSxiPT09bi5jdXJySXRlbSYmKG4uX29uSW1hZ2VIYXNTaXplKGIpLG4udXBkYXRlU3RhdHVzKFwiZXJyb3JcIixnLnRFcnJvci5yZXBsYWNlKFwiJXVybCVcIixiLnNyYykpKSxiLmhhc1NpemU9ITAsYi5sb2FkZWQ9ITAsYi5sb2FkRXJyb3I9ITApfSxnPW4uc3QuaW1hZ2UsaD1jLmZpbmQoXCIubWZwLWltZ1wiKTtpZihoLmxlbmd0aCl7dmFyIGk9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtpLmNsYXNzTmFtZT1cIm1mcC1pbWdcIixiLmVsJiZiLmVsLmZpbmQoXCJpbWdcIikubGVuZ3RoJiYoaS5hbHQ9Yi5lbC5maW5kKFwiaW1nXCIpLmF0dHIoXCJhbHRcIikpLGIuaW1nPWEoaSkub24oXCJsb2FkLm1mcGxvYWRlclwiLGUpLm9uKFwiZXJyb3IubWZwbG9hZGVyXCIsZiksaS5zcmM9Yi5zcmMsaC5pcyhcImltZ1wiKSYmKGIuaW1nPWIuaW1nLmNsb25lKCkpLGk9Yi5pbWdbMF0saS5uYXR1cmFsV2lkdGg+MD9iLmhhc1NpemU9ITA6aS53aWR0aHx8KGIuaGFzU2l6ZT0hMSl9cmV0dXJuIG4uX3BhcnNlTWFya3VwKGMse3RpdGxlOk0oYiksaW1nX3JlcGxhY2VXaXRoOmIuaW1nfSxiKSxuLnJlc2l6ZUltYWdlKCksYi5oYXNTaXplPyhMJiZjbGVhckludGVydmFsKEwpLGIubG9hZEVycm9yPyhjLmFkZENsYXNzKFwibWZwLWxvYWRpbmdcIiksbi51cGRhdGVTdGF0dXMoXCJlcnJvclwiLGcudEVycm9yLnJlcGxhY2UoXCIldXJsJVwiLGIuc3JjKSkpOihjLnJlbW92ZUNsYXNzKFwibWZwLWxvYWRpbmdcIiksbi51cGRhdGVTdGF0dXMoXCJyZWFkeVwiKSksYyk6KG4udXBkYXRlU3RhdHVzKFwibG9hZGluZ1wiKSxiLmxvYWRpbmc9ITAsYi5oYXNTaXplfHwoYi5pbWdIaWRkZW49ITAsYy5hZGRDbGFzcyhcIm1mcC1sb2FkaW5nXCIpLG4uZmluZEltYWdlU2l6ZShiKSksYyl9fX0pO3ZhciBOLE89ZnVuY3Rpb24oKXtyZXR1cm4gTj09PXVuZGVmaW5lZCYmKE49ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIikuc3R5bGUuTW96VHJhbnNmb3JtIT09dW5kZWZpbmVkKSxOfTthLm1hZ25pZmljUG9wdXAucmVnaXN0ZXJNb2R1bGUoXCJ6b29tXCIse29wdGlvbnM6e2VuYWJsZWQ6ITEsZWFzaW5nOlwiZWFzZS1pbi1vdXRcIixkdXJhdGlvbjozMDAsb3BlbmVyOmZ1bmN0aW9uKGEpe3JldHVybiBhLmlzKFwiaW1nXCIpP2E6YS5maW5kKFwiaW1nXCIpfX0scHJvdG86e2luaXRab29tOmZ1bmN0aW9uKCl7dmFyIGE9bi5zdC56b29tLGQ9XCIuem9vbVwiLGU7aWYoIWEuZW5hYmxlZHx8IW4uc3VwcG9ydHNUcmFuc2l0aW9uKXJldHVybjt2YXIgZj1hLmR1cmF0aW9uLGc9ZnVuY3Rpb24oYil7dmFyIGM9Yi5jbG9uZSgpLnJlbW92ZUF0dHIoXCJzdHlsZVwiKS5yZW1vdmVBdHRyKFwiY2xhc3NcIikuYWRkQ2xhc3MoXCJtZnAtYW5pbWF0ZWQtaW1hZ2VcIiksZD1cImFsbCBcIithLmR1cmF0aW9uLzFlMytcInMgXCIrYS5lYXNpbmcsZT17cG9zaXRpb246XCJmaXhlZFwiLHpJbmRleDo5OTk5LGxlZnQ6MCx0b3A6MCxcIi13ZWJraXQtYmFja2ZhY2UtdmlzaWJpbGl0eVwiOlwiaGlkZGVuXCJ9LGY9XCJ0cmFuc2l0aW9uXCI7cmV0dXJuIGVbXCItd2Via2l0LVwiK2ZdPWVbXCItbW96LVwiK2ZdPWVbXCItby1cIitmXT1lW2ZdPWQsYy5jc3MoZSksY30saD1mdW5jdGlvbigpe24uY29udGVudC5jc3MoXCJ2aXNpYmlsaXR5XCIsXCJ2aXNpYmxlXCIpfSxpLGo7dyhcIkJ1aWxkQ29udHJvbHNcIitkLGZ1bmN0aW9uKCl7aWYobi5fYWxsb3dab29tKCkpe2NsZWFyVGltZW91dChpKSxuLmNvbnRlbnQuY3NzKFwidmlzaWJpbGl0eVwiLFwiaGlkZGVuXCIpLGU9bi5fZ2V0SXRlbVRvWm9vbSgpO2lmKCFlKXtoKCk7cmV0dXJufWo9ZyhlKSxqLmNzcyhuLl9nZXRPZmZzZXQoKSksbi53cmFwLmFwcGVuZChqKSxpPXNldFRpbWVvdXQoZnVuY3Rpb24oKXtqLmNzcyhuLl9nZXRPZmZzZXQoITApKSxpPXNldFRpbWVvdXQoZnVuY3Rpb24oKXtoKCksc2V0VGltZW91dChmdW5jdGlvbigpe2oucmVtb3ZlKCksZT1qPW51bGwseShcIlpvb21BbmltYXRpb25FbmRlZFwiKX0sMTYpfSxmKX0sMTYpfX0pLHcoYytkLGZ1bmN0aW9uKCl7aWYobi5fYWxsb3dab29tKCkpe2NsZWFyVGltZW91dChpKSxuLnN0LnJlbW92YWxEZWxheT1mO2lmKCFlKXtlPW4uX2dldEl0ZW1Ub1pvb20oKTtpZighZSlyZXR1cm47aj1nKGUpfWouY3NzKG4uX2dldE9mZnNldCghMCkpLG4ud3JhcC5hcHBlbmQoaiksbi5jb250ZW50LmNzcyhcInZpc2liaWxpdHlcIixcImhpZGRlblwiKSxzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7ai5jc3Mobi5fZ2V0T2Zmc2V0KCkpfSwxNil9fSksdyhiK2QsZnVuY3Rpb24oKXtuLl9hbGxvd1pvb20oKSYmKGgoKSxqJiZqLnJlbW92ZSgpLGU9bnVsbCl9KX0sX2FsbG93Wm9vbTpmdW5jdGlvbigpe3JldHVybiBuLmN1cnJJdGVtLnR5cGU9PT1cImltYWdlXCJ9LF9nZXRJdGVtVG9ab29tOmZ1bmN0aW9uKCl7cmV0dXJuIG4uY3Vyckl0ZW0uaGFzU2l6ZT9uLmN1cnJJdGVtLmltZzohMX0sX2dldE9mZnNldDpmdW5jdGlvbihiKXt2YXIgYztiP2M9bi5jdXJySXRlbS5pbWc6Yz1uLnN0Lnpvb20ub3BlbmVyKG4uY3Vyckl0ZW0uZWx8fG4uY3Vyckl0ZW0pO3ZhciBkPWMub2Zmc2V0KCksZT1wYXJzZUludChjLmNzcyhcInBhZGRpbmctdG9wXCIpLDEwKSxmPXBhcnNlSW50KGMuY3NzKFwicGFkZGluZy1ib3R0b21cIiksMTApO2QudG9wLT1hKHdpbmRvdykuc2Nyb2xsVG9wKCktZTt2YXIgZz17d2lkdGg6Yy53aWR0aCgpLGhlaWdodDoocD9jLmlubmVySGVpZ2h0KCk6Y1swXS5vZmZzZXRIZWlnaHQpLWYtZX07cmV0dXJuIE8oKT9nW1wiLW1vei10cmFuc2Zvcm1cIl09Zy50cmFuc2Zvcm09XCJ0cmFuc2xhdGUoXCIrZC5sZWZ0K1wicHgsXCIrZC50b3ArXCJweClcIjooZy5sZWZ0PWQubGVmdCxnLnRvcD1kLnRvcCksZ319fSk7dmFyIFA9XCJpZnJhbWVcIixRPVwiLy9hYm91dDpibGFua1wiLFI9ZnVuY3Rpb24oYSl7aWYobi5jdXJyVGVtcGxhdGVbUF0pe3ZhciBiPW4uY3VyclRlbXBsYXRlW1BdLmZpbmQoXCJpZnJhbWVcIik7Yi5sZW5ndGgmJihhfHwoYlswXS5zcmM9USksbi5pc0lFOCYmYi5jc3MoXCJkaXNwbGF5XCIsYT9cImJsb2NrXCI6XCJub25lXCIpKX19O2EubWFnbmlmaWNQb3B1cC5yZWdpc3Rlck1vZHVsZShQLHtvcHRpb25zOnttYXJrdXA6JzxkaXYgY2xhc3M9XCJtZnAtaWZyYW1lLXNjYWxlclwiPjxkaXYgY2xhc3M9XCJtZnAtY2xvc2VcIj48L2Rpdj48aWZyYW1lIGNsYXNzPVwibWZwLWlmcmFtZVwiIHNyYz1cIi8vYWJvdXQ6YmxhbmtcIiBmcmFtZWJvcmRlcj1cIjBcIiBhbGxvd2Z1bGxzY3JlZW4+PC9pZnJhbWU+PC9kaXY+JyxzcmNBY3Rpb246XCJpZnJhbWVfc3JjXCIscGF0dGVybnM6e3lvdXR1YmU6e2luZGV4OlwieW91dHViZS5jb21cIixpZDpcInY9XCIsc3JjOlwiLy93d3cueW91dHViZS5jb20vZW1iZWQvJWlkJT9hdXRvcGxheT0xXCJ9LHZpbWVvOntpbmRleDpcInZpbWVvLmNvbS9cIixpZDpcIi9cIixzcmM6XCIvL3BsYXllci52aW1lby5jb20vdmlkZW8vJWlkJT9hdXRvcGxheT0xXCJ9LGdtYXBzOntpbmRleDpcIi8vbWFwcy5nb29nbGUuXCIsc3JjOlwiJWlkJSZvdXRwdXQ9ZW1iZWRcIn19fSxwcm90bzp7aW5pdElmcmFtZTpmdW5jdGlvbigpe24udHlwZXMucHVzaChQKSx3KFwiQmVmb3JlQ2hhbmdlXCIsZnVuY3Rpb24oYSxiLGMpe2IhPT1jJiYoYj09PVA/UigpOmM9PT1QJiZSKCEwKSl9KSx3KGIrXCIuXCIrUCxmdW5jdGlvbigpe1IoKX0pfSxnZXRJZnJhbWU6ZnVuY3Rpb24oYixjKXt2YXIgZD1iLnNyYyxlPW4uc3QuaWZyYW1lO2EuZWFjaChlLnBhdHRlcm5zLGZ1bmN0aW9uKCl7aWYoZC5pbmRleE9mKHRoaXMuaW5kZXgpPi0xKXJldHVybiB0aGlzLmlkJiYodHlwZW9mIHRoaXMuaWQ9PVwic3RyaW5nXCI/ZD1kLnN1YnN0cihkLmxhc3RJbmRleE9mKHRoaXMuaWQpK3RoaXMuaWQubGVuZ3RoLGQubGVuZ3RoKTpkPXRoaXMuaWQuY2FsbCh0aGlzLGQpKSxkPXRoaXMuc3JjLnJlcGxhY2UoXCIlaWQlXCIsZCksITF9KTt2YXIgZj17fTtyZXR1cm4gZS5zcmNBY3Rpb24mJihmW2Uuc3JjQWN0aW9uXT1kKSxuLl9wYXJzZU1hcmt1cChjLGYsYiksbi51cGRhdGVTdGF0dXMoXCJyZWFkeVwiKSxjfX19KTt2YXIgUz1mdW5jdGlvbihhKXt2YXIgYj1uLml0ZW1zLmxlbmd0aDtyZXR1cm4gYT5iLTE/YS1iOmE8MD9iK2E6YX0sVD1mdW5jdGlvbihhLGIsYyl7cmV0dXJuIGEucmVwbGFjZSgvJWN1cnIlL2dpLGIrMSkucmVwbGFjZSgvJXRvdGFsJS9naSxjKX07YS5tYWduaWZpY1BvcHVwLnJlZ2lzdGVyTW9kdWxlKFwiZ2FsbGVyeVwiLHtvcHRpb25zOntlbmFibGVkOiExLGFycm93TWFya3VwOic8YnV0dG9uIHRpdGxlPVwiJXRpdGxlJVwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cIm1mcC1hcnJvdyBtZnAtYXJyb3ctJWRpciVcIj48L2J1dHRvbj4nLHByZWxvYWQ6WzAsMl0sbmF2aWdhdGVCeUltZ0NsaWNrOiEwLGFycm93czohMCx0UHJldjpcIlByZXZpb3VzIChMZWZ0IGFycm93IGtleSlcIix0TmV4dDpcIk5leHQgKFJpZ2h0IGFycm93IGtleSlcIix0Q291bnRlcjpcIiVjdXJyJSBvZiAldG90YWwlXCJ9LHByb3RvOntpbml0R2FsbGVyeTpmdW5jdGlvbigpe3ZhciBjPW4uc3QuZ2FsbGVyeSxkPVwiLm1mcC1nYWxsZXJ5XCI7bi5kaXJlY3Rpb249ITA7aWYoIWN8fCFjLmVuYWJsZWQpcmV0dXJuITE7dSs9XCIgbWZwLWdhbGxlcnlcIix3KGcrZCxmdW5jdGlvbigpe2MubmF2aWdhdGVCeUltZ0NsaWNrJiZuLndyYXAub24oXCJjbGlja1wiK2QsXCIubWZwLWltZ1wiLGZ1bmN0aW9uKCl7aWYobi5pdGVtcy5sZW5ndGg+MSlyZXR1cm4gbi5uZXh0KCksITF9KSxzLm9uKFwia2V5ZG93blwiK2QsZnVuY3Rpb24oYSl7YS5rZXlDb2RlPT09Mzc/bi5wcmV2KCk6YS5rZXlDb2RlPT09MzkmJm4ubmV4dCgpfSl9KSx3KFwiVXBkYXRlU3RhdHVzXCIrZCxmdW5jdGlvbihhLGIpe2IudGV4dCYmKGIudGV4dD1UKGIudGV4dCxuLmN1cnJJdGVtLmluZGV4LG4uaXRlbXMubGVuZ3RoKSl9KSx3KGYrZCxmdW5jdGlvbihhLGIsZCxlKXt2YXIgZj1uLml0ZW1zLmxlbmd0aDtkLmNvdW50ZXI9Zj4xP1QoYy50Q291bnRlcixlLmluZGV4LGYpOlwiXCJ9KSx3KFwiQnVpbGRDb250cm9sc1wiK2QsZnVuY3Rpb24oKXtpZihuLml0ZW1zLmxlbmd0aD4xJiZjLmFycm93cyYmIW4uYXJyb3dMZWZ0KXt2YXIgYj1jLmFycm93TWFya3VwLGQ9bi5hcnJvd0xlZnQ9YShiLnJlcGxhY2UoLyV0aXRsZSUvZ2ksYy50UHJldikucmVwbGFjZSgvJWRpciUvZ2ksXCJsZWZ0XCIpKS5hZGRDbGFzcyhtKSxlPW4uYXJyb3dSaWdodD1hKGIucmVwbGFjZSgvJXRpdGxlJS9naSxjLnROZXh0KS5yZXBsYWNlKC8lZGlyJS9naSxcInJpZ2h0XCIpKS5hZGRDbGFzcyhtKTtkLmNsaWNrKGZ1bmN0aW9uKCl7bi5wcmV2KCl9KSxlLmNsaWNrKGZ1bmN0aW9uKCl7bi5uZXh0KCl9KSxuLmNvbnRhaW5lci5hcHBlbmQoZC5hZGQoZSkpfX0pLHcoaCtkLGZ1bmN0aW9uKCl7bi5fcHJlbG9hZFRpbWVvdXQmJmNsZWFyVGltZW91dChuLl9wcmVsb2FkVGltZW91dCksbi5fcHJlbG9hZFRpbWVvdXQ9c2V0VGltZW91dChmdW5jdGlvbigpe24ucHJlbG9hZE5lYXJieUltYWdlcygpLG4uX3ByZWxvYWRUaW1lb3V0PW51bGx9LDE2KX0pLHcoYitkLGZ1bmN0aW9uKCl7cy5vZmYoZCksbi53cmFwLm9mZihcImNsaWNrXCIrZCksbi5hcnJvd1JpZ2h0PW4uYXJyb3dMZWZ0PW51bGx9KX0sbmV4dDpmdW5jdGlvbigpe24uZGlyZWN0aW9uPSEwLG4uaW5kZXg9UyhuLmluZGV4KzEpLG4udXBkYXRlSXRlbUhUTUwoKX0scHJldjpmdW5jdGlvbigpe24uZGlyZWN0aW9uPSExLG4uaW5kZXg9UyhuLmluZGV4LTEpLG4udXBkYXRlSXRlbUhUTUwoKX0sZ29UbzpmdW5jdGlvbihhKXtuLmRpcmVjdGlvbj1hPj1uLmluZGV4LG4uaW5kZXg9YSxuLnVwZGF0ZUl0ZW1IVE1MKCl9LHByZWxvYWROZWFyYnlJbWFnZXM6ZnVuY3Rpb24oKXt2YXIgYT1uLnN0LmdhbGxlcnkucHJlbG9hZCxiPU1hdGgubWluKGFbMF0sbi5pdGVtcy5sZW5ndGgpLGM9TWF0aC5taW4oYVsxXSxuLml0ZW1zLmxlbmd0aCksZDtmb3IoZD0xO2Q8PShuLmRpcmVjdGlvbj9jOmIpO2QrKyluLl9wcmVsb2FkSXRlbShuLmluZGV4K2QpO2ZvcihkPTE7ZDw9KG4uZGlyZWN0aW9uP2I6Yyk7ZCsrKW4uX3ByZWxvYWRJdGVtKG4uaW5kZXgtZCl9LF9wcmVsb2FkSXRlbTpmdW5jdGlvbihiKXtiPVMoYik7aWYobi5pdGVtc1tiXS5wcmVsb2FkZWQpcmV0dXJuO3ZhciBjPW4uaXRlbXNbYl07Yy5wYXJzZWR8fChjPW4ucGFyc2VFbChiKSkseShcIkxhenlMb2FkXCIsYyksYy50eXBlPT09XCJpbWFnZVwiJiYoYy5pbWc9YSgnPGltZyBjbGFzcz1cIm1mcC1pbWdcIiAvPicpLm9uKFwibG9hZC5tZnBsb2FkZXJcIixmdW5jdGlvbigpe2MuaGFzU2l6ZT0hMH0pLm9uKFwiZXJyb3IubWZwbG9hZGVyXCIsZnVuY3Rpb24oKXtjLmhhc1NpemU9ITAsYy5sb2FkRXJyb3I9ITAseShcIkxhenlMb2FkRXJyb3JcIixjKX0pLmF0dHIoXCJzcmNcIixjLnNyYykpLGMucHJlbG9hZGVkPSEwfX19KTt2YXIgVT1cInJldGluYVwiO2EubWFnbmlmaWNQb3B1cC5yZWdpc3Rlck1vZHVsZShVLHtvcHRpb25zOntyZXBsYWNlU3JjOmZ1bmN0aW9uKGEpe3JldHVybiBhLnNyYy5yZXBsYWNlKC9cXC5cXHcrJC8sZnVuY3Rpb24oYSl7cmV0dXJuXCJAMnhcIithfSl9LHJhdGlvOjF9LHByb3RvOntpbml0UmV0aW5hOmZ1bmN0aW9uKCl7aWYod2luZG93LmRldmljZVBpeGVsUmF0aW8+MSl7dmFyIGE9bi5zdC5yZXRpbmEsYj1hLnJhdGlvO2I9aXNOYU4oYik/YigpOmIsYj4xJiYodyhcIkltYWdlSGFzU2l6ZS5cIitVLGZ1bmN0aW9uKGEsYyl7Yy5pbWcuY3NzKHtcIm1heC13aWR0aFwiOmMuaW1nWzBdLm5hdHVyYWxXaWR0aC9iLHdpZHRoOlwiMTAwJVwifSl9KSx3KFwiRWxlbWVudFBhcnNlLlwiK1UsZnVuY3Rpb24oYyxkKXtkLnNyYz1hLnJlcGxhY2VTcmMoZCxiKX0pKX19fX0pLEEoKX0pIiwiLyoqXG4gKiBGaWxlIGpzLWVuYWJsZWQuanNcbiAqXG4gKiBJZiBKYXZhc2NyaXB0IGlzIGVuYWJsZWQsIHJlcGxhY2UgdGhlIDxib2R5PiBjbGFzcyBcIm5vLWpzXCIuXG4gKi9cbmRvY3VtZW50LmJvZHkuY2xhc3NOYW1lID0gZG9jdW1lbnQuYm9keS5jbGFzc05hbWUucmVwbGFjZSggJ25vLWpzJywgJ2pzJyApOyIsIi8qKlxuICogRmlsZSBtb2RhbC5qc1xuICpcbiAqIERlYWwgd2l0aCBtdWx0aXBsZSBtb2RhbHMgYW5kIHRoZWlyIG1lZGlhLlxuICovXG53aW5kb3cuV0RTX01vZGFsID0ge307XG5cbiggZnVuY3Rpb24gKCB3aW5kb3csICQsIGFwcCApIHtcblxuXHQvLyBDb25zdHJ1Y3Rvci5cblx0YXBwLmluaXQgPSBmdW5jdGlvbigpIHtcblx0XHRhcHAuY2FjaGUoKTtcblxuXHRcdGlmICggYXBwLm1lZXRzUmVxdWlyZW1lbnRzKCkgKSB7XG5cdFx0XHRhcHAuYmluZEV2ZW50cygpO1xuXHRcdH1cblx0fTtcblxuXHQvLyBDYWNoZSBhbGwgdGhlIHRoaW5ncy5cblx0YXBwLmNhY2hlID0gZnVuY3Rpb24oKSB7XG5cdFx0YXBwLiRjID0ge1xuXHRcdFx0Ym9keTogJCggJ2JvZHknICksXG5cdFx0fTtcblx0fTtcblxuXHQvLyBEbyB3ZSBtZWV0IHRoZSByZXF1aXJlbWVudHM/XG5cdGFwcC5tZWV0c1JlcXVpcmVtZW50cyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkKCAnLm1vZGFsLXRyaWdnZXInICkubGVuZ3RoO1xuXHR9O1xuXG5cdC8vIENvbWJpbmUgYWxsIGV2ZW50cy5cblx0YXBwLmJpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcblxuXHRcdC8vIFRyaWdlciBhIG1vZGFsIHRvIG9wZW5cblx0XHRhcHAuJGMuYm9keS5vbiggJ2NsaWNrJywgJy5tb2RhbC10cmlnZ2VyJywgYXBwLm9wZW5Nb2RhbCApO1xuXG5cdFx0Ly8gVHJpZ2dlciB0aGUgY2xvc2UgYnV0dG9uIHRvIGNsb3NlIHRoZSBtb2RhbFxuXHRcdGFwcC4kYy5ib2R5Lm9uKCAnY2xpY2snLCAnLmNsb3NlJywgYXBwLmNsb3NlTW9kYWwgKTtcblxuXHRcdC8vIEFsbG93IHRoZSB1c2VyIHRvIGNsb3NlIHRoZSBtb2RhbCBieSBoaXR0aW5nIHRoZSBlc2Mga2V5XG5cdFx0YXBwLiRjLmJvZHkub24oICdrZXlkb3duJywgYXBwLmVzY0tleUNsb3NlICk7XG5cblx0XHQvLyBBbGxvdyB0aGUgdXNlciB0byBjbG9zZSB0aGUgbW9kYWwgYnkgY2xpY2tpbmcgb3V0c2lkZSBvZiB0aGUgbW9kYWxcblx0XHRhcHAuJGMuYm9keS5vbiggJ2NsaWNrJywgJ2Rpdi5tb2RhbC1vcGVuJywgYXBwLmNsb3NlTW9kYWxCeUNsaWNrICk7XG5cdH07XG5cblx0Ly8gT3BlbiB0aGUgbW9kYWwuXG5cdGFwcC5vcGVuTW9kYWwgPSBmdW5jdGlvbigpIHtcblxuXHRcdC8vIEZpZ3VyZSBvdXQgd2hpY2ggbW9kYWwgd2UncmUgb3BlbmluZyBhbmQgc3RvcmUgdGhlIG9iamVjdC5cblx0XHR2YXIgJG1vZGFsID0gJCggJCggdGhpcyApLmRhdGEoICd0YXJnZXQnICkgKTtcblxuXHRcdC8vIERpc3BsYXkgdGhlIG1vZGFsLlxuXHRcdCRtb2RhbC5hZGRDbGFzcyggJ21vZGFsLW9wZW4nICk7XG5cblx0XHQvLyBBZGQgYm9keSBjbGFzcy5cblx0XHRhcHAuJGMuYm9keS5hZGRDbGFzcyggJ21vZGFsLW9wZW4nICk7XG5cdH07XG5cblx0Ly8gQ2xvc2UgdGhlIG1vZGFsLlxuXHRhcHAuY2xvc2VNb2RhbCA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0Ly8gRmlndXJlIHRoZSBvcGVuZWQgbW9kYWwgd2UncmUgY2xvc2luZyBhbmQgc3RvcmUgdGhlIG9iamVjdC5cblx0XHR2YXIgJG1vZGFsID0gJCggJCggJ2Rpdi5tb2RhbC1vcGVuIC5jbG9zZScgKS5kYXRhKCAndGFyZ2V0JyApICk7XG5cblx0XHQvLyBGaW5kIHRoZSBpZnJhbWUgaW4gdGhlICRtb2RhbCBvYmplY3QuXG5cdFx0dmFyICRpZnJhbWUgPSAkbW9kYWwuZmluZCggJ2lmcmFtZScgKTtcblxuXHRcdC8vIEdldCB0aGUgaWZyYW1lIHNyYyBVUkwuXG5cdFx0dmFyIHVybCA9ICRpZnJhbWUuYXR0ciggJ3NyYycgKTtcblxuXHRcdC8vIFJlbW92ZSB0aGUgc291cmNlIFVSTCwgdGhlbiBhZGQgaXQgYmFjaywgc28gdGhlIHZpZGVvIGNhbiBiZSBwbGF5ZWQgYWdhaW4gbGF0ZXIuXG5cdFx0JGlmcmFtZS5hdHRyKCAnc3JjJywgJycgKS5hdHRyKCAnc3JjJywgdXJsICk7XG5cblx0XHQvLyBGaW5hbGx5LCBoaWRlIHRoZSBtb2RhbC5cblx0XHQkbW9kYWwucmVtb3ZlQ2xhc3MoICdtb2RhbC1vcGVuJyApO1xuXG5cdFx0Ly8gUmVtb3ZlIHRoZSBib2R5IGNsYXNzLlxuXHRcdGFwcC4kYy5ib2R5LnJlbW92ZUNsYXNzKCAnbW9kYWwtb3BlbicgKTtcblx0fTtcblxuXHQvLyBDbG9zZSBpZiBcImVzY1wiIGtleSBpcyBwcmVzc2VkLlxuXHRhcHAuZXNjS2V5Q2xvc2UgPSBmdW5jdGlvbihlKSB7XG5cdFx0aWYgKCAyNyA9PSBlLmtleUNvZGUgKSB7XG5cdFx0XHRhcHAuY2xvc2VNb2RhbCgpO1xuXHRcdH1cblx0fTtcblxuXHQvLyBDbG9zZSBpZiB0aGUgdXNlciBjbGlja3Mgb3V0c2lkZSBvZiB0aGUgbW9kYWxcblx0YXBwLmNsb3NlTW9kYWxCeUNsaWNrID0gZnVuY3Rpb24oZSkge1xuXG5cdFx0Ly8gSWYgdGhlIHBhcmVudCBjb250YWluZXIgaXMgTk9UIHRoZSBtb2RhbCBkaWFsb2cgY29udGFpbmVyLCBjbG9zZSB0aGUgbW9kYWxcblx0XHRpZiAoICEgJCggZS50YXJnZXQgKS5wYXJlbnRzKCAnZGl2JyApLmhhc0NsYXNzKCAnbW9kYWwtZGlhbG9nJyApICkge1xuXHRcdFx0YXBwLmNsb3NlTW9kYWwoKTtcblx0XHR9XG5cdH07XG5cblx0Ly8gRW5nYWdlIVxuXHQkKCBhcHAuaW5pdCApO1xuXG59ICkoIHdpbmRvdywgalF1ZXJ5LCB3aW5kb3cuV0RTX01vZGFsICk7IiwiLypcclxuXHRzY3JpcHRzLmpzXHJcblxyXG5cdExpY2Vuc2U6IEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHYzLjBcclxuXHRMaWNlbnNlIFVSSTogaHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzL2dwbC0zLjAuaHRtbFxyXG5cclxuXHRDb3B5cmlnaHQ6IChjKSAyMDEzIEFsZXhhbmRlciBcIkFseFwiIEFnbmFyc29uLCBodHRwOi8vYWx4bWVkaWEuc2VcclxuKi9cclxuXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxualF1ZXJ5KGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigkKSB7XHJcblxyXG5cclxuJCgnLmxhenlsb2FkJykubGF6eWxvYWQoe1xyXG4gIC8vIFNldHMgdGhlIHBpeGVscyB0byBsb2FkIGVhcmxpZXIuIFNldHRpbmcgdGhyZXNob2xkIHRvIDIwMCBjYXVzZXMgaW1hZ2UgdG8gbG9hZCAyMDAgcGl4ZWxzXHJcbiAgLy8gYmVmb3JlIGl0IGFwcGVhcnMgb24gdmlld3BvcnQuIEl0IHNob3VsZCBiZSBncmVhdGVyIG9yIGVxdWFsIHplcm8uXHJcbiAgdGhyZXNob2xkOiAwLFxyXG5cclxuICAvLyBTZXRzIHRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIHRoZSBsb2FkIGV2ZW50IGlzIGZpcmluZy5cclxuICAvLyBlbGVtZW50OiBUaGUgY29udGVudCBpbiBsYXp5bG9hZCB0YWcgd2lsbCBiZSByZXR1cm5lZCBhcyBhIGpRdWVyeSBvYmplY3QuXHJcbiAgbG9hZDogZnVuY3Rpb24oZWxlbWVudCkge30sXHJcblxyXG4gIC8vIFNldHMgZXZlbnRzIHRvIHRyaWdnZXIgbGF6eWxvYWQuIERlZmF1bHQgaXMgY3VzdG9taXplZCBldmVudCBgYXBwZWFyYCwgaXQgd2lsbCB0cmlnZ2VyIHdoZW5cclxuICAvLyBlbGVtZW50IGFwcGVhciBpbiBzY3JlZW4uIFlvdSBjb3VsZCBzZXQgb3RoZXIgZXZlbnRzIGluY2x1ZGluZyBlYWNoIG9uZSBzZXBhcmF0ZWQgYnkgYSBzcGFjZS5cclxuICB0cmlnZ2VyOiBcImFwcGVhciB0b3VjaHN0YXJ0XCJcclxufSk7XHJcblxyXG4vLyAkKCcubGlnaHRib3gnKS5tYWduaWZpY1BvcHVwKHt0eXBlOidpbWFnZSd9KTtcclxuLy8gJCgnLndwYi1tb2RhbC1pbWFnZScpLm1hZ25pZmljUG9wdXAoe3R5cGU6J2ltYWdlJ30pO1xyXG5cclxualF1ZXJ5KCAnYXJ0aWNsZScgKS5tYWduaWZpY1BvcHVwKHtcclxuICAgICAgICB0eXBlOiAnaW1hZ2UnLFxyXG4gICAgICAgIGRlbGVnYXRlOiBcIi53cGItbW9kYWwtaW1hZ2VcIixcclxuICAgICAgICBnYWxsZXJ5OiB7XHJcbiAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIHByZWxvYWQ6IFswLDJdLFxyXG5cdFx0XHRuYXZpZ2F0ZUJ5SW1nQ2xpY2s6IHRydWUsXHJcblx0XHRcdGFycm93TWFya3VwOiAnPHNwYW4gY2xhc3M9XCJtZnAtYXJyb3cgbWZwLWFycm93LSVkaXIlXCIgdGl0bGU9XCIldGl0bGUlXCI+PGkgY2xhc3M9XCJmYSBmYS0yeCBmYS1hbmdsZS0lZGlyJVwiPjwvaT48L3NwYW4+JyxcclxuXHRcdFx0dFByZXY6ICdQcmV2aW91cycsXHJcblx0XHRcdHROZXh0OiAnTmV4dCcsXHJcblx0XHRcdHRDb3VudGVyOiAnPHNwYW4gY2xhc3M9XCJtZnAtY291bnRlclwiPiVjdXJyJSBvZiAldG90YWwlPC9zcGFuPidcclxuICAgICAgICB9LFxyXG59KTtcclxuXHJcbi8vIEFkZCBtb2RhbCBuYXRpdmUgd29yZHByZXNzIGdhbGxlcnlcclxualF1ZXJ5KCAnLmdhbGxlcnknICkubWFnbmlmaWNQb3B1cCh7XHJcbiAgICAgICAgdHlwZTogJ2ltYWdlJyxcclxuICAgICAgICBkZWxlZ2F0ZTogXCIuZ2FsbGVyeS1pY29uID4gYVwiLFxyXG4gICAgICAgIGdhbGxlcnk6IHtcclxuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgcHJlbG9hZDogWzAsMl0sXHJcblx0XHRcdG5hdmlnYXRlQnlJbWdDbGljazogdHJ1ZSxcclxuXHRcdFx0YXJyb3dNYXJrdXA6ICc8c3BhbiBjbGFzcz1cIm1mcC1hcnJvdyBtZnAtYXJyb3ctJWRpciVcIiB0aXRsZT1cIiV0aXRsZSVcIj48aSBjbGFzcz1cImZhIGZhLTJ4IGZhLWFuZ2xlLSVkaXIlXCI+PC9pPjwvc3Bhbj4nLFxyXG5cdFx0XHR0UHJldjogJ1ByZXZpb3VzJyxcclxuXHRcdFx0dE5leHQ6ICdOZXh0JyxcclxuXHRcdFx0dENvdW50ZXI6ICc8c3BhbiBjbGFzcz1cIm1mcC1jb3VudGVyXCI+JWN1cnIlIG9mICV0b3RhbCU8L3NwYW4+J1xyXG4gICAgICAgIH0sXHJcbn0pO1xyXG5cclxuXHJcblxyXG4vKiAgVG9nZ2xlIGhlYWRlciBzZWFyY2hcclxuLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcblx0JCgnLnRvZ2dsZS1zZWFyY2gnKS5jbGljayhmdW5jdGlvbigpe1xyXG5cdFx0JCgnLnRvZ2dsZS1zZWFyY2gnKS50b2dnbGVDbGFzcygnYWN0aXZlJyk7XHJcblx0XHQkKCcuc2VhcmNoLWV4cGFuZCcpLmZhZGVUb2dnbGUoMjUwKTtcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgJCgnLnNlYXJjaC1leHBhbmQgaW5wdXQnKS5mb2N1cygpO1xyXG4gICAgICAgICAgICB9LCAzMDApO1xyXG5cdH0pO1xyXG5cclxuLyogIFNjcm9sbCB0byB0b3BcclxuLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcblx0JCgnYSNnb3RvdG9wJykuY2xpY2soZnVuY3Rpb24oKSB7XHJcblx0XHQkKCdodG1sLCBib2R5JykuYW5pbWF0ZSh7c2Nyb2xsVG9wOjB9LCdzbG93Jyk7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fSk7XHJcblxyXG4vKiAgQ29tbWVudHMgLyBwaW5nYmFja3MgdGFic1xyXG4vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cclxuICAgICQoXCIudGFicyAudGFicy10aXRsZVwiKS5jbGljayhmdW5jdGlvbigpIHtcclxuICAgICAgICAkKFwiLnRhYnMgLnRhYnMtdGl0bGVcIikucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJpcy1hY3RpdmVcIik7XHJcbiAgICAgICAgJChcIi50YWJzLWNvbnRlbnQgLnRhYnMtcGFuZWxcIikucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpLmhpZGUoKTtcclxuICAgICAgICB2YXIgc2VsZWN0ZWRfdGFiID0gJCh0aGlzKS5maW5kKFwiYVwiKS5hdHRyKFwiaHJlZlwiKTtcclxuICAgICAgICAkKHNlbGVjdGVkX3RhYikuZmFkZUluKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coc2VsZWN0ZWRfdGFiKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuXHJcbi8qICBUYWJsZSBvZGQgcm93IGNsYXNzXHJcbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xyXG5cdCQoJ3RhYmxlIHRyOm9kZCcpLmFkZENsYXNzKCdhbHQnKTtcclxuXHJcblxyXG4vKiAgRHJvcGRvd24gbWVudSBhbmltYXRpb25cclxuLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcblx0JCgnLm5hdiB1bC5zdWItbWVudScpLmhpZGUoKTtcclxuXHQkKCcubmF2IGxpJykuaG92ZXIoXHJcblx0XHRmdW5jdGlvbigpIHtcclxuXHRcdFx0JCh0aGlzKS5jaGlsZHJlbigndWwuc3ViLW1lbnUnKS5zbGlkZURvd24oJ2Zhc3QnKTtcclxuXHRcdH0sXHJcblx0XHRmdW5jdGlvbigpIHtcclxuXHRcdFx0JCh0aGlzKS5jaGlsZHJlbigndWwuc3ViLW1lbnUnKS5oaWRlKCk7XHJcblx0XHR9XHJcblx0KTtcclxuXHJcbi8qICBNb2JpbGUgbWVudSBzbW9vdGggdG9nZ2xlIGhlaWdodFxyXG4vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cclxuXHQkKCcubmF2LXRvZ2dsZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG5cdFx0c2xpZGUoJCgnLm5hdi13cmFwIC5uYXYnLCAkKHRoaXMpLnBhcmVudCgpKSk7XHJcblx0fSk7XHJcblxyXG5cdGZ1bmN0aW9uIHNsaWRlKGNvbnRlbnQpIHtcclxuXHRcdHZhciB3cmFwcGVyID0gY29udGVudC5wYXJlbnQoKTtcclxuXHRcdHZhciBjb250ZW50SGVpZ2h0ID0gY29udGVudC5vdXRlckhlaWdodCh0cnVlKTtcclxuXHRcdHZhciB3cmFwcGVySGVpZ2h0ID0gd3JhcHBlci5oZWlnaHQoKTtcclxuXHJcblx0XHR3cmFwcGVyLnRvZ2dsZUNsYXNzKCdleHBhbmQnKTtcclxuXHRcdGlmICh3cmFwcGVyLmhhc0NsYXNzKCdleHBhbmQnKSkge1xyXG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0d3JhcHBlci5hZGRDbGFzcygndHJhbnNpdGlvbicpLmNzcygnaGVpZ2h0JywgY29udGVudEhlaWdodCk7XHJcblx0XHR9LCAxMCk7XHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0d3JhcHBlci5jc3MoJ2hlaWdodCcsIHdyYXBwZXJIZWlnaHQpO1xyXG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR3cmFwcGVyLmFkZENsYXNzKCd0cmFuc2l0aW9uJykuY3NzKCdoZWlnaHQnLCAwKTtcclxuXHRcdFx0fSwgMTApO1xyXG5cdFx0fSwgMTApO1xyXG5cdH1cclxuXHJcblx0d3JhcHBlci5vbmUoJ3RyYW5zaXRpb25FbmQgd2Via2l0VHJhbnNpdGlvbkVuZCB0cmFuc2l0aW9uZW5kIG9UcmFuc2l0aW9uRW5kIG1zVHJhbnNpdGlvbkVuZCcsIGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYod3JhcHBlci5oYXNDbGFzcygnb3BlbicpKSB7XHJcblx0XHRcdHdyYXBwZXIucmVtb3ZlQ2xhc3MoJ3RyYW5zaXRpb24nKS5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XHJcblx0XHR9XHJcblx0fSk7XHJcblx0fVxyXG5cclxufSk7IiwiLyoqXG4gKiBGaWxlIHNlYXJjaC5qc1xuICpcbiAqIERlYWwgd2l0aCB0aGUgc2VhcmNoIGZvcm0uXG4gKi9cbndpbmRvdy5XRFNfU2VhcmNoID0ge307XG5cbiggZnVuY3Rpb24gKCB3aW5kb3csICQsIGFwcCApIHtcblxuXHQvLyBDb25zdHJ1Y3Rvci5cblx0YXBwLmluaXQgPSBmdW5jdGlvbigpIHtcblx0XHRhcHAuY2FjaGUoKTtcblxuXHRcdGlmICggYXBwLm1lZXRzUmVxdWlyZW1lbnRzKCkgKSB7XG5cdFx0XHRhcHAuYmluZEV2ZW50cygpO1xuXHRcdH1cblx0fTtcblxuXHQvLyBDYWNoZSBhbGwgdGhlIHRoaW5ncy5cblx0YXBwLmNhY2hlID0gZnVuY3Rpb24oKSB7XG5cdFx0YXBwLiRjID0ge1xuXHRcdFx0Ym9keTogJCggJ2JvZHknICksXG5cdFx0fTtcblx0fTtcblxuXHQvLyBEbyB3ZSBtZWV0IHRoZSByZXF1aXJlbWVudHM/XG5cdGFwcC5tZWV0c1JlcXVpcmVtZW50cyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkKCAnLnNlYXJjaC1maWVsZCcgKS5sZW5ndGg7XG5cdH07XG5cblx0Ly8gQ29tYmluZSBhbGwgZXZlbnRzLlxuXHRhcHAuYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0Ly8gUmVtb3ZlIHBsYWNlaG9sZGVyIHRleHQgZnJvbSBzZWFyY2ggZmllbGQgb24gZm9jdXMuXG5cdFx0YXBwLiRjLmJvZHkub24oICdmb2N1cycsICcuc2VhcmNoLWZpZWxkJywgYXBwLnJlbW92ZVBsYWNlaG9sZGVyVGV4dCApO1xuXG5cdFx0Ly8gQWRkIHBsYWNlaG9sZGVyIHRleHQgYmFjayB0byBzZWFyY2ggZmllbGQgb24gYmx1ci5cblx0XHRhcHAuJGMuYm9keS5vbiggJ2JsdXInLCAnLnNlYXJjaC1maWVsZCcsIGFwcC5hZGRQbGFjZWhvbGRlclRleHQgKTtcblx0fTtcblxuXHQvLyBSZW1vdmUgcGxhY2Vob2xkZXIgdGV4dCBmcm9tIHNlYXJjaCBmaWVsZC5cblx0YXBwLnJlbW92ZVBsYWNlaG9sZGVyVGV4dCA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0dmFyICRzZWFyY2hfZmllbGQgPSAkKCB0aGlzICk7XG5cblx0XHQkc2VhcmNoX2ZpZWxkLmRhdGEoICdwbGFjZWhvbGRlcicsICRzZWFyY2hfZmllbGQuYXR0ciggJ3BsYWNlaG9sZGVyJyApICkuYXR0ciggJ3BsYWNlaG9sZGVyJywgJycgKTtcblx0fTtcblxuXHQvLyBSZXBsYWNlIHBsYWNlaG9sZGVyIHRleHQgZnJvbSBzZWFyY2ggZmllbGQuXG5cdGFwcC5hZGRQbGFjZWhvbGRlclRleHQgPSBmdW5jdGlvbigpIHtcblxuXHRcdHZhciAkc2VhcmNoX2ZpZWxkID0gJCggdGhpcyApO1xuXG5cdFx0JHNlYXJjaF9maWVsZC5hdHRyKCAncGxhY2Vob2xkZXInLCAkc2VhcmNoX2ZpZWxkLmRhdGEoICdwbGFjZWhvbGRlcicgKSApLmRhdGEoICdwbGFjZWhvbGRlcicsICcnICk7XG5cdH07XG5cblx0Ly8gRW5nYWdlIVxuXHQkKCBhcHAuaW5pdCApO1xuXG59ICkoIHdpbmRvdywgalF1ZXJ5LCB3aW5kb3cuV0RTX1NlYXJjaCApOyIsIi8qKlxuICogRmlsZSBza2lwLWxpbmstZm9jdXMtZml4LmpzLlxuICpcbiAqIEhlbHBzIHdpdGggYWNjZXNzaWJpbGl0eSBmb3Iga2V5Ym9hcmQgb25seSB1c2Vycy5cbiAqXG4gKiBMZWFybiBtb3JlOiBodHRwczovL2dpdC5pby92V2RyMlxuICovXG4oIGZ1bmN0aW9uKCkge1xuXHR2YXIgaXNXZWJraXQgPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZiggJ3dlYmtpdCcgKSA+IC0xLFxuXHQgICAgaXNPcGVyYSAgPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZiggJ29wZXJhJyApICA+IC0xLFxuXHQgICAgaXNJZSAgICAgPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZiggJ21zaWUnICkgICA+IC0xO1xuXG5cdGlmICggKCBpc1dlYmtpdCB8fCBpc09wZXJhIHx8IGlzSWUgKSAmJiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciApIHtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ2hhc2hjaGFuZ2UnLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBpZCA9IGxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKCAxICksXG5cdFx0XHRcdGVsZW1lbnQ7XG5cblx0XHRcdGlmICggISAoIC9eW0EtejAtOV8tXSskLy50ZXN0KCBpZCApICkgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0ZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBpZCApO1xuXG5cdFx0XHRpZiAoIGVsZW1lbnQgKSB7XG5cdFx0XHRcdGlmICggISAoIC9eKD86YXxzZWxlY3R8aW5wdXR8YnV0dG9ufHRleHRhcmVhKSQvaS50ZXN0KCBlbGVtZW50LnRhZ05hbWUgKSApICkge1xuXHRcdFx0XHRcdGVsZW1lbnQudGFiSW5kZXggPSAtMTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVsZW1lbnQuZm9jdXMoKTtcblx0XHRcdH1cblx0XHR9LCBmYWxzZSApO1xuXHR9XG59KSgpOyIsIi8qXG4gICAgIF8gXyAgICAgIF8gICAgICAgX1xuIF9fX3wgKF8pIF9fX3wgfCBfXyAgKF8pX19fXG4vIF9ffCB8IHwvIF9ffCB8LyAvICB8IC8gX198XG5cXF9fIFxcIHwgfCAoX198ICAgPCBfIHwgXFxfXyBcXFxufF9fXy9ffF98XFxfX198X3xcXF8oXykvIHxfX18vXG4gICAgICAgICAgICAgICAgICAgfF9fL1xuXG4gVmVyc2lvbjogMS42LjBcbiAgQXV0aG9yOiBLZW4gV2hlZWxlclxuIFdlYnNpdGU6IGh0dHA6Ly9rZW53aGVlbGVyLmdpdGh1Yi5pb1xuICAgIERvY3M6IGh0dHA6Ly9rZW53aGVlbGVyLmdpdGh1Yi5pby9zbGlja1xuICAgIFJlcG86IGh0dHA6Ly9naXRodWIuY29tL2tlbndoZWVsZXIvc2xpY2tcbiAgSXNzdWVzOiBodHRwOi8vZ2l0aHViLmNvbS9rZW53aGVlbGVyL3NsaWNrL2lzc3Vlc1xuXG4gKi9cbiFmdW5jdGlvbihhKXtcInVzZSBzdHJpY3RcIjtcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQ/ZGVmaW5lKFtcImpxdWVyeVwiXSxhKTpcInVuZGVmaW5lZFwiIT10eXBlb2YgZXhwb3J0cz9tb2R1bGUuZXhwb3J0cz1hKHJlcXVpcmUoXCJqcXVlcnlcIikpOmEoalF1ZXJ5KX0oZnVuY3Rpb24oYSl7XCJ1c2Ugc3RyaWN0XCI7dmFyIGI9d2luZG93LlNsaWNrfHx7fTtiPWZ1bmN0aW9uKCl7ZnVuY3Rpb24gYyhjLGQpe3ZhciBmLGU9dGhpcztlLmRlZmF1bHRzPXthY2Nlc3NpYmlsaXR5OiEwLGFkYXB0aXZlSGVpZ2h0OiExLGFwcGVuZEFycm93czphKGMpLGFwcGVuZERvdHM6YShjKSxhcnJvd3M6ITAsYXNOYXZGb3I6bnVsbCxwcmV2QXJyb3c6JzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGRhdGEtcm9sZT1cIm5vbmVcIiBjbGFzcz1cInNsaWNrLXByZXZcIiBhcmlhLWxhYmVsPVwiUHJldmlvdXNcIiB0YWJpbmRleD1cIjBcIiByb2xlPVwiYnV0dG9uXCI+UHJldmlvdXM8L2J1dHRvbj4nLG5leHRBcnJvdzonPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgZGF0YS1yb2xlPVwibm9uZVwiIGNsYXNzPVwic2xpY2stbmV4dFwiIGFyaWEtbGFiZWw9XCJOZXh0XCIgdGFiaW5kZXg9XCIwXCIgcm9sZT1cImJ1dHRvblwiPk5leHQ8L2J1dHRvbj4nLGF1dG9wbGF5OiExLGF1dG9wbGF5U3BlZWQ6M2UzLGNlbnRlck1vZGU6ITEsY2VudGVyUGFkZGluZzpcIjUwcHhcIixjc3NFYXNlOlwiZWFzZVwiLGN1c3RvbVBhZ2luZzpmdW5jdGlvbihiLGMpe3JldHVybiBhKCc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBkYXRhLXJvbGU9XCJub25lXCIgcm9sZT1cImJ1dHRvblwiIHRhYmluZGV4PVwiMFwiIC8+JykudGV4dChjKzEpfSxkb3RzOiExLGRvdHNDbGFzczpcInNsaWNrLWRvdHNcIixkcmFnZ2FibGU6ITAsZWFzaW5nOlwibGluZWFyXCIsZWRnZUZyaWN0aW9uOi4zNSxmYWRlOiExLGZvY3VzT25TZWxlY3Q6ITEsaW5maW5pdGU6ITAsaW5pdGlhbFNsaWRlOjAsbGF6eUxvYWQ6XCJvbmRlbWFuZFwiLG1vYmlsZUZpcnN0OiExLHBhdXNlT25Ib3ZlcjohMCxwYXVzZU9uRm9jdXM6ITAscGF1c2VPbkRvdHNIb3ZlcjohMSxyZXNwb25kVG86XCJ3aW5kb3dcIixyZXNwb25zaXZlOm51bGwscm93czoxLHJ0bDohMSxzbGlkZTpcIlwiLHNsaWRlc1BlclJvdzoxLHNsaWRlc1RvU2hvdzoxLHNsaWRlc1RvU2Nyb2xsOjEsc3BlZWQ6NTAwLHN3aXBlOiEwLHN3aXBlVG9TbGlkZTohMSx0b3VjaE1vdmU6ITAsdG91Y2hUaHJlc2hvbGQ6NSx1c2VDU1M6ITAsdXNlVHJhbnNmb3JtOiEwLHZhcmlhYmxlV2lkdGg6ITEsdmVydGljYWw6ITEsdmVydGljYWxTd2lwaW5nOiExLHdhaXRGb3JBbmltYXRlOiEwLHpJbmRleDoxZTN9LGUuaW5pdGlhbHM9e2FuaW1hdGluZzohMSxkcmFnZ2luZzohMSxhdXRvUGxheVRpbWVyOm51bGwsY3VycmVudERpcmVjdGlvbjowLGN1cnJlbnRMZWZ0Om51bGwsY3VycmVudFNsaWRlOjAsZGlyZWN0aW9uOjEsJGRvdHM6bnVsbCxsaXN0V2lkdGg6bnVsbCxsaXN0SGVpZ2h0Om51bGwsbG9hZEluZGV4OjAsJG5leHRBcnJvdzpudWxsLCRwcmV2QXJyb3c6bnVsbCxzbGlkZUNvdW50Om51bGwsc2xpZGVXaWR0aDpudWxsLCRzbGlkZVRyYWNrOm51bGwsJHNsaWRlczpudWxsLHNsaWRpbmc6ITEsc2xpZGVPZmZzZXQ6MCxzd2lwZUxlZnQ6bnVsbCwkbGlzdDpudWxsLHRvdWNoT2JqZWN0Ont9LHRyYW5zZm9ybXNFbmFibGVkOiExLHVuc2xpY2tlZDohMX0sYS5leHRlbmQoZSxlLmluaXRpYWxzKSxlLmFjdGl2ZUJyZWFrcG9pbnQ9bnVsbCxlLmFuaW1UeXBlPW51bGwsZS5hbmltUHJvcD1udWxsLGUuYnJlYWtwb2ludHM9W10sZS5icmVha3BvaW50U2V0dGluZ3M9W10sZS5jc3NUcmFuc2l0aW9ucz0hMSxlLmZvY3Vzc2VkPSExLGUuaW50ZXJydXB0ZWQ9ITEsZS5oaWRkZW49XCJoaWRkZW5cIixlLnBhdXNlZD0hMCxlLnBvc2l0aW9uUHJvcD1udWxsLGUucmVzcG9uZFRvPW51bGwsZS5yb3dDb3VudD0xLGUuc2hvdWxkQ2xpY2s9ITAsZS4kc2xpZGVyPWEoYyksZS4kc2xpZGVzQ2FjaGU9bnVsbCxlLnRyYW5zZm9ybVR5cGU9bnVsbCxlLnRyYW5zaXRpb25UeXBlPW51bGwsZS52aXNpYmlsaXR5Q2hhbmdlPVwidmlzaWJpbGl0eWNoYW5nZVwiLGUud2luZG93V2lkdGg9MCxlLndpbmRvd1RpbWVyPW51bGwsZj1hKGMpLmRhdGEoXCJzbGlja1wiKXx8e30sZS5vcHRpb25zPWEuZXh0ZW5kKHt9LGUuZGVmYXVsdHMsZCxmKSxlLmN1cnJlbnRTbGlkZT1lLm9wdGlvbnMuaW5pdGlhbFNsaWRlLGUub3JpZ2luYWxTZXR0aW5ncz1lLm9wdGlvbnMsXCJ1bmRlZmluZWRcIiE9dHlwZW9mIGRvY3VtZW50Lm1vekhpZGRlbj8oZS5oaWRkZW49XCJtb3pIaWRkZW5cIixlLnZpc2liaWxpdHlDaGFuZ2U9XCJtb3p2aXNpYmlsaXR5Y2hhbmdlXCIpOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBkb2N1bWVudC53ZWJraXRIaWRkZW4mJihlLmhpZGRlbj1cIndlYmtpdEhpZGRlblwiLGUudmlzaWJpbGl0eUNoYW5nZT1cIndlYmtpdHZpc2liaWxpdHljaGFuZ2VcIiksZS5hdXRvUGxheT1hLnByb3h5KGUuYXV0b1BsYXksZSksZS5hdXRvUGxheUNsZWFyPWEucHJveHkoZS5hdXRvUGxheUNsZWFyLGUpLGUuYXV0b1BsYXlJdGVyYXRvcj1hLnByb3h5KGUuYXV0b1BsYXlJdGVyYXRvcixlKSxlLmNoYW5nZVNsaWRlPWEucHJveHkoZS5jaGFuZ2VTbGlkZSxlKSxlLmNsaWNrSGFuZGxlcj1hLnByb3h5KGUuY2xpY2tIYW5kbGVyLGUpLGUuc2VsZWN0SGFuZGxlcj1hLnByb3h5KGUuc2VsZWN0SGFuZGxlcixlKSxlLnNldFBvc2l0aW9uPWEucHJveHkoZS5zZXRQb3NpdGlvbixlKSxlLnN3aXBlSGFuZGxlcj1hLnByb3h5KGUuc3dpcGVIYW5kbGVyLGUpLGUuZHJhZ0hhbmRsZXI9YS5wcm94eShlLmRyYWdIYW5kbGVyLGUpLGUua2V5SGFuZGxlcj1hLnByb3h5KGUua2V5SGFuZGxlcixlKSxlLmluc3RhbmNlVWlkPWIrKyxlLmh0bWxFeHByPS9eKD86XFxzKig8W1xcd1xcV10rPilbXj5dKikkLyxlLnJlZ2lzdGVyQnJlYWtwb2ludHMoKSxlLmluaXQoITApfXZhciBiPTA7cmV0dXJuIGN9KCksYi5wcm90b3R5cGUuYWN0aXZhdGVBREE9ZnVuY3Rpb24oKXt2YXIgYT10aGlzO2EuJHNsaWRlVHJhY2suZmluZChcIi5zbGljay1hY3RpdmVcIikuYXR0cih7XCJhcmlhLWhpZGRlblwiOlwiZmFsc2VcIn0pLmZpbmQoXCJhLCBpbnB1dCwgYnV0dG9uLCBzZWxlY3RcIikuYXR0cih7dGFiaW5kZXg6XCIwXCJ9KX0sYi5wcm90b3R5cGUuYWRkU2xpZGU9Yi5wcm90b3R5cGUuc2xpY2tBZGQ9ZnVuY3Rpb24oYixjLGQpe3ZhciBlPXRoaXM7aWYoXCJib29sZWFuXCI9PXR5cGVvZiBjKWQ9YyxjPW51bGw7ZWxzZSBpZigwPmN8fGM+PWUuc2xpZGVDb3VudClyZXR1cm4hMTtlLnVubG9hZCgpLFwibnVtYmVyXCI9PXR5cGVvZiBjPzA9PT1jJiYwPT09ZS4kc2xpZGVzLmxlbmd0aD9hKGIpLmFwcGVuZFRvKGUuJHNsaWRlVHJhY2spOmQ/YShiKS5pbnNlcnRCZWZvcmUoZS4kc2xpZGVzLmVxKGMpKTphKGIpLmluc2VydEFmdGVyKGUuJHNsaWRlcy5lcShjKSk6ZD09PSEwP2EoYikucHJlcGVuZFRvKGUuJHNsaWRlVHJhY2spOmEoYikuYXBwZW5kVG8oZS4kc2xpZGVUcmFjayksZS4kc2xpZGVzPWUuJHNsaWRlVHJhY2suY2hpbGRyZW4odGhpcy5vcHRpb25zLnNsaWRlKSxlLiRzbGlkZVRyYWNrLmNoaWxkcmVuKHRoaXMub3B0aW9ucy5zbGlkZSkuZGV0YWNoKCksZS4kc2xpZGVUcmFjay5hcHBlbmQoZS4kc2xpZGVzKSxlLiRzbGlkZXMuZWFjaChmdW5jdGlvbihiLGMpe2EoYykuYXR0cihcImRhdGEtc2xpY2staW5kZXhcIixiKX0pLGUuJHNsaWRlc0NhY2hlPWUuJHNsaWRlcyxlLnJlaW5pdCgpfSxiLnByb3RvdHlwZS5hbmltYXRlSGVpZ2h0PWZ1bmN0aW9uKCl7dmFyIGE9dGhpcztpZigxPT09YS5vcHRpb25zLnNsaWRlc1RvU2hvdyYmYS5vcHRpb25zLmFkYXB0aXZlSGVpZ2h0PT09ITAmJmEub3B0aW9ucy52ZXJ0aWNhbD09PSExKXt2YXIgYj1hLiRzbGlkZXMuZXEoYS5jdXJyZW50U2xpZGUpLm91dGVySGVpZ2h0KCEwKTthLiRsaXN0LmFuaW1hdGUoe2hlaWdodDpifSxhLm9wdGlvbnMuc3BlZWQpfX0sYi5wcm90b3R5cGUuYW5pbWF0ZVNsaWRlPWZ1bmN0aW9uKGIsYyl7dmFyIGQ9e30sZT10aGlzO2UuYW5pbWF0ZUhlaWdodCgpLGUub3B0aW9ucy5ydGw9PT0hMCYmZS5vcHRpb25zLnZlcnRpY2FsPT09ITEmJihiPS1iKSxlLnRyYW5zZm9ybXNFbmFibGVkPT09ITE/ZS5vcHRpb25zLnZlcnRpY2FsPT09ITE/ZS4kc2xpZGVUcmFjay5hbmltYXRlKHtsZWZ0OmJ9LGUub3B0aW9ucy5zcGVlZCxlLm9wdGlvbnMuZWFzaW5nLGMpOmUuJHNsaWRlVHJhY2suYW5pbWF0ZSh7dG9wOmJ9LGUub3B0aW9ucy5zcGVlZCxlLm9wdGlvbnMuZWFzaW5nLGMpOmUuY3NzVHJhbnNpdGlvbnM9PT0hMT8oZS5vcHRpb25zLnJ0bD09PSEwJiYoZS5jdXJyZW50TGVmdD0tZS5jdXJyZW50TGVmdCksYSh7YW5pbVN0YXJ0OmUuY3VycmVudExlZnR9KS5hbmltYXRlKHthbmltU3RhcnQ6Yn0se2R1cmF0aW9uOmUub3B0aW9ucy5zcGVlZCxlYXNpbmc6ZS5vcHRpb25zLmVhc2luZyxzdGVwOmZ1bmN0aW9uKGEpe2E9TWF0aC5jZWlsKGEpLGUub3B0aW9ucy52ZXJ0aWNhbD09PSExPyhkW2UuYW5pbVR5cGVdPVwidHJhbnNsYXRlKFwiK2ErXCJweCwgMHB4KVwiLGUuJHNsaWRlVHJhY2suY3NzKGQpKTooZFtlLmFuaW1UeXBlXT1cInRyYW5zbGF0ZSgwcHgsXCIrYStcInB4KVwiLGUuJHNsaWRlVHJhY2suY3NzKGQpKX0sY29tcGxldGU6ZnVuY3Rpb24oKXtjJiZjLmNhbGwoKX19KSk6KGUuYXBwbHlUcmFuc2l0aW9uKCksYj1NYXRoLmNlaWwoYiksZS5vcHRpb25zLnZlcnRpY2FsPT09ITE/ZFtlLmFuaW1UeXBlXT1cInRyYW5zbGF0ZTNkKFwiK2IrXCJweCwgMHB4LCAwcHgpXCI6ZFtlLmFuaW1UeXBlXT1cInRyYW5zbGF0ZTNkKDBweCxcIitiK1wicHgsIDBweClcIixlLiRzbGlkZVRyYWNrLmNzcyhkKSxjJiZzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7ZS5kaXNhYmxlVHJhbnNpdGlvbigpLGMuY2FsbCgpfSxlLm9wdGlvbnMuc3BlZWQpKX0sYi5wcm90b3R5cGUuZ2V0TmF2VGFyZ2V0PWZ1bmN0aW9uKCl7dmFyIGI9dGhpcyxjPWIub3B0aW9ucy5hc05hdkZvcjtyZXR1cm4gYyYmbnVsbCE9PWMmJihjPWEoYykubm90KGIuJHNsaWRlcikpLGN9LGIucHJvdG90eXBlLmFzTmF2Rm9yPWZ1bmN0aW9uKGIpe3ZhciBjPXRoaXMsZD1jLmdldE5hdlRhcmdldCgpO251bGwhPT1kJiZcIm9iamVjdFwiPT10eXBlb2YgZCYmZC5lYWNoKGZ1bmN0aW9uKCl7dmFyIGM9YSh0aGlzKS5zbGljayhcImdldFNsaWNrXCIpO2MudW5zbGlja2VkfHxjLnNsaWRlSGFuZGxlcihiLCEwKX0pfSxiLnByb3RvdHlwZS5hcHBseVRyYW5zaXRpb249ZnVuY3Rpb24oYSl7dmFyIGI9dGhpcyxjPXt9O2Iub3B0aW9ucy5mYWRlPT09ITE/Y1tiLnRyYW5zaXRpb25UeXBlXT1iLnRyYW5zZm9ybVR5cGUrXCIgXCIrYi5vcHRpb25zLnNwZWVkK1wibXMgXCIrYi5vcHRpb25zLmNzc0Vhc2U6Y1tiLnRyYW5zaXRpb25UeXBlXT1cIm9wYWNpdHkgXCIrYi5vcHRpb25zLnNwZWVkK1wibXMgXCIrYi5vcHRpb25zLmNzc0Vhc2UsYi5vcHRpb25zLmZhZGU9PT0hMT9iLiRzbGlkZVRyYWNrLmNzcyhjKTpiLiRzbGlkZXMuZXEoYSkuY3NzKGMpfSxiLnByb3RvdHlwZS5hdXRvUGxheT1mdW5jdGlvbigpe3ZhciBhPXRoaXM7YS5hdXRvUGxheUNsZWFyKCksYS5zbGlkZUNvdW50PmEub3B0aW9ucy5zbGlkZXNUb1Nob3cmJihhLmF1dG9QbGF5VGltZXI9c2V0SW50ZXJ2YWwoYS5hdXRvUGxheUl0ZXJhdG9yLGEub3B0aW9ucy5hdXRvcGxheVNwZWVkKSl9LGIucHJvdG90eXBlLmF1dG9QbGF5Q2xlYXI9ZnVuY3Rpb24oKXt2YXIgYT10aGlzO2EuYXV0b1BsYXlUaW1lciYmY2xlYXJJbnRlcnZhbChhLmF1dG9QbGF5VGltZXIpfSxiLnByb3RvdHlwZS5hdXRvUGxheUl0ZXJhdG9yPWZ1bmN0aW9uKCl7dmFyIGE9dGhpcyxiPWEuY3VycmVudFNsaWRlK2Eub3B0aW9ucy5zbGlkZXNUb1Njcm9sbDthLnBhdXNlZHx8YS5pbnRlcnJ1cHRlZHx8YS5mb2N1c3NlZHx8KGEub3B0aW9ucy5pbmZpbml0ZT09PSExJiYoMT09PWEuZGlyZWN0aW9uJiZhLmN1cnJlbnRTbGlkZSsxPT09YS5zbGlkZUNvdW50LTE/YS5kaXJlY3Rpb249MDowPT09YS5kaXJlY3Rpb24mJihiPWEuY3VycmVudFNsaWRlLWEub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCxhLmN1cnJlbnRTbGlkZS0xPT09MCYmKGEuZGlyZWN0aW9uPTEpKSksYS5zbGlkZUhhbmRsZXIoYikpfSxiLnByb3RvdHlwZS5idWlsZEFycm93cz1mdW5jdGlvbigpe3ZhciBiPXRoaXM7Yi5vcHRpb25zLmFycm93cz09PSEwJiYoYi4kcHJldkFycm93PWEoYi5vcHRpb25zLnByZXZBcnJvdykuYWRkQ2xhc3MoXCJzbGljay1hcnJvd1wiKSxiLiRuZXh0QXJyb3c9YShiLm9wdGlvbnMubmV4dEFycm93KS5hZGRDbGFzcyhcInNsaWNrLWFycm93XCIpLGIuc2xpZGVDb3VudD5iLm9wdGlvbnMuc2xpZGVzVG9TaG93PyhiLiRwcmV2QXJyb3cucmVtb3ZlQ2xhc3MoXCJzbGljay1oaWRkZW5cIikucmVtb3ZlQXR0cihcImFyaWEtaGlkZGVuIHRhYmluZGV4XCIpLGIuJG5leHRBcnJvdy5yZW1vdmVDbGFzcyhcInNsaWNrLWhpZGRlblwiKS5yZW1vdmVBdHRyKFwiYXJpYS1oaWRkZW4gdGFiaW5kZXhcIiksYi5odG1sRXhwci50ZXN0KGIub3B0aW9ucy5wcmV2QXJyb3cpJiZiLiRwcmV2QXJyb3cucHJlcGVuZFRvKGIub3B0aW9ucy5hcHBlbmRBcnJvd3MpLGIuaHRtbEV4cHIudGVzdChiLm9wdGlvbnMubmV4dEFycm93KSYmYi4kbmV4dEFycm93LmFwcGVuZFRvKGIub3B0aW9ucy5hcHBlbmRBcnJvd3MpLGIub3B0aW9ucy5pbmZpbml0ZSE9PSEwJiZiLiRwcmV2QXJyb3cuYWRkQ2xhc3MoXCJzbGljay1kaXNhYmxlZFwiKS5hdHRyKFwiYXJpYS1kaXNhYmxlZFwiLFwidHJ1ZVwiKSk6Yi4kcHJldkFycm93LmFkZChiLiRuZXh0QXJyb3cpLmFkZENsYXNzKFwic2xpY2staGlkZGVuXCIpLmF0dHIoe1wiYXJpYS1kaXNhYmxlZFwiOlwidHJ1ZVwiLHRhYmluZGV4OlwiLTFcIn0pKX0sYi5wcm90b3R5cGUuYnVpbGREb3RzPWZ1bmN0aW9uKCl7dmFyIGMsZCxiPXRoaXM7aWYoYi5vcHRpb25zLmRvdHM9PT0hMCYmYi5zbGlkZUNvdW50PmIub3B0aW9ucy5zbGlkZXNUb1Nob3cpe2ZvcihiLiRzbGlkZXIuYWRkQ2xhc3MoXCJzbGljay1kb3R0ZWRcIiksZD1hKFwiPHVsIC8+XCIpLmFkZENsYXNzKGIub3B0aW9ucy5kb3RzQ2xhc3MpLGM9MDtjPD1iLmdldERvdENvdW50KCk7Yys9MSlkLmFwcGVuZChhKFwiPGxpIC8+XCIpLmFwcGVuZChiLm9wdGlvbnMuY3VzdG9tUGFnaW5nLmNhbGwodGhpcyxiLGMpKSk7Yi4kZG90cz1kLmFwcGVuZFRvKGIub3B0aW9ucy5hcHBlbmREb3RzKSxiLiRkb3RzLmZpbmQoXCJsaVwiKS5maXJzdCgpLmFkZENsYXNzKFwic2xpY2stYWN0aXZlXCIpLmF0dHIoXCJhcmlhLWhpZGRlblwiLFwiZmFsc2VcIil9fSxiLnByb3RvdHlwZS5idWlsZE91dD1mdW5jdGlvbigpe3ZhciBiPXRoaXM7Yi4kc2xpZGVzPWIuJHNsaWRlci5jaGlsZHJlbihiLm9wdGlvbnMuc2xpZGUrXCI6bm90KC5zbGljay1jbG9uZWQpXCIpLmFkZENsYXNzKFwic2xpY2stc2xpZGVcIiksYi5zbGlkZUNvdW50PWIuJHNsaWRlcy5sZW5ndGgsYi4kc2xpZGVzLmVhY2goZnVuY3Rpb24oYixjKXthKGMpLmF0dHIoXCJkYXRhLXNsaWNrLWluZGV4XCIsYikuZGF0YShcIm9yaWdpbmFsU3R5bGluZ1wiLGEoYykuYXR0cihcInN0eWxlXCIpfHxcIlwiKX0pLGIuJHNsaWRlci5hZGRDbGFzcyhcInNsaWNrLXNsaWRlclwiKSxiLiRzbGlkZVRyYWNrPTA9PT1iLnNsaWRlQ291bnQ/YSgnPGRpdiBjbGFzcz1cInNsaWNrLXRyYWNrXCIvPicpLmFwcGVuZFRvKGIuJHNsaWRlcik6Yi4kc2xpZGVzLndyYXBBbGwoJzxkaXYgY2xhc3M9XCJzbGljay10cmFja1wiLz4nKS5wYXJlbnQoKSxiLiRsaXN0PWIuJHNsaWRlVHJhY2sud3JhcCgnPGRpdiBhcmlhLWxpdmU9XCJwb2xpdGVcIiBjbGFzcz1cInNsaWNrLWxpc3RcIi8+JykucGFyZW50KCksYi4kc2xpZGVUcmFjay5jc3MoXCJvcGFjaXR5XCIsMCksKGIub3B0aW9ucy5jZW50ZXJNb2RlPT09ITB8fGIub3B0aW9ucy5zd2lwZVRvU2xpZGU9PT0hMCkmJihiLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGw9MSksYShcImltZ1tkYXRhLWxhenldXCIsYi4kc2xpZGVyKS5ub3QoXCJbc3JjXVwiKS5hZGRDbGFzcyhcInNsaWNrLWxvYWRpbmdcIiksYi5zZXR1cEluZmluaXRlKCksYi5idWlsZEFycm93cygpLGIuYnVpbGREb3RzKCksYi51cGRhdGVEb3RzKCksYi5zZXRTbGlkZUNsYXNzZXMoXCJudW1iZXJcIj09dHlwZW9mIGIuY3VycmVudFNsaWRlP2IuY3VycmVudFNsaWRlOjApLGIub3B0aW9ucy5kcmFnZ2FibGU9PT0hMCYmYi4kbGlzdC5hZGRDbGFzcyhcImRyYWdnYWJsZVwiKX0sYi5wcm90b3R5cGUuYnVpbGRSb3dzPWZ1bmN0aW9uKCl7dmFyIGIsYyxkLGUsZixnLGgsYT10aGlzO2lmKGU9ZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpLGc9YS4kc2xpZGVyLmNoaWxkcmVuKCksYS5vcHRpb25zLnJvd3M+MSl7Zm9yKGg9YS5vcHRpb25zLnNsaWRlc1BlclJvdyphLm9wdGlvbnMucm93cyxmPU1hdGguY2VpbChnLmxlbmd0aC9oKSxiPTA7Zj5iO2IrKyl7dmFyIGk9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtmb3IoYz0wO2M8YS5vcHRpb25zLnJvd3M7YysrKXt2YXIgaj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2ZvcihkPTA7ZDxhLm9wdGlvbnMuc2xpZGVzUGVyUm93O2QrKyl7dmFyIGs9YipoKyhjKmEub3B0aW9ucy5zbGlkZXNQZXJSb3crZCk7Zy5nZXQoaykmJmouYXBwZW5kQ2hpbGQoZy5nZXQoaykpfWkuYXBwZW5kQ2hpbGQoail9ZS5hcHBlbmRDaGlsZChpKX1hLiRzbGlkZXIuZW1wdHkoKS5hcHBlbmQoZSksYS4kc2xpZGVyLmNoaWxkcmVuKCkuY2hpbGRyZW4oKS5jaGlsZHJlbigpLmNzcyh7d2lkdGg6MTAwL2Eub3B0aW9ucy5zbGlkZXNQZXJSb3crXCIlXCIsZGlzcGxheTpcImlubGluZS1ibG9ja1wifSl9fSxiLnByb3RvdHlwZS5jaGVja1Jlc3BvbnNpdmU9ZnVuY3Rpb24oYixjKXt2YXIgZSxmLGcsZD10aGlzLGg9ITEsaT1kLiRzbGlkZXIud2lkdGgoKSxqPXdpbmRvdy5pbm5lcldpZHRofHxhKHdpbmRvdykud2lkdGgoKTtpZihcIndpbmRvd1wiPT09ZC5yZXNwb25kVG8/Zz1qOlwic2xpZGVyXCI9PT1kLnJlc3BvbmRUbz9nPWk6XCJtaW5cIj09PWQucmVzcG9uZFRvJiYoZz1NYXRoLm1pbihqLGkpKSxkLm9wdGlvbnMucmVzcG9uc2l2ZSYmZC5vcHRpb25zLnJlc3BvbnNpdmUubGVuZ3RoJiZudWxsIT09ZC5vcHRpb25zLnJlc3BvbnNpdmUpe2Y9bnVsbDtmb3IoZSBpbiBkLmJyZWFrcG9pbnRzKWQuYnJlYWtwb2ludHMuaGFzT3duUHJvcGVydHkoZSkmJihkLm9yaWdpbmFsU2V0dGluZ3MubW9iaWxlRmlyc3Q9PT0hMT9nPGQuYnJlYWtwb2ludHNbZV0mJihmPWQuYnJlYWtwb2ludHNbZV0pOmc+ZC5icmVha3BvaW50c1tlXSYmKGY9ZC5icmVha3BvaW50c1tlXSkpO251bGwhPT1mP251bGwhPT1kLmFjdGl2ZUJyZWFrcG9pbnQ/KGYhPT1kLmFjdGl2ZUJyZWFrcG9pbnR8fGMpJiYoZC5hY3RpdmVCcmVha3BvaW50PWYsXCJ1bnNsaWNrXCI9PT1kLmJyZWFrcG9pbnRTZXR0aW5nc1tmXT9kLnVuc2xpY2soZik6KGQub3B0aW9ucz1hLmV4dGVuZCh7fSxkLm9yaWdpbmFsU2V0dGluZ3MsZC5icmVha3BvaW50U2V0dGluZ3NbZl0pLGI9PT0hMCYmKGQuY3VycmVudFNsaWRlPWQub3B0aW9ucy5pbml0aWFsU2xpZGUpLGQucmVmcmVzaChiKSksaD1mKTooZC5hY3RpdmVCcmVha3BvaW50PWYsXCJ1bnNsaWNrXCI9PT1kLmJyZWFrcG9pbnRTZXR0aW5nc1tmXT9kLnVuc2xpY2soZik6KGQub3B0aW9ucz1hLmV4dGVuZCh7fSxkLm9yaWdpbmFsU2V0dGluZ3MsZC5icmVha3BvaW50U2V0dGluZ3NbZl0pLGI9PT0hMCYmKGQuY3VycmVudFNsaWRlPWQub3B0aW9ucy5pbml0aWFsU2xpZGUpLGQucmVmcmVzaChiKSksaD1mKTpudWxsIT09ZC5hY3RpdmVCcmVha3BvaW50JiYoZC5hY3RpdmVCcmVha3BvaW50PW51bGwsZC5vcHRpb25zPWQub3JpZ2luYWxTZXR0aW5ncyxiPT09ITAmJihkLmN1cnJlbnRTbGlkZT1kLm9wdGlvbnMuaW5pdGlhbFNsaWRlKSxkLnJlZnJlc2goYiksaD1mKSxifHxoPT09ITF8fGQuJHNsaWRlci50cmlnZ2VyKFwiYnJlYWtwb2ludFwiLFtkLGhdKX19LGIucHJvdG90eXBlLmNoYW5nZVNsaWRlPWZ1bmN0aW9uKGIsYyl7dmFyIGYsZyxoLGQ9dGhpcyxlPWEoYi5jdXJyZW50VGFyZ2V0KTtzd2l0Y2goZS5pcyhcImFcIikmJmIucHJldmVudERlZmF1bHQoKSxlLmlzKFwibGlcIil8fChlPWUuY2xvc2VzdChcImxpXCIpKSxoPWQuc2xpZGVDb3VudCVkLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwhPT0wLGY9aD8wOihkLnNsaWRlQ291bnQtZC5jdXJyZW50U2xpZGUpJWQub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCxiLmRhdGEubWVzc2FnZSl7Y2FzZVwicHJldmlvdXNcIjpnPTA9PT1mP2Qub3B0aW9ucy5zbGlkZXNUb1Njcm9sbDpkLm9wdGlvbnMuc2xpZGVzVG9TaG93LWYsZC5zbGlkZUNvdW50PmQub3B0aW9ucy5zbGlkZXNUb1Nob3cmJmQuc2xpZGVIYW5kbGVyKGQuY3VycmVudFNsaWRlLWcsITEsYyk7YnJlYWs7Y2FzZVwibmV4dFwiOmc9MD09PWY/ZC5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsOmYsZC5zbGlkZUNvdW50PmQub3B0aW9ucy5zbGlkZXNUb1Nob3cmJmQuc2xpZGVIYW5kbGVyKGQuY3VycmVudFNsaWRlK2csITEsYyk7YnJlYWs7Y2FzZVwiaW5kZXhcIjp2YXIgaT0wPT09Yi5kYXRhLmluZGV4PzA6Yi5kYXRhLmluZGV4fHxlLmluZGV4KCkqZC5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsO2Quc2xpZGVIYW5kbGVyKGQuY2hlY2tOYXZpZ2FibGUoaSksITEsYyksZS5jaGlsZHJlbigpLnRyaWdnZXIoXCJmb2N1c1wiKTticmVhaztkZWZhdWx0OnJldHVybn19LGIucHJvdG90eXBlLmNoZWNrTmF2aWdhYmxlPWZ1bmN0aW9uKGEpe3ZhciBjLGQsYj10aGlzO2lmKGM9Yi5nZXROYXZpZ2FibGVJbmRleGVzKCksZD0wLGE+Y1tjLmxlbmd0aC0xXSlhPWNbYy5sZW5ndGgtMV07ZWxzZSBmb3IodmFyIGUgaW4gYyl7aWYoYTxjW2VdKXthPWQ7YnJlYWt9ZD1jW2VdfXJldHVybiBhfSxiLnByb3RvdHlwZS5jbGVhblVwRXZlbnRzPWZ1bmN0aW9uKCl7dmFyIGI9dGhpcztiLm9wdGlvbnMuZG90cyYmbnVsbCE9PWIuJGRvdHMmJmEoXCJsaVwiLGIuJGRvdHMpLm9mZihcImNsaWNrLnNsaWNrXCIsYi5jaGFuZ2VTbGlkZSkub2ZmKFwibW91c2VlbnRlci5zbGlja1wiLGEucHJveHkoYi5pbnRlcnJ1cHQsYiwhMCkpLm9mZihcIm1vdXNlbGVhdmUuc2xpY2tcIixhLnByb3h5KGIuaW50ZXJydXB0LGIsITEpKSxiLiRzbGlkZXIub2ZmKFwiZm9jdXMuc2xpY2sgYmx1ci5zbGlja1wiKSxiLm9wdGlvbnMuYXJyb3dzPT09ITAmJmIuc2xpZGVDb3VudD5iLm9wdGlvbnMuc2xpZGVzVG9TaG93JiYoYi4kcHJldkFycm93JiZiLiRwcmV2QXJyb3cub2ZmKFwiY2xpY2suc2xpY2tcIixiLmNoYW5nZVNsaWRlKSxiLiRuZXh0QXJyb3cmJmIuJG5leHRBcnJvdy5vZmYoXCJjbGljay5zbGlja1wiLGIuY2hhbmdlU2xpZGUpKSxiLiRsaXN0Lm9mZihcInRvdWNoc3RhcnQuc2xpY2sgbW91c2Vkb3duLnNsaWNrXCIsYi5zd2lwZUhhbmRsZXIpLGIuJGxpc3Qub2ZmKFwidG91Y2htb3ZlLnNsaWNrIG1vdXNlbW92ZS5zbGlja1wiLGIuc3dpcGVIYW5kbGVyKSxiLiRsaXN0Lm9mZihcInRvdWNoZW5kLnNsaWNrIG1vdXNldXAuc2xpY2tcIixiLnN3aXBlSGFuZGxlciksYi4kbGlzdC5vZmYoXCJ0b3VjaGNhbmNlbC5zbGljayBtb3VzZWxlYXZlLnNsaWNrXCIsYi5zd2lwZUhhbmRsZXIpLGIuJGxpc3Qub2ZmKFwiY2xpY2suc2xpY2tcIixiLmNsaWNrSGFuZGxlciksYShkb2N1bWVudCkub2ZmKGIudmlzaWJpbGl0eUNoYW5nZSxiLnZpc2liaWxpdHkpLGIuY2xlYW5VcFNsaWRlRXZlbnRzKCksYi5vcHRpb25zLmFjY2Vzc2liaWxpdHk9PT0hMCYmYi4kbGlzdC5vZmYoXCJrZXlkb3duLnNsaWNrXCIsYi5rZXlIYW5kbGVyKSxiLm9wdGlvbnMuZm9jdXNPblNlbGVjdD09PSEwJiZhKGIuJHNsaWRlVHJhY2spLmNoaWxkcmVuKCkub2ZmKFwiY2xpY2suc2xpY2tcIixiLnNlbGVjdEhhbmRsZXIpLGEod2luZG93KS5vZmYoXCJvcmllbnRhdGlvbmNoYW5nZS5zbGljay5zbGljay1cIitiLmluc3RhbmNlVWlkLGIub3JpZW50YXRpb25DaGFuZ2UpLGEod2luZG93KS5vZmYoXCJyZXNpemUuc2xpY2suc2xpY2stXCIrYi5pbnN0YW5jZVVpZCxiLnJlc2l6ZSksYShcIltkcmFnZ2FibGUhPXRydWVdXCIsYi4kc2xpZGVUcmFjaykub2ZmKFwiZHJhZ3N0YXJ0XCIsYi5wcmV2ZW50RGVmYXVsdCksYSh3aW5kb3cpLm9mZihcImxvYWQuc2xpY2suc2xpY2stXCIrYi5pbnN0YW5jZVVpZCxiLnNldFBvc2l0aW9uKSxhKGRvY3VtZW50KS5vZmYoXCJyZWFkeS5zbGljay5zbGljay1cIitiLmluc3RhbmNlVWlkLGIuc2V0UG9zaXRpb24pfSxiLnByb3RvdHlwZS5jbGVhblVwU2xpZGVFdmVudHM9ZnVuY3Rpb24oKXt2YXIgYj10aGlzO2IuJGxpc3Qub2ZmKFwibW91c2VlbnRlci5zbGlja1wiLGEucHJveHkoYi5pbnRlcnJ1cHQsYiwhMCkpLGIuJGxpc3Qub2ZmKFwibW91c2VsZWF2ZS5zbGlja1wiLGEucHJveHkoYi5pbnRlcnJ1cHQsYiwhMSkpfSxiLnByb3RvdHlwZS5jbGVhblVwUm93cz1mdW5jdGlvbigpe3ZhciBiLGE9dGhpczthLm9wdGlvbnMucm93cz4xJiYoYj1hLiRzbGlkZXMuY2hpbGRyZW4oKS5jaGlsZHJlbigpLGIucmVtb3ZlQXR0cihcInN0eWxlXCIpLGEuJHNsaWRlci5lbXB0eSgpLmFwcGVuZChiKSl9LGIucHJvdG90eXBlLmNsaWNrSGFuZGxlcj1mdW5jdGlvbihhKXt2YXIgYj10aGlzO2Iuc2hvdWxkQ2xpY2s9PT0hMSYmKGEuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCksYS5zdG9wUHJvcGFnYXRpb24oKSxhLnByZXZlbnREZWZhdWx0KCkpfSxiLnByb3RvdHlwZS5kZXN0cm95PWZ1bmN0aW9uKGIpe3ZhciBjPXRoaXM7Yy5hdXRvUGxheUNsZWFyKCksYy50b3VjaE9iamVjdD17fSxjLmNsZWFuVXBFdmVudHMoKSxhKFwiLnNsaWNrLWNsb25lZFwiLGMuJHNsaWRlcikuZGV0YWNoKCksYy4kZG90cyYmYy4kZG90cy5yZW1vdmUoKSxjLiRwcmV2QXJyb3cmJmMuJHByZXZBcnJvdy5sZW5ndGgmJihjLiRwcmV2QXJyb3cucmVtb3ZlQ2xhc3MoXCJzbGljay1kaXNhYmxlZCBzbGljay1hcnJvdyBzbGljay1oaWRkZW5cIikucmVtb3ZlQXR0cihcImFyaWEtaGlkZGVuIGFyaWEtZGlzYWJsZWQgdGFiaW5kZXhcIikuY3NzKFwiZGlzcGxheVwiLFwiXCIpLGMuaHRtbEV4cHIudGVzdChjLm9wdGlvbnMucHJldkFycm93KSYmYy4kcHJldkFycm93LnJlbW92ZSgpKSxjLiRuZXh0QXJyb3cmJmMuJG5leHRBcnJvdy5sZW5ndGgmJihjLiRuZXh0QXJyb3cucmVtb3ZlQ2xhc3MoXCJzbGljay1kaXNhYmxlZCBzbGljay1hcnJvdyBzbGljay1oaWRkZW5cIikucmVtb3ZlQXR0cihcImFyaWEtaGlkZGVuIGFyaWEtZGlzYWJsZWQgdGFiaW5kZXhcIikuY3NzKFwiZGlzcGxheVwiLFwiXCIpLGMuaHRtbEV4cHIudGVzdChjLm9wdGlvbnMubmV4dEFycm93KSYmYy4kbmV4dEFycm93LnJlbW92ZSgpKSxjLiRzbGlkZXMmJihjLiRzbGlkZXMucmVtb3ZlQ2xhc3MoXCJzbGljay1zbGlkZSBzbGljay1hY3RpdmUgc2xpY2stY2VudGVyIHNsaWNrLXZpc2libGUgc2xpY2stY3VycmVudFwiKS5yZW1vdmVBdHRyKFwiYXJpYS1oaWRkZW5cIikucmVtb3ZlQXR0cihcImRhdGEtc2xpY2staW5kZXhcIikuZWFjaChmdW5jdGlvbigpe2EodGhpcykuYXR0cihcInN0eWxlXCIsYSh0aGlzKS5kYXRhKFwib3JpZ2luYWxTdHlsaW5nXCIpKX0pLGMuJHNsaWRlVHJhY2suY2hpbGRyZW4odGhpcy5vcHRpb25zLnNsaWRlKS5kZXRhY2goKSxjLiRzbGlkZVRyYWNrLmRldGFjaCgpLGMuJGxpc3QuZGV0YWNoKCksYy4kc2xpZGVyLmFwcGVuZChjLiRzbGlkZXMpKSxjLmNsZWFuVXBSb3dzKCksYy4kc2xpZGVyLnJlbW92ZUNsYXNzKFwic2xpY2stc2xpZGVyXCIpLGMuJHNsaWRlci5yZW1vdmVDbGFzcyhcInNsaWNrLWluaXRpYWxpemVkXCIpLGMuJHNsaWRlci5yZW1vdmVDbGFzcyhcInNsaWNrLWRvdHRlZFwiKSxjLnVuc2xpY2tlZD0hMCxifHxjLiRzbGlkZXIudHJpZ2dlcihcImRlc3Ryb3lcIixbY10pfSxiLnByb3RvdHlwZS5kaXNhYmxlVHJhbnNpdGlvbj1mdW5jdGlvbihhKXt2YXIgYj10aGlzLGM9e307Y1tiLnRyYW5zaXRpb25UeXBlXT1cIlwiLGIub3B0aW9ucy5mYWRlPT09ITE/Yi4kc2xpZGVUcmFjay5jc3MoYyk6Yi4kc2xpZGVzLmVxKGEpLmNzcyhjKX0sYi5wcm90b3R5cGUuZmFkZVNsaWRlPWZ1bmN0aW9uKGEsYil7dmFyIGM9dGhpcztjLmNzc1RyYW5zaXRpb25zPT09ITE/KGMuJHNsaWRlcy5lcShhKS5jc3Moe3pJbmRleDpjLm9wdGlvbnMuekluZGV4fSksYy4kc2xpZGVzLmVxKGEpLmFuaW1hdGUoe29wYWNpdHk6MX0sYy5vcHRpb25zLnNwZWVkLGMub3B0aW9ucy5lYXNpbmcsYikpOihjLmFwcGx5VHJhbnNpdGlvbihhKSxjLiRzbGlkZXMuZXEoYSkuY3NzKHtvcGFjaXR5OjEsekluZGV4OmMub3B0aW9ucy56SW5kZXh9KSxiJiZzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7Yy5kaXNhYmxlVHJhbnNpdGlvbihhKSxiLmNhbGwoKX0sYy5vcHRpb25zLnNwZWVkKSl9LGIucHJvdG90eXBlLmZhZGVTbGlkZU91dD1mdW5jdGlvbihhKXt2YXIgYj10aGlzO2IuY3NzVHJhbnNpdGlvbnM9PT0hMT9iLiRzbGlkZXMuZXEoYSkuYW5pbWF0ZSh7b3BhY2l0eTowLHpJbmRleDpiLm9wdGlvbnMuekluZGV4LTJ9LGIub3B0aW9ucy5zcGVlZCxiLm9wdGlvbnMuZWFzaW5nKTooYi5hcHBseVRyYW5zaXRpb24oYSksYi4kc2xpZGVzLmVxKGEpLmNzcyh7b3BhY2l0eTowLHpJbmRleDpiLm9wdGlvbnMuekluZGV4LTJ9KSl9LGIucHJvdG90eXBlLmZpbHRlclNsaWRlcz1iLnByb3RvdHlwZS5zbGlja0ZpbHRlcj1mdW5jdGlvbihhKXt2YXIgYj10aGlzO251bGwhPT1hJiYoYi4kc2xpZGVzQ2FjaGU9Yi4kc2xpZGVzLGIudW5sb2FkKCksYi4kc2xpZGVUcmFjay5jaGlsZHJlbih0aGlzLm9wdGlvbnMuc2xpZGUpLmRldGFjaCgpLGIuJHNsaWRlc0NhY2hlLmZpbHRlcihhKS5hcHBlbmRUbyhiLiRzbGlkZVRyYWNrKSxiLnJlaW5pdCgpKX0sYi5wcm90b3R5cGUuZm9jdXNIYW5kbGVyPWZ1bmN0aW9uKCl7dmFyIGI9dGhpcztiLiRzbGlkZXIub2ZmKFwiZm9jdXMuc2xpY2sgYmx1ci5zbGlja1wiKS5vbihcImZvY3VzLnNsaWNrIGJsdXIuc2xpY2tcIixcIio6bm90KC5zbGljay1hcnJvdylcIixmdW5jdGlvbihjKXtjLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO3ZhciBkPWEodGhpcyk7c2V0VGltZW91dChmdW5jdGlvbigpe2Iub3B0aW9ucy5wYXVzZU9uRm9jdXMmJihiLmZvY3Vzc2VkPWQuaXMoXCI6Zm9jdXNcIiksYi5hdXRvUGxheSgpKX0sMCl9KX0sYi5wcm90b3R5cGUuZ2V0Q3VycmVudD1iLnByb3RvdHlwZS5zbGlja0N1cnJlbnRTbGlkZT1mdW5jdGlvbigpe3ZhciBhPXRoaXM7cmV0dXJuIGEuY3VycmVudFNsaWRlfSxiLnByb3RvdHlwZS5nZXREb3RDb3VudD1mdW5jdGlvbigpe3ZhciBhPXRoaXMsYj0wLGM9MCxkPTA7aWYoYS5vcHRpb25zLmluZmluaXRlPT09ITApZm9yKDtiPGEuc2xpZGVDb3VudDspKytkLGI9YythLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwsYys9YS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsPD1hLm9wdGlvbnMuc2xpZGVzVG9TaG93P2Eub3B0aW9ucy5zbGlkZXNUb1Njcm9sbDphLm9wdGlvbnMuc2xpZGVzVG9TaG93O2Vsc2UgaWYoYS5vcHRpb25zLmNlbnRlck1vZGU9PT0hMClkPWEuc2xpZGVDb3VudDtlbHNlIGlmKGEub3B0aW9ucy5hc05hdkZvcilmb3IoO2I8YS5zbGlkZUNvdW50OykrK2QsYj1jK2Eub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCxjKz1hLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGw8PWEub3B0aW9ucy5zbGlkZXNUb1Nob3c/YS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsOmEub3B0aW9ucy5zbGlkZXNUb1Nob3c7ZWxzZSBkPTErTWF0aC5jZWlsKChhLnNsaWRlQ291bnQtYS5vcHRpb25zLnNsaWRlc1RvU2hvdykvYS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsKTtyZXR1cm4gZC0xfSxiLnByb3RvdHlwZS5nZXRMZWZ0PWZ1bmN0aW9uKGEpe3ZhciBjLGQsZixiPXRoaXMsZT0wO3JldHVybiBiLnNsaWRlT2Zmc2V0PTAsZD1iLiRzbGlkZXMuZmlyc3QoKS5vdXRlckhlaWdodCghMCksYi5vcHRpb25zLmluZmluaXRlPT09ITA/KGIuc2xpZGVDb3VudD5iLm9wdGlvbnMuc2xpZGVzVG9TaG93JiYoYi5zbGlkZU9mZnNldD1iLnNsaWRlV2lkdGgqYi5vcHRpb25zLnNsaWRlc1RvU2hvdyotMSxlPWQqYi5vcHRpb25zLnNsaWRlc1RvU2hvdyotMSksYi5zbGlkZUNvdW50JWIub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCE9PTAmJmErYi5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsPmIuc2xpZGVDb3VudCYmYi5zbGlkZUNvdW50PmIub3B0aW9ucy5zbGlkZXNUb1Nob3cmJihhPmIuc2xpZGVDb3VudD8oYi5zbGlkZU9mZnNldD0oYi5vcHRpb25zLnNsaWRlc1RvU2hvdy0oYS1iLnNsaWRlQ291bnQpKSpiLnNsaWRlV2lkdGgqLTEsZT0oYi5vcHRpb25zLnNsaWRlc1RvU2hvdy0oYS1iLnNsaWRlQ291bnQpKSpkKi0xKTooYi5zbGlkZU9mZnNldD1iLnNsaWRlQ291bnQlYi5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsKmIuc2xpZGVXaWR0aCotMSxlPWIuc2xpZGVDb3VudCViLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwqZCotMSkpKTphK2Iub3B0aW9ucy5zbGlkZXNUb1Nob3c+Yi5zbGlkZUNvdW50JiYoYi5zbGlkZU9mZnNldD0oYStiLm9wdGlvbnMuc2xpZGVzVG9TaG93LWIuc2xpZGVDb3VudCkqYi5zbGlkZVdpZHRoLGU9KGErYi5vcHRpb25zLnNsaWRlc1RvU2hvdy1iLnNsaWRlQ291bnQpKmQpLGIuc2xpZGVDb3VudDw9Yi5vcHRpb25zLnNsaWRlc1RvU2hvdyYmKGIuc2xpZGVPZmZzZXQ9MCxlPTApLGIub3B0aW9ucy5jZW50ZXJNb2RlPT09ITAmJmIub3B0aW9ucy5pbmZpbml0ZT09PSEwP2Iuc2xpZGVPZmZzZXQrPWIuc2xpZGVXaWR0aCpNYXRoLmZsb29yKGIub3B0aW9ucy5zbGlkZXNUb1Nob3cvMiktYi5zbGlkZVdpZHRoOmIub3B0aW9ucy5jZW50ZXJNb2RlPT09ITAmJihiLnNsaWRlT2Zmc2V0PTAsYi5zbGlkZU9mZnNldCs9Yi5zbGlkZVdpZHRoKk1hdGguZmxvb3IoYi5vcHRpb25zLnNsaWRlc1RvU2hvdy8yKSksYz1iLm9wdGlvbnMudmVydGljYWw9PT0hMT9hKmIuc2xpZGVXaWR0aCotMStiLnNsaWRlT2Zmc2V0OmEqZCotMStlLGIub3B0aW9ucy52YXJpYWJsZVdpZHRoPT09ITAmJihmPWIuc2xpZGVDb3VudDw9Yi5vcHRpb25zLnNsaWRlc1RvU2hvd3x8Yi5vcHRpb25zLmluZmluaXRlPT09ITE/Yi4kc2xpZGVUcmFjay5jaGlsZHJlbihcIi5zbGljay1zbGlkZVwiKS5lcShhKTpiLiRzbGlkZVRyYWNrLmNoaWxkcmVuKFwiLnNsaWNrLXNsaWRlXCIpLmVxKGErYi5vcHRpb25zLnNsaWRlc1RvU2hvdyksYz1iLm9wdGlvbnMucnRsPT09ITA/ZlswXT8tMSooYi4kc2xpZGVUcmFjay53aWR0aCgpLWZbMF0ub2Zmc2V0TGVmdC1mLndpZHRoKCkpOjA6ZlswXT8tMSpmWzBdLm9mZnNldExlZnQ6MCxiLm9wdGlvbnMuY2VudGVyTW9kZT09PSEwJiYoZj1iLnNsaWRlQ291bnQ8PWIub3B0aW9ucy5zbGlkZXNUb1Nob3d8fGIub3B0aW9ucy5pbmZpbml0ZT09PSExP2IuJHNsaWRlVHJhY2suY2hpbGRyZW4oXCIuc2xpY2stc2xpZGVcIikuZXEoYSk6Yi4kc2xpZGVUcmFjay5jaGlsZHJlbihcIi5zbGljay1zbGlkZVwiKS5lcShhK2Iub3B0aW9ucy5zbGlkZXNUb1Nob3crMSksYz1iLm9wdGlvbnMucnRsPT09ITA/ZlswXT8tMSooYi4kc2xpZGVUcmFjay53aWR0aCgpLWZbMF0ub2Zmc2V0TGVmdC1mLndpZHRoKCkpOjA6ZlswXT8tMSpmWzBdLm9mZnNldExlZnQ6MCxjKz0oYi4kbGlzdC53aWR0aCgpLWYub3V0ZXJXaWR0aCgpKS8yKSksY30sYi5wcm90b3R5cGUuZ2V0T3B0aW9uPWIucHJvdG90eXBlLnNsaWNrR2V0T3B0aW9uPWZ1bmN0aW9uKGEpe3ZhciBiPXRoaXM7cmV0dXJuIGIub3B0aW9uc1thXX0sYi5wcm90b3R5cGUuZ2V0TmF2aWdhYmxlSW5kZXhlcz1mdW5jdGlvbigpe3ZhciBlLGE9dGhpcyxiPTAsYz0wLGQ9W107Zm9yKGEub3B0aW9ucy5pbmZpbml0ZT09PSExP2U9YS5zbGlkZUNvdW50OihiPS0xKmEub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCxjPS0xKmEub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCxlPTIqYS5zbGlkZUNvdW50KTtlPmI7KWQucHVzaChiKSxiPWMrYS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsLGMrPWEub3B0aW9ucy5zbGlkZXNUb1Njcm9sbDw9YS5vcHRpb25zLnNsaWRlc1RvU2hvdz9hLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGw6YS5vcHRpb25zLnNsaWRlc1RvU2hvdztyZXR1cm4gZH0sYi5wcm90b3R5cGUuZ2V0U2xpY2s9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpc30sYi5wcm90b3R5cGUuZ2V0U2xpZGVDb3VudD1mdW5jdGlvbigpe3ZhciBjLGQsZSxiPXRoaXM7cmV0dXJuIGU9Yi5vcHRpb25zLmNlbnRlck1vZGU9PT0hMD9iLnNsaWRlV2lkdGgqTWF0aC5mbG9vcihiLm9wdGlvbnMuc2xpZGVzVG9TaG93LzIpOjAsYi5vcHRpb25zLnN3aXBlVG9TbGlkZT09PSEwPyhiLiRzbGlkZVRyYWNrLmZpbmQoXCIuc2xpY2stc2xpZGVcIikuZWFjaChmdW5jdGlvbihjLGYpe3JldHVybiBmLm9mZnNldExlZnQtZSthKGYpLm91dGVyV2lkdGgoKS8yPi0xKmIuc3dpcGVMZWZ0PyhkPWYsITEpOnZvaWQgMH0pLGM9TWF0aC5hYnMoYShkKS5hdHRyKFwiZGF0YS1zbGljay1pbmRleFwiKS1iLmN1cnJlbnRTbGlkZSl8fDEpOmIub3B0aW9ucy5zbGlkZXNUb1Njcm9sbH0sYi5wcm90b3R5cGUuZ29Ubz1iLnByb3RvdHlwZS5zbGlja0dvVG89ZnVuY3Rpb24oYSxiKXt2YXIgYz10aGlzO2MuY2hhbmdlU2xpZGUoe2RhdGE6e21lc3NhZ2U6XCJpbmRleFwiLGluZGV4OnBhcnNlSW50KGEpfX0sYil9LGIucHJvdG90eXBlLmluaXQ9ZnVuY3Rpb24oYil7dmFyIGM9dGhpczthKGMuJHNsaWRlcikuaGFzQ2xhc3MoXCJzbGljay1pbml0aWFsaXplZFwiKXx8KGEoYy4kc2xpZGVyKS5hZGRDbGFzcyhcInNsaWNrLWluaXRpYWxpemVkXCIpLGMuYnVpbGRSb3dzKCksYy5idWlsZE91dCgpLGMuc2V0UHJvcHMoKSxjLnN0YXJ0TG9hZCgpLGMubG9hZFNsaWRlcigpLGMuaW5pdGlhbGl6ZUV2ZW50cygpLGMudXBkYXRlQXJyb3dzKCksYy51cGRhdGVEb3RzKCksYy5jaGVja1Jlc3BvbnNpdmUoITApLGMuZm9jdXNIYW5kbGVyKCkpLGImJmMuJHNsaWRlci50cmlnZ2VyKFwiaW5pdFwiLFtjXSksYy5vcHRpb25zLmFjY2Vzc2liaWxpdHk9PT0hMCYmYy5pbml0QURBKCksYy5vcHRpb25zLmF1dG9wbGF5JiYoYy5wYXVzZWQ9ITEsYy5hdXRvUGxheSgpKX0sYi5wcm90b3R5cGUuaW5pdEFEQT1mdW5jdGlvbigpe3ZhciBiPXRoaXM7Yi4kc2xpZGVzLmFkZChiLiRzbGlkZVRyYWNrLmZpbmQoXCIuc2xpY2stY2xvbmVkXCIpKS5hdHRyKHtcImFyaWEtaGlkZGVuXCI6XCJ0cnVlXCIsdGFiaW5kZXg6XCItMVwifSkuZmluZChcImEsIGlucHV0LCBidXR0b24sIHNlbGVjdFwiKS5hdHRyKHt0YWJpbmRleDpcIi0xXCJ9KSxiLiRzbGlkZVRyYWNrLmF0dHIoXCJyb2xlXCIsXCJsaXN0Ym94XCIpLGIuJHNsaWRlcy5ub3QoYi4kc2xpZGVUcmFjay5maW5kKFwiLnNsaWNrLWNsb25lZFwiKSkuZWFjaChmdW5jdGlvbihjKXthKHRoaXMpLmF0dHIoe3JvbGU6XCJvcHRpb25cIixcImFyaWEtZGVzY3JpYmVkYnlcIjpcInNsaWNrLXNsaWRlXCIrYi5pbnN0YW5jZVVpZCtjfSl9KSxudWxsIT09Yi4kZG90cyYmYi4kZG90cy5hdHRyKFwicm9sZVwiLFwidGFibGlzdFwiKS5maW5kKFwibGlcIikuZWFjaChmdW5jdGlvbihjKXthKHRoaXMpLmF0dHIoe3JvbGU6XCJwcmVzZW50YXRpb25cIixcImFyaWEtc2VsZWN0ZWRcIjpcImZhbHNlXCIsXCJhcmlhLWNvbnRyb2xzXCI6XCJuYXZpZ2F0aW9uXCIrYi5pbnN0YW5jZVVpZCtjLGlkOlwic2xpY2stc2xpZGVcIitiLmluc3RhbmNlVWlkK2N9KX0pLmZpcnN0KCkuYXR0cihcImFyaWEtc2VsZWN0ZWRcIixcInRydWVcIikuZW5kKCkuZmluZChcImJ1dHRvblwiKS5hdHRyKFwicm9sZVwiLFwiYnV0dG9uXCIpLmVuZCgpLmNsb3Nlc3QoXCJkaXZcIikuYXR0cihcInJvbGVcIixcInRvb2xiYXJcIiksYi5hY3RpdmF0ZUFEQSgpfSxiLnByb3RvdHlwZS5pbml0QXJyb3dFdmVudHM9ZnVuY3Rpb24oKXt2YXIgYT10aGlzO2Eub3B0aW9ucy5hcnJvd3M9PT0hMCYmYS5zbGlkZUNvdW50PmEub3B0aW9ucy5zbGlkZXNUb1Nob3cmJihhLiRwcmV2QXJyb3cub2ZmKFwiY2xpY2suc2xpY2tcIikub24oXCJjbGljay5zbGlja1wiLHttZXNzYWdlOlwicHJldmlvdXNcIn0sYS5jaGFuZ2VTbGlkZSksYS4kbmV4dEFycm93Lm9mZihcImNsaWNrLnNsaWNrXCIpLm9uKFwiY2xpY2suc2xpY2tcIix7bWVzc2FnZTpcIm5leHRcIn0sYS5jaGFuZ2VTbGlkZSkpfSxiLnByb3RvdHlwZS5pbml0RG90RXZlbnRzPWZ1bmN0aW9uKCl7dmFyIGI9dGhpcztiLm9wdGlvbnMuZG90cz09PSEwJiZiLnNsaWRlQ291bnQ+Yi5vcHRpb25zLnNsaWRlc1RvU2hvdyYmYShcImxpXCIsYi4kZG90cykub24oXCJjbGljay5zbGlja1wiLHttZXNzYWdlOlwiaW5kZXhcIn0sYi5jaGFuZ2VTbGlkZSksYi5vcHRpb25zLmRvdHM9PT0hMCYmYi5vcHRpb25zLnBhdXNlT25Eb3RzSG92ZXI9PT0hMCYmYShcImxpXCIsYi4kZG90cykub24oXCJtb3VzZWVudGVyLnNsaWNrXCIsYS5wcm94eShiLmludGVycnVwdCxiLCEwKSkub24oXCJtb3VzZWxlYXZlLnNsaWNrXCIsYS5wcm94eShiLmludGVycnVwdCxiLCExKSl9LGIucHJvdG90eXBlLmluaXRTbGlkZUV2ZW50cz1mdW5jdGlvbigpe3ZhciBiPXRoaXM7Yi5vcHRpb25zLnBhdXNlT25Ib3ZlciYmKGIuJGxpc3Qub24oXCJtb3VzZWVudGVyLnNsaWNrXCIsYS5wcm94eShiLmludGVycnVwdCxiLCEwKSksYi4kbGlzdC5vbihcIm1vdXNlbGVhdmUuc2xpY2tcIixhLnByb3h5KGIuaW50ZXJydXB0LGIsITEpKSl9LGIucHJvdG90eXBlLmluaXRpYWxpemVFdmVudHM9ZnVuY3Rpb24oKXt2YXIgYj10aGlzO2IuaW5pdEFycm93RXZlbnRzKCksYi5pbml0RG90RXZlbnRzKCksYi5pbml0U2xpZGVFdmVudHMoKSxiLiRsaXN0Lm9uKFwidG91Y2hzdGFydC5zbGljayBtb3VzZWRvd24uc2xpY2tcIix7YWN0aW9uOlwic3RhcnRcIn0sYi5zd2lwZUhhbmRsZXIpLGIuJGxpc3Qub24oXCJ0b3VjaG1vdmUuc2xpY2sgbW91c2Vtb3ZlLnNsaWNrXCIse2FjdGlvbjpcIm1vdmVcIn0sYi5zd2lwZUhhbmRsZXIpLGIuJGxpc3Qub24oXCJ0b3VjaGVuZC5zbGljayBtb3VzZXVwLnNsaWNrXCIse2FjdGlvbjpcImVuZFwifSxiLnN3aXBlSGFuZGxlciksYi4kbGlzdC5vbihcInRvdWNoY2FuY2VsLnNsaWNrIG1vdXNlbGVhdmUuc2xpY2tcIix7YWN0aW9uOlwiZW5kXCJ9LGIuc3dpcGVIYW5kbGVyKSxiLiRsaXN0Lm9uKFwiY2xpY2suc2xpY2tcIixiLmNsaWNrSGFuZGxlciksYShkb2N1bWVudCkub24oYi52aXNpYmlsaXR5Q2hhbmdlLGEucHJveHkoYi52aXNpYmlsaXR5LGIpKSxiLm9wdGlvbnMuYWNjZXNzaWJpbGl0eT09PSEwJiZiLiRsaXN0Lm9uKFwia2V5ZG93bi5zbGlja1wiLGIua2V5SGFuZGxlciksYi5vcHRpb25zLmZvY3VzT25TZWxlY3Q9PT0hMCYmYShiLiRzbGlkZVRyYWNrKS5jaGlsZHJlbigpLm9uKFwiY2xpY2suc2xpY2tcIixiLnNlbGVjdEhhbmRsZXIpLGEod2luZG93KS5vbihcIm9yaWVudGF0aW9uY2hhbmdlLnNsaWNrLnNsaWNrLVwiK2IuaW5zdGFuY2VVaWQsYS5wcm94eShiLm9yaWVudGF0aW9uQ2hhbmdlLGIpKSxhKHdpbmRvdykub24oXCJyZXNpemUuc2xpY2suc2xpY2stXCIrYi5pbnN0YW5jZVVpZCxhLnByb3h5KGIucmVzaXplLGIpKSxhKFwiW2RyYWdnYWJsZSE9dHJ1ZV1cIixiLiRzbGlkZVRyYWNrKS5vbihcImRyYWdzdGFydFwiLGIucHJldmVudERlZmF1bHQpLGEod2luZG93KS5vbihcImxvYWQuc2xpY2suc2xpY2stXCIrYi5pbnN0YW5jZVVpZCxiLnNldFBvc2l0aW9uKSxhKGRvY3VtZW50KS5vbihcInJlYWR5LnNsaWNrLnNsaWNrLVwiK2IuaW5zdGFuY2VVaWQsYi5zZXRQb3NpdGlvbil9LGIucHJvdG90eXBlLmluaXRVST1mdW5jdGlvbigpe3ZhciBhPXRoaXM7YS5vcHRpb25zLmFycm93cz09PSEwJiZhLnNsaWRlQ291bnQ+YS5vcHRpb25zLnNsaWRlc1RvU2hvdyYmKGEuJHByZXZBcnJvdy5zaG93KCksYS4kbmV4dEFycm93LnNob3coKSksYS5vcHRpb25zLmRvdHM9PT0hMCYmYS5zbGlkZUNvdW50PmEub3B0aW9ucy5zbGlkZXNUb1Nob3cmJmEuJGRvdHMuc2hvdygpfSxiLnByb3RvdHlwZS5rZXlIYW5kbGVyPWZ1bmN0aW9uKGEpe3ZhciBiPXRoaXM7YS50YXJnZXQudGFnTmFtZS5tYXRjaChcIlRFWFRBUkVBfElOUFVUfFNFTEVDVFwiKXx8KDM3PT09YS5rZXlDb2RlJiZiLm9wdGlvbnMuYWNjZXNzaWJpbGl0eT09PSEwP2IuY2hhbmdlU2xpZGUoe2RhdGE6e21lc3NhZ2U6Yi5vcHRpb25zLnJ0bD09PSEwP1wibmV4dFwiOlwicHJldmlvdXNcIn19KTozOT09PWEua2V5Q29kZSYmYi5vcHRpb25zLmFjY2Vzc2liaWxpdHk9PT0hMCYmYi5jaGFuZ2VTbGlkZSh7ZGF0YTp7bWVzc2FnZTpiLm9wdGlvbnMucnRsPT09ITA/XCJwcmV2aW91c1wiOlwibmV4dFwifX0pKX0sYi5wcm90b3R5cGUubGF6eUxvYWQ9ZnVuY3Rpb24oKXtmdW5jdGlvbiBnKGMpe2EoXCJpbWdbZGF0YS1sYXp5XVwiLGMpLmVhY2goZnVuY3Rpb24oKXt2YXIgYz1hKHRoaXMpLGQ9YSh0aGlzKS5hdHRyKFwiZGF0YS1sYXp5XCIpLGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtlLm9ubG9hZD1mdW5jdGlvbigpe2MuYW5pbWF0ZSh7b3BhY2l0eTowfSwxMDAsZnVuY3Rpb24oKXtjLmF0dHIoXCJzcmNcIixkKS5hbmltYXRlKHtvcGFjaXR5OjF9LDIwMCxmdW5jdGlvbigpe2MucmVtb3ZlQXR0cihcImRhdGEtbGF6eVwiKS5yZW1vdmVDbGFzcyhcInNsaWNrLWxvYWRpbmdcIil9KSxiLiRzbGlkZXIudHJpZ2dlcihcImxhenlMb2FkZWRcIixbYixjLGRdKX0pfSxlLm9uZXJyb3I9ZnVuY3Rpb24oKXtjLnJlbW92ZUF0dHIoXCJkYXRhLWxhenlcIikucmVtb3ZlQ2xhc3MoXCJzbGljay1sb2FkaW5nXCIpLmFkZENsYXNzKFwic2xpY2stbGF6eWxvYWQtZXJyb3JcIiksYi4kc2xpZGVyLnRyaWdnZXIoXCJsYXp5TG9hZEVycm9yXCIsW2IsYyxkXSl9LGUuc3JjPWR9KX12YXIgYyxkLGUsZixiPXRoaXM7Yi5vcHRpb25zLmNlbnRlck1vZGU9PT0hMD9iLm9wdGlvbnMuaW5maW5pdGU9PT0hMD8oZT1iLmN1cnJlbnRTbGlkZSsoYi5vcHRpb25zLnNsaWRlc1RvU2hvdy8yKzEpLGY9ZStiLm9wdGlvbnMuc2xpZGVzVG9TaG93KzIpOihlPU1hdGgubWF4KDAsYi5jdXJyZW50U2xpZGUtKGIub3B0aW9ucy5zbGlkZXNUb1Nob3cvMisxKSksZj0yKyhiLm9wdGlvbnMuc2xpZGVzVG9TaG93LzIrMSkrYi5jdXJyZW50U2xpZGUpOihlPWIub3B0aW9ucy5pbmZpbml0ZT9iLm9wdGlvbnMuc2xpZGVzVG9TaG93K2IuY3VycmVudFNsaWRlOmIuY3VycmVudFNsaWRlLGY9TWF0aC5jZWlsKGUrYi5vcHRpb25zLnNsaWRlc1RvU2hvdyksYi5vcHRpb25zLmZhZGU9PT0hMCYmKGU+MCYmZS0tLGY8PWIuc2xpZGVDb3VudCYmZisrKSksYz1iLiRzbGlkZXIuZmluZChcIi5zbGljay1zbGlkZVwiKS5zbGljZShlLGYpLGcoYyksYi5zbGlkZUNvdW50PD1iLm9wdGlvbnMuc2xpZGVzVG9TaG93PyhkPWIuJHNsaWRlci5maW5kKFwiLnNsaWNrLXNsaWRlXCIpLGcoZCkpOmIuY3VycmVudFNsaWRlPj1iLnNsaWRlQ291bnQtYi5vcHRpb25zLnNsaWRlc1RvU2hvdz8oZD1iLiRzbGlkZXIuZmluZChcIi5zbGljay1jbG9uZWRcIikuc2xpY2UoMCxiLm9wdGlvbnMuc2xpZGVzVG9TaG93KSxnKGQpKTowPT09Yi5jdXJyZW50U2xpZGUmJihkPWIuJHNsaWRlci5maW5kKFwiLnNsaWNrLWNsb25lZFwiKS5zbGljZSgtMSpiLm9wdGlvbnMuc2xpZGVzVG9TaG93KSxnKGQpKX0sYi5wcm90b3R5cGUubG9hZFNsaWRlcj1mdW5jdGlvbigpe3ZhciBhPXRoaXM7YS5zZXRQb3NpdGlvbigpLGEuJHNsaWRlVHJhY2suY3NzKHtvcGFjaXR5OjF9KSxhLiRzbGlkZXIucmVtb3ZlQ2xhc3MoXCJzbGljay1sb2FkaW5nXCIpLGEuaW5pdFVJKCksXCJwcm9ncmVzc2l2ZVwiPT09YS5vcHRpb25zLmxhenlMb2FkJiZhLnByb2dyZXNzaXZlTGF6eUxvYWQoKX0sYi5wcm90b3R5cGUubmV4dD1iLnByb3RvdHlwZS5zbGlja05leHQ9ZnVuY3Rpb24oKXt2YXIgYT10aGlzO2EuY2hhbmdlU2xpZGUoe2RhdGE6e21lc3NhZ2U6XCJuZXh0XCJ9fSl9LGIucHJvdG90eXBlLm9yaWVudGF0aW9uQ2hhbmdlPWZ1bmN0aW9uKCl7dmFyIGE9dGhpczthLmNoZWNrUmVzcG9uc2l2ZSgpLGEuc2V0UG9zaXRpb24oKX0sYi5wcm90b3R5cGUucGF1c2U9Yi5wcm90b3R5cGUuc2xpY2tQYXVzZT1mdW5jdGlvbigpe3ZhciBhPXRoaXM7YS5hdXRvUGxheUNsZWFyKCksYS5wYXVzZWQ9ITB9LGIucHJvdG90eXBlLnBsYXk9Yi5wcm90b3R5cGUuc2xpY2tQbGF5PWZ1bmN0aW9uKCl7dmFyIGE9dGhpczthLmF1dG9QbGF5KCksYS5vcHRpb25zLmF1dG9wbGF5PSEwLGEucGF1c2VkPSExLGEuZm9jdXNzZWQ9ITEsYS5pbnRlcnJ1cHRlZD0hMX0sYi5wcm90b3R5cGUucG9zdFNsaWRlPWZ1bmN0aW9uKGEpe3ZhciBiPXRoaXM7Yi51bnNsaWNrZWR8fChiLiRzbGlkZXIudHJpZ2dlcihcImFmdGVyQ2hhbmdlXCIsW2IsYV0pLGIuYW5pbWF0aW5nPSExLGIuc2V0UG9zaXRpb24oKSxiLnN3aXBlTGVmdD1udWxsLGIub3B0aW9ucy5hdXRvcGxheSYmYi5hdXRvUGxheSgpLGIub3B0aW9ucy5hY2Nlc3NpYmlsaXR5PT09ITAmJmIuaW5pdEFEQSgpKX0sYi5wcm90b3R5cGUucHJldj1iLnByb3RvdHlwZS5zbGlja1ByZXY9ZnVuY3Rpb24oKXt2YXIgYT10aGlzO2EuY2hhbmdlU2xpZGUoe2RhdGE6e21lc3NhZ2U6XCJwcmV2aW91c1wifX0pfSxiLnByb3RvdHlwZS5wcmV2ZW50RGVmYXVsdD1mdW5jdGlvbihhKXthLnByZXZlbnREZWZhdWx0KCl9LGIucHJvdG90eXBlLnByb2dyZXNzaXZlTGF6eUxvYWQ9ZnVuY3Rpb24oYil7Yj1ifHwxO3ZhciBlLGYsZyxjPXRoaXMsZD1hKFwiaW1nW2RhdGEtbGF6eV1cIixjLiRzbGlkZXIpO2QubGVuZ3RoPyhlPWQuZmlyc3QoKSxmPWUuYXR0cihcImRhdGEtbGF6eVwiKSxnPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIiksZy5vbmxvYWQ9ZnVuY3Rpb24oKXtlLmF0dHIoXCJzcmNcIixmKS5yZW1vdmVBdHRyKFwiZGF0YS1sYXp5XCIpLnJlbW92ZUNsYXNzKFwic2xpY2stbG9hZGluZ1wiKSxjLm9wdGlvbnMuYWRhcHRpdmVIZWlnaHQ9PT0hMCYmYy5zZXRQb3NpdGlvbigpLGMuJHNsaWRlci50cmlnZ2VyKFwibGF6eUxvYWRlZFwiLFtjLGUsZl0pLGMucHJvZ3Jlc3NpdmVMYXp5TG9hZCgpfSxnLm9uZXJyb3I9ZnVuY3Rpb24oKXszPmI/c2V0VGltZW91dChmdW5jdGlvbigpe2MucHJvZ3Jlc3NpdmVMYXp5TG9hZChiKzEpfSw1MDApOihlLnJlbW92ZUF0dHIoXCJkYXRhLWxhenlcIikucmVtb3ZlQ2xhc3MoXCJzbGljay1sb2FkaW5nXCIpLmFkZENsYXNzKFwic2xpY2stbGF6eWxvYWQtZXJyb3JcIiksYy4kc2xpZGVyLnRyaWdnZXIoXCJsYXp5TG9hZEVycm9yXCIsW2MsZSxmXSksYy5wcm9ncmVzc2l2ZUxhenlMb2FkKCkpfSxnLnNyYz1mKTpjLiRzbGlkZXIudHJpZ2dlcihcImFsbEltYWdlc0xvYWRlZFwiLFtjXSl9LGIucHJvdG90eXBlLnJlZnJlc2g9ZnVuY3Rpb24oYil7dmFyIGQsZSxjPXRoaXM7ZT1jLnNsaWRlQ291bnQtYy5vcHRpb25zLnNsaWRlc1RvU2hvdywhYy5vcHRpb25zLmluZmluaXRlJiZjLmN1cnJlbnRTbGlkZT5lJiYoYy5jdXJyZW50U2xpZGU9ZSksYy5zbGlkZUNvdW50PD1jLm9wdGlvbnMuc2xpZGVzVG9TaG93JiYoYy5jdXJyZW50U2xpZGU9MCksZD1jLmN1cnJlbnRTbGlkZSxjLmRlc3Ryb3koITApLGEuZXh0ZW5kKGMsYy5pbml0aWFscyx7Y3VycmVudFNsaWRlOmR9KSxjLmluaXQoKSxifHxjLmNoYW5nZVNsaWRlKHtkYXRhOnttZXNzYWdlOlwiaW5kZXhcIixpbmRleDpkfX0sITEpfSxiLnByb3RvdHlwZS5yZWdpc3RlckJyZWFrcG9pbnRzPWZ1bmN0aW9uKCl7dmFyIGMsZCxlLGI9dGhpcyxmPWIub3B0aW9ucy5yZXNwb25zaXZlfHxudWxsO2lmKFwiYXJyYXlcIj09PWEudHlwZShmKSYmZi5sZW5ndGgpe2IucmVzcG9uZFRvPWIub3B0aW9ucy5yZXNwb25kVG98fFwid2luZG93XCI7Zm9yKGMgaW4gZilpZihlPWIuYnJlYWtwb2ludHMubGVuZ3RoLTEsZD1mW2NdLmJyZWFrcG9pbnQsZi5oYXNPd25Qcm9wZXJ0eShjKSl7Zm9yKDtlPj0wOyliLmJyZWFrcG9pbnRzW2VdJiZiLmJyZWFrcG9pbnRzW2VdPT09ZCYmYi5icmVha3BvaW50cy5zcGxpY2UoZSwxKSxlLS07Yi5icmVha3BvaW50cy5wdXNoKGQpLGIuYnJlYWtwb2ludFNldHRpbmdzW2RdPWZbY10uc2V0dGluZ3N9Yi5icmVha3BvaW50cy5zb3J0KGZ1bmN0aW9uKGEsYyl7cmV0dXJuIGIub3B0aW9ucy5tb2JpbGVGaXJzdD9hLWM6Yy1hfSl9fSxiLnByb3RvdHlwZS5yZWluaXQ9ZnVuY3Rpb24oKXt2YXIgYj10aGlzO2IuJHNsaWRlcz1iLiRzbGlkZVRyYWNrLmNoaWxkcmVuKGIub3B0aW9ucy5zbGlkZSkuYWRkQ2xhc3MoXCJzbGljay1zbGlkZVwiKSxiLnNsaWRlQ291bnQ9Yi4kc2xpZGVzLmxlbmd0aCxiLmN1cnJlbnRTbGlkZT49Yi5zbGlkZUNvdW50JiYwIT09Yi5jdXJyZW50U2xpZGUmJihiLmN1cnJlbnRTbGlkZT1iLmN1cnJlbnRTbGlkZS1iLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwpLGIuc2xpZGVDb3VudDw9Yi5vcHRpb25zLnNsaWRlc1RvU2hvdyYmKGIuY3VycmVudFNsaWRlPTApLGIucmVnaXN0ZXJCcmVha3BvaW50cygpLGIuc2V0UHJvcHMoKSxiLnNldHVwSW5maW5pdGUoKSxiLmJ1aWxkQXJyb3dzKCksYi51cGRhdGVBcnJvd3MoKSxiLmluaXRBcnJvd0V2ZW50cygpLGIuYnVpbGREb3RzKCksYi51cGRhdGVEb3RzKCksYi5pbml0RG90RXZlbnRzKCksYi5jbGVhblVwU2xpZGVFdmVudHMoKSxiLmluaXRTbGlkZUV2ZW50cygpLGIuY2hlY2tSZXNwb25zaXZlKCExLCEwKSxiLm9wdGlvbnMuZm9jdXNPblNlbGVjdD09PSEwJiZhKGIuJHNsaWRlVHJhY2spLmNoaWxkcmVuKCkub24oXCJjbGljay5zbGlja1wiLGIuc2VsZWN0SGFuZGxlciksYi5zZXRTbGlkZUNsYXNzZXMoXCJudW1iZXJcIj09dHlwZW9mIGIuY3VycmVudFNsaWRlP2IuY3VycmVudFNsaWRlOjApLGIuc2V0UG9zaXRpb24oKSxiLmZvY3VzSGFuZGxlcigpLGIucGF1c2VkPSFiLm9wdGlvbnMuYXV0b3BsYXksYi5hdXRvUGxheSgpLGIuJHNsaWRlci50cmlnZ2VyKFwicmVJbml0XCIsW2JdKX0sYi5wcm90b3R5cGUucmVzaXplPWZ1bmN0aW9uKCl7dmFyIGI9dGhpczthKHdpbmRvdykud2lkdGgoKSE9PWIud2luZG93V2lkdGgmJihjbGVhclRpbWVvdXQoYi53aW5kb3dEZWxheSksYi53aW5kb3dEZWxheT13aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe2Iud2luZG93V2lkdGg9YSh3aW5kb3cpLndpZHRoKCksYi5jaGVja1Jlc3BvbnNpdmUoKSxiLnVuc2xpY2tlZHx8Yi5zZXRQb3NpdGlvbigpfSw1MCkpfSxiLnByb3RvdHlwZS5yZW1vdmVTbGlkZT1iLnByb3RvdHlwZS5zbGlja1JlbW92ZT1mdW5jdGlvbihhLGIsYyl7dmFyIGQ9dGhpcztyZXR1cm5cImJvb2xlYW5cIj09dHlwZW9mIGE/KGI9YSxhPWI9PT0hMD8wOmQuc2xpZGVDb3VudC0xKTphPWI9PT0hMD8tLWE6YSxkLnNsaWRlQ291bnQ8MXx8MD5hfHxhPmQuc2xpZGVDb3VudC0xPyExOihkLnVubG9hZCgpLGM9PT0hMD9kLiRzbGlkZVRyYWNrLmNoaWxkcmVuKCkucmVtb3ZlKCk6ZC4kc2xpZGVUcmFjay5jaGlsZHJlbih0aGlzLm9wdGlvbnMuc2xpZGUpLmVxKGEpLnJlbW92ZSgpLGQuJHNsaWRlcz1kLiRzbGlkZVRyYWNrLmNoaWxkcmVuKHRoaXMub3B0aW9ucy5zbGlkZSksZC4kc2xpZGVUcmFjay5jaGlsZHJlbih0aGlzLm9wdGlvbnMuc2xpZGUpLmRldGFjaCgpLGQuJHNsaWRlVHJhY2suYXBwZW5kKGQuJHNsaWRlcyksZC4kc2xpZGVzQ2FjaGU9ZC4kc2xpZGVzLHZvaWQgZC5yZWluaXQoKSl9LGIucHJvdG90eXBlLnNldENTUz1mdW5jdGlvbihhKXt2YXIgZCxlLGI9dGhpcyxjPXt9O2Iub3B0aW9ucy5ydGw9PT0hMCYmKGE9LWEpLGQ9XCJsZWZ0XCI9PWIucG9zaXRpb25Qcm9wP01hdGguY2VpbChhKStcInB4XCI6XCIwcHhcIixlPVwidG9wXCI9PWIucG9zaXRpb25Qcm9wP01hdGguY2VpbChhKStcInB4XCI6XCIwcHhcIixjW2IucG9zaXRpb25Qcm9wXT1hLGIudHJhbnNmb3Jtc0VuYWJsZWQ9PT0hMT9iLiRzbGlkZVRyYWNrLmNzcyhjKTooYz17fSxiLmNzc1RyYW5zaXRpb25zPT09ITE/KGNbYi5hbmltVHlwZV09XCJ0cmFuc2xhdGUoXCIrZCtcIiwgXCIrZStcIilcIixiLiRzbGlkZVRyYWNrLmNzcyhjKSk6KGNbYi5hbmltVHlwZV09XCJ0cmFuc2xhdGUzZChcIitkK1wiLCBcIitlK1wiLCAwcHgpXCIsYi4kc2xpZGVUcmFjay5jc3MoYykpKX0sYi5wcm90b3R5cGUuc2V0RGltZW5zaW9ucz1mdW5jdGlvbigpe3ZhciBhPXRoaXM7YS5vcHRpb25zLnZlcnRpY2FsPT09ITE/YS5vcHRpb25zLmNlbnRlck1vZGU9PT0hMCYmYS4kbGlzdC5jc3Moe3BhZGRpbmc6XCIwcHggXCIrYS5vcHRpb25zLmNlbnRlclBhZGRpbmd9KTooYS4kbGlzdC5oZWlnaHQoYS4kc2xpZGVzLmZpcnN0KCkub3V0ZXJIZWlnaHQoITApKmEub3B0aW9ucy5zbGlkZXNUb1Nob3cpLGEub3B0aW9ucy5jZW50ZXJNb2RlPT09ITAmJmEuJGxpc3QuY3NzKHtwYWRkaW5nOmEub3B0aW9ucy5jZW50ZXJQYWRkaW5nK1wiIDBweFwifSkpLGEubGlzdFdpZHRoPWEuJGxpc3Qud2lkdGgoKSxhLmxpc3RIZWlnaHQ9YS4kbGlzdC5oZWlnaHQoKSxhLm9wdGlvbnMudmVydGljYWw9PT0hMSYmYS5vcHRpb25zLnZhcmlhYmxlV2lkdGg9PT0hMT8oYS5zbGlkZVdpZHRoPU1hdGguY2VpbChhLmxpc3RXaWR0aC9hLm9wdGlvbnMuc2xpZGVzVG9TaG93KSxhLiRzbGlkZVRyYWNrLndpZHRoKE1hdGguY2VpbChhLnNsaWRlV2lkdGgqYS4kc2xpZGVUcmFjay5jaGlsZHJlbihcIi5zbGljay1zbGlkZVwiKS5sZW5ndGgpKSk6YS5vcHRpb25zLnZhcmlhYmxlV2lkdGg9PT0hMD9hLiRzbGlkZVRyYWNrLndpZHRoKDVlMyphLnNsaWRlQ291bnQpOihhLnNsaWRlV2lkdGg9TWF0aC5jZWlsKGEubGlzdFdpZHRoKSxhLiRzbGlkZVRyYWNrLmhlaWdodChNYXRoLmNlaWwoYS4kc2xpZGVzLmZpcnN0KCkub3V0ZXJIZWlnaHQoITApKmEuJHNsaWRlVHJhY2suY2hpbGRyZW4oXCIuc2xpY2stc2xpZGVcIikubGVuZ3RoKSkpO3ZhciBiPWEuJHNsaWRlcy5maXJzdCgpLm91dGVyV2lkdGgoITApLWEuJHNsaWRlcy5maXJzdCgpLndpZHRoKCk7YS5vcHRpb25zLnZhcmlhYmxlV2lkdGg9PT0hMSYmYS4kc2xpZGVUcmFjay5jaGlsZHJlbihcIi5zbGljay1zbGlkZVwiKS53aWR0aChhLnNsaWRlV2lkdGgtYil9LGIucHJvdG90eXBlLnNldEZhZGU9ZnVuY3Rpb24oKXt2YXIgYyxiPXRoaXM7Yi4kc2xpZGVzLmVhY2goZnVuY3Rpb24oZCxlKXtjPWIuc2xpZGVXaWR0aCpkKi0xLGIub3B0aW9ucy5ydGw9PT0hMD9hKGUpLmNzcyh7cG9zaXRpb246XCJyZWxhdGl2ZVwiLHJpZ2h0OmMsdG9wOjAsekluZGV4OmIub3B0aW9ucy56SW5kZXgtMixvcGFjaXR5OjB9KTphKGUpLmNzcyh7cG9zaXRpb246XCJyZWxhdGl2ZVwiLGxlZnQ6Yyx0b3A6MCx6SW5kZXg6Yi5vcHRpb25zLnpJbmRleC0yLG9wYWNpdHk6MH0pfSksYi4kc2xpZGVzLmVxKGIuY3VycmVudFNsaWRlKS5jc3Moe3pJbmRleDpiLm9wdGlvbnMuekluZGV4LTEsb3BhY2l0eToxfSl9LGIucHJvdG90eXBlLnNldEhlaWdodD1mdW5jdGlvbigpe3ZhciBhPXRoaXM7aWYoMT09PWEub3B0aW9ucy5zbGlkZXNUb1Nob3cmJmEub3B0aW9ucy5hZGFwdGl2ZUhlaWdodD09PSEwJiZhLm9wdGlvbnMudmVydGljYWw9PT0hMSl7dmFyIGI9YS4kc2xpZGVzLmVxKGEuY3VycmVudFNsaWRlKS5vdXRlckhlaWdodCghMCk7YS4kbGlzdC5jc3MoXCJoZWlnaHRcIixiKX19LGIucHJvdG90eXBlLnNldE9wdGlvbj1iLnByb3RvdHlwZS5zbGlja1NldE9wdGlvbj1mdW5jdGlvbigpe3ZhciBjLGQsZSxmLGgsYj10aGlzLGc9ITE7aWYoXCJvYmplY3RcIj09PWEudHlwZShhcmd1bWVudHNbMF0pPyhlPWFyZ3VtZW50c1swXSxnPWFyZ3VtZW50c1sxXSxoPVwibXVsdGlwbGVcIik6XCJzdHJpbmdcIj09PWEudHlwZShhcmd1bWVudHNbMF0pJiYoZT1hcmd1bWVudHNbMF0sZj1hcmd1bWVudHNbMV0sZz1hcmd1bWVudHNbMl0sXCJyZXNwb25zaXZlXCI9PT1hcmd1bWVudHNbMF0mJlwiYXJyYXlcIj09PWEudHlwZShhcmd1bWVudHNbMV0pP2g9XCJyZXNwb25zaXZlXCI6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGFyZ3VtZW50c1sxXSYmKGg9XCJzaW5nbGVcIikpLFwic2luZ2xlXCI9PT1oKWIub3B0aW9uc1tlXT1mO2Vsc2UgaWYoXCJtdWx0aXBsZVwiPT09aClhLmVhY2goZSxmdW5jdGlvbihhLGMpe2Iub3B0aW9uc1thXT1jfSk7ZWxzZSBpZihcInJlc3BvbnNpdmVcIj09PWgpZm9yKGQgaW4gZilpZihcImFycmF5XCIhPT1hLnR5cGUoYi5vcHRpb25zLnJlc3BvbnNpdmUpKWIub3B0aW9ucy5yZXNwb25zaXZlPVtmW2RdXTtlbHNle2ZvcihjPWIub3B0aW9ucy5yZXNwb25zaXZlLmxlbmd0aC0xO2M+PTA7KWIub3B0aW9ucy5yZXNwb25zaXZlW2NdLmJyZWFrcG9pbnQ9PT1mW2RdLmJyZWFrcG9pbnQmJmIub3B0aW9ucy5yZXNwb25zaXZlLnNwbGljZShjLDEpLGMtLTtiLm9wdGlvbnMucmVzcG9uc2l2ZS5wdXNoKGZbZF0pfWcmJihiLnVubG9hZCgpLGIucmVpbml0KCkpfSxiLnByb3RvdHlwZS5zZXRQb3NpdGlvbj1mdW5jdGlvbigpe3ZhciBhPXRoaXM7YS5zZXREaW1lbnNpb25zKCksYS5zZXRIZWlnaHQoKSxhLm9wdGlvbnMuZmFkZT09PSExP2Euc2V0Q1NTKGEuZ2V0TGVmdChhLmN1cnJlbnRTbGlkZSkpOmEuc2V0RmFkZSgpLGEuJHNsaWRlci50cmlnZ2VyKFwic2V0UG9zaXRpb25cIixbYV0pfSxiLnByb3RvdHlwZS5zZXRQcm9wcz1mdW5jdGlvbigpe3ZhciBhPXRoaXMsYj1kb2N1bWVudC5ib2R5LnN0eWxlO2EucG9zaXRpb25Qcm9wPWEub3B0aW9ucy52ZXJ0aWNhbD09PSEwP1widG9wXCI6XCJsZWZ0XCIsXCJ0b3BcIj09PWEucG9zaXRpb25Qcm9wP2EuJHNsaWRlci5hZGRDbGFzcyhcInNsaWNrLXZlcnRpY2FsXCIpOmEuJHNsaWRlci5yZW1vdmVDbGFzcyhcInNsaWNrLXZlcnRpY2FsXCIpLCh2b2lkIDAhPT1iLldlYmtpdFRyYW5zaXRpb258fHZvaWQgMCE9PWIuTW96VHJhbnNpdGlvbnx8dm9pZCAwIT09Yi5tc1RyYW5zaXRpb24pJiZhLm9wdGlvbnMudXNlQ1NTPT09ITAmJihhLmNzc1RyYW5zaXRpb25zPSEwKSxhLm9wdGlvbnMuZmFkZSYmKFwibnVtYmVyXCI9PXR5cGVvZiBhLm9wdGlvbnMuekluZGV4P2Eub3B0aW9ucy56SW5kZXg8MyYmKGEub3B0aW9ucy56SW5kZXg9Myk6YS5vcHRpb25zLnpJbmRleD1hLmRlZmF1bHRzLnpJbmRleCksdm9pZCAwIT09Yi5PVHJhbnNmb3JtJiYoYS5hbmltVHlwZT1cIk9UcmFuc2Zvcm1cIixhLnRyYW5zZm9ybVR5cGU9XCItby10cmFuc2Zvcm1cIixhLnRyYW5zaXRpb25UeXBlPVwiT1RyYW5zaXRpb25cIix2b2lkIDA9PT1iLnBlcnNwZWN0aXZlUHJvcGVydHkmJnZvaWQgMD09PWIud2Via2l0UGVyc3BlY3RpdmUmJihhLmFuaW1UeXBlPSExKSksdm9pZCAwIT09Yi5Nb3pUcmFuc2Zvcm0mJihhLmFuaW1UeXBlPVwiTW96VHJhbnNmb3JtXCIsYS50cmFuc2Zvcm1UeXBlPVwiLW1vei10cmFuc2Zvcm1cIixhLnRyYW5zaXRpb25UeXBlPVwiTW96VHJhbnNpdGlvblwiLHZvaWQgMD09PWIucGVyc3BlY3RpdmVQcm9wZXJ0eSYmdm9pZCAwPT09Yi5Nb3pQZXJzcGVjdGl2ZSYmKGEuYW5pbVR5cGU9ITEpKSx2b2lkIDAhPT1iLndlYmtpdFRyYW5zZm9ybSYmKGEuYW5pbVR5cGU9XCJ3ZWJraXRUcmFuc2Zvcm1cIixhLnRyYW5zZm9ybVR5cGU9XCItd2Via2l0LXRyYW5zZm9ybVwiLGEudHJhbnNpdGlvblR5cGU9XCJ3ZWJraXRUcmFuc2l0aW9uXCIsdm9pZCAwPT09Yi5wZXJzcGVjdGl2ZVByb3BlcnR5JiZ2b2lkIDA9PT1iLndlYmtpdFBlcnNwZWN0aXZlJiYoYS5hbmltVHlwZT0hMSkpLHZvaWQgMCE9PWIubXNUcmFuc2Zvcm0mJihhLmFuaW1UeXBlPVwibXNUcmFuc2Zvcm1cIixhLnRyYW5zZm9ybVR5cGU9XCItbXMtdHJhbnNmb3JtXCIsYS50cmFuc2l0aW9uVHlwZT1cIm1zVHJhbnNpdGlvblwiLHZvaWQgMD09PWIubXNUcmFuc2Zvcm0mJihhLmFuaW1UeXBlPSExKSksdm9pZCAwIT09Yi50cmFuc2Zvcm0mJmEuYW5pbVR5cGUhPT0hMSYmKGEuYW5pbVR5cGU9XCJ0cmFuc2Zvcm1cIixhLnRyYW5zZm9ybVR5cGU9XCJ0cmFuc2Zvcm1cIixhLnRyYW5zaXRpb25UeXBlPVwidHJhbnNpdGlvblwiKSxhLnRyYW5zZm9ybXNFbmFibGVkPWEub3B0aW9ucy51c2VUcmFuc2Zvcm0mJm51bGwhPT1hLmFuaW1UeXBlJiZhLmFuaW1UeXBlIT09ITF9LGIucHJvdG90eXBlLnNldFNsaWRlQ2xhc3Nlcz1mdW5jdGlvbihhKXt2YXIgYyxkLGUsZixiPXRoaXM7ZD1iLiRzbGlkZXIuZmluZChcIi5zbGljay1zbGlkZVwiKS5yZW1vdmVDbGFzcyhcInNsaWNrLWFjdGl2ZSBzbGljay1jZW50ZXIgc2xpY2stY3VycmVudFwiKS5hdHRyKFwiYXJpYS1oaWRkZW5cIixcInRydWVcIiksYi4kc2xpZGVzLmVxKGEpLmFkZENsYXNzKFwic2xpY2stY3VycmVudFwiKSxiLm9wdGlvbnMuY2VudGVyTW9kZT09PSEwPyhjPU1hdGguZmxvb3IoYi5vcHRpb25zLnNsaWRlc1RvU2hvdy8yKSxiLm9wdGlvbnMuaW5maW5pdGU9PT0hMCYmKGE+PWMmJmE8PWIuc2xpZGVDb3VudC0xLWM/Yi4kc2xpZGVzLnNsaWNlKGEtYyxhK2MrMSkuYWRkQ2xhc3MoXCJzbGljay1hY3RpdmVcIikuYXR0cihcImFyaWEtaGlkZGVuXCIsXCJmYWxzZVwiKTooZT1iLm9wdGlvbnMuc2xpZGVzVG9TaG93K2EsXG5kLnNsaWNlKGUtYysxLGUrYysyKS5hZGRDbGFzcyhcInNsaWNrLWFjdGl2ZVwiKS5hdHRyKFwiYXJpYS1oaWRkZW5cIixcImZhbHNlXCIpKSwwPT09YT9kLmVxKGQubGVuZ3RoLTEtYi5vcHRpb25zLnNsaWRlc1RvU2hvdykuYWRkQ2xhc3MoXCJzbGljay1jZW50ZXJcIik6YT09PWIuc2xpZGVDb3VudC0xJiZkLmVxKGIub3B0aW9ucy5zbGlkZXNUb1Nob3cpLmFkZENsYXNzKFwic2xpY2stY2VudGVyXCIpKSxiLiRzbGlkZXMuZXEoYSkuYWRkQ2xhc3MoXCJzbGljay1jZW50ZXJcIikpOmE+PTAmJmE8PWIuc2xpZGVDb3VudC1iLm9wdGlvbnMuc2xpZGVzVG9TaG93P2IuJHNsaWRlcy5zbGljZShhLGErYi5vcHRpb25zLnNsaWRlc1RvU2hvdykuYWRkQ2xhc3MoXCJzbGljay1hY3RpdmVcIikuYXR0cihcImFyaWEtaGlkZGVuXCIsXCJmYWxzZVwiKTpkLmxlbmd0aDw9Yi5vcHRpb25zLnNsaWRlc1RvU2hvdz9kLmFkZENsYXNzKFwic2xpY2stYWN0aXZlXCIpLmF0dHIoXCJhcmlhLWhpZGRlblwiLFwiZmFsc2VcIik6KGY9Yi5zbGlkZUNvdW50JWIub3B0aW9ucy5zbGlkZXNUb1Nob3csZT1iLm9wdGlvbnMuaW5maW5pdGU9PT0hMD9iLm9wdGlvbnMuc2xpZGVzVG9TaG93K2E6YSxiLm9wdGlvbnMuc2xpZGVzVG9TaG93PT1iLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwmJmIuc2xpZGVDb3VudC1hPGIub3B0aW9ucy5zbGlkZXNUb1Nob3c/ZC5zbGljZShlLShiLm9wdGlvbnMuc2xpZGVzVG9TaG93LWYpLGUrZikuYWRkQ2xhc3MoXCJzbGljay1hY3RpdmVcIikuYXR0cihcImFyaWEtaGlkZGVuXCIsXCJmYWxzZVwiKTpkLnNsaWNlKGUsZStiLm9wdGlvbnMuc2xpZGVzVG9TaG93KS5hZGRDbGFzcyhcInNsaWNrLWFjdGl2ZVwiKS5hdHRyKFwiYXJpYS1oaWRkZW5cIixcImZhbHNlXCIpKSxcIm9uZGVtYW5kXCI9PT1iLm9wdGlvbnMubGF6eUxvYWQmJmIubGF6eUxvYWQoKX0sYi5wcm90b3R5cGUuc2V0dXBJbmZpbml0ZT1mdW5jdGlvbigpe3ZhciBjLGQsZSxiPXRoaXM7aWYoYi5vcHRpb25zLmZhZGU9PT0hMCYmKGIub3B0aW9ucy5jZW50ZXJNb2RlPSExKSxiLm9wdGlvbnMuaW5maW5pdGU9PT0hMCYmYi5vcHRpb25zLmZhZGU9PT0hMSYmKGQ9bnVsbCxiLnNsaWRlQ291bnQ+Yi5vcHRpb25zLnNsaWRlc1RvU2hvdykpe2ZvcihlPWIub3B0aW9ucy5jZW50ZXJNb2RlPT09ITA/Yi5vcHRpb25zLnNsaWRlc1RvU2hvdysxOmIub3B0aW9ucy5zbGlkZXNUb1Nob3csYz1iLnNsaWRlQ291bnQ7Yz5iLnNsaWRlQ291bnQtZTtjLT0xKWQ9Yy0xLGEoYi4kc2xpZGVzW2RdKS5jbG9uZSghMCkuYXR0cihcImlkXCIsXCJcIikuYXR0cihcImRhdGEtc2xpY2staW5kZXhcIixkLWIuc2xpZGVDb3VudCkucHJlcGVuZFRvKGIuJHNsaWRlVHJhY2spLmFkZENsYXNzKFwic2xpY2stY2xvbmVkXCIpO2ZvcihjPTA7ZT5jO2MrPTEpZD1jLGEoYi4kc2xpZGVzW2RdKS5jbG9uZSghMCkuYXR0cihcImlkXCIsXCJcIikuYXR0cihcImRhdGEtc2xpY2staW5kZXhcIixkK2Iuc2xpZGVDb3VudCkuYXBwZW5kVG8oYi4kc2xpZGVUcmFjaykuYWRkQ2xhc3MoXCJzbGljay1jbG9uZWRcIik7Yi4kc2xpZGVUcmFjay5maW5kKFwiLnNsaWNrLWNsb25lZFwiKS5maW5kKFwiW2lkXVwiKS5lYWNoKGZ1bmN0aW9uKCl7YSh0aGlzKS5hdHRyKFwiaWRcIixcIlwiKX0pfX0sYi5wcm90b3R5cGUuaW50ZXJydXB0PWZ1bmN0aW9uKGEpe3ZhciBiPXRoaXM7YXx8Yi5hdXRvUGxheSgpLGIuaW50ZXJydXB0ZWQ9YX0sYi5wcm90b3R5cGUuc2VsZWN0SGFuZGxlcj1mdW5jdGlvbihiKXt2YXIgYz10aGlzLGQ9YShiLnRhcmdldCkuaXMoXCIuc2xpY2stc2xpZGVcIik/YShiLnRhcmdldCk6YShiLnRhcmdldCkucGFyZW50cyhcIi5zbGljay1zbGlkZVwiKSxlPXBhcnNlSW50KGQuYXR0cihcImRhdGEtc2xpY2staW5kZXhcIikpO3JldHVybiBlfHwoZT0wKSxjLnNsaWRlQ291bnQ8PWMub3B0aW9ucy5zbGlkZXNUb1Nob3c/KGMuc2V0U2xpZGVDbGFzc2VzKGUpLHZvaWQgYy5hc05hdkZvcihlKSk6dm9pZCBjLnNsaWRlSGFuZGxlcihlKX0sYi5wcm90b3R5cGUuc2xpZGVIYW5kbGVyPWZ1bmN0aW9uKGEsYixjKXt2YXIgZCxlLGYsZyxqLGg9bnVsbCxpPXRoaXM7cmV0dXJuIGI9Ynx8ITEsaS5hbmltYXRpbmc9PT0hMCYmaS5vcHRpb25zLndhaXRGb3JBbmltYXRlPT09ITB8fGkub3B0aW9ucy5mYWRlPT09ITAmJmkuY3VycmVudFNsaWRlPT09YXx8aS5zbGlkZUNvdW50PD1pLm9wdGlvbnMuc2xpZGVzVG9TaG93P3ZvaWQgMDooYj09PSExJiZpLmFzTmF2Rm9yKGEpLGQ9YSxoPWkuZ2V0TGVmdChkKSxnPWkuZ2V0TGVmdChpLmN1cnJlbnRTbGlkZSksaS5jdXJyZW50TGVmdD1udWxsPT09aS5zd2lwZUxlZnQ/ZzppLnN3aXBlTGVmdCxpLm9wdGlvbnMuaW5maW5pdGU9PT0hMSYmaS5vcHRpb25zLmNlbnRlck1vZGU9PT0hMSYmKDA+YXx8YT5pLmdldERvdENvdW50KCkqaS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsKT92b2lkKGkub3B0aW9ucy5mYWRlPT09ITEmJihkPWkuY3VycmVudFNsaWRlLGMhPT0hMD9pLmFuaW1hdGVTbGlkZShnLGZ1bmN0aW9uKCl7aS5wb3N0U2xpZGUoZCl9KTppLnBvc3RTbGlkZShkKSkpOmkub3B0aW9ucy5pbmZpbml0ZT09PSExJiZpLm9wdGlvbnMuY2VudGVyTW9kZT09PSEwJiYoMD5hfHxhPmkuc2xpZGVDb3VudC1pLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwpP3ZvaWQoaS5vcHRpb25zLmZhZGU9PT0hMSYmKGQ9aS5jdXJyZW50U2xpZGUsYyE9PSEwP2kuYW5pbWF0ZVNsaWRlKGcsZnVuY3Rpb24oKXtpLnBvc3RTbGlkZShkKX0pOmkucG9zdFNsaWRlKGQpKSk6KGkub3B0aW9ucy5hdXRvcGxheSYmY2xlYXJJbnRlcnZhbChpLmF1dG9QbGF5VGltZXIpLGU9MD5kP2kuc2xpZGVDb3VudCVpLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwhPT0wP2kuc2xpZGVDb3VudC1pLnNsaWRlQ291bnQlaS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsOmkuc2xpZGVDb3VudCtkOmQ+PWkuc2xpZGVDb3VudD9pLnNsaWRlQ291bnQlaS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsIT09MD8wOmQtaS5zbGlkZUNvdW50OmQsaS5hbmltYXRpbmc9ITAsaS4kc2xpZGVyLnRyaWdnZXIoXCJiZWZvcmVDaGFuZ2VcIixbaSxpLmN1cnJlbnRTbGlkZSxlXSksZj1pLmN1cnJlbnRTbGlkZSxpLmN1cnJlbnRTbGlkZT1lLGkuc2V0U2xpZGVDbGFzc2VzKGkuY3VycmVudFNsaWRlKSxpLm9wdGlvbnMuYXNOYXZGb3ImJihqPWkuZ2V0TmF2VGFyZ2V0KCksaj1qLnNsaWNrKFwiZ2V0U2xpY2tcIiksai5zbGlkZUNvdW50PD1qLm9wdGlvbnMuc2xpZGVzVG9TaG93JiZqLnNldFNsaWRlQ2xhc3NlcyhpLmN1cnJlbnRTbGlkZSkpLGkudXBkYXRlRG90cygpLGkudXBkYXRlQXJyb3dzKCksaS5vcHRpb25zLmZhZGU9PT0hMD8oYyE9PSEwPyhpLmZhZGVTbGlkZU91dChmKSxpLmZhZGVTbGlkZShlLGZ1bmN0aW9uKCl7aS5wb3N0U2xpZGUoZSl9KSk6aS5wb3N0U2xpZGUoZSksdm9pZCBpLmFuaW1hdGVIZWlnaHQoKSk6dm9pZChjIT09ITA/aS5hbmltYXRlU2xpZGUoaCxmdW5jdGlvbigpe2kucG9zdFNsaWRlKGUpfSk6aS5wb3N0U2xpZGUoZSkpKSl9LGIucHJvdG90eXBlLnN0YXJ0TG9hZD1mdW5jdGlvbigpe3ZhciBhPXRoaXM7YS5vcHRpb25zLmFycm93cz09PSEwJiZhLnNsaWRlQ291bnQ+YS5vcHRpb25zLnNsaWRlc1RvU2hvdyYmKGEuJHByZXZBcnJvdy5oaWRlKCksYS4kbmV4dEFycm93LmhpZGUoKSksYS5vcHRpb25zLmRvdHM9PT0hMCYmYS5zbGlkZUNvdW50PmEub3B0aW9ucy5zbGlkZXNUb1Nob3cmJmEuJGRvdHMuaGlkZSgpLGEuJHNsaWRlci5hZGRDbGFzcyhcInNsaWNrLWxvYWRpbmdcIil9LGIucHJvdG90eXBlLnN3aXBlRGlyZWN0aW9uPWZ1bmN0aW9uKCl7dmFyIGEsYixjLGQsZT10aGlzO3JldHVybiBhPWUudG91Y2hPYmplY3Quc3RhcnRYLWUudG91Y2hPYmplY3QuY3VyWCxiPWUudG91Y2hPYmplY3Quc3RhcnRZLWUudG91Y2hPYmplY3QuY3VyWSxjPU1hdGguYXRhbjIoYixhKSxkPU1hdGgucm91bmQoMTgwKmMvTWF0aC5QSSksMD5kJiYoZD0zNjAtTWF0aC5hYnMoZCkpLDQ1Pj1kJiZkPj0wP2Uub3B0aW9ucy5ydGw9PT0hMT9cImxlZnRcIjpcInJpZ2h0XCI6MzYwPj1kJiZkPj0zMTU/ZS5vcHRpb25zLnJ0bD09PSExP1wibGVmdFwiOlwicmlnaHRcIjpkPj0xMzUmJjIyNT49ZD9lLm9wdGlvbnMucnRsPT09ITE/XCJyaWdodFwiOlwibGVmdFwiOmUub3B0aW9ucy52ZXJ0aWNhbFN3aXBpbmc9PT0hMD9kPj0zNSYmMTM1Pj1kP1wiZG93blwiOlwidXBcIjpcInZlcnRpY2FsXCJ9LGIucHJvdG90eXBlLnN3aXBlRW5kPWZ1bmN0aW9uKGEpe3ZhciBjLGQsYj10aGlzO2lmKGIuZHJhZ2dpbmc9ITEsYi5pbnRlcnJ1cHRlZD0hMSxiLnNob3VsZENsaWNrPWIudG91Y2hPYmplY3Quc3dpcGVMZW5ndGg+MTA/ITE6ITAsdm9pZCAwPT09Yi50b3VjaE9iamVjdC5jdXJYKXJldHVybiExO2lmKGIudG91Y2hPYmplY3QuZWRnZUhpdD09PSEwJiZiLiRzbGlkZXIudHJpZ2dlcihcImVkZ2VcIixbYixiLnN3aXBlRGlyZWN0aW9uKCldKSxiLnRvdWNoT2JqZWN0LnN3aXBlTGVuZ3RoPj1iLnRvdWNoT2JqZWN0Lm1pblN3aXBlKXtzd2l0Y2goZD1iLnN3aXBlRGlyZWN0aW9uKCkpe2Nhc2VcImxlZnRcIjpjYXNlXCJkb3duXCI6Yz1iLm9wdGlvbnMuc3dpcGVUb1NsaWRlP2IuY2hlY2tOYXZpZ2FibGUoYi5jdXJyZW50U2xpZGUrYi5nZXRTbGlkZUNvdW50KCkpOmIuY3VycmVudFNsaWRlK2IuZ2V0U2xpZGVDb3VudCgpLGIuY3VycmVudERpcmVjdGlvbj0wO2JyZWFrO2Nhc2VcInJpZ2h0XCI6Y2FzZVwidXBcIjpjPWIub3B0aW9ucy5zd2lwZVRvU2xpZGU/Yi5jaGVja05hdmlnYWJsZShiLmN1cnJlbnRTbGlkZS1iLmdldFNsaWRlQ291bnQoKSk6Yi5jdXJyZW50U2xpZGUtYi5nZXRTbGlkZUNvdW50KCksYi5jdXJyZW50RGlyZWN0aW9uPTF9XCJ2ZXJ0aWNhbFwiIT1kJiYoYi5zbGlkZUhhbmRsZXIoYyksYi50b3VjaE9iamVjdD17fSxiLiRzbGlkZXIudHJpZ2dlcihcInN3aXBlXCIsW2IsZF0pKX1lbHNlIGIudG91Y2hPYmplY3Quc3RhcnRYIT09Yi50b3VjaE9iamVjdC5jdXJYJiYoYi5zbGlkZUhhbmRsZXIoYi5jdXJyZW50U2xpZGUpLGIudG91Y2hPYmplY3Q9e30pfSxiLnByb3RvdHlwZS5zd2lwZUhhbmRsZXI9ZnVuY3Rpb24oYSl7dmFyIGI9dGhpcztpZighKGIub3B0aW9ucy5zd2lwZT09PSExfHxcIm9udG91Y2hlbmRcImluIGRvY3VtZW50JiZiLm9wdGlvbnMuc3dpcGU9PT0hMXx8Yi5vcHRpb25zLmRyYWdnYWJsZT09PSExJiYtMSE9PWEudHlwZS5pbmRleE9mKFwibW91c2VcIikpKXN3aXRjaChiLnRvdWNoT2JqZWN0LmZpbmdlckNvdW50PWEub3JpZ2luYWxFdmVudCYmdm9pZCAwIT09YS5vcmlnaW5hbEV2ZW50LnRvdWNoZXM/YS5vcmlnaW5hbEV2ZW50LnRvdWNoZXMubGVuZ3RoOjEsYi50b3VjaE9iamVjdC5taW5Td2lwZT1iLmxpc3RXaWR0aC9iLm9wdGlvbnMudG91Y2hUaHJlc2hvbGQsYi5vcHRpb25zLnZlcnRpY2FsU3dpcGluZz09PSEwJiYoYi50b3VjaE9iamVjdC5taW5Td2lwZT1iLmxpc3RIZWlnaHQvYi5vcHRpb25zLnRvdWNoVGhyZXNob2xkKSxhLmRhdGEuYWN0aW9uKXtjYXNlXCJzdGFydFwiOmIuc3dpcGVTdGFydChhKTticmVhaztjYXNlXCJtb3ZlXCI6Yi5zd2lwZU1vdmUoYSk7YnJlYWs7Y2FzZVwiZW5kXCI6Yi5zd2lwZUVuZChhKX19LGIucHJvdG90eXBlLnN3aXBlTW92ZT1mdW5jdGlvbihhKXt2YXIgZCxlLGYsZyxoLGI9dGhpcztyZXR1cm4gaD12b2lkIDAhPT1hLm9yaWdpbmFsRXZlbnQ/YS5vcmlnaW5hbEV2ZW50LnRvdWNoZXM6bnVsbCwhYi5kcmFnZ2luZ3x8aCYmMSE9PWgubGVuZ3RoPyExOihkPWIuZ2V0TGVmdChiLmN1cnJlbnRTbGlkZSksYi50b3VjaE9iamVjdC5jdXJYPXZvaWQgMCE9PWg/aFswXS5wYWdlWDphLmNsaWVudFgsYi50b3VjaE9iamVjdC5jdXJZPXZvaWQgMCE9PWg/aFswXS5wYWdlWTphLmNsaWVudFksYi50b3VjaE9iamVjdC5zd2lwZUxlbmd0aD1NYXRoLnJvdW5kKE1hdGguc3FydChNYXRoLnBvdyhiLnRvdWNoT2JqZWN0LmN1clgtYi50b3VjaE9iamVjdC5zdGFydFgsMikpKSxiLm9wdGlvbnMudmVydGljYWxTd2lwaW5nPT09ITAmJihiLnRvdWNoT2JqZWN0LnN3aXBlTGVuZ3RoPU1hdGgucm91bmQoTWF0aC5zcXJ0KE1hdGgucG93KGIudG91Y2hPYmplY3QuY3VyWS1iLnRvdWNoT2JqZWN0LnN0YXJ0WSwyKSkpKSxlPWIuc3dpcGVEaXJlY3Rpb24oKSxcInZlcnRpY2FsXCIhPT1lPyh2b2lkIDAhPT1hLm9yaWdpbmFsRXZlbnQmJmIudG91Y2hPYmplY3Quc3dpcGVMZW5ndGg+NCYmYS5wcmV2ZW50RGVmYXVsdCgpLGc9KGIub3B0aW9ucy5ydGw9PT0hMT8xOi0xKSooYi50b3VjaE9iamVjdC5jdXJYPmIudG91Y2hPYmplY3Quc3RhcnRYPzE6LTEpLGIub3B0aW9ucy52ZXJ0aWNhbFN3aXBpbmc9PT0hMCYmKGc9Yi50b3VjaE9iamVjdC5jdXJZPmIudG91Y2hPYmplY3Quc3RhcnRZPzE6LTEpLGY9Yi50b3VjaE9iamVjdC5zd2lwZUxlbmd0aCxiLnRvdWNoT2JqZWN0LmVkZ2VIaXQ9ITEsYi5vcHRpb25zLmluZmluaXRlPT09ITEmJigwPT09Yi5jdXJyZW50U2xpZGUmJlwicmlnaHRcIj09PWV8fGIuY3VycmVudFNsaWRlPj1iLmdldERvdENvdW50KCkmJlwibGVmdFwiPT09ZSkmJihmPWIudG91Y2hPYmplY3Quc3dpcGVMZW5ndGgqYi5vcHRpb25zLmVkZ2VGcmljdGlvbixiLnRvdWNoT2JqZWN0LmVkZ2VIaXQ9ITApLGIub3B0aW9ucy52ZXJ0aWNhbD09PSExP2Iuc3dpcGVMZWZ0PWQrZipnOmIuc3dpcGVMZWZ0PWQrZiooYi4kbGlzdC5oZWlnaHQoKS9iLmxpc3RXaWR0aCkqZyxiLm9wdGlvbnMudmVydGljYWxTd2lwaW5nPT09ITAmJihiLnN3aXBlTGVmdD1kK2YqZyksYi5vcHRpb25zLmZhZGU9PT0hMHx8Yi5vcHRpb25zLnRvdWNoTW92ZT09PSExPyExOmIuYW5pbWF0aW5nPT09ITA/KGIuc3dpcGVMZWZ0PW51bGwsITEpOnZvaWQgYi5zZXRDU1MoYi5zd2lwZUxlZnQpKTp2b2lkIDApfSxiLnByb3RvdHlwZS5zd2lwZVN0YXJ0PWZ1bmN0aW9uKGEpe3ZhciBjLGI9dGhpcztyZXR1cm4gYi5pbnRlcnJ1cHRlZD0hMCwxIT09Yi50b3VjaE9iamVjdC5maW5nZXJDb3VudHx8Yi5zbGlkZUNvdW50PD1iLm9wdGlvbnMuc2xpZGVzVG9TaG93PyhiLnRvdWNoT2JqZWN0PXt9LCExKToodm9pZCAwIT09YS5vcmlnaW5hbEV2ZW50JiZ2b2lkIDAhPT1hLm9yaWdpbmFsRXZlbnQudG91Y2hlcyYmKGM9YS5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbMF0pLGIudG91Y2hPYmplY3Quc3RhcnRYPWIudG91Y2hPYmplY3QuY3VyWD12b2lkIDAhPT1jP2MucGFnZVg6YS5jbGllbnRYLGIudG91Y2hPYmplY3Quc3RhcnRZPWIudG91Y2hPYmplY3QuY3VyWT12b2lkIDAhPT1jP2MucGFnZVk6YS5jbGllbnRZLHZvaWQoYi5kcmFnZ2luZz0hMCkpfSxiLnByb3RvdHlwZS51bmZpbHRlclNsaWRlcz1iLnByb3RvdHlwZS5zbGlja1VuZmlsdGVyPWZ1bmN0aW9uKCl7dmFyIGE9dGhpcztudWxsIT09YS4kc2xpZGVzQ2FjaGUmJihhLnVubG9hZCgpLGEuJHNsaWRlVHJhY2suY2hpbGRyZW4odGhpcy5vcHRpb25zLnNsaWRlKS5kZXRhY2goKSxhLiRzbGlkZXNDYWNoZS5hcHBlbmRUbyhhLiRzbGlkZVRyYWNrKSxhLnJlaW5pdCgpKX0sYi5wcm90b3R5cGUudW5sb2FkPWZ1bmN0aW9uKCl7dmFyIGI9dGhpczthKFwiLnNsaWNrLWNsb25lZFwiLGIuJHNsaWRlcikucmVtb3ZlKCksYi4kZG90cyYmYi4kZG90cy5yZW1vdmUoKSxiLiRwcmV2QXJyb3cmJmIuaHRtbEV4cHIudGVzdChiLm9wdGlvbnMucHJldkFycm93KSYmYi4kcHJldkFycm93LnJlbW92ZSgpLGIuJG5leHRBcnJvdyYmYi5odG1sRXhwci50ZXN0KGIub3B0aW9ucy5uZXh0QXJyb3cpJiZiLiRuZXh0QXJyb3cucmVtb3ZlKCksYi4kc2xpZGVzLnJlbW92ZUNsYXNzKFwic2xpY2stc2xpZGUgc2xpY2stYWN0aXZlIHNsaWNrLXZpc2libGUgc2xpY2stY3VycmVudFwiKS5hdHRyKFwiYXJpYS1oaWRkZW5cIixcInRydWVcIikuY3NzKFwid2lkdGhcIixcIlwiKX0sYi5wcm90b3R5cGUudW5zbGljaz1mdW5jdGlvbihhKXt2YXIgYj10aGlzO2IuJHNsaWRlci50cmlnZ2VyKFwidW5zbGlja1wiLFtiLGFdKSxiLmRlc3Ryb3koKX0sYi5wcm90b3R5cGUudXBkYXRlQXJyb3dzPWZ1bmN0aW9uKCl7dmFyIGIsYT10aGlzO2I9TWF0aC5mbG9vcihhLm9wdGlvbnMuc2xpZGVzVG9TaG93LzIpLGEub3B0aW9ucy5hcnJvd3M9PT0hMCYmYS5zbGlkZUNvdW50PmEub3B0aW9ucy5zbGlkZXNUb1Nob3cmJiFhLm9wdGlvbnMuaW5maW5pdGUmJihhLiRwcmV2QXJyb3cucmVtb3ZlQ2xhc3MoXCJzbGljay1kaXNhYmxlZFwiKS5hdHRyKFwiYXJpYS1kaXNhYmxlZFwiLFwiZmFsc2VcIiksYS4kbmV4dEFycm93LnJlbW92ZUNsYXNzKFwic2xpY2stZGlzYWJsZWRcIikuYXR0cihcImFyaWEtZGlzYWJsZWRcIixcImZhbHNlXCIpLDA9PT1hLmN1cnJlbnRTbGlkZT8oYS4kcHJldkFycm93LmFkZENsYXNzKFwic2xpY2stZGlzYWJsZWRcIikuYXR0cihcImFyaWEtZGlzYWJsZWRcIixcInRydWVcIiksYS4kbmV4dEFycm93LnJlbW92ZUNsYXNzKFwic2xpY2stZGlzYWJsZWRcIikuYXR0cihcImFyaWEtZGlzYWJsZWRcIixcImZhbHNlXCIpKTphLmN1cnJlbnRTbGlkZT49YS5zbGlkZUNvdW50LWEub3B0aW9ucy5zbGlkZXNUb1Nob3cmJmEub3B0aW9ucy5jZW50ZXJNb2RlPT09ITE/KGEuJG5leHRBcnJvdy5hZGRDbGFzcyhcInNsaWNrLWRpc2FibGVkXCIpLmF0dHIoXCJhcmlhLWRpc2FibGVkXCIsXCJ0cnVlXCIpLGEuJHByZXZBcnJvdy5yZW1vdmVDbGFzcyhcInNsaWNrLWRpc2FibGVkXCIpLmF0dHIoXCJhcmlhLWRpc2FibGVkXCIsXCJmYWxzZVwiKSk6YS5jdXJyZW50U2xpZGU+PWEuc2xpZGVDb3VudC0xJiZhLm9wdGlvbnMuY2VudGVyTW9kZT09PSEwJiYoYS4kbmV4dEFycm93LmFkZENsYXNzKFwic2xpY2stZGlzYWJsZWRcIikuYXR0cihcImFyaWEtZGlzYWJsZWRcIixcInRydWVcIiksYS4kcHJldkFycm93LnJlbW92ZUNsYXNzKFwic2xpY2stZGlzYWJsZWRcIikuYXR0cihcImFyaWEtZGlzYWJsZWRcIixcImZhbHNlXCIpKSl9LGIucHJvdG90eXBlLnVwZGF0ZURvdHM9ZnVuY3Rpb24oKXt2YXIgYT10aGlzO251bGwhPT1hLiRkb3RzJiYoYS4kZG90cy5maW5kKFwibGlcIikucmVtb3ZlQ2xhc3MoXCJzbGljay1hY3RpdmVcIikuYXR0cihcImFyaWEtaGlkZGVuXCIsXCJ0cnVlXCIpLGEuJGRvdHMuZmluZChcImxpXCIpLmVxKE1hdGguZmxvb3IoYS5jdXJyZW50U2xpZGUvYS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsKSkuYWRkQ2xhc3MoXCJzbGljay1hY3RpdmVcIikuYXR0cihcImFyaWEtaGlkZGVuXCIsXCJmYWxzZVwiKSl9LGIucHJvdG90eXBlLnZpc2liaWxpdHk9ZnVuY3Rpb24oKXt2YXIgYT10aGlzO2Eub3B0aW9ucy5hdXRvcGxheSYmKGRvY3VtZW50W2EuaGlkZGVuXT9hLmludGVycnVwdGVkPSEwOmEuaW50ZXJydXB0ZWQ9ITEpfSxhLmZuLnNsaWNrPWZ1bmN0aW9uKCl7dmFyIGYsZyxhPXRoaXMsYz1hcmd1bWVudHNbMF0sZD1BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsMSksZT1hLmxlbmd0aDtmb3IoZj0wO2U+ZjtmKyspaWYoXCJvYmplY3RcIj09dHlwZW9mIGN8fFwidW5kZWZpbmVkXCI9PXR5cGVvZiBjP2FbZl0uc2xpY2s9bmV3IGIoYVtmXSxjKTpnPWFbZl0uc2xpY2tbY10uYXBwbHkoYVtmXS5zbGljayxkKSxcInVuZGVmaW5lZFwiIT10eXBlb2YgZylyZXR1cm4gZztyZXR1cm4gYX19KTsiLCIvKipcbiAqIEluaXQgSGVybyBzbGlkZXJzLlxuICpcbiAqIFRoaXMganVzdCB0YWtlcyBhbGwgdGhlIHNsaWRlcnMgcGxhY2VzIG9uIHRoZSBwYWdlXG4gKiBhbmQgaW5pdGlhdGVzIFNsaWNrIEpTIHRvIGFuaW1hdGUgYW5kIHNsaWRlIHRoZW0uXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSAkIGpRdWVyeVxuICovXG4oIGZ1bmN0aW9uKCAkICkge1xuXHQvLyBBbnl0aGluZyB3aXRoIGRhdGEgYXR0YWNoZWQgdG8gaXQsIHNsaWNrIGl0IVxuXHQkKCAnLmhlcm8gLnNsaWRlcnMnICkuZWFjaCggZnVuY3Rpb24oIGksIHYgKSB7XG5cdFx0dmFyIHNwZWVkID0gJCggdGhpcyApLmF0dHIoICdkYXRhLXNsaWRlci1zcGVlZCcgKTtcblxuXHRcdCQoIHRoaXMgKS5zbGljaygge1xuXHRcdFx0c2xpZGVzVG9TaG93OiAgICAxLFxuXHRcdFx0c2xpZGVzVG9TY3JvbGw6ICAxLFxuXHRcdFx0YXV0b3BsYXk6ICAgICAgICB0cnVlLFxuXHRcdFx0YXV0b3BsYXlTcGVlZDogICBzcGVlZCAqIDEwMDAsXG5cdFx0XHRkb3RzOlx0XHRcdFx0dHJ1ZSxcblx0XHRcdHByZXZBcnJvdzogJycsXG5cdFx0XHRuZXh0QXJyb3c6ICcnLFxuXHRcdH0gKTtcblx0fSApO1xufSApKCBqUXVlcnkgKTtcbiIsIi8qKlxuICogRmlsZSB3aW5kb3ctcmVhZHkuanNcbiAqXG4gKiBBZGQgYSBcInJlYWR5XCIgY2xhc3MgdG8gPGJvZHk+IHdoZW4gd2luZG93IGlzIHJlYWR5LlxuICovXG53aW5kb3cuV2luZG93X1JlYWR5ID0ge307XG4oIGZ1bmN0aW9uKCB3aW5kb3csICQsIGFwcCApIHtcblxuXHQvLyBDb25zdHJ1Y3Rvci5cblx0YXBwLmluaXQgPSBmdW5jdGlvbigpIHtcblx0XHRhcHAuY2FjaGUoKTtcblx0XHRhcHAuYmluZEV2ZW50cygpO1xuXHR9O1xuXG5cdC8vIENhY2hlIGRvY3VtZW50IGVsZW1lbnRzLlxuXHRhcHAuY2FjaGUgPSBmdW5jdGlvbigpIHtcblx0XHRhcHAuJGMgPSB7XG5cdFx0XHR3aW5kb3c6ICQoIHdpbmRvdyApLFxuXHRcdFx0Ym9keTogJCggZG9jdW1lbnQuYm9keSApLFxuXHRcdH07XG5cdH07XG5cblx0Ly8gQ29tYmluZSBhbGwgZXZlbnRzLlxuXHRhcHAuYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuXHRcdGFwcC4kYy53aW5kb3cubG9hZCggYXBwLmFkZEJvZHlDbGFzcyApO1xuXHR9O1xuXG5cdC8vIEFkZCBhIGNsYXNzIHRvIDxib2R5Pi5cblx0YXBwLmFkZEJvZHlDbGFzcyA9IGZ1bmN0aW9uKCkge1xuXHRcdGFwcC4kYy5ib2R5LmFkZENsYXNzKCAncmVhZHknICk7XG5cdH07XG5cblx0Ly8gRW5nYWdlIVxuXHQkKCBhcHAuaW5pdCApO1xuXG59KSggd2luZG93LCBqUXVlcnksIHdpbmRvdy5XaW5kb3dfUmVhZHkgKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
