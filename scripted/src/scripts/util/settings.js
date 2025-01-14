/**
 * @fileOverview Utilities for various parts of Exhibit to collect
 *    their settings.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

/**
 * @namespace
 */
Exhibit.SettingsUtilities = {};

/**
 * @param {Object} config
 * @param {Object} specs
 * @param {Object} settings
 */
Exhibit.SettingsUtilities.collectSettings = function(config, specs, settings) {
    Exhibit.SettingsUtilities._internalCollectSettings(
        function(field) { return config[field]; },
        specs,
        settings
    );
};

/**
 * @param {Element} configElmt
 * @param {Object} specs
 * @param {Object} settings
 */
Exhibit.SettingsUtilities.collectSettingsFromDOM = function(configElmt, specs, settings) {
    Exhibit.SettingsUtilities._internalCollectSettings(
        function(field) { return Exhibit.getAttribute(configElmt, field); },
        specs,
        settings
    );
};

/**
 * @param {Function} f
 * @param {Object} specs
 * @param {Object} settings
 */
Exhibit.SettingsUtilities._internalCollectSettings = function(f, specs, settings) {
    var field, spec, name, value, type, dimensions, separator, a, i;

    for (field in specs) {
        if (specs.hasOwnProperty(field)) {
            spec = specs[field];
            name = field;
            if (spec.hasOwnProperty("name")) {
                name = spec.name;
            }
            if (!(settings.hasOwnProperty(name)) &&
                spec.hasOwnProperty("defaultValue")) {
                settings[name] = spec.defaultValue;
            }
        
            value = f(field);
            if (typeof value !== "undefined" && value !== null) {
                if (typeof value === "string") {
                    value = value.trim();
                    if (value.length > 0) {
                        type = "text";
                        if (spec.hasOwnProperty("type")) {
                            type = spec.type;
                        }
        
                        dimensions = 1;
                        if (spec.hasOwnProperty("dimensions")) {
                            dimensions = spec.dimensions;
                        }
        
                        try {
                            if (dimensions > 1) {
                                separator = ",";
                                if (spec.hasOwnProperty("separator")) {
                                    separator = spec.separator;
                                }
                    
                                a = value.split(separator);
                                if (a.length !== dimensions) {
                                    throw new Error("Expected a tuple of " + dimensions + " dimensions separated with " + separator + " but got " + value);
                                } else {
                                    for (i = 0; i < a.length; i++) {
                                        a[i] = Exhibit.SettingsUtilities._parseSetting(a[i].trim(), type, spec);
                                    }
                                    
                                    settings[name] = a;
                                }
                            } else {
                                settings[name] = Exhibit.SettingsUtilities._parseSetting(value, type, spec);
                            }
                        } catch (e) {
                            Exhibit.Debug.exception(e);
                        }
                    }
                }
            }
        }
    }
};

/**
 * @param {String|Number|Boolean|Function} s
 * @param {String} type
 * @param {Object} spec
 * @param {Array} spec.choices
 * @throws Error
 */
Exhibit.SettingsUtilities._parseSetting = function(s, type, spec) {
    var sType, f, n, choices, i;
    sType = typeof s;
    if (type === "text") {
        return s;
    } else if (type === "float") {
        if (sType === "number") {
            return s;
        } else if (sType === "string") {
            f = parseFloat(s);
            if (!isNaN(f)) {
                return f;
            }
        }
        throw new Error("Expected a floating point number but got " + s);
    } else if (type === "int") {
        if (sType === "number") {
            return Math.round(s);
        } else if (sType === "string") {
            n = parseInt(s, 10);
            if (!isNaN(n)) {
                return n;
            }
        }
        throw new Error("Expected an integer but got " + s);
    } else if (type === "boolean") {
        if (sType === "boolean") {
            return s;
        } else if (sType === "string") {
            s = s.toLowerCase();
            if (s === "true") {
                return true;
            } else if (s === "false") {
                return false;
            }
        }
        throw new Error("Expected either 'true' or 'false' but got " + s);
    } else if (type === "function") {
        if (sType === "function") {
            return s;
        } else if (sType === "string") {
            try {
                f = eval(s);
                if (typeof f === "function") {
                    return f;
                }
            } catch (e) {
                // silent
            }
        }
        throw new Error("Expected a function or the name of a function but got " + s);
    } else if (type === "enum") {
        choices = spec.choices;
        for (i = 0; i < choices.length; i++) {
            if (choices[i] === s) {
                return s;
            }
        }
        throw new Error("Expected one of " + choices.join(", ") + " but got " + s);
    } else {
        throw new Error("Unknown setting type " + type);
    }
};

/**
 * @param {Object} config
 * @param {Object} specs
 * @param {Object} accessors
 */
