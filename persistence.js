function preferred_storage_engine(){
  if (typeof localStorage != 'undefined') return new LocalStoragePersistence()
  if (check_cookies()) return new CookiePersistence()
  return new MemoryPersistence()
}

function restore(persistence){
  history_mode = true
  while (true){
    var event = persistence.restore()
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


function MemoryPersistence(){
  this.name = "memory"
  var events = []
  var reversed_events = []
  
  this.doit = function(data){
    events.push(data)
    reversed_events = []
    console.debug(events, reversed_events)
  }

  this.undo = function(){
    if (!events.length) return null
    var event = events.pop()
    reversed_events.push(event)
    console.debug(events, reversed_events)
    return event
  }

  this.redo = function(){
    if (!reversed_events.length) return null
    var event = reversed_events.pop()
    events.push(event)
    console.debug(events, reversed_events)
    return event
  }
  
  this.restore = function(){ return null } // no restore
  this.clear = function(){ return null }
}

function LocalStoragePersistence(){
  this.name = "localStorage"
  if (!localStorage.event_count || !localStorage.current_event){
    localStorage.event_count = localStorage.current_event = 0
  }
  
  var event_count   = parseInt(localStorage.event_count)
  var current_event = parseInt(localStorage.current_event)
  
  this.doit = function(data){    
    // record event
    localStorage['event-'+current_event] = $.toJSON(data)
    current_event += 1

    // invalidate undo history
    for(var x = current_event; x < event_count; x++){
      localStorage.removeItem('event-'+x)
    }
    localStorage.event_count = localStorage.current_event = event_count = current_event
  }
  
  this.undo = function(){
    if (current_event <= 0) return null
    current_event -= 1
    localStorage.current_event = current_event
    return deserialize_event(current_event)
  }
  
  function deserialize_event(event){
    return $.evalJSON(localStorage["event-"+event])    
  }
  
  this.redo = function(){
    if (current_event >= event_count ) return null
    var event = deserialize_event(current_event)
    current_event += 1
    localStorage.current_event = current_event
    return event
  }
  
  var restore_counter = 0
  this.restore = function(){
    if (restore_counter >= current_event) return null
    var event = deserialize_event(restore_counter)
    restore_counter += 1
    return event
  }
  
  this.clear = localStorage.clear
  this.space = localStorage.remainingSpace
}


function CookiePersistence(){
  this.name = "cookies"
  var event_count
  var current_event
  
  function persist_meta(){
    $.cookie('event_count', current_event)
    $.cookie('current_event', current_event)
  }
  
  if ($.cookie('event_count') && $.cookie('current_event')){
    event_count = parseInt($.cookie('event_count'))
    current_event = parseInt($.cookie('current_event'))
  } else {
    event_count = current_event = 0
    persist_meta()
  }

  this.doit = function(data){
    $.cookie('event-'+current_event, $.toJSON(data))
    event_count = current_event += 1
    persist_meta()

    // invalidate redo history TODO
    for(var x = current_event; x < event_count; x++){
      $.cookie('event-'+x, null)
    }
  }
  
  this.undo = function(){
    if (current_event <= 0) return null
    current_event -= 1
    persist_meta()
    var event = deserialize_event(current_event)
    // console.debug("undo",event)
    return event
  }
  
  function deserialize_event(event){
    return $.evalJSON($.cookie("event-"+event))    
  }
  
  this.redo = function(){
    if (current_event >= event_count ) return null
    var event = deserialize_event(current_event)
    // console.debug("redo",event)
    current_event += 1
    persist_meta()
    return event
  }
  
  var restore_counter = 0
  this.restore = function(){
    // console.debug("restoring", restore_counter, current_event)
    if (restore_counter >= current_event) return null
    var event = deserialize_event(restore_counter)
    // console.debug("event:",event)
    restore_counter += 1
    return event
  }
  
  this.clear = function(){
    for(var x = 0; x < event_count; x++){
      $.cookie("event-"+x, null)
    }
    $.cookie('event_count',null)
    $.cookie('current_event',null)
  }
}
