/**
 * @fileOverview Instance of Exhibit.Exporter for tab-separated values.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

/**
 * @namespace
 */
Exhibit.Exporter.TSV = {
    exporter: null
};

/**
 * @param {String} s
 * @param {Exhibit.Database} database
 * @returns {String}
 */
Exhibit.Exporter.TSV.wrap = function(s, database) {
    var header, i, allProperties, propertyID, property, valueType;

    header = "";

    allProperties = database.getAllProperties();
    for (i = 0; i < allProperties.length; i++) {
        propertyID = allProperties[i];
        property = database.getProperty(propertyID);
        valueType = property.getValueType();
        header += propertyID + ":" + valueType + "\t";
    }

    return header + "\n" + s;
};

/**
 * @param {String} s
 * @returns {String}
 */
Exhibit.Exporter.TSV.wrapOne = function(s, first, last) {
    return s + "\n";
};

/**
 * @param {String} itemID
 * @param {Object} o
 * @returns {String}
 */
Exhibit.Exporter.TSV.exportOne = function(itemID, o) {
    var prop, s = "";

    for (prop in o) {
        if (o.hasOwnProperty(prop)) {
            s += o[prop].join("; ") + "\t";
        }
    }

    return s;
};

/**
 * @private
 */
Exhibit.Exporter.TSV._register = function() {
    Exhibit.Exporter.TSV.exporter = new Exhibit.Exporter(
        "text/tab-separated-values",
        Exhibit.l10n.tsvExporterLabel,
        Exhibit.Exporter.TSV.wrap,
        Exhibit.Exporter.TSV.wrapOne,
        Exhibit.Exporter.TSV.exportOne
    );
};

$(document).one("registerExporters.exhibit",
                Exhibit.Exporter.TSV._register);
