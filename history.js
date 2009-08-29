function History(storage){
  var event_count = storage.get('event_count') || 0
  var current_event = storage.get('current_event') || 0

  function store_meta(count){
    storage.set('current_event',current_event)
    if (count) storage.set('event_count', event_count)    
  }
  
  this.doit = function(data){
    storage.set('event-'+current_event, data)
    event_count = current_event += 1
    store_meta(true)

    // invalidate undo history
    for(var x = current_event; x < event_count; x++) storage.unset('event-'+x)
  }
  
  this.undo = function(){
    if (current_event <= 0) return null
    current_event -= 1
    store_meta(false)
    
    var event = storage.get("event-"+current_event)
    history_mode = true
    reverse_events[event.type](event)
    history_mode = false
  }
  
  this.redo = function(){
    if (current_event >= event_count ) return null
    var event = storage.get("event-"+current_event)
    current_event += 1
    store_meta(false)
    return event
  }
  
  var restore_counter = 0
  this.restore = function(){
    if (restore_counter >= current_event) return null
    var event = storage.get("event-"+restore_counter)
    restore_counter += 1
    return event
  }
  
  this.clear = function(){
    if (storage.clear) return storage.clear()
    for(var x = 0; x < event_count; x++) storage.unset("event-"+x)
    storage.unset('event_count')
    storage.unset('current_event')
  }
  
  this.space = storage.space()
  this.name = storage.name
  
  this.debug = function(){
    var events = []
    for(var x = 0; x < event_count; x++) events.push(storage.get("event-"+x))
    console.debug(events)
  }
}

function undo(){
  faniggle_text()
  action_history.undo()
}

// Reverses actions again that were previously reversed, hence returning to normal
function redo(){
  history_mode = true
  event = action_history.redo()
  if (event) forward_events[event.type](event)  
  history_mode = false
}




// These really need some better names
// var events = []
// var undone_events = []
var history_mode = false
var replay_mode = false
var reverse_mode = false

// Add an event to the undo/redo history, as well as the persistence layer
// Should we make use of the persistence layer for event history directly?  I mean..
// We are duplicating information here after all.
function emit_event(data){
  if (!history_mode) action_history.doit(data)
}

// // When in history mode, you don't invalidate the undone events history by generating an event
// function reverse_event(event){
//   history_mode = true
//   reverse_events[event.type](event)
//   history_mode = false    
// }

// How to re-play events from hard storage
var forward_events = {
  create_sibling: function(data){ create_sibling  (find_item(data.prev), data.item) },
  indent:         function(data){ indent          (find_item(data.item)) },
  dedent:         function(data){ dedent          (find_item(data.item)) },
  move_up:        function(data){ move_up         (find_item(data.item)) },
  move_down:      function(data){ move_down       (find_item(data.item)) },
  fold:           function(data){ fold            (find_item(data.item)) },
  unfold:         function(data){ unfold          (find_item(data.item)) },
  delete_tree:    function(data){ delete_tree     (find_item(data.item), data.new_item_id) },
  change:change_text
}

// How to reverse events that were carried out in this session, including those replayed from storage.
var reverse_events = {
  create_sibling: function(data){
    var item = find_item(data.item)
    focus_prev(item) || focus_parent(item)
    item.remove() },
  indent:     function(data){ dedent      (find_item(data.item)) },
  dedent:     function(data){ indent      (find_item(data.item)) },
  move_up:    function(data){ move_down   (find_item(data.item)) },
  move_down:  function(data){ move_up     (find_item(data.item)) },
  fold:       function(data){ unfold      (find_item(data.item)) },
  unfold:     function(data){ fold        (find_item(data.item)) },
  delete_tree:undelete_tree,
  change:unchange_text
}

function restore(action_history){
  history_mode = true
  while (true){
    var event = action_history.restore()
    if (event) forward_events[event.type](event)
    else break    
  }
  history_mode = false
}

function check_cookies(){
  $.cookie('test',null)
  $.cookie('test','true')
  if (!$.cookie('test')) return false
  $.cookie('test',null)
  return true
}


