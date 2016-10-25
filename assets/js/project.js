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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNtYjItcmFkaW8taW1hZ2UtZmllbGQuanMiLCJqcXVlcnkuZm9ybS5qcyIsImpxdWVyeS5sYXp5bG9hZC1hbnkubWluLmpzIiwianF1ZXJ5Lm1hZ25pZmljcG9wdXAubWluLmpzIiwianMtZW5hYmxlZC5qcyIsIm1vZGFsLmpzIiwic2NyaXB0cy5qcyIsInNlYXJjaC5qcyIsInNraXAtbGluay1mb2N1cy1maXguanMiLCJzbGljay5taW4uanMiLCJ3ZHMtaGVyby13aWRnZXQuanMiLCJ3aW5kb3ctcmVhZHkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3dkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJwcm9qZWN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiKCBmdW5jdGlvbiggJCApIHtcclxuICAgICAgJChkb2N1bWVudCkub24oXCJjbGlja1wiLCBcIi5jbWItcmFkaW8taW1hZ2VcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJCh0aGlzKS5jbG9zZXN0KFwiLmNtYi10eXBlLXJhZGlvLWltYWdlXCIpLmZpbmQoXCIuY21iLXJhZGlvLWltYWdlXCIpLnJlbW92ZUNsYXNzKFwiY21iLXJhZGlvLWltYWdlLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICQodGhpcykudG9nZ2xlQ2xhc3MoXCJjbWItcmFkaW8taW1hZ2Utc2VsZWN0ZWRcIik7XHJcbiAgICAgIH0pO1xyXG59ICkoIGpRdWVyeSApO1xyXG4iLCIvKiFcbiAqIGpRdWVyeSBGb3JtIFBsdWdpblxuICogdmVyc2lvbjogMy41MS4wLTIwMTQuMDYuMjBcbiAqIFJlcXVpcmVzIGpRdWVyeSB2MS41IG9yIGxhdGVyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgTS4gQWxzdXBcbiAqIEV4YW1wbGVzIGFuZCBkb2N1bWVudGF0aW9uIGF0OiBodHRwOi8vbWFsc3VwLmNvbS9qcXVlcnkvZm9ybS9cbiAqIFByb2plY3QgcmVwb3NpdG9yeTogaHR0cHM6Ly9naXRodWIuY29tL21hbHN1cC9mb3JtXG4gKiBEdWFsIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgYW5kIEdQTCBsaWNlbnNlcy5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9tYWxzdXAvZm9ybSNjb3B5cmlnaHQtYW5kLWxpY2Vuc2VcbiAqL1xuLypnbG9iYWwgQWN0aXZlWE9iamVjdCAqL1xuXG4vLyBBTUQgc3VwcG9ydFxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAvLyB1c2luZyBBTUQ7IHJlZ2lzdGVyIGFzIGFub24gbW9kdWxlXG4gICAgICAgIGRlZmluZShbJ2pxdWVyeSddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBubyBBTUQ7IGludm9rZSBkaXJlY3RseVxuICAgICAgICBmYWN0b3J5KCAodHlwZW9mKGpRdWVyeSkgIT0gJ3VuZGVmaW5lZCcpID8galF1ZXJ5IDogd2luZG93LlplcHRvICk7XG4gICAgfVxufVxuXG4oZnVuY3Rpb24oJCkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qXG4gICAgVXNhZ2UgTm90ZTpcbiAgICAtLS0tLS0tLS0tLVxuICAgIERvIG5vdCB1c2UgYm90aCBhamF4U3VibWl0IGFuZCBhamF4Rm9ybSBvbiB0aGUgc2FtZSBmb3JtLiAgVGhlc2VcbiAgICBmdW5jdGlvbnMgYXJlIG11dHVhbGx5IGV4Y2x1c2l2ZS4gIFVzZSBhamF4U3VibWl0IGlmIHlvdSB3YW50XG4gICAgdG8gYmluZCB5b3VyIG93biBzdWJtaXQgaGFuZGxlciB0byB0aGUgZm9ybS4gIEZvciBleGFtcGxlLFxuXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJyNteUZvcm0nKS5vbignc3VibWl0JywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAvLyA8LS0gaW1wb3J0YW50XG4gICAgICAgICAgICAkKHRoaXMpLmFqYXhTdWJtaXQoe1xuICAgICAgICAgICAgICAgIHRhcmdldDogJyNvdXRwdXQnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBVc2UgYWpheEZvcm0gd2hlbiB5b3Ugd2FudCB0aGUgcGx1Z2luIHRvIG1hbmFnZSBhbGwgdGhlIGV2ZW50IGJpbmRpbmdcbiAgICBmb3IgeW91LiAgRm9yIGV4YW1wbGUsXG5cbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnI215Rm9ybScpLmFqYXhGb3JtKHtcbiAgICAgICAgICAgIHRhcmdldDogJyNvdXRwdXQnXG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgWW91IGNhbiBhbHNvIHVzZSBhamF4Rm9ybSB3aXRoIGRlbGVnYXRpb24gKHJlcXVpcmVzIGpRdWVyeSB2MS43KyksIHNvIHRoZVxuICAgIGZvcm0gZG9lcyBub3QgaGF2ZSB0byBleGlzdCB3aGVuIHlvdSBpbnZva2UgYWpheEZvcm06XG5cbiAgICAkKCcjbXlGb3JtJykuYWpheEZvcm0oe1xuICAgICAgICBkZWxlZ2F0aW9uOiB0cnVlLFxuICAgICAgICB0YXJnZXQ6ICcjb3V0cHV0J1xuICAgIH0pO1xuXG4gICAgV2hlbiB1c2luZyBhamF4Rm9ybSwgdGhlIGFqYXhTdWJtaXQgZnVuY3Rpb24gd2lsbCBiZSBpbnZva2VkIGZvciB5b3VcbiAgICBhdCB0aGUgYXBwcm9wcmlhdGUgdGltZS5cbiovXG5cbi8qKlxuICogRmVhdHVyZSBkZXRlY3Rpb25cbiAqL1xudmFyIGZlYXR1cmUgPSB7fTtcbmZlYXR1cmUuZmlsZWFwaSA9ICQoXCI8aW5wdXQgdHlwZT0nZmlsZScvPlwiKS5nZXQoMCkuZmlsZXMgIT09IHVuZGVmaW5lZDtcbmZlYXR1cmUuZm9ybWRhdGEgPSB3aW5kb3cuRm9ybURhdGEgIT09IHVuZGVmaW5lZDtcblxudmFyIGhhc1Byb3AgPSAhISQuZm4ucHJvcDtcblxuLy8gYXR0cjIgdXNlcyBwcm9wIHdoZW4gaXQgY2FuIGJ1dCBjaGVja3MgdGhlIHJldHVybiB0eXBlIGZvclxuLy8gYW4gZXhwZWN0ZWQgc3RyaW5nLiAgdGhpcyBhY2NvdW50cyBmb3IgdGhlIGNhc2Ugd2hlcmUgYSBmb3JtIFxuLy8gY29udGFpbnMgaW5wdXRzIHdpdGggbmFtZXMgbGlrZSBcImFjdGlvblwiIG9yIFwibWV0aG9kXCI7IGluIHRob3NlXG4vLyBjYXNlcyBcInByb3BcIiByZXR1cm5zIHRoZSBlbGVtZW50XG4kLmZuLmF0dHIyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCAhIGhhc1Byb3AgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gICAgdmFyIHZhbCA9IHRoaXMucHJvcC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICggKCB2YWwgJiYgdmFsLmpxdWVyeSApIHx8IHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnICkge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hdHRyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG4vKipcbiAqIGFqYXhTdWJtaXQoKSBwcm92aWRlcyBhIG1lY2hhbmlzbSBmb3IgaW1tZWRpYXRlbHkgc3VibWl0dGluZ1xuICogYW4gSFRNTCBmb3JtIHVzaW5nIEFKQVguXG4gKi9cbiQuZm4uYWpheFN1Ym1pdCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAvKmpzaGludCBzY3JpcHR1cmw6dHJ1ZSAqL1xuXG4gICAgLy8gZmFzdCBmYWlsIGlmIG5vdGhpbmcgc2VsZWN0ZWQgKGh0dHA6Ly9kZXYuanF1ZXJ5LmNvbS90aWNrZXQvMjc1MilcbiAgICBpZiAoIXRoaXMubGVuZ3RoKSB7XG4gICAgICAgIGxvZygnYWpheFN1Ym1pdDogc2tpcHBpbmcgc3VibWl0IHByb2Nlc3MgLSBubyBlbGVtZW50IHNlbGVjdGVkJyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHZhciBtZXRob2QsIGFjdGlvbiwgdXJsLCAkZm9ybSA9IHRoaXM7XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvcHRpb25zID0geyBzdWNjZXNzOiBvcHRpb25zIH07XG4gICAgfVxuICAgIGVsc2UgaWYgKCBvcHRpb25zID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICBtZXRob2QgPSBvcHRpb25zLnR5cGUgfHwgdGhpcy5hdHRyMignbWV0aG9kJyk7XG4gICAgYWN0aW9uID0gb3B0aW9ucy51cmwgIHx8IHRoaXMuYXR0cjIoJ2FjdGlvbicpO1xuXG4gICAgdXJsID0gKHR5cGVvZiBhY3Rpb24gPT09ICdzdHJpbmcnKSA/ICQudHJpbShhY3Rpb24pIDogJyc7XG4gICAgdXJsID0gdXJsIHx8IHdpbmRvdy5sb2NhdGlvbi5ocmVmIHx8ICcnO1xuICAgIGlmICh1cmwpIHtcbiAgICAgICAgLy8gY2xlYW4gdXJsIChkb24ndCBpbmNsdWRlIGhhc2ggdmF1ZSlcbiAgICAgICAgdXJsID0gKHVybC5tYXRjaCgvXihbXiNdKykvKXx8W10pWzFdO1xuICAgIH1cblxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XG4gICAgICAgIHVybDogIHVybCxcbiAgICAgICAgc3VjY2VzczogJC5hamF4U2V0dGluZ3Muc3VjY2VzcyxcbiAgICAgICAgdHlwZTogbWV0aG9kIHx8ICQuYWpheFNldHRpbmdzLnR5cGUsXG4gICAgICAgIGlmcmFtZVNyYzogL15odHRwcy9pLnRlc3Qod2luZG93LmxvY2F0aW9uLmhyZWYgfHwgJycpID8gJ2phdmFzY3JpcHQ6ZmFsc2UnIDogJ2Fib3V0OmJsYW5rJ1xuICAgIH0sIG9wdGlvbnMpO1xuXG4gICAgLy8gaG9vayBmb3IgbWFuaXB1bGF0aW5nIHRoZSBmb3JtIGRhdGEgYmVmb3JlIGl0IGlzIGV4dHJhY3RlZDtcbiAgICAvLyBjb252ZW5pZW50IGZvciB1c2Ugd2l0aCByaWNoIGVkaXRvcnMgbGlrZSB0aW55TUNFIG9yIEZDS0VkaXRvclxuICAgIHZhciB2ZXRvID0ge307XG4gICAgdGhpcy50cmlnZ2VyKCdmb3JtLXByZS1zZXJpYWxpemUnLCBbdGhpcywgb3B0aW9ucywgdmV0b10pO1xuICAgIGlmICh2ZXRvLnZldG8pIHtcbiAgICAgICAgbG9nKCdhamF4U3VibWl0OiBzdWJtaXQgdmV0b2VkIHZpYSBmb3JtLXByZS1zZXJpYWxpemUgdHJpZ2dlcicpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvLyBwcm92aWRlIG9wcG9ydHVuaXR5IHRvIGFsdGVyIGZvcm0gZGF0YSBiZWZvcmUgaXQgaXMgc2VyaWFsaXplZFxuICAgIGlmIChvcHRpb25zLmJlZm9yZVNlcmlhbGl6ZSAmJiBvcHRpb25zLmJlZm9yZVNlcmlhbGl6ZSh0aGlzLCBvcHRpb25zKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgbG9nKCdhamF4U3VibWl0OiBzdWJtaXQgYWJvcnRlZCB2aWEgYmVmb3JlU2VyaWFsaXplIGNhbGxiYWNrJyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHZhciB0cmFkaXRpb25hbCA9IG9wdGlvbnMudHJhZGl0aW9uYWw7XG4gICAgaWYgKCB0cmFkaXRpb25hbCA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgICB0cmFkaXRpb25hbCA9ICQuYWpheFNldHRpbmdzLnRyYWRpdGlvbmFsO1xuICAgIH1cblxuICAgIHZhciBlbGVtZW50cyA9IFtdO1xuICAgIHZhciBxeCwgYSA9IHRoaXMuZm9ybVRvQXJyYXkob3B0aW9ucy5zZW1hbnRpYywgZWxlbWVudHMpO1xuICAgIGlmIChvcHRpb25zLmRhdGEpIHtcbiAgICAgICAgb3B0aW9ucy5leHRyYURhdGEgPSBvcHRpb25zLmRhdGE7XG4gICAgICAgIHF4ID0gJC5wYXJhbShvcHRpb25zLmRhdGEsIHRyYWRpdGlvbmFsKTtcbiAgICB9XG5cbiAgICAvLyBnaXZlIHByZS1zdWJtaXQgY2FsbGJhY2sgYW4gb3Bwb3J0dW5pdHkgdG8gYWJvcnQgdGhlIHN1Ym1pdFxuICAgIGlmIChvcHRpb25zLmJlZm9yZVN1Ym1pdCAmJiBvcHRpb25zLmJlZm9yZVN1Ym1pdChhLCB0aGlzLCBvcHRpb25zKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgbG9nKCdhamF4U3VibWl0OiBzdWJtaXQgYWJvcnRlZCB2aWEgYmVmb3JlU3VibWl0IGNhbGxiYWNrJyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8vIGZpcmUgdmV0b2FibGUgJ3ZhbGlkYXRlJyBldmVudFxuICAgIHRoaXMudHJpZ2dlcignZm9ybS1zdWJtaXQtdmFsaWRhdGUnLCBbYSwgdGhpcywgb3B0aW9ucywgdmV0b10pO1xuICAgIGlmICh2ZXRvLnZldG8pIHtcbiAgICAgICAgbG9nKCdhamF4U3VibWl0OiBzdWJtaXQgdmV0b2VkIHZpYSBmb3JtLXN1Ym1pdC12YWxpZGF0ZSB0cmlnZ2VyJyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHZhciBxID0gJC5wYXJhbShhLCB0cmFkaXRpb25hbCk7XG4gICAgaWYgKHF4KSB7XG4gICAgICAgIHEgPSAoIHEgPyAocSArICcmJyArIHF4KSA6IHF4ICk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLnR5cGUudG9VcHBlckNhc2UoKSA9PSAnR0VUJykge1xuICAgICAgICBvcHRpb25zLnVybCArPSAob3B0aW9ucy51cmwuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgcTtcbiAgICAgICAgb3B0aW9ucy5kYXRhID0gbnVsbDsgIC8vIGRhdGEgaXMgbnVsbCBmb3IgJ2dldCdcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG9wdGlvbnMuZGF0YSA9IHE7IC8vIGRhdGEgaXMgdGhlIHF1ZXJ5IHN0cmluZyBmb3IgJ3Bvc3QnXG4gICAgfVxuXG4gICAgdmFyIGNhbGxiYWNrcyA9IFtdO1xuICAgIGlmIChvcHRpb25zLnJlc2V0Rm9ybSkge1xuICAgICAgICBjYWxsYmFja3MucHVzaChmdW5jdGlvbigpIHsgJGZvcm0ucmVzZXRGb3JtKCk7IH0pO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5jbGVhckZvcm0pIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goZnVuY3Rpb24oKSB7ICRmb3JtLmNsZWFyRm9ybShvcHRpb25zLmluY2x1ZGVIaWRkZW4pOyB9KTtcbiAgICB9XG5cbiAgICAvLyBwZXJmb3JtIGEgbG9hZCBvbiB0aGUgdGFyZ2V0IG9ubHkgaWYgZGF0YVR5cGUgaXMgbm90IHByb3ZpZGVkXG4gICAgaWYgKCFvcHRpb25zLmRhdGFUeXBlICYmIG9wdGlvbnMudGFyZ2V0KSB7XG4gICAgICAgIHZhciBvbGRTdWNjZXNzID0gb3B0aW9ucy5zdWNjZXNzIHx8IGZ1bmN0aW9uKCl7fTtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdmFyIGZuID0gb3B0aW9ucy5yZXBsYWNlVGFyZ2V0ID8gJ3JlcGxhY2VXaXRoJyA6ICdodG1sJztcbiAgICAgICAgICAgICQob3B0aW9ucy50YXJnZXQpW2ZuXShkYXRhKS5lYWNoKG9sZFN1Y2Nlc3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChvcHRpb25zLnN1Y2Nlc3MpIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2gob3B0aW9ucy5zdWNjZXNzKTtcbiAgICB9XG5cbiAgICBvcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbihkYXRhLCBzdGF0dXMsIHhocikgeyAvLyBqUXVlcnkgMS40KyBwYXNzZXMgeGhyIGFzIDNyZCBhcmdcbiAgICAgICAgdmFyIGNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQgfHwgdGhpcyA7ICAgIC8vIGpRdWVyeSAxLjQrIHN1cHBvcnRzIHNjb3BlIGNvbnRleHRcbiAgICAgICAgZm9yICh2YXIgaT0wLCBtYXg9Y2FsbGJhY2tzLmxlbmd0aDsgaSA8IG1heDsgaSsrKSB7XG4gICAgICAgICAgICBjYWxsYmFja3NbaV0uYXBwbHkoY29udGV4dCwgW2RhdGEsIHN0YXR1cywgeGhyIHx8ICRmb3JtLCAkZm9ybV0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmIChvcHRpb25zLmVycm9yKSB7XG4gICAgICAgIHZhciBvbGRFcnJvciA9IG9wdGlvbnMuZXJyb3I7XG4gICAgICAgIG9wdGlvbnMuZXJyb3IgPSBmdW5jdGlvbih4aHIsIHN0YXR1cywgZXJyb3IpIHtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0IHx8IHRoaXM7XG4gICAgICAgICAgICBvbGRFcnJvci5hcHBseShjb250ZXh0LCBbeGhyLCBzdGF0dXMsIGVycm9yLCAkZm9ybV0pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgICBpZiAob3B0aW9ucy5jb21wbGV0ZSkge1xuICAgICAgICB2YXIgb2xkQ29tcGxldGUgPSBvcHRpb25zLmNvbXBsZXRlO1xuICAgICAgICBvcHRpb25zLmNvbXBsZXRlID0gZnVuY3Rpb24oeGhyLCBzdGF0dXMpIHtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0IHx8IHRoaXM7XG4gICAgICAgICAgICBvbGRDb21wbGV0ZS5hcHBseShjb250ZXh0LCBbeGhyLCBzdGF0dXMsICRmb3JtXSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gYXJlIHRoZXJlIGZpbGVzIHRvIHVwbG9hZD9cblxuICAgIC8vIFt2YWx1ZV0gKGlzc3VlICMxMTMpLCBhbHNvIHNlZSBjb21tZW50OlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tYWxzdXAvZm9ybS9jb21taXQvNTg4MzA2YWVkYmExZGUwMTM4ODAzMmQ1ZjQyYTYwMTU5ZWVhOTIyOCNjb21taXRjb21tZW50LTIxODAyMTlcbiAgICB2YXIgZmlsZUlucHV0cyA9ICQoJ2lucHV0W3R5cGU9ZmlsZV06ZW5hYmxlZCcsIHRoaXMpLmZpbHRlcihmdW5jdGlvbigpIHsgcmV0dXJuICQodGhpcykudmFsKCkgIT09ICcnOyB9KTtcblxuICAgIHZhciBoYXNGaWxlSW5wdXRzID0gZmlsZUlucHV0cy5sZW5ndGggPiAwO1xuICAgIHZhciBtcCA9ICdtdWx0aXBhcnQvZm9ybS1kYXRhJztcbiAgICB2YXIgbXVsdGlwYXJ0ID0gKCRmb3JtLmF0dHIoJ2VuY3R5cGUnKSA9PSBtcCB8fCAkZm9ybS5hdHRyKCdlbmNvZGluZycpID09IG1wKTtcblxuICAgIHZhciBmaWxlQVBJID0gZmVhdHVyZS5maWxlYXBpICYmIGZlYXR1cmUuZm9ybWRhdGE7XG4gICAgbG9nKFwiZmlsZUFQSSA6XCIgKyBmaWxlQVBJKTtcbiAgICB2YXIgc2hvdWxkVXNlRnJhbWUgPSAoaGFzRmlsZUlucHV0cyB8fCBtdWx0aXBhcnQpICYmICFmaWxlQVBJO1xuXG4gICAgdmFyIGpxeGhyO1xuXG4gICAgLy8gb3B0aW9ucy5pZnJhbWUgYWxsb3dzIHVzZXIgdG8gZm9yY2UgaWZyYW1lIG1vZGVcbiAgICAvLyAwNi1OT1YtMDk6IG5vdyBkZWZhdWx0aW5nIHRvIGlmcmFtZSBtb2RlIGlmIGZpbGUgaW5wdXQgaXMgZGV0ZWN0ZWRcbiAgICBpZiAob3B0aW9ucy5pZnJhbWUgIT09IGZhbHNlICYmIChvcHRpb25zLmlmcmFtZSB8fCBzaG91bGRVc2VGcmFtZSkpIHtcbiAgICAgICAgLy8gaGFjayB0byBmaXggU2FmYXJpIGhhbmcgKHRoYW5rcyB0byBUaW0gTW9sZW5kaWprIGZvciB0aGlzKVxuICAgICAgICAvLyBzZWU6ICBodHRwOi8vZ3JvdXBzLmdvb2dsZS5jb20vZ3JvdXAvanF1ZXJ5LWRldi9icm93c2VfdGhyZWFkL3RocmVhZC8zNjM5NWI3YWI1MTBkZDVkXG4gICAgICAgIGlmIChvcHRpb25zLmNsb3NlS2VlcEFsaXZlKSB7XG4gICAgICAgICAgICAkLmdldChvcHRpb25zLmNsb3NlS2VlcEFsaXZlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBqcXhociA9IGZpbGVVcGxvYWRJZnJhbWUoYSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGpxeGhyID0gZmlsZVVwbG9hZElmcmFtZShhKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICgoaGFzRmlsZUlucHV0cyB8fCBtdWx0aXBhcnQpICYmIGZpbGVBUEkpIHtcbiAgICAgICAganF4aHIgPSBmaWxlVXBsb2FkWGhyKGEpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAganF4aHIgPSAkLmFqYXgob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgJGZvcm0ucmVtb3ZlRGF0YSgnanF4aHInKS5kYXRhKCdqcXhocicsIGpxeGhyKTtcblxuICAgIC8vIGNsZWFyIGVsZW1lbnQgYXJyYXlcbiAgICBmb3IgKHZhciBrPTA7IGsgPCBlbGVtZW50cy5sZW5ndGg7IGsrKykge1xuICAgICAgICBlbGVtZW50c1trXSA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gZmlyZSAnbm90aWZ5JyBldmVudFxuICAgIHRoaXMudHJpZ2dlcignZm9ybS1zdWJtaXQtbm90aWZ5JywgW3RoaXMsIG9wdGlvbnNdKTtcbiAgICByZXR1cm4gdGhpcztcblxuICAgIC8vIHV0aWxpdHkgZm4gZm9yIGRlZXAgc2VyaWFsaXphdGlvblxuICAgIGZ1bmN0aW9uIGRlZXBTZXJpYWxpemUoZXh0cmFEYXRhKXtcbiAgICAgICAgdmFyIHNlcmlhbGl6ZWQgPSAkLnBhcmFtKGV4dHJhRGF0YSwgb3B0aW9ucy50cmFkaXRpb25hbCkuc3BsaXQoJyYnKTtcbiAgICAgICAgdmFyIGxlbiA9IHNlcmlhbGl6ZWQubGVuZ3RoO1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIHZhciBpLCBwYXJ0O1xuICAgICAgICBmb3IgKGk9MDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAvLyAjMjUyOyB1bmRvIHBhcmFtIHNwYWNlIHJlcGxhY2VtZW50XG4gICAgICAgICAgICBzZXJpYWxpemVkW2ldID0gc2VyaWFsaXplZFtpXS5yZXBsYWNlKC9cXCsvZywnICcpO1xuICAgICAgICAgICAgcGFydCA9IHNlcmlhbGl6ZWRbaV0uc3BsaXQoJz0nKTtcbiAgICAgICAgICAgIC8vICMyNzg7IHVzZSBhcnJheSBpbnN0ZWFkIG9mIG9iamVjdCBzdG9yYWdlLCBmYXZvcmluZyBhcnJheSBzZXJpYWxpemF0aW9uc1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goW2RlY29kZVVSSUNvbXBvbmVudChwYXJ0WzBdKSwgZGVjb2RlVVJJQ29tcG9uZW50KHBhcnRbMV0pXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAgLy8gWE1MSHR0cFJlcXVlc3QgTGV2ZWwgMiBmaWxlIHVwbG9hZHMgKGJpZyBoYXQgdGlwIHRvIGZyYW5jb2lzMm1ldHopXG4gICAgZnVuY3Rpb24gZmlsZVVwbG9hZFhocihhKSB7XG4gICAgICAgIHZhciBmb3JtZGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuXG4gICAgICAgIGZvciAodmFyIGk9MDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGZvcm1kYXRhLmFwcGVuZChhW2ldLm5hbWUsIGFbaV0udmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuZXh0cmFEYXRhKSB7XG4gICAgICAgICAgICB2YXIgc2VyaWFsaXplZERhdGEgPSBkZWVwU2VyaWFsaXplKG9wdGlvbnMuZXh0cmFEYXRhKTtcbiAgICAgICAgICAgIGZvciAoaT0wOyBpIDwgc2VyaWFsaXplZERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VyaWFsaXplZERhdGFbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWRhdGEuYXBwZW5kKHNlcmlhbGl6ZWREYXRhW2ldWzBdLCBzZXJpYWxpemVkRGF0YVtpXVsxXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9ucy5kYXRhID0gbnVsbDtcblxuICAgICAgICB2YXIgcyA9ICQuZXh0ZW5kKHRydWUsIHt9LCAkLmFqYXhTZXR0aW5ncywgb3B0aW9ucywge1xuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogbWV0aG9kIHx8ICdQT1NUJ1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAob3B0aW9ucy51cGxvYWRQcm9ncmVzcykge1xuICAgICAgICAgICAgLy8gd29ya2Fyb3VuZCBiZWNhdXNlIGpxWEhSIGRvZXMgbm90IGV4cG9zZSB1cGxvYWQgcHJvcGVydHlcbiAgICAgICAgICAgIHMueGhyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhociA9ICQuYWpheFNldHRpbmdzLnhocigpO1xuICAgICAgICAgICAgICAgIGlmICh4aHIudXBsb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci51cGxvYWQuYWRkRXZlbnRMaXN0ZW5lcigncHJvZ3Jlc3MnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBlcmNlbnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gZXZlbnQubG9hZGVkIHx8IGV2ZW50LnBvc2l0aW9uOyAvKmV2ZW50LnBvc2l0aW9uIGlzIGRlcHJlY2F0ZWQqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRvdGFsID0gZXZlbnQudG90YWw7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcmNlbnQgPSBNYXRoLmNlaWwocG9zaXRpb24gLyB0b3RhbCAqIDEwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnVwbG9hZFByb2dyZXNzKGV2ZW50LCBwb3NpdGlvbiwgdG90YWwsIHBlcmNlbnQpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB4aHI7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcy5kYXRhID0gbnVsbDtcbiAgICAgICAgdmFyIGJlZm9yZVNlbmQgPSBzLmJlZm9yZVNlbmQ7XG4gICAgICAgIHMuYmVmb3JlU2VuZCA9IGZ1bmN0aW9uKHhociwgbykge1xuICAgICAgICAgICAgLy9TZW5kIEZvcm1EYXRhKCkgcHJvdmlkZWQgYnkgdXNlclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZm9ybURhdGEpIHtcbiAgICAgICAgICAgICAgICBvLmRhdGEgPSBvcHRpb25zLmZvcm1EYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgby5kYXRhID0gZm9ybWRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihiZWZvcmVTZW5kKSB7XG4gICAgICAgICAgICAgICAgYmVmb3JlU2VuZC5jYWxsKHRoaXMsIHhociwgbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAkLmFqYXgocyk7XG4gICAgfVxuXG4gICAgLy8gcHJpdmF0ZSBmdW5jdGlvbiBmb3IgaGFuZGxpbmcgZmlsZSB1cGxvYWRzIChoYXQgdGlwIHRvIFlBSE9PISlcbiAgICBmdW5jdGlvbiBmaWxlVXBsb2FkSWZyYW1lKGEpIHtcbiAgICAgICAgdmFyIGZvcm0gPSAkZm9ybVswXSwgZWwsIGksIHMsIGcsIGlkLCAkaW8sIGlvLCB4aHIsIHN1YiwgbiwgdGltZWRPdXQsIHRpbWVvdXRIYW5kbGU7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKTtcblxuICAgICAgICAvLyAjMzQxXG4gICAgICAgIGRlZmVycmVkLmFib3J0ID0gZnVuY3Rpb24oc3RhdHVzKSB7XG4gICAgICAgICAgICB4aHIuYWJvcnQoc3RhdHVzKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoYSkge1xuICAgICAgICAgICAgLy8gZW5zdXJlIHRoYXQgZXZlcnkgc2VyaWFsaXplZCBpbnB1dCBpcyBzdGlsbCBlbmFibGVkXG4gICAgICAgICAgICBmb3IgKGk9MDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZWwgPSAkKGVsZW1lbnRzW2ldKTtcbiAgICAgICAgICAgICAgICBpZiAoIGhhc1Byb3AgKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWwucmVtb3ZlQXR0cignZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzID0gJC5leHRlbmQodHJ1ZSwge30sICQuYWpheFNldHRpbmdzLCBvcHRpb25zKTtcbiAgICAgICAgcy5jb250ZXh0ID0gcy5jb250ZXh0IHx8IHM7XG4gICAgICAgIGlkID0gJ2pxRm9ybUlPJyArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG4gICAgICAgIGlmIChzLmlmcmFtZVRhcmdldCkge1xuICAgICAgICAgICAgJGlvID0gJChzLmlmcmFtZVRhcmdldCk7XG4gICAgICAgICAgICBuID0gJGlvLmF0dHIyKCduYW1lJyk7XG4gICAgICAgICAgICBpZiAoIW4pIHtcbiAgICAgICAgICAgICAgICAkaW8uYXR0cjIoJ25hbWUnLCBpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZCA9IG47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAkaW8gPSAkKCc8aWZyYW1lIG5hbWU9XCInICsgaWQgKyAnXCIgc3JjPVwiJysgcy5pZnJhbWVTcmMgKydcIiAvPicpO1xuICAgICAgICAgICAgJGlvLmNzcyh7IHBvc2l0aW9uOiAnYWJzb2x1dGUnLCB0b3A6ICctMTAwMHB4JywgbGVmdDogJy0xMDAwcHgnIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlvID0gJGlvWzBdO1xuXG5cbiAgICAgICAgeGhyID0geyAvLyBtb2NrIG9iamVjdFxuICAgICAgICAgICAgYWJvcnRlZDogMCxcbiAgICAgICAgICAgIHJlc3BvbnNlVGV4dDogbnVsbCxcbiAgICAgICAgICAgIHJlc3BvbnNlWE1MOiBudWxsLFxuICAgICAgICAgICAgc3RhdHVzOiAwLFxuICAgICAgICAgICAgc3RhdHVzVGV4dDogJ24vYScsXG4gICAgICAgICAgICBnZXRBbGxSZXNwb25zZUhlYWRlcnM6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgICAgICBnZXRSZXNwb25zZUhlYWRlcjogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgICAgIHNldFJlcXVlc3RIZWFkZXI6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgICAgICBhYm9ydDogZnVuY3Rpb24oc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGUgPSAoc3RhdHVzID09PSAndGltZW91dCcgPyAndGltZW91dCcgOiAnYWJvcnRlZCcpO1xuICAgICAgICAgICAgICAgIGxvZygnYWJvcnRpbmcgdXBsb2FkLi4uICcgKyBlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFib3J0ZWQgPSAxO1xuXG4gICAgICAgICAgICAgICAgdHJ5IHsgLy8gIzIxNCwgIzI1N1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW8uY29udGVudFdpbmRvdy5kb2N1bWVudC5leGVjQ29tbWFuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW8uY29udGVudFdpbmRvdy5kb2N1bWVudC5leGVjQ29tbWFuZCgnU3RvcCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoKGlnbm9yZSkge31cblxuICAgICAgICAgICAgICAgICRpby5hdHRyKCdzcmMnLCBzLmlmcmFtZVNyYyk7IC8vIGFib3J0IG9wIGluIHByb2dyZXNzXG4gICAgICAgICAgICAgICAgeGhyLmVycm9yID0gZTtcbiAgICAgICAgICAgICAgICBpZiAocy5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBzLmVycm9yLmNhbGwocy5jb250ZXh0LCB4aHIsIGUsIHN0YXR1cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChnKSB7XG4gICAgICAgICAgICAgICAgICAgICQuZXZlbnQudHJpZ2dlcihcImFqYXhFcnJvclwiLCBbeGhyLCBzLCBlXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzLmNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHMuY29tcGxldGUuY2FsbChzLmNvbnRleHQsIHhociwgZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGcgPSBzLmdsb2JhbDtcbiAgICAgICAgLy8gdHJpZ2dlciBhamF4IGdsb2JhbCBldmVudHMgc28gdGhhdCBhY3Rpdml0eS9ibG9jayBpbmRpY2F0b3JzIHdvcmsgbGlrZSBub3JtYWxcbiAgICAgICAgaWYgKGcgJiYgMCA9PT0gJC5hY3RpdmUrKykge1xuICAgICAgICAgICAgJC5ldmVudC50cmlnZ2VyKFwiYWpheFN0YXJ0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChnKSB7XG4gICAgICAgICAgICAkLmV2ZW50LnRyaWdnZXIoXCJhamF4U2VuZFwiLCBbeGhyLCBzXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocy5iZWZvcmVTZW5kICYmIHMuYmVmb3JlU2VuZC5jYWxsKHMuY29udGV4dCwgeGhyLCBzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGlmIChzLmdsb2JhbCkge1xuICAgICAgICAgICAgICAgICQuYWN0aXZlLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoKTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeGhyLmFib3J0ZWQpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYWRkIHN1Ym1pdHRpbmcgZWxlbWVudCB0byBkYXRhIGlmIHdlIGtub3cgaXRcbiAgICAgICAgc3ViID0gZm9ybS5jbGs7XG4gICAgICAgIGlmIChzdWIpIHtcbiAgICAgICAgICAgIG4gPSBzdWIubmFtZTtcbiAgICAgICAgICAgIGlmIChuICYmICFzdWIuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgICAgICBzLmV4dHJhRGF0YSA9IHMuZXh0cmFEYXRhIHx8IHt9O1xuICAgICAgICAgICAgICAgIHMuZXh0cmFEYXRhW25dID0gc3ViLnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmIChzdWIudHlwZSA9PSBcImltYWdlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcy5leHRyYURhdGFbbisnLngnXSA9IGZvcm0uY2xrX3g7XG4gICAgICAgICAgICAgICAgICAgIHMuZXh0cmFEYXRhW24rJy55J10gPSBmb3JtLmNsa195O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBDTElFTlRfVElNRU9VVF9BQk9SVCA9IDE7XG4gICAgICAgIHZhciBTRVJWRVJfQUJPUlQgPSAyO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBmdW5jdGlvbiBnZXREb2MoZnJhbWUpIHtcbiAgICAgICAgICAgIC8qIGl0IGxvb2tzIGxpa2UgY29udGVudFdpbmRvdyBvciBjb250ZW50RG9jdW1lbnQgZG8gbm90XG4gICAgICAgICAgICAgKiBjYXJyeSB0aGUgcHJvdG9jb2wgcHJvcGVydHkgaW4gaWU4LCB3aGVuIHJ1bm5pbmcgdW5kZXIgc3NsXG4gICAgICAgICAgICAgKiBmcmFtZS5kb2N1bWVudCBpcyB0aGUgb25seSB2YWxpZCByZXNwb25zZSBkb2N1bWVudCwgc2luY2VcbiAgICAgICAgICAgICAqIHRoZSBwcm90b2NvbCBpcyBrbm93IGJ1dCBub3Qgb24gdGhlIG90aGVyIHR3byBvYmplY3RzLiBzdHJhbmdlP1xuICAgICAgICAgICAgICogXCJTYW1lIG9yaWdpbiBwb2xpY3lcIiBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1NhbWVfb3JpZ2luX3BvbGljeVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBkb2MgPSBudWxsO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBJRTggY2FzY2FkaW5nIGFjY2VzcyBjaGVja1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoZnJhbWUuY29udGVudFdpbmRvdykge1xuICAgICAgICAgICAgICAgICAgICBkb2MgPSBmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICAgICAgLy8gSUU4IGFjY2VzcyBkZW5pZWQgdW5kZXIgc3NsICYgbWlzc2luZyBwcm90b2NvbFxuICAgICAgICAgICAgICAgIGxvZygnY2Fubm90IGdldCBpZnJhbWUuY29udGVudFdpbmRvdyBkb2N1bWVudDogJyArIGVycik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkb2MpIHsgLy8gc3VjY2Vzc2Z1bCBnZXR0aW5nIGNvbnRlbnRcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkgeyAvLyBzaW1wbHkgY2hlY2tpbmcgbWF5IHRocm93IGluIGllOCB1bmRlciBzc2wgb3IgbWlzbWF0Y2hlZCBwcm90b2NvbFxuICAgICAgICAgICAgICAgIGRvYyA9IGZyYW1lLmNvbnRlbnREb2N1bWVudCA/IGZyYW1lLmNvbnRlbnREb2N1bWVudCA6IGZyYW1lLmRvY3VtZW50O1xuICAgICAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgICAgICAvLyBsYXN0IGF0dGVtcHRcbiAgICAgICAgICAgICAgICBsb2coJ2Nhbm5vdCBnZXQgaWZyYW1lLmNvbnRlbnREb2N1bWVudDogJyArIGVycik7XG4gICAgICAgICAgICAgICAgZG9jID0gZnJhbWUuZG9jdW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZG9jO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmFpbHMgQ1NSRiBoYWNrICh0aGFua3MgdG8gWXZhbiBCYXJ0aGVsZW15KVxuICAgICAgICB2YXIgY3NyZl90b2tlbiA9ICQoJ21ldGFbbmFtZT1jc3JmLXRva2VuXScpLmF0dHIoJ2NvbnRlbnQnKTtcbiAgICAgICAgdmFyIGNzcmZfcGFyYW0gPSAkKCdtZXRhW25hbWU9Y3NyZi1wYXJhbV0nKS5hdHRyKCdjb250ZW50Jyk7XG4gICAgICAgIGlmIChjc3JmX3BhcmFtICYmIGNzcmZfdG9rZW4pIHtcbiAgICAgICAgICAgIHMuZXh0cmFEYXRhID0gcy5leHRyYURhdGEgfHwge307XG4gICAgICAgICAgICBzLmV4dHJhRGF0YVtjc3JmX3BhcmFtXSA9IGNzcmZfdG9rZW47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0YWtlIGEgYnJlYXRoIHNvIHRoYXQgcGVuZGluZyByZXBhaW50cyBnZXQgc29tZSBjcHUgdGltZSBiZWZvcmUgdGhlIHVwbG9hZCBzdGFydHNcbiAgICAgICAgZnVuY3Rpb24gZG9TdWJtaXQoKSB7XG4gICAgICAgICAgICAvLyBtYWtlIHN1cmUgZm9ybSBhdHRycyBhcmUgc2V0XG4gICAgICAgICAgICB2YXIgdCA9ICRmb3JtLmF0dHIyKCd0YXJnZXQnKSwgXG4gICAgICAgICAgICAgICAgYSA9ICRmb3JtLmF0dHIyKCdhY3Rpb24nKSwgXG4gICAgICAgICAgICAgICAgbXAgPSAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScsXG4gICAgICAgICAgICAgICAgZXQgPSAkZm9ybS5hdHRyKCdlbmN0eXBlJykgfHwgJGZvcm0uYXR0cignZW5jb2RpbmcnKSB8fCBtcDtcblxuICAgICAgICAgICAgLy8gdXBkYXRlIGZvcm0gYXR0cnMgaW4gSUUgZnJpZW5kbHkgd2F5XG4gICAgICAgICAgICBmb3JtLnNldEF0dHJpYnV0ZSgndGFyZ2V0JyxpZCk7XG4gICAgICAgICAgICBpZiAoIW1ldGhvZCB8fCAvcG9zdC9pLnRlc3QobWV0aG9kKSApIHtcbiAgICAgICAgICAgICAgICBmb3JtLnNldEF0dHJpYnV0ZSgnbWV0aG9kJywgJ1BPU1QnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhICE9IHMudXJsKSB7XG4gICAgICAgICAgICAgICAgZm9ybS5zZXRBdHRyaWJ1dGUoJ2FjdGlvbicsIHMudXJsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWUgYm9ya3MgaW4gc29tZSBjYXNlcyB3aGVuIHNldHRpbmcgZW5jb2RpbmdcbiAgICAgICAgICAgIGlmICghIHMuc2tpcEVuY29kaW5nT3ZlcnJpZGUgJiYgKCFtZXRob2QgfHwgL3Bvc3QvaS50ZXN0KG1ldGhvZCkpKSB7XG4gICAgICAgICAgICAgICAgJGZvcm0uYXR0cih7XG4gICAgICAgICAgICAgICAgICAgIGVuY29kaW5nOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScsXG4gICAgICAgICAgICAgICAgICAgIGVuY3R5cGU6ICAnbXVsdGlwYXJ0L2Zvcm0tZGF0YSdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc3VwcG9ydCB0aW1vdXRcbiAgICAgICAgICAgIGlmIChzLnRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICB0aW1lb3V0SGFuZGxlID0gc2V0VGltZW91dChmdW5jdGlvbigpIHsgdGltZWRPdXQgPSB0cnVlOyBjYihDTElFTlRfVElNRU9VVF9BQk9SVCk7IH0sIHMudGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGxvb2sgZm9yIHNlcnZlciBhYm9ydHNcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNoZWNrU3RhdGUoKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gZ2V0RG9jKGlvKS5yZWFkeVN0YXRlO1xuICAgICAgICAgICAgICAgICAgICBsb2coJ3N0YXRlID0gJyArIHN0YXRlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlICYmIHN0YXRlLnRvTG93ZXJDYXNlKCkgPT0gJ3VuaW5pdGlhbGl6ZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrU3RhdGUsNTApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nKCdTZXJ2ZXIgYWJvcnQ6ICcgLCBlLCAnICgnLCBlLm5hbWUsICcpJyk7XG4gICAgICAgICAgICAgICAgICAgIGNiKFNFUlZFUl9BQk9SVCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aW1lb3V0SGFuZGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGltZW91dEhhbmRsZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGFkZCBcImV4dHJhXCIgZGF0YSB0byBmb3JtIGlmIHByb3ZpZGVkIGluIG9wdGlvbnNcbiAgICAgICAgICAgIHZhciBleHRyYUlucHV0cyA9IFtdO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAocy5leHRyYURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbiBpbiBzLmV4dHJhRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMuZXh0cmFEYXRhLmhhc093blByb3BlcnR5KG4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB1c2luZyB0aGUgJC5wYXJhbSBmb3JtYXQgdGhhdCBhbGxvd3MgZm9yIG11bHRpcGxlIHZhbHVlcyB3aXRoIHRoZSBzYW1lIG5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKCQuaXNQbGFpbk9iamVjdChzLmV4dHJhRGF0YVtuXSkgJiYgcy5leHRyYURhdGFbbl0uaGFzT3duUHJvcGVydHkoJ25hbWUnKSAmJiBzLmV4dHJhRGF0YVtuXS5oYXNPd25Qcm9wZXJ0eSgndmFsdWUnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhSW5wdXRzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiJytzLmV4dHJhRGF0YVtuXS5uYW1lKydcIj4nKS52YWwocy5leHRyYURhdGFbbl0udmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmRUbyhmb3JtKVswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhSW5wdXRzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiJytuKydcIj4nKS52YWwocy5leHRyYURhdGFbbl0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmRUbyhmb3JtKVswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXMuaWZyYW1lVGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFkZCBpZnJhbWUgdG8gZG9jIGFuZCBzdWJtaXQgdGhlIGZvcm1cbiAgICAgICAgICAgICAgICAgICAgJGlvLmFwcGVuZFRvKCdib2R5Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpby5hdHRhY2hFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICBpby5hdHRhY2hFdmVudCgnb25sb2FkJywgY2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW8uYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGNiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2tTdGF0ZSwxNSk7XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBmb3JtLnN1Ym1pdCgpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGp1c3QgaW4gY2FzZSBmb3JtIGhhcyBlbGVtZW50IHdpdGggbmFtZS9pZCBvZiAnc3VibWl0J1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3VibWl0Rm4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb3JtJykuc3VibWl0O1xuICAgICAgICAgICAgICAgICAgICBzdWJtaXRGbi5hcHBseShmb3JtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAvLyByZXNldCBhdHRycyBhbmQgcmVtb3ZlIFwiZXh0cmFcIiBpbnB1dCBlbGVtZW50c1xuICAgICAgICAgICAgICAgIGZvcm0uc2V0QXR0cmlidXRlKCdhY3Rpb24nLGEpO1xuICAgICAgICAgICAgICAgIGZvcm0uc2V0QXR0cmlidXRlKCdlbmN0eXBlJywgZXQpOyAvLyAjMzgwXG4gICAgICAgICAgICAgICAgaWYodCkge1xuICAgICAgICAgICAgICAgICAgICBmb3JtLnNldEF0dHJpYnV0ZSgndGFyZ2V0JywgdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJGZvcm0ucmVtb3ZlQXR0cigndGFyZ2V0Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICQoZXh0cmFJbnB1dHMpLnJlbW92ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHMuZm9yY2VTeW5jKSB7XG4gICAgICAgICAgICBkb1N1Ym1pdCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2V0VGltZW91dChkb1N1Ym1pdCwgMTApOyAvLyB0aGlzIGxldHMgZG9tIHVwZGF0ZXMgcmVuZGVyXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGF0YSwgZG9jLCBkb21DaGVja0NvdW50ID0gNTAsIGNhbGxiYWNrUHJvY2Vzc2VkO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNiKGUpIHtcbiAgICAgICAgICAgIGlmICh4aHIuYWJvcnRlZCB8fCBjYWxsYmFja1Byb2Nlc3NlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZG9jID0gZ2V0RG9jKGlvKTtcbiAgICAgICAgICAgIGlmKCFkb2MpIHtcbiAgICAgICAgICAgICAgICBsb2coJ2Nhbm5vdCBhY2Nlc3MgcmVzcG9uc2UgZG9jdW1lbnQnKTtcbiAgICAgICAgICAgICAgICBlID0gU0VSVkVSX0FCT1JUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGUgPT09IENMSUVOVF9USU1FT1VUX0FCT1JUICYmIHhocikge1xuICAgICAgICAgICAgICAgIHhoci5hYm9ydCgndGltZW91dCcpO1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCh4aHIsICd0aW1lb3V0Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoZSA9PSBTRVJWRVJfQUJPUlQgJiYgeGhyKSB7XG4gICAgICAgICAgICAgICAgeGhyLmFib3J0KCdzZXJ2ZXIgYWJvcnQnKTtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoeGhyLCAnZXJyb3InLCAnc2VydmVyIGFib3J0Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWRvYyB8fCBkb2MubG9jYXRpb24uaHJlZiA9PSBzLmlmcmFtZVNyYykge1xuICAgICAgICAgICAgICAgIC8vIHJlc3BvbnNlIG5vdCByZWNlaXZlZCB5ZXRcbiAgICAgICAgICAgICAgICBpZiAoIXRpbWVkT3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaW8uZGV0YWNoRXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpby5kZXRhY2hFdmVudCgnb25sb2FkJywgY2IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbG9hZCcsIGNiLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzdGF0dXMgPSAnc3VjY2VzcycsIGVyck1zZztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHRpbWVkT3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93ICd0aW1lb3V0JztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgaXNYbWwgPSBzLmRhdGFUeXBlID09ICd4bWwnIHx8IGRvYy5YTUxEb2N1bWVudCB8fCAkLmlzWE1MRG9jKGRvYyk7XG4gICAgICAgICAgICAgICAgbG9nKCdpc1htbD0nK2lzWG1sKTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzWG1sICYmIHdpbmRvdy5vcGVyYSAmJiAoZG9jLmJvZHkgPT09IG51bGwgfHwgIWRvYy5ib2R5LmlubmVySFRNTCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKC0tZG9tQ2hlY2tDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW4gc29tZSBicm93c2VycyAoT3BlcmEpIHRoZSBpZnJhbWUgRE9NIGlzIG5vdCBhbHdheXMgdHJhdmVyc2FibGUgd2hlblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIG9ubG9hZCBjYWxsYmFjayBmaXJlcywgc28gd2UgbG9vcCBhIGJpdCB0byBhY2NvbW1vZGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nKCdyZXF1ZWluZyBvbkxvYWQgY2FsbGJhY2ssIERPTSBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNiLCAyNTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIGxldCB0aGlzIGZhbGwgdGhyb3VnaCBiZWNhdXNlIHNlcnZlciByZXNwb25zZSBjb3VsZCBiZSBhbiBlbXB0eSBkb2N1bWVudFxuICAgICAgICAgICAgICAgICAgICAvL2xvZygnQ291bGQgbm90IGFjY2VzcyBpZnJhbWUgRE9NIGFmdGVyIG11dGlwbGUgdHJpZXMuJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vdGhyb3cgJ0RPTUV4Y2VwdGlvbjogbm90IGF2YWlsYWJsZSc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy9sb2coJ3Jlc3BvbnNlIGRldGVjdGVkJyk7XG4gICAgICAgICAgICAgICAgdmFyIGRvY1Jvb3QgPSBkb2MuYm9keSA/IGRvYy5ib2R5IDogZG9jLmRvY3VtZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICB4aHIucmVzcG9uc2VUZXh0ID0gZG9jUm9vdCA/IGRvY1Jvb3QuaW5uZXJIVE1MIDogbnVsbDtcbiAgICAgICAgICAgICAgICB4aHIucmVzcG9uc2VYTUwgPSBkb2MuWE1MRG9jdW1lbnQgPyBkb2MuWE1MRG9jdW1lbnQgOiBkb2M7XG4gICAgICAgICAgICAgICAgaWYgKGlzWG1sKSB7XG4gICAgICAgICAgICAgICAgICAgIHMuZGF0YVR5cGUgPSAneG1sJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgeGhyLmdldFJlc3BvbnNlSGVhZGVyID0gZnVuY3Rpb24oaGVhZGVyKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhlYWRlcnMgPSB7J2NvbnRlbnQtdHlwZSc6IHMuZGF0YVR5cGV9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaGVhZGVyc1toZWFkZXIudG9Mb3dlckNhc2UoKV07XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvLyBzdXBwb3J0IGZvciBYSFIgJ3N0YXR1cycgJiAnc3RhdHVzVGV4dCcgZW11bGF0aW9uIDpcbiAgICAgICAgICAgICAgICBpZiAoZG9jUm9vdCkge1xuICAgICAgICAgICAgICAgICAgICB4aHIuc3RhdHVzID0gTnVtYmVyKCBkb2NSb290LmdldEF0dHJpYnV0ZSgnc3RhdHVzJykgKSB8fCB4aHIuc3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICB4aHIuc3RhdHVzVGV4dCA9IGRvY1Jvb3QuZ2V0QXR0cmlidXRlKCdzdGF0dXNUZXh0JykgfHwgeGhyLnN0YXR1c1RleHQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGR0ID0gKHMuZGF0YVR5cGUgfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgdmFyIHNjciA9IC8oanNvbnxzY3JpcHR8dGV4dCkvLnRlc3QoZHQpO1xuICAgICAgICAgICAgICAgIGlmIChzY3IgfHwgcy50ZXh0YXJlYSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBzZWUgaWYgdXNlciBlbWJlZGRlZCByZXNwb25zZSBpbiB0ZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgICB2YXIgdGEgPSBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3RleHRhcmVhJylbMF07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeGhyLnJlc3BvbnNlVGV4dCA9IHRhLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3VwcG9ydCBmb3IgWEhSICdzdGF0dXMnICYgJ3N0YXR1c1RleHQnIGVtdWxhdGlvbiA6XG4gICAgICAgICAgICAgICAgICAgICAgICB4aHIuc3RhdHVzID0gTnVtYmVyKCB0YS5nZXRBdHRyaWJ1dGUoJ3N0YXR1cycpICkgfHwgeGhyLnN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgICAgIHhoci5zdGF0dXNUZXh0ID0gdGEuZ2V0QXR0cmlidXRlKCdzdGF0dXNUZXh0JykgfHwgeGhyLnN0YXR1c1RleHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc2NyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhY2NvdW50IGZvciBicm93c2VycyBpbmplY3RpbmcgcHJlIGFyb3VuZCBqc29uIHJlc3BvbnNlXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJlID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdwcmUnKVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBiID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeGhyLnJlc3BvbnNlVGV4dCA9IHByZS50ZXh0Q29udGVudCA/IHByZS50ZXh0Q29udGVudCA6IHByZS5pbm5lclRleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeGhyLnJlc3BvbnNlVGV4dCA9IGIudGV4dENvbnRlbnQgPyBiLnRleHRDb250ZW50IDogYi5pbm5lclRleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZHQgPT0gJ3htbCcgJiYgIXhoci5yZXNwb25zZVhNTCAmJiB4aHIucmVzcG9uc2VUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5yZXNwb25zZVhNTCA9IHRvWG1sKHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSBodHRwRGF0YSh4aHIsIGR0LCBzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMgPSAncGFyc2VyZXJyb3InO1xuICAgICAgICAgICAgICAgICAgICB4aHIuZXJyb3IgPSBlcnJNc2cgPSAoZXJyIHx8IHN0YXR1cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGxvZygnZXJyb3IgY2F1Z2h0OiAnLGVycik7XG4gICAgICAgICAgICAgICAgc3RhdHVzID0gJ2Vycm9yJztcbiAgICAgICAgICAgICAgICB4aHIuZXJyb3IgPSBlcnJNc2cgPSAoZXJyIHx8IHN0YXR1cyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh4aHIuYWJvcnRlZCkge1xuICAgICAgICAgICAgICAgIGxvZygndXBsb2FkIGFib3J0ZWQnKTtcbiAgICAgICAgICAgICAgICBzdGF0dXMgPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoeGhyLnN0YXR1cykgeyAvLyB3ZSd2ZSBzZXQgeGhyLnN0YXR1c1xuICAgICAgICAgICAgICAgIHN0YXR1cyA9ICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwIHx8IHhoci5zdGF0dXMgPT09IDMwNCkgPyAnc3VjY2VzcycgOiAnZXJyb3InO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBvcmRlcmluZyBvZiB0aGVzZSBjYWxsYmFja3MvdHJpZ2dlcnMgaXMgb2RkLCBidXQgdGhhdCdzIGhvdyAkLmFqYXggZG9lcyBpdFxuICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHMuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICBzLnN1Y2Nlc3MuY2FsbChzLmNvbnRleHQsIGRhdGEsICdzdWNjZXNzJywgeGhyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh4aHIucmVzcG9uc2VUZXh0LCAnc3VjY2VzcycsIHhocik7XG4gICAgICAgICAgICAgICAgaWYgKGcpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5ldmVudC50cmlnZ2VyKFwiYWpheFN1Y2Nlc3NcIiwgW3hociwgc10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHN0YXR1cykge1xuICAgICAgICAgICAgICAgIGlmIChlcnJNc2cgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBlcnJNc2cgPSB4aHIuc3RhdHVzVGV4dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHMuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcy5lcnJvci5jYWxsKHMuY29udGV4dCwgeGhyLCBzdGF0dXMsIGVyck1zZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCh4aHIsICdlcnJvcicsIGVyck1zZyk7XG4gICAgICAgICAgICAgICAgaWYgKGcpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5ldmVudC50cmlnZ2VyKFwiYWpheEVycm9yXCIsIFt4aHIsIHMsIGVyck1zZ10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGcpIHtcbiAgICAgICAgICAgICAgICAkLmV2ZW50LnRyaWdnZXIoXCJhamF4Q29tcGxldGVcIiwgW3hociwgc10pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZyAmJiAhIC0tJC5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAkLmV2ZW50LnRyaWdnZXIoXCJhamF4U3RvcFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHMuY29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICBzLmNvbXBsZXRlLmNhbGwocy5jb250ZXh0LCB4aHIsIHN0YXR1cyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhbGxiYWNrUHJvY2Vzc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChzLnRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNsZWFuIHVwXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICghcy5pZnJhbWVUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgJGlvLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHsgLy9hZGRpbmcgZWxzZSB0byBjbGVhbiB1cCBleGlzdGluZyBpZnJhbWUgcmVzcG9uc2UuXG4gICAgICAgICAgICAgICAgICAgICRpby5hdHRyKCdzcmMnLCBzLmlmcmFtZVNyYyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHhoci5yZXNwb25zZVhNTCA9IG51bGw7XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRvWG1sID0gJC5wYXJzZVhNTCB8fCBmdW5jdGlvbihzLCBkb2MpIHsgLy8gdXNlIHBhcnNlWE1MIGlmIGF2YWlsYWJsZSAoalF1ZXJ5IDEuNSspXG4gICAgICAgICAgICBpZiAod2luZG93LkFjdGl2ZVhPYmplY3QpIHtcbiAgICAgICAgICAgICAgICBkb2MgPSBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTERPTScpO1xuICAgICAgICAgICAgICAgIGRvYy5hc3luYyA9ICdmYWxzZSc7XG4gICAgICAgICAgICAgICAgZG9jLmxvYWRYTUwocyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcocywgJ3RleHQveG1sJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKGRvYyAmJiBkb2MuZG9jdW1lbnRFbGVtZW50ICYmIGRvYy5kb2N1bWVudEVsZW1lbnQubm9kZU5hbWUgIT0gJ3BhcnNlcmVycm9yJykgPyBkb2MgOiBudWxsO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcGFyc2VKU09OID0gJC5wYXJzZUpTT04gfHwgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgLypqc2xpbnQgZXZpbDp0cnVlICovXG4gICAgICAgICAgICByZXR1cm4gd2luZG93WydldmFsJ10oJygnICsgcyArICcpJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGh0dHBEYXRhID0gZnVuY3Rpb24oIHhociwgdHlwZSwgcyApIHsgLy8gbW9zdGx5IGxpZnRlZCBmcm9tIGpxMS40LjRcblxuICAgICAgICAgICAgdmFyIGN0ID0geGhyLmdldFJlc3BvbnNlSGVhZGVyKCdjb250ZW50LXR5cGUnKSB8fCAnJyxcbiAgICAgICAgICAgICAgICB4bWwgPSB0eXBlID09PSAneG1sJyB8fCAhdHlwZSAmJiBjdC5pbmRleE9mKCd4bWwnKSA+PSAwLFxuICAgICAgICAgICAgICAgIGRhdGEgPSB4bWwgPyB4aHIucmVzcG9uc2VYTUwgOiB4aHIucmVzcG9uc2VUZXh0O1xuXG4gICAgICAgICAgICBpZiAoeG1sICYmIGRhdGEuZG9jdW1lbnRFbGVtZW50Lm5vZGVOYW1lID09PSAncGFyc2VyZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5lcnJvcigncGFyc2VyZXJyb3InKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocyAmJiBzLmRhdGFGaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gcy5kYXRhRmlsdGVyKGRhdGEsIHR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSAnanNvbicgfHwgIXR5cGUgJiYgY3QuaW5kZXhPZignanNvbicpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IHBhcnNlSlNPTihkYXRhKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwic2NyaXB0XCIgfHwgIXR5cGUgJiYgY3QuaW5kZXhPZihcImphdmFzY3JpcHRcIikgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAkLmdsb2JhbEV2YWwoZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkO1xuICAgIH1cbn07XG5cbi8qKlxuICogYWpheEZvcm0oKSBwcm92aWRlcyBhIG1lY2hhbmlzbSBmb3IgZnVsbHkgYXV0b21hdGluZyBmb3JtIHN1Ym1pc3Npb24uXG4gKlxuICogVGhlIGFkdmFudGFnZXMgb2YgdXNpbmcgdGhpcyBtZXRob2QgaW5zdGVhZCBvZiBhamF4U3VibWl0KCkgYXJlOlxuICpcbiAqIDE6IFRoaXMgbWV0aG9kIHdpbGwgaW5jbHVkZSBjb29yZGluYXRlcyBmb3IgPGlucHV0IHR5cGU9XCJpbWFnZVwiIC8+IGVsZW1lbnRzIChpZiB0aGUgZWxlbWVudFxuICogICAgaXMgdXNlZCB0byBzdWJtaXQgdGhlIGZvcm0pLlxuICogMi4gVGhpcyBtZXRob2Qgd2lsbCBpbmNsdWRlIHRoZSBzdWJtaXQgZWxlbWVudCdzIG5hbWUvdmFsdWUgZGF0YSAoZm9yIHRoZSBlbGVtZW50IHRoYXQgd2FzXG4gKiAgICB1c2VkIHRvIHN1Ym1pdCB0aGUgZm9ybSkuXG4gKiAzLiBUaGlzIG1ldGhvZCBiaW5kcyB0aGUgc3VibWl0KCkgbWV0aG9kIHRvIHRoZSBmb3JtIGZvciB5b3UuXG4gKlxuICogVGhlIG9wdGlvbnMgYXJndW1lbnQgZm9yIGFqYXhGb3JtIHdvcmtzIGV4YWN0bHkgYXMgaXQgZG9lcyBmb3IgYWpheFN1Ym1pdC4gIGFqYXhGb3JtIG1lcmVseVxuICogcGFzc2VzIHRoZSBvcHRpb25zIGFyZ3VtZW50IGFsb25nIGFmdGVyIHByb3Blcmx5IGJpbmRpbmcgZXZlbnRzIGZvciBzdWJtaXQgZWxlbWVudHMgYW5kXG4gKiB0aGUgZm9ybSBpdHNlbGYuXG4gKi9cbiQuZm4uYWpheEZvcm0gPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgb3B0aW9ucy5kZWxlZ2F0aW9uID0gb3B0aW9ucy5kZWxlZ2F0aW9uICYmICQuaXNGdW5jdGlvbigkLmZuLm9uKTtcblxuICAgIC8vIGluIGpRdWVyeSAxLjMrIHdlIGNhbiBmaXggbWlzdGFrZXMgd2l0aCB0aGUgcmVhZHkgc3RhdGVcbiAgICBpZiAoIW9wdGlvbnMuZGVsZWdhdGlvbiAmJiB0aGlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB2YXIgbyA9IHsgczogdGhpcy5zZWxlY3RvciwgYzogdGhpcy5jb250ZXh0IH07XG4gICAgICAgIGlmICghJC5pc1JlYWR5ICYmIG8ucykge1xuICAgICAgICAgICAgbG9nKCdET00gbm90IHJlYWR5LCBxdWV1aW5nIGFqYXhGb3JtJyk7XG4gICAgICAgICAgICAkKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICQoby5zLG8uYykuYWpheEZvcm0ob3B0aW9ucyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlzIHlvdXIgRE9NIHJlYWR5PyAgaHR0cDovL2RvY3MuanF1ZXJ5LmNvbS9UdXRvcmlhbHM6SW50cm9kdWNpbmdfJChkb2N1bWVudCkucmVhZHkoKVxuICAgICAgICBsb2coJ3Rlcm1pbmF0aW5nOyB6ZXJvIGVsZW1lbnRzIGZvdW5kIGJ5IHNlbGVjdG9yJyArICgkLmlzUmVhZHkgPyAnJyA6ICcgKERPTSBub3QgcmVhZHkpJykpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoIG9wdGlvbnMuZGVsZWdhdGlvbiApIHtcbiAgICAgICAgJChkb2N1bWVudClcbiAgICAgICAgICAgIC5vZmYoJ3N1Ym1pdC5mb3JtLXBsdWdpbicsIHRoaXMuc2VsZWN0b3IsIGRvQWpheFN1Ym1pdClcbiAgICAgICAgICAgIC5vZmYoJ2NsaWNrLmZvcm0tcGx1Z2luJywgdGhpcy5zZWxlY3RvciwgY2FwdHVyZVN1Ym1pdHRpbmdFbGVtZW50KVxuICAgICAgICAgICAgLm9uKCdzdWJtaXQuZm9ybS1wbHVnaW4nLCB0aGlzLnNlbGVjdG9yLCBvcHRpb25zLCBkb0FqYXhTdWJtaXQpXG4gICAgICAgICAgICAub24oJ2NsaWNrLmZvcm0tcGx1Z2luJywgdGhpcy5zZWxlY3Rvciwgb3B0aW9ucywgY2FwdHVyZVN1Ym1pdHRpbmdFbGVtZW50KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYWpheEZvcm1VbmJpbmQoKVxuICAgICAgICAuYmluZCgnc3VibWl0LmZvcm0tcGx1Z2luJywgb3B0aW9ucywgZG9BamF4U3VibWl0KVxuICAgICAgICAuYmluZCgnY2xpY2suZm9ybS1wbHVnaW4nLCBvcHRpb25zLCBjYXB0dXJlU3VibWl0dGluZ0VsZW1lbnQpO1xufTtcblxuLy8gcHJpdmF0ZSBldmVudCBoYW5kbGVyc1xuZnVuY3Rpb24gZG9BamF4U3VibWl0KGUpIHtcbiAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgIHZhciBvcHRpb25zID0gZS5kYXRhO1xuICAgIGlmICghZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgeyAvLyBpZiBldmVudCBoYXMgYmVlbiBjYW5jZWxlZCwgZG9uJ3QgcHJvY2VlZFxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICQoZS50YXJnZXQpLmFqYXhTdWJtaXQob3B0aW9ucyk7IC8vICMzNjVcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNhcHR1cmVTdWJtaXR0aW5nRWxlbWVudChlKSB7XG4gICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgdmFyICRlbCA9ICQodGFyZ2V0KTtcbiAgICBpZiAoISgkZWwuaXMoXCJbdHlwZT1zdWJtaXRdLFt0eXBlPWltYWdlXVwiKSkpIHtcbiAgICAgICAgLy8gaXMgdGhpcyBhIGNoaWxkIGVsZW1lbnQgb2YgdGhlIHN1Ym1pdCBlbD8gIChleDogYSBzcGFuIHdpdGhpbiBhIGJ1dHRvbilcbiAgICAgICAgdmFyIHQgPSAkZWwuY2xvc2VzdCgnW3R5cGU9c3VibWl0XScpO1xuICAgICAgICBpZiAodC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0YXJnZXQgPSB0WzBdO1xuICAgIH1cbiAgICB2YXIgZm9ybSA9IHRoaXM7XG4gICAgZm9ybS5jbGsgPSB0YXJnZXQ7XG4gICAgaWYgKHRhcmdldC50eXBlID09ICdpbWFnZScpIHtcbiAgICAgICAgaWYgKGUub2Zmc2V0WCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmb3JtLmNsa194ID0gZS5vZmZzZXRYO1xuICAgICAgICAgICAgZm9ybS5jbGtfeSA9IGUub2Zmc2V0WTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgJC5mbi5vZmZzZXQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9ICRlbC5vZmZzZXQoKTtcbiAgICAgICAgICAgIGZvcm0uY2xrX3ggPSBlLnBhZ2VYIC0gb2Zmc2V0LmxlZnQ7XG4gICAgICAgICAgICBmb3JtLmNsa195ID0gZS5wYWdlWSAtIG9mZnNldC50b3A7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3JtLmNsa194ID0gZS5wYWdlWCAtIHRhcmdldC5vZmZzZXRMZWZ0O1xuICAgICAgICAgICAgZm9ybS5jbGtfeSA9IGUucGFnZVkgLSB0YXJnZXQub2Zmc2V0VG9wO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIGNsZWFyIGZvcm0gdmFyc1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGZvcm0uY2xrID0gZm9ybS5jbGtfeCA9IGZvcm0uY2xrX3kgPSBudWxsOyB9LCAxMDApO1xufVxuXG5cbi8vIGFqYXhGb3JtVW5iaW5kIHVuYmluZHMgdGhlIGV2ZW50IGhhbmRsZXJzIHRoYXQgd2VyZSBib3VuZCBieSBhamF4Rm9ybVxuJC5mbi5hamF4Rm9ybVVuYmluZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnVuYmluZCgnc3VibWl0LmZvcm0tcGx1Z2luIGNsaWNrLmZvcm0tcGx1Z2luJyk7XG59O1xuXG4vKipcbiAqIGZvcm1Ub0FycmF5KCkgZ2F0aGVycyBmb3JtIGVsZW1lbnQgZGF0YSBpbnRvIGFuIGFycmF5IG9mIG9iamVjdHMgdGhhdCBjYW5cbiAqIGJlIHBhc3NlZCB0byBhbnkgb2YgdGhlIGZvbGxvd2luZyBhamF4IGZ1bmN0aW9uczogJC5nZXQsICQucG9zdCwgb3IgbG9hZC5cbiAqIEVhY2ggb2JqZWN0IGluIHRoZSBhcnJheSBoYXMgYm90aCBhICduYW1lJyBhbmQgJ3ZhbHVlJyBwcm9wZXJ0eS4gIEFuIGV4YW1wbGUgb2ZcbiAqIGFuIGFycmF5IGZvciBhIHNpbXBsZSBsb2dpbiBmb3JtIG1pZ2h0IGJlOlxuICpcbiAqIFsgeyBuYW1lOiAndXNlcm5hbWUnLCB2YWx1ZTogJ2pyZXNpZycgfSwgeyBuYW1lOiAncGFzc3dvcmQnLCB2YWx1ZTogJ3NlY3JldCcgfSBdXG4gKlxuICogSXQgaXMgdGhpcyBhcnJheSB0aGF0IGlzIHBhc3NlZCB0byBwcmUtc3VibWl0IGNhbGxiYWNrIGZ1bmN0aW9ucyBwcm92aWRlZCB0byB0aGVcbiAqIGFqYXhTdWJtaXQoKSBhbmQgYWpheEZvcm0oKSBtZXRob2RzLlxuICovXG4kLmZuLmZvcm1Ub0FycmF5ID0gZnVuY3Rpb24oc2VtYW50aWMsIGVsZW1lbnRzKSB7XG4gICAgdmFyIGEgPSBbXTtcbiAgICBpZiAodGhpcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuXG4gICAgdmFyIGZvcm0gPSB0aGlzWzBdO1xuICAgIHZhciBmb3JtSWQgPSB0aGlzLmF0dHIoJ2lkJyk7XG4gICAgdmFyIGVscyA9IHNlbWFudGljID8gZm9ybS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpIDogZm9ybS5lbGVtZW50cztcbiAgICB2YXIgZWxzMjtcblxuICAgIGlmIChlbHMgJiYgIS9NU0lFIFs2NzhdLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7IC8vICMzOTBcbiAgICAgICAgZWxzID0gJChlbHMpLmdldCgpOyAgLy8gY29udmVydCB0byBzdGFuZGFyZCBhcnJheVxuICAgIH1cblxuICAgIC8vICMzODY7IGFjY291bnQgZm9yIGlucHV0cyBvdXRzaWRlIHRoZSBmb3JtIHdoaWNoIHVzZSB0aGUgJ2Zvcm0nIGF0dHJpYnV0ZVxuICAgIGlmICggZm9ybUlkICkge1xuICAgICAgICBlbHMyID0gJCgnOmlucHV0W2Zvcm09XCInICsgZm9ybUlkICsgJ1wiXScpLmdldCgpOyAvLyBoYXQgdGlwIEB0aGV0XG4gICAgICAgIGlmICggZWxzMi5sZW5ndGggKSB7XG4gICAgICAgICAgICBlbHMgPSAoZWxzIHx8IFtdKS5jb25jYXQoZWxzMik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWVscyB8fCAhZWxzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG5cbiAgICB2YXIgaSxqLG4sdixlbCxtYXgsam1heDtcbiAgICBmb3IoaT0wLCBtYXg9ZWxzLmxlbmd0aDsgaSA8IG1heDsgaSsrKSB7XG4gICAgICAgIGVsID0gZWxzW2ldO1xuICAgICAgICBuID0gZWwubmFtZTtcbiAgICAgICAgaWYgKCFuIHx8IGVsLmRpc2FibGVkKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZW1hbnRpYyAmJiBmb3JtLmNsayAmJiBlbC50eXBlID09IFwiaW1hZ2VcIikge1xuICAgICAgICAgICAgLy8gaGFuZGxlIGltYWdlIGlucHV0cyBvbiB0aGUgZmx5IHdoZW4gc2VtYW50aWMgPT0gdHJ1ZVxuICAgICAgICAgICAgaWYoZm9ybS5jbGsgPT0gZWwpIHtcbiAgICAgICAgICAgICAgICBhLnB1c2goe25hbWU6IG4sIHZhbHVlOiAkKGVsKS52YWwoKSwgdHlwZTogZWwudHlwZSB9KTtcbiAgICAgICAgICAgICAgICBhLnB1c2goe25hbWU6IG4rJy54JywgdmFsdWU6IGZvcm0uY2xrX3h9LCB7bmFtZTogbisnLnknLCB2YWx1ZTogZm9ybS5jbGtfeX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2ID0gJC5maWVsZFZhbHVlKGVsLCB0cnVlKTtcbiAgICAgICAgaWYgKHYgJiYgdi5jb25zdHJ1Y3RvciA9PSBBcnJheSkge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnRzKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3Ioaj0wLCBqbWF4PXYubGVuZ3RoOyBqIDwgam1heDsgaisrKSB7XG4gICAgICAgICAgICAgICAgYS5wdXNoKHtuYW1lOiBuLCB2YWx1ZTogdltqXX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGZlYXR1cmUuZmlsZWFwaSAmJiBlbC50eXBlID09ICdmaWxlJykge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnRzKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZmlsZXMgPSBlbC5maWxlcztcbiAgICAgICAgICAgIGlmIChmaWxlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGo9MDsgaiA8IGZpbGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGEucHVzaCh7bmFtZTogbiwgdmFsdWU6IGZpbGVzW2pdLCB0eXBlOiBlbC50eXBlfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gIzE4MFxuICAgICAgICAgICAgICAgIGEucHVzaCh7IG5hbWU6IG4sIHZhbHVlOiAnJywgdHlwZTogZWwudHlwZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh2ICE9PSBudWxsICYmIHR5cGVvZiB2ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudHMpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGEucHVzaCh7bmFtZTogbiwgdmFsdWU6IHYsIHR5cGU6IGVsLnR5cGUsIHJlcXVpcmVkOiBlbC5yZXF1aXJlZH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFzZW1hbnRpYyAmJiBmb3JtLmNsaykge1xuICAgICAgICAvLyBpbnB1dCB0eXBlPT0naW1hZ2UnIGFyZSBub3QgZm91bmQgaW4gZWxlbWVudHMgYXJyYXkhIGhhbmRsZSBpdCBoZXJlXG4gICAgICAgIHZhciAkaW5wdXQgPSAkKGZvcm0uY2xrKSwgaW5wdXQgPSAkaW5wdXRbMF07XG4gICAgICAgIG4gPSBpbnB1dC5uYW1lO1xuICAgICAgICBpZiAobiAmJiAhaW5wdXQuZGlzYWJsZWQgJiYgaW5wdXQudHlwZSA9PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICBhLnB1c2goe25hbWU6IG4sIHZhbHVlOiAkaW5wdXQudmFsKCl9KTtcbiAgICAgICAgICAgIGEucHVzaCh7bmFtZTogbisnLngnLCB2YWx1ZTogZm9ybS5jbGtfeH0sIHtuYW1lOiBuKycueScsIHZhbHVlOiBmb3JtLmNsa195fSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGE7XG59O1xuXG4vKipcbiAqIFNlcmlhbGl6ZXMgZm9ybSBkYXRhIGludG8gYSAnc3VibWl0dGFibGUnIHN0cmluZy4gVGhpcyBtZXRob2Qgd2lsbCByZXR1cm4gYSBzdHJpbmdcbiAqIGluIHRoZSBmb3JtYXQ6IG5hbWUxPXZhbHVlMSZhbXA7bmFtZTI9dmFsdWUyXG4gKi9cbiQuZm4uZm9ybVNlcmlhbGl6ZSA9IGZ1bmN0aW9uKHNlbWFudGljKSB7XG4gICAgLy9oYW5kIG9mZiB0byBqUXVlcnkucGFyYW0gZm9yIHByb3BlciBlbmNvZGluZ1xuICAgIHJldHVybiAkLnBhcmFtKHRoaXMuZm9ybVRvQXJyYXkoc2VtYW50aWMpKTtcbn07XG5cbi8qKlxuICogU2VyaWFsaXplcyBhbGwgZmllbGQgZWxlbWVudHMgaW4gdGhlIGpRdWVyeSBvYmplY3QgaW50byBhIHF1ZXJ5IHN0cmluZy5cbiAqIFRoaXMgbWV0aG9kIHdpbGwgcmV0dXJuIGEgc3RyaW5nIGluIHRoZSBmb3JtYXQ6IG5hbWUxPXZhbHVlMSZhbXA7bmFtZTI9dmFsdWUyXG4gKi9cbiQuZm4uZmllbGRTZXJpYWxpemUgPSBmdW5jdGlvbihzdWNjZXNzZnVsKSB7XG4gICAgdmFyIGEgPSBbXTtcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBuID0gdGhpcy5uYW1lO1xuICAgICAgICBpZiAoIW4pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdiA9ICQuZmllbGRWYWx1ZSh0aGlzLCBzdWNjZXNzZnVsKTtcbiAgICAgICAgaWYgKHYgJiYgdi5jb25zdHJ1Y3RvciA9PSBBcnJheSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaT0wLG1heD12Lmxlbmd0aDsgaSA8IG1heDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYS5wdXNoKHtuYW1lOiBuLCB2YWx1ZTogdltpXX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHYgIT09IG51bGwgJiYgdHlwZW9mIHYgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGEucHVzaCh7bmFtZTogdGhpcy5uYW1lLCB2YWx1ZTogdn0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgLy9oYW5kIG9mZiB0byBqUXVlcnkucGFyYW0gZm9yIHByb3BlciBlbmNvZGluZ1xuICAgIHJldHVybiAkLnBhcmFtKGEpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZShzKSBvZiB0aGUgZWxlbWVudCBpbiB0aGUgbWF0Y2hlZCBzZXQuICBGb3IgZXhhbXBsZSwgY29uc2lkZXIgdGhlIGZvbGxvd2luZyBmb3JtOlxuICpcbiAqICA8Zm9ybT48ZmllbGRzZXQ+XG4gKiAgICAgIDxpbnB1dCBuYW1lPVwiQVwiIHR5cGU9XCJ0ZXh0XCIgLz5cbiAqICAgICAgPGlucHV0IG5hbWU9XCJBXCIgdHlwZT1cInRleHRcIiAvPlxuICogICAgICA8aW5wdXQgbmFtZT1cIkJcIiB0eXBlPVwiY2hlY2tib3hcIiB2YWx1ZT1cIkIxXCIgLz5cbiAqICAgICAgPGlucHV0IG5hbWU9XCJCXCIgdHlwZT1cImNoZWNrYm94XCIgdmFsdWU9XCJCMlwiLz5cbiAqICAgICAgPGlucHV0IG5hbWU9XCJDXCIgdHlwZT1cInJhZGlvXCIgdmFsdWU9XCJDMVwiIC8+XG4gKiAgICAgIDxpbnB1dCBuYW1lPVwiQ1wiIHR5cGU9XCJyYWRpb1wiIHZhbHVlPVwiQzJcIiAvPlxuICogIDwvZmllbGRzZXQ+PC9mb3JtPlxuICpcbiAqICB2YXIgdiA9ICQoJ2lucHV0W3R5cGU9dGV4dF0nKS5maWVsZFZhbHVlKCk7XG4gKiAgLy8gaWYgbm8gdmFsdWVzIGFyZSBlbnRlcmVkIGludG8gdGhlIHRleHQgaW5wdXRzXG4gKiAgdiA9PSBbJycsJyddXG4gKiAgLy8gaWYgdmFsdWVzIGVudGVyZWQgaW50byB0aGUgdGV4dCBpbnB1dHMgYXJlICdmb28nIGFuZCAnYmFyJ1xuICogIHYgPT0gWydmb28nLCdiYXInXVxuICpcbiAqICB2YXIgdiA9ICQoJ2lucHV0W3R5cGU9Y2hlY2tib3hdJykuZmllbGRWYWx1ZSgpO1xuICogIC8vIGlmIG5laXRoZXIgY2hlY2tib3ggaXMgY2hlY2tlZFxuICogIHYgPT09IHVuZGVmaW5lZFxuICogIC8vIGlmIGJvdGggY2hlY2tib3hlcyBhcmUgY2hlY2tlZFxuICogIHYgPT0gWydCMScsICdCMiddXG4gKlxuICogIHZhciB2ID0gJCgnaW5wdXRbdHlwZT1yYWRpb10nKS5maWVsZFZhbHVlKCk7XG4gKiAgLy8gaWYgbmVpdGhlciByYWRpbyBpcyBjaGVja2VkXG4gKiAgdiA9PT0gdW5kZWZpbmVkXG4gKiAgLy8gaWYgZmlyc3QgcmFkaW8gaXMgY2hlY2tlZFxuICogIHYgPT0gWydDMSddXG4gKlxuICogVGhlIHN1Y2Nlc3NmdWwgYXJndW1lbnQgY29udHJvbHMgd2hldGhlciBvciBub3QgdGhlIGZpZWxkIGVsZW1lbnQgbXVzdCBiZSAnc3VjY2Vzc2Z1bCdcbiAqIChwZXIgaHR0cDovL3d3dy53My5vcmcvVFIvaHRtbDQvaW50ZXJhY3QvZm9ybXMuaHRtbCNzdWNjZXNzZnVsLWNvbnRyb2xzKS5cbiAqIFRoZSBkZWZhdWx0IHZhbHVlIG9mIHRoZSBzdWNjZXNzZnVsIGFyZ3VtZW50IGlzIHRydWUuICBJZiB0aGlzIHZhbHVlIGlzIGZhbHNlIHRoZSB2YWx1ZShzKVxuICogZm9yIGVhY2ggZWxlbWVudCBpcyByZXR1cm5lZC5cbiAqXG4gKiBOb3RlOiBUaGlzIG1ldGhvZCAqYWx3YXlzKiByZXR1cm5zIGFuIGFycmF5LiAgSWYgbm8gdmFsaWQgdmFsdWUgY2FuIGJlIGRldGVybWluZWQgdGhlXG4gKiAgICBhcnJheSB3aWxsIGJlIGVtcHR5LCBvdGhlcndpc2UgaXQgd2lsbCBjb250YWluIG9uZSBvciBtb3JlIHZhbHVlcy5cbiAqL1xuJC5mbi5maWVsZFZhbHVlID0gZnVuY3Rpb24oc3VjY2Vzc2Z1bCkge1xuICAgIGZvciAodmFyIHZhbD1bXSwgaT0wLCBtYXg9dGhpcy5sZW5ndGg7IGkgPCBtYXg7IGkrKykge1xuICAgICAgICB2YXIgZWwgPSB0aGlzW2ldO1xuICAgICAgICB2YXIgdiA9ICQuZmllbGRWYWx1ZShlbCwgc3VjY2Vzc2Z1bCk7XG4gICAgICAgIGlmICh2ID09PSBudWxsIHx8IHR5cGVvZiB2ID09ICd1bmRlZmluZWQnIHx8ICh2LmNvbnN0cnVjdG9yID09IEFycmF5ICYmICF2Lmxlbmd0aCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2LmNvbnN0cnVjdG9yID09IEFycmF5KSB7XG4gICAgICAgICAgICAkLm1lcmdlKHZhbCwgdik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YWwucHVzaCh2KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGUgZmllbGQgZWxlbWVudC5cbiAqL1xuJC5maWVsZFZhbHVlID0gZnVuY3Rpb24oZWwsIHN1Y2Nlc3NmdWwpIHtcbiAgICB2YXIgbiA9IGVsLm5hbWUsIHQgPSBlbC50eXBlLCB0YWcgPSBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKHN1Y2Nlc3NmdWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzdWNjZXNzZnVsID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoc3VjY2Vzc2Z1bCAmJiAoIW4gfHwgZWwuZGlzYWJsZWQgfHwgdCA9PSAncmVzZXQnIHx8IHQgPT0gJ2J1dHRvbicgfHxcbiAgICAgICAgKHQgPT0gJ2NoZWNrYm94JyB8fCB0ID09ICdyYWRpbycpICYmICFlbC5jaGVja2VkIHx8XG4gICAgICAgICh0ID09ICdzdWJtaXQnIHx8IHQgPT0gJ2ltYWdlJykgJiYgZWwuZm9ybSAmJiBlbC5mb3JtLmNsayAhPSBlbCB8fFxuICAgICAgICB0YWcgPT0gJ3NlbGVjdCcgJiYgZWwuc2VsZWN0ZWRJbmRleCA9PSAtMSkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICh0YWcgPT0gJ3NlbGVjdCcpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gZWwuc2VsZWN0ZWRJbmRleDtcbiAgICAgICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGEgPSBbXSwgb3BzID0gZWwub3B0aW9ucztcbiAgICAgICAgdmFyIG9uZSA9ICh0ID09ICdzZWxlY3Qtb25lJyk7XG4gICAgICAgIHZhciBtYXggPSAob25lID8gaW5kZXgrMSA6IG9wcy5sZW5ndGgpO1xuICAgICAgICBmb3IodmFyIGk9KG9uZSA/IGluZGV4IDogMCk7IGkgPCBtYXg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG9wID0gb3BzW2ldO1xuICAgICAgICAgICAgaWYgKG9wLnNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSBvcC52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAoIXYpIHsgLy8gZXh0cmEgcGFpbiBmb3IgSUUuLi5cbiAgICAgICAgICAgICAgICAgICAgdiA9IChvcC5hdHRyaWJ1dGVzICYmIG9wLmF0dHJpYnV0ZXMudmFsdWUgJiYgIShvcC5hdHRyaWJ1dGVzLnZhbHVlLnNwZWNpZmllZCkpID8gb3AudGV4dCA6IG9wLnZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAob25lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhLnB1c2godik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIHJldHVybiAkKGVsKS52YWwoKTtcbn07XG5cbi8qKlxuICogQ2xlYXJzIHRoZSBmb3JtIGRhdGEuICBUYWtlcyB0aGUgZm9sbG93aW5nIGFjdGlvbnMgb24gdGhlIGZvcm0ncyBpbnB1dCBmaWVsZHM6XG4gKiAgLSBpbnB1dCB0ZXh0IGZpZWxkcyB3aWxsIGhhdmUgdGhlaXIgJ3ZhbHVlJyBwcm9wZXJ0eSBzZXQgdG8gdGhlIGVtcHR5IHN0cmluZ1xuICogIC0gc2VsZWN0IGVsZW1lbnRzIHdpbGwgaGF2ZSB0aGVpciAnc2VsZWN0ZWRJbmRleCcgcHJvcGVydHkgc2V0IHRvIC0xXG4gKiAgLSBjaGVja2JveCBhbmQgcmFkaW8gaW5wdXRzIHdpbGwgaGF2ZSB0aGVpciAnY2hlY2tlZCcgcHJvcGVydHkgc2V0IHRvIGZhbHNlXG4gKiAgLSBpbnB1dHMgb2YgdHlwZSBzdWJtaXQsIGJ1dHRvbiwgcmVzZXQsIGFuZCBoaWRkZW4gd2lsbCAqbm90KiBiZSBlZmZlY3RlZFxuICogIC0gYnV0dG9uIGVsZW1lbnRzIHdpbGwgKm5vdCogYmUgZWZmZWN0ZWRcbiAqL1xuJC5mbi5jbGVhckZvcm0gPSBmdW5jdGlvbihpbmNsdWRlSGlkZGVuKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnaW5wdXQsc2VsZWN0LHRleHRhcmVhJywgdGhpcykuY2xlYXJGaWVsZHMoaW5jbHVkZUhpZGRlbik7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIENsZWFycyB0aGUgc2VsZWN0ZWQgZm9ybSBlbGVtZW50cy5cbiAqL1xuJC5mbi5jbGVhckZpZWxkcyA9ICQuZm4uY2xlYXJJbnB1dHMgPSBmdW5jdGlvbihpbmNsdWRlSGlkZGVuKSB7XG4gICAgdmFyIHJlID0gL14oPzpjb2xvcnxkYXRlfGRhdGV0aW1lfGVtYWlsfG1vbnRofG51bWJlcnxwYXNzd29yZHxyYW5nZXxzZWFyY2h8dGVsfHRleHR8dGltZXx1cmx8d2VlaykkL2k7IC8vICdoaWRkZW4nIGlzIG5vdCBpbiB0aGlzIGxpc3RcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdCA9IHRoaXMudHlwZSwgdGFnID0gdGhpcy50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChyZS50ZXN0KHQpIHx8IHRhZyA9PSAndGV4dGFyZWEnKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodCA9PSAnY2hlY2tib3gnIHx8IHQgPT0gJ3JhZGlvJykge1xuICAgICAgICAgICAgdGhpcy5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGFnID09ICdzZWxlY3QnKSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSAtMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0ID09IFwiZmlsZVwiKSB7XG4gICAgICAgICAgICBpZiAoL01TSUUvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnJlcGxhY2VXaXRoKCQodGhpcykuY2xvbmUodHJ1ZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnZhbCgnJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaW5jbHVkZUhpZGRlbikge1xuICAgICAgICAgICAgLy8gaW5jbHVkZUhpZGRlbiBjYW4gYmUgdGhlIHZhbHVlIHRydWUsIG9yIGl0IGNhbiBiZSBhIHNlbGVjdG9yIHN0cmluZ1xuICAgICAgICAgICAgLy8gaW5kaWNhdGluZyBhIHNwZWNpYWwgdGVzdDsgZm9yIGV4YW1wbGU6XG4gICAgICAgICAgICAvLyAgJCgnI215Rm9ybScpLmNsZWFyRm9ybSgnLnNwZWNpYWw6aGlkZGVuJylcbiAgICAgICAgICAgIC8vIHRoZSBhYm92ZSB3b3VsZCBjbGVhbiBoaWRkZW4gaW5wdXRzIHRoYXQgaGF2ZSB0aGUgY2xhc3Mgb2YgJ3NwZWNpYWwnXG4gICAgICAgICAgICBpZiAoIChpbmNsdWRlSGlkZGVuID09PSB0cnVlICYmIC9oaWRkZW4vLnRlc3QodCkpIHx8XG4gICAgICAgICAgICAgICAgICh0eXBlb2YgaW5jbHVkZUhpZGRlbiA9PSAnc3RyaW5nJyAmJiAkKHRoaXMpLmlzKGluY2x1ZGVIaWRkZW4pKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8qKlxuICogUmVzZXRzIHRoZSBmb3JtIGRhdGEuICBDYXVzZXMgYWxsIGZvcm0gZWxlbWVudHMgdG8gYmUgcmVzZXQgdG8gdGhlaXIgb3JpZ2luYWwgdmFsdWUuXG4gKi9cbiQuZm4ucmVzZXRGb3JtID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gZ3VhcmQgYWdhaW5zdCBhbiBpbnB1dCB3aXRoIHRoZSBuYW1lIG9mICdyZXNldCdcbiAgICAgICAgLy8gbm90ZSB0aGF0IElFIHJlcG9ydHMgdGhlIHJlc2V0IGZ1bmN0aW9uIGFzIGFuICdvYmplY3QnXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5yZXNldCA9PSAnZnVuY3Rpb24nIHx8ICh0eXBlb2YgdGhpcy5yZXNldCA9PSAnb2JqZWN0JyAmJiAhdGhpcy5yZXNldC5ub2RlVHlwZSkpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLyoqXG4gKiBFbmFibGVzIG9yIGRpc2FibGVzIGFueSBtYXRjaGluZyBlbGVtZW50cy5cbiAqL1xuJC5mbi5lbmFibGUgPSBmdW5jdGlvbihiKSB7XG4gICAgaWYgKGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBiID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5kaXNhYmxlZCA9ICFiO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBDaGVja3MvdW5jaGVja3MgYW55IG1hdGNoaW5nIGNoZWNrYm94ZXMgb3IgcmFkaW8gYnV0dG9ucyBhbmRcbiAqIHNlbGVjdHMvZGVzZWxlY3RzIGFuZCBtYXRjaGluZyBvcHRpb24gZWxlbWVudHMuXG4gKi9cbiQuZm4uc2VsZWN0ZWQgPSBmdW5jdGlvbihzZWxlY3QpIHtcbiAgICBpZiAoc2VsZWN0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgc2VsZWN0ID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHQgPSB0aGlzLnR5cGU7XG4gICAgICAgIGlmICh0ID09ICdjaGVja2JveCcgfHwgdCA9PSAncmFkaW8nKSB7XG4gICAgICAgICAgICB0aGlzLmNoZWNrZWQgPSBzZWxlY3Q7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ29wdGlvbicpIHtcbiAgICAgICAgICAgIHZhciAkc2VsID0gJCh0aGlzKS5wYXJlbnQoJ3NlbGVjdCcpO1xuICAgICAgICAgICAgaWYgKHNlbGVjdCAmJiAkc2VsWzBdICYmICRzZWxbMF0udHlwZSA9PSAnc2VsZWN0LW9uZScpIHtcbiAgICAgICAgICAgICAgICAvLyBkZXNlbGVjdCBhbGwgb3RoZXIgb3B0aW9uc1xuICAgICAgICAgICAgICAgICRzZWwuZmluZCgnb3B0aW9uJykuc2VsZWN0ZWQoZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IHNlbGVjdDtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLy8gZXhwb3NlIGRlYnVnIHZhclxuJC5mbi5hamF4U3VibWl0LmRlYnVnID0gZmFsc2U7XG5cbi8vIGhlbHBlciBmbiBmb3IgY29uc29sZSBsb2dnaW5nXG5mdW5jdGlvbiBsb2coKSB7XG4gICAgaWYgKCEkLmZuLmFqYXhTdWJtaXQuZGVidWcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbXNnID0gJ1tqcXVlcnkuZm9ybV0gJyArIEFycmF5LnByb3RvdHlwZS5qb2luLmNhbGwoYXJndW1lbnRzLCcnKTtcbiAgICBpZiAod2luZG93LmNvbnNvbGUgJiYgd2luZG93LmNvbnNvbGUubG9nKSB7XG4gICAgICAgIHdpbmRvdy5jb25zb2xlLmxvZyhtc2cpO1xuICAgIH1cbiAgICBlbHNlIGlmICh3aW5kb3cub3BlcmEgJiYgd2luZG93Lm9wZXJhLnBvc3RFcnJvcikge1xuICAgICAgICB3aW5kb3cub3BlcmEucG9zdEVycm9yKG1zZyk7XG4gICAgfVxufVxuXG59KSk7XG4iLCIvKipcbiAqIFtqUXVlcnktbGF6eWxvYWQtYW55XXtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZW1uMTc4L2pxdWVyeS1sYXp5bG9hZC1hbnl9XG4gKlxuICogQHZlcnNpb24gMC4zLjBcbiAqIEBhdXRob3IgWWktQ3l1YW4gQ2hlbiBbZW1uMTc4QGdtYWlsLmNvbV1cbiAqIEBjb3B5cmlnaHQgWWktQ3l1YW4gQ2hlbiAyMDE0LTIwMTZcbiAqIEBsaWNlbnNlIE1JVFxuICovXG4oZnVuY3Rpb24oZCxrLGwpe2Z1bmN0aW9uIG0oKXt2YXIgYT1kKHRoaXMpLGM7aWYoYz1hLmlzKFwiOnZpc2libGVcIikpe2M9YVswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTt2YXIgYj0tYS5kYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueVwiKS50aHJlc2hvbGQsZT1uLWIsZj1wLWI7Yz0oYy50b3A+PWImJmMudG9wPD1lfHxjLmJvdHRvbT49YiYmYy5ib3R0b208PWUpJiYoYy5sZWZ0Pj1iJiZjLmxlZnQ8PWZ8fGMucmlnaHQ+PWImJmMucmlnaHQ8PWYpfWMmJmEudHJpZ2dlcihcImFwcGVhclwiKX1mdW5jdGlvbiBxKCl7bj1rLmlubmVySGVpZ2h0fHxsLmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7cD1rLmlubmVyV2lkdGh8fGwuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO2coKX1mdW5jdGlvbiBnKCl7aD1oLmZpbHRlcihcIjpqcXVlcnktbGF6eWxvYWQtYW55LWFwcGVhclwiKTsxPT10aGlzLm5vZGVUeXBlP2QodGhpcykuZmluZChcIjpqcXVlcnktbGF6eWxvYWQtYW55LWFwcGVhclwiKS5lYWNoKG0pOlxuaC5lYWNoKG0pfWZ1bmN0aW9uIHYoKXt2YXIgYT1kKHRoaXMpLGM9YS5kYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueVwiKSxiPWEuZGF0YShcImxhenlsb2FkXCIpO2J8fChiPWEuY2hpbGRyZW4oKS5maWx0ZXIoJ3NjcmlwdFt0eXBlPVwidGV4dC9sYXp5bG9hZFwiXScpLmdldCgwKSxiPWQoYikuaHRtbCgpKTtifHwoYj0oYj1hLmNvbnRlbnRzKCkuZmlsdGVyKGZ1bmN0aW9uKCl7cmV0dXJuIDg9PT10aGlzLm5vZGVUeXBlfSkuZ2V0KDApKSYmZC50cmltKGIuZGF0YSkpO2I9dy5odG1sKGIpLmNvbnRlbnRzKCk7YS5yZXBsYWNlV2l0aChiKTtkLmlzRnVuY3Rpb24oYy5sb2FkKSYmYy5sb2FkLmNhbGwoYixiKX1mdW5jdGlvbiByKCl7dmFyIGE9ZCh0aGlzKSxjO2EuZGF0YShcImpxdWVyeS1sYXp5bG9hZC1hbnktc2Nyb2xsZXJcIik/Yz0hMTooYz1hLmNzcyhcIm92ZXJmbG93XCIpLFwic2Nyb2xsXCIhPWMmJlwiYXV0b1wiIT1jP2M9ITE6KGEuZGF0YShcImpxdWVyeS1sYXp5bG9hZC1hbnktc2Nyb2xsZXJcIixcbjEpLGEuYmluZChcInNjcm9sbFwiLGcpLGM9ITApKTt2YXIgYjthLmRhdGEoXCJqcXVlcnktbGF6eWxvYWQtYW55LWRpc3BsYXlcIik/Yj12b2lkIDA6XCJub25lXCIhPWEuY3NzKFwiZGlzcGxheVwiKT9iPXZvaWQgMDooYS5kYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueS1kaXNwbGF5XCIsMSksYS5fYmluZFNob3coZyksYj0hMCk7Y3xiJiYhYS5kYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueS13YXRjaFwiKSYmKGEuZGF0YShcImpxdWVyeS1sYXp5bG9hZC1hbnktd2F0Y2hcIiwxKSxhLmJpbmQoXCJhcHBlYXJcIix0KSl9ZnVuY3Rpb24gdCgpe3ZhciBhPWQodGhpcyk7MD09PWEuZmluZChcIjpqcXVlcnktbGF6eWxvYWQtYW55LWFwcGVhclwiKS5sZW5ndGgmJihhLnJlbW92ZURhdGEoXCJqcXVlcnktbGF6eWxvYWQtYW55LXNjcm9sbGVyXCIpLnJlbW92ZURhdGEoXCJqcXVlcnktbGF6eWxvYWQtYW55LWRpc3BsYXlcIikucmVtb3ZlRGF0YShcImpxdWVyeS1sYXp5bG9hZC1hbnktd2F0Y2hcIiksYS51bmJpbmQoXCJzY3JvbGxcIixcbmcpLnVuYmluZChcImFwcGVhclwiLHQpLl91bmJpbmRTaG93KGcpKX12YXIgdz1kKFwiPGRpdi8+XCIpLG4scCx1PSExLGg9ZCgpO2QuZXhwcltcIjpcIl1bXCJqcXVlcnktbGF6eWxvYWQtYW55LWFwcGVhclwiXT1mdW5jdGlvbihhKXtyZXR1cm4gdm9pZCAwIT09ZChhKS5kYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueS1hcHBlYXJcIil9O2QuZm4ubGF6eWxvYWQ9ZnVuY3Rpb24oYSl7dmFyIGM9e3RocmVzaG9sZDowLHRyaWdnZXI6XCJhcHBlYXJcIn07ZC5leHRlbmQoYyxhKTthPWMudHJpZ2dlci5zcGxpdChcIiBcIik7dGhpcy5kYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueS1hcHBlYXJcIiwtMSE9ZC5pbkFycmF5KFwiYXBwZWFyXCIsYSkpLmRhdGEoXCJqcXVlcnktbGF6eWxvYWQtYW55XCIsYyk7dGhpcy5iaW5kKGMudHJpZ2dlcix2KTt0aGlzLmVhY2gobSk7dGhpcy5wYXJlbnRzKCkuZWFjaChyKTt0aGlzLmVhY2goZnVuY3Rpb24oKXtoPWguYWRkKHRoaXMpfSk7dXx8KHU9ITAscSgpLGQobCkucmVhZHkoZnVuY3Rpb24oKXtkKGspLmJpbmQoXCJyZXNpemVcIixcbnEpLmJpbmQoXCJzY3JvbGxcIixnKX0pKTtyZXR1cm4gdGhpc307ZC5sYXp5bG9hZD17Y2hlY2s6ZyxyZWZyZXNoOmZ1bmN0aW9uKGEpeyh2b2lkIDA9PT1hP2g6ZChhKSkuZWFjaChmdW5jdGlvbigpe3ZhciBhPWQodGhpcyk7YS5pcyhcIjpqcXVlcnktbGF6eWxvYWQtYW55LWFwcGVhclwiKSYmYS5wYXJlbnRzKCkuZWFjaChyKX0pfX07KGZ1bmN0aW9uKCl7ZnVuY3Rpb24gYSgpe3ZhciBhPWQodGhpcyksYj1cIm5vbmVcIiE9YS5jc3MoXCJkaXNwbGF5XCIpO2EuZGF0YShcImpxdWVyeS1sYXp5bG9hZC1hbnktc2hvd1wiKSE9YiYmKGEuZGF0YShcImpxdWVyeS1sYXp5bG9hZC1hbnktc2hvd1wiLGIpLGImJmEudHJpZ2dlcihcInNob3dcIikpfWZ1bmN0aW9uIGMoKXtmPWYuZmlsdGVyKFwiOmpxdWVyeS1sYXp5bG9hZC1hbnktc2hvd1wiKTtmLmVhY2goYSk7MD09PWYubGVuZ3RoJiYoZT1jbGVhckludGVydmFsKGUpKX12YXIgYj01MCxlLGY9ZCgpO2QuZXhwcltcIjpcIl1bXCJqcXVlcnktbGF6eWxvYWQtYW55LXNob3dcIl09XG5mdW5jdGlvbihhKXtyZXR1cm4gdm9pZCAwIT09ZChhKS5kYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueS1zaG93XCIpfTtkLmZuLl9iaW5kU2hvdz1mdW5jdGlvbihhKXt0aGlzLmJpbmQoXCJzaG93XCIsYSk7dGhpcy5kYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueS1zaG93XCIsXCJub25lXCIhPXRoaXMuY3NzKFwiZGlzcGxheVwiKSk7Zj1mLmFkZCh0aGlzKTtiJiYhZSYmKGU9c2V0SW50ZXJ2YWwoYyxiKSl9O2QuZm4uX3VuYmluZFNob3c9ZnVuY3Rpb24oYSl7dGhpcy51bmJpbmQoXCJzaG93XCIsYSk7dGhpcy5yZW1vdmVEYXRhKFwianF1ZXJ5LWxhenlsb2FkLWFueS1zaG93XCIpfTtkLmxhenlsb2FkLnNldEludGVydmFsPWZ1bmN0aW9uKGEpe2E9PWJ8fCFkLmlzTnVtZXJpYyhhKXx8MD5hfHwoYj1hLGU9Y2xlYXJJbnRlcnZhbChlKSwwPGImJihlPXNldEludGVydmFsKGMsYikpKX19KSgpfSkoalF1ZXJ5LHdpbmRvdyxkb2N1bWVudCk7XG4iLCIvLyBNYWduaWZpYyBQb3B1cCB2MS4xLjAgYnkgRG1pdHJ5IFNlbWVub3ZcclxuLy8gaHR0cDovL2JpdC5seS9tYWduaWZpYy1wb3B1cCNidWlsZD1pbmxpbmUraW1hZ2UrYWpheCtpZnJhbWUrZ2FsbGVyeStyZXRpbmEraW1hZ2V6b29tXHJcbihmdW5jdGlvbihhKXt0eXBlb2YgZGVmaW5lPT1cImZ1bmN0aW9uXCImJmRlZmluZS5hbWQ/ZGVmaW5lKFtcImpxdWVyeVwiXSxhKTp0eXBlb2YgZXhwb3J0cz09XCJvYmplY3RcIj9hKHJlcXVpcmUoXCJqcXVlcnlcIikpOmEod2luZG93LmpRdWVyeXx8d2luZG93LlplcHRvKX0pKGZ1bmN0aW9uKGEpe3ZhciBiPVwiQ2xvc2VcIixjPVwiQmVmb3JlQ2xvc2VcIixkPVwiQWZ0ZXJDbG9zZVwiLGU9XCJCZWZvcmVBcHBlbmRcIixmPVwiTWFya3VwUGFyc2VcIixnPVwiT3BlblwiLGg9XCJDaGFuZ2VcIixpPVwibWZwXCIsaj1cIi5cIitpLGs9XCJtZnAtcmVhZHlcIixsPVwibWZwLXJlbW92aW5nXCIsbT1cIm1mcC1wcmV2ZW50LWNsb3NlXCIsbixvPWZ1bmN0aW9uKCl7fSxwPSEhd2luZG93LmpRdWVyeSxxLHI9YSh3aW5kb3cpLHMsdCx1LHYsdz1mdW5jdGlvbihhLGIpe24uZXYub24oaSthK2osYil9LHg9ZnVuY3Rpb24oYixjLGQsZSl7dmFyIGY9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtyZXR1cm4gZi5jbGFzc05hbWU9XCJtZnAtXCIrYixkJiYoZi5pbm5lckhUTUw9ZCksZT9jJiZjLmFwcGVuZENoaWxkKGYpOihmPWEoZiksYyYmZi5hcHBlbmRUbyhjKSksZn0seT1mdW5jdGlvbihiLGMpe24uZXYudHJpZ2dlckhhbmRsZXIoaStiLGMpLG4uc3QuY2FsbGJhY2tzJiYoYj1iLmNoYXJBdCgwKS50b0xvd2VyQ2FzZSgpK2Iuc2xpY2UoMSksbi5zdC5jYWxsYmFja3NbYl0mJm4uc3QuY2FsbGJhY2tzW2JdLmFwcGx5KG4sYS5pc0FycmF5KGMpP2M6W2NdKSl9LHo9ZnVuY3Rpb24oYil7aWYoYiE9PXZ8fCFuLmN1cnJUZW1wbGF0ZS5jbG9zZUJ0biluLmN1cnJUZW1wbGF0ZS5jbG9zZUJ0bj1hKG4uc3QuY2xvc2VNYXJrdXAucmVwbGFjZShcIiV0aXRsZSVcIixuLnN0LnRDbG9zZSkpLHY9YjtyZXR1cm4gbi5jdXJyVGVtcGxhdGUuY2xvc2VCdG59LEE9ZnVuY3Rpb24oKXthLm1hZ25pZmljUG9wdXAuaW5zdGFuY2V8fChuPW5ldyBvLG4uaW5pdCgpLGEubWFnbmlmaWNQb3B1cC5pbnN0YW5jZT1uKX0sQj1mdW5jdGlvbigpe3ZhciBhPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpLnN0eWxlLGI9W1wibXNcIixcIk9cIixcIk1velwiLFwiV2Via2l0XCJdO2lmKGEudHJhbnNpdGlvbiE9PXVuZGVmaW5lZClyZXR1cm4hMDt3aGlsZShiLmxlbmd0aClpZihiLnBvcCgpK1wiVHJhbnNpdGlvblwiaW4gYSlyZXR1cm4hMDtyZXR1cm4hMX07by5wcm90b3R5cGU9e2NvbnN0cnVjdG9yOm8saW5pdDpmdW5jdGlvbigpe3ZhciBiPW5hdmlnYXRvci5hcHBWZXJzaW9uO24uaXNMb3dJRT1uLmlzSUU4PWRvY3VtZW50LmFsbCYmIWRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIsbi5pc0FuZHJvaWQ9L2FuZHJvaWQvZ2kudGVzdChiKSxuLmlzSU9TPS9pcGhvbmV8aXBhZHxpcG9kL2dpLnRlc3QoYiksbi5zdXBwb3J0c1RyYW5zaXRpb249QigpLG4ucHJvYmFibHlNb2JpbGU9bi5pc0FuZHJvaWR8fG4uaXNJT1N8fC8oT3BlcmEgTWluaSl8S2luZGxlfHdlYk9TfEJsYWNrQmVycnl8KE9wZXJhIE1vYmkpfChXaW5kb3dzIFBob25lKXxJRU1vYmlsZS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkscz1hKGRvY3VtZW50KSxuLnBvcHVwc0NhY2hlPXt9fSxvcGVuOmZ1bmN0aW9uKGIpe3ZhciBjO2lmKGIuaXNPYmo9PT0hMSl7bi5pdGVtcz1iLml0ZW1zLnRvQXJyYXkoKSxuLmluZGV4PTA7dmFyIGQ9Yi5pdGVtcyxlO2ZvcihjPTA7YzxkLmxlbmd0aDtjKyspe2U9ZFtjXSxlLnBhcnNlZCYmKGU9ZS5lbFswXSk7aWYoZT09PWIuZWxbMF0pe24uaW5kZXg9YzticmVha319fWVsc2Ugbi5pdGVtcz1hLmlzQXJyYXkoYi5pdGVtcyk/Yi5pdGVtczpbYi5pdGVtc10sbi5pbmRleD1iLmluZGV4fHwwO2lmKG4uaXNPcGVuKXtuLnVwZGF0ZUl0ZW1IVE1MKCk7cmV0dXJufW4udHlwZXM9W10sdT1cIlwiLGIubWFpbkVsJiZiLm1haW5FbC5sZW5ndGg/bi5ldj1iLm1haW5FbC5lcSgwKTpuLmV2PXMsYi5rZXk/KG4ucG9wdXBzQ2FjaGVbYi5rZXldfHwobi5wb3B1cHNDYWNoZVtiLmtleV09e30pLG4uY3VyclRlbXBsYXRlPW4ucG9wdXBzQ2FjaGVbYi5rZXldKTpuLmN1cnJUZW1wbGF0ZT17fSxuLnN0PWEuZXh0ZW5kKCEwLHt9LGEubWFnbmlmaWNQb3B1cC5kZWZhdWx0cyxiKSxuLmZpeGVkQ29udGVudFBvcz1uLnN0LmZpeGVkQ29udGVudFBvcz09PVwiYXV0b1wiPyFuLnByb2JhYmx5TW9iaWxlOm4uc3QuZml4ZWRDb250ZW50UG9zLG4uc3QubW9kYWwmJihuLnN0LmNsb3NlT25Db250ZW50Q2xpY2s9ITEsbi5zdC5jbG9zZU9uQmdDbGljaz0hMSxuLnN0LnNob3dDbG9zZUJ0bj0hMSxuLnN0LmVuYWJsZUVzY2FwZUtleT0hMSksbi5iZ092ZXJsYXl8fChuLmJnT3ZlcmxheT14KFwiYmdcIikub24oXCJjbGlja1wiK2osZnVuY3Rpb24oKXtuLmNsb3NlKCl9KSxuLndyYXA9eChcIndyYXBcIikuYXR0cihcInRhYmluZGV4XCIsLTEpLm9uKFwiY2xpY2tcIitqLGZ1bmN0aW9uKGEpe24uX2NoZWNrSWZDbG9zZShhLnRhcmdldCkmJm4uY2xvc2UoKX0pLG4uY29udGFpbmVyPXgoXCJjb250YWluZXJcIixuLndyYXApKSxuLmNvbnRlbnRDb250YWluZXI9eChcImNvbnRlbnRcIiksbi5zdC5wcmVsb2FkZXImJihuLnByZWxvYWRlcj14KFwicHJlbG9hZGVyXCIsbi5jb250YWluZXIsbi5zdC50TG9hZGluZykpO3ZhciBoPWEubWFnbmlmaWNQb3B1cC5tb2R1bGVzO2ZvcihjPTA7YzxoLmxlbmd0aDtjKyspe3ZhciBpPWhbY107aT1pLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpK2kuc2xpY2UoMSksbltcImluaXRcIitpXS5jYWxsKG4pfXkoXCJCZWZvcmVPcGVuXCIpLG4uc3Quc2hvd0Nsb3NlQnRuJiYobi5zdC5jbG9zZUJ0bkluc2lkZT8odyhmLGZ1bmN0aW9uKGEsYixjLGQpe2MuY2xvc2VfcmVwbGFjZVdpdGg9eihkLnR5cGUpfSksdSs9XCIgbWZwLWNsb3NlLWJ0bi1pblwiKTpuLndyYXAuYXBwZW5kKHooKSkpLG4uc3QuYWxpZ25Ub3AmJih1Kz1cIiBtZnAtYWxpZ24tdG9wXCIpLG4uZml4ZWRDb250ZW50UG9zP24ud3JhcC5jc3Moe292ZXJmbG93Om4uc3Qub3ZlcmZsb3dZLG92ZXJmbG93WDpcImhpZGRlblwiLG92ZXJmbG93WTpuLnN0Lm92ZXJmbG93WX0pOm4ud3JhcC5jc3Moe3RvcDpyLnNjcm9sbFRvcCgpLHBvc2l0aW9uOlwiYWJzb2x1dGVcIn0pLChuLnN0LmZpeGVkQmdQb3M9PT0hMXx8bi5zdC5maXhlZEJnUG9zPT09XCJhdXRvXCImJiFuLmZpeGVkQ29udGVudFBvcykmJm4uYmdPdmVybGF5LmNzcyh7aGVpZ2h0OnMuaGVpZ2h0KCkscG9zaXRpb246XCJhYnNvbHV0ZVwifSksbi5zdC5lbmFibGVFc2NhcGVLZXkmJnMub24oXCJrZXl1cFwiK2osZnVuY3Rpb24oYSl7YS5rZXlDb2RlPT09MjcmJm4uY2xvc2UoKX0pLHIub24oXCJyZXNpemVcIitqLGZ1bmN0aW9uKCl7bi51cGRhdGVTaXplKCl9KSxuLnN0LmNsb3NlT25Db250ZW50Q2xpY2t8fCh1Kz1cIiBtZnAtYXV0by1jdXJzb3JcIiksdSYmbi53cmFwLmFkZENsYXNzKHUpO3ZhciBsPW4ud0g9ci5oZWlnaHQoKSxtPXt9O2lmKG4uZml4ZWRDb250ZW50UG9zJiZuLl9oYXNTY3JvbGxCYXIobCkpe3ZhciBvPW4uX2dldFNjcm9sbGJhclNpemUoKTtvJiYobS5tYXJnaW5SaWdodD1vKX1uLmZpeGVkQ29udGVudFBvcyYmKG4uaXNJRTc/YShcImJvZHksIGh0bWxcIikuY3NzKFwib3ZlcmZsb3dcIixcImhpZGRlblwiKTptLm92ZXJmbG93PVwiaGlkZGVuXCIpO3ZhciBwPW4uc3QubWFpbkNsYXNzO3JldHVybiBuLmlzSUU3JiYocCs9XCIgbWZwLWllN1wiKSxwJiZuLl9hZGRDbGFzc1RvTUZQKHApLG4udXBkYXRlSXRlbUhUTUwoKSx5KFwiQnVpbGRDb250cm9sc1wiKSxhKFwiaHRtbFwiKS5jc3MobSksbi5iZ092ZXJsYXkuYWRkKG4ud3JhcCkucHJlcGVuZFRvKG4uc3QucHJlcGVuZFRvfHxhKGRvY3VtZW50LmJvZHkpKSxuLl9sYXN0Rm9jdXNlZEVsPWRvY3VtZW50LmFjdGl2ZUVsZW1lbnQsc2V0VGltZW91dChmdW5jdGlvbigpe24uY29udGVudD8obi5fYWRkQ2xhc3NUb01GUChrKSxuLl9zZXRGb2N1cygpKTpuLmJnT3ZlcmxheS5hZGRDbGFzcyhrKSxzLm9uKFwiZm9jdXNpblwiK2osbi5fb25Gb2N1c0luKX0sMTYpLG4uaXNPcGVuPSEwLG4udXBkYXRlU2l6ZShsKSx5KGcpLGJ9LGNsb3NlOmZ1bmN0aW9uKCl7aWYoIW4uaXNPcGVuKXJldHVybjt5KGMpLG4uaXNPcGVuPSExLG4uc3QucmVtb3ZhbERlbGF5JiYhbi5pc0xvd0lFJiZuLnN1cHBvcnRzVHJhbnNpdGlvbj8obi5fYWRkQ2xhc3NUb01GUChsKSxzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7bi5fY2xvc2UoKX0sbi5zdC5yZW1vdmFsRGVsYXkpKTpuLl9jbG9zZSgpfSxfY2xvc2U6ZnVuY3Rpb24oKXt5KGIpO3ZhciBjPWwrXCIgXCIraytcIiBcIjtuLmJnT3ZlcmxheS5kZXRhY2goKSxuLndyYXAuZGV0YWNoKCksbi5jb250YWluZXIuZW1wdHkoKSxuLnN0Lm1haW5DbGFzcyYmKGMrPW4uc3QubWFpbkNsYXNzK1wiIFwiKSxuLl9yZW1vdmVDbGFzc0Zyb21NRlAoYyk7aWYobi5maXhlZENvbnRlbnRQb3Mpe3ZhciBlPXttYXJnaW5SaWdodDpcIlwifTtuLmlzSUU3P2EoXCJib2R5LCBodG1sXCIpLmNzcyhcIm92ZXJmbG93XCIsXCJcIik6ZS5vdmVyZmxvdz1cIlwiLGEoXCJodG1sXCIpLmNzcyhlKX1zLm9mZihcImtleXVwXCIraitcIiBmb2N1c2luXCIraiksbi5ldi5vZmYoaiksbi53cmFwLmF0dHIoXCJjbGFzc1wiLFwibWZwLXdyYXBcIikucmVtb3ZlQXR0cihcInN0eWxlXCIpLG4uYmdPdmVybGF5LmF0dHIoXCJjbGFzc1wiLFwibWZwLWJnXCIpLG4uY29udGFpbmVyLmF0dHIoXCJjbGFzc1wiLFwibWZwLWNvbnRhaW5lclwiKSxuLnN0LnNob3dDbG9zZUJ0biYmKCFuLnN0LmNsb3NlQnRuSW5zaWRlfHxuLmN1cnJUZW1wbGF0ZVtuLmN1cnJJdGVtLnR5cGVdPT09ITApJiZuLmN1cnJUZW1wbGF0ZS5jbG9zZUJ0biYmbi5jdXJyVGVtcGxhdGUuY2xvc2VCdG4uZGV0YWNoKCksbi5zdC5hdXRvRm9jdXNMYXN0JiZuLl9sYXN0Rm9jdXNlZEVsJiZhKG4uX2xhc3RGb2N1c2VkRWwpLmZvY3VzKCksbi5jdXJySXRlbT1udWxsLG4uY29udGVudD1udWxsLG4uY3VyclRlbXBsYXRlPW51bGwsbi5wcmV2SGVpZ2h0PTAseShkKX0sdXBkYXRlU2l6ZTpmdW5jdGlvbihhKXtpZihuLmlzSU9TKXt2YXIgYj1kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgvd2luZG93LmlubmVyV2lkdGgsYz13aW5kb3cuaW5uZXJIZWlnaHQqYjtuLndyYXAuY3NzKFwiaGVpZ2h0XCIsYyksbi53SD1jfWVsc2Ugbi53SD1hfHxyLmhlaWdodCgpO24uZml4ZWRDb250ZW50UG9zfHxuLndyYXAuY3NzKFwiaGVpZ2h0XCIsbi53SCkseShcIlJlc2l6ZVwiKX0sdXBkYXRlSXRlbUhUTUw6ZnVuY3Rpb24oKXt2YXIgYj1uLml0ZW1zW24uaW5kZXhdO24uY29udGVudENvbnRhaW5lci5kZXRhY2goKSxuLmNvbnRlbnQmJm4uY29udGVudC5kZXRhY2goKSxiLnBhcnNlZHx8KGI9bi5wYXJzZUVsKG4uaW5kZXgpKTt2YXIgYz1iLnR5cGU7eShcIkJlZm9yZUNoYW5nZVwiLFtuLmN1cnJJdGVtP24uY3Vyckl0ZW0udHlwZTpcIlwiLGNdKSxuLmN1cnJJdGVtPWI7aWYoIW4uY3VyclRlbXBsYXRlW2NdKXt2YXIgZD1uLnN0W2NdP24uc3RbY10ubWFya3VwOiExO3koXCJGaXJzdE1hcmt1cFBhcnNlXCIsZCksZD9uLmN1cnJUZW1wbGF0ZVtjXT1hKGQpOm4uY3VyclRlbXBsYXRlW2NdPSEwfXQmJnQhPT1iLnR5cGUmJm4uY29udGFpbmVyLnJlbW92ZUNsYXNzKFwibWZwLVwiK3QrXCItaG9sZGVyXCIpO3ZhciBlPW5bXCJnZXRcIitjLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpK2Muc2xpY2UoMSldKGIsbi5jdXJyVGVtcGxhdGVbY10pO24uYXBwZW5kQ29udGVudChlLGMpLGIucHJlbG9hZGVkPSEwLHkoaCxiKSx0PWIudHlwZSxuLmNvbnRhaW5lci5wcmVwZW5kKG4uY29udGVudENvbnRhaW5lcikseShcIkFmdGVyQ2hhbmdlXCIpfSxhcHBlbmRDb250ZW50OmZ1bmN0aW9uKGEsYil7bi5jb250ZW50PWEsYT9uLnN0LnNob3dDbG9zZUJ0biYmbi5zdC5jbG9zZUJ0bkluc2lkZSYmbi5jdXJyVGVtcGxhdGVbYl09PT0hMD9uLmNvbnRlbnQuZmluZChcIi5tZnAtY2xvc2VcIikubGVuZ3RofHxuLmNvbnRlbnQuYXBwZW5kKHooKSk6bi5jb250ZW50PWE6bi5jb250ZW50PVwiXCIseShlKSxuLmNvbnRhaW5lci5hZGRDbGFzcyhcIm1mcC1cIitiK1wiLWhvbGRlclwiKSxuLmNvbnRlbnRDb250YWluZXIuYXBwZW5kKG4uY29udGVudCl9LHBhcnNlRWw6ZnVuY3Rpb24oYil7dmFyIGM9bi5pdGVtc1tiXSxkO2MudGFnTmFtZT9jPXtlbDphKGMpfTooZD1jLnR5cGUsYz17ZGF0YTpjLHNyYzpjLnNyY30pO2lmKGMuZWwpe3ZhciBlPW4udHlwZXM7Zm9yKHZhciBmPTA7ZjxlLmxlbmd0aDtmKyspaWYoYy5lbC5oYXNDbGFzcyhcIm1mcC1cIitlW2ZdKSl7ZD1lW2ZdO2JyZWFrfWMuc3JjPWMuZWwuYXR0cihcImRhdGEtbWZwLXNyY1wiKSxjLnNyY3x8KGMuc3JjPWMuZWwuYXR0cihcImhyZWZcIikpfXJldHVybiBjLnR5cGU9ZHx8bi5zdC50eXBlfHxcImlubGluZVwiLGMuaW5kZXg9YixjLnBhcnNlZD0hMCxuLml0ZW1zW2JdPWMseShcIkVsZW1lbnRQYXJzZVwiLGMpLG4uaXRlbXNbYl19LGFkZEdyb3VwOmZ1bmN0aW9uKGEsYil7dmFyIGM9ZnVuY3Rpb24oYyl7Yy5tZnBFbD10aGlzLG4uX29wZW5DbGljayhjLGEsYil9O2J8fChiPXt9KTt2YXIgZD1cImNsaWNrLm1hZ25pZmljUG9wdXBcIjtiLm1haW5FbD1hLGIuaXRlbXM/KGIuaXNPYmo9ITAsYS5vZmYoZCkub24oZCxjKSk6KGIuaXNPYmo9ITEsYi5kZWxlZ2F0ZT9hLm9mZihkKS5vbihkLGIuZGVsZWdhdGUsYyk6KGIuaXRlbXM9YSxhLm9mZihkKS5vbihkLGMpKSl9LF9vcGVuQ2xpY2s6ZnVuY3Rpb24oYixjLGQpe3ZhciBlPWQubWlkQ2xpY2shPT11bmRlZmluZWQ/ZC5taWRDbGljazphLm1hZ25pZmljUG9wdXAuZGVmYXVsdHMubWlkQ2xpY2s7aWYoIWUmJihiLndoaWNoPT09Mnx8Yi5jdHJsS2V5fHxiLm1ldGFLZXl8fGIuYWx0S2V5fHxiLnNoaWZ0S2V5KSlyZXR1cm47dmFyIGY9ZC5kaXNhYmxlT24hPT11bmRlZmluZWQ/ZC5kaXNhYmxlT246YS5tYWduaWZpY1BvcHVwLmRlZmF1bHRzLmRpc2FibGVPbjtpZihmKWlmKGEuaXNGdW5jdGlvbihmKSl7aWYoIWYuY2FsbChuKSlyZXR1cm4hMH1lbHNlIGlmKHIud2lkdGgoKTxmKXJldHVybiEwO2IudHlwZSYmKGIucHJldmVudERlZmF1bHQoKSxuLmlzT3BlbiYmYi5zdG9wUHJvcGFnYXRpb24oKSksZC5lbD1hKGIubWZwRWwpLGQuZGVsZWdhdGUmJihkLml0ZW1zPWMuZmluZChkLmRlbGVnYXRlKSksbi5vcGVuKGQpfSx1cGRhdGVTdGF0dXM6ZnVuY3Rpb24oYSxiKXtpZihuLnByZWxvYWRlcil7cSE9PWEmJm4uY29udGFpbmVyLnJlbW92ZUNsYXNzKFwibWZwLXMtXCIrcSksIWImJmE9PT1cImxvYWRpbmdcIiYmKGI9bi5zdC50TG9hZGluZyk7dmFyIGM9e3N0YXR1czphLHRleHQ6Yn07eShcIlVwZGF0ZVN0YXR1c1wiLGMpLGE9Yy5zdGF0dXMsYj1jLnRleHQsbi5wcmVsb2FkZXIuaHRtbChiKSxuLnByZWxvYWRlci5maW5kKFwiYVwiKS5vbihcImNsaWNrXCIsZnVuY3Rpb24oYSl7YS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKX0pLG4uY29udGFpbmVyLmFkZENsYXNzKFwibWZwLXMtXCIrYSkscT1hfX0sX2NoZWNrSWZDbG9zZTpmdW5jdGlvbihiKXtpZihhKGIpLmhhc0NsYXNzKG0pKXJldHVybjt2YXIgYz1uLnN0LmNsb3NlT25Db250ZW50Q2xpY2ssZD1uLnN0LmNsb3NlT25CZ0NsaWNrO2lmKGMmJmQpcmV0dXJuITA7aWYoIW4uY29udGVudHx8YShiKS5oYXNDbGFzcyhcIm1mcC1jbG9zZVwiKXx8bi5wcmVsb2FkZXImJmI9PT1uLnByZWxvYWRlclswXSlyZXR1cm4hMDtpZihiIT09bi5jb250ZW50WzBdJiYhYS5jb250YWlucyhuLmNvbnRlbnRbMF0sYikpe2lmKGQmJmEuY29udGFpbnMoZG9jdW1lbnQsYikpcmV0dXJuITB9ZWxzZSBpZihjKXJldHVybiEwO3JldHVybiExfSxfYWRkQ2xhc3NUb01GUDpmdW5jdGlvbihhKXtuLmJnT3ZlcmxheS5hZGRDbGFzcyhhKSxuLndyYXAuYWRkQ2xhc3MoYSl9LF9yZW1vdmVDbGFzc0Zyb21NRlA6ZnVuY3Rpb24oYSl7dGhpcy5iZ092ZXJsYXkucmVtb3ZlQ2xhc3MoYSksbi53cmFwLnJlbW92ZUNsYXNzKGEpfSxfaGFzU2Nyb2xsQmFyOmZ1bmN0aW9uKGEpe3JldHVybihuLmlzSUU3P3MuaGVpZ2h0KCk6ZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQpPihhfHxyLmhlaWdodCgpKX0sX3NldEZvY3VzOmZ1bmN0aW9uKCl7KG4uc3QuZm9jdXM/bi5jb250ZW50LmZpbmQobi5zdC5mb2N1cykuZXEoMCk6bi53cmFwKS5mb2N1cygpfSxfb25Gb2N1c0luOmZ1bmN0aW9uKGIpe2lmKGIudGFyZ2V0IT09bi53cmFwWzBdJiYhYS5jb250YWlucyhuLndyYXBbMF0sYi50YXJnZXQpKXJldHVybiBuLl9zZXRGb2N1cygpLCExfSxfcGFyc2VNYXJrdXA6ZnVuY3Rpb24oYixjLGQpe3ZhciBlO2QuZGF0YSYmKGM9YS5leHRlbmQoZC5kYXRhLGMpKSx5KGYsW2IsYyxkXSksYS5lYWNoKGMsZnVuY3Rpb24oYyxkKXtpZihkPT09dW5kZWZpbmVkfHxkPT09ITEpcmV0dXJuITA7ZT1jLnNwbGl0KFwiX1wiKTtpZihlLmxlbmd0aD4xKXt2YXIgZj1iLmZpbmQoaitcIi1cIitlWzBdKTtpZihmLmxlbmd0aD4wKXt2YXIgZz1lWzFdO2c9PT1cInJlcGxhY2VXaXRoXCI/ZlswXSE9PWRbMF0mJmYucmVwbGFjZVdpdGgoZCk6Zz09PVwiaW1nXCI/Zi5pcyhcImltZ1wiKT9mLmF0dHIoXCJzcmNcIixkKTpmLnJlcGxhY2VXaXRoKGEoXCI8aW1nPlwiKS5hdHRyKFwic3JjXCIsZCkuYXR0cihcImNsYXNzXCIsZi5hdHRyKFwiY2xhc3NcIikpKTpmLmF0dHIoZVsxXSxkKX19ZWxzZSBiLmZpbmQoaitcIi1cIitjKS5odG1sKGQpfSl9LF9nZXRTY3JvbGxiYXJTaXplOmZ1bmN0aW9uKCl7aWYobi5zY3JvbGxiYXJTaXplPT09dW5kZWZpbmVkKXt2YXIgYT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2Euc3R5bGUuY3NzVGV4dD1cIndpZHRoOiA5OXB4OyBoZWlnaHQ6IDk5cHg7IG92ZXJmbG93OiBzY3JvbGw7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAtOTk5OXB4O1wiLGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSksbi5zY3JvbGxiYXJTaXplPWEub2Zmc2V0V2lkdGgtYS5jbGllbnRXaWR0aCxkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGEpfXJldHVybiBuLnNjcm9sbGJhclNpemV9fSxhLm1hZ25pZmljUG9wdXA9e2luc3RhbmNlOm51bGwscHJvdG86by5wcm90b3R5cGUsbW9kdWxlczpbXSxvcGVuOmZ1bmN0aW9uKGIsYyl7cmV0dXJuIEEoKSxiP2I9YS5leHRlbmQoITAse30sYik6Yj17fSxiLmlzT2JqPSEwLGIuaW5kZXg9Y3x8MCx0aGlzLmluc3RhbmNlLm9wZW4oYil9LGNsb3NlOmZ1bmN0aW9uKCl7cmV0dXJuIGEubWFnbmlmaWNQb3B1cC5pbnN0YW5jZSYmYS5tYWduaWZpY1BvcHVwLmluc3RhbmNlLmNsb3NlKCl9LHJlZ2lzdGVyTW9kdWxlOmZ1bmN0aW9uKGIsYyl7Yy5vcHRpb25zJiYoYS5tYWduaWZpY1BvcHVwLmRlZmF1bHRzW2JdPWMub3B0aW9ucyksYS5leHRlbmQodGhpcy5wcm90byxjLnByb3RvKSx0aGlzLm1vZHVsZXMucHVzaChiKX0sZGVmYXVsdHM6e2Rpc2FibGVPbjowLGtleTpudWxsLG1pZENsaWNrOiExLG1haW5DbGFzczpcIlwiLHByZWxvYWRlcjohMCxmb2N1czpcIlwiLGNsb3NlT25Db250ZW50Q2xpY2s6ITEsY2xvc2VPbkJnQ2xpY2s6ITAsY2xvc2VCdG5JbnNpZGU6ITAsc2hvd0Nsb3NlQnRuOiEwLGVuYWJsZUVzY2FwZUtleTohMCxtb2RhbDohMSxhbGlnblRvcDohMSxyZW1vdmFsRGVsYXk6MCxwcmVwZW5kVG86bnVsbCxmaXhlZENvbnRlbnRQb3M6XCJhdXRvXCIsZml4ZWRCZ1BvczpcImF1dG9cIixvdmVyZmxvd1k6XCJhdXRvXCIsY2xvc2VNYXJrdXA6JzxidXR0b24gdGl0bGU9XCIldGl0bGUlXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwibWZwLWNsb3NlXCI+JiMyMTU7PC9idXR0b24+Jyx0Q2xvc2U6XCJDbG9zZSAoRXNjKVwiLHRMb2FkaW5nOlwiTG9hZGluZy4uLlwiLGF1dG9Gb2N1c0xhc3Q6ITB9fSxhLmZuLm1hZ25pZmljUG9wdXA9ZnVuY3Rpb24oYil7QSgpO3ZhciBjPWEodGhpcyk7aWYodHlwZW9mIGI9PVwic3RyaW5nXCIpaWYoYj09PVwib3BlblwiKXt2YXIgZCxlPXA/Yy5kYXRhKFwibWFnbmlmaWNQb3B1cFwiKTpjWzBdLm1hZ25pZmljUG9wdXAsZj1wYXJzZUludChhcmd1bWVudHNbMV0sMTApfHwwO2UuaXRlbXM/ZD1lLml0ZW1zW2ZdOihkPWMsZS5kZWxlZ2F0ZSYmKGQ9ZC5maW5kKGUuZGVsZWdhdGUpKSxkPWQuZXEoZikpLG4uX29wZW5DbGljayh7bWZwRWw6ZH0sYyxlKX1lbHNlIG4uaXNPcGVuJiZuW2JdLmFwcGx5KG4sQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLDEpKTtlbHNlIGI9YS5leHRlbmQoITAse30sYikscD9jLmRhdGEoXCJtYWduaWZpY1BvcHVwXCIsYik6Y1swXS5tYWduaWZpY1BvcHVwPWIsbi5hZGRHcm91cChjLGIpO3JldHVybiBjfTt2YXIgQz1cImlubGluZVwiLEQsRSxGLEc9ZnVuY3Rpb24oKXtGJiYoRS5hZnRlcihGLmFkZENsYXNzKEQpKS5kZXRhY2goKSxGPW51bGwpfTthLm1hZ25pZmljUG9wdXAucmVnaXN0ZXJNb2R1bGUoQyx7b3B0aW9uczp7aGlkZGVuQ2xhc3M6XCJoaWRlXCIsbWFya3VwOlwiXCIsdE5vdEZvdW5kOlwiQ29udGVudCBub3QgZm91bmRcIn0scHJvdG86e2luaXRJbmxpbmU6ZnVuY3Rpb24oKXtuLnR5cGVzLnB1c2goQyksdyhiK1wiLlwiK0MsZnVuY3Rpb24oKXtHKCl9KX0sZ2V0SW5saW5lOmZ1bmN0aW9uKGIsYyl7RygpO2lmKGIuc3JjKXt2YXIgZD1uLnN0LmlubGluZSxlPWEoYi5zcmMpO2lmKGUubGVuZ3RoKXt2YXIgZj1lWzBdLnBhcmVudE5vZGU7ZiYmZi50YWdOYW1lJiYoRXx8KEQ9ZC5oaWRkZW5DbGFzcyxFPXgoRCksRD1cIm1mcC1cIitEKSxGPWUuYWZ0ZXIoRSkuZGV0YWNoKCkucmVtb3ZlQ2xhc3MoRCkpLG4udXBkYXRlU3RhdHVzKFwicmVhZHlcIil9ZWxzZSBuLnVwZGF0ZVN0YXR1cyhcImVycm9yXCIsZC50Tm90Rm91bmQpLGU9YShcIjxkaXY+XCIpO3JldHVybiBiLmlubGluZUVsZW1lbnQ9ZSxlfXJldHVybiBuLnVwZGF0ZVN0YXR1cyhcInJlYWR5XCIpLG4uX3BhcnNlTWFya3VwKGMse30sYiksY319fSk7dmFyIEg9XCJhamF4XCIsSSxKPWZ1bmN0aW9uKCl7SSYmYShkb2N1bWVudC5ib2R5KS5yZW1vdmVDbGFzcyhJKX0sSz1mdW5jdGlvbigpe0ooKSxuLnJlcSYmbi5yZXEuYWJvcnQoKX07YS5tYWduaWZpY1BvcHVwLnJlZ2lzdGVyTW9kdWxlKEgse29wdGlvbnM6e3NldHRpbmdzOm51bGwsY3Vyc29yOlwibWZwLWFqYXgtY3VyXCIsdEVycm9yOic8YSBocmVmPVwiJXVybCVcIj5UaGUgY29udGVudDwvYT4gY291bGQgbm90IGJlIGxvYWRlZC4nfSxwcm90bzp7aW5pdEFqYXg6ZnVuY3Rpb24oKXtuLnR5cGVzLnB1c2goSCksST1uLnN0LmFqYXguY3Vyc29yLHcoYitcIi5cIitILEspLHcoXCJCZWZvcmVDaGFuZ2UuXCIrSCxLKX0sZ2V0QWpheDpmdW5jdGlvbihiKXtJJiZhKGRvY3VtZW50LmJvZHkpLmFkZENsYXNzKEkpLG4udXBkYXRlU3RhdHVzKFwibG9hZGluZ1wiKTt2YXIgYz1hLmV4dGVuZCh7dXJsOmIuc3JjLHN1Y2Nlc3M6ZnVuY3Rpb24oYyxkLGUpe3ZhciBmPXtkYXRhOmMseGhyOmV9O3koXCJQYXJzZUFqYXhcIixmKSxuLmFwcGVuZENvbnRlbnQoYShmLmRhdGEpLEgpLGIuZmluaXNoZWQ9ITAsSigpLG4uX3NldEZvY3VzKCksc2V0VGltZW91dChmdW5jdGlvbigpe24ud3JhcC5hZGRDbGFzcyhrKX0sMTYpLG4udXBkYXRlU3RhdHVzKFwicmVhZHlcIikseShcIkFqYXhDb250ZW50QWRkZWRcIil9LGVycm9yOmZ1bmN0aW9uKCl7SigpLGIuZmluaXNoZWQ9Yi5sb2FkRXJyb3I9ITAsbi51cGRhdGVTdGF0dXMoXCJlcnJvclwiLG4uc3QuYWpheC50RXJyb3IucmVwbGFjZShcIiV1cmwlXCIsYi5zcmMpKX19LG4uc3QuYWpheC5zZXR0aW5ncyk7cmV0dXJuIG4ucmVxPWEuYWpheChjKSxcIlwifX19KTt2YXIgTCxNPWZ1bmN0aW9uKGIpe2lmKGIuZGF0YSYmYi5kYXRhLnRpdGxlIT09dW5kZWZpbmVkKXJldHVybiBiLmRhdGEudGl0bGU7dmFyIGM9bi5zdC5pbWFnZS50aXRsZVNyYztpZihjKXtpZihhLmlzRnVuY3Rpb24oYykpcmV0dXJuIGMuY2FsbChuLGIpO2lmKGIuZWwpcmV0dXJuIGIuZWwuYXR0cihjKXx8XCJcIn1yZXR1cm5cIlwifTthLm1hZ25pZmljUG9wdXAucmVnaXN0ZXJNb2R1bGUoXCJpbWFnZVwiLHtvcHRpb25zOnttYXJrdXA6JzxkaXYgY2xhc3M9XCJtZnAtZmlndXJlXCI+PGRpdiBjbGFzcz1cIm1mcC1jbG9zZVwiPjwvZGl2PjxmaWd1cmU+PGRpdiBjbGFzcz1cIm1mcC1pbWdcIj48L2Rpdj48ZmlnY2FwdGlvbj48ZGl2IGNsYXNzPVwibWZwLWJvdHRvbS1iYXJcIj48ZGl2IGNsYXNzPVwibWZwLXRpdGxlXCI+PC9kaXY+PGRpdiBjbGFzcz1cIm1mcC1jb3VudGVyXCI+PC9kaXY+PC9kaXY+PC9maWdjYXB0aW9uPjwvZmlndXJlPjwvZGl2PicsY3Vyc29yOlwibWZwLXpvb20tb3V0LWN1clwiLHRpdGxlU3JjOlwidGl0bGVcIix2ZXJ0aWNhbEZpdDohMCx0RXJyb3I6JzxhIGhyZWY9XCIldXJsJVwiPlRoZSBpbWFnZTwvYT4gY291bGQgbm90IGJlIGxvYWRlZC4nfSxwcm90bzp7aW5pdEltYWdlOmZ1bmN0aW9uKCl7dmFyIGM9bi5zdC5pbWFnZSxkPVwiLmltYWdlXCI7bi50eXBlcy5wdXNoKFwiaW1hZ2VcIiksdyhnK2QsZnVuY3Rpb24oKXtuLmN1cnJJdGVtLnR5cGU9PT1cImltYWdlXCImJmMuY3Vyc29yJiZhKGRvY3VtZW50LmJvZHkpLmFkZENsYXNzKGMuY3Vyc29yKX0pLHcoYitkLGZ1bmN0aW9uKCl7Yy5jdXJzb3ImJmEoZG9jdW1lbnQuYm9keSkucmVtb3ZlQ2xhc3MoYy5jdXJzb3IpLHIub2ZmKFwicmVzaXplXCIrail9KSx3KFwiUmVzaXplXCIrZCxuLnJlc2l6ZUltYWdlKSxuLmlzTG93SUUmJncoXCJBZnRlckNoYW5nZVwiLG4ucmVzaXplSW1hZ2UpfSxyZXNpemVJbWFnZTpmdW5jdGlvbigpe3ZhciBhPW4uY3Vyckl0ZW07aWYoIWF8fCFhLmltZylyZXR1cm47aWYobi5zdC5pbWFnZS52ZXJ0aWNhbEZpdCl7dmFyIGI9MDtuLmlzTG93SUUmJihiPXBhcnNlSW50KGEuaW1nLmNzcyhcInBhZGRpbmctdG9wXCIpLDEwKStwYXJzZUludChhLmltZy5jc3MoXCJwYWRkaW5nLWJvdHRvbVwiKSwxMCkpLGEuaW1nLmNzcyhcIm1heC1oZWlnaHRcIixuLndILWIpfX0sX29uSW1hZ2VIYXNTaXplOmZ1bmN0aW9uKGEpe2EuaW1nJiYoYS5oYXNTaXplPSEwLEwmJmNsZWFySW50ZXJ2YWwoTCksYS5pc0NoZWNraW5nSW1nU2l6ZT0hMSx5KFwiSW1hZ2VIYXNTaXplXCIsYSksYS5pbWdIaWRkZW4mJihuLmNvbnRlbnQmJm4uY29udGVudC5yZW1vdmVDbGFzcyhcIm1mcC1sb2FkaW5nXCIpLGEuaW1nSGlkZGVuPSExKSl9LGZpbmRJbWFnZVNpemU6ZnVuY3Rpb24oYSl7dmFyIGI9MCxjPWEuaW1nWzBdLGQ9ZnVuY3Rpb24oZSl7TCYmY2xlYXJJbnRlcnZhbChMKSxMPXNldEludGVydmFsKGZ1bmN0aW9uKCl7aWYoYy5uYXR1cmFsV2lkdGg+MCl7bi5fb25JbWFnZUhhc1NpemUoYSk7cmV0dXJufWI+MjAwJiZjbGVhckludGVydmFsKEwpLGIrKyxiPT09Mz9kKDEwKTpiPT09NDA/ZCg1MCk6Yj09PTEwMCYmZCg1MDApfSxlKX07ZCgxKX0sZ2V0SW1hZ2U6ZnVuY3Rpb24oYixjKXt2YXIgZD0wLGU9ZnVuY3Rpb24oKXtiJiYoYi5pbWdbMF0uY29tcGxldGU/KGIuaW1nLm9mZihcIi5tZnBsb2FkZXJcIiksYj09PW4uY3Vyckl0ZW0mJihuLl9vbkltYWdlSGFzU2l6ZShiKSxuLnVwZGF0ZVN0YXR1cyhcInJlYWR5XCIpKSxiLmhhc1NpemU9ITAsYi5sb2FkZWQ9ITAseShcIkltYWdlTG9hZENvbXBsZXRlXCIpKTooZCsrLGQ8MjAwP3NldFRpbWVvdXQoZSwxMDApOmYoKSkpfSxmPWZ1bmN0aW9uKCl7YiYmKGIuaW1nLm9mZihcIi5tZnBsb2FkZXJcIiksYj09PW4uY3Vyckl0ZW0mJihuLl9vbkltYWdlSGFzU2l6ZShiKSxuLnVwZGF0ZVN0YXR1cyhcImVycm9yXCIsZy50RXJyb3IucmVwbGFjZShcIiV1cmwlXCIsYi5zcmMpKSksYi5oYXNTaXplPSEwLGIubG9hZGVkPSEwLGIubG9hZEVycm9yPSEwKX0sZz1uLnN0LmltYWdlLGg9Yy5maW5kKFwiLm1mcC1pbWdcIik7aWYoaC5sZW5ndGgpe3ZhciBpPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7aS5jbGFzc05hbWU9XCJtZnAtaW1nXCIsYi5lbCYmYi5lbC5maW5kKFwiaW1nXCIpLmxlbmd0aCYmKGkuYWx0PWIuZWwuZmluZChcImltZ1wiKS5hdHRyKFwiYWx0XCIpKSxiLmltZz1hKGkpLm9uKFwibG9hZC5tZnBsb2FkZXJcIixlKS5vbihcImVycm9yLm1mcGxvYWRlclwiLGYpLGkuc3JjPWIuc3JjLGguaXMoXCJpbWdcIikmJihiLmltZz1iLmltZy5jbG9uZSgpKSxpPWIuaW1nWzBdLGkubmF0dXJhbFdpZHRoPjA/Yi5oYXNTaXplPSEwOmkud2lkdGh8fChiLmhhc1NpemU9ITEpfXJldHVybiBuLl9wYXJzZU1hcmt1cChjLHt0aXRsZTpNKGIpLGltZ19yZXBsYWNlV2l0aDpiLmltZ30sYiksbi5yZXNpemVJbWFnZSgpLGIuaGFzU2l6ZT8oTCYmY2xlYXJJbnRlcnZhbChMKSxiLmxvYWRFcnJvcj8oYy5hZGRDbGFzcyhcIm1mcC1sb2FkaW5nXCIpLG4udXBkYXRlU3RhdHVzKFwiZXJyb3JcIixnLnRFcnJvci5yZXBsYWNlKFwiJXVybCVcIixiLnNyYykpKTooYy5yZW1vdmVDbGFzcyhcIm1mcC1sb2FkaW5nXCIpLG4udXBkYXRlU3RhdHVzKFwicmVhZHlcIikpLGMpOihuLnVwZGF0ZVN0YXR1cyhcImxvYWRpbmdcIiksYi5sb2FkaW5nPSEwLGIuaGFzU2l6ZXx8KGIuaW1nSGlkZGVuPSEwLGMuYWRkQ2xhc3MoXCJtZnAtbG9hZGluZ1wiKSxuLmZpbmRJbWFnZVNpemUoYikpLGMpfX19KTt2YXIgTixPPWZ1bmN0aW9uKCl7cmV0dXJuIE49PT11bmRlZmluZWQmJihOPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpLnN0eWxlLk1velRyYW5zZm9ybSE9PXVuZGVmaW5lZCksTn07YS5tYWduaWZpY1BvcHVwLnJlZ2lzdGVyTW9kdWxlKFwiem9vbVwiLHtvcHRpb25zOntlbmFibGVkOiExLGVhc2luZzpcImVhc2UtaW4tb3V0XCIsZHVyYXRpb246MzAwLG9wZW5lcjpmdW5jdGlvbihhKXtyZXR1cm4gYS5pcyhcImltZ1wiKT9hOmEuZmluZChcImltZ1wiKX19LHByb3RvOntpbml0Wm9vbTpmdW5jdGlvbigpe3ZhciBhPW4uc3Quem9vbSxkPVwiLnpvb21cIixlO2lmKCFhLmVuYWJsZWR8fCFuLnN1cHBvcnRzVHJhbnNpdGlvbilyZXR1cm47dmFyIGY9YS5kdXJhdGlvbixnPWZ1bmN0aW9uKGIpe3ZhciBjPWIuY2xvbmUoKS5yZW1vdmVBdHRyKFwic3R5bGVcIikucmVtb3ZlQXR0cihcImNsYXNzXCIpLmFkZENsYXNzKFwibWZwLWFuaW1hdGVkLWltYWdlXCIpLGQ9XCJhbGwgXCIrYS5kdXJhdGlvbi8xZTMrXCJzIFwiK2EuZWFzaW5nLGU9e3Bvc2l0aW9uOlwiZml4ZWRcIix6SW5kZXg6OTk5OSxsZWZ0OjAsdG9wOjAsXCItd2Via2l0LWJhY2tmYWNlLXZpc2liaWxpdHlcIjpcImhpZGRlblwifSxmPVwidHJhbnNpdGlvblwiO3JldHVybiBlW1wiLXdlYmtpdC1cIitmXT1lW1wiLW1vei1cIitmXT1lW1wiLW8tXCIrZl09ZVtmXT1kLGMuY3NzKGUpLGN9LGg9ZnVuY3Rpb24oKXtuLmNvbnRlbnQuY3NzKFwidmlzaWJpbGl0eVwiLFwidmlzaWJsZVwiKX0saSxqO3coXCJCdWlsZENvbnRyb2xzXCIrZCxmdW5jdGlvbigpe2lmKG4uX2FsbG93Wm9vbSgpKXtjbGVhclRpbWVvdXQoaSksbi5jb250ZW50LmNzcyhcInZpc2liaWxpdHlcIixcImhpZGRlblwiKSxlPW4uX2dldEl0ZW1Ub1pvb20oKTtpZighZSl7aCgpO3JldHVybn1qPWcoZSksai5jc3Mobi5fZ2V0T2Zmc2V0KCkpLG4ud3JhcC5hcHBlbmQoaiksaT1zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7ai5jc3Mobi5fZ2V0T2Zmc2V0KCEwKSksaT1zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7aCgpLHNldFRpbWVvdXQoZnVuY3Rpb24oKXtqLnJlbW92ZSgpLGU9aj1udWxsLHkoXCJab29tQW5pbWF0aW9uRW5kZWRcIil9LDE2KX0sZil9LDE2KX19KSx3KGMrZCxmdW5jdGlvbigpe2lmKG4uX2FsbG93Wm9vbSgpKXtjbGVhclRpbWVvdXQoaSksbi5zdC5yZW1vdmFsRGVsYXk9ZjtpZighZSl7ZT1uLl9nZXRJdGVtVG9ab29tKCk7aWYoIWUpcmV0dXJuO2o9ZyhlKX1qLmNzcyhuLl9nZXRPZmZzZXQoITApKSxuLndyYXAuYXBwZW5kKGopLG4uY29udGVudC5jc3MoXCJ2aXNpYmlsaXR5XCIsXCJoaWRkZW5cIiksc2V0VGltZW91dChmdW5jdGlvbigpe2ouY3NzKG4uX2dldE9mZnNldCgpKX0sMTYpfX0pLHcoYitkLGZ1bmN0aW9uKCl7bi5fYWxsb3dab29tKCkmJihoKCksaiYmai5yZW1vdmUoKSxlPW51bGwpfSl9LF9hbGxvd1pvb206ZnVuY3Rpb24oKXtyZXR1cm4gbi5jdXJySXRlbS50eXBlPT09XCJpbWFnZVwifSxfZ2V0SXRlbVRvWm9vbTpmdW5jdGlvbigpe3JldHVybiBuLmN1cnJJdGVtLmhhc1NpemU/bi5jdXJySXRlbS5pbWc6ITF9LF9nZXRPZmZzZXQ6ZnVuY3Rpb24oYil7dmFyIGM7Yj9jPW4uY3Vyckl0ZW0uaW1nOmM9bi5zdC56b29tLm9wZW5lcihuLmN1cnJJdGVtLmVsfHxuLmN1cnJJdGVtKTt2YXIgZD1jLm9mZnNldCgpLGU9cGFyc2VJbnQoYy5jc3MoXCJwYWRkaW5nLXRvcFwiKSwxMCksZj1wYXJzZUludChjLmNzcyhcInBhZGRpbmctYm90dG9tXCIpLDEwKTtkLnRvcC09YSh3aW5kb3cpLnNjcm9sbFRvcCgpLWU7dmFyIGc9e3dpZHRoOmMud2lkdGgoKSxoZWlnaHQ6KHA/Yy5pbm5lckhlaWdodCgpOmNbMF0ub2Zmc2V0SGVpZ2h0KS1mLWV9O3JldHVybiBPKCk/Z1tcIi1tb3otdHJhbnNmb3JtXCJdPWcudHJhbnNmb3JtPVwidHJhbnNsYXRlKFwiK2QubGVmdCtcInB4LFwiK2QudG9wK1wicHgpXCI6KGcubGVmdD1kLmxlZnQsZy50b3A9ZC50b3ApLGd9fX0pO3ZhciBQPVwiaWZyYW1lXCIsUT1cIi8vYWJvdXQ6YmxhbmtcIixSPWZ1bmN0aW9uKGEpe2lmKG4uY3VyclRlbXBsYXRlW1BdKXt2YXIgYj1uLmN1cnJUZW1wbGF0ZVtQXS5maW5kKFwiaWZyYW1lXCIpO2IubGVuZ3RoJiYoYXx8KGJbMF0uc3JjPVEpLG4uaXNJRTgmJmIuY3NzKFwiZGlzcGxheVwiLGE/XCJibG9ja1wiOlwibm9uZVwiKSl9fTthLm1hZ25pZmljUG9wdXAucmVnaXN0ZXJNb2R1bGUoUCx7b3B0aW9uczp7bWFya3VwOic8ZGl2IGNsYXNzPVwibWZwLWlmcmFtZS1zY2FsZXJcIj48ZGl2IGNsYXNzPVwibWZwLWNsb3NlXCI+PC9kaXY+PGlmcmFtZSBjbGFzcz1cIm1mcC1pZnJhbWVcIiBzcmM9XCIvL2Fib3V0OmJsYW5rXCIgZnJhbWVib3JkZXI9XCIwXCIgYWxsb3dmdWxsc2NyZWVuPjwvaWZyYW1lPjwvZGl2Picsc3JjQWN0aW9uOlwiaWZyYW1lX3NyY1wiLHBhdHRlcm5zOnt5b3V0dWJlOntpbmRleDpcInlvdXR1YmUuY29tXCIsaWQ6XCJ2PVwiLHNyYzpcIi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkLyVpZCU/YXV0b3BsYXk9MVwifSx2aW1lbzp7aW5kZXg6XCJ2aW1lby5jb20vXCIsaWQ6XCIvXCIsc3JjOlwiLy9wbGF5ZXIudmltZW8uY29tL3ZpZGVvLyVpZCU/YXV0b3BsYXk9MVwifSxnbWFwczp7aW5kZXg6XCIvL21hcHMuZ29vZ2xlLlwiLHNyYzpcIiVpZCUmb3V0cHV0PWVtYmVkXCJ9fX0scHJvdG86e2luaXRJZnJhbWU6ZnVuY3Rpb24oKXtuLnR5cGVzLnB1c2goUCksdyhcIkJlZm9yZUNoYW5nZVwiLGZ1bmN0aW9uKGEsYixjKXtiIT09YyYmKGI9PT1QP1IoKTpjPT09UCYmUighMCkpfSksdyhiK1wiLlwiK1AsZnVuY3Rpb24oKXtSKCl9KX0sZ2V0SWZyYW1lOmZ1bmN0aW9uKGIsYyl7dmFyIGQ9Yi5zcmMsZT1uLnN0LmlmcmFtZTthLmVhY2goZS5wYXR0ZXJucyxmdW5jdGlvbigpe2lmKGQuaW5kZXhPZih0aGlzLmluZGV4KT4tMSlyZXR1cm4gdGhpcy5pZCYmKHR5cGVvZiB0aGlzLmlkPT1cInN0cmluZ1wiP2Q9ZC5zdWJzdHIoZC5sYXN0SW5kZXhPZih0aGlzLmlkKSt0aGlzLmlkLmxlbmd0aCxkLmxlbmd0aCk6ZD10aGlzLmlkLmNhbGwodGhpcyxkKSksZD10aGlzLnNyYy5yZXBsYWNlKFwiJWlkJVwiLGQpLCExfSk7dmFyIGY9e307cmV0dXJuIGUuc3JjQWN0aW9uJiYoZltlLnNyY0FjdGlvbl09ZCksbi5fcGFyc2VNYXJrdXAoYyxmLGIpLG4udXBkYXRlU3RhdHVzKFwicmVhZHlcIiksY319fSk7dmFyIFM9ZnVuY3Rpb24oYSl7dmFyIGI9bi5pdGVtcy5sZW5ndGg7cmV0dXJuIGE+Yi0xP2EtYjphPDA/YithOmF9LFQ9ZnVuY3Rpb24oYSxiLGMpe3JldHVybiBhLnJlcGxhY2UoLyVjdXJyJS9naSxiKzEpLnJlcGxhY2UoLyV0b3RhbCUvZ2ksYyl9O2EubWFnbmlmaWNQb3B1cC5yZWdpc3Rlck1vZHVsZShcImdhbGxlcnlcIix7b3B0aW9uczp7ZW5hYmxlZDohMSxhcnJvd01hcmt1cDonPGJ1dHRvbiB0aXRsZT1cIiV0aXRsZSVcIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJtZnAtYXJyb3cgbWZwLWFycm93LSVkaXIlXCI+PC9idXR0b24+JyxwcmVsb2FkOlswLDJdLG5hdmlnYXRlQnlJbWdDbGljazohMCxhcnJvd3M6ITAsdFByZXY6XCJQcmV2aW91cyAoTGVmdCBhcnJvdyBrZXkpXCIsdE5leHQ6XCJOZXh0IChSaWdodCBhcnJvdyBrZXkpXCIsdENvdW50ZXI6XCIlY3VyciUgb2YgJXRvdGFsJVwifSxwcm90bzp7aW5pdEdhbGxlcnk6ZnVuY3Rpb24oKXt2YXIgYz1uLnN0LmdhbGxlcnksZD1cIi5tZnAtZ2FsbGVyeVwiO24uZGlyZWN0aW9uPSEwO2lmKCFjfHwhYy5lbmFibGVkKXJldHVybiExO3UrPVwiIG1mcC1nYWxsZXJ5XCIsdyhnK2QsZnVuY3Rpb24oKXtjLm5hdmlnYXRlQnlJbWdDbGljayYmbi53cmFwLm9uKFwiY2xpY2tcIitkLFwiLm1mcC1pbWdcIixmdW5jdGlvbigpe2lmKG4uaXRlbXMubGVuZ3RoPjEpcmV0dXJuIG4ubmV4dCgpLCExfSkscy5vbihcImtleWRvd25cIitkLGZ1bmN0aW9uKGEpe2Eua2V5Q29kZT09PTM3P24ucHJldigpOmEua2V5Q29kZT09PTM5JiZuLm5leHQoKX0pfSksdyhcIlVwZGF0ZVN0YXR1c1wiK2QsZnVuY3Rpb24oYSxiKXtiLnRleHQmJihiLnRleHQ9VChiLnRleHQsbi5jdXJySXRlbS5pbmRleCxuLml0ZW1zLmxlbmd0aCkpfSksdyhmK2QsZnVuY3Rpb24oYSxiLGQsZSl7dmFyIGY9bi5pdGVtcy5sZW5ndGg7ZC5jb3VudGVyPWY+MT9UKGMudENvdW50ZXIsZS5pbmRleCxmKTpcIlwifSksdyhcIkJ1aWxkQ29udHJvbHNcIitkLGZ1bmN0aW9uKCl7aWYobi5pdGVtcy5sZW5ndGg+MSYmYy5hcnJvd3MmJiFuLmFycm93TGVmdCl7dmFyIGI9Yy5hcnJvd01hcmt1cCxkPW4uYXJyb3dMZWZ0PWEoYi5yZXBsYWNlKC8ldGl0bGUlL2dpLGMudFByZXYpLnJlcGxhY2UoLyVkaXIlL2dpLFwibGVmdFwiKSkuYWRkQ2xhc3MobSksZT1uLmFycm93UmlnaHQ9YShiLnJlcGxhY2UoLyV0aXRsZSUvZ2ksYy50TmV4dCkucmVwbGFjZSgvJWRpciUvZ2ksXCJyaWdodFwiKSkuYWRkQ2xhc3MobSk7ZC5jbGljayhmdW5jdGlvbigpe24ucHJldigpfSksZS5jbGljayhmdW5jdGlvbigpe24ubmV4dCgpfSksbi5jb250YWluZXIuYXBwZW5kKGQuYWRkKGUpKX19KSx3KGgrZCxmdW5jdGlvbigpe24uX3ByZWxvYWRUaW1lb3V0JiZjbGVhclRpbWVvdXQobi5fcHJlbG9hZFRpbWVvdXQpLG4uX3ByZWxvYWRUaW1lb3V0PXNldFRpbWVvdXQoZnVuY3Rpb24oKXtuLnByZWxvYWROZWFyYnlJbWFnZXMoKSxuLl9wcmVsb2FkVGltZW91dD1udWxsfSwxNil9KSx3KGIrZCxmdW5jdGlvbigpe3Mub2ZmKGQpLG4ud3JhcC5vZmYoXCJjbGlja1wiK2QpLG4uYXJyb3dSaWdodD1uLmFycm93TGVmdD1udWxsfSl9LG5leHQ6ZnVuY3Rpb24oKXtuLmRpcmVjdGlvbj0hMCxuLmluZGV4PVMobi5pbmRleCsxKSxuLnVwZGF0ZUl0ZW1IVE1MKCl9LHByZXY6ZnVuY3Rpb24oKXtuLmRpcmVjdGlvbj0hMSxuLmluZGV4PVMobi5pbmRleC0xKSxuLnVwZGF0ZUl0ZW1IVE1MKCl9LGdvVG86ZnVuY3Rpb24oYSl7bi5kaXJlY3Rpb249YT49bi5pbmRleCxuLmluZGV4PWEsbi51cGRhdGVJdGVtSFRNTCgpfSxwcmVsb2FkTmVhcmJ5SW1hZ2VzOmZ1bmN0aW9uKCl7dmFyIGE9bi5zdC5nYWxsZXJ5LnByZWxvYWQsYj1NYXRoLm1pbihhWzBdLG4uaXRlbXMubGVuZ3RoKSxjPU1hdGgubWluKGFbMV0sbi5pdGVtcy5sZW5ndGgpLGQ7Zm9yKGQ9MTtkPD0obi5kaXJlY3Rpb24/YzpiKTtkKyspbi5fcHJlbG9hZEl0ZW0obi5pbmRleCtkKTtmb3IoZD0xO2Q8PShuLmRpcmVjdGlvbj9iOmMpO2QrKyluLl9wcmVsb2FkSXRlbShuLmluZGV4LWQpfSxfcHJlbG9hZEl0ZW06ZnVuY3Rpb24oYil7Yj1TKGIpO2lmKG4uaXRlbXNbYl0ucHJlbG9hZGVkKXJldHVybjt2YXIgYz1uLml0ZW1zW2JdO2MucGFyc2VkfHwoYz1uLnBhcnNlRWwoYikpLHkoXCJMYXp5TG9hZFwiLGMpLGMudHlwZT09PVwiaW1hZ2VcIiYmKGMuaW1nPWEoJzxpbWcgY2xhc3M9XCJtZnAtaW1nXCIgLz4nKS5vbihcImxvYWQubWZwbG9hZGVyXCIsZnVuY3Rpb24oKXtjLmhhc1NpemU9ITB9KS5vbihcImVycm9yLm1mcGxvYWRlclwiLGZ1bmN0aW9uKCl7Yy5oYXNTaXplPSEwLGMubG9hZEVycm9yPSEwLHkoXCJMYXp5TG9hZEVycm9yXCIsYyl9KS5hdHRyKFwic3JjXCIsYy5zcmMpKSxjLnByZWxvYWRlZD0hMH19fSk7dmFyIFU9XCJyZXRpbmFcIjthLm1hZ25pZmljUG9wdXAucmVnaXN0ZXJNb2R1bGUoVSx7b3B0aW9uczp7cmVwbGFjZVNyYzpmdW5jdGlvbihhKXtyZXR1cm4gYS5zcmMucmVwbGFjZSgvXFwuXFx3KyQvLGZ1bmN0aW9uKGEpe3JldHVyblwiQDJ4XCIrYX0pfSxyYXRpbzoxfSxwcm90bzp7aW5pdFJldGluYTpmdW5jdGlvbigpe2lmKHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvPjEpe3ZhciBhPW4uc3QucmV0aW5hLGI9YS5yYXRpbztiPWlzTmFOKGIpP2IoKTpiLGI+MSYmKHcoXCJJbWFnZUhhc1NpemUuXCIrVSxmdW5jdGlvbihhLGMpe2MuaW1nLmNzcyh7XCJtYXgtd2lkdGhcIjpjLmltZ1swXS5uYXR1cmFsV2lkdGgvYix3aWR0aDpcIjEwMCVcIn0pfSksdyhcIkVsZW1lbnRQYXJzZS5cIitVLGZ1bmN0aW9uKGMsZCl7ZC5zcmM9YS5yZXBsYWNlU3JjKGQsYil9KSl9fX19KSxBKCl9KSIsIi8qKlxuICogRmlsZSBqcy1lbmFibGVkLmpzXG4gKlxuICogSWYgSmF2YXNjcmlwdCBpcyBlbmFibGVkLCByZXBsYWNlIHRoZSA8Ym9keT4gY2xhc3MgXCJuby1qc1wiLlxuICovXG5kb2N1bWVudC5ib2R5LmNsYXNzTmFtZSA9IGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lLnJlcGxhY2UoICduby1qcycsICdqcycgKTsiLCIvKipcbiAqIEZpbGUgbW9kYWwuanNcbiAqXG4gKiBEZWFsIHdpdGggbXVsdGlwbGUgbW9kYWxzIGFuZCB0aGVpciBtZWRpYS5cbiAqL1xud2luZG93LldEU19Nb2RhbCA9IHt9O1xuXG4oIGZ1bmN0aW9uICggd2luZG93LCAkLCBhcHAgKSB7XG5cblx0Ly8gQ29uc3RydWN0b3IuXG5cdGFwcC5pbml0ID0gZnVuY3Rpb24oKSB7XG5cdFx0YXBwLmNhY2hlKCk7XG5cblx0XHRpZiAoIGFwcC5tZWV0c1JlcXVpcmVtZW50cygpICkge1xuXHRcdFx0YXBwLmJpbmRFdmVudHMoKTtcblx0XHR9XG5cdH07XG5cblx0Ly8gQ2FjaGUgYWxsIHRoZSB0aGluZ3MuXG5cdGFwcC5jYWNoZSA9IGZ1bmN0aW9uKCkge1xuXHRcdGFwcC4kYyA9IHtcblx0XHRcdGJvZHk6ICQoICdib2R5JyApLFxuXHRcdH07XG5cdH07XG5cblx0Ly8gRG8gd2UgbWVldCB0aGUgcmVxdWlyZW1lbnRzP1xuXHRhcHAubWVldHNSZXF1aXJlbWVudHMgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJCggJy5tb2RhbC10cmlnZ2VyJyApLmxlbmd0aDtcblx0fTtcblxuXHQvLyBDb21iaW5lIGFsbCBldmVudHMuXG5cdGFwcC5iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG5cblx0XHQvLyBUcmlnZXIgYSBtb2RhbCB0byBvcGVuXG5cdFx0YXBwLiRjLmJvZHkub24oICdjbGljaycsICcubW9kYWwtdHJpZ2dlcicsIGFwcC5vcGVuTW9kYWwgKTtcblxuXHRcdC8vIFRyaWdnZXIgdGhlIGNsb3NlIGJ1dHRvbiB0byBjbG9zZSB0aGUgbW9kYWxcblx0XHRhcHAuJGMuYm9keS5vbiggJ2NsaWNrJywgJy5jbG9zZScsIGFwcC5jbG9zZU1vZGFsICk7XG5cblx0XHQvLyBBbGxvdyB0aGUgdXNlciB0byBjbG9zZSB0aGUgbW9kYWwgYnkgaGl0dGluZyB0aGUgZXNjIGtleVxuXHRcdGFwcC4kYy5ib2R5Lm9uKCAna2V5ZG93bicsIGFwcC5lc2NLZXlDbG9zZSApO1xuXG5cdFx0Ly8gQWxsb3cgdGhlIHVzZXIgdG8gY2xvc2UgdGhlIG1vZGFsIGJ5IGNsaWNraW5nIG91dHNpZGUgb2YgdGhlIG1vZGFsXG5cdFx0YXBwLiRjLmJvZHkub24oICdjbGljaycsICdkaXYubW9kYWwtb3BlbicsIGFwcC5jbG9zZU1vZGFsQnlDbGljayApO1xuXHR9O1xuXG5cdC8vIE9wZW4gdGhlIG1vZGFsLlxuXHRhcHAub3Blbk1vZGFsID0gZnVuY3Rpb24oKSB7XG5cblx0XHQvLyBGaWd1cmUgb3V0IHdoaWNoIG1vZGFsIHdlJ3JlIG9wZW5pbmcgYW5kIHN0b3JlIHRoZSBvYmplY3QuXG5cdFx0dmFyICRtb2RhbCA9ICQoICQoIHRoaXMgKS5kYXRhKCAndGFyZ2V0JyApICk7XG5cblx0XHQvLyBEaXNwbGF5IHRoZSBtb2RhbC5cblx0XHQkbW9kYWwuYWRkQ2xhc3MoICdtb2RhbC1vcGVuJyApO1xuXG5cdFx0Ly8gQWRkIGJvZHkgY2xhc3MuXG5cdFx0YXBwLiRjLmJvZHkuYWRkQ2xhc3MoICdtb2RhbC1vcGVuJyApO1xuXHR9O1xuXG5cdC8vIENsb3NlIHRoZSBtb2RhbC5cblx0YXBwLmNsb3NlTW9kYWwgPSBmdW5jdGlvbigpIHtcblxuXHRcdC8vIEZpZ3VyZSB0aGUgb3BlbmVkIG1vZGFsIHdlJ3JlIGNsb3NpbmcgYW5kIHN0b3JlIHRoZSBvYmplY3QuXG5cdFx0dmFyICRtb2RhbCA9ICQoICQoICdkaXYubW9kYWwtb3BlbiAuY2xvc2UnICkuZGF0YSggJ3RhcmdldCcgKSApO1xuXG5cdFx0Ly8gRmluZCB0aGUgaWZyYW1lIGluIHRoZSAkbW9kYWwgb2JqZWN0LlxuXHRcdHZhciAkaWZyYW1lID0gJG1vZGFsLmZpbmQoICdpZnJhbWUnICk7XG5cblx0XHQvLyBHZXQgdGhlIGlmcmFtZSBzcmMgVVJMLlxuXHRcdHZhciB1cmwgPSAkaWZyYW1lLmF0dHIoICdzcmMnICk7XG5cblx0XHQvLyBSZW1vdmUgdGhlIHNvdXJjZSBVUkwsIHRoZW4gYWRkIGl0IGJhY2ssIHNvIHRoZSB2aWRlbyBjYW4gYmUgcGxheWVkIGFnYWluIGxhdGVyLlxuXHRcdCRpZnJhbWUuYXR0ciggJ3NyYycsICcnICkuYXR0ciggJ3NyYycsIHVybCApO1xuXG5cdFx0Ly8gRmluYWxseSwgaGlkZSB0aGUgbW9kYWwuXG5cdFx0JG1vZGFsLnJlbW92ZUNsYXNzKCAnbW9kYWwtb3BlbicgKTtcblxuXHRcdC8vIFJlbW92ZSB0aGUgYm9keSBjbGFzcy5cblx0XHRhcHAuJGMuYm9keS5yZW1vdmVDbGFzcyggJ21vZGFsLW9wZW4nICk7XG5cdH07XG5cblx0Ly8gQ2xvc2UgaWYgXCJlc2NcIiBrZXkgaXMgcHJlc3NlZC5cblx0YXBwLmVzY0tleUNsb3NlID0gZnVuY3Rpb24oZSkge1xuXHRcdGlmICggMjcgPT0gZS5rZXlDb2RlICkge1xuXHRcdFx0YXBwLmNsb3NlTW9kYWwoKTtcblx0XHR9XG5cdH07XG5cblx0Ly8gQ2xvc2UgaWYgdGhlIHVzZXIgY2xpY2tzIG91dHNpZGUgb2YgdGhlIG1vZGFsXG5cdGFwcC5jbG9zZU1vZGFsQnlDbGljayA9IGZ1bmN0aW9uKGUpIHtcblxuXHRcdC8vIElmIHRoZSBwYXJlbnQgY29udGFpbmVyIGlzIE5PVCB0aGUgbW9kYWwgZGlhbG9nIGNvbnRhaW5lciwgY2xvc2UgdGhlIG1vZGFsXG5cdFx0aWYgKCAhICQoIGUudGFyZ2V0ICkucGFyZW50cyggJ2RpdicgKS5oYXNDbGFzcyggJ21vZGFsLWRpYWxvZycgKSApIHtcblx0XHRcdGFwcC5jbG9zZU1vZGFsKCk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIEVuZ2FnZSFcblx0JCggYXBwLmluaXQgKTtcblxufSApKCB3aW5kb3csIGpRdWVyeSwgd2luZG93LldEU19Nb2RhbCApOyIsIi8qXHJcblx0c2NyaXB0cy5qc1xyXG5cclxuXHRMaWNlbnNlOiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2My4wXHJcblx0TGljZW5zZSBVUkk6IGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9ncGwtMy4wLmh0bWxcclxuXHJcblx0Q29weXJpZ2h0OiAoYykgMjAxMyBBbGV4YW5kZXIgXCJBbHhcIiBBZ25hcnNvbiwgaHR0cDovL2FseG1lZGlhLnNlXHJcbiovXHJcblxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbmpRdWVyeShkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oJCkge1xyXG5cclxuXHJcbiQoJy5sYXp5bG9hZCcpLmxhenlsb2FkKHtcclxuICAvLyBTZXRzIHRoZSBwaXhlbHMgdG8gbG9hZCBlYXJsaWVyLiBTZXR0aW5nIHRocmVzaG9sZCB0byAyMDAgY2F1c2VzIGltYWdlIHRvIGxvYWQgMjAwIHBpeGVsc1xyXG4gIC8vIGJlZm9yZSBpdCBhcHBlYXJzIG9uIHZpZXdwb3J0LiBJdCBzaG91bGQgYmUgZ3JlYXRlciBvciBlcXVhbCB6ZXJvLlxyXG4gIHRocmVzaG9sZDogMCxcclxuXHJcbiAgLy8gU2V0cyB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gd2hlbiB0aGUgbG9hZCBldmVudCBpcyBmaXJpbmcuXHJcbiAgLy8gZWxlbWVudDogVGhlIGNvbnRlbnQgaW4gbGF6eWxvYWQgdGFnIHdpbGwgYmUgcmV0dXJuZWQgYXMgYSBqUXVlcnkgb2JqZWN0LlxyXG4gIGxvYWQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHt9LFxyXG5cclxuICAvLyBTZXRzIGV2ZW50cyB0byB0cmlnZ2VyIGxhenlsb2FkLiBEZWZhdWx0IGlzIGN1c3RvbWl6ZWQgZXZlbnQgYGFwcGVhcmAsIGl0IHdpbGwgdHJpZ2dlciB3aGVuXHJcbiAgLy8gZWxlbWVudCBhcHBlYXIgaW4gc2NyZWVuLiBZb3UgY291bGQgc2V0IG90aGVyIGV2ZW50cyBpbmNsdWRpbmcgZWFjaCBvbmUgc2VwYXJhdGVkIGJ5IGEgc3BhY2UuXHJcbiAgdHJpZ2dlcjogXCJhcHBlYXIgdG91Y2hzdGFydFwiXHJcbn0pO1xyXG5cclxuLy8gJCgnLmxpZ2h0Ym94JykubWFnbmlmaWNQb3B1cCh7dHlwZTonaW1hZ2UnfSk7XHJcbi8vICQoJy53cGItbW9kYWwtaW1hZ2UnKS5tYWduaWZpY1BvcHVwKHt0eXBlOidpbWFnZSd9KTtcclxuXHJcbmpRdWVyeSggJ2FydGljbGUnICkubWFnbmlmaWNQb3B1cCh7XHJcbiAgICAgICAgdHlwZTogJ2ltYWdlJyxcclxuICAgICAgICBkZWxlZ2F0ZTogXCIud3BiLW1vZGFsLWltYWdlXCIsXHJcbiAgICAgICAgZ2FsbGVyeToge1xyXG4gICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICBwcmVsb2FkOiBbMCwyXSxcclxuXHRcdFx0bmF2aWdhdGVCeUltZ0NsaWNrOiB0cnVlLFxyXG5cdFx0XHRhcnJvd01hcmt1cDogJzxzcGFuIGNsYXNzPVwibWZwLWFycm93IG1mcC1hcnJvdy0lZGlyJVwiIHRpdGxlPVwiJXRpdGxlJVwiPjxpIGNsYXNzPVwiZmEgZmEtMnggZmEtYW5nbGUtJWRpciVcIj48L2k+PC9zcGFuPicsXHJcblx0XHRcdHRQcmV2OiAnUHJldmlvdXMnLFxyXG5cdFx0XHR0TmV4dDogJ05leHQnLFxyXG5cdFx0XHR0Q291bnRlcjogJzxzcGFuIGNsYXNzPVwibWZwLWNvdW50ZXJcIj4lY3VyciUgb2YgJXRvdGFsJTwvc3Bhbj4nXHJcbiAgICAgICAgfSxcclxufSk7XHJcblxyXG5qUXVlcnkoICcuZ2FsbGVyeScgKS5tYWduaWZpY1BvcHVwKHtcclxuICAgICAgICB0eXBlOiAnaW1hZ2UnLFxyXG4gICAgICAgIGRlbGVnYXRlOiBcIi5nYWxsZXJ5LWljb24gPiBhXCIsXHJcbiAgICAgICAgZ2FsbGVyeToge1xyXG4gICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICBwcmVsb2FkOiBbMCwyXSxcclxuXHRcdFx0bmF2aWdhdGVCeUltZ0NsaWNrOiB0cnVlLFxyXG5cdFx0XHRhcnJvd01hcmt1cDogJzxzcGFuIGNsYXNzPVwibWZwLWFycm93IG1mcC1hcnJvdy0lZGlyJVwiIHRpdGxlPVwiJXRpdGxlJVwiPjxpIGNsYXNzPVwiZmEgZmEtMnggZmEtYW5nbGUtJWRpciVcIj48L2k+PC9zcGFuPicsXHJcblx0XHRcdHRQcmV2OiAnUHJldmlvdXMnLFxyXG5cdFx0XHR0TmV4dDogJ05leHQnLFxyXG5cdFx0XHR0Q291bnRlcjogJzxzcGFuIGNsYXNzPVwibWZwLWNvdW50ZXJcIj4lY3VyciUgb2YgJXRvdGFsJTwvc3Bhbj4nXHJcbiAgICAgICAgfSxcclxufSk7XHJcblxyXG5cclxuXHJcbi8qICBUb2dnbGUgaGVhZGVyIHNlYXJjaFxyXG4vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cclxuXHQkKCcudG9nZ2xlLXNlYXJjaCcpLmNsaWNrKGZ1bmN0aW9uKCl7XHJcblx0XHQkKCcudG9nZ2xlLXNlYXJjaCcpLnRvZ2dsZUNsYXNzKCdhY3RpdmUnKTtcclxuXHRcdCQoJy5zZWFyY2gtZXhwYW5kJykuZmFkZVRvZ2dsZSgyNTApO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAkKCcuc2VhcmNoLWV4cGFuZCBpbnB1dCcpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgIH0sIDMwMCk7XHJcblx0fSk7XHJcblxyXG4vKiAgU2Nyb2xsIHRvIHRvcFxyXG4vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cclxuXHQkKCdhI2dvdG90b3AnKS5jbGljayhmdW5jdGlvbigpIHtcclxuXHRcdCQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtzY3JvbGxUb3A6MH0sJ3Nsb3cnKTtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9KTtcclxuXHJcbi8qICBDb21tZW50cyAvIHBpbmdiYWNrcyB0YWJzXHJcbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xyXG4gICAgJChcIi50YWJzIC50YWJzLXRpdGxlXCIpLmNsaWNrKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICQoXCIudGFicyAudGFicy10aXRsZVwiKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcImlzLWFjdGl2ZVwiKTtcclxuICAgICAgICAkKFwiLnRhYnMtY29udGVudCAudGFicy1wYW5lbFwiKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJykuaGlkZSgpO1xyXG4gICAgICAgIHZhciBzZWxlY3RlZF90YWIgPSAkKHRoaXMpLmZpbmQoXCJhXCIpLmF0dHIoXCJocmVmXCIpO1xyXG4gICAgICAgICQoc2VsZWN0ZWRfdGFiKS5mYWRlSW4oKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhzZWxlY3RlZF90YWIpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG5cclxuLyogIFRhYmxlIG9kZCByb3cgY2xhc3NcclxuLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcblx0JCgndGFibGUgdHI6b2RkJykuYWRkQ2xhc3MoJ2FsdCcpO1xyXG5cclxuXHJcbi8qICBEcm9wZG93biBtZW51IGFuaW1hdGlvblxyXG4vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cclxuXHQkKCcubmF2IHVsLnN1Yi1tZW51JykuaGlkZSgpO1xyXG5cdCQoJy5uYXYgbGknKS5ob3ZlcihcclxuXHRcdGZ1bmN0aW9uKCkge1xyXG5cdFx0XHQkKHRoaXMpLmNoaWxkcmVuKCd1bC5zdWItbWVudScpLnNsaWRlRG93bignZmFzdCcpO1xyXG5cdFx0fSxcclxuXHRcdGZ1bmN0aW9uKCkge1xyXG5cdFx0XHQkKHRoaXMpLmNoaWxkcmVuKCd1bC5zdWItbWVudScpLmhpZGUoKTtcclxuXHRcdH1cclxuXHQpO1xyXG5cclxuLyogIE1vYmlsZSBtZW51IHNtb290aCB0b2dnbGUgaGVpZ2h0XHJcbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xyXG5cdCQoJy5uYXYtdG9nZ2xlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XHJcblx0XHRzbGlkZSgkKCcubmF2LXdyYXAgLm5hdicsICQodGhpcykucGFyZW50KCkpKTtcclxuXHR9KTtcclxuXHJcblx0ZnVuY3Rpb24gc2xpZGUoY29udGVudCkge1xyXG5cdFx0dmFyIHdyYXBwZXIgPSBjb250ZW50LnBhcmVudCgpO1xyXG5cdFx0dmFyIGNvbnRlbnRIZWlnaHQgPSBjb250ZW50Lm91dGVySGVpZ2h0KHRydWUpO1xyXG5cdFx0dmFyIHdyYXBwZXJIZWlnaHQgPSB3cmFwcGVyLmhlaWdodCgpO1xyXG5cclxuXHRcdHdyYXBwZXIudG9nZ2xlQ2xhc3MoJ2V4cGFuZCcpO1xyXG5cdFx0aWYgKHdyYXBwZXIuaGFzQ2xhc3MoJ2V4cGFuZCcpKSB7XHJcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR3cmFwcGVyLmFkZENsYXNzKCd0cmFuc2l0aW9uJykuY3NzKCdoZWlnaHQnLCBjb250ZW50SGVpZ2h0KTtcclxuXHRcdH0sIDEwKTtcclxuXHR9XHJcblx0ZWxzZSB7XHJcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR3cmFwcGVyLmNzcygnaGVpZ2h0Jywgd3JhcHBlckhlaWdodCk7XHJcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdHdyYXBwZXIuYWRkQ2xhc3MoJ3RyYW5zaXRpb24nKS5jc3MoJ2hlaWdodCcsIDApO1xyXG5cdFx0XHR9LCAxMCk7XHJcblx0XHR9LCAxMCk7XHJcblx0fVxyXG5cclxuXHR3cmFwcGVyLm9uZSgndHJhbnNpdGlvbkVuZCB3ZWJraXRUcmFuc2l0aW9uRW5kIHRyYW5zaXRpb25lbmQgb1RyYW5zaXRpb25FbmQgbXNUcmFuc2l0aW9uRW5kJywgZnVuY3Rpb24oKSB7XHJcblx0XHRpZih3cmFwcGVyLmhhc0NsYXNzKCdvcGVuJykpIHtcclxuXHRcdFx0d3JhcHBlci5yZW1vdmVDbGFzcygndHJhbnNpdGlvbicpLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcclxuXHRcdH1cclxuXHR9KTtcclxuXHR9XHJcblxyXG59KTsiLCIvKipcbiAqIEZpbGUgc2VhcmNoLmpzXG4gKlxuICogRGVhbCB3aXRoIHRoZSBzZWFyY2ggZm9ybS5cbiAqL1xud2luZG93LldEU19TZWFyY2ggPSB7fTtcblxuKCBmdW5jdGlvbiAoIHdpbmRvdywgJCwgYXBwICkge1xuXG5cdC8vIENvbnN0cnVjdG9yLlxuXHRhcHAuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGFwcC5jYWNoZSgpO1xuXG5cdFx0aWYgKCBhcHAubWVldHNSZXF1aXJlbWVudHMoKSApIHtcblx0XHRcdGFwcC5iaW5kRXZlbnRzKCk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vIENhY2hlIGFsbCB0aGUgdGhpbmdzLlxuXHRhcHAuY2FjaGUgPSBmdW5jdGlvbigpIHtcblx0XHRhcHAuJGMgPSB7XG5cdFx0XHRib2R5OiAkKCAnYm9keScgKSxcblx0XHR9O1xuXHR9O1xuXG5cdC8vIERvIHdlIG1lZXQgdGhlIHJlcXVpcmVtZW50cz9cblx0YXBwLm1lZXRzUmVxdWlyZW1lbnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICQoICcuc2VhcmNoLWZpZWxkJyApLmxlbmd0aDtcblx0fTtcblxuXHQvLyBDb21iaW5lIGFsbCBldmVudHMuXG5cdGFwcC5iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG5cblx0XHQvLyBSZW1vdmUgcGxhY2Vob2xkZXIgdGV4dCBmcm9tIHNlYXJjaCBmaWVsZCBvbiBmb2N1cy5cblx0XHRhcHAuJGMuYm9keS5vbiggJ2ZvY3VzJywgJy5zZWFyY2gtZmllbGQnLCBhcHAucmVtb3ZlUGxhY2Vob2xkZXJUZXh0ICk7XG5cblx0XHQvLyBBZGQgcGxhY2Vob2xkZXIgdGV4dCBiYWNrIHRvIHNlYXJjaCBmaWVsZCBvbiBibHVyLlxuXHRcdGFwcC4kYy5ib2R5Lm9uKCAnYmx1cicsICcuc2VhcmNoLWZpZWxkJywgYXBwLmFkZFBsYWNlaG9sZGVyVGV4dCApO1xuXHR9O1xuXG5cdC8vIFJlbW92ZSBwbGFjZWhvbGRlciB0ZXh0IGZyb20gc2VhcmNoIGZpZWxkLlxuXHRhcHAucmVtb3ZlUGxhY2Vob2xkZXJUZXh0ID0gZnVuY3Rpb24oKSB7XG5cblx0XHR2YXIgJHNlYXJjaF9maWVsZCA9ICQoIHRoaXMgKTtcblxuXHRcdCRzZWFyY2hfZmllbGQuZGF0YSggJ3BsYWNlaG9sZGVyJywgJHNlYXJjaF9maWVsZC5hdHRyKCAncGxhY2Vob2xkZXInICkgKS5hdHRyKCAncGxhY2Vob2xkZXInLCAnJyApO1xuXHR9O1xuXG5cdC8vIFJlcGxhY2UgcGxhY2Vob2xkZXIgdGV4dCBmcm9tIHNlYXJjaCBmaWVsZC5cblx0YXBwLmFkZFBsYWNlaG9sZGVyVGV4dCA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0dmFyICRzZWFyY2hfZmllbGQgPSAkKCB0aGlzICk7XG5cblx0XHQkc2VhcmNoX2ZpZWxkLmF0dHIoICdwbGFjZWhvbGRlcicsICRzZWFyY2hfZmllbGQuZGF0YSggJ3BsYWNlaG9sZGVyJyApICkuZGF0YSggJ3BsYWNlaG9sZGVyJywgJycgKTtcblx0fTtcblxuXHQvLyBFbmdhZ2UhXG5cdCQoIGFwcC5pbml0ICk7XG5cbn0gKSggd2luZG93LCBqUXVlcnksIHdpbmRvdy5XRFNfU2VhcmNoICk7IiwiLyoqXG4gKiBGaWxlIHNraXAtbGluay1mb2N1cy1maXguanMuXG4gKlxuICogSGVscHMgd2l0aCBhY2Nlc3NpYmlsaXR5IGZvciBrZXlib2FyZCBvbmx5IHVzZXJzLlxuICpcbiAqIExlYXJuIG1vcmU6IGh0dHBzOi8vZ2l0LmlvL3ZXZHIyXG4gKi9cbiggZnVuY3Rpb24oKSB7XG5cdHZhciBpc1dlYmtpdCA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCAnd2Via2l0JyApID4gLTEsXG5cdCAgICBpc09wZXJhICA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCAnb3BlcmEnICkgID4gLTEsXG5cdCAgICBpc0llICAgICA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCAnbXNpZScgKSAgID4gLTE7XG5cblx0aWYgKCAoIGlzV2Via2l0IHx8IGlzT3BlcmEgfHwgaXNJZSApICYmIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICkge1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnaGFzaGNoYW5nZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGlkID0gbG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoIDEgKSxcblx0XHRcdFx0ZWxlbWVudDtcblxuXHRcdFx0aWYgKCAhICggL15bQS16MC05Xy1dKyQvLnRlc3QoIGlkICkgKSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIGlkICk7XG5cblx0XHRcdGlmICggZWxlbWVudCApIHtcblx0XHRcdFx0aWYgKCAhICggL14oPzphfHNlbGVjdHxpbnB1dHxidXR0b258dGV4dGFyZWEpJC9pLnRlc3QoIGVsZW1lbnQudGFnTmFtZSApICkgKSB7XG5cdFx0XHRcdFx0ZWxlbWVudC50YWJJbmRleCA9IC0xO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZWxlbWVudC5mb2N1cygpO1xuXHRcdFx0fVxuXHRcdH0sIGZhbHNlICk7XG5cdH1cbn0pKCk7IiwiLypcbiAgICAgXyBfICAgICAgXyAgICAgICBfXG4gX19ffCAoXykgX19ffCB8IF9fICAoXylfX19cbi8gX198IHwgfC8gX198IHwvIC8gIHwgLyBfX3xcblxcX18gXFwgfCB8IChfX3wgICA8IF8gfCBcXF9fIFxcXG58X19fL198X3xcXF9fX3xffFxcXyhfKS8gfF9fXy9cbiAgICAgICAgICAgICAgICAgICB8X18vXG5cbiBWZXJzaW9uOiAxLjYuMFxuICBBdXRob3I6IEtlbiBXaGVlbGVyXG4gV2Vic2l0ZTogaHR0cDovL2tlbndoZWVsZXIuZ2l0aHViLmlvXG4gICAgRG9jczogaHR0cDovL2tlbndoZWVsZXIuZ2l0aHViLmlvL3NsaWNrXG4gICAgUmVwbzogaHR0cDovL2dpdGh1Yi5jb20va2Vud2hlZWxlci9zbGlja1xuICBJc3N1ZXM6IGh0dHA6Ly9naXRodWIuY29tL2tlbndoZWVsZXIvc2xpY2svaXNzdWVzXG5cbiAqL1xuIWZ1bmN0aW9uKGEpe1widXNlIHN0cmljdFwiO1wiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZD9kZWZpbmUoW1wianF1ZXJ5XCJdLGEpOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBleHBvcnRzP21vZHVsZS5leHBvcnRzPWEocmVxdWlyZShcImpxdWVyeVwiKSk6YShqUXVlcnkpfShmdW5jdGlvbihhKXtcInVzZSBzdHJpY3RcIjt2YXIgYj13aW5kb3cuU2xpY2t8fHt9O2I9ZnVuY3Rpb24oKXtmdW5jdGlvbiBjKGMsZCl7dmFyIGYsZT10aGlzO2UuZGVmYXVsdHM9e2FjY2Vzc2liaWxpdHk6ITAsYWRhcHRpdmVIZWlnaHQ6ITEsYXBwZW5kQXJyb3dzOmEoYyksYXBwZW5kRG90czphKGMpLGFycm93czohMCxhc05hdkZvcjpudWxsLHByZXZBcnJvdzonPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgZGF0YS1yb2xlPVwibm9uZVwiIGNsYXNzPVwic2xpY2stcHJldlwiIGFyaWEtbGFiZWw9XCJQcmV2aW91c1wiIHRhYmluZGV4PVwiMFwiIHJvbGU9XCJidXR0b25cIj5QcmV2aW91czwvYnV0dG9uPicsbmV4dEFycm93Oic8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBkYXRhLXJvbGU9XCJub25lXCIgY2xhc3M9XCJzbGljay1uZXh0XCIgYXJpYS1sYWJlbD1cIk5leHRcIiB0YWJpbmRleD1cIjBcIiByb2xlPVwiYnV0dG9uXCI+TmV4dDwvYnV0dG9uPicsYXV0b3BsYXk6ITEsYXV0b3BsYXlTcGVlZDozZTMsY2VudGVyTW9kZTohMSxjZW50ZXJQYWRkaW5nOlwiNTBweFwiLGNzc0Vhc2U6XCJlYXNlXCIsY3VzdG9tUGFnaW5nOmZ1bmN0aW9uKGIsYyl7cmV0dXJuIGEoJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGRhdGEtcm9sZT1cIm5vbmVcIiByb2xlPVwiYnV0dG9uXCIgdGFiaW5kZXg9XCIwXCIgLz4nKS50ZXh0KGMrMSl9LGRvdHM6ITEsZG90c0NsYXNzOlwic2xpY2stZG90c1wiLGRyYWdnYWJsZTohMCxlYXNpbmc6XCJsaW5lYXJcIixlZGdlRnJpY3Rpb246LjM1LGZhZGU6ITEsZm9jdXNPblNlbGVjdDohMSxpbmZpbml0ZTohMCxpbml0aWFsU2xpZGU6MCxsYXp5TG9hZDpcIm9uZGVtYW5kXCIsbW9iaWxlRmlyc3Q6ITEscGF1c2VPbkhvdmVyOiEwLHBhdXNlT25Gb2N1czohMCxwYXVzZU9uRG90c0hvdmVyOiExLHJlc3BvbmRUbzpcIndpbmRvd1wiLHJlc3BvbnNpdmU6bnVsbCxyb3dzOjEscnRsOiExLHNsaWRlOlwiXCIsc2xpZGVzUGVyUm93OjEsc2xpZGVzVG9TaG93OjEsc2xpZGVzVG9TY3JvbGw6MSxzcGVlZDo1MDAsc3dpcGU6ITAsc3dpcGVUb1NsaWRlOiExLHRvdWNoTW92ZTohMCx0b3VjaFRocmVzaG9sZDo1LHVzZUNTUzohMCx1c2VUcmFuc2Zvcm06ITAsdmFyaWFibGVXaWR0aDohMSx2ZXJ0aWNhbDohMSx2ZXJ0aWNhbFN3aXBpbmc6ITEsd2FpdEZvckFuaW1hdGU6ITAsekluZGV4OjFlM30sZS5pbml0aWFscz17YW5pbWF0aW5nOiExLGRyYWdnaW5nOiExLGF1dG9QbGF5VGltZXI6bnVsbCxjdXJyZW50RGlyZWN0aW9uOjAsY3VycmVudExlZnQ6bnVsbCxjdXJyZW50U2xpZGU6MCxkaXJlY3Rpb246MSwkZG90czpudWxsLGxpc3RXaWR0aDpudWxsLGxpc3RIZWlnaHQ6bnVsbCxsb2FkSW5kZXg6MCwkbmV4dEFycm93Om51bGwsJHByZXZBcnJvdzpudWxsLHNsaWRlQ291bnQ6bnVsbCxzbGlkZVdpZHRoOm51bGwsJHNsaWRlVHJhY2s6bnVsbCwkc2xpZGVzOm51bGwsc2xpZGluZzohMSxzbGlkZU9mZnNldDowLHN3aXBlTGVmdDpudWxsLCRsaXN0Om51bGwsdG91Y2hPYmplY3Q6e30sdHJhbnNmb3Jtc0VuYWJsZWQ6ITEsdW5zbGlja2VkOiExfSxhLmV4dGVuZChlLGUuaW5pdGlhbHMpLGUuYWN0aXZlQnJlYWtwb2ludD1udWxsLGUuYW5pbVR5cGU9bnVsbCxlLmFuaW1Qcm9wPW51bGwsZS5icmVha3BvaW50cz1bXSxlLmJyZWFrcG9pbnRTZXR0aW5ncz1bXSxlLmNzc1RyYW5zaXRpb25zPSExLGUuZm9jdXNzZWQ9ITEsZS5pbnRlcnJ1cHRlZD0hMSxlLmhpZGRlbj1cImhpZGRlblwiLGUucGF1c2VkPSEwLGUucG9zaXRpb25Qcm9wPW51bGwsZS5yZXNwb25kVG89bnVsbCxlLnJvd0NvdW50PTEsZS5zaG91bGRDbGljaz0hMCxlLiRzbGlkZXI9YShjKSxlLiRzbGlkZXNDYWNoZT1udWxsLGUudHJhbnNmb3JtVHlwZT1udWxsLGUudHJhbnNpdGlvblR5cGU9bnVsbCxlLnZpc2liaWxpdHlDaGFuZ2U9XCJ2aXNpYmlsaXR5Y2hhbmdlXCIsZS53aW5kb3dXaWR0aD0wLGUud2luZG93VGltZXI9bnVsbCxmPWEoYykuZGF0YShcInNsaWNrXCIpfHx7fSxlLm9wdGlvbnM9YS5leHRlbmQoe30sZS5kZWZhdWx0cyxkLGYpLGUuY3VycmVudFNsaWRlPWUub3B0aW9ucy5pbml0aWFsU2xpZGUsZS5vcmlnaW5hbFNldHRpbmdzPWUub3B0aW9ucyxcInVuZGVmaW5lZFwiIT10eXBlb2YgZG9jdW1lbnQubW96SGlkZGVuPyhlLmhpZGRlbj1cIm1vekhpZGRlblwiLGUudmlzaWJpbGl0eUNoYW5nZT1cIm1venZpc2liaWxpdHljaGFuZ2VcIik6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGRvY3VtZW50LndlYmtpdEhpZGRlbiYmKGUuaGlkZGVuPVwid2Via2l0SGlkZGVuXCIsZS52aXNpYmlsaXR5Q2hhbmdlPVwid2Via2l0dmlzaWJpbGl0eWNoYW5nZVwiKSxlLmF1dG9QbGF5PWEucHJveHkoZS5hdXRvUGxheSxlKSxlLmF1dG9QbGF5Q2xlYXI9YS5wcm94eShlLmF1dG9QbGF5Q2xlYXIsZSksZS5hdXRvUGxheUl0ZXJhdG9yPWEucHJveHkoZS5hdXRvUGxheUl0ZXJhdG9yLGUpLGUuY2hhbmdlU2xpZGU9YS5wcm94eShlLmNoYW5nZVNsaWRlLGUpLGUuY2xpY2tIYW5kbGVyPWEucHJveHkoZS5jbGlja0hhbmRsZXIsZSksZS5zZWxlY3RIYW5kbGVyPWEucHJveHkoZS5zZWxlY3RIYW5kbGVyLGUpLGUuc2V0UG9zaXRpb249YS5wcm94eShlLnNldFBvc2l0aW9uLGUpLGUuc3dpcGVIYW5kbGVyPWEucHJveHkoZS5zd2lwZUhhbmRsZXIsZSksZS5kcmFnSGFuZGxlcj1hLnByb3h5KGUuZHJhZ0hhbmRsZXIsZSksZS5rZXlIYW5kbGVyPWEucHJveHkoZS5rZXlIYW5kbGVyLGUpLGUuaW5zdGFuY2VVaWQ9YisrLGUuaHRtbEV4cHI9L14oPzpcXHMqKDxbXFx3XFxXXSs+KVtePl0qKSQvLGUucmVnaXN0ZXJCcmVha3BvaW50cygpLGUuaW5pdCghMCl9dmFyIGI9MDtyZXR1cm4gY30oKSxiLnByb3RvdHlwZS5hY3RpdmF0ZUFEQT1mdW5jdGlvbigpe3ZhciBhPXRoaXM7YS4kc2xpZGVUcmFjay5maW5kKFwiLnNsaWNrLWFjdGl2ZVwiKS5hdHRyKHtcImFyaWEtaGlkZGVuXCI6XCJmYWxzZVwifSkuZmluZChcImEsIGlucHV0LCBidXR0b24sIHNlbGVjdFwiKS5hdHRyKHt0YWJpbmRleDpcIjBcIn0pfSxiLnByb3RvdHlwZS5hZGRTbGlkZT1iLnByb3RvdHlwZS5zbGlja0FkZD1mdW5jdGlvbihiLGMsZCl7dmFyIGU9dGhpcztpZihcImJvb2xlYW5cIj09dHlwZW9mIGMpZD1jLGM9bnVsbDtlbHNlIGlmKDA+Y3x8Yz49ZS5zbGlkZUNvdW50KXJldHVybiExO2UudW5sb2FkKCksXCJudW1iZXJcIj09dHlwZW9mIGM/MD09PWMmJjA9PT1lLiRzbGlkZXMubGVuZ3RoP2EoYikuYXBwZW5kVG8oZS4kc2xpZGVUcmFjayk6ZD9hKGIpLmluc2VydEJlZm9yZShlLiRzbGlkZXMuZXEoYykpOmEoYikuaW5zZXJ0QWZ0ZXIoZS4kc2xpZGVzLmVxKGMpKTpkPT09ITA/YShiKS5wcmVwZW5kVG8oZS4kc2xpZGVUcmFjayk6YShiKS5hcHBlbmRUbyhlLiRzbGlkZVRyYWNrKSxlLiRzbGlkZXM9ZS4kc2xpZGVUcmFjay5jaGlsZHJlbih0aGlzLm9wdGlvbnMuc2xpZGUpLGUuJHNsaWRlVHJhY2suY2hpbGRyZW4odGhpcy5vcHRpb25zLnNsaWRlKS5kZXRhY2goKSxlLiRzbGlkZVRyYWNrLmFwcGVuZChlLiRzbGlkZXMpLGUuJHNsaWRlcy5lYWNoKGZ1bmN0aW9uKGIsYyl7YShjKS5hdHRyKFwiZGF0YS1zbGljay1pbmRleFwiLGIpfSksZS4kc2xpZGVzQ2FjaGU9ZS4kc2xpZGVzLGUucmVpbml0KCl9LGIucHJvdG90eXBlLmFuaW1hdGVIZWlnaHQ9ZnVuY3Rpb24oKXt2YXIgYT10aGlzO2lmKDE9PT1hLm9wdGlvbnMuc2xpZGVzVG9TaG93JiZhLm9wdGlvbnMuYWRhcHRpdmVIZWlnaHQ9PT0hMCYmYS5vcHRpb25zLnZlcnRpY2FsPT09ITEpe3ZhciBiPWEuJHNsaWRlcy5lcShhLmN1cnJlbnRTbGlkZSkub3V0ZXJIZWlnaHQoITApO2EuJGxpc3QuYW5pbWF0ZSh7aGVpZ2h0OmJ9LGEub3B0aW9ucy5zcGVlZCl9fSxiLnByb3RvdHlwZS5hbmltYXRlU2xpZGU9ZnVuY3Rpb24oYixjKXt2YXIgZD17fSxlPXRoaXM7ZS5hbmltYXRlSGVpZ2h0KCksZS5vcHRpb25zLnJ0bD09PSEwJiZlLm9wdGlvbnMudmVydGljYWw9PT0hMSYmKGI9LWIpLGUudHJhbnNmb3Jtc0VuYWJsZWQ9PT0hMT9lLm9wdGlvbnMudmVydGljYWw9PT0hMT9lLiRzbGlkZVRyYWNrLmFuaW1hdGUoe2xlZnQ6Yn0sZS5vcHRpb25zLnNwZWVkLGUub3B0aW9ucy5lYXNpbmcsYyk6ZS4kc2xpZGVUcmFjay5hbmltYXRlKHt0b3A6Yn0sZS5vcHRpb25zLnNwZWVkLGUub3B0aW9ucy5lYXNpbmcsYyk6ZS5jc3NUcmFuc2l0aW9ucz09PSExPyhlLm9wdGlvbnMucnRsPT09ITAmJihlLmN1cnJlbnRMZWZ0PS1lLmN1cnJlbnRMZWZ0KSxhKHthbmltU3RhcnQ6ZS5jdXJyZW50TGVmdH0pLmFuaW1hdGUoe2FuaW1TdGFydDpifSx7ZHVyYXRpb246ZS5vcHRpb25zLnNwZWVkLGVhc2luZzplLm9wdGlvbnMuZWFzaW5nLHN0ZXA6ZnVuY3Rpb24oYSl7YT1NYXRoLmNlaWwoYSksZS5vcHRpb25zLnZlcnRpY2FsPT09ITE/KGRbZS5hbmltVHlwZV09XCJ0cmFuc2xhdGUoXCIrYStcInB4LCAwcHgpXCIsZS4kc2xpZGVUcmFjay5jc3MoZCkpOihkW2UuYW5pbVR5cGVdPVwidHJhbnNsYXRlKDBweCxcIithK1wicHgpXCIsZS4kc2xpZGVUcmFjay5jc3MoZCkpfSxjb21wbGV0ZTpmdW5jdGlvbigpe2MmJmMuY2FsbCgpfX0pKTooZS5hcHBseVRyYW5zaXRpb24oKSxiPU1hdGguY2VpbChiKSxlLm9wdGlvbnMudmVydGljYWw9PT0hMT9kW2UuYW5pbVR5cGVdPVwidHJhbnNsYXRlM2QoXCIrYitcInB4LCAwcHgsIDBweClcIjpkW2UuYW5pbVR5cGVdPVwidHJhbnNsYXRlM2QoMHB4LFwiK2IrXCJweCwgMHB4KVwiLGUuJHNsaWRlVHJhY2suY3NzKGQpLGMmJnNldFRpbWVvdXQoZnVuY3Rpb24oKXtlLmRpc2FibGVUcmFuc2l0aW9uKCksYy5jYWxsKCl9LGUub3B0aW9ucy5zcGVlZCkpfSxiLnByb3RvdHlwZS5nZXROYXZUYXJnZXQ9ZnVuY3Rpb24oKXt2YXIgYj10aGlzLGM9Yi5vcHRpb25zLmFzTmF2Rm9yO3JldHVybiBjJiZudWxsIT09YyYmKGM9YShjKS5ub3QoYi4kc2xpZGVyKSksY30sYi5wcm90b3R5cGUuYXNOYXZGb3I9ZnVuY3Rpb24oYil7dmFyIGM9dGhpcyxkPWMuZ2V0TmF2VGFyZ2V0KCk7bnVsbCE9PWQmJlwib2JqZWN0XCI9PXR5cGVvZiBkJiZkLmVhY2goZnVuY3Rpb24oKXt2YXIgYz1hKHRoaXMpLnNsaWNrKFwiZ2V0U2xpY2tcIik7Yy51bnNsaWNrZWR8fGMuc2xpZGVIYW5kbGVyKGIsITApfSl9LGIucHJvdG90eXBlLmFwcGx5VHJhbnNpdGlvbj1mdW5jdGlvbihhKXt2YXIgYj10aGlzLGM9e307Yi5vcHRpb25zLmZhZGU9PT0hMT9jW2IudHJhbnNpdGlvblR5cGVdPWIudHJhbnNmb3JtVHlwZStcIiBcIitiLm9wdGlvbnMuc3BlZWQrXCJtcyBcIitiLm9wdGlvbnMuY3NzRWFzZTpjW2IudHJhbnNpdGlvblR5cGVdPVwib3BhY2l0eSBcIitiLm9wdGlvbnMuc3BlZWQrXCJtcyBcIitiLm9wdGlvbnMuY3NzRWFzZSxiLm9wdGlvbnMuZmFkZT09PSExP2IuJHNsaWRlVHJhY2suY3NzKGMpOmIuJHNsaWRlcy5lcShhKS5jc3MoYyl9LGIucHJvdG90eXBlLmF1dG9QbGF5PWZ1bmN0aW9uKCl7dmFyIGE9dGhpczthLmF1dG9QbGF5Q2xlYXIoKSxhLnNsaWRlQ291bnQ+YS5vcHRpb25zLnNsaWRlc1RvU2hvdyYmKGEuYXV0b1BsYXlUaW1lcj1zZXRJbnRlcnZhbChhLmF1dG9QbGF5SXRlcmF0b3IsYS5vcHRpb25zLmF1dG9wbGF5U3BlZWQpKX0sYi5wcm90b3R5cGUuYXV0b1BsYXlDbGVhcj1mdW5jdGlvbigpe3ZhciBhPXRoaXM7YS5hdXRvUGxheVRpbWVyJiZjbGVhckludGVydmFsKGEuYXV0b1BsYXlUaW1lcil9LGIucHJvdG90eXBlLmF1dG9QbGF5SXRlcmF0b3I9ZnVuY3Rpb24oKXt2YXIgYT10aGlzLGI9YS5jdXJyZW50U2xpZGUrYS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsO2EucGF1c2VkfHxhLmludGVycnVwdGVkfHxhLmZvY3Vzc2VkfHwoYS5vcHRpb25zLmluZmluaXRlPT09ITEmJigxPT09YS5kaXJlY3Rpb24mJmEuY3VycmVudFNsaWRlKzE9PT1hLnNsaWRlQ291bnQtMT9hLmRpcmVjdGlvbj0wOjA9PT1hLmRpcmVjdGlvbiYmKGI9YS5jdXJyZW50U2xpZGUtYS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsLGEuY3VycmVudFNsaWRlLTE9PT0wJiYoYS5kaXJlY3Rpb249MSkpKSxhLnNsaWRlSGFuZGxlcihiKSl9LGIucHJvdG90eXBlLmJ1aWxkQXJyb3dzPWZ1bmN0aW9uKCl7dmFyIGI9dGhpcztiLm9wdGlvbnMuYXJyb3dzPT09ITAmJihiLiRwcmV2QXJyb3c9YShiLm9wdGlvbnMucHJldkFycm93KS5hZGRDbGFzcyhcInNsaWNrLWFycm93XCIpLGIuJG5leHRBcnJvdz1hKGIub3B0aW9ucy5uZXh0QXJyb3cpLmFkZENsYXNzKFwic2xpY2stYXJyb3dcIiksYi5zbGlkZUNvdW50PmIub3B0aW9ucy5zbGlkZXNUb1Nob3c/KGIuJHByZXZBcnJvdy5yZW1vdmVDbGFzcyhcInNsaWNrLWhpZGRlblwiKS5yZW1vdmVBdHRyKFwiYXJpYS1oaWRkZW4gdGFiaW5kZXhcIiksYi4kbmV4dEFycm93LnJlbW92ZUNsYXNzKFwic2xpY2staGlkZGVuXCIpLnJlbW92ZUF0dHIoXCJhcmlhLWhpZGRlbiB0YWJpbmRleFwiKSxiLmh0bWxFeHByLnRlc3QoYi5vcHRpb25zLnByZXZBcnJvdykmJmIuJHByZXZBcnJvdy5wcmVwZW5kVG8oYi5vcHRpb25zLmFwcGVuZEFycm93cyksYi5odG1sRXhwci50ZXN0KGIub3B0aW9ucy5uZXh0QXJyb3cpJiZiLiRuZXh0QXJyb3cuYXBwZW5kVG8oYi5vcHRpb25zLmFwcGVuZEFycm93cyksYi5vcHRpb25zLmluZmluaXRlIT09ITAmJmIuJHByZXZBcnJvdy5hZGRDbGFzcyhcInNsaWNrLWRpc2FibGVkXCIpLmF0dHIoXCJhcmlhLWRpc2FibGVkXCIsXCJ0cnVlXCIpKTpiLiRwcmV2QXJyb3cuYWRkKGIuJG5leHRBcnJvdykuYWRkQ2xhc3MoXCJzbGljay1oaWRkZW5cIikuYXR0cih7XCJhcmlhLWRpc2FibGVkXCI6XCJ0cnVlXCIsdGFiaW5kZXg6XCItMVwifSkpfSxiLnByb3RvdHlwZS5idWlsZERvdHM9ZnVuY3Rpb24oKXt2YXIgYyxkLGI9dGhpcztpZihiLm9wdGlvbnMuZG90cz09PSEwJiZiLnNsaWRlQ291bnQ+Yi5vcHRpb25zLnNsaWRlc1RvU2hvdyl7Zm9yKGIuJHNsaWRlci5hZGRDbGFzcyhcInNsaWNrLWRvdHRlZFwiKSxkPWEoXCI8dWwgLz5cIikuYWRkQ2xhc3MoYi5vcHRpb25zLmRvdHNDbGFzcyksYz0wO2M8PWIuZ2V0RG90Q291bnQoKTtjKz0xKWQuYXBwZW5kKGEoXCI8bGkgLz5cIikuYXBwZW5kKGIub3B0aW9ucy5jdXN0b21QYWdpbmcuY2FsbCh0aGlzLGIsYykpKTtiLiRkb3RzPWQuYXBwZW5kVG8oYi5vcHRpb25zLmFwcGVuZERvdHMpLGIuJGRvdHMuZmluZChcImxpXCIpLmZpcnN0KCkuYWRkQ2xhc3MoXCJzbGljay1hY3RpdmVcIikuYXR0cihcImFyaWEtaGlkZGVuXCIsXCJmYWxzZVwiKX19LGIucHJvdG90eXBlLmJ1aWxkT3V0PWZ1bmN0aW9uKCl7dmFyIGI9dGhpcztiLiRzbGlkZXM9Yi4kc2xpZGVyLmNoaWxkcmVuKGIub3B0aW9ucy5zbGlkZStcIjpub3QoLnNsaWNrLWNsb25lZClcIikuYWRkQ2xhc3MoXCJzbGljay1zbGlkZVwiKSxiLnNsaWRlQ291bnQ9Yi4kc2xpZGVzLmxlbmd0aCxiLiRzbGlkZXMuZWFjaChmdW5jdGlvbihiLGMpe2EoYykuYXR0cihcImRhdGEtc2xpY2staW5kZXhcIixiKS5kYXRhKFwib3JpZ2luYWxTdHlsaW5nXCIsYShjKS5hdHRyKFwic3R5bGVcIil8fFwiXCIpfSksYi4kc2xpZGVyLmFkZENsYXNzKFwic2xpY2stc2xpZGVyXCIpLGIuJHNsaWRlVHJhY2s9MD09PWIuc2xpZGVDb3VudD9hKCc8ZGl2IGNsYXNzPVwic2xpY2stdHJhY2tcIi8+JykuYXBwZW5kVG8oYi4kc2xpZGVyKTpiLiRzbGlkZXMud3JhcEFsbCgnPGRpdiBjbGFzcz1cInNsaWNrLXRyYWNrXCIvPicpLnBhcmVudCgpLGIuJGxpc3Q9Yi4kc2xpZGVUcmFjay53cmFwKCc8ZGl2IGFyaWEtbGl2ZT1cInBvbGl0ZVwiIGNsYXNzPVwic2xpY2stbGlzdFwiLz4nKS5wYXJlbnQoKSxiLiRzbGlkZVRyYWNrLmNzcyhcIm9wYWNpdHlcIiwwKSwoYi5vcHRpb25zLmNlbnRlck1vZGU9PT0hMHx8Yi5vcHRpb25zLnN3aXBlVG9TbGlkZT09PSEwKSYmKGIub3B0aW9ucy5zbGlkZXNUb1Njcm9sbD0xKSxhKFwiaW1nW2RhdGEtbGF6eV1cIixiLiRzbGlkZXIpLm5vdChcIltzcmNdXCIpLmFkZENsYXNzKFwic2xpY2stbG9hZGluZ1wiKSxiLnNldHVwSW5maW5pdGUoKSxiLmJ1aWxkQXJyb3dzKCksYi5idWlsZERvdHMoKSxiLnVwZGF0ZURvdHMoKSxiLnNldFNsaWRlQ2xhc3NlcyhcIm51bWJlclwiPT10eXBlb2YgYi5jdXJyZW50U2xpZGU/Yi5jdXJyZW50U2xpZGU6MCksYi5vcHRpb25zLmRyYWdnYWJsZT09PSEwJiZiLiRsaXN0LmFkZENsYXNzKFwiZHJhZ2dhYmxlXCIpfSxiLnByb3RvdHlwZS5idWlsZFJvd3M9ZnVuY3Rpb24oKXt2YXIgYixjLGQsZSxmLGcsaCxhPXRoaXM7aWYoZT1kb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCksZz1hLiRzbGlkZXIuY2hpbGRyZW4oKSxhLm9wdGlvbnMucm93cz4xKXtmb3IoaD1hLm9wdGlvbnMuc2xpZGVzUGVyUm93KmEub3B0aW9ucy5yb3dzLGY9TWF0aC5jZWlsKGcubGVuZ3RoL2gpLGI9MDtmPmI7YisrKXt2YXIgaT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2ZvcihjPTA7YzxhLm9wdGlvbnMucm93cztjKyspe3ZhciBqPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7Zm9yKGQ9MDtkPGEub3B0aW9ucy5zbGlkZXNQZXJSb3c7ZCsrKXt2YXIgaz1iKmgrKGMqYS5vcHRpb25zLnNsaWRlc1BlclJvdytkKTtnLmdldChrKSYmai5hcHBlbmRDaGlsZChnLmdldChrKSl9aS5hcHBlbmRDaGlsZChqKX1lLmFwcGVuZENoaWxkKGkpfWEuJHNsaWRlci5lbXB0eSgpLmFwcGVuZChlKSxhLiRzbGlkZXIuY2hpbGRyZW4oKS5jaGlsZHJlbigpLmNoaWxkcmVuKCkuY3NzKHt3aWR0aDoxMDAvYS5vcHRpb25zLnNsaWRlc1BlclJvdytcIiVcIixkaXNwbGF5OlwiaW5saW5lLWJsb2NrXCJ9KX19LGIucHJvdG90eXBlLmNoZWNrUmVzcG9uc2l2ZT1mdW5jdGlvbihiLGMpe3ZhciBlLGYsZyxkPXRoaXMsaD0hMSxpPWQuJHNsaWRlci53aWR0aCgpLGo9d2luZG93LmlubmVyV2lkdGh8fGEod2luZG93KS53aWR0aCgpO2lmKFwid2luZG93XCI9PT1kLnJlc3BvbmRUbz9nPWo6XCJzbGlkZXJcIj09PWQucmVzcG9uZFRvP2c9aTpcIm1pblwiPT09ZC5yZXNwb25kVG8mJihnPU1hdGgubWluKGosaSkpLGQub3B0aW9ucy5yZXNwb25zaXZlJiZkLm9wdGlvbnMucmVzcG9uc2l2ZS5sZW5ndGgmJm51bGwhPT1kLm9wdGlvbnMucmVzcG9uc2l2ZSl7Zj1udWxsO2ZvcihlIGluIGQuYnJlYWtwb2ludHMpZC5icmVha3BvaW50cy5oYXNPd25Qcm9wZXJ0eShlKSYmKGQub3JpZ2luYWxTZXR0aW5ncy5tb2JpbGVGaXJzdD09PSExP2c8ZC5icmVha3BvaW50c1tlXSYmKGY9ZC5icmVha3BvaW50c1tlXSk6Zz5kLmJyZWFrcG9pbnRzW2VdJiYoZj1kLmJyZWFrcG9pbnRzW2VdKSk7bnVsbCE9PWY/bnVsbCE9PWQuYWN0aXZlQnJlYWtwb2ludD8oZiE9PWQuYWN0aXZlQnJlYWtwb2ludHx8YykmJihkLmFjdGl2ZUJyZWFrcG9pbnQ9ZixcInVuc2xpY2tcIj09PWQuYnJlYWtwb2ludFNldHRpbmdzW2ZdP2QudW5zbGljayhmKTooZC5vcHRpb25zPWEuZXh0ZW5kKHt9LGQub3JpZ2luYWxTZXR0aW5ncyxkLmJyZWFrcG9pbnRTZXR0aW5nc1tmXSksYj09PSEwJiYoZC5jdXJyZW50U2xpZGU9ZC5vcHRpb25zLmluaXRpYWxTbGlkZSksZC5yZWZyZXNoKGIpKSxoPWYpOihkLmFjdGl2ZUJyZWFrcG9pbnQ9ZixcInVuc2xpY2tcIj09PWQuYnJlYWtwb2ludFNldHRpbmdzW2ZdP2QudW5zbGljayhmKTooZC5vcHRpb25zPWEuZXh0ZW5kKHt9LGQub3JpZ2luYWxTZXR0aW5ncyxkLmJyZWFrcG9pbnRTZXR0aW5nc1tmXSksYj09PSEwJiYoZC5jdXJyZW50U2xpZGU9ZC5vcHRpb25zLmluaXRpYWxTbGlkZSksZC5yZWZyZXNoKGIpKSxoPWYpOm51bGwhPT1kLmFjdGl2ZUJyZWFrcG9pbnQmJihkLmFjdGl2ZUJyZWFrcG9pbnQ9bnVsbCxkLm9wdGlvbnM9ZC5vcmlnaW5hbFNldHRpbmdzLGI9PT0hMCYmKGQuY3VycmVudFNsaWRlPWQub3B0aW9ucy5pbml0aWFsU2xpZGUpLGQucmVmcmVzaChiKSxoPWYpLGJ8fGg9PT0hMXx8ZC4kc2xpZGVyLnRyaWdnZXIoXCJicmVha3BvaW50XCIsW2QsaF0pfX0sYi5wcm90b3R5cGUuY2hhbmdlU2xpZGU9ZnVuY3Rpb24oYixjKXt2YXIgZixnLGgsZD10aGlzLGU9YShiLmN1cnJlbnRUYXJnZXQpO3N3aXRjaChlLmlzKFwiYVwiKSYmYi5wcmV2ZW50RGVmYXVsdCgpLGUuaXMoXCJsaVwiKXx8KGU9ZS5jbG9zZXN0KFwibGlcIikpLGg9ZC5zbGlkZUNvdW50JWQub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCE9PTAsZj1oPzA6KGQuc2xpZGVDb3VudC1kLmN1cnJlbnRTbGlkZSklZC5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsLGIuZGF0YS5tZXNzYWdlKXtjYXNlXCJwcmV2aW91c1wiOmc9MD09PWY/ZC5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsOmQub3B0aW9ucy5zbGlkZXNUb1Nob3ctZixkLnNsaWRlQ291bnQ+ZC5vcHRpb25zLnNsaWRlc1RvU2hvdyYmZC5zbGlkZUhhbmRsZXIoZC5jdXJyZW50U2xpZGUtZywhMSxjKTticmVhaztjYXNlXCJuZXh0XCI6Zz0wPT09Zj9kLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGw6ZixkLnNsaWRlQ291bnQ+ZC5vcHRpb25zLnNsaWRlc1RvU2hvdyYmZC5zbGlkZUhhbmRsZXIoZC5jdXJyZW50U2xpZGUrZywhMSxjKTticmVhaztjYXNlXCJpbmRleFwiOnZhciBpPTA9PT1iLmRhdGEuaW5kZXg/MDpiLmRhdGEuaW5kZXh8fGUuaW5kZXgoKSpkLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGw7ZC5zbGlkZUhhbmRsZXIoZC5jaGVja05hdmlnYWJsZShpKSwhMSxjKSxlLmNoaWxkcmVuKCkudHJpZ2dlcihcImZvY3VzXCIpO2JyZWFrO2RlZmF1bHQ6cmV0dXJufX0sYi5wcm90b3R5cGUuY2hlY2tOYXZpZ2FibGU9ZnVuY3Rpb24oYSl7dmFyIGMsZCxiPXRoaXM7aWYoYz1iLmdldE5hdmlnYWJsZUluZGV4ZXMoKSxkPTAsYT5jW2MubGVuZ3RoLTFdKWE9Y1tjLmxlbmd0aC0xXTtlbHNlIGZvcih2YXIgZSBpbiBjKXtpZihhPGNbZV0pe2E9ZDticmVha31kPWNbZV19cmV0dXJuIGF9LGIucHJvdG90eXBlLmNsZWFuVXBFdmVudHM9ZnVuY3Rpb24oKXt2YXIgYj10aGlzO2Iub3B0aW9ucy5kb3RzJiZudWxsIT09Yi4kZG90cyYmYShcImxpXCIsYi4kZG90cykub2ZmKFwiY2xpY2suc2xpY2tcIixiLmNoYW5nZVNsaWRlKS5vZmYoXCJtb3VzZWVudGVyLnNsaWNrXCIsYS5wcm94eShiLmludGVycnVwdCxiLCEwKSkub2ZmKFwibW91c2VsZWF2ZS5zbGlja1wiLGEucHJveHkoYi5pbnRlcnJ1cHQsYiwhMSkpLGIuJHNsaWRlci5vZmYoXCJmb2N1cy5zbGljayBibHVyLnNsaWNrXCIpLGIub3B0aW9ucy5hcnJvd3M9PT0hMCYmYi5zbGlkZUNvdW50PmIub3B0aW9ucy5zbGlkZXNUb1Nob3cmJihiLiRwcmV2QXJyb3cmJmIuJHByZXZBcnJvdy5vZmYoXCJjbGljay5zbGlja1wiLGIuY2hhbmdlU2xpZGUpLGIuJG5leHRBcnJvdyYmYi4kbmV4dEFycm93Lm9mZihcImNsaWNrLnNsaWNrXCIsYi5jaGFuZ2VTbGlkZSkpLGIuJGxpc3Qub2ZmKFwidG91Y2hzdGFydC5zbGljayBtb3VzZWRvd24uc2xpY2tcIixiLnN3aXBlSGFuZGxlciksYi4kbGlzdC5vZmYoXCJ0b3VjaG1vdmUuc2xpY2sgbW91c2Vtb3ZlLnNsaWNrXCIsYi5zd2lwZUhhbmRsZXIpLGIuJGxpc3Qub2ZmKFwidG91Y2hlbmQuc2xpY2sgbW91c2V1cC5zbGlja1wiLGIuc3dpcGVIYW5kbGVyKSxiLiRsaXN0Lm9mZihcInRvdWNoY2FuY2VsLnNsaWNrIG1vdXNlbGVhdmUuc2xpY2tcIixiLnN3aXBlSGFuZGxlciksYi4kbGlzdC5vZmYoXCJjbGljay5zbGlja1wiLGIuY2xpY2tIYW5kbGVyKSxhKGRvY3VtZW50KS5vZmYoYi52aXNpYmlsaXR5Q2hhbmdlLGIudmlzaWJpbGl0eSksYi5jbGVhblVwU2xpZGVFdmVudHMoKSxiLm9wdGlvbnMuYWNjZXNzaWJpbGl0eT09PSEwJiZiLiRsaXN0Lm9mZihcImtleWRvd24uc2xpY2tcIixiLmtleUhhbmRsZXIpLGIub3B0aW9ucy5mb2N1c09uU2VsZWN0PT09ITAmJmEoYi4kc2xpZGVUcmFjaykuY2hpbGRyZW4oKS5vZmYoXCJjbGljay5zbGlja1wiLGIuc2VsZWN0SGFuZGxlciksYSh3aW5kb3cpLm9mZihcIm9yaWVudGF0aW9uY2hhbmdlLnNsaWNrLnNsaWNrLVwiK2IuaW5zdGFuY2VVaWQsYi5vcmllbnRhdGlvbkNoYW5nZSksYSh3aW5kb3cpLm9mZihcInJlc2l6ZS5zbGljay5zbGljay1cIitiLmluc3RhbmNlVWlkLGIucmVzaXplKSxhKFwiW2RyYWdnYWJsZSE9dHJ1ZV1cIixiLiRzbGlkZVRyYWNrKS5vZmYoXCJkcmFnc3RhcnRcIixiLnByZXZlbnREZWZhdWx0KSxhKHdpbmRvdykub2ZmKFwibG9hZC5zbGljay5zbGljay1cIitiLmluc3RhbmNlVWlkLGIuc2V0UG9zaXRpb24pLGEoZG9jdW1lbnQpLm9mZihcInJlYWR5LnNsaWNrLnNsaWNrLVwiK2IuaW5zdGFuY2VVaWQsYi5zZXRQb3NpdGlvbil9LGIucHJvdG90eXBlLmNsZWFuVXBTbGlkZUV2ZW50cz1mdW5jdGlvbigpe3ZhciBiPXRoaXM7Yi4kbGlzdC5vZmYoXCJtb3VzZWVudGVyLnNsaWNrXCIsYS5wcm94eShiLmludGVycnVwdCxiLCEwKSksYi4kbGlzdC5vZmYoXCJtb3VzZWxlYXZlLnNsaWNrXCIsYS5wcm94eShiLmludGVycnVwdCxiLCExKSl9LGIucHJvdG90eXBlLmNsZWFuVXBSb3dzPWZ1bmN0aW9uKCl7dmFyIGIsYT10aGlzO2Eub3B0aW9ucy5yb3dzPjEmJihiPWEuJHNsaWRlcy5jaGlsZHJlbigpLmNoaWxkcmVuKCksYi5yZW1vdmVBdHRyKFwic3R5bGVcIiksYS4kc2xpZGVyLmVtcHR5KCkuYXBwZW5kKGIpKX0sYi5wcm90b3R5cGUuY2xpY2tIYW5kbGVyPWZ1bmN0aW9uKGEpe3ZhciBiPXRoaXM7Yi5zaG91bGRDbGljaz09PSExJiYoYS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKSxhLnN0b3BQcm9wYWdhdGlvbigpLGEucHJldmVudERlZmF1bHQoKSl9LGIucHJvdG90eXBlLmRlc3Ryb3k9ZnVuY3Rpb24oYil7dmFyIGM9dGhpcztjLmF1dG9QbGF5Q2xlYXIoKSxjLnRvdWNoT2JqZWN0PXt9LGMuY2xlYW5VcEV2ZW50cygpLGEoXCIuc2xpY2stY2xvbmVkXCIsYy4kc2xpZGVyKS5kZXRhY2goKSxjLiRkb3RzJiZjLiRkb3RzLnJlbW92ZSgpLGMuJHByZXZBcnJvdyYmYy4kcHJldkFycm93Lmxlbmd0aCYmKGMuJHByZXZBcnJvdy5yZW1vdmVDbGFzcyhcInNsaWNrLWRpc2FibGVkIHNsaWNrLWFycm93IHNsaWNrLWhpZGRlblwiKS5yZW1vdmVBdHRyKFwiYXJpYS1oaWRkZW4gYXJpYS1kaXNhYmxlZCB0YWJpbmRleFwiKS5jc3MoXCJkaXNwbGF5XCIsXCJcIiksYy5odG1sRXhwci50ZXN0KGMub3B0aW9ucy5wcmV2QXJyb3cpJiZjLiRwcmV2QXJyb3cucmVtb3ZlKCkpLGMuJG5leHRBcnJvdyYmYy4kbmV4dEFycm93Lmxlbmd0aCYmKGMuJG5leHRBcnJvdy5yZW1vdmVDbGFzcyhcInNsaWNrLWRpc2FibGVkIHNsaWNrLWFycm93IHNsaWNrLWhpZGRlblwiKS5yZW1vdmVBdHRyKFwiYXJpYS1oaWRkZW4gYXJpYS1kaXNhYmxlZCB0YWJpbmRleFwiKS5jc3MoXCJkaXNwbGF5XCIsXCJcIiksYy5odG1sRXhwci50ZXN0KGMub3B0aW9ucy5uZXh0QXJyb3cpJiZjLiRuZXh0QXJyb3cucmVtb3ZlKCkpLGMuJHNsaWRlcyYmKGMuJHNsaWRlcy5yZW1vdmVDbGFzcyhcInNsaWNrLXNsaWRlIHNsaWNrLWFjdGl2ZSBzbGljay1jZW50ZXIgc2xpY2stdmlzaWJsZSBzbGljay1jdXJyZW50XCIpLnJlbW92ZUF0dHIoXCJhcmlhLWhpZGRlblwiKS5yZW1vdmVBdHRyKFwiZGF0YS1zbGljay1pbmRleFwiKS5lYWNoKGZ1bmN0aW9uKCl7YSh0aGlzKS5hdHRyKFwic3R5bGVcIixhKHRoaXMpLmRhdGEoXCJvcmlnaW5hbFN0eWxpbmdcIikpfSksYy4kc2xpZGVUcmFjay5jaGlsZHJlbih0aGlzLm9wdGlvbnMuc2xpZGUpLmRldGFjaCgpLGMuJHNsaWRlVHJhY2suZGV0YWNoKCksYy4kbGlzdC5kZXRhY2goKSxjLiRzbGlkZXIuYXBwZW5kKGMuJHNsaWRlcykpLGMuY2xlYW5VcFJvd3MoKSxjLiRzbGlkZXIucmVtb3ZlQ2xhc3MoXCJzbGljay1zbGlkZXJcIiksYy4kc2xpZGVyLnJlbW92ZUNsYXNzKFwic2xpY2staW5pdGlhbGl6ZWRcIiksYy4kc2xpZGVyLnJlbW92ZUNsYXNzKFwic2xpY2stZG90dGVkXCIpLGMudW5zbGlja2VkPSEwLGJ8fGMuJHNsaWRlci50cmlnZ2VyKFwiZGVzdHJveVwiLFtjXSl9LGIucHJvdG90eXBlLmRpc2FibGVUcmFuc2l0aW9uPWZ1bmN0aW9uKGEpe3ZhciBiPXRoaXMsYz17fTtjW2IudHJhbnNpdGlvblR5cGVdPVwiXCIsYi5vcHRpb25zLmZhZGU9PT0hMT9iLiRzbGlkZVRyYWNrLmNzcyhjKTpiLiRzbGlkZXMuZXEoYSkuY3NzKGMpfSxiLnByb3RvdHlwZS5mYWRlU2xpZGU9ZnVuY3Rpb24oYSxiKXt2YXIgYz10aGlzO2MuY3NzVHJhbnNpdGlvbnM9PT0hMT8oYy4kc2xpZGVzLmVxKGEpLmNzcyh7ekluZGV4OmMub3B0aW9ucy56SW5kZXh9KSxjLiRzbGlkZXMuZXEoYSkuYW5pbWF0ZSh7b3BhY2l0eToxfSxjLm9wdGlvbnMuc3BlZWQsYy5vcHRpb25zLmVhc2luZyxiKSk6KGMuYXBwbHlUcmFuc2l0aW9uKGEpLGMuJHNsaWRlcy5lcShhKS5jc3Moe29wYWNpdHk6MSx6SW5kZXg6Yy5vcHRpb25zLnpJbmRleH0pLGImJnNldFRpbWVvdXQoZnVuY3Rpb24oKXtjLmRpc2FibGVUcmFuc2l0aW9uKGEpLGIuY2FsbCgpfSxjLm9wdGlvbnMuc3BlZWQpKX0sYi5wcm90b3R5cGUuZmFkZVNsaWRlT3V0PWZ1bmN0aW9uKGEpe3ZhciBiPXRoaXM7Yi5jc3NUcmFuc2l0aW9ucz09PSExP2IuJHNsaWRlcy5lcShhKS5hbmltYXRlKHtvcGFjaXR5OjAsekluZGV4OmIub3B0aW9ucy56SW5kZXgtMn0sYi5vcHRpb25zLnNwZWVkLGIub3B0aW9ucy5lYXNpbmcpOihiLmFwcGx5VHJhbnNpdGlvbihhKSxiLiRzbGlkZXMuZXEoYSkuY3NzKHtvcGFjaXR5OjAsekluZGV4OmIub3B0aW9ucy56SW5kZXgtMn0pKX0sYi5wcm90b3R5cGUuZmlsdGVyU2xpZGVzPWIucHJvdG90eXBlLnNsaWNrRmlsdGVyPWZ1bmN0aW9uKGEpe3ZhciBiPXRoaXM7bnVsbCE9PWEmJihiLiRzbGlkZXNDYWNoZT1iLiRzbGlkZXMsYi51bmxvYWQoKSxiLiRzbGlkZVRyYWNrLmNoaWxkcmVuKHRoaXMub3B0aW9ucy5zbGlkZSkuZGV0YWNoKCksYi4kc2xpZGVzQ2FjaGUuZmlsdGVyKGEpLmFwcGVuZFRvKGIuJHNsaWRlVHJhY2spLGIucmVpbml0KCkpfSxiLnByb3RvdHlwZS5mb2N1c0hhbmRsZXI9ZnVuY3Rpb24oKXt2YXIgYj10aGlzO2IuJHNsaWRlci5vZmYoXCJmb2N1cy5zbGljayBibHVyLnNsaWNrXCIpLm9uKFwiZm9jdXMuc2xpY2sgYmx1ci5zbGlja1wiLFwiKjpub3QoLnNsaWNrLWFycm93KVwiLGZ1bmN0aW9uKGMpe2Muc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7dmFyIGQ9YSh0aGlzKTtzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7Yi5vcHRpb25zLnBhdXNlT25Gb2N1cyYmKGIuZm9jdXNzZWQ9ZC5pcyhcIjpmb2N1c1wiKSxiLmF1dG9QbGF5KCkpfSwwKX0pfSxiLnByb3RvdHlwZS5nZXRDdXJyZW50PWIucHJvdG90eXBlLnNsaWNrQ3VycmVudFNsaWRlPWZ1bmN0aW9uKCl7dmFyIGE9dGhpcztyZXR1cm4gYS5jdXJyZW50U2xpZGV9LGIucHJvdG90eXBlLmdldERvdENvdW50PWZ1bmN0aW9uKCl7dmFyIGE9dGhpcyxiPTAsYz0wLGQ9MDtpZihhLm9wdGlvbnMuaW5maW5pdGU9PT0hMClmb3IoO2I8YS5zbGlkZUNvdW50OykrK2QsYj1jK2Eub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCxjKz1hLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGw8PWEub3B0aW9ucy5zbGlkZXNUb1Nob3c/YS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsOmEub3B0aW9ucy5zbGlkZXNUb1Nob3c7ZWxzZSBpZihhLm9wdGlvbnMuY2VudGVyTW9kZT09PSEwKWQ9YS5zbGlkZUNvdW50O2Vsc2UgaWYoYS5vcHRpb25zLmFzTmF2Rm9yKWZvcig7YjxhLnNsaWRlQ291bnQ7KSsrZCxiPWMrYS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsLGMrPWEub3B0aW9ucy5zbGlkZXNUb1Njcm9sbDw9YS5vcHRpb25zLnNsaWRlc1RvU2hvdz9hLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGw6YS5vcHRpb25zLnNsaWRlc1RvU2hvdztlbHNlIGQ9MStNYXRoLmNlaWwoKGEuc2xpZGVDb3VudC1hLm9wdGlvbnMuc2xpZGVzVG9TaG93KS9hLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwpO3JldHVybiBkLTF9LGIucHJvdG90eXBlLmdldExlZnQ9ZnVuY3Rpb24oYSl7dmFyIGMsZCxmLGI9dGhpcyxlPTA7cmV0dXJuIGIuc2xpZGVPZmZzZXQ9MCxkPWIuJHNsaWRlcy5maXJzdCgpLm91dGVySGVpZ2h0KCEwKSxiLm9wdGlvbnMuaW5maW5pdGU9PT0hMD8oYi5zbGlkZUNvdW50PmIub3B0aW9ucy5zbGlkZXNUb1Nob3cmJihiLnNsaWRlT2Zmc2V0PWIuc2xpZGVXaWR0aCpiLm9wdGlvbnMuc2xpZGVzVG9TaG93Ki0xLGU9ZCpiLm9wdGlvbnMuc2xpZGVzVG9TaG93Ki0xKSxiLnNsaWRlQ291bnQlYi5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsIT09MCYmYStiLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGw+Yi5zbGlkZUNvdW50JiZiLnNsaWRlQ291bnQ+Yi5vcHRpb25zLnNsaWRlc1RvU2hvdyYmKGE+Yi5zbGlkZUNvdW50PyhiLnNsaWRlT2Zmc2V0PShiLm9wdGlvbnMuc2xpZGVzVG9TaG93LShhLWIuc2xpZGVDb3VudCkpKmIuc2xpZGVXaWR0aCotMSxlPShiLm9wdGlvbnMuc2xpZGVzVG9TaG93LShhLWIuc2xpZGVDb3VudCkpKmQqLTEpOihiLnNsaWRlT2Zmc2V0PWIuc2xpZGVDb3VudCViLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwqYi5zbGlkZVdpZHRoKi0xLGU9Yi5zbGlkZUNvdW50JWIub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCpkKi0xKSkpOmErYi5vcHRpb25zLnNsaWRlc1RvU2hvdz5iLnNsaWRlQ291bnQmJihiLnNsaWRlT2Zmc2V0PShhK2Iub3B0aW9ucy5zbGlkZXNUb1Nob3ctYi5zbGlkZUNvdW50KSpiLnNsaWRlV2lkdGgsZT0oYStiLm9wdGlvbnMuc2xpZGVzVG9TaG93LWIuc2xpZGVDb3VudCkqZCksYi5zbGlkZUNvdW50PD1iLm9wdGlvbnMuc2xpZGVzVG9TaG93JiYoYi5zbGlkZU9mZnNldD0wLGU9MCksYi5vcHRpb25zLmNlbnRlck1vZGU9PT0hMCYmYi5vcHRpb25zLmluZmluaXRlPT09ITA/Yi5zbGlkZU9mZnNldCs9Yi5zbGlkZVdpZHRoKk1hdGguZmxvb3IoYi5vcHRpb25zLnNsaWRlc1RvU2hvdy8yKS1iLnNsaWRlV2lkdGg6Yi5vcHRpb25zLmNlbnRlck1vZGU9PT0hMCYmKGIuc2xpZGVPZmZzZXQ9MCxiLnNsaWRlT2Zmc2V0Kz1iLnNsaWRlV2lkdGgqTWF0aC5mbG9vcihiLm9wdGlvbnMuc2xpZGVzVG9TaG93LzIpKSxjPWIub3B0aW9ucy52ZXJ0aWNhbD09PSExP2EqYi5zbGlkZVdpZHRoKi0xK2Iuc2xpZGVPZmZzZXQ6YSpkKi0xK2UsYi5vcHRpb25zLnZhcmlhYmxlV2lkdGg9PT0hMCYmKGY9Yi5zbGlkZUNvdW50PD1iLm9wdGlvbnMuc2xpZGVzVG9TaG93fHxiLm9wdGlvbnMuaW5maW5pdGU9PT0hMT9iLiRzbGlkZVRyYWNrLmNoaWxkcmVuKFwiLnNsaWNrLXNsaWRlXCIpLmVxKGEpOmIuJHNsaWRlVHJhY2suY2hpbGRyZW4oXCIuc2xpY2stc2xpZGVcIikuZXEoYStiLm9wdGlvbnMuc2xpZGVzVG9TaG93KSxjPWIub3B0aW9ucy5ydGw9PT0hMD9mWzBdPy0xKihiLiRzbGlkZVRyYWNrLndpZHRoKCktZlswXS5vZmZzZXRMZWZ0LWYud2lkdGgoKSk6MDpmWzBdPy0xKmZbMF0ub2Zmc2V0TGVmdDowLGIub3B0aW9ucy5jZW50ZXJNb2RlPT09ITAmJihmPWIuc2xpZGVDb3VudDw9Yi5vcHRpb25zLnNsaWRlc1RvU2hvd3x8Yi5vcHRpb25zLmluZmluaXRlPT09ITE/Yi4kc2xpZGVUcmFjay5jaGlsZHJlbihcIi5zbGljay1zbGlkZVwiKS5lcShhKTpiLiRzbGlkZVRyYWNrLmNoaWxkcmVuKFwiLnNsaWNrLXNsaWRlXCIpLmVxKGErYi5vcHRpb25zLnNsaWRlc1RvU2hvdysxKSxjPWIub3B0aW9ucy5ydGw9PT0hMD9mWzBdPy0xKihiLiRzbGlkZVRyYWNrLndpZHRoKCktZlswXS5vZmZzZXRMZWZ0LWYud2lkdGgoKSk6MDpmWzBdPy0xKmZbMF0ub2Zmc2V0TGVmdDowLGMrPShiLiRsaXN0LndpZHRoKCktZi5vdXRlcldpZHRoKCkpLzIpKSxjfSxiLnByb3RvdHlwZS5nZXRPcHRpb249Yi5wcm90b3R5cGUuc2xpY2tHZXRPcHRpb249ZnVuY3Rpb24oYSl7dmFyIGI9dGhpcztyZXR1cm4gYi5vcHRpb25zW2FdfSxiLnByb3RvdHlwZS5nZXROYXZpZ2FibGVJbmRleGVzPWZ1bmN0aW9uKCl7dmFyIGUsYT10aGlzLGI9MCxjPTAsZD1bXTtmb3IoYS5vcHRpb25zLmluZmluaXRlPT09ITE/ZT1hLnNsaWRlQ291bnQ6KGI9LTEqYS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsLGM9LTEqYS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsLGU9MiphLnNsaWRlQ291bnQpO2U+YjspZC5wdXNoKGIpLGI9YythLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwsYys9YS5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsPD1hLm9wdGlvbnMuc2xpZGVzVG9TaG93P2Eub3B0aW9ucy5zbGlkZXNUb1Njcm9sbDphLm9wdGlvbnMuc2xpZGVzVG9TaG93O3JldHVybiBkfSxiLnByb3RvdHlwZS5nZXRTbGljaz1mdW5jdGlvbigpe3JldHVybiB0aGlzfSxiLnByb3RvdHlwZS5nZXRTbGlkZUNvdW50PWZ1bmN0aW9uKCl7dmFyIGMsZCxlLGI9dGhpcztyZXR1cm4gZT1iLm9wdGlvbnMuY2VudGVyTW9kZT09PSEwP2Iuc2xpZGVXaWR0aCpNYXRoLmZsb29yKGIub3B0aW9ucy5zbGlkZXNUb1Nob3cvMik6MCxiLm9wdGlvbnMuc3dpcGVUb1NsaWRlPT09ITA/KGIuJHNsaWRlVHJhY2suZmluZChcIi5zbGljay1zbGlkZVwiKS5lYWNoKGZ1bmN0aW9uKGMsZil7cmV0dXJuIGYub2Zmc2V0TGVmdC1lK2EoZikub3V0ZXJXaWR0aCgpLzI+LTEqYi5zd2lwZUxlZnQ/KGQ9ZiwhMSk6dm9pZCAwfSksYz1NYXRoLmFicyhhKGQpLmF0dHIoXCJkYXRhLXNsaWNrLWluZGV4XCIpLWIuY3VycmVudFNsaWRlKXx8MSk6Yi5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsfSxiLnByb3RvdHlwZS5nb1RvPWIucHJvdG90eXBlLnNsaWNrR29Ubz1mdW5jdGlvbihhLGIpe3ZhciBjPXRoaXM7Yy5jaGFuZ2VTbGlkZSh7ZGF0YTp7bWVzc2FnZTpcImluZGV4XCIsaW5kZXg6cGFyc2VJbnQoYSl9fSxiKX0sYi5wcm90b3R5cGUuaW5pdD1mdW5jdGlvbihiKXt2YXIgYz10aGlzO2EoYy4kc2xpZGVyKS5oYXNDbGFzcyhcInNsaWNrLWluaXRpYWxpemVkXCIpfHwoYShjLiRzbGlkZXIpLmFkZENsYXNzKFwic2xpY2staW5pdGlhbGl6ZWRcIiksYy5idWlsZFJvd3MoKSxjLmJ1aWxkT3V0KCksYy5zZXRQcm9wcygpLGMuc3RhcnRMb2FkKCksYy5sb2FkU2xpZGVyKCksYy5pbml0aWFsaXplRXZlbnRzKCksYy51cGRhdGVBcnJvd3MoKSxjLnVwZGF0ZURvdHMoKSxjLmNoZWNrUmVzcG9uc2l2ZSghMCksYy5mb2N1c0hhbmRsZXIoKSksYiYmYy4kc2xpZGVyLnRyaWdnZXIoXCJpbml0XCIsW2NdKSxjLm9wdGlvbnMuYWNjZXNzaWJpbGl0eT09PSEwJiZjLmluaXRBREEoKSxjLm9wdGlvbnMuYXV0b3BsYXkmJihjLnBhdXNlZD0hMSxjLmF1dG9QbGF5KCkpfSxiLnByb3RvdHlwZS5pbml0QURBPWZ1bmN0aW9uKCl7dmFyIGI9dGhpcztiLiRzbGlkZXMuYWRkKGIuJHNsaWRlVHJhY2suZmluZChcIi5zbGljay1jbG9uZWRcIikpLmF0dHIoe1wiYXJpYS1oaWRkZW5cIjpcInRydWVcIix0YWJpbmRleDpcIi0xXCJ9KS5maW5kKFwiYSwgaW5wdXQsIGJ1dHRvbiwgc2VsZWN0XCIpLmF0dHIoe3RhYmluZGV4OlwiLTFcIn0pLGIuJHNsaWRlVHJhY2suYXR0cihcInJvbGVcIixcImxpc3Rib3hcIiksYi4kc2xpZGVzLm5vdChiLiRzbGlkZVRyYWNrLmZpbmQoXCIuc2xpY2stY2xvbmVkXCIpKS5lYWNoKGZ1bmN0aW9uKGMpe2EodGhpcykuYXR0cih7cm9sZTpcIm9wdGlvblwiLFwiYXJpYS1kZXNjcmliZWRieVwiOlwic2xpY2stc2xpZGVcIitiLmluc3RhbmNlVWlkK2N9KX0pLG51bGwhPT1iLiRkb3RzJiZiLiRkb3RzLmF0dHIoXCJyb2xlXCIsXCJ0YWJsaXN0XCIpLmZpbmQoXCJsaVwiKS5lYWNoKGZ1bmN0aW9uKGMpe2EodGhpcykuYXR0cih7cm9sZTpcInByZXNlbnRhdGlvblwiLFwiYXJpYS1zZWxlY3RlZFwiOlwiZmFsc2VcIixcImFyaWEtY29udHJvbHNcIjpcIm5hdmlnYXRpb25cIitiLmluc3RhbmNlVWlkK2MsaWQ6XCJzbGljay1zbGlkZVwiK2IuaW5zdGFuY2VVaWQrY30pfSkuZmlyc3QoKS5hdHRyKFwiYXJpYS1zZWxlY3RlZFwiLFwidHJ1ZVwiKS5lbmQoKS5maW5kKFwiYnV0dG9uXCIpLmF0dHIoXCJyb2xlXCIsXCJidXR0b25cIikuZW5kKCkuY2xvc2VzdChcImRpdlwiKS5hdHRyKFwicm9sZVwiLFwidG9vbGJhclwiKSxiLmFjdGl2YXRlQURBKCl9LGIucHJvdG90eXBlLmluaXRBcnJvd0V2ZW50cz1mdW5jdGlvbigpe3ZhciBhPXRoaXM7YS5vcHRpb25zLmFycm93cz09PSEwJiZhLnNsaWRlQ291bnQ+YS5vcHRpb25zLnNsaWRlc1RvU2hvdyYmKGEuJHByZXZBcnJvdy5vZmYoXCJjbGljay5zbGlja1wiKS5vbihcImNsaWNrLnNsaWNrXCIse21lc3NhZ2U6XCJwcmV2aW91c1wifSxhLmNoYW5nZVNsaWRlKSxhLiRuZXh0QXJyb3cub2ZmKFwiY2xpY2suc2xpY2tcIikub24oXCJjbGljay5zbGlja1wiLHttZXNzYWdlOlwibmV4dFwifSxhLmNoYW5nZVNsaWRlKSl9LGIucHJvdG90eXBlLmluaXREb3RFdmVudHM9ZnVuY3Rpb24oKXt2YXIgYj10aGlzO2Iub3B0aW9ucy5kb3RzPT09ITAmJmIuc2xpZGVDb3VudD5iLm9wdGlvbnMuc2xpZGVzVG9TaG93JiZhKFwibGlcIixiLiRkb3RzKS5vbihcImNsaWNrLnNsaWNrXCIse21lc3NhZ2U6XCJpbmRleFwifSxiLmNoYW5nZVNsaWRlKSxiLm9wdGlvbnMuZG90cz09PSEwJiZiLm9wdGlvbnMucGF1c2VPbkRvdHNIb3Zlcj09PSEwJiZhKFwibGlcIixiLiRkb3RzKS5vbihcIm1vdXNlZW50ZXIuc2xpY2tcIixhLnByb3h5KGIuaW50ZXJydXB0LGIsITApKS5vbihcIm1vdXNlbGVhdmUuc2xpY2tcIixhLnByb3h5KGIuaW50ZXJydXB0LGIsITEpKX0sYi5wcm90b3R5cGUuaW5pdFNsaWRlRXZlbnRzPWZ1bmN0aW9uKCl7dmFyIGI9dGhpcztiLm9wdGlvbnMucGF1c2VPbkhvdmVyJiYoYi4kbGlzdC5vbihcIm1vdXNlZW50ZXIuc2xpY2tcIixhLnByb3h5KGIuaW50ZXJydXB0LGIsITApKSxiLiRsaXN0Lm9uKFwibW91c2VsZWF2ZS5zbGlja1wiLGEucHJveHkoYi5pbnRlcnJ1cHQsYiwhMSkpKX0sYi5wcm90b3R5cGUuaW5pdGlhbGl6ZUV2ZW50cz1mdW5jdGlvbigpe3ZhciBiPXRoaXM7Yi5pbml0QXJyb3dFdmVudHMoKSxiLmluaXREb3RFdmVudHMoKSxiLmluaXRTbGlkZUV2ZW50cygpLGIuJGxpc3Qub24oXCJ0b3VjaHN0YXJ0LnNsaWNrIG1vdXNlZG93bi5zbGlja1wiLHthY3Rpb246XCJzdGFydFwifSxiLnN3aXBlSGFuZGxlciksYi4kbGlzdC5vbihcInRvdWNobW92ZS5zbGljayBtb3VzZW1vdmUuc2xpY2tcIix7YWN0aW9uOlwibW92ZVwifSxiLnN3aXBlSGFuZGxlciksYi4kbGlzdC5vbihcInRvdWNoZW5kLnNsaWNrIG1vdXNldXAuc2xpY2tcIix7YWN0aW9uOlwiZW5kXCJ9LGIuc3dpcGVIYW5kbGVyKSxiLiRsaXN0Lm9uKFwidG91Y2hjYW5jZWwuc2xpY2sgbW91c2VsZWF2ZS5zbGlja1wiLHthY3Rpb246XCJlbmRcIn0sYi5zd2lwZUhhbmRsZXIpLGIuJGxpc3Qub24oXCJjbGljay5zbGlja1wiLGIuY2xpY2tIYW5kbGVyKSxhKGRvY3VtZW50KS5vbihiLnZpc2liaWxpdHlDaGFuZ2UsYS5wcm94eShiLnZpc2liaWxpdHksYikpLGIub3B0aW9ucy5hY2Nlc3NpYmlsaXR5PT09ITAmJmIuJGxpc3Qub24oXCJrZXlkb3duLnNsaWNrXCIsYi5rZXlIYW5kbGVyKSxiLm9wdGlvbnMuZm9jdXNPblNlbGVjdD09PSEwJiZhKGIuJHNsaWRlVHJhY2spLmNoaWxkcmVuKCkub24oXCJjbGljay5zbGlja1wiLGIuc2VsZWN0SGFuZGxlciksYSh3aW5kb3cpLm9uKFwib3JpZW50YXRpb25jaGFuZ2Uuc2xpY2suc2xpY2stXCIrYi5pbnN0YW5jZVVpZCxhLnByb3h5KGIub3JpZW50YXRpb25DaGFuZ2UsYikpLGEod2luZG93KS5vbihcInJlc2l6ZS5zbGljay5zbGljay1cIitiLmluc3RhbmNlVWlkLGEucHJveHkoYi5yZXNpemUsYikpLGEoXCJbZHJhZ2dhYmxlIT10cnVlXVwiLGIuJHNsaWRlVHJhY2spLm9uKFwiZHJhZ3N0YXJ0XCIsYi5wcmV2ZW50RGVmYXVsdCksYSh3aW5kb3cpLm9uKFwibG9hZC5zbGljay5zbGljay1cIitiLmluc3RhbmNlVWlkLGIuc2V0UG9zaXRpb24pLGEoZG9jdW1lbnQpLm9uKFwicmVhZHkuc2xpY2suc2xpY2stXCIrYi5pbnN0YW5jZVVpZCxiLnNldFBvc2l0aW9uKX0sYi5wcm90b3R5cGUuaW5pdFVJPWZ1bmN0aW9uKCl7dmFyIGE9dGhpczthLm9wdGlvbnMuYXJyb3dzPT09ITAmJmEuc2xpZGVDb3VudD5hLm9wdGlvbnMuc2xpZGVzVG9TaG93JiYoYS4kcHJldkFycm93LnNob3coKSxhLiRuZXh0QXJyb3cuc2hvdygpKSxhLm9wdGlvbnMuZG90cz09PSEwJiZhLnNsaWRlQ291bnQ+YS5vcHRpb25zLnNsaWRlc1RvU2hvdyYmYS4kZG90cy5zaG93KCl9LGIucHJvdG90eXBlLmtleUhhbmRsZXI9ZnVuY3Rpb24oYSl7dmFyIGI9dGhpczthLnRhcmdldC50YWdOYW1lLm1hdGNoKFwiVEVYVEFSRUF8SU5QVVR8U0VMRUNUXCIpfHwoMzc9PT1hLmtleUNvZGUmJmIub3B0aW9ucy5hY2Nlc3NpYmlsaXR5PT09ITA/Yi5jaGFuZ2VTbGlkZSh7ZGF0YTp7bWVzc2FnZTpiLm9wdGlvbnMucnRsPT09ITA/XCJuZXh0XCI6XCJwcmV2aW91c1wifX0pOjM5PT09YS5rZXlDb2RlJiZiLm9wdGlvbnMuYWNjZXNzaWJpbGl0eT09PSEwJiZiLmNoYW5nZVNsaWRlKHtkYXRhOnttZXNzYWdlOmIub3B0aW9ucy5ydGw9PT0hMD9cInByZXZpb3VzXCI6XCJuZXh0XCJ9fSkpfSxiLnByb3RvdHlwZS5sYXp5TG9hZD1mdW5jdGlvbigpe2Z1bmN0aW9uIGcoYyl7YShcImltZ1tkYXRhLWxhenldXCIsYykuZWFjaChmdW5jdGlvbigpe3ZhciBjPWEodGhpcyksZD1hKHRoaXMpLmF0dHIoXCJkYXRhLWxhenlcIiksZT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO2Uub25sb2FkPWZ1bmN0aW9uKCl7Yy5hbmltYXRlKHtvcGFjaXR5OjB9LDEwMCxmdW5jdGlvbigpe2MuYXR0cihcInNyY1wiLGQpLmFuaW1hdGUoe29wYWNpdHk6MX0sMjAwLGZ1bmN0aW9uKCl7Yy5yZW1vdmVBdHRyKFwiZGF0YS1sYXp5XCIpLnJlbW92ZUNsYXNzKFwic2xpY2stbG9hZGluZ1wiKX0pLGIuJHNsaWRlci50cmlnZ2VyKFwibGF6eUxvYWRlZFwiLFtiLGMsZF0pfSl9LGUub25lcnJvcj1mdW5jdGlvbigpe2MucmVtb3ZlQXR0cihcImRhdGEtbGF6eVwiKS5yZW1vdmVDbGFzcyhcInNsaWNrLWxvYWRpbmdcIikuYWRkQ2xhc3MoXCJzbGljay1sYXp5bG9hZC1lcnJvclwiKSxiLiRzbGlkZXIudHJpZ2dlcihcImxhenlMb2FkRXJyb3JcIixbYixjLGRdKX0sZS5zcmM9ZH0pfXZhciBjLGQsZSxmLGI9dGhpcztiLm9wdGlvbnMuY2VudGVyTW9kZT09PSEwP2Iub3B0aW9ucy5pbmZpbml0ZT09PSEwPyhlPWIuY3VycmVudFNsaWRlKyhiLm9wdGlvbnMuc2xpZGVzVG9TaG93LzIrMSksZj1lK2Iub3B0aW9ucy5zbGlkZXNUb1Nob3crMik6KGU9TWF0aC5tYXgoMCxiLmN1cnJlbnRTbGlkZS0oYi5vcHRpb25zLnNsaWRlc1RvU2hvdy8yKzEpKSxmPTIrKGIub3B0aW9ucy5zbGlkZXNUb1Nob3cvMisxKStiLmN1cnJlbnRTbGlkZSk6KGU9Yi5vcHRpb25zLmluZmluaXRlP2Iub3B0aW9ucy5zbGlkZXNUb1Nob3crYi5jdXJyZW50U2xpZGU6Yi5jdXJyZW50U2xpZGUsZj1NYXRoLmNlaWwoZStiLm9wdGlvbnMuc2xpZGVzVG9TaG93KSxiLm9wdGlvbnMuZmFkZT09PSEwJiYoZT4wJiZlLS0sZjw9Yi5zbGlkZUNvdW50JiZmKyspKSxjPWIuJHNsaWRlci5maW5kKFwiLnNsaWNrLXNsaWRlXCIpLnNsaWNlKGUsZiksZyhjKSxiLnNsaWRlQ291bnQ8PWIub3B0aW9ucy5zbGlkZXNUb1Nob3c/KGQ9Yi4kc2xpZGVyLmZpbmQoXCIuc2xpY2stc2xpZGVcIiksZyhkKSk6Yi5jdXJyZW50U2xpZGU+PWIuc2xpZGVDb3VudC1iLm9wdGlvbnMuc2xpZGVzVG9TaG93PyhkPWIuJHNsaWRlci5maW5kKFwiLnNsaWNrLWNsb25lZFwiKS5zbGljZSgwLGIub3B0aW9ucy5zbGlkZXNUb1Nob3cpLGcoZCkpOjA9PT1iLmN1cnJlbnRTbGlkZSYmKGQ9Yi4kc2xpZGVyLmZpbmQoXCIuc2xpY2stY2xvbmVkXCIpLnNsaWNlKC0xKmIub3B0aW9ucy5zbGlkZXNUb1Nob3cpLGcoZCkpfSxiLnByb3RvdHlwZS5sb2FkU2xpZGVyPWZ1bmN0aW9uKCl7dmFyIGE9dGhpczthLnNldFBvc2l0aW9uKCksYS4kc2xpZGVUcmFjay5jc3Moe29wYWNpdHk6MX0pLGEuJHNsaWRlci5yZW1vdmVDbGFzcyhcInNsaWNrLWxvYWRpbmdcIiksYS5pbml0VUkoKSxcInByb2dyZXNzaXZlXCI9PT1hLm9wdGlvbnMubGF6eUxvYWQmJmEucHJvZ3Jlc3NpdmVMYXp5TG9hZCgpfSxiLnByb3RvdHlwZS5uZXh0PWIucHJvdG90eXBlLnNsaWNrTmV4dD1mdW5jdGlvbigpe3ZhciBhPXRoaXM7YS5jaGFuZ2VTbGlkZSh7ZGF0YTp7bWVzc2FnZTpcIm5leHRcIn19KX0sYi5wcm90b3R5cGUub3JpZW50YXRpb25DaGFuZ2U9ZnVuY3Rpb24oKXt2YXIgYT10aGlzO2EuY2hlY2tSZXNwb25zaXZlKCksYS5zZXRQb3NpdGlvbigpfSxiLnByb3RvdHlwZS5wYXVzZT1iLnByb3RvdHlwZS5zbGlja1BhdXNlPWZ1bmN0aW9uKCl7dmFyIGE9dGhpczthLmF1dG9QbGF5Q2xlYXIoKSxhLnBhdXNlZD0hMH0sYi5wcm90b3R5cGUucGxheT1iLnByb3RvdHlwZS5zbGlja1BsYXk9ZnVuY3Rpb24oKXt2YXIgYT10aGlzO2EuYXV0b1BsYXkoKSxhLm9wdGlvbnMuYXV0b3BsYXk9ITAsYS5wYXVzZWQ9ITEsYS5mb2N1c3NlZD0hMSxhLmludGVycnVwdGVkPSExfSxiLnByb3RvdHlwZS5wb3N0U2xpZGU9ZnVuY3Rpb24oYSl7dmFyIGI9dGhpcztiLnVuc2xpY2tlZHx8KGIuJHNsaWRlci50cmlnZ2VyKFwiYWZ0ZXJDaGFuZ2VcIixbYixhXSksYi5hbmltYXRpbmc9ITEsYi5zZXRQb3NpdGlvbigpLGIuc3dpcGVMZWZ0PW51bGwsYi5vcHRpb25zLmF1dG9wbGF5JiZiLmF1dG9QbGF5KCksYi5vcHRpb25zLmFjY2Vzc2liaWxpdHk9PT0hMCYmYi5pbml0QURBKCkpfSxiLnByb3RvdHlwZS5wcmV2PWIucHJvdG90eXBlLnNsaWNrUHJldj1mdW5jdGlvbigpe3ZhciBhPXRoaXM7YS5jaGFuZ2VTbGlkZSh7ZGF0YTp7bWVzc2FnZTpcInByZXZpb3VzXCJ9fSl9LGIucHJvdG90eXBlLnByZXZlbnREZWZhdWx0PWZ1bmN0aW9uKGEpe2EucHJldmVudERlZmF1bHQoKX0sYi5wcm90b3R5cGUucHJvZ3Jlc3NpdmVMYXp5TG9hZD1mdW5jdGlvbihiKXtiPWJ8fDE7dmFyIGUsZixnLGM9dGhpcyxkPWEoXCJpbWdbZGF0YS1sYXp5XVwiLGMuJHNsaWRlcik7ZC5sZW5ndGg/KGU9ZC5maXJzdCgpLGY9ZS5hdHRyKFwiZGF0YS1sYXp5XCIpLGc9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKSxnLm9ubG9hZD1mdW5jdGlvbigpe2UuYXR0cihcInNyY1wiLGYpLnJlbW92ZUF0dHIoXCJkYXRhLWxhenlcIikucmVtb3ZlQ2xhc3MoXCJzbGljay1sb2FkaW5nXCIpLGMub3B0aW9ucy5hZGFwdGl2ZUhlaWdodD09PSEwJiZjLnNldFBvc2l0aW9uKCksYy4kc2xpZGVyLnRyaWdnZXIoXCJsYXp5TG9hZGVkXCIsW2MsZSxmXSksYy5wcm9ncmVzc2l2ZUxhenlMb2FkKCl9LGcub25lcnJvcj1mdW5jdGlvbigpezM+Yj9zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7Yy5wcm9ncmVzc2l2ZUxhenlMb2FkKGIrMSl9LDUwMCk6KGUucmVtb3ZlQXR0cihcImRhdGEtbGF6eVwiKS5yZW1vdmVDbGFzcyhcInNsaWNrLWxvYWRpbmdcIikuYWRkQ2xhc3MoXCJzbGljay1sYXp5bG9hZC1lcnJvclwiKSxjLiRzbGlkZXIudHJpZ2dlcihcImxhenlMb2FkRXJyb3JcIixbYyxlLGZdKSxjLnByb2dyZXNzaXZlTGF6eUxvYWQoKSl9LGcuc3JjPWYpOmMuJHNsaWRlci50cmlnZ2VyKFwiYWxsSW1hZ2VzTG9hZGVkXCIsW2NdKX0sYi5wcm90b3R5cGUucmVmcmVzaD1mdW5jdGlvbihiKXt2YXIgZCxlLGM9dGhpcztlPWMuc2xpZGVDb3VudC1jLm9wdGlvbnMuc2xpZGVzVG9TaG93LCFjLm9wdGlvbnMuaW5maW5pdGUmJmMuY3VycmVudFNsaWRlPmUmJihjLmN1cnJlbnRTbGlkZT1lKSxjLnNsaWRlQ291bnQ8PWMub3B0aW9ucy5zbGlkZXNUb1Nob3cmJihjLmN1cnJlbnRTbGlkZT0wKSxkPWMuY3VycmVudFNsaWRlLGMuZGVzdHJveSghMCksYS5leHRlbmQoYyxjLmluaXRpYWxzLHtjdXJyZW50U2xpZGU6ZH0pLGMuaW5pdCgpLGJ8fGMuY2hhbmdlU2xpZGUoe2RhdGE6e21lc3NhZ2U6XCJpbmRleFwiLGluZGV4OmR9fSwhMSl9LGIucHJvdG90eXBlLnJlZ2lzdGVyQnJlYWtwb2ludHM9ZnVuY3Rpb24oKXt2YXIgYyxkLGUsYj10aGlzLGY9Yi5vcHRpb25zLnJlc3BvbnNpdmV8fG51bGw7aWYoXCJhcnJheVwiPT09YS50eXBlKGYpJiZmLmxlbmd0aCl7Yi5yZXNwb25kVG89Yi5vcHRpb25zLnJlc3BvbmRUb3x8XCJ3aW5kb3dcIjtmb3IoYyBpbiBmKWlmKGU9Yi5icmVha3BvaW50cy5sZW5ndGgtMSxkPWZbY10uYnJlYWtwb2ludCxmLmhhc093blByb3BlcnR5KGMpKXtmb3IoO2U+PTA7KWIuYnJlYWtwb2ludHNbZV0mJmIuYnJlYWtwb2ludHNbZV09PT1kJiZiLmJyZWFrcG9pbnRzLnNwbGljZShlLDEpLGUtLTtiLmJyZWFrcG9pbnRzLnB1c2goZCksYi5icmVha3BvaW50U2V0dGluZ3NbZF09ZltjXS5zZXR0aW5nc31iLmJyZWFrcG9pbnRzLnNvcnQoZnVuY3Rpb24oYSxjKXtyZXR1cm4gYi5vcHRpb25zLm1vYmlsZUZpcnN0P2EtYzpjLWF9KX19LGIucHJvdG90eXBlLnJlaW5pdD1mdW5jdGlvbigpe3ZhciBiPXRoaXM7Yi4kc2xpZGVzPWIuJHNsaWRlVHJhY2suY2hpbGRyZW4oYi5vcHRpb25zLnNsaWRlKS5hZGRDbGFzcyhcInNsaWNrLXNsaWRlXCIpLGIuc2xpZGVDb3VudD1iLiRzbGlkZXMubGVuZ3RoLGIuY3VycmVudFNsaWRlPj1iLnNsaWRlQ291bnQmJjAhPT1iLmN1cnJlbnRTbGlkZSYmKGIuY3VycmVudFNsaWRlPWIuY3VycmVudFNsaWRlLWIub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCksYi5zbGlkZUNvdW50PD1iLm9wdGlvbnMuc2xpZGVzVG9TaG93JiYoYi5jdXJyZW50U2xpZGU9MCksYi5yZWdpc3RlckJyZWFrcG9pbnRzKCksYi5zZXRQcm9wcygpLGIuc2V0dXBJbmZpbml0ZSgpLGIuYnVpbGRBcnJvd3MoKSxiLnVwZGF0ZUFycm93cygpLGIuaW5pdEFycm93RXZlbnRzKCksYi5idWlsZERvdHMoKSxiLnVwZGF0ZURvdHMoKSxiLmluaXREb3RFdmVudHMoKSxiLmNsZWFuVXBTbGlkZUV2ZW50cygpLGIuaW5pdFNsaWRlRXZlbnRzKCksYi5jaGVja1Jlc3BvbnNpdmUoITEsITApLGIub3B0aW9ucy5mb2N1c09uU2VsZWN0PT09ITAmJmEoYi4kc2xpZGVUcmFjaykuY2hpbGRyZW4oKS5vbihcImNsaWNrLnNsaWNrXCIsYi5zZWxlY3RIYW5kbGVyKSxiLnNldFNsaWRlQ2xhc3NlcyhcIm51bWJlclwiPT10eXBlb2YgYi5jdXJyZW50U2xpZGU/Yi5jdXJyZW50U2xpZGU6MCksYi5zZXRQb3NpdGlvbigpLGIuZm9jdXNIYW5kbGVyKCksYi5wYXVzZWQ9IWIub3B0aW9ucy5hdXRvcGxheSxiLmF1dG9QbGF5KCksYi4kc2xpZGVyLnRyaWdnZXIoXCJyZUluaXRcIixbYl0pfSxiLnByb3RvdHlwZS5yZXNpemU9ZnVuY3Rpb24oKXt2YXIgYj10aGlzO2Eod2luZG93KS53aWR0aCgpIT09Yi53aW5kb3dXaWR0aCYmKGNsZWFyVGltZW91dChiLndpbmRvd0RlbGF5KSxiLndpbmRvd0RlbGF5PXdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7Yi53aW5kb3dXaWR0aD1hKHdpbmRvdykud2lkdGgoKSxiLmNoZWNrUmVzcG9uc2l2ZSgpLGIudW5zbGlja2VkfHxiLnNldFBvc2l0aW9uKCl9LDUwKSl9LGIucHJvdG90eXBlLnJlbW92ZVNsaWRlPWIucHJvdG90eXBlLnNsaWNrUmVtb3ZlPWZ1bmN0aW9uKGEsYixjKXt2YXIgZD10aGlzO3JldHVyblwiYm9vbGVhblwiPT10eXBlb2YgYT8oYj1hLGE9Yj09PSEwPzA6ZC5zbGlkZUNvdW50LTEpOmE9Yj09PSEwPy0tYTphLGQuc2xpZGVDb3VudDwxfHwwPmF8fGE+ZC5zbGlkZUNvdW50LTE/ITE6KGQudW5sb2FkKCksYz09PSEwP2QuJHNsaWRlVHJhY2suY2hpbGRyZW4oKS5yZW1vdmUoKTpkLiRzbGlkZVRyYWNrLmNoaWxkcmVuKHRoaXMub3B0aW9ucy5zbGlkZSkuZXEoYSkucmVtb3ZlKCksZC4kc2xpZGVzPWQuJHNsaWRlVHJhY2suY2hpbGRyZW4odGhpcy5vcHRpb25zLnNsaWRlKSxkLiRzbGlkZVRyYWNrLmNoaWxkcmVuKHRoaXMub3B0aW9ucy5zbGlkZSkuZGV0YWNoKCksZC4kc2xpZGVUcmFjay5hcHBlbmQoZC4kc2xpZGVzKSxkLiRzbGlkZXNDYWNoZT1kLiRzbGlkZXMsdm9pZCBkLnJlaW5pdCgpKX0sYi5wcm90b3R5cGUuc2V0Q1NTPWZ1bmN0aW9uKGEpe3ZhciBkLGUsYj10aGlzLGM9e307Yi5vcHRpb25zLnJ0bD09PSEwJiYoYT0tYSksZD1cImxlZnRcIj09Yi5wb3NpdGlvblByb3A/TWF0aC5jZWlsKGEpK1wicHhcIjpcIjBweFwiLGU9XCJ0b3BcIj09Yi5wb3NpdGlvblByb3A/TWF0aC5jZWlsKGEpK1wicHhcIjpcIjBweFwiLGNbYi5wb3NpdGlvblByb3BdPWEsYi50cmFuc2Zvcm1zRW5hYmxlZD09PSExP2IuJHNsaWRlVHJhY2suY3NzKGMpOihjPXt9LGIuY3NzVHJhbnNpdGlvbnM9PT0hMT8oY1tiLmFuaW1UeXBlXT1cInRyYW5zbGF0ZShcIitkK1wiLCBcIitlK1wiKVwiLGIuJHNsaWRlVHJhY2suY3NzKGMpKTooY1tiLmFuaW1UeXBlXT1cInRyYW5zbGF0ZTNkKFwiK2QrXCIsIFwiK2UrXCIsIDBweClcIixiLiRzbGlkZVRyYWNrLmNzcyhjKSkpfSxiLnByb3RvdHlwZS5zZXREaW1lbnNpb25zPWZ1bmN0aW9uKCl7dmFyIGE9dGhpczthLm9wdGlvbnMudmVydGljYWw9PT0hMT9hLm9wdGlvbnMuY2VudGVyTW9kZT09PSEwJiZhLiRsaXN0LmNzcyh7cGFkZGluZzpcIjBweCBcIithLm9wdGlvbnMuY2VudGVyUGFkZGluZ30pOihhLiRsaXN0LmhlaWdodChhLiRzbGlkZXMuZmlyc3QoKS5vdXRlckhlaWdodCghMCkqYS5vcHRpb25zLnNsaWRlc1RvU2hvdyksYS5vcHRpb25zLmNlbnRlck1vZGU9PT0hMCYmYS4kbGlzdC5jc3Moe3BhZGRpbmc6YS5vcHRpb25zLmNlbnRlclBhZGRpbmcrXCIgMHB4XCJ9KSksYS5saXN0V2lkdGg9YS4kbGlzdC53aWR0aCgpLGEubGlzdEhlaWdodD1hLiRsaXN0LmhlaWdodCgpLGEub3B0aW9ucy52ZXJ0aWNhbD09PSExJiZhLm9wdGlvbnMudmFyaWFibGVXaWR0aD09PSExPyhhLnNsaWRlV2lkdGg9TWF0aC5jZWlsKGEubGlzdFdpZHRoL2Eub3B0aW9ucy5zbGlkZXNUb1Nob3cpLGEuJHNsaWRlVHJhY2sud2lkdGgoTWF0aC5jZWlsKGEuc2xpZGVXaWR0aCphLiRzbGlkZVRyYWNrLmNoaWxkcmVuKFwiLnNsaWNrLXNsaWRlXCIpLmxlbmd0aCkpKTphLm9wdGlvbnMudmFyaWFibGVXaWR0aD09PSEwP2EuJHNsaWRlVHJhY2sud2lkdGgoNWUzKmEuc2xpZGVDb3VudCk6KGEuc2xpZGVXaWR0aD1NYXRoLmNlaWwoYS5saXN0V2lkdGgpLGEuJHNsaWRlVHJhY2suaGVpZ2h0KE1hdGguY2VpbChhLiRzbGlkZXMuZmlyc3QoKS5vdXRlckhlaWdodCghMCkqYS4kc2xpZGVUcmFjay5jaGlsZHJlbihcIi5zbGljay1zbGlkZVwiKS5sZW5ndGgpKSk7dmFyIGI9YS4kc2xpZGVzLmZpcnN0KCkub3V0ZXJXaWR0aCghMCktYS4kc2xpZGVzLmZpcnN0KCkud2lkdGgoKTthLm9wdGlvbnMudmFyaWFibGVXaWR0aD09PSExJiZhLiRzbGlkZVRyYWNrLmNoaWxkcmVuKFwiLnNsaWNrLXNsaWRlXCIpLndpZHRoKGEuc2xpZGVXaWR0aC1iKX0sYi5wcm90b3R5cGUuc2V0RmFkZT1mdW5jdGlvbigpe3ZhciBjLGI9dGhpcztiLiRzbGlkZXMuZWFjaChmdW5jdGlvbihkLGUpe2M9Yi5zbGlkZVdpZHRoKmQqLTEsYi5vcHRpb25zLnJ0bD09PSEwP2EoZSkuY3NzKHtwb3NpdGlvbjpcInJlbGF0aXZlXCIscmlnaHQ6Yyx0b3A6MCx6SW5kZXg6Yi5vcHRpb25zLnpJbmRleC0yLG9wYWNpdHk6MH0pOmEoZSkuY3NzKHtwb3NpdGlvbjpcInJlbGF0aXZlXCIsbGVmdDpjLHRvcDowLHpJbmRleDpiLm9wdGlvbnMuekluZGV4LTIsb3BhY2l0eTowfSl9KSxiLiRzbGlkZXMuZXEoYi5jdXJyZW50U2xpZGUpLmNzcyh7ekluZGV4OmIub3B0aW9ucy56SW5kZXgtMSxvcGFjaXR5OjF9KX0sYi5wcm90b3R5cGUuc2V0SGVpZ2h0PWZ1bmN0aW9uKCl7dmFyIGE9dGhpcztpZigxPT09YS5vcHRpb25zLnNsaWRlc1RvU2hvdyYmYS5vcHRpb25zLmFkYXB0aXZlSGVpZ2h0PT09ITAmJmEub3B0aW9ucy52ZXJ0aWNhbD09PSExKXt2YXIgYj1hLiRzbGlkZXMuZXEoYS5jdXJyZW50U2xpZGUpLm91dGVySGVpZ2h0KCEwKTthLiRsaXN0LmNzcyhcImhlaWdodFwiLGIpfX0sYi5wcm90b3R5cGUuc2V0T3B0aW9uPWIucHJvdG90eXBlLnNsaWNrU2V0T3B0aW9uPWZ1bmN0aW9uKCl7dmFyIGMsZCxlLGYsaCxiPXRoaXMsZz0hMTtpZihcIm9iamVjdFwiPT09YS50eXBlKGFyZ3VtZW50c1swXSk/KGU9YXJndW1lbnRzWzBdLGc9YXJndW1lbnRzWzFdLGg9XCJtdWx0aXBsZVwiKTpcInN0cmluZ1wiPT09YS50eXBlKGFyZ3VtZW50c1swXSkmJihlPWFyZ3VtZW50c1swXSxmPWFyZ3VtZW50c1sxXSxnPWFyZ3VtZW50c1syXSxcInJlc3BvbnNpdmVcIj09PWFyZ3VtZW50c1swXSYmXCJhcnJheVwiPT09YS50eXBlKGFyZ3VtZW50c1sxXSk/aD1cInJlc3BvbnNpdmVcIjpcInVuZGVmaW5lZFwiIT10eXBlb2YgYXJndW1lbnRzWzFdJiYoaD1cInNpbmdsZVwiKSksXCJzaW5nbGVcIj09PWgpYi5vcHRpb25zW2VdPWY7ZWxzZSBpZihcIm11bHRpcGxlXCI9PT1oKWEuZWFjaChlLGZ1bmN0aW9uKGEsYyl7Yi5vcHRpb25zW2FdPWN9KTtlbHNlIGlmKFwicmVzcG9uc2l2ZVwiPT09aClmb3IoZCBpbiBmKWlmKFwiYXJyYXlcIiE9PWEudHlwZShiLm9wdGlvbnMucmVzcG9uc2l2ZSkpYi5vcHRpb25zLnJlc3BvbnNpdmU9W2ZbZF1dO2Vsc2V7Zm9yKGM9Yi5vcHRpb25zLnJlc3BvbnNpdmUubGVuZ3RoLTE7Yz49MDspYi5vcHRpb25zLnJlc3BvbnNpdmVbY10uYnJlYWtwb2ludD09PWZbZF0uYnJlYWtwb2ludCYmYi5vcHRpb25zLnJlc3BvbnNpdmUuc3BsaWNlKGMsMSksYy0tO2Iub3B0aW9ucy5yZXNwb25zaXZlLnB1c2goZltkXSl9ZyYmKGIudW5sb2FkKCksYi5yZWluaXQoKSl9LGIucHJvdG90eXBlLnNldFBvc2l0aW9uPWZ1bmN0aW9uKCl7dmFyIGE9dGhpczthLnNldERpbWVuc2lvbnMoKSxhLnNldEhlaWdodCgpLGEub3B0aW9ucy5mYWRlPT09ITE/YS5zZXRDU1MoYS5nZXRMZWZ0KGEuY3VycmVudFNsaWRlKSk6YS5zZXRGYWRlKCksYS4kc2xpZGVyLnRyaWdnZXIoXCJzZXRQb3NpdGlvblwiLFthXSl9LGIucHJvdG90eXBlLnNldFByb3BzPWZ1bmN0aW9uKCl7dmFyIGE9dGhpcyxiPWRvY3VtZW50LmJvZHkuc3R5bGU7YS5wb3NpdGlvblByb3A9YS5vcHRpb25zLnZlcnRpY2FsPT09ITA/XCJ0b3BcIjpcImxlZnRcIixcInRvcFwiPT09YS5wb3NpdGlvblByb3A/YS4kc2xpZGVyLmFkZENsYXNzKFwic2xpY2stdmVydGljYWxcIik6YS4kc2xpZGVyLnJlbW92ZUNsYXNzKFwic2xpY2stdmVydGljYWxcIiksKHZvaWQgMCE9PWIuV2Via2l0VHJhbnNpdGlvbnx8dm9pZCAwIT09Yi5Nb3pUcmFuc2l0aW9ufHx2b2lkIDAhPT1iLm1zVHJhbnNpdGlvbikmJmEub3B0aW9ucy51c2VDU1M9PT0hMCYmKGEuY3NzVHJhbnNpdGlvbnM9ITApLGEub3B0aW9ucy5mYWRlJiYoXCJudW1iZXJcIj09dHlwZW9mIGEub3B0aW9ucy56SW5kZXg/YS5vcHRpb25zLnpJbmRleDwzJiYoYS5vcHRpb25zLnpJbmRleD0zKTphLm9wdGlvbnMuekluZGV4PWEuZGVmYXVsdHMuekluZGV4KSx2b2lkIDAhPT1iLk9UcmFuc2Zvcm0mJihhLmFuaW1UeXBlPVwiT1RyYW5zZm9ybVwiLGEudHJhbnNmb3JtVHlwZT1cIi1vLXRyYW5zZm9ybVwiLGEudHJhbnNpdGlvblR5cGU9XCJPVHJhbnNpdGlvblwiLHZvaWQgMD09PWIucGVyc3BlY3RpdmVQcm9wZXJ0eSYmdm9pZCAwPT09Yi53ZWJraXRQZXJzcGVjdGl2ZSYmKGEuYW5pbVR5cGU9ITEpKSx2b2lkIDAhPT1iLk1velRyYW5zZm9ybSYmKGEuYW5pbVR5cGU9XCJNb3pUcmFuc2Zvcm1cIixhLnRyYW5zZm9ybVR5cGU9XCItbW96LXRyYW5zZm9ybVwiLGEudHJhbnNpdGlvblR5cGU9XCJNb3pUcmFuc2l0aW9uXCIsdm9pZCAwPT09Yi5wZXJzcGVjdGl2ZVByb3BlcnR5JiZ2b2lkIDA9PT1iLk1velBlcnNwZWN0aXZlJiYoYS5hbmltVHlwZT0hMSkpLHZvaWQgMCE9PWIud2Via2l0VHJhbnNmb3JtJiYoYS5hbmltVHlwZT1cIndlYmtpdFRyYW5zZm9ybVwiLGEudHJhbnNmb3JtVHlwZT1cIi13ZWJraXQtdHJhbnNmb3JtXCIsYS50cmFuc2l0aW9uVHlwZT1cIndlYmtpdFRyYW5zaXRpb25cIix2b2lkIDA9PT1iLnBlcnNwZWN0aXZlUHJvcGVydHkmJnZvaWQgMD09PWIud2Via2l0UGVyc3BlY3RpdmUmJihhLmFuaW1UeXBlPSExKSksdm9pZCAwIT09Yi5tc1RyYW5zZm9ybSYmKGEuYW5pbVR5cGU9XCJtc1RyYW5zZm9ybVwiLGEudHJhbnNmb3JtVHlwZT1cIi1tcy10cmFuc2Zvcm1cIixhLnRyYW5zaXRpb25UeXBlPVwibXNUcmFuc2l0aW9uXCIsdm9pZCAwPT09Yi5tc1RyYW5zZm9ybSYmKGEuYW5pbVR5cGU9ITEpKSx2b2lkIDAhPT1iLnRyYW5zZm9ybSYmYS5hbmltVHlwZSE9PSExJiYoYS5hbmltVHlwZT1cInRyYW5zZm9ybVwiLGEudHJhbnNmb3JtVHlwZT1cInRyYW5zZm9ybVwiLGEudHJhbnNpdGlvblR5cGU9XCJ0cmFuc2l0aW9uXCIpLGEudHJhbnNmb3Jtc0VuYWJsZWQ9YS5vcHRpb25zLnVzZVRyYW5zZm9ybSYmbnVsbCE9PWEuYW5pbVR5cGUmJmEuYW5pbVR5cGUhPT0hMX0sYi5wcm90b3R5cGUuc2V0U2xpZGVDbGFzc2VzPWZ1bmN0aW9uKGEpe3ZhciBjLGQsZSxmLGI9dGhpcztkPWIuJHNsaWRlci5maW5kKFwiLnNsaWNrLXNsaWRlXCIpLnJlbW92ZUNsYXNzKFwic2xpY2stYWN0aXZlIHNsaWNrLWNlbnRlciBzbGljay1jdXJyZW50XCIpLmF0dHIoXCJhcmlhLWhpZGRlblwiLFwidHJ1ZVwiKSxiLiRzbGlkZXMuZXEoYSkuYWRkQ2xhc3MoXCJzbGljay1jdXJyZW50XCIpLGIub3B0aW9ucy5jZW50ZXJNb2RlPT09ITA/KGM9TWF0aC5mbG9vcihiLm9wdGlvbnMuc2xpZGVzVG9TaG93LzIpLGIub3B0aW9ucy5pbmZpbml0ZT09PSEwJiYoYT49YyYmYTw9Yi5zbGlkZUNvdW50LTEtYz9iLiRzbGlkZXMuc2xpY2UoYS1jLGErYysxKS5hZGRDbGFzcyhcInNsaWNrLWFjdGl2ZVwiKS5hdHRyKFwiYXJpYS1oaWRkZW5cIixcImZhbHNlXCIpOihlPWIub3B0aW9ucy5zbGlkZXNUb1Nob3crYSxcbmQuc2xpY2UoZS1jKzEsZStjKzIpLmFkZENsYXNzKFwic2xpY2stYWN0aXZlXCIpLmF0dHIoXCJhcmlhLWhpZGRlblwiLFwiZmFsc2VcIikpLDA9PT1hP2QuZXEoZC5sZW5ndGgtMS1iLm9wdGlvbnMuc2xpZGVzVG9TaG93KS5hZGRDbGFzcyhcInNsaWNrLWNlbnRlclwiKTphPT09Yi5zbGlkZUNvdW50LTEmJmQuZXEoYi5vcHRpb25zLnNsaWRlc1RvU2hvdykuYWRkQ2xhc3MoXCJzbGljay1jZW50ZXJcIikpLGIuJHNsaWRlcy5lcShhKS5hZGRDbGFzcyhcInNsaWNrLWNlbnRlclwiKSk6YT49MCYmYTw9Yi5zbGlkZUNvdW50LWIub3B0aW9ucy5zbGlkZXNUb1Nob3c/Yi4kc2xpZGVzLnNsaWNlKGEsYStiLm9wdGlvbnMuc2xpZGVzVG9TaG93KS5hZGRDbGFzcyhcInNsaWNrLWFjdGl2ZVwiKS5hdHRyKFwiYXJpYS1oaWRkZW5cIixcImZhbHNlXCIpOmQubGVuZ3RoPD1iLm9wdGlvbnMuc2xpZGVzVG9TaG93P2QuYWRkQ2xhc3MoXCJzbGljay1hY3RpdmVcIikuYXR0cihcImFyaWEtaGlkZGVuXCIsXCJmYWxzZVwiKTooZj1iLnNsaWRlQ291bnQlYi5vcHRpb25zLnNsaWRlc1RvU2hvdyxlPWIub3B0aW9ucy5pbmZpbml0ZT09PSEwP2Iub3B0aW9ucy5zbGlkZXNUb1Nob3crYTphLGIub3B0aW9ucy5zbGlkZXNUb1Nob3c9PWIub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCYmYi5zbGlkZUNvdW50LWE8Yi5vcHRpb25zLnNsaWRlc1RvU2hvdz9kLnNsaWNlKGUtKGIub3B0aW9ucy5zbGlkZXNUb1Nob3ctZiksZStmKS5hZGRDbGFzcyhcInNsaWNrLWFjdGl2ZVwiKS5hdHRyKFwiYXJpYS1oaWRkZW5cIixcImZhbHNlXCIpOmQuc2xpY2UoZSxlK2Iub3B0aW9ucy5zbGlkZXNUb1Nob3cpLmFkZENsYXNzKFwic2xpY2stYWN0aXZlXCIpLmF0dHIoXCJhcmlhLWhpZGRlblwiLFwiZmFsc2VcIikpLFwib25kZW1hbmRcIj09PWIub3B0aW9ucy5sYXp5TG9hZCYmYi5sYXp5TG9hZCgpfSxiLnByb3RvdHlwZS5zZXR1cEluZmluaXRlPWZ1bmN0aW9uKCl7dmFyIGMsZCxlLGI9dGhpcztpZihiLm9wdGlvbnMuZmFkZT09PSEwJiYoYi5vcHRpb25zLmNlbnRlck1vZGU9ITEpLGIub3B0aW9ucy5pbmZpbml0ZT09PSEwJiZiLm9wdGlvbnMuZmFkZT09PSExJiYoZD1udWxsLGIuc2xpZGVDb3VudD5iLm9wdGlvbnMuc2xpZGVzVG9TaG93KSl7Zm9yKGU9Yi5vcHRpb25zLmNlbnRlck1vZGU9PT0hMD9iLm9wdGlvbnMuc2xpZGVzVG9TaG93KzE6Yi5vcHRpb25zLnNsaWRlc1RvU2hvdyxjPWIuc2xpZGVDb3VudDtjPmIuc2xpZGVDb3VudC1lO2MtPTEpZD1jLTEsYShiLiRzbGlkZXNbZF0pLmNsb25lKCEwKS5hdHRyKFwiaWRcIixcIlwiKS5hdHRyKFwiZGF0YS1zbGljay1pbmRleFwiLGQtYi5zbGlkZUNvdW50KS5wcmVwZW5kVG8oYi4kc2xpZGVUcmFjaykuYWRkQ2xhc3MoXCJzbGljay1jbG9uZWRcIik7Zm9yKGM9MDtlPmM7Yys9MSlkPWMsYShiLiRzbGlkZXNbZF0pLmNsb25lKCEwKS5hdHRyKFwiaWRcIixcIlwiKS5hdHRyKFwiZGF0YS1zbGljay1pbmRleFwiLGQrYi5zbGlkZUNvdW50KS5hcHBlbmRUbyhiLiRzbGlkZVRyYWNrKS5hZGRDbGFzcyhcInNsaWNrLWNsb25lZFwiKTtiLiRzbGlkZVRyYWNrLmZpbmQoXCIuc2xpY2stY2xvbmVkXCIpLmZpbmQoXCJbaWRdXCIpLmVhY2goZnVuY3Rpb24oKXthKHRoaXMpLmF0dHIoXCJpZFwiLFwiXCIpfSl9fSxiLnByb3RvdHlwZS5pbnRlcnJ1cHQ9ZnVuY3Rpb24oYSl7dmFyIGI9dGhpczthfHxiLmF1dG9QbGF5KCksYi5pbnRlcnJ1cHRlZD1hfSxiLnByb3RvdHlwZS5zZWxlY3RIYW5kbGVyPWZ1bmN0aW9uKGIpe3ZhciBjPXRoaXMsZD1hKGIudGFyZ2V0KS5pcyhcIi5zbGljay1zbGlkZVwiKT9hKGIudGFyZ2V0KTphKGIudGFyZ2V0KS5wYXJlbnRzKFwiLnNsaWNrLXNsaWRlXCIpLGU9cGFyc2VJbnQoZC5hdHRyKFwiZGF0YS1zbGljay1pbmRleFwiKSk7cmV0dXJuIGV8fChlPTApLGMuc2xpZGVDb3VudDw9Yy5vcHRpb25zLnNsaWRlc1RvU2hvdz8oYy5zZXRTbGlkZUNsYXNzZXMoZSksdm9pZCBjLmFzTmF2Rm9yKGUpKTp2b2lkIGMuc2xpZGVIYW5kbGVyKGUpfSxiLnByb3RvdHlwZS5zbGlkZUhhbmRsZXI9ZnVuY3Rpb24oYSxiLGMpe3ZhciBkLGUsZixnLGosaD1udWxsLGk9dGhpcztyZXR1cm4gYj1ifHwhMSxpLmFuaW1hdGluZz09PSEwJiZpLm9wdGlvbnMud2FpdEZvckFuaW1hdGU9PT0hMHx8aS5vcHRpb25zLmZhZGU9PT0hMCYmaS5jdXJyZW50U2xpZGU9PT1hfHxpLnNsaWRlQ291bnQ8PWkub3B0aW9ucy5zbGlkZXNUb1Nob3c/dm9pZCAwOihiPT09ITEmJmkuYXNOYXZGb3IoYSksZD1hLGg9aS5nZXRMZWZ0KGQpLGc9aS5nZXRMZWZ0KGkuY3VycmVudFNsaWRlKSxpLmN1cnJlbnRMZWZ0PW51bGw9PT1pLnN3aXBlTGVmdD9nOmkuc3dpcGVMZWZ0LGkub3B0aW9ucy5pbmZpbml0ZT09PSExJiZpLm9wdGlvbnMuY2VudGVyTW9kZT09PSExJiYoMD5hfHxhPmkuZ2V0RG90Q291bnQoKSppLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwpP3ZvaWQoaS5vcHRpb25zLmZhZGU9PT0hMSYmKGQ9aS5jdXJyZW50U2xpZGUsYyE9PSEwP2kuYW5pbWF0ZVNsaWRlKGcsZnVuY3Rpb24oKXtpLnBvc3RTbGlkZShkKX0pOmkucG9zdFNsaWRlKGQpKSk6aS5vcHRpb25zLmluZmluaXRlPT09ITEmJmkub3B0aW9ucy5jZW50ZXJNb2RlPT09ITAmJigwPmF8fGE+aS5zbGlkZUNvdW50LWkub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCk/dm9pZChpLm9wdGlvbnMuZmFkZT09PSExJiYoZD1pLmN1cnJlbnRTbGlkZSxjIT09ITA/aS5hbmltYXRlU2xpZGUoZyxmdW5jdGlvbigpe2kucG9zdFNsaWRlKGQpfSk6aS5wb3N0U2xpZGUoZCkpKTooaS5vcHRpb25zLmF1dG9wbGF5JiZjbGVhckludGVydmFsKGkuYXV0b1BsYXlUaW1lciksZT0wPmQ/aS5zbGlkZUNvdW50JWkub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCE9PTA/aS5zbGlkZUNvdW50LWkuc2xpZGVDb3VudCVpLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGw6aS5zbGlkZUNvdW50K2Q6ZD49aS5zbGlkZUNvdW50P2kuc2xpZGVDb3VudCVpLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwhPT0wPzA6ZC1pLnNsaWRlQ291bnQ6ZCxpLmFuaW1hdGluZz0hMCxpLiRzbGlkZXIudHJpZ2dlcihcImJlZm9yZUNoYW5nZVwiLFtpLGkuY3VycmVudFNsaWRlLGVdKSxmPWkuY3VycmVudFNsaWRlLGkuY3VycmVudFNsaWRlPWUsaS5zZXRTbGlkZUNsYXNzZXMoaS5jdXJyZW50U2xpZGUpLGkub3B0aW9ucy5hc05hdkZvciYmKGo9aS5nZXROYXZUYXJnZXQoKSxqPWouc2xpY2soXCJnZXRTbGlja1wiKSxqLnNsaWRlQ291bnQ8PWoub3B0aW9ucy5zbGlkZXNUb1Nob3cmJmouc2V0U2xpZGVDbGFzc2VzKGkuY3VycmVudFNsaWRlKSksaS51cGRhdGVEb3RzKCksaS51cGRhdGVBcnJvd3MoKSxpLm9wdGlvbnMuZmFkZT09PSEwPyhjIT09ITA/KGkuZmFkZVNsaWRlT3V0KGYpLGkuZmFkZVNsaWRlKGUsZnVuY3Rpb24oKXtpLnBvc3RTbGlkZShlKX0pKTppLnBvc3RTbGlkZShlKSx2b2lkIGkuYW5pbWF0ZUhlaWdodCgpKTp2b2lkKGMhPT0hMD9pLmFuaW1hdGVTbGlkZShoLGZ1bmN0aW9uKCl7aS5wb3N0U2xpZGUoZSl9KTppLnBvc3RTbGlkZShlKSkpKX0sYi5wcm90b3R5cGUuc3RhcnRMb2FkPWZ1bmN0aW9uKCl7dmFyIGE9dGhpczthLm9wdGlvbnMuYXJyb3dzPT09ITAmJmEuc2xpZGVDb3VudD5hLm9wdGlvbnMuc2xpZGVzVG9TaG93JiYoYS4kcHJldkFycm93LmhpZGUoKSxhLiRuZXh0QXJyb3cuaGlkZSgpKSxhLm9wdGlvbnMuZG90cz09PSEwJiZhLnNsaWRlQ291bnQ+YS5vcHRpb25zLnNsaWRlc1RvU2hvdyYmYS4kZG90cy5oaWRlKCksYS4kc2xpZGVyLmFkZENsYXNzKFwic2xpY2stbG9hZGluZ1wiKX0sYi5wcm90b3R5cGUuc3dpcGVEaXJlY3Rpb249ZnVuY3Rpb24oKXt2YXIgYSxiLGMsZCxlPXRoaXM7cmV0dXJuIGE9ZS50b3VjaE9iamVjdC5zdGFydFgtZS50b3VjaE9iamVjdC5jdXJYLGI9ZS50b3VjaE9iamVjdC5zdGFydFktZS50b3VjaE9iamVjdC5jdXJZLGM9TWF0aC5hdGFuMihiLGEpLGQ9TWF0aC5yb3VuZCgxODAqYy9NYXRoLlBJKSwwPmQmJihkPTM2MC1NYXRoLmFicyhkKSksNDU+PWQmJmQ+PTA/ZS5vcHRpb25zLnJ0bD09PSExP1wibGVmdFwiOlwicmlnaHRcIjozNjA+PWQmJmQ+PTMxNT9lLm9wdGlvbnMucnRsPT09ITE/XCJsZWZ0XCI6XCJyaWdodFwiOmQ+PTEzNSYmMjI1Pj1kP2Uub3B0aW9ucy5ydGw9PT0hMT9cInJpZ2h0XCI6XCJsZWZ0XCI6ZS5vcHRpb25zLnZlcnRpY2FsU3dpcGluZz09PSEwP2Q+PTM1JiYxMzU+PWQ/XCJkb3duXCI6XCJ1cFwiOlwidmVydGljYWxcIn0sYi5wcm90b3R5cGUuc3dpcGVFbmQ9ZnVuY3Rpb24oYSl7dmFyIGMsZCxiPXRoaXM7aWYoYi5kcmFnZ2luZz0hMSxiLmludGVycnVwdGVkPSExLGIuc2hvdWxkQ2xpY2s9Yi50b3VjaE9iamVjdC5zd2lwZUxlbmd0aD4xMD8hMTohMCx2b2lkIDA9PT1iLnRvdWNoT2JqZWN0LmN1clgpcmV0dXJuITE7aWYoYi50b3VjaE9iamVjdC5lZGdlSGl0PT09ITAmJmIuJHNsaWRlci50cmlnZ2VyKFwiZWRnZVwiLFtiLGIuc3dpcGVEaXJlY3Rpb24oKV0pLGIudG91Y2hPYmplY3Quc3dpcGVMZW5ndGg+PWIudG91Y2hPYmplY3QubWluU3dpcGUpe3N3aXRjaChkPWIuc3dpcGVEaXJlY3Rpb24oKSl7Y2FzZVwibGVmdFwiOmNhc2VcImRvd25cIjpjPWIub3B0aW9ucy5zd2lwZVRvU2xpZGU/Yi5jaGVja05hdmlnYWJsZShiLmN1cnJlbnRTbGlkZStiLmdldFNsaWRlQ291bnQoKSk6Yi5jdXJyZW50U2xpZGUrYi5nZXRTbGlkZUNvdW50KCksYi5jdXJyZW50RGlyZWN0aW9uPTA7YnJlYWs7Y2FzZVwicmlnaHRcIjpjYXNlXCJ1cFwiOmM9Yi5vcHRpb25zLnN3aXBlVG9TbGlkZT9iLmNoZWNrTmF2aWdhYmxlKGIuY3VycmVudFNsaWRlLWIuZ2V0U2xpZGVDb3VudCgpKTpiLmN1cnJlbnRTbGlkZS1iLmdldFNsaWRlQ291bnQoKSxiLmN1cnJlbnREaXJlY3Rpb249MX1cInZlcnRpY2FsXCIhPWQmJihiLnNsaWRlSGFuZGxlcihjKSxiLnRvdWNoT2JqZWN0PXt9LGIuJHNsaWRlci50cmlnZ2VyKFwic3dpcGVcIixbYixkXSkpfWVsc2UgYi50b3VjaE9iamVjdC5zdGFydFghPT1iLnRvdWNoT2JqZWN0LmN1clgmJihiLnNsaWRlSGFuZGxlcihiLmN1cnJlbnRTbGlkZSksYi50b3VjaE9iamVjdD17fSl9LGIucHJvdG90eXBlLnN3aXBlSGFuZGxlcj1mdW5jdGlvbihhKXt2YXIgYj10aGlzO2lmKCEoYi5vcHRpb25zLnN3aXBlPT09ITF8fFwib250b3VjaGVuZFwiaW4gZG9jdW1lbnQmJmIub3B0aW9ucy5zd2lwZT09PSExfHxiLm9wdGlvbnMuZHJhZ2dhYmxlPT09ITEmJi0xIT09YS50eXBlLmluZGV4T2YoXCJtb3VzZVwiKSkpc3dpdGNoKGIudG91Y2hPYmplY3QuZmluZ2VyQ291bnQ9YS5vcmlnaW5hbEV2ZW50JiZ2b2lkIDAhPT1hLm9yaWdpbmFsRXZlbnQudG91Y2hlcz9hLm9yaWdpbmFsRXZlbnQudG91Y2hlcy5sZW5ndGg6MSxiLnRvdWNoT2JqZWN0Lm1pblN3aXBlPWIubGlzdFdpZHRoL2Iub3B0aW9ucy50b3VjaFRocmVzaG9sZCxiLm9wdGlvbnMudmVydGljYWxTd2lwaW5nPT09ITAmJihiLnRvdWNoT2JqZWN0Lm1pblN3aXBlPWIubGlzdEhlaWdodC9iLm9wdGlvbnMudG91Y2hUaHJlc2hvbGQpLGEuZGF0YS5hY3Rpb24pe2Nhc2VcInN0YXJ0XCI6Yi5zd2lwZVN0YXJ0KGEpO2JyZWFrO2Nhc2VcIm1vdmVcIjpiLnN3aXBlTW92ZShhKTticmVhaztjYXNlXCJlbmRcIjpiLnN3aXBlRW5kKGEpfX0sYi5wcm90b3R5cGUuc3dpcGVNb3ZlPWZ1bmN0aW9uKGEpe3ZhciBkLGUsZixnLGgsYj10aGlzO3JldHVybiBoPXZvaWQgMCE9PWEub3JpZ2luYWxFdmVudD9hLm9yaWdpbmFsRXZlbnQudG91Y2hlczpudWxsLCFiLmRyYWdnaW5nfHxoJiYxIT09aC5sZW5ndGg/ITE6KGQ9Yi5nZXRMZWZ0KGIuY3VycmVudFNsaWRlKSxiLnRvdWNoT2JqZWN0LmN1clg9dm9pZCAwIT09aD9oWzBdLnBhZ2VYOmEuY2xpZW50WCxiLnRvdWNoT2JqZWN0LmN1clk9dm9pZCAwIT09aD9oWzBdLnBhZ2VZOmEuY2xpZW50WSxiLnRvdWNoT2JqZWN0LnN3aXBlTGVuZ3RoPU1hdGgucm91bmQoTWF0aC5zcXJ0KE1hdGgucG93KGIudG91Y2hPYmplY3QuY3VyWC1iLnRvdWNoT2JqZWN0LnN0YXJ0WCwyKSkpLGIub3B0aW9ucy52ZXJ0aWNhbFN3aXBpbmc9PT0hMCYmKGIudG91Y2hPYmplY3Quc3dpcGVMZW5ndGg9TWF0aC5yb3VuZChNYXRoLnNxcnQoTWF0aC5wb3coYi50b3VjaE9iamVjdC5jdXJZLWIudG91Y2hPYmplY3Quc3RhcnRZLDIpKSkpLGU9Yi5zd2lwZURpcmVjdGlvbigpLFwidmVydGljYWxcIiE9PWU/KHZvaWQgMCE9PWEub3JpZ2luYWxFdmVudCYmYi50b3VjaE9iamVjdC5zd2lwZUxlbmd0aD40JiZhLnByZXZlbnREZWZhdWx0KCksZz0oYi5vcHRpb25zLnJ0bD09PSExPzE6LTEpKihiLnRvdWNoT2JqZWN0LmN1clg+Yi50b3VjaE9iamVjdC5zdGFydFg/MTotMSksYi5vcHRpb25zLnZlcnRpY2FsU3dpcGluZz09PSEwJiYoZz1iLnRvdWNoT2JqZWN0LmN1clk+Yi50b3VjaE9iamVjdC5zdGFydFk/MTotMSksZj1iLnRvdWNoT2JqZWN0LnN3aXBlTGVuZ3RoLGIudG91Y2hPYmplY3QuZWRnZUhpdD0hMSxiLm9wdGlvbnMuaW5maW5pdGU9PT0hMSYmKDA9PT1iLmN1cnJlbnRTbGlkZSYmXCJyaWdodFwiPT09ZXx8Yi5jdXJyZW50U2xpZGU+PWIuZ2V0RG90Q291bnQoKSYmXCJsZWZ0XCI9PT1lKSYmKGY9Yi50b3VjaE9iamVjdC5zd2lwZUxlbmd0aCpiLm9wdGlvbnMuZWRnZUZyaWN0aW9uLGIudG91Y2hPYmplY3QuZWRnZUhpdD0hMCksYi5vcHRpb25zLnZlcnRpY2FsPT09ITE/Yi5zd2lwZUxlZnQ9ZCtmKmc6Yi5zd2lwZUxlZnQ9ZCtmKihiLiRsaXN0LmhlaWdodCgpL2IubGlzdFdpZHRoKSpnLGIub3B0aW9ucy52ZXJ0aWNhbFN3aXBpbmc9PT0hMCYmKGIuc3dpcGVMZWZ0PWQrZipnKSxiLm9wdGlvbnMuZmFkZT09PSEwfHxiLm9wdGlvbnMudG91Y2hNb3ZlPT09ITE/ITE6Yi5hbmltYXRpbmc9PT0hMD8oYi5zd2lwZUxlZnQ9bnVsbCwhMSk6dm9pZCBiLnNldENTUyhiLnN3aXBlTGVmdCkpOnZvaWQgMCl9LGIucHJvdG90eXBlLnN3aXBlU3RhcnQ9ZnVuY3Rpb24oYSl7dmFyIGMsYj10aGlzO3JldHVybiBiLmludGVycnVwdGVkPSEwLDEhPT1iLnRvdWNoT2JqZWN0LmZpbmdlckNvdW50fHxiLnNsaWRlQ291bnQ8PWIub3B0aW9ucy5zbGlkZXNUb1Nob3c/KGIudG91Y2hPYmplY3Q9e30sITEpOih2b2lkIDAhPT1hLm9yaWdpbmFsRXZlbnQmJnZvaWQgMCE9PWEub3JpZ2luYWxFdmVudC50b3VjaGVzJiYoYz1hLm9yaWdpbmFsRXZlbnQudG91Y2hlc1swXSksYi50b3VjaE9iamVjdC5zdGFydFg9Yi50b3VjaE9iamVjdC5jdXJYPXZvaWQgMCE9PWM/Yy5wYWdlWDphLmNsaWVudFgsYi50b3VjaE9iamVjdC5zdGFydFk9Yi50b3VjaE9iamVjdC5jdXJZPXZvaWQgMCE9PWM/Yy5wYWdlWTphLmNsaWVudFksdm9pZChiLmRyYWdnaW5nPSEwKSl9LGIucHJvdG90eXBlLnVuZmlsdGVyU2xpZGVzPWIucHJvdG90eXBlLnNsaWNrVW5maWx0ZXI9ZnVuY3Rpb24oKXt2YXIgYT10aGlzO251bGwhPT1hLiRzbGlkZXNDYWNoZSYmKGEudW5sb2FkKCksYS4kc2xpZGVUcmFjay5jaGlsZHJlbih0aGlzLm9wdGlvbnMuc2xpZGUpLmRldGFjaCgpLGEuJHNsaWRlc0NhY2hlLmFwcGVuZFRvKGEuJHNsaWRlVHJhY2spLGEucmVpbml0KCkpfSxiLnByb3RvdHlwZS51bmxvYWQ9ZnVuY3Rpb24oKXt2YXIgYj10aGlzO2EoXCIuc2xpY2stY2xvbmVkXCIsYi4kc2xpZGVyKS5yZW1vdmUoKSxiLiRkb3RzJiZiLiRkb3RzLnJlbW92ZSgpLGIuJHByZXZBcnJvdyYmYi5odG1sRXhwci50ZXN0KGIub3B0aW9ucy5wcmV2QXJyb3cpJiZiLiRwcmV2QXJyb3cucmVtb3ZlKCksYi4kbmV4dEFycm93JiZiLmh0bWxFeHByLnRlc3QoYi5vcHRpb25zLm5leHRBcnJvdykmJmIuJG5leHRBcnJvdy5yZW1vdmUoKSxiLiRzbGlkZXMucmVtb3ZlQ2xhc3MoXCJzbGljay1zbGlkZSBzbGljay1hY3RpdmUgc2xpY2stdmlzaWJsZSBzbGljay1jdXJyZW50XCIpLmF0dHIoXCJhcmlhLWhpZGRlblwiLFwidHJ1ZVwiKS5jc3MoXCJ3aWR0aFwiLFwiXCIpfSxiLnByb3RvdHlwZS51bnNsaWNrPWZ1bmN0aW9uKGEpe3ZhciBiPXRoaXM7Yi4kc2xpZGVyLnRyaWdnZXIoXCJ1bnNsaWNrXCIsW2IsYV0pLGIuZGVzdHJveSgpfSxiLnByb3RvdHlwZS51cGRhdGVBcnJvd3M9ZnVuY3Rpb24oKXt2YXIgYixhPXRoaXM7Yj1NYXRoLmZsb29yKGEub3B0aW9ucy5zbGlkZXNUb1Nob3cvMiksYS5vcHRpb25zLmFycm93cz09PSEwJiZhLnNsaWRlQ291bnQ+YS5vcHRpb25zLnNsaWRlc1RvU2hvdyYmIWEub3B0aW9ucy5pbmZpbml0ZSYmKGEuJHByZXZBcnJvdy5yZW1vdmVDbGFzcyhcInNsaWNrLWRpc2FibGVkXCIpLmF0dHIoXCJhcmlhLWRpc2FibGVkXCIsXCJmYWxzZVwiKSxhLiRuZXh0QXJyb3cucmVtb3ZlQ2xhc3MoXCJzbGljay1kaXNhYmxlZFwiKS5hdHRyKFwiYXJpYS1kaXNhYmxlZFwiLFwiZmFsc2VcIiksMD09PWEuY3VycmVudFNsaWRlPyhhLiRwcmV2QXJyb3cuYWRkQ2xhc3MoXCJzbGljay1kaXNhYmxlZFwiKS5hdHRyKFwiYXJpYS1kaXNhYmxlZFwiLFwidHJ1ZVwiKSxhLiRuZXh0QXJyb3cucmVtb3ZlQ2xhc3MoXCJzbGljay1kaXNhYmxlZFwiKS5hdHRyKFwiYXJpYS1kaXNhYmxlZFwiLFwiZmFsc2VcIikpOmEuY3VycmVudFNsaWRlPj1hLnNsaWRlQ291bnQtYS5vcHRpb25zLnNsaWRlc1RvU2hvdyYmYS5vcHRpb25zLmNlbnRlck1vZGU9PT0hMT8oYS4kbmV4dEFycm93LmFkZENsYXNzKFwic2xpY2stZGlzYWJsZWRcIikuYXR0cihcImFyaWEtZGlzYWJsZWRcIixcInRydWVcIiksYS4kcHJldkFycm93LnJlbW92ZUNsYXNzKFwic2xpY2stZGlzYWJsZWRcIikuYXR0cihcImFyaWEtZGlzYWJsZWRcIixcImZhbHNlXCIpKTphLmN1cnJlbnRTbGlkZT49YS5zbGlkZUNvdW50LTEmJmEub3B0aW9ucy5jZW50ZXJNb2RlPT09ITAmJihhLiRuZXh0QXJyb3cuYWRkQ2xhc3MoXCJzbGljay1kaXNhYmxlZFwiKS5hdHRyKFwiYXJpYS1kaXNhYmxlZFwiLFwidHJ1ZVwiKSxhLiRwcmV2QXJyb3cucmVtb3ZlQ2xhc3MoXCJzbGljay1kaXNhYmxlZFwiKS5hdHRyKFwiYXJpYS1kaXNhYmxlZFwiLFwiZmFsc2VcIikpKX0sYi5wcm90b3R5cGUudXBkYXRlRG90cz1mdW5jdGlvbigpe3ZhciBhPXRoaXM7bnVsbCE9PWEuJGRvdHMmJihhLiRkb3RzLmZpbmQoXCJsaVwiKS5yZW1vdmVDbGFzcyhcInNsaWNrLWFjdGl2ZVwiKS5hdHRyKFwiYXJpYS1oaWRkZW5cIixcInRydWVcIiksYS4kZG90cy5maW5kKFwibGlcIikuZXEoTWF0aC5mbG9vcihhLmN1cnJlbnRTbGlkZS9hLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwpKS5hZGRDbGFzcyhcInNsaWNrLWFjdGl2ZVwiKS5hdHRyKFwiYXJpYS1oaWRkZW5cIixcImZhbHNlXCIpKX0sYi5wcm90b3R5cGUudmlzaWJpbGl0eT1mdW5jdGlvbigpe3ZhciBhPXRoaXM7YS5vcHRpb25zLmF1dG9wbGF5JiYoZG9jdW1lbnRbYS5oaWRkZW5dP2EuaW50ZXJydXB0ZWQ9ITA6YS5pbnRlcnJ1cHRlZD0hMSl9LGEuZm4uc2xpY2s9ZnVuY3Rpb24oKXt2YXIgZixnLGE9dGhpcyxjPWFyZ3VtZW50c1swXSxkPUFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywxKSxlPWEubGVuZ3RoO2ZvcihmPTA7ZT5mO2YrKylpZihcIm9iamVjdFwiPT10eXBlb2YgY3x8XCJ1bmRlZmluZWRcIj09dHlwZW9mIGM/YVtmXS5zbGljaz1uZXcgYihhW2ZdLGMpOmc9YVtmXS5zbGlja1tjXS5hcHBseShhW2ZdLnNsaWNrLGQpLFwidW5kZWZpbmVkXCIhPXR5cGVvZiBnKXJldHVybiBnO3JldHVybiBhfX0pOyIsIi8qKlxuICogSW5pdCBIZXJvIHNsaWRlcnMuXG4gKlxuICogVGhpcyBqdXN0IHRha2VzIGFsbCB0aGUgc2xpZGVycyBwbGFjZXMgb24gdGhlIHBhZ2VcbiAqIGFuZCBpbml0aWF0ZXMgU2xpY2sgSlMgdG8gYW5pbWF0ZSBhbmQgc2xpZGUgdGhlbS5cbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9ICQgalF1ZXJ5XG4gKi9cbiggZnVuY3Rpb24oICQgKSB7XG5cdC8vIEFueXRoaW5nIHdpdGggZGF0YSBhdHRhY2hlZCB0byBpdCwgc2xpY2sgaXQhXG5cdCQoICcuaGVybyAuc2xpZGVycycgKS5lYWNoKCBmdW5jdGlvbiggaSwgdiApIHtcblx0XHR2YXIgc3BlZWQgPSAkKCB0aGlzICkuYXR0ciggJ2RhdGEtc2xpZGVyLXNwZWVkJyApO1xuXG5cdFx0JCggdGhpcyApLnNsaWNrKCB7XG5cdFx0XHRzbGlkZXNUb1Nob3c6ICAgIDEsXG5cdFx0XHRzbGlkZXNUb1Njcm9sbDogIDEsXG5cdFx0XHRhdXRvcGxheTogICAgICAgIHRydWUsXG5cdFx0XHRhdXRvcGxheVNwZWVkOiAgIHNwZWVkICogMTAwMCxcblx0XHRcdGRvdHM6XHRcdFx0XHR0cnVlLFxuXHRcdFx0cHJldkFycm93OiAnJyxcblx0XHRcdG5leHRBcnJvdzogJycsXG5cdFx0fSApO1xuXHR9ICk7XG59ICkoIGpRdWVyeSApO1xuIiwiLyoqXG4gKiBGaWxlIHdpbmRvdy1yZWFkeS5qc1xuICpcbiAqIEFkZCBhIFwicmVhZHlcIiBjbGFzcyB0byA8Ym9keT4gd2hlbiB3aW5kb3cgaXMgcmVhZHkuXG4gKi9cbndpbmRvdy5XaW5kb3dfUmVhZHkgPSB7fTtcbiggZnVuY3Rpb24oIHdpbmRvdywgJCwgYXBwICkge1xuXG5cdC8vIENvbnN0cnVjdG9yLlxuXHRhcHAuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGFwcC5jYWNoZSgpO1xuXHRcdGFwcC5iaW5kRXZlbnRzKCk7XG5cdH07XG5cblx0Ly8gQ2FjaGUgZG9jdW1lbnQgZWxlbWVudHMuXG5cdGFwcC5jYWNoZSA9IGZ1bmN0aW9uKCkge1xuXHRcdGFwcC4kYyA9IHtcblx0XHRcdHdpbmRvdzogJCggd2luZG93ICksXG5cdFx0XHRib2R5OiAkKCBkb2N1bWVudC5ib2R5ICksXG5cdFx0fTtcblx0fTtcblxuXHQvLyBDb21iaW5lIGFsbCBldmVudHMuXG5cdGFwcC5iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0YXBwLiRjLndpbmRvdy5sb2FkKCBhcHAuYWRkQm9keUNsYXNzICk7XG5cdH07XG5cblx0Ly8gQWRkIGEgY2xhc3MgdG8gPGJvZHk+LlxuXHRhcHAuYWRkQm9keUNsYXNzID0gZnVuY3Rpb24oKSB7XG5cdFx0YXBwLiRjLmJvZHkuYWRkQ2xhc3MoICdyZWFkeScgKTtcblx0fTtcblxuXHQvLyBFbmdhZ2UhXG5cdCQoIGFwcC5pbml0ICk7XG5cbn0pKCB3aW5kb3csIGpRdWVyeSwgd2luZG93LldpbmRvd19SZWFkeSApOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
