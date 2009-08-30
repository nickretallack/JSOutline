// Standard Action Parameters:
// {type:"action_name", item_id:2, prev_item_id:1, parent_item_id:0, new_item_id:3,
//                                 new_text:"foo", old_text:"bar", field:"note" }

var title_actions   = set(['create_sibling','toggle_note_view','toggle_fold_item','indent','dedent',
  'focus_prev','focus_next','focus_prev_sibling','focus_next_sibling','move_up','move_down','delete_tree'])
var window_actions  = set(['undo','redo','focus_last','focus_first','create_sibling'])
var note_actions    = set(['toggle_note_view'])
var history_actions = set(['change_text','undelete_tree','uncreate_item','unchange_text'])
var all_actions     = merge([title_actions, window_actions, note_actions, history_actions])

function dispatch_action(action){
  if (!all_actions[action.type]) return
  var fun = eval(action.type)
  fun(action)
}

function restore(action_history){
  var version = action_history.storage.get("version")
  action_history.storage.set("version","1")
  // possibly do some repair work based on the version

  action_history.restore(function(action){
    dispatch_action(action)
  })  
}

reverse_actions = {
  'create_sibling':'uncreate_item',
  'indent'        :'dedent',
  'dedent'        :'indent',
  'move_up'       :'move_down',
  'move_down'     :'move_up',
  'fold'          :'unfold',
  'unfold'        :'fold',
  'delete_tree'   :'undelete_tree',
  'change_text'   :'unchange_text'
}

/////////////////////////////////////////// KEYBOARD AND HISTORY ACTIONS ///////////////////////////////////

function create_sibling(data){
  var item = find_item(data.item_id)
  if (!item) item = $('.root .item:last')
  var new_item = create_an_item(function(node){ item.after(node) }, data.new_item_id)
  action_history.record({ type        :'create_sibling', 
                          item_id     :data.item_id, 
                          new_item_id :new_item.attr('data-id')})
}

function delete_tree(data){ // Delete a node and all sub-nodes, moving them to purgatory so they can be resurrected later
  var item = find_item(data.item_id)    
  history_data = {type:'delete_tree', item_id:data.item_id}

  // find something else to look at
  focus_prev(data).length || focus_item(item.next()).length

  // remember where this node was atached
  var prev = item.prev()
  if (!prev.length) {
    var parent = item.parents('.contents:first')
    history_data['parent_item_id'] = parent.attr('data-id')
  } else {
    history_data['prev_item_id'] = prev.attr('data-id')
  }
  
  // save in purgatory for later ressuraction
  item.prependTo($('.dead'))

  // if there are no nodes left, create a new one as part of this same event.
  if(!$('.root .item').length) {
    var node = create_an_item(function(node){ $('.root').prepend(node) }, data.new_item_id)
    history_data['new_item_id'] = node.attr('data-id')
  }

  action_history.record(history_data)
}

function indent(data){
  var item = find_item(data.item_id)
  
  if (data.prev_item_id){ // we're undo-ing a dedent
    var old_prev = find_item(data.prev_item_id)
    console.debug(old_prev.get())
    old_prev.after(item)
    return focus_item(item)
  }

  var prev = item.prev()
  if (prev.length && !prev.hasClass('folded')){
    item.appendTo(prev.find('.contents:first'))
    focus_item(item)
    action_history.record({type:'indent', item_id:data.item_id})
  }
}

function dedent(data){
  var item = find_item(data.item_id)
  var parent = item.parents('.item:first')
  var prev = item.prev()
  if (parent.length){
    parent.after(item)
    focus_item(item)
    var action_data = {type:'dedent', item_id:data.item_id}
    if (prev.length) action_data['prev_item_id'] = prev.attr('data-id')
    action_history.record(action_data)
  }
}

function move_up(data){ // Moves this item before its previous sibling
  var item = find_item(data.item_id)    
  var prev = item.prev()
  if (prev.length) prev.before(item)
  focus_item(item)
  action_history.record({type:'move_up', item_id:data.item_id})
}

function move_down(data){ // Move this item after its next sibling
  var item = find_item(data.item_id)    
  item.next().after(item)
  focus_item(item)
  action_history.record({type:'move_down', item_id:data.item_id})
}

// Hides and deactivates child nodes
function fold(data){
  var item = find_item(data.item_id)    
  if (item.find('.item').length){
    item.addClass('folded')
    action_history.record({type:'fold', item_id:data.item_id})    
  }
}

// Shows and activates child nodes
function unfold(data){
  var item = find_item(data.item_id)    
  if (item.find('.item').length){
    item.removeClass('folded')
    action_history.record({type:'unfold', item_id:data.item_id})    
  }
}

