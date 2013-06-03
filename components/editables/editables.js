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
    ['$scope', '$element', '$attrs', '$parse', function($scope, $element, $attrs, $parse)
        {
            var editing = false;
            var dirty = false;

            // Define the model we're 'bound' to.
            var _model = $parse($attrs.editable);
            Object.defineProperty(this, "model", {
                get: function()
                {
                    return _model($scope);
                },
                set: function(val)
                {
                    _model.assign($scope, val);
                }
            });

            // Build our placeholder text
            var placeholder = buildPlaceholder($element);

            // Build our editable element
            var element = buildElement($element, $attrs.type, $scope);

            //----------------------------------------------------------------------------------------------------------
            // Event Handlers
            //----------------------------------------------------------------------------------------------------------

            var saveCallback = function()
            {
                if(element.html() != placeholder)
                {
                    //TODO: Support custom save callbacks
                    console.log('Save callback called.');

                    if($attrs.confirm)
                    {
                        dirty = false;
                        this.model = stripElement(element, $attrs.type);
                    } // end if

                    // Blur the element.
                    element.blur();

                    // Let the rest of the world know what happened.
                    $scope.$emit('save', this.model);
                    $scope.$apply();
                } // end if
            }.bind(this);

            var cancelCallback = function()
            {
                if(dirty)
                {
                    // Reset our contents.
                    document.execCommand('undo');
                } // end if

                // Blur the element.
                element.blur();

                // Let the rest of the world know what happened.
                $scope.$emit('cancel', this.model);
                $scope.$apply();
            }.bind(this);

            // Build our toolbar
            var toolbar = buildToolbar(element, $attrs, saveCallback, cancelCallback);

            //----------------------------------------------------------------------------------------------------------
            // Event Handlers
            //----------------------------------------------------------------------------------------------------------

            // Bind scope changes to the value of the element.
            $scope.$watch($attrs.editable, function()
            {
                if(!this.model && !editing)
                {
                    element.html(placeholder);
                }
                else
                {
                    if(this.model != stripElement(element, $attrs.type))
                    {
                        element.html(this.model);
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
                    this.model = stripElement(element, $attrs.type);
                } // end if

                $scope.$apply();
            }.bind(this));

            // Handle bluring with no contents.
            element.blur(function(evt)
            {
                editing = false;

                // Check to see if we need to apply placeholder text.
                if(!element.text())
                {
                    element.html(placeholder);
                } // end if

                $scope.$apply();
            }.bind(this));

            // Handle removing the placeholder text on focus
            element.focus(function(evt)
            {
                editing = true;

                if(!this.model)
                {
                    element.html("<br>");

                    // Reposition the text cursor to the start of the element.
                    var range = document.createRange();
                    range.setStart(element[0], 0);
                    window.getSelection().addRange(range);
                } // end if

                $scope.$apply();
            }.bind(this));
        }]); // end EditableController

//----------------------------------------------------------------------------------------------------------------------
// Helpers
//----------------------------------------------------------------------------------------------------------------------

function buildPlaceholder(parent)
{
    // Store the value of the element as placeholder text.
    var placeholder = "<span class=\"placeholder\">" + parent.html() + "</span>";
    parent.html("<br>");

    return placeholder;
} // end buildPlaceholder

function buildElement(parent, type)
{
    // Required for our css to work
    parent.css('position', 'relative');

    // Build a wrapper element, to help prevent style issues.
    var element = angular.element("<div></div>");
    element.appendTo(parent);

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

    var editHover = false;
    var tbHover = false;

    var hideHandler = function()
    {
        setTimeout(function()
        {
            if(!editHover && !tbHover)
            {
                toolbar.hide();
            } // end if
        }, 100)
    }; // end hideHandler

    // Element hover
    element.focus(function()
    {
        editHover = true;
        toolbar.show();
    });
    element.blur(function()
    {
        editHover = false;
        hideHandler();
    });

    // Toolbar hover
    parent.focus(function()
    {
        tbHover = true;
        //toolbar.show();
    });
    parent.blur(function()
    {
        tbHover = false;
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

//----------------------------------------------------------------------------------------------------------------------
// Toobars
//----------------------------------------------------------------------------------------------------------------------

function buildTextEditorToolbar(toolbar)
{

} // end buildTextEditorToolbar

//----------------------------------------------------------------------------------------------------------------------

Editables.directive('editable', function()
{
    return {
        restrict: 'A',
        controller: 'EditableController'
    }
}); // end editable directive

//----------------------------------------------------------------------------------------------------------------------