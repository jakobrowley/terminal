/**
 * AICommandProcessor.js
 * An enhanced natural language processor for Premiere Pro & After Effects commands
 * Handles typos, variations, and dynamically discovers available effects and transitions
 */

class AICommandProcessor {
    constructor(preset,effect,transition) {
        this.csInterface = new CSInterface();
        this.PARAM_PROMPT_PREFIX = "PARAM_PROMPT:"; // Define the constant here
        // --- Host Detection ---
        this.hostEnvironment = this.csInterface.getHostEnvironment();
        this.hostAppName = this.hostEnvironment ? this.hostEnvironment.appName : 'Unknown';
        console.log("Detected Host Application:", this.hostAppName);

        // --- Instantiate appropriate actions class ---
        if (this.hostAppName === 'PPRO') {
            this.hostActions = new PremiereActions();
        } else if (this.hostAppName === 'AEFT') {
             this.hostActions = new AEActions();
        } else {
            console.error("Unsupported Host Application:", this.hostAppName);
            // Provide a fallback or default behavior if necessary
            // For now, let's default to PremiereActions but log an error
            this.hostActions = new PremiereActions(); 
        }
        // --- End Host Specific ---
        this.presetsCache=null;
        this.effectsCache = null;
        this.transitionsCache = null;
        this.commandHistory = [];
        // Initialize the processor
        this.initialize(preset,effect,transition);
    }
    
    /**
     * Initialize the command processor and cache available effects/transitions
     */
    initialize(preset,effect,transition) {
        // Cache effects and transitions for faster command processing
        this.refreshEffectsCache(preset,effect,transition);
    }
    
    /**
     * Refresh the cached lists of effects and transitions from the host application
     */
    refreshEffectsCache(preset,effect,transition) {
        // Use the hostActions instance to get data
        Promise.all([
            this.hostActions.getAvailableEffects(effect),
            this.hostActions.getAvailableTransitions(transition), // Assuming AEActions will provide a relevant list or empty array
            this.hostActions.getAvailablePresets(preset)
        ]).then(([effects, transitions,presets]) => {
            this.effectsCache = effects || []; // Ensure it's an array
            this.transitionsCache = transitions || []; // Ensure it's an array
            this.presetsCache = presets || []; // Ensure it's an array
            console.log(`Cached ${this.effectsCache.length} effects and ${this.transitionsCache.length} transitions,${this.presetsCache.length} presets for ${this.hostAppName}`);
        }).catch(err => {
            console.error(`Failed to cache effects/transitions/presets for ${this.hostAppName}:`, err);
             // Initialize with empty arrays on failure to prevent errors later
             this.effectsCache = [];
             this.transitionsCache = [];
             this.presetsCache=[];
        });
    }
    
    /**
     * Process a natural language command from the user
     * @param {string} command - The command text from the user
     * @returns {Promise<string>} - Result of the command execution
     */
    processCommand(command) {
        // Store command in history
        this.commandHistory.push({
            command,
            timestamp: new Date()
        });
        
        // Normalize the command text
        const normalizedCommand = command.toLowerCase().trim();
        // Parse command intent and parameters
        const intent = this.determineIntent(normalizedCommand);
        
        // Execute the appropriate action based on intent
        return this.executeIntent(intent, normalizedCommand);
    }
    
