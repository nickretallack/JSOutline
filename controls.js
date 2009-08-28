var keys = {enter:13, tab:9, up:38, down:40, left:37, right:39, del:8}
var codes = {}
for (var key in keys){
  codes[keys[key]] = key
}
console.debug(codes)


// This should all be refactored to allow custom key bindings.
// Store those along with the other persistence method used.

function doit(action){
  var fun = eval(action.type)
  if (action.item_id) {
    console.debug(action.type)
    var item = find_item(action.item_id)  
    fun(item)
  } else {
    console.debug(action.type)
    fun()
  }
}



function modifiers(event){
  if (event.shiftKey) return 'shift+'
  if (event.altKey) return 'alt+'
  if (event.ctrlKey) return 'ctrl+'
  return ''
}

function focus_prev_sibling(item){
  focus_item(item.prev())
}

function focus_next_sibling(item){
  focus_item(item.next())
}

var title_keys = { 
  'enter'       :'create_sibling',
  'shift+enter' :'toggle_note_view',
  'alt+enter'   :'toggle_fold_item',

  'tab'         :'indent',
  'shift+tab'   :'dedent',
  'shift+right' :'indent',
  'shift+left'  :'dedent',

  'up'          :'focus_prev',
  'down'        :'focus_next',
  'alt+up'      :'focus_prev_sibling',
  'alt+down'    :'focus_next_sibling',

  'shift+up'    :'move_up',
  'shift+down'  :'move_down',
  
  'alt+del'     :'delete_tree'
}

var window_keys = {
  // 'enter'       :'create_root_child',
  'alt+left'    :'undo',
  'alt+right'   :'redo',
  'up'          :'focus_last',
  'down'        :'focus_first'
}

var note_keys = {
  'shift+enter' :'toggle_note_view'
}

// TODOOOOOOOOOOOOOOOOOOOO  NEEDS BLUR
function toggle_note_view(item){
  if ($(':focus').hasClass('note')) focus_item(item)
  else item.find('.note:first').focus()
}


// Most of the time, you have an item title focused.
function title_keydown(event){
  var item = $(this).parents('.item:first')

  grow_field(this)
  
  var key_command = modifiers(event) + codes[event.which]
  var command = title_keys[ key_command ]
  if (command) {
    stop(event)
    return doit({type:command, item_id:item.attr('data-id')})
  }
}

function note_keydown(event){  
  if(event.which == keys.enter){
    if (event.shiftKey){
      stop(event)
      var item = $(this).parents('.item:first')
      return focus_item(item)
    }
  }
  grow_field(this, event.which)
}

// When nothing is selected, fall back to these controls
function window_keydown(event){
  var key_command = modifiers(event) + codes[event.which]
  var command = window_keys[ key_command ]
  if (command) {
    if (!$(':focus').length) {
      if (command == 'create_root_child'){
        stop(event)
        return create_sibling($('.root > .item:last'))

      } else if (command == "focus_last"){
        stop(event)
        return focus_item($('.root > .item:last'))

      } else if (command == "focus_first"){
        stop(event)
        return focus_item($('.root > .item:first'))
      }      
    }
    stop(event)
    return doit({type:command})
  }
  
}

function grow_field(field, character){
    field = $(field)
    var temp_field
    if (field.hasClass('.note')) temp_field = $('.autogrow .note')
    else temp_field = $('.autogrow .title')

    var text = field.val()
    if (character == keys.enter) text += "\n"
    if (character == keys.del) text = text.substring(0, text.length-1)
        // argh!  Maybe I should use a setTimeout here to see what happens...
    text += "."
    // if (!character) text += "x"

    temp_field.text(text)
    // console.debug(temp_field.height())
    field.css('height',temp_field.height())    
}




// If any text field changes, it needs to be recorded as an event.
// This is bound on the 'blur' event and manually called because blur seems to be broken.
// Stores current text in an attribute so we can detect changes, because 'change' event
// seems to also be broken.
function changed_text(event){
  var field = $(this)
  var item = field.parents('.item:first')
  var old_text = field.attr("data-text")
  var new_text = field.val()
  if (old_text != new_text){
    field.attr("data-text", new_text)
    var field_kind = field.hasClass('title') ? 'title' : 'note'
    emit_event({type:'change', item:item.attr('data-id'), field:field_kind, old_text:old_text, new_text:new_text})      
  }
}

function stop(event){
  event.preventDefault()
  faniggle_text()
  // event.stopPropagation()
}

// Causes a forced execution of the changed_text blur/change handler
// This is useful when we need to generate a text-changed event yet the user
// has not deselected the text box yet.  Also used when blur() doesn't fire properly.
function faniggle_text(){
  // console.debug("faniggled")
  var field = $(':focus')
  field.blur()
  field.focus()
}

// Similar to faniggle_text, but this time we're focusing a title specifically
function focus_item(item){
  if (item.length) $(':focus').blur()
  return item.find('.title:first').focus()
}