const vscode = require("vscode");
const path = require("path");
const WReadProxy = require("./server");
// const getPort = require("get-port");

class StatusBar {
  constructor() {
    this._statusBar = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      120 // 优先级
    );

    this._statusBar.text = `$(preview) 微信读书`;
    this._statusBar.command = 'weixin-read.open';
    this._statusBar.tooltip = "点击打开微信读书";

    this._statusBar.show();
  }

  show() {
    this._statusBar.show();
  }

  dispose() {
    this._statusBar.dispose();
  }
}
function createWXReadPanel(context, url) {
	let panel = vscode.window.createWebviewPanel(
		'weixin-read',
		'微信读书',
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			retainContextWhenHidden: true
		}
	);

	panel.iconPath = vscode.Uri.file(
		path.join(context.extensionPath, 'assets', 'weixin-read.png')
	);

	panel.webview.html = `<!DOCTYPE html>
	<html lang="zh">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>微信读书</title>
			<style>
			html,body,iframe{
				width: 100%;
				height:100%;
				border:0;
				padding:0;
				overflow: hidden;
				opacity: 1;
			}
			</style>
		</head>
		<body>
			<iframe src="${url}" id="weixin-read-iframe" />
		</body>
	</html>`;

	return panel;
}

const PORT = 31000;
function getProxyUri(port) {
  return vscode.Uri.parse(`http://localhost:${port}`);
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const status = new StatusBar();

	let panel;
	let started = false;

	let page = vscode.commands.registerCommand('weixin-read.open', async function () {
		let port = 31000;
		// let port = await getPort({
		// 	port: PORT
		// });

		if (port !== PORT && !started) {
			vscode.window.showErrorMessage(
				`端口${PORT}已占用!`
			);
			return;
		}

		if (!panel) {
			started = true;
			new WReadProxy(context, port);

			try {
				panel = createWXReadPanel(context, getProxyUri(port));	
			} catch (e) {
				vscode.window.showErrorMessage(e);
			}
		}
	});

	context.subscriptions.push(status, page);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
