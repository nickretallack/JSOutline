// Re-usable Event History
// depends on storage.js

function History(storage){
  var event_count = storage.get('event_count') || 0
  var current_event = storage.get('current_event') || 0
  var disable_record = false

  function store_meta(count){
    storage.set('current_event',current_event)
    if (count) storage.set('event_count', event_count)    
  }
  
  function do_without_record(event, act){
    disable_record = true
    act(event)
    disable_record = false
  }
  
  this.record = function(data){
    if (disable_record) return

    storage.set('event-'+current_event, data)
    event_count = current_event += 1
    store_meta(true)

    // invalidate undo history
    for(var x = current_event; x < event_count; x++) storage.unset('event-'+x)
  }
  
  this.undo = function(undo){
    if (current_event <= 0) return null
    current_event -= 1
    store_meta(false)    

    var event = storage.get("event-"+current_event)
    do_without_record(event, undo)
  }
  
  this.redo = function(redo){
    if (current_event >= event_count ) return null

    var event = storage.get("event-"+current_event)
    do_without_record(event, redo)

    current_event += 1
    store_meta(false)
  }
  
  this.restore = function(doit){
    for(var x = 0; x < current_event; x++) {
      var event = storage.get("event-"+x)
      do_without_record(event, doit)
    }
  }
  
  this.clear = function(){
    if (storage.clear) return storage.clear()
    for(var x = 0; x < event_count; x++) storage.unset("event-"+x)
    storage.unset('event_count')
    storage.unset('current_event')
  }
  
  this.storage = storage
  this.storage_space = storage.space
  this.storage_name = storage.name
  
  this.debug = function(){
    var events = []
    for(var x = 0; x < event_count; x++) events.push(storage.get("event-"+x))
    console.debug(events)
  }
}