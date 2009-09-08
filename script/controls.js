// User Interaction

var keys = {enter:13, tab:9, up:38, down:40, left:37, right:39, del:8, space:32}
var codes = key_value_swap(keys)

function modifiers(event){
  // intentionally returns the weakest modifier to avoid mistakes.
  if (event.shiftKey) return 'shift+'
  if (event.altKey) return 'alt+'
  if (event.ctrlKey) return 'ctrl+'
  return ''
}

var title_commands = {
  // Create
  'enter'       :'create_sibling',
  'shift+enter' :'create_previous_sibling',
  'alt+enter'   :'create_child',
  'ctrl+enter'  :'create_parent',

  // Delete
  'alt+del'      :'delete_item',
  'ctrl+del'     :'delete_tree',

  // Navigate
  'up'          :'focus_prev',
  'down'        :'focus_next',
  'alt+up'      :'focus_prev_sibling',
  'alt+down'    :'focus_next_sibling',

  'ctrl+space'  :'toggle_note_view',
  'alt+space'   :'toggle_fold_item',

  // Move
  'tab'         :'indent',
  'shift+tab'   :'dedent',
  'shift+right' :'indent',
  'shift+left'  :'dedent',

  'shift+up'    :'move_up',
  'shift+down'  :'move_down',  
}

var note_commands = {
  'ctrl+space'  :'toggle_note_view',
}

var window_commands = {
  'alt+left'    :'undo',
  'alt+right'   :'redo',
}

var unfocused_commands = {
  'up'          :'focus_first',
  'down'        :'focus_last',

  'enter'       :'create_sibling',
  'shift+enter' :'create_previous_sibling',
}


/////////////////////////////////// EVENT HANDLERS ///////////////////////////

function title_keydown  (event){ keydown(event, title_commands, this) }
function note_keydown   (event){ keydown(event, note_commands,  this) }
function window_keydown (event){ keydown(event, window_commands     ) }
function unfocused_keydown (event){ if(!$(':focus').length) keydown(event, unfocused_commands     ) }

function keydown(event, commands, field){
  var key_command = modifiers(event) + codes[event.which]
  var action      = commands[ key_command ]
  if (action){
    stop(event)
    var action_data = {type:action}
    if (field) action_data['item_id'] = $(field).parents('.item:first').attr('data-id')
    dispatch_action(action_data)
  } else if (field) grow_field(field)  
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
    action_history.record({type:'change_text', item_id:item.attr('data-id'), field:field_kind, old_text:old_text, new_text:new_text})      
  }
}

var time_until_autosave = 1000
var change_countdown_timer
function change_countdown(event){
  clearTimeout(change_countdown_timer)
  change_countdown_timer = setTimeout(faniggle_text, time_until_autosave)
}

//////////////////////////////// MISC //////////////////////////

function grow_field(field){
  var field = $(field)
  setTimeout(function(){
    var temp_field
    if (field.hasClass('.note'))  temp_field = $('.autogrow .note' )
    else                          temp_field = $('.autogrow .title')
    temp_field.text(field.val() + " MM")
    field.css('height', temp_field.height())
  })
}

function stop(event){
  event.preventDefault()
  event.stopPropagation()
  faniggle_text()
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

