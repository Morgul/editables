//----------------------------------------------------------------------------------------------------------------------
// Editables angular module
//
// @module demo.js
//----------------------------------------------------------------------------------------------------------------------

var Editables = angular.module('editables', []);

//----------------------------------------------------------------------------------------------------------------------
// Controller
//----------------------------------------------------------------------------------------------------------------------

Editables.controller('EditableController',
    ['$scope', '$element', '$attrs', '$parse', function($scope, $element, $attrs)
        {
            var name = $attrs.name;
            var editing = false;
            var dirty = false;

            // Build our placeholder text
            var placeholder = buildPlaceholder($element, $attrs.type);

            // Build our editable element
            var element = buildElement($element, $attrs.type, $scope);

            //----------------------------------------------------------------------------------------------------------
            // Event Handlers
            //----------------------------------------------------------------------------------------------------------

            var saveCallback = function()
            {
                if($attrs.confirm)
                {
                    var html = "";
                    if(element.html() != placeholder)
                    {
                        html = stripElement(element, $attrs.type);
                    } // end if

                    dirty = false;
                    $scope.editable = html;
                } // end if

                // Blur the element.
                element.blur();

                // Let the rest of the world know what happened.
                $scope.$emit('save', name);

                // If we have a custom save handler, call it.
                if($scope.onsave)
                {
                    $scope.onsave({name: name});
                } // end if

                $scope.$apply();
            }.bind(this);

            var cancelCallback = function()
            {
                if(dirty)
                {
                    // Reset our contents.
                    element.html($scope.editable || "");
                    setEndOfEditable(element);
                } // end if

                // Blur the element.
                element.blur();

                // Let the rest of the world know what happened.
                $scope.$emit('cancel', name);
                $scope.$apply();
            }.bind(this);

            // Build our toolbar
            var toolbar = buildToolbar(element, $attrs, saveCallback, cancelCallback);

            //----------------------------------------------------------------------------------------------------------
            // Event Handlers
            //----------------------------------------------------------------------------------------------------------

            // Bind scope changes to the value of the element.
            $scope.$watch('editable', function()
            {
                if(!$scope.editable && !editing)
                {
                    element.html(placeholder);
                }
                else
                {
                    if($scope.editable != stripElement(element, $attrs.type))
                    {
                        element.html($scope.editable);
                    } // end if
                } // end if
            }.bind(this));

            // Bind changes to the content editable to the scope
            element.on('input', function(evt)
            {
                dirty = true;

                if(!element.html().trim())
                {
                    element.html("<br>");
                } // end if

                if(!$attrs.confirm)
                {
                    dirty = false;
                    $scope.editable = stripElement(element, $attrs.type);
                } // end if

                $scope.$apply();
            }.bind(this));

            // Handle bluring with no contents.
            element.blur(function(evt)
            {
                editing = false;

                if(!$attrs.confirm)
                {
                    // Check to see if we need to apply placeholder text.
                    if(!element.text())
                    {
                        element.html(placeholder);
                    } // end if
                } // end if

                $scope.$apply();
            }.bind(this));

            // Handle removing the placeholder text on focus
            element.focus(function(evt)
            {
                editing = true;

                if(element.html() == placeholder)
                {
                    element.html("<br>");

                    setEndOfEditable(element)
                } // end if

                $scope.$apply();
            }.bind(this));
        }]); // end EditableController

//----------------------------------------------------------------------------------------------------------------------
// Helpers
//----------------------------------------------------------------------------------------------------------------------

// Taken from http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
function setEndOfEditable(element)
{
    element = element[0] || element;

    var range, selection;
    if(document.createRange) // Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
    else if(document.selection) // IE 8 and lower
    {
        range = document.body.createTextRange();
        range.moveToElementText(element);
        range.collapse(false);
        range.select();
    } // end if
} // end setEndOfEditable

function buildPlaceholder(parent, type)
{
    // Store the value of the element as placeholder text.
    var placeholder = "<span class=\"placeholder\">" + parent.html() + "</span>";
    parent.html("");

    if(type == 'text-area')
    {
        parent.html("<br>");
    } // end if

    return placeholder;
} // end buildPlaceholder

