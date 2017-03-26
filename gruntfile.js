module.exports = function (grunt) {
	'use strict';
	grunt.initConfig({
		wget: {
			default: {
				options: {
					baseUrl: 'http://unicodey.com/js-emoji/build/emoji-data/'
				},
				src: [
					'sheet_apple_32.png',
					'sheet_emojione_32.png',
					'sheet_google_32.png',
					'sheet_twitter_32.png',
					'emoji.json'
				],
				dest: 'src/emojies/'
			}
		},
		exec: {
			run: {
				cmd: './node_modules/.bin/electron .',
				stdout: true,
				stderr: true
			},
			clean: {
				cmd: function(folder){
					switch(folder){
						case 'dist':
							return 'rm -rf ./dist/*';
						case 'emojies':
						default:
							return 'rm -rf ./src/emojies/*';
					}
				},
				stdout: true,
				stderr: true
			},
			build: {
				cmd: function(platform){
					switch(platform){
						case 'linux':
							return './node_modules/.bin/build --x64 --ia32 --linux deb';// rpm tar.xz';
						case 'osx':
							return './node_modules/.bin/build --x64 --ia32 --osx';
						case 'win':
						default:
							return './node_modules/.bin/build --x64 --ia32 --win';
					}
				},
				stdout: true,
				stderr: true
			}
		}
	});

	grunt.loadNpmTasks('grunt-exec');
	grunt.loadNpmTasks('grunt-wget');
	
	grunt.registerTask("start", [
		"exec:run"
	]);

	grunt.registerTask("sort", function(){
		let done = this.async();
		let final = [];
		let emojies = require('./src/emojies/emoji.json');
		const outPath = './src/emojies/emojies.json';
		const cats = [
			"People",
			"Foods",
			"Places",
			"Nature",
			"Objects",
			"Skin Tones",
			"Symbols",
			"Activity",
			"Flags"
		];
		const unifiedToEmojy = (emojyCode)=>{
			let ret = '';
			let getUnicodeCharacter = (cp)=>{  // tnx to http://stackoverflow.com/a/7126661/3077365
				if (cp >= 0 && cp <= 0xD7FF || cp >= 0xE000 && cp <= 0xFFFF) {
					return String.fromCharCode(cp);
				} else if (cp >= 0x10000 && cp <= 0x10FFFF) {
					cp -= 0x10000;
					let first = ((0xffc00 & cp) >> 10) + 0xD800
					let second = (0x3ff & cp) + 0xDC00;
					return String.fromCharCode(first) + String.fromCharCode(second);
				}
				return String.fromCharCode(parseInt(unified,16));
			}
			emojyCode = emojyCode.split('-');
			emojyCode.forEach( (value)=>{
				value = '0x'+value;
				ret+=getUnicodeCharacter(value);
			});
			return ret;
		}
		emojies.forEach( (emoji)=>{
			final.push( {
				sortorder: emoji.sort_order,
				category: emoji.category,
				position: `-${emoji.sheet_x * 32}px -${emoji.sheet_y *32}px`,
				name: emoji.name || '',
				fullname: `Order: ${emoji.sort_order}\nName: ${emoji.name}\nShortcut: :${emoji.short_name}:\nCategory: ${emoji.category}`,
				shortcut: `:${emoji.short_name}:`,
				char: unifiedToEmojy(emoji.unified)
			} );
		});
		final = final.sort( (a,b) =>{
			if(
				a.sortorder < b.sortorder && a.category == b.category ||
				cats.indexOf(a.category) < cats.indexOf(b.category)
			){
				return -1;
			}
			else{
				return 1;
			}
		});
		require('fs').writeFileSync( outPath, JSON.stringify(final) );
		done();
		console.log(`File '${outPath}' created!`);
	});

	grunt.registerTask("fetch",[
		"exec:clean:emojies",
		"wget:default",
		"sort"
	])
	grunt.registerTask("build", [
		"exec:clean:dist",
		"exec:build:win",
		//"exec:build:linux",
		//"exec:build:osx"
	]);
}
