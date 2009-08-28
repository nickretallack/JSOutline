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
  if (!history_mode) persistence.doit(data)
}

// When in history mode, you don't invalidate the undone events history by generating an event
function reverse_event(event){
  history_event = true
  reverse_events[event.type](event)
  history_event = false    
}

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

var redo_events = {
  
  
  
  
  
}
