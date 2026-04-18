import * as vscode from 'vscode';

function normalizeDescription(description: string): string {
    return description.toLowerCase().replace(/\s+/g, ' ').trim();
}

interface RenumberResult {
    text: string;
    missingDescriptions: string[];
}

function renumberGCode(text: string): RenumberResult {
    const config = vscode.workspace.getConfiguration('renumber-tools');
    const shopToolList = config.get<any[]>('shopToolList') || [];

    const shopStandard: { [description: string]: number } = {};
    const shopDescriptions = new Set<string>();

    shopToolList.forEach(item => {
        if (item.description) {
            const key = normalizeDescription(item.description);
            shopDescriptions.add(key);
            if (item.toolNumber !== undefined && item.toolNumber !== null && item.toolNumber !== '') {
                const num = Number(item.toolNumber);
                if (!Number.isNaN(num)) {
                    shopStandard[key] = num;
                }
            }
        }
    });

    const missingDescriptions = new Set<string>();
    const lines = text.split(/\r?\n/);
    const toolMap: { [legacy: string]: number } = {};

    const toolDefRegex = /\(\s*T\s*(\d+)\s*\|?\s*([^|)\n]+)/gi;

    lines.forEach(line => {
        for (const match of line.matchAll(toolDefRegex)) {
            const legacyNum = match[1];
            const rawDescription = match[2].replace(/\s+/g, ' ').trim();
            const description = normalizeDescription(rawDescription);
            if (shopStandard[description] !== undefined) {
                toolMap[legacyNum] = shopStandard[description];
            } else if (!shopDescriptions.has(description)) {
                missingDescriptions.add(rawDescription);
                shopDescriptions.add(description);
            }
        }
    });

    const allNums = Object.keys(toolMap);
    if (allNums.length === 0) {
        return { text, missingDescriptions: Array.from(missingDescriptions) };
    }

    const numPattern = allNums
        .sort((a, b) => b.length - a.length)
        .join('|');

    const replaceRegex = new RegExp(`\\b([THD])(${numPattern})\\b`, 'g');

    const outLines = lines.map(line =>
        line.replace(replaceRegex, (_, prefix, oldNum) => {
            const newNum = toolMap[oldNum];
            return newNum !== undefined ? `${prefix}${newNum}` : `${prefix}${oldNum}`;
        })
    );

    return { text: outLines.join('\n'), missingDescriptions: Array.from(missingDescriptions) };
}

function sortToolList(toolList: any[]): any[] {
    return toolList.slice().sort((a, b) => {
        const aNum = Number(a.toolNumber);
        const bNum = Number(b.toolNumber);
        if (Number.isNaN(aNum) && Number.isNaN(bNum)) {
            return 0;
        }
        if (Number.isNaN(aNum)) {
            return 1;
        }
        if (Number.isNaN(bNum)) {
            return -1;
        }
        return aNum - bNum;
    });
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function getWebviewContent(toolList: any[]): string {
    const maxDescLength = toolList.length > 0 ? Math.max(...toolList.map(t => t.description.length), 20) : 20;
    const rows = toolList.map((tool, i) => `
        <tr>
            <td><input type="text" size="${maxDescLength}" value="${escapeHtml(tool.description)}" data-index="${i}" data-field="description"/></td>
            <td><input type="number" size="5" value="${tool.toolNumber}" data-index="${i}" data-field="toolNumber"/></td>
            <td><button onclick="removeRow(this)">✕</button></td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: sans-serif; padding: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 6px; border-bottom: 2px solid #000000; }
            td { padding: 4px; }
            input[type="text"], input[type="number"] { 
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
            }
            button { cursor: pointer; }
            #addBtn { margin-top: 12px; margin-right: 8px; }
            #saveBtn { margin-top: 12px; }
        </style>
    </head>
    <body>
        <h2>Tool List Editor</h2>
        <button id="addBtn" onclick="addRow()">+ Add Tool</button>
        <button id="saveBtn" onclick="save()">💾 Save</button>
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Tool Number</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="toolBody">
                ${rows}
            </tbody>
        </table>

        <script>
            const vscode = acquireVsCodeApi();
            const maxDescLength = ${maxDescLength};

            function getTools() {
                const rows = document.querySelectorAll('#toolBody tr');
                return Array.from(rows).map(row => {
                    const inputs = row.querySelectorAll('input');
                    return {
                        description: inputs[0].value,
                        toolNumber: parseInt(inputs[1].value)
                    };
                });
            }

            function addRow() {
                const tbody = document.getElementById('toolBody');
                const tr = document.createElement('tr');
                tr.innerHTML = \`
                    <td><input type="text" size="\${maxDescLength}" placeholder="Tool description" data-index="0" data-field="description"/></td>
                    <td><input type="number" size="5" placeholder="0" data-index="0" data-field="toolNumber"/></td>
                    <td><button onclick="removeRow(this)">✕</button></td>
                \`;
                tbody.insertBefore(tr, tbody.firstChild);
            }

            function removeRow(el) {
                el.closest('tr').remove();
            }

            function save() {
                vscode.postMessage({ command: 'save', toolList: getTools() });
            }
        </script>
    </body>
    </html>`;
}

export function activate(context: vscode.ExtensionContext) {

    const openToolListDisposable = vscode.commands.registerCommand('renumber-tools.openToolList', () => {
        const panel = vscode.window.createWebviewPanel(
            'toolList',
            'Tool List Editor',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        const config = vscode.workspace.getConfiguration('renumber-tools');
        const toolList = sortToolList(config.get<any[]>('shopToolList') || []);
        panel.webview.html = getWebviewContent(toolList);

        panel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'save') {
                const sorted = sortToolList(message.toolList);
                await config.update('shopToolList', sorted, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage('Tool list saved!');
                panel.webview.html = getWebviewContent(sorted);
            }
        });
    });

    const renumberDisposable = vscode.commands.registerCommand('renumber-tools.renumberGCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor - open an NC program to renumber.');
            return;
        }

        const document = editor.document;
        const selection = editor.selection;
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );

        const targetRange = selection && !selection.isEmpty ? selection : fullRange;
        const text = document.getText(targetRange);

        const result = renumberGCode(text);
        const newText = result.text;

        if (result.missingDescriptions.length > 0) {
            const config = vscode.workspace.getConfiguration('renumber-tools');
            const shopToolList = config.get<any[]>('shopToolList') || [];
            const updatedToolList = [
                ...shopToolList,
                ...result.missingDescriptions.map(description => ({ description, toolNumber: 0 }))
            ];
            const sortedToolList = sortToolList(updatedToolList);
            await config.update('shopToolList', sortedToolList, vscode.ConfigurationTarget.Global);
        }

        await editor.edit(editBuilder => {
            editBuilder.replace(targetRange, newText);
        });

        const messages = [];
        if (result.missingDescriptions.length > 0) {
            messages.push(`Added ${result.missingDescriptions.length} new description(s) to the tool list.`);
        }
        if (newText !== text) {
            messages.push('Renumbering complete.');
        } else if (result.missingDescriptions.length === 0) {
            messages.push('No matching tool descriptions were found to renumber.');
        }

        vscode.window.showInformationMessage(messages.join(' '));
    });

    context.subscriptions.push(renumberDisposable);
    context.subscriptions.push(openToolListDisposable);
}

export function deactivate() {}