    /**
     * Determine the intent of a command using heuristics and keyword matching
     * Enhanced with QE capabilities awareness and prioritizing structured actions.
     * @param {string} command - Normalized command text
     * @returns {Object} - Intent object with type and parameters
     */
    determineIntent(command) {
        // --- Priority 1: Explicit & Structured Commands ---

        // Direct speed command patterns like "speed 50" - add this BEFORE other checks
        const speedNumberMatch = command.match(/^speed\s+(\d+(?:\.\d+)?)\s*%?$/i);
        if (speedNumberMatch) {
            const speedVal = parseFloat(speedNumberMatch[1]);
            if (!isNaN(speedVal) && speedVal > 0) {
                return { type: 'speed', params: { speedPercent: speedVal } };
            }
        }

        // NEW: Center Anchor Point Intent (AE Only)
        const centerAnchorMatch = command.match(/^(?:center|reset)(?:\s+anchor(?:\s+point)?)?$/i);
        const centerAnchorAltMatch = command.match(/^anchor(?:\s+point)?(?:\s+center|reset)$/i);
        if ((centerAnchorMatch || centerAnchorAltMatch) && this.hostAppName === 'AEFT') {
            return { type: 'center_anchor', params: {} };
        }
        // --- END Center Anchor ---

        // NEW: Speed Ramp Intent (AE Only)
        const speedRampMatch = command.match(/^(?:speed|time)\s*ramp(?:\s+(\d+(?:\.\d+)?))?(?:\s+(\d+(?:\.\d+)?))?(?:\s+(\d+(?:\.\d+)?))?$/i);
        if (speedRampMatch && this.hostAppName === 'AEFT') {
            // Extract parameters with defaults if not provided
            const rampLength = speedRampMatch[1] ? parseFloat(speedRampMatch[1]) : 2; // Default 2 second transition
            const skipAmount = speedRampMatch[2] ? parseFloat(speedRampMatch[2]) : 5; // Default skip 5 seconds
            const tension = speedRampMatch[3] ? parseFloat(speedRampMatch[3]) : 80;   // Default tension 80
            
            return { 
                type: 'speed_ramp', 
                params: { 
                    rampLength, 
                    skipAmount, 
                    tension 
                } 
            };
        }
        // --- END Speed Ramp ---

        // NEW: Wiggle Expression Intent (AE Only)
        const wiggleMatch = command.match(/^(?:apply\s+)?wiggle(?:\s+to|\s+on)?\s+([a-z\s]+?)(?:\s+(\d+(?:\.\d+)?))?(?:\s+(\d+(?:\.\d+)?))?$/i);
        if (wiggleMatch && this.hostAppName === 'AEFT') {
            const propertyName = wiggleMatch[1] ? wiggleMatch[1].trim().toLowerCase() : 'position'; // Default to position
            const frequency = wiggleMatch[2] ? parseFloat(wiggleMatch[2]) : 5; // Default freq 5
            const amplitude = wiggleMatch[3] ? parseFloat(wiggleMatch[3]) : 10; // Default amp 10
            return { type: 'wiggle_expression', params: { propertyName, frequency, amplitude } };
        }
        // Simpler "wiggle [prop]" match
        const simpleWiggleMatch = command.match(/^wiggle\s+([a-z\s]+)$/i);
         if (simpleWiggleMatch && this.hostAppName === 'AEFT') {
             const propertyName = simpleWiggleMatch[1] ? simpleWiggleMatch[1].trim().toLowerCase() : 'position';
             return { type: 'wiggle_expression', params: { propertyName, frequency: 5, amplitude: 10 } };
         }
        // Just "wiggle" defaults to position
        if (command === 'wiggle' && this.hostAppName === 'AEFT') {
            return { type: 'wiggle_expression', params: { propertyName: 'position', frequency: 5, amplitude: 10 } };
        }
        // --- END Wiggle --- 

        // Special handling for numeric-only inputs (like "50")
        const numericOnlyMatch = command.match(/^(\d+(?:\.\d+)?)$/);
        if (numericOnlyMatch) {
            const numberValue = parseFloat(numericOnlyMatch[1]);
            
            // Determine the most likely intent based on the value and host app
            if (numberValue > 0 && numberValue <= 100) {
                // Likely opacity
                const effectName = this.hostAppName === 'AEFT' ? "Transform" : "Motion";
                return {
                    type: 'effect_property',
                    params: {
                        effectName: effectName,
                        propertyName: "Opacity",
                        value: numberValue
                    }
                };
            } else if (numberValue > 100 && numberValue <= 1000) {
                // Likely scale
                const effectName = this.hostAppName === 'AEFT' ? "Transform" : "Motion";
                return {
                    type: 'effect_property',
                    params: {
                        effectName: effectName,
                        propertyName: "Scale",
                        value: numberValue
                    }
                };
            } else if (numberValue > 0) {
                // Default to speed if not in typical opacity/scale ranges
                return {
                    type: 'speed',
                    params: {
                        speedPercent: numberValue
                    }
                };
            }
        }

        // 1a. Project Organization (Specific keywords)
        if (command.includes('organize project') || command.includes('sort project') ||
            command.includes('categorize files') || command.includes('organize files') ||
            command.includes('sort files')) {
            const isDryRun = command.includes('preview') || command.includes('dry run') || command.includes('simulate');
            return { type: 'organize_project', params: { dryRun: isDryRun } };
        }

        // 1b. List Properties (Specific keywords) - NEEDS HOST SPECIFIC IMPL
        const listPropsMatch = command.match(/(?:list|show|what\s+are)\s+([a-z0-9\s&]+)\s+properties/i);
        if (listPropsMatch) {
            const effectName = this.findBestEffectMatch(listPropsMatch[1].trim());
            if (effectName) { // Only proceed if we can identify the effect
                return { type: 'list_properties', params: { effectName: effectName } };
            }
            // If effect not found, let it potentially fall through to other intents or unknown
        }

        // 1c. Direct Speed Percentage Command (e.g., "50%", "200%")
        const directPercentMatch = command.match(/^(\d+(?:\.\d+)?)\s*%$/);
        if (directPercentMatch) {
            return { type: 'speed', params: { speedPercent: parseFloat(directPercentMatch[1]) } };
        }
        // NEW: Parse time helper - needs to be robust
        const timeRegex = /(?:at|to)\s+(\d{1,2}:\d{1,2}:\d{1,2}:\d{1,2}|\d{1,2}:\d{1,2}:\d{1,2}|\d{1,2}:\d{1,2}|\d+(?:\.\d+)?f|\d+(?:\.\d+)?s|\d+(?:\.\d+)?)/i; // HH:MM:SS:FF, MM:SS:FF, SS:FF, MM:SS, SS, NNNf, NNNs, NNN
        const timeMatch = command.match(timeRegex);
        const targetTime = timeMatch ? timeMatch[1] : null;

        // NEW: Parse track/layer index helper
        const trackLayerRegex = /(?:on|to)\s+(?:track|layer)\s+(\d+)/i;
        const trackLayerMatch = command.match(trackLayerRegex);
        let targetIndex = trackLayerMatch ? parseInt(trackLayerMatch[1]) : null;
        
        // Adjust AE layer index if found (user likely types 1 for top, but API is 1-based)
        if (targetIndex !== null && this.hostAppName === 'PPRO') {
             targetIndex = targetIndex - 1; // Convert to 0-based for Premiere API calls
             if (targetIndex < 0) targetIndex = 0; // Ensure non-negative
        } else if (targetIndex !== null && this.hostAppName === 'AEFT') {
             if (targetIndex < 1) targetIndex = 1; // Ensure AE index is at least 1
        } else {
             // Default if no index specified
             targetIndex = this.hostAppName === 'PPRO' ? 0 : 1; // 0 for PPro V1, 1 for AE top layer
        }

        // 1d. Insert Item Intent
        const insertMatch = command.match(/^(?:insert|place|add)\s+(?:clip|layer|item)\s+["']?([^"']+)["']?/i);
        if (insertMatch && targetTime) {
            const itemName = insertMatch[1].trim();
            // Default track/layer index if not explicitly mentioned
             const videoTrackIndex = (this.hostAppName === 'PPRO' && targetIndex !== null) ? targetIndex : 0;
             const audioTrackIndex = (this.hostAppName === 'PPRO') ? videoTrackIndex : -1; // Simple mapping for now
             const layerIndex = (this.hostAppName === 'AEFT' && targetIndex !== null) ? targetIndex : 1;

            return {
                type: 'insert_item',
                params: {
                    itemName: itemName,
                    timecode: targetTime,
                    videoTrackIndex: videoTrackIndex, // PPro specific
                    audioTrackIndex: audioTrackIndex, // PPro specific
                    layerIndex: layerIndex         // AE specific
                }
            };
        }
        
        // 1e. Move Item Intent
        const moveMatch = command.match(/^(?:move|set)\s+(?:selected|selection|clip|layer)/i);
        if (moveMatch && targetTime) {
             // Default track/layer index if not explicitly mentioned
             const videoTrackIndex = (this.hostAppName === 'PPRO' && targetIndex !== null) ? targetIndex : 0; // Default PPro track V1
             const layerIndex = (this.hostAppName === 'AEFT' && targetIndex !== null) ? targetIndex : -1; // -1 for AE means don't change order

            return {
                type: 'move_item',
                params: {
                    timecode: targetTime,
                    videoTrackIndex: videoTrackIndex, // PPro specific
                    layerIndex: layerIndex         // AE specific (-1 means don't change order)
                }
            };
        }

        // 1f. Motion Property Setting (Scale, Rotation, Position, Anchor Point, Opacity)
        // This needs careful host-specific handling as "Motion" vs Transform properties differ
        const motionPropKeywords = ['scale', 'size', 'zoom', 'rotation', 'rotate', 'angle', 'position', 'location', 'move', 'position x', 'position y', 'anchor point', 'anchor', 'pivot', 'anchor point x', 'anchor point y', 'opacity', 'transparency', 'alpha'];
        const motionPropMatch = command.match(/^(?:motion\s+)?([a-z\s]+)\s+(-?\d+(?:\.\d+)?)$/i);
        if (motionPropMatch) {
            const propName = motionPropMatch[1].trim().toLowerCase();
            if (motionPropKeywords.includes(propName)) {
                 const propertyValue = parseFloat(motionPropMatch[2]);
                 // Determine target effect based on host
                 const targetEffect = this.hostAppName === 'AEFT' ? "Transform" : propName==="opacity" ? "Opacity":"Motion"; // AE uses layer Transform, PPro uses Motion effect
                 // In AE, these are direct layer properties, not effect properties.
                 // We might need a new intent type like 'layer_property' for AE or handle this in executeIntent.
                 // For now, let's keep 'effect_property' and handle the target in executeIntent or setEffectProperty.
                 return { type: 'effect_property', params: { effectName: targetEffect, propertyName: propName, value: propertyValue } };
            }
        }
        // Example: "set scale to 120", "change opacity to 80"
        const intrinsicPropMatchSet = command.match(/^(?:set|change)\s+(?:motion\s+)?([a-z\s]+)\s+(?:to\s+)?(-?\d+(?:\.\d+)?)$/i);
         if (intrinsicPropMatchSet) {
             const propName = intrinsicPropMatchSet[1].trim().toLowerCase();
             if (motionPropKeywords.includes(propName)) {
                  const propertyValue = parseFloat(intrinsicPropMatchSet[2]);
                  const targetEffect = this.hostAppName === 'AEFT' ? "Transform" : propName==="opacity" ? "Opacity":"Motion";
                  return { type: 'effect_property', params: { effectName: targetEffect, propertyName: propName, value: propertyValue } };
             }
         }

        // 1g. Effect Property Setting (Effect Name + Property + Value) - More robust matching
        // Try to match "Effect Name PropertyName Value" structure first.
        let effectPropIntent = null;
        if (this.effectsCache && command.match(/[a-z]+\s+\d+/i)) { // Basic check: contains words and numbers
            // Sort effects by length descending to match longer names first
            const sortedEffects = [...this.effectsCache].sort((a, b) => b.length - a.length);

            for (const effectCandidate of sortedEffects) {
                const effectNameLower = effectCandidate.toLowerCase();
                if (command.startsWith(effectNameLower)) {
                    const remainingCommand = command.substring(effectNameLower.length).trim();
                    const propValMatch = remainingCommand.match(/^([a-z\s&'/]+?)\s+(-?\d+(?:\.\d+)?)$/i);
                    if (propValMatch) {
                        const potentialProperty = propValMatch[1].trim();
                        const propertyValue = parseFloat(propValMatch[2]);
                        // Pass raw name - hostActions.setEffectProperty will handle aliases/resolution
                        const resolvedPropertyName = potentialProperty;
                        if (resolvedPropertyName) {
                            effectPropIntent = {
                                type: 'effect_property',
                                params: {
                                    effectName: effectCandidate, // Use original casing
                                    propertyName: resolvedPropertyName,
                                    value: propertyValue
                                }
                            };
                            break;
                        }
                    }
                }
            }
        }
        if (effectPropIntent) {
            return effectPropIntent;
        }
        
        // Special cases for effect property commands in stacks
        // Like "Lumetri Color Contrast 150" or "Gaussian Blur Blurriness 40"
        const stackEffectPropMatch = command.match(/^([a-z\s&']+)\s+([a-z\s&']+)\s+(-?\d+(?:\.\d+)?)$/i);
        if (stackEffectPropMatch && this.effectsCache) {
            const potentialEffectName = stackEffectPropMatch[1].trim();
            const potentialPropertyName = stackEffectPropMatch[2].trim();
            const propertyValue = parseFloat(stackEffectPropMatch[3]);
            
            // Check if this matches a known effect name
            const matchedEffect = this.findBestEffectMatch(potentialEffectName, 0.75);
            if (matchedEffect) {
                return {
                    type: 'effect_property',
                    params: {
                        effectName: matchedEffect,
                        propertyName: potentialPropertyName,
                        value: propertyValue
                    }
                };
            }
        }

        // If the above didn't match, check for the simpler "PropertyName Value" pattern.
        const propValueMatchGlobal = command.match(/^([a-z\s&'/]+?)\s+(-?\d+(?:\.\d+)?)$/i);
        if (propValueMatchGlobal) {
            const potentialProperty = propValueMatchGlobal[1].trim();
            const propertyValue = parseFloat(propValueMatchGlobal[2]);
            const resolvedPropertyName = potentialProperty;
            if (resolvedPropertyName) {
                // Host-specific default effect mapping
                let defaultEffect;
                let mappedPropertyName = resolvedPropertyName;
                
                // Map common property names to host-specific effects
                if (this.hostAppName === 'PPRO') {
                    defaultEffect = "Lumetri Color";
                    // Keep property name as is for Premiere
                } else if (this.hostAppName === 'AEFT') {
                    // Map common properties to appropriate AE effects
                    if (potentialProperty.toLowerCase().includes('contrast')) {
                        defaultEffect = "Brightness & Contrast";
                        mappedPropertyName = "Contrast";
                    } else if (potentialProperty.toLowerCase().includes('brightness')) {
                        defaultEffect = "Brightness & Contrast";
                        mappedPropertyName = "Brightness";
                    } else if (potentialProperty.toLowerCase().includes('saturation')) {
                        defaultEffect = "Hue/Saturation";
                        mappedPropertyName = "Saturation";
                    } else if (potentialProperty.toLowerCase().includes('hue')) {
                        defaultEffect = "Hue/Saturation";
                        mappedPropertyName = "Hue";
                    } else if (potentialProperty.toLowerCase().includes('exposure') || 
                               potentialProperty.includes('gamma')) {
                        defaultEffect = "Levels";
                        mappedPropertyName = potentialProperty; // Keep original for now
                    } else {
                        defaultEffect = "Levels"; // Default fallback for AE
                    }
                } else {
                    defaultEffect = "Lumetri Color"; // Fallback default
                }
                
                // Only proceed if it's not a motion property
                if (!motionPropKeywords.includes(potentialProperty.toLowerCase())) {
                return {
                    type: 'effect_property',
                    params: {
                        effectName: defaultEffect,
                            propertyName: mappedPropertyName,
                            value: propertyValue
                    }
                };
                }
            }
        }
        // --- End of Refined 1g ---

        // --- Priority 2: General Action Keywords (Apply, Add, Delete, Cut, etc.) ---
        // Note: Some actions like 'cut', 'delete' might need host-specific logic too
        const generalIntents = [
             { type: 'effect', patterns: ['apply effect', 'add effect', 'use effect', 'put effect'], negativePatterns: ['transition', 'delete', 'remove'] },
              // Add 'transition' intent type, check cache for validity and only for Premiere Pro
             { type: 'transition', patterns: ['apply transition', 'add transition'], negativePatterns: ['effect', 'delete', 'remove'], available: () => this.hostAppName === 'PPRO' && this.transitionsCache && this.transitionsCache.length > 0 }, // Only if transitions exist and in Premiere
             { type: 'speed', patterns: ['speed', 'rate', 'playback speed', 'change speed'] },
             { type: 'scale', patterns: ['scale to sequence', 'scale to comp', 'fit to frame', 'fill frame', 'resize clip', 'scale to fill'], exact: true }, // Added AE term
             { type: 'reverse', patterns: ['reverse clip', 'reverse layer', 'reverse speed', 'reverse'], exact: true }, // Added AE term
             { type: 'import', patterns: ['import', 'bring in', 'add footage', 'add media'], exact: true },
             { type: 'bin', patterns: ['create bin', 'add bin', 'new bin', 'make bin', 'create folder', 'add folder', 'new folder'], negativePatterns: ['delete', 'remove', 'footage', 'media'], exact: true }, // Added AE terms
             { type: 'nest', patterns: ['nest clip', 'nest selection', 'precompose', 'pre-compose', 'pre comp'], exact: true }, // Added AE terms
             { type: 'help', patterns: ['help', 'commands', 'what can you do', 'show commands'], exact: true },
             // Removed Cut/Delete for now as they need host check
             // { type: 'delete', patterns: ['delete', 'remove', 'clear'], exact: true },
             // { type: 'cut', patterns: ['cut', 'split'], exact: true },
             { type: 'relink_media', patterns: ['relink media', 'find missing', 'locate files', 'find files', 'link media', 'relink footage'], exact: true },
             { type: 'custom_effect_combo', patterns: ['film look', 'cinematic look', 'beauty', 'enhance', 'make it pop', 'vibrant'], negativePatterns: ['property', 'value'] }
         ];

        let bestGeneralIntent = null;
        let highestScore = 0;

        for (const intent of generalIntents.filter(i => !i.available || i.available())) {
            let currentScore = 0;
            let matchFound = false;
            for (const pattern of intent.patterns) {
                if (command.includes(pattern)) {
                     if (intent.exact && command.startsWith(pattern)) {
                         currentScore += 3;
                     } else if (!intent.exact) {
                         const index = command.indexOf(pattern);
                         currentScore += Math.max(0.5, 1.5 - (index / 10));
                     } else {
                         currentScore += 1;
                     }
                     matchFound = true;
                }
            }

            if (matchFound && intent.negativePatterns) {
                for (const negPattern of intent.negativePatterns) {
                    if (command.includes(negPattern)) {
                         currentScore -= 1;
                    }
                }
            }
            currentScore = Math.max(0, currentScore);

            if (currentScore > highestScore) {
                highestScore = currentScore;
                bestGeneralIntent = intent;
            }
        }

        // Extract parameters based on the best general intent found
         if (bestGeneralIntent && highestScore >= 1) {
             let params = {};
             switch (bestGeneralIntent.type) {
                 case 'effect': params = this.extractEffectParams(command, bestGeneralIntent.patterns); break;
                 case 'transition': params = this.extractTransitionParams(command, bestGeneralIntent.patterns); break; // Added transition param extraction
                 case 'speed': params = this.extractSpeedParams(command); break;
                 case 'scale': params = this.extractScaleParams(command); break; // Needs update for AE term 'comp'
                 case 'import': params = this.extractImportParams(command); break;
                 case 'bin': params = this.extractBinParams(command); break; // Needs update for AE term 'folder'
                 case 'nest': params = this.extractNestParams(command); break; // Needs update for AE term 'precompose'
                 case 'relink_media': params = {}; break;
                 default: params = {}; break;
             }

             // Check if name extraction failed for effect/transition
             if ((bestGeneralIntent.type === 'effect' && !params.effectName) || (bestGeneralIntent.type === 'transition' && !params.transitionName)) {
                 // Let it fall through if keywords matched but name extraction failed.
             } else {
                 // If params are potentially valid, return the intent.
                  return { type: bestGeneralIntent.type, params };
             }
         }

        // --- Priority 3: Plausible Effect/Transition Name Match (without keywords) ---
        const potentialEffectName = this.findBestEffectMatch(command, 0.75);
        if (potentialEffectName) {
            // Fix for Transform effect - START
            // When Transform is used as an exact effect name (like in a stack), treat it as an effect
            if (potentialEffectName.toLowerCase() === "transform" && command.toLowerCase() === "transform") {
                return { type: 'effect', params: { effectName: potentialEffectName } };
            }
            // Fix for Transform effect - END
            
            const knownProperties = ['contrast', 'exposure', 'saturation', 'blurriness', 'scale', 'opacity', 'position', 'rotation', 'anchor']; // Added common layer props
            if (!knownProperties.includes(potentialEffectName.toLowerCase())) {
                 return { type: 'effect', params: { effectName: potentialEffectName } };
            }
        }

        // Only check for transitions in Premiere Pro, not in After Effects
        if (this.hostAppName !== 'AEFT') {
        const potentialTransitionName = this.findBestTransitionMatch(command, 0.75);
        if (potentialTransitionName) {
                 // Check if it clashes with known properties/effects if necessary
            return { type: 'transition', params: { transitionName: potentialTransitionName } };
            }
        }

        // --- Fallback: Unknown/Custom ---
        console.log(`Command "${command}" did not match known patterns. Classifying as unknown.`);
        return { type: 'unknown', params: {} };
    }

    // --- Helper Functions (Need Implementation/Refinement) ---

    /**
     * Extract effect name and parameters from command text.
     * @param {string} command - Normalized command text
     * @param {string[]} matchedPatterns - Patterns that triggered this intent
     * @returns {Object} - Effect parameters { effectName: string | null }
     */
    extractEffectParams(command, matchedPatterns = []) {
        let nameQuery = command;
        matchedPatterns.forEach(p => { nameQuery = nameQuery.replace(p, ''); });
        nameQuery = nameQuery.replace(/effect/gi, '').trim(); // Remove 'effect' word explicitly

        // --- Host-Specific Aliases/Typos ---
        const lowerQuery = nameQuery.toLowerCase();
        
        // If query contains a property name and value (e.g., "transform scale 100"),
        // just extract the effect name part
        if (lowerQuery.includes(' ')) {
            const firstPart = lowerQuery.split(' ')[0]; // Get just the effect name part
            
            if (this.hostAppName === 'PPRO') {
                // Handle abbreviated forms for effect names with parameters
                if (firstPart === "transform" || firstPart === "transf" || 
                    firstPart.startsWith("trans") || firstPart.startsWith("tran")) {
                    return { effectName: "Transform" };
                }
                if (firstPart === "lumetri" || firstPart === "lumet" || 
                    firstPart.startsWith("lumetr") || firstPart === "lemetri") {
                    return { effectName: "Lumetri Color" };
                }
                if (firstPart === "gauss" || firstPart === "gaus" || 
                    firstPart.startsWith("blur") && !firstPart.includes("vr")) {
                    return { effectName: "Gaussian Blur" };
                }
            } else if (this.hostAppName === 'AEFT') {
                // AE effect name handling with parameters
                if (firstPart === "gaussian" || firstPart === "gauss" || firstPart === "blur") {
                    // Check for blur effects
                    const fastBlur = this.findBestEffectMatch("Fast Box Blur", 0.8);
                    if (fastBlur) return { effectName: fastBlur };
                    return { effectName: "Gaussian Blur" };
                }
                // Add other AE effect mappings as needed
            }
        } else {
            // Handle single-word commands (no parameters)
            if (this.hostAppName === 'PPRO') {
                // Fix for Transform effect - START
                // Special handling for "transform" and partial matches in Premiere Pro
                if (lowerQuery === "transform" || lowerQuery === "transf" || 
                    lowerQuery.startsWith("trans") || lowerQuery.startsWith("tran")) {
                    return { effectName: "Transform" };
                }
                // Fix for Transform effect - END
                
                if (lowerQuery.includes('lumert') || lowerQuery.includes('lumet') || lowerQuery.includes('lumetr') || lowerQuery.includes('lemetri')) {
                    return { effectName: "Lumetri Color" };
                }
                
                if (lowerQuery === "gauss" || lowerQuery === "gaus" || 
                    lowerQuery.includes('gaussian') || lowerQuery.includes('gassian') || 
                    (lowerQuery.includes('blur') && !lowerQuery.includes('vr'))) {
                    return { effectName: "Gaussian Blur" };
                }
            } else if (this.hostAppName === 'AEFT') {
                // Add AE specific aliases if needed
                if (lowerQuery.includes('gaussian') || lowerQuery.includes('gassian') || lowerQuery.includes('fast blur')) {
                    // Check if "Fast Box Blur" or "Gaussian Blur" exists in cache
                    const fastBlur = this.findBestEffectMatch("Fast Box Blur", 0.8);
                    if (fastBlur) return { effectName: fastBlur };
                    const gaussBlur = this.findBestEffectMatch("Gaussian Blur", 0.8);
                    if (gaussBlur) return { effectName: gaussBlur };
                    // Fallback if neither found exactly
                }
                if (lowerQuery.includes('fractal') || (lowerQuery.includes('noise') && !lowerQuery.includes('turbulent'))) {
                    const fractal = this.findBestEffectMatch("Fractal Noise", 0.8);
                    if (fractal) return { effectName: fractal};
                }
                if (lowerQuery.includes('turbulent') || (lowerQuery.includes('noise') && lowerQuery.includes('turb'))) {
                    const turb = this.findBestEffectMatch("Turbulent Displace", 0.8);
                    if (turb) return { effectName: turb};
                }
                if (lowerQuery.includes('levels')) {
                    const levels = this.findBestEffectMatch("Levels", 0.8);
                    if (levels) return { effectName: levels};
                }
                if (lowerQuery.includes('curves')) {
                    const curves = this.findBestEffectMatch("Curves", 0.8);
                    if (curves) return { effectName: curves};
                }
                // Add aliases for common AE effects that might map from Premiere commands
                if (lowerQuery.includes('brightness') || lowerQuery.includes('contrast')) {
                    return { effectName: "Brightness & Contrast" };
                }
                if (lowerQuery.includes('hue') || lowerQuery.includes('saturation')) {
                    return { effectName: "Hue/Saturation" };
                }
                if (lowerQuery.includes('color balance')) {
                    return { effectName: "Color Balance" };
                }
                if (lowerQuery.includes('color') || lowerQuery.includes('lumetri')) {
                    // If user asks for Lumetri in AE, use Brightness & Contrast as alternative
                    if (lowerQuery.includes('contrast')) {
                        return { effectName: "Brightness & Contrast" };
                    } else if (lowerQuery.includes('saturation')) {
                        return { effectName: "Hue/Saturation" };
                    } else if (lowerQuery.includes('exposure')) {
                        return { effectName: "Exposure" };
                    } else {
                        // Default fallback
                        return { effectName: "Brightness & Contrast" };
                    }
                }
            }
        }
        // --- End Host-Specific ---

        const effectName = this.findBestEffectMatch(nameQuery, 0.6);
        return { effectName };
    }

    /**
      * Extract transition name and parameters from command text.
      * @param {string} command - Normalized command text
      * @param {string[]} matchedPatterns - Patterns that triggered this intent
      * @returns {Object} - Transition parameters { transitionName: string | null }
      */
     extractTransitionParams(command, matchedPatterns = []) {
         let nameQuery = command;
         matchedPatterns.forEach(p => { nameQuery = nameQuery.replace(p, ''); });
         nameQuery = nameQuery.replace(/transition/gi, '').trim(); // Remove 'transition' word

         // --- Host-Specific Aliases/Common Names ---
         const lowerQuery = nameQuery.toLowerCase();
         if (this.hostAppName === 'PPRO') {
             if (lowerQuery.includes('cross dissolve') || lowerQuery.includes('dissolve')) return { transitionName: "Cross Dissolve" };
             if (lowerQuery.includes('dip to black')) return { transitionName: "Dip to Black" };
             if (lowerQuery.includes('dip to white')) return { transitionName: "Dip to White" };
         } else if (this.hostAppName === 'AEFT') {
              // Match conceptual names or known preset names
              if (lowerQuery.includes('fade')) return { transitionName: "Fade In/Out" };
              if (lowerQuery.includes('dissolve')) return { transitionName: "Cross Dissolve (Preset)" }; // Example
              if (lowerQuery.includes('wipe')) return { transitionName: "Linear Wipe (Preset)" }; // Example
         }
         // --- End Host-Specific ---

         const transitionName = this.findBestTransitionMatch(nameQuery, 0.6);
         return { transitionName };
    }

    /**
     * Extract speed change parameters from command text
     * @param {string} command - Normalized command text
     * @returns {Object} - Speed parameters
     */
    extractSpeedParams(command) {
        const lowerCommand = command.toLowerCase().trim();
    
        // Case 1: Direct "speed [number]" (e.g., "speed 50") - highest priority pattern
        // This is critical for handling the result of the two-step prompt process
        const directSpeedMatch = lowerCommand.match(/^speed\s+(\d+(?:\.\d+)?)$/i);
        if (directSpeedMatch) {
            const speedVal = parseFloat(directSpeedMatch[1]);
            if (!isNaN(speedVal) && speedVal > 0) return { speedPercent: speedVal };
        }
    
        // Case 1b: "speed [number]%" (e.g., "speed 50%", "speed 200%")
        let speedNumberMatch = lowerCommand.match(/^speed\\s+(\\d+(?:\\.\\d+)?)\\s*%$/);
        if (speedNumberMatch) {
            const speedVal = parseFloat(speedNumberMatch[1]);
            if (!isNaN(speedVal) && speedVal > 0) return { speedPercent: speedVal };
        }
    
        // Case 1c: "speed [number]x" (e.g., "speed 2x", "speed 0.5x")
        speedNumberMatch = lowerCommand.match(/^speed\\s+(\\d*\\.?\\d+)\\s*x$/);
        if (speedNumberMatch) {
            const speedVal = parseFloat(speedNumberMatch[1]) * 100;
            if (!isNaN(speedVal) && speedVal > 0) return { speedPercent: speedVal };
        }
    
        // Case 2: "[number]%" (direct command, e.g., "50%", "200%")
        const percentMatchDirect = lowerCommand.match(/^(\\d+(?:\\.\\d+)?)\\s*%$/);
        if (percentMatchDirect) {
            const speedVal = parseFloat(percentMatchDirect[1]);
            if (!isNaN(speedVal) && speedVal > 0) return { speedPercent: speedVal };
        }
        
        // Case 3: "[number]x" (direct command, e.g., "2x", "0.5x")
        const multiplierMatchDirect = lowerCommand.match(/^(\\d*\\.?\\d+)\\s*x$/);
        if (multiplierMatchDirect) {
            const speedVal = parseFloat(multiplierMatchDirect[1]) * 100;
            if (!isNaN(speedVal) && speedVal > 0) return { speedPercent: speedVal };
        }
    
        // Case 4: Descriptive terms (assuming a speed keyword was already matched by generalIntents)
        if (lowerCommand.includes('half')) return { speedPercent: 50 };
        if (lowerCommand.includes('double') || lowerCommand.includes('twice')) return { speedPercent: 200 };
        if (lowerCommand.includes('quarter')) return { speedPercent: 25 };
        // Avoid broad matches for "slow" or "fast" if part of a longer phrase not handled above
        if (lowerCommand === 'slow' || lowerCommand === 'slow motion') return { speedPercent: 50 };
        if (lowerCommand === 'fast' || lowerCommand === 'fast motion') return { speedPercent: 200 };
    
        // Case 5: Command is just a speed keyword alone (e.g. "speed", "rate")
        const speedKeywords = ['speed', 'rate', 'playback speed', 'change speed'];
        if (speedKeywords.includes(lowerCommand)) { // Exact match for keyword alone
            return { needsPrompt: true };
        }
        
        return {}; // No specific speed parameters extracted
    }
    
    /**
     * Extract scale parameters from command text
     * @param {string} command - Normalized command text
     * @returns {Object} - Scale parameters { maintainAspectRatio: boolean }
     */
    extractScaleParams(command) {
        // Determine whether to maintain aspect ratio ('stretch', 'distort', 'fill' imply false)
        const maintainAspectRatio = !command.includes('stretch') && 
                                   !command.includes('distort') &&
                                   !command.includes('fill') && // "fill frame" usually means non-proportional
                                   !command.includes('ignore aspect');
        
        return { maintainAspectRatio };
    }
    
    /**
     * Extract import parameters from command text
     * @param {string} command - Normalized command text
     * @returns {Object} - Import parameters { binName: string | null }
     */
    extractImportParams(command) {
        let binName = null;
        // Look for "to bin", "into bin", "in bin", "to folder", "into folder", "in folder"
        const binMatch = command.match(/(?:to|into|in)\s+(?:bin|folder)\s+["']?([^"']+)["']?/i);
        if (binMatch) {
            binName = binMatch[1].trim();
        }
        return { binName };
    }
    
    /**
     * Extract bin/folder parameters from command text
     * @param {string} command - Normalized command text
     * @returns {Object} - Bin parameters { binName: string | null }
     */
    extractBinParams(command) {
        let binName = null;
        // Look for "bin [name]", "folder [name]", "create bin [name]", etc.
        const binMatch = command.match(/(?:bin|folder)\s+(.+)$/i);
        if (binMatch) {
            binName = binMatch[1].trim();
        } else {
             // Try to extract name after keywords like 'create', 'new', 'add'
             const createMatch = command.match(/(?:create|new|add)\s+(?:bin|folder)\s+(.+)$/i);
             if (createMatch) {
                 binName = createMatch[1].trim();
             }
        }
        return { binName }; // shouldImport is implicit
    }
    
    /**
     * Extract nest/precompose parameters from command text
     * @param {string} command - Normalized command text
     * @returns {Object} - Nest parameters { nestName: string | null }
     */
    extractNestParams(command) {
        let nestName = this.hostAppName === 'PPRO' ? "Nested Sequence" : "Pre-comp"; // Host-specific default
        // Look for "nest [name]", "precompose [name]", etc.
        const nameMatch = command.match(/(?:nest|precompose|pre-compose|pre comp)\s+(.+)$/i);
        if (nameMatch) {
            nestName = nameMatch[1].trim();
        } else {
             // If just "nest" or "precompose", use the default name
             if (!command.includes(' ')) { // Check if it's just the keyword
                 // Keep the default name assigned above
             } else {
                 // Command might be malformed, return null or keep default? Let's keep default.
             }
        }
        return { nestName };
    }

    /**
     * Execute an intent with its parameters
     * @param {Object} intent - The intent object with type and parameters
     * @param {string} originalCommand - The original command for context
     * @returns {Promise<string>} - Result of the execution
     */
    executeIntent(intent, originalCommand) {
        console.log(`Executing Intent for ${this.hostAppName}:`, intent.type, "Params:", intent.params);

        // Handle numeric-only commands (like "150") for effect_property
        if (intent.type === 'effect_property') {
            // Ensure all parameters exist, apply defaults if needed
            if (!intent.params.effectName && intent.params.value !== undefined) {
                // For numeric-only input, determine reasonable effect/property
                const value = Number(intent.params.value);
                if (value > 0 && value <= 100) {
                    intent.params.effectName = this.hostAppName === 'AEFT' ? "Transform" : "Motion";
                    intent.params.propertyName = "Opacity";
                } else if (value > 100 && value <= 1000) {
                    intent.params.effectName = this.hostAppName === 'AEFT' ? "Transform" : "Motion";
                    intent.params.propertyName = "Scale";
                }
            }
            
            // Normalize parameter names
            if (intent.params.propertyValue !== undefined && intent.params.value === undefined) {
                intent.params.value = intent.params.propertyValue;
            }
        }

        // Use this.hostActions for all host-specific calls
        switch (intent.type) {
            case 'organize_project':
                // Default labels might need host-specific versions? Assume same for now.
                return this.hostActions.organizeProject(
                    intent.params.imageLabel || "Images",
                    intent.params.videoLabel || "Videos",
                    intent.params.audioLabel || "Audio",
                    !!intent.params.dryRun
                );

            case 'list_properties':
                if (intent.params.effectName) {
                    // hostActions.getEffectProperties needs implementation for AE
                    return this.hostActions.getEffectProperties(intent.params.effectName)
                       .then(properties => this.formatPropertiesList(intent.params.effectName, properties))
                       .catch(error => `Error getting properties: ${error}`);
                } else {
                    return Promise.resolve("Could not identify the effect to list properties for.");
                }

            case 'effect':
                if (intent.params.effectName) {
                    // Use hostActions.applyEffect
                    return this.hostActions.applyEffect(intent.params.effectName)
                        .then(result => {                           
                            // Basic success check
                            if (result.toLowerCase().startsWith("applied")) {
                                let suggestion = "";
                                const effectNameLower = intent.params.effectName.toLowerCase();
                                // Add AE-specific suggestions if needed
                                if (this.hostAppName === 'PPRO') {
                                     if (effectNameLower.includes("lumetri")) suggestion = " You could adjust Contrast or Saturation next.";
                                     else if (effectNameLower.includes("transform")) suggestion = " Want to tweak Scale or Position?";
                                     else if (effectNameLower.includes("blur")) suggestion = " Try adjusting the Blurriness value.";
                                } else if (this.hostAppName === 'AEFT') {
                                      if (effectNameLower.includes("blur")) suggestion = " Try adjusting the Blur Amount.";
                                      if (effectNameLower.includes("levels")) suggestion = " Adjust Input Black or White?";
                                      if (effectNameLower.includes("fill")) suggestion = " Change the Color?";
                                }
                                // More natural phrasing
                                return `Okay, effect applied.${suggestion}`;
                            } else {
                                return result; // Return error/other message as is
                            }
                        })
                        .catch(error => `Sorry, I couldn't apply the effect: ${error}`);
                } else {
                     return Promise.resolve("Hmm, I couldn't figure out which effect you wanted to apply.");
                }

            case 'transition': // Added Transition handling
                 if (intent.params.transitionName) {
                     // Use hostActions.applyTransition - Needs AE implementation
                     if (typeof this.hostActions.applyTransition === 'function') {
                          return this.hostActions.applyTransition(intent.params.transitionName)
                              .then(result => {
                                  if (result.toLowerCase().includes("applied")) {
                                       return `Okay, ${intent.params.transitionName} transition applied.`;
                                  } else {
                                       return result; // Error or info message
                                  }
                              })
                              .catch(error => `Sorry, I couldn't apply the transition: ${error}`);
                     } else {
                          return Promise.resolve(`Applying transitions automatically isn't fully supported in ${this.hostAppName} yet.`);
                     }
                 } else {
                     return Promise.resolve("Hmm, I couldn't figure out which transition you wanted to apply.");
                }
            case 'preset'://Added Preset handling
                if(intent.params.presetName)
                {
                     // Use hostActions.applyTransition - Needs AE implementation
                     if (typeof this.hostActions.applyPreset === 'function') {
                        return this.hostActions.applyPreset(intent.params.presetName)
                            .then(result => {
                                if (result.toLowerCase().includes("applied")) {
                                     return `Okay, ${intent.params.presetName} preset applied.`;
                                } else {
                                     return result; // Error or info message
                                }
                            })
                            .catch(error => `Sorry, I couldn't apply the preset: ${error}`);
                   } else {
                        return Promise.resolve(`Applying preset automatically isn't fully supported in ${this.hostAppName} yet.`);
                   }
                } else {
                    return Promise.resolve("Hmm, I couldn't figure out which preset you wanted to apply.");
                }
            case 'relink_media':
                // This command doesn't require parameters extracted from the text
                // The function itself prompts for the folder
                return this.hostActions.findAndRelinkMissingMedia();

            case 'effect_property':
                const effectName = intent.params.effectName || '';
                const propertyName = intent.params.propertyName || '';
                // Check both parameter naming styles (value and propertyValue)
                const rawValue = intent.params.value !== undefined ? intent.params.value : 
                               (intent.params.propertyValue !== undefined ? intent.params.propertyValue : null);
                
                if (!effectName || !propertyName || rawValue === null) {
                    return this.handleErrorResponse(`Missing parameters for effect_property intent. Required: effectName, propertyName, value`);
                }
                
                // Convert to number and validate
                const value = Number(rawValue);
                    if (isNaN(value)) {
                    return this.handleErrorResponse(`Invalid numeric value "${rawValue}" for property "${propertyName}".`);
                }
                
                // For AE, handle property-specific effects mapping
                if (this.hostAppName === 'AEFT') {
                    // Determine appropriate effect based on property name
                    const propName = intent.params.propertyName.toLowerCase();
                    let mappedEffectName = intent.params.effectName;
                    let mappedPropertyName = intent.params.propertyName;
                    
                    console.log("AE Property Mapping - Original:", 
                        "Effect:", intent.params.effectName,
                        "Property:", intent.params.propertyName);
                    
                    // Handle when user specifically selects "Lumetri Color Contrast" from dropdown
                    if (propertyName.toLowerCase().includes("lumetri color") || propertyName.includes("Lumetri Color")) {
                        mappedEffectName = "Lumetri Color";
                        
                        // Extract just the property part
                        if (propertyName.toLowerCase().includes("contrast")) {
                            mappedPropertyName = "Contrast";
                        } else if (propertyName.toLowerCase().includes("saturation")) {
                            mappedPropertyName = "Saturation";
                        } else if (propertyName.toLowerCase().includes("exposure")) {
                            mappedPropertyName = "Exposure";
                        } else if (propertyName.toLowerCase().includes("temperature")) {
                            mappedPropertyName = "Temperature";
                        } else if (propertyName.toLowerCase().includes("tint")) {
                            mappedPropertyName = "Tint";
                        } else if (propertyName.toLowerCase().includes("vibrance")) {
                            mappedPropertyName = "Vibrance";
                        }
                    }
                    // Preserve Lumetri Color if explicitly selected by the user
                    else if (mappedEffectName === "Lumetri Color") {
                        // Just map the property name if needed, but keep Lumetri Color as the effect
                        if (propName.includes('contrast')) {
                            mappedPropertyName = "Contrast";
                        } else if (propName.includes('saturation')) {
                            mappedPropertyName = "Saturation";
                        } else if (propName.includes('exposure')) {
                            mappedPropertyName = "Exposure";
                        } else if (propName.includes('temperature')) {
                            mappedPropertyName = "Temperature";
                        } else if (propName.includes('tint')) {
                            mappedPropertyName = "Tint";
                        } else if (propName.includes('vibrance')) {
                            mappedPropertyName = "Vibrance";
                        }
                    }
                    // Map transform properties to Transform
                    else if (['scale', 'position', 'rotation', 'opacity', 'anchor point'].includes(propName)) {
                        mappedEffectName = "Transform";
                        mappedPropertyName = intent.params.propertyName; // Keep original case
                    } 
                    // Map contrast/brightness to Brightness & Contrast
                    else if (propName.includes('contrast')) {
                        mappedEffectName = "Brightness & Contrast";
                        mappedPropertyName = "Contrast";
                    }
                    else if (propName.includes('brightness')) {
                        mappedEffectName = "Brightness & Contrast";
                        mappedPropertyName = "Brightness";
                    }
                    // Map saturation/hue to Hue/Saturation
                    else if (propName.includes('saturation')) {
                        mappedEffectName = "Hue/Saturation";
                        mappedPropertyName = "Saturation";
                    }
                    else if (propName.includes('hue')) {
                        mappedEffectName = "Hue/Saturation";
                        mappedPropertyName = "Hue";
                    }
                    // Handle Lumetri Color-specific properties
                    else if (propName.includes('lumetri')) {
                        // Map Lumetri Color properties to appropriate AE effects
                        if (propName.includes('contrast')) {
                            mappedEffectName = "Brightness & Contrast";
                            mappedPropertyName = "Contrast";
                        } else if (propName.includes('exposure')) {
                            mappedEffectName = "Exposure";
                            mappedPropertyName = "Exposure";
                        } else if (propName.includes('saturation')) {
                            mappedEffectName = "Hue/Saturation";
                            mappedPropertyName = "Saturation";
                        } else if (propName.includes('temperature')) {
                            // No direct equivalent, use Color Balance
                            mappedEffectName = "Color Balance (HLS)";
                            mappedPropertyName = "Hue";
                        } else if (propName.includes('tint')) {
                            mappedEffectName = "Tint";
                            mappedPropertyName = "Amount to Tint";
                        } else if (propName.includes('vibrance')) {
                            mappedEffectName = "Hue/Saturation";
                            mappedPropertyName = "Saturation"; // Closest AE equivalent
                        } else {
                            // Default to Brightness & Contrast for unknown Lumetri properties
                            mappedEffectName = "Brightness & Contrast";
                            mappedPropertyName = "Brightness";
                        }
                    }
                    
                    // Normalize the value for After Effects
                    const normalizedValue = this.normalizeValueForAE(mappedPropertyName, value);
                    
                    console.log("AE Property Mapping - Final:", 
                        "Effect:", mappedEffectName,
                        "Property:", mappedPropertyName,
                        "Original Value:", value,
                        "Normalized Value:", normalizedValue);
                    
                    // Call the appropriate host action with the mapped values
                    return this.hostActions.setEffectProperty(
                        mappedEffectName,
                        mappedPropertyName,
                        normalizedValue
                    );
                } else {
                    // For other hosts (Premiere Pro), use the original values
                    return this.hostActions.setEffectProperty(
                        intent.params.effectName,
                        intent.params.propertyName,
                        value
                    );
                 }

            case 'speed':
                if (intent.params.speedPercent !== undefined && intent.params.speedPercent !== null) {
                    // Show a more immediate response for better UX
                    console.log(`Starting speed change to ${intent.params.speedPercent}%`);
                    
                    // Use hostActions.changeClipSpeed
                    return this.hostActions.changeClipSpeed(intent.params.speedPercent)
                       .then(result => {
                            // Process the result with less delay
                            console.log(`Speed change result:`, result);
                            
                            if (result.toLowerCase().includes("set to") || 
                                result.toLowerCase().includes("speed set") ||
                                // Also match partial success messages
                                (result.toLowerCase().includes("speed") && result.toLowerCase().includes("clip"))) { 
                                
                               let suggestion = "";
                                // We could add app-specific suggestions here if needed
                                return `Speed set to ${intent.params.speedPercent}%.${suggestion}`;
                           } else {
                               return result; // Error or other message
                           }
                       })
                        .catch(error => {
                            console.error(`Speed change error:`, error);
                            return `Sorry, I couldn't change the speed: ${error}`;
                        });
                } else if (intent.params.needsPrompt) {
                    // The context "speed" is important for index.html to form the next command
                    return Promise.resolve(`${this.PARAM_PROMPT_PREFIX}speed:Enter speed value (e.g., 50 or 200%):`);
                } else {
                    // This case might occur if general 'speed' keyword matched but extractSpeedParams found nothing usable
                    // (e.g. "speed quickly"). Ask for clarification or prompt.
                    return Promise.resolve(`${this.PARAM_PROMPT_PREFIX}speed:Enter speed value (e.g., 50 or 200%):`);
                }

            case 'scale':
                // Use hostActions.scaleClipsToSequence - Needs AE implementation
                const maintainAspectRatio = intent.params.maintainAspectRatio !== undefined ? intent.params.maintainAspectRatio : true;
                return this.hostActions.scaleClipsToSequence(maintainAspectRatio);

            case 'reverse':
                // Use hostActions.reverseSelectedClips - Needs AE implementation
                return this.hostActions.reverseSelectedClips();

            case 'export': // PPro specific - Frame export. AE equivalent? Render queue?
                 if (this.hostAppName === 'PPRO') {
                    return this.hostActions.exportCurrentFrame();
                 } else {
                    // AE: Export frame (Save Frame As) or Add to Render Queue?
                    // Let's map 'export' to 'Save Frame As' for now
                    if (typeof this.hostActions.exportCurrentFrame === 'function') { // Check if AEActions implements it
                         return this.hostActions.exportCurrentFrame();
                    } else {
                         return Promise.resolve("Exporting current frame might work differently in After Effects. Try 'Add to Render Queue'?");
                    }
                 }

            case 'import':
                // Use hostActions.importFootage - Needs AE implementation
                // Filenames are handled by the dialog currently in both placeholders
                return this.hostActions.importFootage([], intent.params.binName); // Pass binName (folderName for AE)

            case 'bin': // Handles 'folder' for AE
                if (intent.params.binName) {
                    // Use hostActions.createBin - Needs AE implementation
                    return this.hostActions.createBin(intent.params.binName);
                } else {
                    return Promise.resolve("Please specify a name for the bin/folder (e.g., 'create folder Shots').");
                }

            case 'nest': // Handles 'precompose' for AE
                // Use hostActions.nestSelectedClips - Needs AE implementation
                const nestName = intent.params.nestName || (this.hostAppName === 'PPRO' ? "Nested Sequence" : "Pre-comp");
                return this.hostActions.nestSelectedClips(nestName);

            case 'help':
                return this.getHelpText(); // May need host-specific examples in help text eventually

            case 'wiggle_expression':
                if (this.hostAppName === 'AEFT') {
                    if (intent.params.propertyName && intent.params.frequency !== undefined && intent.params.amplitude !== undefined) {
                        // Map common variations
                        let propToWiggle = intent.params.propertyName;
                        if (propToWiggle === 'rotate') propToWiggle = 'rotation';
                        else if (propToWiggle === 'size' || propToWiggle === 'zoom') propToWiggle = 'scale';
                        else if (propToWiggle === 'transparency' || propToWiggle === 'alpha') propToWiggle = 'opacity';
                        else if (propToWiggle === 'anchor' || propToWiggle === 'pivot') propToWiggle = 'anchor point';
                        // Add more mappings if needed

                        // Basic check if it's a known transform prop, otherwise assume it might be an effect prop (future enhancement)
                        const knownTransformProps = ['position', 'scale', 'rotation', 'opacity', 'anchor point'];
                        if (!knownTransformProps.includes(propToWiggle)) {
                            console.warn(`Wiggle target '${intent.params.propertyName}' not a standard Transform property. Applying wiggle to Position instead.`);
                            propToWiggle = 'position'; // Fallback to position if not recognized
                        }

                        return this.hostActions.applyWiggleExpression(
                            propToWiggle,
                            intent.params.frequency,
                            intent.params.amplitude
                        );
                    } else {
                        return Promise.resolve("Missing parameters for wiggle expression.");
                    }
                } else {
                    return Promise.resolve("Wiggle expression command is only available in After Effects.");
                }

            case 'center_anchor':
                if (this.hostAppName === 'AEFT') {
                    // Return directly, no parameters needed for this command
                    return this.hostActions.centerAnchorPoint();
                } else {
                    return Promise.resolve("Center anchor point command is only available in After Effects.");
                }

            case 'speed_ramp':
                if (this.hostAppName === 'AEFT') {
                    // Extract existing parameters from the command text
                    const cmdParts = originalCommand.split(' ').filter(p => p.trim() !== '');
                    
                    // If it's just "speed ramp" or the command parts don't include additional parameters
                    if (cmdParts.length <= 2) {
                        // First prompt - for transition length
                        return Promise.resolve(`${this.PARAM_PROMPT_PREFIX}speed ramp:Enter value for transition length (seconds, 0.1-30):`);
                    }
                    
                    // If "speed ramp X" but no skip amount
                    if (cmdParts.length === 3 && !isNaN(parseFloat(cmdParts[2]))) {
                        // We have the first parameter, prompt for the second
                        const currentContext = `speed ramp ${cmdParts[2]}`;
                        return Promise.resolve(`${this.PARAM_PROMPT_PREFIX}${currentContext}:Enter value for skip amount (seconds, 0.5-60):`);
                    }
                    
                    // If "speed ramp X Y" but no tension
                    if (cmdParts.length === 4 && !isNaN(parseFloat(cmdParts[2])) && !isNaN(parseFloat(cmdParts[3]))) {
                        // We have the first two parameters, prompt for the third
                        const currentContext = `speed ramp ${cmdParts[2]} ${cmdParts[3]}`;
                        return Promise.resolve(`${this.PARAM_PROMPT_PREFIX}${currentContext}:Enter value for ease tension (0.1-100, higher = more abrupt):`);
                    }
                    
                    // Extract parameters from command parts if present, use defaults if not
                    const rampLength = cmdParts.length > 2 ? parseFloat(cmdParts[2]) || 2 : 2;
                    const skipAmount = cmdParts.length > 3 ? parseFloat(cmdParts[3]) || 5 : 5;
                    const tension = cmdParts.length > 4 ? parseFloat(cmdParts[4]) || 80 : 80;
                    
                    return this.hostActions.applySpeedRamp(rampLength, skipAmount, tension)
                        .then(result => {
                            if (result.includes("applied")) {
                                return `Speed ramp applied (${skipAmount}s of footage compressed into ${rampLength}s)`;
                            } else {
                                return result;
                            }
                        });
                } else {
                    return Promise.resolve("Speed ramp command is only available in After Effects.");
                }

            case 'custom_effect_combo':
                 // Use hostActions.applyCreativeLook - Needs AE implementation
                 if (typeof this.hostActions.applyCreativeLook === 'function') {
                     return this.hostActions.applyCreativeLook(intent.params.effectType || 'basic');
                 } else {
                      // Fallback for AE if not implemented
                      const effectType = intent.params.effectType || 'basic';
                       console.warn(`AEActions.applyCreativeLook not implemented for type: ${effectType}`);
                       // Try applying Lumetri/Levels as a basic fallback
                       const fallbackEffect = this.hostAppName === 'PPRO' ? 'Lumetri Color' : 'Levels';
                       return this.hostActions.applyEffect(fallbackEffect)
                           .then(res => res.startsWith("Applied") ? `Applied basic adjustment (${fallbackEffect})` : res)
                           .catch(err => `Could not apply basic adjustment: ${err}`);
                 }

            case 'insert_item':
                 if (intent.params.itemName && intent.params.timecode) {
                     if (this.hostAppName === 'PPRO') {
                         return this.hostActions.insertClip(
                             intent.params.itemName,
                             intent.params.timecode,
                             intent.params.videoTrackIndex,
                             intent.params.audioTrackIndex // Pass audio track too
                         );
                     } else if (this.hostAppName === 'AEFT') {
                         return this.hostActions.insertLayer(
                             intent.params.itemName,
                             intent.params.timecode,
                             intent.params.layerIndex
                         );
                     } else {
                         return Promise.resolve(`Insert command not supported in host: ${this.hostAppName}`);
                     }
                 } else {
                     return Promise.resolve("Missing item name or timecode for insert command.");
                 }

            case 'move_item':
                 if (intent.params.timecode) {
                     if (this.hostAppName === 'PPRO') {
                         return this.hostActions.moveClip(
                             intent.params.timecode,
                             intent.params.videoTrackIndex
                         );
                     } else if (this.hostAppName === 'AEFT') {
                         return this.hostActions.moveLayer(
                             intent.params.timecode,
                             intent.params.layerIndex // Pass layer index (-1 if not specified)
                         );
                     } else {
                         return Promise.resolve(`Move command not supported in host: ${this.hostAppName}`);
                     }
                 } else {
                      return Promise.resolve("Missing timecode for move command.");
                 }

            // --- Fallback Handling ---
            case 'unknown':
            default:
                console.log(`Command "${originalCommand}" fell back to unknown intent for ${this.hostAppName}.`);
                // Reuse existing fallback logic, potentially adding AE specific hints
                 const effectMatch = this.findBestEffectMatch(originalCommand, 0.6);
                 if (effectMatch) {
                      if(originalCommand.toLowerCase() === effectMatch.toLowerCase()) {
                          return Promise.resolve(`Effect "${effectMatch}" found. Select it to apply, or specify a property like "${effectMatch} [property] [value]".`);
                      } else {
                          return Promise.resolve(`Did you mean to apply the effect "${effectMatch}"? Try typing "${effectMatch}" or use 'help'.`);
                      }
                 }
                 const transitionMatch = this.findBestTransitionMatch(originalCommand, 0.6);
                 if (transitionMatch && this.transitionsCache.length > 0) { // Only suggest if transitions are relevant/available
                      if(originalCommand.toLowerCase() === transitionMatch.toLowerCase()){
                           return Promise.resolve(`Transition "${transitionMatch}" found. Select it to apply.`);
                      } else {
                           return Promise.resolve(`Did you mean to apply the transition "${transitionMatch}"? Try typing "${transitionMatch}" or use 'help'.`);
                      }
                 }
                return Promise.resolve(`I didn't understand "${originalCommand}". Try typing an effect or property name, or use 'help'.`);
        }
    }
    
    /**
     * Formats the list of properties returned by hostActions.getEffectProperties
     * @param {string} effectName - Name of the effect
     * @param {Array<object>} properties - Array of property objects { name: string, value: any, type: string }
     * @returns {string} - Formatted string for display
     */
     formatPropertiesList(effectName, properties) {
         if (!properties || properties.length === 0) {
             return `No properties found or accessible for ${effectName} in ${this.hostAppName}.`;
         }

         let response = `Properties for ${effectName}:\n\n`;
         properties.forEach(prop => {
             let line = `- ${prop.name}`;
             // Add type/value info if available (may need adjustment based on AE property structure)
             // ... (keep existing formatting logic for now) ...
             response += line + '\n';
         });

         response += `\nUse these with commands like: "${effectName} [property name] [value]"`;

         // Add host-specific common examples
         if (this.hostAppName === 'PPRO' && effectName.toLowerCase().includes('lumetri')) {
              response += `\n\nCommon Lumetri properties:\n`;
              response += `- Lumetri Contrast 50\n`;
              response += `- Lumetri Saturation 150\n`;
         } else if (this.hostAppName === 'AEFT' && effectName.toLowerCase().includes('levels')) {
              response += `\n\nCommon Levels properties:\n`;
              response += `- Levels Input Black 10\n`;
              response += `- Levels Gamma 1.2\n`;
         }
         // Add more examples as needed

         return response;
    }
    
    /**
     * Get help text for available commands
     * @returns {string} - Formatted help text (potentially host-specific)
     */
    getHelpText() {
        // Base examples, could add AE specific examples dynamically
        let helpText = `
<div class="help-container">
    <h3>Available Commands (${this.hostAppName})</h3>

    <h4>Effects & Properties</h4>
    <ul>
        <li><code>Add [effect name]</code> - Apply effect to selection</li>
        <li><code>[Effect Name] [Property Name] [Value]</code> - Set effect property</li>
        <li><i>Examples:</i></li>
        ${this.hostAppName === 'PPRO' ?
            `<li><code>Lumetri Contrast 50</code></li>
             <li><code>Gaussian Blur Blurriness 25</code></li>
             <li><code>Scale 150</code> (sets Motion > Scale)</li>
             <li><code>Opacity 80</code> (sets Opacity)</li>` :
            `<li><code>Levels Input Black 10</code></li>
             <li><code>Gaussian Blur Blur Amount 30</code></li>
             <li><code>Scale 150</code> (sets Layer > Transform > Scale)</li>
             <li><code>Opacity 80</code> (sets Layer > Transform > Opacity)</li>`
        }
        <li><code>List [effect name] properties</code> - Show properties for an effect</li>
        <li><code>Cinematic</code> / <code>B&W</code> - Apply simple looks</li>
    </ul>`;

    if (this.hostAppName === 'PPRO' || (this.transitionsCache && this.transitionsCache.length > 0)) {
        helpText += `
    <h4>Transitions</h4>
    <ul>
         ${this.hostAppName === 'PPRO' ?
             `<li><code>Add [transition name]</code> - Apply transition</li>
              <li><code>Cross Dissolve</code> - Add cross dissolve</li>` :
             `<li><code>Add [preset name]</code> - Apply transition preset (e.g., Fade In/Out)</li>`
         }
    </ul>`;
    }

    helpText += `
    <h4>Editing & Timeline</h4>
    <ul>
        ${this.hostAppName === 'PPRO' ?
             `<li><code>Cut</code> / <code>Delete</code> - Cut/Delete selected clips</li>
              <li><code>Nest</code> - Nest selected clips</li>` :
             `<li><code>Split Layer</code> / <code>Delete</code> - Split/Delete selected layers (TBD)</li>
              <li><code>Precompose</code> - Precompose selected layers</li>
              <li><code>Center Anchor</code> - Center the anchor point on selected layers</li>
              <li><code>Speed Ramp</code> - Create a speed ramp effect (interactive prompts)</li>`
        }
        <li><code>Speed 50%</code> / <code>200%</code> / <code>2x</code> - Change speed</li>
        <li><code>Reverse</code> - Reverse selection</li>
        <li><code>Scale to Fill</code> / <code>Scale to Fit</code> - Resize selection to comp/sequence</li>
        <li><code>Insert [item name] at [time]</code> - Add item from project</li>
        <li><code>Move selection to [time]</code> - Move selected item(s)</li>
        <li><i>(Time: 10s, 1:30, 1:15:10:05, 120f)</i></li>
    </ul>
    
     <h4>Project & Files</h4>
     <ul>
         <li><code>Import</code> - Import files (opens dialog)</li>
         <li><code>Import to folder [folder name]</code> - Import into specific folder</li>
         ${this.hostAppName === 'PPRO' ?
              `<li><code>Create bin [bin name]</code> - Create a project bin</li>` :
              `<li><code>Create folder [folder name]</code> - Create a project folder</li>`
         }
         <li><code>Organize project</code> - Sort project items into folders</li>
         <li><code>Preview organize project</code> - See organization plan</li>
    </ul>

    <h4>Presets</h4>
    <ul>
        ${this.hostAppName === 'PPRO' ? ``:
            `<li>User preset should be saved in 
            "C:\\Users\\username\\Documents\\
            Adobe\\After Effects version\\User Presets"(Windows) or
            "/Users/username/Documents/
            Adobe/After Effects version/User Presets"(Mac)</li>`
        }
    </ul>
    
     <h4>Other</h4>
     <ul>
         <li>Use <code>Shift+Enter</code> to add commands to a stack.</li>
         <li>Press <code>Enter</code> on empty input to run the stack.</li>
         <li>Type <code>help</code> for this list.</li>
    </ul>
</div>
        `;
        return helpText;
    }

    /**
     * Find the best matching string using fuzzy matching against a list of candidates.
     * @param {string} query - The string to match
     * @param {string[]} candidates - List of potential matching strings
     * @param {number} [threshold=0.6] - Similarity threshold (0-1)
     * @returns {string|null} - Best matching string or null if no match above threshold
     */
    findBestMatch(query, candidates, threshold = 0.6) {
        if (!query || !candidates || candidates.length === 0) {
            return null;
        }
        let bestMatch = null;
        let bestScore = -1;
        const normalizedQuery = query.toLowerCase().trim();

        candidates.forEach(candidate => {
            if (typeof candidate !== 'string') return; // Skip non-strings in cache
            const normalizedCandidate = candidate.toLowerCase();
            const score = this.calculateSimilarity(normalizedQuery, normalizedCandidate);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = candidate;
            }
        });
        return bestScore >= threshold ? bestMatch : null;
    }

    /**
     * Find the best matching effect name using fuzzy matching against the effects cache
     * Includes host-specific common aliases.
     * @param {string} commandPart - Part of the command potentially containing the effect name
     * @param {number} [threshold=0.6] - Similarity threshold
     * @returns {string|null} - Best matching effect name or null
     */
    findBestEffectMatch(commandPart, threshold = 0.6) {
        if (!this.effectsCache || this.effectsCache.length === 0) {
            console.warn("Effects cache not available for matching.");
            return null;
        }
        const lowerCommandPart = commandPart.toLowerCase();

        // --- Host-Specific Aliases ---
        if (this.hostAppName === 'PPRO') {
             // Fix for partial Transform matches - START
             if (lowerCommandPart === "transform" || lowerCommandPart === "transf" || 
                 lowerCommandPart.startsWith("trans") || lowerCommandPart.startsWith("tran")) {
                 return "Transform";
             }
             // Fix for partial Transform matches - END
             
             if (lowerCommandPart.includes('lumert') || lowerCommandPart.includes('lumet') || lowerCommandPart.includes('lumetr') || lowerCommandPart.includes('lemetri')) return "Lumetri Color";
             if (lowerCommandPart.includes('gaussian') || lowerCommandPart.includes('gassian') || (lowerCommandPart.includes('blur') && !lowerCommandPart.includes('vr'))) return "Gaussian Blur";
        } else if (this.hostAppName === 'AEFT') {
             if (lowerCommandPart.includes('gaussian') || lowerCommandPart.includes('gassian') || lowerCommandPart.includes('fast blur')) {
                 const fastBlur = this.findBestMatch("Fast Box Blur", this.effectsCache, 0.8);
                 if (fastBlur) return fastBlur;
                 const gaussBlur = this.findBestMatch("Gaussian Blur", this.effectsCache, 0.8);
                 if (gaussBlur) return gaussBlur;
             }
              if (lowerCommandPart.includes('fractal') || (lowerCommandPart.includes('noise') && !lowerCommandPart.includes('turbulent'))) {
                   const fractal = this.findBestMatch("Fractal Noise", this.effectsCache, 0.8);
                   if (fractal) return fractal;
              }
              if (lowerCommandPart.includes('turbulent') || (lowerCommandPart.includes('displace') && lowerCommandPart.includes('turb'))) {
                   const turb = this.findBestMatch("Turbulent Displace", this.effectsCache, 0.8);
                   if (turb) return turb;
              }
               if (lowerCommandPart.includes('levels')) {
                    const levels = this.findBestMatch("Levels", this.effectsCache, 0.8);
                    if (levels) return levels;
               }
               if (lowerCommandPart.includes('curves')) {
                     const curves = this.findBestMatch("Curves", this.effectsCache, 0.8);
                     if (curves) return curves;
               }
        }
        // --- End Host-Specific ---

        // Generic fuzzy match against the cache
        const bestMatch = this.findBestMatch(commandPart, this.effectsCache, threshold);
        return bestMatch;
    }

    /**
     * Find the best matching transition name using fuzzy matching against the transitions cache
     * Includes host-specific common aliases/concepts.
      * @param {string} commandPart - Part of the command potentially containing the transition name
      * @param {number} [threshold=0.6] - Similarity threshold
      * @returns {string|null} - Best matching transition name or null
     */
    findBestTransitionMatch(commandPart, threshold = 0.6) {
        // Always return null for AE - no transitions should be shown in AE
        if (this.hostAppName === 'AEFT') {
            return null;
        }
        
        if (!this.transitionsCache || this.transitionsCache.length === 0) {
            // console.warn("Transitions cache not available for matching.");
            // Don't default if cache is empty, return null
            return null;
        }
         const lowerCommandPart = commandPart.toLowerCase();

         // --- Host-Specific Aliases ---
         if (this.hostAppName === 'PPRO') {
         if (lowerCommandPart.includes('cross dissolve') || lowerCommandPart.includes('dissolve')) return "Cross Dissolve";
         if (lowerCommandPart.includes('dip to black')) return "Dip to Black";
         if (lowerCommandPart.includes('dip to white')) return "Dip to White";
         }
         // --- End Host-Specific ---

        // Fuzzy match against available transitions/presets
        const bestMatch = this.findBestMatch(commandPart, this.transitionsCache, threshold);

        // Don't default if no good match found in cache
        return bestMatch;
    }

    /**
     * Calculate similarity score between two strings using word overlap and Levenshtein distance
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} - Similarity score (0-1)
     */
    calculateSimilarity(str1, str2) {
        const s1 = str1.toLowerCase().trim();
        const s2 = str2.toLowerCase().trim();
        if (s1 === s2) return 1.0;

        const words1 = s1.split(/\s+/).filter(w => w.length > 1);
        const words2 = s2.split(/\s+/).filter(w => w.length > 1);
        const uniqueWords1 = new Set(words1);
        const uniqueWords2 = new Set(words2);
        let intersectionSize = 0;
        uniqueWords1.forEach(word => { if (uniqueWords2.has(word)) intersectionSize++; });
        const unionSize = uniqueWords1.size + uniqueWords2.size - intersectionSize;
        const wordOverlapScore = unionSize > 0 ? intersectionSize / unionSize : 0;

        const levenDistance = this.levenshteinDistance(s1, s2);
        const maxLen = Math.max(s1.length, s2.length);
        const levenScore = maxLen > 0 ? 1 - (levenDistance / maxLen) : 0;

        const wordOverlapWeight = (words1.length > 1 || words2.length > 1) ? 0.6 : 0.3;
        const levenWeight = 1.0 - wordOverlapWeight;
        let combinedScore = (wordOverlapScore * wordOverlapWeight) + (levenScore * levenWeight);

         if (s1.length > 3 && s2.length > 3) {
            if (s1.includes(s2) || s2.includes(s1)) {
                 // Boost less aggressively than before, let threshold handle final decision
                 combinedScore = Math.max(combinedScore, (combinedScore + 0.85) / 2); // Average with boost
            }
        }
        return Math.min(1.0, combinedScore);
    }

    /**
     * Calculate Levenshtein distance between two strings (standard implementation)
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} - Levenshtein distance
     */
    levenshteinDistance(str1 = "", str2 = "") {
        const m = str1.length;
        const n = str2.length;
        const d = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) d[i][0] = i;
        for (let j = 0; j <= n; j++) d[0][j] = j;
        for (let j = 1; j <= n; j++) {
            for (let i = 1; i <= m; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                d[i][j] = Math.min( d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost );
            }
        }
        return d[m][n];
    }
    
    /**
     * Normalize value ranges between Premiere Pro and After Effects
     * @param {string} propertyName - The property name 
     * @param {number} value - The original value (typically in Premiere Pro range)
     * @returns {number} - The normalized value suitable for After Effects
     */
    normalizeValueForAE(propertyName, value) {
        // Skip normalization if we're already in After Effects - use the value directly
        // The user is already entering values in AE's expected range
        if (this.hostAppName === 'AEFT') {
            return value;
        }
        
        const propNameLower = propertyName.toLowerCase();
        
        // The following normalizations will only happen when converting from Premiere Pro to AE
        
        // Handle Saturation (Premiere: 0-200, AE: 1-7)
        if (propNameLower.includes('saturation')) {
            // Map from 0-200 range to 1-7 range
            // Where 100 in Premiere = 4 in AE (normal saturation)
            if (value <= 0) return 1; // Min saturation
            if (value >= 200) return 7; // Max saturation
            return 1 + ((value / 100) * 3); // Linear mapping where 100 = 4
        }
        
        // Handle Contrast (Premiere: usually -100 to 100, AE: -50 to 50)
        if (propNameLower.includes('contrast')) {
            // Map from -100 to 100 range to -50 to 50 range
            return value / 2;
        }
        
        // Handle Brightness (Premiere: usually -100 to 100, AE: -100 to 100)
        if (propNameLower.includes('brightness')) {
            // Same range, no change needed
            return value;
        }
        
        // Handle Exposure (Premiere: usually -5 to 5, AE: -4 to 4)
        if (propNameLower.includes('exposure')) {
            // Map from -5 to 5 range to -4 to 4 range
            if (value < -5) return -4;
            if (value > 5) return 4;
            return (value / 5) * 4;
        }
        
        // Handle Vibrance (Premiere: 0-100, map to AE Saturation)
        if (propNameLower.includes('vibrance')) {
            // Map Vibrance to Saturation range in AE (1-7)
            if (value <= 0) return 1;
            if (value >= 100) return 7;
            return 1 + ((value / 100) * 6);
        }
        
        // Handle Temperature (Premiere: 2000-9000, AE: no direct equivalent)
        if (propNameLower.includes('temperature')) {
            // Map temperature to a useful range for Color Balance HLS
            // This is an approximation - map 3000-7000 to -50 to 50
            const normalTemp = Math.max(3000, Math.min(7000, value));
            return ((normalTemp - 5000) / 2000) * 50;
        }
        
        // Handle Opacity (Same in both: 0-100)
        if (propNameLower.includes('opacity')) {
            return Math.max(0, Math.min(100, value));
        }
        
        // Handle Scale (Same concept in both, but maybe different defaults)
        if (propNameLower.includes('scale')) {
            return value;
        }
        
        // Handle Hue (Premiere: -180 to 180, AE: -180 to 180)
        if (propNameLower.includes('hue') && !propNameLower.includes('saturation')) {
            return Math.max(-180, Math.min(180, value));
        }
        
        // Default: return the original value with basic bounds checking
        return value;
    }

    /**
     * Handle error responses in a consistent way
     * @param {string} errorMessage - The error message to return
     * @returns {Promise<string>} - Rejected promise with error message
     */
    handleErrorResponse(errorMessage) {
        console.error("AICommandProcessor Error:", errorMessage);
        return Promise.resolve(errorMessage); // Return as resolved promise with error message
    }
}

// Export the class
window.AICommandProcessor = AICommandProcessor; 