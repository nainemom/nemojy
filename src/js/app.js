// Utility & Elements
const $ = (selector) => document.querySelectorAll(selector);
const $emojies = $('#emojies')[0];
const $editor = $('#editor')[0];
const $editorInput = $('#editorInput')[0];
const $search = $('#search')[0];
const $switchBtn = $('#switchBtn')[0];
const $notfound = $('#notfound')[0];
const $notification = $('#notification')[0];
const $copyToClipboard = $('#copy-to-clipboard')[0];
const $clearClipboard = $('#clear-clipboard')[0];

// Classes
class App{
    constructor(){
        this.open('emojies');
    }
    state(){
        return this._state;
    }
    toggle(){
        switch(this._state){
            case 'emojies':
                this.open('editor');
                return 'editor';
            case 'editor':
                this.open('emojies');
                return 'emojies';
        }
    }
    open(mode="emojies"){
        switch(mode){
            case 'emojies':
                $emojies.classList.remove('hidden');
                $notification.classList.remove('editorMode');
                $search.classList.remove('hidden');
                $editor.classList.add('hidden');
                $switchBtn.innerHTML = 'Editor mode';
                break;
            case 'editor':
                $emojies.classList.add('hidden');
                $notification.classList.add('editorMode');
                $search.classList.add('hidden');
                $editor.classList.remove('hidden');
                $switchBtn.innerHTML = 'Emojies';
                $editorInput.focus();

                break;
        }
        this._state = mode;
    }
}
class MiniClipboard{
    constructor(){
        this.clipboard = require('electron').clipboard;
        this.data = '';
        this.showingData = '';
    }
    append(data='', showingData=''){
        this.data+=data;
        this.showingData+=showingData;
    }
    set(data='', showingData=''){
        this.data=data;
        this.showingData=showingData;
    }
    clear(){
        this.data='';
        this.showingData='';
    }
    get(showing=false){
        return showing? this.showingData: this.data;
    }
    toClipboard(){
        this.clipboard.writeText( this.get() );
    }
}
class Settings{
    constructor(){
        this.data = localStorage.getItem('settings')? JSON.parse(localStorage.getItem('settings')): {};
    }
    get(key=''){
        return this.data[key] === null? false: this.data[key];
    }
    set(key='', value=''){
        this.data[key]=value;
        this.save();
    }
    inverse(key=''){
        this.data[key] = this.data[key] === true? false: true;
        this.save();
    }
    remove(key=''){
        delete this.data[key];
        this.save();
    }
    save(){
        localStorage.setItem('settings', JSON.stringify(this.data));
    }
}

