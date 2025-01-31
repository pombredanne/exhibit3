/**
 * @fileOverview
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

/**
 * @param {Exhibit.Database} database
 * @returns {Exhibit._Impl}
 */
Exhibit.create = function(database) {
    return new Exhibit._Impl(database);
};

/**
 * @param {Element} elmt
 * @param {String} name
 * @param {String} splitOn
 * @returns {String|Array}
 */
Exhibit.getAttribute = function(elmt, name, splitOn) {
    var value, i, values;

    try {
        value = elmt.getAttribute(name);
        if (value === null || value.length === 0) {
            value = elmt.getAttribute("ex:" + name);
            if (value === null || value.length === 0) {
                return null;
            }
        }
        if (typeof splitOn === "undefined" || splitOn === null) {
            return value;
        }
        values = value.split(splitOn);
        for (i = 0; i < values.length; i++) {
            values[i] = values[i].trim();
        }
        return values;
    } catch(e) {
        return null;
    }
};

/**
 * @param {Element} elmt
 * @returns {String}
 */
Exhibit.getRoleAttribute = function(elmt) {
    var role = Exhibit.getAttribute(elmt, "role") || "";
    if (typeof role === "object") {
        role = role[0];
    }
    role = role.replace(/^exhibit-/, "");
    return role;
};

/**
 * @param {Element} elmt
 * @returns {Object}
 */
Exhibit.getConfigurationFromDOM = function(elmt) {
    var c, o;
    c = Exhibit.getAttribute(elmt, "configuration");
    if (c !== null && c.length > 0) {
        try{
            o = eval(c);
            if (typeof o === "object") {
                return o;
            }
        } catch (e) {}
    }
    return {};
};

/**
 * @param {Element} elmt
 * @returns {Object}
 */
Exhibit.extractOptionsFromElement = function(elmt) {
    var opts, attrs, i, name, value;
    opts = {};
    attrs = elmt.attributes;
    for (i in attrs) {
        if (attrs.hasOwnProperty(i)) {
            name = attrs[i].nodeName;
            value = attrs[i].nodeValue;
            if (name.indexOf('ex:') === 0) {
                name = name.substring(3);
            }
            opts[name] = value;
        }
    }
    return opts;
};

/**
 * @public
 * @class
 * @constructor
 * @param {Exhibit.Database} database
 */
Exhibit._Impl = function(database) {
    this._database = (database !== null && typeof database !== "undefined") ? 
        database : 
        (window.hasOwnProperty("database") ?
            window.database :
            Exhibit.Database.create());
            
    this._uiContext = Exhibit.UIContext.createRootContext({}, this);
    this._collectionMap = {};
    this._componentMap= {};
    
};

/**
 * 
 */
Exhibit._Impl.prototype.dispose = function() {
    var id;

    for (id in this._componentMap) {
        if (this._componentMap.hasOwnProperty(id)) {
            try{
                this._componentMap[id].dispose();
            } catch(ex1) {
                Exhibit.Debug.exception(ex1, "Failed to dispose component");
            }
        }
    }
    for (id in this._collectionMap) {
        if (this._collectionMap.hasOwnProperty(id)) {
            try {
                this._collectionMap[id].dispose();
            } catch(ex2) {
                Exhibit.Debug.exception(ex2, "Failed to dispose collection");
            }
        }
    }
    
    this._uiContext.dispose();
    
    this._componentMap = null;
    this._collectionMap = null;
    this._uiContext = null;
    this._database = null;
};

/**
 * @returns {Exhibit.Database}
 */
Exhibit._Impl.prototype.getDatabase = function() {
    return this._database;
};

/**
 * @returns {Exhibit.UIContext}
 */
Exhibit._Impl.prototype.getUIContext = function() {
    return this._uiContext;
};

/**
 * @param {String} id
 * @returns {Exhibit.Collection}
 */
Exhibit._Impl.prototype.getCollection = function(id) {
    var collection = this._collectionMap[id];
    if (collection === null && id === "default") {
        collection = Exhibit.Collection.createAllItemsCollection(id, this._database);
        this.setDefaultCollection(collection);
    }
    return collection;
};

/**
 * @returns {Exhibit.Collection}
 */
Exhibit._Impl.prototype.getDefaultCollection = function() {
    return this.getCollection("default");
};

/**
 * @param {String} id
 * @param {Exhibit.Collection} c
 */
Exhibit._Impl.prototype.setCollection = function(id, c) {
    if (this._collectionMap.hasOwnProperty(id)) {
        try{
            this._collectionMap[id].dispose();
        } catch(e) {
            Exhibit.Debug.exception(e);
        }
    }
    this._collectionMap[id] = c;
};

/**
 * @param {Exhibit.Collection} c
 */
Exhibit._Impl.prototype.setDefaultCollection = function(c) {
    this.setCollection("default", c);
};

/**
 * @param {String} id
 * @returns {Object}
 */
Exhibit._Impl.prototype.getComponent = function(id) {
    return this._componentMap[id];
};

/**
 * @param {String} id
 * @param {Object} c
 */
Exhibit._Impl.prototype.setComponent = function(id, c) {
    if (this._componentMap.hasOwnProperty(id)) {
        try{
            this._componentMap[id].dispose();
        } catch(e) {
            Exhibit.Debug.exception(e);
        }
    }
    
    this._componentMap[id] = c;
};

/**
 * @param {String} id
 */