function buildElement(parent, type)
{
    // This will help theme.
    parent.addClass('editable-parent');

    // Build a wrapper element, to help prevent style issues.
    var element = angular.element("<div></div>");
    element.appendTo(parent);

    if(type == "text-area")
    {
        // Required for our css to work
        parent.css('position', 'relative');

        element.addClass('text-area');
    } // end if

    // Make the element content editable
    element.attr("contenteditable","true");

    // Set appropriate css
    element.addClass('editable');

    // Support single-line mode
    if(type == "line")
    {
        element.addClass('single-line');
    } // end if

    return element;
} // end buildElement

function stripElement(element, type)
{
    var html =  element.html().replace(/\s*<br>\s*$/, '');

    if(type == "line")
    {
        html = html.replace(/<div>|<br>|<\/div>/g, '');
    } // end if

    return html;
} // end stripElement

function buildToolbar(element, $attrs, saveCallback, cancelCallback)
{
    var parent = element.parent();
    element.css('z-index', '10');

    // Build an empty toolbar.
    var toolbar = { elem: angular.element('<div>') };
    toolbar.hide = function()
    {
        this.elem.stop(function(){ this.showRunning = false;}.bind(this)).fadeOut('fast', function(){ this.showRunning = false;}.bind(this));
    }.bind(toolbar);

    toolbar.show = function()
    {
        if(!this.showRunning)
        {
            this.showRunning = true;
            this.elem.stop().fadeIn('fast', function(){ this.showRunning = false;}.bind(this));
        } // end if
    }.bind(toolbar);

    toolbar.element = function()
    {
        return this.elem.children('.navbar-inner');
    }.bind(toolbar);

    // Do we have a toolbar?
    if($attrs.toolbar != undefined)
    {
        // Build an element to handle hovering over the toolbar.
        var hoverElem = buildToobarHoverElement(parent);
        toolbar.elem = buildToolbarElement(hoverElem, element, toolbar);

        switch($attrs.toolbar)
        {
            case 'text-edit':
                buildTextEditorToolbar(toolbar, element);
                break;
            default:
                //TODO: Figure out what the default toolbar should be.
                break;
        } // end switch

        // Handle the case of having a toolbar with confirm added.
        if($attrs.confirm)
        {
            var saveElem = angular.element("<button class=\"btn btn-primary\"><i class=\"icon-save\"></i> Save</button>").appendTo(toolbar.buttons);
            saveElem.click(function()
            {
                saveCallback();
            });

            var cancelElem = angular.element("<button class=\"btn\"><i class=\"icon-remove\"></i> Cancel</button>").appendTo(toolbar.buttons);
            cancelElem.click(function()
            {
                cancelCallback();
            });
        } // end if
    } // end if

    return toolbar;
} // end buildToolbar

function buildToolbarElement(parent, element, toolbar)
{
    var tbElem = angular.element("<div class=\"navbar navbar-small\"><div class=\"navbar-inner\">");
    tbElem.css('position', 'absolute');
    tbElem.css('top', 0);
    tbElem.css('left', 0);
    tbElem.css('z-index', '5');
    tbElem.css('display', 'none');

    tbElem.appendTo(parent);

    var btnElem = angular.element("<div class=\"btn-toolbar\">");
    btnElem.appendTo(tbElem.children('.navbar-inner'));
    toolbar.buttons = btnElem;

    //------------------------------------------------------------------------------------------------------------------
    // Event Handlers
    //------------------------------------------------------------------------------------------------------------------

    var editFocus = false;
    var editHover = false;
    var tbFocus = false;
    var tbHover = false;

    var hideHandler = function()
    {
        setTimeout(function()
        {
            if(!editFocus && !editHover && !tbFocus && !tbHover)
            {
                toolbar.hide();
            } // end if
        }, 100)
    }; // end hideHandler

    // Element hover
    element.hover(function()
    {
        editHover = true;
    }, function()
    {
        editHover = false;
        hideHandler();
    });

    element.focus(function()
    {
        editFocus = true;
        toolbar.show();
    });
    element.blur(function()
    {
        editFocus = false;
        hideHandler();
    });

    // Toolbar hover
    parent.hover(function()
    {
        tbHover = true;
    },function()
    {
        tbHover = false;
        hideHandler();
    });

    parent.focus(function()
    {
        tbFocus = true;
    });
    parent.blur(function()
    {
        tbFocus = false;
        hideHandler();
    });

    //------------------------------------------------------------------------------------------------------------------

    return tbElem;
} // end buildToolbarElement

