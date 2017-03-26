const electron = require('electron');
const dialog = electron.dialog;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const cp = require('child_process');
const handleSquirrelEvent = ()=>{
	if (process.platform == 'win32') {
		const executeSquirrelCommand = (args, done)=>{
			const updateDotExe = path.resolve( path.dirname(process.execPath), '..', 'update.exe');
			const child = cp.spawn(updateDotExe, args, { detached: true });
			child.on('close', (code)=>{
				done();
			});
		}

		const install = (done)=>{
			const target = path.basename(process.execPath);
			executeSquirrelCommand(["--createShortcut", target], done);
		}

		const uninstall = (done)=>{
			const target = path.basename(process.execPath);
			executeSquirrelCommand(["--removeShortcut", target], done);
		}

		const squirrelEvent = process.argv[1];
		switch (squirrelEvent) {
			case '--squirrel-install':
				install(app.quit);
				return true;
			case '--squirrel-updated':
				install(app.quit);
				return true;
			case '--squirrel-obsolete':
				app.quit();
				return true;
			case '--squirrel-uninstall':
				uninstall(app.quit);
				return true;
		}
	}
	return false;
}
let mainWindow = null;
const createWindow = ()=>{
	mainWindow = new BrowserWindow({
		width: 600,
		height: 600,
		maximizable: true,
		resizable: true,
		center: true,
		titleBarStyle: 'hidden',
		webPreferences:{
			nodeIntegration: true,
			webSecurity: false,
			allowRunningInsecureContent: true,
			scrollBounce: true
		}
	});
	//mainWindow.openDevTools();
	mainWindow.loadURL('file://'+ __dirname+ '/src/index.html');
	mainWindow.on('closed', ()=>{
		mainWindow = null
	});
	return true;
}


if (handleSquirrelEvent()) {
	return;
}
else{
	app.on('ready', ()=>{
		createWindow();
	});

	app.on('window-all-closed', ()=>{
		if (process.platform !== 'darwin') {
			app.quit()
		}
	});

	app.on('activate', ()=>{
		if (mainWindow === null) {
			createWindow();
		}
	});
}