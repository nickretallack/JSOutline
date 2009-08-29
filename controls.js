var keys = {enter:13, tab:9, up:38, down:40, left:37, right:39, del:8}
var codes = key_value_swap(keys)

var key_commands = { 
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
  
  'alt+del'     :'delete_tree',

  'alt+left'    :'undo',
  'alt+right'   :'redo',
}

var title_actions = set(['create_sibling','toggle_note_view','toggle_fold_item','indent','dedent',
  'focus_prev','focus_next','focus_prev_sibling','focus_next_sibling','move_up','move_down','delete_tree'])

var window_actions = set(['undo','redo','focus_last','focus_first'])
var note_actions = set(['toggle_note_view'])

function title_keydown(event){
  var item = $(this).parents('.item:first')
  grow_field(this)
  try_key_command(event, title_actions, item)
}

function note_keydown(event){
  var item = $(this).parents('.item:first')
  grow_field(this)
  try_key_command(event, note_actions, item)
}

function window_keydown(event){
  try_key_command(event, window_actions)
}


function try_key_command(event, actions, item){
  var key_command = modifiers(event) + codes[event.which]
  var action = key_commands[ key_command ]
  if (action && actions[action]) {
    stop(event)
    var action_data = {type:action}
    if (item) action_data['item_id'] = item.attr('data-id')
    return doit(action_data)
  }
}

function modifiers(event){
  if (event.shiftKey) return 'shift+'
  if (event.altKey) return 'alt+'
  if (event.ctrlKey) return 'ctrl+'
  return ''
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

// TODO: check that action.type is valid
function doit(action){
  var fun = eval(action.type)
  if (action.item_id) {
    var item = find_item(action.item_id)  
    fun(item)
  } else {
    fun()
  }
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
  var field = $(':focus')
  field.blur()
  field.focus()
}

// Similar to faniggle_text, but this time we're focusing a title specifically
function focus_item(item){
  if (item.length) $(':focus').blur()
  return item.find('.title:first').focus()
}