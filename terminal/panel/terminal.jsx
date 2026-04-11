"object"!=typeof JSON&&(JSON={}),function(){"use strict";var rx_one=/^[\],:{}\s]*$/,rx_two=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,rx_three=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,rx_four=/(?:^|:|,)(?:\s*\[)+/g,rx_escapable=/[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,rx_dangerous=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta,rep;function f(t){return t<10?"0"+t:t}function this_value(){return this.valueOf()}function quote(t){return rx_escapable.lastIndex=0,rx_escapable.test(t)?'"'+t.replace(rx_escapable,(function(t){var e=meta[t];return"string"==typeof e?e:"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)}))+'"':'"'+t+'"'}function str(t,e){var r,n,o,u,f,a=gap,i=e[t];switch(i&&"object"==typeof i&&"function"==typeof i.toJSON&&(i=i.toJSON(t)),"function"==typeof rep&&(i=rep.call(e,t,i)),typeof i){case"string":return quote(i);case"number":return isFinite(i)?String(i):"null";case"boolean":case"null":return String(i);case"object":if(!i)return"null";if(gap+=indent,f=[],"[object Array]"===Object.prototype.toString.apply(i)){for(u=i.length,r=0;r<u;r+=1)f[r]=str(r,i)||"null";return o=0===f.length?"[]":gap?"[\n"+gap+f.join(",\n"+gap)+"\n"+a+"]":"["+f.join(",")+"]",gap=a,o}if(rep&&"object"==typeof rep)for(u=rep.length,r=0;r<u;r+=1)"string"==typeof rep[r]&&(o=str(n=rep[r],i))&&f.push(quote(n)+(gap?": ":":")+o);else for(n in i)Object.prototype.hasOwnProperty.call(i,n)&&(o=str(n,i))&&f.push(quote(n)+(gap?": ":":")+o);return o=0===f.length?"{}":gap?"{\n"+gap+f.join(",\n"+gap)+"\n"+a+"}":"{"+f.join(",")+"}",gap=a,o}}"function"!=typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null},Boolean.prototype.toJSON=this_value,Number.prototype.toJSON=this_value,String.prototype.toJSON=this_value),"function"!=typeof JSON.stringify&&(meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},JSON.stringify=function(t,e,r){var n;if(gap="",indent="","number"==typeof r)for(n=0;n<r;n+=1)indent+=" ";else"string"==typeof r&&(indent=r);if(rep=e,e&&"function"!=typeof e&&("object"!=typeof e||"number"!=typeof e.length))throw new Error("JSON.stringify");return str("",{"":t})}),"function"!=typeof JSON.parse&&(JSON.parse=function(text,reviver){var j;function walk(t,e){var r,n,o=t[e];if(o&&"object"==typeof o)for(r in o)Object.prototype.hasOwnProperty.call(o,r)&&(void 0!==(n=walk(o,r))?o[r]=n:delete o[r]);return reviver.call(t,e,o)}if(text=String(text),rx_dangerous.lastIndex=0,rx_dangerous.test(text)&&(text=text.replace(rx_dangerous,(function(t){return"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)}))),rx_one.test(text.replace(rx_two,"@").replace(rx_three,"]").replace(rx_four,"")))return j=eval("("+text+")"),"function"==typeof reviver?walk({"":j},""):j;throw new SyntaxError("JSON.parse")})}();

var terminal={};
terminal.activate=false;
terminal.licenseFile="/com.terminal.lic";

function findEncodedProductKey(isMac,userDataDir)
{
    var token="";	
	if(isMac)
	{
		var FilePath = userDataDir +"/EditLab/plugins/dt.txt";
        var dataFile = new File(FilePath);
        if (dataFile.exists)
        {
            if (dataFile.open("r")) 
            {
                token = dataFile.read();
            }
        }
		else
		{
			FilePath = "/Library/Application Support/EditLab/plugins/dt.txt";
			dataFile = new File(FilePath);
            if (dataFile.exists)
            {
                if (dataFile.open("r")) 
                {
                    token = dataFile.read();
                }
            }
			else 
			{
				FilePath = "~/Library/Application Support/EditLab/plugins/dt.txt";
				dataFile = new File(FilePath);
                if (dataFile.exists)
                {
                    if (dataFile.open("r")) 
                    {
                        token = dataFile.read();
                    }
                }
			}			
		}
	}
	else
	{
		var FilePath = userDataDir+"\\EditLab\\plugins\\dt.txt";
        var dataFile = new File(FilePath);
        if (dataFile.exists)
        {
            if (dataFile.open("r")) 
            {
                token = dataFile.read();
            }
        }
	}

    if(token!="")
    {
        const arrayToken = token.split('.');
        return arrayToken[1];
    }
	return "";
}
function getRestAPIPoint()
{
    var data={};
    data.licenseAPIKey="ck_60bbfd050bb532fc54354a7cd5104f09a203b2d0";
    data.licenseSecretKey="cs_8ea328e5927e16aab8472579b122491cf4defcff";
    data.activateUrl = "https://tinytapes.com/wp-json/lmfwc/v2/licenses/activate/";
    data.validdateUrl = "https://tinytapes.com/wp-json/lmfwc/v2/licenses/validate/";
    data.deactivateUrl = "https://tinytapes.com/wp-json/lmfwc/v2/licenses/deactivate/";
    return JSON.stringify(data); 
}
function removeOfflineLicense() {
	var licenseKeyFile = new File(Folder.userData.fsName + terminal.licenseFile);
	if (licenseKeyFile.exists) {
		licenseKeyFile.remove();
	}
}

function checkOfflineLicense() {
	var licenseKeyFile = new File(Folder.userData.fsName + terminal.licenseFile);
	if (licenseKeyFile.exists) {
		licenseKeyFile.open("r");
		var content = licenseKeyFile.readln();
		licenseKeyFile.close();
		return content;
	} else {
		return "not found";
	}
}

function saveOfflineLicense(encryptedKey,email) {
	var licenseKeyFile = new File(Folder.userData.fsName + terminal.licenseFile);
	licenseKeyFile.open("w");
	licenseKeyFile.encoding = "UTF8";
	licenseKeyFile.writeln(encryptedKey);
	var d = Date.now();
	licenseKeyFile.writeln(d);
	licenseKeyFile.writeln(email);
	licenseKeyFile.close();
}
function ParseServerData(data,licenseKey,email)
{
    data = JSON.parse(data);
    if (data.errors !==undefined && data.errors.lmfwc_rest_data_error !==undefined)
    {
        if(data.errors.lmfwc_rest_data_error.length>0)
        {
            var err_str = data.errors.lmfwc_rest_data_error[0];
            if(err_str.indexOf("could not be found.")!==-1)
            {
                return 502;
            }
            if(err_str.indexOf("reached maximum activation count.")!==-1)
            {
                return 509;
            }
        }
    }

    if (data.timesActivated !==undefined && data.timesActivatedMax !==undefined)
    {
        if(data.timesActivated<=data.timesActivatedMax)
        {
            saveOfflineLicense(licenseKey,email);    
            terminal.activate=true;        
            return 0;
        }
        return 509;
    }
                
    return 502;
}
function getLicenseInfo() {
	var res = {};
	var licenseKeyFile = new File(Folder.userData.fsName + terminal.licenseFile);
	licenseKeyFile.open("r");
	var txtArray = [];
    var currentLine;
    licenseKeyFile.open("r");
    while(!licenseKeyFile.eof){
    	currentLine = licenseKeyFile.readln();
    	txtArray.push(currentLine);
    }
    licenseKeyFile.close();
    res.date = txtArray[1];
    res.email = txtArray[2];
    terminal.activate=true;    
    return JSON.stringify(res);
}
function newAlert(message) {
	alert(message);
}
function applyEffectToSelectedLayersOnAE(effectName) {
    if(!terminal.activate)
    {
        return "Error: please activate license.";
    }
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "No active composition selected.";
        }

        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) {
            return "No layers selected in the active composition.";
        }

        var effectsAppliedCount = 0;
        var layer;
        for (var i = 0; i < selectedLayers.length; i++) {
            layer = selectedLayers[i];
            // Check if the layer can have effects applied (e.g., AVLayer)
            if (layer.matchName === "ADBE AV Layer" || layer instanceof AVLayer) {
                try {
                    // Effects are added to the 'ADBE Effect Parade' property group
                    var effectGroup = layer.property("ADBE Effect Parade");
                    if (effectGroup) {
                        // Use addProperty to add the effect by its Match Name or Name
                        effectGroup.addProperty(effectName);
                        effectsAppliedCount++;
                    } else {
                         // This should generally not happen for AV layers
                        // Log or handle layers that cannot have effects
                    }
                } catch (e) {
                    // Effect might not exist or be applicable
                    // Consider returning a more specific error if needed
                    // return "Error applying effect '" + effectName + "' to layer '" + layer.name + "': " + e.toString();
                }
            }
        }

        if (effectsAppliedCount > 0) {
             return "Applied '" + effectName + "' to " + effectsAppliedCount + " selected layer(s).";
        } else if (selectedLayers.length > 0) {
             return "No compatible layers selected to apply the effect to.";
        } else {
            // This case is already handled above, but as a fallback:
            return "No layers selected.";
        }

    } catch (e) {
        return "Error: " + e.toString();
    }
}
function applyPresetToSelectedLayersOnAE(presetName,preset_path) {
    if(!terminal.activate)
    {
        return "Error: please activate license.";
    }
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "No active composition selected.";
        }

        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) {
            return "No layers selected in the active composition.";
        }

        var presetAppliedCount = 0;
        var layer;
        for (var i = 0; i < selectedLayers.length; i++) {
            layer = selectedLayers[i];
            try {
                var presetFile = new File(preset_path);
                
                if (presetFile.exists) {
                    app.beginUndoGroup("Apply Preset");
                    layer.applyPreset(presetFile);
                    app.endUndoGroup();
                    presetAppliedCount++;
                }
            } catch (e) {
            }
        }

        if (presetAppliedCount > 0) {
             return "Applied '" + presetName + "' to " + presetAppliedCount + " selected layer(s).";
        } else if (selectedLayers.length > 0) {
             return "No compatible layers selected to apply the preset to.";
        } else {
            // This case is already handled above, but as a fallback:
            return "No layers selected.";
        }

    } catch (e) {
        return "Error: " + e.toString();
    }
}
function getItemIndexOnPRM(trackId,mediaType,clip) 
{
    var seq = app.project.activeSequence;
    if(mediaType=="Video")
    {
        if(trackId>=0 && trackId<seq.videoTracks.numTracks)
        {
            var qeSequence = qe.project.getActiveSequence();
            var QETrack = qeSequence.getVideoTrackAt(trackId);                       
            for(var i = 0; i < QETrack.numItems; i++) 
            {
                var qeItem = QETrack.getItemAt(i);
                if(qeItem.type!=="Clip") continue;
                if(qeItem.name==clip.name && (qeItem.start.secs.toFixed(3) == clip.start.seconds.toFixed(3)) && (qeItem.end.secs.toFixed(3) == clip.end.seconds.toFixed(3))) 
                {
                    return i;
                }
            }                            
        }
        return -1;
    }   
                    
    if(mediaType=="Audio")
    {                        
        if(trackId>=0 && trackId<seq.audioTracks.numTracks)
        {
            var qeSequence = qe.project.getActiveSequence();
            var QETrack = qeSequence.getAudioTrackAt(trackId);                            
            for(var i = 0; i < QETrack.numItems; i++) 
            {
                var qeItem = QETrack.getItemAt(i);
                if(qeItem.type!=="Clip") continue;
                if(qeItem.name==clip.name && (qeItem.start.secs.toFixed(3) == clip.start.seconds.toFixed(3)) && (qeItem.end.secs.toFixed(3) == clip.end.seconds.toFixed(3))) 
                {
                    return i;
                }
            } 
        }
        return -1;
    }   

    return -1;
}
function setEffectPropertyOnPRM(effectName, propertyName, propertyValue)
{
    if(!terminal.activate)
    {
        return "Error: please activate license.";
    }
                    try
                    {
                        var seq = app.project.activeSequence;
                        if(seq == null) {
                            return "No active sequence";
                        }
                        var selected = seq.getSelection();
                        if (selected.length === 0)
                        {
                            return "No clips selected";
                        }
                        var clipsModified=0;
                        for(var i=0;i<selected.length;i++)
                        {
                            var clip = selected[i];     
                            if(clip.mediaType!="Video") continue;
                            var trackId = clip.parentTrackIndex; 
                            var components = clip.components;
                            var effect = null;

                            // Check if the effect is already applied
                            for (var c = 0; c < components.numItems; c++) 
                            {
                                if (components[c].displayName === effectName) 
                                {
                                    effect = components[c];
                                    break;
                                }
                            }     
                            // If the effect isn't applied, add it first
                            if (!effect) 
                            {
                                try 
                                {
                                    var itemId = getItemIndexOnPRM(trackId,clip.mediaType,clip);
                                    if (itemId!=-1)
                                    {
                                        var qeClip = qe.project.getActiveSequence().getVideoTrackAt(trackId).getItemAt(itemId);
                                        
                                        qeClip.addVideoEffect(qe.project.getVideoEffectByName(effectName));
                                        // Refresh components to get the newly added effect
                                        // Need a small delay to ensure effect is applied
                                        $.sleep(100);
                                        components = clip.components;
                                        for (var c = 0; c < components.numItems; c++) 
                                        {
                                            if (components[c].displayName === effectName) 
                                            {
                                                effect = components[c];
                                                break;
                                            }
                                        }
                                    }                                    
                                } catch (effectError) 
                                {
                                    return "Error applying effect: " + effectError.toString();
                                }
                            }

                            if (!effect) 
                            {
                                return "Failed to find or apply effect: " + effectName;
                            }     
                            
                            // Now find the property by its display name
                            var properties = effect.properties;
                            var propertyFound = false;
                            
                            // Helper function to normalize strings for comparison
                            function normalize(str) {
                                str = str + ""; // force to string
                                return str.replace(/^\s+|\s+$/g, "").toLowerCase();
                            }
                            
                            // Property aliases for user-friendly input
                            var propertyAliases = {
                                "Blurriness": ["blur", "blurred", "blurry", "soften"],
                                "Contrast": ["contrast", "punch", "deepness"],
                                "Exposure": ["exposure", "brightness", "light", "expose"],
                                "Saturation": ["saturation", "color pop", "vividness", "colorful"],
                                "Temperature": ["temperature", "warmth", "cool", "warm"],
                                "Tint": ["tint", "green-magenta", "color tint"],
                                "Sharpen Amount": ["sharpen", "sharpness", "detail"],
                                "Opacity": ["opacity", "transparency", "alpha"],
                                "Scale": ["scale", "size", "zoom"],
                                "Rotation": ["rotation", "rotate", "angle"],
                                "Position": ["position", "location", "move"],
                                "Anchor Point": ["anchor", "pivot"],
                                "Vibrance": ["vibrance", "vibrancy", "pop"],
                                "Highlights": ["highlights", "bright areas", "whites"],
                                "Shadows": ["shadows", "dark areas", "blacks"],
                                "Whites": ["whites", "white level", "white point"],
                                "Blacks": ["blacks", "black level", "black point"]
                            };
                            
                            // Try to resolve property name using aliases
                            function resolvePropertyName(propInput) 
                            {
                                var normalizedInput = normalize(propInput);
                                
                                // Direct match first
                                for (var p = 0; p < properties.length; p++) 
                                {
                                    if (normalize(properties[p].displayName) === normalizedInput) 
                                    {
                                        return properties[p].displayName;
                                    }
                                }
                                
                                // Check aliases
                                for (var actualName in propertyAliases) 
                                {
                                    var aliases = propertyAliases[actualName];
                                    for (var i = 0; i < aliases.length; i++) 
                                    {
                                        if (normalize(aliases[i]) === normalizedInput) 
                                        {
                                            // Verify this actual name exists in the effect
                                            for (var p = 0; p < properties.length; p++) 
                                            {
                                                if (normalize(properties[p].displayName) === normalize(actualName)) 
                                                {
                                                    return properties[p].displayName;
                                                }
                                            }
                                            return actualName; // Return even if not found, for better error messages
                                        }
                                    }
                                }
                                
                                // No match found, return original for error handling
                                return propertyName;
                            }
                            
                            // Get the actual property name to use
                            var actualPropertyName = resolvePropertyName(propertyName);

                            // Find and set the property
                            for (var p = 0; p < properties.length; p++)
                            {
                                if (normalize(properties[p].displayName) === normalize(actualPropertyName)) 
                                {
                                    try
                                    {
                                        properties[p].setValue(propertyValue, true);
                                        propertyFound = true;
                                        clipsModified++;
                                        break;
                                    } catch (propError) 
                                    {
                                        return "Error setting property: " + propError.toString();
                                    }
                                }
                            }
                           
                            if (!propertyFound) 
                            {
                                return "Property not found: " + propertyName + " in " + effectName;
                            }
                        } 
                      
                        if (clipsModified > 0) {
                            return "Effect property set on " + clipsModified + " clip(s)";
                        } else {
                            return "No clips selected";
                        }                       

                    }catch (e) {
                        return "Error: " + e.toString();
                    }
                }