const yahooToEmoji = (str='')=>{
    let chart = [
        { replace: '🤗', pattern: /\>:(-?)d\<+/ig, dublicateBy: /\>/ig}, // >:D< 
        { replace: '😂', pattern: /:(-?)\){2,}/ig, double: true, dublicateBy: /\)/ig}, // :))))
        { replace: '😀', pattern: /:(-?)\)/ig}, // :)
        { replace: '😁', pattern: /:(-?)d+/ig, dublicateBy: /d/ig}, // :DDD
        { replace: '🤣', pattern: /=(-?)\){2,}/ig, double: true, dublicateBy: /\)/ig}, // =))))
        { replace: '😊', pattern: /\^_\^/ig}, // ^_^
        { replace: '😋', pattern: /:(-?)p+/ig, dublicateBy: /p/ig}, // :p
        { replace: '😘', pattern: /:(-?)\*{2,}/ig, double: true, dublicateBy: /\*/ig}, // :**
        { replace: '😙', pattern: /:(-?)\*/ig}, // :*
        { replace: '🤔', pattern: /:(-?)\?+/ig, dublicateBy: /\?/ig}, // :?
        { replace: '😑', pattern: /:(-?)\|{2,}/ig, double: true, dublicateBy: /\|/ig}, // :||
        { replace: '😐', pattern: /:(-?)\|/ig}, // :|
        { replace: '😉', pattern: /;(-?)\)+/ig, dublicateBy: /\)/ig}, // ;)
        { replace: '😭', pattern: /:(-?)\({2,}/ig, double: true, dublicateBy: /\(/ig}, // :((
        { replace: '☹', pattern: /:(-?)\(/ig}, // :(
        { replace: '😍', pattern: /:(-?)x+/ig, dublicateBy: /x/ig}, // :x 
        { replace: '😌', pattern: /:(-?)\"\>+/ig, dublicateBy: /\>/ig}, // :">
        { replace: '😲', pattern: /:(-?)o+/ig, dublicateBy: /\o/ig}, // :o
        { replace: '😢', pattern: /:'\(+/ig, dublicateBy: /\(/ig}, // :'(
        { replace: '🤢', pattern: /:(-?)\&+/ig, dublicateBy: /\&/ig}, // :&
    ];
    let ret = str;
    chart.forEach( (val)=>{
        if( val.dublicateBy ){
            let founds = str.match(val.pattern);
            if( founds ){
                founds.forEach( (found)=>{
                    let repeatLength = found.match(val.dublicateBy);
                    repeatLength = repeatLength? repeatLength.length: 1;
                    if( val.double ){
                        repeatLength = repeatLength-1;
                    }
                    ret = ret.replace( found, val.replace.repeat( repeatLength ) )
                });
            }
        }
        else{
            ret = ret.replace( val.pattern, val.replace )
        }
    });
    return ret;
}
// Sets
const notification = (text = '') => {
    $notification.querySelectorAll('.text')[0].innerHTML = text
}
const app = new App;
const miniClipboard = new MiniClipboard;
const settings = new Settings;
const emojies = require('./emojies/emojies.json');
const remote = require('electron').remote;


// Menu
const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {
            label: 'Exit',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
            }
        ]
    },
    {
        label: 'Options',
        submenu: [
            {
                label: 'Automatic copy to clipboard',
                type: 'checkbox',
                checked: settings.get('automaticCopyToClipboard'),
                click: function(){
                    settings.inverse('automaticCopyToClipboard');
                }
            },
            {
                label: 'Allow drag and drop',
                type: 'checkbox',
                checked: settings.get('allowDragAndDrop'),
                click: function(){
                    settings.inverse('allowDragAndDrop');
                }
            },
            {
                label: 'Allways on top',
                type: 'checkbox',
                checked: settings.get('allwaysOnTop'),
                click: function(){
                    settings.inverse('allwaysOnTop');
                    remote.getCurrentWindow().setAlwaysOnTop( settings.get('allwaysOnTop') );
                }
            },
            {
                label: 'Start screen',
                submenu: [
                    {
                        label: 'Emojies',
                        type: 'radio',
                        checked: settings.get('startScreen') == 'emojies' || !settings.get('startScreen'),
                        click: function(){
                            settings.set('startScreen', 'emojies');
                        }
                    },
                    {
                        label: 'Editor mode',
                        type: 'radio',
                        checked: settings.get('startScreen') == 'editor',
                        click: function(){
                            settings.set('startScreen', 'editor');
                        }
                    }
                ]
            },
        ]
    }
]
const menu = remote.Menu.buildFromTemplate(menuTemplate)
remote.Menu.setApplicationMenu(menu)


// Main Function
const emojiToImg = (emoji, mini=false)=>{
    let $img = document.createElement('span');
    $img.classList.add('emoji-img');
    if(mini){
        $img.classList.add('mini');
    }
    $img.style.backgroundImage = `url("./emojies/${emoji.code}.png")`;
    $img.setAttribute('draggable', false);
    return $img;
}
const showList = (searchText='', init=false)=>{
    let resultLength = 0;
    if( init ){
        emojies.forEach( (emoji, i)=>{
            let $elem = document.createElement('div');
            $elem.classList.add('emoji');
            $elem.setAttribute('draggable', true);
            $elem.setAttribute('data-char', emoji.char)
            $elem.setAttribute('data-code', `U+${emoji.code.split('_').join(' U+')}`)
            $elem.setAttribute('title', emoji.name );
            $elem.appendChild( emojiToImg(emoji) );
            bindEvents($elem);
            $emojies.appendChild($elem);
        });
        resultLength = emojies.length;
    }
    else{
        const $emojiItems = $('#emojies .emoji');
        $emojiItems.forEach( ($emojiItem, i)=>{
            let fullname = $emojiItem.getAttribute('title');
            let matched = true;
            let searchWords = searchText.indexOf(' ') !== -1? searchText.toLowerCase().split(' '): [searchText];
            searchWords.forEach( (searchWord)=>{
                if( fullname.indexOf(searchWord) === -1 ){
                    matched = false;
                    return false;
                }
            });
            if( matched ){
                $emojiItem.classList.remove('hidden');
                resultLength++;
            }
            else{
                $emojiItem.classList.add('hidden');
            }
        })
    }
    if( resultLength < 1 ){
        $emojies.classList.add('hidden');
        $notfound.classList.remove('hidden');
    }
    else{
        $notfound.classList.add('hidden');
        $emojies.classList.remove('hidden');
    }
}

// Emoji Events Binder
const bindEvents = ($emojyElement)=>{
    $emojyElement.ondragstart = (event)=>{
        if( !settings.get('allowDragAndDrop') ){
            return;
        }
        event.dataTransfer.clearData();
        event.dataTransfer.setData("text/plain", $emojyElement.getAttribute('data-char') );
        event.target.classList.add('dragging');
        notification('Drop into your textbox...');
    }
    $emojyElement.onclick = ()=>{
        let showData = $emojyElement.querySelector('.emoji-img').cloneNode(true);
        showData.classList.add('mini');
        miniClipboard.append( $emojyElement.getAttribute('data-char'), showData.outerHTML );
        notification( miniClipboard.get(true) );
        
    }
    $emojyElement.ondragend = ()=>{
        if( !settings.get('allowDragAndDrop') ){
            return;
        }
        $emojyElement.classList.remove('dragging');
        if( !miniClipboard.get() ){
            notification('Select an emoji!');
        }
        else{
            notification(miniClipboard.get(true));
        }
    }
}

// Search Events
$search.value = '';
$search.onkeyup = ()=>{
    showList($search.value);
}
$search.onchange = ()=>{
    showList($search.value);
}


// Clipboard Events
$clearClipboard.onclick = ()=>{
    miniClipboard.clear();
    $editorInput.value = '';
    notification('');
}
$copyToClipboard.onclick = ()=>{
    miniClipboard.toClipboard();
}


remote.getCurrentWindow().on('blur', ()=>{
    if(miniClipboard.get() && settings.get('automaticCopyToClipboard')){
        miniClipboard.toClipboard();
    }
});
remote.getCurrentWindow().on('focus', function(){
    if( settings.get('automaticCopyToClipboard') ){
        miniClipboard.clear();
    }
});

$switchBtn.onclick = ()=>{
    app.toggle()
    $editorInput.value = '';
    miniClipboard.clear();
    notification('', true);
}

$editorInput.onkeyup = ()=>{
    let output = yahooToEmoji($editorInput.value);
    let displayOutput = output;
    displayOutput = displayOutput.replace(/\n/g, "<br>");
    displayOutput = displayOutput.replace(/ /g, "&nbsp");
    emojies.forEach( (emoji)=>{
        displayOutput = displayOutput.split( emoji.char ).join( emojiToImg(emoji, true).outerHTML );
    });
    miniClipboard.set( output, displayOutput );
    notification( miniClipboard.get(true) );
}



// Init!
remote.getCurrentWindow().setAlwaysOnTop( settings.get('allwaysOnTop') || false );
showList('', true);
notification('');
miniClipboard.clear();
app.open( settings.get('startScreen') || 'emojies' );