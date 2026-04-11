/**
 * PremiereActions.js
 * A collection of functions for performing common actions in Premiere Pro
 * These will be mapped to natural language commands by the AI
 */

class PremiereActions {
    constructor() {
        this.csInterface = new CSInterface();
        this.presetList=null;
    }

    /**
     * Apply an effect to selected clips
     * @param {string} effectName - Name of the effect to apply
     * @returns {Promise<string>} - Result message
     */
    applyEffect(effectName) {
        return new Promise((resolve, reject) => {
            const script = `
                app.enableQE();
                applyEffectOnPRM("${effectName}");
            `;
            
            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }

    /**
     * Apply a preset to selected layers in the active composition
     * @param {string} presetName - Name of the preset to apply (Match Name or Name)
     * @returns {Promise<string>} - Result message
     */
    applyPreset(presetName) {

        var preset_path = "";
        if(this.presetList)
        {
            for(var i=0;i<this.presetList.length;i++)
            {
                if(this.presetList[i].name==presetName)
                {
                    preset_path = this.presetList[i].preset_path;
                    preset_path = preset_path.replace(/\\/g, "/");
                    break;
                }
            }
        }

        return new Promise((resolve, reject) => {

            const script = `
                
                var result = applyPresetToSelectedLayersOnPRM("${presetName.replace(/"/g, '\\"')}","${preset_path.replace(/"/g, '\\"')}");
                result;
                
               
                function getElementsByTagName(xmlNode, tagName) {
                    var result = [];
                
                    // Check if current node matches
                    if (xmlNode.name().localName == tagName || tagName === "*") {
                        
                        result.push(xmlNode);
                    }
                    // Iterate over all children recursively
                    for(var i=0;i<xmlNode.*.length();i++)
                    {
                        var child = xmlNode.*[i];
                        if (child.nodeKind() === "element")
                        {
                            result = result.concat(getElementsByTagName(child, tagName));
                        }                            
                    }                
                    return result;
                }
                function displayElements(xmlNode, tagName) {
                    var result = [];
                
                    // Check if current node matches
                    if (xmlNode.name().localName == tagName || tagName === "*") {
                        alert(xmlNode.name().localName);
                        result.push(xmlNode);
                    }
                    // Iterate over all children recursively
                    for(var i=0;i<xmlNode.*.length();i++)
                    {
                        var child = xmlNode.*[i];
                        if (child.nodeKind() === "element")
                        {
                            result = result.concat(displayElements(child, tagName));
                        }                            
                    }                
                    return result;
                }
                function getFilterPresetItem(xmlDoc,ID)
                {                    
                    var filterPresetItems = xmlDoc..FilterPresetItem; // all FilterPresetItem nodes
                    
                    for each (var item in filterPresetItems)
                    {
                        if (item.hasOwnProperty("@ObjectID") && item["@ObjectID"].toString() === ID) 
                        {           
                            return item;
                        }
                    }
                    return null;
                }
                function getFilterPreset(xmlDoc,ID)
                {                    
                    var filterPresets = xmlDoc..FilterPreset; // all FilterPreset nodes
                    
                    for each (var item in filterPresets)
                    {
                        if (item.hasOwnProperty("@ObjectID") && item["@ObjectID"].toString() === ID) 
                        {           
                            return item;
                        }
                    }
                    return null;
                }
                function getFilterComponent(xmlDoc,ID)
                {                    
                    var filterComponents = xmlDoc..VideoFilterComponent; // all VideoFilterComponent nodes
                    
                    for each (var item in filterComponents)
                    {
                        if (item.hasOwnProperty("@ObjectID") && item["@ObjectID"].toString() === ID) 
                        {           
                            return item;
                        }
                    }
                    return null;
                }
                function getFilterComponentParam(xmlDoc,paramIDs)
                {                    
                    var filterComponentParams = xmlDoc..VideoComponentParam; // all VideoFilterComponent nodes
                    var foundParams=[];
                    for each (var item in filterComponentParams)
                    {
                        if (item.hasOwnProperty("@ObjectID")) 
                        {   
                            for(var i=0;i<paramIDs.length;i++)
                            {
                                if(item["@ObjectID"].toString() === paramIDs[i])
                                {
                                    foundParams.push({item:item,id:paramIDs[i]});                                    
                                    paramIDs = paramIDs.slice(0, i).concat(paramIDs.slice(i + 1));
                                    if(paramIDs.length==0) return foundParams;
                                    break;
                                }
                            }
                        }
                    }
                    
                    filterComponentParams = xmlDoc..PointComponentParam; // all VideoFilterComponent nodes
                    
                    for each (var item in filterComponentParams)
                    {
                        if (item.hasOwnProperty("@ObjectID")) 
                        {           
                            for(var i=0;i<paramIDs.length;i++)
                            {
                                if(item["@ObjectID"].toString() === paramIDs[i])
                                {
                                    foundParams.push({item:item,id:paramIDs[i]});                                    
                                    paramIDs = paramIDs.slice(0, i).concat(paramIDs.slice(i + 1));
                                    if(paramIDs.length==0) return foundParams;
                                    break;
                                }
                            }
                        }
                    }

                    filterComponentParams = xmlDoc..ArbVideoComponentParam; // all VideoFilterComponent nodes
                    
                    for each (var item in filterComponentParams)
                    {
                        if (item.hasOwnProperty("@ObjectID")) 
                        {           
                            for(var i=0;i<paramIDs.length;i++)
                            {
                                if(item["@ObjectID"].toString() === paramIDs[i])
                                {
                                    foundParams.push({item:item,id:paramIDs[i]});                                    
                                    paramIDs = paramIDs.slice(0, i).concat(paramIDs.slice(i + 1));
                                    if(paramIDs.length==0) return foundParams;
                                    break;
                                }
                            }
                        }
                    }

                    return foundParams;
                }
                function ParsePreset(xmlString,presetName)
                {                
                    var xmlDoc = new XML(xmlString);
                    var treeItems = xmlDoc..TreeItem; // all TreeItem nodes
                    
                    for each (var item in treeItems) {
                        
                        var name = getElementsByTagName(item,"Name")[0].toString();
                        if(name!=presetName) continue;
                        var preset={name:name};
                        var dataNode = getElementsByTagName(item,"Data")[0]; // first <Data> child
                        var dataRef = dataNode ? dataNode.@ObjectRef.toString() : "";
                        var filterPresetItem = getFilterPresetItem(xmlDoc,dataRef);
                        if (!filterPresetItem) continue;                       

                        var effects=[];
                        preset["effects"]=effects;
                        var filterPresets = getElementsByTagName(filterPresetItem,"FilterPreset");
                        for(var iPreset=0;iPreset<filterPresets.length;iPreset++)
                        {
                        
                            // FilterPreset
                            var filterPreset = null;
                            var filterPresetEl = filterPresets[iPreset];
                            if (filterPresetEl) {
                                var filterPresetRef = filterPresetEl.@ObjectRef.toString();
                                filterPreset = getFilterPreset(xmlDoc,filterPresetRef);
                            }
                            if (!filterPreset) continue;
                            var matchNameNode = getElementsByTagName(filterPreset,"FilterMatchName")[0];                          
                            var AnchorInPointNode = getElementsByTagName(filterPreset,"AnchorInPoint")[0]; 
                            var AnchorOutPointNode = getElementsByTagName(filterPreset,"AnchorOutPoint")[0]; 

                            // Component
                            var component = null;
                            var componentEl = getElementsByTagName(filterPreset,"Component")[0];
                            if (componentEl) {
                                var componentRef = componentEl.@ObjectRef.toString();
                                component = getFilterComponent(xmlDoc,componentRef);
                            }
                            if (!component) continue;
                            var params = [];
                            var paramEls = getElementsByTagName(component,"Param");
                            var paramIDs = [];
                            for (var p = 0; p < paramEls.length; p++)
                            {
                                var ref = paramEls[p].@ObjectRef.toString();
                                paramIDs.push(ref);
                            }
                            var foundParams = getFilterComponentParam(xmlDoc,paramIDs);
                            var arrangeParams=[];
                            for (var p = 0; p < paramIDs.length; p++)
                            {
                                for (var ifoundParam = 0; ifoundParam < foundParams.length; ifoundParam++)
                                {
                                    if(paramIDs[p]==foundParams[ifoundParam].id)
                                    {
                                        arrangeParams.push(foundParams[ifoundParam].item);
                                        break;
                                    }
                                }
                            }
                            for (var p = 0; p < arrangeParams.length; p++)
                            {
                                var param = arrangeParams[p];
                                if (param)
                                {
                                    var currentValue = getElementsByTagName(param,"CurrentValue")[0]?getElementsByTagName(param,"CurrentValue")[0].toString():"";
                                    if(getElementsByTagName(param,"StartKeyframe")[0])
                                    {
                                        currentValue = getElementsByTagName(param,"StartKeyframe")[0].toString().split(',')[1];
                                    }
                                    var ParameterControlType =  getElementsByTagName(param,"ParameterControlType")[0]?getElementsByTagName(param,"ParameterControlType")[0].toString():"0";
                                    var keyframes = [];
                                    var keyframeNode = getElementsByTagName(param,"Keyframes")[0];
                                    if(keyframeNode)
                                    {
                                        var keyframes_str = keyframeNode.toString();
                                        var keyframes_arr = keyframes_str.split(';');
                                        for(var iKeyframe = 0;iKeyframe<keyframes_arr.length;iKeyframe=iKeyframe+1)
                                        {
                                            var keyframe_time = keyframes_arr[iKeyframe].split(',')[0];
                                            var keyframe_value = keyframes_arr[iKeyframe].split(',')[1];
                                            if(keyframe_value) 
                                            {
                                                keyframes.push({time:keyframe_time,value:keyframe_value});
                                            }
                                            
                                        }
                                    }
                                    params.push({
                                        name: getElementsByTagName(param,"Name")[0]?getElementsByTagName(param,"Name")[0].toString():"",
                                        currentValue:currentValue,
                                        ParameterControlType:ParameterControlType,
                                        keyframes:keyframes
                                    });
    
                                }
                            }
                            var effect={matchName:matchNameNode ? matchNameNode.toString():"",params:params,AnchorInPoint: AnchorInPointNode ? AnchorInPointNode.toString():"0",AnchorOutPoint: AnchorOutPointNode ? AnchorOutPointNode.toString():"0"};
                            effects.push(effect);
                        }
                        return preset; 
                                          
                    }                   
  
                    return null;
                }               
               
            `;

            this.csInterface.evalScript(script, (result) => {
                // Basic check for success before resolving
                if (result && typeof result === 'string') {
                     if (result.startsWith("Applied")) {
                         resolve(result); // Return the detailed success message
                     } else {
                         resolve(result); // Pass through PR-specific errors or messages
                     }
                } else {
                     resolve("An unexpected error occurred during preset application."); // Generic error
                }
            });
        });
    }

    /**
     * Apply a transition between clips
     * @param {string} transitionName - Name of the transition to apply
     * @returns {Promise<string>} - Result message
     */
    applyTransition(transitionName) {
        return new Promise((resolve, reject) => {
            const script = `
                app.enableQE();
                var result = applyTransitionOnPRM("${transitionName}");
                result;
                
                function applyTransition(transitionName) {
                    try {
                        if(app.project.activeSequence == null) {
                            return "No active sequence";
                        }
                        
                        var qeSequence = qe.project.getActiveSequence(0);
                        var sequence = app.project.activeSequence;
                        var videoTracks = sequence.videoTracks;
                        var transitionApplied = false;
                        
                        // Get transition object
                        var transition = qe.project.getVideoTransitionByName(transitionName);
                        if (!transition) {
                            return "Transition not found: " + transitionName;
                        }
                        
                        // Default duration: 1 second (in ticks format)
                        var duration = '00:00:01:00';
                        
                        // Get selected clips
                        var selectedClips = [];
                        var thisQETrack, thisVanillaClip;
                        
                        for(var i = 0; i < videoTracks.numTracks; i++) {
                            thisQETrack = qeSequence.getVideoTrackAt(i);
                            for(var e = 0; e < thisQETrack.numItems; e++) {
                                if(thisQETrack.getItemAt(e).type.toString() !== "Empty") {
                                    thisVanillaClip = getVanillaClip(thisQETrack.getItemAt(e), i);
                                    if(thisVanillaClip !== null && thisVanillaClip.isSelected() === true) {
                                        selectedClips.push({
                                            vanillaClip: thisVanillaClip, 
                                            qeClip: thisQETrack.getItemAt(e),
                                            trackIndex: i,
                                            itemIndex: e
                                        });
                                    }
                                }
                            }
                        }
                        
                        // Apply transition to the selected clips
                        if(selectedClips.length === 1) {
                            try {
                                var clip = selectedClips[0];
                                var qeItem = clip.qeClip;
                                
                                // Apply transition at beginning of clip
                                qeItem.addTransition(transition, true, duration);
                                transitionApplied = true;
                                return "Transition applied to beginning of clip";
                            } catch (transError) {
                                return "Error applying transition: " + transError.toString();
                            }
                        } else if(selectedClips.length === 2) {
                            try {
                                // Sort clips by position on timeline
                                selectedClips.sort(function(a, b) {
                                    return a.qeClip.start.ticks - b.qeClip.start.ticks;
                                });
                                
                                var clip1 = selectedClips[0];
                                var clip2 = selectedClips[1];
                                
                                // Check if they're on the same track (required for transitions)
                                if(clip1.trackIndex !== clip2.trackIndex) {
                                    return "Selected clips must be on the same track";
                                }
                                
                                // Apply transition at the cut point
                                clip1.qeClip.addTransition(transition, false, duration);
                                transitionApplied = true;
                                return "Transition applied between selected clips";
                            } catch (transError) {
                                return "Error applying transition: " + transError.toString();
                            }
                        } else {
                            return "Please select one clip (for start transition) or two clips (for transition between them)";
                        }
                    } catch (e) {
                        return "Error: " + e.toString();
                    }
                }
                
                function getVanillaClip(qeClip, trackIndex) {
                    try {
                        for(var c = 0; c < app.project.activeSequence.videoTracks[trackIndex].clips.numItems; c++) {
                            if(app.project.activeSequence.videoTracks[trackIndex].clips[c].name == qeClip.name && 
                              ((app.project.activeSequence.videoTracks[trackIndex].clips[c].end.seconds - 
                                app.project.activeSequence.videoTracks[trackIndex].clips[c].start.seconds).toFixed(2) == 
                               (qeClip.end.secs - qeClip.start.secs).toFixed(2))) {
                                return app.project.activeSequence.videoTracks[trackIndex].clips[c];
                            }
                        }
                        return null;
                    } catch (e) {
                        return null;
                    }
                }
            `;
            
            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }

    /**
     * Delete selected clips from the timeline
     * @returns {Promise<string>} - Result message
     */
    deleteSelectedClips() {
        return new Promise((resolve, reject) => {
            const script = `
                app.enableQE();
                var result = deleteSelectedClips();
                result;
                
                function deleteSelectedClips() {
                    try {
                        if(app.project.activeSequence == null) {
                            return "No active sequence";
                        }
                        
                        var sequence = app.project.activeSequence;
                        var clipsDeleted = 0;
                        
                        // Function to delete selected clips from a track
                        function deleteSelectedFromTrack(track) {
                            var clipsToDelete = [];
                            
                            // First, gather all selected clips
                            // We need to do this first because deleting while iterating causes problems
                            for(var i = 0; i < track.clips.numItems; i++) {
                                var clip = track.clips[i];
                                if(clip.isSelected()) {
                                    clipsToDelete.push(clip);
                                }
                            }
                            
                            // Now delete them
                            for(var j = 0; j < clipsToDelete.length; j++) {
                                clipsToDelete[j].remove(false, false);  // clearInOut=false, ripple=false
                                clipsDeleted++;
                            }
                            
                            return clipsToDelete.length;
                        }
                        
                        // Process video tracks
                        for(var i = 0; i < sequence.videoTracks.numTracks; i++) {
                            deleteSelectedFromTrack(sequence.videoTracks[i]);
                        }
                        
                        // Process audio tracks
                        for(var i = 0; i < sequence.audioTracks.numTracks; i++) {
                            deleteSelectedFromTrack(sequence.audioTracks[i]);
                        }
                        
                        return clipsDeleted > 0 ? 
                            clipsDeleted + " clip(s) deleted" : 
                            "No clips selected for deletion";
                    } catch (e) {
                        return "Error: " + e.toString();
                    }
                }
            `;
            
            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }

    /**
     * Cut the selected clip at the playhead position
     * @returns {Promise<string>} - Result message
     */
    cutClipAtPlayhead() {
        return new Promise((resolve, reject) => {
            const script = `
                app.enableQE();
                var result = cutClipAtPlayhead();
                result;
                
                function cutClipAtPlayhead() {
                    try {
                        if(app.project.activeSequence == null) {
                            return "No active sequence";
                        }
                        
                        var sequence = app.project.activeSequence;
                        var playheadPos = sequence.getPlayerPosition();
                        var clipsCut = 0;
                        
                        // Function to process a track
                        function cutSelectedInTrack(track) {
                            for(var i = 0; i < track.clips.numItems; i++) {
                                var clip = track.clips[i];
                                if(clip.isSelected()) {
                                    // Check if playhead is over this clip
                                    if(playheadPos.seconds > clip.start.seconds && 
                                       playheadPos.seconds < clip.end.seconds) {
                                        try {
                                            clip.split(playheadPos);
                                            clipsCut++;
                                        } catch (e) {
                                            // Some clips might not be cuttable
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Process video tracks
                        for(var i = 0; i < sequence.videoTracks.numTracks; i++) {
                            cutSelectedInTrack(sequence.videoTracks[i]);
                        }
                        
                        // Process audio tracks
                        for(var i = 0; i < sequence.audioTracks.numTracks; i++) {
                            cutSelectedInTrack(sequence.audioTracks[i]);
                        }
                        
                        return clipsCut > 0 ? 
                            clipsCut + " clip(s) cut at playhead" : 
                            "No clips cut. Make sure clips are selected and playhead is over them.";
                    } catch (e) {
                        return "Error: " + e.toString();
                    }
                }
            `;
            
            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }

    /**
     * Get a list of all available effects
     * @returns {Promise<string[]>} - Array of effect names
     */
    getAvailableEffects(effect) {
        return new Promise((resolve, reject) => {

            resolve(effect);
            return;
            // json2.js polyfill (minified) - include directly in the script string
            const json2Polyfill = `
                if(typeof JSON!=='object'){JSON={};}
                (function(){'use strict';function f(n){return n<10?'0'+n:n;}
                if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+f(this.getUTCMonth()+1)+'-'+f(this.getUTCDate())+'T'+f(this.getUTCHours())+':'+f(this.getUTCMinutes())+':'+f(this.getUTCSeconds())+'Z':null;};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}
                var cx=/[\\u0000\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]/g,escapable=/[\\\\\\"\\x00-\\x1f\\x7f-\\x9f\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]/g,gap,indent,meta={'\\b':'\\\\b','\\t':'\\\\t','\\n':'\\\\n','\\f':'\\\\f','\\r':'\\\\r','"':'\\\\"','\\\\':'\\\\\\\\'},rep;
                function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}
                function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
                if(typeof rep==='function'){value=rep.call(holder,key,value);}
                switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
                gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
                v=partial.length===0?'[]':gap?'[\\n'+gap+partial.join(',\\n'+gap)+'\\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v;}
                if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==='string'){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}
                v=partial.length===0?'{}':gap?'{\\n'+gap+partial.join(',\\n'+gap)+'\\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
                if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}
                rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}
                return str('',{'':value});};}
                if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
                return reviver.call(holder,key,value);}
                text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}
                if(/^[\\],:{}\\s]*$/.test(text.replace(/\\\\(?:["\\\\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\\\\n\\r]*"|true|false|null|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?/g,']').replace(/(?:^|:|,)(?:\\s*\\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
                throw new SyntaxError('JSON.parse');};}}());
            `;
            
            const script = `
                ${json2Polyfill} // Include the polyfill here
                
                app.enableQE();
                var result = getEffects();
                result;
                
                function getEffects() {
                    try {
                        if (!qe || !qe.project) {
                            return "QE not available";
                        }
                        
                        var effectsList = qe.project.getVideoEffectList();
                        return JSON.stringify(effectsList);
                    } catch (e) {
                        return "Error: " + e.toString();
                    }
                }
            `;
            
            this.csInterface.evalScript(script, (result) => {
                try {
                    // Log the raw result from ExtendScript
                    console.log("PremiereActions.getAvailableEffects raw result:", result); 
                    const effects = JSON.parse(result);
                    resolve(effects);
                } catch (e) {
                    console.error("Error parsing effects list in PremiereActions:", e, "Raw result was:", result);
                    resolve([]);
                }
            });
        });
    }

    /**
     * Get a list of all available transitions
     * @returns {Promise<string[]>} - Array of transition names
     */
    getAvailableTransitions(transition) {
        return new Promise((resolve, reject) => {
           
            resolve(transition);
            return;
            // json2.js polyfill (minified) - include directly in the script string
            const json2Polyfill = `
                if(typeof JSON!=='object'){JSON={};}
                (function(){'use strict';function f(n){return n<10?'0'+n:n;}
                if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+f(this.getUTCMonth()+1)+'-'+f(this.getUTCDate())+'T'+f(this.getUTCHours())+':'+f(this.getUTCMinutes())+':'+f(this.getUTCSeconds())+'Z':null;};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}
                var cx=/[\\u0000\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]/g,escapable=/[\\\\\\"\\x00-\\x1f\\x7f-\\x9f\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]/g,gap,indent,meta={'\\b':'\\\\b','\\t':'\\\\t','\\n':'\\\\n','\\f':'\\\\f','\\r':'\\\\r','"':'\\\\"','\\\\':'\\\\\\\\'},rep;
                function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}
                function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
                if(typeof rep==='function'){value=rep.call(holder,key,value);}
                switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
                gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
                v=partial.length===0?'[]':gap?'[\\n'+gap+partial.join(',\\n'+gap)+'\\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v;}
                if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==='string'){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}
                v=partial.length===0?'{}':gap?'{\\n'+gap+partial.join(',\\n'+gap)+'\\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
                if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}
                rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}
                return str('',{'':value});};}
                if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
                return reviver.call(holder,key,value);}
                text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}
                if(/^[\\],:{}\\s]*$/.test(text.replace(/\\\\(?:["\\\\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\\\\n\\r]*"|true|false|null|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?/g,']').replace(/(?:^|:|,)(?:\\s*\\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
                throw new SyntaxError('JSON.parse');};}}());
            `;
            
            const script = `
                ${json2Polyfill} // Include the polyfill here
                
                app.enableQE();
                var result = getTransitions();
                result;
                
                function getTransitions() {
                    try {
                        if (!qe || !qe.project) {
                            return "QE not available";
                        }
                        
                        var transitionList = qe.project.getVideoTransitionList();
                        return JSON.stringify(transitionList);
                    } catch (e) {
                        return "Error: " + e.toString();
                    }
                }
            `;
            
            this.csInterface.evalScript(script, (result) => {
                try {
                    // Log the raw result from ExtendScript
                    console.log("PremiereActions.getAvailableTransitions raw result:", result); 
                    const transitions = JSON.parse(result);                    
                    resolve(transitions);
                } catch (e) {
                    console.error("Error parsing transitions list in PremiereActions:", e, "Raw result was:", result);
                    resolve([]);
                }
            });
        });
    }

    /**
     * Get a list of all available presets in Premiere Pro
     * @returns {Promise<string[]>} - Array of preset names
     */
    getAvailablePresets(preset)
    {
        return new Promise((resolve, reject) => {

            this.presetList = preset;
            var name=[];
            for(var i=0;i<this.presetList.length;i++)
            {
                name.push(this.presetList[i].name);
            }
            resolve(name);
            return;

            const json2Polyfill = `
                if(typeof JSON!=='object'){JSON={};}
                (function(){'use strict';function f(n){return n<10?'0'+n:n;}
                if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+f(this.getUTCMonth()+1)+'-'+f(this.getUTCDate())+'T'+f(this.getUTCHours())+':'+f(this.getUTCMinutes())+':'+f(this.getUTCSeconds())+'Z':null;};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}
                var cx=/[\\u0000\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]/g,escapable=/[\\\\\\"\\x00-\\x1f\\x7f-\\x9f\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]/g,gap,indent,meta={'\\b':'\\\\b','\\t':'\\\\t','\\n':'\\\\n','\\f':'\\\\f','\\r':'\\\\r','"':'\\\\"','\\\\':'\\\\\\\\'},rep;
                function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}
                function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
                if(typeof rep==='function'){value=rep.call(holder,key,value);}
                switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
                gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
                v=partial.length===0?'[]':gap?'[\\n'+gap+partial.join(',\\n'+gap)+'\\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v;}
                if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==='string'){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}
                v=partial.length===0?'{}':gap?'{\\n'+gap+partial.join(',\\n'+gap)+'\\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
                if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}
                rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}
                return str('',{'':value});};}
                if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
                return reviver.call(holder,key,value);}
                text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}
                if(/^[\\],:{}\\s]*$/.test(text.replace(/\\\\(?:["\\\\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\\\\n\\r]*"|true|false|null|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?/g,']').replace(/(?:^|:|,)(?:\\s*\\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
                throw new SyntaxError('JSON.parse');};}}());
            `;

            const script = `
                ${json2Polyfill} // Include the polyfill here
                
                function getObjectByID(id) {
                    for each (var node in xml.*) {
                        if (node.@ObjectID.toString() === id.toString()) return node;
                    }
                    return null;
                }

                function LoadPreset(filePath)
                {
                    try
                    {
                        var presetFile = new File(filePath);
                        if (presetFile.open("r")) {
                            var content = presetFile.read();
                            presetFile.close();
                            return content;                            
                        } else {
                            return "";
                        }
                    }
                    catch(e)
                    {
                        return "";
                    }                    
                }
                function getAllPresets(folder, arr) {
                    var files = folder.getFiles();
                    for (var i = 0; i < files.length; i++) {
                        if (files[i] instanceof Folder) {
                            getAllPresets(files[i], arr); // recurse
                        } else if (files[i] instanceof File && files[i].name.match(/\.prfpset$/i)) {
                            arr.push(files[i]);
                        }
                    }
                    return arr;
                }
                function getObjectByID(xmlNode, id) 
                {
                    var attrName = "ObjectID";
                    // Check current node
                    if (xmlNode.hasOwnProperty("@"+attrName) && xmlNode["@"+attrName].toString() === id) {
                        return xmlNode;
                    }

                    // Recurse through children
                    for each (var child in xmlNode.*) {
                        result = getObjectByID(child, id);
                        if(result) return result;
                    }
                    return null;
                }
                function getElementsByTagName(xmlNode, tagName) {
                    var result = [];
                
                    // Check if current node matches
                    if (xmlNode.name().localName == tagName || tagName === "*") {

                        result.push(xmlNode);
                    }
                
                    // Iterate over all children recursively
                    for each (var child in xmlNode.*) {
                        result = result.concat(getElementsByTagName(child, tagName));
                    }
                
                    return result;
                }
                function ParsePreset(xmlString)
                {                
                    var xmlDoc = new XML(xmlString);
                    var treeItems = xmlDoc..TreeItem; // all TreeItem nodes
                    var presetlist=[];
                    for each (var item in treeItems) {
                        
                        var name = getElementsByTagName(item,"Name")[0].toString();
                        var preset={name:name};
                        presetlist.push(preset);                     
                    }                   
  
                    return presetlist;
                }
                (function() {
                    try {
                        var presetNames = [];
                        var presetPaths=[];
                        var premierePath = Folder(app.path);
                        // If we're in a temp folder, move up
                        
                        if (premierePath.name.indexOf("tmp") === 0) 
                        {
                            premierePath = premierePath.parent; // go back to "Support Files"
                        }
                        var usr_presetsFolder;
                        var sys_presetsFolder;
                        var username = $.getenv("USERNAME") || $.getenv("USER");
                        if ($.os.indexOf("Windows") !== -1) {
                            // Windows
                            // Typically: C:\Users\<username>\Documents\Adobe\Premiere Pro\<version>\User Presets                            
                            usr_presetsFolder = Folder(Folder.myDocuments.fsName + "/Adobe/Premiere Pro/" + app.version.split("x")[0].split(".")[0] + ".0/Profile-"+username);
                            sys_presetsFolder = Folder(premierePath.fsName + "/LocalizedPresets/en_US/Effect Presets");
                           
                        } else {
                            // macOS
                            // Typically: ~/Documents/Adobe/Premiere Pro <version>/User Presets
                            usr_presetsFolder = Folder(Folder.myDocuments.fsName + "/Adobe/Premiere Pro/" + app.version.split("x")[0].split(".")[0] + ".0/Profile-"+username);
                            sys_presetsFolder = Folder(premierePath.fsName +"/Contents/Resources/LocalizedPresets/en_US/Effect Presets");
                        }
                        var allPresets = getAllPresets(sys_presetsFolder, []);
                        
                        for(var i=0;i<allPresets.length;i++)
                        {
                            var baseName = decodeURIComponent(allPresets[i].name).replace(/\.[^\.]+$/, "");
                            presetNames.push(baseName);

                            var preset_path = decodeURIComponent(allPresets[i].fsName);
                            presetPaths.push(preset_path);
                        }

                        allPresets = getAllPresets(usr_presetsFolder, []);
                        for(var i=0;i<allPresets.length;i++)
                        {
                            var baseName = decodeURIComponent(allPresets[i].name).replace(/\.[^\.]+$/, "");
                            presetNames.push(baseName);

                            var preset_path = decodeURIComponent(allPresets[i].fsName);
                            presetPaths.push(preset_path);
                        }
                        var presetList=[];
                        for(var i=0;i<presetPaths.length;i++)
                        {  
                            try
                            { 
                                var content = LoadPreset(presetPaths[i]);                                
                                var preset = ParsePreset(content);
                                for(var j=0;j<preset.length;j++)
                                {
                                    preset[j]["preset_path"]=presetPaths[i];
                                    presetList.push(preset[j]);
                                }   
                            } 
                            catch(e) 
                            { 
                                //alert("err:"+JSON.stringify(presetPaths[i]));
                            }                                            
                        }
                        return JSON.stringify(presetList); 
    
                    } catch (e) {
                        // Try to return error as string, stringify might fail if e is complex
                        try { return "Error: " + JSON.stringify(e); } 
                        catch(errErr) { return "Error: Could not stringify error object"; }
                    }
                })();
            `;
            this.csInterface.evalScript(script, (result) => {
                if (result && result.startsWith("Error:")) {
                    console.error(result);
                    // Fallback to common effect names if we can't get the actual list
                    resolve([]);
                } else {
                    try {
                        // Log the raw result from ExtendScript
                        console.log("PremiereProActions.getAvailablePresets raw result:", result);
                        this.presetList = JSON.parse(result);
                        var name=[];
                        for(var i=0;i<this.presetList.length;i++)
                        {
                            name.push(this.presetList[i].name);
                        }
                        resolve(name);
                    } catch (e) {
                        console.error("Error parsing preset list in PremiereProActions:", e, "Raw result was:", result);
                        // Fallback
                        resolve([]);
                    }
                }
            });
        });
    }

    /**
     * Import footage file(s) and optionally manage bins
     * @param {string[]} filePaths - Array of file paths to import
     * @param {string} [binName] - Optional bin name to create/use
     * @returns {Promise<string>} - Result message
     */
    importFootage(filePaths, binName = null) {
        return new Promise((resolve, reject) => {
            const script = `
                app.enableQE();
                var result = importFiles("${binName || ''}");
                result;
                
                function importFiles(binName) {
                    try {
                        // Show file browser dialog
                        var filesToImport = File.openDialog("Select files to import", "", true);
                        
                        if (!filesToImport || filesToImport.length === 0) {
                            return "No files selected for import";
                        }
                        
                        // Convert File objects to path strings
                        var filePaths = [];
                        for (var i = 0; i < filesToImport.length; i++) {
                            filePaths.push(filesToImport[i].fsName);
                        }
                        
                        // Import the files
                        var importedFiles = app.project.importFiles(filePaths);
                        
                        if (!importedFiles || importedFiles.length === 0) {
                            return "Failed to import files";
                        }
                        
                        // If a bin name is provided, create or get the bin and move items there
                        if (binName && binName.length > 0) {
                            var targetBin = null;
                            
                            // Check if bin already exists
                            for (var i = 0; i < app.project.rootItem.children.numItems; i++) {
                                var item = app.project.rootItem.children[i];
                                if (item.name === binName && item.type === ProjectItemType.BIN) {
                                    targetBin = item;
                                    break;
                                }
                            }
                            
                            // Create the bin if it doesn't exist
                            if (!targetBin) {
                                targetBin = app.project.rootItem.createBin(binName);
                            }
                            
                            // Move the imported files to the bin
                            if (targetBin) {
                                for (var i = 0; i < importedFiles.length; i++) {
                                    if (importedFiles[i]) {
                                        importedFiles[i].moveBin(targetBin);
                                    }
                                }
                                return "Imported " + importedFiles.length + " file(s) into bin: " + binName;
                            }
                        }
                        
                        return "Imported " + importedFiles.length + " file(s)";
                    } catch (e) {
                        return "Error importing files: " + e.toString();
                    }
                }
            `;
            
            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }

    /**
     * Create a new bin in the project
     * @param {string} binName - Name of the bin to create
     * @returns {Promise<string>} - Result message
     */
    createBin(binName) {
        return new Promise((resolve, reject) => {
            const script = `
                app.enableQE();
                var result = createNewBin("${binName}");
                result;
                
                function createNewBin(binName) {
                    try {
                        if (!binName || binName.length === 0) {
                            return "No bin name specified";
                        }
                        
                        var targetBin = null;
                        
                        // Check if bin already exists
                        for (var i = 0; i < app.project.rootItem.children.numItems; i++) {
                            var item = app.project.rootItem.children[i];
                            if (item.name === binName && item.type === ProjectItemType.BIN) {
                                targetBin = item;
                                break;
                            }
                        }
                        
                        if (targetBin) {
                            return "Bin already exists: " + binName;
                        }
                        
                        // Create the bin
                        targetBin = app.project.rootItem.createBin(binName);
                        if (targetBin) {
                            return "Bin created: " + binName;
                        } else {
                            return "Failed to create bin: " + binName;
                        }
                    } catch (e) {
                        return "Error creating bin: " + e.toString();
                    }
                }
            `;
            
            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }

    /**
     * Delete a bin from the project
     * @param {string} binName - Name of the bin to delete
     * @returns {Promise<string>} - Result message
     */
    deleteBin(binName) {
        return new Promise((resolve, reject) => {
            const script = `
                app.enableQE();
                var result = removeBin("${binName}");
                result;
                
                function removeBin(binName) {
                    try {
                        if (!binName || binName.length === 0) {
                            return "No bin name specified";
                        }
                        
                        var targetBin = null;
                        
                        // Find the bin by name
                        for (var i = 0; i < app.project.rootItem.children.numItems; i++) {
                            var item = app.project.rootItem.children[i];
                            if (item.name === binName && item.type === ProjectItemType.BIN) {
                                targetBin = item;
                                break;
                            }
                        }
                        
                        if (!targetBin) {
                            return "Bin not found: " + binName;
                        }
                        
                        // Delete the bin
                        targetBin.deleteBin();
                        return "Bin deleted: " + binName;
                    } catch (e) {
                        return "Error deleting bin: " + e.toString();
                    }
                }
            `;
            
            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }

    /**
     * Apply multiple effects to selected clips in a batch
     * @param {string} effectsString - Comma or "and" separated string of effect names
     * @returns {Promise<string>} - Result message
     */
    batchApplyEffects(effectsString) {
        return new Promise((resolve, reject) => {
            // Parse the effectsString to handle both comma-separated and "and"-separated formats
            let effectNames = [];
            
            if (typeof effectsString === 'string') {
                // Replace " and " with comma for consistent splitting
                effectsString = effectsString.replace(/ and /gi, ',');
                // Split by comma and trim whitespace
                effectNames = effectsString.split(',')
                    .map(effect => effect.trim())
                    .filter(effect => effect.length > 0);
            } else if (Array.isArray(effectsString)) {
                effectNames = effectsString;
            }
            
            if (effectNames.length === 0) {
                resolve("No effects specified");
                return;
            }

            const effectsJson = JSON.stringify(effectNames);
            
            const script = `
                app.enableQE();
                var result = batchApplyEffectsOnPRM(${effectsJson});
                result;
                
                function batchApplyEffects(effectNames) {
                    try {
                        if(app.project.activeSequence == null) {
                            return "No active sequence";
                        }
                        
                        var qeSequence = qe.project.getActiveSequence(0);
                        var sequence = app.project.activeSequence;
                        var videoTracks = sequence.videoTracks;
                        var effectsApplied = 0;
                        var selectedClips = [];
                        var effectsFound = [];
                        var errors = [];
                        
                        // First, collect all effects
                        for (var i = 0; i < effectNames.length; i++) {
                            try {
                                var effectName = effectNames[i];
                                var effect = qe.project.getVideoEffectByName(effectName);
                                if (!effect) {
                                    errors.push("Effect not found: " + effectName);
                                    continue;
                                }
                                effectsFound.push(effect);
                            } catch (effectError) {
                                errors.push("Error finding effect " + effectName + ": " + effectError.toString());
                            }
                        }
                        
                        if (effectsFound.length === 0) {
                            return "No valid effects found among: " + effectNames.join(", ");
                        }
                        
                        // Next, collect all selected clips
                        var thisQETrack, thisVanillaClip;
                        for(var i = 0; i < videoTracks.numTracks; i++) {
                            thisQETrack = qeSequence.getVideoTrackAt(i);
                            for(var e = 0; e < thisQETrack.numItems; e++) {
                                if(thisQETrack.getItemAt(e).type.toString() !== "Empty") {
                                    thisVanillaClip = getVanillaClip(thisQETrack.getItemAt(e), i);
                                    if(thisVanillaClip !== null) {
                                        if(thisVanillaClip.isSelected() === true) {
                                            selectedClips.push({
                                                qeClip: thisQETrack.getItemAt(e),
                                                vanillaClip: thisVanillaClip,
                                                trackIndex: i
                                            });
                                        }
                                    }
                                }
                            }
                        }
                        
                        if (selectedClips.length === 0) {
                            return "No clips selected";
                        }
                        
                        // Then apply each effect to all selected clips
                        for (var i = 0; i < effectsFound.length; i++) {
                            var effect = effectsFound[i];
                            for (var j = 0; j < selectedClips.length; j++) {
                                try {
                                    selectedClips[j].qeClip.addVideoEffect(effect);
                                    effectsApplied++;
                                } catch (clipError) {
                                    errors.push("Error applying effect to clip " + (j+1) + ": " + clipError.toString());
                                }
                            }
                        }
                        
                        var resultMsg = effectsApplied + " effects applied to " + selectedClips.length + " clips";
                        if (errors.length > 0) {
                            resultMsg += " with " + errors.length + " errors";
                        }
                        
                        return resultMsg;
                    } catch (e) {
                        return "Error: " + e.toString();
                    }
                }
                
                function getVanillaClip(qeClip, trackIndex) {
                    try {
                        for(var c = 0; c < app.project.activeSequence.videoTracks[trackIndex].clips.numItems; c++) {
                            if(app.project.activeSequence.videoTracks[trackIndex].clips[c].name == qeClip.name && 
                              ((app.project.activeSequence.videoTracks[trackIndex].clips[c].end.seconds - 
                                app.project.activeSequence.videoTracks[trackIndex].clips[c].start.seconds).toFixed(2) == 
                               (qeClip.end.secs - qeClip.start.secs).toFixed(2))) {
                                return app.project.activeSequence.videoTracks[trackIndex].clips[c];
                            }
                        }
                        return null;
                    } catch (e) {
                        return null;
                    }
                }
            `;
            
            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }

    /**
     * Change playback speed of selected clips (video and audio)
     * @param {number} speedPercent - Speed percentage (e.g., 50 for half speed, 200 for double speed)
     * @returns {Promise<string>} - Result message summarizing successes and errors
     */
    changeClipSpeed(speedPercent) {
        return new Promise((resolve, reject) => {
            const script = `
                // ExtendScript to change speed for all selected compatible clips
                function changeSpeedForAllSelected(speedPercent) {
                    var results = { success: 0, audioSuccess: 0, videoSuccess: 0, errors: [], skippedClips: [] };
                    var speedFactor = parseFloat(speedPercent) / 100;

                    // Basic validation of speed percentage
                    if (isNaN(speedFactor) || speedFactor <= 0) {
                        // You might want specific handling for 0% or negative speed if needed
                        return "Error: Invalid speed percentage provided (" + speedPercent + "%). Speed must be positive.";
                    }

                    try {
                        app.enableQE(); // Ensure QE is enabled

                        if (!app.project || !app.project.activeSequence) {
                            return "No active sequence. Please open a sequence first.";
                        }
                        var sequence = app.project.activeSequence;
                        var selection = sequence.getSelection(); // Get all selected clips (ProjectItem[])

                        if (!selection || selection.length === 0) {
                            return "No clips selected. Please select clips first.";
                        }

                        var qeSequence = qe.project.getActiveSequence(0); // Get QE Sequence (explicit index for compatibility)
                        if (!qeSequence) {
                             return "Error: Could not access QE sequence.";
                        }

                        // Iterate through each selected clip
                        for (var i = 0; i < selection.length; i++) {
                            var clip = selection[i]; // Current selected ProjectItem clip
                            var qeClip = null;
                            var clipType = 'Unknown';
                            var isMp4 = false;

                            // Wrap each clip's processing in a try-catch
                            try {
                                // Check if clip is MP4 or problematic format
                                if (clip.projectItem && clip.projectItem.getMediaPath) {
                                    var mediaPath = clip.projectItem.getMediaPath();
                                    if (mediaPath && mediaPath.toLowerCase().indexOf('.mp4') !== -1) {
                                        isMp4 = true;
                                    }
                                }

                                // --- Find the corresponding QE Clip ---
                                if (clip.mediaType === "Video") {
                                    clipType = 'Video';
                                    // Search video tracks for the matching QE clip
                                    for (var trackIdx = 0; trackIdx < qeSequence.numVideoTracks; trackIdx++) {
                                        var track = qeSequence.getVideoTrackAt(trackIdx);
                                        if (!track) continue;
                                        for (var itemIdx = 0; itemIdx < track.numItems; itemIdx++) {
                                            var item = track.getItemAt(itemIdx);
                                            // Match by name and approximate start time
                                            if (item && item.name === clip.name && Math.abs(item.start.secs - clip.start.seconds) < 0.1) {
                                                qeClip = item;
                                                break;
                                            }
                                        }
                                        if (qeClip) break; // Found on this track
                                    }
                                } else if (clip.mediaType === "Audio") {
                                    clipType = 'Audio';
                                    // Search audio tracks for the matching QE clip
                                     for (var trackIdx = 0; trackIdx < qeSequence.numAudioTracks; trackIdx++) {
                                        var track = qeSequence.getAudioTrackAt(trackIdx);
                                        if (!track) continue;
                                        for (var itemIdx = 0; itemIdx < track.numItems; itemIdx++) {
                                            var item = track.getItemAt(itemIdx);
                                            // Match by name and approximate start time
                                            if (item && item.name === clip.name && Math.abs(item.start.secs - clip.start.seconds) < 0.1) {
                                                qeClip = item;
                                                break;
                                            }
                                        }
                                        if (qeClip) break; // Found on this track
                                    }
                                } else {
                                    // Skip clips that are neither Video nor Audio (e.g., stills, graphics if selected)
                                    results.skippedClips.push(clip.name + " (unsupported type: " + clip.mediaType + ")");
                                    continue;
                                }

                                // If QE clip wasn't found for this selected item
                                if (!qeClip) {
                                    results.errors.push("Could not find matching timeline clip for: " + clip.name + " (" + clipType + ")");
                                    continue; // Skip to next selected clip
                                }

                                // --- SPECIAL HANDLING FOR MP4 FILES ---
                                if (isMp4) {
                                    try {
                                        // For MP4 files, we need to be extra careful
                                        // First, check if the clip is already speed-adjusted
                                        if (qeClip.getSpeed() !== 1 && Math.abs(qeClip.getSpeed() - 1) > 0.0001) {
                                            // Already speed-adjusted, skip to avoid compounding issues
                                            results.skippedClips.push(clip.name + " (MP4 already speed-adjusted)");
                                            continue;
                                        }
                                        
                                        // Special approach for MP4 files that often cause issues
                                        // Use the QE timing properties directly
                                        var timeInterp = qeClip.getTimeRemapInfo();
                                        if (!timeInterp) {
                                            // Time remap not available for this clip
                                            results.skippedClips.push(clip.name + " (MP4 without time remap support)");
                                            continue;
                                        }
                                    } catch (mp4CheckError) {
                                        // Just proceed with normal speed change attempt
                                        $.writeln("MP4 check error: " + mp4CheckError);
                                    }
                                }

                                // --- Attempt to set speed ---
                                // We'll try different approaches based on clip type and format
                                
                                // For better reliability, especially with MP4 files, let's:
                                // 1. First try with ripple edit OFF to avoid timeline shifting issues
                                var tempRippleEdit = false;
                                
                                try {
                                    // Get current speed before changing it
                                    var currentSpeed = qeClip.speed * 100;
                                    
                                    // Calculate the target speed more precisely
                                    var speed;
                                    if (speedPercent > currentSpeed) {
                                        // When increasing speed, add a tiny adjustment
                                        speed = Math.round((speedPercent / 100 + 0.000001) * 10000) / 10000;
                                    } else {
                                        // When decreasing speed, use normal rounding
                                        speed = Math.round((speedPercent / 100) * 10000) / 10000;
                                    }
                                    
                                    // Save the current clip for additional error handling
                                    var currentClip = qeClip;
                                    
                                    // Then we'll apply the final speed with ripple edit
                                    // Safer approach with multiple steps for MP4 files:
                                    
                                    // STEP 1: Apply speed changes to all clips WITHOUT ripple edit first
                                    // This helps avoid the "Unknown exception" error with MP4 files
                                    var tempRippleEdit = false;
                                    currentClip.setSpeed(speed, "", false, true, tempRippleEdit);
                                    
                                    // STEP 2: Apply speed change WITH ripple edit only to the main video clip
                                    var rippleEdit = true;
                                    qeClip.setSpeed(speed, "", false, true, rippleEdit);
                                    
                                    // Increment success counts
                                    results.success++;
                                    if (clipType === 'Video') results.videoSuccess++;
                                    if (clipType === 'Audio') results.audioSuccess++;
                                } catch (speedSetError) {
                                    // Try alternative approach for MP4 files
                                    if (isMp4) {
                                        try {
                                            // Alternative approach for MP4: use setTimeRemapAtKey instead
                                            // This is a last resort for clips that fail with setSpeed
                                            $.writeln("Attempting alternative speed method for MP4: " + clip.name);
                                            
                                            // Reset any previous changes
                                            qeClip.setSpeed(1, "", false, true, false);
                                            
                                            // Apply through time remapping (which is more reliable for MP4)
                                            var duration = qeClip.end.secs - qeClip.start.secs;
                                            var newDuration = duration / speedFactor;
                                            qeClip.setOutPoint(qeClip.start.secs + newDuration, false);
                                            
                                            results.success++;
                                            if (clipType === 'Video') results.videoSuccess++;
                                            if (clipType === 'Audio') results.audioSuccess++;
                                        } catch (alternativeError) {
                                            // Both approaches failed
                                            throw new Error("MP4 speed change failed with both methods: " + alternativeError);
                                        }
                                    } else {
                                        // For non-MP4, re-throw the original error
                                        throw speedSetError;
                                    }
                                }

                            } catch (clipError) {
                                // Catch errors specific to processing this clip (finding QE clip or setting speed)
                                var errorMsg = "Error processing clip '" + clip.name + "' (" + clipType + "): ";
                                if (clipError && clipError.message) {
                                     errorMsg += clipError.message; // Use message property if available
                                } else if (typeof clipError === 'string'){
                                     errorMsg += clipError; // Use the string directly if it is one
                                } else {
                                     // Attempt to stringify other types, or provide a generic message
                                     try { errorMsg += JSON.stringify(clipError); }
                                     catch(e) { errorMsg += "Unknown error exception"; }
                                }
                                results.errors.push(errorMsg);
                                $.writeln("CLIP ERROR: " + errorMsg); // Log detailed error in ExtendScript console
                            }
                        } // End loop through selection

                        // --- Format final result message ---
                        var message = "";
                        if (results.success > 0) {
                             message += "Speed set to " + speedPercent + "% on " + results.success + " clip(s)";
                             if (results.videoSuccess > 0 && results.audioSuccess > 0) {
                                 message += " (" + results.videoSuccess + " video, " + results.audioSuccess + " audio).";
                             } else if (results.videoSuccess > 0) {
                                 message += " (" + results.videoSuccess + " video).";
                             } else if (results.audioSuccess > 0) {
                                 message += " (" + results.audioSuccess + " audio).";
                             } else {
                                 message += "."; // Should not happen if success > 0, but safe fallback
                             }
                        }

                        if (results.skippedClips.length > 0) {
                            if (message.length > 0) message += " ";
                            message += "Skipped " + results.skippedClips.length + " clip(s).";
                        }

                        if (results.errors.length > 0) {
                            if (message.length > 0) message += " "; // Add separator if there were successes
                            message += results.errors.length + " error(s) occurred.";
                            // Add first error detail for debugging purposes in the panel
                            if (results.errors[0]) {
                                message += " First error: " + results.errors[0].substring(0, 150); // Limit length
                            }
                        }

                        // Handle case where selection existed but no compatible clips were processed
                        if (message.length === 0 && selection.length > 0) {
                             message = "No compatible video or audio clips found in the selection.";
                        }

                        return message; // Return the final summary string

                    } catch (mainError) {
                        // Catch errors in the main setup (getting sequence, selection, QE enabling etc.)
                         var mainErrorMsg = "Error during speed change setup: ";
                         if (mainError && mainError.message) {
                             mainErrorMsg += mainError.message;
                         } else if (typeof mainError === 'string'){
                             mainErrorMsg += mainError;
                         } else {
                             try { mainErrorMsg += JSON.stringify(mainError); }
                             catch(e) { mainErrorMsg += "Non-standard error object."; }
                         }
                         $.writeln("MAIN ERROR: " + mainErrorMsg); // Log detailed error in ExtendScript console
                         return "Setup Error: " + mainErrorMsg; // Return a clear setup error message
                    }
                }

                // Execute the function and return its result
                changeSpeedForAllSelected(${speedPercent});
            `;

            this.csInterface.evalScript(script, (result) => {
                // Log the raw result from ExtendScript for debugging purposes
                console.log(`ExtendScript changeClipSpeed raw result for ${speedPercent}%:`, result);

                // Check the type and content of the result
                if (result && typeof result === 'string') {
                     // Resolve with the message returned by the ExtendScript function
                     // This message should now be a user-friendly summary or a detailed error.
                     resolve(result);
                } else {
                     // Handle cases where ExtendScript might return undefined, null, or other types
                     resolve("Speed change process finished with unexpected return type: " + typeof result);
                }
            });
        });
    }

    /**
     * Reverses the playback speed of selected clips.
     * Sets speed to -100% while maintaining duration.
     * @returns {Promise<string>} - Result message summarizing successes and errors.
     */
    reverseSelectedClips() {
        return new Promise((resolve, reject) => {
            const script = `
                // ExtendScript to reverse speed for all selected compatible clips
                function reverseSpeedForAllSelected() {
                    var results = { success: 0, audioSuccess: 0, videoSuccess: 0, errors: [] };
                    var speedFactor = -1; // Speed factor for reverse (-100%)

                    try {
                        app.enableQE(); // Ensure QE is enabled

                        if (!app.project || !app.project.activeSequence) {
                            return "No active sequence. Please open a sequence first.";
                        }
                        var sequence = app.project.activeSequence;
                        var selection = sequence.getSelection(); // Get all selected clips (ProjectItem[])

                        if (!selection || selection.length === 0) {
                            return "No clips selected. Please select clips first.";
                        }

                        var qeSequence = qe.project.getActiveSequence(0); // Get QE Sequence (explicit index for compatibility)
                        if (!qeSequence) {
                             return "Error: Could not access QE sequence.";
                        }

                        // Iterate through each selected clip
                        for (var i = 0; i < selection.length; i++) {
                            var clip = selection[i]; // Current selected ProjectItem clip
                            var qeClip = null;
                            var clipType = 'Unknown';

                            // Wrap each clip's processing in a try-catch
                            try {
                                // --- Find the corresponding QE Clip --- 
                                // (Similar logic as in changeClipSpeed)
                                if (clip.mediaType === "Video") {
                                    clipType = 'Video';
                                    for (var trackIdx = 0; trackIdx < qeSequence.numVideoTracks; trackIdx++) {
                                        var track = qeSequence.getVideoTrackAt(trackIdx);
                                        if (!track) continue;
                                        for (var itemIdx = 0; itemIdx < track.numItems; itemIdx++) {
                                            var item = track.getItemAt(itemIdx);
                                            if (item && item.name === clip.name && Math.abs(item.start.secs - clip.start.seconds) < 0.1) {
                                                qeClip = item;
                                                break;
                                            }
                                        }
                                        if (qeClip) break; 
                                    }
                                } else if (clip.mediaType === "Audio") {
                                    clipType = 'Audio';
                                     for (var trackIdx = 0; trackIdx < qeSequence.numAudioTracks; trackIdx++) {
                                        var track = qeSequence.getAudioTrackAt(trackIdx);
                                        if (!track) continue;
                                        for (var itemIdx = 0; itemIdx < track.numItems; itemIdx++) {
                                            var item = track.getItemAt(itemIdx);
                                            if (item && item.name === clip.name && Math.abs(item.start.secs - clip.start.seconds) < 0.1) {
                                                qeClip = item;
                                                break;
                                            }
                                        }
                                        if (qeClip) break; 
                                    }
                                } else {
                                    continue; // Skip non-video/audio clips
                                }

                                if (!qeClip) {
                                    results.errors.push("Could not find matching timeline clip for: " + clip.name + " (" + clipType + ")");
                                    continue; 
                                }

                                // --- Attempt to reverse speed --- 
                                // Parameters: (speedFactor, unknownStringParam, reverseBool, maintainAudioPitchBool, rippleEditBool)
                                // Try with ripple=true to see if it helps preserve duration
                                qeClip.setSpeed(1, "", true, true, true);

                                results.success++;
                                if (clipType === 'Video') results.videoSuccess++;
                                if (clipType === 'Audio') results.audioSuccess++;

                            } catch (clipError) {
                                var errorMsg = "Error reversing clip '" + clip.name + "' (" + clipType + "): " + clipError.toString();
                                results.errors.push(errorMsg);
                                $.writeln("CLIP REVERSE ERROR: " + errorMsg);
                            }
                        } // End loop through selection

                        // --- Format final result message --- 
                        // (Similar logic as in changeClipSpeed)
                        var message = "";
                        if (results.success > 0) {
                             message += "Reversed " + results.success + " clip(s)";
                             if (results.videoSuccess > 0 && results.audioSuccess > 0) {
                                 message += " (" + results.videoSuccess + " video, " + results.audioSuccess + " audio).";
                             } else if (results.videoSuccess > 0) {
                                 message += " (" + results.videoSuccess + " video).";
                             } else if (results.audioSuccess > 0) {
                                 message += " (" + results.audioSuccess + " audio).";
                             } else {
                                 message += ".";
                             }
                        }

                        if (results.errors.length > 0) {
                            if (message.length > 0) message += " "; 
                            message += results.errors.length + " error(s) occurred.";
                            if (results.errors[0]) {
                                message += " First error: " + results.errors[0].substring(0, 150);
                            }
                        }

                        if (message.length === 0 && selection.length > 0) {
                             message = "No compatible video or audio clips found in the selection for reversing.";
                        }

                        return message; 

                    } catch (mainError) {
                         var mainErrorMsg = "Error during clip reverse setup: " + mainError.toString();
                         $.writeln("MAIN REVERSE ERROR: " + mainErrorMsg);
                         return "Setup Error: " + mainErrorMsg;
                    }
                }

                // Execute the function and return its result
                reverseSpeedForAllSelected();
            `;

            this.csInterface.evalScript(script, (result) => {
                console.log(`ExtendScript reverseSelectedClips raw result:`, result);
                if (result && typeof result === 'string') {
                     resolve(result);
                } else {
                     resolve("Clip reverse process finished with unexpected return type: " + typeof result);
                }
            });
        });
    }

    /**
     * Set a property value on an effect. Will apply the effect if it doesn't exist.
     * @param {string} effectName - Name of the effect to modify
     * @param {string} propertyName - Name of the property to set
     * @param {number|string} propertyValue - Value to set for the property
     * @returns {Promise<string>} - Result message
     */
    setEffectProperty(effectName, propertyName, propertyValue) {

        return new Promise((resolve, reject) => {
            const script = `
                app.enableQE();
                setEffectPropertyOnPRM("${effectName}", "${propertyName}", ${propertyValue});             
            `;
            
            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }

    /**
     * Organize project items into categorized bins
     * @param {string} imageLabel - Name for the images bin
     * @param {string} videoLabel - Name for the videos bin
     * @param {string} audioLabel - Name for the audio bin
     * @param {boolean} dryRun - If true, only preview without moving items
     * @returns {Promise<string>} - Result message
     */
    organizeProject(imageLabel, videoLabel, audioLabel, dryRun) {
        return new Promise((resolve, reject) => {
            const script = `
                app.enableQE();
                var result = organizeProject("${imageLabel || ''}", "${videoLabel || ''}", "${audioLabel || ''}", ${dryRun ? 'true' : 'false'});
                result;
                
                function organizeProject(imageLabel, videoLabel, audioLabel, dryRun) {
                    try {
                        var project = app.project;
                        var projectItem = project.rootItem;
                        var summary = {};
                        
                        // Create folders with fallbacks
                        var imageFolder = null;
                        var videoFolder = null;
                        var audioFolder = null;
                        
                        if (!dryRun) {
                            imageFolder = projectItem.createBin(imageLabel || "Image Files");
                            videoFolder = projectItem.createBin(videoLabel || "Video Files");
                            audioFolder = projectItem.createBin(audioLabel || "Audio Files");
                        }
                        
                        var images = [], video = [], audio = [];
                        
                        // Process all items in the root
                        for (var i = 0; i < projectItem.children.numItems; i++) {
                            var item = projectItem.children[i];
                            
                            // Skip folders/bins
                            if (item.type === ProjectItemType.BIN) continue;
                            
                            // Skip sequences
                            if (item.type === ProjectItemType.SEQUENCE) continue;
                            
                            // Use cleanName helper
                            var thisName = cleanName(item.name);
                            
                            // Image files
                            if (endsWithAny(thisName, ["jpg", "jpeg", "png", "gif", "webp", "tiff", "bmp"])) {
                                images.push(item);
                            }
                            // Video files
                            else if (endsWithAny(thisName, ["mp4", "mov", "avi", "mkv", "mxf", "wmv", "flv"])) {
                                video.push(item);
                            }
                            // Audio files
                            else if (endsWithAny(thisName, ["mp3", "wav", "aac", "aiff", "ogg", "flac"])) {
                                audio.push(item);
                            }
                        }
                        
                        // Store counts for summary
                        summary.images = images.length;
                        summary.video = video.length;
                        summary.audio = audio.length;
                        
                        // Move files to appropriate folders
                        if (!dryRun) {
                            moveToFolder(images, imageFolder);
                            moveToFolder(video, videoFolder);
                            moveToFolder(audio, audioFolder);
                            
                            return "Project organized: " + summary.images + " images, " + 
                                   summary.video + " videos, " + summary.audio + " audio files";
                        } else {
                            return "Preview: Would organize " + summary.images + " images, " + 
                                   summary.video + " videos, " + summary.audio + " audio files";
                        }
                    } catch (e) {
                        return "Error organizing project: " + e.toString();
                    }
                }
                
                // Helper to move items to a folder
                function moveToFolder(items, folder) {
                    for (var i = 0; i < items.length; i++) {
                        try {
                            items[i].moveBin(folder);
                        } catch (e) {
                            // Skip items that can't be moved
                        }
                    }
                }
                
                // Helper to match file extension endings
                function endsWithAny(name, extensions) {
                    // Make sure name is a string
                    name = name + "";
                    
                    for (var i = 0; i < extensions.length; i++) {
                        // Old-school way to check ending that's safe for ExtendScript
                        var ext = "." + extensions[i];
                        if (name.indexOf(ext) === name.length - ext.length && name.length >= ext.length) {
                            return true;
                        }
                    }
                    return false;
                }

                // Helper to clean and normalize names
                function cleanName(name) {
                    return (name + "").toLowerCase().replace(/^\s+|\s+$/g, "");
                }
            `;
            
            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }

    /**
     * Finds and attempts to relink missing media items within the project.
     * Prompts the user to select a folder to search within.
     * @returns {Promise<string>} - Result message summarizing the relinking process.
     */
    findAndRelinkMissingMedia() {
        return new Promise((resolve, reject) => {
            const script = `
                (function() {
                    try {
                        // Prompt user to select the search folder
                        var searchFolder = Folder.selectDialog("Select Folder to Search for Missing Media");
                        if (!searchFolder) {
                            return "No folder selected. Operation cancelled.";
                        }

                        var relinkedCount = 0;
                        var missingCount = 0;
                        var errors = [];
                        var projectItems = [];

                        // Recursive function to gather all project items
                        function collectProjectItems(currentItem) {
                            if (!currentItem) return;
                            
                            if (currentItem.type === ProjectItemType.BIN) {
                                for (var i = 0; i < currentItem.children.numItems; i++) {
                                    collectProjectItems(currentItem.children[i]);
                                }
                            } else if (currentItem.type === ProjectItemType.CLIP || currentItem.type === ProjectItemType.FILE) {
                                projectItems.push(currentItem);
                            }
                        }
                        
                        // Start collecting from the root
                        collectProjectItems(app.project.rootItem);

                        app.project.save(); // Save before making changes
                        app.project.consolidateDuplicates(); // Consolidate duplicates first
                        
                        // Iterate through all collected project items
                        for (var i = 0; i < projectItems.length; i++) {
                            var item = projectItems[i];
                            var isOffline = false;

                            // Attempt 1: Use isOffline() method if available
                            try {
                                if (typeof item.isOffline === 'function') {
                                     isOffline = item.isOffline();
                                     $.writeln("Item: '" + item.name + "', isOffline() check: " + isOffline);
                                } else {
                                    $.writeln("Item: '" + item.name + "', isOffline() method not available. Falling back to path check.");
                                    // Fallback if isOffline() doesn't exist
                                    throw new Error("isOffline not a function"); 
                                }
                            } catch (offlineError) {
                                // Attempt 2: Fallback - Check path and existence if isOffline() failed or doesn't exist
                                if (item.canChangeMediaPath()) {
                                    try {
                                        var currentPath = item.getMediaPath();
                                        if (!currentPath || currentPath === "") {
                                            isOffline = true;
                                            $.writeln("Item: '" + item.name + "', Path check: OFFLINE (empty path)");
                                        } else {
                                            var file = new File(currentPath);
                                            if (!file.exists) {
                                                isOffline = true;
                                                $.writeln("Item: '" + item.name + "', Path check: OFFLINE (file not found at '" + currentPath + "')");
                                            } else {
                                                // $.writeln("Item: '" + item.name + "', Path check: ONLINE");
                                            }
                                        }
                                    } catch (pathError) {
                                        isOffline = true;
                                        $.writeln("Item: '" + item.name + "', Path check: OFFLINE (getMediaPath error: " + pathError + ")");
                                    }
                                } else {
                                     $.writeln("Item: '" + item.name + "', Path check: Cannot change path, assuming ONLINE.");
                                }
                            } // End Catch for isOffline()

                            // If determined to be offline, try to relink
                            if (isOffline) {
                                missingCount++;
                                $.writeln("-> Attempting relink for offline item: '" + item.name + "'");
                                try {
                                    var found = findAndRelinkMedia(item, searchFolder);
                                    if (found) {
                                        relinkedCount++;
                                        $.writeln("  Relink SUCCESSFUL for '" + item.name + "'");
                                    } else {
                                         $.writeln("  Relink FAILED for '" + item.name + "' (File not found in search folder)");
                                    }
                                } catch (relinkError) {
                                    errors.push("Error relinking '" + item.name + "': " + relinkError.toString());
                                     $.writeln("  Relink EXCEPTION for '" + item.name + "': " + relinkError.toString());
                                }
                            }
                        } // end for loop

                        var message = "";
                        if (missingCount === 0) {
                            message = "No offline media items found in the project.";
                        } else {
                            message = "Attempted relink: " + relinkedCount + " of " + missingCount + " offline items relinked.";
                        }
                         if (errors.length > 0) {
                            message += " Errors: " + errors.join(" ");
                        }
                        
                        app.project.consolidateDuplicates(); // Consolidate again after relinking
                        app.project.save(); // Save after changes
                        
                        return message;

                    } catch (e) {
                        return "Error during relink process: " + e.toString();
                    }
                })();

                // Helper function to search for and relink a specific missing item
                function findAndRelinkMedia(missingItem, searchFolder) {
                    var itemName = missingItem.name.replace(/%20/g, " "); // Handle potential URL encoding
                    var found = false;
                    var foundPath = null;

                    // Recursive search function
                    function searchRecursively(folder) {
                        if (found) return; // Stop searching if already found

                        $.writeln("  Searching in folder: '" + folder.fsName + "'");
                        var itemsInFolder = folder.getFiles();
                        for (var i = 0; i < itemsInFolder.length; i++) {
                            var currentItem = itemsInFolder[i];
                            var currentItemName = currentItem.displayName.replace(/%20/g, " ");

                             $.writeln("    Checking file: '" + currentItemName + "' against '" + itemName + "'");
                            if (currentItem instanceof File && currentItemName === itemName) {
                                foundPath = currentItem.fsName;
                                found = true;
                                $.writeln("    MATCH FOUND: '" + foundPath + "'");
                                return; // Exit loop and recursion
                            } else if (currentItem instanceof Folder) {
                                // Recursively search subfolders
                                searchRecursively(currentItem);
                                if (found) return; // Exit if found in subfolder
                            }
                        }
                    }

                    // Start the recursive search
                    searchRecursively(searchFolder);

                    // If found, attempt to change the media path
                    if (found && foundPath) {
                        try {
                            // Use changeMediaPath for relinking in Premiere
                            var result = missingItem.changeMediaPath(foundPath, false); // false = don't change sequence settings
                            return result; // changeMediaPath returns true on success
                        } catch (replaceError) {
                            // Log error
                            $.writeln("Failed to relink " + itemName + " with " + foundPath + ": " + replaceError);
                            return false;
                        }
                    }
                    return false;
                }
            `;

            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }
}

// Export the class
window.PremiereActions = PremiereActions; 