// Re-usable Event History
// depends on storage.js

function History(storage, context){
  var event_count_name = 'event_count'
  var current_event_name = 'current_event'

  if (context) {
    event_count_name = context + '-' + event_count_name
    current_event_name = context + '-' + current_event_name
  } else context = ""

  
  var event_count = storage.get(event_count_name) || 0
  var current_event = storage.get(current_event_name) || 0
  var disable_record = false
  
  function naming_convention(index){
    var name = 'event-' + index
    if (context) return context + '-' + name
    return name
  }

  function store_meta(count){
    storage.set(current_event_name,current_event)
    if (count) storage.set(event_count_name, event_count)    
  }
  
  function do_without_record(event, act){
    disable_record = true
    act(event)
    disable_record = false
  }

  /* - Record an event -
   * Takes arbitrary data and writes it at the current event position
   * Destroys any events following it */
  this.record = function(data){
    if (disable_record) return

    storage.set(naming_convention(current_event), data)
    event_count = current_event += 1
    store_meta(true)

    // invalidate undo history
    for(var x = current_event; x < event_count; x++) storage.unset(naming_convention(x))
  }
  
  /* - Undo an event -
   * Takes a function of one argument, passes it the event to be undone
   * Any calls to 'record' during its execution will be ignored
   * Moves current event pointer back one space
   * Returns true if an event was undone, false otherwise */
  this.undo = function(undo){
    if (current_event <= 0) return false
    current_event -= 1
    store_meta(false)    

    var event = storage.get(naming_convention(current_event))
    do_without_record(event, undo)
    return true
  }

  /* - Redo an event -
   * Just like undo, but moves the current event pointer forward */
  this.redo = function(redo){
    if (current_event >= event_count ) return false

    var event = storage.get(naming_convention(current_event))
    do_without_record(event, redo)

    current_event += 1
    store_meta(false)
    return true
  }
  
  /* - Restore all events -
   * Runs through the event history from the beginning and calls your function on each event.
   * Calls to 'record' inside your function will be ignored */
  this.restore = function(doit){
    for(var x = 0; x < current_event; x++) {
      var event = storage.get(naming_convention(x))
      do_without_record(event, doit)
    }
  }
  
  /* - Clear everything - 
   * Erases all stored information */
  this.clear = function(){
    if (storage.clear) return storage.clear()
    for(var x = 0; x < event_count; x++) storage.unset(naming_convention(x))
    storage.unset(event_count_name)
    storage.unset(current_event_name)
  }
  
  this.storage = storage
  this.storage_space = storage.space
  this.storage_name = storage.name
  
  /* - Debug -
   * Prints events in order to the console */
  this.debug = function(){
    var events = []
    for(var x = 0; x < event_count; x++) events.push(storage.get(naming_convention(x)))
    console.debug(events, "current:",events[current_event ])
  }
}