function buildToobarHoverElement(parent)
{
    var hoverElem = angular.element("<div>");
    hoverElem.css('position', 'absolute');
    hoverElem.css('top', -40);
    hoverElem.css('bottom', 0);
    hoverElem.css('left', -3);
    hoverElem.css('right', 0);
    hoverElem.css('z-index', '2');

    hoverElem.appendTo(parent);

    return hoverElem;
} // end buildToolbarElement

function doCmd(cmd)
{
    document.execCommand(cmd, null, null);
} // end doCmd

//----------------------------------------------------------------------------------------------------------------------
// Toolbars
//----------------------------------------------------------------------------------------------------------------------

function buildTextEditorToolbar(toolbar, element)
{
    var formatBG = angular.element('<div class="btn-group" data-toggle="buttons-checkbox">').appendTo(toolbar.buttons);
    var boldElem = angular.element('<button class="btn"><i class="icon-bold"></i></button>')
        .appendTo(formatBG)
        .click(function() { doCmd('bold') });
    var italicElem = angular.element('<button class="btn"><i class="icon-italic"></i></button>')
        .appendTo(formatBG)
        .click(function() { doCmd('italic') });
    var underlineElem = angular.element('<button class="btn"><i class="icon-underline"></i></button>')
        .appendTo(formatBG)
        .click(function() { doCmd('underline') });
    var strikeElem = angular.element('<button class="btn"><i class="icon-strikethrough"></i></button>')
        .appendTo(formatBG)
        .click(function() { doCmd('strikethrough') });

    var fontBG = angular.element('<div class="btn-group">').appendTo(toolbar.buttons);
    var fontInc = angular.element('<button class="btn"><i class="icon-plus icon-mod"></i><i class="icon-font"></button>')
        .appendTo(fontBG)
        .click(function() { doCmd('increaseFontSize') });
    var fontDec = angular.element('<button class="btn"><i class="icon-minus icon-mod"></i><i class="icon-font"></i></button>')
        .appendTo(fontBG)
        .click(function() { doCmd('decreaseFontSize') });

    var alignBG = angular.element('<div class="btn-group" data-toggle="buttons-radio">').appendTo(toolbar.buttons);
    var lAlign = angular.element('<button class="btn"><i class="icon-align-left"></i></button>')
        .appendTo(alignBG)
        .click(function() { doCmd('justifyleft') });
    var cAlign = angular.element('<button class="btn"><i class="icon-align-center"></i></button>')
        .appendTo(alignBG)
        .click(function() { doCmd('justifycenter') });
    var rAlign = angular.element('<button class="btn"><i class="icon-align-right"></i></button>')
        .appendTo(alignBG)
        .click(function() { doCmd('justifyright') });

    var insertBG = angular.element('<div class="btn-group">').appendTo(toolbar.buttons);
    var uList = angular.element('<button class="btn"><i class="icon-list-ul"></i></button>')
        .appendTo(insertBG)
        .click(function() { doCmd('insertunorderedlist') });
    var oList = angular.element('<button class="btn"><i class="icon-list-ol"></i></button>')
        .appendTo(insertBG)
        .click(function() { doCmd('insertorderedlist') });

    setInterval(function()
    {
        var state = {
            bold:  document.queryCommandState("bold"),
            italic:  document.queryCommandState("italic"),
            underline:  document.queryCommandState("underline"),
            strikethrough:  document.queryCommandState("strikethrough"),
            leftAlign:  document.queryCommandState("justifyleft"),
            centerAlign:  document.queryCommandState("justifycenter"),
            rightAlign:  document.queryCommandState("justifyright")
        };

        // Update states
        boldElem.toggleClass('active', state.bold);
        italicElem.toggleClass('active', state.italic);
        underlineElem.toggleClass('active', state.underline);
        strikeElem.toggleClass('active', state.strikethrough);
        lAlign.toggleClass('active', state.leftAlign);
        cAlign.toggleClass('active', state.centerAlign);
        rAlign.toggleClass('active', state.rightAlign);
    }, 200);
} // end buildTextEditorToolbar

//----------------------------------------------------------------------------------------------------------------------

Editables.directive('editable', function()
{
    return {
        restrict: 'A',
        scope: {
            editable: '=',
            onsave: '&'
        },
        controller: 'EditableController'
    }
}); // end editable directive

//----------------------------------------------------------------------------------------------------------------------