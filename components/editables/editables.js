//----------------------------------------------------------------------------------------------------------------------
// Editables angular module
//
// @module demo.js
//----------------------------------------------------------------------------------------------------------------------

var Editables = angular.module('editables', []);

Editables.directive('editable', function()
{
    return {
        restrict: 'A',
        controller: function($scope, $element, $attrs, $parse)
        {
            // Store the value of the element as placeholder text.
            var placeholder = "<span class='placeholder'>" + $element.html() + "</span>";

            // Make the element content editable
            $element.attr("contenteditable","true");

            // Set appropriate css
            $element.addClass('editable');

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

            // Bind scope changes to the value of the element.
            $scope.$watch($attrs.editable, function()
            {
                if(!this.model)
                {
                    $element.html(placeholder);
                }
                else
                {
                    $element.html(this.model);
                } // end if
            }.bind(this));

            // Bind changes to the content editable to the scope
            $element.on('input', function(evt)
            {
                // Check for 'empty' contents. Sometimes, editable inserts a "<br>" tag.
                if($element.html() == "<br>")
                {
                    $element.html("");
                } // end if

                this.model = $element.html();

                // Check to see if we need to apply placeholder text.
                if(!$element.html())
                {
                    $element.html(placeholder);
                } // end if

                $scope.$apply();
            }.bind(this));

            // Handle removing the placeholder text on focus
            $element.focus(function(evt)
            {
                if(!this.model)
                {
                    $element.html("");

                    // Reposition the text cursor to the start of the element.
                    var range = document.createRange();
                    range.setStart($element[0], 0);
                    window.getSelection().addRange(range);
                } // end if

                $scope.$apply();
            }.bind(this));
        } // end controller
    }
}); // end editable directive

//----------------------------------------------------------------------------------------------------------------------