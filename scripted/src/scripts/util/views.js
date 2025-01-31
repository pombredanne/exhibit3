/**
 * @fileOverview View helper functions and utilities.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

/**
 * @namespace
 */
Exhibit.ViewUtilities = {};

/**
 * @static
 * @param {Element} anchorElmt
 * @param {Array} arrayOfItemIDs
 * @param {Exhibit.UIContext} uiContext
 */
Exhibit.ViewUtilities.openBubbleForItems = function(anchorElmt, arrayOfItemIDs, uiContext) {
    var coords, bubble;
    coords = $(anchorElmt).offset();
    bubble = $.simileBubble("createBubbleForPoint",
        coords.left + Math.round(anchorElmt.offsetWidth / 2), 
        coords.top + Math.round(anchorElmt.offsetHeight / 2), 
        uiContext.getSetting("bubbleWidth"), // px
        uiContext.getSetting("bubbleHeight") // px
    );
    Exhibit.ViewUtilities.fillBubbleWithItems(bubble.content, arrayOfItemIDs, uiContext);
};

/**
 * @@@ possibly take and return jQuery instead of elements
 * @static
 * @param {Element} bubbleElmt
 * @param {Array} arrayOfItemIDs
 * @param {Exhibit.UIContext} uiContext
 * @returns {Element}
 */
Exhibit.ViewUtilities.fillBubbleWithItems = function(bubbleElmt, arrayOfItemIDs, uiContext) {
    var ul, i, itemLensDiv, itemLens;
    if (bubbleElmt === null) {
        bubbleElmt = $("<div>");
    }
    
    if (arrayOfItemIDs.length > 1) {
        bubbleElmt.addClass("exhibit-views-bubbleWithItems");
        
        ul = $("<ul>");
        makeItem = function(elmt) {
            $("<li>")
                .append(elmt)
                .appendTo(ul);
                
        };
        for (i = 0; i < arrayOfItemIDs.length; i++) {
            uiContext.format(arrayOfItemIDs[i], "item", makeItem);
        }
        bubbleElmt.append(ul);
    } else {
        itemLensDiv = $("<div>").get(0);
        itemLens = uiContext.getLensRegistry().createLens(arrayOfItemIDs[0], itemLensDiv, uiContext);
        bubbleElmt.append(itemLensDiv);
    }
    
    return bubbleElmt.get(0);
};

/**
 * @static
 * @param {Element} div
 * @param {Exhibit.UIContext} uiContext
 * @param {Boolean} showSummary
 * @param {Object} resizableDivWidgetSettings
 * @param {Object} legendWidgetSettings
 * @returns {Object}
 */
Exhibit.ViewUtilities.constructPlottingViewDom = function(
    div, 
    uiContext, 
    showSummary,
    resizableDivWidgetSettings, 
    legendWidgetSettings
) { 
    var dom = $.simileDOM("string",
        div,
        "<div class='exhibit-views-header'>" +
            (showSummary ? "<div id='collectionSummaryDiv'></div>" : "") +
            "<div id='unplottableMessageDiv' class='exhibit-views-unplottableMessage'></div>" +
        "</div>" +
        "<div id='resizableDiv'></div>" +
        "<div id='legendDiv'></div>",
        {}
    );
    
    if (showSummary) {
        dom.collectionSummaryWidget = Exhibit.CollectionSummaryWidget.create(
            {}, 
            dom.collectionSummaryDiv, 
            uiContext
        );
    }
    
    dom.resizableDivWidget = Exhibit.ResizableDivWidget.create(
        resizableDivWidgetSettings,
        dom.resizableDiv, 
        uiContext
    );
    dom.plotContainer = dom.resizableDivWidget.getContentDiv();
    
    if (legendWidgetSettings.colorGradient === true) {
        dom.legendGradientWidget = Exhibit.LegendGradientWidget.create(
            dom.legendDiv,
            uiContext
        );
    } else {
        dom.legendWidget = Exhibit.LegendWidget.create(
            legendWidgetSettings,
            dom.legendDiv, 
            uiContext
        );
    }
    
    dom.setUnplottableMessage = function(totalCount, unplottableItems) {
        Exhibit.ViewUtilities._setUnplottableMessage(dom, totalCount, unplottableItems, uiContext);
    };
    dom.dispose = function() {
        if (showSummary) {
            dom.collectionSummaryWidget.dispose();
        }
        dom.resizableDivWidget.dispose();
        dom.legendWidget.dispose();
    };

    return dom;
};

/**
 * @static
 * @param {Object} dom
 * @param {Number} totalCount
 * @param {Array} unplottableItems
 * @param {Exhibit.UIContext} uiContext
 */
Exhibit.ViewUtilities._setUnplottableMessage = function(dom, totalCount, unplottableItems, uiContext) {
    var div;
    div = dom.unplottableMessageDiv;
    if (unplottableItems.length === 0) {
        $(div).hide();
    } else {
        $(div).empty();
    
        dom = $.simileDOM("string",
            div,
            Exhibit.ViewUtilities.l10n.unplottableMessageFormatter(totalCount, unplottableItems, uiContext),
            {}
        );
        $(dom.unplottableCountLink).bind("click", function(evt) {
            Exhibit.ViewUtilities.openBubbleForItems(evt.target, unplottableItems, uiContext);
        });
        $(div).show();
    }
};