Exhibit._Impl.prototype.disposeComponent = function(id) {
    if (this._componentMap.hasOwnProperty(id)) {
        try{
            this._componentMap[id].dispose();
        } catch(e) {
            Exhibit.Debug.exception(e);
        }
        delete this._componentMap[id];
    }
};

/**
 * @param {Object} configuration
 */
Exhibit._Impl.prototype.configure = function(configuration) {
    var i, config, id;
    if (configuration.hasOwnProperty("collections")) {
        for (i = 0; i < configuration.collections.length; i++) {
            config = configuration.collections[i];
            id = config.id;
            if (id === null || id.length === 0) {
                id = "default";
            }
            this.setCollection(id, Exhibit.Collection.create2(id, config, this._uiContext));
        }
    }
    if (configuration.hasOwnProperty("components")) {
        for (i = 0; i < configuration.components.length; i++) {
            config = configuration.components[i];
            component = Exhibit.UI.create(config, config.elmt, this._uiContext);
            if (component !== null) {
                id = elmt.id;
                if (id === null || id.length === 0) {
                    id = "component" + Math.floor(Math.random() * 1000000);
                }
                this.setComponent(id, component);
            }
        }
    }
};

/**
 * Set up this Exhibit's view from its DOM configuration.
 * @param {Node} [root] optional root node, below which configuration gets read
 *                      (defaults to document.body, when none provided)
 */
Exhibit._Impl.prototype.configureFromDOM = function(root) {
    var collectionElmts = [], coderElmts = [], coordinatorElmts = [], lensElmts = [], facetElmts = [], otherElmts = [], f, uiContext, i, elmt, id, self, processElmts, exporters, expr, exporter, hash, itemID;

    f = function(elmt) {
        var role, node;
        role = Exhibit.getRoleAttribute(elmt);
        if (role.length > 0) {
            switch (role) {
            case "collection":  collectionElmts.push(elmt); break;
            case "coder":       coderElmts.push(elmt); break;
            case "coordinator": coordinatorElmts.push(elmt); break;
            case "lens":
            case "submission-lens":
            case "edit-lens":   lensElmts.push(elmt); break;
            case "facet":       facetElmts.push(elmt); break;
            default: 
                otherElmts.push(elmt);
            }
        } else {
            node = elmt.firstChild;
            while (node !== null) {
                if (node.nodeType === 1) {
                    f(node);
                }
                node=node.nextSibling;
            }
        }
    };
    f(root || document.body);
    
    uiContext = this._uiContext;
    for (i = 0; i < collectionElmts.length; i++) {
        elmt = collectionElmts[i];
        id = elmt.id;
        if (id === null || id.length === 0) {
            id = "default";
        }
        this.setCollection(id, Exhibit.Collection.createFromDOM2(id, elmt, uiContext));
    }
    
    self = this;
    processElmts = function(elmts) {
        var i, elmt, component, id;
        for (i = 0; i < elmts.length; i++) {
            elmt = elmts[i];
            try {
                component = Exhibit.UI.createFromDOM(elmt, uiContext);
                if (component !== null) {
                    id = elmt.id;
                    if (id === null || id.length === 0) {
                        id = "component" + Math.floor(Math.random() * 1000000);
                    }
                    self.setComponent(id, component);
                }
            } catch (ex1) {
                Exhibit.Debug.exception(ex1);
            }
        }
    };

    processElmts(coordinatorElmts);
    processElmts(coderElmts);
    processElmts(lensElmts);
    processElmts(facetElmts);
    processElmts(otherElmts);
    
    exporters = Exhibit.getAttribute(document.body, "exporters");
    if (exporters !== null) {
        exporters = exporters.split(";");
        for (i = 0; i < exporters.length; i++) {
            expr = exporters[i];
            exporter = null;
            
            try {
                exporter = eval(expr);
            } catch (ex2) {}
            
            if (exporter === null) {
                try { exporter = eval(expr + "Exporter"); } catch (ex3) {}
            }
            
            if (exporter === null) {
                try { exporter = eval("Exhibit." + expr + "Exporter"); } catch (ex4) {}
            }
            
            if (typeof exporter === "object") {
                Exhibit.addExporter(exporter);
            }
        }
    }
    
    hash = document.location.hash;
    if (hash.length > 1) {
        itemID = decodeURIComponent(hash.substr(1));
        if (this._database.containsItem(itemID)) {
            this._showFocusDialogOnItem(itemID);
        }
    }
    $(document).trigger("exhibitConfigured.exhibit");
};

/**
 * @private
 * @param {String} itemID
 */
Exhibit._Impl.prototype._showFocusDialogOnItem = function(itemID) {
    var dom, itemLens;
    dom = $.simileDOM("string",
        "div",
        "<div class='exhibit-focusDialog-viewContainer' id='lensContainer'>" +
        "</div>" +
        "<div class='exhibit-focusDialog-controls'>" +
            "<button id='closeButton'>" + 
                Exhibit.l10n.focusDialogBoxCloseButtonLabel + 
            "</button>" +
        "</div>"
    );
    $(dom.elmt).attr("class", "exhibit-focusDialog exhibit-ui-protection");
    Exhibit.UI.setupDialog(dom, true);
    
    itemLens = this._uiContext.getLensRegistry().createLens(itemID, dom.lensContainer, this._uiContext);
    
    $(dom.elmt).css("top", (document.body.scrollTop + 100) + "px");
    $(document.body).append($(dom.elmt));
    $(document).trigger("modalSuperseded.exhibit");

    $(dom.closeButton).bind("click", function(evt) {
        dom.close();
    });
};
