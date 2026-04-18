# renumber-tools README

VS code extension for renumbering tools in NC programs in a cnc machine shop enviorment. It refrences a master list of all tool descriptions that have ever been used in legacy programs. 

TO USE Open those legacy programs, Right click, click on "renumber tools to master list" It will change all of the T, H and D values accociated with the tools to match the tool decription in the header(refrencing a master tool list of tool descriptions and the tool number you would like them to be).

## Features

1-To edit the tool list right click, edit tool list. You should add all of the ways that you ever wrote the tool description.

The editor displays all your tools in a table. From here you can:
 
- **Edit** any description or tool number inline
- **Add** a new tool with the `+ Add Tool` button
- **Remove** a tool with the `✕` button on that row
- **Save** with the 💾 Save button — the list will automatically sort by tool number and update your settings

2-IT SHOULD IGNORE THESE CARACTERS /\(\s*T\s*(\d+)\s*\|?\s*([^|)\n]+)/gi

3 If no tool descriptions in the file match your shop tool list, the file is left unchanged. If a tool description is not on the tool list it is automaticly added with a tool number of 0.

4 Only `T`, `H`, and `D` prefixed numbers are replaced — other numbers in the program are not touched

5 The extension replaces tools across the entire file in a single pass, so there is no risk of a renumbered value being incorrectly renumbered again

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.


## Configuration
 
The tool list is stored in your VS Code `settings.json` under `renumber-tools.shopToolList`. Each entry has a `description` and a `toolNumber`:
 
```json
"renumber-tools.shopToolList": [
    { "description": "3/8\" Spot Drill", "toolNumber": 2 },
    { "description": "1/2\" Flat Endmill", "toolNumber": 12 },
    { "description": "1/4-20 UNC ROLL TAP", "toolNumber": 31 }
]
```

### Adding Description Aliases
 
If the same tool might be written different ways across programs, add multiple entries with the same tool number:
 
```json
{ "description": "3/8\" Spot Drill", "toolNumber": 2 },
{ "description": "3/8 spot drill", "toolNumber": 2 },
{ "description": "SPOT DRILL 3/8", "toolNumber": 2 },
```
 
All three will map to tool number 2.
 
---
 

## Requirements

You will need an NC file that needs to be changed and it needs a tool list. SIMILAR TO THIS
4	(T1 3/8" Flat Endmill 4 FLUTE)
5	(T2 #16 DRILL)
6	(T3 5/16" DIA X 45 DEG X 4 FLUTE CHAMFER MILL)
7	(T4 3/16" Flat Endmill)

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.


This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