//////////////////////////////////////// KEYBOARD-ONLY ACTIONS /////////////////////////////////////

function undo(data){
  faniggle_text()

  action_history.undo(function(action){
    action.type = reverse_actions[action.type]
    dispatch_action(action)
  })
}

function redo(data){
  action_history.redo(dispatch_action)
}

// TODOOOOOOOOOOOOOOOOOOOO  NEEDS BLUR
function toggle_note_view(data){
  var item = find_item(data.item_id)    
  if ($(':focus').hasClass('note')) focus_item(item)
  else item.find('.note:first').focus()
}

function toggle_fold_item(data){
  var item = find_item(data.item_id)    
  if (item.hasClass('folded'))  unfold(data)
  else                          fold(data)
}

function focus_prev_sibling(data){
  var item = find_item(data.item_id)    
  focus_item(item.prev())
}

function focus_next_sibling(data){
  var item = find_item(data.item_id)    
  focus_item(item.next())
}

function focus_last (data){ focus_item($('.root .item:last'))  }
function focus_first(data){ focus_item($('.root .item:first')) }

// focus the item that is vertically above the current item, or the last root node
function focus_prev(data){
  var item = find_item(data.item_id)    
  var prev = item.prev('.item:first') // find prev sibling
  if (prev.length) {
    while (true){
      if (prev.hasClass('folded')) break
      var child = prev.find('.contents:first > .item:last')
      if (!child.length) break // give up
      prev = child
    }
  }
  if (!prev.length){
    prev = item.parents('.item:first') // settle for own parent
  }
  return focus_item(prev)
}

// Focus the item that is vertically below the current item, or the first root node
function focus_next(data){
  var item = find_item(data.item_id)    
  var next
  if (!item.hasClass('.folded')) next = item.find('.item:first') // prefer first child
  if (!next || !next.length) next = item.next() // settle for next sibling
  if (!next.length) { // settle for x-parent's next sibling
    next = item
    while (true){
      next = next.parents('.item:first')
      if (!next.length) break // no solution
      var neighbor = next.next()
      if (neighbor.length){
        next = neighbor // found it
        break
      }
    }
  }
  return focus_item(next)
}

///////////////////////////////// HISTORY-ONLY ACTIONS ////////////////////////////////////////

function uncreate_item(data){
  var item = find_item(data.new_item_id)
  focus_prev({item_id:data.new_item_id}) //.length || focus_item(item.next()).length
  item.remove()
}

function undelete_tree(data){
  // restore an item from purgatory to its original place
  var item = find_item(data.item_id)
  var prev = find_item(data.prev_item_id)
  var parent = find_item(data.parent_item_id)
  if      (prev  .length) prev      .after  (item)
  else if (parent.length) parent    .prepend(item)
  else                    $('.root').prepend(item)
  focus_item(item)

  // if we created a new item to replace it, get rid of that now
  if (data.new_item_id){
    var new_item = find_item(data.new_item_id)
    new_item.remove()
  }
}

function change_text(data){
  var item = find_item(data.item_id)
  var field = item.find('.'+data.field+':first')
  field.val(data.new_text)
  field.attr('data-text', data.new_text)
  grow_field(field)
  field.focus()
}

function unchange_text(data){
  var item = find_item(data.item_id)
  var field = item.find('.'+data.field+':first')
  field.val(data.old_text)
  field.attr('data-text', data.old_text)
  field.focus()
}

///////////////////////////////// ACTION UTILITIES ////////////////////////////////////////////

var auto_increment = 0
function create_an_item(insert, id){
  if (!id) {
    id = auto_increment
    auto_increment += 1
  } else if (id >= auto_increment) auto_increment = parseInt(id)+1
  
  var node = $('.item.prototype').clone().removeClass('prototype').attr('data-id',id)
  insert(node)
  $(':focus').blur()
  node.find('.note').keydown(note_keydown).blur(changed_text).keydown(change_countdown)
  node.find('.title').keydown(title_keydown).focus().blur(changed_text).keydown(change_countdown)
  return node
}

// Find an item the way it is described in text-based event history
function find_item(id){ if(id) return $('[data-id='+id+']') }

function init_empty(){
  return create_an_item(function(node){ node.appendTo('.root') })
}


// Moves a node to purgatory, but makes all of its children into children of its parent
// This one doesn't have a redo action yet because it is rather mutative.  I'd need to list the
// nodes that got reparented so that all of them could be parented back.
// function delete_reparent(item){
//   var children = item.find('.contents:first > .item')
//   var parent = item.parents('.item:first')
//   if (parent.length){
//     parent.find('.contents:first').append(children)
//     item.remove()
//     focus_item(parent)
//     events.push({type:'delete_reparent', item:item.attr('data-id')})
//   }
// }