Exhibit.SettingsUtilities.createAccessors = function(config, specs, accessors) {
    Exhibit.SettingsUtilities._internalCreateAccessors(
        function(field) { return config[field]; },
        specs,
        accessors
    );
};

/**
 * @param {Element} configElmt
 * @param {Object} specs
 * @param {Object} accessors
 */
Exhibit.SettingsUtilities.createAccessorsFromDOM = function(configElmt, specs, accessors) {
    Exhibit.SettingsUtilities._internalCreateAccessors(
        function(field) { return Exhibit.getAttribute(configElmt, field); },
        specs,
        accessors
    );
};

/**
 * @param {Function} f
 * @param {Object} specs
 * @param {Object} accessors
 */ 
Exhibit.SettingsUtilities._internalCreateAccessors = function(f, specs, accessors) {
    var field, spec, accessorName, acessor, isTuple, createOneAccessor, alternatives, i, noop;

    noop = function(value, database, visitor) {};

    createOneAccessor = function(spec2) {
        isTuple = false;
        if (spec2.hasOwnProperty("bindings")) {
            return Exhibit.SettingsUtilities._createBindingsAccessor(f, spec2.bindings);
        } else if (spec2.hasOwnProperty("bindingNames")) {
            isTuple = true;
            return Exhibit.SettingsUtilities._createTupleAccessor(f, spec2);
        } else {
            return Exhibit.SettingsUtilities._createElementalAccessor(f, spec2);
        }
    };

    for (field in specs) {
        if (specs.hasOwnProperty(field)) {
            spec = specs[field];
            accessorName = spec.accessorName;
            accessor = null;
            isTuple = false;

            if (spec.hasOwnProperty("alternatives")) {
                alternatives = spec.alternatives;
                for (i = 0; i < alternatives.length; i++) {
                    accessor = createOneAccessor(alternatives[i]);
                    if (accessor !== null) {
                        break;
                    }
                }
            } else {
                accessor = createOneAccessor(spec);
            }
        
            if (accessor !== null) {
                accessors[accessorName] = accessor;
            } else if (!accessors.hasOwnProperty(accessorName)) {
                accessors[accessorName] = noop;
            }
        }
    }
};

/**
 * @param {Function} f
 * @param {Array} bindingSpecs
 * @returns {Function}
 */
Exhibit.SettingsUtilities._createBindingsAccessor = function(f, bindingSpecs) {
    var bindings, i, bindingSpec, accessor, isTuple;
    bindings = [];
    for (i = 0; i < bindingSpecs.length; i++) {
        bindingSpec = bindingSpecs[i];
        accessor = null;
        isTuple = false;
        
        if (bindingSpec.hasOwnProperty("bindingNames")) {
            isTuple = true;
            accessor = Exhibit.SettingsUtilities._createTupleAccessor(f, bindingSpec);
        } else {
            accessor = Exhibit.SettingsUtilities._createElementalAccessor(f, bindingSpec);
        }
        
        if (accessor === null) {
            if (!bindingSpec.hasOwnProperty("optional") || !bindingSpec.optional) {
                return null;
            }
        } else {
            bindings.push({
                bindingName:    bindingSpec.bindingName, 
                accessor:       accessor, 
                isTuple:        isTuple
            });
        }
    }
    
    return function(value, database, visitor) {
        Exhibit.SettingsUtilities._evaluateBindings(value, database, visitor, bindings);
    };
};

/**
 * @param {Function} f
 * @param {Object} spec
 * @returns {Function}
 */
Exhibit.SettingsUtilities._createTupleAccessor = function(f, spec) {
    var value, expression, parsers, bindingTypes, bindingNames, separator, i;
    value = f(spec.attributeName);

    if (value === null) {
        return null;
    }
    
    if (typeof value === "string") {
        value = value.trim();
        if (value.length === 0) {
            return null;
        }
    }
    
    try {
        expression = Exhibit.ExpressionParser.parse(value);
        
        parsers = [];
        bindingTypes = spec.types;
        for (i = 0; i < bindingTypes.length; i++) {
            parsers.push(Exhibit.SettingsUtilities._typeToParser(bindingTypes[i]));
        }
        
        bindingNames = spec.bindingNames;
        separator = ",";

        if (spec.hasOwnProperty("separator")) {
            separator = spec.separator;
        }
        
        return function(itemID, database, visitor, tuple) {
            expression.evaluateOnItem(itemID, database).values.visit(
                function(v) {
                    var a, tuple2, n, j, makeVisitFunction;
                    a = v.split(separator);
                    if (a.length === parsers.length) {
                        tuple2 = {};
                        if (tuple) {
                            for (n in tuple) {
                                if (tuple.hasOwnProperty(n)) {
                                    tuple2[n] = tuple[n];
                                }
                            }
                        }

                        makeVisitFunction = function(key) {
                            return function(v) {
                                key = v;
                            };
                        };
                        for (j = 0; j < bindingNames.length; j++) {
                            tuple2[bindingNames[j]] = null;
                            parsers[j](a[j], makeVisitFunction(tuple2[bindingNames[j]]));
                        }
                        visitor(tuple2);
                    }
                }
            );
        };

    } catch (e) {
        Exhibit.Debug.exception(e);
        return null;
    }
};

