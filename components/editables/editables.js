//----------------------------------------------------------------------------------------------------------------------
// Editables angular module
//
// @module demo.js
//----------------------------------------------------------------------------------------------------------------------

var Editables = angular.module('editables', []);

//----------------------------------------------------------------------------------------------------------------------
// Controller
//----------------------------------------------------------------------------------------------------------------------

Editables.controller('EditableController', ['$scope', '$element', '$attrs', '$parse', function($scope, $element, $attrs, $parse)
        {
            var editing = false;

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
                if(!element.html().trim())
                {
                    element.html("<br>");
                } // end if

                this.model = stripElement(element, $attrs.type);

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
    var placeholder = "<span class='placeholder'>" + parent.html() + "</span>";
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

//----------------------------------------------------------------------------------------------------------------------

Editables.directive('editable', function()
{
    return {
        restrict: 'A',
        controller: 'EditableController'
    }
}); // end editable directive

//----------------------------------------------------------------------------------------------------------------------