function applyEffectOnPRM(effectName) {
    if(!terminal.activate)
    {
        return "Error: please activate license.";
    }
    try {

        var seq = app.project.activeSequence;

        if(seq == null) {
            return "No active sequence";
        }
        
        var selected = seq.getSelection();
        if (selected.length === 0)
        {
            return "No clips selected";
        }
        var effectApplied = false;

        for(var i=0;i<selected.length;i++)
        {
            var clip = selected[i];     
            if(clip.mediaType!="Video") continue;
            var trackId = clip.parentTrackIndex; 
            var itemId = getItemIndexOnPRM(trackId,clip.mediaType,clip);
            if (itemId!=-1)
            {
                var qeClip = qe.project.getActiveSequence().getVideoTrackAt(trackId).getItemAt(itemId);
                try {
                    qeClip.addVideoEffect(qe.project.getVideoEffectByName(effectName));
                    effectApplied = true;
                } catch (effectError) {
                    return "Error applying effect: " + effectError.toString();
                }                
            }
        }        
        return effectApplied ? "Effect applied successfully" : "No clips selected";
    } catch (e) {
        return "Error: " + e.toString();
    }
}
function applyTransitionOnPRM(transitionName) 
{
    if(!terminal.activate)
    {
        return "Error: please activate license.";
    }
    try 
    {
        var seq = app.project.activeSequence;

        if(seq == null) 
        {
            return "No active sequence";
        }
            
        var selected = seq.getSelection();
        if (selected.length === 0)
        {
            return "No clips selected";
        }
        var transition = qe.project.getVideoTransitionByName(transitionName);
        if (!transition) 
        {
            return "Transition not found: " + transitionName;
        }
        // Default duration: 1 second (in ticks format)
        var duration = '00:00:01:00';                        
        // Get selected clips
        var selectedClips = [];
        var transitionApplied = false;
        for(var i=0;i<selected.length;i++)
        {
            var clip = selected[i];     
            if(clip.mediaType!="Video") continue;
            var trackId = clip.parentTrackIndex; 
            var itemId = getItemIndexOnPRM(trackId,clip.mediaType,clip);
            if (itemId!=-1)
            {
                var qeClip = qe.project.getActiveSequence().getVideoTrackAt(trackId).getItemAt(itemId);
                selectedClips.push({
                    vanillaClip: clip, 
                    qeClip: qeClip,
                    trackIndex: trackId,
                    itemIndex: itemId
                });
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
    }catch (e) 
    {
        return "Error: " + e.toString();
    }    
}
function batchApplyEffectsOnPRM(effectNames)
{
    if(!terminal.activate)
    {
        return "Error: please activate license.";
    }

    try 
    {
        var seq = app.project.activeSequence;

        if(seq == null) 
        {
            return "No active sequence";
        }
            
        var selected = seq.getSelection();
        if (selected.length === 0)
        {
            return "No clips selected";
        }

        var effectsFound = [];
        var errors = [];
                        
        // First, collect all effects
        for (var i = 0; i < effectNames.length; i++) 
        {
            try 
            {
                var effectName = effectNames[i];
                var effect = qe.project.getVideoEffectByName(effectName);
                if (!effect) 
                {
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
        var selectedClips = [];
        for(var i=0;i<selected.length;i++)
        {
            var clip = selected[i];     
            if(clip.mediaType!="Video") continue;
            var trackId = clip.parentTrackIndex; 
            var itemId = getItemIndexOnPRM(trackId,clip.mediaType,clip);
            if (itemId!=-1)
            {
                var qeClip = qe.project.getActiveSequence().getVideoTrackAt(trackId).getItemAt(itemId);

                selectedClips.push({
                    qeClip: qeClip,
                    vanillaClip: clip,
                    trackIndex: trackId
                });
            }
        }

        if (selectedClips.length === 0) 
        {
            return "No clips selected";
        }
        var effectsApplied = 0;
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
    }catch (e) 
    {
        return "Error: " + e.toString();
    }  
}
function getType(str)
{
    var arr = str.split(',');
    if(arr.length>1)
    {
        return arr.length;
    }
                    
    arr = str.split(':');
    if(arr.length>1)
    {
        return arr.length;
    }

    const parsedValue = parseFloat(str);
    if(isNaN(parsedValue)) 
    {
        return 1;
    }
    return 0;
}
function getValue(str)
{
    var arr = str.split(',');
    if(arr.length>1)
    {
        var res_arr = [];
        for(var i=0;i<arr.length;i++)
        {
            res_arr.push(parseFloat(arr[i]))
        }
        return res_arr;
    }
                    
    arr = str.split(':');
    if(arr.length>1)
    {
        var res_arr = [];
        for(var i=0;i<arr.length;i++)
        {
            res_arr.push(parseFloat(arr[i]))
        }
        return res_arr;
    }

    const parsedValue = parseFloat(str);
    if(isNaN(parsedValue)) 
    {
        if(str=="false") return false;
        return true;
    }
    return parsedValue;
}
function applyPresetToSelectedLayersOnPRM(presetName,preset_path) 
{
    if(!terminal.activate)
    {
        return "Error: please activate license.";
    }
    try 
    {                       
        var content = LoadPreset(preset_path);                            
        var preset = ParsePreset(content,presetName);

        if(preset==null)
        {
            return "Error applying preset: Invalid preset";
        }
        
        var seq = app.project.activeSequence;
          
        if(seq == null) 
        {
            return "No active sequence";
        }

        var selected = seq.getSelection();
        if (selected.length === 0)
        {
            return "No clips selected";
        }
        var effectApplied = false;
        for(var i=0;i<selected.length;i++)
        {
            var clip = selected[i];     
            if(clip.mediaType!="Video") continue;
            var trackId = clip.parentTrackIndex; 
            var itemId = getItemIndexOnPRM(trackId,clip.mediaType,clip);
            if (itemId!=-1)
            {
                var qeClip = qe.project.getActiveSequence().getVideoTrackAt(trackId).getItemAt(itemId);
                try {
                    for(var iEffect=0;iEffect<preset.effects.length;iEffect++)
                    {                                
                        var effectMatchName = preset.effects[iEffect].matchName;
                        var videoEffect = qe.project.getVideoEffectByName(effectMatchName, true);
                        if(videoEffect)
                        {                                                        
                            var qeEffect = qeClip.addVideoEffect(videoEffect);
                            var layer_duration = clip.duration.seconds;
                            var params = preset.effects[iEffect].params;
                            var AnchorInPoint = parseFloat(preset.effects[iEffect].AnchorInPoint);
                            var AnchorOutPoint = parseFloat(preset.effects[iEffect].AnchorOutPoint);
                            var preset_duration = AnchorOutPoint-AnchorInPoint;
                                
                            for(var iParam=0;iParam<params.length;iParam++)
                            {
                                    var param = params[iParam];
                                    var effectProperty = clip.components[2].properties[iParam];
                                    if(param.keyframes.length>0)
                                    {
                                        effectProperty.setTimeVarying(true);                                                                    
                                        for(var iKeyframe=0;iKeyframe<param.keyframes.length;iKeyframe++)
                                        {
                                            var keyTime = new Time();
                                            keyTime.seconds = clip.inPoint.seconds;
                                            if(preset_duration!=0)
                                            {
                                                var scale = (parseFloat(param.keyframes[iKeyframe].time)-AnchorInPoint)/preset_duration;
                                                scale = scale*layer_duration;
                                                keyTime.seconds = keyTime.seconds+scale;
                                            }
                                            //alert(JSON.stringify(keyTime.seconds));
                                            if(param.keyframes[iKeyframe].value!="")
                                            {
                                                effectProperty.addKey(keyTime);
                                                effectProperty.setValueAtKey(keyTime, getValue(param.keyframes[iKeyframe].value), 1);
                                            }
                                            
                                        }                                                                                                                                       
                                    }
                                    else
                                    {
                                        if(param.currentValue!="" && param.ParameterControlType!="11" && param.ParameterControlType!="5"
                                        && param.ParameterControlType!="16")
                                        {
                                            if(getType(param.currentValue)==getType(JSON.stringify(effectProperty.getValue())))
                                            {
                                                effectProperty.setValue(getValue(param.currentValue), 1);                                                                            
                                            }
                                            else
                                            {
                                                                                                                           
                                            }
                                        }
                                        
                                    }
                            }                                
                            
                            effectApplied = true;
                        }
                    }                                                  
                } catch (effectError) {
                    return "Error applying preset: " + effectError.toString();
                }
            }
        }

        return effectApplied ? "Preset applied successfully" : "No clips selected";
                        
    } catch (e) 
    {
        return "Error: " + e.toString();
    }
}