/**
 * @param {Function} f
 * @param {Object} spec
 * @param {String} spec.attributeName
 * @returns {Function}
 */
Exhibit.SettingsUtilities._createElementalAccessor = function(f, spec) {
    var value, bindingType, expression, parser;

    value = f(spec.attributeName);

    if (value === null) {
        return null;
    }
    
    if (typeof value === "string") {
        value = value.trim();
        if (value.length === 0) {
            return null;
        }
    }
    
    bindingType = "text";

    if (spec.hasOwnProperty("type")) {
        bindingType = spec.type;
    }

    try {
        expression = Exhibit.ExpressionParser.parse(value);
        parser = Exhibit.SettingsUtilities._typeToParser(bindingType);
        return function(itemID, database, visitor) {
            expression.evaluateOnItem(itemID, database).values.visit(
                function(v) { return parser(v, visitor); }
            );
        };
    } catch (e) {
        Exhibit.Debug.exception(e);
        return null;
    }
};

/**
 * @param {String} type
 * @returns {Function}
 * @throws Error
 */
Exhibit.SettingsUtilities._typeToParser = function(type) {
    switch (type) {
    case "text":    return Exhibit.SettingsUtilities._textParser;
    case "url":     return Exhibit.SettingsUtilities._urlParser;
    case "float":   return Exhibit.SettingsUtilities._floatParser;
    case "int":     return Exhibit.SettingsUtilities._intParser;
    case "date":    return Exhibit.SettingsUtilities._dateParser;
    case "boolean": return Exhibit.SettingsUtilities._booleanParser;
    default:
        throw new Error("Unknown setting type " + type);

    }
};

/**
 * @param {String} v
 * @param {Function} f
 */
Exhibit.SettingsUtilities._textParser = function(v, f) {
    return f(v);
};

/**
 * @param {String} v
 * @param {Function} f
 */
Exhibit.SettingsUtilities._floatParser = function(v, f) {
    var n = parseFloat(v);
    if (!isNaN(n)) {
        return f(n);
    }
    return false;
};

/**
 * @param {String} v
 * @param {Function} f
 */
Exhibit.SettingsUtilities._intParser = function(v, f) {
    var n = parseInt(v, 10);
    if (!isNaN(n)) {
        return f(n);
    }
    return false;
};

/**
 * @param {String} v
 * @param {Function} f
 */
Exhibit.SettingsUtilities._dateParser = function(v, f) {
    var d;
    if (v instanceof Date) {
        return f(v);
    } else if (typeof v === "number") {
        d = new Date(0);
        d.setUTCFullYear(v);
        return f(d);
    } else {
        d = Exhibit.DateTime.parseIso8601DateTime(v.toString());
        if (d !== null) {
            return f(d);
        }
    }
    return false;
};

/**
 * @param {String} v
 * @param {Function} f
 */
Exhibit.SettingsUtilities._booleanParser = function(v, f) {
    v = v.toString().toLowerCase();
    if (v === "true") {
        return f(true);
    } else if (v === "false") {
        return f(false);
    }
    return false;
};

/**
 * @param {String} v
 * @param {Function} f
 */
Exhibit.SettingsUtilities._urlParser = function(v, f) {
    return f(Exhibit.Persistence.resolveURL(v.toString()));
};

/**
 * @param {String} value
 * @param {Exhibit.Database}  database
 * @param {Function} visitor
 * @param {Array} bindings
 */
Exhibit.SettingsUtilities._evaluateBindings = function(value, database, visitor, bindings) {
    var f, maxIndex;
    maxIndex = bindings.length - 1;
    f = function(tuple, index) {
        var binding, visited, recurse, bindingName;
        binding = bindings[index];
        visited = false;
        
        recurse = index === maxIndex ? function() { visitor(tuple); } : function() { f(tuple, index + 1); };
        if (binding.isTuple) {
            /*
                The tuple accessor will copy existing fields out of "tuple" into a new
                object and then injects new fields into it before calling the visitor.
                This is so that the same tuple object is not reused for different
                tuple values, which would cause old tuples to be overwritten by new ones.
             */
            binding.accessor(
                value, 
                database, 
                function(tuple2) { visited = true; tuple = tuple2; recurse(); }, 
                tuple
            );
        } else {
            bindingName = binding.bindingName;
            binding.accessor(
                value, 
                database, 
                function(v) { visited = true; tuple[bindingName] = v; recurse(); }
            );
        }
        
        if (!visited) { recurse(); }
    };
    f({}, 0);
};
