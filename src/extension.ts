import * as vscode from 'vscode';
import { PROPERTY_ORDER } from './property-order'; // Assuming the property order is in a separate file

function sortSelectedProperties(editor: vscode.TextEditor | undefined): void {
	if (!editor) {
		vscode.window.showWarningMessage('No active editor found.');
		return;
	}

	const document: vscode.TextDocument = editor.document;
	const selection: vscode.Selection = editor.selection;

	if (selection.isEmpty) {
		vscode.window.showWarningMessage('No text selected. Please select a block of properties.');
		return;
	}

	const selectedText: string = document.getText(selection);
	const lines: string[] = selectedText.split(/\r?\n/);

	const comments: { index: number, line: string }[] = [];
	const webkits: { index: number, line: string }[] = [];
	const selectors: { index: number, line: string }[] = [];

	const knownProperties: string[] = lines
		.filter((line, index) => {
			const isComment = line.trim().startsWith('//');
			const isDash = line.trim().startsWith('-');
			const isSelector = /^[.#%@&[\](){}=^_:*+>~ !>`'"-]/.test(line.trim());

			if (isComment) {
				comments.push({ index, line });
				return false; // Exclude comments from known properties
			}

			if (isDash) {
				webkits.push({ index, line });
				return false; // Exclude webkits from known properties
			}

			if (isSelector) {
				selectors.push({ index, line });
				return false; // Exclude selectors from known properties
			}
			return line.trim() !== ''; // Remove empty lines
		})
		.sort((a, b) => {
			const aProperty: string = a.trim().split(':')[0];
			const bProperty: string = b.trim().split(':')[0];

			const aIndex: number = PROPERTY_ORDER.indexOf(aProperty);
			const bIndex: number = PROPERTY_ORDER.indexOf(bProperty);

			return aIndex - bIndex;
		});

	// Check if any selectors are present
	if (selectors.length > 0) {
		vscode.window.showWarningMessage('No selectors allowed in the selection.');
		return;
	}

	// Add webkits back to the known properties array after the last property
	webkits.forEach(({ line }) => {
		knownProperties.push(line);
	});


	// Re-insert comments in their original positions
	comments.forEach(({ index, line }) => {
		knownProperties.splice(index, 0, line);
	});

	const sortedText: string = knownProperties.join('\n');

	editor.edit((editBuilder: vscode.TextEditorEdit) => {
		editBuilder.replace(selection, sortedText);
	});

	const notification = vscode.window.showInformationMessage('Properties sorted!') as unknown as vscode.Disposable;
	setTimeout(() => {
		notification.dispose();
	}, 2000);

}

vscode.commands.registerCommand('extension.sortSelectedProperties', () => {
	const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
	sortSelectedProperties(editor);
});
