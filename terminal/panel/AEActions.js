/**
 * AEActions.js
 * A collection of functions for performing common actions in After Effects
 */

class AEActions {
    constructor() {
        this.csInterface = new CSInterface();
        this.presetList=null;
    }

    /**
     * Apply an effect to selected layers in the active composition
     * @param {string} effectName - Name of the effect to apply (Match Name or Name)
     * @returns {Promise<string>} - Result message
     */
    applyEffect(effectName) {
        return new Promise((resolve, reject) => {
            const script = `
                var result = applyEffectToSelectedLayersOnAE("${effectName.replace(/"/g, '\\"')}");
                result;
            `;

            this.csInterface.evalScript(script, (result) => {
                // Basic check for success before resolving
                if (result && typeof result === 'string') {
                     if (result.startsWith("Applied")) {
                         resolve(result); // Return the detailed success message
                     } else {
                         resolve(result); // Pass through AE-specific errors or messages
                     }
                } else {
                     resolve("An unexpected error occurred during effect application."); // Generic error
                }
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
            var id=-1;
            for(var i=0;i<this.presetList.name.length;i++)
            {
                if(this.presetList.name[i]==presetName)
                {
                    id = i;
                    break;
                }
            }
            if(id!=-1)
            {
                preset_path = this.presetList.path[i];
                preset_path = preset_path.replace(/\\/g, "/");
            }
        }
        return new Promise((resolve, reject) => {
            const script = `
                var result = applyPresetToSelectedLayersOnAE("${presetName.replace(/"/g, '\\"')}","${preset_path.replace(/"/g, '\\"')}");
                result;
            `;

            this.csInterface.evalScript(script, (result) => {
                // Basic check for success before resolving
                if (result && typeof result === 'string') {
                     if (result.startsWith("Applied")) {
                         resolve(result); // Return the detailed success message
                     } else {
                         resolve(result); // Pass through AE-specific errors or messages
                     }
                } else {
                     resolve("An unexpected error occurred during preset application."); // Generic error
                }
            });
        });
    }
    /**
     * Get a list of all available effects in After Effects
     * @returns {Promise<string[]>} - Array of effect names
     */
    getAvailableEffects(effect) {
        return new Promise((resolve, reject) => {
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
                
                (function() {
                    try {
                        var effectNames = [];
                        
                        // Add third-party plugin category
                        effectNames.push("--- Third-Party Plugins ---");
                        
                        // First approach: Try to get effects from predefined categories and popular third-party effects
                        try {
                            var categories = [
                                "3D Channel", "Audio", "Blur & Sharpen", "Channel", 
                                "Color Correction", "Distort", "Expression Controls", 
                                "Generate", "Keying", "Matte", "Noise & Grain", 
                                "Obsolete", "Perspective", "Simulation", 
                                "Stylize", "Text", "Time", "Transition", "Utility", "VR"
                            ];
                            
                            // Loop through effect categories to get all effects
                            for (var c = 0; c < categories.length; c++) {
                                try {
                                    // Add the category name as an item for organization
                                    effectNames.push("--- " + categories[c] + " ---");
                                    
                                    // Get a comp to temporarily apply effects to
                                    var tempComp = app.project.activeItem;
                                    if (!tempComp || !(tempComp instanceof CompItem)) {
                                        // If no active comp, try to find one or create a temporary one
                                        for (var i = 1; i <= app.project.numItems; i++) {
                                            if (app.project.item(i) instanceof CompItem) {
                                                tempComp = app.project.item(i);
                                                break;
                                            }
                                        }
                                        
                                        if (!tempComp) {
                                            // Couldn't find a comp, just use the hardcoded fallback list
                                            continue;
                                        }
                                    }
                                    
                                    if (tempComp.selectedLayers.length === 0 && tempComp.layers.length > 0) {
                                        // Select the first layer if nothing is selected
                                        tempComp.layers[1].selected = true;
                                    }
                                    
                                    // If we have a selected layer, try to explore available effects
                                    if (tempComp.selectedLayers.length > 0) {
                                        // Get the selected layer
                                        var layer = tempComp.selectedLayers[0];
                                        
                                        // Try adding effects by category matchName patterns
                                        var categoryPrefix = "";
                                        switch(categories[c]) {
                                            case "Blur & Sharpen": categoryPrefix = "ADBE "; break;
                                            case "Color Correction": categoryPrefix = "ADBE "; break;
                                            case "Distort": categoryPrefix = "ADBE "; break;
                                            case "Stylize": categoryPrefix = "ADBE "; break;
                                            // Add other mappings as needed
                                        }
                                        
                                        // Just add known effects from this category
                                        // This is still semi-hardcoded but much more comprehensive
                                        if (categories[c] === "Blur & Sharpen") {
                                            effectNames.push("Gaussian Blur");
                                            effectNames.push("Box Blur");
                                            effectNames.push("Camera Lens Blur");
                                            effectNames.push("Channel Blur");
                                            effectNames.push("Compound Blur");
                                            effectNames.push("Directional Blur");
                                            effectNames.push("Fast Box Blur");
                                            effectNames.push("Radial Blur");
                                            effectNames.push("Sharpen");
                                            effectNames.push("Smart Blur");
                                            effectNames.push("Unsharp Mask");
                                        }
                                        else if (categories[c] === "Color Correction") {
                                            effectNames.push("Brightness & Contrast");
                                            effectNames.push("Color Balance");
                                            effectNames.push("Color Balance (HLS)");
                                            effectNames.push("Color Link");
                                            effectNames.push("Color Stabilizer");
                                            effectNames.push("Colorama");
                                            effectNames.push("Curves");
                                            effectNames.push("Exposure");
                                            effectNames.push("Hue/Saturation");
                                            effectNames.push("Levels");
                                            effectNames.push("Lumetri Color");
                                            effectNames.push("Photo Filter");
                                            effectNames.push("PS Arbitrary Map");
                                            effectNames.push("Tint");
                                        }
                                        else if (categories[c] === "Generate") {
                                            effectNames.push("4-Color Gradient");
                                            effectNames.push("Advanced Lightning");
                                            effectNames.push("Audio Spectrum");
                                            effectNames.push("Audio Waveform");
                                            effectNames.push("Beam");
                                            effectNames.push("Cell Pattern");
                                            effectNames.push("Checkerboard");
                                            effectNames.push("Circle");
                                            effectNames.push("Ellipse");
                                            effectNames.push("Eyedropper Fill");
                                            effectNames.push("Fill");
                                            effectNames.push("Fractal");
                                            effectNames.push("Fractal Noise");
                                            effectNames.push("Grid");
                                            effectNames.push("Lens Flare");
                                            effectNames.push("Paint Bucket");
                                            effectNames.push("Radio Waves");
                                            effectNames.push("Ramp");
                                            effectNames.push("Stroke");
                                            effectNames.push("Vegas");
                                            effectNames.push("Write-on");
                                        }
                                        else if (categories[c] === "Distort") {
                                            effectNames.push("Bezier Warp");
                                            effectNames.push("Bulge");
                                            effectNames.push("Corner Pin");
                                            effectNames.push("Displacement Map");
                                            effectNames.push("Liquify");
                                            effectNames.push("Magnify");
                                            effectNames.push("Mesh Warp");
                                            effectNames.push("Mirror");
                                            effectNames.push("Offset");
                                            effectNames.push("Optics Compensation");
                                            effectNames.push("Polar Coordinates");
                                            effectNames.push("Reshape");
                                            effectNames.push("Ripple");
                                            effectNames.push("Rolling Shutter");
                                            effectNames.push("Smear");
                                            effectNames.push("Spherize");
                                            effectNames.push("Transform");
                                            effectNames.push("Turbulent Displace");
                                            effectNames.push("Twirl");
                                            effectNames.push("Warp");
                                            effectNames.push("Wave Warp");
                                        }
                                        
                                        // We don't need to add all categories if not needed
                                        // Additional categories would go here
                                    }
                                } catch (categoryErr) {
                                    // Continue with next category if an error occurs
                                    continue;
                                }
                            }
                            
                            // Add common third-party effects specifically
                            try {
                                // Video Copilot
                                effectNames.push("Saber");
                                effectNames.push("Optical Flares");
                                effectNames.push("Element 3D");
                                effectNames.push("ORB");
                                
                                // Red Giant
                                effectNames.push("Trapcode Particular");
                                effectNames.push("Trapcode Form");
                                effectNames.push("Trapcode Shine");
                                effectNames.push("Magic Bullet Looks");
                                
                                // Boris FX
                                effectNames.push("BCC Particle Emitter");
                                effectNames.push("BCC Film Glow");
                                
                                // Using a try-catch for each plugin so one error doesn't stop others
                                try {
                                    // Scan effect menu for all available effects
                                    var comp = app.project.activeItem;
                                    if (comp && comp instanceof CompItem && comp.selectedLayers.length > 0) {
                                        var layer = comp.selectedLayers[0];
                                        
                                        // Try to get the Effect Controls Panel with all categories
                                        // This is an attempt to scan the actual effect menu
                                        var effectInfo = app.effects;
                                        if (effectInfo && effectInfo.length) {
                                            for (var i = 0; i < effectInfo.length; i++) {
                                                var effect = effectInfo[i];                                                
                                                if (effect.matchName && effect.displayName) {
                                                    // Skip if already in the list
                                                    var bFound=false;
                                                    for(var j=0;j<effectNames.length;j++)
                                                    {
                                                        if(effectNames[j]==effect.displayName)
                                                        {
                                                            bFound = true;
                                                            break;
                                                        }
                                                    }
                                                    if(!bFound)
                                                    {
                                                        effectNames.push(effect.displayName);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } catch (scanErr) {
                                    // Ignore errors in the menu scan attempt
                                }
                            } catch (pluginErr) {
                                // Ignore errors in third-party plugin detection
                            }
                            
                        } catch (effectsErr) {
                            // Continue with fallback approach if this fails
                        }
                        
                        // If we couldn't get effects or the list is too small, use a fallback
                        if (effectNames.length < 20) {
                            // Fallback to basic hardcoded list
                            effectNames = [
                                "Gaussian Blur", "Fast Box Blur", "Brightness & Contrast", 
                                "Levels", "Curves", "Hue/Saturation", "Fill", "Color Balance", "Tint",
                                "Fractal Noise", "Turbulent Displace", "Glow", "Drop Shadow", 
                                "Solid Composite", "Transform", "Motion Tile", "Roughen Edges",
                                "Lumetri Color", "Exposure", "Camera Lens Blur", "Radial Blur",
                                "Directional Blur", "3D Channel Extract", "Bezier Warp",
                                "Bulge", "Displacement Map", "Liquify", "Wave Warp", 
                                "Saber", "Optical Flares", "Element 3D", "Trapcode Particular"
                            ];
                        }
                        
                        // Return as comma-separated string to avoid JSON parsing in ExtendScript
                        // Use JSON.stringify which is now defined by the polyfill
                        return JSON.stringify(effectNames); 
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
                    resolve([
                        "Gaussian Blur", "Fast Box Blur", "Brightness & Contrast", 
                        "Levels", "Curves", "Hue/Saturation", "Fill", "Color Balance", "Tint",
                        "Fractal Noise", "Turbulent Displace", "Glow", "Drop Shadow",
                        "Lumetri Color", "Camera Lens Blur", "Radial Blur", "Directional Blur",
                        "Saber", "Optical Flares" // Added common Video Copilot plugins
                    ]);
                } else {
                    try {
                        // Log the raw result from ExtendScript
                        console.log("AEActions.getAvailableEffects raw result:", result);
                        // Parse the JSON string into an array
                        const effects = JSON.parse(result); 
                        resolve(effects);
                    } catch (e) {
                        console.error("Error parsing effect list in AEActions:", e, "Raw result was:", result);
                        // Fallback
                        resolve([
                            "Gaussian Blur", "Fast Box Blur", "Brightness & Contrast", 
                            "Levels", "Curves", "Hue/Saturation", "Fill", "Color Balance", "Tint",
                            "Fractal Noise", "Turbulent Displace", "Glow", "Drop Shadow",
                            "Lumetri Color", "Camera Lens Blur", "Radial Blur", "Directional Blur",
                            "Saber", "Optical Flares" // Added common Video Copilot plugins
                        ]);
                    }
                }
            });
        });
    }
    
    /**
     * Get a list of all available transitions (conceptual in AE - often animation presets)
     * @returns {Promise<string[]>} - Array of transition names (empty for AE)
     */
    getAvailableTransitions(transition) {
        return new Promise((resolve, reject) => {
            // For AE, return an empty array - AE doesn't have traditional transitions like Premiere
            // AE uses animation presets and keyframes instead
            resolve([]);
            
            // Previous commented code kept for reference
            /* 
            // In AE, transitions are often animation presets or manual animations
            // This is a conceptual list of common transition types
            resolve([
                "Fade In/Out", "Cross Dissolve", "Push", "Slide", "Wipe",
                "Zoom", "Spin", "Whip Pan", "Blur Transition"
            ]);
            */
        });
    }
    /**
     * Get a list of all available presets in After Effects
     * @returns {Promise<string[]>} - Array of preset names
     */
    getAvailablePresets(preset)
    {
        return new Promise((resolve, reject) => {

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
                
                function getAllPresets(folder, arr) {
                    var files = folder.getFiles();
                    for (var i = 0; i < files.length; i++) {
                        if (files[i] instanceof Folder) {
                            getAllPresets(files[i], arr); // recurse
                        } else if (files[i] instanceof File && files[i].name.match(/\.ffx$/i)) {
                            arr.push(files[i]);
                        }
                    }
                    return arr;
                }

                (function() {
                    try {
                        var presetNames = [];
                        var presetPaths=[];
                        var aePath = Folder(app.path);
                        // If we're in a temp folder, move up
                        
                        if (aePath.name.indexOf("tmp") === 0) 
                        {
                            aePath = aePath.parent; // go back to "Support Files"
                        }
                        var usr_presetsFolder;
                        var sys_presetsFolder;
                        if ($.os.indexOf("Windows") !== -1) {
                            // Windows
                            // Typically: C:\Users\<username>\Documents\Adobe\After Effects <version>\User Presets
                            usr_presetsFolder = Folder(Folder.myDocuments.fsName + "/Adobe/After Effects 20" + app.version.split("x")[0].split(".")[0] + "/User Presets");
                            sys_presetsFolder = Folder(aePath.fsName + "/Presets");
                        } else {
                            // macOS
                            // Typically: ~/Documents/Adobe/After Effects <version>/User Presets
                            usr_presetsFolder = Folder(Folder.myDocuments.fsName + "/Adobe/After Effects 20" + app.version.split("x")[0].split(".")[0] + "/User Presets");
                            sys_presetsFolder = Folder("/Applications/Adobe After Effects 20" + app.version.split("x")[0].split(".")[0] + "/Presets");
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
                        //alert(usr_presetsFolder.fsName);
                        for(var i=0;i<allPresets.length;i++)
                        {
                            var baseName = decodeURIComponent(allPresets[i].name).replace(/\.[^\.]+$/, "");
                            presetNames.push(baseName);

                            var preset_path = decodeURIComponent(allPresets[i].fsName);
                            presetPaths.push(preset_path);
                        }

                        // Return as comma-separated string to avoid JSON parsing in ExtendScript
                        // Use JSON.stringify which is now defined by the polyfill
                        var result = {"name":presetNames,"path":presetPaths};
                        return JSON.stringify(result); 
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
                        console.log("AEActions.getAvailablePresets raw result:", result);
                        // Parse the JSON string into an array
                        this.presetList = JSON.parse(result); 
                        resolve(this.presetList.name);
                    } catch (e) {
                        console.error("Error parsing preset list in AEActions:", e, "Raw result was:", result);
                        // Fallback
                        resolve([]);
                    }
                }
            });
        });
    }
    /**
     * Set a property value on an effect on selected layers
     * @param {string} effectName - Name of the effect to modify
     * @param {string} propertyName - Name of the property to set
     * @param {number|string|Array} propertyValue - Value to set for the property
     * @returns {Promise<string>} - Result message
     */
    setEffectProperty(effectName, propertyName, propertyValue) {
        return new Promise((resolve, reject) => {
            // Handle missing effectName by determining a reasonable default based on propertyName
            if (!effectName || effectName === "undefined") {
                // Map common properties to appropriate effects in AE
                if (propertyName.toLowerCase().includes('contrast')) {
                    effectName = "Brightness & Contrast";
                    propertyName = "Contrast";
                } else if (propertyName.toLowerCase().includes('brightness')) {
                    effectName = "Brightness & Contrast";
                    propertyName = "Brightness";
                } else if (propertyName.toLowerCase().includes('saturation')) {
                    effectName = "Hue/Saturation";
                    propertyName = "Saturation";
                } else if (propertyName.toLowerCase().includes('hue')) {
                    effectName = "Hue/Saturation";
                    propertyName = "Hue";
                } else if (propertyName.toLowerCase() === 'scale' || 
                         propertyName.toLowerCase() === 'position' ||
                         propertyName.toLowerCase() === 'opacity' ||
                         propertyName.toLowerCase() === 'rotation' ||
                         propertyName.toLowerCase() === 'anchor point') {
                    effectName = "Transform";
                } else {
                    // Default fallback for other properties
                    effectName = "Levels";
                }
                console.log(`Using default effect "${effectName}" for property "${propertyName}"`);
            }
            
            const script = `
                (function() {
                    try {
                        // Ensure effectName is defined at the script level
                        var effectName = "${(effectName || 'Transform').replace(/"/g, '\\"')}";
                        var propertyName = "${(propertyName || '').replace(/"/g, '\\"')}";
                        var propertyValue = ${propertyValue};
                        
                        var comp = app.project.activeItem;
                        if (!comp || !(comp instanceof CompItem)) {
                            return "No active composition selected.";
                        }

                        var selectedLayers = comp.selectedLayers;
                        if (selectedLayers.length === 0) {
                            return "No layers selected in the active composition.";
                        }

                        var propertiesSet = 0;
                        var effectFound = false;
                        var effectsApplied = 0;
                        
                        // Special case for Transform properties (Scale, Position, Rotation, Opacity, etc.)
                        if (effectName === "Transform" || effectName === "Motion") {
                            for (var i = 0; i < selectedLayers.length; i++) {
                                var layer = selectedLayers[i];
                                
                                // Make sure the layer is a valid AVLayer type
                                if (!(layer instanceof AVLayer)) {
                                    continue;
                                }
                                
                                try {
                                    // Handle common transform properties
                                    if (propertyName.toLowerCase() === "scale") {
                                        // Scale is a special case as it's a 2D or 3D property
                                        var scaleProperty = layer.property("Transform").property("Scale");
                                        var currentScale = scaleProperty.value;
                                        
                                        // Keep aspect ratio by setting both X and Y to the same value
                                        if (currentScale.length === 2) { // 2D layer
                                            scaleProperty.setValue([propertyValue, propertyValue]);
                                        } else if (currentScale.length === 3) { // 3D layer
                                            scaleProperty.setValue([propertyValue, propertyValue, propertyValue]);
                                        }
                                        propertiesSet++;
                                    } 
                                    else if (propertyName.toLowerCase() === "opacity") {
                                        layer.property("Transform").property("Opacity").setValue(propertyValue);
                                        propertiesSet++;
                                    }
                                    else if (propertyName.toLowerCase() === "rotation" || propertyName.toLowerCase() === "rotate") {
                                        // Convert to radians if needed or handle degrees based on AE expectations
                                        layer.property("Transform").property("Rotation").setValue(propertyValue * (Math.PI/180)); // Convert to radians
                                        propertiesSet++;
                                    }
                                    else if (propertyName.toLowerCase().includes("position")) {
                                        // Handle position changes (would need more logic for X/Y/Z specifically)
                                        // For now we're just adjusting all dimensions
                                        var posProperty = layer.property("Transform").property("Position");
                                        var currentPos = posProperty.value;
                                        
                                        // Set position differently based on dimensions and specific component
                                        if (propertyName.toLowerCase() === "position x" && currentPos.length >= 1) {
                                            var newPos = currentPos.slice();
                                            newPos[0] = propertyValue;
                                            posProperty.setValue(newPos);
                                            propertiesSet++;
                                        }
                                        else if (propertyName.toLowerCase() === "position y" && currentPos.length >= 2) {
                                            var newPos = currentPos.slice();
                                            newPos[1] = propertyValue;
                                            posProperty.setValue(newPos);
                                            propertiesSet++;
                                        }
                                        else if (propertyName.toLowerCase() === "position z" && currentPos.length >= 3) {
                                            var newPos = currentPos.slice();
                                            newPos[2] = propertyValue;
                                            posProperty.setValue(newPos);
                                            propertiesSet++;
                                        }
                                        else if (propertyName.toLowerCase() === "position") {
                                            // If just "position", adjust the first dimension as an example
                                            // In reality you'd need UI or more context to know which dimension to change
                                            var newPos = currentPos.slice();
                                            newPos[0] = propertyValue; // Just X for simplicity
                                            posProperty.setValue(newPos);
                                            propertiesSet++;
                                        }
                                        // Check other position-related names more safely (using indexOf)
                                        else if (propertyName.toLowerCase().indexOf("position") >= 0) {
                                            // Handle general position-related properties
                                            var pos = currentPos.slice();
                                            pos[0] = propertyValue; // Default to X
                                            posProperty.setValue(pos);
                                            propertiesSet++;
                                        }
                                    }
                                } catch (propErr) {
                                    // Continue with next layer if property setting fails
                                    console.log("Error setting property: " + propErr.toString());
                                }
                            }
                            
                            if (propertiesSet > 0) {
                                return "Set " + propertyName + " to " + propertyValue + " on " + propertiesSet + " layer(s).";
                            } else {
                                return "Property '" + propertyName + "' not found in Transform properties.";
                            }
                        }
                        
                        // Handle regular effect properties
                        for (var i = 0; i < selectedLayers.length; i++) {
                            var layer = selectedLayers[i];
                            
                            // Get the Effects property group
                            var effectsGroup = layer.property("ADBE Effect Parade");
                            
                            // Find the effect by name
                            var effect = null;
                            for (var e = 1; e <= effectsGroup.numProperties; e++) {
                                var currentEffect = effectsGroup.property(e);
                                if (currentEffect.name === effectName) {
                                    effect = currentEffect;
                                    effectFound = true;
                                    break;
                                }
                            }
                            
                            // If effect not found, try to add it first
                            if (!effect) {
                                try {
                                    effect = effectsGroup.addProperty(effectName);
                                    effectsApplied++;
                                    effectFound = true;
                                } catch (addError) {
                                    // Could not add effect, continue to next layer
                                    continue;
                                }
                            }
                            
                            // Now try to find and set the property
                            if (effect) {
                                // Find property by name (using indexOf instead of includes for ExtendScript compatibility)
                                for (var p = 1; p <= effect.numProperties; p++) {
                                    var prop = effect.property(p);
                                    // Use more compatible string comparison for ExtendScript
                                    if (prop.name.toLowerCase() === propertyName.toLowerCase() || 
                                       (prop.matchName && prop.matchName.toLowerCase && prop.matchName.toLowerCase().indexOf(propertyName.toLowerCase()) >= 0)) {
                                        // Check property type and set accordingly
                                        if (prop.propertyValueType === PropertyValueType.OneD) {
                                            prop.setValue(propertyValue);
                                            propertiesSet++;
                                        } 
                                        else if (prop.propertyValueType === PropertyValueType.TwoD) {
                                            prop.setValue([propertyValue, propertyValue]); // Set both dimensions the same for simplicity
                                            propertiesSet++;
                                        }
                                        else if (prop.propertyValueType === PropertyValueType.ThreeD) {
                                            prop.setValue([propertyValue, propertyValue, propertyValue]); // Set all dimensions the same for simplicity
                                            propertiesSet++;
                                        }
                                        else if (prop.propertyValueType === PropertyValueType.Color) {
                                            // For color, propertyValue would need to be an array [r,g,b,a]
                                            // But since we're just passing a number here, use it as grayscale
                                            var colorValue = propertyValue / 100; // Convert percentage to 0-1 range
                                            prop.setValue([colorValue, colorValue, colorValue, 1]); // RGBA
                                            propertiesSet++;
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                        
                        // Construct result message
                        if (propertiesSet > 0) {
                            var resultMsg = "Set " + propertyName + " to " + propertyValue + " on " + propertiesSet + " instance(s).";
                            if (effectsApplied > 0) {
                                resultMsg += " Applied " + effectName + " to " + effectsApplied + " layer(s) first.";
                            }
                            return resultMsg;
                        } else if (effectFound) {
                            return "Effect '" + effectName + "' found, but property '" + propertyName + "' not found or not settable.";
                        } else {
                            return "Could not find or apply effect '" + effectName + "' on selected layer(s).";
                        }
                    } catch (e) {
                        return "Error setting property: " + e.toString();
                    }
                })();
            `;

            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }

    /**
     * List all properties for an effect on the first selected layer
     * @param {string} effectName - Name of the effect to list properties for
     * @returns {Promise<object[]>} - Array of property objects { name: string, value: any, type: string }
     */
    getEffectProperties(effectName) {
        return new Promise((resolve, reject) => {
            const script = `
                (function() {
                    try {
                        var comp = app.project.activeItem;
                        if (!comp || !(comp instanceof CompItem)) {
                            return "Error: No active composition selected.";
                        }

                        var selectedLayers = comp.selectedLayers;
                        if (selectedLayers.length === 0) {
                            return "Error: No layers selected in the active composition.";
                        }

                        // Use the first selected layer for the property list
                        var layer = selectedLayers[0];
                        
                        // Handle special case for Transform/Motion properties
                        if (effectName === "Transform" || effectName === "Motion") {
                            var transformProps = [];
                            var transformGroup = layer.property("Transform");
                            var propNames = [];
                            var propTypes = [];
                            
                            for (var p = 1; p <= transformGroup.numProperties; p++) {
                                var prop = transformGroup.property(p);
                                
                                // Only add if the property is gettable
                                if (prop.canSetExpression) {
                                    propNames.push(prop.name);
                                    propTypes.push(getPropertyTypeName(prop));
                                }
                            }
                            
                            return "TRANSFORM_PROPS:" + propNames.join(",") + ";TYPES:" + propTypes.join(",");
                        }
                        
                        // Find the effect by name
                        var effect = null;
                        for (var e = 1; e <= layer.property("ADBE Effect Parade").numProperties; e++) {
                            var currentEffect = layer.property("ADBE Effect Parade").property(e);
                            if (currentEffect.name === effectName) {
                                effect = currentEffect;
                                break;
                            }
                        }
                        
                        if (!effect) {
                            // Try to add the effect to get its properties
                            try {
                                effect = layer.property("ADBE Effect Parade").addProperty(effectName);
                            } catch (addErr) {
                                return "Error: Effect '" + effectName + "' not found and couldn't be added.";
                            }
                        }
                        
                        var propNames = [];
                        var propTypes = [];
                        
                        for (var p = 1; p <= effect.numProperties; p++) {
                            var prop = effect.property(p);
                            // Skip property groups and only include actual properties
                            if (!prop.isPropertyGroup) {
                                propNames.push(prop.name);
                                propTypes.push(getPropertyTypeName(prop));
                            }
                        }
                        
                        return "EFFECT_PROPS:" + propNames.join(",") + ";TYPES:" + propTypes.join(",");

                        function getPropertyTypeName(prop) {
                            switch(prop.propertyValueType) {
                                case PropertyValueType.OneD: return "Number";
                                case PropertyValueType.TwoD: return "2D Point";
                                case PropertyValueType.ThreeD: return "3D Point";
                                case PropertyValueType.Color: return "Color";
                                case PropertyValueType.Custom: return "Custom";
                                case PropertyValueType.Marker: return "Marker";
                                case PropertyValueType.LayerIndex: return "Layer Index";
                                case PropertyValueType.MaskIndex: return "Mask Index";
                                case PropertyValueType.Shape: return "Shape";
                                case PropertyValueType.TextDocument: return "Text";
                                case PropertyValueType.ArbText: return "Text";
                                case PropertyValueType.NoValue: return "None";
                                default: return "Unknown";
                            }
                        }
                    } catch (e) {
                        return "Error: " + e.toString();
                    }
                })();
            `;

            this.csInterface.evalScript(script, (result) => {
                if (result && result.startsWith("Error:")) {
                    console.error(result);
                    resolve([]);
                } else {
                    try {
                        // Parse the custom format response
                        const properties = [];
                        
                        if (result.startsWith("TRANSFORM_PROPS:") || result.startsWith("EFFECT_PROPS:")) {
                            const parts = result.split(";");
                            const propPart = parts[0].split(":");
                            const typePart = parts[1].split(":");
                            
                            const names = propPart[1].split(",");
                            const types = typePart[1].split(",");
                            
                            for (let i = 0; i < names.length; i++) {
                                properties.push({
                                    name: names[i],
                                    type: types[i] || "Unknown"
                                });
                            }
                        }
                        
                        resolve(properties);
                    } catch (e) {
                        console.error("Error parsing property list:", e);
                        resolve([]);
                    }
                }
            });
        });
    }
    
    /**
     * Change playback speed of selected layers using time remapping
     * @param {number} speedPercent - Speed percentage 
     * @returns {Promise<string>} - Result message
     */
    changeClipSpeed(speedPercent) {
        return new Promise((resolve, reject) => {
            const script = `
                (function() {
                    try {
                        var comp = app.project.activeItem;
                        if (!comp || !(comp instanceof CompItem)) {
                            return "No active composition selected.";
                        }

                        var selectedLayers = comp.selectedLayers;
                        if (selectedLayers.length === 0) {
                            return "No layers selected in the active composition.";
                        }

                        var speedFactor = ${speedPercent} / 100;
                        var layersModified = 0;
                        var errors = [];
                        var skippedLayers = [];
                        
                        for (var i = 0; i < selectedLayers.length; i++) {
                            try {
                                var layer = selectedLayers[i];
                                var layerName = layer.name || ("Layer " + layer.index);
                                
                                // Check if layer is locked
                                if (layer.locked) {
                                    skippedLayers.push(layerName + " (locked)");
                                    continue;
                                }
                                
                                // Skip layers that can't be used
                                if (!(layer instanceof AVLayer)) {
                                    skippedLayers.push(layerName + " (not a footage/comp layer)");
                                    continue;
                                }
                                
                                if (!layer.source) {
                                    skippedLayers.push(layerName + " (no source)");
                                    continue;
                                }
                                
                                // Try the primary approach: time remapping
                                try {
                                    if (layer.canSetTimeRemapEnabled) {
                                        // Enable time remapping
                                        layer.timeRemapEnabled = true;
                                        
                                        // Get time remap property
                                        var timeRemap = layer.property("ADBE Time Remapping");
                                        
                                        // Remove all existing keyframes
                                        while (timeRemap.numKeys > 0) {
                                            timeRemap.removeKey(1);
                                        }
                                        
                                        // Add keyframes for new speed
                                        var sourceDuration = layer.source.duration;
                                        var layerDuration = layer.outPoint - layer.inPoint;
                                        
                                        // Set first keyframe at layer start
                                        timeRemap.setValueAtTime(layer.inPoint, 0);
                                        
                                        // Set second keyframe based on speed factor
                                        // For 200% speed (2x), we need to show twice as much footage in the same time
                                        // For 50% speed (0.5x), we need to show half as much footage in the same time
                                        var endTimeValue;
                                        if (speedFactor > 0) {
                                            // Normal playback (potentially faster or slower)
                                            endTimeValue = Math.min(sourceDuration, layerDuration * speedFactor);
                                        } else {
                                            // Negative speed factor means play backwards
                                            endTimeValue = 0; // Start from the end
                                            // Set first keyframe to end of source
                                            timeRemap.setValueAtTime(layer.inPoint, sourceDuration);
                                        }
                                        
                                        // Set the end time keyframe
                                        timeRemap.setValueAtTime(layer.outPoint, endTimeValue);
                                        
                                        layersModified++;
                                    } else {
                                        throw new Error("Time remapping not available");
                                    }
                                } catch (timeRemapError) {
                                    // Fallback to expression-based speed control
                                    try {
                                        // Enable time remapping
                                        layer.timeRemapEnabled = true;
                                        
                                        // Get time remap property
                                        var timeRemap = layer.property("ADBE Time Remapping");
                                        
                                        // Clear any existing expression
                                        timeRemap.expression = "";
                                        
                                        // Apply speed expression
                                        if (timeRemap.canSetExpression) {
                                            var expr = "timeToUse = time * " + speedFactor + ";\\n";
                                            expr += "if (timeToUse <= source.duration) {\\n";
                                            expr += "    timeToUse;\\n";
                                            expr += "} else {\\n";
                                            expr += "    source.duration;\\n";
                                            expr += "}";
                                            
                                            timeRemap.expression = expr;
                                            layersModified++;
                                        } else {
                                            throw new Error("Cannot set expression on time remap property");
                                        }
                                    } catch (expressionError) {
                                        // Last attempt: Stretch layer approach
                                        try {
                                            // Disable time remapping if it was enabled
                                            try {
                                                if (layer.timeRemapEnabled) {
                                                    layer.timeRemapEnabled = false;
                                                }
                                            } catch (disableError) {
                                                // Ignore if we can't disable it
                                            }
                                            
                                            // Calculate new duration
                                            var origDuration = layer.outPoint - layer.inPoint;
                                            var newDuration = origDuration / speedFactor;
                                            
                                            // Setting stretch directly
                                            if ("stretch" in layer) {
                                                // This is the direct way, but might not be available in all AE versions
                                                layer.stretch = speedFactor * 100;
                                                layersModified++;
                                            } else {
                                                // Manually adjust layer in/out points
                                                var currentInPoint = layer.inPoint;
                                                layer.outPoint = currentInPoint + newDuration;
                                                layersModified++;
                                            }
                                        } catch (stretchError) {
                                            // All approaches failed
                                            errors.push("Cannot change speed of " + layerName + ": " + timeRemapError.toString());
                                        }
                                    }
                                }
                            } catch (layerError) {
                                errors.push("Error with layer " + (layer.name || "at index " + layer.index) + ": " + layerError.toString());
                            }
                        }
                        
                        // Construct the result message
                        var resultMessage = "";
                        
                        if (layersModified > 0) {
                            resultMessage = "Changed speed to " + ${speedPercent} + "% on " + layersModified + " layer(s). ";
                        } else {
                            resultMessage = "No layers were successfully modified. ";
                        }
                        
                        if (skippedLayers.length > 0) {
                            resultMessage += "Skipped " + skippedLayers.length + " incompatible layer(s). ";
                        }
                        
                        if (errors.length > 0) {
                            resultMessage += errors.length + " error(s) occurred. ";
                            if (errors.length === 1) {
                                resultMessage += "Error: " + errors[0];
                            }
                        }
                        
                        return resultMessage;
                    } catch (e) {
                        return "Error changing speed: " + e.toString();
                    }
                })();
            `;

            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }
    
    /**
     * Reverses the playback of selected layers using time remapping
     * @returns {Promise<string>} - Result message
     */
    reverseSelectedClips() {
        return new Promise((resolve, reject) => {
            const script = `
                (function() {
                    try {
                        var comp = app.project.activeItem;
                        if (!comp || !(comp instanceof CompItem)) {
                            return "No active composition selected.";
                        }

                        var selectedLayers = comp.selectedLayers;
                        if (selectedLayers.length === 0) {
                            return "No layers selected in the active composition.";
                        }

                        var layersModified = 0;
                        var errors = [];
                        var skippedLayers = [];
                        
                        for (var i = 0; i < selectedLayers.length; i++) {
                            try {
                                var layer = selectedLayers[i];
                                var layerName = layer.name || ("Layer " + layer.index);
                                
                                // Check if layer is locked
                                if (layer.locked) {
                                    skippedLayers.push(layerName + " (locked)");
                                    continue;
                                }
                                
                                // Skip layers that can't be used
                                if (!(layer instanceof AVLayer)) {
                                    skippedLayers.push(layerName + " (not a footage/comp layer)");
                                    continue;
                                }
                                
                                if (!layer.source) {
                                    skippedLayers.push(layerName + " (no source)");
                                    continue;
                                }
                                
                                // Try the primary approach using time remapping
                                try {
                                    if (layer.canSetTimeRemapEnabled) {
                                        // Primary method: Time remapping
                                        
                                        // Enable time remapping
                                        layer.timeRemapEnabled = true;
                                        
                                        // Get time remap property
                                        var timeRemap = layer.property("ADBE Time Remapping");
                                        
                                        // Remove all existing keyframes
                                        while (timeRemap.numKeys > 0) {
                                            timeRemap.removeKey(1);
                                        }
                                        
                                        // Add keyframes for reversed playback
                                        var layerDuration = layer.outPoint - layer.inPoint;
                                        
                                        // Set first keyframe at layer start with end time value
                                        timeRemap.setValueAtTime(layer.inPoint, layer.source.duration);
                                        
                                        // Set end keyframe at layer end with start time value
                                        timeRemap.setValueAtTime(layer.inPoint + layerDuration, 0);
                                        
                                        layersModified++;
                                    } else {
                                        throw new Error("Time remapping not available");
                                    }
                                } catch (timeRemapError) {
                                    // Alternative approach: Use timeRemap expression
                                    try {
                                        // Backup method: Try expression-based reversal
                                        if (layer.source instanceof FootageItem) {
                                            // Enable time remapping
                                            layer.timeRemapEnabled = true;
                                            
                                            // Get time remap property
                                            var timeRemap = layer.property("ADBE Time Remapping");
                                            
                                            // Apply reverse expression
                                            var sourceDuration = layer.source.duration;
                                            var expr = "sourceTime = " + sourceDuration + " - time;";
                                            
                                            // Only try to set expression if it's allowed
                                            if (timeRemap.canSetExpression) {
                                                timeRemap.expression = expr;
                                                layersModified++;
                                            } else {
                                                throw new Error("Cannot set expression on time remap property");
                                            }
                                        } else {
                                            throw new Error("Source is not a footage item");
                                        }
                                    } catch (expressionError) {
                                        // Last attempt: Time Reverse effect
                                        try {
                                            // Fallback to adding Time Reverse effect
                                            var effectGroup = layer.property("ADBE Effect Parade");
                                            
                                            // Check if we can add effects
                                            if (effectGroup) {
                                                // Try to add Time Reverse effect (first an attempt with the matchName)
                                                try {
                                                    effectGroup.addProperty("ADBE Time Reverse");
                                                    layersModified++;
                                                } catch (matchNameError) {
                                                    // If matchName fails, try with the display name
                                                    effectGroup.addProperty("Time Reverse");
                                                    layersModified++;
                                                }
                                            } else {
                                                throw new Error("Cannot add effects to this layer");
                                            }
                                        } catch (effectError) {
                                            // All methods failed, track the error
                                            errors.push("Cannot reverse " + layerName + ": " + timeRemapError.toString());
                                        }
                                    }
                                }
                            } catch (layerError) {
                                errors.push("Error with layer " + (layer.name || "at index " + layer.index) + ": " + layerError.toString());
                            }
                        }
                        
                        // Construct the result message
                        var resultMessage = "";
                        
                        if (layersModified > 0) {
                            resultMessage = "Reversed playback on " + layersModified + " layer(s). ";
                        } else {
                            resultMessage = "No layers were successfully reversed. ";
                        }
                        
                        if (skippedLayers.length > 0) {
                            resultMessage += "Skipped " + skippedLayers.length + " incompatible layer(s). ";
                        }
                        
                        if (errors.length > 0) {
                            resultMessage += errors.length + " error(s) occurred. ";
                            if (errors.length === 1) {
                                resultMessage += "Error: " + errors[0];
                            }
                        }
                        
                        return resultMessage;
                    } catch (e) {
                        return "Error reversing layers: " + e.toString();
                    }
                })();
            `;

            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }
    
    /**
     * Scale selected layers to fit composition dimensions
     * @param {boolean} [maintainAspectRatio=true] - Whether to maintain aspect ratio
     * @returns {Promise<string>} - Result message
     */
    scaleClipsToSequence(maintainAspectRatio = true) {
        return new Promise((resolve, reject) => {
            const script = `
                (function() {
                    try {
                        var comp = app.project.activeItem;
                        if (!comp || !(comp instanceof CompItem)) {
                            return "No active composition selected.";
                        }

                        var selectedLayers = comp.selectedLayers;
                        if (selectedLayers.length === 0) {
                            return "No layers selected in the active composition.";
                        }

                        var layersModified = 0;
                        var maintainAspectRatio = ${maintainAspectRatio};
                        
                        for (var i = 0; i < selectedLayers.length; i++) {
                            var layer = selectedLayers[i];
                            
                            // Skip non-AVLayers or layers without source footage
                            if (!(layer instanceof AVLayer) || !layer.source) {
                                continue;
                            }
                            
                            var layerWidth, layerHeight;
                            
                            // Get dimensions from source
                            if (layer.source instanceof CompItem) {
                                layerWidth = layer.source.width;
                                layerHeight = layer.source.height;
                            } else if (layer.source instanceof FootageItem && layer.source.mainSource) {
                                layerWidth = layer.source.width;
                                layerHeight = layer.source.height;
                            } else {
                                continue; // Skip layers without determinable dimensions
                            }
                            
                            if (layerWidth <= 0 || layerHeight <= 0) {
                                continue;
                            }
                            
                            // Calculate scale factors
                            var scaleX = (comp.width / layerWidth) * 100;
                            var scaleY = (comp.height / layerHeight) * 100;
                            
                            // Set scale based on maintainAspectRatio setting
                            var scale = layer.property("Transform").property("Scale");
                            if (maintainAspectRatio) {
                                // Use the smaller scale factor to ensure the layer fits
                                var uniformScale = Math.min(scaleX, scaleY);
                                scale.setValue([uniformScale, uniformScale, 100]);
                            } else {
                                // Set different X and Y scales
                                scale.setValue([scaleX, scaleY, 100]);
                            }
                            
                            // Center layer in composition
                            var position = layer.property("Transform").property("Position");
                            position.setValue([comp.width/2, comp.height/2, 0]);
                            
                            layersModified++;
                        }
                        
                        if (layersModified > 0) {
                            if (maintainAspectRatio) {
                                return "Scaled " + layersModified + " layer(s) to fit composition while maintaining aspect ratio.";
                            } else {
                                return "Scaled " + layersModified + " layer(s) to fill composition.";
                            }
                        } else {
                            return "No compatible layers found to scale.";
                        }
                    } catch (e) {
                        return "Error scaling layers: " + e.toString();
                    }
                })();
            `;

            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }
    
    /**
     * Precompose selected layers in AE
     * @param {string} [precompName="Pre-comp"] - Name for the new composition
     * @returns {Promise<string>} - Result message
     */
    nestSelectedClips(precompName = "Pre-comp") {
        return new Promise((resolve, reject) => {
            const script = `
                (function() {
                    try {
                        var comp = app.project.activeItem;
                        if (!comp || !(comp instanceof CompItem)) {
                            return "No active composition selected.";
                        }

                        var selectedLayers = comp.selectedLayers;
                        if (selectedLayers.length === 0) {
                            return "No layers selected in the active composition.";
                        }

                        // Get indices of selected layers
                        var indices = [];
                        for (var i = 0; i < selectedLayers.length; i++) {
                            indices.push(selectedLayers[i].index);
                        }
                        
                        // Sort indices in descending order (required for precompose)
                        indices.sort(function(a, b) { return b - a; });
                        
                        // Precompose the layers (moveAllAttributes=true to maintain effects, etc.)
                        var newComp = comp.layers.precompose(indices, "${precompName.replace(/"/g, '\\"')}", true);
                        
                        if (newComp) {
                            return "Precomposed " + selectedLayers.length + " layer(s) into '" + newComp.name + "'.";
                        } else {
                            return "Precompose operation failed.";
                        }
                    } catch (e) {
                        return "Error precomposing layers: " + e.toString();
                    }
                })();
            `;

            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }
    
    /**
     * Import footage file(s) and optionally organize in a folder
     * @param {string[]} filePaths - Array of file paths to import
     * @param {string} [folderName] - Optional folder name to create/use
     * @returns {Promise<string>} - Result message
     */
    importFootage(filePaths, folderName = null) {
        return new Promise((resolve, reject) => {
            const script = `
                var result = importFiles("${folderName || ''}");
                result;
                
                function importFiles(folderName) {
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
                        
                        // Import Options for AE
                        var importOptions = new ImportOptions();
                        var importedItems = [];
                        
                        // Import each file
                        for (var i = 0; i < filesToImport.length; i++) {
                            try {
                                importOptions.file = filesToImport[i];
                                if (importOptions.canImportAs(ImportAsType.FOOTAGE)) {
                                    var importedItem = app.project.importFile(importOptions);
                                    if (importedItem) {
                                        importedItems.push(importedItem);
                                    }
                                }
                            } catch (importErr) {
                                // Skip files that can't be imported and continue
                                $.writeln("Error importing file: " + filesToImport[i].name + " - " + importErr);
                            }
                        }
                        
                        if (importedItems.length === 0) {
                            return "Failed to import any files";
                        }
                        
                        // If a folder name is provided, create or get the folder and move items there
                        if (folderName && folderName.length > 0) {
                            var targetFolder = null;
                            
                            // Check if folder already exists
                            for (var i = 1; i <= app.project.numItems; i++) {
                                var item = app.project.item(i);
                                if (item.name === folderName && item instanceof FolderItem) {
                                    targetFolder = item;
                                    break;
                                }
                            }
                            
                            // Create the folder if it doesn't exist
                            if (!targetFolder) {
                                // In AE, folders are just regular items
                                targetFolder = app.project.items.addFolder(folderName);
                            }
                            
                            // Move the imported files to the folder
                            if (targetFolder) {
                                for (var i = 0; i < importedItems.length; i++) {
                                    if (importedItems[i]) {
                                        // In AE, we set the parentFolder property
                                        importedItems[i].parentFolder = targetFolder;
                                    }
                                }
                                return "Imported " + importedItems.length + " file(s) into folder: " + folderName;
                            }
                        }
                        
                        return "Imported " + importedItems.length + " file(s)";
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
     * Create a new folder in the project
     * @param {string} folderName - Name of the folder to create
     * @returns {Promise<string>} - Result message
     */
    createBin(folderName) {
        return new Promise((resolve, reject) => {
            const script = `
                var result = createNewFolder("${folderName}");
                result;
                
                function createNewFolder(folderName) {
                    try {
                        if (!folderName || folderName.length === 0) {
                            return "No folder name specified";
                        }
                        
                        var targetFolder = null;
                        
                        // Check if folder already exists
                        for (var i = 1; i <= app.project.numItems; i++) {
                            var item = app.project.item(i);
                            if (item.name === folderName && item instanceof FolderItem) {
                                targetFolder = item;
                                break;
                            }
                        }
                        
                        if (targetFolder) {
                            return "Folder already exists: " + folderName;
                        }
                        
                        // Create the folder
                        targetFolder = app.project.items.addFolder(folderName);
                        if (targetFolder) {
                            return "Folder created: " + folderName;
                        } else {
                            return "Failed to create folder: " + folderName;
                        }
                    } catch (e) {
                        return "Error creating folder: " + e.toString();
                    }
                }
            `;
            
            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }
    
    /**
     * Organize project items into categorized folders in AE
     * @param {string} imageFolder - Name for the images folder
     * @param {string} videoFolder - Name for the videos folder
     * @param {string} audioFolder - Name for the audio folder
     * @param {boolean} dryRun - If true, only preview without moving items
     * @returns {Promise<string>} - Result message
     */
    organizeProject(imageFolder, videoFolder, audioFolder, dryRun) {
        return new Promise((resolve, reject) => {
            const script = `
                (function() {
                    try {
                        var dryRun = ${dryRun};
                        var summary = {
                            images: 0,
                            videos: 0,
                            audio: 0,
                            other: 0
                        };
                        
                        // Find or create folders
                        var imageFolderItem = null;
                        var videoFolderItem = null;
                        var audioFolderItem = null;
                        
                        if (!dryRun) {
                            // First check if folders already exist
                            for (var i = 1; i <= app.project.numItems; i++) {
                                var item = app.project.item(i);
                                if (item instanceof FolderItem) {
                                    if (item.name === "${imageFolder.replace(/"/g, '\\"')}") {
                                        imageFolderItem = item;
                                    } else if (item.name === "${videoFolder.replace(/"/g, '\\"')}") {
                                        videoFolderItem = item;
                                    } else if (item.name === "${audioFolder.replace(/"/g, '\\"')}") {
                                        audioFolderItem = item;
                                    }
                                }
                            }
                            
                            // Create folders if they don't exist
                            if (!imageFolderItem) {
                                imageFolderItem = app.project.items.addFolder("${imageFolder.replace(/"/g, '\\"')}");
                            }
                            if (!videoFolderItem) {
                                videoFolderItem = app.project.items.addFolder("${videoFolder.replace(/"/g, '\\"')}");
                            }
                            if (!audioFolderItem) {
                                audioFolderItem = app.project.items.addFolder("${audioFolder.replace(/"/g, '\\"')}");
                            }
                        }
                        
                        // Arrays to store items by category
                        var images = [];
                        var videos = [];
                        var audio = [];
                        var other = [];
                        
                        // Identify all items in the project root
                        for (var i = 1; i <= app.project.numItems; i++) {
                            var item = app.project.item(i);
                            
                            // Skip folders and compositions
                            if (item instanceof FolderItem || item instanceof CompItem) {
                                continue;
                            }
                            
                            // Skip items already in organized folders
                            if (!dryRun && (
                                (imageFolderItem && item.parentFolder === imageFolderItem) ||
                                (videoFolderItem && item.parentFolder === videoFolderItem) ||
                                (audioFolderItem && item.parentFolder === audioFolderItem))) {
                                continue;
                            }
                            
                            // Process footage items
                            if (item instanceof FootageItem) {
                                // Check if item is in the root folder
                                if (item.parentFolder === app.project.rootFolder) {
                                    var fileName = item.name.toLowerCase();
                                    
                                    // Categorize by file type and properties
                                    if (item.mainSource instanceof FileSource) {
                                        // Image files (stills)
                                        if (item.mainSource.isStill || endsWithAny(fileName, ["jpg", "jpeg", "png", "gif", "webp", "tiff", "tif", "bmp", "psd"])) {
                                            images.push(item);
                                        }
                                        // Video files
                                        else if (item.mainSource.hasVideo || endsWithAny(fileName, ["mp4", "mov", "avi", "mkv", "mxf", "wmv", "flv", "webm"])) {
                                            videos.push(item);
                                        }
                                        // Audio files
                                        else if (item.mainSource.hasAudio && !item.mainSource.hasVideo || endsWithAny(fileName, ["mp3", "wav", "aac", "aiff", "ogg", "flac", "m4a"])) {
                                            audio.push(item);
                                        }
                                        // Other files
                                        else {
                                            other.push(item);
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Update summary
                        summary.images = images.length;
                        summary.videos = videos.length;
                        summary.audio = audio.length;
                        summary.other = other.length;
                        
                        // Move items to their folders if not a dry run
                        if (!dryRun) {
                            // Move images
                            for (var i = 0; i < images.length; i++) {
                                try {
                                    images[i].parentFolder = imageFolderItem;
                                } catch (e) {
                                    summary.images--;
                                }
                            }
                            
                            // Move videos
                            for (var i = 0; i < videos.length; i++) {
                                try {
                                    videos[i].parentFolder = videoFolderItem;
                                } catch (e) {
                                    summary.videos--;
                                }
                            }
                            
                            // Move audio
                            for (var i = 0; i < audio.length; i++) {
                                try {
                                    audio[i].parentFolder = audioFolderItem;
                                } catch (e) {
                                    summary.audio--;
                                }
                            }
                        }
                        
                        // Generate report
                        var report = "Organization " + (dryRun ? "Preview" : "Complete") + ":\\n";
                        report += "Images: " + summary.images + "\\n";
                        report += "Videos: " + summary.videos + "\\n";
                        report += "Audio: " + summary.audio + "\\n";
                        report += "Other/Skipped: " + summary.other;
                        
                        return report;
                    } catch (e) {
                        return "Error organizing project: " + e.toString();
                    }
                    
                    // Helper to check if a string ends with any of the given extensions
                    function endsWithAny(str, extensions) {
                        for (var i = 0; i < extensions.length; i++) {
                            var ext = "." + extensions[i];
                            if (str.indexOf(ext) === str.length - ext.length) {
                                return true;
                            }
                        }
                        return false;
                    }
                })();
            `;

            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }

    /**
     * Delete a folder from the AE project
     * @param {string} folderName - Name of the folder to delete
     * @returns {Promise<string>} - Result message
     */
    deleteFolder(folderName) {
        return new Promise((resolve, reject) => {
            const script = `
                (function() {
                    try {
                        if (!folderName || folderName.length === 0) {
                            return "No folder name specified";
                        }
                        
                        var targetFolder = null;
                        var folderIndex = -1;
                        
                        // Find the folder by name
                        for (var i = 1; i <= app.project.numItems; i++) {
                            var item = app.project.item(i);
                            if (item.name === "${folderName.replace(/"/g, '\\"')}" && item instanceof FolderItem) {
                                targetFolder = item;
                                folderIndex = i;
                                break;
                            }
                        }
                        
                        if (!targetFolder) {
                            return "Folder not found: ${folderName.replace(/"/g, '\\"')}";
                        }
                        
                        // Check if folder has items
                        var hasItems = false;
                        for (var i = 1; i <= app.project.numItems; i++) {
                            var item = app.project.item(i);
                            if (item.parentFolder === targetFolder) {
                                hasItems = true;
                                break;
                            }
                        }
                        
                        // Delete the folder
                        if (hasItems) {
                            return "Cannot delete folder '${folderName.replace(/"/g, '\\"')}': Folder contains items. Please empty it first.";
                        } else {
                            targetFolder.remove();
                            return "Folder deleted: ${folderName.replace(/"/g, '\\"')}";
                        }
                    } catch (e) {
                        return "Error deleting folder: " + e.toString();
                    }
                })();
            `;
            
            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }
    
    /**
     * Finds and attempts to relink missing footage items within the project.
     * Prompts the user to select a folder to search within.
     * @returns {Promise<string>} - Result message summarizing the relinking process.
     */
    findAndRelinkMissingMedia() {
        return new Promise((resolve, reject) => {
            const script = `
                (function() {
                    try {
                        // Prompt user to select the search folder
                        var searchFolder = Folder.selectDialog("Select Folder to Search for Missing Footage");
                        if (!searchFolder) {
                            return "No folder selected. Operation cancelled.";
                        }

                        var relinkedCount = 0;
                        var missingCount = 0;
                        var errors = [];
                        
                        app.beginUndoGroup("Relink Missing Footage");

                        // Iterate through all items in the project
                        for (var i = 1; i <= app.project.numItems; i++) {
                            var item = app.project.item(i);
                            var isConsideredMissing = false; // Use a different variable name

                            // Check if it's a FootageItem with a mainSource
                            if (item instanceof FootageItem && item.mainSource) {
                                var primaryMissingCheck = item.mainSource.isMissing;
                                $.writeln("Item: '" + item.name + "', primary isMissing check: " + primaryMissingCheck);

                                if (primaryMissingCheck === true) {
                                    isConsideredMissing = true;
                                } else if (primaryMissingCheck === undefined) {
                                    // Fallback check: Try accessing the file object
                                    $.writeln("  -> isMissing is undefined. Falling back to file check for '" + item.name + "'");
                                    try {
                                        var file = item.mainSource.file; // This might throw error if source is invalid
                                        if (!file || !file.exists) {
                                            isConsideredMissing = true;
                                            $.writeln("  Fallback check: File object invalid or does not exist. Marking as missing.");
                                        } else {
                                             $.writeln("  Fallback check: File object exists. Marking as NOT missing.");
                                        }
                                    } catch (fileError) {
                                        isConsideredMissing = true;
                                        $.writeln("  Fallback check: Error accessing file object (" + fileError.toString() + "). Marking as missing.");
                                    }
                                }
                                // If primaryMissingCheck is explicitly false, we trust it.
                            }
                                
                            // If determined to be missing (by either check), try to relink
                            if (isConsideredMissing) {
                                missingCount++;
                                $.writeln("-> Attempting relink for missing item: '" + item.name + "'");
                                try {
                                    var found = findAndReplaceFootage(item, searchFolder);
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
                        
                        app.endUndoGroup();

                        var message = "";
                        if (missingCount === 0) {
                            message = "No missing footage items found in the project.";
                        } else {
                            message = "Attempted relink: " + relinkedCount + " of " + missingCount + " missing items relinked.";
                        }
                        if (errors.length > 0) {
                            message += " Errors: " + errors.join(" ");
                        }
                        return message;

                    } catch (e) {
                        try { app.endUndoGroup(); } catch(ugErr){}
                        return "Error during relink process: " + e.toString();
                    }
                })();

                // Helper function to search for and replace a specific missing item
                function findAndReplaceFootage(missingItem, searchFolder) {
                    var itemName = missingItem.name.replace(/%20/g, " "); // Handle potential URL encoding
                    var found = false;

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
                                try {
                                    missingItem.replace(currentItem);
                                    found = true;
                                    $.writeln("    MATCH FOUND & Replaced with: '" + currentItem.fsName + "'");
                                    return; // Exit loop and recursion
                                } catch (replaceError) {
                                    // Log error but continue searching if replacement fails
                                    $.writeln("Failed to replace " + itemName + " with " + currentItem.fsName + ": " + replaceError);
                                }
                            } else if (currentItem instanceof Folder) {
                                // Recursively search subfolders
                                searchRecursively(currentItem);
                                if (found) return; // Exit if found in subfolder
                            }
                        }
                    }

                    // Start the recursive search
                    searchRecursively(searchFolder);
                    return found;
                }
            `;

            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }
    
    /**
     * Alias for deleteFolder to maintain compatibility with Premiere's deleteBin
     * @param {string} folderName - Name of the folder to delete
     * @returns {Promise<string>} - Result message
     */
    deleteBin(folderName) {
        return this.deleteFolder(folderName);
    }

    /**
     * Apply a wiggle expression to a property on the selected layer
     * @param {string} propertyName - The property to apply the wiggle to (position, scale, rotation, etc.)
     * @param {number} frequency - How many times per second
     * @param {number} amplitude - How much movement
     * @returns {Promise<string>} - Result message
     */
    applyWiggleExpression(propertyName, frequency = 5, amplitude = 10) {
        return new Promise((resolve, reject) => {
            const script = `
                (function() {
                    try {
                        var comp = app.project.activeItem;
                        if (!comp || !(comp instanceof CompItem)) {
                            return "No active composition selected.";
                        }

                        var selectedLayers = comp.selectedLayers;
                        if (selectedLayers.length === 0) {
                            return "No layers selected in the active composition.";
                        }

                        var propName = "${propertyName.toLowerCase()}";
                        var freq = ${frequency};
                        var amp = ${amplitude};
                        var expressionString = "wiggle(" + freq + ", " + amp + ")";
                        var appliedCount = 0;
                        var errors = [];

                        app.beginUndoGroup("Apply Wiggle Expression");

                        for (var i = 0; i < selectedLayers.length; i++) {
                            var layer = selectedLayers[i];
                            var targetProperty = null;

                            try {
                                // Find the property within Transform group
                                var transformGroup = layer.property("Transform");
                                if (transformGroup) {
                                    switch (propName) {
                                        case 'position':
                                            targetProperty = transformGroup.property("Position");
                                            break;
                                        case 'scale':
                                            targetProperty = transformGroup.property("Scale");
                                            break;
                                        case 'rotation':
                                            // AE uses different rotation props depending on 2D/3D
                                            if (transformGroup.property("Rotation Z")) targetProperty = transformGroup.property("Rotation Z"); // AE 2023+ / 3D Layer Z
                                            else if (transformGroup.property("Rotation")) targetProperty = transformGroup.property("Rotation");   // Standard Rotation / 3D Layer legacy
                                            break;
                                        case 'opacity':
                                            targetProperty = transformGroup.property("Opacity");
                                            break;
                                        case 'anchor point':
                                            targetProperty = transformGroup.property("Anchor Point");
                                            break;
                                    }
                                }

                                if (targetProperty && targetProperty.canSetExpression) {
                                    targetProperty.expression = expressionString;
                                    appliedCount++;
                                } else if (targetProperty) {
                                    errors.push("Layer '" + layer.name + "': Property '" + propertyName + "' cannot have expressions applied.");
                                } else {
                                    // If not found in Transform, maybe it's an effect property?
                                    // Add logic here later if needed to search effects.
                                    errors.push("Layer '" + layer.name + "': Property '" + propertyName + "' not found in Transform group.");
                                }
                            } catch (layerError) {
                                errors.push("Layer '" + layer.name + "': Error applying wiggle - " + layerError.toString());
                            }
                        }

                        app.endUndoGroup();

                        var resultMessage = "";
                        if (appliedCount > 0) {
                            resultMessage = "Applied wiggle(" + freq + ", " + amp + ") to " + propName + " on " + appliedCount + " layer(s).";
                        } else if (errors.length === 0) {
                             resultMessage = "Could not apply wiggle. Ensure layers are selected and the property exists.";
                        } else {
                            resultMessage = "Could not apply wiggle expression.";
                        }
                        if (errors.length > 0) {
                            resultMessage += " Errors: " + errors.join(" ");
                        }
                        return resultMessage;

                    } catch (e) {
                        // Ensure undo group is ended even on top-level error
                        try { app.endUndoGroup(); } catch(ugErr){}
                        return "Error: " + e.toString();
                    }
                })();
            `;

            this.csInterface.evalScript(script, (result) => {
                resolve(result);
            });
        });
    }

    /**
     * Centers the anchor point to the default position for selected layer(s)
     * @returns {Promise<string>} - Result message
     */
    centerAnchorPoint() {
        return new Promise((resolve, reject) => {
            try {
                const extendScript = `
                    function centerAnchorPoint() {
                        var comp = app.project.activeItem;
                        if (!comp || !(comp instanceof CompItem)) {
                            return "Please select a composition first";
                        }
                        
                        var selectedLayers = comp.selectedLayers;
                        if (selectedLayers.length === 0) {
                            return "No layers selected. Please select at least one layer.";
                        }
                        
                        var result = [];
                        for (var i = 0; i < selectedLayers.length; i++) {
                            var layer = selectedLayers[i];
                            
                            // Skip layers that don't have transform properties
                            if (!layer.transform || !layer.transform.anchorPoint) {
                                result.push("Skipped layer '" + layer.name + "' (no anchor point property)");
                                continue;
                            }
                            
                            try {
                                // Get the original anchor point and layer dimensions
                                var originalAnchor = layer.transform.anchorPoint.value;
                                
                                // For shape layers, text layers, and some others, center in the layer bounds
                                if (layer instanceof ShapeLayer || layer instanceof TextLayer || 
                                    !layer.sourceRectAtTime) {
                                    // Center in layer bounds if available
                                    var width = layer.width;
                                    var height = layer.height;
                                    
                                    // Set the anchor to the center of the layer
                                    layer.transform.anchorPoint.setValue([width/2, height/2, 0]);
                                    result.push("Centered anchor point for '" + layer.name + "'");
                                } 
                                // For footage-based layers, use sourceRectAtTime
                                else {
                                    var time = comp.time;
                                    var rect = layer.sourceRectAtTime(time, false);
                                    
                                    var centerX = rect.left + rect.width/2;
                                    var centerY = rect.top + rect.height/2;
                                    
                                    // Set the anchor to the center of the source
                                    layer.transform.anchorPoint.setValue([centerX, centerY, 0]);
                                    result.push("Centered anchor point for '" + layer.name + "'");
                                }
                            } catch (layerError) {
                                result.push("Error centering anchor for '" + layer.name + "': " + layerError.toString());
                            }
                        }
                        
                        return result.join("\\n");
                    }
                    centerAnchorPoint();
                `;
                
                this.csInterface.evalScript(extendScript, result => {
                    if (result && result.trim() !== "") {
                        // Format the result message to be more user-friendly
                        if (result.includes("Centered anchor point for")) {
                            resolve("Anchor point centered");
                        } else {
                            resolve(result);
                        }
                    } else {
                        resolve("Anchor point centering completed");
                    }
                });
            } catch (error) {
                reject("Error centering anchor point: " + error.message);
            }
        });
    }

    /**
     * Applies a speed ramp effect using time remapping
     * Creates a ramp that speeds up in the middle of the clip to skip content
     * 
     * @param {number} rampLength - Duration of the speed transition in seconds
     * @param {number} skipAmount - Amount of source footage to skip/compress
     * @param {number} tension - Easing parameter (0.1-100) for transition smoothness
     * @returns {Promise<string>} - Result message
     */
    applySpeedRamp(rampLength = 2, skipAmount = 5, tension = 80) {
        return new Promise((resolve, reject) => {
            try {
                // Input validation and constraints
                rampLength = Math.max(0.1, Math.min(30, rampLength)); // Limit between 0.1s and 30s
                skipAmount = Math.max(0.5, Math.min(60, skipAmount)); // Limit between 0.5s and 60s
                tension = Math.max(0.1, Math.min(100, tension));      // Limit between 0.1 and 100
                
                const extendScript = `
                    function applySpeedRamp(speedRampLength, speedRampSkip, speedRampTension) {
                        var comp = app.project.activeItem;
                        if (!comp || !(comp instanceof CompItem)) {
                            return "Please select a composition first";
                        }
                        
                        var selectedLayers = comp.selectedLayers;
                        if (selectedLayers.length === 0) {
                            return "No layers selected. Please select at least one layer.";
                        }
                        
                        var result = [];
                        for (var i = 0; i < selectedLayers.length; i++) {
                            var myLayer = selectedLayers[i];
                            
                            try {
                                // Skip layers that can't be time remapped
                                if (!myLayer.canSetTimeRemapEnabled || myLayer.source instanceof CompItem) {
                                    result.push("Skipped layer '" + myLayer.name + "' (can't time remap)");
                                    continue;
                                }
                                
                                // Calculate the duration based on in/out points
                                var duration = myLayer.outPoint - myLayer.inPoint;
                                
                                // Sanity checks - prevent impossible configurations
                                speedRampSkip = Math.min(speedRampSkip, duration - 0.5);
                                speedRampLength = Math.min(speedRampLength, (duration - speedRampSkip) / 2);
                                
                                if (speedRampSkip <= 0 || speedRampLength <= 0) {
                                    result.push("Layer '" + myLayer.name + "' is too short for the specified ramp");
                                    continue;
                                }
                                
                                // Enable time remapping
                                myLayer.timeRemapEnabled = true;
                                var timeRemapProp = myLayer.property("ADBE Time Remapping");
                                
                                // The time remap property should have at least 2 keyframes (start and end)
                                // Remove the end keyframe to add our custom ones
                                if (timeRemapProp.numKeys >= 2) {
                                    timeRemapProp.removeKey(timeRemapProp.numKeys);
                                }
                                
                                // Calculate the keyframe times and values
                                // Middle keyframes create the speed ramp
                                var keyframeTimes = [
                                    myLayer.inPoint + (duration - speedRampSkip) / 2,
                                    myLayer.inPoint + (duration - speedRampSkip) / 2 + speedRampLength,
                                    myLayer.inPoint + (duration - speedRampSkip + speedRampLength)
                                ];
                                
                                var keyframeValues = [
                                    (duration - speedRampSkip) / 2,
                                    (duration - speedRampSkip) / 2 + speedRampSkip,
                                    duration
                                ];
                                
                                // Add the keyframes
                                timeRemapProp.setValuesAtTimes(keyframeTimes, keyframeValues);
                                
                                // Create ease objects for smooth transitions
                                var easeIn = new KeyframeEase(1, speedRampTension);
                                var easeOut = new KeyframeEase(1, 0.1); // Low tension for ease out
                                
                                // Apply easing to keyframes - creating the "ramp" effect
                                // The second keyframe has ease in
                                timeRemapProp.setTemporalEaseAtKey(2, [easeOut], [easeIn]);
                                
                                // The third keyframe has ease out
                                timeRemapProp.setTemporalEaseAtKey(3, [easeIn], [easeOut]);
                                
                                // Update the layer's out point to match the new duration
                                myLayer.outPoint = myLayer.inPoint + (duration - speedRampSkip + speedRampLength);
                                
                                result.push("Speed ramp applied to '" + myLayer.name + "'");
                            } catch (layerError) {
                                result.push("Error applying speed ramp to '" + myLayer.name + "': " + layerError.toString());
                            }
                        }
                        
                        return result.join("\\n");
                    }
                    
                    applySpeedRamp(${rampLength}, ${skipAmount}, ${tension});
                `;
                
                this.csInterface.evalScript(extendScript, result => {
                    if (result && result.includes("Speed ramp applied")) {
                        resolve("Speed ramp applied successfully");
                    } else if (result) {
                        resolve(result);
                    } else {
                        resolve("No results from speed ramp operation");
                    }
                });
            } catch (error) {
                reject("Error applying speed ramp: " + error.message);
            }
        });
    }
}

// Export the class
window.AEActions = AEActions;
