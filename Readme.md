# Editables

This project provides a collection of AngularJS directives for doing inline editing and binding on html elements, using `contenteditable`.
In short, it's like the [x-editable]() project, only nicer, and using `contenteditable`.

## Example

Here is a very basic example:

```html
<h1 editable="title">Placeholder here...</h1>
```

```html
<h1 editable="title" type="text">Placeholder here...</h1>
```

This would bind to the `title` model in the same way you would bind to an `<input>` element.

## More

There's a lot more editables can do, including provide a slim WYSIWYG editor in a minimal amount of code:

```html
<div style="min-height: 200px; border: 1px solid #aaa;" editable="myModel" toolbar="text-edit">Type here...</div>
```

That's it! For more examples, see the demo.html page. (You can run this with `npm start` on the command line. Remember to
`npm install` first, however!)

## Contributions

Contributions are welcome. Just fork, fix, and pull request!

## License

All code is MIT Licensed. Please see the `LICENSE` for details.